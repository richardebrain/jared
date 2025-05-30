import { db } from './db';
import { assessmentQuestions, assessmentDomains, assessmentResponses } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function analyzeDomainIdData() {
  console.log('🔍 Analyzing current domainId data...\n');

  // Check assessment domains to understand the mapping
  console.log('📋 Assessment Domains:');
  const domains = await db.select().from(assessmentDomains);
  domains.forEach(domain => {
    console.log(`  ID: ${domain.id} -> Name: "${domain.name}"`);
  });
  console.log();

  // Check current domainId values in questions
  console.log('❓ Current domainId values in assessment_questions:');
  const questions = await db.select({
    id: assessmentQuestions.id,
    domainId: assessmentQuestions.domainId,
    text: sql<string>`substring(${assessmentQuestions.text}, 1, 50) || '...'`
  }).from(assessmentQuestions);
  
  const domainIdCounts = new Map<string, number>();
  questions.forEach(q => {
    console.log(`  Question "${q.id}": domainId = "${q.domainId}" | Text: ${q.text}`);
    domainIdCounts.set(q.domainId, (domainIdCounts.get(q.domainId) || 0) + 1);
  });
  
  console.log('\n📊 DomainId frequency:');
  domainIdCounts.forEach((count, domainId) => {
    console.log(`  "${domainId}": ${count} questions`);
  });

  // Check if any responses exist
  console.log('\n📝 Checking assessment_responses...');
  const responseCount = await db.select({
    count: sql<number>`count(*)`
  }).from(assessmentResponses);
  console.log(`  Total responses: ${responseCount[0]?.count || 0}`);

  if (responseCount[0]?.count > 0) {
    const responseDomainIds = await db.select({
      domainId: assessmentResponses.domainId,
      count: sql<number>`count(*)`
    })
    .from(assessmentResponses)
    .groupBy(assessmentResponses.domainId);

    console.log('  Response domainIds:');
    responseDomainIds.forEach(r => {
      console.log(`    "${r.domainId}": ${r.count} responses`);
    });
  }

  return { domains, questions, domainIdCounts };
}

async function createDomainIdMapping(domains: any[], domainIdCounts: Map<string, number>) {
  console.log('\n🗺️  Creating domainId mapping strategy...\n');

  const mapping = new Map<string, number>();

  // Strategy 1: Direct numeric conversion if possible
  domainIdCounts.forEach((count, textDomainId) => {
    const numericValue = parseInt(textDomainId);
    if (!isNaN(numericValue)) {
      // Check if this numeric value exists in domains
      const matchingDomain = domains.find(d => d.id === numericValue);
      if (matchingDomain) {
        mapping.set(textDomainId, numericValue);
        console.log(`✅ Direct mapping: "${textDomainId}" -> ${numericValue} (${matchingDomain.name})`);
        return;
      }
    }

    // Strategy 2: Name-based mapping
    const domainByName = domains.find(d => 
      d.name.toLowerCase().includes(textDomainId.toLowerCase()) ||
      textDomainId.toLowerCase().includes(d.name.toLowerCase())
    );
    
    if (domainByName) {
      mapping.set(textDomainId, domainByName.id);
      console.log(`🔗 Name-based mapping: "${textDomainId}" -> ${domainByName.id} (${domainByName.name})`);
      return;
    }

    // Strategy 3: Manual mapping needed
    console.log(`❌ No automatic mapping found for: "${textDomainId}" (${count} questions)`);
  });

  return mapping;
}

async function performMigration(mapping: Map<string, number>, dryRun: boolean = true) {
  console.log(`\n${dryRun ? '🧪 DRY RUN' : '⚡ EXECUTING'} Migration...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const [textDomainId, numericDomainId] of mapping) {
    try {
      if (dryRun) {
        console.log(`Would update questions with domainId "${textDomainId}" to ${numericDomainId}`);
        
        // Count what would be affected
        const questionCount = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions)
        .where(sql`${assessmentQuestions.domainId} = ${textDomainId}`);

        const responseCount = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentResponses)
        .where(sql`${assessmentResponses.domainId} = ${textDomainId}`);

        console.log(`  - ${questionCount[0]?.count || 0} questions`);
        console.log(`  - ${responseCount[0]?.count || 0} responses`);
      } else {
        // Update questions
        await db.update(assessmentQuestions)
          .set({ domainId: numericDomainId.toString() }) // Still text for now, will change schema after
          .where(sql`${assessmentQuestions.domainId} = ${textDomainId}`);

        // Update responses
        await db.update(assessmentResponses)
          .set({ domainId: numericDomainId.toString() })
          .where(sql`${assessmentResponses.domainId} = ${textDomainId}`);

        console.log(`✅ Updated domainId "${textDomainId}" -> ${numericDomainId}`);
      }
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating domainId "${textDomainId}":`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration summary: ${successCount} successful, ${errorCount} errors`);
}

async function main() {
  try {
    console.log('🚀 Starting domainId migration analysis...\n');

    const { domains, questions, domainIdCounts } = await analyzeDomainIdData();
    
    if (questions.length === 0) {
      console.log('No questions found in database. Migration not needed.');
      return;
    }

    const mapping = await createDomainIdMapping(domains, domainIdCounts);

    console.log('\n⚠️  Before proceeding with migration:');
    console.log('1. Backup your database');
    console.log('2. Review the mappings above');
    console.log('3. Run with --execute flag to perform actual migration');
    console.log('4. Update schema after successful migration\n');

    // Dry run by default
    const shouldExecute = process.argv.includes('--execute');
    await performMigration(mapping, !shouldExecute);

    if (!shouldExecute) {
      console.log('\n💡 To execute the migration, run: tsx server/migrateDomainIds.ts --execute');
    } else {
      console.log('\n✅ Migration completed! Next steps:');
      console.log('1. Update schema.ts to change domainId from text to integer');
      console.log('2. Add foreign key constraints');
      console.log('3. Push schema changes');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzeDomainIdData, createDomainIdMapping, performMigration }; 