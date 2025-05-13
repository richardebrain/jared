import { pool } from "./db";

async function updateAssessmentSchema() {
  console.log("Starting assessment schema update...");
  
  try {
    // Add the personalized_learning_path column to the assessments table if it doesn't exist
    await pool.query(`
      ALTER TABLE assessments 
      ADD COLUMN IF NOT EXISTS personalized_learning_path JSONB DEFAULT NULL;
    `);
    
    console.log("Successfully updated assessment schema!");
  } catch (error) {
    console.error("Error updating assessment schema:", error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the migration
updateAssessmentSchema();