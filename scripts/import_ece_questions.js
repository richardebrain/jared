// Import ECE Questions Script
// This script directly imports ECE questions from attached CSV files to the database

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { db } = require('../server/db');
const { assessmentQuestions } = require('../shared/schema');
const { randomUUID } = require('crypto');

// Source files
const sourceFiles = [
  '../attached_assets/ece_master_database_ready.csv',
  '../attached_assets/ece_question_bank_1100_witty.csv',
  '../attached_assets/ece_master_database_full_with_why.csv',
  '../attached_assets/Combined_ECE_Onboarding_Question_Bank__Sample_90_items_.csv'
];

// Difficulty mapping
const difficultyMap = {
  '1': 'beginner',
  '2': 'developing',
  '3': 'intermediate',
  '4': 'advanced',
  'easy': 'beginner',
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'moderate': 'intermediate',
  'difficult': 'advanced',
  'expert': 'expert',
  'advanced': 'advanced'
};

// Get letter index from A, B, C, D answer
function getAnswerIndex(answer) {
  if (answer === 'A' || answer === 'a') return 0;
  if (answer === 'B' || answer === 'b') return 1;
  if (answer === 'C' || answer === 'c') return 2;
  if (answer === 'D' || answer === 'd') return 3;
  return 0; // Default to first option if unknown
}

// Direct import function
async function importQuestionsFromFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return { imported: 0, skipped: 0 };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    let imported = 0;
    let skipped = 0;
    const batch = [];

    for (const record of records) {
      try {
        // Core fields all questions should have
        const id = `ece-${randomUUID()}`;
        let question = record.Question || '';
        
        // Skip if no question text
        if (!question.trim()) {
          skipped++;
          continue;
        }

        // Prepare options
        let options = [
          record['Option A'] || '',
          record['Option B'] || '',
          record['Option C'] || '',
          record['Option D'] || ''
        ];

        // Filter out empty options
        options = options.filter(option => option.trim() !== '');
        
        // Skip if no options
        if (options.length === 0) {
          skipped++;
          continue;
        }

        // Determine correct answer
        let correctAnswer = 0;
        if (record.Answer) {
          correctAnswer = getAnswerIndex(record.Answer);
        }

        // Get domain from record if available, or use default
        let domain = record.domain || record.Domain || record['Sub-Competency'] || 'ECE Core';

        // Determine difficulty level
        let difficulty = 'intermediate';
        if (record.difficulty || record.Difficulty) {
          const difficultyValue = (record.difficulty || record.Difficulty).toString().toLowerCase();
          difficulty = difficultyMap[difficultyValue] || 'intermediate';
        }

        // Get explanation if available
        let explanation = record['Teaching Explanation'] || '';
        if (record['Why Behind It']) {
          explanation += `\n\nWhy It Matters: ${record['Why Behind It']}`;
        }
        if (record['Implementation (How)']) {
          explanation += `\n\nImplementation: ${record['Implementation (How)']}`;
        }

        // Add to batch
        batch.push({
          id,
          domain,
          text: question,
          options: JSON.stringify(options),
          correctAnswer,
          difficulty,
          explanation
        });

        if (batch.length >= 100) {
          await db.insert(assessmentQuestions).values(batch).onConflictDoNothing();
          imported += batch.length;
          batch.length = 0;
        }
      } catch (error) {
        console.error('Error processing record:', error);
        skipped++;
      }
    }

    // Insert any remaining records
    if (batch.length > 0) {
      await db.insert(assessmentQuestions).values(batch).onConflictDoNothing();
      imported += batch.length;
    }

    return { imported, skipped };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { imported: 0, skipped: 0, error };
  }
}

// Main function to import all files
async function importAllQuestions() {
  console.log('Starting direct import of ECE questions...');
  
  let totalImported = 0;
  let totalSkipped = 0;

  for (const file of sourceFiles) {
    const filePath = path.resolve(process.cwd(), file);
    const result = await importQuestionsFromFile(filePath);
    
    totalImported += result.imported;
    totalSkipped += result.skipped;
    
    console.log(`File ${path.basename(file)}: ${result.imported} imported, ${result.skipped} skipped`);
  }

  console.log(`Import complete. Total: ${totalImported} questions imported, ${totalSkipped} skipped`);
}

// Execute import
importAllQuestions()
  .then(() => {
    console.log('ECE question import script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });