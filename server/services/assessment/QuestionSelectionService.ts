import { db } from '../../db';
import { 
  assessmentQuestions, 
  assessmentDomains, 
  assessmentResponses,
  questionAvailability,
  assessments,
  assessmentConfig,
  type AssessmentQuestion,
  type AssessmentDomain,
  type AssessmentConfig
} from '@shared/schema';
import { eq, and, sql, isNull, inArray } from 'drizzle-orm';
import { DomainWeightingService } from './DomainWeightingService';
import { DifficultyProgressionService } from './DifficultyProgressionService';
import { QuestionPoolService } from './QuestionPoolService';
import { AssessmentTimerService } from './AssessmentTimerService';
import { SynchronizationService } from './SynchronizationService';

export interface SelectedQuestionWithTimer {
  question: AssessmentQuestion;
  selectionReason: string;
  fallbackLevel: number; // 0 = primary, 1+ = fallback depth
  domainAllocation: {
    target: number;
    current: number;
    priority: number;
  };
  timerInfo: {
    questionStartTime: Date;
    timePerQuestion: number;
    autoProgressionScheduled: Date;
    timerId: string;
  };
}

export interface CurrentQuestionState {
  question: AssessmentQuestion;
  questionSequence: number;
  startTime: Date;
  remainingTime: number;
  timePerQuestion: number;
  domainCoverage: Map<number, number>;
  currentDifficulty: number;
  isTimedOut: boolean;
  serverTimestamp: Date;
}

export interface TimeoutHandlingResult {
  wasTimeout: boolean;
  timeoutQuestionId: string;
  nextQuestion: AssessmentQuestion | null; // null if assessment complete
  difficultyAdjustment: number;
  domainCoverageUpdate: Map<number, number>;
  assessmentComplete: boolean;
}

export interface QuestionPoolStats {
  totalQuestions: number;
  questionsByDomain: Record<number, number>;
  questionsByDifficulty: Record<number, number>;
  availableQuestions: number;
  approvedQuestions: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
}

/**
 * Main Question Selection Service
 * 
 * Orchestrates the weighted adaptive question selection algorithm with comprehensive
 * timer management, domain weighting, difficulty progression, and fallback strategies.
 */
export class QuestionSelectionService {
  private domainWeightingService: DomainWeightingService;
  private difficultyProgressionService: DifficultyProgressionService;
  private questionPoolService: QuestionPoolService;
  private timerService: AssessmentTimerService;
  private syncService: SynchronizationService;

  constructor() {
    this.domainWeightingService = new DomainWeightingService();
    this.difficultyProgressionService = new DifficultyProgressionService();
    this.questionPoolService = new QuestionPoolService();
    this.timerService = new AssessmentTimerService();
    this.syncService = new SynchronizationService();
  }

  /**
   * Select next question for assessment session with timer management
   */
  async selectNextQuestion(
    assessmentId: number,
    currentDifficulty: number,
    domainCoverage: Map<number, number>,
    isAutoProgression: boolean = false
  ): Promise<SelectedQuestionWithTimer> {
    const startTime = Date.now();
    
    try {
      // Load assessment and configuration
      const assessment = await this.loadAssessment(assessmentId);
      const config = await this.loadAssessmentConfig(assessment.userId);
      const domains = await this.loadActiveDomains();
      
      // Calculate domain priorities and target allocation
      const domainAllocation = await this.domainWeightingService.calculateDomainAllocation(
        domains,
        config.questionCount || 40,
        domainCoverage
      );

      // Get priority domains (those under target allocation)
      const priorityDomains = this.domainWeightingService.getPriorityDomains(domainAllocation);
      
      // Attempt primary question selection
      const primaryResult = await this.attemptPrimarySelection(
        priorityDomains,
        currentDifficulty,
        assessment.userId,
        assessmentId
      );

      if (primaryResult.question) {
        const timerInfo = await this.timerService.startQuestionTimer(
          assessmentId,
          config.timePerQuestion || 60
        );

        return {
          question: primaryResult.question,
          selectionReason: `Primary selection: Domain ${primaryResult.domainId} (priority: ${primaryResult.priority})`,
          fallbackLevel: 0,
          domainAllocation: primaryResult.allocation,
          timerInfo
        };
      }

      // Fallback selection with comprehensive strategy
      const fallbackResult = await this.executeFallbackStrategy(
        priorityDomains,
        currentDifficulty,
        assessment.userId,
        assessmentId,
        domainAllocation
      );

      const timerInfo = await this.timerService.startQuestionTimer(
        assessmentId,
        config.timePerQuestion || 60
      );

      // Log selection performance
      const selectionTime = Date.now() - startTime;
      console.log(`Question selection completed in ${selectionTime}ms (fallback level: ${fallbackResult.fallbackLevel})`);

      return {
        question: fallbackResult.question,
        selectionReason: fallbackResult.reason,
        fallbackLevel: fallbackResult.fallbackLevel,
        domainAllocation: fallbackResult.allocation,
        timerInfo
      };

    } catch (error) {
      console.error('Error in question selection:', error);
      throw new Error(`Question selection failed: ${error.message}`);
    }
  }

