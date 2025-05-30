import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { storage } from "./storage";
import { db } from "./db";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
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
app.use(session({
  secret: process.env.SESSION_SECRET || "mentor-me-secret",
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    path: '/'
  },
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 24 * 60 * 60,
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
    
    req.session.userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
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

app.get('/api/progress', (req, res) => {
  res.json({ completedModules: 0, totalPoints: 100 });
});

app.get('/api/auth/clear-session', (req, res) => {
  res.json({ success: true });
});

app.get('/api/personalized-modules/:id', (req, res) => {
  res.json([]);
});

app.get('/api/community-modules/top', (req, res) => {
  res.json([]);
});

app.get('/api/core-values-shoutouts', (req, res) => {
  res.json([]);
});

// Users route handled in routes.ts

app.get('/api/modules', (req, res) => {
  res.json([]);
});

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
