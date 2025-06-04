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
      console.log('Starting question pool analysis...');
      
      // Get current assessment configuration
      console.log('Getting assessment config...');
      const config = await this.getAssessmentConfig();
      const questionsPerAssessment = config.questionCount || 40;
      console.log('Assessment config:', config);
      
      // Calculate thresholds
      const criticalThreshold = questionsPerAssessment;
      const severeThreshold = questionsPerAssessment * 3;
      
      // Get total question counts
      console.log('Getting total question counts...');
      const totalCounts = await this.getTotalQuestionCounts();
      console.log('Total counts:', totalCounts);
      
      // Analyze domain gaps
      console.log('Analyzing domain gaps...');
      const domainGaps = await this.analyzeDomainGaps();
      console.log('Domain gaps found:', domainGaps.length);
      
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
      console.log('Generating warning content...');
      const { warningMessage, recommendations } = this.generateWarningContent(
        warningLevel,
        totalCounts,
        questionsPerAssessment,
        criticalThreshold,
        severeThreshold,
        domainGaps
      );
      
      const result = {
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
      
      console.log('Analysis completed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('Error analyzing question pool:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error(`Failed to analyze question pool status: ${error.message}`);
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
    try {
      const totalResult = await db.select({
        total: sql<string>`count(*)`
      }).from(assessmentQuestions);
      
      const approvedResult = await db.select({
        approved: sql<string>`count(*)`
      })
      .from(assessmentQuestions)
      .where(and(
        eq(assessmentQuestions.isApproved, true),
        eq(assessmentQuestions.isEnabled, true)
      ));
      
      return {
        total: parseInt(totalResult[0]?.total || '0', 10),
        approved: parseInt(approvedResult[0]?.approved || '0', 10)
      };
    } catch (error) {
      console.error('Error in getTotalQuestionCounts:', error);
      throw error;
    }
  }
  
  /**
   * Analyzes gaps in domain coverage by difficulty level
   * Each domain should have at least 2 questions per difficulty level (6 levels = 12 questions minimum)
   */
  private async analyzeDomainGaps(): Promise<DomainGap[]> {
    try {
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
            count: sql<string>`count(*)`
          })
          .from(assessmentQuestions)
          .where(and(
            eq(assessmentQuestions.domainId, domain.id),
            eq(assessmentQuestions.difficulty, difficulty),
            eq(assessmentQuestions.isApproved, true),
            eq(assessmentQuestions.isEnabled, true)
          ));
          
          const currentCount = parseInt(countResult[0]?.count || '0', 10);
          
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
    } catch (error) {
      console.error('Error in analyzeDomainGaps:', error);
      throw error;
    }
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
   * Gets domain distribution summary for dashboard widgets
   */
  async getDomainDistributionSummary() {
    try {
      // Get domains with question counts
      const domainStats = await db.select({
        domainId: assessmentDomains.id,
        domainName: assessmentDomains.name,
        totalQuestions: sql<string>`count(${assessmentQuestions.id})`,
        approvedQuestions: sql<string>`sum(case when ${assessmentQuestions.isApproved} = true and ${assessmentQuestions.isEnabled} = true then 1 else 0 end)`
      })
      .from(assessmentDomains)
      .leftJoin(assessmentQuestions, eq(assessmentDomains.id, assessmentQuestions.domainId))
      .where(eq(assessmentDomains.isActive, true))
      .groupBy(assessmentDomains.id, assessmentDomains.name);

      return domainStats.map(stat => ({
        domainId: stat.domainId,
        domainName: stat.domainName,
        totalQuestions: parseInt(stat.totalQuestions || '0'),
        approvedQuestions: parseInt(stat.approvedQuestions || '0')
      }));
    } catch (error) {
      console.error('Error getting domain distribution summary:', error);
      throw error;
    }
  }

  /**
   * Gets domain/difficulty matrix data for coverage visualization
   */
  async getDomainDifficultyMatrix() {
    try {
      console.log('Getting domain/difficulty matrix data...');
      
      // Get all active domains
      const domains = await db.select({
        id: assessmentDomains.id,
        name: assessmentDomains.name,
        displayOrder: assessmentDomains.displayOrder
      })
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true))
      .orderBy(assessmentDomains.displayOrder);

      // Define difficulty levels
      const difficultyLevels = [1, 2, 3, 4, 5, 6];

      // Get question counts for each domain/difficulty combination
      const matrix = [];
      
      for (const domain of domains) {
        const domainRow = {
          domainId: domain.id,
          domainName: domain.name,
          difficulties: {}
        };

        for (const difficulty of difficultyLevels) {
          // Count approved and enabled questions for this domain and difficulty
          const countResult = await db.select({
            count: sql<string>`count(*)`
          })
          .from(assessmentQuestions)
          .where(and(
            eq(assessmentQuestions.domainId, domain.id),
            eq(assessmentQuestions.difficulty, difficulty.toString()),
            eq(assessmentQuestions.isApproved, true),
            eq(assessmentQuestions.isEnabled, true)
          ));

          const count = parseInt(countResult[0]?.count || '0', 10);
          domainRow.difficulties[difficulty] = count;
        }

        matrix.push(domainRow);
      }

      console.log('Matrix data generated successfully:', matrix.length, 'domains');
      return {
        matrix,
        difficultyLevels,
        domains: domains.map(d => ({ id: d.id, name: d.name }))
      };
      
    } catch (error) {
      console.error('Error getting domain/difficulty matrix:', error);
      throw error;
    }
  }
} 