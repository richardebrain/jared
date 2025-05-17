// School migration script using ESM modules
import pkg from 'pg';
const { Pool } = pkg;

async function runSchoolMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add school support...');
    
    // First make sure schools table exists
    try {
      // Check if schools table exists
      const checkSchoolsTable = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'schools'
      `;
      
      const schoolsTableResult = await pool.query(checkSchoolsTable);
      
      if (schoolsTableResult.rows.length === 0) {
        console.log('schools table does not exist, creating it...');
        
        // Create schools table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS schools (
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
        
        console.log('schools table created successfully');
      }
    } catch (error) {
      console.error('Error checking/creating schools table:', error);
      throw error;
    }
    
    // Check if school_id column already exists in users table
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'school_id'
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('school_id column does not exist, creating it...');
      
      // Create school_id column
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN school_id INTEGER
      `);
      
      // Now add foreign key constraint
      await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_school_id
        FOREIGN KEY (school_id) REFERENCES schools(id)
      `);
      
      console.log('school_id column created successfully');
      
      // Check if Raising Arizona school exists
      console.log('Checking if Raising Arizona school exists...');
      try {
        const raisingArizonaSchoolQuery = `
          SELECT id FROM schools 
          WHERE LOWER(name) = LOWER('Raising Arizona Preschool')
        `;
        const schoolResult = await pool.query(raisingArizonaSchoolQuery);
        let schoolId;
        
        if (schoolResult.rows.length > 0) {
          schoolId = schoolResult.rows[0].id;
          console.log('Found Raising Arizona school with ID:', schoolId);
        } else {
          // Create Raising Arizona school
          console.log('Creating Raising Arizona school...');
          const insertSchoolQuery = `
            INSERT INTO schools (name, address, is_free_access, subscription_active, subscription_type) 
            VALUES ('Raising Arizona Preschool', '123 Main St, Phoenix, AZ', true, true, 'premium_branding') 
            RETURNING id
          `;
          const insertResult = await pool.query(insertSchoolQuery);
          schoolId = insertResult.rows[0].id;
          console.log('Created Raising Arizona school with ID:', schoolId);
        }
        
        // Update all existing users to belong to Raising Arizona
        console.log('Updating existing users to belong to Raising Arizona...');
        await pool.query(`
          UPDATE users
          SET school_id = $1
          WHERE school_id IS NULL
        `, [schoolId]);
        
        console.log('Migration completed successfully!');
      } catch (error) {
        console.error('Error setting up school or updating users:', error);
        throw error;
      }
    } else {
      console.log('school_id column already exists, no migration needed.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runSchoolMigration()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });