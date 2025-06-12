/**
 * Assessment Timer Service
 * 
 * Manages server-side timers for assessment questions with automatic progression.
 * Maintains authoritative timing that continues regardless of frontend state.
 */

export interface TimerInfo {
  questionStartTime: Date;
  timePerQuestion: number;
  autoProgressionScheduled: Date;
  timerId: string;
}

export interface TimerStatus {
  assessmentId: number;
  currentQuestionId: string;
  questionStartTime: Date;
  timePerQuestion: number;
  remainingTime: number; // milliseconds remaining
  isActive: boolean;
  nextAutoProgressionTime: Date;
}

export interface ScheduledProgression {
  assessmentId: number;
  timerId: string;
  scheduledTime: Date;
  timeoutHandler: NodeJS.Timeout;
}

export interface AutoProgressionResult {
  assessmentId: number;
  wasProgressed: boolean;
  reason: string;
  nextQuestionId?: string;
  error?: string;
}

/**
 * Assessment Timer Service
 * 
 * Provides server-authoritative timing for assessment questions with automatic
 * progression when questions timeout. Ensures assessments continue even if
 * frontend becomes unresponsive.
 */
export class AssessmentTimerService {
  private activeTimers = new Map<number, ScheduledProgression>(); // assessmentId -> timer info
  private timerIdCounter = 0;

  /**
   * Start timer for a new question
   */
  async startQuestionTimer(
    assessmentId: number,
    timePerQuestion: number
  ): Promise<TimerInfo> {
    // Cancel any existing timer for this assessment
    await this.cancelScheduledProgression(assessmentId);

    const questionStartTime = new Date();
    const autoProgressionScheduled = new Date(questionStartTime.getTime() + (timePerQuestion * 1000));
    const timerId = `timer_${assessmentId}_${++this.timerIdCounter}_${Date.now()}`;

    // Schedule automatic progression
    const timeoutHandler = setTimeout(async () => {
      await this.handleTimerExpiration(assessmentId);
    }, timePerQuestion * 1000);

    // Store timer information
    const scheduledProgression: ScheduledProgression = {
      assessmentId,
      timerId,
      scheduledTime: autoProgressionScheduled,
      timeoutHandler
    };

    this.activeTimers.set(assessmentId, scheduledProgression);

    console.log(`Timer started for assessment ${assessmentId}: ${timePerQuestion}s, expires at ${autoProgressionScheduled.toISOString()}`);

    return {
      questionStartTime,
      timePerQuestion,
      autoProgressionScheduled,
      timerId
    };
  }

  /**
   * Get current timer status for an assessment
   */
  async getCurrentTimerStatus(assessmentId: number): Promise<TimerStatus | null> {
    const timerInfo = this.activeTimers.get(assessmentId);
    
    if (!timerInfo) {
      return null;
    }

    const now = new Date();
    const elapsedMs = now.getTime() - timerInfo.scheduledTime.getTime() + (timerInfo.timeoutHandler as any)._idleTimeout;
    const remainingTime = Math.max(0, (timerInfo.timeoutHandler as any)._idleTimeout - elapsedMs);

    return {
      assessmentId,
      currentQuestionId: '', // This would need to be tracked separately
      questionStartTime: new Date(timerInfo.scheduledTime.getTime() - (timerInfo.timeoutHandler as any)._idleTimeout),
      timePerQuestion: (timerInfo.timeoutHandler as any)._idleTimeout / 1000,
      remainingTime,
      isActive: remainingTime > 0,
      nextAutoProgressionTime: timerInfo.scheduledTime
    };
  }

  /**
   * Cancel scheduled progression for an assessment
   */
  async cancelScheduledProgression(assessmentId: number): Promise<boolean> {
    const timerInfo = this.activeTimers.get(assessmentId);
    
    if (!timerInfo) {
      return false;
    }

    // Clear the timeout
    clearTimeout(timerInfo.timeoutHandler);
    
    // Remove from active timers
    this.activeTimers.delete(assessmentId);

    console.log(`Timer cancelled for assessment ${assessmentId}`);
    return true;
  }

  /**
   * Validate if a submission is within the time limit
   */
  async validateSubmissionTiming(
    assessmentId: number,
    submissionTime: Date
  ): Promise<boolean> {
    const timerInfo = this.activeTimers.get(assessmentId);
    
    if (!timerInfo) {
      // No active timer - submission is valid (shouldn't happen in normal flow)
      console.warn(`No active timer for assessment ${assessmentId} - allowing submission`);
      return true;
    }

    // Check if submission is before the scheduled timeout
    const isValid = submissionTime <= timerInfo.scheduledTime;
    
    if (!isValid) {
      console.log(`Late submission rejected for assessment ${assessmentId}: submitted at ${submissionTime.toISOString()}, deadline was ${timerInfo.scheduledTime.toISOString()}`);
    }

    return isValid;
  }

