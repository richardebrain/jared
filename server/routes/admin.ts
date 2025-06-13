import { Router, type Request, type Response, NextFunction } from 'express';
import { QuestionManagementService, QuestionFiltersSchema, CreateQuestionSchema, UpdateQuestionSchema } from '../services/admin/QuestionManagementService';
import { z } from 'zod';
import { db } from '../db';
import { teacherMessages, users, insertTeacherMessageSchema, assessments, assessmentResults, assessmentDomains, assessmentQuestions, questionAvailability, QuestionAvailability, InsertQuestionAvailability, learningPaths, schools } from '@shared/schema';
import { eq, desc, and, or, like, gte, lte, asc, sql, count } from 'drizzle-orm';
import { QuestionPoolAnalysisService } from '../services/admin/QuestionPoolAnalysisService';
import { openAIService } from '../services/OpenAIService';

const router = Router();
const questionService = new QuestionManagementService();
const poolAnalysisService = new QuestionPoolAnalysisService();

// TODO: Replace with proper authentication system
// This is a temporary solution for local development only
const TEMP_ADMIN_PASSWORD = "BIGSURF55";

// Middleware for admin authentication (now checks password like other admin endpoints)
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('Admin middleware - Session and password check:', {
    hasSession: !!req.session,
    userId: req.session?.userId,
    sessionId: req.sessionID,
    hasAdminPassword: !!req.query.admin_password || !!req.body.admin_password
  });
  
  // Check for admin password (query or body)
  const adminPassword = req.query.admin_password || req.body.admin_password;
  
  if (adminPassword === TEMP_ADMIN_PASSWORD) {
    console.log("Admin password correct, proceeding");
    return next(); // Allow access with correct password
  }
  
  // Fallback to session-based authentication for logged-in users
  if (!req.session || !req.session.userId) {
    console.log("Authentication failed - no session or userId and no admin password");
    return res.status(403).json({ message: "Forbidden: Admin access required. Password incorrect." });
  }
  
  console.log("User authenticated via session:", req.session.userId);
  next();
};

// Helper function to parse query parameters
function parseQueryFilters(query: any) {
  return {
    domainId: query.domainId ? parseInt(query.domainId, 10) : undefined,
    difficulty: query.difficulty || undefined,
    isApproved: query.isApproved !== undefined ? query.isApproved === 'true' : undefined,
    isEnabled: query.isEnabled !== undefined ? query.isEnabled === 'true' : undefined,
    createdBy: query.createdBy ? parseInt(query.createdBy) : undefined,
    search: query.search || undefined,
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? parseInt(query.limit) : 20,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
  };
}

/**
 * GET /api/admin/questions
 * Get questions with filtering, pagination, and metadata
 */
router.get('/questions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = parseQueryFilters(req.query);
    const validatedFilters = QuestionFiltersSchema.parse(filters);
    
    const result = await questionService.getQuestions(validatedFilters);
    
    res.json({
      success: true,
      data: result.questions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve questions',
    });
  }
});

/**
 * GET /api/admin/questions/:id
 * Get a single question by ID
 */
router.get('/questions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }
    
    const question = await questionService.getQuestionById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }
    
    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve question',
    });
  }
});

/**
 * POST /api/admin/questions
 * Create a new question
 */
router.post('/questions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = CreateQuestionSchema.parse(req.body);
    const createdBy = req.session.userId!;
    
    const newQuestion = await questionService.createQuestion(validatedData, createdBy);
    
    res.status(201).json({
      success: true,
      data: newQuestion,
      message: 'Question created successfully',
    });
  } catch (error) {
    console.error('Error creating question:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      
      if (error.message.includes('Invalid domain')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create question',
    });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Update an existing question
 */
router.put('/questions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }
    
    const validatedData = UpdateQuestionSchema.parse(req.body);
    const updatedBy = req.session.userId!;
    
    const updatedQuestion = await questionService.updateQuestion(id, validatedData, updatedBy);
    
    res.json({
      success: true,
      data: updatedQuestion,
      message: 'Question updated successfully',
    });
  } catch (error) {
    console.error('Error updating question:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      
      if (error.message.includes('Invalid domain')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update question',
    });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Delete a question
 */
router.delete('/questions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }
    
    await questionService.deleteQuestion(id);
    
    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete question',
    });
  }
});

