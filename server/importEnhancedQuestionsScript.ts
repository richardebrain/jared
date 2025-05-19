/**
 * Script to import enhanced ECE questions from CSV file into the database
 * This will create a comprehensive assessment with improved question structure
 * and support personalized learning paths based on assessment results
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import {
  assessmentQuestions,
  InsertAssessmentQuestion
} from '@shared/schema';

interface EnhancedQuestionData {
  ID: string;
  domain: string;
  sub_competency: string;
  difficulty: string;
  q_type: string;
  Question: string;
  'Option A': string;
  'Option B': string;
  'Option C': string;
  'Option D': string;
  Answer: string;
  'Teaching Explanation': string;
  'Story (Why)': string;
  'Implementation (How)': string;
  'Reflection / Considerations': string;
  'Child Impact Story': string;
  'Science Behind It': string;
  'Practical Application Strategy': string;
  'Why Behind It': string;
  resources: string;
}

/**
 * Maps the CSV difficulty level to the application difficulty level
 * @param csvDifficulty Difficulty level from CSV (1-4)
 * @returns Application difficulty level (beginner, intermediate, advanced, expert)
 */
function mapDifficulty(csvDifficulty: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const difficultyNumber = parseInt(csvDifficulty, 10);
  
  switch (difficultyNumber) {
    case 1: return 'beginner';
    case 2: return 'intermediate';
    case 3: return 'advanced';
    case 4: return 'expert';
    default: return 'beginner'; // Default to beginner if invalid
  }
}

/**
 * Maps the answer letter (A, B, C, D) to the correct option index (0-3)
 * @param answer Answer letter from CSV
 * @returns Index of the correct option (0-3)
 */
function mapAnswerToIndex(answer: string): number {
  switch (answer.toUpperCase()) {
    case 'A': return 0;
    case 'B': return 1;
    case 'C': return 2;
    case 'D': return 3;
    default: return 0; // Default to first option if invalid
  }
}

/**
 * Maps the domain from CSV to the application domain
 * @param domain Domain from CSV
 * @returns Application domain ID
 */
function mapDomainToId(domain: string): string {
  // Default mapping for domains
  const domainMap: Record<string, string> = {
    'Curriculum': 'curriculum',
    'Social-Emotional Development': 'social',
    'Teaching Strategies': 'teaching',
    'Language & Literacy': 'language',
    'Physical Development': 'physical',
    'Health & Safety': 'health',
    'Assessment': 'assessment',
    'Guidance & Discipline': 'guidance',
    // Add more mappings as needed
  };

  return domainMap[domain] || domain.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Imports enhanced ECE questions from CSV file
 * @param filePath Path to the CSV file
 */
async function importEnhancedQuestionsFromCSV(filePath: string): Promise<void> {
  try {
    console.log(`Starting import of enhanced ECE questions from: ${filePath}`);
    
    // Read and parse the CSV file
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true
    });
    
    console.log(`Found ${records.length} questions in the CSV file`);
    
    // Batch size for insertion
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;
    
    // Process questions in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const questions: InsertAssessmentQuestion[] = [];
      
      for (const record of batch) {
        const questionData = record as EnhancedQuestionData;
        
        try {
          // Create question object
          const question: InsertAssessmentQuestion = {
            domain: mapDomainToId(questionData.domain),
            subCompetency: questionData.sub_competency,
            difficulty: mapDifficulty(questionData.difficulty),
            text: questionData.Question,
            options: [
              questionData['Option A'],
              questionData['Option B'],
              questionData['Option C'],
              questionData['Option D']
            ],
            correctAnswer: mapAnswerToIndex(questionData.Answer),
            explanation: questionData['Teaching Explanation'],
            storyWhy: questionData['Story (Why)'] || null,
            implementationHow: questionData['Implementation (How)'] || null,
            reflectionConsiderations: questionData['Reflection / Considerations'] || null,
            childImpactStory: questionData['Child Impact Story'] || null,
            scienceBehindIt: questionData['Science Behind It'] || null,
            practicalApplicationStrategy: questionData['Practical Application Strategy'] || null,
            whyBehindIt: questionData['Why Behind It'] || null,
            resources: questionData.resources ? JSON.parse(questionData.resources) : null
          };
          
          questions.push(question);
          successCount++;
        } catch (error) {
          console.error(`Error processing question ID ${questionData.ID}:`, error);
          errorCount++;
        }
      }
      
      // Insert batch of questions
      if (questions.length > 0) {
        try {
          // Use onConflictDoUpdate to handle existing questions
          await db.insert(assessmentQuestions).values(questions)
            .onConflictDoUpdate({
              target: assessmentQuestions.id,
              set: {
                domain: sql`excluded.domain`,
                subCompetency: sql`excluded.sub_competency`,
                difficulty: sql`excluded.difficulty`,
                text: sql`excluded.text`,
                options: sql`excluded.options`,
                correctAnswer: sql`excluded.correct_answer`,
                explanation: sql`excluded.explanation`,
                storyWhy: sql`excluded.story_why`,
                implementationHow: sql`excluded.implementation_how`,
                reflectionConsiderations: sql`excluded.reflection_considerations`,
                childImpactStory: sql`excluded.child_impact_story`,
                scienceBehindIt: sql`excluded.science_behind_it`,
                practicalApplicationStrategy: sql`excluded.practical_application_strategy`,
                whyBehindIt: sql`excluded.why_behind_it`,
                resources: sql`excluded.resources`
              }
            });
          
          console.log(`Inserted/updated batch of ${questions.length} questions`);
        } catch (error) {
          console.error('Error inserting batch of questions:', error);
          errorCount += questions.length;
          successCount -= questions.length;
        }
      }
    }
    
    console.log(`Import completed: ${successCount} questions imported/updated successfully, ${errorCount} errors`);
  } catch (error) {
    console.error('Error during question import:', error);
    throw error;
  }
}

/**
 * Main function to run the import
 */
export async function importEnhancedQuestions(filepath?: string): Promise<void> {
  try {
    // Default to the attached assets directory if no path is provided
    const csvFilePath = filepath || path.resolve(__dirname, '../attached_assets/ece_master_database_ready.csv');
    
    console.log(`Beginning enhanced ECE questions import from ${csvFilePath}`);
    await importEnhancedQuestionsFromCSV(csvFilePath);
    console.log('Enhanced ECE questions import completed successfully');
  } catch (error) {
    console.error('Failed to import enhanced ECE questions:', error);
    throw error;
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importEnhancedQuestions()
    .then(() => {
      console.log('Import script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import script failed:', error);
      process.exit(1);
    });
}