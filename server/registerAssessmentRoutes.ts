import type { Express } from "express";
import assessmentRouter from "./api/assessment-adapter";
import assessmentSessionRouter from "./api/assessment-session";
import { db } from './db';
import { 
  assessments, 
  assessmentResults, 
  learningPaths,
  users,
  type User
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Register API routes for the assessment system
 * This provides both the legacy assessment adapter routes and 
 * the new session management routes for the enhanced assessment system
 */
export function registerAssessmentRoutes(app: Express): void {
  // New assessment session management for eligible educators (register first to avoid conflicts)
  app.use('/api/assessment/session', assessmentSessionRouter);
  
  // Global assessment results endpoint - proper implementation with authentication
  app.get('/api/assessment-results', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          message: "Authentication required",
          details: "Please log in to access your assessment results."
        });
      }

      const userId = req.session.userId as number;

      // Get the most recent completed assessment for this user
      const userAssessment = await db.select()
        .from(assessments)
        .where(and(
          eq(assessments.userId, userId),
          eq(assessments.type, 'initial'),
          eq(assessments.completed, true)
        ))
        .orderBy(desc(assessments.completedAt))
        .limit(1);

      if (!userAssessment || userAssessment.length === 0) {
        return res.status(404).json({
          message: "No completed assessment found",
          details: "You haven't completed an assessment yet, or your assessment results are being processed."
        });
      }

      const assessment = userAssessment[0];

      // Get stored results from assessmentResults table
      const storedResults = await db.select()
        .from(assessmentResults)
        .where(eq(assessmentResults.assessmentId, assessment.id))
        .limit(1);

      if (!storedResults || storedResults.length === 0) {
        return res.status(404).json({
          message: "Assessment results not found",
          details: "Your assessment results are still being processed. Please try again in a few moments."
        });
      }

      const results = storedResults[0];

      // Get learning path if available (from EP-001-10)
      const learningPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.assessmentId, assessment.id))
        .limit(1);

      // Return comprehensive results for display
      res.status(200).json({
        success: true,
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
      console.error('Error retrieving assessment results:', error);
      res.status(500).json({
        message: "Error retrieving assessment results",
        details: "An internal error occurred while fetching your results."
      });
    }
  });
  
  // Legacy assessment adapter for compatibility (register after more specific routes)
  app.use('/api/assessment', assessmentRouter);
  
  console.log('Assessment API routes registered');
  console.log('- Session management: /api/assessment/session/*');
  console.log('- Global results: /api/assessment-results');
  console.log('- Legacy adapter: /api/assessment/*');
}