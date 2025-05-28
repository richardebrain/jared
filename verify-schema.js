import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifyTables() {
  try {
    console.log('Checking for assessment-related tables...\n');
    
    const tables = [
      'assessment_domains',
      'assessment_questions', 
      'assessment_responses',
      'question_availability',
      'assessment_config'
    ];
    
    for (const tableName of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      console.log(`✅ Table "${tableName}": ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    }
    
    // Check if assessments table has new fields
    console.log('\nChecking assessments table for new fields...');
    const assessmentColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assessments' 
      AND table_schema = 'public'
      AND column_name IN ('current_difficulty', 'difficulty_progression', 'domain_coverage')
    `);
    
    console.log(`✅ New assessment fields found: ${assessmentColumns.rows.length}/3`);
    assessmentColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('Error verifying tables:', error);
  } finally {
    await pool.end();
  }
}

verifyTables(); 