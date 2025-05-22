import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration to add the 'type' column to the assessments table
 * This allows us to identify self-assessments vs standard assessments
 */
export async function addTypeToAssessmentsTable() {
  console.log("Starting assessment type column migration...");
  
  try {
    // Check if the column already exists to avoid errors
    const columnExists = await checkColumnExists("assessments", "type");
    
    if (columnExists) {
      console.log("Type column already exists in assessments table. Skipping migration.");
      return;
    }
    
    // Add the type column with a default value of 'standard'
    await db.execute(sql`
      ALTER TABLE assessments 
      ADD COLUMN type TEXT DEFAULT 'standard'
    `);
    
    console.log("Successfully added 'type' column to assessments table");
  } catch (error) {
    console.error("Error adding type column to assessments table:", error);
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = ${tableName} 
    AND column_name = ${columnName}
  `);
  
  return result.rowCount > 0;
}