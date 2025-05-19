/**
 * MentorMe Enhanced Assessment Service
 * This service handles communication with the FastAPI assessment backend
 */

// Define the base URL for the assessment API
// This will need to be updated with the actual URL when deployed
const ASSESSMENT_API_BASE_URL = process.env.REACT_APP_ASSESSMENT_API_URL || 'http://localhost:8000';

// Types for assessment data
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
  user_answer: string;
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

export interface LearningPath {
  learning_path: Record<string, string[]>;
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

/**
 * Start a new assessment
 * @param userId User ID to track assessment progress
 * @returns Assessment ID for tracking
 */
export async function startAssessment(userId: number): Promise<number> {
  try {
    const response = await fetch(`${ASSESSMENT_API_BASE_URL}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start assessment');
    }

    const data = await response.json();
    return data.assessment_id;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
}

/**
 * Get the next question based on assessment history
 * @param assessmentId Assessment ID
 * @param history Array of previous questions and answers
 * @returns Next question or null if assessment is complete
 */
export async function getNextQuestion(
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<AssessmentQuestion | null> {
  try {
    const response = await fetch(`${ASSESSMENT_API_BASE_URL}/api/assessments/next-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessment_id: assessmentId,
        history,
      }),
    });

    // If we get a 200 with "All questions have been asked" detail, assessment is complete
    if (response.status === 200) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.detail === 'All questions have been asked') {
          return null; // No more questions
        }
        return data;
      } catch {
        return JSON.parse(text);
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get next question');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 * @param assessmentId Assessment ID
 * @param submission Answer submission data
 * @returns Result of the answer submission
 */
export async function submitAnswer(
  assessmentId: number,
  submission: AnswerSubmission
): Promise<AnswerResult> {
  try {
    const response = await fetch(
      `${ASSESSMENT_API_BASE_URL}/api/assessments/${assessmentId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit answer');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Finish an assessment and get a personalized learning path
 * @param assessmentId Assessment ID
 * @returns Personalized learning path and assessment results
 */
export async function finishAssessment(assessmentId: number): Promise<LearningPath> {
  try {
    const response = await fetch(
      `${ASSESSMENT_API_BASE_URL}/api/assessments/${assessmentId}/finish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to finish assessment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
}