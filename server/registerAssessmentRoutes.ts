import type { Express } from "express";
import assessmentRouter from "./api/assessment-adapter";

/**
 * Register API routes for the enhanced assessment system
 * This provides the assessment adapter routes that connect our 
 * frontend with the Python FastAPI backend for assessments
 */
export function registerAssessmentRoutes(app: Express): void {
  app.use('/api/assessment', assessmentRouter);
  console.log('Assessment API routes registered');
}