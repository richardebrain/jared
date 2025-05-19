/**
 * Enhanced Assessment Service
 * Service for communicating with the MentorMe Enhanced Assessment API
 */

// API base URL - will need to be configurable for production
const API_BASE_URL = 'http://localhost:8000';

// Assessment history item interface
export interface AssessmentHistoryItem {
  question_id: number;
  domain: string;
  correct: boolean;
  difficulty: number;
}

// Interface for question response
export interface QuestionResponse {
  id: number;
  question: string;
  q_type: string;
  options: Record<string, string>;
  domain: string;
  difficulty: number;
  enhanced_content?: Record<string, string>;
}

// Interface for answer submission
export interface AnswerSubmission {
  question_id: number;
  user_answer: string;
  time_taken_ms?: number;
}

// Interface for answer feedback
export interface AnswerFeedback {
  correct: boolean;
  correct_answer: string;
  personal_message: string;
  teaching_explanation: string;
}

// Interface for learning path
export interface LearningPath {
  learning_path: Record<string, string[]>;
  domain_scores: Record<string, number>;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
  user_name?: string;
  total_points_earned: number;
}

// Assessment service class
class AssessmentService {
  private baseUrl: string;
  
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Set the API base URL
   * @param baseUrl New base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Start a new assessment
   * @param userId User ID
   * @returns Promise with assessment ID
   */
  async startAssessment(userId: number): Promise<{ assessment_id: number }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start assessment: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get the next question in an assessment
   * @param assessmentId Assessment ID
   * @param history Assessment history
   * @returns Promise with question or completion status
   */
  async getNextQuestion(
    assessmentId: number, 
    history: AssessmentHistoryItem[]
  ): Promise<QuestionResponse | { assessment_complete: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}/next-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assessment_id: assessmentId,
        history
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get next question: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Submit an answer to a question
   * @param assessmentId Assessment ID
   * @param submission Answer submission
   * @returns Promise with answer feedback
   */
  async submitAnswer(
    assessmentId: number, 
    submission: AnswerSubmission
  ): Promise<AnswerFeedback> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submission)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit answer: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Finish an assessment and get results
   * @param assessmentId Assessment ID
   * @returns Promise with learning path
   */
  async finishAssessment(assessmentId: number): Promise<LearningPath> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to finish assessment: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get a list of all assessment domains
   * @returns Promise with domains array
   */
  async getDomains(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/domains`);
    
    if (!response.ok) {
      throw new Error(`Failed to get domains: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.domains;
  }
  
  /**
   * Get the count of questions for each domain
   * @returns Promise with domain counts
   */
  async getDomainQuestionCounts(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/api/domain-question-counts`);
    
    if (!response.ok) {
      throw new Error(`Failed to get domain question counts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.domain_counts;
  }
}

// Export a singleton instance
export const assessmentService = new AssessmentService();

// Export the class for testing or custom instances
export default AssessmentService;