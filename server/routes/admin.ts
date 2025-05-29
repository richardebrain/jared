import { Router, type Request, type Response, NextFunction } from 'express';
import { QuestionManagementService, QuestionFiltersSchema, CreateQuestionSchema, UpdateQuestionSchema } from '../services/admin/QuestionManagementService';
import { z } from 'zod';

const router = Router();
const questionService = new QuestionManagementService();

// Middleware for admin authentication (matching existing pattern)
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check for admin password directly (matching existing admin routes pattern)
  const adminPassword = req.query.admin_password;
  console.log("Admin password received:", adminPassword);
  
  if (adminPassword !== "BIGSURF55") {
    console.log("Admin password incorrect, access denied");
    return res.status(403).json({ message: "Forbidden: Admin access required. Password incorrect." });
  }
  
  console.log("Admin password correct, proceeding");
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

export default router; 