  /**
   * Handle timer expiration and trigger automatic progression
   */
  private async handleTimerExpiration(assessmentId: number): Promise<void> {
    const timerInfo = this.activeTimers.get(assessmentId);
    
    if (!timerInfo) {
      console.warn(`Timer expiration called for assessment ${assessmentId} but no timer found`);
      return;
    }

    console.log(`Timer expired for assessment ${assessmentId} at ${new Date().toISOString()}`);

    try {
      // Remove the timer since it has expired
      this.activeTimers.delete(assessmentId);

      // In a real implementation, this would trigger the assessment progression
      // For now, we'll emit an event or call a callback
      await this.triggerAutoProgression(assessmentId);

    } catch (error) {
      console.error(`Error handling timer expiration for assessment ${assessmentId}:`, error);
    }
  }

  /**
   * Trigger automatic progression (placeholder for actual implementation)
   */
  private async triggerAutoProgression(assessmentId: number): Promise<AutoProgressionResult> {
    // This would integrate with the main QuestionSelectionService
    // For now, just log the event
    console.log(`AUTO PROGRESSION TRIGGERED for assessment ${assessmentId}`);
    
    // In the actual implementation, this would:
    // 1. Record the timeout as an incorrect answer
    // 2. Update difficulty level (decrease for timeout)
    // 3. Select the next question
    // 4. Update assessment state
    // 5. Start new timer for next question

    return {
      assessmentId,
      wasProgressed: true,
      reason: 'Question timeout - automatic progression',
      nextQuestionId: 'next_question_id' // Would be actual next question
    };
  }

  /**
   * Get all active timers (for monitoring/debugging)
   */
  getActiveTimers(): Array<{
    assessmentId: number;
    timerId: string;
    scheduledTime: Date;
    remainingMs: number;
  }> {
    const now = new Date();
    const activeTimersList: Array<{
      assessmentId: number;
      timerId: string;
      scheduledTime: Date;
      remainingMs: number;
    }> = [];

    for (const [assessmentId, timerInfo] of this.activeTimers.entries()) {
      const remainingMs = Math.max(0, timerInfo.scheduledTime.getTime() - now.getTime());
      
      activeTimersList.push({
        assessmentId,
        timerId: timerInfo.timerId,
        scheduledTime: timerInfo.scheduledTime,
        remainingMs
      });
    }

    return activeTimersList.sort((a, b) => a.remainingMs - b.remainingMs);
  }

  /**
   * Get timer statistics for monitoring
   */
  getTimerStatistics(): {
    activeTimers: number;
    averageRemainingTime: number;
    nextExpiration: Date | null;
    totalTimersCreated: number;
  } {
    const activeTimersList = this.getActiveTimers();
    const averageRemainingTime = activeTimersList.length > 0 
      ? activeTimersList.reduce((sum, timer) => sum + timer.remainingMs, 0) / activeTimersList.length
      : 0;
    
    const nextExpiration = activeTimersList.length > 0 
      ? activeTimersList[0].scheduledTime 
      : null;

    return {
      activeTimers: activeTimersList.length,
      averageRemainingTime,
      nextExpiration,
      totalTimersCreated: this.timerIdCounter
    };
  }

  /**
   * Schedule next automatic progression for an assessment
   */
  async scheduleNextProgression(
    assessmentId: number,
    nextQuestionId: string,
    timePerQuestion: number
  ): Promise<ScheduledProgression> {
    const timerInfo = await this.startQuestionTimer(assessmentId, timePerQuestion);
    
    const scheduledProgression = this.activeTimers.get(assessmentId);
    if (!scheduledProgression) {
      throw new Error(`Failed to create scheduled progression for assessment ${assessmentId}`);
    }

    console.log(`Next progression scheduled for assessment ${assessmentId}, question ${nextQuestionId} in ${timePerQuestion}s`);
    
    return scheduledProgression;
  }

  /**
   * Handle automatic progression result
   */
  async executeAutoProgression(assessmentId: number): Promise<AutoProgressionResult> {
    try {
      // Cancel current timer
      await this.cancelScheduledProgression(assessmentId);
      
      // Execute the progression logic
      const result = await this.triggerAutoProgression(assessmentId);
      
      return result;
    } catch (error) {
      console.error(`Error executing auto progression for assessment ${assessmentId}:`, error);
      return {
        assessmentId,
        wasProgressed: false,
        reason: 'Auto progression failed',
        error: error.message
      };
    }
  }

  /**
   * Cleanup expired timers (maintenance function)
   */
  cleanupExpiredTimers(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [assessmentId, timerInfo] of this.activeTimers.entries()) {
      if (timerInfo.scheduledTime <= now) {
        clearTimeout(timerInfo.timeoutHandler);
        this.activeTimers.delete(assessmentId);
        cleanedCount++;
        console.log(`Cleaned up expired timer for assessment ${assessmentId}`);
      }
    }

    return cleanedCount;
  }

  /**
   * Force cleanup all timers (for shutdown)
   */
  shutdown(): void {
    console.log(`Shutting down timer service, cleaning up ${this.activeTimers.size} active timers`);
    
    for (const [assessmentId, timerInfo] of this.activeTimers.entries()) {
      clearTimeout(timerInfo.timeoutHandler);
      console.log(`Cancelled timer for assessment ${assessmentId}`);
    }
    
    this.activeTimers.clear();
    this.timerIdCounter = 0;
  }
} 