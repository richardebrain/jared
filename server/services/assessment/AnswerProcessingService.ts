import { db } from '../../db';
import { 
  assessmentResponses, 
  assessments,
  assessmentQuestions,
  assessmentConfig,
  users,
  type AssessmentResponse,
  type InsertAssessmentResponse,
  type Assessment,
  type AssessmentQuestion,
  type User
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AssessmentTimerService } from './AssessmentTimerService';
import { ScoringEngine } from '../../algorithms/assessment/ScoringEngine';
import { AnswerTimingValidator, type TimingValidationResult, type AnswerFormatValidationResult } from '../../algorithms/assessment/AnswerTimingValidator';
import { DomainAnalysisService } from './DomainAnalysisService';
import { ResultsCompilationService } from './ResultsCompilationService';

/**
 * Interface for answer submission with timing validation
 */
export interface AnswerSubmissionWithTiming {
  assessmentId: number;
  questionId: string;
  questionSequence: number;
  selectedAnswer?: number; // Index of selected option, undefined if timed out
  submissionTime: Date;
  responseTimeMs: number;
  frontendTimestamp: Date; // For validation against server time
  timedOut?: boolean; // Indicates automatic timeout from EP-001-08
}

/**
 * Result of processing an answer submission
 */
export interface ProcessedAnswerResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  difficulty: number;
  domainId: string;
  wasValidTiming: boolean;
  wasLateSubmission: boolean;
  timingDetails: {
    responseTimeMs: number;
    remainingTimeAtSubmission: number;
    submissionValid: boolean;
  };
  
  // Direct mini-lesson mapping for failed questions
  miniLessonRecommendations: DirectMiniLessonRecommendation[];
  
  assessmentProgress: {
    questionsCompleted: number;
    currentScore: number;
    isComplete: boolean;
  };
}

/**
 * Direct mini-lesson recommendation structure
 */
export interface DirectMiniLessonRecommendation {
  miniLessonId: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: number;
  domainId: number;
  domainName: string;
  priority: number;
  learningObjectives: string[];
  relatedQuestions: string[];
  directConnection: string;
}

/**
 * Result of processing automatic timeout from EP-001-08
 */
export interface TimeoutProcessingResult {
  questionId: string;
  wasTimeout: true;
  pointsEarned: 0;
  difficulty: number;
  domainId: string;
  
  // Mini-lessons for timed-out question (same as incorrect)
  miniLessonRecommendations: DirectMiniLessonRecommendation[];
  
  difficultyAdjustmentData: {
    currentDifficulty: number;
    suggestedNextDifficulty: number; // difficulty - 1 for timeout
  };
  success: boolean;
  processingTimestamp: Date;
}

/**
 * Main Answer Processing Service
 * 
 * Handles real-time answer validation with strict timeout enforcement,
 * 6-level scoring calculations, and direct mini-lesson mapping for personalized
 * training recommendations.
 */
export class AnswerProcessingService {
  private timerService: AssessmentTimerService;
  private scoringEngine: ScoringEngine;
  private timingValidator: AnswerTimingValidator;
  private domainAnalysisService: DomainAnalysisService;
  private resultsCompilationService: ResultsCompilationService;

  constructor() {
    this.timerService = new AssessmentTimerService();
    this.scoringEngine = new ScoringEngine();
    this.timingValidator = new AnswerTimingValidator();
    this.domainAnalysisService = new DomainAnalysisService();
    this.resultsCompilationService = new ResultsCompilationService();
  }

