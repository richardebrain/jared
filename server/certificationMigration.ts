import { db, pool } from "./db";

/**
 * Migration script to add certification tracking fields to the users table
 * This adds expiration date fields for fingerprint, CPR, First Aid and Food Handler certifications
 */
export async function runCertificationMigration() {
  console.log("Starting certification migration...");
  
  try {
    // Check if the columns already exist
    if (!(await checkColumnExists("users", "fingerprint_expiration"))) {
      console.log("Adding fingerprint_expiration column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN fingerprint_expiration DATE
      `);
    }
    
    if (!(await checkColumnExists("users", "cpr_expiration"))) {
      console.log("Adding cpr_expiration column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN cpr_expiration DATE
      `);
    }
    
    if (!(await checkColumnExists("users", "first_aid_expiration"))) {
      console.log("Adding first_aid_expiration column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN first_aid_expiration DATE
      `);
    }
    
    if (!(await checkColumnExists("users", "food_handler_expiration"))) {
      console.log("Adding food_handler_expiration column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN food_handler_expiration DATE
      `);
    }
    
    if (!(await checkColumnExists("users", "job_title"))) {
      console.log("Adding job_title column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN job_title TEXT
      `);
    }
    
    if (!(await checkColumnExists("users", "designations"))) {
      console.log("Adding designations column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN designations JSONB DEFAULT '[]'
      `);
    }
    
    if (!(await checkColumnExists("users", "has_unread_messages"))) {
      console.log("Adding has_unread_messages column to users table");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN has_unread_messages BOOLEAN DEFAULT FALSE
      `);
    }

    console.log("Certification migration completed successfully");
    return true;
  } catch (error) {
    console.error("Error running certification migration:", error);
    return false;
  }
}

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2
    )
  `, [table, column]);
  
  return result.rows[0].exists;
}