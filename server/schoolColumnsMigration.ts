import { db, pool } from './db';
import { sql } from 'drizzle-orm';

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [tableName, columnName]);
  
  return result.rows.length > 0;
}

/**
 * Migration to add missing columns to the schools table
 */
export async function runSchoolColumnsMigration(): Promise<void> {
  console.log("Starting school columns migration...");
  
  // Check and add address column
  if (!await checkColumnExists('schools', 'address')) {
    console.log("Adding address column");
    await pool.query(`ALTER TABLE schools ADD COLUMN address TEXT`);
  }
  
  // Check and add city column
  if (!await checkColumnExists('schools', 'city')) {
    console.log("Adding city column");
    await pool.query(`ALTER TABLE schools ADD COLUMN city TEXT`);
  }
  
  // Check and add state column
  if (!await checkColumnExists('schools', 'state')) {
    console.log("Adding state column");
    await pool.query(`ALTER TABLE schools ADD COLUMN state TEXT`);
  }
  
  // Check and add zip_code column
  if (!await checkColumnExists('schools', 'zip_code')) {
    console.log("Adding zip_code column");
    await pool.query(`ALTER TABLE schools ADD COLUMN zip_code TEXT`);
  }
  
  // Check and add contact_email column
  if (!await checkColumnExists('schools', 'contact_email')) {
    console.log("Adding contact_email column");
    await pool.query(`ALTER TABLE schools ADD COLUMN contact_email TEXT`);
  }
  
  // Check and add contact_phone column
  if (!await checkColumnExists('schools', 'contact_phone')) {
    console.log("Adding contact_phone column");
    await pool.query(`ALTER TABLE schools ADD COLUMN contact_phone TEXT`);
  }
  
  // Check and add logo_url column
  if (!await checkColumnExists('schools', 'logo_url')) {
    console.log("Adding logo_url column");
    await pool.query(`ALTER TABLE schools ADD COLUMN logo_url TEXT`);
  }
  
  // Check and add website_url column
  if (!await checkColumnExists('schools', 'website_url')) {
    console.log("Adding website_url column");
    await pool.query(`ALTER TABLE schools ADD COLUMN website_url TEXT`);
  }
  
  // Check and add admin_password_hash column
  if (!await checkColumnExists('schools', 'admin_password_hash')) {
    console.log("Adding admin_password_hash column");
    await pool.query(`ALTER TABLE schools ADD COLUMN admin_password_hash TEXT`);
  }
  
  console.log("School columns migration completed successfully");
}

// For direct execution through ESM
// This file is an ES module, not CommonJS
// So we don't need the require.main check