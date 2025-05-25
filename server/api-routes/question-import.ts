/**
 * Question Import API Routes
 * Handles ECE question database import functionality
 */

import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerQuestionImportRoutes(app: Express) {
  // ECE Questions Import Endpoint - Admin Only
  app.post('/api/admin/import-questions', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Admin check - only certain users can access this endpoint
      const userId = req.session.userId;
      const adminUserIds = [4]; // Only the demo account (jlcookie20) has admin privileges
      
      // Simple password-based admin authentication
      const adminPassword = req.query.admin_password || req.body.admin_password;
      const isAdmin = adminPassword === "BIGSURF55" || adminUserIds.includes(userId);
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      console.log('Starting ECE question import process...');
      
      // Import the script functions dynamically
      const importModule = await import('../importQuestionsScript.js');
      
      // Path to the CSV file
      const csvPath = path.join(__dirname, '../../attached_assets/ece_master_database_full_with_why.csv');
      
      // Check if file exists
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
          success: false,
          message: 'Question database CSV file not found'
        });
      }
      
      // Import questions from the CSV file
      await importModule.importQuestionsFromCSV(csvPath);
      
      // Update the JSON file for client-side access
      await importModule.updateAssessmentQuestionsJson();
      
      return res.status(200).json({
        success: true,
        message: 'ECE question database imported successfully'
      });
    } catch (error) {
      console.error('Error importing ECE question database:', error);
      return res.status(500).json({
        success: false,
        message: 'Error importing questions',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}