  /**
   * Get current question for synchronization recovery
   */
  async getCurrentQuestion(assessmentId: number): Promise<CurrentQuestionState> {
    return this.syncService.getCurrentAssessmentState(assessmentId);
  }

  /**
   * Handle automatic progression to next question on timeout
   */
  async handleTimeout(assessmentId: number): Promise<TimeoutHandlingResult> {
    try {
      // Cancel any pending timer for this assessment
      await this.timerService.cancelScheduledProgression(assessmentId);

      // Get current assessment state
      const assessment = await this.loadAssessment(assessmentId);
      const config = await this.loadAssessmentConfig(assessment.userId);

      // Get current question sequence
      const responses = await db.select({
        count: sql<number>`count(*)`,
        maxSequence: sql<number>`max(${assessmentResponses.questionSequence})`
      })
      .from(assessmentResponses)
      .where(eq(assessmentResponses.assessmentId, assessmentId));

      const currentSequence = Number(responses[0]?.maxSequence) || 0;
      const questionsAnswered = Number(responses[0]?.count) || 0;

      // Check if assessment is complete
      if (questionsAnswered >= (config.questionCount || 40)) {
        return {
          wasTimeout: true,
          timeoutQuestionId: '',
          nextQuestion: null,
          difficultyAdjustment: 0,
          domainCoverageUpdate: new Map(),
          assessmentComplete: true
        };
      }

      // Record timeout as incorrect answer for current question if there is one
      // This should be handled by the answer processing service
      
      // Adjust difficulty for timeout (treat as incorrect)
      const newDifficulty = this.difficultyProgressionService.adjustDifficulty(
        assessment.currentDifficulty || 3,
        false // timeout counts as incorrect
      );

      // Update domain coverage
      const domainCoverage = new Map(Object.entries(assessment.domainCoverage || {}).map(([k, v]) => [parseInt(k), v as number]));

      // Select next question
      const nextQuestionResult = await this.selectNextQuestion(
        assessmentId,
        newDifficulty,
        domainCoverage,
        true // isAutoProgression = true
      );

      return {
        wasTimeout: true,
        timeoutQuestionId: '', // Should be provided by calling context
        nextQuestion: nextQuestionResult.question,
        difficultyAdjustment: newDifficulty - (assessment.currentDifficulty || 3),
        domainCoverageUpdate: domainCoverage,
        assessmentComplete: false
      };

    } catch (error) {
      console.error('Error handling timeout:', error);
      throw new Error(`Timeout handling failed: ${error.message}`);
    }
  }

  /**
   * Get available question pool statistics
   */
  async getQuestionPoolStats(schoolId?: number): Promise<QuestionPoolStats> {
    return this.questionPoolService.getPoolStatistics(schoolId);
  }

