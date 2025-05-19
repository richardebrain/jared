/**
 * Assessment Question Service
 * This service handles question selection and tracking to ensure no repeats
 * and proper progress through difficulty levels in assessments.
 */

import { AssessmentQuestion, DifficultyLevel } from "../types";

// Store of already answered questions per domain to prevent repeats
const answeredQuestionsMap = new Map<string, Set<string>>();

// Debug flag - set to true to enable detailed console logs
const DEBUG = true;

/**
 * Create a unique fingerprint for a question that identifies it regardless of ID
 * @param question The question to fingerprint
 * @returns A unique string fingerprint
 */
function createQuestionFingerprint(question: AssessmentQuestion): string {
  // Combine domain, text, and options to create a truly unique identifier
  return `${question.domain}::${question.text.trim().toLowerCase()}::${question.options.join('|')}`;
}

/**
 * Mark a question as answered so it won't be shown again
 * @param question The question that was answered
 */
export function markQuestionAnswered(question: AssessmentQuestion): void {
  if (!question) return;
  
  // Get the domain-specific set of answered questions
  const domain = question.domain;
  if (!answeredQuestionsMap.has(domain)) {
    answeredQuestionsMap.set(domain, new Set());
  }
  
  // Add this question's fingerprint to the set
  const fingerprint = createQuestionFingerprint(question);
  answeredQuestionsMap.get(domain)?.add(fingerprint);
  
  if (DEBUG) {
    const count = answeredQuestionsMap.get(domain)?.size || 0;
    console.log(`✓ Marked question as answered in domain '${domain}' - Total answered: ${count}`);
  }
}

/**
 * Reset all answered questions tracking
 */
export function resetAnsweredQuestions(): void {
  answeredQuestionsMap.clear();
  if (DEBUG) console.log('✓ Reset all answered questions tracking');
}

/**
 * Check if a question has already been answered
 * @param question The question to check
 * @returns True if the question has been answered
 */
export function hasQuestionBeenAnswered(question: AssessmentQuestion): boolean {
  if (!question) return false;
  
  const domain = question.domain;
  if (!answeredQuestionsMap.has(domain)) return false;
  
  const fingerprint = createQuestionFingerprint(question);
  return answeredQuestionsMap.get(domain)?.has(fingerprint) || false;
}

/**
 * Get available questions for a domain and difficulty level
 * @param allQuestions The full set of questions to filter from
 * @param domain The domain to get questions for
 * @param difficulty The difficulty level to get questions for
 * @returns Array of available questions that haven't been answered yet
 */
export function getAvailableQuestions(
  allQuestions: AssessmentQuestion[],
  domain: string,
  difficulty: DifficultyLevel
): AssessmentQuestion[] {
  if (!allQuestions || allQuestions.length === 0) return [];
  
  // Find all questions for this domain and difficulty that haven't been answered
  const availableQuestions = allQuestions.filter(question => {
    // First check if it's the right domain and difficulty
    if (question.domain === domain && question.difficulty === difficulty) {
      // Then verify it hasn't been answered yet
      return !hasQuestionBeenAnswered(question);
    }
    return false;
  });
  
  if (DEBUG) {
    console.log(`Found ${availableQuestions.length} available questions for domain '${domain}' at ${difficulty} difficulty`);
    if (domain === 'human') {
      // Extra logging for the Building a Human section that was causing issues
      console.log(`Details for Building a Human questions:`);
      availableQuestions.forEach((q, i) => {
        console.log(`  ${i+1}. ${q.text.substring(0, 30)}...`);
      });
    }
  }
  
  return availableQuestions;
}

/**
 * Get a batch of questions for a domain and difficulty
 * @param allQuestions The full set of questions to select from
 * @param domain The domain to get questions for
 * @param difficulty The difficulty level to get questions for
 * @param count Number of questions to get (default: 5)
 * @returns Array of questions for the domain and difficulty, shuffled for randomness
 */
export function getQuestionBatch(
  allQuestions: AssessmentQuestion[],
  domain: string,
  difficulty: DifficultyLevel,
  count: number = 5
): AssessmentQuestion[] {
  // Get all available questions
  const availableQuestions = getAvailableQuestions(allQuestions, domain, difficulty);
  
  // If no questions are available, return an empty array
  if (availableQuestions.length === 0) return [];
  
  // Shuffle the questions for randomness
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions or all available if less
  const result = shuffled.slice(0, count);
  
  if (DEBUG) {
    console.log(`Selected ${result.length} questions for domain '${domain}' at ${difficulty} difficulty`);
  }
  
  return result;
}

/**
 * Attempt to get questions with fallback to other difficulty levels
 * This method tries multiple difficulty levels if needed
 * @param allQuestions The full set of questions to select from
 * @param domain The domain to get questions for
 * @param difficulty The preferred difficulty level
 * @param count Number of questions to get
 * @returns Questions for the domain, potentially at a different difficulty level
 */
export function getQuestionsWithFallback(
  allQuestions: AssessmentQuestion[],
  domain: string,
  difficulty: DifficultyLevel,
  count: number = 5
): { questions: AssessmentQuestion[], actualDifficulty: DifficultyLevel } {
  // First try the requested difficulty
  let questions = getQuestionBatch(allQuestions, domain, difficulty, count);
  
  // If we got questions, return them with the actual difficulty used
  if (questions.length > 0) {
    return { questions, actualDifficulty: difficulty };
  }
  
  // Otherwise try fallback difficulty levels
  // The fallback chain goes: beginner -> intermediate -> advanced -> expert
  // And also: expert -> advanced -> intermediate -> beginner
  const difficultyLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  
  // Find the current difficulty index
  const currentIndex = difficultyLevels.indexOf(difficulty);
  
  // Try progressively easier difficulties first (go backward)
  for (let i = currentIndex - 1; i >= 0; i--) {
    const fallbackDifficulty = difficultyLevels[i];
    questions = getQuestionBatch(allQuestions, domain, fallbackDifficulty, count);
    if (questions.length > 0) {
      if (DEBUG) console.log(`Found questions at fallback difficulty: ${fallbackDifficulty}`);
      return { questions, actualDifficulty: fallbackDifficulty };
    }
  }
  
  // If still no questions, try progressively harder difficulties (go forward)
  for (let i = currentIndex + 1; i < difficultyLevels.length; i++) {
    const fallbackDifficulty = difficultyLevels[i];
    questions = getQuestionBatch(allQuestions, domain, fallbackDifficulty, count);
    if (questions.length > 0) {
      if (DEBUG) console.log(`Found questions at fallback difficulty: ${fallbackDifficulty}`);
      return { questions, actualDifficulty: fallbackDifficulty };
    }
  }
  
  // If we still have no questions, we've exhausted all difficulties
  if (DEBUG) console.log(`⚠️ No questions available for domain '${domain}' at any difficulty level`);
  return { questions: [], actualDifficulty: difficulty };
}