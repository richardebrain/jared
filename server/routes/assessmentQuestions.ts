import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { assessmentQuestions, users } from '@shared/schema';
import { importECEQuestions } from '../importECEQuestions';
import { eq } from 'drizzle-orm';

const router = Router();

// Add proper type definitions for Express
declare module 'express-session' {
  interface SessionData {
    userId: number;
    loginTime?: string;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Admin authorization middleware
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    // Get user from database to check admin status
    const userId = req.session.userId;
    const userResults = await db.select().from(users).where(eq(users.id, userId));
    const user = userResults.length > 0 ? userResults[0] : null;
    
    if (!user || (!user.isAdmin && !user.isOwner)) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all assessment questions (with pagination and filtering)
router.get('/api/assessment-questions', requireAuth, async (req, res) => {
  try {
    const { domain, difficulty, limit = 20, offset = 0 } = req.query;
    
    let query = db.select().from(assessmentQuestions);
    
    if (domain) {
      query = query.where(eq(assessmentQuestions.domain, domain as string));
    }
    
    if (difficulty) {
      query = query.where(eq(assessmentQuestions.difficulty, difficulty as string));
    }
    
    // Apply pagination
    query = query.limit(Number(limit)).offset(Number(offset));
    
    const questions = await query;
    
    // Count total for pagination
    const totalCountQuery = db.select({ count: db.fn.count() }).from(assessmentQuestions);
    
    let countResult;
    if (domain) {
      countResult = await totalCountQuery.where(eq(assessmentQuestions.domain, domain as string));
    } else if (difficulty) {
      countResult = await totalCountQuery.where(eq(assessmentQuestions.difficulty, difficulty as string));
    } else {
      countResult = await totalCountQuery;
    }
    
    const total = countResult.length > 0 ? Number(countResult[0].count) : 0;
    
    res.json({
      questions,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    res.status(500).json({ error: 'Failed to fetch assessment questions' });
  }
});

// Get assessment question domains (for filtering)
router.get('/api/assessment-question-domains', requireAuth, async (req, res) => {
  try {
    const domains = await db.selectDistinct({ domain: assessmentQuestions.domain }).from(assessmentQuestions);
    res.json(domains.map(d => d.domain));
  } catch (error) {
    console.error('Error fetching assessment question domains:', error);
    res.status(500).json({ error: 'Failed to fetch question domains' });
  }
});

// Get assessment question difficulties (for filtering)
router.get('/api/assessment-question-difficulties', requireAuth, async (req, res) => {
  try {
    const difficulties = await db.selectDistinct({ difficulty: assessmentQuestions.difficulty }).from(assessmentQuestions);
    res.json(difficulties.map(d => d.difficulty));
  } catch (error) {
    console.error('Error fetching assessment question difficulties:', error);
    res.status(500).json({ error: 'Failed to fetch question difficulties' });
  }
});

// Import ECE questions - admin only
router.post('/api/admin/import-ece-questions', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Run the import
    const result = await importECEQuestions();
    
    res.json({
      message: 'Import completed successfully',
      success: result.success,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error importing ECE questions:', error);
    res.status(500).json({ error: 'Failed to import ECE questions' });
  }
});

export default router;