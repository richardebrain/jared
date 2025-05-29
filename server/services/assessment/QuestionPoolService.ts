import { db } from '../../db';
import { 
  assessmentQuestions, 
  questionAvailability,
  assessmentResponses,
  users,
  type AssessmentQuestion
} from '@shared/schema';
import { eq, and, sql, isNull, notInArray } from 'drizzle-orm';

export interface QuestionFilterCriteria {
  domainId?: number;
  difficulty?: number;
  schoolId?: number;
  excludeQuestionIds?: string[];
  requireApproval?: boolean;
  requireEnabled?: boolean;
}

export interface QuestionPoolStatistics {
  totalQuestions: number;
  questionsByDomain: Record<number, number>;
  questionsByDifficulty: Record<number, number>;
  availableQuestions: number;
  approvedQuestions: number;
  enabledQuestions: number;
  schoolSpecificQuestions: number;
  questionDistribution: {
    domainId: number;
    domainName?: string;
    questionCount: number;
    difficultyBreakdown: Record<number, number>;
    availability: {
      approved: number;
      enabled: number;
      schoolAvailable: number;
    };
  }[];
}

/**
 * Question Pool Service
 * 
 * Manages question pool availability, filtering, and statistics with dual-level
 * availability control (platform + school level) and approval status validation.
 */
export class QuestionPoolService {

  /**
   * Get available questions for specific domain and difficulty
   */
  async getAvailableQuestions(
    domainId: number,
    difficulty: number,
    userId: number,
    assessmentId: number
  ): Promise<AssessmentQuestion[]> {
    // Get user's school for availability checking
    const user = await db.select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const schoolId = user[0]?.schoolId;

    // Get questions already used in this assessment
    const usedQuestions = await this.getUsedQuestions(assessmentId);

    return this.getQuestionsWithFilters({
      domainId,
      difficulty,
      schoolId: schoolId || undefined,
      excludeQuestionIds: usedQuestions,
      requireApproval: true,
      requireEnabled: true
    });
  }

  /**
   * Get any available questions (fallback when specific criteria fail)
   */
  async getAnyAvailableQuestions(
    userId: number,
    assessmentId: number
  ): Promise<AssessmentQuestion[]> {
    // Get user's school for availability checking
    const user = await db.select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const schoolId = user[0]?.schoolId;

    // Get questions already used in this assessment
    const usedQuestions = await this.getUsedQuestions(assessmentId);

    return this.getQuestionsWithFilters({
      schoolId: schoolId || undefined,
      excludeQuestionIds: usedQuestions,
      requireApproval: true,
      requireEnabled: true
    });
  }

  /**
   * Get questions with comprehensive filtering
   */
  async getQuestionsWithFilters(criteria: QuestionFilterCriteria): Promise<AssessmentQuestion[]> {
    let query = db.select()
      .from(assessmentQuestions);

    // Apply filters
    const conditions = [];

    // Domain filter
    if (criteria.domainId !== undefined) {
      conditions.push(eq(assessmentQuestions.domainId, criteria.domainId.toString()));
    }

    // Difficulty filter
    if (criteria.difficulty !== undefined) {
      conditions.push(eq(assessmentQuestions.difficulty, criteria.difficulty.toString()));
    }

    // Approval filter
    if (criteria.requireApproval) {
      conditions.push(eq(assessmentQuestions.isApproved, true));
    }

    // Platform-level enabled filter
    if (criteria.requireEnabled) {
      conditions.push(eq(assessmentQuestions.isEnabled, true));
    }

    // Exclude specific questions
    if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
      conditions.push(notInArray(assessmentQuestions.id, criteria.excludeQuestionIds));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let questions = await query;

    // Apply school-level availability filtering
    if (criteria.schoolId) {
      questions = await this.filterBySchoolAvailability(questions, criteria.schoolId);
    }

    return questions;
  }

  /**
   * Filter questions by school-level availability
   */
  private async filterBySchoolAvailability(
    questions: AssessmentQuestion[],
    schoolId: number
  ): Promise<AssessmentQuestion[]> {
    if (questions.length === 0) {
      return questions;
    }

    const questionIds = questions.map(q => q.id);

    // Get school-specific availability settings
    const schoolAvailability = await db.select()
      .from(questionAvailability)
      .where(and(
        eq(questionAvailability.schoolId, schoolId),
        sql`${questionAvailability.questionId} = ANY(${questionIds})`
      ));

    // Create availability map
    const availabilityMap = new Map<string, boolean>();
    schoolAvailability.forEach(availability => {
      availabilityMap.set(availability.questionId, availability.isEnabled);
    });

    // Filter questions based on school availability
    // If no school-specific setting exists, default to available
    return questions.filter(question => {
      const schoolSetting = availabilityMap.get(question.id);
      return schoolSetting !== false; // Available unless explicitly disabled
    });
  }

