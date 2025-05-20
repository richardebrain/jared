import { db } from "../db";
import { assessments, userProgress } from "@shared/schema";
import { eq, and, desc, lt, gt, sql } from "drizzle-orm";

/**
 * Service for generating personalized learning paths based on assessment results
 */
export class PersonalizationService {
  /**
   * Generate a personalized learning path for a user based on their assessment results
   * Uses the enhanced master question set to create targeted mini-lessons
   * 
   * @param userId The ID of the user to generate a path for
   * @returns An array of personalized learning modules
   */
  static async generatePersonalizedPath(userId: number): Promise<any[]> {
    try {
      // Get user's recent assessment results with incorrect answers
      const recentAssessments = await db.query.assessments.findMany({
        where: and(
          eq(assessments.userId, userId),
          eq(assessments.isCorrect, false)
        ),
        orderBy: [desc(assessments.createdAt)],
        limit: 10, // Look at recent results
      });

      // Group by domains to identify areas of improvement
      const domainWeaknesses: Record<string, { 
        count: number, 
        questions: typeof recentAssessments, 
        domain: string 
      }> = {};

      // Count frequency of incorrect answers by domain
      for (const assessment of recentAssessments) {
        const domain = assessment.domain || 'General';
        
        if (!domainWeaknesses[domain]) {
          domainWeaknesses[domain] = { count: 0, questions: [], domain };
        }
        
        domainWeaknesses[domain].count++;
        domainWeaknesses[domain].questions.push(assessment);
      }

      // Sort domains by weakness (highest count first)
      const sortedWeaknesses = Object.values(domainWeaknesses).sort((a, b) => b.count - a.count);

      // Generate personalized modules based on top weaknesses
      const personalizedModules = [];

      // Take up to 3 weak areas
      for (let i = 0; i < Math.min(sortedWeaknesses.length, 3); i++) {
        const weakness = sortedWeaknesses[i];
        
        // Select up to 3 questions from this domain to create a mini-lesson
        const questionSample = weakness.questions.slice(0, 3);
        
        // Fetch the full question details from our master question set for each missed question
        const moduleQuestions = [];
        for (const question of questionSample) {
          // Try to find the original question from the master set with rich content
          const enrichedQuestion = await this.findEnrichedQuestionContent(
            question.questionId, 
            question.questionText, 
            question.domain
          );
          
          if (enrichedQuestion) {
            moduleQuestions.push(enrichedQuestion);
          }
        }
        
        // Create a mini-module if we have questions with rich content
        if (moduleQuestions.length > 0) {
          personalizedModules.push({
            title: `${weakness.domain} Improvement Path`,
            description: `A personalized mini-lesson to help you improve in ${weakness.domain}`,
            domain: weakness.domain,
            questions: moduleQuestions,
            difficulty: this.calculateModuleDifficulty(moduleQuestions),
            estimatedTimeMinutes: moduleQuestions.length * 5, // Roughly 5 minutes per question
            createdAt: new Date().toISOString(),
          });
        }
      }

      return personalizedModules;
    } catch (error) {
      console.error("Error generating personalized path:", error);
      return [];
    }
  }

  /**
   * Find enriched content for a question from the master question set
   */
  private static async findEnrichedQuestionContent(
    questionId: number, 
    questionText: string,
    domain: string
  ): Promise<any | null> {
    try {
      // Try to find the question in our database first by ID
      const dbQuestion = await db.execute(sql\`
        SELECT * FROM questions 
        WHERE id = \${questionId}
      \`);

      if (dbQuestion && dbQuestion.length > 0) {
        return this.formatQuestionWithEnrichment(dbQuestion[0]);
      }

      // If not found by ID, try to match by text and domain
      const similarQuestions = await db.execute(sql\`
        SELECT * FROM questions 
        WHERE text LIKE '%' || \${questionText.substring(0, 50)} || '%'
        AND domain = \${domain}
        LIMIT 1
      \`);

      if (similarQuestions && similarQuestions.length > 0) {
        return this.formatQuestionWithEnrichment(similarQuestions[0]);
      }

      // If still not found, check our enhanced questions from the JSON files
      // This would be a custom implementation depending on where the enriched data is stored
      const enhancedContent = await this.checkEnhancedContentStore(questionText, domain);
      if (enhancedContent) {
        return enhancedContent;
      }

      return null;
    } catch (error) {
      console.error("Error finding enriched question content:", error);
      return null;
    }
  }

  /**
   * Format a database question with its enrichment content
   */
  private static formatQuestionWithEnrichment(dbQuestion: any): any {
    // Extract option choices from JSON
    let options = {};
    try {
      options = JSON.parse(dbQuestion.options);
    } catch (e) {
      options = {}; // Default if parse fails
    }

    return {
      id: dbQuestion.id,
      question: dbQuestion.text || dbQuestion.question,
      domain: dbQuestion.domain,
      subDomain: dbQuestion.sub_domain || '',
      difficulty: dbQuestion.difficulty,
      options: options,
      correctAnswer: dbQuestion.correct_answer,
      explanation: dbQuestion.explanation || '',
      teachingExplanation: dbQuestion.teaching_explanation || dbQuestion.explanation || '',
      scienceBehindIt: dbQuestion.science_behind_it || '',
      practicalApplication: dbQuestion.practical_application || '',
      whyBehindIt: dbQuestion.why_behind_it || '',
      story: dbQuestion.story || '',
      pointsValue: dbQuestion.points_value || 5,
      sourceId: dbQuestion.id, // Original question ID
    };
  }

  /**
   * Check stored enhanced content from JSON files
   */
  private static async checkEnhancedContentStore(questionText: string, domain: string): Promise<any | null> {
    try {
      // This implementation would depend on how you're storing the enriched data
      // For now, return null as a placeholder
      return null;
    } catch (error) {
      console.error("Error checking enhanced content store:", error);
      return null;
    }
  }

  /**
   * Calculate the overall difficulty of a module based on its questions
   */
  private static calculateModuleDifficulty(questions: any[]): number {
    if (!questions || questions.length === 0) return 1;
    
    const sum = questions.reduce((total, q) => total + (q.difficulty || 1), 0);
    return Math.round(sum / questions.length);
  }

  /**
   * Get a user's progress in personalized modules
   */
  static async getUserModuleProgress(userId: number): Promise<any[]> {
    try {
      const progress = await db.query.userProgress.findMany({
        where: and(
          eq(userProgress.userId, userId),
          eq(userProgress.type, 'personalized_module')
        ),
        orderBy: [desc(userProgress.createdAt)],
      });
      
      return progress;
    } catch (error) {
      console.error("Error getting user module progress:", error);
      return [];
    }
  }
}