import { db } from '../../db';
import { 
  assessmentQuestions, 
  assessmentDomains,
  questionAvailability,
  users,
  type AssessmentQuestion,
  type AssessmentDomain,
  type QuestionAvailability,
  type InsertAssessmentQuestion,
  type InsertQuestionAvailability
} from '@shared/schema';
import { eq, and, or, like, desc, asc, count, sql, SQL } from 'drizzle-orm';
import { z } from 'zod';

// Input validation schemas
export const CreateQuestionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  domainId: z.string().min(1, "Domain ID is required"),
  text: z.string().min(10, "Question text must be at least 10 characters"),
  options: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length >= 2 && parsed.length <= 6;
      } catch {
        return false;
      }
    },
    "Options must be a valid JSON array with 2-6 items"
  ),
  correctAnswer: z.number().min(0, "Correct answer index must be 0 or greater"),
  difficulty: z.string().min(1, "Difficulty is required"),
  explanation: z.string().optional(),
  miniLesson: z.string().optional(),
  tags: z.string().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial().omit({ id: true });

export const QuestionFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  domainId: z.string().optional(),
  difficulty: z.string().optional(),
  isApproved: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  createdBy: z.number().optional(),
  search: z.string().optional(),
});

export type QuestionFilters = z.infer<typeof QuestionFiltersSchema>;

export interface QuestionWithMetadata extends AssessmentQuestion {
  domainName?: string;
  createdByName?: string;
  approvedByName?: string;
  totalResponses?: number;
  correctRate?: number;
}

