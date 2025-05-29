import { AssessmentQuestion } from '@shared/schema';

export interface FallbackAttempt {
  level: number;
  strategy: string;
  description: string;
  domainId?: number;
  difficulty?: number;
  criteriaUsed: string[];
  questionsFound: number;
  selectedQuestion?: AssessmentQuestion;
  reason: string;
}

export interface FallbackResult {
  success: boolean;
  finalQuestion: AssessmentQuestion | null;
  attemptsLog: FallbackAttempt[];
  finalFallbackLevel: number;
  totalAttempts: number;
  selectionReason: string;
}

export interface QuestionProvider {
  getQuestions(domainId?: number, difficulty?: number, excludeIds?: string[]): Promise<AssessmentQuestion[]>;
}

/**
 * Comprehensive Fallback Strategy
 * 
 * Implements multi-level fallback mechanisms to ensure question selection never fails.
 * Progressively relaxes constraints until a question is found or all options exhausted.
 */
export class FallbackStrategy {
  private fallbackLevels = [
    new PrimarySelectionLevel(),
    new AdjacentDifficultyLevel(),
    new CrossDomainLevel(),
    new AnyDifficultyLevel(),
    new EmergencyLevel()
  ];

  /**
   * Execute comprehensive fallback strategy
   */
  async executeFallback(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[]
  ): Promise<FallbackResult> {
    const attemptsLog: FallbackAttempt[] = [];
    let totalAttempts = 0;

    for (let level = 0; level < this.fallbackLevels.length; level++) {
      const fallbackLevel = this.fallbackLevels[level];
      totalAttempts++;

      const attempt = await fallbackLevel.attempt(
        questionProvider,
        primaryDomainId,
        primaryDifficulty,
        excludeQuestionIds,
        level
      );

      attemptsLog.push(attempt);

      if (attempt.selectedQuestion) {
        return {
          success: true,
          finalQuestion: attempt.selectedQuestion,
          attemptsLog,
          finalFallbackLevel: level,
          totalAttempts,
          selectionReason: `${attempt.strategy}: ${attempt.reason}`
        };
      }
    }

    // All fallback levels failed
    return {
      success: false,
      finalQuestion: null,
      attemptsLog,
      finalFallbackLevel: this.fallbackLevels.length,
      totalAttempts,
      selectionReason: 'All fallback strategies exhausted - no questions available'
    };
  }

  /**
   * Get fallback level descriptions for monitoring
   */
  getFallbackLevelDescriptions(): Array<{
    level: number;
    name: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'emergency';
  }> {
    return this.fallbackLevels.map((level, index) => ({
      level: index,
      name: level.constructor.name,
      description: level.getDescription(),
      riskLevel: level.getRiskLevel()
    }));
  }

  /**
   * Analyze fallback usage patterns
   */
  analyzeFallbackPattern(attempts: FallbackAttempt[]): {
    primarySuccessRate: number;
    avgFallbackLevel: number;
    mostCommonFailure: string;
    riskIndicators: string[];
  } {
    if (attempts.length === 0) {
      return {
        primarySuccessRate: 0,
        avgFallbackLevel: 0,
        mostCommonFailure: 'No attempts recorded',
        riskIndicators: ['No fallback data available']
      };
    }

    const primarySuccesses = attempts.filter(a => a.level === 0 && a.selectedQuestion).length;
    const primarySuccessRate = (primarySuccesses / attempts.length) * 100;

    const completedAttempts = attempts.filter(a => a.selectedQuestion);
    const avgFallbackLevel = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, a) => sum + a.level, 0) / completedAttempts.length 
      : 0;

    // Analyze failure patterns
    const failureReasons = attempts.filter(a => !a.selectedQuestion).map(a => a.reason);
    const reasonCounts = failureReasons.reduce((counts, reason) => {
      counts[reason] = (counts[reason] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostCommonFailure = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Risk indicators
    const riskIndicators: string[] = [];
    if (primarySuccessRate < 50) {
      riskIndicators.push('Low primary selection success rate');
    }
    if (avgFallbackLevel > 2) {
      riskIndicators.push('High average fallback level');
    }
    if (attempts.some(a => a.level >= 4)) {
      riskIndicators.push('Emergency fallback level reached');
    }

    return {
      primarySuccessRate,
      avgFallbackLevel,
      mostCommonFailure,
      riskIndicators
    };
  }
}

/**
 * Abstract base class for fallback levels
 */
abstract class FallbackLevel {
  abstract getDescription(): string;
  abstract getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency';
  
  abstract attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt>;

  protected async selectRandomQuestion(questions: AssessmentQuestion[]): Promise<AssessmentQuestion | undefined> {
    if (questions.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }
}

/**
 * Level 0: Primary Selection
 */
class PrimarySelectionLevel extends FallbackLevel {
  getDescription(): string {
    return 'Exact domain and difficulty match';
  }

  getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency' {
    return 'low';
  }

  async attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt> {
    const questions = await questionProvider.getQuestions(primaryDomainId, primaryDifficulty, excludeQuestionIds);
    const selectedQuestion = await this.selectRandomQuestion(questions);

    return {
      level,
      strategy: 'Primary',
      description: this.getDescription(),
      domainId: primaryDomainId,
      difficulty: primaryDifficulty,
      criteriaUsed: ['exact domain', 'exact difficulty', 'exclude used questions'],
      questionsFound: questions.length,
      selectedQuestion,
      reason: selectedQuestion 
        ? `Found ${questions.length} questions for domain ${primaryDomainId} at difficulty ${primaryDifficulty}`
        : `No questions available for domain ${primaryDomainId} at difficulty ${primaryDifficulty}`
    };
  }
}

/**
 * Level 1: Adjacent Difficulty
 */
class AdjacentDifficultyLevel extends FallbackLevel {
  getDescription(): string {
    return 'Same domain, adjacent difficulty levels (±1)';
  }

  getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency' {
    return 'low';
  }

  async attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt> {
    const adjacentDifficulties = [primaryDifficulty - 1, primaryDifficulty + 1]
      .filter(d => d >= 1 && d <= 6);

    for (const difficulty of adjacentDifficulties) {
      const questions = await questionProvider.getQuestions(primaryDomainId, difficulty, excludeQuestionIds);
      const selectedQuestion = await this.selectRandomQuestion(questions);

      if (selectedQuestion) {
        return {
          level,
          strategy: 'Adjacent Difficulty',
          description: this.getDescription(),
          domainId: primaryDomainId,
          difficulty,
          criteriaUsed: ['exact domain', 'adjacent difficulty', 'exclude used questions'],
          questionsFound: questions.length,
          selectedQuestion,
          reason: `Found ${questions.length} questions for domain ${primaryDomainId} at difficulty ${difficulty} (adjacent to ${primaryDifficulty})`
        };
      }
    }

    return {
      level,
      strategy: 'Adjacent Difficulty',
      description: this.getDescription(),
      domainId: primaryDomainId,
      criteriaUsed: ['exact domain', 'adjacent difficulty', 'exclude used questions'],
      questionsFound: 0,
      reason: `No questions available for domain ${primaryDomainId} at adjacent difficulties [${adjacentDifficulties.join(', ')}]`
    };
  }
}

