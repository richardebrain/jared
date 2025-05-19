/**
 * Assessment Question Service
 * This service handles question selection and tracking to ensure no repeats
 * and proper progress through difficulty levels in assessments.
 */
import { 
  AssessmentQuestion,
  DifficultyLevel
} from "../types";

// Store for questions seen in the current session
const answeredQuestions = new Set<string>();

/**
 * Create a unique fingerprint for a question that identifies it regardless of ID
 * @param question The question to fingerprint
 * @returns A unique string fingerprint
 */
function createQuestionFingerprint(question: AssessmentQuestion): string {
  return `${question.domain}::${question.text.trim().toLowerCase()}::${question.options.join('|')}`;
}

/**
 * Mark a question as answered so it won't be shown again
 * @param question The question that was answered
 */
export function markQuestionAnswered(question: AssessmentQuestion): void {
  const fingerprint = createQuestionFingerprint(question);
  answeredQuestions.add(fingerprint);
  console.log(`Question marked as answered: ${fingerprint.substring(0, 60)}...`);
}

/**
 * Reset all answered questions tracking
 */
export function resetAnsweredQuestions(): void {
  answeredQuestions.clear();
  console.log("Answered questions tracking reset");
}

/**
 * Check if a question has already been answered
 * @param question The question to check
 * @returns True if the question has been answered
 */
export function hasQuestionBeenAnswered(question: AssessmentQuestion): boolean {
  const fingerprint = createQuestionFingerprint(question);
  return answeredQuestions.has(fingerprint);
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
  // Debug logging
  const isHumanSection = domain === 'human';
  if (isHumanSection) {
    console.log(`🔍 Looking for available questions in Building a Human section (${difficulty})`);
    console.log(`🔍 Total questions answered so far: ${answeredQuestions.size}`);
  }

  // Filter available questions
  const available = allQuestions.filter(q => {
    if (q.domain === domain && q.difficulty === difficulty) {
      const fingerprint = createQuestionFingerprint(q);
      const hasBeenAnswered = answeredQuestions.has(fingerprint);
      
      // Log for Building a Human section
      if (isHumanSection) {
        if (!hasBeenAnswered) {
          console.log(`✅ Available: "${q.text.substring(0, 40)}..." (ID: ${q.id})`);
        } else {
          console.log(`❌ Already answered: "${q.text.substring(0, 40)}..." (ID: ${q.id})`);
        }
      }
      
      return !hasBeenAnswered;
    }
    return false;
  });

  // Log summary for Building a Human section
  if (isHumanSection) {
    console.log(`Found ${available.length} available questions for Building a Human (${difficulty})`);
  }

  return available;
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
  // Get available questions
  const availableQuestions = getAvailableQuestions(allQuestions, domain, difficulty);
  
  // Shuffle questions for randomness
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  
  // Return limited number of questions
  return shuffled.slice(0, count);
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
  // Try the requested difficulty first
  let questions = getQuestionBatch(allQuestions, domain, difficulty, count);
  
  // If no questions available, try fallback difficulties
  if (questions.length === 0) {
    console.log(`No questions available for ${domain} at ${difficulty} level, trying fallbacks...`);
    
    // Attempt different difficulty levels in a sensible order
    let actualDifficulty: DifficultyLevel = difficulty;
    
    if (difficulty === 'beginner') {
      questions = getQuestionBatch(allQuestions, domain, 'intermediate', count);
      if (questions.length > 0) actualDifficulty = 'intermediate';
    } 
    else if (difficulty === 'intermediate') {
      // Try beginner first, then advanced
      questions = getQuestionBatch(allQuestions, domain, 'beginner', count);
      if (questions.length > 0) {
        actualDifficulty = 'beginner';
      } else {
        questions = getQuestionBatch(allQuestions, domain, 'advanced', count);
        if (questions.length > 0) actualDifficulty = 'advanced';
      }
    }
    else if (difficulty === 'advanced') {
      // Try intermediate first, then expert
      questions = getQuestionBatch(allQuestions, domain, 'intermediate', count);
      if (questions.length > 0) {
        actualDifficulty = 'intermediate';
      } else {
        questions = getQuestionBatch(allQuestions, domain, 'expert', count);
        if (questions.length > 0) actualDifficulty = 'expert';
      }
    }
    else if (difficulty === 'expert') {
      // Try advanced as fallback for expert
      questions = getQuestionBatch(allQuestions, domain, 'advanced', count);
      if (questions.length > 0) actualDifficulty = 'advanced';
    }
    
    console.log(`Fallback to ${actualDifficulty} difficulty: found ${questions.length} questions`);
  }
  
  return { questions, actualDifficulty: difficulty };
}