export interface PaginatedQuestions {
  questions: QuestionWithMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class QuestionManagementService {
  
  /**
   * Get all questions with filtering, pagination, and metadata
   */
  async getQuestions(filters: QuestionFilters): Promise<PaginatedQuestions> {
    try {
      const { page, limit, sortBy, sortOrder, ...searchFilters } = filters;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions: (SQL | undefined)[] = [];
      
      if (searchFilters.domainId) {
        whereConditions.push(eq(assessmentQuestions.domainId, searchFilters.domainId));
      }
      
      if (searchFilters.difficulty) {
        whereConditions.push(eq(assessmentQuestions.difficulty, searchFilters.difficulty));
      }
      
      if (searchFilters.isApproved !== undefined) {
        whereConditions.push(eq(assessmentQuestions.isApproved, searchFilters.isApproved));
      }
      
      if (searchFilters.isEnabled !== undefined) {
        whereConditions.push(eq(assessmentQuestions.isEnabled, searchFilters.isEnabled));
      }
      
      if (searchFilters.createdBy) {
        whereConditions.push(eq(assessmentQuestions.createdBy, searchFilters.createdBy));
      }
      
      if (searchFilters.search) {
        whereConditions.push(
          or(
            like(assessmentQuestions.text, `%${searchFilters.search}%`),
            like(assessmentQuestions.explanation, `%${searchFilters.search}%`),
            like(assessmentQuestions.miniLesson, `%${searchFilters.search}%`),
            like(assessmentQuestions.tags, `%${searchFilters.search}%`)
          )
        );
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions.filter(Boolean)) : undefined;

      // Build order by clause - ensure the column exists
      const validSortColumns = ['createdAt', 'updatedAt', 'difficulty', 'isApproved', 'isEnabled'] as const;
      const sortColumn = validSortColumns.includes(sortBy as any) ? sortBy : 'createdAt';
      const orderBy = sortOrder === 'asc' 
        ? asc(assessmentQuestions[sortColumn]) 
        : desc(assessmentQuestions[sortColumn]);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(assessmentQuestions)
        .where(whereClause);

      const total = countResult.count;

      // Get questions with metadata
      const questions = await db
        .select({
          // Question fields
          id: assessmentQuestions.id,
          domainId: assessmentQuestions.domainId,
          text: assessmentQuestions.text,
          options: assessmentQuestions.options,
          correctAnswer: assessmentQuestions.correctAnswer,
          difficulty: assessmentQuestions.difficulty,
          explanation: assessmentQuestions.explanation,
          miniLesson: assessmentQuestions.miniLesson,
          tags: assessmentQuestions.tags,
          createdBy: assessmentQuestions.createdBy,
          approvedBy: assessmentQuestions.approvedBy,
          isApproved: assessmentQuestions.isApproved,
          isEnabled: assessmentQuestions.isEnabled,
          createdAt: assessmentQuestions.createdAt,
          updatedAt: assessmentQuestions.updatedAt,
          // Metadata fields
          domainName: assessmentDomains.name,
          createdByFirstName: users.firstName,
          createdByLastName: users.lastName,
        })
        .from(assessmentQuestions)
        .leftJoin(assessmentDomains, eq(assessmentQuestions.domainId, assessmentDomains.name))
        .leftJoin(users, eq(assessmentQuestions.createdBy, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Transform the results to include derived fields
      const transformedQuestions: QuestionWithMetadata[] = questions.map(q => ({
        ...q,
        createdByName: q.createdByFirstName && q.createdByLastName 
          ? `${q.createdByFirstName} ${q.createdByLastName}` 
          : undefined,
      }));

      return {
        questions: transformedQuestions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting questions:', error);
      throw new Error('Failed to retrieve questions');
    }
  }

  /**
   * Get a single question by ID with metadata
   */
  async getQuestionById(id: string): Promise<QuestionWithMetadata | null> {
    try {
      const [question] = await db
        .select({
          // Question fields
          id: assessmentQuestions.id,
          domainId: assessmentQuestions.domainId,
          text: assessmentQuestions.text,
          options: assessmentQuestions.options,
          correctAnswer: assessmentQuestions.correctAnswer,
          difficulty: assessmentQuestions.difficulty,
          explanation: assessmentQuestions.explanation,
          miniLesson: assessmentQuestions.miniLesson,
          tags: assessmentQuestions.tags,
          createdBy: assessmentQuestions.createdBy,
          approvedBy: assessmentQuestions.approvedBy,
          isApproved: assessmentQuestions.isApproved,
          isEnabled: assessmentQuestions.isEnabled,
          createdAt: assessmentQuestions.createdAt,
          updatedAt: assessmentQuestions.updatedAt,
          // Metadata fields
          domainName: assessmentDomains.name,
          createdByFirstName: users.firstName,
          createdByLastName: users.lastName,
        })
        .from(assessmentQuestions)
        .leftJoin(assessmentDomains, eq(assessmentQuestions.domainId, assessmentDomains.name))
        .leftJoin(users, eq(assessmentQuestions.createdBy, users.id))
        .where(eq(assessmentQuestions.id, id));

      if (!question) return null;

      // Transform the result to include derived fields
      const transformedQuestion: QuestionWithMetadata = {
        ...question,
        createdByName: question.createdByFirstName && question.createdByLastName 
          ? `${question.createdByFirstName} ${question.createdByLastName}` 
          : undefined,
      };

      return transformedQuestion;
    } catch (error) {
      console.error('Error getting question by ID:', error);
      throw new Error('Failed to retrieve question');
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(questionData: z.infer<typeof CreateQuestionSchema>, createdBy: number): Promise<AssessmentQuestion> {
    try {
      // Validate input data
      const validatedData = CreateQuestionSchema.parse(questionData);

      // Validate that correct answer index is within options range
      const options = JSON.parse(validatedData.options);
      if (validatedData.correctAnswer >= options.length) {
        throw new Error('Correct answer index is out of range for provided options');
      }

      // Check if question ID already exists
      const existing = await this.getQuestionById(validatedData.id);
      if (existing) {
        throw new Error('Question with this ID already exists');
      }

      // Verify domain exists (since we're using domain names as IDs)
      const [domain] = await db
        .select()
        .from(assessmentDomains)
        .where(eq(assessmentDomains.name, validatedData.domainId));
      
      if (!domain) {
        throw new Error('Invalid domain ID');
      }

      // Create the question
      const [newQuestion] = await db
        .insert(assessmentQuestions)
        .values({
          ...validatedData,
          createdBy,
          isApproved: false, // New questions need approval
          isEnabled: true, // Enabled by default, but not approved
        })
        .returning();

      return newQuestion;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      console.error('Error creating question:', error);
      throw error instanceof Error ? error : new Error('Failed to create question');
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(id: string, updateData: z.infer<typeof UpdateQuestionSchema>, updatedBy: number): Promise<AssessmentQuestion> {
    try {
      // Validate input data
      const validatedData = UpdateQuestionSchema.parse(updateData);

      // Check if question exists
      const existing = await this.getQuestionById(id);
      if (!existing) {
        throw new Error('Question not found');
      }

      // Validate correct answer if options are being updated
      if (validatedData.options && validatedData.correctAnswer !== undefined) {
        const options = JSON.parse(validatedData.options);
        if (validatedData.correctAnswer >= options.length) {
          throw new Error('Correct answer index is out of range for provided options');
        }
      } else if (validatedData.options) {
        // If only options are updated, validate against existing correct answer
        const options = JSON.parse(validatedData.options);
        if (existing.correctAnswer >= options.length) {
          throw new Error('Existing correct answer index is out of range for new options');
        }
      } else if (validatedData.correctAnswer !== undefined) {
        // If only correct answer is updated, validate against existing options
        const options = JSON.parse(existing.options);
        if (validatedData.correctAnswer >= options.length) {
          throw new Error('Correct answer index is out of range for existing options');
        }
      }

      // Verify domain exists if domain is being updated
      if (validatedData.domainId) {
        const [domain] = await db
          .select()
          .from(assessmentDomains)
          .where(eq(assessmentDomains.name, validatedData.domainId));
        
        if (!domain) {
          throw new Error('Invalid domain ID');
        }
      }

      // Update the question
      const [updatedQuestion] = await db
        .update(assessmentQuestions)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(assessmentQuestions.id, id))
        .returning();

      return updatedQuestion;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      console.error('Error updating question:', error);
      throw error instanceof Error ? error : new Error('Failed to update question');
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    try {
      // Check if question exists
      const existing = await this.getQuestionById(id);
      if (!existing) {
        throw new Error('Question not found');
      }

      // Delete related availability records first
      await db
        .delete(questionAvailability)
        .where(eq(questionAvailability.questionId, id));

      // Delete the question
      await db
        .delete(assessmentQuestions)
        .where(eq(assessmentQuestions.id, id));

    } catch (error) {
      console.error('Error deleting question:', error);
      throw error instanceof Error ? error : new Error('Failed to delete question');
    }
  }

  /**
   * Approve or reject a question
   */
  async updateQuestionApproval(id: string, isApproved: boolean, approvedBy: number): Promise<AssessmentQuestion> {
    try {
      // Check if question exists
      const existing = await this.getQuestionById(id);
      if (!existing) {
        throw new Error('Question not found');
      }

      // Update approval status
      const [updatedQuestion] = await db
        .update(assessmentQuestions)
        .set({
          isApproved,
          approvedBy: isApproved ? approvedBy : null,
          updatedAt: new Date(),
        })
        .where(eq(assessmentQuestions.id, id))
        .returning();

      return updatedQuestion;
    } catch (error) {
      console.error('Error updating question approval:', error);
      throw error instanceof Error ? error : new Error('Failed to update question approval');
    }
  }

  /**
   * Update question availability (platform or school level)
   */
  async updateQuestionAvailability(
    questionId: string, 
    isEnabled: boolean, 
    schoolId: number | null, 
    enabledBy: number
  ): Promise<QuestionAvailability> {
    try {
      // Check if question exists
      const existing = await this.getQuestionById(questionId);
      if (!existing) {
        throw new Error('Question not found');
      }

      // Check if availability record exists
      const [existingAvailability] = await db
        .select()
        .from(questionAvailability)
        .where(
          and(
            eq(questionAvailability.questionId, questionId),
            schoolId ? eq(questionAvailability.schoolId, schoolId) : sql`school_id IS NULL`
          )
        );

      if (existingAvailability) {
        // Update existing availability record
        const [updated] = await db
          .update(questionAvailability)
          .set({
            isEnabled,
            enabledBy,
            updatedAt: new Date(),
          })
          .where(eq(questionAvailability.id, existingAvailability.id))
          .returning();

        return updated;
      } else {
        // Create new availability record
        const [created] = await db
          .insert(questionAvailability)
          .values({
            questionId,
            schoolId,
            isEnabled,
            enabledBy,
          })
          .returning();

        return created;
      }
    } catch (error) {
      console.error('Error updating question availability:', error);
      throw error instanceof Error ? error : new Error('Failed to update question availability');
    }
  }

  /**
   * Get all domains
   */
  async getDomains(): Promise<AssessmentDomain[]> {
    try {
      const domains = await db
        .select()
        .from(assessmentDomains)
        .where(eq(assessmentDomains.isActive, true))
        .orderBy(asc(assessmentDomains.displayOrder));

      return domains;
    } catch (error) {
      console.error('Error getting domains:', error);
      throw new Error('Failed to retrieve domains');
    }
  }

  /**
   * Get domain statistics (question counts)
   */
  async getDomainStatistics(): Promise<Array<AssessmentDomain & { questionCount: number; approvedCount: number }>> {
    try {
      const domainsWithStats = await db
        .select({
          // Domain fields
          id: assessmentDomains.id,
          name: assessmentDomains.name,
          description: assessmentDomains.description,
          questionWeight: assessmentDomains.questionWeight,
          displayOrder: assessmentDomains.displayOrder,
          isActive: assessmentDomains.isActive,
          createdAt: assessmentDomains.createdAt,
          updatedAt: assessmentDomains.updatedAt,
          // Statistics
          questionCount: sql<number>`count(${assessmentQuestions.id})`,
          approvedCount: sql<number>`count(case when ${assessmentQuestions.isApproved} = true then 1 end)`,
        })
        .from(assessmentDomains)
        .leftJoin(assessmentQuestions, eq(assessmentDomains.name, assessmentQuestions.domainId))
        .where(eq(assessmentDomains.isActive, true))
        .groupBy(assessmentDomains.id)
        .orderBy(asc(assessmentDomains.displayOrder));

      return domainsWithStats;
    } catch (error) {
      console.error('Error getting domain statistics:', error);
      throw new Error('Failed to retrieve domain statistics');
    }
  }

  /**
   * Bulk approve questions
   */
  async bulkApproveQuestions(questionIds: string[], approvedBy: number): Promise<number> {
    try {
      if (questionIds.length === 0) {
        return 0;
      }

      const result = await db
        .update(assessmentQuestions)
        .set({
          isApproved: true,
          approvedBy,
          updatedAt: new Date(),
        })
        .where(sql`${assessmentQuestions.id} = ANY(${questionIds})`);

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error bulk approving questions:', error);
      throw new Error('Failed to bulk approve questions');
    }
  }

  /**
   * Bulk update question availability
   */
  async bulkUpdateAvailability(
    questionIds: string[], 
    isEnabled: boolean, 
    schoolId: number | null, 
    enabledBy: number
  ): Promise<number> {
    try {
      if (questionIds.length === 0) {
        return 0;
      }

      let updatedCount = 0;

      // Process each question individually to handle upsert logic
      for (const questionId of questionIds) {
        await this.updateQuestionAvailability(questionId, isEnabled, schoolId, enabledBy);
        updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error('Error bulk updating availability:', error);
      throw new Error('Failed to bulk update availability');
    }
  }
} 