  /**
   * Get questions already used in an assessment
   */
  private async getUsedQuestions(assessmentId: number): Promise<string[]> {
    const responses = await db.select({ questionId: assessmentResponses.questionId })
      .from(assessmentResponses)
      .where(eq(assessmentResponses.assessmentId, assessmentId));

    return responses.map(response => response.questionId);
  }

  /**
   * Get comprehensive question pool statistics
   */
  async getPoolStatistics(schoolId?: number): Promise<QuestionPoolStatistics> {
    // Get basic question counts
    const basicStats = await db.select({
      domainId: assessmentQuestions.domainId,
      difficulty: assessmentQuestions.difficulty,
      isApproved: assessmentQuestions.isApproved,
      isEnabled: assessmentQuestions.isEnabled,
      questionId: assessmentQuestions.id
    })
    .from(assessmentQuestions);

    // Calculate basic statistics
    const totalQuestions = basicStats.length;
    const approvedQuestions = basicStats.filter(q => q.isApproved).length;
    const enabledQuestions = basicStats.filter(q => q.isEnabled).length;
    const availableQuestions = basicStats.filter(q => q.isApproved && q.isEnabled).length;

    // Group by domain
    const questionsByDomain: Record<number, number> = {};
    const questionsByDifficulty: Record<number, number> = {};

    basicStats.forEach(stat => {
      // Domain grouping (parse from text)
      const domainId = parseInt(stat.domainId, 10);
      if (!isNaN(domainId)) {
        questionsByDomain[domainId] = (questionsByDomain[domainId] || 0) + 1;
      }

      // Difficulty grouping (parse from text)
      const difficulty = parseInt(stat.difficulty, 10);
      if (!isNaN(difficulty)) {
        questionsByDifficulty[difficulty] = (questionsByDifficulty[difficulty] || 0) + 1;
      }
    });

    // Get school-specific availability if schoolId provided
    let schoolSpecificQuestions = 0;
    let schoolAvailabilityMap = new Map<string, boolean>();

    if (schoolId) {
      const schoolAvailability = await db.select()
        .from(questionAvailability)
        .where(eq(questionAvailability.schoolId, schoolId));

      schoolSpecificQuestions = schoolAvailability.length;
      schoolAvailability.forEach(availability => {
        schoolAvailabilityMap.set(availability.questionId, availability.isEnabled);
      });
    }

    // Calculate detailed distribution per domain
    const domainDistribution = new Map<number, {
      questionCount: number;
      difficultyBreakdown: Record<number, number>;
      availability: { approved: number; enabled: number; schoolAvailable: number };
    }>();

    basicStats.forEach(stat => {
      const domainId = parseInt(stat.domainId, 10);
      const difficulty = parseInt(stat.difficulty, 10);
      
      if (isNaN(domainId) || isNaN(difficulty)) return;

      if (!domainDistribution.has(domainId)) {
        domainDistribution.set(domainId, {
          questionCount: 0,
          difficultyBreakdown: {},
          availability: { approved: 0, enabled: 0, schoolAvailable: 0 }
        });
      }

      const domainData = domainDistribution.get(domainId)!;
      domainData.questionCount++;
      domainData.difficultyBreakdown[difficulty] = (domainData.difficultyBreakdown[difficulty] || 0) + 1;

      if (stat.isApproved) {
        domainData.availability.approved++;
      }
      if (stat.isEnabled) {
        domainData.availability.enabled++;
      }

      // Check school availability
      const schoolSetting = schoolAvailabilityMap.get(stat.questionId);
      if (schoolSetting !== false) { // Available unless explicitly disabled
        domainData.availability.schoolAvailable++;
      }
    });

    // Convert to final format
    const questionDistribution = Array.from(domainDistribution.entries()).map(([domainId, data]) => ({
      domainId,
      questionCount: data.questionCount,
      difficultyBreakdown: data.difficultyBreakdown,
      availability: data.availability
    }));

    return {
      totalQuestions,
      questionsByDomain,
      questionsByDifficulty,
      availableQuestions,
      approvedQuestions,
      enabledQuestions,
      schoolSpecificQuestions,
      questionDistribution
    };
  }

