import { db } from '../db';
import { assessments, assessmentQuestions, users } from '@shared/schema';
import { eq, and, desc, sql, not, inArray } from 'drizzle-orm';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

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
      // Get the user's most recent assessment results
      const userAssessments = await db.query.assessments.findMany({
        where: eq(assessments.userId, userId),
        orderBy: [desc(assessments.createdAt)],
        limit: 3 // Get the 3 most recent assessments
      });
      
      if (!userAssessments || userAssessments.length === 0) {
        return [];
      }

      // Group questions by domain to create focused mini-lessons
      const domainQuestions: Record<string, any[]> = {};
      
      // Process each assessment's incorrect answers
      for (const assessment of userAssessments) {
        if (!assessment.incorrectAnswers) continue;
        
        // incorrectAnswers is stored as a Record<string, string[]>
        // where the key is the domain and the value is an array of question IDs
        const incorrectAnswersByDomain = assessment.incorrectAnswers;
        
        for (const domain in incorrectAnswersByDomain) {
          const questionIds = incorrectAnswersByDomain[domain];
          
          if (!questionIds || questionIds.length === 0) continue;
          
          // Initialize the domain group if it doesn't exist
          if (!domainQuestions[domain]) {
            domainQuestions[domain] = [];
          }
          
          // Process each incorrect question
          for (const questionId of questionIds) {
            try {
              // Try to get enriched question content
              const questionContent = await this.findEnrichedQuestionContent(
                parseInt(questionId), 
                domain
              );
              
              if (!questionContent) continue;
              
              // Add to domain group if not already included
              const isDuplicate = domainQuestions[domain].some(q => q.id === questionContent.id);
              if (!isDuplicate) {
                domainQuestions[domain].push(questionContent);
              }
            } catch (error) {
              console.error(`Error enriching question content for ${questionId}:`, error);
              continue;
            }
          }
        }
      }
      
      // Create mini-lessons from the grouped questions
      const personalizedModules: any[] = [];
      
      for (const domain in domainQuestions) {
        // Get the top 2-3 questions for this domain
        const questions = domainQuestions[domain].slice(0, 3);
        
        if (questions.length === 0) continue;
        
        // Create a personalized mini-lesson
        const moduleId = uuidv4();
        const title = this.generateLessonTitle(domain, questions);
        const difficulty = this.calculateModuleDifficulty(questions);
        
        personalizedModules.push({
          id: moduleId,
          title,
          description: `A personalized mini-lesson focused on ${domain}, based on your recent assessment results.`,
          domain,
          difficulty,
          questions,
          estimatedTimeMinutes: questions.length * 5,
          pointsAvailable: 15,
          progress: 0,
          isCompleted: false,
          createdAt: new Date().toISOString()
        });
      }
      
      return personalizedModules;
    } catch (error) {
      console.error('Error generating personalized learning path:', error);
      return [];
    }
  }
  
  /**
   * Find enriched content for a question from the master question set
   */
  private static async findEnrichedQuestionContent(
    questionId: number,
    domain: string
  ): Promise<any | null> {
    try {
      // First, try to get the question from our local storage of enhanced content
      const enhancedContent = await this.checkEnhancedContentStore(questionId, domain);
      
      if (enhancedContent) {
        return this.formatQuestionWithEnrichment(enhancedContent);
      }
      
      // Next, try to get the question from the assessment API
      try {
        const response = await axios.get(`http://localhost:8088/api/questions/${questionId}`);
        if (response.data) {
          return this.formatQuestionWithEnrichment(response.data);
        }
      } catch (err) {
        console.log(`Assessment API not available for question ${questionId}, using fallback`);
      }
      
      // No enriched content found
      return null;
    } catch (error) {
      console.error('Error finding enriched question content:', error);
      return null;
    }
  }
  
  /**
   * Format a database question with its enrichment content
   */
  private static formatQuestionWithEnrichment(dbQuestion: any): any {
    return {
      id: dbQuestion.id,
      question: dbQuestion.question,
      correctAnswer: dbQuestion.correct_answer || dbQuestion.correctAnswer || '',
      explanation: dbQuestion.explanation || '',
      teachingExplanation: dbQuestion.teaching_explanation || dbQuestion.teachingExplanation || dbQuestion.explanation || '',
      scienceBehindIt: dbQuestion.science_behind_it || dbQuestion.scienceBehindIt || '',
      practicalApplication: dbQuestion.practical_application || dbQuestion.practicalApplication || '',
      whyBehindIt: dbQuestion.why_behind_it || dbQuestion.whyBehindIt || '',
      story: dbQuestion.story || ''
    };
  }
  
  /**
   * Check stored enhanced content from JSON files
   */
  private static async checkEnhancedContentStore(questionId: number, domain: string): Promise<any | null> {
    try {
      // In a real implementation, this would access a database table or Redis cache
      // For now, this is a placeholder that always returns null
      return null;
    } catch (error) {
      console.error('Error checking enhanced content store:', error);
      return null;
    }
  }
  
  /**
   * Generate a lesson title based on the domain and questions
   */
  private static generateLessonTitle(domain: string, questions: any[]): string {
    // Create a title based on the domain and question contents
    const domainTitles: Record<string, string[]> = {
      'child_development': [
        'Child Development Essentials',
        'Understanding Developmental Milestones',
        'Childhood Growth and Learning'
      ],
      'curriculum': [
        'Curriculum Design Principles',
        'Effective Teaching Strategies',
        'Curriculum Implementation'
      ],
      'classroom_management': [
        'Positive Classroom Management',
        'Creating an Engaging Environment',
        'Effective Behavior Management'
      ],
      'communication': [
        'Effective Communication with Children',
        'Parent-Teacher Partnership Strategies',
        'Building Communication Skills'
      ],
      'assessment': [
        'Assessment Best Practices',
        'Evaluating Child Progress',
        'Assessment Techniques'
      ],
      'inclusion': [
        'Inclusive Classroom Strategies',
        'Supporting All Learners',
        'Creating Inclusive Environments'
      ],
      'health_safety': [
        'Health and Safety Fundamentals',
        'Creating Safe Environments',
        'Promoting Child Wellbeing'
      ],
      'general': [
        'Early Childhood Education Essentials',
        'Professional Teaching Practices',
        'ECE Best Practices'
      ]
    };
    
    // Get titles for this domain, or use general if the domain doesn't exist
    const titles = domainTitles[domain] || domainTitles.general;
    
    // Pick a random title from the available options
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  /**
   * Calculate the overall difficulty of a module based on its questions
   */
  private static calculateModuleDifficulty(questions: any[]): number {
    // If the questions have difficulty ratings, use the average
    const questionsWithDifficulty = questions.filter(q => q.difficulty);
    
    if (questionsWithDifficulty.length > 0) {
      const sum = questionsWithDifficulty.reduce((total, q) => total + Number(q.difficulty), 0);
      return Math.round(sum / questionsWithDifficulty.length);
    }
    
    // Default difficulty is 3 (intermediate)
    return 3;
  }
  
  /**
   * Get a user's progress in personalized modules
   */
  static async getUserModuleProgress(userId: number): Promise<any[]> {
    try {
      // In a real implementation, this would query a database table that tracks
      // the user's progress in personalized modules
      // For now, this is a placeholder that always returns an empty array
      return [];
    } catch (error) {
      console.error('Error getting user module progress:', error);
      return [];
    }
  }
}