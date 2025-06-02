import { db } from '../../db';
import { assessmentQuestions, assessmentDomains, assessmentConfig } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';

export interface DomainGap {
  domainId: number;
  domainName: string;
  difficulty: number;
  currentCount: number;
  requiredCount: number;
  gap: number;
}

export interface PoolAnalysis {
  totalQuestions: number;
  totalApprovedQuestions: number;
  questionsPerAssessment: number;
  
  // Warning levels
  isCriticallyLow: boolean;
  isSeverelyLow: boolean;
  hasMajorGaps: boolean;
  
  // Detailed analysis
  criticalThreshold: number;
  severeThreshold: number;
  domainGaps: DomainGap[];
  
  // Summary for UI
  warningLevel: 'none' | 'gaps' | 'severe' | 'critical';
  warningMessage: string;
  recommendations: string[];
}

export class QuestionPoolAnalysisService {
  
  /**
   * Analyzes the current question pool and identifies adequacy issues
   */
  async analyzeQuestionPool(): Promise<PoolAnalysis> {
    try {
      // Get current assessment configuration
      const config = await this.getAssessmentConfig();
      const questionsPerAssessment = config.questionCount || 40;
      
      // Calculate thresholds
      const criticalThreshold = questionsPerAssessment;
      const severeThreshold = questionsPerAssessment * 3;
      
      // Get total question counts
      const totalCounts = await this.getTotalQuestionCounts();
      
      // Analyze domain gaps
      const domainGaps = await this.analyzeDomainGaps();
      
      // Determine warning levels
      const isCriticallyLow = totalCounts.approved <= criticalThreshold;
      const isSeverelyLow = totalCounts.approved < severeThreshold;
      const hasMajorGaps = domainGaps.length > 0;
      
      // Determine overall warning level
      let warningLevel: 'none' | 'gaps' | 'severe' | 'critical' = 'none';
      if (isCriticallyLow) {
        warningLevel = 'critical';
      } else if (isSeverelyLow) {
        warningLevel = 'severe';
      } else if (hasMajorGaps) {
        warningLevel = 'gaps';
      }
      
      // Generate warning message and recommendations
      const { warningMessage, recommendations } = this.generateWarningContent(
        warningLevel,
        totalCounts,
        questionsPerAssessment,
        criticalThreshold,
        severeThreshold,
        domainGaps
      );
      
      return {
        totalQuestions: totalCounts.total,
        totalApprovedQuestions: totalCounts.approved,
        questionsPerAssessment,
        isCriticallyLow,
        isSeverelyLow,
        hasMajorGaps,
        criticalThreshold,
        severeThreshold,
        domainGaps,
        warningLevel,
        warningMessage,
        recommendations
      };
      
    } catch (error) {
      console.error('Error analyzing question pool:', error);
      throw new Error('Failed to analyze question pool status');
    }
  }
  
  /**
   * Gets current assessment configuration
   */
  private async getAssessmentConfig() {
    const configs = await db.select()
      .from(assessmentConfig)
      .limit(1);
    
    return configs[0] || { questionCount: 40, timePerQuestion: 60, startingDifficulty: 3 };
  }
  
  /**
   * Gets total and approved question counts
   */
  private async getTotalQuestionCounts() {
    const totalResult = await db.select({
      total: sql<number>`count(*)`
    }).from(assessmentQuestions);
    
    const approvedResult = await db.select({
      approved: sql<number>`count(*)`
    })
    .from(assessmentQuestions)
    .where(and(
      eq(assessmentQuestions.isApproved, true),
      eq(assessmentQuestions.isEnabled, true)
    ));
    
    return {
      total: Number(totalResult[0]?.total || 0),
      approved: Number(approvedResult[0]?.approved || 0)
    };
  }
  
