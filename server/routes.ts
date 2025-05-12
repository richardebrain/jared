import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLearningModuleSchema, insertUserProgressSchema, insertMeetingSchema, insertAssessmentSchema, type User } from "@shared/schema";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";
import MemoryStore from "memorystore";

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
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  // Google OAuth callback route
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: true
    }),
    (req, res) => {
      // Successful authentication
      if (req.user) {
        req.session.userId = (req.user as User).id;
      }
      res.redirect('/dashboard');
    }
  );

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
      res.status(200).json(progress);
    } catch (error) {
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
      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });
      
      const progress = await storage.updateUserProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
