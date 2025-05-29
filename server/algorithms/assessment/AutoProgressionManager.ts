import { db } from '../../db';
import { 
  assessments, 
  assessmentResponses, 
  assessmentQuestions,
  assessmentConfig,
  type Assessment,
  type AssessmentQuestion 
} from '@shared/schema';
import { eq, desc, sql, isNull } from 'drizzle-orm';

export interface ProgressionResult {
  wasTimeout: boolean;
  timeoutQuestionId: string;
  nextQuestion: AssessmentQuestion | null; // null if assessment complete
  difficultyAdjustment: number;
  domainCoverageUpdate: Map<string, number>; // Use string for domainId to match schema
  assessmentComplete: boolean;
}

export interface ScheduledProgression {
  assessmentId: number;
  timerId: string;
  scheduledTime: Date;
  timeoutHandler: NodeJS.Timeout;
}

export interface AutoProgressionContext {
  assessmentId: number;
  currentSequence: number;
  currentDifficulty: number;
  totalQuestions: number;
  timePerQuestion: number;
  domainCoverage: Map<string, number>; // Use string for domainId to match schema
  userId: number;
}

/**
 * Auto Progression Manager Algorithm
 * 
 * Manages automatic progression logic when assessment questions timeout.
 * Handles recording timeout responses, difficulty adjustment, and next question selection.
 */
export class AutoProgressionManager {
  private scheduledProgressions = new Map<number, ScheduledProgression>();