  /**
   * Check if sufficient questions are available for assessment
   */
  async validateQuestionPoolAdequacy(
    schoolId: number | null,
    requiredQuestions: number,
    domainWeights: Map<number, number>
  ): Promise<{
    isAdequate: boolean;
    totalAvailable: number;
    shortfall: number;
    domainIssues: Array<{
      domainId: number;
      required: number;
      available: number;
      shortfall: number;
    }>;
    recommendations: string[];
  }> {
    const stats = await this.getPoolStatistics(schoolId || undefined);
    const recommendations: string[] = [];
    const domainIssues: Array<{
      domainId: number;
      required: number;
      available: number;
      shortfall: number;
    }> = [];

    // Check overall adequacy
    const totalAvailable = stats.availableQuestions;
    const overallShortfall = Math.max(0, requiredQuestions - totalAvailable);

    // Check domain-specific adequacy
    const totalWeight = Array.from(domainWeights.values()).reduce((sum, weight) => sum + weight, 0);
    
    for (const [domainId, weight] of domainWeights.entries()) {
      const requiredForDomain = Math.ceil((weight / totalWeight) * requiredQuestions);
      const availableForDomain = stats.questionsByDomain[domainId] || 0;
      const domainShortfall = Math.max(0, requiredForDomain - availableForDomain);

      if (domainShortfall > 0) {
        domainIssues.push({
          domainId,
          required: requiredForDomain,
          available: availableForDomain,
          shortfall: domainShortfall
        });
        recommendations.push(`Add ${domainShortfall} more questions for domain ${domainId}`);
      }
    }

    // General recommendations
    if (overallShortfall > 0) {
      recommendations.push(`Add ${overallShortfall} more questions overall`);
    }

    if (totalAvailable < requiredQuestions * 2) {
      recommendations.push('Consider expanding question pool for better variety');
    }

    return {
      isAdequate: overallShortfall === 0 && domainIssues.length === 0,
      totalAvailable,
      shortfall: overallShortfall,
      domainIssues,
      recommendations
    };
  }

  /**
   * Get questions by domain and difficulty for analysis
   */
  async getQuestionBreakdown(schoolId?: number): Promise<{
    [domainId: number]: {
      [difficulty: number]: {
        total: number;
        approved: number;
        enabled: number;
        available: number;
      };
    };
  }> {
    const questions = await this.getQuestionsWithFilters({
      schoolId,
      requireApproval: false,
      requireEnabled: false
    });

    const breakdown: { [domainId: number]: { [difficulty: number]: { total: number; approved: number; enabled: number; available: number } } } = {};

    questions.forEach(question => {
      const domainId = parseInt(question.domainId, 10);
      const difficulty = parseInt(question.difficulty, 10);

      if (isNaN(domainId) || isNaN(difficulty)) return;

      if (!breakdown[domainId]) {
        breakdown[domainId] = {};
      }
      if (!breakdown[domainId][difficulty]) {
        breakdown[domainId][difficulty] = {
          total: 0,
          approved: 0,
          enabled: 0,
          available: 0
        };
      }

      const difficultyData = breakdown[domainId][difficulty];
      difficultyData.total++;

      if (question.isApproved) {
        difficultyData.approved++;
      }
      if (question.isEnabled) {
        difficultyData.enabled++;
      }
      if (question.isApproved && question.isEnabled) {
        difficultyData.available++;
      }
    });

    return breakdown;
  }

  /**
   * Update question availability for a school
   */
  async updateQuestionAvailability(
    questionId: string,
    schoolId: number,
    isEnabled: boolean,
    updatedBy: number
  ): Promise<void> {
    // Check if availability setting already exists
    const existing = await db.select()
      .from(questionAvailability)
      .where(and(
        eq(questionAvailability.questionId, questionId),
        eq(questionAvailability.schoolId, schoolId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing setting
      await db.update(questionAvailability)
        .set({
          isEnabled,
          enabledBy: updatedBy,
          updatedAt: new Date()
        })
        .where(and(
          eq(questionAvailability.questionId, questionId),
          eq(questionAvailability.schoolId, schoolId)
        ));
    } else {
      // Create new setting
      await db.insert(questionAvailability)
        .values({
          questionId,
          schoolId,
          isEnabled,
          enabledBy: updatedBy,
          updatedAt: new Date()
        });
    }
  }

  /**
   * Bulk update question availability for a school
   */
  async bulkUpdateQuestionAvailability(
    updates: Array<{
      questionId: string;
      isEnabled: boolean;
    }>,
    schoolId: number,
    updatedBy: number
  ): Promise<{ updated: number; created: number; errors: string[] }> {
    const results = { updated: 0, created: 0, errors: [] as string[] };

    for (const update of updates) {
      try {
        await this.updateQuestionAvailability(
          update.questionId,
          schoolId,
          update.isEnabled,
          updatedBy
        );
        
        // Check if it was an update or create (simplified)
        const existing = await db.select()
          .from(questionAvailability)
          .where(and(
            eq(questionAvailability.questionId, update.questionId),
            eq(questionAvailability.schoolId, schoolId)
          ))
          .limit(1);

        if (existing.length > 0) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        results.errors.push(`Failed to update question ${update.questionId}: ${error.message}`);
      }
    }

    return results;
  }
} 