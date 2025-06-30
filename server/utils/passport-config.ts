import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from "passport-local";
import { sanitizeUser } from "../utils/helper";
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import bcrypt from "bcrypt";
import { storage } from '../storage';


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

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`
    : "http://localhost:5000/api/auth/google/callback"
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

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      session: true,
      passReqToCallback: true,
    },
    function (req, username, password, done) {
      console.log("Local Strategy called with email:", username);
      db.query.users
        .findFirst({
          where: eq(users.username, username),
        })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }
          // Here you would normally check the password
          const comparePassword = bcrypt.compareSync(password, user.password!);
          if (!comparePassword) {
            return done(null, false, { message: "Incorrect password." });
          }

          console.log("User authenticated:", user);
          return done(null, sanitizeUser(user));
        })
        .catch((err) => {
          console.log("Error in Local Strategy:", err);
          return done(err);
        });
    }
  )
);



  export default passport;