  /**
   * Process submitted answer with strict timing validation
   */
  async processAnswer(answerSubmission: AnswerSubmissionWithTiming): Promise<ProcessedAnswerResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Processing answer for assessment ${answerSubmission.assessmentId}, question ${answerSubmission.questionId}`);

      // Step 1: Validate timing against server-authoritative timer
      const timingValidation = await this.timingValidator.validateSubmissionTiming(
        answerSubmission.assessmentId,
        answerSubmission.questionId,
        answerSubmission.submissionTime
      );

      // Step 2: Reject late submissions with clear error
      if (timingValidation.isLateSubmission) {
        console.log(`Late submission rejected for question ${answerSubmission.questionId}`);
        throw new Error(`Answer submission rejected: Question timer has expired. Remaining time: ${timingValidation.remainingTime}ms`);
      }

      // Step 3: Load question data for validation and scoring
      const question = await this.loadQuestionData(answerSubmission.questionId);
      const assessment = await this.loadAssessmentData(answerSubmission.assessmentId);
      
      // Step 4: Calculate scoring based on 6-level difficulty system
      const isCorrect = this.scoringEngine.validateAnswer(question, answerSubmission.selectedAnswer);
      const pointsEarned = this.scoringEngine.calculatePoints(question.difficulty, isCorrect);

      // Step 5: Get mini-lesson recommendations for failed questions
      const miniLessonRecommendations = !isCorrect ? 
        await this.getDirectMiniLessonRecommendations(question) : [];

      // Step 6: Record response with enhanced timing metadata
      const responseData = await this.recordAnswerResponse({
        assessmentId: answerSubmission.assessmentId,
        questionId: answerSubmission.questionId,
        userId: assessment.userId,
        questionSequence: answerSubmission.questionSequence,
        selectedAnswer: answerSubmission.selectedAnswer,
        isCorrect,
        pointsEarned,
        timeSpent: Math.floor(answerSubmission.responseTimeMs / 1000),
        timedOut: false,
        difficulty: question.difficulty,
        domainId: question.domainId,
        wasLateSubmission: false,
        processingTimestamp: new Date()
      });

      // Step 7: Calculate assessment progress
      const assessmentProgress = await this.calculateAssessmentProgress(answerSubmission.assessmentId);

      const processingTime = Date.now() - startTime;
      console.log(`Answer processing completed in ${processingTime}ms`);

      return {
        questionId: answerSubmission.questionId,
        isCorrect,
        pointsEarned,
        difficulty: this.parseDifficulty(question.difficulty),
        domainId: question.domainId,
        wasValidTiming: true,
        wasLateSubmission: false,
        timingDetails: {
          responseTimeMs: answerSubmission.responseTimeMs,
          remainingTimeAtSubmission: timingValidation.remainingTime,
          submissionValid: true
        },
        miniLessonRecommendations,
        assessmentProgress
      };

    } catch (error) {
      console.error('Error processing answer:', error);
      
      // If this is a timing validation error, we still need to record it
      if (error.message.includes('timer has expired')) {
        await this.recordLateSubmissionAttempt(answerSubmission);
      }
      
      throw error;
    }
  }

  /**
   * Process automatic timeout from EP-001-08
   */
  async processAutomaticTimeout(
    assessmentId: number,
    questionId: string,
    questionSequence: number
  ): Promise<TimeoutProcessingResult> {
    try {
      console.log(`Processing automatic timeout for assessment ${assessmentId}, question ${questionId}`);

      // Load necessary data
      const question = await this.loadQuestionData(questionId);
      const assessment = await this.loadAssessmentData(assessmentId);

      // Get mini-lesson recommendations for timed-out question (same as incorrect)
      const miniLessonRecommendations = await this.getDirectMiniLessonRecommendations(question);

      // Record timeout response
      await this.recordAnswerResponse({
        assessmentId,
        questionId,
        userId: assessment.userId,
        questionSequence,
        selectedAnswer: null,
        isCorrect: false,
        pointsEarned: 0,
        timeSpent: await this.getTimePerQuestion(assessmentId), // Full time elapsed
        timedOut: true,
        difficulty: question.difficulty,
        domainId: question.domainId,
        wasLateSubmission: false,
        processingTimestamp: new Date()
      });

      // Calculate difficulty adjustment (timeout = incorrect)
      const currentDifficulty = this.parseDifficulty(question.difficulty);
      const suggestedNextDifficulty = Math.max(currentDifficulty - 1, 1);

      return {
        questionId,
        wasTimeout: true,
        pointsEarned: 0,
        difficulty: currentDifficulty,
        domainId: question.domainId,
        miniLessonRecommendations,
        difficultyAdjustmentData: {
          currentDifficulty,
          suggestedNextDifficulty
        },
        success: true,
        processingTimestamp: new Date()
      };

    } catch (error) {
      console.error('Error processing automatic timeout:', error);
      throw new Error(`Automatic timeout processing failed: ${error.message}`);
    }
  }

  /**
   * Load question data with validation
   */
  private async loadQuestionData(questionId: string): Promise<AssessmentQuestion> {
    const question = await db.select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.id, questionId))
      .limit(1);

    if (!question || question.length === 0) {
      throw new Error(`Question not found: ${questionId}`);
    }

    return question[0];
  }

  /**
   * Load assessment data with validation
   */
  private async loadAssessmentData(assessmentId: number): Promise<Assessment> {
    const assessment = await db.select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!assessment || assessment.length === 0) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }

    return assessment[0];
  }

  /**
   * Record answer response with enhanced metadata
   */
  private async recordAnswerResponse(responseData: any): Promise<AssessmentResponse> {
    const insertData: InsertAssessmentResponse = {
      assessmentId: responseData.assessmentId,
      questionId: responseData.questionId,
      userId: responseData.userId,
      questionSequence: responseData.questionSequence,
      selectedAnswer: responseData.selectedAnswer,
      isCorrect: responseData.isCorrect,
      pointsEarned: responseData.pointsEarned,
      timeSpent: responseData.timeSpent,
      timedOut: responseData.timedOut,
      difficulty: responseData.difficulty,
      domainId: responseData.domainId,
      wasLateSubmission: responseData.wasLateSubmission,
      processingTimestamp: responseData.processingTimestamp
    };

    const result = await db.insert(assessmentResponses)
      .values(insertData)
      .returning();

    if (!result || result.length === 0) {
      throw new Error('Failed to record assessment response');
    }

    return result[0];
  }

  /**
   * Record late submission attempt for analytics
   */
  private async recordLateSubmissionAttempt(answerSubmission: AnswerSubmissionWithTiming): Promise<void> {
    try {
      const question = await this.loadQuestionData(answerSubmission.questionId);
      const assessment = await this.loadAssessmentData(answerSubmission.assessmentId);

      await this.recordAnswerResponse({
        assessmentId: answerSubmission.assessmentId,
        questionId: answerSubmission.questionId,
        userId: assessment.userId,
        questionSequence: answerSubmission.questionSequence,
        selectedAnswer: answerSubmission.selectedAnswer,
        isCorrect: false, // Late submissions are always incorrect
        pointsEarned: 0,
        timeSpent: Math.floor(answerSubmission.responseTimeMs / 1000),
        timedOut: false,
        difficulty: question.difficulty,
        domainId: question.domainId,
        wasLateSubmission: true,
        processingTimestamp: new Date()
      });

      console.log(`Recorded late submission attempt for question ${answerSubmission.questionId}`);
    } catch (error) {
      console.error('Error recording late submission attempt:', error);
      // Don't throw - this is for analytics only
    }
  }

  /**
   * Calculate current assessment progress
   */
  private async calculateAssessmentProgress(assessmentId: number): Promise<{
    questionsCompleted: number;
    currentScore: number;
    isComplete: boolean;
  }> {
    // Get total responses and score
    const progressResult = await db.select({
      questionsCompleted: sql<number>`count(*)`,
      currentScore: sql<number>`coalesce(sum(${assessmentResponses.pointsEarned}), 0)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

