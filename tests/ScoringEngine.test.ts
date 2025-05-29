import { describe, it, expect, beforeEach } from '@jest/globals';
import { ScoringEngine } from '../server/algorithms/assessment/ScoringEngine';

// Define the AssessmentQuestion type directly for testing
interface TestAssessmentQuestion {
  id: string;
  text: string;
  options: string;
  correctAnswer: number;
  difficulty: string;
  domainId: string;
  miniLesson: string;
  explanation: string;
  approved: boolean;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
}

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;

  beforeEach(() => {
    scoringEngine = new ScoringEngine();
  });

  describe('6-Level Scoring System', () => {
    it('should return correct points for each difficulty level', () => {
      expect(scoringEngine.calculatePoints('1', true)).toBe(5);   // Easy
      expect(scoringEngine.calculatePoints('2', true)).toBe(8);   // Easy/Medium
      expect(scoringEngine.calculatePoints('3', true)).toBe(10);  // Medium
      expect(scoringEngine.calculatePoints('4', true)).toBe(13);  // Medium/Hard
      expect(scoringEngine.calculatePoints('5', true)).toBe(15);  // Hard
      expect(scoringEngine.calculatePoints('6', true)).toBe(20);  // Master
    });

    it('should return 0 points for incorrect answers regardless of difficulty', () => {
      expect(scoringEngine.calculatePoints('1', false)).toBe(0);
      expect(scoringEngine.calculatePoints('3', false)).toBe(0);
      expect(scoringEngine.calculatePoints('6', false)).toBe(0);
    });

    it('should handle text difficulty names', () => {
      expect(scoringEngine.calculatePoints('easy', true)).toBe(5);
      expect(scoringEngine.calculatePoints('medium', true)).toBe(10);
      expect(scoringEngine.calculatePoints('hard', true)).toBe(15);
      expect(scoringEngine.calculatePoints('master', true)).toBe(20);
    });

    it('should default to medium difficulty for unknown values', () => {
      expect(scoringEngine.calculatePoints('unknown', true)).toBe(10);
      expect(scoringEngine.calculatePoints('', true)).toBe(10);
    });
  });

  describe('Answer Validation', () => {
    const mockQuestion: TestAssessmentQuestion = {
      id: 'test-q1',
      text: 'Test question',
      options: '["Option A", "Option B", "Option C", "Option D"]',
      correctAnswer: 1,
      difficulty: '3',
      domainId: 'child-safety',
      miniLesson: 'Test lesson',
      explanation: 'Test explanation',
      approved: true,
      tags: '["tag1", "tag2"]',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should validate correct answers', () => {
      expect(scoringEngine.validateAnswer(mockQuestion as any, 1)).toBe(true);
    });

    it('should invalidate incorrect answers', () => {
      expect(scoringEngine.validateAnswer(mockQuestion as any, 0)).toBe(false);
      expect(scoringEngine.validateAnswer(mockQuestion as any, 2)).toBe(false);
      expect(scoringEngine.validateAnswer(mockQuestion as any, 3)).toBe(false);
    });

    it('should handle timeout cases (no answer selected)', () => {
      expect(scoringEngine.validateAnswer(mockQuestion as any, undefined)).toBe(false);
      expect(scoringEngine.validateAnswer(mockQuestion as any, null as any)).toBe(false);
    });

    it('should handle invalid answer indexes', () => {
      expect(scoringEngine.validateAnswer(mockQuestion as any, -1)).toBe(false);
      expect(scoringEngine.validateAnswer(mockQuestion as any, 4)).toBe(false);
      expect(scoringEngine.validateAnswer(mockQuestion as any, 999)).toBe(false);
    });
  });

  describe('Performance Level Calculation', () => {
    it('should identify strength areas (≥80% accuracy)', () => {
      expect(scoringEngine.getPerformanceLevel(80)).toBe('strength');
      expect(scoringEngine.getPerformanceLevel(90)).toBe('strength');
      expect(scoringEngine.getPerformanceLevel(100)).toBe('strength');
    });

    it('should identify growth areas (<60% accuracy)', () => {
      expect(scoringEngine.getPerformanceLevel(0)).toBe('growth');
      expect(scoringEngine.getPerformanceLevel(30)).toBe('growth');
      expect(scoringEngine.getPerformanceLevel(59)).toBe('growth');
    });

    it('should identify neutral areas (60-79% accuracy)', () => {
      expect(scoringEngine.getPerformanceLevel(60)).toBe('neutral');
      expect(scoringEngine.getPerformanceLevel(70)).toBe('neutral');
      expect(scoringEngine.getPerformanceLevel(79)).toBe('neutral');
    });
  });

  describe('Weighted Score Calculation', () => {
    it('should calculate weighted scores correctly', () => {
      const responses = [
        { difficulty: '1', isCorrect: true },   // 5 points
        { difficulty: '3', isCorrect: true },   // 10 points
        { difficulty: '6', isCorrect: false },  // 0 points
        { difficulty: '4', isCorrect: true },   // 13 points
      ];

      const result = scoringEngine.calculateWeightedScore(responses);
      
      expect(result.totalScore).toBe(28); // 5 + 10 + 0 + 13
      expect(result.maxPossibleScore).toBe(48); // 5 + 10 + 20 + 13
      expect(result.weightedAccuracy).toBe(58.33); // (28/48)*100, rounded to 2 decimals
    });

    it('should handle empty responses', () => {
      const result = scoringEngine.calculateWeightedScore([]);
      
      expect(result.totalScore).toBe(0);
      expect(result.maxPossibleScore).toBe(0);
      expect(result.weightedAccuracy).toBe(0);
    });

    it('should handle perfect scores', () => {
      const responses = [
        { difficulty: '1', isCorrect: true },
        { difficulty: '6', isCorrect: true },
      ];

      const result = scoringEngine.calculateWeightedScore(responses);
      
      expect(result.totalScore).toBe(25); // 5 + 20
      expect(result.maxPossibleScore).toBe(25); // 5 + 20
      expect(result.weightedAccuracy).toBe(100);
    });
  });

  describe('Accuracy Rate Calculation', () => {
    it('should calculate accuracy rates correctly', () => {
      expect(scoringEngine.calculateAccuracyRate(8, 10)).toBe(80);
      expect(scoringEngine.calculateAccuracyRate(3, 4)).toBe(75);
      expect(scoringEngine.calculateAccuracyRate(10, 10)).toBe(100);
    });

    it('should handle zero total questions', () => {
      expect(scoringEngine.calculateAccuracyRate(0, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(scoringEngine.calculateAccuracyRate(1, 3)).toBe(33.33);
      expect(scoringEngine.calculateAccuracyRate(2, 3)).toBe(66.67);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate a correct configuration', () => {
      const validation = scoringEngine.validateConfiguration();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate points are in ascending order', () => {
      const pointDistribution = scoringEngine.getPointDistribution();
      
      for (let level = 1; level < 6; level++) {
        expect(pointDistribution[level]).toBeLessThan(pointDistribution[level + 1]);
      }
    });
  });

  describe('Max Points Calculation', () => {
    it('should return correct max points for each difficulty', () => {
      expect(scoringEngine.getMaxPoints('1')).toBe(5);
      expect(scoringEngine.getMaxPoints('3')).toBe(10);
      expect(scoringEngine.getMaxPoints('6')).toBe(20);
    });

    it('should default to 10 for unknown difficulty', () => {
      expect(scoringEngine.getMaxPoints('unknown')).toBe(10);
    });
  });
}); 