/**
 * POST /api/admin/questions/:id/approve
 * Approve or reject a question
 */
router.post('/questions/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }
    
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isApproved must be a boolean value',
      });
    }
    
    const approvedBy = req.session.userId!;
    const updatedQuestion = await questionService.updateQuestionApproval(id, isApproved, approvedBy);
    
    res.json({
      success: true,
      data: updatedQuestion,
      message: `Question ${isApproved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Error updating question approval:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update question approval',
    });
  }
});

/**
 * PUT /api/admin/questions/:id/availability
 * Update question availability
 */
router.put('/questions/:id/availability', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isEnabled, schoolId } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }
    
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isEnabled must be a boolean value',
      });
    }
    
    const enabledBy = req.session.userId!;
    const schoolIdValue = schoolId ? parseInt(schoolId) : null;
    
    const availability = await questionService.updateQuestionAvailability(
      id, 
      isEnabled, 
      schoolIdValue, 
      enabledBy
    );
    
    res.json({
      success: true,
      data: availability,
      message: 'Question availability updated successfully',
    });
  } catch (error) {
    console.error('Error updating question availability:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update question availability',
    });
  }
});

/**
 * GET /api/admin/domains
 * Get all active domains
 */
router.get('/domains', requireAdmin, async (req: Request, res: Response) => {
  try {
    const domains = await questionService.getDomains();
    
    res.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('Error getting domains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve domains',
    });
  }
});

/**
 * GET /api/admin/domains/statistics
 * Get domain statistics with question counts
 */
router.get('/domains/statistics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const statistics = await questionService.getDomainStatistics();
    
    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting domain statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve domain statistics',
    });
  }
});

/**
 * POST /api/admin/questions/bulk/approve
 * Bulk approve questions
 */
router.post('/questions/bulk/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'questionIds must be a non-empty array',
      });
    }
    
    const approvedBy = req.session.userId!;
    const updatedCount = await questionService.bulkApproveQuestions(questionIds, approvedBy);
    
    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} questions approved successfully`,
    });
  } catch (error) {
    console.error('Error bulk approving questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk approve questions',
    });
  }
});

/**
 * POST /api/admin/questions/bulk/availability
 * Bulk update question availability
 */
