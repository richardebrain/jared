/**
 * Service for interacting with the enhanced assessment API
 */

// Base URL for the enhanced assessment API
const API_BASE_URL = 'http://localhost:5050';

// Types for assessment API requests and responses
export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}

export interface Question {
  id: number;
  question: string;
  q_type: string;
  options: Record<string, string>;
  domain: string;
  difficulty: number;
}

export interface AnswerFeedback {
  is_correct: boolean;
  correct_answer: string;
  next_difficulty: number;
  explanation?: string;
  story_why?: string;
  implementation_how?: string;
  reflection?: string;
  child_impact?: string;
  science?: string;
  practical_application?: string;
  why?: string;
  resources?: any[];
}

export interface LearningPath {
  learning_path: Record<string, string[]>;
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

// Service functions
/**
 * Start a new assessment for a user
 * @param userId User ID
 * @returns Assessment ID
 */
export async function startAssessment(userId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start assessment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.assessment_id;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
}

/**
 * Get the next question in an assessment
 * @param assessmentId Assessment ID
 * @param history History of questions answered so far
 * @returns Next question or completion message
 */
export async function getNextQuestion(
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<Question | { status: string; message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/assessments/${assessmentId}/next-question`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_id: assessmentId,
          history,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get next question: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 * @param assessmentId Assessment ID
 * @param questionId Question ID
 * @param userAnswer User's answer (A, B, C, or D)
 * @param timeTakenMs Time taken to answer in milliseconds
 * @returns Feedback on the answer
 */
export async function submitAnswer(
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
): Promise<AnswerFeedback> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/assessments/${assessmentId}/submit-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          user_answer: userAnswer,
          time_taken_ms: timeTakenMs,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to submit answer: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Finish an assessment and get personalized learning path
 * @param assessmentId Assessment ID
 * @returns Learning path and assessment results
 */
export async function finishAssessment(
  assessmentId: number
): Promise<LearningPath> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/assessments/${assessmentId}/finish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to finish assessment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
}

/**
 * Get domains available for assessment
 * @returns List of domains
 */
export async function getDomains(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/domains`);
    
    if (!response.ok) {
      throw new Error(`Failed to get domains: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.domains;
  } catch (error) {
    console.error('Error getting domains:', error);
    throw error;
  }
}

/**
 * Get question counts by domain
 * @returns Map of domain to question count
 */
export async function getQuestionCountsByDomain(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${API_BASE_URL}/domains/question-counts`);
    
    if (!response.ok) {
      throw new Error(`Failed to get question counts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.counts;
  } catch (error) {
    console.error('Error getting question counts:', error);
    throw error;
  }
}

/**
 * Check if the enhanced assessment API is available
 * @returns True if the API is available
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Enhanced assessment API not available:', error);
    return false;
  }
}