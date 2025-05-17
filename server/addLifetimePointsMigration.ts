import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add the lifetime_points column to the users table
 * This allows users to track total points earned throughout their time on the platform
 */
async function runLifetimePointsMigration() {
  console.log("Starting lifetime_points migration...");
  
  try {
    // Check if the column already exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'lifetime_points'
    `);
    
    if (checkColumnExists.rows && checkColumnExists.rows.length > 0) {
      console.log("Migration skipped: lifetime_points column already exists");
      return;
    }
    
    // Add lifetime_points column to the users table
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN lifetime_points INTEGER DEFAULT 0
    `);
    
    // Initialize lifetime_points with the same value as current points for existing users
    await db.execute(sql`
      UPDATE users 
      SET lifetime_points = COALESCE(points, 0)
      WHERE lifetime_points IS NULL
    `);
    
    console.log("Migration completed: lifetime_points column added successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

export { runLifetimePointsMigration };