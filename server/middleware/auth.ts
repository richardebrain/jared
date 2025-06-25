import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔐 Auth middleware triggered for: ${req.method} ${req.path}`);
  console.log(`Auth check - Session ID: ${req.sessionID}`);
  console.log(`Auth check - Session userId: ${req.session?.userId || 'No userId'}`);
  console.log(`Auth check - Session data:`, req.session);
  
  if (!req.session || !req.session.userId) {
    console.log(`❌ Auth failed - No userId in session`);
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.log(`❌ Auth failed - User ${userId} not found in database`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log(`✅ Auth successful for user: ${user.username}`);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};