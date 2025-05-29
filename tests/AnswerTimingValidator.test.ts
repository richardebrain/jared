import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnswerTimingValidator } from '../server/algorithms/assessment/AnswerTimingValidator';
import type { TimingValidationResult } from '../server/algorithms/assessment/AnswerTimingValidator';

// Mock the AssessmentTimerService
const mockTimerService = {
  getCurrentTimerStatus: jest.fn() as jest.MockedFunction<any>,
  validateSubmissionTiming: jest.fn() as jest.MockedFunction<any>,
  startQuestionTimer: jest.fn() as jest.MockedFunction<any>,
  cancelScheduledProgression: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('../server/services/assessment/AssessmentTimerService', () => ({
  AssessmentTimerService: jest.fn().mockImplementation(() => mockTimerService),
}));

describe('AnswerTimingValidator', () => {
  let validator: AnswerTimingValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new AnswerTimingValidator();
  });

  describe('validateSubmissionTiming', () => {
    const assessmentId = 123;
    const questionId = 'q1';
    const timePerQuestion = 60;

    it('should validate submission within time limit', async () => {
      const questionStartTime = new Date(Date.now() - 30000); // 30 seconds ago
      const submissionTime = new Date();

      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId,
        currentQuestionId: questionId,
        questionStartTime,
        timePerQuestion,
        remainingTime: 30000,
        isActive: true,
        nextAutoProgressionTime: new Date(Date.now() + 30000),
      });

      const result: TimingValidationResult = await validator.validateSubmissionTiming(
        assessmentId,
        questionId,
        submissionTime,
        timePerQuestion
      );

      expect(result.isValid).toBe(true);
      expect(result.wasTimeout).toBe(false);
      expect(result.wasLateSubmission).toBe(false);
      expect(result.timeSpent).toBe(30);
      expect(result.remainingTime).toBe(30);
    });

    it('should invalidate late submissions beyond grace period', async () => {
      const questionStartTime = new Date(Date.now() - 70000); // 70 seconds ago
      const submissionTime = new Date();

      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId,
        currentQuestionId: questionId,
        questionStartTime,
        timePerQuestion,
        remainingTime: 0,
        isActive: false,
        nextAutoProgressionTime: new Date(Date.now() - 10000),
      });

      const result = await validator.validateSubmissionTiming(
        assessmentId,
        questionId,
        submissionTime,
        timePerQuestion
      );

      expect(result.isValid).toBe(false);
      expect(result.wasTimeout).toBe(true);
      expect(result.wasLateSubmission).toBe(true);
      expect(result.timeSpent).toBe(70);
      expect(result.remainingTime).toBe(0);
      expect(result.errorMessage).toBe('Submission received too late');
    });

    it('should allow submissions within grace period', async () => {
      const questionStartTime = new Date(Date.now() - 63000); // 63 seconds ago (3 seconds over, within 5 second grace)
      const submissionTime = new Date();

      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId,
        currentQuestionId: questionId,
        questionStartTime,
        timePerQuestion,
        remainingTime: 0,
        isActive: false,
        nextAutoProgressionTime: new Date(Date.now() - 3000),
      });

      const result = await validator.validateSubmissionTiming(
        assessmentId,
        questionId,
        submissionTime,
        timePerQuestion
      );

      expect(result.isValid).toBe(true);
      expect(result.wasTimeout).toBe(true);
      expect(result.wasLateSubmission).toBe(false);
      expect(result.timeSpent).toBe(63);
    });

    it('should handle missing timer gracefully', async () => {
      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await validator.validateSubmissionTiming(
        assessmentId,
        questionId,
        new Date(),
        timePerQuestion
      );

      expect(result.isValid).toBe(false);
      expect(result.wasTimeout).toBe(true);
      expect(result.wasLateSubmission).toBe(true);
      expect(result.timeSpent).toBe(0);
      expect(result.remainingTime).toBe(0);
      expect(result.errorMessage).toBe('Question start time not found - no active timer');
    });

    it('should handle inactive timers', async () => {
      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId,
        currentQuestionId: questionId,
        questionStartTime: new Date(),
        timePerQuestion,
        remainingTime: 0,
        isActive: false,
        nextAutoProgressionTime: new Date(),
      });

      const result = await validator.validateSubmissionTiming(
        assessmentId,
        questionId,
        new Date(),
        timePerQuestion
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Question start time not found - no active timer');
    });
  });

  describe('hasQuestionTimedOut', () => {
    it('should detect timed out questions', async () => {
      const questionStartTime = new Date(Date.now() - 70000); // 70 seconds ago
      
      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId: 123,
        questionStartTime,
        isActive: false,
        remainingTime: 0,
      });

      const result = await validator.hasQuestionTimedOut(123, 'q1', 60);
      expect(result).toBe(true);
    });

    it('should detect active questions within time limit', async () => {
      const questionStartTime = new Date(Date.now() - 30000); // 30 seconds ago
      
      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue({
        assessmentId: 123,
        questionStartTime,
        isActive: true,
        remainingTime: 30000,
      });

      const result = await validator.hasQuestionTimedOut(123, 'q1', 60);
      expect(result).toBe(false);
    });

    it('should assume timeout when no timer found', async () => {
      (mockTimerService.getCurrentTimerStatus as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await validator.hasQuestionTimedOut(123, 'q1', 60);
      expect(result).toBe(true);
    });
  });

  describe('validateWithTimerService', () => {
    it('should use timer service validation', async () => {
      const assessmentId = 123;
      const submissionTime = new Date();

      (mockTimerService.validateSubmissionTiming as jest.MockedFunction<any>).mockResolvedValue(true);

      const result = await validator.validateWithTimerService(assessmentId, submissionTime);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(mockTimerService.validateSubmissionTiming).toHaveBeenCalledWith(assessmentId, submissionTime);
    });

    it('should handle timer service rejection', async () => {
      const assessmentId = 123;
      const submissionTime = new Date();

      (mockTimerService.validateSubmissionTiming as jest.MockedFunction<any>).mockResolvedValue(false);

      const result = await validator.validateWithTimerService(assessmentId, submissionTime);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Submission received after timer expiration');
    });

    it('should handle timer service errors', async () => {
      const assessmentId = 123;
      const submissionTime = new Date();

      (mockTimerService.validateSubmissionTiming as jest.MockedFunction<any>).mockRejectedValue(new Error('Timer service error'));

      const result = await validator.validateWithTimerService(assessmentId, submissionTime);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Timer validation error: Timer service error');
    });
  });

  describe('validateAnswerFormat', () => {
    const questionOptions = ['Option A', 'Option B', 'Option C', 'Option D'];

    it('should validate correct answer format', () => {
      const result = validator.validateAnswerFormat(1, questionOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.isTimeout).toBe(false);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should handle timeout case (no answer)', () => {
      const result = validator.validateAnswerFormat(undefined, questionOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.isTimeout).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should invalidate answer index out of range', () => {
      const result = validator.validateAnswerFormat(5, questionOptions);
      
      expect(result.isValid).toBe(false);
      expect(result.isTimeout).toBe(false);
      expect(result.errorMessage).toBe('Invalid answer index: 5. Must be between 0 and 3');
    });

    it('should invalidate negative answer index', () => {
      const result = validator.validateAnswerFormat(-1, questionOptions);
      
      expect(result.isValid).toBe(false);
      expect(result.isTimeout).toBe(false);
      expect(result.errorMessage).toBe('Invalid answer index: -1. Must be between 0 and 3');
    });
  });

  describe('calculateProcessingDelay', () => {
    it('should calculate processing delay correctly', () => {
      const submissionTime = new Date('2025-01-01T10:00:00Z');
      const processingTime = new Date('2025-01-01T10:00:03Z');

      const delay = validator.calculateProcessingDelay(submissionTime, processingTime);
      expect(delay).toBe(3);
    });

    it('should handle zero delay', () => {
      const time = new Date();
      const delay = validator.calculateProcessingDelay(time, time);
      expect(delay).toBe(0);
    });
  });
}); 