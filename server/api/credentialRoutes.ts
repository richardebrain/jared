import express from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkAuth } from "../middleware/auth";
import { logger } from "../logger";
import { storage } from "../storage";
import { sendCredentialExpirationNotification } from "../services/notificationService";

const router = express.Router();

// Authentication middleware
router.use(checkAuth);

// Validate credential update schema
const updateCredentialSchema = z.object({
  userId: z.number(),
  field: z.enum(["fingerprintExpiration", "cprExpiration", "firstAidExpiration", "foodHandlerExpiration"]),
  date: z.string().refine(val => {
    // Basic date validation
    return !val || /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, { message: "Invalid date format. Use YYYY-MM-DD" }),
});

// Update credential endpoint
router.post("/update-credential", async (req, res) => {
  try {
    // Validate request body
    const result = updateCredentialSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }
    
    const { userId, field, date } = result.data;
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check authorization - only admins can edit other users' credentials
    const sessionUserId = req.session.userId;
    if (sessionUserId !== userId && !(req.user && (req.user.isAdmin || req.user.isSchoolAdmin))) {
      return res.status(403).json({ error: "Unauthorized to update this user's credentials" });
    }
    
    // Update the credential
    await db.update(users)
      .set({ [field]: date || null })
      .where(eq(users.id, userId));

    // Get the updated user
    const updatedUser = await storage.getUser(userId);
    
    res.status(200).json({
      message: "Credential updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error("Error updating credential:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user credentials
router.get("/credentials/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check authorization - only admins can view other users' credentials
    const sessionUserId = req.session.userId;
    if (sessionUserId !== userId && !(req.user && (req.user.isAdmin || req.user.isSchoolAdmin))) {
      return res.status(403).json({ error: "Unauthorized to view this user's credentials" });
    }
    
    // Return the credentials
    const credentials = {
      fingerprintExpiration: user.fingerprintExpiration,
      cprExpiration: user.cprExpiration,
      firstAidExpiration: user.firstAidExpiration,
      foodHandlerExpiration: user.foodHandlerExpiration,
    };
    
    res.status(200).json(credentials);
  } catch (error) {
    logger.error("Error fetching credentials:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check for expiring credentials (for all users)
router.get("/check-expiring-credentials", async (req, res) => {
  try {
    // Only admins and school admins can check expiring credentials for all users
    if (!req.user.isAdmin && !req.user.isSchoolAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Get all users with their credentials
    const allUsers = await db.select().from(users);
    
    // Check for expiring credentials (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const usersWithExpiringCredentials = allUsers.filter(user => {
      // Get all expiration dates
      const expirationDates = [
        user.fingerprintExpiration && new Date(user.fingerprintExpiration),
        user.cprExpiration && new Date(user.cprExpiration),
        user.firstAidExpiration && new Date(user.firstAidExpiration),
        user.foodHandlerExpiration && new Date(user.foodHandlerExpiration),
      ].filter(Boolean);
      
      // Check if any credential is expiring within 30 days
      return expirationDates.some(date => 
        date && date > today && date <= thirtyDaysFromNow
      );
    });
    
    // Format the results
    const expiringCredentials = usersWithExpiringCredentials.map(user => {
      const creds = {
        userId: user.id,
        username: user.username,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        credentials: {
          fingerprint: user.fingerprintExpiration && new Date(user.fingerprintExpiration) <= thirtyDaysFromNow 
            ? user.fingerprintExpiration : null,
          cpr: user.cprExpiration && new Date(user.cprExpiration) <= thirtyDaysFromNow 
            ? user.cprExpiration : null,
          firstAid: user.firstAidExpiration && new Date(user.firstAidExpiration) <= thirtyDaysFromNow 
            ? user.firstAidExpiration : null,
          foodHandler: user.foodHandlerExpiration && new Date(user.foodHandlerExpiration) <= thirtyDaysFromNow 
            ? user.foodHandlerExpiration : null,
        }
      };
      
      return creds;
    });
    
    res.status(200).json(expiringCredentials);
  } catch (error) {
    logger.error("Error checking expiring credentials:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;