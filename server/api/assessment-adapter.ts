import express from 'express';
import axios from 'axios';
import { Router } from 'express';
import { check, validationResult } from 'express-validator';

/**
 * Assessment API Adapter
 * 
 * This module provides a compatibility layer between the frontend components
 * and the Python FastAPI assessment backend.
 */

const ASSESSMENT_API_URL = 'http://localhost:8088';
const router = Router();

/**
 * Health check endpoint
 * 
 * This checks if the Python FastAPI assessment backend is running
 */
router.get('/health', async (_req, res) => {
  try {
    console.log('Checking assessment API health status...');
    const response = await axios.get(`${ASSESSMENT_API_URL}/health`, { timeout: 5000 });
    console.log('Assessment API health check successful');
    return res.json({
      status: 'available',
      version: response.data.version,
      timestamp: response.data.timestamp
    });
  } catch (error) {
    console.error('Assessment API health check failed:', error.message);
    // Return 200 instead of 503 to prevent frontend from breaking completely
    // This allows the rest of the app to function while showing a warning about assessment availability
    return res.status(200).json({
      status: 'degraded',
      available: false,
      error: 'Assessment service is not running. Please run start_assessment_api.sh to start the service.',
      message: error.message
    });
  }
});

/**
 * Get available domains
 */
router.get('/domains', async (_req, res) => {
  try {
    console.log('Fetching available assessment domains');
    const response = await axios.get(`${ASSESSMENT_API_URL}/domains`, {
      timeout: 8000
    });
    console.log('Assessment domains retrieved successfully');
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch domains from assessment API:', error.message);
    // Return a fallback set of domains if the service is unavailable
    // This allows the UI to still function
    return res.status(200).json([
      {
        "id": 1,
        "name": "Child Development",
        "description": "Understanding how children grow and develop",
        "color": "#4CAF50",
        "is_active": true
      },
      {
        "id": 2,
        "name": "Classroom Management",
        "description": "Strategies for effective classroom organization and management",
        "color": "#2196F3",
        "is_active": true
      },
      {
        "id": 3,
        "name": "Curriculum & Planning",
        "description": "Developing engaging learning experiences",
        "color": "#FF9800",
        "is_active": true
      }
    ]);
  }
});

/**
 * Get domain statistics
 */
router.get('/domain/:domain/stats', async (req, res) => {
  try {
    const { domain } = req.params;
    const response = await axios.get(`${ASSESSMENT_API_URL}/domain/${domain}/stats`);
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch domain statistics:', error);
    return res.status(500).json({
      error: 'Failed to fetch domain statistics'
    });
  }
});

/**
 * Start assessment in a domain
 */
router.post('/start', 
  [
    check('domain').isString().notEmpty(),
    check('user_id').isInt(),
    check('sub_domain').optional().isString(),
    check('difficulty').optional().isInt({ min: 1, max: 5 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { domain, user_id, sub_domain, difficulty } = req.body;
      
      console.log('Starting assessment with params:', { domain, user_id, sub_domain, difficulty });
      // Updated endpoint to match what's in backend/main.py
      const response = await axios.post(`${ASSESSMENT_API_URL}/assessment/start`, {
        domain,
        user_id,
        sub_domain,
        difficulty
      }, {
        timeout: 10000 // Add timeout to prevent hanging requests
      });
      
      return res.json(response.data);
    } catch (dbError) {
      console.error('Failed to start assessment:', dbError);
      return res.status(500).json({
        error: 'Failed to start assessment'
      });
    }
  }
);

/**
 * Submit answer to assessment question
 */
router.post('/answer', 
  [
    check('question_id').isInt(),
    check('answer').isString().notEmpty(),
    check('user_id').isInt(),
    check('time_taken').optional().isInt(),
    check('session_id').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Add logging to help debug
      console.log('Submitting answer to assessment backend:', req.body);
      
      const response = await axios.post(`${ASSESSMENT_API_URL}/assessment/answer`, req.body, {
        timeout: 10000 // Add timeout to prevent hanging requests
      });
      
      // Log successful response
      console.log('Assessment answer response received');
      
      return res.json(response.data);
    } catch (error) {
      console.error('Failed to submit answer:', error.message);
      
      // Provide more detailed error information for debugging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        return res.status(error.response.status).json({
          error: 'Failed to submit assessment answer',
          details: error.response.data
        });
      }
      
      return res.status(500).json({
        error: 'Failed to submit assessment answer',
        message: error.message
      });
    }
  }
);

/**
 * Get user progress
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching progress for user ${userId}`);
    // Updated URL to match FastAPI backend routes
    const response = await axios.get(`${ASSESSMENT_API_URL}/user/progress/${userId}`, {
      timeout: 8000
    });
    console.log('Progress data received successfully');
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch user progress:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch user progress',
      message: error.message,
      tip: 'Make sure the assessment API is running with bash start_assessment_api.sh'
    });
  }
});

/**
 * Get user learning path
 */
router.get('/learning-path/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching learning path for user ${userId}`);
    // Updated URL to match what the Python backend expects
    const response = await axios.get(`${ASSESSMENT_API_URL}/learning-path/${userId}`, {
      timeout: 8000
    });
    console.log('Learning path data received successfully');
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch learning path:', error.message);
    // More detailed error reporting
    return res.status(500).json({
      error: 'Failed to fetch learning path',
      message: error.message,
      tip: 'Make sure the assessment API is running. Use bash start_assessment_api.sh to start it.'
    });
  }
});

/**
 * Get leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { school_id, limit } = req.query;
    let url = `${ASSESSMENT_API_URL}/leaderboard`;
    
    const params = new URLSearchParams();
    if (school_id) params.append('school_id', String(school_id));
    if (limit) params.append('limit', String(limit));
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log(`Fetching leaderboard data from: ${url}`);
    const response = await axios.get(url, {
      timeout: 8000
    });
    console.log('Leaderboard data received successfully');
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message,
      tip: 'Make sure the assessment API is running with bash start_assessment_api.sh'
    });
  }
});

export default router;