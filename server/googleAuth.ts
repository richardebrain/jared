

import { storage } from './storage';
import type { Express } from 'express';
import passport from 'passport';





export function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials not found, skipping Google Sign-In setup');
    return;
  }






  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
      // Successful authentication
      const user = req.user as any;
      
      // Set session data
      req.session.userId = user.id;
      req.session.loginTime = new Date().toISOString();
      
      // Update streak and award points for daily login
      try {
        await storage.updateDailyStreak?.(user.id);
      } catch (error) {
        console.error('Error updating streak for Google login:', error);
      }

      // Redirect to dashboard
      res.redirect('/dashboard');
    }
  );
}


