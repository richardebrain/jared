/**
 * Service for communicating with the enhanced assessment API
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/enhanced-assessment' 
  : 'http://localhost:8000/api';

interface Question {
  id: number;
  question: string;
  q_type: string;
  options: Record<string, string>;
  domain: string;
  difficulty: number;
  enhanced_content?: {
    why_correct?: string;
    practical_application?: string;
    classroom_examples?: string;
    citations?: string;
    resources?: string[];
    sub_competency?: string;
  };
}

interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}

interface AnswerFeedback {
  correct: boolean;
  correct_answer: string;
  personal_message: string;
  teaching_explanation: string;
}

interface LearningPath {
  learning_path: Record<string, string[]>;
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
  user_name?: string;
  total_points_earned: number;
}

/**
 * Start a new assessment for a user
 * @param userId The ID of the user taking the assessment
 * @returns The assessment ID
 */
async function startAssessment(userId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
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
 * @param assessmentId The ID of the assessment
 * @param history The history of questions asked so far
 * @returns The next question or an object indicating the assessment is complete
 */
async function getNextQuestion(assessmentId: number, history: AssessmentHistoryItem[]): Promise<Question | { assessment_complete: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/next-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessment_id: assessmentId,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // If assessment is complete, return that info
    if (data.assessment_complete) {
      return { assessment_complete: true };
    }
    
    // Otherwise return the question
    return data as Question;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 * @param assessmentId The ID of the assessment
 * @param questionId The ID of the question
 * @param userAnswer The user's answer
 * @param timeTakenMs The time taken to answer in milliseconds
 * @returns Feedback on the answer
 */
async function submitAnswer(
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
): Promise<AnswerFeedback> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: questionId,
        user_answer: userAnswer,
        time_taken_ms: timeTakenMs,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data as AnswerFeedback;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Finish an assessment and get the learning path
 * @param assessmentId The ID of the assessment
 * @returns The learning path recommendations
 */
async function finishAssessment(assessmentId: number): Promise<LearningPath> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data as LearningPath;
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
}

/**
 * Check if the enhanced assessment API is available
 * @returns Whether the API is available
 */
async function isEnhancedAssessmentAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Enhanced assessment API not available:', error);
    return false;
  }
}

export {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  finishAssessment,
  isEnhancedAssessmentAvailable,
  type Question,
  type AssessmentHistoryItem,
  type AnswerFeedback,
  type LearningPath,
};