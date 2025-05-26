import type { Express, Request, Response } from "express";
import { ModuleManager } from "./moduleManager";
import { db } from "../db";
import { learningModules } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { TrainingModuleTemplate } from "../moduleContentTemplates";
import { templateToLearningModule, validateModuleTemplate, defaultModuleTemplate } from "../moduleContentTemplates";

/**
 * Register module management routes
 * 
 * This adds the necessary API endpoints for managing learning modules
 * and ensuring they're not lost or accidentally removed.
 */
export function registerModuleManagementRoutes(app: Express) {
  // Get all modules with visibility status for admin panel
  app.get("/api/modules/management", async (req: Request, res: Response) => {
    try {
      const allModules = await ModuleManager.getAllModulesWithVisibility();
      res.json(allModules);
    } catch (error) {
      console.error("Error getting modules with visibility:", error);
      res.status(500).json({ message: "Failed to retrieve modules" });
    }
  });

  // Get only visible modules for dashboard
  app.get("/api/modules/visible", async (req: Request, res: Response) => {
    try {
      const visibleModules = await ModuleManager.getVisibleModules();
      res.json(visibleModules);
    } catch (error) {
      console.error("Error getting visible modules:", error);
      res.status(500).json({ message: "Failed to retrieve visible modules" });
    }
  });

  // Update module visibility
  app.patch("/api/modules/:id/visibility", async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      const { visible } = req.body;

      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }

      if (typeof visible !== 'boolean') {
        return res.status(400).json({ message: "Visibility must be a boolean" });
      }

      // Update module visibility
      const success = await ModuleManager.updateModuleVisibility(moduleId, visible);

      if (success) {
        res.json({ success: true, message: `Module visibility set to ${visible}` });
      } else {
        res.status(404).json({ message: "Module not found or update failed" });
      }
    } catch (error) {
      console.error("Error updating module visibility:", error);
      res.status(500).json({ message: "Failed to update module visibility" });
    }
  });

  // Run system verification and restore missing modules
  app.get("/api/modules/verify", async (req: Request, res: Response) => {
    try {
      const result = await ModuleManager.verifyAndRestoreEssentialModules();
      res.json(result);
    } catch (error) {
      console.error("Error verifying modules:", error);
      res.status(500).json({ message: "Failed to verify modules" });
    }
  });
  
  // Get the default module template for new module creation
  app.get("/api/modules/template", async (req: Request, res: Response) => {
    try {
      res.json(defaultModuleTemplate);
    } catch (error) {
      console.error("Error getting module template:", error);
      res.status(500).json({ message: "Failed to retrieve module template" });
    }
  });
  
  // Get a specific module in template format
  app.get("/api/modules/:id/template", async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const template = await ModuleManager.convertModuleToTemplate(moduleId);
      
      if (!template) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error getting module template:", error);
      res.status(500).json({ message: "Failed to retrieve module template" });
    }
  });
  
  // Create a new module using the template structure
  app.post("/api/modules/template", async (req: Request, res: Response) => {
    try {
      const moduleTemplate: TrainingModuleTemplate = req.body;
      
      // Validate the template
      const validation = validateModuleTemplate(moduleTemplate);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Invalid module template", 
          errors: validation.errors 
        });
      }
      
      // Convert the template to a database-compatible learning module
      const moduleData = templateToLearningModule(moduleTemplate);
      
      // Add school ID if available (from session)
      if (req.user && req.user.schoolId) {
        moduleData.schoolId = req.user.schoolId;
      }
      
      // Create the module
      const createdModule = await ModuleManager.createModuleFromTemplate(moduleData);
      
      res.status(201).json(createdModule);
    } catch (error) {
      console.error("Error creating module from template:", error);
      res.status(500).json({ message: "Failed to create module from template" });
    }
  });
  
  // Update an existing module using the template structure
  app.put("/api/modules/:id/template", async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const moduleTemplate: TrainingModuleTemplate = req.body;
      
      // Validate the template
      const validation = validateModuleTemplate(moduleTemplate);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Invalid module template", 
          errors: validation.errors 
        });
      }
      
      // Convert the template to a database-compatible learning module
      const moduleData = templateToLearningModule(moduleTemplate);
      
      // Update the module
      const updatedModule = await ModuleManager.updateModuleFromTemplate(moduleId, moduleData);
      
      if (!updatedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Error updating module from template:", error);
      res.status(500).json({ message: "Failed to update module from template" });
    }
  });
}