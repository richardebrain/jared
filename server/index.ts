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
app.get('/api/user/current', (req, res) => {
  // Return a default user for the game
  res.json({
    id: 1,
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    points: 100,
    bearBucks: 10,
    streak: 5,
    level: 2
  });
});

app.post('/api/games/save-score', (req, res) => {
  // Accept game scores without saving to database
  res.json({ success: true, message: "Score saved successfully" });
});

app.get('/api/games/leaderboard', (req, res) => {
  // Return empty leaderboard for now
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
