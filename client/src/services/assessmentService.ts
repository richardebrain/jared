import { apiRequest } from '@/lib/queryClient';

// Define types for the assessment system
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

export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
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

// Start a new assessment
export async function startAssessment(userId: number): Promise<{ assessment_id: number }> {
  try {
    const response = await fetch('http://localhost:8000/api/assessments/start', {
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

    return await response.json();
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
}

// Get the next question
export async function getNextQuestion(
  assessmentId: number,
  history: AssessmentHistoryItem[]
): Promise<QuestionResponse> {
  try {
    const response = await fetch('http://localhost:8000/api/assessments/next-question', {
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
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get next question');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}

// Submit an answer
export async function submitAnswer(
  assessmentId: number,
  questionId: number,
  userAnswer: string,
  timeTakenMs?: number
): Promise<AnswerResult> {
  try {
    const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}/submit`, {
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
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit answer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

// Finish the assessment and get learning path
export async function finishAssessment(assessmentId: number): Promise<LearningPathResponse> {
  try {
    const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to finish assessment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error finishing assessment:', error);
    throw error;
  }
}