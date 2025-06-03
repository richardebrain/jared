import type { Express } from "express";
import assessmentRouter from "./api/assessment-adapter";
import assessmentSessionRouter from "./api/assessment-session";

/**
 * Register API routes for the assessment system
 * This provides both the legacy assessment adapter routes and 
 * the new session management routes for the enhanced assessment system
 */
export function registerAssessmentRoutes(app: Express): void {
  // New assessment session management for eligible educators (register first to avoid conflicts)
  app.use('/api/assessment/session', assessmentSessionRouter);
  
  // Global assessment results endpoint (delegates to session results)
  app.get('/api/assessment-results', async (req, res) => {
    // Delegate to the session results endpoint
    try {
      const sessionResultsUrl = '/api/assessment/session/results';
      // Forward the request to the session results endpoint
      req.url = sessionResultsUrl;
      req.baseUrl = '';
      assessmentSessionRouter(req, res, () => {
        res.status(404).json({
          message: "Assessment results not found",
          details: "No assessment results available for this user."
        });
      });
    } catch (error) {
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