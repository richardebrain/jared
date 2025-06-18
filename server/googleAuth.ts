import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import type { Express } from 'express';

export function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials not found, skipping Google Sign-In setup');
    return;
  }

  // Configure Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await storage.getUserByGoogleId?.(profile.id);
      
      if (user) {
        // User exists, update their profile info if needed
        await storage.updateUser(user.id, {
          firstName: profile.name?.givenName || user.firstName,
          lastName: profile.name?.familyName || user.lastName,
          email: profile.emails?.[0]?.value || user.email,
          profilePicture: profile.photos?.[0]?.value || user.profilePicture,
          lastActive: new Date()
        });
        
        return done(null, user);
      }

      // Check if user exists with the same email
      const existingUser = await storage.getUserByEmail?.(profile.emails?.[0]?.value || '');
      if (existingUser) {
        // Link Google account to existing user
        await storage.updateUser(existingUser.id, {
          googleId: profile.id,
          profilePicture: profile.photos?.[0]?.value || existingUser.profilePicture,
          lastActive: new Date()
        });
        
        return done(null, existingUser);
      }

      // Create new user
      const newUser = await storage.createUser({
        username: profile.emails?.[0]?.value || `google_${profile.id}`,
        firstName: profile.name?.givenName || 'Google',
        lastName: profile.name?.familyName || 'User',
        email: profile.emails?.[0]?.value || '',
        googleId: profile.id,
        profilePicture: profile.photos?.[0]?.value || null,
        language: 'English',
        nativeLanguage: 'English',
        timeZone: 'UTC-05:00',
        schoolId: 1, // Default to first school - this should be configurable
        password: '' // No password needed for OAuth users
      });

      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

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