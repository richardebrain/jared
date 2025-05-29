import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LearningPathService, type DomainGroupData, type EnhancedLearningPathResult } from '../server/services/assessment/LearningPathService';

// Mock the database and dependencies
jest.mock('../server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    returning: jest.fn(),
    values: jest.fn(),
    set: jest.fn()
  }
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn()
}));

jest.mock('@shared/schema', () => ({
  learningPaths: {},
  assessmentResponses: {},
  assessmentQuestions: {},
  assessmentDomains: {}
}));

describe('LearningPathService - EP-001-10 Enhanced Learning Path Recommendation', () => {
  let learningPathService: LearningPathService;
  let mockDb: any;

  beforeEach(() => {
    learningPathService = new LearningPathService();
    mockDb = require('../server/db').db;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup chainable query builder mocks
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.returning.mockReturnValue(mockDb);
  });

  describe('Learning Path Generation', () => {
    it('should generate enhanced learning path for failed questions with mini-lessons', async () => {
      // Mock failed questions with mini-lessons
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Intermediate',
          domainId: '1',
          miniLesson: 'Understanding child safety protocols...',
          estimatedDuration: 20
        },
        {
          questionId: 'q2',
          isCorrect: false,
          timedOut: true,
          difficulty: 'Easy',
          domainId: '2',
          miniLesson: 'Health and development basics...',
          estimatedDuration: 15
        },
        {
          questionId: 'q3',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Advanced',
          domainId: '1',
          miniLesson: 'Advanced safety measures...',
          estimatedDuration: 25
        }
      ];

      // Mock domain data
      const mockDomains = [
        { id: 1, name: 'Child Safety', weight: 9 },
        { id: 2, name: 'Health Development', weight: 8 }
      ];

      // Setup mocks
      mockDb.where.mockResolvedValueOnce(mockFailedQuestions); // Failed questions query
      mockDb.where.mockResolvedValueOnce(mockDomains); // Domains query
      mockDb.where.mockResolvedValueOnce([]); // Existing learning path check
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]); // Insert learning path

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(2);
      
      // Verify domain sorting by weight (descending)
      expect(result.domainGroups[0].domainWeight).toBe(9); // Child Safety first
      expect(result.domainGroups[1].domainWeight).toBe(8); // Health Development second
      
      // Verify within-domain difficulty sorting (ascending)
      const childSafetyGroup = result.domainGroups[0];
      expect(childSafetyGroup.miniLessons[0].difficulty).toBe(3); // Intermediate (q1)
      expect(childSafetyGroup.miniLessons[1].difficulty).toBe(5); // Advanced (q3)
      
      // Verify totals calculation
      expect(result.totals.totalFailedQuestions).toBe(3);
      expect(result.totals.totalDomains).toBe(2);
      expect(result.totals.estimatedCompletionTime).toBe(60); // 20 + 15 + 25
    });

    it('should handle perfect assessment with no failed questions', async () => {
      // Mock no failed questions
      mockDb.where.mockResolvedValueOnce([]); // No failed questions
      mockDb.where.mockResolvedValueOnce([]); // Existing learning path check
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]); // Insert empty learning path

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(0);
      expect(result.totals.totalFailedQuestions).toBe(0);
      expect(result.totals.totalDomains).toBe(0);
      expect(result.totals.estimatedCompletionTime).toBe(0);
      expect(result.message).toBe('Perfect assessment! No learning path needed.');
    });

    it('should filter out questions without mini-lessons', async () => {
      // Mock questions with and without mini-lessons
      const mockQuestionsResponse = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: 'Valid mini-lesson content...',
          estimatedDuration: 15
        },
        {
          questionId: 'q2',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: null, // No mini-lesson
          estimatedDuration: 15
        },
        {
          questionId: 'q3',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: '   ', // Empty mini-lesson
          estimatedDuration: 15
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockQuestionsResponse);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(1);
      expect(result.domainGroups[0].failedQuestionsCount).toBe(1); // Only q1 with valid mini-lesson
      expect(result.totals.totalFailedQuestions).toBe(1);
    });
  });

  describe('Domain Grouping and Sorting', () => {
    it('should group questions by domains correctly', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: 'Domain 1 lesson...',
          estimatedDuration: 10
        },
        {
          questionId: 'q2',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Intermediate',
          domainId: '1',
          miniLesson: 'Another domain 1 lesson...',
          estimatedDuration: 15
        },
        {
          questionId: 'q3',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Advanced',
          domainId: '2',
          miniLesson: 'Domain 2 lesson...',
          estimatedDuration: 20
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Domain One', weight: 7 },
        { id: 2, name: 'Domain Two', weight: 9 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(2);
      
      // Verify sorting by weight (highest first)
      expect(result.domainGroups[0].domainName).toBe('Domain Two'); // Weight 9
      expect(result.domainGroups[1].domainName).toBe('Domain One'); // Weight 7
      
      // Verify question counts per domain
      expect(result.domainGroups[0].failedQuestionsCount).toBe(1); // Domain 2: q3
      expect(result.domainGroups[1].failedQuestionsCount).toBe(2); // Domain 1: q1, q2
    });

    it('should sort mini-lessons within domains by difficulty (ascending)', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Advanced', // Difficulty 5
          domainId: '1',
          miniLesson: 'Advanced lesson...',
          estimatedDuration: 25
        },
        {
          questionId: 'q2',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy', // Difficulty 1  
          domainId: '1',
          miniLesson: 'Easy lesson...',
          estimatedDuration: 10
        },
        {
          questionId: 'q3',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Intermediate', // Difficulty 3
          domainId: '1',
          miniLesson: 'Intermediate lesson...',
          estimatedDuration: 15
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      const domainGroup = result.domainGroups[0];
      
      // Verify difficulty sorting (easiest first)
      expect(domainGroup.miniLessons[0].difficulty).toBe(1); // Easy (q2)
      expect(domainGroup.miniLessons[1].difficulty).toBe(3); // Intermediate (q3)  
      expect(domainGroup.miniLessons[2].difficulty).toBe(5); // Advanced (q1)
      
      // Verify corresponding question IDs
      expect(domainGroup.miniLessons[0].questionId).toBe('q2');
      expect(domainGroup.miniLessons[1].questionId).toBe('q3');
      expect(domainGroup.miniLessons[2].questionId).toBe('q1');
    });
  });

  describe('Learning Path Storage and Updates', () => {
    it('should create new learning path for first assessment', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: 'Test lesson...',
          estimatedDuration: 15
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]); // No existing learning path
      mockDb.returning.mockResolvedValueOnce([{ 
        id: 1, 
        assessmentId: 123, 
        userId: 456,
        domainGroups: [{ domainId: 1, domainName: 'Test Domain', domainWeight: 5, failedQuestionsCount: 1, miniLessons: [{ questionId: 'q1', difficulty: 1, miniLessonId: 'q1', estimatedDuration: 15 }] }],
        totalFailedQuestions: 1,
        totalDomains: 1,
        estimatedCompletionTime: 15
      }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.learningPath).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update existing learning path for assessment retakes', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Intermediate',
          domainId: '1',
          miniLesson: 'Updated lesson...',
          estimatedDuration: 20
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      const existingLearningPath = [{ id: 1, assessmentId: 123 }];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce(existingLearningPath); // Existing learning path found
      mockDb.returning.mockResolvedValueOnce([{ 
        id: 1, 
        assessmentId: 123, 
        userId: 456,
        domainGroups: [{ domainId: 1, domainName: 'Test Domain', domainWeight: 5, failedQuestionsCount: 1, miniLessons: [{ questionId: 'q1', difficulty: 3, miniLessonId: 'q1', estimatedDuration: 20 }] }],
        totalFailedQuestions: 1,
        totalDomains: 1,
        estimatedCompletionTime: 20
      }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.learningPath).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.where.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(false);
      expect(result.learningPath).toBeNull();
      expect(result.message).toContain('Database connection failed');
    });

    it('should handle missing domain data gracefully', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '999', // Non-existent domain
          miniLesson: 'Test lesson...',
          estimatedDuration: 15
        }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce([]); // No domains found
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      // Should create empty learning path since no valid domains were found
      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(0);
      expect(result.totals.totalFailedQuestions).toBe(0);
    });

    it('should handle invalid difficulty values with defaults', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'InvalidDifficulty', // Invalid difficulty
          domainId: '1',
          miniLesson: 'Test lesson...',
          estimatedDuration: 15
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups[0].miniLessons[0].difficulty).toBe(3); // Default to Intermediate
    });

    it('should handle missing estimated duration with defaults', async () => {
      const mockFailedQuestions = [
        {
          questionId: 'q1',
          isCorrect: false,
          timedOut: false,
          difficulty: 'Easy',
          domainId: '1',
          miniLesson: 'Test lesson...',
          estimatedDuration: null // Missing duration
        }
      ];

      const mockDomains = [
        { id: 1, name: 'Test Domain', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups[0].miniLessons[0].estimatedDuration).toBe(15); // Default 15 minutes
      expect(result.totals.estimatedCompletionTime).toBe(15);
    });
  });

  describe('Learning Path Retrieval', () => {
    it('should retrieve existing learning path', async () => {
      const mockLearningPath = {
        id: 1,
        assessmentId: 123,
        userId: 456,
        domainGroups: [],
        totalFailedQuestions: 0,
        totalDomains: 0,
        estimatedCompletionTime: 0
      };

      mockDb.where.mockResolvedValueOnce([mockLearningPath]);

      const result = await learningPathService.getLearningPath(123);

      expect(result).toEqual(mockLearningPath);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null for non-existent learning path', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await learningPathService.getLearningPath(999);

      expect(result).toBeNull();
    });
  });

  describe('Complex Multi-Domain Scenarios', () => {
    it('should handle large assessment with multiple domains and mixed difficulties', async () => {
      // Create a complex scenario with 5 domains, varying weights, and mixed difficulties
      const mockFailedQuestions = [
        // Domain 1 (weight 10) - highest priority
        { questionId: 'q1', isCorrect: false, timedOut: false, difficulty: 'Master', domainId: '1', miniLesson: 'D1 Master lesson', estimatedDuration: 30 },
        { questionId: 'q2', isCorrect: false, timedOut: false, difficulty: 'Easy', domainId: '1', miniLesson: 'D1 Easy lesson', estimatedDuration: 10 },
        { questionId: 'q3', isCorrect: false, timedOut: true, difficulty: 'Intermediate', domainId: '1', miniLesson: 'D1 Intermediate lesson', estimatedDuration: 15 },
        
        // Domain 2 (weight 8)
        { questionId: 'q4', isCorrect: false, timedOut: false, difficulty: 'Advanced', domainId: '2', miniLesson: 'D2 Advanced lesson', estimatedDuration: 25 },
        { questionId: 'q5', isCorrect: false, timedOut: false, difficulty: 'Beginner', domainId: '2', miniLesson: 'D2 Beginner lesson', estimatedDuration: 12 },
        
        // Domain 3 (weight 5) - lowest priority
        { questionId: 'q6', isCorrect: false, timedOut: false, difficulty: 'Proficient', domainId: '3', miniLesson: 'D3 Proficient lesson', estimatedDuration: 20 }
      ];

      const mockDomains = [
        { id: 1, name: 'Safety Protocols', weight: 10 },
        { id: 2, name: 'Child Development', weight: 8 },
        { id: 3, name: 'Curriculum Planning', weight: 5 }
      ];

      mockDb.where.mockResolvedValueOnce(mockFailedQuestions);
      mockDb.where.mockResolvedValueOnce(mockDomains);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, assessmentId: 123 }]);

      const result = await learningPathService.generateLearningPath(123, 456);

      expect(result.success).toBe(true);
      expect(result.domainGroups).toHaveLength(3);
      
      // Verify domain ordering by weight (descending)
      expect(result.domainGroups[0].domainName).toBe('Safety Protocols'); // Weight 10
      expect(result.domainGroups[1].domainName).toBe('Child Development'); // Weight 8
      expect(result.domainGroups[2].domainName).toBe('Curriculum Planning'); // Weight 5
      
      // Verify difficulty ordering within Safety Protocols domain (ascending)
      const safetyDomain = result.domainGroups[0];
      expect(safetyDomain.miniLessons[0].difficulty).toBe(1); // Easy (q2)
      expect(safetyDomain.miniLessons[1].difficulty).toBe(3); // Intermediate (q3)
      expect(safetyDomain.miniLessons[2].difficulty).toBe(6); // Master (q1)
      
      // Verify totals
      expect(result.totals.totalFailedQuestions).toBe(6);
      expect(result.totals.totalDomains).toBe(3);
      expect(result.totals.estimatedCompletionTime).toBe(112); // Sum of all durations
    });
  });
}); 