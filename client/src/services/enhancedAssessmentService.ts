import axios from 'axios';

// Base URL for the enhanced assessment API adapter
const BASE_URL = '/api/assessment-adapter';

// Fallback domains to use when API is unavailable
const FALLBACK_DOMAINS: Domain[] = [
  {
    id: 1,
    name: "Child Development",
    description: "Understanding how children grow and develop",
    color: "#4CAF50",
    is_active: true,
    sub_domains: []
  },
  {
    id: 2,
    name: "Classroom Management",
    description: "Strategies for effective classroom organization and management",
    color: "#2196F3",
    is_active: true,
    sub_domains: []
  },
  {
    id: 3,
    name: "Curriculum & Planning",
    description: "Developing engaging learning experiences",
    color: "#FF9800",
    is_active: true,
    sub_domains: []
  }
];

// Types
export interface AssessmentQuestion {
  id: number;
  question: string;
  domain: string;
  sub_domain?: string;
  difficulty: number;
  q_type: string;
  options: Record<string, string>;
  hints?: string[];
  time_limit?: number;
  points_value: number;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  points_earned: number;
  message: string;
  next_difficulty: number;
  next_question?: AssessmentQuestion;
  assessment_complete: boolean;
  completion_stats?: {
    questions_attempted: number;
    questions_correct: number;
    accuracy: number;
    proficiency: number;
    highest_difficulty: number;
    total_points: number;
  };
}

export interface Domain {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sub_domains?: Domain[];
  color?: string; // Added to support fallback domains
}

export interface LearningPath {
  user_id: number;
  questions_asked: number;
  questions_correct: number;
  strongest_domain: string;
  weakest_domain: string;
  user_name: string;
  total_points_earned: number;
  recommendations: Array<{
    type: string;
    domain: string;
    message: string;
    description?: string;
    difficulty?: number;
    current_difficulty?: number;
    target_difficulty?: number;
    accuracy?: number;
    proficiency?: number;
  }>;
  achievement_opportunities?: Array<{
    id: number;
    name: string;
    description: string;
    points_reward: number;
    bear_bucks_reward: number;
  }>;
}

/**
 * Enhanced Assessment Service
 * This service connects to the Python-based assessment API
 */
class EnhancedAssessmentService {
  /**
   * Get all available assessment domains
   * Returns fallback domains if API is not available
   */
  async getDomains(): Promise<Domain[]> {
    try {
      const response = await axios.get(`${BASE_URL}/domains`);
      return response.data;
    } catch (error) {
      console.error('Error fetching domains:', error);
      // Return fallback domains instead of throwing error
      // This prevents the UI from breaking when backend is down
      return FALLBACK_DOMAINS;
    }
  }

  /**
   * Start a new assessment in the specified domain
   */
  async startAssessment(domain: string, userId: number, difficulty?: number): Promise<AssessmentQuestion> {
    try {
      console.log('Starting assessment with params:', { domain, user_id: userId, difficulty });
      
      // First try with the updated endpoint path
      try {
        const response = await axios.post(`${BASE_URL}/start`, {
          domain,
          user_id: userId,
          difficulty: 1 // Always start with difficulty level 1
        }, { timeout: 12000 });
        
        console.log('Assessment started successfully, question received');
        
        // Process response data to ensure it's in the correct format
        const questionData = response.data;
        
        // Standard format check and conversion
        if (questionData && questionData.question) {
          // Ensure options is in object format if it's an array
          if (Array.isArray(questionData.options)) {
            const optionsObject = {};
            questionData.options.forEach((option, index) => {
              const key = String.fromCharCode(97 + index); // 'a', 'b', 'c', etc.
              optionsObject[key] = option;
            });
            questionData.options = optionsObject;
          }
          
          // Ensure difficulty is a number
          if (typeof questionData.difficulty !== 'number') {
            questionData.difficulty = 1;
          }
          
          // Ensure q_type is set
          if (!questionData.q_type) {
            questionData.q_type = 'multiple_choice';
          }
          
          return questionData;
        }
        
        throw new Error('Invalid question format received from API');
        
      } catch (initialError) {
        console.log('First attempt failed, trying alternative endpoint...');
        // If first attempt fails, try the alternative endpoint
        try {
          const alternativeResponse = await axios.post('/api/assessment/start', {
            domain,
            user_id: userId,
            difficulty: 1 // Always start with difficulty level 1
          }, { timeout: 12000 });
          
          // Process response data
          const questionData = alternativeResponse.data;
          
          // Apply the same format checks and conversions
          if (questionData && questionData.question) {
            if (Array.isArray(questionData.options)) {
              const optionsObject = {};
              questionData.options.forEach((option, index) => {
                const key = String.fromCharCode(97 + index);
                optionsObject[key] = option;
              });
              questionData.options = optionsObject;
            }
            
            if (typeof questionData.difficulty !== 'number') {
              questionData.difficulty = 1;
            }
            
            if (!questionData.q_type) {
              questionData.q_type = 'multiple_choice';
            }
            
            return questionData;
          }
          
          throw new Error('Invalid question format received from alternative API');
        } catch (alternativeError) {
          throw alternativeError;
        }
      }
    } catch (error) {
      console.error('Error starting assessment (all attempts failed):', error);
      
      // Check if API is available with a quick health check
      const isAvailable = await this.checkHealth().catch(() => false);
      
      // Return a fallback question if the assessment API is unavailable
      return {
        id: 999,
        question: "What are the key developmental milestones for a 4-year-old child?",
        domain: domain,
        difficulty: 1, // Always start with difficulty level 1
        q_type: "multiple_choice",
        options: {
          "a": "Using complete sentences and following 2-3 step instructions",
          "b": "Walking and basic self-feeding",
          "c": "Abstract reasoning and algebra",
          "d": "Writing in cursive and reading chapter books"
        },
        correct_answer: "a",
        explanation: "By age 4, most children can use complete sentences and follow 2-3 step instructions, which is an important developmental milestone.",
        points_value: 10
      };
    }
  }

