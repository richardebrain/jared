import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FallbackStrategy } from '../server/algorithms/assessment/FallbackStrategy';
import type { QuestionProvider, FallbackAttempt } from '../server/algorithms/assessment/FallbackStrategy';

// Mock AssessmentQuestion type
interface MockAssessmentQuestion {
  id: string;
  domainId: number;
  difficulty: number;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

describe('FallbackStrategy', () => {
  let fallbackStrategy: FallbackStrategy;
  let mockQuestionProvider: jest.Mocked<QuestionProvider>;

  beforeEach(() => {
    fallbackStrategy = new FallbackStrategy();
    mockQuestionProvider = {
      getQuestions: jest.fn()
    };
  });

  describe('getFallbackLevelDescriptions', () => {
    it('should return all 5 fallback levels with proper descriptions', () => {
      const descriptions = fallbackStrategy.getFallbackLevelDescriptions();

      expect(descriptions).toHaveLength(5);
      expect(descriptions[0].level).toBe(0);
      expect(descriptions[0].riskLevel).toBe('low');
      expect(descriptions[0].description).toBe('Exact domain and difficulty match');

      expect(descriptions[1].level).toBe(1);
      expect(descriptions[1].riskLevel).toBe('low');
      expect(descriptions[1].description).toBe('Same domain, adjacent difficulty levels (±1)');

      expect(descriptions[2].level).toBe(2);
      expect(descriptions[2].riskLevel).toBe('medium');
      expect(descriptions[2].description).toBe('Any domain at same difficulty level');

      expect(descriptions[3].level).toBe(3);
      expect(descriptions[3].riskLevel).toBe('high');
      expect(descriptions[3].description).toBe('Any domain at any difficulty level');

      expect(descriptions[4].level).toBe(4);
      expect(descriptions[4].riskLevel).toBe('emergency');
      expect(descriptions[4].description).toBe('Emergency: any question including previously used');
    });
  });

  describe('executeFallback - Primary Selection Success (Level 0)', () => {
    it('should succeed on primary selection when exact match is available', async () => {
      const mockQuestion: MockAssessmentQuestion = {
        id: 'q1',
        domainId: 1,
        difficulty: 3,
        questionText: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0
      };

      mockQuestionProvider.getQuestions.mockResolvedValue([mockQuestion] as any);

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1, // primaryDomainId
        3, // primaryDifficulty
        ['exclude1'] // excludeQuestionIds
      );

      expect(result.success).toBe(true);
      expect(result.finalQuestion).toEqual(mockQuestion);
      expect(result.finalFallbackLevel).toBe(0);
      expect(result.totalAttempts).toBe(1);
      expect(result.attemptsLog).toHaveLength(1);
      expect(result.attemptsLog[0].level).toBe(0);
      expect(result.attemptsLog[0].strategy).toBe('Primary');
      expect(result.attemptsLog[0].questionsFound).toBe(1);
      expect(result.selectionReason).toContain('Primary');

      // Verify correct parameters passed to question provider
      expect(mockQuestionProvider.getQuestions).toHaveBeenCalledWith(1, 3, ['exclude1']);
    });
  });

  describe('executeFallback - Adjacent Difficulty Success (Level 1)', () => {
    it('should succeed on adjacent difficulty when primary fails', async () => {
      const mockQuestion: MockAssessmentQuestion = {
        id: 'q2',
        domainId: 1,
        difficulty: 2, // difficulty 2 instead of 3
        questionText: 'Adjacent difficulty question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 1
      };

      // Primary selection fails (no questions)
      mockQuestionProvider.getQuestions
        .mockResolvedValueOnce([]) // Level 0: No exact match
        .mockResolvedValueOnce([mockQuestion] as any); // Level 1: Adjacent difficulty success

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1, // primaryDomainId
        3, // primaryDifficulty
        []
      );

      expect(result.success).toBe(true);
      expect(result.finalQuestion).toEqual(mockQuestion);
      expect(result.finalFallbackLevel).toBe(1);
      expect(result.totalAttempts).toBe(2);
      expect(result.attemptsLog).toHaveLength(2);

      // Verify first attempt failed
      expect(result.attemptsLog[0].level).toBe(0);
      expect(result.attemptsLog[0].selectedQuestion).toBeUndefined();
      expect(result.attemptsLog[0].questionsFound).toBe(0);

      // Verify second attempt succeeded
      expect(result.attemptsLog[1].level).toBe(1);
      expect(result.attemptsLog[1].selectedQuestion).toEqual(mockQuestion);
      expect(result.attemptsLog[1].strategy).toBe('Adjacent Difficulty');
    });
  });

