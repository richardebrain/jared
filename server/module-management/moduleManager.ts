import { db } from "../db";
import { learningModules, type LearningModule, type InsertLearningModule } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createRaisingArizonaCoreModule } from "../createCoreModule";
import { createChapterOneModule } from "../createChapterOneModule";
import { createMindfulMorningsModule } from "./createMindfulMorningsModule";

/**
 * ModuleManager
 * 
 * This utility class ensures that core training modules are never lost
 * and provides a way to control module visibility on the dashboard.
 */
export class ModuleManager {
  /**
   * Verify and restore essential modules
   * 
   * This function checks if all required training modules exist
   * and restores any missing modules from their original definitions.
   */
  static async verifyAndRestoreEssentialModules(): Promise<{
    success: boolean;
    fixed: number;
    modules: string[];
  }> {
    try {
      console.log("Verifying essential training modules...");
      
      const fixedModules: string[] = [];
      let fixCount = 0;
      
      // Check for Core Values module
      const coreValuesModule = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, "Raising Arizona's CORE")
      });
      
      if (!coreValuesModule) {
        console.log("Core Values module missing - restoring...");
        const restored = await createRaisingArizonaCoreModule();
        if (restored) {
          fixedModules.push("Raising Arizona's CORE");
          fixCount++;
          console.log("Core Values module restored with ID:", restored.id);
        }
      }
      
      // Check for Chapter One module
      const chapterOneModule = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, "Chapter 1: Building a Human")
      });
      
      if (!chapterOneModule) {
        console.log("Chapter One module missing - restoring...");
        const restored = await createChapterOneModule();
        if (restored) {
          fixedModules.push("Chapter 1: Building a Human");
          fixCount++;
          console.log("Chapter One module restored with ID:", restored.id);
        }
      }
      
      // Check for Mindful Mornings module
      const mindfulMorningsModule = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, "Mindful Morning")
      });
      
      if (!mindfulMorningsModule) {
        console.log("Mindful Mornings module missing - restoring...");
        const restored = await createMindfulMorningsModule();
        if (restored) {
          fixedModules.push("Mindful Morning");
          fixCount++;
          console.log("Mindful Mornings module restored with ID:", restored.id);
        }
      }
      
      return {
        success: true,
        fixed: fixCount,
        modules: fixedModules
      };
    } catch (error) {
      console.error("Error in verifyAndRestoreEssentialModules:", error);
      return {
        success: false,
        fixed: 0,
        modules: []
      };
    }
  }
  
  /**
   * Update module visibility on dashboard
   * 
   * This allows administrators to control which modules appear
   * on the dashboard without deleting them from the database.
   */
  static async updateModuleVisibility(
    moduleId: number, 
    visible: boolean
  ): Promise<boolean> {
    try {
      await db.update(learningModules)
        .set({ featured: visible })
        .where(eq(learningModules.id, moduleId));
      
      return true;
    } catch (error) {
      console.error("Error updating module visibility:", error);
      return false;
    }
  }
  
  /**
   * Get all modules with visibility status
   * 
   * Returns all modules with their visibility settings for the admin panel
   */
  static async getAllModulesWithVisibility(): Promise<LearningModule[]> {
    try {
      const allModules = await db.select().from(learningModules);
      return allModules;
    } catch (error) {
      console.error("Error getting modules with visibility:", error);
      return [];
    }
  }
  
  /**
   * Get visible modules for dashboard
   * 
   * Returns only modules that should be shown on the dashboard
   */
  static async getVisibleModules(): Promise<LearningModule[]> {
    try {
      const visibleModules = await db.select()
        .from(learningModules)
        .where(eq(learningModules.featured, true));
      
      return visibleModules;
    } catch (error) {
      console.error("Error getting visible modules:", error);
      return [];
    }
  }
  
  /**
   * Run verification during server startup
   * 
   * This should be called when the server starts to ensure
   * all essential modules are present
   */
  static async runStartupVerification(): Promise<void> {
    try {
      console.log("Running module system verification at startup...");
      const result = await this.verifyAndRestoreEssentialModules();
      
      if (result.fixed > 0) {
        console.log(`Restored ${result.fixed} missing modules: ${result.modules.join(", ")}`);
      } else {
        console.log("All essential modules are present and accounted for.");
      }
    } catch (error) {
      console.error("Error during startup verification:", error);
    }
  }
}