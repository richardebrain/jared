/**
 * Difficulty Progression Service
 * 
 * Manages the 6-level adaptive difficulty progression system for assessments.
 * Handles difficulty adjustment based on user performance while maintaining bounds.
 */
export class DifficultyProgressionService {
  // Difficulty level constants
  static readonly MIN_DIFFICULTY = 1; // Easy
  static readonly MAX_DIFFICULTY = 6; // Master
  static readonly DEFAULT_STARTING_DIFFICULTY = 3; // Medium

  // Difficulty level names for logging and analysis
  static readonly DIFFICULTY_NAMES = {
    1: 'Easy',
    2: 'Easy/Medium', 
    3: 'Medium',
    4: 'Medium/Hard',
    5: 'Hard',
    6: 'Master'
  } as const;

  // Points awarded for each difficulty level
  static readonly DIFFICULTY_POINTS = {
    1: 5,   // Easy
    2: 8,   // Easy/Medium
    3: 10,  // Medium
    4: 13,  // Medium/Hard
    5: 15,  // Hard
    6: 20   // Master
  } as const;

  /**
   * Adjust difficulty based on answer correctness
   * @param currentDifficulty Current difficulty level (1-6)
   * @param wasCorrect Whether the answer was correct
   * @returns New difficulty level
   */
  adjustDifficulty(currentDifficulty: number, wasCorrect: boolean): number {
    // Validate input difficulty level
    if (!this.isValidDifficulty(currentDifficulty)) {
      console.warn(`Invalid current difficulty: ${currentDifficulty}, using default`);
      currentDifficulty = DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY;
    }

    let newDifficulty: number;

    if (wasCorrect) {
      // Correct answer: increase difficulty (but don't exceed maximum)
      newDifficulty = Math.min(
        currentDifficulty + 1, 
        DifficultyProgressionService.MAX_DIFFICULTY
      );
    } else {
      // Incorrect answer or timeout: decrease difficulty (but don't go below minimum)
      newDifficulty = Math.max(
        currentDifficulty - 1, 
        DifficultyProgressionService.MIN_DIFFICULTY
      );
    }

    return newDifficulty;
  }

  /**
   * Calculate points earned for a question based on difficulty and correctness
   * @param difficulty Difficulty level (1-6)
   * @param wasCorrect Whether the answer was correct
   * @returns Points earned (0 if incorrect)
   */
  calculatePoints(difficulty: number, wasCorrect: boolean): number {
    if (!wasCorrect) {
      return 0;
    }

    if (!this.isValidDifficulty(difficulty)) {
      console.warn(`Invalid difficulty for points calculation: ${difficulty}`);
      return 0;
    }

    return DifficultyProgressionService.DIFFICULTY_POINTS[difficulty as keyof typeof DifficultyProgressionService.DIFFICULTY_POINTS];
  }

  /**
   * Validate if a difficulty level is valid
   * @param difficulty Difficulty level to validate
   * @returns Whether the difficulty is valid
   */
  isValidDifficulty(difficulty: number): boolean {
    return Number.isInteger(difficulty) && 
           difficulty >= DifficultyProgressionService.MIN_DIFFICULTY && 
           difficulty <= DifficultyProgressionService.MAX_DIFFICULTY;
  }

  /**
   * Get difficulty name for a given level
   * @param difficulty Difficulty level (1-6)
   * @returns Human-readable difficulty name
   */
  getDifficultyName(difficulty: number): string {
    if (!this.isValidDifficulty(difficulty)) {
      return 'Unknown';
    }

    return DifficultyProgressionService.DIFFICULTY_NAMES[difficulty as keyof typeof DifficultyProgressionService.DIFFICULTY_NAMES];
  }

  /**
   * Analyze difficulty progression pattern
   * @param progressionHistory Array of difficulty levels throughout assessment
   * @returns Analysis of difficulty progression
   */
  analyzeDifficultyProgression(progressionHistory: number[]): {
    startingDifficulty: number;
    finalDifficulty: number;
    averageDifficulty: number;
    maxDifficultyReached: number;
    minDifficultyReached: number;
    progressionTrend: 'increasing' | 'decreasing' | 'stable' | 'variable';
    stabilityScore: number; // 0-100, higher = more stable
    difficultyRange: number;
    progressionSummary: string;
  } {
    if (progressionHistory.length === 0) {
      return {
        startingDifficulty: DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY,
        finalDifficulty: DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY,
        averageDifficulty: DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY,
        maxDifficultyReached: DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY,
        minDifficultyReached: DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY,
        progressionTrend: 'stable',
        stabilityScore: 100,
        difficultyRange: 0,
        progressionSummary: 'No progression data available'
      };
    }

    const startingDifficulty = progressionHistory[0];
    const finalDifficulty = progressionHistory[progressionHistory.length - 1];
    const averageDifficulty = progressionHistory.reduce((sum, diff) => sum + diff, 0) / progressionHistory.length;
    const maxDifficultyReached = Math.max(...progressionHistory);
    const minDifficultyReached = Math.min(...progressionHistory);
    const difficultyRange = maxDifficultyReached - minDifficultyReached;

    // Calculate progression trend
    const difficultyChange = finalDifficulty - startingDifficulty;
    let progressionTrend: 'increasing' | 'decreasing' | 'stable' | 'variable';

    if (Math.abs(difficultyChange) <= 0.5) {
      progressionTrend = 'stable';
    } else if (difficultyChange > 0.5) {
      progressionTrend = 'increasing';
    } else if (difficultyChange < -0.5) {
      progressionTrend = 'decreasing';
    } else {
      progressionTrend = 'variable';
    }

    // Check for high variability
    const changes = progressionHistory.slice(1).map((curr, i) => Math.abs(curr - progressionHistory[i]));
    const averageChange = changes.reduce((sum, change) => sum + change, 0) / Math.max(changes.length, 1);
    
    if (averageChange > 1.5) {
      progressionTrend = 'variable';
    }

    // Calculate stability score (how consistent the difficulty progression is)
    const variance = progressionHistory.reduce((sum, diff) => 
      sum + Math.pow(diff - averageDifficulty, 2), 0
    ) / progressionHistory.length;
    
    const maxVariance = Math.pow(DifficultyProgressionService.MAX_DIFFICULTY - DifficultyProgressionService.MIN_DIFFICULTY, 2) / 4;
    const normalizedVariance = Math.min(variance / maxVariance, 1);
    const stabilityScore = Math.round((1 - normalizedVariance) * 100);

    // Generate progression summary
    const startName = this.getDifficultyName(startingDifficulty);
    const finalName = this.getDifficultyName(finalDifficulty);
    const maxName = this.getDifficultyName(maxDifficultyReached);
    
    let progressionSummary = `Started at ${startName} (${startingDifficulty}), ended at ${finalName} (${finalDifficulty}).`;
    
    if (maxDifficultyReached > startingDifficulty) {
      progressionSummary += ` Reached peak difficulty of ${maxName} (${maxDifficultyReached}).`;
    }
    
    if (progressionTrend === 'increasing') {
      progressionSummary += ' Showed overall improvement in difficulty handling.';
    } else if (progressionTrend === 'decreasing') {
      progressionSummary += ' Showed overall difficulty in maintaining higher levels.';
    } else if (progressionTrend === 'variable') {
      progressionSummary += ' Showed variable performance across difficulty levels.';
    } else {
      progressionSummary += ' Maintained consistent difficulty level.';
    }

    return {
      startingDifficulty,
      finalDifficulty,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      maxDifficultyReached,
      minDifficultyReached,
      progressionTrend,
      stabilityScore,
      difficultyRange,
      progressionSummary
    };
  }

