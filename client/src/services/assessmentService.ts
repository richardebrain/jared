/**
 * Assessment Service for connecting to the FastAPI enhanced assessment system
 */

// Use the same port our FastAPI API will be running on
const API_BASE_URL = "http://localhost:8000";

/**
 * Start a new assessment for a user
 * @param userId User ID to start the assessment for
 * @returns Assessment ID and message
 */
export const startAssessment = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/assessment/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start assessment: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Get the next question for an assessment
 * @param assessmentId Assessment ID
 * @param history Array of previously answered questions
 * @returns The next question
 */
export const getNextQuestion = async (assessmentId: number, history: any[]) => {
  const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/next`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assessment_id: assessmentId,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get next question: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Submit an answer to a question
 * @param assessmentId Assessment ID
 * @param questionId Question ID
 * @param userAnswer User's answer (A, B, C, or D)
 * @param timeTakenMs Time taken to answer in milliseconds (optional)
 * @returns Result with correct answer and explanation
 */
export const submitAnswer = async (
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
) => {
  const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question_id: questionId,
      user_answer: userAnswer,
      time_taken_ms: timeTakenMs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit answer: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Finish an assessment and get personalized learning path
 * @param assessmentId Assessment ID
 * @returns Learning path recommendations
 */
export const finishAssessment = async (assessmentId: number) => {
  const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to finish assessment: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Types for assessment responses
 */
export interface QuestionResponse {
  id: number;
  question: string;
  q_type: string;
  options: Record<string, string>;
  domain: string;
  difficulty: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  extended_content?: Record<string, string>;
}

export interface LearningPathResponse {
  learning_path: {
    recommended_modules: string[];
    focus_areas: string[];
  };
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}