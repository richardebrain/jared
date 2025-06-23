import { db } from "./db";
import { sql } from "drizzle-orm";

export async function addTutorialCompletionField() {
  console.log("Adding tutorial completion field to users table...");
  
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'has_completed_tutorial'
    `);
    
    if (result.rows.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN has_completed_tutorial BOOLEAN DEFAULT FALSE
      `);
      console.log("Tutorial completion field added successfully");
    } else {
      console.log("Tutorial completion field already exists, skipping...");
    }
  } catch (error) {
    console.error("Error adding tutorial completion field:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTutorialCompletionField()
    .then(() => {
      console.log("Tutorial completion migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Tutorial completion migration failed:", error);
      process.exit(1);
    });
}