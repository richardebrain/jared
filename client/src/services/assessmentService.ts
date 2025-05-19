/**
 * Assessment Service
 * Connects to the FastAPI backend for enhanced assessment functionality
 */

// API base URL - adjust based on your environment
const API_BASE_URL = '/api/assessment';

// Types
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
  message: string;
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
  resources?: any; // Could be string[] or other structured data
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
 * Start a new assessment for a user
 * @param userId The ID of the user taking the assessment
 * @returns Promise resolving to the assessment ID
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
 * @param assessmentId The ID of the current assessment
 * @param history Array of previous question responses
 * @returns Promise resolving to either the next question or a status object
 */
export async function getNextQuestion(
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<Question | { status: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/next-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        assessment_id: assessmentId,
        history
      }),
    });

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
 * Submit an answer for a question
 * @param assessmentId The ID of the current assessment
 * @param questionId The ID of the question being answered
 * @param answer The user's answer (A, B, C, or D)
 * @param timeTakenMs The time taken to answer in milliseconds
 * @returns Promise resolving to feedback about the answer
 */
export async function submitAnswer(
  assessmentId: number,
  questionId: number,
  answer: string,
  timeTakenMs?: number
): Promise<AnswerFeedback> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: questionId,
        user_answer: answer,
        time_taken_ms: timeTakenMs
      }),
    });

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
 * @param assessmentId The ID of the assessment to finish
 * @returns Promise resolving to the personalized learning path
 */
export async function finishAssessment(assessmentId: number): Promise<LearningPath> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
 * Get a list of all assessment domains
 * @returns Promise resolving to an array of domain names
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
 * Get the count of questions for each domain
 * @returns Promise resolving to an object with domain names as keys and counts as values
 */
export async function getDomainQuestionCounts(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${API_BASE_URL}/domains/question-counts`);
    
    if (!response.ok) {
      throw new Error(`Failed to get domain question counts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.counts;
  } catch (error) {
    console.error('Error getting domain question counts:', error);
    throw error;
  }
}

/**
 * Get a specific question by ID
 * @param questionId The ID of the question to retrieve
 * @returns Promise resolving to the question
 */
export async function getQuestion(questionId: number): Promise<Question> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get question: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting question:', error);
    throw error;
  }
}