  /**
   * Validate algorithm configuration
   */
  async validateConfiguration(config: AssessmentConfig): Promise<ValidationResult> {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate question count
    if ((config.questionCount || 0) < 20) {
      warnings.push('Question count below recommended minimum of 20');
    }
    if ((config.questionCount || 0) > 60) {
      warnings.push('Question count above recommended maximum of 60');
    }

    // Validate time per question
    if ((config.timePerQuestion || 0) < 30) {
      warnings.push('Time per question below recommended minimum of 30 seconds');
    }
    if ((config.timePerQuestion || 0) > 120) {
      warnings.push('Time per question above recommended maximum of 120 seconds');
    }

    // Validate starting difficulty
    if ((config.startingDifficulty || 0) < 1 || (config.startingDifficulty || 0) > 6) {
      warnings.push('Starting difficulty must be between 1 and 6');
    }

    // Check question pool adequacy
    const poolStats = await this.getQuestionPoolStats();
    const totalNeeded = config.questionCount || 40;
    
    if (poolStats.availableQuestions < totalNeeded * 2) {
      warnings.push('Question pool may be insufficient for reliable question selection');
      recommendations.push('Consider adding more questions to the pool');
    }

    // Check domain balance
    const domains = await this.loadActiveDomains();
    const totalWeight = domains.reduce((sum, domain) => sum + domain.questionWeight, 0);
    
    for (const domain of domains) {
      const expectedQuestions = Math.ceil((domain.questionWeight / totalWeight) * totalNeeded);
      const availableForDomain = poolStats.questionsByDomain[domain.id] || 0;
      
      if (availableForDomain < expectedQuestions * 1.5) {
        warnings.push(`Domain "${domain.name}" may have insufficient questions`);
        recommendations.push(`Add more questions for domain: ${domain.name}`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  // Private helper methods

  private async loadAssessment(assessmentId: number) {
    const result = await db.select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!result || result.length === 0) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    return result[0];
  }

  private async loadAssessmentConfig(userId: number): Promise<AssessmentConfig> {
    // Get user's school for configuration lookup
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { schoolId: true }
    });

    const schoolId = userResult?.schoolId;

    // Try school-specific config first
    if (schoolId) {
      const schoolConfig = await db.select()
        .from(assessmentConfig)
        .where(eq(assessmentConfig.schoolId, schoolId))
        .limit(1);

      if (schoolConfig && schoolConfig.length > 0) {
        return schoolConfig[0];
      }
    }

    // Fall back to platform-wide config
    const platformConfig = await db.select()
      .from(assessmentConfig)
      .where(isNull(assessmentConfig.schoolId))
      .limit(1);

    if (platformConfig && platformConfig.length > 0) {
      return platformConfig[0];
    }

    // Default configuration
    return {
      id: 0,
      schoolId: null,
      questionCount: 40,
      timePerQuestion: 60,
      startingDifficulty: 3,
      minDomainCoverage: 1,
      updatedBy: null,
      updatedAt: new Date()
    };
  }

  private async loadActiveDomains(): Promise<AssessmentDomain[]> {
    return db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true))
      .orderBy(assessmentDomains.displayOrder);
  }

  private async attemptPrimarySelection(
    priorityDomains: Array<{domainId: number; priority: number; allocation: any}>,
    difficulty: number,
    userId: number,
    assessmentId: number
  ) {
    if (priorityDomains.length === 0) {
      return { question: null, domainId: null, priority: 0, allocation: null };
    }

    // Try highest priority domain first
    const targetDomain = priorityDomains[0];
    
    const questions = await this.questionPoolService.getAvailableQuestions(
      targetDomain.domainId,
      difficulty,
      userId,
      assessmentId
    );

    if (questions.length > 0) {
      // Random selection from available pool
      const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
      return {
        question: selectedQuestion,
        domainId: targetDomain.domainId,
        priority: targetDomain.priority,
        allocation: targetDomain.allocation
      };
    }

    return { question: null, domainId: targetDomain.domainId, priority: targetDomain.priority, allocation: targetDomain.allocation };
  }

  private async executeFallbackStrategy(
    priorityDomains: Array<{domainId: number; priority: number; allocation: any}>,
    difficulty: number,
    userId: number,
    assessmentId: number,
    domainAllocation: any
  ) {
    // Fallback Level 1: Try adjacent difficulties within priority domains
    for (const domain of priorityDomains) {
      const adjacentDifficulties = [difficulty - 1, difficulty + 1].filter(d => d >= 1 && d <= 6);
      
      for (const adjDifficulty of adjacentDifficulties) {
        const questions = await this.questionPoolService.getAvailableQuestions(
          domain.domainId,
          adjDifficulty,
          userId,
          assessmentId
        );

        if (questions.length > 0) {
          const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
          return {
            question: selectedQuestion,
            reason: `Fallback L1: Adjacent difficulty ${adjDifficulty} for domain ${domain.domainId}`,
            fallbackLevel: 1,
            allocation: domain.allocation
          };
        }
      }
    }

    // Fallback Level 2: Try any domain at current difficulty
    const allDomains = await this.loadActiveDomains();
    for (const domain of allDomains) {
      const questions = await this.questionPoolService.getAvailableQuestions(
        domain.id,
        difficulty,
        userId,
        assessmentId
      );

      if (questions.length > 0) {
        const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
        return {
          question: selectedQuestion,
          reason: `Fallback L2: Any domain ${domain.id} at difficulty ${difficulty}`,
          fallbackLevel: 2,
          allocation: { target: 0, current: 0, priority: 0 }
        };
      }
    }

    // Fallback Level 3: Any question from any domain/difficulty
    const anyQuestions = await this.questionPoolService.getAnyAvailableQuestions(userId, assessmentId);
    
    if (anyQuestions.length > 0) {
      const selectedQuestion = anyQuestions[Math.floor(Math.random() * anyQuestions.length)];
      return {
        question: selectedQuestion,
        reason: `Fallback L3: Any available question`,
        fallbackLevel: 3,
        allocation: { target: 0, current: 0, priority: 0 }
      };
    }

    throw new Error('No questions available - question pool exhausted');
  }
} 