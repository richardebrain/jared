import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Configuration constants
const MAX_CONCURRENT_SESSIONS = 3; // Allow up to 3 active sessions per user
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Enhanced session security middleware for ECE platform
 * Implements concurrent session limits and activity monitoring
 */
export class SessionSecurityManager {
  private static instance: SessionSecurityManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSessionCleanup();
  }

  static getInstance(): SessionSecurityManager {
    if (!SessionSecurityManager.instance) {
      SessionSecurityManager.instance = new SessionSecurityManager();
    }
    return SessionSecurityManager.instance;
  }

  /**
   * Check concurrent session limits for a user
   */
  async checkConcurrentSessions(userId: number): Promise<{ allowed: boolean; activeSessions: number }> {
    try {
      // Count active sessions for this user
      const result = await db.execute(sql`
        SELECT COUNT(*) as session_count
        FROM sessions 
        WHERE sess::json->>'userId' = ${userId.toString()}
        AND expire > NOW()
      `);

      const activeSessions = parseInt(result.rows[0]?.session_count as string) || 0;
      const allowed = activeSessions < MAX_CONCURRENT_SESSIONS;

      console.log(`User ${userId} has ${activeSessions} active sessions. Limit: ${MAX_CONCURRENT_SESSIONS}`);

      return { allowed, activeSessions };
    } catch (error) {
      console.error('Error checking concurrent sessions:', error);
      // Allow login on error to prevent blocking users
      return { allowed: true, activeSessions: 0 };
    }
  }

  /**
   * Clean up oldest sessions when limit is exceeded
   */
  async enforceSessionLimit(userId: number): Promise<void> {
    try {
      // Get all sessions for this user, ordered by last access
      const sessions = await db.execute(sql`
        SELECT sid, sess, expire
        FROM sessions 
        WHERE sess::json->>'userId' = ${userId.toString()}
        AND expire > NOW()
        ORDER BY COALESCE(
          (sess::json->>'lastActivity')::timestamp,
          (sess::json->>'loginTime')::timestamp,
          NOW() - INTERVAL '1 day'
        ) ASC
      `);

      // If we have too many sessions, remove the oldest ones
      if (sessions.rows.length >= MAX_CONCURRENT_SESSIONS) {
        const sessionsToRemove = sessions.rows.length - MAX_CONCURRENT_SESSIONS + 1;
        
        for (let i = 0; i < sessionsToRemove; i++) {
          const sessionId = sessions.rows[i].sid;
          await db.execute(sql`DELETE FROM sessions WHERE sid = ${sessionId}`);
          console.log(`Removed old session ${sessionId} for user ${userId} due to concurrent session limit`);
        }
      }
    } catch (error) {
      console.error('Error enforcing session limit:', error);
    }
  }

  /**
   * Get session statistics for monitoring
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    usersWithMultipleSessions: number;
    oldestSession: string | null;
  }> {
    try {
      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total_sessions
        FROM sessions 
        WHERE expire > NOW()
      `);

      const multipleSessionsResult = await db.execute(sql`
        SELECT COUNT(DISTINCT sess::json->>'userId') as users_with_multiple
        FROM sessions 
        WHERE expire > NOW()
        GROUP BY sess::json->>'userId'
        HAVING COUNT(*) > 1
      `);

      const oldestResult = await db.execute(sql`
        SELECT MIN(COALESCE(
          (sess::json->>'loginTime')::timestamp,
          NOW() - INTERVAL '1 day'
        )) as oldest_session
        FROM sessions 
        WHERE expire > NOW()
      `);

      return {
        totalActiveSessions: parseInt(totalResult.rows[0]?.total_sessions as string) || 0,
        usersWithMultipleSessions: multipleSessionsResult.rows.length || 0,
        oldestSession: oldestResult.rows[0]?.oldest_session as string || null
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalActiveSessions: 0,
        usersWithMultipleSessions: 0,
        oldestSession: null
      };
    }
  }

  /**
   * Start automatic session cleanup
   */
  private startSessionCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        // Clean up expired sessions
        const result = await db.execute(sql`
          DELETE FROM sessions 
          WHERE expire <= NOW()
        `);
        
        console.log(`Session cleanup: Removed ${result.rowCount || 0} expired sessions`);

        // Log session statistics
        const stats = await this.getSessionStats();
        console.log(`Session stats: ${stats.totalActiveSessions} active sessions, ${stats.usersWithMultipleSessions} users with multiple sessions`);
      } catch (error) {
        console.error('Error in session cleanup:', error);
      }
    }, SESSION_CLEANUP_INTERVAL);

    console.log('Session security manager started with automatic cleanup');
  }

  /**
   * Stop automatic cleanup (for graceful shutdown)
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session security manager stopped');
    }
  }
}

/**
 * Middleware to check concurrent session limits during login
 */
export const checkConcurrentSessionsMiddleware = async (
  req: Request & { userId?: number },
  res: Response,
  next: NextFunction
) => {
  if (req.userId) {
    const sessionManager = SessionSecurityManager.getInstance();
    const { allowed, activeSessions } = await sessionManager.checkConcurrentSessions(req.userId);

    if (!allowed) {
      // Enforce session limit by cleaning up old sessions
      await sessionManager.enforceSessionLimit(req.userId);
      console.log(`Enforced session limit for user ${req.userId}`);
    }

    // Add session info to request for logging
    (req as any).sessionInfo = { activeSessions, maxAllowed: MAX_CONCURRENT_SESSIONS };
  }
  
  next();
};

/**
 * Middleware to log session activity
 */
export const sessionActivityLogger = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId && req.path.startsWith('/api/')) {
    const userId = req.session.userId;
    const sessionId = req.session.id;
    const endpoint = req.path;
    
    // Log activity (can be extended for detailed monitoring)
    console.log(`Session activity - User: ${userId}, Session: ${sessionId?.substring(0, 8)}..., Endpoint: ${endpoint}`);
  }
  
  next();
};

// Export singleton instance
export const sessionSecurity = SessionSecurityManager.getInstance();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  sessionSecurity.stop();
});

process.on('SIGINT', () => {
  sessionSecurity.stop();
});