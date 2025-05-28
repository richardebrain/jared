import type { Express } from "express";
import assessmentRouter from "./api/assessment-adapter";
import assessmentSessionRouter from "./api/assessment-session";

/**
 * Register API routes for the assessment system
 * This provides both the legacy assessment adapter routes and 
 * the new session management routes for the enhanced assessment system
 */
export function registerAssessmentRoutes(app: Express): void {
  // New assessment session management for Teacher role users (register first to avoid conflicts)
  app.use('/api/assessment/session', assessmentSessionRouter);
  
  // Legacy assessment adapter for compatibility (register after more specific routes)
  app.use('/api/assessment', assessmentRouter);
  
  console.log('Assessment API routes registered');
  console.log('- Session management: /api/assessment/session/*');
  console.log('- Legacy adapter: /api/assessment/*');
}