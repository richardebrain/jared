/**
 * Assessment Service for the MentorMe Enhanced Assessment System
 * This service communicates with the FastAPI backend for the enhanced assessment functionality
 */

// Define the base URL for the assessment API
const ASSESSMENT_API_BASE_URL = process.env.ASSESSMENT_API_URL || 'http://localhost:8000';

// Types for API requests and responses
export interface AssessmentStartRequest {
  user_id: number;
}

export interface AssessmentStartResponse {
  assessment_id: number;
  message: string;
}

export interface QuestionOption {
  [key: string]: string;
}

export interface Question {
  id: number;
  question: string;
  q_type: string;
  options: QuestionOption;
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
  extended_content?: {
    story_why?: string;
    implementation_how?: string;
    science_behind_it?: string;
    practical_application?: string;
    [key: string]: string | undefined;
  };
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

export interface LearningPath {
  recommended_modules: string[];
  focus_areas: string[];
}

export interface AssessmentResult {
  learning_path: LearningPath;
  domain_scores: { [domain: string]: number };
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

/**
 * Start a new assessment for a user
 * @param userId ID of the user taking the assessment
 * @returns AssessmentStartResponse containing the new assessment ID
 */
export async function startAssessment(userId: number): Promise<AssessmentStartResponse> {
  try {
    const response = await fetch(`${ASSESSMENT_API_BASE_URL}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`Error starting assessment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to start assessment:', error);
    throw error;
  }
}

/**
 * Get the next question for an assessment based on history
 * @param assessmentId ID of the current assessment
 * @param history Array of previous questions and answers
 * @returns Question object or null if assessment is complete
 */
export async function getNextQuestion(
  assessmentId: number,
  history: AssessmentHistoryItem[],
): Promise<Question | null> {
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

    if (response.status === 200) {
      const data = await response.json();
      // If we get a detail message, the assessment is complete
      if (data.detail && (data.detail === "All sections completed" || data.detail === "All questions have been asked")) {
        return null;
      }
      return data;
    }

    if (!response.ok) {
      throw new Error(`Error getting next question: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to get next question:', error);
    throw error;
  }
}

/**
 * Submit an answer for a question
 * @param assessmentId ID of the current assessment
 * @param submission Answer submission data
 * @returns AnswerResult with feedback on the submission
 */
export async function submitAnswer(
  assessmentId: number,
  submission: AnswerSubmission,
): Promise<AnswerResult> {
  try {
    const response = await fetch(`${ASSESSMENT_API_BASE_URL}/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error(`Error submitting answer: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to submit answer:', error);
    throw error;
  }
}

/**
 * Finish an assessment and get the learning path
 * @param assessmentId ID of the assessment to finish
 * @returns AssessmentResult with learning path and scores
 */
export async function finishAssessment(assessmentId: number): Promise<AssessmentResult> {
  try {
    const response = await fetch(`${ASSESSMENT_API_BASE_URL}/api/assessments/${assessmentId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error finishing assessment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to finish assessment:', error);
    throw error;
  }
}