  /**
   * Analyzes gaps in domain coverage by difficulty level
   * Each domain should have at least 2 questions per difficulty level (6 levels = 12 questions minimum)
   */
  private async analyzeDomainGaps(): Promise<DomainGap[]> {
    const gaps: DomainGap[] = [];
    const requiredPerDifficulty = 2;
    const difficultyLevels = ['1', '2', '3', '4', '5', '6'];
    
    // Get all active domains
    const domains = await db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true));
    
    for (const domain of domains) {
      for (const difficulty of difficultyLevels) {
        // Count approved questions for this domain and difficulty
        const countResult = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions)
        .where(and(
          eq(assessmentQuestions.domainId, domain.id.toString()),
          eq(assessmentQuestions.difficulty, difficulty),
          eq(assessmentQuestions.isApproved, true),
          eq(assessmentQuestions.isEnabled, true)
        ));
        
        const currentCount = Number(countResult[0]?.count || 0);
        
        if (currentCount < requiredPerDifficulty) {
          gaps.push({
            domainId: domain.id,
            domainName: domain.name,
            difficulty: parseInt(difficulty),
            currentCount,
            requiredCount: requiredPerDifficulty,
            gap: requiredPerDifficulty - currentCount
          });
        }
      }
    }
    
    return gaps;
  }
  
  /**
   * Generates appropriate warning messages and recommendations
   */
  private generateWarningContent(
    warningLevel: 'none' | 'gaps' | 'severe' | 'critical',
    counts: { total: number; approved: number },
    questionsPerAssessment: number,
    criticalThreshold: number,
    severeThreshold: number,
    domainGaps: DomainGap[]
  ) {
    let warningMessage = '';
    const recommendations: string[] = [];
    
    switch (warningLevel) {
      case 'critical':
        warningMessage = `CRITICAL: Only ${counts.approved} approved questions available, but assessments need ${questionsPerAssessment} questions. Users will experience question pool exhaustion immediately.`;
        recommendations.push(`Add at least ${criticalThreshold - counts.approved + 10} more approved questions immediately`);
        recommendations.push('Consider temporarily reducing assessment question count');
        recommendations.push('Review and approve pending questions');
        break;
        
      case 'severe':
        warningMessage = `SEVERE: Only ${counts.approved} approved questions available. This is less than 3x the assessment requirement (${severeThreshold}). Users may exhaust the question pool quickly.`;
        recommendations.push(`Add at least ${severeThreshold - counts.approved} more approved questions`);
        recommendations.push('Create questions for underrepresented domains and difficulty levels');
        recommendations.push('Review question approval workflow efficiency');
        break;
        
      case 'gaps':
        const gapCount = domainGaps.length;
        const affectedDomains = [...new Set(domainGaps.map(g => g.domainName))];
        warningMessage = `GAPS DETECTED: ${gapCount} domain-difficulty combinations have insufficient questions (need 2+ per difficulty level). Affected domains: ${affectedDomains.join(', ')}.`;
        recommendations.push('Add questions to fill domain-difficulty gaps');
        recommendations.push('Focus on underrepresented difficulty levels');
        recommendations.push('Ensure balanced domain coverage');
        break;
        
      default:
        warningMessage = 'Question pool appears adequate for current assessment requirements.';
        recommendations.push('Continue monitoring question pool growth');
        recommendations.push('Maintain balanced domain and difficulty distribution');
    }
    
    return { warningMessage, recommendations };
  }
  
  /**
   * Gets a summary of domain distribution for the admin dashboard
   */
  async getDomainDistributionSummary() {
    const domains = await db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true));
    
    const distribution = [];
    
    for (const domain of domains) {
      const countResult = await db.select({
        total: sql<number>`count(*)`
      })
      .from(assessmentQuestions)
      .where(and(
        eq(assessmentQuestions.domainId, domain.id.toString()),
        eq(assessmentQuestions.isApproved, true),
        eq(assessmentQuestions.isEnabled, true)
      ));
      
      distribution.push({
        domainId: domain.id,
        domainName: domain.name,
        questionCount: Number(countResult[0]?.total || 0),
        weight: domain.questionWeight
      });
    }
    
    return distribution;
  }
} 