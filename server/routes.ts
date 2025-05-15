import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { updateChildDevelopmentModule } from "./updateChildDevelopmentModule";
import { eq, sql } from "drizzle-orm";
import { users } from "@shared/schema";

// Define our session data structure
declare module "express-session" {
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
  // Create an HTTP server for the Express app (needed for WebSockets)
  const httpServer = createServer(app);
  
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mentor-me-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false, // Set to false for development
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: "lax"
      }, 
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // User routes
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
      
      // In a real app, we would use bcrypt to compare password hash
      if (user.password !== password) {
        console.log(`Login failed: Password mismatch for user: "${username}"`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set the user session
      req.session.userId = user.id;
      
      console.log(`Login successful for user: "${username}" (ID: ${user.id})`);
      
      // Do not return password in response
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
  
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      // Do not return password in response
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
  
  // Endpoint to update the Child Development Milestones module content
  app.post("/api/modules/update-child-development", async (req, res) => {
    try {
      // Get user ID from session if available (for personalization)
      const userId = req.session?.userId;
      
      // Use the specialized function to update the Child Development module
      const updatedModule = await updateChildDevelopmentModule(userId);
      
      if (!updatedModule) {
        return res.status(404).json({ 
          success: false,
          message: "Failed to update Child Development module" 
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Child Development module updated successfully",
        moduleId: updatedModule.id
      });
    } catch (error) {
      console.error("Failed to update Child Development module:", error);
      return res.status(500).json({ 
        success: false,
        message: "Internal server error updating Child Development module"
      });
    }
  });

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
    const adminUserIds = [4, 5]; // Assuming 4 is jlcookie20 and 5 is laura's ID
    
    if (adminUserIds.includes(userId)) {
      return next(); // Allow access for admin users
    }
    
    // If neither password nor admin user, deny access
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Admin routes with direct password checking for reliability
  app.get("/api/admin/users", async (req, res) => {
    // Check for admin password directly
    const adminPassword = req.query.admin_password;
    console.log("Admin password received:", adminPassword);
    
    if (adminPassword !== "BIGSURF55") {
      console.log("Admin password incorrect, access denied");
      return res.status(403).json({ message: "Forbidden: Admin access required. Password incorrect." });
    }
    
    console.log("Admin password correct, proceeding to fetch users");
    
    try {
      // First check raw SQL query to confirm users exist
      const rawUsers = await db.select().from(users);
      console.log("Raw SQL users count:", rawUsers.length);
      
      const allUsers = await storage.getAllUsers();
      console.log("Storage getAllUsers count:", allUsers ? allUsers.length : 'null or undefined');
      
      if (!allUsers || allUsers.length === 0) {
        // If no users are found, send empty array with message
        console.log("No users found in system");
        return res.status(200).json([]);
      }
      
      const sanitizedUsers = allUsers.map(user => {
        // Don't return passwords in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      console.log("Returning users count:", sanitizedUsers.length);
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error", details: error.message });
    }
  });

  // Direct admin password check reset endpoints
  app.post("/api/admin/reset-points/:userId", async (req, res) => {
    // Check for admin password directly
    const adminPassword = req.query.admin_password;
    console.log("Reset points - Admin password received:", adminPassword);
    
    if (adminPassword !== "BIGSURF55") {
      console.log("Reset points - Admin password incorrect, access denied");
      return res.status(403).json({ message: "Forbidden: Admin access required" });
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
      return res.status(403).json({ message: "Forbidden: Admin access required" });
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
      
      res.status(200).json({ success: true, message: "User points reset to zero" });
    } catch (error) {
      console.error("Error resetting user points:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User progress routes
  app.get("/api/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const progress = await storage.getProgressByUserId(userId);
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const moduleId = parseInt(req.params.moduleId);
      
      // This should be replaced with a proper get by user and module function
      const allProgress = await storage.getProgressByUserId(userId);
      const progress = allProgress.find(p => p.moduleId === moduleId);
      
      if (!progress) {
        return res.status(404).json({ message: "Progress not found" });
      }
      
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching module progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/progress/:moduleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const moduleId = parseInt(req.params.moduleId);
      const { progress, completed, pointsEarned } = req.body;
      
      // This should be replaced with a proper get by user and module function
      const allProgress = await storage.getProgressByUserId(userId);
      const existingProgress = allProgress.find(p => p.moduleId === moduleId);
      
      if (existingProgress) {
        // Update existing progress
        const updatedProgress = await storage.updateUserProgress(existingProgress.id, {
          progress: progress || existingProgress.progress,
          completed: completed !== undefined ? completed : existingProgress.completed,
          pointsEarned: pointsEarned !== undefined ? pointsEarned : existingProgress.pointsEarned,
          lastAccessed: new Date()
        });
        res.status(200).json(updatedProgress);
      } else {
        // Create new progress
        const newProgress = await storage.createUserProgress({
          userId,
          moduleId,
          progress: progress || 0,
          completed: completed || null,
          pointsEarned: pointsEarned || null,
          recommended: false,
          lastAccessed: new Date()
        });
        res.status(201).json(newProgress);
      }
    } catch (error) {
      console.error("Error updating module progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Video Quiz Completion routes
  app.post("/api/videos/quiz-complete/:videoId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const videoId = req.params.videoId; // Using videoId as string (YouTube ID)
      
      // Check if user has already completed 2 video quizzes today
      const completionsToday = await storage.getDailyVideoCompletionsCount(userId);
      
      if (completionsToday >= 2) {
        return res.status(400).json({ 
          message: "You can only earn points for 2 videos per day",
          remaining: 0
        });
      }
      
      // Determine points based on video duration
      // For simplicity, we're using a fixed value based on video length
      // In a real implementation, you'd look up the video's duration from your data
      const videoDuration = req.body.duration || 5; // Default to 5 minutes if not provided
      const pointsEarned = videoDuration >= 10 ? 8 : 5; // 8 points for videos 10+ minutes, 5 points for shorter videos
      
      // Record the completion
      const completion = await storage.createVideoQuizCompletion({
        userId,
        videoId,
        pointsEarned,
        completedAt: new Date()
      });
      
      // Add points to user (respecting daily cap)
      await storage.addUserPoints(userId, pointsEarned);
      
      res.status(201).json({ 
        success: true, 
        completion,
        remaining: 2 - (completionsToday + 1) // Remaining videos for today
      });
    } catch (error) {
      console.error("Error recording video quiz completion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
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
  
  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
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
      const { score, timeSpent } = req.body;
      
      if (score === undefined || timeSpent === undefined) {
        return res.status(400).json({ message: "Score and time spent are required" });
      }
      
      // Check if user has already played 2 games today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const userGamePlayToday = await storage.getUserGamePlayToday(userId, today);
      
      if (userGamePlayToday.length >= 2) {
        return res.status(400).json({ 
          message: "You can only earn points for 2 games per day",
          remaining: 0
        });
      }
      
      // Get the game
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Calculate points based on score (simplified example)
      const pointsEarned = Math.min(10, Math.floor(score / 10)); // Max 10 points, 1 point per 10 score
      
      // Record the game play
      const gamePlay = await storage.recordGamePlay({
        userId,
        gameId,
        score,
        timeSpent,
        pointsEarned
      });
      
      // Add points to user
      await storage.addUserPoints(userId, pointsEarned);
      
      res.status(201).json({ 
        success: true, 
        gamePlay,
        remaining: 2 - (userGamePlayToday.length + 1) // Remaining games for today
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
  
  // Core Values Shout Outs routes
  app.get("/api/shout-outs", async (req, res) => {
    try {
      const shoutOuts = await storage.getAllShoutOuts();
      res.status(200).json(shoutOuts);
    } catch (error) {
      console.error("Error fetching shout outs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/shout-outs", requireAuth, async (req, res) => {
    try {
      const nominatorId = req.session.userId as number;
      const { nomineeId, coreValue, description } = req.body;
      
      if (!nomineeId || !coreValue || !description) {
        return res.status(400).json({ message: "Nominee ID, core value, and description are required" });
      }
      
      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const userShoutOutsToday = await storage.getUserShoutOutsToday(nominatorId, today);
      
      if (userShoutOutsToday.length >= 1) {
        return res.status(400).json({ 
          message: "You can only submit one Core Values shout-out per day",
          remaining: 0
        });
      }
      
      // Create the shout-out
      const pointsAwarded = 5; // Standard points for a shout-out
      const shoutOut = await storage.createShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description,
        pointsAwarded
      });
      
      // Add points to both nominator and nominee
      await storage.addUserPoints(nominatorId, pointsAwarded);
      await storage.addUserPoints(nomineeId, pointsAwarded);
      
      res.status(201).json({ 
        success: true, 
        shoutOut,
        remaining: 0 // No more shout-outs remaining today
      });
    } catch (error) {
      console.error("Error creating shout out:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Meetings routes
  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Get meetings where user is either host or guest
      const meetings = await db.query.meetings.findMany({
        where: sql`${eq(meetings.hostId, userId)} OR ${eq(meetings.guestId, userId)}`
      });
      
      res.status(200).json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const hostId = req.session.userId as number;
      const { title, startTime, endTime, guestId, description, timeZone, meetingLink, status } = req.body;
      
      if (!title || !startTime || !endTime || !timeZone) {
        return res.status(400).json({ message: "Title, start time, end time, and time zone are required" });
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
        status: status || "scheduled"
      });
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Power-ups routes
  app.get("/api/power-ups", async (req, res) => {
    try {
      const powerUps = await storage.getAllPowerUps();
      res.status(200).json(powerUps);
    } catch (error) {
      console.error("Error fetching power-ups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/user/power-ups", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userPowerUps = await storage.getUserPowerUps(userId);
      
      // Format response to include power-up details
      const formattedPowerUps = await Promise.all(userPowerUps.map(async p => {
        const powerUp = await storage.getPowerUp(p.powerUpId);
        return {
          ...p,
          name: powerUp?.name || "Unknown Power-up",
          description: powerUp?.description || "",
          icon: powerUp?.icon || ""
        };
      }));
      
      res.status(200).json(formattedPowerUps);
    } catch (error) {
      console.error("Error fetching user power-ups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/power-ups/purchase/:powerUpId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const powerUpId = parseInt(req.params.powerUpId);
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get power-up
      const powerUp = await storage.getPowerUp(powerUpId);
      if (!powerUp) {
        return res.status(404).json({ message: "Power-up not found" });
      }
      
      // Check if user has enough points
      if (user.points < powerUp.cost) {
        return res.status(400).json({ 
          message: "Not enough points to purchase this power-up",
          required: powerUp.cost,
          available: user.points
        });
      }
      
      // Check if user already has this power-up
      const userPowerUps = await storage.getUserPowerUps(userId);
      const existingPowerUp = userPowerUps.find(p => p.powerUpId === powerUpId);
      
      if (existingPowerUp) {
        // Increment quantity
        await storage.updatePowerUpQuantity(existingPowerUp.id, existingPowerUp.quantity + 1);
      } else {
        // Add new power-up to user
        await storage.awardPowerUp(userId, powerUpId, 1);
      }
      
      // Deduct points from user
      await storage.addUserPoints(userId, -powerUp.cost);
      
      res.status(200).json({ 
        success: true,
        message: `Successfully purchased ${powerUp.name}`,
        remainingPoints: user.points - powerUp.cost
      });
    } catch (error) {
      console.error("Error purchasing power-up:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/power-ups/use/:userPowerUpId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userPowerUpId = parseInt(req.params.userPowerUpId);
      
      // Get the user power-up
      const userPowerUps = await storage.getUserPowerUps(userId);
      const userPowerUp = userPowerUps.find(p => p.id === userPowerUpId);
      
      if (!userPowerUp) {
        return res.status(404).json({ message: "Power-up not found in your inventory" });
      }
      
      if (userPowerUp.quantity <= 0) {
        return res.status(400).json({ message: "You do not have any of this power-up remaining" });
      }
      
      // Get the power-up details
      const powerUp = await storage.getPowerUp(userPowerUp.powerUpId);
      if (!powerUp) {
        return res.status(404).json({ message: "Power-up not found" });
      }
      
      // Apply power-up effect (this would vary based on the power-up type)
      let effect = {};
      let effectMessage = "";
      
      switch (powerUp.effect) {
        case "double_points":
          // Apply double points effect for next activity
          effectMessage = "Your next activity will earn double points!";
          effect = { doublePoints: true };
          break;
        case "skip_activity":
          // Allow skipping an activity while still earning points
          effectMessage = "You can skip one activity while still earning points!";
          effect = { skipActivity: true };
          break;
        case "time_extension":
          // Extend time for an assignment
          effectMessage = "You've gained an extra day for your next assignment!";
          effect = { timeExtension: 24 }; // hours
          break;
        default:
          effectMessage = "Power-up used successfully!";
          effect = { generic: true };
      }
      
      // Decrement quantity
      await storage.updatePowerUpQuantity(userPowerUp.id, userPowerUp.quantity - 1);
      
      res.status(200).json({ 
        success: true,
        message: effectMessage,
        effect,
        remainingQuantity: userPowerUp.quantity - 1
      });
    } catch (error) {
      console.error("Error using power-up:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Points to Bear Bucks conversion endpoint
  app.post("/api/convert-points", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { pointsToConvert, bearBucksToAdd } = req.body;
      
      if (!pointsToConvert || !bearBucksToAdd || pointsToConvert <= 0 || bearBucksToAdd <= 0) {
        return res.status(400).json({ message: "Invalid conversion parameters" });
      }
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough points
      const currentPoints = user.points || 0;
      if (currentPoints < pointsToConvert) {
        return res.status(400).json({ 
          message: "Not enough points for conversion",
          currentPoints
        });
      }
      
      // Calculate current bear bucks
      const currentBearBucks = user.bearBucks || 0;
      
      // Update user with new point and bear buck values
      await storage.updateUser(userId, {
        points: currentPoints - pointsToConvert,
        bearBucks: currentBearBucks + bearBucksToAdd
      });
      
      // Return updated user data
      const updatedUser = await storage.getUser(userId);
      const { password, ...userWithoutPassword } = updatedUser || {};
      
      res.status(200).json({
        success: true,
        message: `Converted ${pointsToConvert} points to ${bearBucksToAdd} Bear Bucks`,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error converting points to Bear Bucks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Assessment routes
  app.get("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const assessments = await storage.getAssessmentsByUserId(userId);
      console.log(`Retrieved ${assessments?.length || 0} assessments for user ${userId}`);
      res.status(200).json(assessments || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      console.log(`Creating assessment for user ${userId}`);
      
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
      
      // Create and save the assessment with all data
      const assessmentData = {
        userId,
        strengthAreas: strengthAreas || [],
        growthAreas: growthAreas || [],
        recommendedModules,
        overallScore: overallScore || 0,
        completed: true,
        ...otherData
      };
      
      const assessment = await storage.createAssessment(assessmentData);
      
      // Create progress entries for recommended modules
      if (recommendedModules && recommendedModules.length > 0) {
        for (const moduleId of recommendedModules) {
          // Check if progress entry already exists
          const allProgress = await storage.getProgressByUserId(userId);
          const existingProgress = allProgress.find(p => p.moduleId === moduleId);
          
          if (!existingProgress) {
            await storage.createUserProgress({
              userId,
              moduleId,
              progress: 0,
              completed: null,
              recommended: true,
              pointsEarned: null,
              lastAccessed: new Date()
            });
          } else if (!existingProgress.recommended) {
            // Update existing progress to mark as recommended
            await storage.updateUserProgress(existingProgress.id, {
              recommended: true
            });
          }
        }
      }
      
      console.log(`Assessment created successfully for user ${userId}`);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Lesson Plan Generator API
  app.post("/api/lesson-plan", requireAuth, async (req, res) => {
    try {
      const { theme, ageGroup, additionalNotes } = req.body;
      
      if (!theme || !ageGroup) {
        return res.status(400).json({ message: "Theme and age group are required" });
      }
      
      console.log(`Generating lesson plan for theme: "${theme}", age group: "${ageGroup}"`);
      
      // Create a system prompt for Perplexity
      const systemPrompt = `You are an expert early childhood educator at Raising Arizona Preschool. 
      Create a detailed, creative, and age-appropriate weekly lesson plan for ${ageGroup} children 
      based on the theme: "${theme}". 
      
      The lesson plan should:
      1. Align with early childhood education standards and best practices
      2. Include engaging activities for each day of the week (Monday-Friday)
      3. Cover different developmental domains (cognitive, physical, social-emotional, language)
      4. Include required materials for each activity
      5. Specify learning objectives for each activity
      6. Incorporate both indoor and outdoor activities
      7. Include at least one art project, one science experiment, and one sensory activity
      8. Be presented in a structured, organized format that's easy for teachers to follow
      
      Format the response as properly structured HTML, using h1, h2, h3 tags appropriately, 
      along with lists, tables, and other formatting to make it visually organized.`;
      
      const userPrompt = `Theme: ${theme}
      Age Group: ${ageGroup}
      Additional Notes: ${additionalNotes || "None provided"}
      
      Please create a comprehensive weekly lesson plan that a preschool teacher can implement immediately.`;
      
      // Make the API call to Perplexity
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
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: 5000,
          temperature: 0.2,
          return_images: false,
          search_domain_filter: ["perplexity.ai"]
        })
      });
      
      if (!response.ok) {
        console.error("Perplexity API error:", await response.text());
        return res.status(500).json({ message: "Error generating lesson plan" });
      }
      
      const data = await response.json();
      
      // Return the generated lesson plan
      res.status(200).json({
        success: true,
        lessonPlan: data.choices[0].message.content,
        citations: data.citations || []
      });
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Return server for use in tests and closing
  return httpServer;
}