  /**
   * Determine optimal starting difficulty for assessment
   * @param userHistory Optional user's historical performance data
   * @returns Recommended starting difficulty level
   */
  determineStartingDifficulty(userHistory?: {
    averageFinalDifficulty?: number;
    assessmentCount?: number;
    averageCorrectRate?: number;
  }): number {
    // Default starting difficulty
    let startingDifficulty = DifficultyProgressionService.DEFAULT_STARTING_DIFFICULTY;

    // If user has historical data, adjust starting difficulty
    if (userHistory && userHistory.assessmentCount && userHistory.assessmentCount > 0) {
      const { averageFinalDifficulty, averageCorrectRate } = userHistory;

      // Adjust based on historical final difficulty
      if (averageFinalDifficulty && averageFinalDifficulty > 0) {
        // Start slightly below average final difficulty for conservative approach
        startingDifficulty = Math.max(
          Math.min(Math.floor(averageFinalDifficulty), DifficultyProgressionService.MAX_DIFFICULTY - 1),
          DifficultyProgressionService.MIN_DIFFICULTY
        );
      }

      // Adjust based on correct answer rate
      if (averageCorrectRate && averageCorrectRate > 0) {
        if (averageCorrectRate >= 0.8) {
          // High accuracy - can start higher
          startingDifficulty = Math.min(startingDifficulty + 1, DifficultyProgressionService.MAX_DIFFICULTY);
        } else if (averageCorrectRate <= 0.4) {
          // Low accuracy - start lower
          startingDifficulty = Math.max(startingDifficulty - 1, DifficultyProgressionService.MIN_DIFFICULTY);
        }
      }
    }

    return startingDifficulty;
  }

  /**
   * Check if difficulty should be stabilized (prevent rapid changes)
   * @param recentAnswers Array of recent answer results (true/false)
   * @param currentDifficulty Current difficulty level
   * @returns Whether to maintain current difficulty
   */
  shouldStabilizeDifficulty(recentAnswers: boolean[], currentDifficulty: number): boolean {
    if (recentAnswers.length < 3) {
      return false; // Not enough data for stabilization
    }

    const recentCorrect = recentAnswers.slice(-3);
    
    // If user got last 3 questions correct at same difficulty, maintain difficulty for confirmation
    if (recentCorrect.every(correct => correct) && currentDifficulty < DifficultyProgressionService.MAX_DIFFICULTY) {
      return true;
    }

    // If user is struggling at current difficulty (2+ wrong in last 3), maintain difficulty
    const incorrectCount = recentCorrect.filter(correct => !correct).length;
    if (incorrectCount >= 2 && currentDifficulty > DifficultyProgressionService.MIN_DIFFICULTY) {
      return true;
    }

    return false;
  }

  /**
   * Calculate performance metrics for a difficulty level
   * @param responses Array of responses at specific difficulty
   * @returns Performance metrics
   */
  calculateDifficultyPerformance(responses: Array<{
    isCorrect: boolean;
    timeSpent: number;
    pointsEarned: number;
  }>): {
    accuracy: number;
    averageTime: number;
    totalPoints: number;
    responseCount: number;
    efficiency: number; // points per minute
  } {
    if (responses.length === 0) {
      return {
        accuracy: 0,
        averageTime: 0,
        totalPoints: 0,
        responseCount: 0,
        efficiency: 0
      };
    }

    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = correctCount / responses.length;
    const averageTime = responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length;
    const totalPoints = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    const totalTimeMinutes = responses.reduce((sum, r) => sum + r.timeSpent, 0) / 60;
    const efficiency = totalTimeMinutes > 0 ? totalPoints / totalTimeMinutes : 0;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      averageTime: Math.round(averageTime),
      totalPoints,
      responseCount: responses.length,
      efficiency: Math.round(efficiency * 10) / 10
    };
  }
} 