    const questionsCompleted = Number(progressResult[0]?.questionsCompleted) || 0;
    const currentScore = Number(progressResult[0]?.currentScore) || 0;

    // Check if assessment is complete (assuming 40 questions by default)
    const config = await this.getAssessmentConfig(assessmentId);
    const isComplete = questionsCompleted >= (config.questionCount || 40);

    return {
      questionsCompleted,
      currentScore,
      isComplete
    };
  }

  /**
   * Get assessment configuration
   */
  private async getAssessmentConfig(assessmentId: number): Promise<{ questionCount: number; timePerQuestion: number }> {
    // This would load from the assessment config - simplified for now
    return {
      questionCount: 40,
      timePerQuestion: 60
    };
  }

  /**
   * Get time per question for assessment
   */
  private async getTimePerQuestion(assessmentId: number): Promise<number> {
    const config = await this.getAssessmentConfig(assessmentId);
    return config.timePerQuestion;
  }

  /**
   * Parse difficulty from text to number (temporary until schema conversion)
   */
  private parseDifficulty(difficulty: string): number {
    const difficultyMap: Record<string, number> = {
      '1': 1, 'easy': 1,
      '2': 2, 'easy/medium': 2,
      '3': 3, 'medium': 3,
      '4': 4, 'medium/hard': 4,
      '5': 5, 'hard': 5,
      '6': 6, 'master': 6
    };

    return difficultyMap[difficulty.toLowerCase()] || 3;
  }

  /**
   * Get direct mini-lesson recommendations for a question
   */
  private async getDirectMiniLessonRecommendations(question: AssessmentQuestion): Promise<DirectMiniLessonRecommendation[]> {
    const recommendations: DirectMiniLessonRecommendation[] = [];

    // If question has mini-lesson content, create a recommendation based on it
    if (question.miniLesson && question.miniLesson.trim()) {
      recommendations.push({
        miniLessonId: `question-${question.id}-lesson`,
        title: `Mini-Lesson for: ${question.text}`,
        description: question.miniLesson,
        estimatedDuration: 5, // Default 5 minutes for reading
        difficulty: this.parseDifficulty(question.difficulty),
        domainId: this.parseDomainId(question.domainId),
        domainName: question.domainId, // Will be domain name once converted
        priority: 1, // High priority for direct question lesson
        learningObjectives: [`Understanding: ${question.text.substring(0, 100)}...`],
        relatedQuestions: [question.id],
        directConnection: `This mini-lesson directly addresses the concepts tested in this question.`
      });
    }

    return recommendations;
  }

  /**
   * Parse domain ID from text to number (temporary during migration)
   */
  private parseDomainId(domainId: string): number {
    // This is a temporary function during the migration period
    // TODO: Remove once domainId is properly converted to foreign key
    const domainMap: Record<string, number> = {
      'child-safety': 1,
      'health-development': 2,
      'trauma-informed': 3,
      'positive-guidance': 4,
      'curriculum-play': 5,
      'family-engagement': 6,
      'assessment-observation': 7,
      'professionalism': 8,
      'cultural-inclusion': 9,
      'classroom-scenarios': 10
    };
    
    return domainMap[domainId.toLowerCase()] || 1;
  }

  /**
   * Complete assessment and compile final results
   */
  async completeAssessment(assessmentId: number): Promise<AssessmentCompletionResult> {
    try {
      // Get all failed questions for mini-lesson recommendations
      const failedQuestions = await this.getFailedQuestions(assessmentId);
      
      // Generate mini-lesson recommendations for failed questions
      const miniLessonRecommendations: DirectMiniLessonRecommendation[] = [];
      
      for (const question of failedQuestions) {
        const recommendations = await this.getDirectMiniLessonRecommendations(question);
        miniLessonRecommendations.push(...recommendations);
      }
      
      // Compile comprehensive results
      const compiledResults = await this.resultsCompilationService.compileAssessmentResults(
        assessmentId, 
        miniLessonRecommendations
      );
      
      // Save results to database
      await this.resultsCompilationService.saveResultsToDatabase(compiledResults);
      
      // Mark assessment as completed
      await this.markAssessmentCompleted(assessmentId);
      
      return {
        success: true,
        assessmentId,
        results: compiledResults,
        message: 'Assessment completed successfully with comprehensive analysis'
      };
      
    } catch (error) {
      return {
        success: false,
        assessmentId,
        results: null,
        message: `Assessment completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get questions that were answered incorrectly or timed out
   */
  private async getFailedQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    const failedResponseIds = await db.select({
      questionId: assessmentResponses.questionId
    })
    .from(assessmentResponses)
    .where(
      and(
        eq(assessmentResponses.assessmentId, assessmentId),
        sql`(${assessmentResponses.isCorrect} = false OR ${assessmentResponses.timedOut} = true)`
      )
    );
    
    if (failedResponseIds.length === 0) {
      return []; // Perfect score - no failed questions
    }
    
    const questionIds = failedResponseIds.map(r => r.questionId);
    
    const questions = await db.select()
      .from(assessmentQuestions)
      .where(sql`${assessmentQuestions.id} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`);
    
    return questions;
  }

  /**
   * Mark assessment as completed in database
   */
  private async markAssessmentCompleted(assessmentId: number): Promise<void> {
    await db.update(assessments)
      .set({ 
        completed: true,
        completedAt: new Date()
      })
      .where(eq(assessments.id, assessmentId));
  }
}

// Types for answer processing
export interface AnswerSubmission {
  questionId: string;
  selectedAnswer?: number;
  submissionTime: Date;
  timeSpent: number;
}

export interface AnswerProcessingResult {
  success: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  wasTimeout: boolean;
  wasLateSubmission: boolean;
  processingTimestamp: Date;
  miniLessonRecommendations: DirectMiniLessonRecommendation[];
  errorMessage?: string;
}

export interface TimeoutProcessingResult {
  success: boolean;
  wasTimeout: true;
  pointsEarned: 0;
  miniLessonRecommendations: DirectMiniLessonRecommendation[];
  processingTimestamp: Date;
  errorMessage?: string;
}

export interface DirectMiniLessonRecommendation {
  miniLessonId: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: number;
  domainId: number;
  domainName: string;
  priority: number;
  learningObjectives: string[];
  relatedQuestions: string[];
  directConnection: string;
}

export interface AssessmentCompletionResult {
  success: boolean;
  assessmentId: number;
  results: any | null;
  message: string;
} 