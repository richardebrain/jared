import type { Express } from "express";
import { ModuleManager } from "./module-management/moduleManager";

/**
 * Register API routes for module management
 * This provides the module management routes that connect our 
 * frontend with the backend for controlling learning module visibility
 */
export function registerModuleRoutes(app: Express): void {
  // This route has been moved to routes.ts to avoid conflicts
  /* app.get("/api/modules/management", async (req, res) => {
    try {
      const allModules = await ModuleManager.getAllModulesWithVisibility();
      res.json(allModules);
    } catch (error) {
      console.error("Error getting modules with visibility:", error);
      res.status(500).json({ message: "Failed to retrieve modules" });
    }
  }); */

  // This route has been moved to routes.ts to avoid conflicts
  /* app.get("/api/modules/visible", async (req, res) => {
    try {
      const visibleModules = await ModuleManager.getVisibleModules();
      res.json(visibleModules);
    } catch (error) {
      console.error("Error getting visible modules:", error);
      res.status(500).json({ message: "Failed to retrieve visible modules" });
    }
  }); */

  // This route has been moved to routes.ts to avoid conflicts
  /* app.patch("/api/modules/:id/visibility", async (req, res) => {
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
      const updatedModule = await ModuleManager.updateModuleVisibility(moduleId, visible);

      if (updatedModule) {
        res.json({ 
          success: true, 
          message: `Module visibility set to ${visible}`,
          module: updatedModule
        });
      } else {
        res.status(404).json({ message: "Module not found or update failed" });
      }
    } catch (error) {
      console.error("Error updating module visibility:", error);
      res.status(500).json({ message: "Failed to update module visibility" });
    }
  }); */

  // Run system verification and restore missing modules
  app.get("/api/modules/verify", async (req, res) => {
    try {
      const result = await ModuleManager.verifyAndRestoreEssentialModules();
      res.json(result);
    } catch (error) {
      console.error("Error verifying modules:", error);
      res.status(500).json({ message: "Failed to verify modules" });
    }
  });
  
  console.log('Module management routes registered');
}