  /**
   * Submit an answer to an assessment question
   */
  async submitAnswer(
    questionId: number,
    answer: string,
    userId: number,
    timeTaken?: number
  ): Promise<AnswerResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/answer`, {
        question_id: questionId,
        answer,
        user_id: userId,
        time_taken: timeTaken
      }, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      // Check if API is available
      const isAvailable = await this.checkHealth().catch(() => false);
      
      if (!isAvailable) {
        // Return a fallback response if the assessment API is unavailable
        const isCorrect = questionId === 999 && answer === "a"; // For our fallback question
        
        // Simulate a response for the fallback question
        return {
          is_correct: isCorrect,
          correct_answer: "a",
          explanation: "Using complete sentences and following multi-step instructions are key developmental milestones for 4-year-olds.",
          points_earned: isCorrect ? 10 : 0,
          message: isCorrect ? 
            "Great job! That's correct!" : 
            "Not quite. Four-year-olds typically can use complete sentences and follow 2-3 step instructions.",
          next_difficulty: 1,
          assessment_complete: true,
          completion_stats: {
            questions_attempted: 1,
            questions_correct: isCorrect ? 1 : 0,
            accuracy: isCorrect ? 100 : 0,
            proficiency: isCorrect ? 25 : 0,
            highest_difficulty: 1,
            total_points: isCorrect ? 10 : 0
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Get user's learning progress
   */
  async getUserProgress(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/progress/${userId}`, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      
      // Check if API is available
      const isAvailable = await this.checkHealth().catch(() => false);
      
      if (!isAvailable) {
        // Return fallback progress data
        return {
          domains: FALLBACK_DOMAINS.map(domain => ({
            domain: domain.name,
            questions_attempted: 0,
            questions_correct: 0,
            accuracy: 0,
            highest_difficulty: 0,
            current_level: 0,
            points_earned: 0
          }))
        };
      }
      
      throw error;
    }
  }

  /**
   * Get personalized learning path for a user
   */
  async getLearningPath(userId: number): Promise<LearningPath> {
    try {
      const response = await axios.get(`${BASE_URL}/learning-path/${userId}`, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching learning path:', error);
      
      // Check if API is available
      const isAvailable = await this.checkHealth().catch(() => false);
      
      if (!isAvailable) {
        // Return fallback learning path
        // We'll get the user's name from the frontend if needed
        return {
          user_id: userId,
          questions_asked: 0,
          questions_correct: 0,
          strongest_domain: "Classroom Management",
          weakest_domain: "Child Development",
          user_name: "User",
          total_points_earned: 0,
          recommendations: [
            {
              type: "suggested_learning",
              domain: "Child Development",
              message: "Take some time to explore child development resources",
              description: "Understanding developmental milestones will help you create age-appropriate activities"
            },
            {
              type: "strength",
              domain: "Classroom Management",
              message: "You're doing well with classroom management skills"
            }
          ]
        };
      }
      
      throw error;
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(schoolId?: number, limit = 10): Promise<any[]> {
    try {
      let params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId.toString());
      if (limit) params.append('limit', limit.toString());
      
      const url = `${BASE_URL}/leaderboard?${params.toString()}`;
      
      const response = await axios.get(url, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Check if API is available
      const isAvailable = await this.checkHealth().catch(() => false);
      
      if (!isAvailable) {
        // Return empty leaderboard if assessment API is unavailable
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Check if the assessment API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Assessment API health check failed:', error);
      return false;
    }
  }
}

export default new EnhancedAssessmentService();