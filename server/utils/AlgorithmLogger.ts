/**
 * Algorithm Logger Utility
 * 
 * Provides comprehensive logging for question selection decisions, algorithm
 * performance tracking, and debugging support for the adaptive assessment system.
 */

export interface SelectionLogEntry {
  timestamp: Date;
  assessmentId: number;
  userId: number;
  questionSequence: number;
  selectionDecision: {
    selectedQuestionId: string;
    selectedDomainId: number;
    selectedDifficulty: number;
    selectionStrategy: string;
    fallbackLevel: number;
    selectionReason: string;
  };
  algorithmState: {
    currentDifficulty: number;
    domainCoverage: Record<number, number>;
    domainTargets: Record<number, number>;
    questionsRemaining: number;
    assessmentPhase: 'early' | 'mid' | 'final';
  };
  performance: {
    selectionTimeMs: number;
    questionPoolSize: number;
    availableQuestions: number;
    dbQueryCount: number;
  };
  alternatives: Array<{
    questionId: string;
    domainId: number;
    difficulty: number;
    notSelectedReason: string;
  }>;
}

export interface PerformanceMetrics {
  totalSelections: number;
  averageSelectionTime: number;
  fallbackUsageRate: number;
  domainBalanceScore: number;
  algorithmEfficiency: number;
  errorRate: number;
}

export interface AlgorithmAnalytics {
  timeWindow: {
    start: Date;
    end: Date;
  };
  assessmentCount: number;
  totalSelections: number;
  performance: PerformanceMetrics;
  fallbackAnalysis: {
    fallbackUsageByLevel: Record<number, number>;
    mostCommonFallbackReasons: Array<{ reason: string; count: number }>;
    emergencyFallbackCount: number;
  };
  domainAnalysis: {
    domainSelectionFrequency: Record<number, number>;
    domainBalanceVariance: number;
    underAllocatedDomains: number[];
    overAllocatedDomains: number[];
  };
  difficultyAnalysis: {
    difficultyDistribution: Record<number, number>;
    averageDifficultyProgression: number;
    difficultyStabilityScore: number;
  };
}

export class AlgorithmLogger {
  private logEntries: SelectionLogEntry[] = [];
  private maxLogEntries = 10000; // Keep last 10k entries in memory
  private performanceHistory: Array<{ timestamp: Date; metrics: PerformanceMetrics }> = [];

  /**
   * Log a question selection decision
   */
  logSelection(entry: SelectionLogEntry): void {
    // Add timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = new Date();
    }

    // Add to log entries
    this.logEntries.push(entry);

