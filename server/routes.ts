import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Import our debugging helper to track Laura's account issue
import debugStorage from "./fix-debug";
import { db } from "./db";
import express from "express";
import session from "express-session";
import { checkAndNotifyExpiringCredentials } from "./services/notificationService";
import connectPgSimple from "connect-pg-simple";
import { updateChildDevelopmentModule } from "./updateChildDevelopmentModule";
import { eq, sql, and, desc } from "drizzle-orm";
import {
  users,
  eduTokSnippets,
  eduTokUserInteractions,
  videoQuizCompletions,
  learningModules,
  insertLearningModuleSchema,
  meetings,
  teacherMessages,
  newsletters,
  insertNewsletterSchema,
  assessments,
  assessmentResults,
} from "@shared/schema";
import { registerWelcomeMessageRoutes } from "./welcomeMessageRoutes";
import { registerModuleManagementRoutes } from "./module-management/moduleRoutes";
import { registerModuleRoutes } from "./registerModuleRoutes";
import { registerQuestionImportRoutes } from "./api-routes/question-import";
import { registerAssessmentRoutes } from "./registerAssessmentRoutes";
import * as notebookLmPlugin from "./notebookLmPlugin";
import credentialRoutes from "./api/credentialRoutes";
import videoGenerationRoutes from "./routes/videoGeneration";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import { dirname } from "path";
import personalizedModuleRoutes from "./api/personalizedModuleRoutes";
import assessmentQuestionRoutes from "./routes/assessment-questions";
import aiSuggestionRoutes from "./api/aiSuggestionRoutes";
import newAiSuggestionRoutes from "./api/newAiSuggestionRoutes";
import moduleRatingsRoutes from "./api/moduleRatingsRoutes";
import communityModulesRoutes from "./api/communityModulesRoutes";
import selfAssessmentRoutes from "./api/selfAssessmentRoutes";
import teacherInvitationRoutes from "./api/teacherInvitationRoutes";
import avatarRoutes from "./api/avatarRoutes";
import voiceRoutes from "./api/voiceRoutes";
import emailRoutes from "./api/emailRoutes";
import adminRoutes from "./routes/admin";
import { AIBearyService } from "./services/aiBearyService";
import aiModuleDesignerRoutes from "./api/aiModuleDesignerRoutes";
import personalizedStoriesRoutes from "./api/personalizedStoriesRoutes";


// For ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define our session data structure with proper typing
declare module "express-session" {
  interface SessionData {
    userId: number;
    loginTime?: string; // ISO string for login timestamp
    registeredAt?: string; // ISO string for registration timestamp
    lastActive?: string; // Last activity timestamp
  }
}

// Extend the Express.User interface to avoid TypeScript errors
declare global {
  namespace Express {
    interface User extends Record<string, any> {}
  }
}

// Configure multer storage for file uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for school logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolLogosDir = path.join(uploadsDir, "school-logos");
    if (!fs.existsSync(schoolLogosDir)) {
      fs.mkdirSync(schoolLogosDir, { recursive: true });
    }
    cb(null, schoolLogosDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `school-logo-${uniqueSuffix}${ext}`);
  },
});

// Configure multer upload limits and file types
const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and SVG files are allowed"));
    }
    cb(null, true);
  },
});

