import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Adds the missing columns for module ratings and community sharing
 */
async function fixSchema() {
  console.log("Starting schema fixes for module ratings and community sharing...");
  
  try {
    // Add average_rating column
    console.log("Adding average_rating column...");
    await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS average_rating INTEGER DEFAULT 0`);
    
    // Add rating_count column
    console.log("Adding rating_count column...");
    await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0`);
    
    // Add is_shared_to_community column
    console.log("Adding is_shared_to_community column...");
    await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS is_shared_to_community BOOLEAN DEFAULT FALSE`);
    
    // Add school_id column
    console.log("Adding school_id column...");
    await db.execute(sql`ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS school_id INTEGER`);
    
    // Create module_ratings table
    console.log("Creating module_ratings table...");
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
    
    // Create community_modules table
    console.log("Creating community_modules table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_modules (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES learning_modules(id),
        shared_by_school_id INTEGER NOT NULL REFERENCES schools(id),
        shared_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        total_completions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Schema fixes completed successfully");
  } catch (error) {
    console.error("Error fixing schema:", error);
  }
}

// Run the fix
fixSchema().then(() => {
  console.log("Schema update process complete");
  process.exit(0);
}).catch(error => {
  console.error("Schema update failed:", error);
  process.exit(1);
});