  /**
   * Execute automatic progression when question times out
   */
  async executeAutoProgression(assessmentId: number): Promise<ProgressionResult> {
    console.log(`Executing auto progression for assessment ${assessmentId}`);
    
    try {
      // Get current assessment state
      const context = await this.buildProgressionContext(assessmentId);
      
      // Get the current/timeout question
      const timeoutQuestion = await this.getCurrentQuestion(assessmentId, context.currentSequence);
      
      if (!timeoutQuestion) {
        throw new Error(`No current question found for assessment ${assessmentId} at sequence ${context.currentSequence}`);
      }

      // Record the timeout as an incorrect response
      await this.recordTimeoutResponse(assessmentId, timeoutQuestion, context);

      // Adjust difficulty level (decrease for timeout)
      const newDifficulty = this.calculateDifficultyAdjustment(context.currentDifficulty, false);
      
      // Update domain coverage
      const updatedDomainCoverage = this.updateDomainCoverage(
        context.domainCoverage, 
        timeoutQuestion.domainId // This is already a string in the schema
      );

      // Check if assessment is complete
      const isComplete = context.currentSequence >= context.totalQuestions;

      let nextQuestion: AssessmentQuestion | null = null;
      
      if (!isComplete) {
        // Assessment continues - we'll need the question selection service to get next question
        // For now, we'll return null and let the calling service handle next question selection
        nextQuestion = null;
      }

      // Update assessment with new difficulty
      await this.updateAssessmentProgression(assessmentId, newDifficulty, isComplete);

      return {
        wasTimeout: true,
        timeoutQuestionId: timeoutQuestion.id,
        nextQuestion,
        difficultyAdjustment: newDifficulty - context.currentDifficulty,
        domainCoverageUpdate: updatedDomainCoverage,
        assessmentComplete: isComplete
      };

    } catch (error) {
      console.error(`Error in auto progression for assessment ${assessmentId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule automatic progression for an assessment
   */
  async scheduleNextProgression(
    assessmentId: number,
    nextQuestionId: string,
    timePerQuestion: number
  ): Promise<ScheduledProgression> {
    // Cancel any existing progression
    await this.cancelScheduledProgression(assessmentId);

    const scheduledTime = new Date(Date.now() + (timePerQuestion * 1000));
    const timerId = `progression_${assessmentId}_${nextQuestionId}_${Date.now()}`;

    // Schedule the timeout handler
    const timeoutHandler = setTimeout(async () => {
      try {
        await this.executeAutoProgression(assessmentId);
      } catch (error) {
        console.error(`Scheduled progression failed for assessment ${assessmentId}:`, error);
      }
    }, timePerQuestion * 1000);

    const scheduledProgression: ScheduledProgression = {
      assessmentId,
      timerId,
      scheduledTime,
      timeoutHandler
    };

    this.scheduledProgressions.set(assessmentId, scheduledProgression);

    console.log(`Scheduled auto progression for assessment ${assessmentId} at ${scheduledTime.toISOString()}`);

    return scheduledProgression;
  }

  /**
   * Cancel scheduled progression for an assessment
   */
  async cancelScheduledProgression(assessmentId: number): Promise<boolean> {
    const scheduled = this.scheduledProgressions.get(assessmentId);
    
    if (!scheduled) {
      return false;
    }

    clearTimeout(scheduled.timeoutHandler);
    this.scheduledProgressions.delete(assessmentId);

    console.log(`Cancelled scheduled progression for assessment ${assessmentId}`);
    return true;
  }

  /**
   * Build context for progression execution
   */
  private async buildProgressionContext(assessmentId: number): Promise<AutoProgressionContext> {
    // Get assessment details
    const assessment = await db.select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (assessment.length === 0) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const currentAssessment = assessment[0];

    // Get assessment config to determine totalQuestions
    const config = await this.loadAssessmentConfig(currentAssessment.userId);

    // Get current question sequence
    const responses = await db.select({
      maxSequence: sql<number>`COALESCE(MAX(${assessmentResponses.questionSequence}), 0)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

    const currentSequence = (responses[0]?.maxSequence || 0) + 1;

    // Build domain coverage map (using string keys to match schema)
    const domainCoverageResults = await db.select({
      domainId: assessmentResponses.domainId,
      count: sql<number>`COUNT(*)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId))
    .groupBy(assessmentResponses.domainId);

    const domainCoverage = new Map<string, number>();
    domainCoverageResults.forEach(result => {
      domainCoverage.set(result.domainId, result.count);
    });

    return {
      assessmentId,
      currentSequence,
      currentDifficulty: currentAssessment.currentDifficulty || 3,
      totalQuestions: config.questionCount || 40,
      timePerQuestion: config.timePerQuestion || 60,
      domainCoverage,
      userId: currentAssessment.userId
    };
  }

  /**
   * Load assessment configuration for a user
   */
  private async loadAssessmentConfig(userId: number): Promise<{
    questionCount: number;
    timePerQuestion: number;
    startingDifficulty: number;
    minDomainCoverage: number;
  }> {
    // Get user's school ID to load school-specific config
    const user = await db.select({
      schoolId: sql<number>`COALESCE(school_id, NULL)`
    }).from(sql`users`)
    .where(sql`id = ${userId}`)
    .limit(1);

    const schoolId = user[0]?.schoolId || null;

    // Try to get school-specific config first, then platform-wide
    const configs = await db.select()
      .from(assessmentConfig)
      .where(schoolId ? eq(assessmentConfig.schoolId, schoolId) : isNull(assessmentConfig.schoolId))
      .limit(1);

    if (configs.length > 0) {
      const config = configs[0];
      return {
        questionCount: config.questionCount || 40,
        timePerQuestion: config.timePerQuestion || 60,
        startingDifficulty: config.startingDifficulty || 3,
        minDomainCoverage: config.minDomainCoverage || 1
      };
    }

    // Fallback to defaults
    return {
      questionCount: 40,
      timePerQuestion: 60,
      startingDifficulty: 3,
      minDomainCoverage: 1
    };
  }

  /**
   * Get the current question being answered
   */
  private async getCurrentQuestion(
    assessmentId: number, 
    currentSequence: number
  ): Promise<AssessmentQuestion | null> {
    // In a timeout scenario, we need to find what question should be at this sequence
    // For now, we'll get the last question that was supposed to be answered
    // This would typically be managed by the assessment session
    
    // This is a simplified implementation - in reality, the current question
    // would be tracked in the assessment session state
    const lastResponse = await db.select({
      questionId: assessmentResponses.questionId
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId))
    .orderBy(desc(assessmentResponses.questionSequence))
    .limit(1);

    if (lastResponse.length > 0) {
      // Get the question details
      const question = await db.select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.id, lastResponse[0].questionId))
        .limit(1);

      return question[0] || null;
    }

    return null;
  }

  /**
   * Record timeout response
   */
  private async recordTimeoutResponse(
    assessmentId: number,
    question: AssessmentQuestion,
    context: AutoProgressionContext
  ): Promise<void> {
    await db.insert(assessmentResponses).values({
      assessmentId,
      questionId: question.id,
      userId: context.userId,
      questionSequence: context.currentSequence,
      selectedAnswer: null, // No answer selected (timeout)
      isCorrect: false,
      pointsEarned: 0,
      timeSpent: context.timePerQuestion,
      timedOut: true,
      difficulty: context.currentDifficulty.toString(), // Convert to string to match schema
      domainId: question.domainId, // Already a string in schema
      answeredAt: new Date()
    });

    console.log(`Recorded timeout response for assessment ${assessmentId}, question ${question.id}, sequence ${context.currentSequence}`);
  }

  /**
   * Calculate difficulty adjustment for timeout (incorrect answer)
   */
  private calculateDifficultyAdjustment(currentDifficulty: number, wasCorrect: boolean): number {
    if (wasCorrect) {
      return Math.min(6, currentDifficulty + 1);
    } else {
      return Math.max(1, currentDifficulty - 1);
    }
  }

  /**
   * Update domain coverage with new question
   */
  private updateDomainCoverage(
    currentCoverage: Map<string, number>,
    domainId: string // Use string to match schema
  ): Map<string, number> {
    const updated = new Map(currentCoverage);
    const current = updated.get(domainId) || 0;
    updated.set(domainId, current + 1);
    return updated;
  }

  /**
   * Update assessment with progression information
   */
  private async updateAssessmentProgression(
    assessmentId: number,
    newDifficulty: number,
    isComplete: boolean
  ): Promise<void> {
    const updateData: any = {
      currentDifficulty: newDifficulty,
      updatedAt: new Date()
    };

    if (isComplete) {
      updateData.completedAt = new Date();
      updateData.completed = true;
    }

    await db.update(assessments)
      .set(updateData)
      .where(eq(assessments.id, assessmentId));

    console.log(`Updated assessment ${assessmentId} with difficulty ${newDifficulty}, complete: ${isComplete}`);
  }

  /**
   * Get active progressions for monitoring
   */
  getActiveProgressions(): Array<{
    assessmentId: number;
    timerId: string;
    scheduledTime: Date;
    remainingMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.scheduledProgressions.values()).map(scheduled => ({
      assessmentId: scheduled.assessmentId,
      timerId: scheduled.timerId,
      scheduledTime: scheduled.scheduledTime,
      remainingMs: Math.max(0, scheduled.scheduledTime.getTime() - now)
    }));
  }

  /**
   * Cleanup expired progressions
   */
  cleanupExpiredProgressions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [assessmentId, scheduled] of this.scheduledProgressions.entries()) {
      if (scheduled.scheduledTime.getTime() <= now) {
        clearTimeout(scheduled.timeoutHandler);
        this.scheduledProgressions.delete(assessmentId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired progressions`);
    }

    return cleanedCount;
  }

  /**
   * Shutdown and cleanup all progressions
   */
  shutdown(): void {
    for (const scheduled of this.scheduledProgressions.values()) {
      clearTimeout(scheduled.timeoutHandler);
    }
    this.scheduledProgressions.clear();
    console.log('AutoProgressionManager shutdown complete');
  }
} 