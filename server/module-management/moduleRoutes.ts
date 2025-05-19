import { Express, Request, Response } from "express";
import { ModuleManager } from "./moduleManager";
import { db } from "../db";
import { learningModules } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Register module management routes
 * 
 * This adds the necessary API endpoints for managing learning modules
 * and ensuring they're not lost or accidentally removed.
 */
export function registerModuleManagementRoutes(app: Express, requireAdmin: any) {
  // Get all modules with visibility status for admin panel
  app.get("/api/modules/management", requireAdmin, async (req: Request, res: Response) => {
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
  app.patch("/api/modules/:id/visibility", requireAdmin, async (req: Request, res: Response) => {
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
  app.get("/api/modules/verify", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await ModuleManager.verifyAndRestoreEssentialModules();
      res.json(result);
    } catch (error) {
      console.error("Error verifying modules:", error);
      res.status(500).json({ message: "Failed to verify modules" });
    }
  });
}