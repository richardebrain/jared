import { db, pool } from './db';
import { eq, sql } from 'drizzle-orm';
import { users } from '@shared/schema';

/**
 * Migration script to add school_id column to the users table
 * and set Raising Arizona as the default school for existing users
 */
async function runSchoolIdMigration() {
  console.log('Starting school_id migration...');
  
  try {
    // Check if school_id column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'school_id'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Adding school_id column to users table...');
      
      // Add the school_id column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id)
      `);
      
      console.log('Column added successfully');
      
      // Find or create Raising Arizona school
      const raisingArizonaSchool = await db.query.schools.findFirst({
        where: eq(sql`LOWER(name)`, 'raising arizona preschool')
      });
      
      let schoolId: number;
      
      if (raisingArizonaSchool) {
        console.log('Found Raising Arizona school with ID:', raisingArizonaSchool.id);
        schoolId = raisingArizonaSchool.id;
      } else {
        // Create Raising Arizona school
        console.log('Creating Raising Arizona school...');
        const [newSchool] = await db.insert(schools)
          .values({
            name: 'Raising Arizona Preschool',
            address: '123 Main St, Phoenix, AZ',
            isFreeAccess: true, // Always free access for Raising Arizona
            subscriptionActive: true,
            subscriptionType: 'premium_branding'
          })
          .returning();
        
        schoolId = newSchool.id;
        console.log('Created Raising Arizona school with ID:', schoolId);
      }
      
      // Update all existing users to belong to Raising Arizona
      console.log('Updating existing users to belong to Raising Arizona...');
      await db.update(users)
        .set({ 
          schoolId: schoolId 
        })
        .where(sql`school_id IS NULL`);
      
      console.log('Migration completed successfully!');
    } else {
      console.log('school_id column already exists, no migration needed.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    console.log('Migration process completed');
  }
}

// Only run the migration if this script is executed directly
if (require.main === module) {
  runSchoolIdMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runSchoolIdMigration };