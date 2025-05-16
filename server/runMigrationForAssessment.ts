import { db, pool } from "./db";
import { sql } from "drizzle-orm";

// Function to run migration to add new column to assessments table
async function runMigration() {
  console.log("Starting assessment table migration...");
  
  try {
    // Check if categoryScores column exists
    const checkColumnSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assessments' 
      AND column_name = 'category_scores';
    `;
    
    const result = await pool.query(checkColumnSql);
    
    if (result.rowCount === 0) {
      console.log("Adding new categoryScores column to assessments table...");
      
      // Add the categoryScores column
      await db.execute(sql`
        ALTER TABLE assessments 
        ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS teacher_level TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NULL;
      `);
      
      console.log("Successfully added new columns to assessments table.");
    } else {
      console.log("categoryScores column already exists in assessments table. Migration not needed.");
    }
    
    // Update existing rows to prevent null errors
    await db.execute(sql`
      UPDATE assessments 
      SET category_scores = '[]'::jsonb 
      WHERE category_scores IS NULL;
    `);
  } catch (error) {
    console.error("Error during assessment table migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log("Assessment table migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Assessment table migration failed:", error);
    process.exit(1);
  });