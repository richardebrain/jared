import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { storage } from "./storage";
import { db } from "./db";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { users } from "@shared/schema";
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { registerRoutes } from './routes.js';
import { scheduledTaskService } from './services/scheduledTasks.js';
import passport from './utils/passport-config'


const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Basic logging middleware with error handling
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    try {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    } catch (error) {
      console.error('Logging error:', error);
    }
  });
  
  next();
});



// Create HTTP server with stability settings
const server = createServer(app);

// Add server stability settings
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Setup session middleware
const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

// Enhanced session security configuration for ECE platform
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours (reduced from 7 days)
const IDLE_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours idle timeout

app.use(session({
  secret: process.env.SESSION_SECRET || "mentor-me-secret-dev-only",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Extends session with activity
  name: 'mentorme.sid',
  cookie: { 
    secure: false, // Allow HTTP for Replit deployment
    httpOnly: true,
    maxAge: SESSION_DURATION, // 24 hours
    sameSite: "lax",
    path: '/'
  },
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 60, // Clean expired sessions every hour
    errorLog: (error) => {
      console.error('Session store error:', error);
    }
  })
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Session security middleware for idle timeout and activity monitoring
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();
    const lastActivity = (req.session as any).lastActivity || (req.session as any).loginTime || now;
    const timeSinceActivity = now - new Date(lastActivity).getTime();
    
    // Check for idle timeout (3 hours)
    if (timeSinceActivity > IDLE_TIMEOUT) {
      console.log(`Session idle timeout for user ${req.session.userId}. Last activity: ${new Date(lastActivity).toISOString()}`);
      req.session.destroy((err) => {
        if (err) console.error('Error destroying idle session:', err);
      });
      res.clearCookie('mentorme.sid');
      return res.status(401).json({
        message: "Session expired due to inactivity",
        details: "Please log in again to continue.",
        code: "IDLE_TIMEOUT"
      });
    }
    
    // Update last activity timestamp
    (req.session as any).lastActivity = new Date().toISOString();
    
    // Save session with updated activity time
    req.session.save((err) => {
      if (err) console.error('Error saving session activity:', err);
    });
  }
  next();
});

// All authentication endpoints moved to routes.ts to prevent conflicts

app.get('/api/rewards/daily-boxes', (req, res) => {
  res.json([]);
});

app.get('/api/streak/silver-box-eligibility', (req, res) => {
  res.json({ eligible: false });
});

//app.get('/api/progress', (req, res) => {
 // res.json({ completedModules: 0, totalPoints: 100 });
//});



app.get('/api/personalized-modules/:id', (req, res) => {
  res.json([]);
});

//app.get('/api/community-modules/top', (req, res) => {
 // res.json([]);
//});

app.get('/api/core-values-shoutouts', (req, res) => {
  res.json([]);
});

// Users route handled in routes.ts

// app.get('/api/modules', (req, res) => {
 // console.log('wrong route called')
//res.json([]);
//});

app.get('/api/assessments', (req, res) => {
  res.json([]);
});

app.post('/api/games/save-score', (req, res) => {
  res.json({ success: true, message: "Score saved successfully" });
});

app.get('/api/games/leaderboard', (req, res) => {
  res.json([]);
});

// Main server initialization function
async function startServer() {
  try {
    // Serve audio files from public/audio directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    app.use('/audio', express.static(path.join(__dirname, "../public/audio")));
    
    // Serve attached assets (classroom music, etc.)
    app.use('/attached_assets', express.static(path.join(__dirname, "../attached_assets")));
    
    // Register all comprehensive routes from routes.ts
    await registerRoutes(app, false); // Enable auth endpoints
    await scheduledTaskService.initialize();

    // Initialize Beary AI module knowledge base asynchronously (don't block server startup)
    console.log('🧠 Starting Beary AI module knowledge base initialization...');
    setImmediate(async () => {
      try {
        const { ModuleIndexingService } = await import("./services/moduleIndexingService");
        const { storage } = await import("./storage");
        await ModuleIndexingService.initializeFromDatabase(storage);
        console.log('✅ Beary AI module knowledge base initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Beary AI module knowledge base:', error);
      }
    });


    // Enhanced error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Server error:', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
      });
      
      const status = err.status || err.statusCode || 500;
      const message = process.env.NODE_ENV === 'development' 
        ? err.message || "Internal Server Error"
        : "Internal Server Error";
      
      res.status(status).json({ message });
    });

    // Setup Vite for development with error handling
    if (process.env.NODE_ENV === "development") {
      try {
        setupVite(app, server);
      } catch (viteError) {
        console.error('Vite setup failed:', viteError);
        // Continue without Vite if it fails
      }
    } else {
      serveStatic(app);
    }

    // Start server with enhanced error handling
    const port = parseInt(process.env.PORT || "5003", 10);
    
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      log(`Educational game server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Add graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
