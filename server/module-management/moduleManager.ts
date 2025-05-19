import { db } from "../db";
import { LearningModule, learningModules } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { createRaisingArizonaCoreModule } from "../createCoreModule";
import { createChapterOneModule } from "../createChapterOneModule";
import { createMindfulMorningsModule } from "../createMindfulMorningsModule";

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
    restored: LearningModule[];
    alreadyExisting: LearningModule[];
  }> {
    const restored: LearningModule[] = [];
    const alreadyExisting: LearningModule[] = [];

    // List of essential module titles
    const essentialModules = [
      "Raising Arizona's CORE",
      "Chapter 1: Building a Human",
      "Mindful Morning"
    ];

    // Check each essential module
    for (const moduleTitle of essentialModules) {
      const module = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, moduleTitle)
      });

      if (!module) {
        console.log(`Restoring missing essential module: ${moduleTitle}`);
        
        // Restore the specific module
        let restoredModule: LearningModule | null = null;
        
        if (moduleTitle === "Raising Arizona's CORE") {
          restoredModule = await createRaisingArizonaCoreModule();
        } else if (moduleTitle === "Chapter 1: Building a Human") {
          restoredModule = await createChapterOneModule();
        } else if (moduleTitle === "Mindful Morning") {
          restoredModule = await createMindfulMorningsModule();
        }
        
        if (restoredModule) {
          restored.push(restoredModule);
        }
      } else {
        alreadyExisting.push(module);
      }
    }

    return { restored, alreadyExisting };
  }

  /**
   * Update module visibility on dashboard
   * 
   * This allows administrators to control which modules appear
   * on the dashboard without deleting them from the database.
   */
  static async updateModuleVisibility(
    moduleId: number,
    isVisible: boolean
  ): Promise<LearningModule | null> {
    // Use SQL directly to avoid schema mismatch issue
    await db.execute(
      sql`UPDATE learning_modules 
          SET is_visible = ${isVisible}, 
              updated_at = ${new Date()} 
          WHERE id = ${moduleId}`
    );
    
    return await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.id, moduleId)
    });
  }

  /**
   * Get all modules with visibility status
   * 
   * Returns all modules with their visibility settings for the admin panel
   */
  static async getAllModulesWithVisibility(): Promise<LearningModule[]> {
    return await db.query.learningModules.findMany({
      orderBy: (modules, { desc }) => [desc(modules.createdAt)]
    });
  }

  /**
   * Get visible modules for dashboard
   * 
   * Returns only modules that should be shown on the dashboard
   */
  static async getVisibleModules(): Promise<LearningModule[]> {
    // Use direct SQL query to avoid schema mismatch
    const modules = await db.execute(
      sql`SELECT * FROM learning_modules 
          WHERE is_visible = TRUE 
          ORDER BY created_at DESC`
    );
    
    return modules.rows as LearningModule[];
  }

  /**
   * Run verification during server startup
   * 
   * This should be called when the server starts to ensure
   * all essential modules are present
   */
  static async runStartupVerification(): Promise<void> {
    console.log("Running module system verification...");
    const { restored, alreadyExisting } = await this.verifyAndRestoreEssentialModules();
    
    if (restored.length > 0) {
      console.log(`Restored ${restored.length} missing modules: ${restored.map(m => m.title).join(", ")}`);
    } else {
      console.log(`All essential modules are present (${alreadyExisting.length} modules)`);
    }
    
    // Fix any modules with isVisible set to null by setting them to true (visible)
    try {
      await db.execute(
        sql`UPDATE learning_modules 
            SET is_visible = TRUE 
            WHERE is_visible IS NULL`
      );
      console.log("Updated visibility for modules with null visibility");
    } catch (error) {
      console.error("Error updating module visibility:", error);
    }
  }
}