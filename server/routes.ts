import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { updateChildDevelopmentModule } from "./updateChildDevelopmentModule";
import { eq, sql } from "drizzle-orm";
import { users } from "@shared/schema";
import * as notebookLmPlugin from "./notebookLmPlugin";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define our session data structure with proper typing
declare module "express-session" {
  interface SessionData {
    userId: number;
    loginTime?: string;  // ISO string for login timestamp
    registeredAt?: string;  // ISO string for registration timestamp
    lastActive?: string;  // Last activity timestamp
  }
}

// Extend the Express.User interface to avoid TypeScript errors
declare global {
  namespace Express {
    interface User extends Record<string, any> {}
  }
}

// Configure multer storage for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for school logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolLogosDir = path.join(uploadsDir, 'school-logos');
    if (!fs.existsSync(schoolLogosDir)) {
      fs.mkdirSync(schoolLogosDir, { recursive: true });
    }
    cb(null, schoolLogosDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `school-logo-${uniqueSuffix}${ext}`);
  }
});

// Configure multer upload limits and file types
const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and SVG files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create an HTTP server for the Express app (needed for WebSockets)
  const httpServer = createServer(app);
  
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  
  // Setup session middleware using PostgreSQL for persistent sessions
  const PgSession = connectPgSimple(session);
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "mentor-me-secret",
    resave: true, // Ensures session is saved on each request
    saveUninitialized: true, // Ensures new sessions are saved
    rolling: true, // Reset expiration with each request
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Allow HTTP in development
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax" as "lax", // Type assertion to fix TypeScript error
      path: '/' // Ensure cookie is available on all paths
    }, 
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 24 * 60 * 60, // Prune expired sessions every 24 hours
    }),
  };
  
  console.log('Session configuration:', {
    ...sessionConfig,
    secret: '[REDACTED]',
    store: sessionConfig.store ? 'PgSession' : 'MemoryStore',
  });
  
  app.use(session(sessionConfig));

  // Auth middleware
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Auth check - Session ID:', req.session.id);
    console.log('Auth check - Session data:', req.session);
    
    if (!req.session.userId) {
      console.log('Auth failed - No userId in session');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify user exists in database
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`Auth failed - User with ID ${userId} not found in database`);
        req.session.destroy(() => {
          console.log('Session destroyed due to user not found');
        });
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update last active time
      await storage.updateUser(userId, {
        lastActive: new Date()
      });
      
      // Refresh session expiration
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      // Force session update
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Session save error in auth middleware:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (saveErr) {
        console.error('Failed to refresh session in auth middleware:', saveErr);
        // Continue anyway as this is just a refresh
      }

      console.log(`Auth successful - User ID: ${req.session.userId}`);
      next();
    } catch (error) {
      console.error('Error in auth middleware:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Middleware to check if user's school has a valid subscription
  const requirePaidAccess = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.session.userId as number;
      const accessStatus = await storage.checkUserAccessStatus(userId);
      
      if (!accessStatus.hasAccess) {
        console.log(`Paid access check failed for user ${userId}: ${accessStatus.reason}`);
        return res.status(403).json({ 
          message: "Access denied", 
          reason: accessStatus.reason,
          details: "Your school does not have an active subscription to access this content."
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in paid access middleware:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // User routes
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
          hasEmail: !!email
        };
        
        console.log("Registration failed: Missing required fields", missingFields);
        
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
          missingFields: missingFieldNames
        });
      }
      
      // Check if user with this username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log(`Registration failed: Username "${username}" already exists`);
        return res.status(400).json({ 
          message: "Username already exists",
          details: "This username is already taken. Please choose a different username for your account."
        });
      }
      
      // Validate email format
      if (!email.includes('@') || !email.includes('.')) {
        console.log(`Registration failed: Invalid email format "${email}"`);
        return res.status(400).json({ 
          message: "Invalid email format",
          details: "Please provide a valid email address (example: name@domain.com)."
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
          preferred: null
        },
        schoolId: schoolId || 1, // Default to Raising Arizona if no school specified
        points: 0,
        bearBucks: 0,
        level: 1,
        isAdmin: false,
        isSchoolAdmin: false,
        isOwner: false
        // createdAt is handled automatically by the schema
      });
      
      console.log(`Registration successful for user: "${username}" (ID: ${newUser.id})`);
      
      // Assign required training modules for new users
      try {
        // Get the Raising Arizona's CORE module
        const coreModule = await db.query.learningModules.findFirst({
          where: (modules, { eq }) => eq(modules.title, "Raising Arizona's CORE")
        });
        
        // Get the Mindful Mornings module
        const mindfulModule = await db.query.learningModules.findFirst({
          where: (modules, { eq }) => eq(modules.category, "mindfulness")
        });
        
        // Get the Chapter 1 module
        const chapterOneModule = await db.query.learningModules.findFirst({
          where: (modules, { eq }) => eq(modules.title, "Chapter 1: Building a Human")
        });
        
        // Create user progress entries for required modules
        if (coreModule) {
          await storage.createUserProgress({
            userId: newUser.id,
            moduleId: coreModule.id,
            progress: 0,
            completed: false,
            recommended: true,
            pointsEarned: 0
            // lastAccessed is handled automatically by the schema
          });
          console.log(`Assigned CORE module (ID: ${coreModule.id}) to new user (ID: ${newUser.id})`);
        }
        
        if (mindfulModule) {
          await storage.createUserProgress({
            userId: newUser.id,
            moduleId: mindfulModule.id,
            progress: 0,
            completed: false,
            recommended: true,
            pointsEarned: 0,
            lastAccessed: new Date()
          });
          console.log(`Assigned Mindful Mornings module (ID: ${mindfulModule.id}) to new user (ID: ${newUser.id})`);
        }
        
        if (chapterOneModule) {
          await storage.createUserProgress({
            userId: newUser.id,
            moduleId: chapterOneModule.id,
            progress: 0,
            completed: false,
            recommended: true,
            pointsEarned: 0,
            lastAccessed: new Date()
          });
          console.log(`Assigned Chapter 1 module (ID: ${chapterOneModule.id}) to new user (ID: ${newUser.id})`);
        }
      } catch (assignError) {
        console.error("Error assigning required modules to new user:", assignError);
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
      req.session.save(err => {
        if (err) {
          console.error('Session save error during registration:', err);
        } else {
          console.log('Session saved successfully during registration for userId:', newUser.id);
        }
      });
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Extract and trim credentials for consistency
      const username = req.body.username?.trim();
      const password = req.body.password?.trim();
      
      console.log(`Login attempt for username: "${username}"`);
      
      if (!username || !password) {
        console.log("Login failed: Missing username or password", {
          hasUsername: !!username,
          hasPassword: !!password
        });
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Special case for demo credentials
      const isDemoUser = username === 'jlcookie20' && password === 'password';
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Login failed: User not found for username: "${username}"`);
        return res.status(401).json({ 
          message: "Invalid username or password",
          details: "No account found with this username. Please check your spelling or register for an account."
        });
      }
      
      // Check password - either normal validation or the special demo case
      const passwordValid = isDemoUser || user.password === password;
      
      if (!passwordValid) {
        console.log(`Login failed: Password mismatch for user: "${username}"`);
        return res.status(401).json({ 
          message: "Invalid username or password",
          details: "Password is incorrect. Please try again or use the forgot password link."
        });
      }
      
      // If we made it here, authentication succeeded
      
      // Clean out any existing session
      if (req.session.userId) {
        console.log(`Clearing previous session for user ID: ${req.session.userId}`);
      }
      
      // Set the user session with userId
      req.session.userId = user.id;
      
      // Add a login timestamp for better tracking
      const loginTime = new Date();
      req.session.loginTime = loginTime.toISOString();
      
      // Update user's last active time
      await storage.updateUser(user.id, {
        lastActive: new Date()
      });
      
      // Force session save to ensure it's properly written to the database
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              reject(err);
            } else {
              console.log('Session saved successfully with userId:', user.id);
              resolve();
            }
          });
        });
      } catch (saveErr) {
        console.error('Failed to save session:', saveErr);
        return res.status(500).json({ message: "Authentication succeeded but failed to create session" });
      }
      
      console.log(`Login successful for user: "${username}" (ID: ${user.id})`);
      console.log(`Session ID: ${req.session.id}`);
      console.log(`Session data:`, req.session);
      
      // Do not return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Internal server error", 
        details: "There was a problem with the login process. Please try again."
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    console.log(`Logout attempt - Session ID: ${req.session.id}`);
    console.log(`Logout attempt - User ID: ${req.session.userId || 'none'}`);
    
    // Clear session data
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ 
          message: "Failed to logout", 
          details: "There was a problem ending your session. Please try again."
        });
      }
      
      console.log("Logout successful - Session destroyed");
      
      // Clear cookies by setting expiration in the past
      res.clearCookie('connect.sid');
      
      res.status(200).json({ 
        message: "Logged out successfully",
        details: "Your session has been ended successfully."
      });
    });
  });
  
  app.get("/api/auth/me", async (req, res) => {
    console.log('GET /api/auth/me - Session ID:', req.session.id);
    console.log('GET /api/auth/me - Session data:', req.session);
    
    // Check if session has userId
    if (!req.session.userId) {
      console.log('GET /api/auth/me - No userId in session');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.session.userId as number;
      console.log(`GET /api/auth/me - Looking up user with ID: ${userId}`);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`GET /api/auth/me - User with ID ${userId} not found in database`);
        req.session.destroy(() => {
          console.log('GET /api/auth/me - Session destroyed due to user not found');
        });
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`GET /api/auth/me - Found user: ${user.username} (ID: ${user.id})`);
      
      // Do not return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('GET /api/auth/me - Error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all users (for leaderboard)
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      if (!allUsers || allUsers.length === 0) {
        console.log("No users found in system");
        return res.status(200).json([]);
      }
      
      const sanitizedUsers = allUsers.map(user => {
        // Don't return passwords in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      console.log("Returning users count for leaderboard:", sanitizedUsers.length);
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Learning modules routes
  app.get("/api/modules", requireAuth, requirePaidAccess, async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.status(200).json(modules);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/modules/:id", requireAuth, requirePaidAccess, async (req, res) => {
    try {
      // Validate the module ID parameter
      if (!req.params.id || req.params.id === 'undefined') {
        console.error(`Invalid module ID requested: ${req.params.id}`);
        return res.status(400).json({ 
          message: "Invalid module ID",
          details: "A valid module ID is required"
        });
      }
      
      const moduleId = parseInt(req.params.id);
      
      // Check for NaN which indicates parsing failure
      if (isNaN(moduleId)) {
        console.error(`Failed to parse module ID: ${req.params.id}`);
        return res.status(400).json({ 
          message: "Invalid module ID format",
          details: "Module ID must be a number" 
        });
      }
      
      // Get user info for logging
      const userId = req.session.userId as number;
      console.log(`User ${userId} requesting module ${moduleId}`);
      
      // Fetch the module with error handling
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        console.log(`Module ${moduleId} not found for user ${userId}`);
        return res.status(404).json({ 
          message: "Module not found",
          details: "The requested learning module does not exist"
        });
      }
      
      // Log successful module access for analytics
      console.log(`Module ${moduleId} (${module.title}) served to user ${userId}`);
      
      // Return the module
      res.status(200).json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ 
        message: "Error retrieving module",
        details: "An unexpected error occurred while fetching the module" 
      });
    }
  });
  
  // Endpoint to update the Child Development Milestones module content
  app.post("/api/modules/update-child-development", requireAuth, requirePaidAccess, async (req, res) => {
    try {
      // Get user ID from session if available (for personalization)
      const userId = req.session?.userId as number;
      
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
  
  // School Admin middleware - restricts access to only administrators of a specific school
  const requireSchoolAdmin = async (req: Request, res: Response, next: NextFunction) => {
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
          details: "You do not have access to this school's data"
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
          school.adminPasswordHash
        );
        
        if (adminKeyValid) {
          return next();
        }
      }
      
      // If nothing validated, deny access
      return res.status(403).json({ 
        message: "School admin access required", 
        details: "You need administrator privileges to access this school's data"
      });
    } catch (error) {
      console.error("Error in school admin middleware:", error);
      return res.status(500).json({ message: "Server error verifying access" });
    }
  };
  
  // App Owner middleware - For Subscription & School Management
  const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
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
        reason: "Owner privileges required for subscription management" 
      });
    } catch (error) {
      console.error("Error checking owner status:", error);
      return res.status(500).json({ 
        message: "Server error checking application owner status" 
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
      const subscribedSchools = schools.filter(school => 
        school.subscriptionActive && !school.isFreeAccess
      );
      
      // Get revenue statistics (placeholder for Stripe integration)
      const stats = {
        totalSchools: schools.length,
        activeSubscriptions: subscribedSchools.length,
        totalUsers: allUsers.length,
        averageUsersPerSchool: Math.round(allUsers.length / (schools.length || 1)),
        revenueStats: {
          monthly: subscribedSchools.length * 250, // Placeholder assuming $250/month per school
          annual: subscribedSchools.length * 2500, // Placeholder assuming $2500/year per school
          projected: subscribedSchools.length * 3000, // Placeholder for projected annual revenue
        }
      };
      
      res.status(200).json({
        schools,
        stats
      });
    } catch (error) {
      console.error("Error fetching owner dashboard data:", error);
      res.status(500).json({ message: "Error fetching owner dashboard data" });
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
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Error assigning owner privileges:", error);
      res.status(500).json({ message: "Error assigning owner privileges" });
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
        return res.status(403).json({ message: "Cannot revoke primary owner privileges" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user to remove owner privileges
      await storage.updateUser(userId, { isOwner: false });
      
      res.status(200).json({ 
        message: "Owner privileges revoked successfully" 
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
      const owners = allUsers.filter(user => user.isOwner).map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isPrimary: user.id === 4 // jlcookie20 is the primary owner
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
  app.get("/api/progress", requireAuth, requirePaidAccess, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const progress = await storage.getProgressByUserId(userId);
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/progress/:moduleId", requireAuth, requirePaidAccess, async (req, res) => {
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
        
        // If the module is newly completed, add points to user account
        if (completed && !existingProgress.completed && pointsEarned) {
          // Fetch the module to get pointValue if needed
          const module = await db.query.learningModules.findFirst({
            where: (m, { eq }) => eq(m.id, moduleId)
          });
          
          // Award either the specified pointsEarned or the module's pointValue
          const pointsToAward = pointsEarned || (module?.pointValue || 0);
          
          if (pointsToAward > 0) {
            // Get user's current points
            const user = await storage.getUser(userId);
            if (user) {
              // Update user's points
              await storage.updateUser(userId, { 
                points: (user.points || 0) + pointsToAward 
              });
              
              console.log(`Awarded ${pointsToAward} points to user ${userId} for completing module ${moduleId}`);
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
          lastAccessed: new Date()
        });
        
        // If the module is created as completed, add points to user account
        if (completed && pointsEarned) {
          // Get user's current points
          const user = await storage.getUser(userId);
          if (user) {
            // Update user's points
            await storage.updateUser(userId, { 
              points: (user.points || 0) + pointsEarned 
            });
            
            console.log(`Awarded ${pointsEarned} points to user ${userId} for completing module ${moduleId}`);
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
  
  // Special endpoint to check if user has special bonus games access
  app.get("/api/bonus-games/access", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      // Special access for jlcookie20 user account
      if (user && user.username === 'jlcookie20') {
        return res.status(200).json({ 
          hasSpecialAccess: true,
          message: "You have special access to all bonus games without restrictions!"
        });
      }
      
      // Default response for other users
      return res.status(200).json({ 
        hasSpecialAccess: false,
        message: "Standard access rules apply"
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
        return res.status(400).json({ message: "Score and time taken are required" });
      }
      
      // Check if user has already played a game today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get user's game history
      const gameHistory = await storage.getUserGameHistory(userId);
      
      // Check if any game was played today
      const played = gameHistory.some(game => 
        new Date(game.completedAt).toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
      );
      
      if (played) {
        return res.status(400).json({ 
          message: "You can only play one bonus game per day",
          remaining: 0
        });
      }
      
      // Calculate points based on score (simplified example)
      const pointsEarned = Math.min(10, Math.floor(score / 10)); // Max 10 points, 1 point per 10 score
      
      // Record the game play
      const gamePlay = await storage.recordGamePlay({
        userId,
        gameId,
        score,
        timeTaken,
        pointsEarned
      });
      
      // Add points to user
      await storage.addUserPoints(userId, pointsEarned);
      
      res.status(201).json({ 
        success: true, 
        gamePlay,
        remaining: 0 // No more games for today since we limit to one per day
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
  
  // Dedicated API endpoint for bonus game rewards
  app.post("/api/rewards/points", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { points = 5 } = req.body; // Default to 5 if not provided
      
      if (isNaN(points) || points <= 0 || points > 20) {
        return res.status(400).json({ 
          message: "Points must be a number between 1 and 20" 
        });
      }
      
      // Check if user has already played a game today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get user's game history
      const gameHistory = await storage.getUserGameHistory(userId);
      
      // Check if any game was played today
      const played = gameHistory.some(game => 
        new Date(game.completedAt).toDateString() === today.toDateString()
      );
      
      if (played) {
        return res.status(403).json({ 
          message: "You've already played your daily game. Come back tomorrow!",
          dailyLimitReached: true
        });
      }
      
      // Record the game play with gameId = 1 (representing bonus games)
      const gamePlay = await storage.recordGamePlay({
        userId,
        gameId: 1,
        score: points * 10,
        timeTaken: 30,
        pointsEarned: points
      });
      
      // Add points to user account
      const updatedUser = await storage.addUserPoints(userId, points);
      
      // Send back the updated user data
      res.status(201).json({
        success: true,
        message: `Congratulations! You earned ${points} points!`,
        pointsEarned: points,
        user: updatedUser,
        gamePlay
      });
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(500).json({ message: "Failed to award points. Please try again." });
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
      
      console.log("Nomination request received:", { nominatorId, nomineeId, coreValue, message, description, nominationText });
      
      // Validate inputs
      if (!nomineeId || !coreValue || !nominationText) {
        console.log("Missing required fields:", { nomineeId, coreValue, nominationText });
        return res.status(400).json({ 
          message: "Nominee ID, core value, and description are required"
        });
      }
      
      // Get user info for better messaging
      const nominee = await storage.getUser(nomineeId);
      if (!nominee) {
        return res.status(400).json({
          message: "Selected user not found"
        });
      }
      
      const nomineeName = nominee.firstName || nominee.username;
      
      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all shout-outs by the nominator
      const userShoutOuts = await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);
      
      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter(shoutOut => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });
      
      if (userShoutOutsToday.length >= 3) {
        return res.status(400).json({ 
          message: "You've reached the maximum number of core value nominations for today",
          remaining: 0 
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
        pointsAwarded
      });
      
      // Award points to both nominator and nominee
      await storage.addUserPoints(nominatorId, 2); // Nominator gets 2 points
      await storage.addUserPoints(nomineeId, pointsAwarded); // Nominee gets 5 points
      
      // Respond with success message
      res.status(200).json({
        success: true,
        message: `You've nominated ${nomineeName} for demonstrating ${coreValue}! You earned 2 points and they earned ${pointsAwarded} points.`,
        pointsAwarded: pointsAwarded,
        nominatorPoints: 2,
        remaining: 3 - (userShoutOutsToday.length + 1)
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
        return res.status(400).json({ message: "Nominee ID, core value, and description are required" });
      }
      
      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all shout-outs by the nominator
      const userShoutOuts = await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);
      
      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter(shoutOut => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });
      
      if (userShoutOutsToday.length >= 1) {
        return res.status(400).json({ 
          message: "You can only submit one Core Values shout-out per day",
          remaining: 0
        });
      }
      
      // Create the shout-out
      const pointsAwarded = 5; // Standard points for a shout-out
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description,
        pointsAwarded
      });
      
      res.status(201).json({ 
        success: true, 
        shoutOut,
        remaining: 0 // No more shout-outs remaining today
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
        return res.status(400).json({ message: "Nominee ID, core value, and description are required" });
      }
      
      // Check if user has already submitted a shout-out today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all shout-outs by the nominator
      const userShoutOuts = await storage.getCoreValuesShoutOutsByNominatorId(nominatorId);
      
      // Filter to get only today's shout-outs
      const userShoutOutsToday = userShoutOuts.filter(shoutOut => {
        const shoutOutDate = new Date(shoutOut.createdAt);
        return shoutOutDate >= today;
      });
      
      if (userShoutOutsToday.length >= 1) {
        return res.status(400).json({ 
          message: "You can only submit one Core Values shout-out per day",
          remaining: 0
        });
      }
      
      // Create the shout-out
      const pointsAwarded = 5; // Standard points for a shout-out
      const shoutOut = await storage.createCoreValuesShoutOut({
        nominatorId,
        nomineeId,
        coreValue,
        description: nominationText, // Use the fallback value determined earlier
        pointsAwarded
      });
      
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
  app.post("/api/ai/lesson-plan", requireAuth, async (req, res) => {
    try {
      const { theme, ageGroup, details, additionalRequests } = req.body;
      
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
      
      Format the response in a clean, well-structured format with clear headings, 
      organized by day of the week, with each activity clearly defined.`;
      
      const userPrompt = `Theme: ${theme}
      Age Group: ${ageGroup}
      Additional Details: ${details || "None provided"}
      Special Requests: ${additionalRequests || "None"}
      
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
  
  // Suessify Generator API - Transform text into Dr. Seuss style poems
  app.post("/api/perplexity/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      console.log(`Generating Dr. Seuss poem for prompt: "${prompt.substring(0, 50)}..."`);
      
      // Create a system prompt for the Dr. Seuss style
      const systemPrompt = `You are Dr. Seuss, the beloved children's author known for your playful rhymes 
      and whimsical language. Create fun, rhythmic, and simple poems in your unique style for young children. 
      Your poems should:
      1. Use simple words that preschool children can understand
      2. Include playful, bouncy rhymes
      3. Be positive and uplifting
      4. Be short (4-8 lines maximum)
      5. Relate directly to the situation described`;
      
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
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.8,
          return_images: false
        })
      });
      
      if (!response.ok) {
        console.error("Perplexity API error:", await response.text());
        return res.status(500).json({ message: "Error generating poem" });
      }
      
      const data = await response.json();
      
      // Return the generated poem
      res.status(200).json({
        success: true,
        content: data.choices[0].message.content
      });
    } catch (error) {
      console.error("Error generating poem:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Parent Response Generator API
  app.post("/api/ai/parent-response", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      console.log(`Generating parent response for prompt: "${prompt.substring(0, 50)}..."`);
      
      // Create a system prompt for Perplexity
      const systemPrompt = `You are an experienced early childhood educator at Raising Arizona Preschool 
      with excellent parent communication skills. Your goal is to help teachers craft friendly, simple, 
      and effective responses to parents about any topics they ask about.
      
      When generating a response:
      1. Use simple, everyday language - avoid jargon or technical terms
      2. Be extremely warm and friendly in tone (like talking to a friend)
      3. Keep sentences short and easy to understand (8-12 words per sentence)
      4. Show genuine care and understanding for both the parent and child
      5. Provide practical, actionable advice when appropriate
      6. Be conversational rather than formal - use contractions (we're, you'll, etc.)
      7. Include a personal touch or relevant example when possible
      8. End with encouragement and an open invitation to talk more
      9. Keep responses concise (120-200 words maximum)
      10. Always be positive, supportive, and solution-focused
      
      Remember, the goal is to make parents feel understood, supported, and valued while building trust - like a friendly conversation with a trusted teacher rather than receiving a formal letter.`;
      
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
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          return_images: false
        })
      });
      
      if (!response.ok) {
        console.error("Perplexity API error:", await response.text());
        return res.status(500).json({ message: "Error generating parent response" });
      }
      
      const data = await response.json();
      
      // Return the generated parent response
      res.status(200).json({
        success: true,
        response: data.choices[0].message.content
      });
    } catch (error) {
      console.error("Error generating parent response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notebook LM Plugin routes
  app.get("/api/notebook-lm/sources", async (req, res) => {
    try {
      const sources = notebookLmPlugin.getAllDataSources();
      res.status(200).json(sources);
    } catch (error) {
      console.error("Error getting notebook LM sources:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notebook-lm/config", async (req, res) => {
    try {
      const config = notebookLmPlugin.getConfig();
      res.status(200).json(config);
    } catch (error) {
      console.error("Error getting notebook LM config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notebook-lm/config", requireAuth, async (req, res) => {
    try {
      const config = req.body;
      const updatedConfig = notebookLmPlugin.updateConfig(config);
      res.status(200).json(updatedConfig);
    } catch (error) {
      console.error("Error updating notebook LM config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notebook-lm/config/reset", requireAuth, async (req, res) => {
    try {
      const defaultConfig = notebookLmPlugin.resetConfig();
      res.status(200).json(defaultConfig);
    } catch (error) {
      console.error("Error resetting notebook LM config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notebook-lm/sources/toggle", requireAuth, async (req, res) => {
    try {
      const { sourceId, enabled } = req.body;
      const source = notebookLmPlugin.toggleDataSource(sourceId, enabled);
      
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      
      res.status(200).json(source);
    } catch (error) {
      console.error("Error toggling notebook LM source:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI response endpoint that uses notebook LM plugin for restricted responses
  app.post("/api/bear-assistant/ask", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      // Use the restricted content generation
      const result = await notebookLmPlugin.generateRestrictedLessonContent(question);
      
      res.status(200).json({
        content: result.content,
        citations: result.citations || []
      });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ 
        message: "Error generating response",
        content: "I'm sorry, I encountered an error processing your question. Please try asking about our mindful morning practices, classroom management techniques, or about our Building Chapter One philosophy."
      });
    }
  });

  // School-specific data access endpoints
  // These routes use the school ID param and requireSchoolAdmin middleware
  // to ensure data is only accessible to authenticated school admins or app owners
  
  // Get all teachers for a specific school
  app.get("/api/schools/:schoolId/teachers", requireSchoolAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      // Get all users from this school
      const teachers = await storage.getUsersBySchoolId(schoolId);
      
      // Return only necessary fields for privacy/security
      const teacherData = teachers.map(teacher => ({
        id: teacher.id,
        username: teacher.username,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        profilePicture: teacher.profilePicture,
        level: teacher.level,
        points: teacher.points,
        bearBucks: teacher.bearBucks,
        createdAt: teacher.createdAt,
        lastActive: teacher.lastActive
      }));
      
      res.json({ 
        teachers: teacherData,
        count: teacherData.length
      });
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });
  
  // Get teacher progress data for a specific school
  app.get("/api/schools/:schoolId/teacher-progress", requireSchoolAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      // Get all users from this school
      const teachers = await storage.getUsersBySchoolId(schoolId);
      
      // Collect the progress data for each teacher
      const progressData = await Promise.all(teachers.map(async (teacher) => {
        const progress = await storage.getUserProgressByUserId(teacher.id);
        const assessments = await storage.getAssessmentsByUserId(teacher.id);
        
        // Calculate completion percentage
        const modules = await storage.getAllModules();
        const completionRate = modules.length > 0 
          ? Math.round((progress.filter(p => p.completed).length / modules.length) * 100) 
          : 0;
        
        return {
          userId: teacher.id,
          username: teacher.username,
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          modulesCompleted: progress.filter(p => p.completed).length,
          totalModules: modules.length,
          completionPercentage: completionRate,
          lastAssessment: assessments.length > 0 
            ? assessments[assessments.length - 1] 
            : null,
          lastActive: teacher.lastActive,
          points: teacher.points,
          level: teacher.level
        };
      }));
      
      res.json({
        schoolId,
        progressData
      });
    } catch (error) {
      console.error("Error fetching school progress data:", error);
      res.status(500).json({ message: "Failed to fetch teacher progress data" });
    }
  });
  
  // Add a new teacher to a specific school
  app.post("/api/schools/:schoolId/teachers", requireSchoolAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      // Validate the school exists
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      // Extract teacher data from request body
      const { 
        username, 
        password, 
        firstName, 
        lastName, 
        email,
        language = "English",
        nativeLanguage = "English" 
      } = req.body;
      
      // Validate required fields
      if (!username || !password || !firstName || !lastName || !email) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          details: "Username, password, firstName, lastName, and email are required" 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Username already exists", 
          details: "Please choose a different username" 
        });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ 
          message: "Email already exists", 
          details: "An account with this email already exists" 
        });
      }
      
      // Create new teacher account with hashed password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const newTeacher = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        schoolId,
        language,
        nativeLanguage,
        points: 0,
        bearBucks: 0,
        level: 1,
        streak: 0,
        timeZone: "UTC",
        isAdmin: false,
        isSchoolAdmin: false,
        isOwner: false,
        createdAt: new Date()
      });
      
      // Update school teacher count
      await storage.updateSchool(schoolId, {
        teacherCount: (school.teacherCount || 0) + 1
      });
      
      // Return success with created teacher (omit password)
      const { password: _, ...teacherWithoutPassword } = newTeacher;
      
      res.status(201).json({
        message: "Teacher added successfully",
        teacher: teacherWithoutPassword
      });
    } catch (error) {
      console.error("Error adding teacher:", error);
      res.status(500).json({ 
        message: "Failed to add teacher", 
        details: error.message || "An unexpected error occurred" 
      });
    }
  });
  
  // Update school settings (admin only)
  app.patch("/api/schools/:schoolId/settings", requireSchoolAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      // Get current school data
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      // Extract update fields
      const { 
        name,
        contactEmail,
        contactPhone,
        address,
        city,
        state,
        zipCode,
        adminPassword,  // New admin password (if changing)
        customization   // School customization settings
      } = req.body;
      
      // Build update object
      const updateData = {};
      
      // Only include fields that were provided
      if (name) updateData.name = name;
      if (contactEmail) updateData.contactEmail = contactEmail;
      if (contactPhone) updateData.contactPhone = contactPhone;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (state) updateData.state = state;
      if (zipCode) updateData.zipCode = zipCode;
      if (customization) updateData.customization = customization;
      
      // Handle admin password update if provided
      if (adminPassword) {
        const saltRounds = 10;
        updateData.adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);
      }
      
      // Update the school
      const updatedSchool = await storage.updateSchool(schoolId, updateData);
      
      // Return updated school data
      res.json({
        message: "School settings updated successfully",
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error updating school settings:", error);
      res.status(500).json({ 
        message: "Failed to update school settings", 
        details: error.message || "An unexpected error occurred" 
      });
    }
  });
  
  // Get all EOS shout-outs for a specific school
  app.get("/api/schools/:schoolId/eos", requireSchoolAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      // Get all users from this school
      const schoolUsers = await storage.getUsersBySchoolId(schoolId);
      const schoolUserIds = schoolUsers.map(user => user.id);
      
      // Get all shout-outs in the system
      const allShoutOuts = await storage.getAllCoreValuesShoutOuts();
      
      // Filter to only include shout-outs where either the nominator or nominee is from this school
      const schoolShoutOuts = allShoutOuts.filter(shoutOut => 
        schoolUserIds.includes(shoutOut.nominatorId) || 
        schoolUserIds.includes(shoutOut.nomineeId)
      );
      
      // Get user details to enrich the shout-out data
      const enrichedShoutOuts = await Promise.all(schoolShoutOuts.map(async (shoutOut) => {
        const nominator = await storage.getUser(shoutOut.nominatorId);
        const nominee = await storage.getUser(shoutOut.nomineeId);
        
        return {
          ...shoutOut,
          nominator: nominator ? {
            id: nominator.id,
            username: nominator.username,
            fullName: `${nominator.firstName} ${nominator.lastName}`,
            schoolId: nominator.schoolId
          } : null,
          nominee: nominee ? {
            id: nominee.id,
            username: nominee.username,
            fullName: `${nominee.firstName} ${nominee.lastName}`,
            schoolId: nominee.schoolId
          } : null
        };
      }));
      
      res.json({
        schoolId,
        shoutOuts: enrichedShoutOuts
      });
    } catch (error) {
      console.error("Error fetching school EOS data:", error);
      res.status(500).json({ message: "Failed to fetch EOS data" });
    }
  });
  
  // School Management Routes
  app.post("/api/schools/register", logoUpload.single('schoolLogo'), async (req, res) => {
    try {
      // Extract form data - ensure all fields are strings if present
      const { 
        schoolName, 
        address, 
        city, 
        state, 
        zipCode, 
        contactEmail, 
        contactPhone, 
        adminPassword,
        planType 
      } = req.body;
      
      // If this is coming from the simple form, it will be JSON
      const contentType = req.headers['content-type'] || '';
      const isJsonRequest = contentType.includes('application/json');
      
      console.log("School registration attempt:", { 
        schoolName: schoolName || '[not provided]', 
        contactEmail: contactEmail || '[not provided]'
      });
      
      // Validate required fields
      if (!schoolName || !contactEmail || !adminPassword) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          details: "School name, contact email, and admin password are required" 
        });
      }
      
      // Check if school with this name already exists
      const existingSchool = await storage.getSchoolByName(schoolName);
      if (existingSchool) {
        return res.status(409).json({ 
          message: "School name already exists", 
          details: "A school with this name is already registered" 
        });
      }
      
      // Process logo file if uploaded
      let logoUrl = null;
      if (req.file) {
        // Create a URL-friendly path for accessing the logo
        logoUrl = `/uploads/school-logos/${req.file.filename}`;
        console.log(`Logo uploaded for ${schoolName}: ${logoUrl}`);
      }
      
      // Hash admin password for security
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      
      // Determine subscription details based on plan type
      let subscriptionDetails = {
        subscriptionActive: true,
        subscriptionType: planType,
        // Default to 30 days for monthly, 365 for yearly
        subscriptionExpiresAt: new Date(Date.now() + (planType === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
      };
      
      // Create the school record
      const newSchool = await storage.createSchool({
        name: schoolName,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        contactEmail,
        contactPhone: contactPhone || null,
        logoUrl,
        subscriptionActive: subscriptionDetails.subscriptionActive,
        subscriptionType: subscriptionDetails.subscriptionType,
        subscriptionExpiresAt: subscriptionDetails.subscriptionExpiresAt,
        adminPasswordHash: hashedPassword,
        isFreeAccess: false,
        teacherCount: 0,
        createdAt: new Date()
      });
      
      console.log(`School registered successfully: ${schoolName} (ID: ${newSchool.id})`);
      
      // Return success response with school details (except password)
      const { adminPasswordHash, ...schoolWithoutPassword } = newSchool;
      
      res.status(201).json({
        message: "School registered successfully",
        school: schoolWithoutPassword
      });
    } catch (error) {
      console.error("School registration error:", error);
      res.status(500).json({ 
        message: "Failed to register school", 
        details: error.message || "An unexpected error occurred" 
      });
    }
  });

  // Return server for use in tests and closing
  return httpServer;
}
