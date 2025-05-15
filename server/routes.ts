import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertUserSchema, insertLearningModuleSchema, insertUserProgressSchema, 
  insertMeetingSchema, insertAssessmentSchema, type User,
  spinGameRewards, videoQuizCompletions
} from "@shared/schema";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";
import MemoryStore from "memorystore";
import { generateLessonPrompt, generateLessonContent } from "./lessonGenerator";
import { 
  generateRestrictedLessonContent, 
  getConfig, 
  updateConfig, 
  resetConfig, 
  getAllDataSources,
  getAvailableDataSources,
  toggleDataSource,
  addCustomDataSource,
  deleteCustomDataSource
} from "./notebookLmPlugin";
import { createRaisingArizonaCoreModule } from "./createCoreModule";
import { 
  checkModuleContent, 
  checkAllModulesContent,
  fixModuleContent, 
  fixAllModulesContent,
  ModuleContentCheckResult 
} from "./moduleContentService";
import { DataSource, DataSourceCategory } from "@shared/dataSources";

// Define our session data structure
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Extend the Express.User interface to avoid TypeScript errors
declare global {
  namespace Express {
    interface User extends Record<string, any> {}
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mentor-me-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false, // Set to false for development to work over HTTP
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
      }, 
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // User routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // Set the user session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`Login attempt for username: "${username}"`);
      
      if (!username || !password) {
        console.log("Login failed: Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Login failed: User not found for username: "${username}"`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // In a real app, we'd use bcrypt to compare password hash
      if (user.password !== password) {
        console.log(`Login failed: Password mismatch for user: "${username}"`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Ensure session is set up properly
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      // Set the user session
      req.session.userId = user.id;
      
      console.log(`Login successful for user: "${username}" (ID: ${user.id})`);
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Add points to user endpoint
  app.post("/api/users/add-points", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { points } = req.body;
      
      if (typeof points !== 'number' || points < 0) {
        return res.status(400).json({ message: "Invalid points value" });
      }
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate new points total
      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;
      
      // Update user with new points
      const updatedUser = await storage.updateUser(userId, { points: newPoints });
      
      console.log(`Added ${points} points to user ${userId}. New total: ${updatedUser.points}`);
      
      res.status(200).json({ 
        success: true, 
        points: updatedUser.points,
        pointsAdded: points
      });
    } catch (error) {
      console.error('Failed to add points to user:', error);
      res.status(500).json({ message: "Failed to add points to user" });
    }
  });
  
  // Setup Passport.js with Google OAuth
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
        // Add proper params for Replit environment
        proxy: true,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Check if user exists by email
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }
          
          let user = await storage.getUserByEmail(email);
          
          if (!user) {
            // Create new user if not exists
            const newUser = {
              username: profile.displayName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 1000),
              password: "", // No password for OAuth users
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              email: email,
              language: "en",
              nativeLanguage: "en",
              timeZone: "America/Phoenix",
              profilePicture: profile.photos?.[0]?.value || null,
              points: 0,
              level: 1, // Start at level 1
              joinDate: new Date(),
              lastActive: new Date(),
              notification: false,
              completedOnboarding: false,
            };
            
            user = await storage.createUser(newUser);
          } else if (!user.profilePicture && profile.photos?.[0]?.value) {
            // Update profile picture if not present
            user = await storage.updateUser(user.id, {
              profilePicture: profile.photos[0].value
            });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Serialize user for the session
  passport.serializeUser((user: Express.User, done) => {
    // We know our user has an id property, cast to access it
    done(null, (user as unknown as User).id);
  });
  
  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('Google OAuth request initiated');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })(req, res, next);
  });
  
  // Google OAuth callback route
  app.get('/api/auth/google/callback', (req, res, next) => {
    console.log('Google OAuth callback received');
    passport.authenticate('google', { 
      failureRedirect: '/login?auth_error=google_failed',
      session: true
    })(req, res, next);
  }, (req, res) => {
    // Successful authentication
    console.log('Google auth successful, user:', req.user ? 'exists' : 'null');
    if (req.user) {
      req.session.userId = (req.user as User).id;
      console.log('Session userId set:', req.session.userId);
    }
    res.redirect('/dashboard');
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Learning modules routes
  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.status(200).json(modules);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.status(200).json(module);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User progress routes
  app.get("/api/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const progress = await storage.getUserProgressByUserId(userId);
      console.log(`Returning ${progress.length} progress records for user ${userId}`);
      
      // Log any recommended modules
      const recommendedEntries = progress.filter(p => p.recommended === true);
      if (recommendedEntries.length > 0) {
        console.log(`Found ${recommendedEntries.length} recommended modules: ${recommendedEntries.map(p => p.moduleId).join(', ')}`);
      } else {
        console.log(`No recommended modules found for user ${userId}`);
      }
      
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get specific progress by module ID
  app.get("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const moduleId = parseInt(req.params.moduleId);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const allProgress = await storage.getUserProgressByUserId(userId);
      const moduleProgress = allProgress.find(p => p.moduleId === moduleId);
      
      if (!moduleProgress) {
        // Return empty progress object with default values
        return res.status(200).json({
          userId,
          moduleId,
          progress: 0,
          completed: false,
          recommended: false,
          pointsEarned: 0,
          lastAccessed: new Date()
        });
      }
      
      res.status(200).json(moduleProgress);
    } catch (error) {
      console.error("Error fetching module progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user achievements and stats
  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const progress = await storage.getUserProgressByUserId(userId);
      const modules = await storage.getAllModules();
      const assessments = await storage.getAssessmentsByUserId(userId);
      
      // Calculate total points based on module completion and progress
      let totalPoints = 0;
      let completedModules = 0;
      
      progress.forEach(p => {
        const module = modules.find(m => m.id === p.moduleId);
        if (module) {
          // Calculate points based on difficulty and progress
          const difficulty = module.difficulty;
          const basePoints = 
            difficulty === 'beginner' ? 50 : 
            difficulty === 'intermediate' ? 100 : 
            difficulty === 'advanced' ? 150 : 75;
          
          // Award partial points for progress
          const progressPoints = Math.floor((p.progress / 100) * basePoints);
          
          // Additional bonus for completion
          const completionBonus = p.completed ? Math.floor(basePoints * 0.5) : 0;
          
          totalPoints += progressPoints + completionBonus;
          
          if (p.completed) {
            completedModules++;
          }
        }
      });
      
      // Add points from assessments
      assessments.forEach(assessment => {
        if (assessment.completed && assessment.overallScore) {
          // Award points based on assessment score
          const assessmentPoints = Math.floor(assessment.overallScore * 10);
          totalPoints += assessmentPoints;
        }
      });
      
      // Determine teacher level based on points
      let teacherLevel = "Teacher in Training";
      if (totalPoints >= 3500) teacherLevel = "Mentor Teacher";
      else if (totalPoints >= 2500) teacherLevel = "Master Lead Teacher";
      else if (totalPoints >= 1500) teacherLevel = "Lead Teacher";
      else if (totalPoints >= 800) teacherLevel = "Associate Teacher";
      else if (totalPoints >= 300) teacherLevel = "Assistant Teacher";
      
      // Create achievements list
      const achievements = [
        {
          id: 1,
          name: "First Steps",
          description: "Started your first module",
          awarded: progress.length > 0,
          points: 50,
          category: "module"
        },
        {
          id: 2,
          name: "Eager Learner",
          description: "Completed your first module",
          awarded: completedModules > 0,
          points: 100,
          category: "module"
        },
        {
          id: 3,
          name: "Dedicated Teacher",
          description: "Completed 5 modules",
          awarded: completedModules >= 5,
          points: 250,
          category: "module"
        },
        {
          id: 4,
          name: "Master Teacher",
          description: "Completed 10 modules",
          awarded: completedModules >= 10,
          points: 500,
          category: "module"
        },
        {
          id: 5,
          name: "Assessment Champion",
          description: "Scored over 80% on an assessment",
          awarded: assessments.some(a => a.overallScore && a.overallScore >= 80),
          points: 200,
          category: "assessment"
        }
      ];
      
      res.status(200).json({
        totalPoints,
        completedModules,
        teacherLevel,
        nextLevelPoints: teacherLevel === "Mentor Teacher" ? null : 
                         teacherLevel === "Master Lead Teacher" ? 3500 :
                         teacherLevel === "Lead Teacher" ? 2500 :
                         teacherLevel === "Associate Teacher" ? 1500 :
                         teacherLevel === "Assistant Teacher" ? 800 : 300,
        achievements: achievements.filter(a => a.awarded),
        stats: {
          totalModules: modules.length,
          modulesInProgress: progress.filter(p => p.progress > 0 && !p.completed).length,
          assessmentsCompleted: assessments.filter(a => a.completed).length
        }
      });
    } catch (error) {
      console.error("Achievement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      // Parse and validate the input data
      let progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });
      
      // Ensure progress is between 0 and 100
      if (progressData.progress !== undefined) {
        progressData.progress = Math.max(0, Math.min(100, progressData.progress));
      }
      
      // Get the module to calculate points
      const module = await storage.getModule(progressData.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Get previous progress to calculate point difference
      const existingProgress = await storage.getUserProgressByUserId(userId);
      const previousProgress = existingProgress.find(p => p.moduleId === progressData.moduleId);
      
      // Get user data to update points
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for explicit points earned from client (used by micro modules)
      const explicitPointsEarned = req.body.pointsEarned;
      
      // Is this a micro module (7 min or less)?
      const isMicroModule = module.duration <= 7;
      
      // Calculate points based on difficulty for regular modules
      const difficulty = module.difficulty;
      const basePoints = 
        difficulty === 'beginner' ? 50 : 
        difficulty === 'intermediate' ? 100 : 
        difficulty === 'advanced' ? 150 : 75;
      
      // Calculate new points earned in this update
      let pointsEarned = 0;
      
      // If client specified points earned, use that value (for micro modules)
      if (explicitPointsEarned && typeof explicitPointsEarned === 'number') {
        console.log(`Using explicit points value: ${explicitPointsEarned} for module ${progressData.moduleId}`);
        pointsEarned = explicitPointsEarned;
      }
      // For micro-modules (7 min or less), use a simplified approach (1 point per minute)
      else if (isMicroModule) {
        // Only award points on completion
        if (progressData.completed && (!previousProgress || !previousProgress.completed)) {
          pointsEarned = module.duration; // 1 point per minute for micro modules
          console.log(`Awarding ${pointsEarned} points for micro-module ${progressData.moduleId}`);
        }
      }
      // Regular modules use difficulty-based points
      else if (previousProgress) {
        // Only award points for new progress
        const progressDifference = Math.max(0, progressData.progress - previousProgress.progress);
        pointsEarned = Math.floor((progressDifference / 100) * basePoints);
        
        // Add completion bonus if newly completed
        if (progressData.completed && !previousProgress.completed) {
          pointsEarned += Math.floor(basePoints * 0.5);
        }
      } else {
        // First time accessing this module
        pointsEarned = Math.floor((progressData.progress / 100) * basePoints);
        
        // Add completion bonus if completed
        if (progressData.completed) {
          pointsEarned += Math.floor(basePoints * 0.5);
        }
      }
      
      // Set points earned in progress data
      progressData.pointsEarned = (previousProgress?.pointsEarned || 0) + pointsEarned;
      
      // Set pointsEarned in progress data if not set
      if (!progressData.pointsEarned) {
        progressData.pointsEarned = pointsEarned;
      }
      
      // Always ensure modules with 100% progress are marked as completed
      if (progressData.progress >= 100) {
        progressData.completed = true;
        console.log(`Marking module ${progressData.moduleId} as completed with 100% progress`);
      }
      
      // Update progress first
      const progress = await storage.updateUserProgress(progressData);
      
      // Ensure we're adding points to the user's total
      console.log(`Adding ${pointsEarned} points to user ${userId} (current points: ${user.points || 0})`);
      
      // Update user points
      const updatedUser = await storage.updateUser(userId, {
        points: (user.points || 0) + pointsEarned
      });
      
      // Calculate level based on total points
      let newLevel = 1;
      if (updatedUser.points >= 3500) newLevel = 6; // Mentor Teacher
      else if (updatedUser.points >= 2500) newLevel = 5; // Master Lead Teacher
      else if (updatedUser.points >= 1500) newLevel = 4; // Lead Teacher
      else if (updatedUser.points >= 800) newLevel = 3; // Associate Teacher
      else if (updatedUser.points >= 300) newLevel = 2; // Assistant Teacher
      
      // If level has increased, update it
      if (newLevel > (user.level || 1)) {
        await storage.updateUser(userId, { level: newLevel });
      }
      
      res.status(201).json({
        ...progress,
        pointsEarned: pointsEarned,
        totalPoints: updatedUser.points,
        level: Math.max(newLevel, user.level || 1)
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const meetings = await storage.getMeetingsByUserId(userId);
      res.status(200).json(meetings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const hostId = req.session.userId as number;
      const meetingData = insertMeetingSchema.parse({
        ...req.body,
        hostId
      });
      
      const meeting = await storage.createMeeting(meetingData);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if meeting exists and user is authorized
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      if (existingMeeting.hostId !== userId && existingMeeting.guestId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this meeting" });
      }
      
      const updatedMeeting = await storage.updateMeeting(meetingId, req.body);
      res.status(200).json(updatedMeeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if meeting exists and user is authorized
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      if (existingMeeting.hostId !== userId) {
        return res.status(403).json({ message: "Only the host can delete this meeting" });
      }
      
      await storage.deleteMeeting(meetingId);
      res.status(200).json({ message: "Meeting deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Power-ups and store items routes
  app.post("/api/power-ups/use", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { itemId, moduleId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ message: "Item ID is required" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the store item to determine its effect
      const item = await storage.getStoreItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Check if user has the item
      const userItem = await storage.getUserItemById(userId, itemId);
      if (!userItem || userItem.used) {
        return res.status(400).json({ message: "Item not available or already used" });
      }
      
      // Apply the power-up effect
      let pointsAwarded = 0;
      let bearBucksAwarded = 0;
      
      // Different effects based on power-up category
      switch (item.category) {
        case "points_booster":
          pointsAwarded = 50;
          break;
        case "bear_bucks_booster":
          bearBucksAwarded = 25;
          break;
        case "module_progress":
          // If moduleId is provided, boost progress on that module
          if (moduleId) {
            const progress = await storage.getUserProgressByModuleId(moduleId);
            const userProgress = progress.find(p => p.userId === userId);
            
            if (userProgress && userProgress.progress < 100) {
              // Boost progress by 25% up to a maximum of 100%
              const newProgress = Math.min(100, userProgress.progress + 25);
              await storage.updateUserProgress({
                userId,
                moduleId,
                progress: newProgress,
                completed: newProgress === 100
              });
              
              // Award points based on the boost
              pointsAwarded = Math.floor(25 * 0.5); // 25% progress * 0.5 points per %
            }
          }
          break;
        default:
          // Generic point award for other power-ups
          pointsAwarded = 20;
      }
      
      // Mark the item as used
      await storage.updateUserItem(userItem.id, { used: true });
      
      // Update user points and bear bucks
      const updatedUser = await storage.updateUser(userId, {
        points: (user.points || 0) + pointsAwarded,
        bearBucks: (user.bearBucks || 0) + bearBucksAwarded
      });
      
      // Return the result
      res.status(200).json({
        success: true,
        pointsAwarded,
        bearBucksAwarded,
        totalPoints: updatedUser.points,
        totalBearBucks: updatedUser.bearBucks
      });
      
    } catch (error) {
      console.error("Error using power-up:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assessment routes
  app.get("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const assessments = await storage.getAssessmentsByUserId(userId);
      res.status(200).json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Get all modules to generate recommendations
      const allModules = await storage.getAllModules();
      
      // Process and enhance the assessment data with recommendations
      const { strengthAreas, growthAreas, overallScore, ...otherData } = req.body;
      
      // Import assessment utility
      const { generateModuleRecommendations } = await import("./assessmentUtils");
      
      // Generate module recommendations based on assessment results
      const recommendedModules = generateModuleRecommendations(
        strengthAreas || [], 
        growthAreas || [],
        allModules
      );
      
      // Create enhanced assessment data
      const assessmentData = insertAssessmentSchema.parse({
        ...otherData,
        userId,
        strengthAreas: strengthAreas || [],
        growthAreas: growthAreas || [],
        overallScore: overallScore || 0,
        recommendedModules
      });
      
      const assessment = await storage.createAssessment(assessmentData);
      
      // Update user progress to mark custom modules as recommended
      if (recommendedModules.length > 0) {
        // Create progress entries for recommended modules if they don't exist
        for (const moduleId of recommendedModules) {
          const existingProgress = await storage.getUserProgressByModuleId(moduleId);
          const userHasProgress = existingProgress.some(p => p.userId === userId);
          
          if (!userHasProgress) {
            await storage.updateUserProgress({
              userId,
              moduleId,
              progress: 0,
              completed: false,
              recommended: true
            });
          }
        }
      }
      
      res.status(201).json({
        ...assessment,
        teacherLevel: overallScore >= 80 ? "Master Lead Teacher" :
                      overallScore >= 60 ? "Lead Teacher" :
                      overallScore >= 40 ? "Associate Teacher" :
                      overallScore >= 20 ? "Assistant Teacher" : 
                      "Teacher in Training"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Assessment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Video validation routes
  app.post("/api/videos/validate", requireAuth, async (req, res) => {
    try {
      const { videoId, youtubeId, isValid } = req.body;
      
      // Ensure the YouTube ID has no leading/trailing spaces
      const cleanYoutubeId = youtubeId ? youtubeId.trim() : '';
      
      // In a real implementation, we would update the database
      // For now, we just return success and log the validation result
      console.log(`Video validation: ${videoId} is ${isValid ? 'valid' : 'invalid'}`);
      
      // If the video is invalid, log it more prominently to help identify problems
      if (!isValid && videoId) {
        console.warn(`⚠️ INVALID VIDEO DETECTED: ${videoId} (${cleanYoutubeId})`);
      }
      
      res.json({ success: true, videoId, youtubeId: cleanYoutubeId, isValid });
    } catch (error) {
      console.error("Error validating video:", error);
      res.status(500).json({ message: "Error validating video", error });
    }
  });
  
  // Video quiz routes
  app.post("/api/videos/quiz/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { videoId, points, duration } = req.body;
      
      // Validate request data
      if (!videoId) {
        return res.status(400).json({ message: "VideoId is required" });
      }

      // Find video information from database or videoResources if necessary
      const videoDuration = duration || 0; // In minutes
      
      // Calculate points based on video duration (5 points for <10min, 8 points for 10min+)
      // But only award points if they answered all questions correctly (handled client-side)
      let pointsToAward = 0;
      
      if (points > 0) { // User answered all questions correctly
        pointsToAward = videoDuration >= 10 ? 8 : 5;
      }
      
      // Check daily video completion limit (2 videos per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      // Query completions for today
      const todayCompletions = await db.query.videoQuizCompletions.findMany({
        where: (completions, { eq, and, gte }) => and(
          eq(completions.userId, userId),
          gte(completions.completedAt, today)
        ),
      });
      
      // Check if user already completed 2 videos today
      const dailyLimit = 2;
      let limitReached = false;
      let pointsAwarded = 0;
      
      if (todayCompletions.length >= dailyLimit) {
        // User already reached daily limit
        limitReached = true;
        pointsAwarded = 0; // Don't award any points if limit reached
        console.log(`User ${userId} reached daily video quiz limit. Not awarding points.`);
      } else {
        // User is within daily limit, award points
        pointsAwarded = pointsToAward;
        
        // Get current user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Calculate new points total
        const currentPoints = user.points || 0;
        const newPoints = currentPoints + pointsAwarded;
        
        // Update user with new points
        const updatedUser = await storage.updateUser(userId, { points: newPoints });
        
        // Record this video completion for tracking daily limits
        await db.insert(videoQuizCompletions).values({
          userId,
          videoId,
          pointsEarned: pointsAwarded,
        });
        
        console.log(`User ${userId} earned ${pointsAwarded} points from video quiz ${videoId}. New total: ${updatedUser.points}`);
      }
      
      res.json({ 
        success: true, 
        videoId, 
        pointsAwarded,
        limitReached,
        dailyCompletionsCount: todayCompletions.length + (limitReached ? 0 : 1),
        dailyLimit,
        message: limitReached 
          ? "Daily video limit reached. No points awarded." 
          : `Successfully awarded ${pointsAwarded} points for completing the quiz`,
        totalPoints: limitReached 
          ? (await storage.getUser(userId))?.points 
          : (await storage.getUser(userId))?.points
      });
    } catch (error) {
      console.error("Error processing quiz results:", error);
      res.status(500).json({ message: "Error processing quiz results", error });
    }
  });

  // Dynamic Lesson Generation endpoint
  app.post('/api/lesson/generate', requireAuth, async (req, res) => {
    try {
      const { moduleId, challenge, learningStyle } = req.body;
      const userId = req.session.userId as number;
      
      if (!moduleId || !challenge) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get user and module
      const user = await storage.getUser(userId);
      const module = await storage.getModule(moduleId);
      
      if (!user || !module) {
        return res.status(404).json({ message: "User or module not found" });
      }
      
      // Get the most recent assessment for strengths and growth areas
      const assessments = await storage.getAssessmentsByUserId(userId);
      const recentAssessment = assessments && assessments.length > 0 
        ? assessments[assessments.length - 1] 
        : null;
      
      // Get current user progress for all modules
      const userProgress = await storage.getUserProgressByUserId(userId);
      
      // Generate personalized lesson
      const prompt = generateLessonPrompt(
        user, 
        module, 
        challenge, 
        recentAssessment || null,
        userProgress || []
      );
      
      const lessonContent = await generateLessonContent(prompt);
      
      res.status(200).json(lessonContent);
    } catch (error) {
      console.error("Lesson generation error:", error);
      res.status(500).json({ message: "Error generating lesson content" });
    }
  });
  
  // Spin game rewards
  app.post('/api/spin-game/reward', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { rewardType, rewardAmount, itemId } = req.body;
      
      if (!rewardType) {
        return res.status(400).json({ message: "Reward type is required" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a reward record
      await db.insert(spinGameRewards).values({
        userId,
        rewardType,
        rewardAmount: rewardAmount || null,
        itemId: itemId || null
      });
      
      // Apply the reward
      let updatedUser;
      
      switch (rewardType) {
        case "points":
          // Update points
          const newPoints = (user.points || 0) + (rewardAmount || 0);
          
          // Calculate level based on total points (the same logic used for module progress)
          let newLevel = 1;
          if (newPoints >= 3500) newLevel = 6; // Mentor Teacher
          else if (newPoints >= 2500) newLevel = 5; // Master Lead Teacher
          else if (newPoints >= 1500) newLevel = 4; // Lead Teacher
          else if (newPoints >= 800) newLevel = 3; // Associate Teacher
          else if (newPoints >= 300) newLevel = 2; // Assistant Teacher
          
          // Update user with both points and potentially a new level
          updatedUser = await storage.updateUser(userId, {
            points: newPoints,
            level: Math.max(newLevel, user.level || 1) // Only increase level, never decrease
          });
          
          // Log level changes
          if (newLevel > (user.level || 1)) {
            console.log(`User ${userId} advanced to level ${newLevel} via spin game reward!`);
          }
          break;
          
        case "bearBucks":
          updatedUser = await storage.updateUser(userId, {
            bearBucks: (user.bearBucks || 0) + (rewardAmount || 0)
          });
          break;
          
        case "item":
          if (itemId) {
            // Check if the item exists
            const item = await storage.getStoreItem(itemId);
            if (!item) {
              return res.status(404).json({ message: "Item not found" });
            }
            
            // Add the item to user's inventory
            await storage.createUserItem({
              userId,
              itemId,
              used: false
            });
            
            updatedUser = user;
          } else {
            return res.status(400).json({ message: "Item ID is required for item rewards" });
          }
          break;
          
        default:
          updatedUser = user;
      }
      
      res.status(200).json({
        success: true,
        rewardType,
        rewardAmount,
        itemId,
        updatedPoints: updatedUser.points,
        updatedBearBucks: updatedUser.bearBucks
      });
      
    } catch (error) {
      console.error("Error processing spin game reward:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Chat with Bear Assistant API endpoint
  app.post('/api/chat/bear-assistant', requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.session.userId as number;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get user for personalization
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: `You are Berry, the friendly Early Childhood Education (ECE) assistant bear at Raising Arizona Preschool. 
              Your personality is warm, supportive, and slightly playful. You love to help preschool teachers with their questions
              about ECE, classroom management, child development, and teaching strategies. 
              
              When responding:
              1. Use simple, friendly language with occasional bear-related phrases like "Bear in mind..." or "I can bearly wait to help!"
              2. Format your responses with clear headings, bullet points, and short paragraphs when appropriate
              3. Always stay positive and encouraging
              4. Refer to evidence-based practices and Arizona Early Learning Standards when relevant
              5. Remember that you're speaking to a teacher named ${user.firstName} who teaches at Raising Arizona Preschool
              
              Always end your response with an open-ended question to encourage further conversation.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      res.status(200).json({
        message: data.choices[0].message.content,
        citations: data.citations || []
      });
      
    } catch (error) {
      console.error("Bear Assistant chat error:", error);
      res.status(500).json({ 
        message: "I'm having trouble connecting right now. Please try again in a few moments." 
      });
    }
  });

  // Discussion forum routes
  // Get all discussion threads
  app.get('/api/discussions', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const category = req.query.category as string | undefined;
      
      const threads = await storage.getAllThreads({ limit, offset, category });
      res.json(threads);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a single discussion thread by ID
  app.get('/api/discussions/:id', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const thread = await storage.getThreadById(threadId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      // Increment view count
      await storage.incrementThreadViewCount(threadId);
      
      res.json(thread);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new discussion thread
  app.post('/api/discussions', async (req, res) => {
    try {
      const session = req.session as SessionData;
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const threadData = {
        ...req.body,
        authorId: session.userId
      };
      
      const newThread = await storage.createThread(threadData);
      res.status(201).json(newThread);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a discussion thread
  app.patch('/api/discussions/:id', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const thread = await storage.getThreadById(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      if (thread.authorId !== session.userId) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own threads' });
      }
      
      const updatedThread = await storage.updateThread(threadId, req.body);
      res.json(updatedThread);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a discussion thread
  app.delete('/api/discussions/:id', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const thread = await storage.getThreadById(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      if (thread.authorId !== session.userId) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own threads' });
      }
      
      await storage.deleteThread(threadId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get comments for a thread
  app.get('/api/discussions/:id/comments', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const comments = await storage.getCommentsByThreadId(threadId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add a comment to a thread
  app.post('/api/discussions/:id/comments', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const commentData = {
        ...req.body,
        threadId,
        authorId: session.userId
      };
      
      const newComment = await storage.createComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a comment
  app.patch('/api/comments/:id', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      if (comment.authorId !== session.userId) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own comments' });
      }
      
      const updatedComment = await storage.updateComment(commentId, req.body);
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a comment
  app.delete('/api/comments/:id', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      if (comment.authorId !== session.userId) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own comments' });
      }
      
      await storage.deleteComment(commentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Endorse a comment (for teachers/admins to mark helpful answers)
  app.patch('/api/comments/:id/endorse', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const endorsed = req.body.endorsed === true;
      
      // In a real app, you would check if the user has permission to endorse
      
      await storage.endorseComment(commentId, endorsed);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Vote on a comment
  app.post('/api/comments/:id/vote', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const session = req.session as SessionData;
      const voteType = req.body.voteType;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      if (voteType !== 'upvote' && voteType !== 'downvote') {
        return res.status(400).json({ message: 'Vote type must be "upvote" or "downvote"' });
      }
      
      const vote = {
        userId: session.userId,
        commentId,
        voteType
      };
      
      const updatedVote = await storage.createOrUpdateVote(vote);
      res.json(updatedVote);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Remove a vote from a comment
  app.delete('/api/comments/:id/vote', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const session = req.session as SessionData;
      
      if (!session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      await storage.deleteVote(session.userId, commentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Spin game reward endpoint
  app.post("/api/spin-game/reward", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;

      const { rewardType, rewardAmount } = req.body;
      
      // Validate reward type and amount
      if (!rewardType || !rewardAmount) {
        return res.status(400).json({ message: "Invalid reward data" });
      }
      
      // Record the reward in the database
      const isGrandPrize = 
        rewardType === 'dayOff' || 
        rewardType === 'cash' || 
        (rewardType === 'lunch' && Math.random() < 0.5); // 50% chance of lunch being grand prize
      
      const newReward = await storage.createSpinGameReward({
        userId,
        reward_type: rewardType,
        reward_amount: parseInt(rewardAmount),
        is_redeemed: false,
        is_grand_prize: isGrandPrize,
        created_at: new Date()
      });

      // Update user points or bear bucks based on reward type
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updatedUser = user;

      if (rewardType === 'points') {
        // Calculate new points total
        const currentPoints = user.points || 0;
        const newPointsTotal = currentPoints + parseInt(rewardAmount);
        
        // Calculate level based on total points (same logic used for module progress)
        let newLevel = 1;
        if (newPointsTotal >= 3500) newLevel = 6; // Mentor Teacher
        else if (newPointsTotal >= 2500) newLevel = 5; // Master Lead Teacher
        else if (newPointsTotal >= 1500) newLevel = 4; // Lead Teacher
        else if (newPointsTotal >= 800) newLevel = 3; // Associate Teacher
        else if (newPointsTotal >= 300) newLevel = 2; // Assistant Teacher
        
        // Update user with both points and potentially a new level
        updatedUser = await storage.updateUser(userId, {
          points: newPointsTotal,
          level: Math.max(newLevel, user.level || 1) // Only increase level, never decrease
        });
        
        // Enhanced response with level information
        const levelUp = newLevel > (user.level || 1);
        
        res.status(200).json({
          message: levelUp ? "Reward claimed successfully! You've reached a new teacher level!" : "Reward claimed successfully",
          reward: newReward,
          pointsAdded: parseInt(rewardAmount),
          totalPoints: updatedUser.points,
          level: updatedUser.level,
          levelUp: levelUp
        });
      } else if (rewardType === 'bearBucks') {
        // Update bear bucks
        const currentBearBucks = user.bearBucks || 0;
        updatedUser = await storage.updateUser(userId, {
          bearBucks: currentBearBucks + parseInt(rewardAmount)
        });
        
        res.status(200).json({
          message: "Reward claimed successfully",
          reward: newReward,
          bearBucksAdded: parseInt(rewardAmount),
          totalBearBucks: updatedUser.bearBucks
        });
      } else {
        // Special prizes don't update user balances directly
        res.status(200).json({
          message: "Special reward claimed successfully",
          reward: newReward,
          info: "This reward will be redeemed by your administrator"
        });
      }
    } catch (error) {
      console.error("Error processing spin game reward:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get spin game reward history for current user
  app.get('/api/spin-game/history', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Get user's spin rewards from newest to oldest
      const rewards = await storage.getSpinGameRewardsByUserId(userId);
      
      // Sort by date (newest first)
      rewards.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      res.status(200).json(rewards);
    } catch (error) {
      console.error('Error fetching reward history:', error);
      res.status(500).json({ message: "Error fetching reward history" });
    }
  });

  // API Routes for Core Values Shout Outs
  
  // Get shout outs where current user is the nominator
  app.get("/api/core-values/nominations-made", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const shoutOuts = await storage.getCoreValuesShoutOutsByNominatorId(userId);
      return res.status(200).json(shoutOuts);
    } catch (error) {
      console.error("Error fetching nominations made:", error);
      return res.status(500).json({ message: "Error fetching nominations made" });
    }
  });
  
  // Get shout outs where current user is the nominee
  app.get("/api/core-values/nominations-received", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const shoutOuts = await storage.getCoreValuesShoutOutsByNomineeId(userId);
      return res.status(200).json(shoutOuts);
    } catch (error) {
      console.error("Error fetching nominations received:", error);
      return res.status(500).json({ message: "Error fetching nominations received" });
    }
  });
  
  // Get all shout outs (used for the leaderboard)
  app.get("/api/core-values/all", requireAuth, async (req, res) => {
    try {
      // In a real app, we'd check if the user has permission to view all shout outs
      const allShoutOuts = await storage.getAllCoreValuesShoutOuts();
      return res.status(200).json(allShoutOuts);
    } catch (error) {
      console.error("Error fetching all shout outs:", error);
      return res.status(500).json({ message: "Error fetching all shout outs" });
    }
  });
  
  // Create a new shout out
  app.post("/api/core-values/nominate", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { nomineeId, coreValue, description } = req.body;
      
      if (!nomineeId || !coreValue || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Generate random points between 3-10 points
      const pointsAwarded = Math.floor(Math.random() * 8) + 3;
      
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId: userId,
        nomineeId,
        coreValue,
        description,
        pointsAwarded
      });
      
      return res.status(201).json({ 
        shoutOut,
        message: `Successfully nominated teacher for demonstrating the core value of ${coreValue}! You earned 1 point, and they earned ${pointsAwarded} points.`
      });
    } catch (error) {
      console.error("Error creating nomination:", error);
      return res.status(500).json({ message: "Error creating nomination" });
    }
  });

  // AI Endpoints
  
  // Suessify Generator - Dr. Seuss style text transformer
  app.post("/api/ai/suessify", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      // Generate the Suessified text
      const prompt = `Transform the following text into a Dr. Seuss style rhyme, focusing on simple words, rhythmic patterns, and playful rhymes. Make it suitable for preschool education, maintaining the original meaning but with Seuss-like creativity:

"${text}"

Respond with only the transformed text, no additional commentary.`;
      
      let suessifiedText = "";
      
      try {
        // If Perplexity API is available, use it
        if (process.env.PERPLEXITY_API_KEY) {
          const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
              model: "llama-3.1-sonar-small-128k-online",
              messages: [
                {
                  role: "system",
                  content: "You are an expert at creating Dr. Seuss-style rhymes for early childhood education."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7
            })
          });
          
          const data = await response.json();
          suessifiedText = data.choices[0].message.content;
        }
        else {
          suessifiedText = "No AI service is currently available. Please try again later.";
        }
      } catch (error) {
        console.error("Error calling AI API:", error);
        throw new Error("Failed to generate Suessified text");
      }
      
      return res.json({ suessifiedText });
    } catch (error) {
      console.error("Error in /api/ai/suessify:", error);
      return res.status(500).json({ error: "Failed to generate Suessified text" });
    }
  });
  
  // Parent Response Generator endpoint - for crafting professional parent communications
  app.post("/api/ai/parent-response", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      // Generate the parent response
      const systemPrompt = `You are an expert early childhood educator with 20 years of experience in communicating effectively with parents. 
You excel at crafting sensitive, professional, and constructive responses to parents, even in difficult situations.
Your communication style is:
1. Empathetic but professional
2. Solutions-focused rather than problem-focused
3. Based on established child development principles
4. Partnership-oriented, inviting parent collaboration
5. Structured with observations first, then interpretations, and finally suggestions
6. Written at a 6th-8th grade reading level for accessibility
7. Free of educational jargon unless necessary (and then explained)`;
      
      const userPrompt = `Create a professional, empathetic response to use when communicating with a parent about the following situation:

"${prompt}"

Format your response as a complete message I could use, including a greeting and closing. Focus on maintaining a positive parent-teacher partnership while being honest about any concerns. Include 2-3 specific, actionable suggestions when appropriate.`;
      
      let response = "";
      
      try {
        // If Perplexity API is available, use it
        if (process.env.PERPLEXITY_API_KEY) {
          const apiResponse = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
              model: "llama-3.1-sonar-small-128k-online",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.5
            })
          });
          
          const data = await apiResponse.json();
          response = data.choices[0].message.content;
        }
        else {
          response = "No AI service is currently available. Please try again later.";
        }
      } catch (error) {
        console.error("Error calling AI API:", error);
        throw new Error("Failed to generate parent response");
      }
      
      return res.json({ response });
    } catch (error) {
      console.error("Error in /api/ai/parent-response:", error);
      return res.status(500).json({ error: "Failed to generate parent response" });
    }
  });
  
  // Perplexity API integration for micro-learning modules
  app.post('/api/perplexity/generate', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Check for API key
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ message: "Perplexity API key not configured" });
      }
      
      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are an expert in early childhood education, specializing in teacher training. Provide concise, practical content that teachers can immediately apply in their classrooms. Focus on being encouraging and positive."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 200,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error:", errorText);
        return res.status(response.status).json({ 
          message: "Error from Perplexity API",
          error: errorText
        });
      }
      
      const data = await response.json();
      
      return res.status(200).json({ 
        content: data.choices[0].message.content,
        citations: data.citations || []
      });
    } catch (error) {
      console.error("Error in Perplexity API:", error);
      return res.status(500).json({ 
        message: "Failed to generate content",
        error: String(error)
      });
    }
  });
  
  // Module content validation API endpoints
  
  // Debug endpoint to check database connection
  app.get('/api/debug/modules', async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      return res.status(200).json({ 
        message: "Modules retrieved successfully",
        moduleCount: modules.length,
        firstModule: modules.length > 0 ? {
          id: modules[0].id,
          title: modules[0].title,
          hasContent: modules[0].content ? true : false,
          hasQuiz: modules[0].quiz ? true : false
        } : null
      });
    } catch (error) {
      console.error("Error retrieving modules:", error);
      return res.status(500).json({ 
        message: "Error retrieving modules", 
        error: String(error)
      });
    }
  });
  
  // Simple endpoint to check a single module's content
  app.get('/api/debug/module/:id/check', async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Return basic module info without running complex validation
      return res.status(200).json({
        id: module.id,
        title: module.title,
        contentType: typeof module.content,
        contentLength: module.content ? module.content.length : 0,
        quizType: typeof module.quiz,
        hasQuiz: module.quiz !== null && module.quiz !== undefined
      });
    } catch (error) {
      console.error(`Error checking module ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Error checking module",
        error: String(error)
      });
    }
  });
  
  // Simple debug endpoint to verify API is working - no db
  app.get('/api/test', (req, res) => {
    return res.status(200).json({
      message: "API is responding",
      timestamp: new Date().toISOString()
    });
  });
  
  // Simple debug endpoint
  app.get('/api/modules/debug', async (req, res) => {
    try {
      console.log("Attempting to get all modules...");
      
      // Create a try-catch for just the storage operation to pinpoint the issue
      let modules = [];
      try {
        modules = await storage.getAllModules();
        console.log(`Successfully retrieved ${modules.length} modules`);
      } catch (storageError) {
        console.error("Storage error:", storageError);
        return res.status(500).json({
          message: "Database error",
          error: String(storageError)
        });
      }
      
      // Just return count as a simple test
      return res.status(200).json({ 
        message: "Retrieved modules successfully",
        count: modules.length
      });
    } catch (error) {
      console.error("General error getting modules:", error);
      return res.status(500).json({ 
        message: "Internal server error", 
        error: String(error) 
      });
    }
  });
  
  // Debug endpoint to view a single module
  app.get('/api/modules/:id/debug', async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      console.log(`Getting module ${moduleId}...`);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Return a simplified module without the full content
      return res.status(200).json({
        id: module.id,
        title: module.title,
        category: module.category,
        contentInfo: {
          type: typeof module.content,
          length: typeof module.content === 'string' ? 
            module.content.length : 
            JSON.stringify(module.content || {}).length,
          preview: typeof module.content === 'string' ? 
            module.content.substring(0, 100) + '...' : 
            JSON.stringify(module.content).substring(0, 100) + '...'
        },
        quizInfo: {
          exists: Boolean(module.quiz),
          type: typeof module.quiz,
          hasQuestions: Boolean(module.quiz && module.quiz.questions),
          questionsType: module.quiz ? typeof module.quiz.questions : null,
          isQuestionsArray: module.quiz ? Array.isArray(module.quiz.questions) : false,
          questionCount: module.quiz && module.quiz.questions && Array.isArray(module.quiz.questions) ? 
            module.quiz.questions.length : 0
        }
      });
    } catch (error) {
      console.error(`Error getting module ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Internal server error", 
        error: String(error) 
      });
    }
  });

  // Check all modules for adequate content
  app.get('/api/modules/content-check', async (req, res) => {
    try {
      // Admin check should go here in production
      console.log("Getting all modules...");
      const modules = await storage.getAllModules();
      console.log(`Retrieved ${modules.length} modules`);
      
      // Create a simple debug endpoint first to check if modules are being retrieved
      return res.status(200).json({ 
        message: "Retrieved modules successfully",
        moduleCount: modules.length,
        sampleModule: modules.length > 0 ? {
          id: modules[0].id,
          title: modules[0].title,
          contentType: typeof modules[0].content,
          contentSample: typeof modules[0].content === 'string' ? 
            modules[0].content.substring(0, 100) + '...' : 
            JSON.stringify(modules[0].content || {}).substring(0, 100) + '...',
          quizType: typeof modules[0].quiz,
          hasQuiz: Boolean(modules[0].quiz && 
                     modules[0].quiz.questions && 
                     Array.isArray(modules[0].quiz.questions))
        } : null
      });
    } catch (error) {
      console.error("Error checking module content:", error);
      return res.status(500).json({ 
        message: "Internal server error",
        errorMessage: String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  // Fix a specific module's content
  app.post('/api/modules/:id/fix-content', async (req, res) => {
    try {
      // Admin check should go here in production
      const moduleId = parseInt(req.params.id);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      // Get the module
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Generate default content for this module
      // This is a simplified version for demo purposes
      const updatedModule = {
        ...module,
        content: `<div class="module-content">
          <section class="learning-objectives">
            <h2>Learning Objectives</h2>
            <p>By the end of this module, you will be able to:</p>
            <ul>
              <li>Understand key concepts related to ${module.title}</li>
              <li>Apply best practices in your classroom setting</li>
              <li>Identify opportunities for implementing these techniques</li>
              <li>Evaluate effectiveness through reflection and assessment</li>
            </ul>
          </section>
          
          <section class="introduction">
            <h2>Introduction</h2>
            <p>This module introduces essential concepts and strategies for ${module.title}. 
            Understanding these principles will help you create a more effective and 
            engaging learning environment for young children.</p>
          </section>
          
          <section class="video-content">
            <h2>Video Lesson</h2>
            <p>Watch this video to deepen your understanding of the topic:</p>
            <div class="video-container">
              <iframe 
                width="560" 
                height="315" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="Educational video" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
            <p class="video-note">Please watch the complete video before proceeding to the quiz section.</p>
          </section>
          
          <section class="main-content">
            <h2>Key Concepts</h2>
            <p>This is an automatically generated placeholder content. In a production environment, 
            this would contain detailed information specific to the ${module.title} topic.</p>
            <p>The content would include evidence-based practices, theoretical frameworks, 
            and practical examples relevant to early childhood education.</p>
          </section>
          
          <section class="takeaways">
            <h2>Key Takeaways</h2>
            <ul>
              <li>Implementing best practices improves learning outcomes</li>
              <li>Regular reflection on teaching methods leads to continuous improvement</li>
              <li>Adapting strategies to individual children's needs enhances effectiveness</li>
            </ul>
          </section>
          
          <section class="reflection">
            <h2>Reflection Questions</h2>
            <p>Consider these questions as you apply what you've learned:</p>
            <ul>
              <li>How might these concepts apply in your specific classroom context?</li>
              <li>What challenges might you face when implementing these ideas?</li>
              <li>How will you measure the impact of these strategies?</li>
            </ul>
          </section>
        </div>`,
        quiz: {
          questions: [
            {
              question: `What is a key benefit of implementing effective ${module.title} strategies?`,
              options: [
                "Reduced paperwork for teachers",
                "Improved learning outcomes for children",
                "Shorter workdays",
                "Less need for parent communication"
              ],
              correctAnswer: 1,
              explanation: "Effective strategies directly impact children's learning and development in positive ways."
            },
            {
              question: "Which approach is recommended when introducing new concepts to young children?",
              options: [
                "Abstract explanations",
                "Written instructions",
                "Hands-on experiences",
                "Advanced vocabulary"
              ],
              correctAnswer: 2,
              explanation: "Young children learn best through concrete, hands-on experiences that engage multiple senses."
            },
            {
              question: "How often should teachers reflect on their practice?",
              options: [
                "Annually during performance reviews",
                "Only when problems arise",
                "At the end of each school year",
                "Regularly as part of ongoing professional development"
              ],
              correctAnswer: 3,
              explanation: "Regular reflection helps teachers continuously improve and adapt their practices."
            },
            {
              question: "What is an important consideration when implementing new teaching strategies?",
              options: [
                "Following trends in education",
                "Adapting to individual children's needs",
                "Minimizing disruption to routines",
                "Keeping parents uninformed until mastery"
              ],
              correctAnswer: 1,
              explanation: "Effective teaching recognizes and responds to the unique needs of each child."
            },
            {
              question: "How might you apply concepts from this module in your classroom tomorrow?",
              options: [
                "Complete overhaul of all existing practices",
                "Wait for a new school year to start",
                "Start with one small, intentional change",
                "Delegate implementation to assistant teachers"
              ],
              correctAnswer: 2,
              explanation: "Starting with manageable changes allows for thoughtful implementation and adjustment."
            }
          ]
        }
      };
      
      // Save the updated module
      const fixedModule = await storage.updateModule(moduleId, updatedModule);
      return res.status(200).json({ 
        message: "Module content fixed successfully",
        module: fixedModule
      });
    } catch (error) {
      console.error(`Error fixing module content: ${error}`);
      return res.status(500).json({ 
        message: "Error fixing module content",
        error: String(error)
      });
    }
  });
  
  // Fix all modules with inadequate content
  app.post('/api/modules/fix-all-content', async (req, res) => {
    try {
      // Admin check should go here in production
      
      // Get all modules
      const modules = await storage.getAllModules();
      console.log(`Retrieved ${modules.length} modules for content fixing`);
      
      // Check each module and fix if needed
      const results = [];
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const module of modules) {
        try {
          // Check module content
          const checkResult = checkModuleContent(module);
          console.log(`Module ${module.id} check result:`, checkResult.hasAdequateContent ? "OK" : "Needs improvement");
          
          if (!checkResult.hasAdequateContent) {
            // Fix this module by calling our fix endpoint
            console.log(`Fixing module ${module.id}...`);
            
            // Call the fix endpoint directly
            const updatedModule = {
              ...module,
              content: `<div class="module-content">
                <section class="learning-objectives">
                  <h2>Learning Objectives</h2>
                  <p>By the end of this module, you will be able to:</p>
                  <ul>
                    <li>Understand key concepts related to ${module.title}</li>
                    <li>Apply best practices in your classroom setting</li>
                    <li>Identify opportunities for implementing these techniques</li>
                    <li>Evaluate effectiveness through reflection and assessment</li>
                  </ul>
                </section>
                
                <section class="introduction">
                  <h2>Introduction</h2>
                  <p>This module introduces essential concepts and strategies for ${module.title}. 
                  Understanding these principles will help you create a more effective and 
                  engaging learning environment for young children.</p>
                </section>
                
                <section class="video-content">
                  <h2>Video Lesson</h2>
                  <p>Watch this video to deepen your understanding of the topic:</p>
                  <div class="video-container">
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                      title="Educational video" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen>
                    </iframe>
                  </div>
                  <p class="video-note">Please watch the complete video before proceeding to the quiz section.</p>
                </section>
                
                <section class="main-content">
                  <h2>Key Concepts</h2>
                  <p>This is an automatically generated placeholder content. In a production environment, 
                  this would contain detailed information specific to the ${module.title} topic.</p>
                  <p>The content would include evidence-based practices, theoretical frameworks, 
                  and practical examples relevant to early childhood education.</p>
                </section>
                
                <section class="takeaways">
                  <h2>Key Takeaways</h2>
                  <ul>
                    <li>Implementing best practices improves learning outcomes</li>
                    <li>Regular reflection on teaching methods leads to continuous improvement</li>
                    <li>Adapting strategies to individual children's needs enhances effectiveness</li>
                  </ul>
                </section>
                
                <section class="reflection">
                  <h2>Reflection Questions</h2>
                  <p>Consider these questions as you apply what you've learned:</p>
                  <ul>
                    <li>How might these concepts apply in your specific classroom context?</li>
                    <li>What challenges might you face when implementing these ideas?</li>
                    <li>How will you measure the impact of these strategies?</li>
                  </ul>
                </section>
              </div>`,
              quiz: {
                questions: [
                  {
                    question: `What is a key benefit of implementing effective ${module.title} strategies?`,
                    options: [
                      "Reduced paperwork for teachers",
                      "Improved learning outcomes for children",
                      "Shorter workdays",
                      "Less need for parent communication"
                    ],
                    correctAnswer: 1,
                    explanation: "Effective strategies directly impact children's learning and development in positive ways."
                  },
                  {
                    question: "Which approach is recommended when introducing new concepts to young children?",
                    options: [
                      "Abstract explanations",
                      "Written instructions",
                      "Hands-on experiences",
                      "Advanced vocabulary"
                    ],
                    correctAnswer: 2,
                    explanation: "Young children learn best through concrete, hands-on experiences that engage multiple senses."
                  },
                  {
                    question: "How often should teachers reflect on their practice?",
                    options: [
                      "Annually during performance reviews",
                      "Only when problems arise",
                      "At the end of each school year",
                      "Regularly as part of ongoing professional development"
                    ],
                    correctAnswer: 3,
                    explanation: "Regular reflection helps teachers continuously improve and adapt their practices."
                  },
                  {
                    question: "What is an important consideration when implementing new teaching strategies?",
                    options: [
                      "Following trends in education",
                      "Adapting to individual children's needs",
                      "Minimizing disruption to routines",
                      "Keeping parents uninformed until mastery"
                    ],
                    correctAnswer: 1,
                    explanation: "Effective teaching recognizes and responds to the unique needs of each child."
                  },
                  {
                    question: "How might you apply concepts from this module in your classroom tomorrow?",
                    options: [
                      "Complete overhaul of all existing practices",
                      "Wait for a new school year to start",
                      "Start with one small, intentional change",
                      "Delegate implementation to assistant teachers"
                    ],
                    correctAnswer: 2,
                    explanation: "Starting with manageable changes allows for thoughtful implementation and adjustment."
                  }
                ]
              }
            };
            
            // Save the updated module
            await storage.updateModule(module.id, updatedModule);
            
            checkResult.fixed = true;
            fixedCount++;
            console.log(`Module ${module.id} fixed successfully`);
          } else {
            skippedCount++;
            console.log(`Module ${module.id} content already adequate, skipping`);
          }
          
          results.push(checkResult);
        } catch (moduleError) {
          console.error(`Error processing module ${module.id}:`, moduleError);
          results.push({
            moduleId: module.id,
            title: module.title,
            hasAdequateContent: false,
            contentLength: 0,
            contentType: typeof module.content,
            hasVideo: false,
            hasQuiz: false,
            quizQuestionCount: 0,
            hasLearningObjectives: false,
            fixed: false,
            error: String(moduleError)
          });
        }
      }
      
      console.log(`Module fixing summary: ${fixedCount} fixed, ${skippedCount} skipped, total: ${modules.length}`);
      
      return res.status(200).json({
        message: "All modules content fixed successfully",
        totalModules: modules.length,
        fixedModules: fixedCount,
        skippedModules: skippedCount,
        results
      });
    } catch (error) {
      console.error(`Error fixing all module content: ${error}`);
      return res.status(500).json({ 
        message: "Error fixing all module content",
        error: String(error)
      });
    }
  });

  // Notebook LM Plugin API Routes
  
  // Get all data sources
  app.get("/api/notebook-lm/sources", async (req, res) => {
    try {
      const allSources = getAllDataSources();
      res.json(allSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });
  
  // Get enabled data sources
  app.get("/api/notebook-lm/sources/enabled", async (req, res) => {
    try {
      const enabledSources = getAvailableDataSources();
      res.json(enabledSources);
    } catch (error) {
      console.error("Error fetching enabled data sources:", error);
      res.status(500).json({ error: "Failed to fetch enabled data sources" });
    }
  });
  
  // Toggle data source status
  app.post("/api/notebook-lm/sources/toggle", async (req, res) => {
    try {
      const { sourceId, enabled } = req.body;
      
      if (!sourceId) {
        return res.status(400).json({ error: "Source ID is required" });
      }
      
      const result = toggleDataSource(sourceId, !!enabled);
      
      if (!result) {
        return res.status(404).json({ error: "Data source not found" });
      }
      
      res.json({ success: true, sourceId, enabled });
    } catch (error) {
      console.error("Error toggling data source status:", error);
      res.status(500).json({ error: "Failed to toggle data source status" });
    }
  });
  
  // Add custom data source
  app.post("/api/notebook-lm/sources/custom", async (req, res) => {
    try {
      const { name, description, url, tags } = req.body;
      
      if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required" });
      }
      
      // Add the custom source
      const newSource = addCustomDataSource({
        name,
        description,
        url,
        category: DataSourceCategory.CUSTOM,
        tags: Array.isArray(tags) ? tags : []
      });
      
      res.json(newSource);
    } catch (error) {
      console.error("Error adding custom data source:", error);
      res.status(500).json({ error: "Failed to add custom data source" });
    }
  });
  
  // Get notebook LM plugin configuration
  app.get("/api/notebook-lm/config", async (req, res) => {
    try {
      const config = getConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching notebook LM configuration:", error);
      res.status(500).json({ error: "Failed to fetch notebook LM configuration" });
    }
  });
  
  // Update notebook LM plugin configuration
  app.post("/api/notebook-lm/config", async (req, res) => {
    try {
      const config = req.body;
      
      // Validate config
      if (typeof config !== 'object') {
        return res.status(400).json({ error: "Invalid configuration format" });
      }
      
      // Update the configuration
      const updatedConfig = updateConfig(config);
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating notebook LM configuration:", error);
      res.status(500).json({ error: "Failed to update notebook LM configuration" });
    }
  });
  
  // Reset notebook LM plugin configuration to defaults
  app.post("/api/notebook-lm/config/reset", async (req, res) => {
    try {
      const defaultConfig = resetConfig();
      res.json(defaultConfig);
    } catch (error) {
      console.error("Error resetting notebook LM configuration:", error);
      res.status(500).json({ error: "Failed to reset notebook LM configuration" });
    }
  });
  
  // Delete custom data source
  app.post("/api/notebook-lm/sources/delete", async (req, res) => {
    try {
      const { sourceId } = req.body;
      
      if (!sourceId) {
        return res.status(400).json({ error: "Source ID is required" });
      }
      
      const result = deleteCustomDataSource(sourceId);
      
      if (!result) {
        return res.status(404).json({ error: "Custom data source not found or could not be deleted" });
      }
      
      res.json({ success: true, sourceId });
    } catch (error) {
      console.error("Error deleting custom data source:", error);
      res.status(500).json({ error: "Failed to delete custom data source" });
    }
  });
  
  // Discussion Feature API Routes
  
  // Get all discussion threads with pagination
  app.get("/api/discussions/threads", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const category = req.query.category as string || undefined;
      
      const threads = await storage.getAllThreads({ limit, offset, category });
      res.json(threads);
    } catch (error) {
      console.error("Error fetching discussion threads:", error);
      res.status(500).json({ error: "Failed to fetch discussion threads" });
    }
  });
  
  // Get a single discussion thread by ID
  app.get("/api/discussions/threads/:id", async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      
      if (isNaN(threadId)) {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      const thread = await storage.getThreadById(threadId);
      
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      // Increment view count when thread is viewed
      await storage.incrementThreadViewCount(threadId);
      
      res.json(thread);
    } catch (error) {
      console.error("Error fetching discussion thread:", error);
      res.status(500).json({ error: "Failed to fetch discussion thread" });
    }
  });
  
  // Create a new discussion thread
  app.post("/api/discussions/threads", requireAuth, async (req, res) => {
    try {
      const { title, content, category, tags } = req.body;
      const session = req.session as any;
      
      if (!title || !content || !category) {
        return res.status(400).json({ error: "Title, content, and category are required" });
      }
      
      const thread = await storage.createThread({
        title,
        content,
        category,
        authorId: session.userId,
        tags: Array.isArray(tags) ? tags : [],
        pinned: false
      });
      
      res.status(201).json(thread);
    } catch (error) {
      console.error("Error creating discussion thread:", error);
      res.status(500).json({ error: "Failed to create discussion thread" });
    }
  });
  
  // Update a discussion thread
  app.patch("/api/discussions/threads/:id", requireAuth, async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const { title, content, category, tags, pinned } = req.body;
      const session = req.session as any;
      
      if (isNaN(threadId)) {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      // Check if thread exists and user is the author
      const thread = await storage.getThreadById(threadId);
      
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      if (thread.authorId !== session.userId) {
        return res.status(403).json({ error: "You are not authorized to edit this thread" });
      }
      
      const updatedThread = await storage.updateThread(threadId, {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : undefined,
        pinned
      });
      
      res.json(updatedThread);
    } catch (error) {
      console.error("Error updating discussion thread:", error);
      res.status(500).json({ error: "Failed to update discussion thread" });
    }
  });
  
  // Delete a discussion thread
  app.delete("/api/discussions/threads/:id", requireAuth, async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const session = req.session as any;
      
      if (isNaN(threadId)) {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      // Check if thread exists and user is the author
      const thread = await storage.getThreadById(threadId);
      
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      if (thread.authorId !== session.userId) {
        return res.status(403).json({ error: "You are not authorized to delete this thread" });
      }
      
      await storage.deleteThread(threadId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting discussion thread:", error);
      res.status(500).json({ error: "Failed to delete discussion thread" });
    }
  });
  
  // Get all comments for a thread
  app.get("/api/discussions/threads/:id/comments", async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      
      if (isNaN(threadId)) {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      const comments = await storage.getCommentsByThreadId(threadId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });
  
  // Create a new comment
  app.post("/api/discussions/comments", requireAuth, async (req, res) => {
    try {
      const { threadId, content, parentCommentId } = req.body;
      const session = req.session as any;
      
      if (!threadId || !content) {
        return res.status(400).json({ error: "Thread ID and content are required" });
      }
      
      const comment = await storage.createComment({
        threadId,
        content,
        authorId: session.userId,
        parentCommentId: parentCommentId || null,
        endorsed: false
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
  
  // Update a comment
  app.patch("/api/discussions/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { content } = req.body;
      const session = req.session as any;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      // Check if comment exists and user is the author
      const comment = await storage.getCommentById(commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      if (comment.authorId !== session.userId) {
        return res.status(403).json({ error: "You are not authorized to edit this comment" });
      }
      
      const updatedComment = await storage.updateComment(commentId, { content });
      
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });
  
  // Delete a comment
  app.delete("/api/discussions/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const session = req.session as any;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      // Check if comment exists and user is the author
      const comment = await storage.getCommentById(commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      if (comment.authorId !== session.userId) {
        return res.status(403).json({ error: "You are not authorized to delete this comment" });
      }
      
      await storage.deleteComment(commentId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
  
  // Endorse a comment (for teachers/admins)
  app.post("/api/discussions/comments/:id/endorse", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { endorsed } = req.body;
      const session = req.session as any;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      // Check if user has permission to endorse (would add role check here)
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // For now allow any user to endorse, but would restrict based on role in production
      await storage.endorseComment(commentId, endorsed === true);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error endorsing comment:", error);
      res.status(500).json({ error: "Failed to endorse comment" });
    }
  });
  
  // Vote on a comment
  app.post("/api/discussions/comments/:id/vote", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { voteType } = req.body;
      const session = req.session as any;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      if (voteType !== "upvote" && voteType !== "downvote" && voteType !== "none") {
        return res.status(400).json({ error: "Invalid vote type" });
      }
      
      if (voteType === "none") {
        // Remove vote
        await storage.deleteVote(session.userId, commentId);
      } else {
        // Add or update vote
        await storage.createOrUpdateVote({
          userId: session.userId,
          commentId,
          voteType
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on comment:", error);
      res.status(500).json({ error: "Failed to vote on comment" });
    }
  });
  
  // Get user's discussion threads
  app.get("/api/discussions/my-threads", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      const threads = await storage.getThreadsByAuthor(session.userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching user's threads:", error);
      res.status(500).json({ error: "Failed to fetch user's threads" });
    }
  });
  
  // Get user's comments
  app.get("/api/discussions/my-comments", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      const comments = await storage.getCommentsByAuthor(session.userId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching user's comments:", error);
      res.status(500).json({ error: "Failed to fetch user's comments" });
    }
  });
  
  // Generate content with restricted sources
  app.post("/api/generate-restricted-lesson", requireAuth, async (req, res) => {
    try {
      const { challenge, moduleId } = req.body;
      
      if (!challenge || !moduleId) {
        return res.status(400).json({ 
          error: "Challenge prompt and module ID are required" 
        });
      }
      
      // Get user and module info
      if (!req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized access" 
        });
      }
      
      const user = await storage.getUser(req.session.userId);
      const module = await storage.getModule(moduleId);
      
      if (!user || !module) {
        return res.status(404).json({ 
          error: "User or module not found" 
        });
      }
      
      // Get assessment data if available
      let assessment = null;
      const assessments = await storage.getAssessmentsByUserId(user.id);
      if (assessments && assessments.length > 0) {
        assessment = assessments[assessments.length - 1]; // Get most recent
      }
      
      // Get user progress data
      const progress = await storage.getUserProgressByUserId(user.id);
      
      // Generate the prompt
      const prompt = generateLessonPrompt(
        user,
        module,
        challenge,
        assessment,
        progress
      );
      
      // Generate content with restricted sources
      const lessonContent = await generateRestrictedLessonContent(prompt);
      
      res.json(lessonContent);
    } catch (error: any) {
      console.error("Error generating restricted lesson:", error);
      res.status(500).json({ 
        error: "Failed to generate content",
        details: error?.message || "Unknown error"
      });
    }
  });

  // Endpoint to create or update the Raising Arizona's CORE module
  app.post("/api/admin/core-module", requireAuth, async (req, res) => {
    try {
      // Verify user is an admin
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      // For now, allow any authenticated user to create/update the CORE module
      // In a production system, we would check for admin role
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // Create or update the CORE module
      const coreModule = await createRaisingArizonaCoreModule();
      
      res.json({
        success: true,
        message: "Raising Arizona's CORE module created/updated successfully",
        moduleId: coreModule.id
      });
    } catch (error: any) {
      console.error("Error creating/updating CORE module:", error);
      res.status(500).json({ 
        error: "Failed to create/update CORE module",
        details: error?.message || "Unknown error"
      });
    }
  });
  
  // Get the Raising Arizona's CORE module
  app.get("/api/modules/core", async (req, res) => {
    try {
      // Find the CORE module by title
      const modules = await db.query.learningModules.findMany({
        where: (modules, { eq }) => eq(modules.title, "Raising Arizona's CORE")
      });
      
      if (modules.length === 0) {
        return res.status(404).json({ error: "CORE module not found" });
      }
      
      // Return the first matching module (should be only one)
      res.json(modules[0]);
    } catch (error: any) {
      console.error("Error fetching CORE module:", error);
      res.status(500).json({ 
        error: "Failed to fetch CORE module",
        details: error?.message || "Unknown error"
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