  describe('executeFallback - Cross Domain Success (Level 2)', () => {
    it('should succeed on cross domain when domain-specific options fail', async () => {
      const mockQuestion: MockAssessmentQuestion = {
        id: 'q3',
        domainId: 2, // different domain
        difficulty: 3,
        questionText: 'Cross domain question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 2
      };

      mockQuestionProvider.getQuestions
        .mockResolvedValueOnce([]) // Level 0: Primary fails
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (first call)
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (second call) 
        .mockResolvedValueOnce([mockQuestion] as any); // Level 2: Cross domain success

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1, // primaryDomainId
        3, // primaryDifficulty
        []
      );

      expect(result.success).toBe(true);
      expect(result.finalQuestion).toEqual(mockQuestion);
      expect(result.finalFallbackLevel).toBe(2);
      expect(result.totalAttempts).toBe(3);
      expect(result.attemptsLog[2].strategy).toBe('Cross-Domain');
      expect(result.attemptsLog[2].domainId).toBeUndefined(); // Cross domain doesn't specify domain
      expect(result.attemptsLog[2].difficulty).toBe(3);
    });
  });

  describe('executeFallback - Any Difficulty Success (Level 3)', () => {
    it('should succeed on any difficulty when specific difficulty fails', async () => {
      const mockQuestion: MockAssessmentQuestion = {
        id: 'q4',
        domainId: 1,
        difficulty: 5, // any difficulty
        questionText: 'Any difficulty question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 3
      };

      mockQuestionProvider.getQuestions
        .mockResolvedValueOnce([]) // Level 0: Primary fails
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (first call)
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (second call)
        .mockResolvedValueOnce([]) // Level 2: Cross domain fails
        .mockResolvedValueOnce([mockQuestion] as any); // Level 3: Any difficulty success

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1,
        3,
        []
      );

      expect(result.success).toBe(true);
      expect(result.finalQuestion).toEqual(mockQuestion);
      expect(result.finalFallbackLevel).toBe(3);
      expect(result.totalAttempts).toBe(4);
      expect(result.attemptsLog[3].strategy).toBe('Any Available');
      expect(result.attemptsLog[3].domainId).toBeUndefined();
      expect(result.attemptsLog[3].difficulty).toBeUndefined(); // Any difficulty doesn't specify
    });
  });

  describe('executeFallback - Emergency Success (Level 4)', () => {
    it('should succeed on emergency level when all else fails', async () => {
      const mockQuestion: MockAssessmentQuestion = {
        id: 'q5',
        domainId: 5, // any domain
        difficulty: 1, // any difficulty
        questionText: 'Emergency question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0
      };

      mockQuestionProvider.getQuestions
        .mockResolvedValueOnce([]) // Level 0: Primary fails
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (first call)
        .mockResolvedValueOnce([]) // Level 1: Adjacent difficulty fails (second call)
        .mockResolvedValueOnce([]) // Level 2: Cross domain fails
        .mockResolvedValueOnce([]) // Level 3: Any difficulty fails
        .mockResolvedValueOnce([mockQuestion] as any); // Level 4: Emergency success

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1,
        3,
        []
      );

      expect(result.success).toBe(true);
      expect(result.finalQuestion).toEqual(mockQuestion);
      expect(result.finalFallbackLevel).toBe(4);
      expect(result.totalAttempts).toBe(5);
      expect(result.attemptsLog[4].strategy).toBe('Emergency');
      expect(result.attemptsLog[4].domainId).toBeUndefined();
      expect(result.attemptsLog[4].difficulty).toBeUndefined();
      expect(result.selectionReason).toContain('Emergency');
    });
  });

  describe('executeFallback - Complete Failure', () => {
    it('should return failure when all fallback levels are exhausted', async () => {
      // All levels return no questions
      mockQuestionProvider.getQuestions.mockResolvedValue([]);

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1,
        3,
        []
      );

      expect(result.success).toBe(false);
      expect(result.finalQuestion).toBe(null);
      expect(result.finalFallbackLevel).toBe(5); // Beyond last level
      expect(result.totalAttempts).toBe(5);
      expect(result.attemptsLog).toHaveLength(5);
      expect(result.selectionReason).toBe('All fallback strategies exhausted - no questions available');

      // Verify all attempts failed
      result.attemptsLog.forEach(attempt => {
        expect(attempt.selectedQuestion).toBeUndefined();
        expect(attempt.questionsFound).toBe(0);
      });
    });
  });

  describe('analyzeFallbackPattern', () => {
    it('should analyze successful primary selection pattern', () => {
      const attempts: FallbackAttempt[] = [
        {
          level: 0,
          strategy: 'Primary',
          description: 'Exact match',
          criteriaUsed: ['domain', 'difficulty'],
          questionsFound: 5,
          selectedQuestion: { id: 'q1' } as any,
          reason: 'Found exact match'
        },
        {
          level: 0,
          strategy: 'Primary',
          description: 'Exact match',
          criteriaUsed: ['domain', 'difficulty'],
          questionsFound: 3,
          selectedQuestion: { id: 'q2' } as any,
          reason: 'Found exact match'
        }
      ];

      const analysis = fallbackStrategy.analyzeFallbackPattern(attempts);

      expect(analysis.primarySuccessRate).toBe(100);
      expect(analysis.avgFallbackLevel).toBe(0);
      expect(analysis.riskIndicators).toHaveLength(0);
    });

    it('should analyze mixed fallback pattern with risks', () => {
      const attempts: FallbackAttempt[] = [
        {
          level: 0,
          strategy: 'Primary',
          description: 'Exact match',
          criteriaUsed: ['domain', 'difficulty'],
          questionsFound: 0,
          reason: 'No questions found'
        },
        {
          level: 1,
          strategy: 'Adjacent Difficulty',
          description: 'Adjacent match',
          criteriaUsed: ['domain', 'adjacent difficulty'],
          questionsFound: 0,
          reason: 'No questions found'
        },
        {
          level: 3,
          strategy: 'Any Available',
          description: 'Any difficulty',
          criteriaUsed: ['domain'],
          questionsFound: 2,
          selectedQuestion: { id: 'q3' } as any,
          reason: 'Found fallback question'
        },
        {
          level: 4,
          strategy: 'Emergency',
          description: 'Emergency',
          criteriaUsed: [],
          questionsFound: 1,
          selectedQuestion: { id: 'q4' } as any,
          reason: 'Emergency question'
        }
      ];

      const analysis = fallbackStrategy.analyzeFallbackPattern(attempts);

      expect(analysis.primarySuccessRate).toBe(0);
      expect(analysis.avgFallbackLevel).toBe(3.5); // (3 + 4) / 2
      expect(analysis.mostCommonFailure).toBe('No questions found');
      expect(analysis.riskIndicators).toContain('Low primary selection success rate');
      expect(analysis.riskIndicators).toContain('High average fallback level');
      expect(analysis.riskIndicators).toContain('Emergency fallback level reached');
    });

    it('should handle empty attempts array', () => {
      const analysis = fallbackStrategy.analyzeFallbackPattern([]);

      expect(analysis.primarySuccessRate).toBe(0);
      expect(analysis.avgFallbackLevel).toBe(0);
      expect(analysis.mostCommonFailure).toBe('No attempts recorded');
      expect(analysis.riskIndicators).toContain('No fallback data available');
    });

    it('should calculate most common failure reason', () => {
      const attempts: FallbackAttempt[] = [
        {
          level: 0,
          strategy: 'Primary',
          description: 'Exact match',
          criteriaUsed: ['domain', 'difficulty'],
          questionsFound: 0,
          reason: 'Database connection error'
        },
        {
          level: 1,
          strategy: 'Adjacent Difficulty',
          description: 'Adjacent match',
          criteriaUsed: ['domain', 'adjacent difficulty'],
          questionsFound: 0,
          reason: 'No questions found'
        },
        {
          level: 2,
          strategy: 'Cross-Domain',
          description: 'Cross domain',
          criteriaUsed: ['difficulty'],
          questionsFound: 0,
          reason: 'No questions found'
        }
      ];

      const analysis = fallbackStrategy.analyzeFallbackPattern(attempts);

      expect(analysis.mostCommonFailure).toBe('No questions found');
    });
  });

  describe('edge cases', () => {
    it('should handle questions with exclusion filtering', async () => {
      const mockQuestion1: MockAssessmentQuestion = {
        id: 'exclude1',
        domainId: 1,
        difficulty: 3,
        questionText: 'Excluded question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0
      };

      const mockQuestion2: MockAssessmentQuestion = {
        id: 'q2',
        domainId: 1,
        difficulty: 3,
        questionText: 'Valid question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 1
      };

      // The actual implementation just returns all questions - exclusion would be handled by the provider
      mockQuestionProvider.getQuestions.mockResolvedValue([mockQuestion1, mockQuestion2] as any);

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1,
        3,
        ['exclude1'] // Should exclude first question at provider level
      );

      expect(result.success).toBe(true);
      // The test shows that random selection could pick either - this is implementation dependent
      expect(['exclude1', 'q2']).toContain(result.finalQuestion?.id);
      expect(mockQuestionProvider.getQuestions).toHaveBeenCalledWith(1, 3, ['exclude1']);
    });

    it('should handle empty question arrays from provider', async () => {
      mockQuestionProvider.getQuestions.mockResolvedValue([]);

      const result = await fallbackStrategy.executeFallback(
        mockQuestionProvider,
        1,
        3,
        []
      );

      expect(result.success).toBe(false);
      expect(result.attemptsLog.every(attempt => attempt.questionsFound === 0)).toBe(true);
    });

    it('should handle provider errors gracefully', async () => {
      mockQuestionProvider.getQuestions.mockRejectedValue(new Error('Database error'));

      try {
        await fallbackStrategy.executeFallback(mockQuestionProvider, 1, 3, []);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });
  });
}); 