import type { Express, Request, Response, NextFunction } from "express";

// Security middleware to prevent common vulnerabilities
export function setupSecurityMiddleware(app: Express) {
  // Add security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy for privacy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy (relaxed for development)
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "media-src 'self' https:;"
    );
    
    next();
  });

  // Rate limiting for sensitive endpoints
  const attemptTracker = new Map<string, { count: number; resetTime: number }>();
  
  // Apply rate limiting specifically to login endpoint
  const rateLimitLogin = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const clientId = Array.isArray(ip) ? ip[0] : ip.toString();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    
    let attempts = attemptTracker.get(clientId);
    
    if (!attempts || now > attempts.resetTime) {
      attempts = { count: 0, resetTime: now + windowMs };
      attemptTracker.set(clientId, attempts);
    }
    
    if (attempts.count >= maxAttempts) {
      return res.status(429).json({
        message: "Too many login attempts",
        details: "Please wait 15 minutes before trying again"
      });
    }
    
    attempts.count++;
    attemptTracker.set(clientId, attempts);
    
    next();
  };
  
  app.use('/api/auth/login', rateLimitLogin);

  // Input validation middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Check for potentially dangerous input patterns
    const checkForDangerousInput = (obj: any): boolean => {
      if (typeof obj === 'string') {
        // Check for SQL injection patterns
        const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;
        // Check for XSS patterns
        const xssPatterns = /<script|javascript:|on\w+=/i;
        
        return sqlPatterns.test(obj) || xssPatterns.test(obj);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(checkForDangerousInput);
      }
      
      return false;
    };
    
    if (req.body && checkForDangerousInput(req.body)) {
      return res.status(400).json({
        message: "Invalid input detected",
        details: "Please check your input and try again"
      });
    }
    
    next();
  });

  // Remove sensitive headers from responses
  app.disable('x-powered-by');
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
  });
}