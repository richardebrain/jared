import { db } from "../db";
import { LearningModule, learningModules, InsertLearningModule } from "@shared/schema";
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
    
    // Update schema for module ratings and community sharing
    try {
      // Import here to avoid circular dependencies
      const { updateSchemaForRatings } = await import("./updateSchemaForRatings");
      await updateSchemaForRatings();
    } catch (error) {
      console.error("Error updating schema for module ratings:", error);
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
  
  /**
   * Create a new module from template
   * 
   * Creates a new learning module in the database using the provided template data.
   * This handles the conversion from the template format to the database format.
   */
  static async createModuleFromTemplate(moduleData: Partial<LearningModule>): Promise<LearningModule> {
    // First ensure default values are set for required fields
    const moduleToInsert = {
      title: moduleData.title || "New Module",
      description: moduleData.description || "",
      duration: moduleData.duration || 60,
      pointValue: moduleData.pointValue || 10,
      difficulty: moduleData.difficulty || "intermediate",
      category: moduleData.category || "Professional Development",
      content: moduleData.content || "",
      quiz: moduleData.quiz || { questions: [] },
      featured: moduleData.featured || false,
      isVisible: moduleData.isVisible !== undefined ? moduleData.isVisible : true,
      schoolId: moduleData.schoolId || null,
      imageUrl: moduleData.imageUrl || null,
      // Set defaults for rating fields
      averageRating: 0,
      ratingCount: 0,
      isSharedToCommunity: false
    } as InsertLearningModule;
    
    // Insert the module
    const [createdModule] = await db.insert(learningModules)
      .values(moduleToInsert)
      .returning();
    
    return createdModule;
  }
  
  /**
   * Update a module from template
   * 
   * Updates an existing learning module in the database using the provided template data.
   * This handles the conversion from the template format to the database format.
   */
  static async updateModuleFromTemplate(
    moduleId: number,
    moduleData: Partial<LearningModule>
  ): Promise<LearningModule | null> {
    // Check if module exists
    const existingModule = await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.id, moduleId)
    });
    
    if (!existingModule) {
      return null;
    }
    
    // Update the module
    await db.update(learningModules)
      .set({
        title: moduleData.title || existingModule.title,
        description: moduleData.description || existingModule.description,
        duration: moduleData.duration || existingModule.duration,
        pointValue: moduleData.pointValue || existingModule.pointValue,
        difficulty: moduleData.difficulty || existingModule.difficulty,
        category: moduleData.category || existingModule.category,
        content: moduleData.content || existingModule.content,
        quiz: moduleData.quiz || existingModule.quiz,
        featured: moduleData.featured !== undefined ? moduleData.featured : existingModule.featured,
        isVisible: moduleData.isVisible !== undefined ? moduleData.isVisible : existingModule.isVisible,
        imageUrl: moduleData.imageUrl || existingModule.imageUrl
      })
      .where(eq(learningModules.id, moduleId));
    
    // Retrieve and return the updated module
    const updatedModule = await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.id, moduleId)
    });
    
    return updatedModule;
  }
  
  /**
   * Extract a module to template format
   * 
   * This takes an existing learning module and converts it back to the template format
   * so it can be edited in the module editor.
   */
  static async convertModuleToTemplate(moduleId: number): Promise<any> {
    const module = await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.id, moduleId)
    });
    
    if (!module) {
      return null;
    }
    
    try {
      // Parse the content to extract the template sections
      // This is a simplified version that works with the template format
      // used in moduleContentTemplates.ts
      const contentHtml = module.content || '';
      
      // Extract objective
      const objectiveMatch = contentHtml.match(/<section class="objective">[\s\S]*?<p>([\s\S]*?)<\/p>/);
      const objective = objectiveMatch ? objectiveMatch[1].trim() : '';
      
      // Extract intro video URL
      const videoMatch = contentHtml.match(/data-video-url="([\s\S]*?)"/);
      const videoUrl = videoMatch ? videoMatch[1].trim() : '';
      
      // Extract downloadable resource
      const resourceMatch = contentHtml.match(/<a href="([\s\S]*?)" class="resource-download"/);
      const resourceUrl = resourceMatch ? resourceMatch[1].trim() : '';
      
      // Extract interactive scenario
      const scenarioMatch = contentHtml.match(/<div class="scenario-description">[\s\S]*?<p>([\s\S]*?)<\/p>/);
      const scenario = scenarioMatch ? scenarioMatch[1].trim() : '';
      
      // Extract scenario choices JSON
      const choicesMatch = contentHtml.match(/data-scenario-json='([\s\S]*?)'/);
      let choices = [];
      if (choicesMatch) {
        try {
          choices = JSON.parse(choicesMatch[1]);
        } catch (err) {
          console.error("Error parsing scenario choices:", err);
        }
      }
      
      // Extract reflection prompt
      const reflectionMatch = contentHtml.match(/<div class="reflection-prompt">[\s\S]*?<p>([\s\S]*?)<\/p>/);
      const reflectionPrompt = reflectionMatch ? reflectionMatch[1].trim() : '';
      
      // Build the template object
      return {
        title: module.title,
        objective: objective || module.description,
        
        introVideo: {
          title: "Why This Topic Matters",
          videoUrl,
          duration: 3 // Default
        },
        
        downloadableResource: {
          title: "Printable Support Tool",
          fileUrl: resourceUrl,
          fileType: "PDF" // Default
        },
        
        interactiveScenario: {
          title: "Choose Your Own Response",
          scenario: scenario || "Describe a real-life preschool scenario related to this topic...",
          choices: choices.length > 0 ? choices : [
            {
              text: "Option A",
              isCorrect: false,
              feedback: { explanation: "This is feedback for option A" }
            },
            {
              text: "Option B",
              isCorrect: true,
              feedback: { explanation: "This is feedback for option B" }
            }
          ]
        },
        
        quiz: module.quiz || {
          questions: []
        },
        
        reflectionPrompt: {
          prompt: reflectionPrompt || "What's your personal approach or tip for handling this topic?",
          allowUpload: true
        },
        
        completionBadge: {
          name: `${module.title} Badge`,
          imageUrl: module.imageUrl || "",
        },
        
        trackingMetrics: {
          requiredCompletion: false,
          estimatedDuration: module.duration,
          targetTeacherLevel: module.difficulty === "advanced" ? "Lead" : 
                              module.difficulty === "beginner" ? "New" : "All"
        }
      };
    } catch (error) {
      console.error("Error converting module to template:", error);
      return null;
    }
  }
}