
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: {
    userId?: number;
  };
}

export const checkAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for session-based auth first
    if (req.session?.userId) {
      const user = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (user?.length) {
        req.user = user[0];
        return next();
      }
    }

    // Check for JWT token in Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET as string) as { userId: number };
    const user = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user?.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
