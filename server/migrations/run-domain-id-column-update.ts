import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Manual migration to update domainId columns from text to integer
 * This is safer than drizzle-kit push when other contributors have made schema changes
 */

async function updateDomainIdColumnTypes() {
  console.log('🔄 Starting domainId column type update...');
  
  try {
    // Step 1: Update assessment_questions.domain_id column
    console.log('📝 Updating assessment_questions.domain_id column type...');
    await db.execute(sql`
      ALTER TABLE assessment_questions 
      ALTER COLUMN domain_id TYPE integer 
      USING domain_id::integer
    `);
    
    // Step 2: Add foreign key constraint for assessment_questions.domain_id
    console.log('🔗 Adding foreign key constraint for assessment_questions.domain_id...');
    await db.execute(sql`
      ALTER TABLE assessment_questions 
      ADD CONSTRAINT assessment_questions_domain_id_fkey 
      FOREIGN KEY (domain_id) REFERENCES assessment_domains(id)
    `);
    
    // Step 3: Update assessment_responses.domain_id column
    console.log('📝 Updating assessment_responses.domain_id column type...');
    await db.execute(sql`
      ALTER TABLE assessment_responses 
      ALTER COLUMN domain_id TYPE integer 
      USING domain_id::integer
    `);
    
    // Step 4: Add foreign key constraint for assessment_responses.domain_id
    console.log('🔗 Adding foreign key constraint for assessment_responses.domain_id...');
    await db.execute(sql`
      ALTER TABLE assessment_responses 
      ADD CONSTRAINT assessment_responses_domain_id_fkey 
      FOREIGN KEY (domain_id) REFERENCES assessment_domains(id)
    `);
    
    // Verify the changes
    console.log('🔍 Verifying column type changes...');
    const columnTypes = await db.execute(sql`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('assessment_questions', 'assessment_responses') 
      AND column_name = 'domain_id'
    `);
    
    console.log('📊 Column types after update:');
    columnTypes.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
    
    // Verify foreign key constraints
    console.log('🔍 Verifying foreign key constraints...');
    const constraints = await db.execute(sql`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND kcu.column_name = 'domain_id'
      AND tc.table_name IN ('assessment_questions', 'assessment_responses')
    `);
    
    console.log('🔗 Foreign key constraints:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.constraint_name}`);
    });
    
    console.log('\n✅ DomainId column type update completed successfully!');
    console.log('📋 Summary:');
    console.log('   - assessment_questions.domain_id: text → integer with FK constraint');
    console.log('   - assessment_responses.domain_id: text → integer with FK constraint');
    console.log('   - Schema is now properly typed for domain relationships');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Check if it's a constraint already exists error
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Some constraints may already exist - this is normal if migration was partially run before');
      } else if (error.message.includes('cannot be cast')) {
        console.log('⚠️  Data conversion failed - make sure the data migration was run first');
      }
    }
    
    throw error;
  }
}

// Run the migration
updateDomainIdColumnTypes()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 