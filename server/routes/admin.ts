import { Router, type Request, type Response, NextFunction } from 'express';
import { QuestionManagementService, QuestionFiltersSchema, CreateQuestionSchema, UpdateQuestionSchema } from '../services/admin/QuestionManagementService';
import { z } from 'zod';
import { db } from '../db';
import { teacherMessages, users, insertTeacherMessageSchema } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
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
    domainId: query.domain || undefined,
    difficulty: query.difficulty || undefined,
    isApproved: query.approved !== undefined ? query.approved === 'true' : undefined,
    isEnabled: query.enabled !== undefined ? query.enabled === 'true' : undefined,
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
        important: isImportant,
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

// AI Question Generation endpoint
router.post('/questions/generate', async (req, res) => {
  try {
    const { domainId, difficulty, userGuidance } = req.body;

    // Validate required fields
    if (!domainId || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Domain ID and difficulty are required'
      });
    }

    // Validate difficulty is in valid range
    const difficultyNumber = parseInt(difficulty);
    if (isNaN(difficultyNumber) || difficultyNumber < 1 || difficultyNumber > 6) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be a number between 1 and 6'
      });
    }

    // Get domain information
    const domain = await questionService.getDomainById(domainId);
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Invalid domain ID'
      });
    }

    // Moderate user guidance if provided
    if (userGuidance && typeof userGuidance === 'string' && userGuidance.trim()) {
      const isAppropriate = await openAIService.moderateContent(userGuidance);
      if (!isAppropriate) {
        return res.status(400).json({
          success: false,
          error: 'User guidance contains inappropriate content'
        });
      }
    }

    // Generate question using OpenAI service
    const generatedQuestion = await openAIService.generateAssessmentQuestion({
      domainName: domain.name,
      domainDescription: domain.description,
      difficulty: difficultyNumber,
      userGuidance: userGuidance?.trim() || undefined,
    });

    // Return generated content for frontend to populate form fields
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

  } catch (error) {
    console.error('Question generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI generation failed')) {
        return res.status(503).json({
          success: false,
          error: 'AI service temporarily unavailable. Please try again.'
        });
      }
      
      if (error.message.includes('Failed to generate assessment question')) {
        return res.status(400).json({
          success: false,
          error: 'Unable to generate question with current parameters. Please try different guidance or settings.'
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error occurred during question generation'
    });
  }
});

export default router; 