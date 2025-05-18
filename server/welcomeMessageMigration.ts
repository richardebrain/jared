import { db } from "./db";
import { boolean, integer, json, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { schools, users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Migration script to add welcome message and certification tracking system
 * Creates a teacher_messages table for welcome messages, shout-outs, and certification alerts
 */
async function runWelcomeMessageMigration() {
  console.log("Starting welcome message migration...");
  
  try {
    // Check if table already exists to avoid errors
    const hasMessagesTable = await checkTableExists('teacher_messages');
    
    if (!hasMessagesTable) {
      // Create teacher_messages table
      await db.execute(`
        CREATE TABLE teacher_messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          recipient_id INTEGER NOT NULL REFERENCES users(id),
          school_id INTEGER REFERENCES schools(id),
          message_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          important BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMP,
          related_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Created teacher_messages table");
    }

    // Check if certification columns exist in users table
    const hasFingerprint = await checkColumnExists('users', 'fingerprint_expiration');
    const hasCpr = await checkColumnExists('users', 'cpr_expiration');
    const hasFirstAid = await checkColumnExists('users', 'first_aid_expiration');
    const hasFoodHandler = await checkColumnExists('users', 'food_handler_expiration');
    const hasJobTitle = await checkColumnExists('users', 'job_title');
    const hasDesignations = await checkColumnExists('users', 'designations');
    const hasUnreadMessages = await checkColumnExists('users', 'has_unread_messages');

    // Add certification tracking fields to users table if not already present
    if (!hasFingerprint) {
      await db.execute(`ALTER TABLE users ADD COLUMN fingerprint_expiration DATE;`);
      console.log("Added fingerprint_expiration column to users table");
    }
    
    if (!hasCpr) {
      await db.execute(`ALTER TABLE users ADD COLUMN cpr_expiration DATE;`);
      console.log("Added cpr_expiration column to users table");
    }
    
    if (!hasFirstAid) {
      await db.execute(`ALTER TABLE users ADD COLUMN first_aid_expiration DATE;`);
      console.log("Added first_aid_expiration column to users table");
    }
    
    if (!hasFoodHandler) {
      await db.execute(`ALTER TABLE users ADD COLUMN food_handler_expiration DATE;`);
      console.log("Added food_handler_expiration column to users table");
    }
    
    if (!hasJobTitle) {
      await db.execute(`ALTER TABLE users ADD COLUMN job_title TEXT;`);
      console.log("Added job_title column to users table");
    }
    
    if (!hasDesignations) {
      await db.execute(`ALTER TABLE users ADD COLUMN designations JSONB DEFAULT '[]'::jsonb;`);
      console.log("Added designations column to users table");
    }
    
    if (!hasUnreadMessages) {
      await db.execute(`ALTER TABLE users ADD COLUMN has_unread_messages BOOLEAN DEFAULT FALSE;`);
      console.log("Added has_unread_messages column to users table");
    }

    // Create sample welcome messages for each user
    const allUsers = await db.query.users.findMany();
    const admin = allUsers.find(user => user.isAdmin || user.isSchoolAdmin || user.isOwner);
    
    if (admin) {
      for (const user of allUsers) {
        if (user.id !== admin.id) {
          // Create a welcome message for each user
          await db.execute(`
            INSERT INTO teacher_messages 
            (sender_id, recipient_id, school_id, message_type, title, content, is_read, important)
            VALUES (
              $1, $2, $3, 'welcome', 'Welcome to MentorMe!', 
              'Hello ${user.firstName},\n\nWelcome to MentorMe! We''re excited to have you join our professional development platform. Your journey to becoming a better educator starts here.\n\nExplore the available learning modules and earn points to advance your teaching career.\n\nBest regards,\nThe MentorMe Team',
              false, true
            )
          `, [admin.id, user.id, user.schoolId]);
          
          // Set the has_unread_messages flag to true for each user
          await db.update(users)
            .set({ hasUnreadMessages: true })
            .where(eq(users.id, user.id));
        }
      }
      console.log("Created welcome messages for users");
    }

    console.log("Welcome message migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Helper function to check if a column exists
async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute(`
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = '${table}' AND column_name = '${column}';
  `);
  
  return result.rowCount > 0;
}

// Helper function to check if a table exists
async function checkTableExists(table: string): Promise<boolean> {
  const result = await db.execute(`
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = '${table}';
  `);
  
  return result.rowCount > 0;
}

export { runWelcomeMessageMigration };