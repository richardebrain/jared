import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration to add the 'type' column to the assessments table
 * This allows us to identify self-assessments vs standard assessments
 * 
 * Using a direct SQL approach for maximum reliability
 */
export async function addTypeToAssessmentsTable() {
  console.log("Starting assessment type column migration...");
  
  try {
    // Use a more reliable method to add the column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'assessments' 
          AND column_name = 'type'
        ) THEN 
          ALTER TABLE assessments ADD COLUMN type TEXT DEFAULT 'standard'; 
        END IF; 
      END $$;
    `);
    
    console.log("Successfully completed type column migration for assessments table");
  } catch (error) {
    console.error("Error during assessment type column migration:", error);
    throw error;
  }
}