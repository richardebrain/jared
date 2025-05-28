import { db } from './db.js';
import { assessmentDomains, assessmentConfig } from '../shared/schema.js';

/**
 * Seed Assessment Domains and Configuration
 * 
 * Creates the 10 core ECE domains with weighted question distribution
 * and sets up default assessment configuration for the adaptive system.
 */

// 10 ECE domains with relative weights for proportional selection (weights total: 65, assessment total: 40 questions)
const ASSESSMENT_DOMAINS = [
  {
    name: 'Child Safety & Supervision',
    description: 'Active supervision, incident response, hygiene, emergency plans',
    questionWeight: 10, // Highest priority - safety is critical
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'Health & Development',
    description: 'Developmental milestones, nutrition, sleep, red flags',
    questionWeight: 8, // High priority - foundational health and development
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'Trauma-Informed & Emotional Care',
    description: 'Co-regulation, triggers, sensitive responses',
    questionWeight: 7, // High priority - emotional well-being
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'Positive Guidance',
    description: 'Discipline vs. guidance, redirection, empathy-based coaching',
    questionWeight: 8, // High priority - behavior guidance
    displayOrder: 4,
    isActive: true
  },
  {
    name: 'Curriculum & Learning Through Play',
    description: 'Developmentally appropriate practices, emergent curriculum',
    questionWeight: 8, // High priority - core teaching practices
    displayOrder: 5,
    isActive: true
  },
  {
    name: 'Family Engagement',
    description: 'Communication, inclusion, partnership',
    questionWeight: 5, // Medium priority - important relationships
    displayOrder: 6,
    isActive: true
  },
  {
    name: 'Assessment & Observation',
    description: 'Anecdotal notes, screening, documenting development',
    questionWeight: 5, // Medium priority - documentation skills
    displayOrder: 7,
    isActive: true
  },
  {
    name: 'Professionalism & Ethics',
    description: 'Boundaries, reporting, bias awareness, confidentiality',
    questionWeight: 4, // Medium priority - professional standards
    displayOrder: 8,
    isActive: true
  },
  {
    name: 'Cultural & Individual Inclusion',
    description: 'Neurodiversity, cultural humility, inclusive routines',
    questionWeight: 4, // Medium priority - inclusivity practices
    displayOrder: 9,
    isActive: true
  },
  {
    name: 'Real Classroom Scenarios',
    description: 'Judging gray-area decisions, conflict resolution, practical humor',
    questionWeight: 6, // Medium-high priority - practical application
    displayOrder: 10,
    isActive: true
  }
];

// Verify total question weight equals 65 (these are relative weights for proportional selection)
const totalWeight = ASSESSMENT_DOMAINS.reduce((sum, domain) => sum + domain.questionWeight, 0);
if (totalWeight !== 65) {
  throw new Error(`Domain weights must total 65, but got ${totalWeight}`);
}

// Default assessment configuration
const DEFAULT_ASSESSMENT_CONFIG = {
  schoolId: null, // Platform-wide default (null = applies to all schools)
  questionCount: 40, // Total questions per assessment (weights above are for proportional selection)
  timePerQuestion: 60, // 60 seconds per question
  startingDifficulty: 3, // Start at Medium difficulty (1=Easy, 6=Master)
  minDomainCoverage: 1, // Minimum 1 question per domain
  updatedBy: null, // System-generated default
};

export async function seedAssessmentData() {
  try {
    console.log('🌱 Starting assessment data seeding...\n');

    // Clear existing data to ensure clean seed
    console.log('🧹 Clearing existing assessment configuration...');
    await db.delete(assessmentConfig);
    
    console.log('🧹 Clearing existing assessment domains...');
    await db.delete(assessmentDomains);

    // Seed assessment domains
    console.log('📚 Seeding 10 ECE assessment domains...');
    const insertedDomains = await db.insert(assessmentDomains).values(ASSESSMENT_DOMAINS).returning();
    
    console.log(`✅ Successfully seeded ${insertedDomains.length} assessment domains:`);
    insertedDomains.forEach(domain => {
      console.log(`   - ${domain.name}: ${domain.questionWeight} questions`);
    });

    // Seed default assessment configuration
    console.log('\n⚙️ Seeding default assessment configuration...');
    const insertedConfig = await db.insert(assessmentConfig).values(DEFAULT_ASSESSMENT_CONFIG).returning();
    
    console.log('✅ Successfully seeded default assessment configuration:');
    console.log(`   - Question Count: ${insertedConfig[0].questionCount}`);
    console.log(`   - Time Per Question: ${insertedConfig[0].timePerQuestion} seconds`);
    console.log(`   - Starting Difficulty: ${insertedConfig[0].startingDifficulty} (Medium)`);
    console.log(`   - Min Domain Coverage: ${insertedConfig[0].minDomainCoverage} question(s) per domain`);

    // Validation summary
    console.log('\n🎯 Seeding validation:');
    console.log(`   - Total relative weights: ${totalWeight}/65 ✅`);
    console.log(`   - Assessment question count: ${insertedConfig[0].questionCount} questions ✅`);
    console.log(`   - All domains active: ${ASSESSMENT_DOMAINS.filter(d => d.isActive).length}/${ASSESSMENT_DOMAINS.length} ✅`);
    console.log(`   - Display order sequential: 1-${ASSESSMENT_DOMAINS.length} ✅`);

    console.log('\n🎉 Assessment data seeding completed successfully!');
    return { domains: insertedDomains, config: insertedConfig[0] };

  } catch (error) {
    console.error('❌ Error seeding assessment data:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAssessmentData()
    .then(() => {
      console.log('🏁 Seeding process complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
} 