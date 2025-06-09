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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
});

// Create HTTP server
const server = createServer(app);

// Setup session middleware
const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || "mentor-me-secret-dev-only",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { 
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProduction ? "none" : "lax",
    path: '/',
    domain: isProduction ? undefined : undefined
  },
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 24 * 60 * 60,
    errorLog: (error) => {
      console.error('Session store error:', error);
    }
  })
}));

// Authentication endpoints
app.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await storage.getUserByUsername(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Set session before streak calculation
    req.session.userId = user.id;
    
    // Calculate and update streak using daily login tracking
    const today = new Date();
    try {
      const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Record today's login (will be ignored if already exists due to UNIQUE constraint)
      await db.execute(sql`
        INSERT INTO daily_logins (user_id, login_date) 
        VALUES (${user.id}, ${todayDate})
        ON CONFLICT (user_id, login_date) DO NOTHING
      `);
      
      // Calculate current streak
      const streakResult = await db.execute(sql`
        WITH RECURSIVE consecutive_days AS (
          SELECT login_date, 1 as day_count
          FROM daily_logins
          WHERE user_id = ${user.id} AND login_date = ${todayDate}
          
          UNION ALL
          
          SELECT dl.login_date, cd.day_count + 1
          FROM daily_logins dl
          JOIN consecutive_days cd ON dl.login_date = cd.login_date - INTERVAL '1 day'
          WHERE dl.user_id = ${user.id}
        )
        SELECT MAX(day_count) as current_streak
        FROM consecutive_days
      `);
      
      const currentStreak = streakResult.rows[0]?.current_streak || 0;
      
      // Update user's streak and last active time if it changed
      if (currentStreak !== user.streak) {
        await storage.updateUser(user.id, {
          lastActive: new Date(),
          streak: currentStreak
        });
        console.log(`User ${user.id} streak updated from ${user.streak || 0} to ${currentStreak} days`);
      } else {
        await storage.updateUser(user.id, {
          lastActive: new Date()
        });
      }
      
    } catch (streakError) {
      console.error(`Error calculating streak for user ${user.id}:`, streakError);
      // Continue with login even if streak calculation fails
      await storage.updateUser(user.id, {
        lastActive: new Date()
      });
    }
    
    // Force session save
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
    
    // Get updated user data with new streak
    const updatedUser = await storage.getUser(user.id);
    const { password: _, ...userWithoutPassword } = updatedUser || user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;
  
  try {
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      points: 0,
      bearBucks: 0,
      streak: 0,
      level: 1,
      schoolId: 1
    });
    
    req.session.userId = newUser.id;
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logged out successfully" });
  });
});

app.get("/api/auth/clear-session", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Clear session error:', err);
        return res.status(500).json({ message: "Failed to clear session" });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Session cleared successfully" });
    });
  } else {
    res.status(200).json({ message: "No session to clear" });
  }
});

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

// Register all comprehensive routes from routes.ts
await registerRoutes(app);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup Vite for development
if (app.get("env") === "development") {
  setupVite(app, server);
} else {
  serveStatic(app);
}

// Start server
const port = process.env.PORT || 5000;
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`Educational game server running on port ${port}`);
});