router.post('/questions/bulk/availability', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { questionIds, isEnabled, schoolId } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'questionIds must be a non-empty array',
      });
    }
    
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isEnabled must be a boolean value',
      });
    }
    
    const enabledBy = req.session.userId!;
    const schoolIdValue = schoolId ? parseInt(schoolId) : null;
    
    const updatedCount = await questionService.bulkUpdateAvailability(
      questionIds,
      isEnabled,
      schoolIdValue,
      enabledBy
    );
    
    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} questions availability updated successfully`,
    });
  } catch (error) {
    console.error('Error bulk updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update availability',
    });
  }
});

/**
 * GET /api/admin/messages
 * Get recent messages sent by admins
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    console.log('Fetching recent admin messages...');
    
    // Get recent messages from the database
    const recentMessages = await db
      .select({
        id: teacherMessages.id,
        title: teacherMessages.title,
        content: teacherMessages.content,
        messageType: teacherMessages.messageType,
        important: teacherMessages.important,
        createdAt: teacherMessages.createdAt,
        recipientName: users.firstName,
        recipientUsername: users.username
      })
      .from(teacherMessages)
      .leftJoin(users, eq(teacherMessages.recipientId, users.id))
      .orderBy(desc(teacherMessages.createdAt))
      .limit(10);

    console.log(`Found ${recentMessages.length} recent messages`);
    res.json(recentMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/admin/send-message
 * Send message to selected teachers
 */
router.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { teacherIds, subject, content, priority, messageType } = req.body;
    
    console.log('Received message data:', { teacherIds, subject, content, priority, messageType });

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({ message: 'Teacher IDs are required' });
    }

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    // Use the current logged-in user as the sender
    // For now, we'll use the first available user ID since auth is simplified
    const firstUser = await db.select({ id: users.id }).from(users).limit(1);
    const senderId = firstUser.length > 0 ? firstUser[0].id : null;
    
    if (!senderId) {
      return res.status(500).json({ message: 'No valid sender found' });
    }
    
    const isImportant = priority === 'urgent' || priority === 'high';

    // Insert messages for each selected teacher
    const messagePromises = teacherIds.map(async (teacherId: number) => {
      return await db.insert(teacherMessages).values({
        senderId: senderId,
        recipientId: teacherId,
        messageType: messageType || 'announcement',
        title: subject,
        content: content,
        isRead: false
      });
    });

    await Promise.all(messagePromises);

    console.log(`Successfully stored ${teacherIds.length} message(s) in database`);

    res.json({ 
      success: true, 
      message: `Message sent to ${teacherIds.length} teacher(s)` 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

/**
 * POST /api/admin/assign-modules
 * Assign modules to teachers
 */
router.post('/assign-modules', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { teacherIds, moduleId, deadline, priority } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({ message: 'Teacher IDs are required' });
    }

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    // For now, we'll just send a message about the module assignment
    // In a full implementation, you'd have a module assignments table
    const senderId = req.session.userId;
    const subject = `New Training Module Assigned`;
    const content = `You have been assigned a new training module. ${deadline ? `Please complete by ${deadline}.` : ''} Priority: ${priority || 'medium'}`;

    const messagesToInsert = teacherIds.map(teacherId => ({
      senderId,
      recipientId: teacherId,
      messageType: 'assignment',
      title: subject,
      content,
      important: priority === 'urgent' || priority === 'high',
      isRead: false,
    }));

    await db.insert(teacherMessages).values(messagesToInsert);

    res.json({ 
      success: true, 
      message: `Module assigned to ${teacherIds.length} teacher(s)` 
    });
  } catch (error) {
    console.error('Error assigning module:', error);
    res.status(500).json({ message: 'Failed to assign module' });
  }
});

/**
 * GET /api/admin/question-pool/analysis
 * Get question pool adequacy analysis with warnings and recommendations
 */
router.get('/question-pool/analysis', requireAdmin, async (req, res) => {
  try {
    const analysis = await poolAnalysisService.analyzeQuestionPool();
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing question pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze question pool'
    });
  }
});

/**
 * GET /api/admin/question-pool/distribution
 * Get domain distribution summary for dashboard
 */
router.get('/question-pool/distribution', requireAdmin, async (req, res) => {
  try {
    const distribution = await poolAnalysisService.getDomainDistributionSummary();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error getting domain distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get domain distribution'
    });
  }
});

/**
 * GET /api/admin/question-pool/coverage-matrix
 * Get domain/difficulty coverage matrix for visualization
 */
router.get('/question-pool/coverage-matrix', requireAdmin, async (req, res) => {
  try {
    const matrix = await poolAnalysisService.getDomainDifficultyMatrix();
    
    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    console.error('Error getting coverage matrix:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coverage matrix'
    });
  }
});

// AI Question Generation endpoint
router.post('/questions/generate', async (req, res) => {
  // Inline admin authentication check (same as other endpoints)
  const adminPassword = req.query.admin_password || req.body.admin_password;
  
  if (adminPassword !== TEMP_ADMIN_PASSWORD) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required. Password incorrect.',
      code: 'ADMIN_AUTH_REQUIRED'
    });
  }

  // Set a request timeout to ensure we respond to the frontend
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('Request timeout: AI generation took too long');
      res.status(408).json({
        success: false,
        error: 'Request timed out. The AI service is taking longer than expected. Please try again.',
        code: 'REQUEST_TIMEOUT'
      });
    }
  }, 50000); // 50 second request timeout (5 seconds more than OpenAI service timeout)

  try {
    const { domainId, difficulty, userGuidance } = req.body;

    // Validate required fields
    if (!domainId || !difficulty) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        success: false,
        error: 'Domain ID and difficulty are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate difficulty is in valid range
    const difficultyNumber = parseInt(difficulty);
    if (isNaN(difficultyNumber) || difficultyNumber < 1 || difficultyNumber > 6) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be a number between 1 and 6',
        code: 'INVALID_DIFFICULTY'
      });
    }

    // Get domain information
    const domain = await questionService.getDomainById(domainId);
    if (!domain) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        success: false,
        error: 'Invalid domain ID',
        code: 'INVALID_DOMAIN'
      });
    }

    // Moderate user guidance if provided
    if (userGuidance && typeof userGuidance === 'string' && userGuidance.trim()) {
      try {
        const isAppropriate = await openAIService.moderateContent(userGuidance);
        if (!isAppropriate) {
          clearTimeout(requestTimeout);
          return res.status(400).json({
            success: false,
            error: 'User guidance contains inappropriate content. Please revise your guidance.',
            code: 'INAPPROPRIATE_CONTENT'
          });
        }
      } catch (moderationError) {
        console.warn('Content moderation failed, proceeding anyway:', moderationError);
        // Continue with generation if moderation fails
      }
    }

    console.log(`Starting AI question generation for domain: ${domain.name}, difficulty: ${difficultyNumber}`);

    // Generate question using OpenAI service
    const generatedQuestion = await openAIService.generateAssessmentQuestion({
      domainName: domain.name,
      domainDescription: domain.description,
      difficulty: difficultyNumber,
      userGuidance: userGuidance?.trim() || undefined,
    });

    console.log('AI question generation completed successfully');

    // Clear the timeout since we're responding successfully
    clearTimeout(requestTimeout);

    // Return generated content for frontend to populate form fields
    if (!res.headersSent) {
      res.json({
        success: true,
        data: {
          text: generatedQuestion.text,
          options: generatedQuestion.options,
          correctAnswer: generatedQuestion.correctAnswer,
          explanation: generatedQuestion.explanation,
          miniLesson: generatedQuestion.miniLesson,
          tags: generatedQuestion.tags.join(', '), // Convert array to comma-separated string
        },
        message: 'Question content generated successfully'
      });
    }

  } catch (error) {
    console.error('Question generation error:', error);
    
    // Clear the timeout
    clearTimeout(requestTimeout);

    // Don't respond if headers already sent (timeout already responded)
    if (res.headersSent) {
      return;
    }

    // Handle specific error types with appropriate HTTP status codes and user-friendly messages
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Timeout errors
      if (errorMessage.includes('AI service is taking longer than expected') || 
          errorMessage.includes('timed out')) {
        return res.status(408).json({
          success: false,
          error: 'The AI service is taking longer than expected. Please try again with simpler guidance or try again later.',
          code: 'AI_TIMEOUT'
        });
      }

      // Rate limiting errors
      if (errorMessage.includes('AI service is currently busy') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('429')) {
        return res.status(503).json({
          success: false,
          error: 'The AI service is currently busy. Please wait a moment and try again.',
          code: 'AI_RATE_LIMITED'
        });
      }

      // Service unavailable errors
      if (errorMessage.includes('AI service is temporarily unavailable') ||
          errorMessage.includes('service unavailable') ||
          errorMessage.includes('503')) {
        return res.status(503).json({
          success: false,
          error: 'The AI service is temporarily unavailable. Please try again in a few minutes.',
          code: 'AI_SERVICE_UNAVAILABLE'
        });
      }

      // Authentication/configuration errors
      if (errorMessage.includes('AI service configuration error') ||
          errorMessage.includes('authentication') ||
          errorMessage.includes('401')) {
        return res.status(500).json({
          success: false,
          error: 'AI service configuration error. Please contact support.',
          code: 'AI_CONFIG_ERROR'
        });
      }

      // Content validation errors
      if (errorMessage.includes('AI returned invalid response format') ||
          errorMessage.includes('Generated question')) {
        return res.status(400).json({
          success: false,
          error: 'The AI generated invalid content. Please try again with different guidance or settings.',
          code: 'AI_INVALID_RESPONSE'
        });
      }

      // Generic AI generation errors
      if (errorMessage.includes('Failed to generate assessment question')) {
        return res.status(503).json({
          success: false,
          error: 'Unable to generate question at this time. The AI service may be temporarily unavailable. Please try again.',
          code: 'AI_GENERATION_FAILED'
        });
      }
    }

    // Generic fallback error response
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during question generation. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Assessment Results endpoint
router.get("/assessment-results", async (req, res) => {
  try {
    const adminPassword = req.query.admin_password as string;
    
    if (!adminPassword || adminPassword !== TEMP_ADMIN_PASSWORD) {
      return res.status(403).json({ 
        success: false, 
        error: "Forbidden: Admin access required. Password incorrect." 
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    
    // Filtering parameters
    const nameFilter = req.query.name as string;
    const emailFilter = req.query.email as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const accuracyMin = req.query.accuracyMin ? parseFloat(req.query.accuracyMin as string) : undefined;
    const accuracyMax = req.query.accuracyMax ? parseFloat(req.query.accuracyMax as string) : undefined;
    
    // Sorting parameters
    const sortBy = req.query.sortBy as string || 'calculatedAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build the base query with joins
    const query = db
      .select({
        id: assessmentResults.id,
        overallScore: assessmentResults.overallScore,
        totalQuestions: assessmentResults.totalQuestions,
        totalCorrect: assessmentResults.totalCorrect,
        accuracyRate: assessmentResults.accuracyRate,
        totalTimeSeconds: assessmentResults.totalTimeSeconds,
        domainBreakdown: assessmentResults.domainBreakdown,
        strengthAreas: assessmentResults.strengthAreas,
        growthAreas: assessmentResults.growthAreas,
        calculatedAt: assessmentResults.calculatedAt,
        // User information
        userId: users.id,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
        userEmail: users.email,
        // Assessment information
        assessmentId: assessments.id,
        assessmentCompletedAt: assessments.completedAt,
      })
      .from(assessmentResults)
      .innerJoin(assessments, eq(assessmentResults.assessmentId, assessments.id))
      .innerJoin(users, eq(assessments.userId, users.id));

    // Apply filters
    const conditions = [];

    if (nameFilter) {
      conditions.push(
        or(
          like(users.firstName, `%${nameFilter}%`),
          like(users.lastName, `%${nameFilter}%`),
          like(sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`, `%${nameFilter}%`)
        )
      );
    }

    if (emailFilter) {
      conditions.push(like(users.email, `%${emailFilter}%`));
    }

    if (dateFrom) {
      conditions.push(gte(assessmentResults.calculatedAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      conditions.push(lte(assessmentResults.calculatedAt, toDate));
    }

    if (accuracyMin !== undefined) {
      conditions.push(gte(assessmentResults.accuracyRate, accuracyMin));
    }

    if (accuracyMax !== undefined) {
      conditions.push(lte(assessmentResults.accuracyRate, accuracyMax));
    }

    let finalQuery = query;
    if (conditions.length > 0) {
      finalQuery = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = {
      'userName': sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      'calculatedAt': assessmentResults.calculatedAt,
      'accuracyRate': assessmentResults.accuracyRate,
      'overallScore': assessmentResults.overallScore,
      'totalTimeSeconds': assessmentResults.totalTimeSeconds,
    }[sortBy] || assessmentResults.calculatedAt;

    if (sortOrder === 'desc') {
      finalQuery = finalQuery.orderBy(desc(sortColumn));
    } else {
      finalQuery = finalQuery.orderBy(asc(sortColumn));
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: count() })
      .from(assessmentResults)
      .innerJoin(assessments, eq(assessmentResults.assessmentId, assessments.id))
      .innerJoin(users, eq(assessments.userId, users.id));

    let finalCountQuery = countQuery;
    if (conditions.length > 0) {
      finalCountQuery = countQuery.where(and(...conditions));
    }

    const [results, totalCountResult] = await Promise.all([
      finalQuery.limit(limit).offset(offset),
      finalCountQuery
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    
    // Process results to format for frontend
    const processedResults = results.map(result => {
      // Calculate duration in minutes
      const durationMinutes = result.totalTimeSeconds ? Math.round(result.totalTimeSeconds / 60) : 0;
      
      // Extract top 2-3 growth areas from domain breakdown
      const domainBreakdown = result.domainBreakdown as Array<{
        domainId: number;
        domainName: string;
        totalQuestions: number;
        correctAnswers: number;
        accuracyRate: number;
        strengthLevel: 'strength' | 'neutral' | 'growth';
      }>;
      
      const topGrowthAreas = domainBreakdown
        ?.filter(domain => domain.strengthLevel === 'growth')
        .sort((a, b) => a.accuracyRate - b.accuracyRate) // Sort by lowest accuracy first
        .slice(0, 3)
        .map(domain => domain.domainName) || [];

      return {
        id: result.id,
        userId: result.userId,
        userName: result.userName,
        userEmail: result.userEmail,
        completedAt: result.assessmentCompletedAt || result.calculatedAt,
        accuracyRate: result.accuracyRate,
        overallScore: result.overallScore,
        totalQuestions: result.totalQuestions,
        totalCorrect: result.totalCorrect,
        durationMinutes,
        topGrowthAreas,
        strengthAreas: result.strengthAreas,
        growthAreas: result.growthAreas,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: processedResults,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error("Error fetching assessment results:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch assessment results" 
    });
  }
});

/**
 * GET /api/admin/teachers/:teacherId/assessment-results
 * Get detailed assessment results for a specific teacher
 * Role-based access: Directors see their school's teachers, Owners see all
 */
router.get('/teachers/:teacherId/assessment-results', async (req: Request, res: Response) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const currentUserId = req.session.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(teacherId)) {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    // Get current user to check permissions
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (!currentUser || currentUser.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = currentUser[0];

    // Get the target teacher
    const targetTeacher = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      schoolId: users.schoolId,
      profilePicture: users.profilePicture,
    })
    .from(users)
    .where(eq(users.id, teacherId))
    .limit(1);

    if (!targetTeacher || targetTeacher.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const teacher = targetTeacher[0];

    // Role-based access control
    // - Owners can see all teachers
    // - Directors can only see teachers from their school
    if (!user.isOwner && (!user.isSchoolAdmin || user.schoolId !== teacher.schoolId)) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view assessment results for teachers in your school.' 
      });
    }

    // Get the most recent completed assessment for this teacher
    const teacherAssessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, teacherId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, true)
      ))
      .orderBy(desc(assessments.completedAt))
      .limit(1);

    if (!teacherAssessment || teacherAssessment.length === 0) {
      return res.status(404).json({
        message: "No completed assessment found",
        details: "This teacher hasn't completed an assessment yet."
      });
    }

    const assessment = teacherAssessment[0];

    // Get detailed assessment results
    const storedResults = await db.select()
      .from(assessmentResults)
      .where(eq(assessmentResults.assessmentId, assessment.id))
      .limit(1);

    if (!storedResults || storedResults.length === 0) {
      return res.status(404).json({
        message: "Assessment results not found",
        details: "Assessment results are not available or still being processed."
      });
    }

    const results = storedResults[0];

    // Get learning path if available
    const learningPath = await db.select()
      .from(learningPaths)
      .where(eq(learningPaths.assessmentId, assessment.id))
      .limit(1);

    // Get school information for context
    let schoolName = 'Unknown School';
    if (teacher.schoolId) {
      const school = await db.select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, teacher.schoolId))
        .limit(1);
      
      if (school && school.length > 0) {
        schoolName = school[0].name;
      }
    }

    // Return comprehensive results for display
    res.status(200).json({
      success: true,
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        username: teacher.username,
        email: teacher.email,
        profilePicture: teacher.profilePicture,
        schoolName,
      },
      assessment: {
        id: assessment.id,
        completedAt: assessment.completedAt,
        type: assessment.type
      },
      results: {
        overallScore: results.overallScore,
        totalQuestions: results.totalQuestions,
        totalCorrect: results.totalCorrect,
        accuracyRate: results.accuracyRate,
        totalTimeSeconds: results.totalTimeSeconds,
        strengthAreas: results.strengthAreas,
        growthAreas: results.growthAreas,
        domainBreakdown: results.domainBreakdown,
        personalizedSummary: results.personalizedSummary,
        immediateNextSteps: results.immediateNextSteps,
        primaryMiniLessons: results.primaryMiniLessons,
        estimatedImprovementTime: results.estimatedImprovementTime
      },
      learningPath: learningPath.length > 0 ? {
        domainGroups: learningPath[0].domainGroups,
        totalFailedQuestions: learningPath[0].totalFailedQuestions,
        totalDomains: learningPath[0].totalDomains,
        estimatedCompletionTime: learningPath[0].estimatedCompletionTime
      } : null
    });

  } catch (error) {
    console.error('Error retrieving teacher assessment results:', error);
    res.status(500).json({
      message: "Failed to retrieve assessment results",
      details: "An error occurred while loading the results. Please try again."
    });
  }
});

export default router; 