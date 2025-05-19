import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seedDb";
// Import our migration functions
import { runSchoolMigration } from "./runMigration";
import { runSchoolColumnsMigration } from "./schoolColumnsMigration";
import { runCertificationMigration } from "./certificationMigration";
// Import module management system
import { ModuleManager } from "./module-management/moduleManager";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Run migrations
      console.log('Running school migration...');
      runSchoolMigration()
        .then(() => {
          console.log('School migration completed successfully');
          
          // Run the school columns migration
          console.log('Running school columns migration...');
          return runSchoolColumnsMigration();
        })
        .then(() => {
          console.log('School columns migration completed successfully');
          
          // Run the lifetime points migration
          console.log('Running lifetime points migration...');
          return import('./addLifetimePointsMigration').then(module => module.runLifetimePointsMigration());
        })
        .then(() => {
          console.log('Lifetime points migration completed successfully');
          
          // Run the welcome message migration
          console.log('Running welcome message migration...');
          return import('./welcomeMessageMigration').then(module => module.runWelcomeMessageMigration());
        })
        .then(() => {
          console.log('Welcome message migration completed successfully');
          
          // Run the certification tracking migration
          console.log('Running certification tracking migration...');
          return runCertificationMigration();
        })
        .then(() => {
          console.log('Certification tracking migration completed successfully');
          
          // Then seed the database with initial data
          console.log('Seeding database...');
          return seedDatabase()
            .then(() => {
              // Run module system verification to ensure essential modules don't disappear
              console.log('Verifying essential training modules...');
              return ModuleManager.runStartupVerification();
            });
        })
        .catch(err => {
          console.error("Error during migration or seeding:", err);
        });
    });
  } catch (error) {
    console.error("Error during server startup:", error);
  }
})();
