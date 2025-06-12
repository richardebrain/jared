import { db } from '../../db';
import { 
  learningPaths,
  assessmentResponses,
  assessmentQuestions,
  assessmentDomains,
  type InsertLearningPath,
  type LearningPath,
  type AssessmentQuestion,
  type AssessmentDomain
} from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Learning Path Service for EP-001-10
 * 
 * Creates sophisticated learning paths based on failed questions with:
 * 1. Domain grouping by importance (weights from DB)
 * 2. Within-domain sorting by difficulty (lowest first)
 * 3. Structured storage for UI presentation
 * 4. Automatic generation after assessment completion
 */
export class LearningPathService {

  /**
   * Generate enhanced learning path for failed questions
   * 
   * @param assessmentId - Completed assessment ID
   * @param userId - User who took the assessment
   * @returns Generated learning path data
   */
  async generateLearningPath(assessmentId: number, userId: number): Promise<EnhancedLearningPathResult> {
    try {
      console.log(`Generating learning path for assessment ${assessmentId}, user ${userId}`);

      // Step 1: Get all failed questions (incorrect + timeouts) with mini-lessons only
      const failedQuestions = await this.getFailedQuestionsWithMiniLessons(assessmentId);
      
      if (failedQuestions.length === 0) {
        console.log('No failed questions with mini-lessons found');
        return this.createEmptyLearningPath(assessmentId, userId);
      }

      // Step 2: Group failed questions by domains
      const domainGroups = await this.groupQuestionsByDomains(failedQuestions);

      // Step 3: Sort domain groups by importance (weights in DB)
      const sortedDomainGroups = await this.sortDomainsByWeight(domainGroups);

      // Step 4: Within each domain, sort mini-lessons by difficulty (lowest first)
      const finalDomainGroups = this.sortMiniLessonsByDifficulty(sortedDomainGroups);

      // Step 5: Calculate totals and estimated completion time
      const totals = this.calculateTotals(finalDomainGroups);

      // Step 6: Store learning path (handle updates for retakes)
      const learningPathData: InsertLearningPath = {
        assessmentId,
        userId,
        domainGroups: finalDomainGroups,
        totalFailedQuestions: totals.totalFailedQuestions,
        totalDomains: totals.totalDomains,
        estimatedCompletionTime: totals.estimatedCompletionTime
      };

      const savedLearningPath = await this.saveLearningPath(learningPathData);

      console.log(`Learning path generated successfully: ${finalDomainGroups.length} domains, ${totals.totalFailedQuestions} failed questions`);

      return {
        success: true,
        learningPath: savedLearningPath,
        domainGroups: finalDomainGroups,
        totals,
        message: 'Enhanced learning path generated successfully'
      };

    } catch (error) {
      console.error('Error generating learning path:', error);
      return {
        success: false,
        learningPath: null,
        domainGroups: [],
        totals: { totalFailedQuestions: 0, totalDomains: 0, estimatedCompletionTime: 0 },
        message: `Learning path generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all failed questions that have mini-lessons
   */
  private async getFailedQuestionsWithMiniLessons(assessmentId: number): Promise<FailedQuestionWithMiniLesson[]> {
    const failedResponses = await db.select({
      questionId: assessmentResponses.questionId,
      isCorrect: assessmentResponses.isCorrect,
      timedOut: assessmentResponses.timedOut,
      difficulty: assessmentResponses.difficulty,
      domainId: assessmentResponses.domainId,
      miniLesson: assessmentQuestions.miniLesson,
    })
    .from(assessmentResponses)
    .innerJoin(assessmentQuestions, eq(assessmentResponses.questionId, assessmentQuestions.id))
    .where(
      and(
        eq(assessmentResponses.assessmentId, assessmentId),
        eq(assessmentResponses.isCorrect, false), // Failed questions (incorrect + timeouts)
        // Only questions with mini-lessons
        // Note: miniLesson field is expected to be non-null/non-empty for questions with mini-lessons
      )
    );

    // Filter out questions without mini-lessons
    const questionsWithMiniLessons = failedResponses.filter(response => 
      response.miniLesson && response.miniLesson.trim().length > 0
    );

    return questionsWithMiniLessons.map(response => ({
      questionId: response.questionId,
      difficulty: this.parseDifficulty(response.difficulty),
      domainId: this.parseDomainId(response.domainId),
      miniLessonId: response.questionId, // Use question ID as mini-lesson reference
      estimatedDuration: 15, // Default 15 minutes since field doesn't exist in schema
      isTimeout: response.timedOut || false
    }));
  }

  /**
   * Group failed questions by domains
   */
  private async groupQuestionsByDomains(
    failedQuestions: FailedQuestionWithMiniLesson[]
  ): Promise<Map<number, DomainGroupData>> {
    const domainGroups = new Map<number, DomainGroupData>();

    if (!failedQuestions || failedQuestions.length === 0) {
      console.log('No failed questions to group by domains');
      return domainGroups;
    }

    // Get unique domain IDs with null/undefined safety
    const domainIds = [...new Set(failedQuestions
      .map(q => q?.domainId)
      .filter(id => id !== null && id !== undefined && !isNaN(id))
    )];
    
    if (domainIds.length === 0) {
      console.log('No valid domain IDs found in failed questions');
      return domainGroups;
    }
    
    // Load domain information
    const domains = await db.select()
      .from(assessmentDomains)
      .where(inArray(assessmentDomains.id, domainIds));

    if (!domains || domains.length === 0) {
      console.log('No domains found in database for the provided IDs');
      return domainGroups;
    }

    // Create domain groups with proper null/undefined checks
    for (const domain of domains) {
      if (!domain || typeof domain.id !== 'number') {
        console.warn('Invalid domain data:', domain);
        continue;
      }

      const domainQuestions = failedQuestions.filter(q => 
        q && q.domainId === domain.id
      );
      
      if (domainQuestions.length === 0) {
        continue;
      }
      
      domainGroups.set(domain.id, {
        domainId: domain.id,
        domainName: domain.name || `Domain ${domain.id}`,
        domainWeight: domain.questionWeight || 1,
        failedQuestionsCount: domainQuestions.length,
        miniLessons: domainQuestions
          .filter(q => q.questionId && q.miniLessonId) // Ensure required fields exist
          .map(q => ({
            questionId: q.questionId,
            difficulty: q.difficulty || 1,
            miniLessonId: q.miniLessonId,
            estimatedDuration: q.estimatedDuration || 15
          }))
      });
    }

    console.log(`Grouped failed questions into ${domainGroups.size} domains`);
    return domainGroups;
  }

  /**
   * Sort domain groups by weight (descending - highest importance first)
   */
  private async sortDomainsByWeight(
    domainGroups: Map<number, DomainGroupData>
  ): Promise<DomainGroupData[]> {
    if (!domainGroups || !(domainGroups instanceof Map)) {
      console.warn('Invalid domainGroups Map provided to sortDomainsByWeight');
      return [];
    }

    const domainArray = Array.from(domainGroups.values()).filter(domain => 
      domain && typeof domain.domainWeight === 'number'
    );
    
    // Sort by weight descending (highest importance first)
    return domainArray.sort((a, b) => {
      const weightA = a?.domainWeight || 0;
      const weightB = b?.domainWeight || 0;
      return weightB - weightA;
    });
  }

  /**
   * Within each domain, sort mini-lessons by difficulty (ascending - easiest first)
   */
  private sortMiniLessonsByDifficulty(domainGroups: DomainGroupData[]): DomainGroupData[] {
    if (!domainGroups || !Array.isArray(domainGroups)) {
      console.warn('Invalid domainGroups array provided to sortMiniLessonsByDifficulty');
      return [];
    }

    return domainGroups.map(domainGroup => {
      if (!domainGroup || !Array.isArray(domainGroup.miniLessons)) {
        console.warn('Invalid domain group or miniLessons in sortMiniLessonsByDifficulty:', domainGroup);
        return {
          ...domainGroup,
          miniLessons: []
        };
      }

      return {
        ...domainGroup,
        miniLessons: domainGroup.miniLessons
          .filter(lesson => lesson && typeof lesson.difficulty === 'number')
          .sort((a, b) => (a?.difficulty || 0) - (b?.difficulty || 0))
      };
    });
  }

  /**
   * Calculate totals and estimated completion time
   */
  private calculateTotals(domainGroups: DomainGroupData[]): LearningPathTotals {
    if (!domainGroups || !Array.isArray(domainGroups)) {
      console.warn('Invalid domainGroups provided to calculateTotals:', domainGroups);
      return {
        totalFailedQuestions: 0,
        totalDomains: 0,
        estimatedCompletionTime: 0
      };
    }

    const totalFailedQuestions = domainGroups.reduce(
      (sum, domain) => {
        if (!domain || typeof domain.failedQuestionsCount !== 'number') {
          console.warn('Invalid domain in calculateTotals:', domain);
          return sum;
        }
        return sum + domain.failedQuestionsCount;
      }, 
      0
    );
    
    const totalDomains = domainGroups.length;
    
    const estimatedCompletionTime = domainGroups.reduce(
      (sum, domain) => {
        if (!domain || !Array.isArray(domain.miniLessons)) {
          console.warn('Invalid domain miniLessons in calculateTotals:', domain);
          return sum;
        }
        return sum + domain.miniLessons.reduce(
          (domainSum, lesson) => {
            if (!lesson || typeof lesson.estimatedDuration !== 'number') {
              console.warn('Invalid lesson in calculateTotals:', lesson);
              return domainSum;
            }
            return domainSum + lesson.estimatedDuration;
          }, 
          0
        );
      }, 
      0
    );

    return {
      totalFailedQuestions,
      totalDomains,
      estimatedCompletionTime
    };
  }

  /**
   * Save learning path to database (handle updates for retakes)
   */
  private async saveLearningPath(learningPathData: InsertLearningPath): Promise<LearningPath> {
    // Check if learning path already exists for this assessment
    const existingPath = await db.select()
      .from(learningPaths)
      .where(eq(learningPaths.assessmentId, learningPathData.assessmentId))
      .limit(1);

    if (existingPath.length > 0) {
      // Update existing learning path
      const [updatedPath] = await db.update(learningPaths)
        .set({
          domainGroups: learningPathData.domainGroups,
          totalFailedQuestions: learningPathData.totalFailedQuestions,
          totalDomains: learningPathData.totalDomains,
          estimatedCompletionTime: learningPathData.estimatedCompletionTime,
          updatedAt: new Date()
        })
        .where(eq(learningPaths.assessmentId, learningPathData.assessmentId))
        .returning();

      return updatedPath;
    } else {
      // Insert new learning path
      const [newPath] = await db.insert(learningPaths)
        .values(learningPathData)
        .returning();

      return newPath;
    }
  }

  /**
   * Create empty learning path for assessments with no failed questions
   */
  private async createEmptyLearningPath(assessmentId: number, userId: number): Promise<EnhancedLearningPathResult> {
    const emptyLearningPathData: InsertLearningPath = {
      assessmentId,
      userId,
      domainGroups: [],
      totalFailedQuestions: 0,
      totalDomains: 0,
      estimatedCompletionTime: 0
    };

    const savedLearningPath = await this.saveLearningPath(emptyLearningPathData);

    return {
      success: true,
      learningPath: savedLearningPath,
      domainGroups: [],
      totals: { totalFailedQuestions: 0, totalDomains: 0, estimatedCompletionTime: 0 },
      message: 'Perfect assessment! No learning path needed.'
    };
  }

  /**
   * Get existing learning path for an assessment
   */
  async getLearningPath(assessmentId: number): Promise<LearningPath | null> {
    const paths = await db.select()
      .from(learningPaths)
      .where(eq(learningPaths.assessmentId, assessmentId))
      .limit(1);

    return paths.length > 0 ? paths[0] : null;
  }

  /**
   * Helper method to parse difficulty from string to number
   */
  private parseDifficulty(difficulty: string | number): number {
    if (typeof difficulty === 'number') return difficulty;
    
    const difficultyMap: Record<string, number> = {
      'Easy': 1,
      'Beginner': 2,
      'Intermediate': 3,
      'Proficient': 4,
      'Advanced': 5,
      'Master': 6
    };
    
    return difficultyMap[difficulty] || 3; // Default to Intermediate
  }

  /**
   * Helper method to parse domain ID from string/number to number (handle both types safely)
   */
  private parseDomainId(domainId: string | number | null | undefined): number {
    // Handle null/undefined cases
    if (domainId === null || domainId === undefined) {
      console.warn('LearningPathService.parseDomainId received null/undefined, defaulting to domain 1');
      return 1;
    }

    // If already a number, return it
    if (typeof domainId === 'number') {
      return isNaN(domainId) ? 1 : domainId;
    }

    // If it's a string, try parsing as number first
    if (typeof domainId === 'string') {
      const numericId = parseInt(domainId, 10);
      if (!isNaN(numericId)) {
        return numericId;
      }
    }

    // Fallback for any other type or parsing failure
    console.warn('LearningPathService.parseDomainId received unexpected type or failed parsing:', typeof domainId, domainId);
    return 1; // Default to 1 if parsing fails
  }
}

// Types for Learning Path Service
export interface FailedQuestionWithMiniLesson {
  questionId: string;
  difficulty: number;
  domainId: number;
  miniLessonId: string;
  estimatedDuration: number;
  isTimeout: boolean;
}

export interface DomainGroupData {
  domainId: number;
  domainName: string;
  domainWeight: number;
  failedQuestionsCount: number;
  miniLessons: Array<{
    questionId: string;
    difficulty: number;
    miniLessonId: string;
    estimatedDuration: number;
  }>;
}

export interface LearningPathTotals {
  totalFailedQuestions: number;
  totalDomains: number;
  estimatedCompletionTime: number;
}

export interface EnhancedLearningPathResult {
  success: boolean;
  learningPath: LearningPath | null;
  domainGroups: DomainGroupData[];
  totals: LearningPathTotals;
  message: string;
} 