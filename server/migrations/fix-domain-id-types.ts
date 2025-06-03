import { db } from '../db';
import { assessmentQuestions, assessmentResponses, assessmentDomains } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Migration: Convert domainId from text (domain names) to integer (foreign key)
 * 
 * This migration addresses the type inconsistency where domainId was stored as
 * domain names (text) instead of domain IDs (integer foreign key).
 * 
 * Steps:
 * 1. Create mapping from domain names to domain IDs
 * 2. Update assessmentQuestions.domainId to use integer IDs
 * 3. Update assessmentResponses.domainId to use integer IDs
 * 4. Update schema to use proper foreign key constraints (manual step)
 */

interface DomainMapping {
  [domainName: string]: number;
}

export async function migrateDomainIdTypes() {
  console.log('🔄 Starting domain ID type migration...');
  
  try {
    // Step 1: Create mapping from domain names to domain IDs
    console.log('📋 Creating domain name to ID mapping...');
    const domains = await db.select().from(assessmentDomains);
    
    const domainMapping: DomainMapping = {};
    domains.forEach(domain => {
      domainMapping[domain.name] = domain.id;
    });
    
    console.log('🗂️  Domain mapping created:', domainMapping);
    
    // Step 2: Update assessmentQuestions.domainId
    console.log('🔄 Updating assessmentQuestions.domainId from text to integer...');
    
    const questions = await db.select({
      id: assessmentQuestions.id,
      domainId: assessmentQuestions.domainId
    }).from(assessmentQuestions);
    
    console.log(`📊 Found ${questions.length} questions to update`);
    
    let questionsUpdated = 0;
    let questionsSkipped = 0;
    
    for (const question of questions) {
      const domainName = question.domainId;
      const domainId = domainMapping[domainName];
      
      if (domainId) {
        await db.update(assessmentQuestions)
          .set({ domainId: domainId.toString() }) // Still string in current schema
          .where(eq(assessmentQuestions.id, question.id));
        questionsUpdated++;
      } else {
        console.warn(`⚠️  No domain ID found for domain name: "${domainName}" (question ${question.id})`);
        questionsSkipped++;
      }
    }
    
    console.log(`✅ Questions updated: ${questionsUpdated}, skipped: ${questionsSkipped}`);
    
    // Step 3: Update assessmentResponses.domainId
    console.log('🔄 Updating assessmentResponses.domainId from text to integer...');
    
    const responses = await db.select({
      id: assessmentResponses.id,
      domainId: assessmentResponses.domainId
    }).from(assessmentResponses);
    
    console.log(`📊 Found ${responses.length} responses to update`);
    
    let responsesUpdated = 0;
    let responsesSkipped = 0;
    
    for (const response of responses) {
      const domainName = response.domainId;
      const domainId = domainMapping[domainName];
      
      if (domainId) {
        await db.update(assessmentResponses)
          .set({ domainId: domainId.toString() }) // Still string in current schema
          .where(eq(assessmentResponses.id, response.id));
        responsesUpdated++;
      } else {
        console.warn(`⚠️  No domain ID found for domain name: "${domainName}" (response ${response.id})`);
        responsesSkipped++;
      }
    }
    
    console.log(`✅ Responses updated: ${responsesUpdated}, skipped: ${responsesSkipped}`);
    
    // Summary
    console.log('\n📋 Migration Summary:');
    console.log(`   📄 Total domains mapped: ${Object.keys(domainMapping).length}`);
    console.log(`   📝 Questions updated: ${questionsUpdated}`);
    console.log(`   📋 Responses updated: ${responsesUpdated}`);
    console.log(`   ⚠️  Questions skipped: ${questionsSkipped}`);
    console.log(`   ⚠️  Responses skipped: ${responsesSkipped}`);
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Update schema.ts to change domainId from text to integer with foreign key');
    console.log('   2. Run `npx drizzle-kit push` to apply schema changes');
    console.log('   3. Update all services to use integer domainId');
    
    console.log('\n✅ Domain ID type migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration directly
migrateDomainIdTypes()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 