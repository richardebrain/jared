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
  name: 'mentorme.sid',
  cookie: { 
    secure: false, // Allow HTTP for Replit deployment
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: "lax",
    path: '/'
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
    
    // Create a separate mini-server for direct login to bypass Vite issues
    const loginApp = express();
    loginApp.use(express.json());
    
    // Add CORS middleware for cross-origin requests
    loginApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // Use same session configuration as main app
    loginApp.use(session({
      secret: process.env.SESSION_SECRET || "mentor-me-secret-dev-only",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      name: 'mentorme.sid',
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
        errorLog: (error) => {
          console.error('Login server session store error:', error);
        }
      })
    }));
    
    loginApp.post('/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        console.log(`Login attempt for username: ${username}`);
        
        if (!username || !password) {
          console.log('Missing username or password');
          return res.status(400).json({ message: "Username and password required" });
        }

        // Demo user bypass
        if (username === "jlcookie20" && password === "password") {
          console.log('Demo user login detected');
          const user = await storage.getUserByUsername(username);
          if (user) {
            req.session.userId = user.id;
            return res.json({
              id: user.id,
              username: user.username,
              email: user.email,
              schoolId: user.schoolId
            });
          }
        }

        const user = await storage.getUserByUsername(username);
        console.log(`User found: ${user ? 'YES' : 'NO'}`);
        
        if (!user) {
          console.log(`No user found for username: ${username}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log('Checking password with bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`Password valid: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log('Password validation failed');
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Set session
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Login failed" });
          }
          
          console.log(`Login successful for user ID: ${user.id}`);
          res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            schoolId: user.schoolId
          });
        });
      } catch (error) {
        console.error('Direct login error:', error);
        res.status(500).json({ message: "Login failed" });
      }
    });

    const loginServer = loginApp.listen(5001, "0.0.0.0", () => {
      console.log("Direct login server running on port 5001");
    });

    // Register all comprehensive routes from routes.ts
    await registerRoutes(app, false); // Enable auth endpoints

    // Catch-all for unhandled API routes (must come after all API route registrations)
    app.use('/api/*', (req, res) => {
      console.log(`Unhandled API route: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        message: `API endpoint ${req.originalUrl} not found`,
        method: req.method,
        path: req.originalUrl 
      });
    });

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite for development
    if (process.env.NODE_ENV === "development") {
      setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`Educational game server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
