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
      
      // Return a fallback question from our expanded set based on domain and difficulty
      const fallbackQuestions = this.getFallbackQuestions(domain, 1);
      
      // Pick a random question from the available fallback questions
      const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
      return fallbackQuestions[randomIndex];
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
        // Find the correct fallback question based on the ID
        // First flatten all our fallback questions into one array
        const allFallbackQuestions = Object.values(this.getFallbackQuestionsByDomain()).flat();
        
        // Find the question that was being answered
        const currentQuestion = allFallbackQuestions.find(q => q.id === questionId);
        
        if (!currentQuestion) {
          console.error('Could not find fallback question with ID:', questionId);
          // If we can't find the question, return a generic response
          return {
            is_correct: false,
            correct_answer: "",
            explanation: "We couldn't validate your answer. Please try again.",
            points_earned: 0,
            message: "There was an error processing your answer.",
            next_difficulty: 1,
            assessment_complete: true,
            completion_stats: {
              questions_attempted: 1,
              questions_correct: 0,
              accuracy: 0,
              proficiency: 0,
              highest_difficulty: 1,
              total_points: 0
            }
          };
        }
        
        // Check if the answer is correct
        const isCorrect = answer.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
        
        // Calculate the next difficulty based on current difficulty and whether the answer was correct
        let nextDifficulty = currentQuestion.difficulty;
        if (isCorrect) {
          // If correct, increase difficulty (max 3)
          nextDifficulty = Math.min(3, currentQuestion.difficulty + 1);
        } else {
          // If incorrect, decrease difficulty (min 1)
          nextDifficulty = Math.max(1, currentQuestion.difficulty - 1);
        }
        
        // Determine if we should get another question or complete the assessment
        // For simplicity, we'll complete after 3 questions or when reaching difficulty 3
        const shouldComplete = Math.random() > 0.7 || nextDifficulty >= 3;
        
        // If not complete, get the next question
        let nextQuestion = undefined;
        if (!shouldComplete) {
          // Get questions of the next difficulty level
          const availableQuestions = this.getFallbackQuestions(currentQuestion.domain, nextDifficulty)
            // Filter out the current question
            .filter(q => q.id !== currentQuestion.id);
          
          if (availableQuestions.length > 0) {
            // Pick a random question from available questions
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            nextQuestion = availableQuestions[randomIndex];
          }
        }
        
        // Success messages based on correctness
        const successMessages = [
          "Excellent work! That's correct!",
          "Great job! You got it right!",
          "Well done! Perfect answer!",
          "That's right! Impressive knowledge!",
          "Correct! You're doing great!"
        ];
        
        // Encouragement messages for incorrect answers
        const encouragementMessages = [
          "Not quite right. Let's try another approach.",
          "That's not correct, but it's a good learning opportunity.",
          "Close, but not the answer we're looking for.",
          "Not quite. Let's review this concept.",
          "That's not right, but don't worry - learning is a journey!"
        ];
        
        // Select a random message based on correctness
        const messageIndex = Math.floor(Math.random() * 5);
        const message = isCorrect ? 
          successMessages[messageIndex] : 
          encouragementMessages[messageIndex];
        
        // Return the simulated response
        return {
          is_correct: isCorrect,
          correct_answer: currentQuestion.correct_answer,
          explanation: currentQuestion.explanation || "No additional explanation available for this question.",
          points_earned: isCorrect ? currentQuestion.points_value : 0,
          message: message,
          next_difficulty: nextDifficulty,
          next_question: nextQuestion,
          assessment_complete: shouldComplete,
          completion_stats: {
            questions_attempted: 1,
            questions_correct: isCorrect ? 1 : 0,
            accuracy: isCorrect ? 100 : 0,
            proficiency: isCorrect ? 25 : 0,
            highest_difficulty: currentQuestion.difficulty,
            total_points: isCorrect ? currentQuestion.points_value : 0
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

  /**
   * Get fallback questions for a specific domain and difficulty
   * This is used when the assessment API is not available
   */
  getFallbackQuestions(domain: string, difficulty: number): AssessmentQuestion[] {
    // Define a collection of fallback questions by domain
    const fallbackQuestionsByDomain: Record<string, AssessmentQuestion[]> = {
      "Child Development": [
        {
          id: 1001,
          question: "What are the key developmental milestones for a 4-year-old child?",
          domain: "Child Development",
          sub_domain: "Cognitive Development",
          difficulty: 1,
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
        },
        {
          id: 1002,
          question: "Which of the following best describes the concept of scaffolding in early childhood education?",
          domain: "Child Development",
          sub_domain: "Teaching Strategies",
          difficulty: 1,
          q_type: "multiple_choice",
          options: {
            "a": "Providing physical structures for children to climb on",
            "b": "Offering temporary support to help children master new skills before gradually removing assistance",
            "c": "Creating a fixed curriculum that all children must follow",
            "d": "Grouping children by ability level for all activities"
          },
          correct_answer: "b",
          explanation: "Scaffolding involves providing temporary support to help children master new skills and concepts, then gradually removing that support as they become more proficient.",
          points_value: 10
        },
        {
          id: 1003,
          question: "Which theory emphasizes that children develop through interactions with more knowledgeable others?",
          domain: "Child Development",
          sub_domain: "Developmental Theories",
          difficulty: 2,
          q_type: "multiple_choice",
          options: {
            "a": "Piaget's Cognitive Development Theory",
            "b": "Vygotsky's Sociocultural Theory",
            "c": "Erikson's Psychosocial Development Theory",
            "d": "Behaviorist Theory"
          },
          correct_answer: "b",
          explanation: "Vygotsky's Sociocultural Theory emphasizes that cognitive development occurs through social interactions with more knowledgeable individuals like parents, teachers, and peers.",
          points_value: 15
        }
      ],
      "Classroom Management": [
        {
          id: 2001,
          question: "What is an effective strategy for transitioning preschoolers between activities?",
          domain: "Classroom Management",
          sub_domain: "Transitions",
          difficulty: 1,
          q_type: "multiple_choice",
          options: {
            "a": "Immediately stopping one activity and starting another",
            "b": "Using visual and auditory signals like a cleanup song or timer",
            "c": "Allowing children to wander until they find the next activity",
            "d": "Having teachers physically move children to new activities"
          },
          correct_answer: "b",
          explanation: "Using consistent signals like cleanup songs, timers, or visual cues helps children understand expectations and prepare for transitions.",
          points_value: 10
        },
        {
          id: 2002,
          question: "Which approach is most effective for addressing a preschooler's challenging behavior?",
          domain: "Classroom Management",
          sub_domain: "Behavior Management",
          difficulty: 1,
          q_type: "multiple_choice",
          options: {
            "a": "Removing the child from the classroom for the rest of the day",
            "b": "Identifying triggers, teaching alternative behaviors, and providing positive reinforcement",
            "c": "Ignoring all challenging behaviors to avoid reinforcing them",
            "d": "Implementing strict consequences for every infraction"
          },
          correct_answer: "b",
          explanation: "Effective behavior management includes understanding what triggers challenging behaviors, teaching children appropriate alternatives, and reinforcing positive behavior.",
          points_value: 10
        },
        {
          id: 2003,
          question: "When setting up a preschool classroom, what should be your primary consideration?",
          domain: "Classroom Management",
          sub_domain: "Environment",
          difficulty: 2,
          q_type: "multiple_choice",
          options: {
            "a": "Fitting as many activity centers as possible",
            "b": "Creating a visually appealing space for parents",
            "c": "Designing learning centers that support child development and engagement",
            "d": "Minimizing cleanup requirements"
          },
          correct_answer: "c",
          explanation: "Classroom setup should prioritize creating an environment with well-designed learning centers that support development across all domains and encourage engagement.",
          points_value: 15
        }
      ],
      "Curriculum & Planning": [
        {
          id: 3001,
          question: "What is the key characteristic of developmentally appropriate practice?",
          domain: "Curriculum & Planning",
          sub_domain: "Developmentally Appropriate Practice",
          difficulty: 1,
          q_type: "multiple_choice",
          options: {
            "a": "Teaching all children the same way regardless of their developmental level",
            "b": "Following a strict timeline for when skills should be mastered",
            "c": "Adapting teaching methods and activities to match children's developmental levels and interests",
            "d": "Focusing primarily on academic skills"
          },
          correct_answer: "c",
          explanation: "Developmentally appropriate practice means adapting teaching approaches to match children's developmental capabilities, learning styles, and interests.",
          points_value: 10
        },
        {
          id: 3002,
          question: "Which approach to curriculum planning is most effective in early childhood education?",
          domain: "Curriculum & Planning",
          sub_domain: "Curriculum Development",
          difficulty: 1,
          q_type: "multiple_choice",
          options: {
            "a": "Rigidly following a prescribed curriculum without modification",
            "b": "Allowing children complete freedom with no teacher guidance",
            "c": "Integrating child interests with learning goals and providing both structure and choice",
            "d": "Focusing exclusively on academic readiness skills"
          },
          correct_answer: "c",
          explanation: "Effective curriculum planning balances structure and flexibility, incorporating children's interests while intentionally addressing learning goals across developmental domains.",
          points_value: 10
        },
        {
          id: 3003,
          question: "Why is intentional planning important in play-based learning?",
          domain: "Curriculum & Planning",
          sub_domain: "Play-Based Learning",
          difficulty: 2,
          q_type: "multiple_choice",
          options: {
            "a": "It ensures children stay on task and don't waste time",
            "b": "It transforms play into work so children learn discipline",
            "c": "It ensures learning goals are addressed while honoring the natural way children learn",
            "d": "It replaces play with academic activities"
          },
          correct_answer: "c",
          explanation: "Intentional planning in play-based learning ensures that while children engage in meaningful play, teachers can intentionally guide experiences toward learning goals and developmental milestones.",
          points_value: 15
        }
      ]
    };
    
    // If domain exists in our collection, filter by difficulty
    if (fallbackQuestionsByDomain[domain]) {
      const domainQuestions = fallbackQuestionsByDomain[domain];
      
      // Filter by difficulty if specified
      if (difficulty > 0) {
        const filteredQuestions = domainQuestions.filter(q => q.difficulty === difficulty);
        
        // If we have questions of the requested difficulty, return them
        if (filteredQuestions.length > 0) {
          return filteredQuestions;
        }
      }
      
      // If no difficulty filter or no questions at requested difficulty, return all questions for domain
      return domainQuestions;
    }
    
    // If domain not found, return a mix of questions from all domains as fallback
    const allQuestions: AssessmentQuestion[] = Object.values(fallbackQuestionsByDomain).flat();
    
    // Filter by difficulty if specified
    if (difficulty > 0) {
      const filteredQuestions = allQuestions.filter(q => q.difficulty === difficulty);
      
      // If we have questions of the requested difficulty, return them
      if (filteredQuestions.length > 0) {
        return filteredQuestions;
      }
    }
    
    // If no questions match the requested difficulty, return all questions
    return allQuestions;
  }
}

export default new EnhancedAssessmentService();