import { Router } from "express";
import { storage } from "../storage";
// Module rating schema temporarily disabled
import { db } from "../db";
import { eq, sql } from "drizzle-orm";

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

const router = Router();

// Get all ratings for a module
router.get("/:moduleId", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    
    // First check if the module exists
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Get ratings for this module
    const ratings = await db.execute(sql`
      SELECT mr.*, u.username, u.first_name, u.last_name, u.profile_picture
      FROM module_ratings mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.module_id = ${moduleId}
      ORDER BY mr.created_at DESC
    `);
    
    return res.status(200).json(ratings.rows);
  } catch (error) {
    console.error("Error retrieving module ratings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Rate a module
router.post("/", requireAuth, requirePaidAccess, async (req, res) => {
  try {
    const userId = req.session.userId as number;
    
    // Validate the request data
    const validatedData = insertModuleRatingSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: "Invalid rating data",
        errors: validatedData.error.format()
      });
    }
    
    const { moduleId, rating, comment } = validatedData.data;
    
    // Check if the module exists
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    // Check if user has already rated this module
    const existingRating = await db.execute(sql`
      SELECT * FROM module_ratings
      WHERE user_id = ${userId} AND module_id = ${moduleId}
    `);
    
    if (existingRating.rows.length > 0) {
      // Update existing rating
      await db.execute(sql`
        UPDATE module_ratings
        SET rating = ${rating}, comment = ${comment}
        WHERE user_id = ${userId} AND module_id = ${moduleId}
      `);
    } else {
      // Create new rating
      await db.execute(sql`
        INSERT INTO module_ratings (user_id, module_id, rating, comment)
        VALUES (${userId}, ${moduleId}, ${rating}, ${comment})
      `);
    }
    
    // Update module average rating and count
    const ratingStats = await db.execute(sql`
      SELECT AVG(rating) as average, COUNT(*) as count
      FROM module_ratings
      WHERE module_id = ${moduleId}
    `);
    
    const averageRating = Math.round(ratingStats.rows[0].average);
    const ratingCount = parseInt(ratingStats.rows[0].count);
    
    // Update the module with new rating stats
    await db.execute(sql`
      UPDATE learning_modules
      SET average_rating = ${averageRating}, rating_count = ${ratingCount}
      WHERE id = ${moduleId}
    `);
    
    return res.status(200).json({
      message: "Rating submitted successfully",
      averageRating,
      ratingCount
    });
  } catch (error) {
    console.error("Error submitting module rating:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;