import { db } from "../db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";

export async function runAvatarMigration() {
  try {
    console.log("Starting avatar column migration...");
    
    // Check if active_avatar_id column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'active_avatar_id'
    `);

    if (result.rows.length === 0) {
      console.log("Adding active_avatar_id column to users table...");
      
      // Add the active_avatar_id column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS active_avatar_id INTEGER
      `);
      
      console.log("Avatar column migration completed successfully!");
    } else {
      console.log("active_avatar_id column already exists, skipping...");
    }
  } catch (error) {
    console.error("Error running avatar migration:", error);
  }
}