import { db } from '../../db';
import { 
  assessmentResults,
  assessments,
  users,
  type InsertAssessmentResults,
  type Assessment,
  type User
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { DomainAnalysisService, type DomainAnalysisResult } from './DomainAnalysisService';

/**
 * Results Compilation Service for EP-001-09
 * 
 * Compiles comprehensive assessment results with teacher-focused insights,
 * personalized learning recommendations, and actionable next steps.
 */
export class ResultsCompilationService {
  
  private domainAnalysisService: DomainAnalysisService;
  
  constructor() {
    this.domainAnalysisService = new DomainAnalysisService();
  }
  
  /**
   * Compile comprehensive assessment results
   */
  async compileAssessmentResults(
    assessmentId: number,
    miniLessonRecommendations: DirectMiniLessonRecommendation[]
  ): Promise<CompiledAssessmentResults> {
    
    // Get assessment and user information
    const assessment = await this.getAssessmentWithUser(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }
    
    // Analyze domain performance
    const domainAnalysis = await this.domainAnalysisService.analyzeDomainPerformance(assessmentId);
    
    // Generate personalized summary
    const personalizedSummary = this.generatePersonalizedSummary(assessment, domainAnalysis);
    
    // Create immediate next steps
    const immediateNextSteps = this.generateImmediateNextSteps(domainAnalysis);
    
    // Process mini-lesson recommendations
    const processedRecommendations = this.processMiniLessonRecommendations(
      miniLessonRecommendations, 
      domainAnalysis
    );
    
    // Create learning path data
    const learningPathData = this.createLearningPath(processedRecommendations, domainAnalysis);
    
    // Calculate overall metrics
    const overallScore = this.calculateOverallScore(domainAnalysis.overallStats);
    
    // Compile final results
    const compiledResults: CompiledAssessmentResults = {
      assessmentId,
      userId: assessment.user.id,
      userName: `${assessment.user.firstName} ${assessment.user.lastName}`,
      overallScore,
      totalQuestions: domainAnalysis.overallStats.totalQuestions,
      totalCorrect: domainAnalysis.overallStats.totalCorrect,
      accuracyRate: domainAnalysis.overallStats.overallAccuracy,
      domainBreakdown: domainAnalysis.domainBreakdown,
      strengthAreas: domainAnalysis.strengthAreas,
      growthAreas: domainAnalysis.growthAreas,
      primaryMiniLessons: processedRecommendations.slice(0, 5), // Top 5 recommendations
      learningPathData,
      personalizedSummary,
      immediateNextSteps,
      estimatedImprovementTime: this.calculateEstimatedImprovementTime(processedRecommendations),
      completedAt: new Date()
    };
    
    return compiledResults;
  }
  
  /**
   * Save compiled results to database
   */
  async saveResultsToDatabase(results: CompiledAssessmentResults): Promise<void> {
    
    const insertData: InsertAssessmentResults = {
      assessmentId: results.assessmentId,
      overallScore: results.overallScore,
      totalQuestions: results.totalQuestions,
      totalCorrect: results.totalCorrect,
      accuracyRate: results.accuracyRate,
      domainBreakdown: results.domainBreakdown,
      strengthAreas: results.strengthAreas,
      growthAreas: results.growthAreas,
      primaryMiniLessons: results.primaryMiniLessons,
      learningPathData: results.learningPathData,
      personalizedSummary: results.personalizedSummary,
      immediateNextSteps: results.immediateNextSteps,
      estimatedImprovementTime: results.estimatedImprovementTime
    };
    
    await db.insert(assessmentResults).values(insertData);
  }
  
  /**
   * Get assessment with user information
   */
  private async getAssessmentWithUser(assessmentId: number): Promise<{ assessment: Assessment, user: User } | null> {
    const result = await db.select({
      assessment: assessments,
      user: users
    })
    .from(assessments)
    .innerJoin(users, eq(assessments.userId, users.id))
    .where(eq(assessments.id, assessmentId))
    .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    return {
      assessment: result[0].assessment,
      user: result[0].user
    };
  }
  
  /**
   * Generate personalized summary for teacher
   */
  private generatePersonalizedSummary(
    assessmentData: { assessment: Assessment, user: User },
    domainAnalysis: DomainAnalysisResult
  ): string {
    
    const { user } = assessmentData;
    const { overallStats, strengthAreas, growthAreas } = domainAnalysis;
    
    const firstName = user.firstName || 'Teacher';
    const accuracy = Math.round(overallStats.overallAccuracy);
    
    let summary = `${firstName}, you completed your initial assessment with ${accuracy}% accuracy! `;
    
    // Add strength recognition
    if (strengthAreas.length > 0) {
      summary += `Your strongest areas are ${strengthAreas.slice(0, 2).join(' and ')}, showing excellent expertise in these ECE domains. `;
    }
    
    // Add growth area guidance
    if (growthAreas.length > 0) {
      summary += `Focus areas for professional growth include ${growthAreas.slice(0, 2).join(' and ')}. `;
      summary += `We've identified personalized mini-lessons to help you strengthen these skills. `;
    } else {
      summary += `You demonstrated strong knowledge across all domains! `;
    }
    
    // Add motivation and next steps
    summary += `Your personalized learning path is ready to support your continued professional development.`;
    
    return summary;
  }
  
  /**
   * Generate immediate next steps
   */
  private generateImmediateNextSteps(domainAnalysis: DomainAnalysisResult): string[] {
    const nextSteps: string[] = [];
    
    const { growthAreas, strengthAreas, domainBreakdown } = domainAnalysis;
    
    // Priority next steps based on growth areas
    if (growthAreas.length > 0) {
      nextSteps.push(`Review mini-lessons for ${growthAreas[0]} to strengthen your foundational knowledge`);
      
      if (growthAreas.length > 1) {
        nextSteps.push(`Complete practice activities for ${growthAreas[1]} when ready`);
      }
    }
    
    // Build on strengths
    if (strengthAreas.length > 0) {
      nextSteps.push(`Leverage your expertise in ${strengthAreas[0]} to mentor other teachers`);
    }
    
    // General professional development
    nextSteps.push('Join community discussions to share insights and learn from peers');
    nextSteps.push('Track your progress through follow-up assessments in 30 days');
    
    return nextSteps.slice(0, 4); // Maximum 4 next steps
  }
  
  /**
   * Process and prioritize mini-lesson recommendations
   */
  private processMiniLessonRecommendations(
    recommendations: DirectMiniLessonRecommendation[],
    domainAnalysis: DomainAnalysisResult
  ): ProcessedMiniLessonRecommendation[] {
    
    const { growthAreas } = domainAnalysis;
    
    return recommendations
      .map(rec => ({
        ...rec,
        // Boost priority for growth areas
        adjustedPriority: growthAreas.includes(rec.domainName) ? rec.priority - 1 : rec.priority
      }))
      .sort((a, b) => a.adjustedPriority - b.adjustedPriority) // Lower number = higher priority
      .slice(0, 10) // Top 10 recommendations
      .map(({ adjustedPriority, ...rec }) => rec); // Remove temporary field
  }
  
  /**
   * Create structured learning path
   */
  private createLearningPath(
    recommendations: DirectMiniLessonRecommendation[],
    domainAnalysis: DomainAnalysisResult
  ): LearningPathData {
    
    const immediate = recommendations.slice(0, 3);
    const followUp = recommendations.slice(3, 6);
    const advanced = recommendations.slice(6, 10);
    
    return {
      totalLessons: recommendations.length,
      estimatedTotalTime: this.calculateEstimatedImprovementTime(recommendations),
      primaryRecommendations: immediate,
      secondaryRecommendations: followUp,
      learningSequence: {
        immediate,
        followUp,
        advanced
      }
    };
  }
  
  /**
   * Calculate overall score from domain statistics
   */
  private calculateOverallScore(overallStats: any): number {
    // Use total points earned as the overall score
    return overallStats.totalPoints || 0;
  }
  
  /**
   * Calculate estimated time for improvement
   */
  private calculateEstimatedImprovementTime(recommendations: DirectMiniLessonRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.estimatedDuration, 0);
  }
}

