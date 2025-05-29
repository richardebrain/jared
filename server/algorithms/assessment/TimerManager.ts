export interface Timer {
  id: string;
  assessmentId: number;
  questionId: string;
  startTime: Date;
  duration: number; // seconds
  expirationTime: Date;
  isActive: boolean;
  callback?: () => Promise<void>;
}

export interface TimerState {
  id: string;
  assessmentId: number;
  questionId: string;
  startTime: Date;
  duration: number;
  remainingTime: number; // milliseconds
  isExpired: boolean;
  isActive: boolean;
}

export interface TimerCreateOptions {
  assessmentId: number;
  questionId: string;
  duration: number; // seconds
  callback?: () => Promise<void>;
}

export interface TimerStatistics {
  totalActiveTimers: number;
  averageRemainingTime: number;
  nextExpiration: Date | null;
  totalTimersCreated: number;
  totalTimersExpired: number;
  totalTimersCancelled: number;
}

/**
 * Timer Manager Algorithm
 * 
 * Core timer implementation for assessment questions. Provides server-side
 * authoritative timing with automatic expiration handling and cleanup.
 */
export class TimerManager {
  private timers = new Map<string, Timer>();
  private timeoutHandlers = new Map<string, NodeJS.Timeout>();
  private timerIdCounter = 0;
  
  // Statistics
  private stats = {
    totalTimersCreated: 0,
    totalTimersExpired: 0,
    totalTimersCancelled: 0
  };

  /**
   * Create a new timer for an assessment question
   */
  createTimer(options: TimerCreateOptions): Timer {
    const id = this.generateTimerId(options.assessmentId);
    const startTime = new Date();
    const expirationTime = new Date(startTime.getTime() + (options.duration * 1000));

    const timer: Timer = {
      id,
      assessmentId: options.assessmentId,
      questionId: options.questionId,
      startTime,
      duration: options.duration,
      expirationTime,
      isActive: true,
      callback: options.callback
    };

    // Store the timer
    this.timers.set(id, timer);

    // Set up the timeout handler
    const timeoutHandler = setTimeout(async () => {
      await this.handleTimerExpiration(id);
    }, options.duration * 1000);

    this.timeoutHandlers.set(id, timeoutHandler);
    this.stats.totalTimersCreated++;

    console.log(`Timer created: ${id} for assessment ${options.assessmentId}, expires at ${expirationTime.toISOString()}`);

    return timer;
  }

  /**
   * Get timer state by ID
   */
  getTimerState(timerId: string): TimerState | null {
    const timer = this.timers.get(timerId);
    
    if (!timer) {
      return null;
    }

    const now = new Date();
    const elapsedMs = now.getTime() - timer.startTime.getTime();
    const remainingTime = Math.max(0, (timer.duration * 1000) - elapsedMs);
    const isExpired = now >= timer.expirationTime;

    return {
      id: timer.id,
      assessmentId: timer.assessmentId,
      questionId: timer.questionId,
      startTime: timer.startTime,
      duration: timer.duration,
      remainingTime,
      isExpired,
      isActive: timer.isActive && !isExpired
    };
  }

  /**
   * Get timer for a specific assessment
   */
  getTimerByAssessment(assessmentId: number): TimerState | null {
    const timer = Array.from(this.timers.values()).find(t => 
      t.assessmentId === assessmentId && t.isActive
    );

    if (!timer) {
      return null;
    }

    return this.getTimerState(timer.id);
  }

  /**
   * Cancel a timer by ID
   */
  cancelTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    
    if (!timer) {
      return false;
    }