    // Trim entries if exceeding max
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }

    // Log to console for debugging (with appropriate log level)
    this.logToConsole(entry);

    // Update performance metrics
    this.updatePerformanceMetrics(entry);
  }

  /**
   * Log algorithm performance metrics
   */
  logPerformance(
    assessmentId: number,
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const logMessage = `[ALGO-PERF] Assessment ${assessmentId} - ${operation}: ${duration}ms`;
    
    if (metadata) {
      console.log(logMessage, metadata);
    } else {
      console.log(logMessage);
    }

    // Track performance history
    if (operation === 'question_selection') {
      this.recordPerformanceMetric('selection_time', duration);
    }
  }

  /**
   * Log algorithm warnings and issues
   */
  logWarning(
    assessmentId: number,
    component: string,
    warning: string,
    context?: Record<string, any>
  ): void {
    const logMessage = `[ALGO-WARN] Assessment ${assessmentId} - ${component}: ${warning}`;
    console.warn(logMessage, context || {});
  }

  /**
   * Log algorithm errors
   */
  logError(
    assessmentId: number,
    component: string,
    error: string | Error,
    context?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const logMessage = `[ALGO-ERROR] Assessment ${assessmentId} - ${component}: ${errorMessage}`;
    console.error(logMessage, context || {});
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Generate algorithm analytics report
   */
  generateAnalytics(
    timeWindowHours: number = 24
  ): AlgorithmAnalytics {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (timeWindowHours * 60 * 60 * 1000));
    
    const windowEntries = this.logEntries.filter(entry => 
      entry.timestamp >= windowStart
    );

    const assessmentIds = new Set(windowEntries.map(entry => entry.assessmentId));
    const totalSelections = windowEntries.length;

    return {
      timeWindow: {
        start: windowStart,
        end: now
      },
      assessmentCount: assessmentIds.size,
      totalSelections,
      performance: this.calculatePerformanceMetrics(windowEntries),
      fallbackAnalysis: this.analyzeFallbackUsage(windowEntries),
      domainAnalysis: this.analyzeDomainDistribution(windowEntries),
      difficultyAnalysis: this.analyzeDifficultyProgression(windowEntries)
    };
  }

  /**
   * Get recent algorithm decisions for debugging
   */
  getRecentDecisions(count: number = 50): SelectionLogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Get decisions for specific assessment
   */
  getAssessmentDecisions(assessmentId: number): SelectionLogEntry[] {
    return this.logEntries.filter(entry => entry.assessmentId === assessmentId);
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(timeWindowHours: number = 24): {
    analytics: AlgorithmAnalytics;
    rawEntries: SelectionLogEntry[];
    exportTimestamp: Date;
  } {
    const analytics = this.generateAnalytics(timeWindowHours);
    const windowStart = new Date(Date.now() - (timeWindowHours * 60 * 60 * 1000));
    const rawEntries = this.logEntries.filter(entry => entry.timestamp >= windowStart);

    return {
      analytics,
      rawEntries,
      exportTimestamp: new Date()
    };
  }

  /**
   * Clear old log entries to free memory
   */
  clearOldEntries(olderThanHours: number = 168): number { // Default 1 week
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    const initialCount = this.logEntries.length;
    
    this.logEntries = this.logEntries.filter(entry => entry.timestamp >= cutoffTime);
    
    const removedCount = initialCount - this.logEntries.length;
    if (removedCount > 0) {
      console.log(`[ALGO-LOG] Cleared ${removedCount} old log entries older than ${olderThanHours} hours`);
    }
    
    return removedCount;
  }

  // Private helper methods

  private logToConsole(entry: SelectionLogEntry): void {
    const { assessmentId, questionSequence, selectionDecision, performance } = entry;
    
    let logLevel = 'log';
    if (selectionDecision.fallbackLevel >= 3) {
      logLevel = 'warn';
    } else if (selectionDecision.fallbackLevel >= 4) {
      logLevel = 'error';
    }

    const logMessage = `[ALGO] Assessment ${assessmentId} Q${questionSequence}: Selected ${selectionDecision.selectedQuestionId} (Domain ${selectionDecision.selectedDomainId}, Diff ${selectionDecision.selectedDifficulty}) via ${selectionDecision.selectionStrategy} in ${performance.selectionTimeMs}ms`;

    (console as any)[logLevel](logMessage);

    // Log fallback details if used
    if (selectionDecision.fallbackLevel > 0) {
      console.warn(`[ALGO-FALLBACK] Level ${selectionDecision.fallbackLevel}: ${selectionDecision.selectionReason}`);
    }
  }

  private updatePerformanceMetrics(entry: SelectionLogEntry): void {
    this.recordPerformanceMetric('selection_time', entry.performance.selectionTimeMs);
    this.recordPerformanceMetric('fallback_level', entry.selectionDecision.fallbackLevel);
    this.recordPerformanceMetric('question_pool_size', entry.performance.questionPoolSize);
  }

  private recordPerformanceMetric(metric: string, value: number): void {
    // Simplified performance tracking - could be enhanced with proper time series storage
    // For now, just track in console for immediate feedback
    if (metric === 'selection_time' && value > 2000) {
      console.warn(`[ALGO-PERF] Slow question selection: ${value}ms (threshold: 2000ms)`);
    }
    if (metric === 'fallback_level' && value >= 3) {
      console.warn(`[ALGO-PERF] High fallback level used: ${value}`);
    }
  }

  private calculatePerformanceMetrics(entries: SelectionLogEntry[]): PerformanceMetrics {
    if (entries.length === 0) {
      return {
        totalSelections: 0,
        averageSelectionTime: 0,
        fallbackUsageRate: 0,
        domainBalanceScore: 100,
        algorithmEfficiency: 100,
        errorRate: 0
      };
    }

    const totalSelections = entries.length;
    const averageSelectionTime = entries.reduce((sum, entry) => sum + entry.performance.selectionTimeMs, 0) / totalSelections;
    const fallbackUsageCount = entries.filter(entry => entry.selectionDecision.fallbackLevel > 0).length;
    const fallbackUsageRate = (fallbackUsageCount / totalSelections) * 100;
    
    // Calculate domain balance score (simplified)
    const domainUsage = entries.reduce((usage, entry) => {
      const domainId = entry.selectionDecision.selectedDomainId;
      usage[domainId] = (usage[domainId] || 0) + 1;
      return usage;
    }, {} as Record<number, number>);

    const domainVariance = this.calculateVariance(Object.values(domainUsage));
    const domainBalanceScore = Math.max(0, 100 - (domainVariance * 10));

    // Algorithm efficiency score based on fallback usage and selection time
    const timeEfficiency = Math.max(0, 100 - ((averageSelectionTime - 1000) / 10)); // Penalty after 1 second
    const fallbackEfficiency = Math.max(0, 100 - (fallbackUsageRate * 2)); // Penalty for fallback usage
    const algorithmEfficiency = (timeEfficiency + fallbackEfficiency) / 2;

    const errorCount = entries.filter(entry => entry.selectionDecision.fallbackLevel >= 4).length;
    const errorRate = (errorCount / totalSelections) * 100;

    return {
      totalSelections,
      averageSelectionTime,
      fallbackUsageRate,
      domainBalanceScore,
      algorithmEfficiency,
      errorRate
    };
  }

  private analyzeFallbackUsage(entries: SelectionLogEntry[]) {
    const fallbackUsageByLevel: Record<number, number> = {};
    const fallbackReasons: Record<string, number> = {};
    let emergencyFallbackCount = 0;

    entries.forEach(entry => {
      const level = entry.selectionDecision.fallbackLevel;
      fallbackUsageByLevel[level] = (fallbackUsageByLevel[level] || 0) + 1;

      if (level > 0) {
        const reason = entry.selectionDecision.selectionReason;
        fallbackReasons[reason] = (fallbackReasons[reason] || 0) + 1;
      }

      if (level >= 4) {
        emergencyFallbackCount++;
      }
    });

    const mostCommonFallbackReasons = Object.entries(fallbackReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      fallbackUsageByLevel,
      mostCommonFallbackReasons,
      emergencyFallbackCount
    };
  }

  private analyzeDomainDistribution(entries: SelectionLogEntry[]) {
    const domainSelectionFrequency: Record<number, number> = {};
    const domainTargets: Record<number, number> = {};

    entries.forEach(entry => {
      const domainId = entry.selectionDecision.selectedDomainId;
      domainSelectionFrequency[domainId] = (domainSelectionFrequency[domainId] || 0) + 1;

      // Collect domain targets
      Object.entries(entry.algorithmState.domainTargets).forEach(([id, target]) => {
        const numId = parseInt(id);
        domainTargets[numId] = target;
      });
    });

    // Calculate balance variance
    const selectionValues = Object.values(domainSelectionFrequency);
    const domainBalanceVariance = this.calculateVariance(selectionValues);

    // Identify under/over allocated domains
    const underAllocatedDomains: number[] = [];
    const overAllocatedDomains: number[] = [];

    Object.entries(domainTargets).forEach(([id, target]) => {
      const domainId = parseInt(id);
      const actual = domainSelectionFrequency[domainId] || 0;
      const ratio = actual / target;

      if (ratio < 0.8) {
        underAllocatedDomains.push(domainId);
      } else if (ratio > 1.2) {
        overAllocatedDomains.push(domainId);
      }
    });

    return {
      domainSelectionFrequency,
      domainBalanceVariance,
      underAllocatedDomains,
      overAllocatedDomains
    };
  }

  private analyzeDifficultyProgression(entries: SelectionLogEntry[]) {
    const difficultyDistribution: Record<number, number> = {};
    let totalDifficultySum = 0;
    const difficultyProgression: number[] = [];

    entries.forEach(entry => {
      const difficulty = entry.selectionDecision.selectedDifficulty;
      difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
      totalDifficultySum += difficulty;
      difficultyProgression.push(difficulty);
    });

    const averageDifficultyProgression = entries.length > 0 ? totalDifficultySum / entries.length : 3;
    
    // Calculate difficulty stability (how much difficulty changes between questions)
    const difficultyChanges = difficultyProgression.slice(1).map((curr, i) => 
      Math.abs(curr - difficultyProgression[i])
    );
    const averageChange = difficultyChanges.length > 0 
      ? difficultyChanges.reduce((sum, change) => sum + change, 0) / difficultyChanges.length 
      : 0;
    
    const difficultyStabilityScore = Math.max(0, 100 - (averageChange * 20));

    return {
      difficultyDistribution,
      averageDifficultyProgression,
      difficultyStabilityScore
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
} 