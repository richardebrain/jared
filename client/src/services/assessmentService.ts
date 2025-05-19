/**
 * Enhanced Assessment Service
 * Provides API methods to interact with the Python FastAPI assessment backend
 */
import axios from 'axios';

// Define the base URL for the FastAPI server
// In production, this would be a deployed URL
const API_BASE_URL = 'http://localhost:8000';

// API endpoints
const ENDPOINTS = {
  START: '/api/assessment/start',
  NEXT_QUESTION: (id: number) => `/api/assessment/${id}/next-question`,
  SUBMIT_ANSWER: (id: number) => `/api/assessment/${id}/submit-answer`,
  FINISH: (id: number) => `/api/assessment/${id}/finish`,
};

// Define types for API requests and responses
export interface AssessmentStartRequest {
  user_id: number;
}

export interface AssessmentStartResponse {
  assessment_id: number;
  message: string;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  q_type: string;
  options: Record<string, string>;
  domain: string;
  difficulty: number;
}

export interface AnswerSubmission {
  question_id: number;
  user_answer: string; // A, B, C, or D
  time_taken_ms?: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  extended_content?: Record<string, any>;
}

export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}

export interface NextQuestionRequest {
  assessment_id: number;
  history: AssessmentHistoryItem[];
}

export interface LearningPathResponse {
  learning_path: Record<string, string[]>;
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

/**
 * Starts a new assessment for the user
 * @param userId User ID to start the assessment for
 * @returns The assessment ID and a success message
 */
export const startAssessment = async (userId: number): Promise<AssessmentStartResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.START}`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
};

/**
 * Gets the next question for the assessment
 * @param assessmentId ID of the current assessment
 * @param history History of questions and answers so far
 * @returns The next question or null if the assessment is complete
 */
export const getNextQuestion = async (
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<AssessmentQuestion | null> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.NEXT_QUESTION(assessmentId)}`,
      { assessment_id: assessmentId, history }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
};

/**
 * Submits an answer for the current question
 * @param assessmentId ID of the current assessment
 * @param submission The answer submission data
 * @returns The result of the submission with feedback
 */
export const submitAnswer = async (
  assessmentId: number,
  submission: AnswerSubmission
): Promise<AnswerResult> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.SUBMIT_ANSWER(assessmentId)}`,
      submission
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Completes the assessment and gets the learning path
 * @param assessmentId ID of the current assessment
 * @returns The learning path and assessment results
 */
export const finishAssessment = async (
  assessmentId: number
): Promise<LearningPathResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.FINISH(assessmentId)}`
    );
    return response.data;
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
};