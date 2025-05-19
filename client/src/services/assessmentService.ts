/**
 * Assessment Service - Connects to the FastAPI backend for the enhanced assessment system
 */

import axios from 'axios';

// Base URL for the FastAPI backend
const API_BASE_URL = 'http://localhost:8000/api';

// API endpoints
const ENDPOINTS = {
  START_ASSESSMENT: '/assessments/start',
  NEXT_QUESTION: '/assessments/next-question',
  SUBMIT_ANSWER: (assessmentId: number) => `/assessments/${assessmentId}/submit`,
  FINISH_ASSESSMENT: (assessmentId: number) => `/assessments/${assessmentId}/finish`,
};

// Define interfaces for API requests and responses
export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}

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
  extended_content?: Record<string, any>;
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
 * Start a new assessment
 * @param userId - ID of the user taking the assessment
 * @returns Assessment ID
 */
export const startAssessment = async (userId: number): Promise<number> => {
  try {
    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.START_ASSESSMENT}`, {
      user_id: userId,
    });
    
    return response.data.assessment_id;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
};

/**
 * Get the next question for an assessment
 * @param assessmentId - ID of the current assessment
 * @param history - Array of previously answered questions
 * @returns Next question or null if assessment is complete
 */
export const getNextQuestion = async (
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<QuestionResponse | null> => {
  try {
    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.NEXT_QUESTION}`, {
      assessment_id: assessmentId,
      history,
    });
    
    // If response includes 'detail', it means no more questions available
    if (response.data.detail) {
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
};

/**
 * Submit an answer for a question
 * @param assessmentId - ID of the current assessment
 * @param questionId - ID of the question being answered
 * @param userAnswer - User's answer (A, B, C, or D)
 * @param timeTakenMs - Time taken to answer in milliseconds (optional)
 * @returns Result of the answer submission
 */
export const submitAnswer = async (
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
): Promise<AnswerResult> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.SUBMIT_ANSWER(assessmentId)}`,
      {
        question_id: questionId,
        user_answer: userAnswer,
        time_taken_ms: timeTakenMs,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Finish an assessment and get learning path
 * @param assessmentId - ID of the assessment to finish
 * @returns Learning path and assessment results
 */
export const finishAssessment = async (assessmentId: number): Promise<LearningPathResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.FINISH_ASSESSMENT(assessmentId)}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
};