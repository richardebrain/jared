import { db } from '../db';
import { 
  assessments, 
  assessmentResponses,
  assessmentQuestions,
  type AssessmentQuestion,
  type Assessment
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export interface AssessmentSyncState {
  assessmentId: number;
  currentQuestion: AssessmentQuestion;
  questionSequence: number;
  remainingTime: number;
  domainCoverage: Map<number, number>;
  currentDifficulty: number;
  questionsCompleted: number;
  totalQuestions: number;
  isComplete: boolean;
  serverTimestamp: Date;
}

export interface SyncValidationResult {
  isInSync: boolean;
  expectedQuestionId: string;
  frontendQuestionId: string;
  correctionNeeded: boolean;
  syncState: AssessmentSyncState;
}

export interface ReconnectionRecovery {
  assessmentId: number;
  lastKnownState: AssessmentSyncState;
  missedQuestions: string[];
  recoveryAction: 'continue' | 'restart_question' | 'assessment_complete';
  recoveryMessage: string;
}

/**
 * Synchronization Service
 * 
 * Handles frontend synchronization recovery and state management for assessment
 * sessions. Provides mechanisms for frontend to recover current assessment state
 * when out of sync with backend.
 */
export class SynchronizationService {

  /**
   * Get current assessment state for frontend sync recovery
   */
  async getCurrentAssessmentState(assessmentId: number): Promise<AssessmentSyncState> {
    // Load assessment
    const assessment = await this.loadAssessment(assessmentId);
    
    // Get current question sequence and responses count
    const responses = await db.select({
      count: sql<number>`count(*)`,
      maxSequence: sql<number>`max(${assessmentResponses.questionSequence})`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

    const responsesData = responses[0];
    const questionsCompleted = Number(responsesData.count) || 0;
    const lastSequence = Number(responsesData.maxSequence) || 0;
    const currentSequence = lastSequence + 1;

    // Check if assessment is complete
    const totalQuestions = 40; // Default, would be loaded from config
    const isComplete = questionsCompleted >= totalQuestions;

    // Get domain coverage
    const domainCoverage = await this.calculateDomainCoverage(assessmentId);

    // Get current question (if assessment not complete)
    let currentQuestion: AssessmentQuestion;
    
    if (!isComplete) {
      // For sync recovery, we need to determine what the current question should be
      // This is a simplified version - in practice, would use the question selection algorithm
      currentQuestion = await this.getCurrentExpectedQuestion(assessment, currentSequence, domainCoverage);
    } else {
      // Create a placeholder for completed assessments
      currentQuestion = {
        id: 'assessment_complete',
        domainId: '0',
        text: 'Assessment Complete',
        options: '[]',
        correctAnswer: 0,
        difficulty: '3',
        explanation: null,
        miniLesson: null,
        tags: null,
        createdBy: null,
        approvedBy: null,
        isApproved: true,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return {
      assessmentId,
      currentQuestion,
      questionSequence: currentSequence,
      remainingTime: 0, // Would be calculated from timer service
      domainCoverage,
      currentDifficulty: assessment.currentDifficulty || 3,
      questionsCompleted,
      totalQuestions,
      isComplete,
      serverTimestamp: new Date()
    };
  }

  /**
   * Validate frontend is synchronized with backend state
   */
  async validateFrontendSync(
    assessmentId: number, 
    frontendQuestionId: string
  ): Promise<SyncValidationResult> {
    const currentState = await this.getCurrentAssessmentState(assessmentId);
    const expectedQuestionId = currentState.currentQuestion.id;
    const isInSync = frontendQuestionId === expectedQuestionId;

    return {
      isInSync,
      expectedQuestionId,
      frontendQuestionId,
      correctionNeeded: !isInSync,
      syncState: currentState
    };
  }

  /**
   * Handle frontend reconnection and state recovery
   */
  async handleFrontendReconnection(assessmentId: number): Promise<ReconnectionRecovery> {
    try {
      const currentState = await this.getCurrentAssessmentState(assessmentId);
      
      // Determine recovery action
      let recoveryAction: 'continue' | 'restart_question' | 'assessment_complete';
      let recoveryMessage: string;
      const missedQuestions: string[] = []; // Would be calculated based on expected vs actual progress

      if (currentState.isComplete) {
        recoveryAction = 'assessment_complete';
        recoveryMessage = 'Assessment has been completed. You can view your results.';
      } else if (currentState.questionsCompleted === 0) {
        recoveryAction = 'continue';
        recoveryMessage = 'Assessment is ready to begin. Starting with your first question.';
      } else {
        recoveryAction = 'continue';
        recoveryMessage = `Resuming assessment at question ${currentState.questionSequence} of ${currentState.totalQuestions}.`;
      }

      return {
        assessmentId,
        lastKnownState: currentState,
        missedQuestions,
        recoveryAction,
        recoveryMessage
      };

    } catch (error) {
      console.error(`Error handling reconnection for assessment ${assessmentId}:`, error);
      
      // Default recovery response
      return {
        assessmentId,
        lastKnownState: {
          assessmentId,
          currentQuestion: {
            id: 'error',
            domainId: '0',
            text: 'Error loading question',
            options: '[]',
            correctAnswer: 0,
            difficulty: '3',
            explanation: null,
            miniLesson: null,
            tags: null,
            createdBy: null,
            approvedBy: null,
            isApproved: true,
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          questionSequence: 1,
          remainingTime: 0,
          domainCoverage: new Map(),
          currentDifficulty: 3,
          questionsCompleted: 0,
          totalQuestions: 40,
          isComplete: false,
          serverTimestamp: new Date()
        },
        missedQuestions: [],
        recoveryAction: 'restart_question',
        recoveryMessage: 'There was an error recovering your assessment state. Please contact support if this continues.'
      };
    }
  }

  /**
   * Sync assessment progress with timer state
   */
  async syncProgressWithTimer(
    assessmentId: number,
    timerRemainingMs: number
  ): Promise<{
    syncedState: AssessmentSyncState;
    timerDiscrepancy: boolean;
    correctionApplied: boolean;
  }> {
    const currentState = await this.getCurrentAssessmentState(assessmentId);
    
    // Check for timer discrepancies
    const expectedRemainingTime = 60 * 1000; // Default 60 seconds per question
    const timerDiscrepancy = Math.abs(timerRemainingMs - expectedRemainingTime) > 5000; // 5 second tolerance

    let correctionApplied = false;
    if (timerDiscrepancy) {
      // Apply correction - in practice, would coordinate with timer service
      currentState.remainingTime = timerRemainingMs;
      correctionApplied = true;
      console.log(`Timer discrepancy detected for assessment ${assessmentId}: expected ~${expectedRemainingTime}ms, actual ${timerRemainingMs}ms`);
    } else {
      currentState.remainingTime = timerRemainingMs;
    }

    return {
      syncedState: currentState,
      timerDiscrepancy,
      correctionApplied
    };
  }

  /**
   * Validate assessment state consistency
   */
  async validateAssessmentStateConsistency(assessmentId: number): Promise<{
    isConsistent: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const assessment = await this.loadAssessment(assessmentId);
      const currentState = await this.getCurrentAssessmentState(assessmentId);

      // Check question sequence consistency
      if (currentState.questionSequence <= currentState.questionsCompleted) {
        issues.push('Question sequence is not advancing properly');
        recommendations.push('Verify question selection algorithm is working correctly');
      }

      // Check difficulty progression consistency
      if (assessment.currentDifficulty && (assessment.currentDifficulty < 1 || assessment.currentDifficulty > 6)) {
        issues.push('Difficulty level is outside valid range (1-6)');
        recommendations.push('Reset difficulty to valid range');
      }

      // Check domain coverage consistency
      const domainCoverageTotal = Array.from(currentState.domainCoverage.values()).reduce((sum, count) => sum + count, 0);
      if (domainCoverageTotal !== currentState.questionsCompleted) {
        issues.push('Domain coverage count does not match questions completed');
        recommendations.push('Recalculate domain coverage from assessment responses');
      }

      // Check assessment completion state
      if (currentState.questionsCompleted >= currentState.totalQuestions && !assessment.completed) {
        issues.push('Assessment should be marked complete but is not');
        recommendations.push('Update assessment completion status');
      }

      return {
        isConsistent: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      console.error(`Error validating assessment state consistency for ${assessmentId}:`, error);
      return {
        isConsistent: false,
        issues: ['Error validating assessment state'],
        recommendations: ['Check assessment data integrity']
      };
    }
  }

  // Private helper methods

  private async loadAssessment(assessmentId: number): Promise<Assessment> {
    const result = await db.select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!result || result.length === 0) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    return result[0];
  }

  private async calculateDomainCoverage(assessmentId: number): Promise<Map<number, number>> {
    const responses = await db.select({
      domainId: assessmentResponses.domainId,
      count: sql<number>`count(*)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId))
    .groupBy(assessmentResponses.domainId);

    const domainCoverage = new Map<number, number>();
    
    for (const response of responses) {
      const domainId = parseInt(response.domainId as string, 10);
      if (!isNaN(domainId)) {
        domainCoverage.set(domainId, Number(response.count));
      }
    }

    return domainCoverage;
  }

  private async getCurrentExpectedQuestion(
    assessment: Assessment,
    questionSequence: number,
    domainCoverage: Map<number, number>
  ): Promise<AssessmentQuestion> {
    // This is a simplified version for sync recovery
    // In practice, would use the full question selection algorithm
    
    // Get a sample question (this would be replaced with actual selection logic)
    const sampleQuestion = await db.select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.isEnabled, true))
      .limit(1);

    if (sampleQuestion.length === 0) {
      throw new Error('No questions available for assessment');
    }

    return sampleQuestion[0];
  }

  /**
   * Create assessment state snapshot for debugging
   */
  async createStateSnapshot(assessmentId: number): Promise<{
    timestamp: Date;
    assessmentId: number;
    assessmentData: Assessment;
    responses: Array<{
      questionId: string;
      sequence: number;
      isCorrect: boolean;
      difficulty: string;
      domainId: string;
      answeredAt: Date;
    }>;
    domainCoverage: Record<number, number>;
    syncState: AssessmentSyncState;
  }> {
    const assessment = await this.loadAssessment(assessmentId);
    const syncState = await this.getCurrentAssessmentState(assessmentId);
    
    const responses = await db.select({
      questionId: assessmentResponses.questionId,
      sequence: assessmentResponses.questionSequence,
      isCorrect: assessmentResponses.isCorrect,
      difficulty: assessmentResponses.difficulty,
      domainId: assessmentResponses.domainId,
      answeredAt: assessmentResponses.answeredAt
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId))
    .orderBy(assessmentResponses.questionSequence);

    const domainCoverageRecord: Record<number, number> = {};
    for (const [domainId, count] of syncState.domainCoverage.entries()) {
      domainCoverageRecord[domainId] = count;
    }

    return {
      timestamp: new Date(),
      assessmentId,
      assessmentData: assessment,
      responses: responses.map(r => ({
        questionId: r.questionId,
        sequence: r.sequence || 0,
        isCorrect: r.isCorrect,
        difficulty: r.difficulty,
        domainId: r.domainId,
        answeredAt: r.answeredAt || new Date()
      })),
      domainCoverage: domainCoverageRecord,
      syncState
    };
  }
} 