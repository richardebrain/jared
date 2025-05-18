import { db } from "./db";
import { pgSchema, serial, timestamp, text, integer, boolean, pgTable } from "drizzle-orm/pg-core";
import { eq, and, sql } from "drizzle-orm";
import { users } from "@shared/schema";
import { Pool } from "@neondatabase/serverless";

/**
 * Migration script to add certification tracking and teacher message system
 * This adds expiration date fields for fingerprint, CPR, First Aid certifications
 * and creates a teacher message system for welcome messages and notifications.
 */
export async function runWelcomeMessageMigration() {
  console.log("Running welcome message and certification tracking migration...");
  try {
    // Step 1: Check if columns already exist
    const fingerprintColumnExists = await checkColumnExists("users", "fingerprint_expiration");
    const hasUnreadMessagesColumnExists = await checkColumnExists("users", "has_unread_messages");
    const messagesTableExists = await checkTableExists("teacher_messages");
    const shoutoutsTableExists = await checkTableExists("core_value_shoutouts");

    // Step 2: Add certification tracking columns if they don't exist
    if (!fingerprintColumnExists) {
      console.log("Adding certification tracking columns to users table...");
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN fingerprint_expiration DATE,
        ADD COLUMN cpr_expiration DATE,
        ADD COLUMN first_aid_expiration DATE,
        ADD COLUMN food_handler_expiration DATE
      `);
      console.log("Added certification tracking columns successfully");
    } else {
      console.log("Certification tracking columns already exist, skipping...");
    }

    // Step 3: Add has_unread_messages column if it doesn't exist
    if (!hasUnreadMessagesColumnExists) {
      console.log("Adding has_unread_messages column to users table...");
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN has_unread_messages BOOLEAN DEFAULT FALSE
      `);
      console.log("Added has_unread_messages column successfully");
    } else {
      console.log("has_unread_messages column already exists, skipping...");
    }

    // Step 4: Create teacher_messages table if it doesn't exist
    if (!messagesTableExists) {
      console.log("Creating teacher_messages table...");
      await db.execute(sql`
        CREATE TABLE teacher_messages (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          sender_id INTEGER REFERENCES users(id),
          recipient_id INTEGER REFERENCES users(id),
          message_type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          is_important BOOLEAN DEFAULT FALSE
        )
      `);
      console.log("Created teacher_messages table successfully");
    } else {
      console.log("teacher_messages table already exists, skipping...");
    }

    // Step 5: Create core_value_shoutouts table if it doesn't exist
    if (!shoutoutsTableExists) {
      console.log("Creating core_value_shoutouts table...");
      await db.execute(sql`
        CREATE TABLE core_value_shoutouts (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          nominator_id INTEGER REFERENCES users(id),
          nominee_id INTEGER REFERENCES users(id),
          core_value VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          points_awarded INTEGER DEFAULT 5
        )
      `);
      console.log("Created core_value_shoutouts table successfully");
    } else {
      console.log("core_value_shoutouts table already exists, skipping...");
    }

    console.log("Welcome message and certification tracking migration completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in welcome message migration:", error);
    return { success: false, error };
  }
}

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = ${table}
    AND column_name = ${column}
  `);
  return result.rows.length > 0;
}

/**
 * Helper function to check if a table exists
 */
async function checkTableExists(table: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = ${table}
  `);
  return result.rows.length > 0;
}