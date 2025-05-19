import axios from 'axios';

// Use this base URL that points to our Python FastAPI backend
const ASSESSMENT_API_BASE_URL = 'http://localhost:8088/api/v1';

class AssessmentService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: ASSESSMENT_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for session-based auth
    });
  }

  /**
   * Check if the assessment API is healthy
   * @returns Health status object
   */
  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Get a list of available assessment domains
   * @returns Array of domain names
   */
  async getDomains() {
    try {
      const response = await this.axiosInstance.get('/domains');
      return response.data;
    } catch (error) {
      console.error('Error fetching domains:', error);
      throw new Error('Failed to fetch assessment domains');
    }
  }

  /**
   * Get statistics for a specific domain
   * @param domain Domain name
   * @returns Domain statistics
   */
  async getDomainStats(domain: string) {
    try {
      const response = await this.axiosInstance.get(`/domains/${encodeURIComponent(domain)}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for domain ${domain}:`, error);
      throw new Error(`Failed to fetch statistics for domain: ${domain}`);
    }
  }

  /**
   * Start a new assessment in the specified domain
   * @param domain Domain name
   * @param userId User ID
   * @returns First question for the assessment
   */
  async startAssessment(domain: string, userId: number) {
    try {
      const response = await this.axiosInstance.post('/assessments/start', {
        domain,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting assessment:', error);
      throw new Error('Failed to start assessment');
    }
  }

  /**
   * Submit an answer to a question
   * @param questionId Question ID
   * @param answer User's answer
   * @param userId User ID
   * @param timeTaken Time taken to answer in seconds (optional)
   * @returns Assessment result with feedback and next question
   */
  async submitAnswer(questionId: number, answer: string, userId: number, timeTaken?: number) {
    try {
      const response = await this.axiosInstance.post('/assessments/submit', {
        question_id: questionId,
        answer,
        user_id: userId,
        time_taken: timeTaken,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer');
    }
  }

  /**
   * Get a learning path for a user
   * @param userId User ID
   * @returns Personalized learning path
   */
  async getLearningPath(userId: number) {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}/learning-path`);
      return response.data;
    } catch (error) {
      console.error('Error fetching learning path:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  /**
   * Get user progress across all domains
   * @param userId User ID
   * @returns User progress data
   */
  async getUserProgress(userId: number) {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch progress data');
    }
  }

  /**
   * Get leaderboard data
   * @param schoolId School ID (optional)
   * @param limit Maximum number of users to return
   * @returns Leaderboard data
   */
  async getLeaderboard(schoolId?: number, limit: number = 10) {
    try {
      let url = `/leaderboard?limit=${limit}`;
      if (schoolId) {
        url += `&school_id=${schoolId}`;
      }
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard data');
    }
  }
}

export default new AssessmentService();