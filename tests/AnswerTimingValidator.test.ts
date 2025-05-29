import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnswerTimingValidator } from '../server/algorithms/assessment/AnswerTimingValidator';

describe('AnswerTimingValidator', () => {
  let validator: AnswerTimingValidator;

  beforeEach(() => {
    validator = new AnswerTimingValidator();
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

    it('should handle different option array sizes', () => {
      const smallOptions = ['A', 'B'];
      const result = validator.validateAnswerFormat(2, smallOptions);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid answer index: 2. Must be between 0 and 1');
    });

    it('should validate first option (index 0)', () => {
      const result = validator.validateAnswerFormat(0, questionOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.isTimeout).toBe(false);
    });

    it('should validate last option', () => {
      const result = validator.validateAnswerFormat(3, questionOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.isTimeout).toBe(false);
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

    it('should handle millisecond precision', () => {
      const submissionTime = new Date('2025-01-01T10:00:00.000Z');
      const processingTime = new Date('2025-01-01T10:00:00.500Z');

      const delay = validator.calculateProcessingDelay(submissionTime, processingTime);
      expect(delay).toBe(0); // Likely rounds to whole seconds
    });

    it('should handle negative delay (processing time before submission)', () => {
      const submissionTime = new Date('2025-01-01T10:00:03Z');
      const processingTime = new Date('2025-01-01T10:00:00Z');

      const delay = validator.calculateProcessingDelay(submissionTime, processingTime);
      expect(delay).toBe(-3);
    });

    it('should handle large delays', () => {
      const submissionTime = new Date('2025-01-01T10:00:00Z');
      const processingTime = new Date('2025-01-01T10:02:00Z');

      const delay = validator.calculateProcessingDelay(submissionTime, processingTime);
      expect(delay).toBe(120); // 2 minutes = 120 seconds
    });
  });
}); 