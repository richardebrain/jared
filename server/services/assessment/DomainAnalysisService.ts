import { db } from '../../db';
import { 
  assessmentResponses, 
  assessmentDomains,
  type AssessmentResponse 
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Domain Analysis Service for EP-001-09
 * 
 * Tracks accuracy per domain, identifies patterns, and generates
 * coverage statistics for personalized learning recommendations.
 */
export class DomainAnalysisService {
  
  /**
   * Analyze domain performance for an assessment
   */
  async analyzeDomainPerformance(assessmentId: number): Promise<DomainAnalysisResult> {
    
    // Get all responses for this assessment
    const responses = await db.select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.assessmentId, assessmentId));
    
    // Get all domain information
    const domains = await db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true));
    
    // Create domain performance breakdown
    const domainBreakdown = await this.calculateDomainBreakdown(responses, domains);
    
    // Identify strengths and growth areas
    const { strengthAreas, growthAreas } = this.identifyStrengthsAndGrowthAreas(domainBreakdown);
    
    // Calculate overall statistics
    const overallStats = this.calculateOverallStats(responses);
    
    return {
      domainBreakdown,
      strengthAreas,
      growthAreas,
      overallStats,
      totalDomainsCovered: domainBreakdown.length,
      averageAccuracyRate: this.calculateAverageAccuracy(domainBreakdown)
    };
  }
  
  /**
   * Calculate detailed breakdown by domain
   */
  private async calculateDomainBreakdown(
    responses: AssessmentResponse[], 
    domains: any[]
  ): Promise<DomainPerformanceData[]> {
    
    const domainBreakdown: DomainPerformanceData[] = [];
    
    for (const domain of domains) {
      // Filter responses for this domain
      const domainResponses = responses.filter(r => 
        this.parseDomainId(r.domainId) === domain.id
      );
      
      if (domainResponses.length === 0) {
        continue; // Skip domains with no questions
      }
      
      const totalQuestions = domainResponses.length;
      const correctAnswers = domainResponses.filter(r => r.isCorrect).length;
      const accuracyRate = (correctAnswers / totalQuestions) * 100;
      
      // Determine strength level based on accuracy thresholds
      let strengthLevel: 'strength' | 'neutral' | 'growth';
      if (accuracyRate >= 80) {
        strengthLevel = 'strength';
      } else if (accuracyRate < 60) {
        strengthLevel = 'growth';
      } else {
        strengthLevel = 'neutral';
      }
      
      domainBreakdown.push({
        domainId: domain.id,
        domainName: domain.name,
        totalQuestions,
        correctAnswers,
        accuracyRate: Math.round(accuracyRate * 100) / 100, // Round to 2 decimal places
        strengthLevel,
        averageTimeSpent: this.calculateAverageTimeSpent(domainResponses),
        timeoutRate: this.calculateTimeoutRate(domainResponses)
      });
    }
    
    return domainBreakdown;
  }
  
  /**
   * Identify strength and growth areas based on domain performance
   */
  private identifyStrengthsAndGrowthAreas(
    domainBreakdown: DomainPerformanceData[]
  ): { strengthAreas: string[], growthAreas: string[] } {
    
    const strengthAreas = domainBreakdown
      .filter(d => d.strengthLevel === 'strength')
      .map(d => d.domainName);
    
    const growthAreas = domainBreakdown
      .filter(d => d.strengthLevel === 'growth')
      .map(d => d.domainName);
    
    return { strengthAreas, growthAreas };
  }
  
  /**
   * Calculate overall assessment statistics
   */
  private calculateOverallStats(responses: AssessmentResponse[]): OverallAssessmentStats {
    const totalQuestions = responses.length;
    const totalCorrect = responses.filter(r => r.isCorrect).length;
    const totalTimeouts = responses.filter(r => r.timedOut).length;
    const totalPoints = responses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    
    return {
      totalQuestions,
      totalCorrect,
      totalIncorrect: totalQuestions - totalCorrect,
      totalTimeouts,
      totalPoints,
      overallAccuracy: (totalCorrect / totalQuestions) * 100,
      timeoutRate: (totalTimeouts / totalQuestions) * 100,
      averagePointsPerQuestion: totalPoints / totalQuestions
    };
  }
  
  /**
   * Calculate average accuracy across all domains
   */
  private calculateAverageAccuracy(domainBreakdown: DomainPerformanceData[]): number {
    if (domainBreakdown.length === 0) return 0;
    
    const totalAccuracy = domainBreakdown.reduce((sum, d) => sum + d.accuracyRate, 0);
    return Math.round((totalAccuracy / domainBreakdown.length) * 100) / 100;
  }
  
  /**
   * Calculate average time spent for responses
   */
  private calculateAverageTimeSpent(responses: AssessmentResponse[]): number {
    if (responses.length === 0) return 0;
    
    const totalTime = responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    return Math.round((totalTime / responses.length) * 100) / 100;
  }
  
  /**
   * Calculate timeout rate for responses
   */
  private calculateTimeoutRate(responses: AssessmentResponse[]): number {
    if (responses.length === 0) return 0;
    
    const timeouts = responses.filter(r => r.timedOut).length;
    return Math.round((timeouts / responses.length) * 100 * 100) / 100;
  }
  
  /**
   * Parse domain ID from text to number (temporary during migration)
   */
  private parseDomainId(domainId: string): number {
    const domainMap: Record<string, number> = {
      'child-safety': 1,
      'health-development': 2,
      'trauma-informed': 3,
      'positive-guidance': 4,
      'curriculum-play': 5,
      'family-engagement': 6,
      'assessment-observation': 7,
      'professionalism': 8,
      'cultural-inclusion': 9,
      'classroom-scenarios': 10
    };
    
    return domainMap[domainId.toLowerCase()] || 1;
  }
}

// Types for domain analysis
export interface DomainAnalysisResult {
  domainBreakdown: DomainPerformanceData[];
  strengthAreas: string[];
  growthAreas: string[];
  overallStats: OverallAssessmentStats;
  totalDomainsCovered: number;
  averageAccuracyRate: number;
}

export interface DomainPerformanceData {
  domainId: number;
  domainName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  strengthLevel: 'strength' | 'neutral' | 'growth';
  averageTimeSpent: number;
  timeoutRate: number;
}

export interface OverallAssessmentStats {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalTimeouts: number;
  totalPoints: number;
  overallAccuracy: number;
  timeoutRate: number;
  averagePointsPerQuestion: number;
} 