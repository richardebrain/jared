/**
 * Answer Timing Validator for EP-001-09
 * 
 * Handles strict timeout enforcement and submission timing validation
 * with integration to EP-001-08 timer services.
 */
export class AnswerTimingValidator {
  
  /**
   * Validate answer submission timing
   */
  async validateSubmissionTiming(
    assessmentId: number,
    questionId: string,
    submissionTime: Date,
    timePerQuestion: number
  ): Promise<TimingValidationResult> {
    
    // Get the question start time from timer service
    const questionStartTime = await this.getQuestionStartTime(assessmentId, questionId);
    
    if (!questionStartTime) {
      return {
        isValid: false,
        wasTimeout: true,
        wasLateSubmission: true,
        timeSpent: 0,
        remainingTime: 0,
        errorMessage: 'Question start time not found'
      };
    }
    
    const timeSpent = Math.floor((submissionTime.getTime() - questionStartTime.getTime()) / 1000);
    const remainingTime = Math.max(0, timePerQuestion - timeSpent);
    
    // Check if submission was within time limit
    const wasTimeout = timeSpent >= timePerQuestion;
    const wasLateSubmission = timeSpent > timePerQuestion + 5; // 5 second grace period
    
    return {
      isValid: !wasLateSubmission,
      wasTimeout,
      wasLateSubmission,
      timeSpent,
      remainingTime,
      errorMessage: wasLateSubmission ? 'Submission received too late' : undefined
    };
  }
  
  /**
   * Check if question has timed out
   */
  async hasQuestionTimedOut(
    assessmentId: number,
    questionId: string,
    timePerQuestion: number
  ): Promise<boolean> {
    const questionStartTime = await this.getQuestionStartTime(assessmentId, questionId);
    
    if (!questionStartTime) {
      return true; // Assume timeout if no start time found
    }
    
    const now = new Date();
    const timeSpent = Math.floor((now.getTime() - questionStartTime.getTime()) / 1000);
    
    return timeSpent >= timePerQuestion;
  }
  
  /**
   * Get question start time from timer service
   */
  private async getQuestionStartTime(assessmentId: number, questionId: string): Promise<Date | null> {
    // This would integrate with the TimerService from EP-001-08
    // For now, we'll return a placeholder implementation
    
    // TODO: Integrate with actual timer service implementation
    // return await TimerService.getQuestionStartTime(assessmentId, questionId);
    
    // Placeholder: assume question started 30 seconds ago
    return new Date(Date.now() - 30000);
  }
  
  /**
   * Calculate processing delay
   */
  calculateProcessingDelay(submissionTime: Date, processingTime: Date): number {
    return Math.floor((processingTime.getTime() - submissionTime.getTime()) / 1000);
  }
  
  /**
   * Validate answer format and content
   */
  validateAnswerFormat(
    selectedAnswer: number | undefined,
    questionOptions: string[]
  ): AnswerFormatValidationResult {
    
    // Handle timeout case (no answer selected)
    if (selectedAnswer === undefined || selectedAnswer === null) {
      return {
        isValid: true, // Timeout is a valid state
        isTimeout: true,
        errorMessage: undefined
      };
    }
    
    // Validate answer is within valid range
    if (selectedAnswer < 0 || selectedAnswer >= questionOptions.length) {
      return {
        isValid: false,
        isTimeout: false,
        errorMessage: `Invalid answer index: ${selectedAnswer}. Must be between 0 and ${questionOptions.length - 1}`
      };
    }
    
    return {
      isValid: true,
      isTimeout: false,
      errorMessage: undefined
    };
  }
}

// Types for timing validation
export interface TimingValidationResult {
  isValid: boolean;
  wasTimeout: boolean;
  wasLateSubmission: boolean;
  timeSpent: number;
  remainingTime: number;
  errorMessage?: string;
}

export interface AnswerFormatValidationResult {
  isValid: boolean;
  isTimeout: boolean;
  errorMessage?: string;
} 