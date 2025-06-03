import type { AssessmentQuestion } from '@shared/schema';

/**
 * 6-Level Difficulty Scoring System
 * 
 * Implements precise point calculations based on question difficulty levels
 * and provides answer validation with mathematical accuracy.
 */
export class ScoringEngine {
  
  /**
   * 6-level point mapping based on difficulty
   */
  private readonly DIFFICULTY_POINTS: Record<number, number> = {
    1: 5,   // Easy
    2: 8,   // Easy/Medium  
    3: 10,  // Medium
    4: 13,  // Medium/Hard
    5: 15,  // Hard
    6: 20   // Master
  };

  /**
   * Validate answer against question's correct answer
   */
  validateAnswer(question: AssessmentQuestion, selectedAnswer?: number): boolean {
    // Handle timeout case (no answer selected)
    if (selectedAnswer === undefined || selectedAnswer === null) {
      return false;
    }

    // Validate answer is within valid range
    const options = this.parseOptions(question.options);
    if (selectedAnswer < 0 || selectedAnswer >= options.length) {
      console.warn(`Invalid answer index ${selectedAnswer} for question ${question.id}`);
      return false;
    }

    // Check against correct answer
    return selectedAnswer === question.correctAnswer;
  }

  /**
   * Calculate points based on difficulty level and correctness
   */
  calculatePoints(difficulty: string | number, isCorrect: boolean): number {
    if (!isCorrect) {
      return 0;
    }

    const difficultyLevel = this.parseDifficulty(difficulty);
    const points = this.DIFFICULTY_POINTS[difficultyLevel];
    
    if (points === undefined) {
      console.warn(`Unknown difficulty level: ${difficulty}, defaulting to medium (10 points)`);
      return 10;
    }

    return points;
  }

  /**
   * Calculate maximum possible points for a difficulty level
   */
  getMaxPoints(difficulty: string | number): number {
    const difficultyLevel = this.parseDifficulty(difficulty);
    return this.DIFFICULTY_POINTS[difficultyLevel] || 10;
  }

  /**
   * Get point distribution across all difficulty levels
   */
  getPointDistribution(): Record<number, number> {
    return { ...this.DIFFICULTY_POINTS };
  }

  /**
   * Calculate accuracy rate from correct/total counts
   */
  calculateAccuracyRate(correctAnswers: number, totalQuestions: number): number {
    if (totalQuestions === 0) {
      return 0;
    }
    
    return Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate weighted score based on difficulty distribution
   */
  calculateWeightedScore(responses: Array<{
    difficulty: string | number;
    isCorrect: boolean;
  }>): {
    totalScore: number;
    maxPossibleScore: number;
    weightedAccuracy: number;
  } {
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const response of responses) {
      const difficultyLevel = this.parseDifficulty(response.difficulty);
      const maxPoints = this.DIFFICULTY_POINTS[difficultyLevel] || 10;
      const earnedPoints = response.isCorrect ? maxPoints : 0;
      
      totalScore += earnedPoints;
      maxPossibleScore += maxPoints;
    }

    const weightedAccuracy = maxPossibleScore > 0 ? 
      Math.round((totalScore / maxPossibleScore) * 100 * 100) / 100 : 0;

    return {
      totalScore,
      maxPossibleScore,
      weightedAccuracy
    };
  }

  /**
   * Determine performance level based on accuracy
   */
  getPerformanceLevel(accuracyRate: number): 'strength' | 'neutral' | 'growth' {
    if (accuracyRate >= 80) {
      return 'strength';
    } else {
      return 'growth';
    }
  }

  /**
   * Parse difficulty from text/number to standardized number (1-6)
   */
  private parseDifficulty(difficulty: string | number): number {
    if (typeof difficulty === 'number') {
      return Math.max(1, Math.min(6, difficulty));
    }

    const difficultyMap: Record<string, number> = {
      '1': 1, 'easy': 1,
      '2': 2, 'easy/medium': 2, 'easy-medium': 2,
      '3': 3, 'medium': 3,
      '4': 4, 'medium/hard': 4, 'medium-hard': 4,
      '5': 5, 'hard': 5,
      '6': 6, 'master': 6, 'expert': 6
    };

    const normalized = difficulty.toLowerCase().trim();
    return difficultyMap[normalized] || 3; // Default to medium
  }

  /**
   * Parse options from text/JSON format (temporary until schema conversion)
   */
  private parseOptions(options: string): string[] {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If JSON parsing fails, treat as comma-separated string
      return options.split(',').map(opt => opt.trim());
    }

    return [];
  }

  /**
   * Validate scoring engine configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check all difficulty levels have points assigned
    for (let level = 1; level <= 6; level++) {
      if (!this.DIFFICULTY_POINTS[level]) {
        errors.push(`Missing points for difficulty level ${level}`);
      }
    }

    // Check points are in ascending order
    for (let level = 1; level < 6; level++) {
      if (this.DIFFICULTY_POINTS[level] >= this.DIFFICULTY_POINTS[level + 1]) {
        errors.push(`Points for level ${level} should be less than level ${level + 1}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get detailed scoring breakdown for analytics
   */
  getDetailedScoring(responses: Array<{
    questionId: string;
    difficulty: string | number;
    isCorrect: boolean;
    timeSpent: number;
  }>): {
    byDifficulty: Record<number, {
      attempted: number;
      correct: number;
      totalPoints: number;
      maxPoints: number;
      accuracy: number;
    }>;
    overallStats: {
      totalQuestions: number;
      totalCorrect: number;
      totalScore: number;
      maxPossibleScore: number;
      overallAccuracy: number;
      averageTimePerQuestion: number;
    };
  } {
    const byDifficulty: Record<number, any> = {};
    let totalCorrect = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;
    let totalTime = 0;

    // Initialize difficulty levels
    for (let level = 1; level <= 6; level++) {
      byDifficulty[level] = {
        attempted: 0,
        correct: 0,
        totalPoints: 0,
        maxPoints: 0,
        accuracy: 0
      };
    }

    // Process each response
    for (const response of responses) {
      const difficulty = this.parseDifficulty(response.difficulty);
      const maxPoints = this.DIFFICULTY_POINTS[difficulty] || 10;
      const earnedPoints = response.isCorrect ? maxPoints : 0;

      byDifficulty[difficulty].attempted++;
      if (response.isCorrect) {
        byDifficulty[difficulty].correct++;
        totalCorrect++;
      }
      byDifficulty[difficulty].totalPoints += earnedPoints;
      byDifficulty[difficulty].maxPoints += maxPoints;

      totalScore += earnedPoints;
      maxPossibleScore += maxPoints;
      totalTime += response.timeSpent;
    }

    // Calculate accuracy rates
    for (let level = 1; level <= 6; level++) {
      const stats = byDifficulty[level];
      stats.accuracy = stats.attempted > 0 ? 
        Math.round((stats.correct / stats.attempted) * 100 * 100) / 100 : 0;
    }

    return {
      byDifficulty,
      overallStats: {
        totalQuestions: responses.length,
        totalCorrect,
        totalScore,
        maxPossibleScore,
        overallAccuracy: responses.length > 0 ? 
          Math.round((totalCorrect / responses.length) * 100 * 100) / 100 : 0,
        averageTimePerQuestion: responses.length > 0 ? 
          Math.round(totalTime / responses.length) : 0
      }
    };
  }
} 