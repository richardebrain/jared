import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLearningModuleSchema, insertUserProgressSchema, insertMeetingSchema, insertAssessmentSchema } from "@shared/schema";
import express from "express";
import session from "express-session";
import { z } from "zod";
import MemoryStore from "memorystore";

// Define our session data structure
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "language-learning-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
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
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set the user session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
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
              lastUpdated: new Date(),
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