    // Clear the timeout
    const timeoutHandler = this.timeoutHandlers.get(timerId);
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
      this.timeoutHandlers.delete(timerId);
    }

    // Mark timer as inactive
    timer.isActive = false;
    this.stats.totalTimersCancelled++;

    console.log(`Timer cancelled: ${timerId}`);
    return true;
  }

  /**
   * Cancel all timers for an assessment
   */
  cancelTimersForAssessment(assessmentId: number): number {
    let cancelledCount = 0;
    
    for (const timer of this.timers.values()) {
      if (timer.assessmentId === assessmentId && timer.isActive) {
        if (this.cancelTimer(timer.id)) {
          cancelledCount++;
        }
      }
    }

    console.log(`Cancelled ${cancelledCount} timers for assessment ${assessmentId}`);
    return cancelledCount;
  }

  /**
   * Check if a submission is within the time limit
   */
  isSubmissionValid(timerId: string, submissionTime: Date): boolean {
    const timer = this.timers.get(timerId);
    
    if (!timer) {
      console.warn(`Timer ${timerId} not found - allowing submission`);
      return true;
    }

    const isValid = submissionTime <= timer.expirationTime;
    
    if (!isValid) {
      const latencyMs = submissionTime.getTime() - timer.expirationTime.getTime();
      console.log(`Late submission detected for timer ${timerId}: ${latencyMs}ms late`);
    }

    return isValid;
  }

  /**
   * Get all active timers
   */
  getActiveTimers(): TimerState[] {
    const activeTimers: TimerState[] = [];
    
    for (const timer of this.timers.values()) {
      if (timer.isActive) {
        const state = this.getTimerState(timer.id);
        if (state && state.isActive) {
          activeTimers.push(state);
        }
      }
    }

    return activeTimers;
  }

  /**
   * Get timer statistics
   */
  getStatistics(): TimerStatistics {
    const activeTimers = this.getActiveTimers();
    const totalActiveTimers = activeTimers.length;
    
    const averageRemainingTime = totalActiveTimers > 0
      ? activeTimers.reduce((sum, timer) => sum + timer.remainingTime, 0) / totalActiveTimers
      : 0;

    const nextExpiration = activeTimers.length > 0
      ? new Date(Math.min(...activeTimers.map(t => t.startTime.getTime() + (t.duration * 1000))))
      : null;

    return {
      totalActiveTimers,
      averageRemainingTime,
      nextExpiration,
      totalTimersCreated: this.stats.totalTimersCreated,
      totalTimersExpired: this.stats.totalTimersExpired,
      totalTimersCancelled: this.stats.totalTimersCancelled
    };
  }

  /**
   * Cleanup expired timers
   */
  cleanupExpiredTimers(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [timerId, timer] of this.timers.entries()) {
      if (now >= timer.expirationTime) {
        // Clean up expired timer
        const timeoutHandler = this.timeoutHandlers.get(timerId);
        if (timeoutHandler) {
          clearTimeout(timeoutHandler);
          this.timeoutHandlers.delete(timerId);
        }

        // Mark as inactive
        timer.isActive = false;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired timers`);
    }

    return cleanedCount;
  }

  /**
   * Cleanup old inactive timers from memory
   */
  cleanupOldTimers(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [timerId, timer] of this.timers.entries()) {
      if (!timer.isActive && timer.startTime < cutoffTime) {
        this.timers.delete(timerId);
        
        // Also clean up any lingering timeout handlers
        const timeoutHandler = this.timeoutHandlers.get(timerId);
        if (timeoutHandler) {
          clearTimeout(timeoutHandler);
          this.timeoutHandlers.delete(timerId);
        }
        
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old inactive timers`);
    }

    return cleanedCount;
  }

  /**
   * Extend timer duration
   */
  extendTimer(timerId: string, additionalSeconds: number): boolean {
    const timer = this.timers.get(timerId);
    
    if (!timer || !timer.isActive) {
      return false;
    }

    // Cancel existing timeout
    const existingTimeout = this.timeoutHandlers.get(timerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Update timer
    timer.duration += additionalSeconds;
    timer.expirationTime = new Date(timer.expirationTime.getTime() + (additionalSeconds * 1000));

    // Create new timeout
    const now = new Date();
    const remainingMs = timer.expirationTime.getTime() - now.getTime();
    
    if (remainingMs > 0) {
      const newTimeout = setTimeout(async () => {
        await this.handleTimerExpiration(timerId);
      }, remainingMs);

      this.timeoutHandlers.set(timerId, newTimeout);
    }

    console.log(`Timer ${timerId} extended by ${additionalSeconds}s, new expiration: ${timer.expirationTime.toISOString()}`);
    return true;
  }

  /**
   * Shutdown all timers
   */
  shutdown(): void {
    // Cancel all active timeouts
    for (const timeoutHandler of this.timeoutHandlers.values()) {
      clearTimeout(timeoutHandler);
    }

    // Clear all data
    this.timers.clear();
    this.timeoutHandlers.clear();

    console.log('TimerManager shutdown complete');
  }

  /**
   * Generate unique timer ID
   */
  private generateTimerId(assessmentId: number): string {
    return `timer_${assessmentId}_${++this.timerIdCounter}_${Date.now()}`;
  }

  /**
   * Handle timer expiration
   */
  private async handleTimerExpiration(timerId: string): Promise<void> {
    const timer = this.timers.get(timerId);
    
    if (!timer) {
      console.warn(`Timer expiration called for ${timerId} but timer not found`);
      return;
    }

    console.log(`Timer expired: ${timerId} for assessment ${timer.assessmentId}`);

    // Mark timer as inactive
    timer.isActive = false;
    this.timeoutHandlers.delete(timerId);
    this.stats.totalTimersExpired++;

    // Execute callback if provided
    if (timer.callback) {
      try {
        await timer.callback();
      } catch (error) {
        console.error(`Error executing timer callback for ${timerId}:`, error);
      }
    }
  }
} 