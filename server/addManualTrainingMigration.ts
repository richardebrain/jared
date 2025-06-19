import { sql } from "drizzle-orm";
import { db } from "./db";

export async function addManualTrainingFields() {
  console.log("Adding manual training fields to ece_hours table...");
  
  try {
    // Add trainingType field to distinguish online vs in-person training
    await db.execute(sql`
      ALTER TABLE ece_hours 
      ADD COLUMN IF NOT EXISTS training_type VARCHAR(50) DEFAULT 'online' NOT NULL
    `);
    
    // Add trainingLocation field for in-person training venues
    await db.execute(sql`
      ALTER TABLE ece_hours 
      ADD COLUMN IF NOT EXISTS training_location VARCHAR(200)
    `);
    
    // Add addedBy field to track who manually added the hours
    await db.execute(sql`
      ALTER TABLE ece_hours 
      ADD COLUMN IF NOT EXISTS added_by INTEGER REFERENCES users(id)
    `);
    
    console.log("✓ Manual training fields added successfully");
  } catch (error) {
    console.error("Error adding manual training fields:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
addManualTrainingFields()
  .then(() => {
    console.log("Manual training migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });