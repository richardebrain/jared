import { Router } from "express";
import { storage } from "../storage";
import { insertCommunityModuleSchema } from "@shared/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { CommunityModuleManager } from "../communityModules";

// Auth middleware
const requireAuth = async (req: any, res: any, next: any) => {
  // Check if the user is authenticated (has active session)
  if (!req.session || !req.session.userId) {
    console.log("Auth check - No session or userId");
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.log(`Auth check - User ${userId} not found in database`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // User is authenticated, proceed to next middleware
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Paid access middleware
const requirePaidAccess = async (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.session.userId;
    const accessStatus = await storage.checkUserAccessStatus(userId);
    
    if (!accessStatus.hasAccess) {
      return res.status(403).json({ 
        message: "Access denied",
        reason: accessStatus.reason || "Your school's subscription may have expired" 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in paid access middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin check middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!user.isAdmin && !user.isSchoolAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const router = Router();

// Get all community modules
router.get("/", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    // Get user's school ID to filter modules from other schools
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user || !user.schoolId) {
      return res.status(400).json({ message: "User not associated with a school" });
    }
    
    // Get all shared modules except those from user's own school
    const result = await db.execute(sql`
      SELECT cm.*, lm.title, lm.description, lm.duration, lm.image_url, 
             lm.difficulty, lm.category, lm.average_rating, lm.rating_count,
             s.name as school_name
      FROM community_modules cm
      JOIN learning_modules lm ON cm.module_id = lm.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      WHERE cm.status = 'active' 
        AND cm.shared_by_school_id != ${user.schoolId}
      ORDER BY lm.average_rating DESC, cm.shared_date DESC
    `);
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving community modules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get top rated community modules
router.get("/top", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 2;
    
    // Get user's school ID to filter modules from other schools
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user || !user.schoolId) {
      return res.status(400).json({ message: "User not associated with a school" });
    }
    
    // Get top rated shared modules except those from user's own school
    const result = await db.execute(sql`
      SELECT cm.*, lm.title, lm.description, lm.duration, lm.image_url, 
             lm.difficulty, lm.category, lm.average_rating, lm.rating_count,
             s.name as school_name
      FROM community_modules cm
      JOIN learning_modules lm ON cm.module_id = lm.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      WHERE cm.status = 'active' 
      ORDER BY lm.average_rating DESC, cm.shared_date DESC
      LIMIT ${limit}
    `);
    // AND cm.shared_by_school_id != ${user.schoolId}
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving top community modules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Share a module with the community
router.post("/share", requireAuth, requirePaidAccess, requireAdmin, async (req, res) => {
  try {
    const { moduleId } = req.body;
    
    if (!moduleId) {
      return res.status(400).json({ message: "Module ID is required" });
    }
    
    // Get user's school ID
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user || !user.schoolId) {
      return res.status(400).json({ message: "User not associated with a school" });
    }
    
    // Check if module exists
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Check if module duration is 30 minutes or less
    if (module.duration > 30) {
      return res.status(400).json({ 
        message: "Module too long for community sharing",
        details: "Community modules must be 30 minutes or less in duration"
      });
    }
    
    // Check if this module is already shared
    const existingShared = await db.execute(sql`
      SELECT * FROM community_modules
      WHERE module_id = ${moduleId}
    `);
    
    if (existingShared.rows.length > 0) {
      return res.status(400).json({ 
        message: "Module already shared",
        details: "This module has already been shared with the community"
      });
    }
    
    // Update the module to mark it as shared
    await db.execute(sql`
      UPDATE learning_modules
      SET is_shared_to_community = TRUE
      WHERE id = ${moduleId}
    `);
    
    // Create a new community module entry
    await db.execute(sql`
      INSERT INTO community_modules (module_id, shared_by_school_id, status)
      VALUES (${moduleId}, ${user.schoolId}, 'active')
    `);
    
    return res.status(200).json({
      message: "Module successfully shared with the community",
      moduleId
    });
  } catch (error) {
    console.error("Error sharing module with community:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Remove a module from community sharing
router.delete("/:moduleId", requireAuth, requirePaidAccess, requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    
    // Get user's school ID
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user || !user.schoolId) {
      return res.status(400).json({ message: "User not associated with a school" });
    }
    
    // Check if this school owns the module
    const communityModule = await db.execute(sql`
      SELECT * FROM community_modules
      WHERE module_id = ${moduleId} AND shared_by_school_id = ${user.schoolId}
    `);
    
    if (communityModule.rows.length === 0) {
      return res.status(403).json({ 
        message: "Not authorized to remove this module",
        details: "You can only remove modules shared by your school"
      });
    }
    
    // Update the module to mark it as not shared
    await db.execute(sql`
      UPDATE learning_modules
      SET is_shared_to_community = FALSE
      WHERE id = ${moduleId}
    `);
    
    // Remove the community module entry
    await db.execute(sql`
      DELETE FROM community_modules
      WHERE module_id = ${moduleId}
    `);
    
    return res.status(200).json({
      message: "Module successfully removed from community sharing",
      moduleId
    });
  } catch (error) {
    console.error("Error removing module from community:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get modules in the current month's competition
router.get("/competition", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const competitionModules = await CommunityModuleManager.getCommunityModulesForCompetition();
    return res.status(200).json(competitionModules);
  } catch (error) {
    console.error("Error retrieving competition modules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get past competition winners
router.get("/winners", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const winners = await CommunityModuleManager.getPastCompetitionWinners();
    return res.status(200).json(winners);
  } catch (error) {
    console.error("Error retrieving competition winners:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get current month's leaderboard
router.get("/leaderboard", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const leaderboard = await CommunityModuleManager.getCurrentMonthLeaderboard();
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error retrieving competition leaderboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Trigger monthly prize awards (admin only)
router.post("/awards/process", requireAuth, requireAdmin, async (req, res) => {
  try {
    const awards = await CommunityModuleManager.awardMonthlyPrizes();
    return res.status(200).json({
      message: "Monthly prizes awarded successfully",
      awards
    });
  } catch (error) {
    console.error("Error awarding monthly prizes:", error);
    return res.status(500).json({ message: "Failed to award monthly prizes" });
  }
});

// Update the sharing process to notify users about competition
router.post("/share", requireAuth, requirePaidAccess, requireAdmin, async (req, res) => {
  try {
    const { moduleId } = req.body;
    
    if (!moduleId) {
      return res.status(400).json({ message: "Module ID is required" });
    }
    
    // Get user's school ID
    const userId = req.session.userId as number;
    const user = await storage.getUser(userId);
    
    if (!user || !user.schoolId) {
      return res.status(400).json({ message: "User not associated with a school" });
    }
    
    // Check if module exists
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Check if module duration is 30 minutes or less
    if (module.duration > 30) {
      return res.status(400).json({ 
        message: "Module too long for community sharing",
        details: "Community modules must be 30 minutes or less in duration"
      });
    }
    
    // Use the CommunityModuleManager instead of raw SQL
    try {
      const result = await CommunityModuleManager.shareModuleToCommunity(moduleId, user.schoolId);
      
      // Get current month competition info
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      return res.status(200).json({
        message: "Module successfully shared with the community",
        moduleId,
        competitionInfo: {
          message: `Your module has been entered into the ${currentMonth} ${currentYear} Community Module Competition!`,
          details: "The top-rated modules each month will earn points prizes. The competition ends on the last day of the month."
        }
      });
    } catch (error) {
      if (error.message === "Module is already shared to the community") {
        return res.status(400).json({ 
          message: "Module already shared",
          details: "This module has already been shared with the community"
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error sharing module with community:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;