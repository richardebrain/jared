import { AssessmentTimerService } from '../../services/assessment/AssessmentTimerService';

/**
 * Answer Timing Validator for EP-001-09
 * 
 * Handles strict timeout enforcement and submission timing validation
 * with integration to EP-001-08 timer services.
 */
export class AnswerTimingValidator {
  private timerService: AssessmentTimerService;

  constructor() {
    this.timerService = new AssessmentTimerService();
  }
  
  /**
   * Validate answer submission timing
   */
  async validateSubmissionTiming(
    assessmentId: number,
    questionId: string,
    submissionTime: Date,
    timePerQuestion: number
  ): Promise<TimingValidationResult> {
    
    // Get the question start time from EP-001-08 timer service
    const questionStartTime = await this.getQuestionStartTime(assessmentId, questionId);
    
    if (!questionStartTime) {
      return {
        isValid: false,
        wasTimeout: true,
        wasLateSubmission: true,
        timeSpent: 0,
        remainingTime: 0,
        errorMessage: 'Question start time not found - no active timer'
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
   * Check if question has timed out using timer service
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
   * Get question start time from EP-001-08 timer service
   */
  private async getQuestionStartTime(assessmentId: number, questionId: string): Promise<Date | null> {
    try {
      // Get current timer status from EP-001-08 AssessmentTimerService
      const timerStatus = await this.timerService.getCurrentTimerStatus(assessmentId);
      
      if (!timerStatus || !timerStatus.isActive) {
        console.warn(`No active timer found for assessment ${assessmentId}, question ${questionId}`);
        return null;
      }

      // Return the question start time from the active timer
      return timerStatus.questionStartTime;
      
    } catch (error) {
      console.error(`Error getting question start time for assessment ${assessmentId}:`, error);
      return null;
    }
  }
  
  /**
   * Validate submission against EP-001-08 timer service
   */
  async validateWithTimerService(
    assessmentId: number,
    submissionTime: Date
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Use the timer service's built-in validation
      const isValid = await this.timerService.validateSubmissionTiming(assessmentId, submissionTime);
      
      return {
        isValid,
        reason: isValid ? undefined : 'Submission received after timer expiration'
      };
      
    } catch (error) {
      console.error(`Error validating submission timing:`, error);
      return {
        isValid: false,
        reason: `Timer validation error: ${error.message}`
      };
    }
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