// Types for results compilation
export interface CompiledAssessmentResults {
  assessmentId: number;
  userId: number;
  userName: string;
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracyRate: number;
  domainBreakdown: any[];
  strengthAreas: string[];
  growthAreas: string[];
  primaryMiniLessons: DirectMiniLessonRecommendation[];
  learningPathData: LearningPathData;
  personalizedSummary: string;
  immediateNextSteps: string[];
  estimatedImprovementTime: number;
  completedAt: Date;
}

export interface ProcessedMiniLessonRecommendation extends DirectMiniLessonRecommendation {
  // Same as DirectMiniLessonRecommendation but processed/prioritized
}

export interface LearningPathData {
  totalLessons: number;
  estimatedTotalTime: number;
  primaryRecommendations: DirectMiniLessonRecommendation[];
  secondaryRecommendations: DirectMiniLessonRecommendation[];
  learningSequence: {
    immediate: DirectMiniLessonRecommendation[];
    followUp: DirectMiniLessonRecommendation[];
    advanced: DirectMiniLessonRecommendation[];
  };
}

// Import DirectMiniLessonRecommendation from AnswerProcessingService
export interface DirectMiniLessonRecommendation {
  miniLessonId: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: number;
  domainId: number;
  domainName: string;
  priority: number;
  learningObjectives: string[];
  relatedQuestions: string[];
  directConnection: string;
} 