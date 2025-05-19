/**
 * Assessment Service 
 * Handles API calls to the enhanced assessment backend
 */

const API_BASE_URL = 'http://localhost:8000';

export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
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

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  extended_content?: {
    teaching_explanation?: string;
    story_why?: string;
    implementation_how?: string;
    reflection_considerations?: string;
    child_impact_story?: string;
    science_behind_it?: string;
    practical_application_strategy?: string;
    why_behind_it?: string;
    resources?: string[];
  };
}

export interface LearningPath {
  learning_path: { [domain: string]: string[] };
  domain_scores: { [domain: string]: number };
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
}

/**
 * Start a new assessment for a user
 * @param userId User ID to start assessment for
 * @returns Promise with assessment ID
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
 * Get the next question in the assessment
 * @param assessmentId Assessment ID
 * @param history Previous question history
 * @returns Promise with next question or completion status
 */
export async function getNextQuestion(assessmentId: number, history: AssessmentHistoryItem[]): Promise<Question | { complete: true }> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/next-question`, {
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
      throw new Error(`Failed to get next question: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if assessment is complete
    if (data.complete) {
      return { complete: true };
    }
    
    return data as Question;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}

/**
 * Submit an answer for a question
 * @param assessmentId Assessment ID
 * @param questionId Question ID
 * @param userAnswer User's answer (A, B, C, or D)
 * @param timeTakenMs Optional time taken to answer in milliseconds
 * @returns Promise with answer result
 */
export async function submitAnswer(
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
): Promise<AnswerResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/submit-answer`, {
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
 * @returns Promise with learning path
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