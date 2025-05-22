import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Updates the learning_modules table to add rating and community sharing fields
 */
export async function updateSchemaForRatings() {
  try {
    console.log("Checking for missing columns in learning_modules table...");
    
    // Check if average_rating column exists
    const averageRatingExists = await checkColumnExists('learning_modules', 'average_rating');
    if (!averageRatingExists) {
      console.log("Adding average_rating column to learning_modules table");
      await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN average_rating INTEGER DEFAULT 0`);
    }
    
    // Check if rating_count column exists
    const ratingCountExists = await checkColumnExists('learning_modules', 'rating_count');
    if (!ratingCountExists) {
      console.log("Adding rating_count column to learning_modules table");
      await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN rating_count INTEGER DEFAULT 0`);
    }
    
    // Check if is_shared_to_community column exists
    const isSharedExists = await checkColumnExists('learning_modules', 'is_shared_to_community');
    if (!isSharedExists) {
      console.log("Adding is_shared_to_community column to learning_modules table");
      await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN is_shared_to_community BOOLEAN DEFAULT FALSE`);
    }
    
    // Check if school_id column exists
    const schoolIdExists = await checkColumnExists('learning_modules', 'school_id');
    if (!schoolIdExists) {
      console.log("Adding school_id column to learning_modules table");
      await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN school_id INTEGER REFERENCES schools(id)`);
    }
    
    // Create module_ratings table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS module_ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        module_id INTEGER NOT NULL REFERENCES learning_modules(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id)
      )
    `);
    
    // Create community_modules table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_modules (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES learning_modules(id),
        shared_by_school_id INTEGER NOT NULL REFERENCES schools(id),
        shared_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active',
        total_completions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Schema update for module ratings and community sharing completed successfully");
    return true;
  } catch (error) {
    console.error("Error updating schema for ratings:", error);
    return false;
  }
}

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND column_name = ${columnName}
    `);
    
    // If we get any rows back, the column exists
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}