/**
 * Level 2: Cross-Domain at Same Difficulty
 */
class CrossDomainLevel extends FallbackLevel {
  getDescription(): string {
    return 'Any domain at same difficulty level';
  }

  getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency' {
    return 'medium';
  }

  async attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt> {
    // Get questions from any domain at the primary difficulty
    const questions = await questionProvider.getQuestions(undefined, primaryDifficulty, excludeQuestionIds);
    const selectedQuestion = await this.selectRandomQuestion(questions);

    return {
      level,
      strategy: 'Cross-Domain',
      description: this.getDescription(),
      difficulty: primaryDifficulty,
      criteriaUsed: ['any domain', 'exact difficulty', 'exclude used questions'],
      questionsFound: questions.length,
      selectedQuestion,
      reason: selectedQuestion 
        ? `Found ${questions.length} questions from any domain at difficulty ${primaryDifficulty}`
        : `No questions available from any domain at difficulty ${primaryDifficulty}`
    };
  }
}

/**
 * Level 3: Any Domain, Any Difficulty
 */
class AnyDifficultyLevel extends FallbackLevel {
  getDescription(): string {
    return 'Any domain at any difficulty level';
  }

  getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency' {
    return 'high';
  }

  async attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt> {
    // Get questions from any domain at any difficulty
    const questions = await questionProvider.getQuestions(undefined, undefined, excludeQuestionIds);
    const selectedQuestion = await this.selectRandomQuestion(questions);

    return {
      level,
      strategy: 'Any Available',
      description: this.getDescription(),
      criteriaUsed: ['any domain', 'any difficulty', 'exclude used questions'],
      questionsFound: questions.length,
      selectedQuestion,
      reason: selectedQuestion 
        ? `Found ${questions.length} questions from any domain at any difficulty`
        : `No questions available from any domain at any difficulty (excluding used questions)`
    };
  }
}

/**
 * Level 4: Emergency - Allow Reused Questions
 */
class EmergencyLevel extends FallbackLevel {
  getDescription(): string {
    return 'Emergency: any question including previously used';
  }

  getRiskLevel(): 'low' | 'medium' | 'high' | 'emergency' {
    return 'emergency';
  }

  async attempt(
    questionProvider: QuestionProvider,
    primaryDomainId: number,
    primaryDifficulty: number,
    excludeQuestionIds: string[],
    level: number
  ): Promise<FallbackAttempt> {
    // Get any questions without exclusions (allowing reuse)
    const questions = await questionProvider.getQuestions(undefined, undefined, []);
    const selectedQuestion = await this.selectRandomQuestion(questions);

    return {
      level,
      strategy: 'Emergency',
      description: this.getDescription(),
      criteriaUsed: ['any domain', 'any difficulty', 'allow reused questions'],
      questionsFound: questions.length,
      selectedQuestion,
      reason: selectedQuestion 
        ? `EMERGENCY: Found ${questions.length} questions (including previously used)`
        : `CRITICAL: No questions available in entire system`
    };
  }
} 