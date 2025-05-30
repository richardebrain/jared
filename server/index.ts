import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

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

// Basic API routes for the game to work
const defaultUser = {
  id: 1,
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  points: 100,
  bearBucks: 10,
  streak: 5,
  level: 2
};

app.get('/api/auth/me', (req, res) => {
  res.json(defaultUser);
});

app.get('/api/user/current', (req, res) => {
  res.json(defaultUser);
});

app.get('/api/games/history', (req, res) => {
  res.json([]);
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

app.get('/api/users', (req, res) => {
  res.json([defaultUser]);
});

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
