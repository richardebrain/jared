/**
 * Script to import ECE questions from CSV file into the database
 * This will enhance the assessment with a wider variety of questions
 * and support personalized learning paths based on assessment results
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { assessmentQuestions, type InsertAssessmentQuestion } from '../shared/schema';

interface QuestionData {
  ID: string;
  Difficulty: string;
  Question: string;
  'Option A': string;
  'Option B': string;
  'Option C': string;
  'Option D': string;
  Answer: string;
  'Teaching Explanation': string;
  'Why Behind It': string;
}

// Map the CSV difficulty levels to our system's difficulty levels
function mapDifficulty(csvDifficulty: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
    'Easy': 'beginner',
    'Moderate': 'intermediate',
    'Intermediate': 'intermediate',
    'Difficult': 'advanced',
    'Expert': 'expert'
  };
  
  return difficultyMap[csvDifficulty] || 'intermediate';
}

// Map the answer letter to the correct option index
function mapAnswerToCorrectOption(answer: string): number {
  const answerMap: Record<string, number> = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3
  };
  
  return answerMap[answer] || 0;
}

// Map question to appropriate assessment domain
function mapQuestionToDomain(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('core value') || lowerQuestion.includes('consistent') || 
      lowerQuestion.includes('prepared') || lowerQuestion.includes('committed') ||
      lowerQuestion.includes('caring') || lowerQuestion.includes('positive')) {
    return 'core';
  }
  
  if (lowerQuestion.includes('mindful') || lowerQuestion.includes('self-care') || 
      lowerQuestion.includes('stress') || lowerQuestion.includes('wellness')) {
    return 'mindful';
  }
  
  if (lowerQuestion.includes('trauma') || lowerQuestion.includes('attachment') || 
      lowerQuestion.includes('brain development') || lowerQuestion.includes('executive function')) {
    return 'build';
  }
  
  if (lowerQuestion.includes('literacy') || lowerQuestion.includes('language') || 
      lowerQuestion.includes('reading') || lowerQuestion.includes('vocabulary')) {
    return 'language';
  }
  
  if (lowerQuestion.includes('math') || lowerQuestion.includes('reasoning') || 
      lowerQuestion.includes('problem-solving') || lowerQuestion.includes('logic')) {
    return 'reasoning';
  }
  
  if (lowerQuestion.includes('social') || lowerQuestion.includes('emotional') || 
      lowerQuestion.includes('self-regulation') || lowerQuestion.includes('feelings')) {
    return 'social';
  }
  
  if (lowerQuestion.includes('classroom management') || lowerQuestion.includes('transitions') || 
      lowerQuestion.includes('behavior') || lowerQuestion.includes('routines')) {
    return 'classroom';
  }
  
  if (lowerQuestion.includes('milestone') || lowerQuestion.includes('developmental stage') || 
      lowerQuestion.includes('ages and stages') || lowerQuestion.includes('development')) {
    return 'ages';
  }
  
  if (lowerQuestion.includes('inclusion') || lowerQuestion.includes('diversity') || 
      lowerQuestion.includes('special needs') || lowerQuestion.includes('cultural')) {
    return 'inclusion';
  }
  
  if (lowerQuestion.includes('safety') || lowerQuestion.includes('health') || 
      lowerQuestion.includes('nutrition') || lowerQuestion.includes('hygiene')) {
    return 'health';
  }
  
  // Default to classroom management if no clear category
  return 'classroom';
}

async function importQuestionsFromCSV(filePath: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
  
  // Parse CSV file
  parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  }, async (err, records: QuestionData[]) => {
    if (err) {
      console.error('Error parsing CSV file:', err);
      return;
    }
    
    console.log(`Found ${records.length} questions in CSV file`);
    
    // Check if we already have questions in the database
    const existingQuestions = await db.select().from(assessmentQuestions);
    const existingQuestionIds = new Set(existingQuestions.map(q => q.id));
    
    let importCount = 0;
    let skipCount = 0;
    const questionBatch: InsertAssessmentQuestion[] = [];
    
    // Process each question record
    for (const record of records) {
      const questionId = `csv-${record.ID}`;
      
      // Skip if this question ID already exists
      if (existingQuestionIds.has(questionId)) {
        skipCount++;
        continue;
      }
      
      // Create options array from the separate columns
      const options = [
        record['Option A'],
        record['Option B'],
        record['Option C'],
        record['Option D']
      ];
      
      // Map the domain based on question content
      const domain = mapQuestionToDomain(record.Question);
      
      // Create question object
      const question: InsertAssessmentQuestion = {
        id: questionId,
        domain: domain,
        text: record.Question,
        options: JSON.stringify(options),
        correctAnswer: mapAnswerToCorrectOption(record.Answer),
        difficulty: mapDifficulty(record.Difficulty),
        explanation: record['Teaching Explanation'] || record['Why Behind It'] || undefined
      };
      
      questionBatch.push(question);
      importCount++;
      
      // Insert in batches of 100 to avoid overwhelming the database
      if (questionBatch.length >= 100) {
        await db.insert(assessmentQuestions).values(questionBatch);
        questionBatch.length = 0; // Clear the batch
      }
    }
    
    // Insert any remaining questions
    if (questionBatch.length > 0) {
      await db.insert(assessmentQuestions).values(questionBatch);
    }
    
    console.log(`Successfully imported ${importCount} new questions`);
    console.log(`Skipped ${skipCount} questions that already existed`);
  });
}

// Update the assessment-questions.json file with the imported questions
async function updateAssessmentQuestionsJson(): Promise<void> {
  try {
    // Get all questions from the database
    const allQuestions = await db.select().from(assessmentQuestions);
    
    // Format them for the JSON file
    const formattedQuestions = allQuestions.map(q => ({
      id: q.id,
      text: q.text,
      domain: q.domain,
      type: "multiple-choice",
      difficulty: q.difficulty,
      options: JSON.parse(q.options),
      correctAnswer: q.options[q.correctAnswer],
      required: true,
      explanation: q.explanation || ""
    }));
    
    // Write to the public file for client-side access
    fs.writeFileSync(
      './client/public/assessment-questions.json', 
      JSON.stringify(formattedQuestions, null, 2)
    );
    
    console.log(`Updated assessment-questions.json with ${formattedQuestions.length} questions`);
  } catch (error) {
    console.error('Error updating assessment-questions.json:', error);
  }
}

// Main function to run the import
async function main() {
  try {
    console.log('Starting question import process...');
    await importQuestionsFromCSV('./attached_assets/ece_master_database_full_with_why.csv');
    await updateAssessmentQuestionsJson();
    console.log('Question import process completed');
  } catch (error) {
    console.error('Error in import process:', error);
  }
}

// Run the import
main().catch(console.error);