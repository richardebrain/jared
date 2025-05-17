import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { db, pool } from './db';
import { sql } from 'drizzle-orm';

/**
 * Helper function to check if a table exists in the database
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = $1
  `, [tableName]);
  
  return result.rows.length > 0;
}

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
 * Migration to add school_id column to users table
 * and create schools table if it doesn't exist
 */
export async function runSchoolMigration(): Promise<void> {
  try {
    console.log('Starting school migration...');
    
    // 1. Check if schools table exists
    const schoolsTableExists = await checkTableExists('schools');
    
    if (!schoolsTableExists) {
      console.log('Creating schools table...');
      await pool.query(`
        CREATE TABLE schools (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          is_free_access BOOLEAN DEFAULT FALSE,
          subscription_active BOOLEAN DEFAULT FALSE,
          subscription_type TEXT,
          subscription_started_at TIMESTAMP,
          subscription_expires_at TIMESTAMP
        )
      `);
      console.log('Schools table created');
    }
    
    // 2. Check if school_id column exists in users table
    const schoolIdExists = await checkColumnExists('users', 'school_id');
    
    if (!schoolIdExists) {
      console.log('Adding school_id column to users table...');
      
      // Add column first without constraints
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN school_id INTEGER
      `);
      
      // Add foreign key constraint
      await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_school_id
        FOREIGN KEY (school_id) REFERENCES schools(id)
      `);
      
      console.log('Added school_id column with foreign key constraint');
      
      // 3. Create Raising Arizona school if it doesn't exist
      const raisingArizonaResult = await pool.query(`
        SELECT id FROM schools 
        WHERE LOWER(name) = LOWER('Raising Arizona Preschool')
      `);
      
      let schoolId: number;
      
      if (raisingArizonaResult.rows.length === 0) {
        console.log('Creating Raising Arizona school...');
        const schoolResult = await pool.query(`
          INSERT INTO schools (name, address, is_free_access, subscription_active, subscription_type) 
          VALUES ('Raising Arizona Preschool', '123 Main St, Phoenix, AZ', true, true, 'premium_branding') 
          RETURNING id
        `);
        
        schoolId = schoolResult.rows[0].id;
        console.log(`Created Raising Arizona school with ID: ${schoolId}`);
      } else {
        schoolId = raisingArizonaResult.rows[0].id;
        console.log(`Found existing Raising Arizona school with ID: ${schoolId}`);
      }
      
      // 4. Update all existing users to belong to Raising Arizona
      console.log('Updating existing users to belong to Raising Arizona...');
      await pool.query(`
        UPDATE users
        SET school_id = $1
        WHERE school_id IS NULL
      `, [schoolId]);
      
      console.log('Migration complete: All users now belong to Raising Arizona school');
    } else {
      console.log('Migration skipped: school_id column already exists');
    }
  } catch (error) {
    console.error('Error during school migration:', error);
    throw error;
  }
}