import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { assessmentQuestions } from '@shared/schema';

// Configuration
const CSV_FILES = [
  '../attached_assets/ece_master_database_ready.csv',
  '../attached_assets/ece_question_bank_1100_witty.csv',
  '../attached_assets/ece_master_database_full_with_why.csv',
  '../attached_assets/Combined_ECE_Onboarding_Question_Bank__Sample_90_items_.csv'
];

// Map difficulty levels to standardized format
const mapDifficulty = (difficultyStr: string): string => {
  const difficultyMap: { [key: string]: string } = {
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
  
  return difficultyMap[difficultyStr.toLowerCase()] || 'intermediate';
};

// Get letter index (0-3) from A, B, C, D answer
const getAnswerIndex = (answer: string): number => {
  if (answer === 'A' || answer === 'a') return 0;
  if (answer === 'B' || answer === 'b') return 1;
  if (answer === 'C' || answer === 'c') return 2;
  if (answer === 'D' || answer === 'd') return 3;
  return 0; // Default to first option if unknown
};

// Process ready format file
async function processReadyFormat(filePath: string) {
  console.log(`Processing ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Generate a unique ID
      const id = `ece-ready-${record.ID || Math.floor(Math.random() * 1000000)}`;
      
      // Prepare options
      const options = [
        record['Option A'] || '',
        record['Option B'] || '',
        record['Option C'] || '',
        record['Option D'] || ''
      ];
      
      // Clean up - some files have odd characters or newlines in fields
      const question = record.Question ? record.Question.trim().replace(/\\n/g, ' ') : '';
      
      // Skip problematic records
      if (!question || options.every(opt => !opt)) {
        console.log(`Skipping record with ID ${id} due to missing data`);
        errorCount++;
        continue;
      }
      
      // Get domain
      let domain = record.domain || 'Curriculum';
      if (record.sub_competency) {
        domain = `${domain}-${record.sub_competency}`;
      }
      
      // Determine difficulty
      const difficulty = mapDifficulty(record.difficulty || 'intermediate');
      
      // Get answer index
      const correctAnswer = getAnswerIndex(record.Answer || 'A');
      
      // Format explanation
      const explanation = record['Teaching Explanation'] || '';
      
      // Insert into database
      await db.insert(assessmentQuestions).values({
        id,
        domain,
        text: question,
        options: JSON.stringify(options),
        correctAnswer,
        difficulty,
        explanation
      }).onConflictDoNothing();
      
      successCount++;
    } catch (error) {
      console.error(`Error processing record:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Process witty format file
async function processWittyFormat(filePath: string) {
  console.log(`Processing ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Generate a unique ID
      const id = `ece-witty-${record.ID || Math.floor(Math.random() * 1000000)}`;
      
      // Prepare options
      const options = [
        record['Option A'] || '',
        record['Option B'] || '',
        record['Option C'] || '',
        record['Option D'] || ''
      ];
      
      // Get domain from the question content (simplified approach)
      const questionText = record.Question || '';
      let domain = 'ECE';
      
      if (questionText.includes('literacy')) domain = 'Language & Literacy';
      else if (questionText.includes('motor')) domain = 'Physical Development';
      else if (questionText.includes('observation')) domain = 'Assessment';
      else if (questionText.includes('safety')) domain = 'Health & Safety';
      else if (questionText.includes('reinforcement')) domain = 'Guidance & Discipline';
      else if (questionText.includes('trauma')) domain = 'Social-Emotional Development';
      else if (questionText.includes('scaffolding')) domain = 'Teaching Strategies';
      
      // Determine difficulty
      const difficulty = mapDifficulty(record.Difficulty || 'intermediate');
      
      // Get answer index
      const correctAnswer = getAnswerIndex(record.Answer || 'A');
      
      // Format explanation
      const explanation = record['Teaching Explanation'] || '';
      
      // Skip empty records
      if (!questionText || options.every(opt => !opt)) {
        console.log(`Skipping record with ID ${id} due to missing data`);
        errorCount++;
        continue;
      }
      
      // Insert into database
      await db.insert(assessmentQuestions).values({
        id,
        domain,
        text: questionText,
        options: JSON.stringify(options),
        correctAnswer,
        difficulty,
        explanation
      }).onConflictDoNothing();
      
      successCount++;
    } catch (error) {
      console.error(`Error processing record:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Process why format file
async function processWhyFormat(filePath: string) {
  console.log(`Processing ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Generate a unique ID
      const id = `ece-why-${record.ID || Math.floor(Math.random() * 1000000)}`;
      
      // Prepare options
      const options = [
        record['Option A'] || '',
        record['Option B'] || '',
        record['Option C'] || '',
        record['Option D'] || ''
      ];
      
      // Clean up - some files have odd characters or newlines in fields
      const question = record.Question ? record.Question.trim().replace(/\\n/g, ' ') : '';
      
      // Skip problematic records
      if (!question || options.every(opt => !opt)) {
        console.log(`Skipping record with ID ${id} due to missing data`);
        errorCount++;
        continue;
      }
      
      // Get domain from the record (or default)
      let domain = 'ECE Core';
      
      // Determine difficulty
      const difficulty = mapDifficulty(record.Difficulty || 'intermediate');
      
      // Get answer index
      const correctAnswer = getAnswerIndex(record.Answer || 'A');
      
      // Format explanation
      let explanation = record['Teaching Explanation'] || '';
      // Add the "Why Behind It" if available
      if (record['Why Behind It']) {
        explanation += `\n\nWhy It Matters: ${record['Why Behind It']}`;
      }
      
      // Insert into database
      await db.insert(assessmentQuestions).values({
        id,
        domain,
        text: question,
        options: JSON.stringify(options),
        correctAnswer,
        difficulty,
        explanation
      }).onConflictDoNothing();
      
      successCount++;
    } catch (error) {
      console.error(`Error processing record:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Process combined format file
async function processCombinedFormat(filePath: string) {
  console.log(`Processing ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Generate a unique ID using sub-competency to make it unique
      const id = `ece-combined-${record['Sub-Competency'] || ''}-${Math.floor(Math.random() * 1000000)}`;
      
      // Get correct answer based on which field contains "Implement the recommended steps"
      let correctAnswer = 0;
      const options = [
        record['Option A'] || '',
        record['Option B'] || '',
        record['Option C'] || '',
        record['Option D'] || ''
      ];
      
      // Find the correct answer by looking for the implementation pattern
      for (let i = 0; i < options.length; i++) {
        if (options[i].includes('Implement the recommended steps')) {
          correctAnswer = i;
          break;
        }
      }
      
      // Clean up - some files have odd characters or newlines in fields
      const question = record.Question ? record.Question.trim().replace(/\\n/g, ' ') : '';
      
      // Skip problematic records
      if (!question || options.every(opt => !opt)) {
        console.log(`Skipping record due to missing data`);
        errorCount++;
        continue;
      }
      
      // Get domain
      const domain = record['Sub-Competency'] || 'ECE';
      
      // Determine difficulty
      const difficulty = mapDifficulty(record.Difficulty || 'intermediate');
      
      // Format explanation
      let explanation = '';
      if (record['Teaching Explanation']) {
        explanation = record['Teaching Explanation'];
      }
      if (record['Why Behind It']) {
        explanation += `\n\nWhy It Matters: ${record['Why Behind It']}`;
      }
      if (record['Implementation (How)']) {
        explanation += `\n\nImplementation: ${record['Implementation (How)']}`;
      }
      
      // Insert into database
      await db.insert(assessmentQuestions).values({
        id,
        domain,
        text: question,
        options: JSON.stringify(options),
        correctAnswer,
        difficulty,
        explanation
      }).onConflictDoNothing();
      
      successCount++;
    } catch (error) {
      console.error(`Error processing record:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Main import function
async function importECEQuestions() {
  console.log('Starting ECE question import...');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  try {
    // Process each CSV file based on its format
    for (const csvFile of CSV_FILES) {
      const filePath = path.resolve(__dirname, csvFile);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
      }
      
      let result;
      
      if (csvFile.includes('ece_master_database_ready')) {
        result = await processReadyFormat(filePath);
      } else if (csvFile.includes('ece_question_bank_1100_witty')) {
        result = await processWittyFormat(filePath);
      } else if (csvFile.includes('ece_master_database_full_with_why')) {
        result = await processWhyFormat(filePath);
      } else if (csvFile.includes('Combined_ECE_Onboarding_Question_Bank')) {
        result = await processCombinedFormat(filePath);
      } else {
        console.log(`Unknown file format: ${csvFile}`);
        continue;
      }
      
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
      
      console.log(`Processed ${csvFile}: ${result.successCount} successful, ${result.errorCount} errors`);
    }
    
    console.log(`Import complete. Total: ${totalSuccess} questions imported successfully, ${totalErrors} errors`);
    
    // Update client-side questions file
    await updateClientQuestions();
    
    return { success: totalSuccess, errors: totalErrors };
  } catch (error) {
    console.error('Error during import:', error);
    return { success: totalSuccess, errors: totalErrors, error };
  }
}

// Update the client-side questions file
async function updateClientQuestions() {
  try {
    console.log('Updating client-side question database...');
    
    // Get all questions from DB
    const questions = await db.select().from(assessmentQuestions);
    
    // Transform for client-side usage
    const clientQuestions = questions.map(q => {
      let options;
      try {
        options = JSON.parse(q.options);
      } catch (e) {
        options = ['Error parsing options', 'Please contact support', 'This question may be invalid', 'Option D'];
      }
      
      return {
        id: q.id,
        text: q.text,
        domain: q.domain,
        type: 'multiple-choice',
        difficulty: q.difficulty,
        options,
        correctAnswer: options[q.correctAnswer] || '',
        explanation: q.explanation || ''
      };
    });
    
    // Check if the client/public directory exists
    const publicDir = path.resolve(__dirname, '../client/public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(
      path.resolve(publicDir, 'assessment-questions.json'),
      JSON.stringify(clientQuestions, null, 2)
    );
    
    console.log(`Updated client-side question database with ${clientQuestions.length} questions`);
  } catch (error) {
    console.error('Error updating client-side questions:', error);
  }
}

// Export for use in API routes
export { importECEQuestions };

// Run directly if called from command line
if (require.main === module) {
  importECEQuestions()
    .then(() => {
      console.log('Import script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Import script failed:', err);
      process.exit(1);
    });
}