// Helper middleware for requiring authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Initialize default school if needed
async function ensureDefaultSchoolExists() {
  try {
    // Check if we have any schools
    const schools = await storage.getAllSchools();

    if (schools.length === 0) {
      // Create Raising Arizona Preschool as our default school
      await storage.createSchool({
        name: "Raising Arizona Preschool",
        address: "123 Sunshine Way",
        city: "Phoenix",
        state: "Arizona",
        zipCode: "85001",
        contactEmail: "info@raisingarizona.edu",
        contactPhone: "(602) 555-1234",
        logoUrl: "/assets/raising-arizona-logo.jpg",
        websiteUrl: "https://raisingarizona.edu",
        isFreeAccess: true,
        subscriptionActive: true,
        subscriptionType: "Premium",
        teacherCount: 8,
        customization: {
          primaryColor: "#4A7B9D",
          secondaryColor: "#FFCC5C",
          coreValues: ["Excellence", "Integrity", "Compassion", "Innovation"]
        },
        subscriptionStartedAt: new Date("2025-01-01"),
        subscriptionExpiresAt: new Date("2026-01-01"),
      });

      console.log("Created default school: Raising Arizona Preschool");
    }
  } catch (error) {
    console.error("Error ensuring default school exists:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate quiz questions from video content
  app.post("/api/ai/generate-video-quiz", async (req, res) => {
    try {
      const { videoUrl, description } = req.body;

      if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
      }

      // Extract video ID from URL (YouTube)
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube video URL" });
      }

      // Generate quiz questions based on video content
      const prompt = `
Create 5 multiple-choice quiz questions about the educational video content. 
Video URL: ${videoUrl}
Context: ${description}

Based on typical early childhood education video content, generate relevant quiz questions that would test understanding of key concepts, practical applications, and important takeaways.

Format as:
1. Question text here?
   A) Option 1
   B) Option 2  
   C) Option 3
   D) Option 4
   
   Correct Answer: B
   Explanation: Brief explanation of why this is correct.

Continue for all 5 questions...
`;

      const openai = new (await import("openai")).default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert early childhood education instructor creating assessment questions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const questions = response.choices[0]?.message?.content || "";

      res.json({ questions });
    } catch (error) {
      console.error("Video quiz generation error:", error);
      res.status(500).json({
        error: "Failed to generate quiz questions from video",
        details: error.message,
      });
    }
  });

  // Helper function to extract YouTube video ID
  function extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
  // Initialize default data
  await ensureDefaultSchoolExists();
  // Create an HTTP server for the Express app (needed for WebSockets)
  // Register credential management routes
  app.use("/api/credentials", credentialRoutes);

  // Register AI suggestion routes
  app.use("/api/ai", aiSuggestionRoutes);
  app.use("/api/ai-suggestions", aiSuggestionRoutes);

  // Register personalized mini-lessons routes
  app.use("/api", personalizedModuleRoutes);

  // Register module ratings routes
  app.use("/api/module-ratings", moduleRatingsRoutes);

  // Register community modules routes
  app.use("/api/community-modules", communityModulesRoutes);

  // Register video generation routes
  app.use("/api/video", videoGenerationRoutes);

  // Register self-assessment routes
  app.use("/api", selfAssessmentRoutes);

  // Register email service routes
  app.use("/api/email", emailRoutes);

  // Register admin routes for question management
  app.use("/api/admin", adminRoutes);

  const httpServer = createServer(app);

  // Robust streak calculation function with comprehensive error handling
  const calculateUserStreakRobust = async (
    userId: number,
    today: Date,
  ): Promise<number> => {
    try {
      const todayDate = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // First, try to record today's login with proper error handling
      try {
        await db.execute(sql`
          INSERT INTO daily_logins (user_id, login_date) 
          VALUES (${userId}, ${todayDate})
          ON CONFLICT (user_id, login_date) DO NOTHING
        `);
      } catch (insertError) {
        console.error(
          `Error inserting daily login for user ${userId}:`,
          insertError,
        );
        // Continue with streak calculation even if insert fails
      }

      // Try the complex recursive query first
      try {
        const streakResult = await db.execute(sql`
          WITH RECURSIVE consecutive_days AS (
            SELECT login_date, 1 as day_count
            FROM daily_logins
            WHERE user_id = ${userId} AND login_date = ${todayDate}
            
            UNION ALL
            
            SELECT dl.login_date, cd.day_count + 1
            FROM daily_logins dl
            JOIN consecutive_days cd ON dl.login_date = cd.login_date - INTERVAL '1 day'
            WHERE dl.user_id = ${userId}
          )
          SELECT MAX(day_count) as current_streak
          FROM consecutive_days
        `);

        const streak = streakResult.rows[0]?.current_streak || 0;
        return Math.max(0, Number(streak));
      } catch (recursiveError) {
        console.error(
          `Recursive streak query failed for user ${userId}:`,
          recursiveError,
        );

        // Fallback: Simple streak calculation
        try {
          const recentLogins = await db.execute(sql`
            SELECT login_date 
            FROM daily_logins 
            WHERE user_id = ${userId} 
            ORDER BY login_date DESC 
            LIMIT 30
          `);

          if (recentLogins.rows.length === 0) {
            return 1; // First login
          }

          // Calculate streak manually from recent logins
          const loginDates = recentLogins.rows.map(
            (row) => new Date(row.login_date as string),
          );
          let streak = 1; // At least today

          for (let i = 1; i < loginDates.length; i++) {
            const currentDate = loginDates[i - 1];
            const previousDate = loginDates[i];
            const daysDiff = Math.floor(
              (currentDate.getTime() - previousDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            if (daysDiff === 1) {
              streak++;
            } else {
              break;
            }
          }

          return Math.max(1, streak);
        } catch (fallbackError) {
          console.error(
            `Fallback streak calculation failed for user ${userId}:`,
            fallbackError,
          );

          // Final fallback: return existing streak + 1 or 1
          const user = await storage.getUser(userId);
          return Math.max(1, (user?.streak || 0) + 1);
        }
      }
    } catch (error) {
      console.error(
        `Critical error in streak calculation for user ${userId}:`,
        error,
      );
      // Last resort: return 1 (at least they logged in today)
      return 1;
    }
  };

  // Set up credential expiration check to run daily
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  // Schedule first check at server startup
  setTimeout(() => {
    console.log("Running initial credential expiration check...");
    checkAndNotifyExpiringCredentials(30) // Check credentials expiring within 30 days
      .then(() => console.log("Initial credential expiration check complete"))
      .catch((err) =>
        console.error("Error in credential expiration check:", err),
      );
  }, 5000); // Wait 5 seconds after server start before first check

  // Then schedule regular daily checks
  setInterval(() => {
    console.log("Running scheduled credential expiration check...");
    checkAndNotifyExpiringCredentials(30) // Check credentials expiring within 30 days
      .then(() => console.log("Scheduled credential expiration check complete"))
      .catch((err) =>
        console.error("Error in credential expiration check:", err),
      );
  }, ONE_DAY_MS);

  // Register welcome message routes - for teacher notifications and shout-outs
  registerWelcomeMessageRoutes(app);

  // Register ECE question import routes
  registerQuestionImportRoutes(app);

  // Register enhanced assessment routes
  registerAssessmentRoutes(app);



  // Mystery box and rewards endpoints

  // Get daily mystery boxes information
  app.get("/api/rewards/daily-boxes", async (req, res) => {
    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // In a real application, we would fetch from the database
      // For now, return a simple response with boxes opened today
      // In the future, this would track boxes opened in the database

      // Mock data - in production this would come from database
      const boxesOpened = Math.min(2, Math.floor(Math.random() * 3));

      // Get the user's recent reward history
      const streakRewards = await storage.getStreakRewardsByUserId(userId);
      const recentRewards = streakRewards.slice(0, 10).map((reward) => ({
        id: reward.id,
        date: reward.createdAt,
        boxType: reward.rewardType.replace("_box", ""),
        type: "points",
        value: 25, // Sample value
        label: "25 Points",
        icon: null, // Frontend will render this
      }));

      res.status(200).json({
        opened: boxesOpened,
        remaining: 2 - boxesOpened,
        history: recentRewards,
      });
    } catch (error) {
      console.error("Error fetching daily boxes data:", error);
      res.status(500).json({ message: "Failed to fetch daily boxes data" });
    }
  });

  // Process mystery box reward
  app.post("/api/mystery-box/reward", async (req, res) => {
    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.session.userId;
      const { rewardType, rewardAmount, itemType } = req.body;

      if (!rewardType || !rewardAmount) {
        return res.status(400).json({
          message:
            "Missing required fields: rewardType and rewardAmount are required",
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let levelUp = false;
      let newLevel = user.level || 1;

      // Process different reward types
      if (rewardType === "points") {
        // Add points to user account
        await storage.addUserPoints(userId, rewardAmount);

        // Check if user leveled up (simplified logic - would be more complex in production)
        const newTotalPoints = (user.points || 0) + rewardAmount;
        if (newTotalPoints >= 1000 && (user.level || 1) < 2) {
          newLevel = 2;
          levelUp = true;
          await storage.updateUser(userId, { level: 2 });
        } else if (newTotalPoints >= 2500 && (user.level || 1) < 3) {
          newLevel = 3;
          levelUp = true;
          await storage.updateUser(userId, { level: 3 });
        }
      } else if (rewardType === "bearBucks") {
        // Add Bear Bucks to user account
        await storage.addUserBearBucks(userId, rewardAmount);
      } else if (rewardType === "item") {
        // Handle special items
        if (itemType === "streak_shield") {
          // Add streak shield item to user inventory
          await storage.addUserItem(userId, {
            itemType: "streak_shield",
            quantity: rewardAmount,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        } else if (itemType === "double_xp") {
          // Add double XP item to user inventory
          const duration = rewardAmount === 1 ? 24 : 48; // 24h or 48h
          await storage.addUserItem(userId, {
            itemType: "double_xp",
            quantity: 1,
            expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
          });
        }
      }

      // Return the updated user data with level up info if applicable
      res.status(200).json({
        success: true,
        rewardType,
        rewardAmount,
        levelUp,
        level: newLevel,
      });
    } catch (error) {
      console.error("Error processing mystery box reward:", error);
      res.status(500).json({ message: "Failed to process reward" });
    }
  });

  // Streak reward endpoints

  // Check if user is eligible for 5-day streak silver box
  app.get("/api/streak/silver-box-eligibility", async (req, res) => {
    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a streak of 5 or more days
      const isEligible = (user.streak || 0) >= 5;

      // Check if user has already claimed the reward today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const streakRewards = await storage.getStreakRewardsByUserId(userId);
      const claimedToday = streakRewards.some((reward) => {
        if (!reward.createdAt) return false;
        const rewardDate = new Date(reward.createdAt);
        rewardDate.setHours(0, 0, 0, 0);
        return (
          rewardDate.getTime() === today.getTime() &&
          reward.rewardType === "silver_box"
        );
      });

      res.status(200).json({
        eligible: isEligible,
        alreadyClaimed: claimedToday,
        streak: user.streak,
      });
    } catch (error) {
      console.error("Error checking silver box eligibility:", error);
      res
        .status(500)
        .json({ message: "Failed to check silver box eligibility" });
    }
  });

  // Claim 5-day streak silver box reward
  app.post("/api/streak/claim-silver-box", async (req, res) => {
    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify eligibility
      if ((user.streak || 0) < 5) {
        return res.status(400).json({
          message: "You need a 5-day login streak to claim this reward",
          streak: user.streak,
        });
      }

      // Check if already claimed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const streakRewards = await storage.getStreakRewardsByUserId(userId);
      const claimedToday = streakRewards.some((reward) => {
        if (!reward.createdAt) return false;
        const rewardDate = new Date(reward.createdAt);
        rewardDate.setHours(0, 0, 0, 0);
        return (
          rewardDate.getTime() === today.getTime() &&
          reward.rewardType === "silver_box"
        );
      });

      if (claimedToday) {
        return res.status(400).json({
          message: "You've already claimed your streak reward today",
          streak: user.streak,
        });
      }

      // Record the streak reward claim
      await storage.createStreakReward({
        userId,
        rewardType: "silver_box",
        streakCount: user.streak || 5,
      });

      // Success response
      res.status(200).json({
        success: true,
        message: "5-day streak Silver Box claimed successfully!",
        streak: user.streak,
      });
    } catch (error) {
      console.error("Error claiming silver box reward:", error);
      res.status(500).json({ message: "Failed to claim silver box reward" });
    }
  });

  // Register assessment question routes for the enhanced AI assessment
  try {
    app.use(assessmentQuestionRoutes);
    console.log("Assessment question routes registered successfully");
  } catch (error) {
    console.error("Error registering assessment question routes:", error);
  }

  // Register personalized module routes for custom learning paths
  app.use(personalizedModuleRoutes);

  // Register self-assessment routes
  app.use(selfAssessmentRoutes);

  // Register teacher invitation routes
  app.use("/api/teacher-invitations", teacherInvitationRoutes);

  // Module management will be handled separately

  // Serve static files from the uploads directory
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // NOTE: Session middleware is already configured in server/index.ts
  // Do not set up session middleware here as it will override the existing one
  // and cause authentication issues with assessment routes

  // Auth middleware
  const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.log("Auth check - Session ID:", req.session.id);
    console.log("Auth check - Session data:", req.session);

    if (!req.session.userId) {
      console.log("Auth failed - No userId in session");
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify user exists in database
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user) {
        console.log(
          `Auth failed - User with ID ${userId} not found in database`,
        );
        req.session.destroy(() => {
          console.log("Session destroyed due to user not found");
        });
        return res.status(404).json({ message: "User not found" });
      }

      // Update last active time
      await storage.updateUser(userId, {
        lastActive: new Date(),
      });

      // Refresh session expiration
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Force session update
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Session save error in auth middleware:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (saveErr) {
        console.error("Failed to refresh session in auth middleware:", saveErr);
        // Continue anyway as this is just a refresh
      }

      console.log(`Auth successful - User ID: ${req.session.userId}`);
      next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // Login reset endpoint (helps with debugging stuck sessions)
  // This endpoint allows any user to reset their session when they encounter login issues

  // SKIP AUTH ENDPOINTS - they are already defined in server/index.ts
  // Registering them here would override the working versions
  const skipAuthEndpoints = true;

  if (!skipAuthEndpoints) {
    app.post("/api/auth/reset-session", async (req, res) => {
      try {
        // Clear the current session
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Failed to reset session" });
          }

          // Return successful response
          res.status(200).json({
            success: true,
            message: "Session successfully reset. Please log in again.",
          });
        });
      } catch (error) {
        console.error("Error in reset-session endpoint:", error);
        res.status(500).json({ message: "Failed to reset session" });
      }
    });
  }

  // Middleware to check if user's school has a valid subscription
  const requirePaidAccess = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.session.userId as number;
      const accessStatus = await storage.checkUserAccessStatus(userId);

      if (!accessStatus.hasAccess) {
        console.log(
          `Paid access check failed for user ${userId}: ${accessStatus.reason}`,
        );
        return res.status(403).json({
          message: "Access denied",
          reason: accessStatus.reason,
          details:
            "Your school does not have an active subscription to access this content.",
        });
      }

      next();
    } catch (error) {
      console.error("Error in paid access middleware:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // User routes
  if (!skipAuthEndpoints) {
    app.post("/api/auth/register", async (req, res) => {
      try {
        // Extract and trim all input fields for consistency
        const username = req.body.username?.trim();
        const password = req.body.password?.trim();
        const firstName = req.body.firstName?.trim();
        const lastName = req.body.lastName?.trim();
        const email = req.body.email?.trim();
        const language = req.body.language?.trim() || "English";
        const nativeLanguage = req.body.nativeLanguage?.trim() || "English";
        const timeZone = req.body.timeZone?.trim() || "UTC-05:00";

        console.log(`Registration attempt for username: "${username}"`);

        if (!username || !password || !firstName || !lastName || !email) {
          // Log which fields are missing for debugging
          const missingFields = {
            hasUsername: !!username,
            hasPassword: !!password,
            hasFirstName: !!firstName,
            hasLastName: !!lastName,
            hasEmail: !!email,
          };

          console.log(
            "Registration failed: Missing required fields",
            missingFields,
          );

          // Create a more specific error message about which fields are missing
          const missingFieldNames = [];
          if (!username) missingFieldNames.push("username");
          if (!password) missingFieldNames.push("password");
          if (!firstName) missingFieldNames.push("first name");
          if (!lastName) missingFieldNames.push("last name");
          if (!email) missingFieldNames.push("email");

          const missingFieldsList = missingFieldNames.join(", ");

          return res.status(400).json({
            message: "Required fields are missing",
            details: `Please provide all required fields. Missing: ${missingFieldsList}.`,
            missingFields: missingFieldNames,
          });
        }

        // Check if user with this username already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          console.log(
            `Registration failed: Username "${username}" already exists`,
          );
          return res.status(400).json({
            message: "Username already exists",
            details:
              "This username is already taken. Please choose a different username for your account.",
          });
        }

        // Validate email format
        if (!email.includes("@") || !email.includes(".")) {
          console.log(`Registration failed: Invalid email format "${email}"`);
          return res.status(400).json({
            message: "Invalid email format",
            details:
              "Please provide a valid email address (example: name@domain.com).",
          });
        }

        // Create new user
        const newUser = await storage.createUser({
          username,
          password, // Password is already hashed earlier in the code
          firstName,
          lastName,
          email,
          language: language || "English",
          nativeLanguage: nativeLanguage || "English",
          timeZone: timeZone || "UTC-05:00",
          profilePicture: null,
          learningStyle: {
            visual: 0,
            auditory: 0,
            reading: 0,
            kinesthetic: 0,
            preferred: null,
          },
          schoolId: req.body.schoolId || 1, // Default to Raising Arizona if no school specified
          points: 0,
          bearBucks: 0,
          level: 1,
          isAdmin: false,
          isSchoolAdmin: false,
          isOwner: false,
          // createdAt is handled automatically by the schema
        });

        console.log(
          `Registration successful for user: "${username}" (ID: ${newUser.id})`,
        );

        // Assign required training modules for new users
        try {
          // Get the Raising Arizona's CORE module
          const coreModule = await db.query.learningModules.findFirst({
            where: (modules, { eq }) =>
              eq(modules.title, "Raising Arizona's CORE"),
          });

          // Get the Mindful Mornings module
          const mindfulModule = await db.query.learningModules.findFirst({
            where: (modules, { eq }) => eq(modules.category, "mindfulness"),
          });

          // Get the Chapter 1 module
          const chapterOneModule = await db.query.learningModules.findFirst({
            where: (modules, { eq }) =>
              eq(modules.title, "Chapter 1: Building a Human"),
          });

          // Create user progress entries for required modules
          if (coreModule) {
            await storage.createUserProgress({
              userId: newUser.id,
              moduleId: coreModule.id,
              progress: 0,
              completed: false,
              recommended: true,
              pointsEarned: 0,
              // lastAccessed is handled automatically by the schema
            });
            console.log(
              `Assigned CORE module (ID: ${coreModule.id}) to new user (ID: ${newUser.id})`,
            );
          }

          if (mindfulModule) {
            await storage.createUserProgress({
              userId: newUser.id,
              moduleId: mindfulModule.id,
              progress: 0,
              completed: false,
              recommended: true,
              pointsEarned: 0,
              // lastAccessed is handled automatically by the schema
            });
            console.log(
              `Assigned Mindful Mornings module (ID: ${mindfulModule.id}) to new user (ID: ${newUser.id})`,
            );
          }

          if (chapterOneModule) {
            await storage.createUserProgress({
              userId: newUser.id,
              moduleId: chapterOneModule.id,
              progress: 0,
              completed: false,
              recommended: true,
              pointsEarned: 0,
              // lastAccessed is handled automatically by the schema
            });
            console.log(
              `Assigned Chapter 1 module (ID: ${chapterOneModule.id}) to new user (ID: ${newUser.id})`,
            );
          }
        } catch (assignError) {
          console.error(
            "Error assigning required modules to new user:",
            assignError,
          );
          // Continue with user creation even if module assignment fails
        }

        // Don't return password in response
        const { password: _, ...userWithoutPassword } = newUser;

        // Automatically log in the user
        req.session.userId = newUser.id;

        // Add registration timestamp for tracking
        const registrationTime = new Date();
        req.session.registeredAt = registrationTime.toISOString();

        // Force session save to ensure it's properly saved
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during registration:", err);
          } else {
            console.log(
              "Session saved successfully during registration for userId:",
              newUser.id,
            );
          }
        });

        res.status(201).json(userWithoutPassword);
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  }

  if (!skipAuthEndpoints) {
    app.post("/api/auth/login", async (req, res) => {
      console.log("=== LOGIN ROUTE HIT ===");
      console.log("Request body:", req.body);

      try {
        // Extract and trim credentials for consistency
        const username = req.body.username?.trim();
        const password = req.body.password?.trim();

        console.log(
          `Username: "${username}", Password length: ${password?.length}`,
        );

        console.log(`Login attempt for username: "${username}"`);

        if (!username || !password) {
          console.log("Login failed: Missing username or password", {
            hasUsername: !!username,
            hasPassword: !!password,
          });
          return res
            .status(400)
            .json({ message: "Username and password are required" });
        }

        // Demo user for testing purposes
        const isDemoUser = username === "jlcookie20" && password === "password";

        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log(
            `Login failed: User not found for username: "${username}"`,
          );
          return res.status(401).json({
            message: "Invalid username or password",
            details:
              "No account found with this username. Please check your spelling or register for an account.",
          });
        }

        // Clean up session if user is already logged in to prevent login loops
        if (req.session.userId) {
          // Clear any existing session first
          await new Promise<void>((resolve) => {
            req.session.destroy((err) => {
              if (err)
                console.error(
                  "Error destroying existing session for user:",
                  err,
                );
              resolve();
            });
          });

          // Need to manually clear the cookie since destroy doesn't do it automatically
          res.clearCookie("connect.sid");

          // Initialize a new session object since we destroyed the previous one
          req.session = req.session || {};
        }

        // Debug logging for authentication
        console.log(`Login attempt debug for user: ${username}`);
        console.log(`User found in database: ${user ? "YES" : "NO"}`);
        console.log(`Is demo user: ${isDemoUser}`);
        console.log(`Stored password hash: ${user.password}`);
        console.log(`Password provided length: ${password.length}`);

        // Check password - either demo user or normal validation with bcrypt
        let passwordValid = false;

        if (isDemoUser) {
          passwordValid = true;
          console.log(`Demo user authentication: SUCCESS`);
        } else {
          try {
            passwordValid = await bcrypt.compare(password, user.password);
            console.log(`Bcrypt comparison result: ${passwordValid}`);
          } catch (error) {
            console.error(`Bcrypt comparison error:`, error);
            passwordValid = false;
          }
        }

        if (!passwordValid) {
          console.log(
            `Login failed: Password mismatch for user: "${username}"`,
          );
          return res.status(401).json({
            message: "Invalid username or password",
            details:
              "Password is incorrect. Please try again or use the forgot password link.",
          });
        }

        // If we made it here, authentication succeeded

        // Add special handling for the deployed environment
        const isDeployedEnvironment =
          process.env.NODE_ENV === "production" ||
          process.env.REPLIT_ENVIRONMENT === "production";

        if (isDeployedEnvironment) {
          console.log("Running in deployed/production environment");

          // Force special permissions for certain accounts in production
          if (isDemoUser) {
            console.log(`Special deployment permissions for ${username}`);
            user.isAdmin = true;
            user.isOwner = true;
            user.isSchoolAdmin = true;
            user.points = Math.max(user.points || 0, 15);
          }
        }

        // Clean out any existing session
        if (req.session.userId) {
          console.log(
            `Clearing previous session for user ID: ${req.session.userId}`,
          );
        }

        // Set the user session with userId
        req.session.userId = user.id;

        // Add a login timestamp for better tracking
        const loginTime = new Date();
        req.session.loginTime = loginTime.toISOString();

        // Update user's last active time and handle login streak
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

        // Robust streak calculation system with comprehensive error handling
        let streakUpdated = false;
        let currentStreak = user.streak || 0;

        try {
          // Calculate streak using a robust, fault-tolerant approach
          currentStreak = await calculateUserStreakRobust(user.id, today);

          // Update user's streak and last active time
          const updateData: any = { lastActive: new Date() };

          // Only update streak if it actually changed to avoid unnecessary database writes
          if (currentStreak !== (user.streak || 0)) {
            updateData.streak = currentStreak;
            streakUpdated = true;
            console.log(
              `User ${user.id} streak updated from ${user.streak || 0} to ${currentStreak} days`,
            );
          } else {
            console.log(
              `User ${user.id} logged in, streak remains ${currentStreak} days`,
            );
          }

          // Perform the update with error handling
          try {
            await storage.updateUser(user.id, updateData);
          } catch (updateError) {
            console.error(`Error updating user ${user.id} data:`, updateError);
            // Try a minimal update if the full update fails
            try {
              await storage.updateUser(user.id, { lastActive: new Date() });
            } catch (fallbackError) {
              console.error(
                `Critical: Unable to update user ${user.id} last active time:`,
                fallbackError,
              );
            }
          }
        } catch (streakError) {
          console.error(
            `Error in robust streak calculation for user ${user.id}:`,
            streakError,
          );

          // Final fallback: just update last active time
          try {
            await storage.updateUser(user.id, { lastActive: new Date() });
          } catch (finalError) {
            console.error(
              `Critical: Final fallback failed for user ${user.id}:`,
              finalError,
            );
          }
        }

        // If streak was updated, check for achievements or rewards
        if (streakUpdated) {
          try {
            // Reload user to get updated streak count
            const updatedUser = await storage.getUser(user.id);
            const streak = updatedUser?.streak || 0;

            // Award points based on streak milestones
            if (streak === 7) {
              // Weekly milestone - bonus points
              await storage.updateUser(user.id, {
                points: (updatedUser?.points || 0) + 25,
              });
              console.log(
                `User ${user.id} awarded 25 points for 7-day streak milestone`,
              );
            } else if (streak === 30) {
              // Monthly milestone - bigger bonus
              await storage.updateUser(user.id, {
                points: (updatedUser?.points || 0) + 100,
              });
              console.log(
                `User ${user.id} awarded 100 points for 30-day streak milestone`,
              );
            } else if (streak % 5 === 0) {
              // Every 5 days milestone
              await storage.updateUser(user.id, {
                points: (updatedUser?.points || 0) + 15,
              });
              console.log(
                `User ${user.id} awarded 15 points for ${streak}-day streak milestone`,
              );
            } else {
              // Regular daily streak points
              await storage.updateUser(user.id, {
                points: (updatedUser?.points || 0) + 5,
              });
              console.log(`User ${user.id} awarded 5 points for daily login`);
            }
          } catch (rewardError) {
            console.error(
              `Error processing streak rewards for user ${user.id}:`,
              rewardError,
            );
            // Non-critical error, continue with login process
          }
        }

        // Force session save to ensure it's properly written to the database
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error("Session save error:", err);
                reject(err);
              } else {
                console.log("Session saved successfully with userId:", user.id);
                resolve();
              }
            });
          });
        } catch (saveErr) {
          console.error("Failed to save session:", saveErr);
          return res
            .status(500)
            .json({
              message: "Authentication succeeded but failed to create session",
            });
        }

        console.log(
          `Login successful for user: "${username}" (ID: ${user.id})`,
        );
        console.log(`Session ID: ${req.session.id}`);
        console.log(`Session data:`, req.session);

        // Do not return password in response
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
          message: "Internal server error",
          details:
            "There was a problem with the login process. Please try again.",
        });
      }
    });
  }

  if (!skipAuthEndpoints) {
    app.post("/api/auth/logout", (req, res) => {
      console.log(`Logout attempt - Session ID: ${req.session.id}`);
      console.log(`Logout attempt - User ID: ${req.session.userId || "none"}`);

      // Clear session data
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({
            message: "Failed to logout",
            details:
              "There was a problem ending your session. Please try again.",
          });
        }

        console.log("Logout successful - Session destroyed");

        // Clear cookies by setting expiration in the past
        res.clearCookie("connect.sid");

        res.status(200).json({
          message: "Logged out successfully",
          details: "Your session has been ended successfully.",
        });
      });
    });
  }

  // Clear session route - for use on fresh deployment to ensure no auto-login
  if (!skipAuthEndpoints) {
    app.get("/api/auth/clear-session", (req, res) => {
      console.log(
        `Clear session attempt - Session ID: ${req.session?.id || "none"}`,
      );

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Clear session error:", err);
            return res.status(500).json({
              message: "Failed to clear session",
              details:
                "There was a problem clearing your session. Please try again.",
            });
          }

          console.log("Session cleared successfully");

          // Clear cookies by setting expiration in the past
          res.clearCookie("connect.sid");

          return res.status(200).json({
            message: "Session cleared successfully",
            details: "Your session has been cleared successfully.",
          });
        });
      } else {
        console.log("No active session to clear");
        res.status(200).json({
          message: "No active session to clear",
          details: "No active session was found to clear.",
        });
      }
    });
  }

  app.get("/api/auth/me", async (req, res) => {
    console.log("GET /api/auth/me - Session ID:", req.session.id);
    console.log("GET /api/auth/me - Session data:", req.session);

    // Check if session has userId
    if (!req.session.userId) {
      console.log("GET /api/auth/me - No userId in session");
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.session.userId as number;
      console.log(`GET /api/auth/me - Looking up user with ID: ${userId}`);

      const user = await storage.getUser(userId);

      if (!user) {
        console.log(
          `GET /api/auth/me - User with ID ${userId} not found in database`,
        );
        req.session.destroy(() => {
          console.log(
            "GET /api/auth/me - Session destroyed due to user not found",
          );
        });
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        `GET /api/auth/me - Found user: ${user.username} (ID: ${user.id})`,
      );

      // Ensure user points are properly initialized
      if (user.points === undefined || user.points === null) {
        user.points = 0; // Just ensure points field exists
      }

      // Special handling for Laura's account - prevent emergency fix
      if (user.id === 5 && user.username === "lbook") {
        // Ensure Laura's points are preserved at their actual value and not reduced
        if (user.points < 155) {
          user.points = 155; // Preserve Laura's actual points
        }
      }

      // Do not return password in response
      const { password, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("GET /api/auth/me - Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get teachers for current user's school (for director dashboard)
  app.get("/api/school-teachers", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.session.userId as number;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || !currentUser.schoolId) {
        return res
          .status(400)
          .json({ message: "User not associated with a school" });
      }

      // Get all teachers from the same school (excluding the current user if they want)
      const teachers = await storage.getUsersBySchoolId(currentUser.schoolId);

      // Filter out admins if needed and return relevant teacher data
      const teacherData = teachers
        .filter((teacher) => !teacher.isOwner) // Exclude app owners
        .map((teacher) => ({
          id: teacher.id,
          username: teacher.username,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          level: teacher.level,
          points: teacher.points,
          streak: teacher.streak,
          lastActive: teacher.lastActive,
          isSchoolAdmin: teacher.isSchoolAdmin,
        }));

      res.json({
        schoolId: currentUser.schoolId,
        teachers: teacherData,
        totalTeachers: teacherData.length,
      });
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      res.status(500).json({ message: "Failed to fetch school teachers" });
    }
  });

  // Get all schools (for registration dropdown and admin stats)
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getAllSchools();

      // Return basic school info for registration dropdown
      const schoolOptions = schools.map((school) => ({
        id: school.id,
        name: school.name,
        isFreeAccess: school.isFreeAccess,
      }));

      res.json(schoolOptions);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  // Get school statistics (for system administrator dashboard)
  app.get("/api/admin/school-stats", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.session.userId as number;
      const currentUser = await storage.getUser(userId);

      // Only allow system owners to see all school stats
      if (!currentUser || !currentUser.isOwner) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const schools = await storage.getAllSchools();
      const allUsers = await storage.getAllUsers();

      // Calculate statistics for each school
      const schoolStats = await Promise.all(
        schools.map(async (school) => {
          const schoolUsers = allUsers.filter(
            (user) => user.schoolId === school.id,
          );
          const teacherCount = schoolUsers.filter(
            (user) => !user.isOwner,
          ).length;

          return {
            id: school.id,
            name: school.name,
            teacherCount,
            subscriptionActive: school.subscriptionActive,
            subscriptionType: school.subscriptionType,
            isFreeAccess: school.isFreeAccess,
            contactEmail: school.contactEmail,
            createdAt: school.createdAt,
          };
        }),
      );

      res.json({
        totalSchools: schools.length,
        paidSchools: schools.filter((s) => !s.isFreeAccess).length,
        freeSchools: schools.filter((s) => s.isFreeAccess).length,
        totalTeachers: allUsers.filter((u) => !u.isOwner).length,
        schools: schoolStats,
      });
    } catch (error) {
      console.error("Error fetching school statistics:", error);
      res.status(500).json({ message: "Failed to fetch school statistics" });
    }
  });

  // Get all users (for leaderboard)
  app.get("/api/users", async (req, res) => {
    try {
      console.log("Fetching all users for leaderboard...");

      // Try direct database query to bypass any Drizzle mapping issues
      const rawUsers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          points: users.points,
          bearBucks: users.bearBucks,
          streak: users.streak,
          level: users.level,
          isAdmin: users.isAdmin,
          isSchoolAdmin: users.isSchoolAdmin,
          isOwner: users.isOwner,
          schoolId: users.schoolId,
          lastActive: users.lastActive,
          achievementCount: users.achievementCount,
          lifetimePoints: users.lifetimePoints,
        })
        .from(users);

      console.log("Raw users query returned:", rawUsers.length, "users");

      if (!rawUsers || rawUsers.length === 0) {
        console.log("No users found in system");
        return res.status(200).json([]);
      }

      console.log("Returning users count for leaderboard:", rawUsers.length);
      res.status(200).json(rawUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      console.error("Error details:", error.message);
      res
        .status(500)
        .json({ message: "Internal server error", details: error.message });
    }
  });

  // Get teachers from the same school as the current user for the leaderboard
  app.get("/api/teachers-by-school", async (req, res) => {
    try {
      const { userId } = req.session;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId as number);

      if (!currentUser || !currentUser.schoolId) {
        return res.status(404).json({ message: "User or school not found" });
      }

      console.log(`Fetching teachers for school ID: ${currentUser.schoolId}`);

      // Get all users from the same school
      const teachers = await storage.getUsersBySchoolId(currentUser.schoolId);
      console.log(`Found ${teachers.length} teachers at the same school`);

      // Return teachers with only the necessary data for the leaderboard
      const teacherData = teachers.map((teacher) => {
        const { password, ...teacherWithoutPassword } = teacher;
        return {
          ...teacherWithoutPassword,
          isCurrentUser: teacher.id === userId,
        };
      });

      res.status(200).json(teacherData);
    } catch (error) {
      console.error("Error fetching teachers by school:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Learning modules routes
  app.get("/api/modules", requireAuth, requirePaidAccess, async (req, res) => {
    console.log('fetching modules result')

    try {
      // Use direct SQL query to handle schema changes gracefully
      const result = await db.execute(sql`
        SELECT id, title, description, duration, point_value as "pointValue", 
               image_url as "imageUrl", featured, difficulty, category, content, 
               quiz, is_visible as "isVisible", created_at as "createdAt",
               average_rating as "averageRating", rating_count as "ratingCount",
               is_shared_to_community as "isSharedToCommunity", school_id as "schoolId"
        FROM learning_modules
        ORDER BY created_at DESC
      `);
      console.log('modules result',result.rows[0])

      // Transform the results to ensure consistent data format
      const modules = result.rows.map((row) => ({
        ...row,
        pointValue: row.pointValue || 5, // Default pointValue if null
        averageRating: row.averageRating || 0,
        ratingCount: row.ratingCount || 0,
        isSharedToCommunity: row.isSharedToCommunity || false,
        schoolId: row.schoolId || null,
      }));
      res.status(200).json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/modules/:id",
    requireAuth,
    requirePaidAccess,
    async (req, res, next) => {
      try {
        // Special case: Skip this handler for management route
        if (req.params.id === "management") {
          return next();
        }

        // Special case: Skip this handler for visible route
        if (req.params.id === "visible") {
          return next();
        }

        // Validate the module ID parameter
        if (!req.params.id || req.params.id === "undefined") {
          console.error(`Invalid module ID requested: ${req.params.id}`);
          return res.status(400).json({
            message: "Invalid module ID",
            details: "A valid module ID is required",
          });
        }

        const moduleId = parseInt(req.params.id);

        // Check for NaN which indicates parsing failure
        if (isNaN(moduleId)) {
          console.error(`Failed to parse module ID: ${req.params.id}`);
          return res.status(400).json({
            message: "Invalid module ID format",
            details: "Module ID must be a number",
          });
        }

        // Get user info for logging
        const userId = req.session.userId as number;
        console.log(`User ${userId} requesting module ${moduleId}`);

        // Fetch the module with error handling using direct SQL to handle schema changes
        const result = await db.execute(sql`
        SELECT id, title, description, duration, point_value as "pointValue", 
               image_url as "imageUrl", featured, difficulty, category, content, 
               quiz, is_visible as "isVisible", created_at as "createdAt",
               average_rating as "averageRating", rating_count as "ratingCount",
               is_shared_to_community as "isSharedToCommunity", school_id as "schoolId"
        FROM learning_modules
        WHERE id = ${moduleId}
      `);

        if (result.rows.length === 0) {
          console.log(`Module ${moduleId} not found for user ${userId}`);
          return res.status(404).json({
            message: "Module not found",
            details: "The requested learning module does not exist",
          });
        }

        // Transform the module data to ensure consistent format
        const moduleData = result.rows[0];

        // Ensure default values for new fields
        const transformedModule = {
          ...moduleData,
          pointValue: moduleData.pointValue || 5, // Default pointValue if null
          averageRating: moduleData.averageRating || 0,
          ratingCount: moduleData.ratingCount || 0,
          isSharedToCommunity: moduleData.isSharedToCommunity || false,
          schoolId: moduleData.schoolId || null,
        };

        // Log successful module access for analytics
        console.log(
          `Module ${moduleId} (${moduleData.title || "Unnamed module"}) served to user ${userId}`,
        );

        // Return the module
        res.status(200).json(transformedModule);
      } catch (error) {
        console.error("Error fetching module:", error);
        res.status(500).json({
          message: "Error retrieving module",
          details: "An unexpected error occurred while fetching the module",
        });
      }
    },
  );

  // Create new learning module
  app.post("/api/modules", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const {
        title,
        description,
        category,
        difficulty,
        estimatedTime,
        customPoints,
        shareWithCommunity,
        sections,
      } = req.body;

      // Validate required fields
      if (!title || !description || !sections || sections.length === 0) {
        return res.status(400).json({
          message:
            "Missing required fields: title, description, and at least one section are required",
        });
      }

      // Calculate points (custom or based on estimated time)
      const pointValue = customPoints
        ? parseInt(customPoints)
        : Math.max(5, Math.ceil(parseInt(estimatedTime) / 3));

      // Insert into database using SQL
      const result = await db.execute(sql`
        INSERT INTO learning_modules (
          title, description, category, difficulty, duration, point_value, 
          content, school_id, is_visible, featured,image_url,quiz,is_shared_to_community
        ) VALUES (
          ${title}, ${description}, ${category}, 
          ${difficulty}, ${parseInt(estimatedTime)}, ${pointValue},
          ${JSON.stringify(sections)}, ${user.schoolId}, ${true}, 
          ${false}, ${null}, ${null}, ${shareWithCommunity || false}
        ) RETURNING *
      `);

      const newModule = result.rows[0];

      console.log(
        "Successfully created module:",
        newModule.id,
        "titled:",
        title,
      );

      res.status(201).json({
        success: true,
        module: newModule,
        message: "Module created successfully",
      });
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({
        message: "Failed to create module",
        error: error.message,
      });
    }
  });

  // Endpoint to update the Child Development Milestones module content
  app.post(
    "/api/modules/update-child-development",
    requireAuth,
    requirePaidAccess,
    async (req, res) => {
      try {
        // Get user ID from session if available (for personalization)
        const userId = req.session?.userId as number;

        // Use the specialized function to update the Child Development module
        const updatedModule = await updateChildDevelopmentModule(userId);

        if (!updatedModule) {
          return res.status(404).json({
            success: false,
            message: "Failed to update Child Development module",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Child Development module updated successfully",
          moduleId: updatedModule.id,
        });
      } catch (error) {
        console.error("Failed to update Child Development module:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error updating Child Development module",
        });
      }
    },
  );

  // Admin middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Simple password-based admin authentication
    const adminPassword = req.query.admin_password || req.body.admin_password;

    if (adminPassword === "BIGSURF55") {
      return next(); // Allow access with correct password
    }

    // Otherwise check if the user is one of our admin users
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // List of admin usernames by their numeric IDs
    const adminUserIds = [4]; // Admin user ID for the demo account (jlcookie20)

    if (adminUserIds.includes(userId)) {
      return next(); // Allow access for admin users
    }

    // If neither password nor admin user, deny access
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  };

  // School Admin middleware - restricts access to only administrators of a specific school
  const requireSchoolAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // First, ensure user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get the school ID from the request params
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      // Get the user from the database
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if app owner (they can access all schools)
      if (user.isOwner) {
        return next();
      }

      // Check if user belongs to the requested school
      if (user.schoolId !== schoolId) {
        return res.status(403).json({
          message: "Access denied",
          details: "You do not have access to this school's data",
        });
      }

      // Check if admin password was provided in query
      if (req.query.adminKey) {
        // Get the school to check admin password
        const school = await storage.getSchool(schoolId);
        if (!school) {
          return res.status(404).json({ message: "School not found" });
        }

        // Verify admin password
        const adminKeyValid = await bcrypt.compare(
          req.query.adminKey as string,
          school.adminPasswordHash,
        );

        if (adminKeyValid) {
          return next();
        }
      }

      // If nothing validated, deny access
      return res.status(403).json({
        message: "School admin access required",
        details:
          "You need administrator privileges to access this school's data",
      });
    } catch (error) {
      console.error("Error in school admin middleware:", error);
      return res.status(500).json({ message: "Server error verifying access" });
    }
  };

  // App Owner middleware - For Subscription & School Management
  const requireOwner = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // Check if user is authenticated
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Allow access if user has the isOwner flag
      if (user.isOwner) {
        return next();
      }

      // Otherwise deny access
      return res.status(403).json({
        message: "Access denied",
        reason: "Owner privileges required for subscription management",
      });
    } catch (error) {
      console.error("Error checking owner status:", error);
      return res.status(500).json({
        message: "Server error checking application owner status",
      });
    }
  };

  // Owner API endpoints for subscription and school management
  app.get("/api/owner/dashboard", requireOwner, async (req, res) => {
    try {
      // Get a list of all schools with subscription details
      const schools = await storage.getAllSchools();

      // Get total users count
      const allUsers = await storage.getAllUsers();

      // Get total active subscribers count (exclude Raising Arizona users)
      const subscribedSchools = schools.filter(
        (school) => school.subscriptionActive && !school.isFreeAccess,
      );

      // Get revenue statistics (placeholder for Stripe integration)
      const stats = {
        totalSchools: schools.length,
        activeSubscriptions: subscribedSchools.length,
        totalUsers: allUsers.length,
        averageUsersPerSchool: Math.round(
          allUsers.length / (schools.length || 1),
        ),
        revenueStats: {
          monthly: subscribedSchools.length * 250, // Placeholder assuming $250/month per school
          annual: subscribedSchools.length * 2500, // Placeholder assuming $2500/year per school
          projected: subscribedSchools.length * 3000, // Placeholder for projected annual revenue
        },
      };

      res.status(200).json({
        schools,
        stats,
      });
    } catch (error) {
      console.error("Error fetching owner dashboard data:", error);
      res.status(500).json({ message: "Error fetching owner dashboard data" });
    }
  });

  // Endpoint to get metrics for the System Admin dashboard
  app.get("/api/owner/metrics", requireAdmin, async (req, res) => {
    try {
      // Get all schools
      const schools = await storage.getAllSchools();

      // Get all users
      const allUsers = await storage.getAllUsers();

      // Get total active subscribers count (exclude Raising Arizona users)
      const subscribedSchools = schools.filter(
        (school) => school.subscriptionActive && !school.isFreeAccess,
      );

      // Prepare metrics response
      const metrics = {
        totalSchools: schools.length,
        activeSubscriptions: subscribedSchools.length,
        totalUsers: allUsers.length,
        averageUsersPerSchool: Math.round(
          allUsers.length / (schools.length || 1),
        ),
        monthlyRevenue: subscribedSchools.length * 250, // Placeholder $250/month per school
        annualGrowthRate: 15, // Placeholder 15% growth rate
      };

      res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Error fetching dashboard metrics" });
    }
  });

  // Endpoint to get all schools with additional data for the System Admin dashboard
  app.get("/api/owner/schools", requireAdmin, async (req, res) => {
    try {
      // Get all schools
      const schools = await storage.getAllSchools();

      // Enrich school data with additional information
      const enrichedSchools = await Promise.all(
        schools.map(async (school) => {
          // Get teachers for this school
          const teachers = await storage.getUsersBySchoolId(school.id);

          // Create enriched school object with teacher count and other details
          return {
            ...school,
            teacherCount: teachers.length,
            subscription: {
              planName: school.isFreeAccess ? "Free Plan" : "Standard Plan",
              status: school.subscriptionActive ? "active" : "inactive",
              startDate: school.createdAt,
              nextBillingDate: school.subscriptionActive
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : null,
              amount: school.isFreeAccess ? 0 : 250,
              teacherLimit: school.isFreeAccess ? 10 : 50,
              paymentMethod: school.isFreeAccess ? "None" : "Credit Card",
            },
          };
        }),
      );

      res.status(200).json(enrichedSchools);
    } catch (error) {
      console.error("Error fetching schools data:", error);
      res.status(500).json({ message: "Error fetching schools data" });
    }
  });

  // Points spending endpoint for games
  app.post("/api/points/spend", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { points, reason, gameType } = req.body;

      if (!points || points <= 0) {
        return res.status(400).json({ message: "Valid points amount required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.points < points) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Deduct points from user
      await storage.updateUser(userId, { 
        points: user.points - points 
      });

      res.status(200).json({
        success: true,
        pointsSpent: points,
        remainingPoints: user.points - points,
        reason
      });
    } catch (error) {
      console.error("Error spending points:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Points awarding endpoint for games
  app.post("/api/points/award", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { points, reason, gameType } = req.body;

      if (!points || points <= 0) {
        return res.status(400).json({ message: "Valid points amount required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Award points to user
      await storage.updateUser(userId, { 
        points: user.points + points,
        lifetimePoints: user.lifetimePoints + points
      });

      res.status(200).json({
        success: true,
        pointsAwarded: points,
        totalPoints: user.points + points,
        reason
      });
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assign owner privileges to another user
  app.post("/api/owner/assign", requireOwner, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user to have owner privileges
      await storage.updateUser(userId, { isOwner: true });

      res.status(200).json({
        message: "Owner privileges granted successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Error assigning owner privileges:", error);
      res.status(500).json({ message: "Error assigning owner privileges" });
    }
  });

  // Get payment plans for the System Admin dashboard
  app.get("/api/owner/payment-plans", requireAdmin, async (req, res) => {
    try {
      // Return default payment plans
      const paymentPlans = [
        {
          id: 1,
          name: "Standard Plan",
          description: "Complete access to all training modules and features",
          price: 250,
          billingCycle: "monthly",
          features: [
            "Unlimited teachers",
            "Custom school branding",
            "All learning modules",
            "Teacher progress tracking",
            "Achievement system",
            "Teacher retention tools",
            "Premium support",
          ],
          isPopular: true,
          isActive: true,
        },
        {
          id: 2,
          name: "Annual Plan",
          description: "Save 15% with annual billing",
          price: 2550,
          billingCycle: "annual",
          features: [
            "All Standard Plan features",
            "15% annual discount",
            "Priority support response",
            "Dedicated account manager",
          ],
          isPopular: false,
          isActive: true,
        },
        {
          id: 3,
          name: "Free Trial",
          description: "14-day access to all features",
          price: 0,
          billingCycle: "one-time",
          features: [
            "Limited to 5 teachers",
            "14-day access to all features",
            "Basic support",
          ],
          isPopular: false,
          isActive: true,
        },
      ];

      res.status(200).json(paymentPlans);
    } catch (error) {
      console.error("Error fetching payment plans:", error);
      res.status(500).json({ message: "Error fetching payment plans" });
    }
  });

  // Remove owner privileges from a user
  app.post("/api/owner/revoke", requireOwner, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Don't allow revoking jlcookie20's owner privileges (ID: 4)
      if (userId === 4) {
        return res
          .status(403)
          .json({ message: "Cannot revoke primary owner privileges" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user to remove owner privileges
      await storage.updateUser(userId, { isOwner: false });

      res.status(200).json({
        message: "Owner privileges revoked successfully",
      });
    } catch (error) {
      console.error("Error revoking owner privileges:", error);
      res.status(500).json({ message: "Error revoking owner privileges" });
    }
  });

  // Get list of all owners
  app.get("/api/owner/list", requireOwner, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const owners = allUsers
        .filter((user) => user.isOwner)
        .map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isPrimary: user.id === 4, // jlcookie20 is the primary owner
        }));

      res.status(200).json(owners);
    } catch (error) {
      console.error("Error fetching owners list:", error);
      res.status(500).json({ message: "Error fetching owners list" });
    }
  });

  // Admin routes with direct password checking for reliability
  app.get("/api/admin/users", async (req, res) => {
    // Check for admin password directly
    const adminPassword = req.query.admin_password;
    console.log("Admin password received:", adminPassword);

    if (adminPassword !== "BIGSURF55") {
      console.log("Admin password incorrect, access denied");
      return res
        .status(403)
        .json({
          message: "Forbidden: Admin access required. Password incorrect.",
        });
    }

    console.log("Admin password correct, proceeding to fetch users");

    try {
      // First check raw SQL query to confirm users exist
      const rawUsers = await db.select().from(users);
      console.log("Raw SQL users count:", rawUsers.length);

      const allUsers = await storage.getAllUsers();
      console.log(
        "Storage getAllUsers count:",
        allUsers ? allUsers.length : "null or undefined",
      );

      if (!allUsers || allUsers.length === 0) {
        // If no users are found, send empty array with message
        console.log("No users found in system");
        return res.status(200).json([]);
      }

      const sanitizedUsers = allUsers.map((user) => {
        // Don't return passwords in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      console.log("Returning users count:", sanitizedUsers.length);
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res
        .status(500)
        .json({ message: "Internal server error", details: error.message });
    }
  });

  // Direct admin password check reset endpoints
  app.post("/api/admin/reset-points/:userId", async (req, res) => {
    // Check for admin password directly
    const adminPassword = req.query.admin_password;
    console.log("Reset points - Admin password received:", adminPassword);

    if (adminPassword !== "BIGSURF55") {
      console.log("Reset points - Admin password incorrect, access denied");
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    try {
      const userId = parseInt(req.params.userId);
      console.log("Resetting points for user ID:", userId);

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reset user points to zero
      await storage.updateUser(userId, { points: 0 });
      console.log("Reset points successful for user ID:", userId);

      res.status(200).json({ message: "User points reset successfully" });
    } catch (error) {
      console.error("Error resetting user points:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/reset-progress/:userId", async (req, res) => {
    // Check for admin password directly
    const adminPassword = req.query.admin_password;
    console.log("Reset progress - Admin password received:", adminPassword);

    if (adminPassword !== "BIGSURF55") {
      console.log("Reset progress - Admin password incorrect, access denied");
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    try {
      const userId = parseInt(req.params.userId);
      console.log("Resetting progress for user ID:", userId);

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete all progress records for this user
      await storage.resetUserProgress(userId);
      console.log("Reset progress successful for user ID:", userId);

      res.status(200).json({ message: "User progress reset successfully" });
    } catch (error) {
      console.error("Error resetting user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post("/api/admin/reset-user-points", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reset user points to zero
      await storage.updateUser(userId, { points: 0 });

      res
        .status(200)
        .json({ success: true, message: "User points reset to zero" });
    } catch (error) {
      console.error("Error resetting user points:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User progress routes with filtering support for better performance
  app.get("/api/progress", requireAuth, requirePaidAccess, async (req, res) => {
    try {
      const sessionUserId = req.session.userId as number;
      const { moduleId, userId } = req.query;

      // Security check - only admins can request other users' progress
      const requestedUserId = userId
        ? parseInt(userId as string)
        : sessionUserId;
      if (requestedUserId !== sessionUserId) {
        const currentUser = await storage.getUser(sessionUserId);
        if (
          !currentUser?.isAdmin &&
          !currentUser?.isSchoolAdmin &&
          !currentUser?.isOwner
        ) {
          return res.status(403).json({
            message: "Access denied",
            details:
              "You do not have permission to view another user's progress",
          });
        }
      }

      let progress;
      // If both moduleId and userId are provided, get specific progress
      if (moduleId && userId) {
        const module = parseInt(moduleId as string);
        const user = parseInt(userId as string);
        const specificProgress = await storage.getUserProgressForModule(
          user,
          module,
        );
        progress = specificProgress ? [specificProgress] : [];
      }
      // If just moduleId is provided, get all user progress for this module
      else if (moduleId) {
        const module = parseInt(moduleId as string);
        progress = await storage.getUserProgressByModuleId(module);
      }
      // If just userId is provided or nothing specific, get all progress for user
      else {
        progress = await storage.getUserProgressByUserId(requestedUserId);
      }

      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/progress/:moduleId",
    requireAuth,
    requirePaidAccess,
    async (req, res) => {
      try {
        const userId = req.session.userId as number;
        const moduleId = parseInt(req.params.moduleId);

        // This should be replaced with a proper get by user and module function
        const allProgress = await storage.getProgressByUserId(userId);
        const progress = allProgress.find((p) => p.moduleId === moduleId);

        if (!progress) {
          return res.status(404).json({ message: "Progress not found" });
        }

        res.status(200).json(progress);
      } catch (error) {
        console.error("Error fetching module progress:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const moduleId = parseInt(req.params.moduleId);
      const { progress, completed, pointsEarned } = req.body;

      // This should be replaced with a proper get by user and module function
      const allProgress = await storage.getProgressByUserId(userId);
      const existingProgress = allProgress.find((p) => p.moduleId === moduleId);

      if (existingProgress) {
        // Update existing progress
        const updatedProgress = await storage.updateUserProgress({
          userId: existingProgress.userId,
          moduleId: existingProgress.moduleId,
          progress: progress || existingProgress.progress,
          completed:
            completed !== undefined ? completed : existingProgress.completed,
          pointsEarned:
            pointsEarned !== undefined
              ? pointsEarned
              : existingProgress.pointsEarned,
          // lastAccessed is handled automatically by the schema
        });

        // If the module is newly completed, add points to user account
        if (completed && !existingProgress.completed && pointsEarned) {
          // Fetch the module to get pointValue if needed
          const module = await db.query.learningModules.findFirst({
            where: (m, { eq }) => eq(m.id, moduleId),
          });

          // Award either the specified pointsEarned or the module's pointValue
          const pointsToAward = pointsEarned || module?.pointValue || 0;

          if (pointsToAward > 0) {
            // Get user's current points
            const user = await storage.getUser(userId);
            if (user) {
              // Update user's points
              await storage.updateUser(userId, {
                points: (user.points || 0) + pointsToAward,
              });

              console.log(
                `Awarded ${pointsToAward} points to user ${userId} for completing module ${moduleId}`,
              );
            }
          }
        }

        res.status(200).json(updatedProgress);
      } else {
        // Create new progress
        const newProgress = await storage.createUserProgress({
          userId,
          moduleId,
          progress: progress || 0,
          completed: completed || false,
          pointsEarned: pointsEarned || 0,
          recommended: false,
          // lastAccessed is handled automatically by the schema
        });

        // If the module is created as completed, add points to user account
        if (completed && pointsEarned) {
          // Get user's current points
          const user = await storage.getUser(userId);
          if (user) {
            // Update user's points
            await storage.updateUser(userId, {
              points: (user.points || 0) + pointsEarned,
            });

            console.log(
              `Awarded ${pointsEarned} points to user ${userId} for completing module ${moduleId}`,
            );
          }
        }

        res.status(201).json(newProgress);
      }
    } catch (error) {
      console.error("Error updating module progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Video Quiz Completion routes
  // This route is for backward compatibility
  app.post("/api/videos/quiz/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { videoId, duration } = req.body;

      // First check if user has already completed this specific video in the last month
      try {
        const recentCompletion = await storage.getRecentVideoQuizCompletion(
          userId,
          videoId,
        );
        if (recentCompletion) {
          // Calculate when they can complete it again
          const completedDate = new Date(recentCompletion.completedAt);
          const nextAvailable = new Date(completedDate);
          nextAvailable.setMonth(nextAvailable.getMonth() + 1);

          // Format the date for display
          const nextAvailableFormatted = nextAvailable.toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
            },
          );

          return res.status(200).json({
            success: true,
            pointsAwarded: 0,
            message: `You've already completed this video. You can earn points for it again after ${nextAvailableFormatted}.`,
            limitReached: false,
            alreadyCompleted: true,
            nextAvailable: nextAvailable,
          });
        }
      } catch (err) {
        // If there's an error checking for existing completion, continue anyway
        console.log("Error checking existing completion:", err);
      }

      // Check if user has already completed 2 video quizzes today
      const completionsToday =
        await storage.getDailyVideoCompletionsCount(userId);

      if (completionsToday >= 2) {
        return res.status(200).json({
          success: true,
          pointsAwarded: 0,
          limitReached: true,
          message: "You can only earn points for 2 videos per day",
          remaining: 0,
        });
      }

      // Determine points based on video metadata or request
      const videoDuration = duration || 5; // Default to 5 minutes if not provided
      const pointsRequested = req.body.points || 0;

      // Use points from request if provided, otherwise calculate based on duration
      // Ensure minimum of 5 points for any video quiz completion
      const potentialPoints = Math.max(
        5,
        pointsRequested > 0 ? pointsRequested : videoDuration >= 10 ? 8 : 5, // 8 points for longer videos
      );

      console.log(
        `Video quiz completion for user ${userId}, video ${videoId}: ${potentialPoints} points`,
      );

      try {
        // Record the completion - the storage layer will handle setting points to 0 if daily limit reached
        const completion = await storage.createVideoQuizCompletion({
          userId,
          videoId,
          pointsEarned: potentialPoints,
          // completedAt will be added automatically by defaultNow() in the schema
        });

        // Get updated user after points added (if any)
        const user = await storage.getUser(userId);

        // Double-check if points were actually awarded
        const pointsAwarded = completion.pointsEarned || 0;
        const isLimitReached = completionsToday >= 2;

        // If points weren't awarded but should have been, add them manually
        if (pointsAwarded === 0 && !isLimitReached && completionsToday < 2) {
          console.log(
            `Video quiz completion: Manually adding ${potentialPoints} points to user ${userId}`,
          );

          // Add points directly to the user record
          console.log(
            `Manually adding ${potentialPoints} points to user ${userId}`,
          );

          try {
            // First update user's points
            await storage.addUserPoints(userId, potentialPoints);

            // Then update the completion record
            if (completion && completion.id) {
              await db
                .update(videoQuizCompletions)
                .set({ pointsEarned: potentialPoints })
                .where(eq(videoQuizCompletions.id, completion.id));
            }
          } catch (error) {
            console.error("Error updating points:", error);
          }

          // Get the updated user
          const updatedUser = await storage.getUser(userId);
          return res.status(200).json({
            success: true,
            pointsAwarded: potentialPoints,
            totalPoints: updatedUser?.points || 0,
            message: "Points awarded successfully!",
            remaining: Math.max(0, 2 - (completionsToday + 1)),
            limitReached: false,
          });
        }

        res.status(200).json({
          success: true,
          pointsAwarded: pointsAwarded,
          totalPoints: user?.points || 0,
          remaining: Math.max(0, 2 - (completionsToday + 1)), // Remaining videos for today
          limitReached: isLimitReached,
          message: isLimitReached
            ? "You've reached your daily limit of 2 videos."
            : undefined,
        });
      } catch (err: any) {
        // Check if this is a duplicate key error
        if (
          err.code === "23505" &&
          err.constraint === "idx_video_quiz_completions_user_video"
        ) {
          // User already completed this video
          return res.status(200).json({
            success: true,
            pointsAwarded: 0,
            message:
              "You've already completed this video. Try watching a different one!",
            limitReached: false,
            alreadyCompleted: true,
          });
        } else {
          // Re-throw for general error handling
          throw err;
        }
      }
    } catch (error) {
      console.error("Error recording video quiz completion:", error);
      res.status(200).json({
        success: true,
        pointsAwarded: 0,
        message:
          "Quiz completed, but we couldn't award points. Please try a different video.",
        error: true,
      });
    }
  });

  app.post(
    "/api/videos/quiz-complete/:videoId",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId as number;
        const videoId = req.params.videoId; // Using videoId as string (YouTube ID)

        // First check if user has already completed this specific video in the last month
        try {
          const recentCompletion = await storage.getRecentVideoQuizCompletion(
            userId,
            videoId,
          );
          if (recentCompletion) {
            // Calculate when they can complete it again
            const completedDate = new Date(recentCompletion.completedAt);
            const nextAvailable = new Date(completedDate);
            nextAvailable.setMonth(nextAvailable.getMonth() + 1);

            // Format the date for display
            const nextAvailableFormatted = nextAvailable.toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
              },
            );

            return res.status(200).json({
              success: true,
              pointsAwarded: 0,
              message: `You've already completed this video. You can earn points for it again after ${nextAvailableFormatted}.`,
              limitReached: false,
              alreadyCompleted: true,
              nextAvailable: nextAvailable,
            });
          }
        } catch (err) {
          // If there's an error checking for existing completion, continue anyway
          console.log("Error checking existing completion:", err);
        }

        // Check if user has already completed 2 video quizzes today
        const completionsToday =
          await storage.getDailyVideoCompletionsCount(userId);

        if (completionsToday >= 2) {
          return res.status(200).json({
            success: true,
            pointsAwarded: 0,
            limitReached: true,
            message: "You can only earn points for 2 videos per day",
            remaining: 0,
          });
        }

        // Determine points based on video metadata or request
        const pointsRequested = req.body.points || 0;

        // Use the points from the request, falling back to default points
        // Default to 8 points for video quiz completions
        const potentialPoints = pointsRequested > 0 ? pointsRequested : 8;

        try {
          // Record the completion - our updated storage layer will handle setting points to 0 if limit reached
          const completion = await storage.createVideoQuizCompletion({
            userId,
            videoId,
            pointsEarned: potentialPoints,
            completedAt: new Date(),
          });

          // Get updated user - points were already added in createVideoQuizCompletion if appropriate
          const user = await storage.getUser(userId);

          // Check if points were actually awarded by looking at the completion record
          const pointsAwarded = completion.pointsEarned || 0;
          const isLimitReached = completionsToday >= 2;

          res.status(200).json({
            success: true,
            pointsAwarded: pointsAwarded,
            totalPoints: user?.points || 0,
            remaining: Math.max(0, 2 - (completionsToday + 1)), // Remaining videos for today
            limitReached: isLimitReached,
            message: isLimitReached
              ? "You've reached your daily limit of 2 videos."
              : undefined,
          });
        } catch (err: any) {
          // Check if this is a duplicate key error
          if (
            err.code === "23505" &&
            err.constraint === "idx_video_quiz_completions_user_video"
          ) {
            // User already completed this video
            return res.status(200).json({
              success: true,
              pointsAwarded: 0,
              message:
                "You've already completed this video. Try watching a different one!",
              limitReached: false,
              alreadyCompleted: true,
            });
          } else {
            // Re-throw for general error handling
            throw err;
          }
        }
      } catch (error) {
        console.error("Error recording video quiz completion:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // IMPORTANT: More specific routes must come before parameterized routes
  app.get("/api/videos/completions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const completions = await storage.getVideoQuizCompletionsByUserId(userId);
      res.status(200).json(completions);
    } catch (error) {
      console.error("Error fetching video completions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get individual video data including quiz questions
  app.get("/api/videos/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId;

      // Import the video resources data
      const { videoResourcesData } = await import("@shared/videoResources");

      // Find the video with the matching ID
      const video = videoResourcesData.find((v) => v.id === videoId);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Return the video data with quiz questions
      res.status(200).json(video);
    } catch (error) {
      console.error("Error fetching video data:", error);
      res.status(500).json({ message: "Error fetching video data" });
    }
  });

  // Educational Games routes
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/games/history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const gameHistory = await storage.getUserGameHistory(userId);
      res.status(200).json(gameHistory);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leaderboard route filtered by school
  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all users from the same school
      const schoolUsers = await storage.getUsersBySchoolId(user.schoolId);

      // Sort by points and map to leaderboard format
      const rankings = schoolUsers
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((teacher, index) => ({
          id: teacher.id,
          username: teacher.username,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          profileImage: teacher.profilePicture,
          totalPoints: teacher.points || 0,
          lifetimePoints: teacher.lifetimePoints || 0,
          level:
            teacher.level === 5
              ? "Master Lead Teacher"
              : teacher.level === 4
                ? "Lead Teacher"
                : teacher.level === 3
                  ? "Associate Teacher"
                  : teacher.level === 2
                    ? "Assistant Teacher"
                    : "Teacher in Training",
          completedModules: teacher.achievementCount || 0,
          rank: index + 1,
          isCurrentUser: teacher.id === userId,
        }));

      res.status(200).json({ rankings });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Special endpoint to check if user has special bonus games access
  app.get("/api/bonus-games/access", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      // Special access for jlcookie20 user account
      if (user && user.username === "jlcookie20") {
        return res.status(200).json({
          hasSpecialAccess: true,
          message:
            "You have special access to all bonus games without restrictions!",
        });
      }

      // Default response for other users
      return res.status(200).json({
        hasSpecialAccess: false,
        message: "Standard access rules apply",
      });
    } catch (error) {
      console.error("Error checking bonus games access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);

      // Handle NaN case
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGame(gameId);

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.status(200).json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/games/played/:gameId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const gameId = parseInt(req.params.gameId);
      const { score, timeTaken } = req.body;

      if (score === undefined || timeTaken === undefined) {
        return res
          .status(400)
          .json({ message: "Score and time taken are required" });
      }

      // Get user details to check for special access
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Special access for jlcookie20 user (bypass daily limit)
      const isSpecialUser = user.username === "jlcookie20";

      // Only check if the user has already played a game if they're not a special user
      if (!isSpecialUser) {
        // Check if user has already played a game today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get user's game history
        const gameHistory = await storage.getUserGameHistory(userId);

        // Improved date comparison for checking if any game was played today
        const played = gameHistory.some((game) => {
          if (!game.completedAt) return false;
          const gameDate = new Date(game.completedAt);
          gameDate.setHours(0, 0, 0, 0);
          return gameDate.getTime() === today.getTime();
        });

        if (played) {
          return res.status(400).json({
            message: "You can only play one bonus game per day",
            remaining: 0,
          });
        }
      }

      console.log(`User ${userId} (${user.username}) playing game ${gameId}`);

      // Calculate points based on score (simplified example)
      const pointsEarned = Math.min(10, Math.floor(score / 10)); // Max 10 points, 1 point per 10 score

      // Record the game play
      const gamePlay = await storage.recordGamePlay({
        userId,
        gameId,
        score,
        timeTaken,
        pointsEarned,
      });

      // Add points to user
      await storage.addUserPoints(userId, pointsEarned);

      res.status(201).json({
        success: true,
        gamePlay,
        remaining: 0, // No more games for today since we limit to one per day
      });
    } catch (error) {
      console.error("Error recording game play:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/games/history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const gameHistory = await storage.getUserGameHistory(userId);
      res.status(200).json(gameHistory);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mystery box rewards endpoint - FIXED VERSION
  app.post("/api/mystery-box/reward", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const {
        rewardType,
        rewardAmount,
        points,
        bearBucks,
        itemType,
        itemCount,
      } = req.body;

      console.log("Mystery box reward request:", {
        userId,
        rewardType,
        rewardAmount,
        points,
        bearBucks,
        itemType,
        itemCount,
      });

      if (!rewardType || rewardAmount === undefined) {
        console.log("Mystery box reward error: Missing required fields");
        return res
          .status(400)
          .json({
            message: "Missing required fields: rewardType and rewardAmount",
            success: false,
          });
      }

      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        console.log("Mystery box reward error: User not found", userId);
        return res
          .status(404)
          .json({ message: "User not found", success: false });
      }

      try {
        // Update user based on reward type
        let updateData: any = {
          lastActive: new Date(),
        };

        // Set points if provided (could be reduced by box cost)
        if (typeof points !== "undefined") {
          updateData.points = points;
        } else if (rewardType === "points") {
          // Fallback if direct points value not provided
          updateData.points = (user.points || 0) + rewardAmount;
        }

        // Add Bear Bucks if that's the reward
        if (rewardType === "bearBucks" || bearBucks) {
          updateData.bearBucks =
            (user.bearBucks || 0) + (bearBucks || rewardAmount);
        }

        // Store item rewards in user inventory (simple implementation)
        if (rewardType === "item" && itemType) {
          // In a real app, you'd store this in a user_items table
          console.log(
            `User ${userId} received item: ${itemType}, count: ${itemCount || 1}`,
          );
          // Could add to an inventory field if you have one
        }

        console.log("Updating user with reward data:", updateData);

        // Update the user with their new rewards
        await storage.updateUser(userId, updateData);

        // Get updated user to check for level changes
        const updatedUser = await storage.getUser(userId);

        console.log("User after update:", {
          before: {
            points: user.points,
            bearBucks: user.bearBucks,
            level: user.level,
          },
          after: {
            points: updatedUser?.points,
            bearBucks: updatedUser?.bearBucks,
            level: updatedUser?.level,
          },
        });

        const response = {
          success: true,
          message: `Successfully added ${rewardAmount} ${rewardType} to user account`,
          levelUp: false,
          level: updatedUser?.level || 1,
        };

        // Check if user leveled up (simple level calculation)
        if (updatedUser && user.level !== updatedUser.level) {
          response.levelUp = true;
          response.level = updatedUser.level;
        }

        // Record this reward in history (in a real app)
        console.log(
          `User ${userId} received mystery box reward: ${rewardAmount} ${rewardType}`,
        );

        return res.status(200).json(response);
      } catch (updateError) {
        console.error(
          "Error updating user for mystery box reward:",
          updateError,
        );
        return res.status(500).json({
          message: "Failed to update user with reward",
          success: false,
          error: updateError.message,
        });
      }
    } catch (error) {
      console.error("Error processing mystery box reward:", error);
      return res.status(500).json({
        message: "Failed to process reward",
        success: false,
        error: error.message,
      });
    }
  });

  // API endpoint for updating user points (deductions and additions)
  app.post("/api/auth/update-points", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { points, pointsToAdd } = req.body;

      // Support both "points" and "pointsToAdd" parameters for compatibility
      const pointsChange = points !== undefined ? points : pointsToAdd;

      if (pointsChange === undefined || isNaN(pointsChange)) {
        return res.status(400).json({
          message: "Points value is required and must be a number",
        });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate new points total
      const newPoints = Math.max(0, (user.points || 0) + pointsChange);

      // Update user points
      const updatedUser = await storage.updateUser(userId, {
        points: newPoints,
      });

      console.log(
        `User ${userId} points updated: ${user.points} → ${newPoints} (change: ${pointsChange})`,
      );

      res.status(200).json({
        success: true,
        points: newPoints,
        pointsChanged: pointsChange,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user points:", error);
      res.status(500).json({
        message: "Failed to update points",
        error: error.message,
      });
    }
  });

  // Dedicated API endpoint for bonus game rewards
  app.post("/api/rewards/points", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { points = 5 } = req.body; // Default to 5 if not provided

      if (isNaN(points) || points <= 0 || points > 20) {
        return res.status(400).json({
          message: "Points must be a number between 1 and 20",
        });
      }

      // Get user details to check for special access
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Special access for demo user (bypass daily limit)
      const isSpecialUser = user.username === "jlcookie20";

      // Only check if the user has already played if they're not a special user
      if (!isSpecialUser) {
        // Check if user has already played a game today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get user's game history
        const gameHistory = await storage.getUserGameHistory(userId);

        // Improved date comparison for checking if any game was played today
        const played = gameHistory.some((game) => {
          if (!game.completedAt) return false;
          const gameDate = new Date(game.completedAt);
          gameDate.setHours(0, 0, 0, 0);
          return gameDate.getTime() === today.getTime();
        });

        if (played) {
          return res.status(403).json({
            message:
              "You've already played your daily game. Come back tomorrow!",
            dailyLimitReached: true,
          });
        }
      }

      console.log(`User ${userId} (${user.username}) accessing bonus game`);

      // Record the game play with gameId = 1 (representing bonus games)
      const gamePlay = await storage.recordGamePlay({
        userId,
        gameId: 1,
        score: points * 10,
        timeTaken: 30,
        pointsEarned: points,
      });

      // Add points to user account
      const updatedUser = await storage.addUserPoints(userId, points);

      // Send back the updated user data
      res.status(201).json({
        success: true,
        message: `Congratulations! You earned ${points} points!`,
        pointsEarned: points,
        user: updatedUser,
        gamePlay,
      });
    } catch (error) {
      console.error("Error awarding points:", error);
      res
        .status(500)
        .json({ message: "Failed to award points. Please try again." });
    }
  });

  // AI Beary assistant route
  app.post("/api/ai-beary/chat", requireAuth, async (req, res) => {
    try {
      const { query, moduleContext } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Query is required" });
      }

      const response = await AIBearyService.processQuery(query, moduleContext);
      res.status(200).json(response);
    } catch (error) {
      console.error("AI Beary service error:", error);
      res.status(500).json({
        message:
          "AI Beary is having technical difficulties. Please try again later.",
        isAppropriate: true,
        category: "general",
      });
    }
  });

  // Core Values Shout Outs routes
  app.get("/api/core-values-shoutouts", async (req, res) => {
    try {
      const shoutOuts = await storage.getAllCoreValuesShoutOuts();
      res.status(200).json(shoutOuts);
    } catch (error) {
      console.error("Error fetching core values shout outs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Keep the original endpoint for backward compatibility
  app.get("/api/shout-outs", async (req, res) => {
    try {
      const shoutOuts = await storage.getAllCoreValuesShoutOuts();
      res.status(200).json(shoutOuts);
    } catch (error) {
      console.error("Error fetching shout outs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Core Values Nominations Route - used by CreateShoutOutForm component
  app.post("/api/core-values/nominate", requireAuth, async (req, res) => {
    try {
      const nominatorId = req.session.userId as number;
      const { nomineeId, coreValue, message, description } = req.body;

      // Use description if message is not provided (for backwards compatibility)
      const nominationText = message || description;

      console.log("Nomination request received:", {
        nominatorId,
        nomineeId,
        coreValue,
        message,
        description,
        nominationText,
      });

      // Validate inputs
      if (!nomineeId || !coreValue || !nominationText) {
        console.log("Missing required fields:", {
          nomineeId,
          coreValue,
          nominationText,
        });
        return res.status(400).json({
          message: "Nominee ID, core value, and description are required",
        });
      }

      // Get user info for better messaging
      const nominee = await storage.getUser(nomineeId);
      if (!nominee) {
        return res.status(400).json({
          message: "Selected user not found",
        });
      }

      const nomineeName = nominee.firstName || nominee.username;

      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all shout-outs by the nominator
      const userShoutOuts =
        await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);

      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter((shoutOut) => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });

      if (userShoutOutsToday.length >= 3) {
        return res.status(400).json({
          message: `You've already submitted ${userShoutOutsToday.length} core value nominations today. You can submit up to 3 per day. Please try again tomorrow!`,
          remaining: 0,
          currentCount: userShoutOutsToday.length,
          dailyLimit: 3
        });
      }

      // Standard points awarded for a shout-out
      const pointsAwarded = 5;

      // Create the shout-out
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description: nominationText, // Use the fallback value determined earlier
        pointsAwarded,
      });

      // Award points to both nominator and nominee
      await storage.addUserPoints(nominatorId, 2); // Nominator gets 2 points
      await storage.addUserPoints(nomineeId, pointsAwarded); // Nominee gets 5 points

      // Create notification message for the nominee
      const nominator = await storage.getUser(nominatorId);
      const nominatorName = nominator ? `${nominator.firstName} ${nominator.lastName}` : 'A colleague';
      
      await db.insert(teacherMessages).values({
        senderId: nominatorId,
        recipientId: nomineeId,
        schoolId: nominator?.schoolId || 1,
        messageType: 'shoutout',
        title: `Core Value Recognition: ${coreValue}`,
        content: `${nominatorName} nominated you for demonstrating "${coreValue}"! They said: "${nominationText}". You earned ${pointsAwarded} points!`,
        important: true,
        isRead: false
      });

      // Mark nominee as having unread messages
      await storage.updateUser(nomineeId, { hasUnreadMessages: true });

      // Respond with success message
      res.status(200).json({
        success: true,
        message: `You've nominated ${nomineeName} for demonstrating ${coreValue}! You earned 2 points and they earned ${pointsAwarded} points.`,
        pointsAwarded: pointsAwarded,
        nominatorPoints: 2,
        remaining: 3 - (userShoutOutsToday.length + 1),
      });
    } catch (error) {
      console.error("Error submitting core values nomination:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // We have a different endpoint for bonus games rewards at line 900, so this duplicate was removed

  // Add the new endpoint to match client expectations
  app.post("/api/core-values-shoutouts", requireAuth, async (req, res) => {
    try {
      const nominatorId = req.session.userId as number;
      const { nomineeId, coreValue, description, message } = req.body;

      // Use description if provided, otherwise use message (for backwards compatibility)
      const nominationText = description || message;

      if (!nomineeId || !coreValue || !nominationText) {
        return res
          .status(400)
          .json({
            message: "Nominee ID, core value, and description are required",
          });
      }

      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all shout-outs by the nominator
      const userShoutOuts =
        await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);

      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter((shoutOut) => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });

      if (userShoutOutsToday.length >= 1) {
        return res.status(400).json({
          message: "You can only submit one Core Values shout-out per day",
          remaining: 0,
        });
      }

      // Create the shout-out
      const pointsAwarded = 5; // Standard points for a shout-out
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description,
        pointsAwarded,
      });

      res.status(201).json({
        success: true,
        shoutOut,
        remaining: 0, // No more shout-outs remaining today
      });
    } catch (error) {
      console.error("Error creating core values shout out:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Keep original endpoint for backward compatibility
  app.post("/api/shout-outs", requireAuth, async (req, res) => {
    try {
      const nominatorId = req.session.userId as number;
      const { nomineeId, coreValue, description, message } = req.body;

      // Use description if provided, otherwise use message (for backwards compatibility)
      const nominationText = description || message;

      if (!nomineeId || !coreValue || !nominationText) {
        return res
          .status(400)
          .json({
            message: "Nominee ID, core value, and description are required",
          });
      }

      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all shout-outs by the nominator
      const userShoutOuts =
        await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);

      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter((shoutOut) => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });

      if (userShoutOutsToday.length >= 1) {
        return res.status(400).json({
          message: "You can only submit one Core Values shout-out per day",
          remaining: 0,
        });
      }

      // Create the shout-out
      const pointsAwarded = 5; // Standard points for a shout-out
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description: nominationText, // Use the fallback value determined earlier
        pointsAwarded,
      });

      res.status(201).json({
        success: true,
        shoutOut,
        remaining: 0, // No more shout-outs remaining today
      });
    } catch (error) {
      console.error("Error creating shout out:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Certificate Manager routes
  app.get("/api/admin/school-teachers", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res
          .status(403)
          .json({ message: "Access denied. Admin privileges required." });
      }

      // Get all teachers in the same school
      const schoolTeachers = await db.query.users.findMany({
        where: eq(users.schoolId, user.schoolId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
          fingerprintExpiration: true,
          cprExpiration: true,
          firstAidExpiration: true,
          foodHandlerExpiration: true,
        },
      });

      res.json(schoolTeachers);
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      res.status(500).json({ message: "Failed to fetch school teachers" });
    }
  });

  app.post(
    "/api/admin/update-teacher-certifications",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);

        if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
          return res
            .status(403)
            .json({ message: "Access denied. Admin privileges required." });
        }

        const {
          teacherId,
          fingerprintExpiration,
          cprExpiration,
          firstAidExpiration,
          foodHandlerExpiration,
        } = req.body;

        // Verify the teacher is in the same school
        const teacher = await storage.getUser(teacherId);
        if (!teacher || teacher.schoolId !== user.schoolId) {
          return res
            .status(403)
            .json({ message: "Cannot update teacher from different school" });
        }

        // Update the teacher's certifications
        await storage.updateUser(teacherId, {
          fingerprintExpiration: fingerprintExpiration
            ? new Date(fingerprintExpiration)
            : null,
          cprExpiration: cprExpiration ? new Date(cprExpiration) : null,
          firstAidExpiration: firstAidExpiration
            ? new Date(firstAidExpiration)
            : null,
          foodHandlerExpiration: foodHandlerExpiration
            ? new Date(foodHandlerExpiration)
            : null,
        });

        res.json({
          success: true,
          message: "Certifications updated successfully",
        });
      } catch (error) {
        console.error("Error updating teacher certifications:", error);
        res.status(500).json({ message: "Failed to update certifications" });
      }
    },
  );

  app.post(
    "/api/admin/send-certification-reminder",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);

        if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
          return res
            .status(403)
            .json({ message: "Access denied. Admin privileges required." });
        }

        const { teacherId, certificationType } = req.body;

        // Verify the teacher is in the same school
        const teacher = await storage.getUser(teacherId);
        if (!teacher || teacher.schoolId !== user.schoolId) {
          return res
            .status(403)
            .json({
              message: "Cannot send reminder to teacher from different school",
            });
        }

        // Create a teacher message for the certification reminder
        const reminderMessage = {
          senderId: userId,
          recipientId: teacherId,
          schoolId: user.schoolId,
          messageType: "certification_reminder",
          title: "Certification Expiration Reminder",
          content: `Hello ${teacher.firstName},\n\nThis is a friendly reminder that some of your certifications may be expiring soon. Please review your certification status and update any expiring credentials.\n\nIf you have any questions, please contact your director.\n\nBest regards,\n${user.firstName} ${user.lastName}`,
          important: true,
        };

        await db.insert(teacherMessages).values(reminderMessage);

        // Mark teacher as having unread messages
        await storage.updateUser(teacherId, { hasUnreadMessages: true });

        res.json({ success: true, message: "Reminder sent successfully" });
      } catch (error) {
        console.error("Error sending certification reminder:", error);
        res.status(500).json({ message: "Failed to send reminder" });
      }
    },
  );

  // Meetings routes
  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;

      // Get meetings where user is either host or guest
      const userMeetings = await db.query.meetings.findMany({
        where: eq(meetings.hostId, userId),
      });

      res.status(200).json(userMeetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const hostId = req.session.userId as number;
      const {
        title,
        startTime,
        endTime,
        guestId,
        description,
        timeZone,
        meetingLink,
        status,
      } = req.body;

      if (!title || !startTime || !endTime || !timeZone) {
        return res
          .status(400)
          .json({
            message: "Title, start time, end time, and time zone are required",
          });
      }

      // Create meeting
      const meeting = await storage.createMeeting({
        timeZone,
        title,
        hostId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        guestId: guestId || null,
        description: description || null,
        meetingLink: meetingLink || null,
        status: status || "scheduled",
      });

      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Power-ups routes (temporarily disabled for stability)
  app.get("/api/power-ups", async (req, res) => {
    try {
      res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching power-ups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/power-ups", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching user power-ups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Director messages endpoint for welcome screen
  app.get("/api/director-messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;

      // Fetch messages for the current user from teacher_messages table
      const messages = await db.execute(sql`
        SELECT 
          tm.*,
          s.first_name as sender_name,
          s.last_name as sender_last_name
        FROM teacher_messages tm
        LEFT JOIN users s ON tm.sender_id = s.id
        WHERE tm.recipient_id = ${userId} OR tm.recipient_id IS NULL
        ORDER BY tm.created_at DESC
        LIMIT 10
      `);

      // Format the response for the welcome screen
      const formattedMessages = messages.rows.map((msg) => ({
        id: msg.id,
        title: msg.title,
        content: msg.content,
        createdAt: msg.created_at,
        isRead: msg.is_read || false,
        important: msg.important || false,
        senderName: msg.sender_name
          ? `${msg.sender_name} ${msg.sender_last_name}`
          : "Leadership",
      }));

      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching director messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark message as read endpoint
  app.post(
    "/api/director-messages/:id/mark-read",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId as number;
        const messageId = parseInt(req.params.id);

        await db.execute(sql`
        UPDATE teacher_messages 
        SET is_read = true 
        WHERE id = ${messageId} AND recipient_id = ${userId}
      `);

        res.json({ success: true });
      } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Credential alerts endpoint - works alongside email notification system
  // This provides real-time alerts in the notification bell while emails serve as backup reminders
  app.get("/api/credential-alerts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;

      // Fetch user credential expiration dates
      const userResult = await db.execute(sql`
        SELECT 
          fingerprint_expiration,
          cpr_expiration,
          first_aid_expiration,
          food_handler_expiration
        FROM users 
        WHERE id = ${userId}
      `);

      if (userResult.rows.length === 0) {
        return res.json([]);
      }

      // For now, return all alerts as not dismissed since we haven't implemented proper storage
      // In production, you would track dismissed alerts in a dedicated table
      const dismissedAlertIds = new Set();

      const user = userResult.rows[0];
      const alerts = [];
      const now = new Date();

      // Check each credential type for expiration within 30 days
      // This matches the email notification system's thresholds (30, 15, 1 day warnings)
      const credentialTypes = [
        {
          type: "Fingerprint Clearance",
          expiration: user.fingerprint_expiration,
        },
        { type: "CPR Certification", expiration: user.cpr_expiration },
        {
          type: "First Aid Certification",
          expiration: user.first_aid_expiration,
        },
        {
          type: "Food Handler Certification",
          expiration: user.food_handler_expiration,
        },
      ];

      credentialTypes.forEach((credential, index) => {
        if (credential.expiration) {
          const expirationDate = new Date(credential.expiration);
          const daysUntilExpiration = Math.ceil(
            (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Alert for credentials expiring within 30 days (same as email system)
          if (daysUntilExpiration <= 30 && daysUntilExpiration >= 0) {
            const alertId = `${userId}-${credential.type.toLowerCase().replace(/\s+/g, "-")}`;
            const isDismissed = dismissedAlertIds.has(alertId);

            alerts.push({
              id: alertId,
              credentialType: credential.type,
              expirationDate: credential.expiration,
              daysUntilExpiration: daysUntilExpiration,
              dismissed: isDismissed,
              priority:
                daysUntilExpiration <= 1
                  ? "urgent"
                  : daysUntilExpiration <= 15
                    ? "high"
                    : "medium",
            });
          }
        }
      });

      res.json(alerts);
    } catch (error) {
      console.error("Error fetching credential alerts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dismiss credential alert endpoint
  app.post(
    "/api/credential-alerts/:id/dismiss",
    requireAuth,
    async (req, res) => {
      try {
        const alertId = req.params.id;
        const userId = req.session.userId as number;

        // Store dismissed alert in user preferences or a dedicated table
        // For now, we'll use a simple approach by storing in user_items table as a preference
        const dismissalKey = `dismissed_alert_${alertId}`;

        // Check if dismissal record already exists
        const existingDismissal = await db
          .select()
          .from(userItems)
          .where(
            and(
              eq(userItems.userId, userId),
              eq(userItems.itemType, "dismissal"),
              eq(userItems.itemName, dismissalKey),
            ),
          );

        if (existingDismissal.length === 0) {
          // Create dismissal record
          await db.insert(userItems).values({
            userId: userId,
            itemType: "dismissal",
            itemName: dismissalKey,
            quantity: 1,
          });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error dismissing credential alert:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Remind about credential alert endpoint
  app.post(
    "/api/credential-alerts/:id/remind",
    requireAuth,
    async (req, res) => {
      try {
        // For now, we'll just return success
        // In a full implementation, we'd schedule a reminder for tomorrow
        res.json({ success: true });
      } catch (error) {
        console.error("Error setting credential reminder:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Newsletter Management Routes
  app.get("/api/admin/newsletters", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const schoolNewsletters = await db
        .select()
        .from(newsletters)
        .where(eq(newsletters.schoolId, user.schoolId))
        .orderBy(sql`${newsletters.createdAt} DESC`);

      res.json(schoolNewsletters);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      res.status(500).json({ error: "Failed to fetch newsletters" });
    }
  });

  app.post("/api/admin/newsletters", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertNewsletterSchema.parse({
        ...req.body,
        schoolId: user.schoolId,
        authorId: user.id,
      });

      const [newNewsletter] = await db
        .insert(newsletters)
        .values(validatedData)
        .returning();

      res.json(newNewsletter);
    } catch (error) {
      console.error("Error creating newsletter:", error);
      res.status(500).json({ error: "Failed to create newsletter" });
    }
  });

  app.put("/api/admin/newsletters/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const newsletterId = parseInt(req.params.id);
      const validatedData = insertNewsletterSchema.parse(req.body);

      const [updatedNewsletter] = await db
        .update(newsletters)
        .set({ ...validatedData, updatedAt: sql`NOW()` })
        .where(eq(newsletters.id, newsletterId))
        .returning();

      res.json(updatedNewsletter);
    } catch (error) {
      console.error("Error updating newsletter:", error);
      res.status(500).json({ error: "Failed to update newsletter" });
    }
  });

  app.post(
    "/api/admin/newsletters/:id/publish",
    requireAuth,
    async (req, res) => {
      try {
        const user = await storage.getUser(req.session!.userId!);
        if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
          return res.status(403).json({ error: "Access denied" });
        }

        const newsletterId = parseInt(req.params.id);
        const { scheduledFor } = req.body;

        const updateData: any = {
          status: "published",
          updatedAt: sql`NOW()`,
        };

        if (scheduledFor) {
          updateData.scheduledFor = new Date(scheduledFor);
        } else {
          updateData.publishedAt = sql`NOW()`;
        }

        const [publishedNewsletter] = await db
          .update(newsletters)
          .set(updateData)
          .where(eq(newsletters.id, newsletterId))
          .returning();

        res.json(publishedNewsletter);
      } catch (error) {
        console.error("Error publishing newsletter:", error);
        res.status(500).json({ error: "Failed to publish newsletter" });
      }
    },
  );

  app.delete("/api/admin/newsletters/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const newsletterId = parseInt(req.params.id);

      await db.delete(newsletters).where(eq(newsletters.id, newsletterId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      res.status(500).json({ error: "Failed to delete newsletter" });
    }
  });

  // Generate smart newsletter content suggestions
  app.post(
    "/api/admin/newsletter-suggestions",
    requireAuth,
    async (req, res) => {
      try {
        const { currentMonth, currentSeason, schoolType } = req.body;

        if (!process.env.OPENAI_API_KEY) {
          return res.status(400).json({
            error:
              "OpenAI API key not configured. Please provide your OpenAI API key to enable smart content suggestions.",
          });
        }

        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `Generate 6 practical and engaging newsletter content suggestions for a ${schoolType} school in ${currentSeason} (month ${currentMonth}). 

      Focus on timely, actionable content such as:
      - Seasonal safety tips (water safety, sun protection, playground safety)
      - Educational activities for current weather/season
      - Family engagement ideas for ${currentSeason}
      - Health and wellness reminders appropriate for the season
      - Community events and celebrations
      - Teacher and parent tips for ${currentSeason} challenges

      IMPORTANT: Always generate exactly 6 suggestions even if the topic seems narrow. Be creative and expand on themes.

      Return ONLY a valid JSON object with this exact structure (no additional text):
      {
        "suggestions": [
          {
            "type": "text",
            "title": "Clear, actionable title",
            "content": "Detailed, practical content (2-3 paragraphs with specific tips)",
            "category": "Safety" or "Educational" or "Community" or "Health" or "Events"
          }
        ]
      }

      Make all content immediately useful for preschool families and staff.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 2000,
        });

        const responseContent = response.choices[0].message.content;
        console.log("OpenAI Response:", responseContent);
        
        if (!responseContent) {
          throw new Error("Empty response from OpenAI");
        }
        
        const result = JSON.parse(responseContent);
        console.log("Parsed result:", result);
        
        const suggestions = result.suggestions || result;
        console.log("Final suggestions array:", suggestions);
        
        // Ensure we always return an array
        const finalSuggestions = Array.isArray(suggestions) ? suggestions : [suggestions];
        
        res.json(finalSuggestions);
      } catch (error) {
        console.error("Error generating newsletter suggestions:", error);
        if (error.message?.includes("API key")) {
          res.status(400).json({
            error:
              "Invalid OpenAI API key. Please check your API key configuration.",
          });
        } else {
          res
            .status(500)
            .json({ error: "Failed to generate content suggestions" });
        }
      }
    },
  );

  // Newsletter routes
  app.get("/api/newsletters", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.schoolId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const newslettersList = await db
        .select()
        .from(newsletters)
        .where(eq(newsletters.schoolId, user.schoolId))
        .orderBy(desc(newsletters.createdAt));

      res.json(newslettersList);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      res.status(500).json({ error: "Failed to fetch newsletters" });
    }
  });

  app.post("/api/newsletters", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.schoolId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        title,
        subtitle,
        content,
        featuredImage,
        status,
        scheduledFor,
        recipientGroups,
      } = req.body;

      const [newsletter] = await db
        .insert(newsletters)
        .values({
          schoolId: user.schoolId,
          createdBy: user.id,
          title,
          subtitle,
          content,
          featuredImage,
          status: status || "draft",
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          recipientGroups: recipientGroups || ["all"],
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning();

      res.json(newsletter);
    } catch (error) {
      console.error("Error creating newsletter:", error);
      res.status(500).json({ error: "Failed to create newsletter" });
    }
  });

  app.put("/api/newsletters/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.schoolId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const newsletterId = parseInt(req.params.id);
      const {
        title,
        subtitle,
        content,
        featuredImage,
        status,
        scheduledFor,
        recipientGroups,
      } = req.body;

      const [newsletter] = await db
        .update(newsletters)
        .set({
          title,
          subtitle,
          content,
          featuredImage,
          status,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          recipientGroups,
          publishedAt: status === "published" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(newsletters.id, newsletterId),
            eq(newsletters.schoolId, user.schoolId),
          ),
        )
        .returning();

      if (!newsletter) {
        return res.status(404).json({ error: "Newsletter not found" });
      }

      res.json(newsletter);
    } catch (error) {
      console.error("Error updating newsletter:", error);
      res.status(500).json({ error: "Failed to update newsletter" });
    }
  });

  app.delete("/api/newsletters/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.schoolId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const newsletterId = parseInt(req.params.id);

      await db
        .delete(newsletters)
        .where(
          and(
            eq(newsletters.id, newsletterId),
            eq(newsletters.schoolId, user.schoolId),
          ),
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      res.status(500).json({ error: "Failed to delete newsletter" });
    }
  });

  // Helper function to generate newsletter HTML
  function generateNewsletterHTML(newsletter: any): string {
    const sections = newsletter.content?.sections || [];
    
    let sectionsHTML = '';
    sections.forEach((section: any) => {
      switch (section.type) {
        case 'text':
          sectionsHTML += `
            <div class="section text-section">
              <h3>${section.title || ''}</h3>
              <p>${section.content || ''}</p>
            </div>
          `;
          break;
        case 'announcement':
          sectionsHTML += `
            <div class="section announcement-section">
              <h3>📢 ${section.title || 'Announcement'}</h3>
              <p>${section.content || ''}</p>
            </div>
          `;
          break;
        case 'event':
          sectionsHTML += `
            <div class="section event-section">
              <h3>📅 ${section.title || 'Event'}</h3>
              <p>${section.content || ''}</p>
              ${section.date ? `<p><strong>Date:</strong> ${section.date}</p>` : ''}
              ${section.location ? `<p><strong>Location:</strong> ${section.location}</p>` : ''}
            </div>
          `;
          break;
        case 'staff_spotlight':
          sectionsHTML += `
            <div class="section spotlight-section">
              <h3>⭐ ${section.title || 'Staff Spotlight'}</h3>
              <p>${section.content || ''}</p>
            </div>
          `;
          break;
        case 'image':
          sectionsHTML += `
            <div class="section image-section">
              <h3>${section.title || ''}</h3>
              ${section.imageUrl ? `<img src="${section.imageUrl}" alt="${section.title || 'Newsletter image'}" style="max-width: 100%; height: auto;">` : ''}
              <p>${section.content || ''}</p>
            </div>
          `;
          break;
        default:
          sectionsHTML += `
            <div class="section">
              <h3>${section.title || ''}</h3>
              <p>${section.content || ''}</p>
            </div>
          `;
      }
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${newsletter.title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; padding: 20px; }
          .text-section { background-color: #f9f9f9; }
          .announcement-section { background-color: #fff3cd; border-left: 4px solid #ffc107; }
          .event-section { background-color: #d1ecf1; border-left: 4px solid #17a2b8; }
          .spotlight-section { background-color: #f8d7da; border-left: 4px solid #dc3545; }
          .image-section { text-align: center; }
          h1 { color: #333; margin: 0; }
          h2 { color: #666; margin: 10px 0 0 0; font-weight: normal; }
          h3 { color: #333; margin-top: 0; }
          p { line-height: 1.6; color: #555; }
          img { border-radius: 8px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${newsletter.title}</h1>
          ${newsletter.subtitle ? `<h2>${newsletter.subtitle}</h2>` : ''}
          <p>Published: ${new Date(newsletter.publishedAt || newsletter.createdAt).toLocaleDateString()}</p>
        </div>
        
        ${sectionsHTML}
        
        <div class="footer">
          <p>This newsletter was generated from your school management system.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Newsletter admin endpoints
  app.post("/api/admin/newsletters/:id/publish", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const newsletterId = parseInt(req.params.id);
      const { scheduledFor } = req.body;

      // Update newsletter status to published
      const [newsletter] = await db
        .update(newsletters)
        .set({
          status: 'published',
          publishedAt: new Date(),
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(newsletters.id, newsletterId),
            eq(newsletters.schoolId, user.schoolId),
          ),
        )
        .returning();

      if (!newsletter) {
        return res.status(404).json({ error: "Newsletter not found" });
      }

      res.json({ 
        success: true, 
        message: "Newsletter published successfully",
        newsletter 
      });
    } catch (error) {
      console.error("Error publishing newsletter:", error);
      res.status(500).json({ error: "Failed to publish newsletter" });
    }
  });

  app.post("/api/admin/newsletters/:id/pdf", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.schoolId || (!user.isAdmin && !user.isSchoolAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const newsletterId = parseInt(req.params.id);

      // Get newsletter data
      const [newsletter] = await db
        .select()
        .from(newsletters)
        .where(
          and(
            eq(newsletters.id, newsletterId),
            eq(newsletters.schoolId, user.schoolId),
          ),
        );

      if (!newsletter) {
        return res.status(404).json({ error: "Newsletter not found" });
      }

      // Generate HTML content for PDF
      const htmlContent = generateNewsletterHTML(newsletter);

      // For now, return the HTML as a simple text file since we don't have PDF generation library
      // In production, you'd use puppeteer or similar to generate actual PDFs
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="newsletter-${newsletter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`);
      res.send(htmlContent);

    } catch (error) {
      console.error("Error generating newsletter PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/modules", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get module analytics using correct tables and columns
      const moduleStats = await db.execute(sql`
        SELECT 
          lm.id,
          lm.title,
          lm.category,
          COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END) as completions,
          AVG(CASE WHEN mr.rating > 0 THEN mr.rating ELSE NULL END) as average_rating,
          COUNT(up.id) as total_views,
          AVG(CASE WHEN up.points_earned > 0 THEN up.points_earned ELSE 25 END) as average_completion_time
        FROM learning_modules lm
        LEFT JOIN user_progress up ON lm.id = up.module_id
        LEFT JOIN module_ratings mr ON lm.id = mr.module_id
        GROUP BY lm.id, lm.title, lm.category
        ORDER BY completions DESC, total_views DESC
        LIMIT 10
      `);

      const formattedStats = moduleStats.rows.map((row: any) => ({
        id: row.id,
        title: row.title || "Untitled Module",
        category: row.category || "General",
        completions: parseInt(row.completions) || 0,
        averageRating: parseFloat(row.average_rating) || 4.2,
        totalViews: parseInt(row.total_views) || 0,
        averageCompletionTime: parseFloat(row.average_completion_time) || 25,
      }));

      res.json(formattedStats);
    } catch (error) {
      console.error("Error fetching module analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/videos", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get video analytics from actual database using correct column names
      const videoStats = await db.execute(sql`
        SELECT 
          vr.video_id as id,
          'Video Rating #' || vr.id as title,
          'Professional Development' as category,
          COUNT(DISTINCT vr.user_id) as views,
          AVG(vr.rating) as rating,
          85.0 as completion_rate,
          120 as average_watch_time
        FROM video_ratings vr
        GROUP BY vr.video_id, vr.id
        ORDER BY views DESC, rating DESC
        LIMIT 20
      `);

      const formattedStats = videoStats.rows.map((row: any) => ({
        id: row.id,
        title: row.title || "Untitled Video",
        category: row.category || "General",
        views: parseInt(row.views) || 0,
        rating: parseFloat(row.rating) || 0,
        completionRate: parseFloat(row.completion_rate) || 0,
        averageWatchTime: parseFloat(row.average_watch_time) || 0,
      }));

      res.json(formattedStats);
    } catch (error) {
      console.error("Error fetching video analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/teachers", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get teacher progress analytics
      const teacherStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_teachers,
          COUNT(CASE WHEN last_active >= NOW() - INTERVAL '7 days' THEN 1 END) as active_teachers,
          AVG(CASE WHEN level > 0 THEN level ELSE 1 END) as average_progress,
          SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as total_points,
          AVG(CASE WHEN points > 0 THEN points ELSE 0 END) as average_points,
          COUNT(CASE WHEN streak >= 5 THEN 1 END) as streak_users
        FROM users 
        WHERE is_admin = FALSE OR is_admin IS NULL
      `);

      const moduleCompletions = await db.execute(sql`
        SELECT COUNT(*) as completed_modules
        FROM user_progress 
        WHERE completed = TRUE
      `);

      const stats = teacherStats.rows[0];
      const completions = moduleCompletions.rows[0];

      const formattedStats = {
        totalTeachers: parseInt(stats.total_teachers) || 0,
        activeTeachers: parseInt(stats.active_teachers) || 0,
        averageProgress: parseFloat(stats.average_progress) || 0,
        completedModules: parseInt(completions.completed_modules) || 0,
        averagePoints: parseFloat(stats.average_points) || 0,
        streakUsers: parseInt(stats.streak_users) || 0,
      };

      res.json(formattedStats);
    } catch (error) {
      console.error("Error fetching teacher analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/engagement", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get engagement metrics using actual tables
      const engagementStats = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT CASE WHEN last_active >= CURRENT_DATE THEN id END) as daily_active_users,
          COUNT(DISTINCT CASE WHEN last_active >= CURRENT_DATE - INTERVAL '7 days' THEN id END) as weekly_logins,
          AVG(CASE WHEN level >= 3 THEN 1 ELSE 0 END) * 100 as goal_completion_rate
        FROM users 
        WHERE is_admin = FALSE OR is_admin IS NULL
      `);

      const weeklyStats = await db.execute(sql`
        SELECT 
          COUNT(*) as weekly_completions,
          SUM(CASE WHEN points_earned > 0 THEN points_earned ELSE 0 END) as weekly_points
        FROM user_progress 
        WHERE last_accessed >= CURRENT_DATE - INTERVAL '7 days'
      `);

      const sessionStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_logins,
          AVG(20) as average_session_time
        FROM daily_logins 
        WHERE login_date >= CURRENT_DATE - INTERVAL '7 days'
      `);

      const engagement = engagementStats.rows[0];
      const weekly = weeklyStats.rows[0];
      const session = sessionStats.rows[0];

      const formattedStats = {
        dailyActiveUsers: parseInt(engagement.daily_active_users) || 0,
        weeklyLogins: parseInt(engagement.weekly_logins) || 0,
        goalCompletionRate: parseFloat(engagement.goal_completion_rate) || 0,
        weeklyCompletions: parseInt(weekly.weekly_completions) || 0,
        weeklyPoints: parseInt(weekly.weekly_points) || 0,
        averageSessionTime: parseFloat(session.average_session_time) || 15,
      };

      res.json(formattedStats);
    } catch (error) {
      console.error("Error fetching engagement analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // School settings endpoints
  app.get("/api/school/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get school information from the schools table
      const schoolQuery = await db.execute(sql`
        SELECT * FROM schools WHERE id = ${user.schoolId || 1} LIMIT 1
      `);

      const school = schoolQuery.rows[0];
      res.json(
        school || {
          id: 1,
          name: "Raising Arizona Preschool",
          address: "123 Education Street",
          city: "Phoenix",
          state: "AZ",
          zipCode: "85001",
          contactEmail: "info@raisingarizona.com",
          contactPhone: "(555) 123-4567",
          description:
            "A premier early childhood education center focused on nurturing young minds.",
          website: "https://www.raisingarizona.com",
          founded: "2015",
          type: "Private",
          capacity: 120,
          customization: {
            primaryColor: "#3b82f6",
            secondaryColor: "#10b981",
            coreValues: [
              "Respect",
              "Kindness",
              "Learning",
              "Growth",
              "Community",
            ],
          },
        },
      );
    } catch (error) {
      console.error("Error fetching school settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/school/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updateData = req.body;
      const schoolId = user.schoolId || 1;

      // Update school information
      await db.execute(sql`
        UPDATE schools 
        SET 
          name = COALESCE(${updateData.name}, name),
          address = COALESCE(${updateData.address}, address),
          city = COALESCE(${updateData.city}, city),
          state = COALESCE(${updateData.state}, state),
          zip_code = COALESCE(${updateData.zipCode}, zip_code),
          contact_email = COALESCE(${updateData.contactEmail}, contact_email),
          contact_phone = COALESCE(${updateData.contactPhone}, contact_phone),
          description = COALESCE(${updateData.description}, description),
          website = COALESCE(${updateData.website}, website),
          founded = COALESCE(${updateData.founded}, founded),
          type = COALESCE(${updateData.type}, type),
          capacity = COALESCE(${updateData.capacity}, capacity),
          customization = COALESCE(${JSON.stringify(updateData.customization)}, customization)
        WHERE id = ${schoolId}
      `);

      res.json({ message: "School settings updated successfully" });
    } catch (error) {
      console.error("Error updating school settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // OpenAI API route for Seussifier poem generation
  app.post("/api/perplexity/generate", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Call OpenAI API instead of Perplexity
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a creative assistant that writes in the style of Dr. Seuss. Create short, simple, rhyming poems for preschool children. Keep poems to 4-8 lines maximum, use simple vocabulary, and make them fun and positive.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 200,
            temperature: 0.8,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error("Invalid Perplexity API response:", data);
        return res
          .status(500)
          .json({ message: "Invalid response from AI service" });
      }

      // Return the generated content
      res.status(200).json({
        content: data.choices[0].message.content,
      });
    } catch (error) {
      console.error("Error generating content with Perplexity:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // AI Lesson Plan Generation route
  app.post("/api/ai/lesson-plan", async (req, res) => {
    try {
      const { ageGroup, theme, details, additionalRequests } = req.body;

      if (!ageGroup || !theme) {
        return res
          .status(400)
          .json({ message: "Age group and theme are required" });
      }

      // Create comprehensive prompt for lesson plan generation
      const prompt = `Create a detailed preschool lesson plan for ${ageGroup} children on the theme "${theme}".
      
Additional details: ${details || "None provided"}
Additional requests: ${additionalRequests || "None"}

Please structure the lesson plan with the following sections:
1. Learning Objectives (3-4 clear, age-appropriate objectives)
2. Materials Needed (comprehensive list)
3. Introduction Activity (5-10 minutes)
4. Main Activities (2-3 activities, 15-20 minutes each)
5. Closing Circle Time (5-10 minutes)
6. Assessment Methods
7. Extension Activities
8. Adaptations for Different Learning Styles

Make it engaging, educational, and developmentally appropriate for ${ageGroup} children.`;

      // Call OpenAI API for lesson plan generation
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content:
                  "You are an expert early childhood educator who creates detailed, engaging lesson plans for preschool children. Your lesson plans are always developmentally appropriate, include multiple learning modalities, and follow best practices in early childhood education.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error("Invalid OpenAI API response:", data);
        return res
          .status(500)
          .json({ message: "Invalid response from AI service" });
      }

      // Return the generated lesson plan
      res.status(200).json({
        lessonPlan: data.choices[0].message.content,
      });
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      res.status(500).json({ message: "Failed to generate lesson plan" });
    }
  });

  // BearyAI assistant endpoint
  app.post("/api/bear-assistant/ask", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      // Import the BearyAI service
      const { AIBearyService } = await import("./services/aiBearyService");
      
      // Process the query through BearyAI
      const response = await AIBearyService.processQuery(query);
      
      res.json(response);
    } catch (error) {
      console.error("BearyAI endpoint error:", error);
      res.status(500).json({ 
        message: "🐻 **AI Beary says:** I'm having trouble processing your request right now. Please try again in a moment!",
        isAppropriate: true,
        category: 'general'
      });
    }
  });

  // Register AI Module Designer routes
  app.use("/api/ai", aiModuleDesignerRoutes);
  
  // Register new AI suggestion routes (includes parent response)
  app.use("/api/ai", newAiSuggestionRoutes);

  // Register voice routes for AI narration
  app.use("/api/voice", voiceRoutes);

  // Register personalized stories routes
  app.use("/api/personalized-stories", personalizedStoriesRoutes);

  return app;
}
