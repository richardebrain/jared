import { db } from "./db";
import { boolean, date, integer, json, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { schools, users } from "../shared/schema";

/**
 * Migration script to add certification tracking and teacher message system
 * This adds expiration date fields for fingerprint, CPR, First Aid certifications
 * and creates a teacher message system for welcome messages and notifications.
 */
async function addCertificationsAndMessagesSchema() {
  console.log("Starting migration to add certifications and messages schema...");
  
  try {
    // Check if columns already exist to avoid errors
    const hasFingerprint = await checkColumnExists('users', 'fingerprint_expiration');
    const hasCpr = await checkColumnExists('users', 'cpr_expiration');
    const hasFirstAid = await checkColumnExists('users', 'first_aid_expiration');
    const hasFoodHandler = await checkColumnExists('users', 'food_handler_expiration');
    const hasJobTitle = await checkColumnExists('users', 'job_title');
    const hasDesignations = await checkColumnExists('users', 'designations');
    const hasUnreadMessages = await checkColumnExists('users', 'has_unread_messages');

    // 1. Add certification tracking fields to users table
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

    // 2. Create teacher_messages table if it doesn't exist
    const hasMessagesTable = await checkTableExists('teacher_messages');
    if (!hasMessagesTable) {
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
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Created teacher_messages table");
    }

    console.log("Migration completed successfully!");
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
    WHERE table_name = $1 AND column_name = $2;
  `, [table, column]);
  
  return result.rowCount > 0;
}

// Helper function to check if a table exists
async function checkTableExists(table: string): Promise<boolean> {
  const result = await db.execute(`
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = $1;
  `, [table]);
  
  return result.rowCount > 0;
}

export { addCertificationsAndMessagesSchema };