/**
 * Assessment API Adapter
 * 
 * This module provides a compatibility layer between the frontend components
 * and the Python FastAPI assessment backend.
 */

import express from 'express';
import axios from 'axios';
import { pool } from '../database/pool';

// Constants
const ASSESSMENT_API_URL = 'http://localhost:8088/api';
const DEFAULT_DOMAINS = [
  {
    id: 1,
    name: 'Child Development',
    description: 'Understanding how children grow, develop and learn',
    is_active: true
  },
  {
    id: 2,
    name: 'Curriculum Planning',
    description: 'Creating effective learning experiences for children',
    is_active: true
  },
  {
    id: 3, 
    name: 'Classroom Management',
    description: 'Strategies for creating a positive learning environment',
    is_active: true
  },
  {
    id: 4,
    name: 'Family Engagement',
    description: 'Building partnerships with families and communities',
    is_active: true
  }
];

// Router setup
const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Try to connect to the assessment API
    const response = await axios.get(`${ASSESSMENT_API_URL}/health`, { timeout: 2000 });
    if (response.data?.status === 'ok') {
      return res.json({ status: 'ok', message: 'Assessment API is available' });
    }
    throw new Error('Assessment API returned invalid status');
  } catch (error) {
    console.error('Assessment API health check failed:', error.message);
    // Return fallback response - the frontend will handle this gracefully
    return res.json({ 
      status: 'unavailable', 
      message: 'Assessment API is not available. Start it with: bash start_assessment_api.sh'
    });
  }
});

/**
 * Get available domains
 */
router.get('/domains', async (req, res) => {
  try {
    // Try to get domains from the assessment API
    const response = await axios.get(`${ASSESSMENT_API_URL}/domains`, { timeout: 3000 });
    if (response.data && Array.isArray(response.data)) {
      return res.json(response.data);
    }
    throw new Error('Assessment API returned invalid domains data');
  } catch (error) {
    console.error('Failed to get domains from assessment API:', error.message);
    // Get domains from our database
    try {
      const { rows } = await pool.query(
        `SELECT DISTINCT domain as name, 
         COUNT(*) as question_count 
         FROM questions 
         GROUP BY domain 
         ORDER BY domain`
      );
      
      const domains = rows.map((row, index) => ({
        id: index + 1,
        name: row.name,
        description: `Contains ${row.question_count} questions`,
        is_active: true
      }));
      
      return res.json(domains.length > 0 ? domains : DEFAULT_DOMAINS);
    } catch (dbError) {
      console.error('Database query failed:', dbError.message);
      // Return default domains as fallback
      return res.json(DEFAULT_DOMAINS);
    }
  }
});

/**
 * Start assessment in a domain
 */
router.post('/assessments/start', async (req, res) => {
  const { domain, user_id, difficulty } = req.body;
  
  if (!domain || !user_id) {
    return res.status(400).json({ 
      error: 'Invalid request, domain and user_id are required' 
    });
  }
  
  try {
    // Try to start assessment via the assessment API
    const response = await axios.post(
      `${ASSESSMENT_API_URL}/assessments/start`, 
      { domain, user_id, difficulty },
      { timeout: 5000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to start assessment via API:', error.message);
    // Fallback: get a random question from our database
    try {
      const { rows } = await pool.query(
        `SELECT id, question, domain, sub_domain, difficulty, 
         q_type, options, correct_answer, points, time_limit, 
         tags
         FROM questions 
         WHERE domain = $1 
         ORDER BY RANDOM() 
         LIMIT 1`,
        [domain]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          error: 'No questions found for this domain' 
        });
      }
      
      const question = rows[0];
      let options = {};
      
      // Parse options if they're stored as a string
      if (question.options && typeof question.options === 'string') {
        try {
          options = JSON.parse(question.options);
        } catch {
          try {
            // Try eval as a fallback - this assumes options is a valid JS object literal
            options = eval(`(${question.options})`);
          } catch {
            options = { a: "Option A", b: "Option B", c: "Option C", d: "Option D" };
          }
        }
      }
      
      return res.json({
        id: question.id,
        question: question.question,
        domain: question.domain,
        sub_domain: question.sub_domain,
        difficulty: question.difficulty || 1,
        q_type: question.q_type || 'multiple_choice',
        options: options,
        time_limit: question.time_limit,
        points_value: question.points || (question.difficulty * 5)
      });
    } catch (dbError) {
      console.error('Database fallback failed:', dbError.message);
      return res.status(500).json({ 
        error: 'Failed to start assessment' 
      });
    }
  }
});

/**
 * Submit answer to assessment question
 */
router.post('/assessments/answer', async (req, res) => {
  const { question_id, answer, user_id, time_taken } = req.body;
  
  if (!question_id || !answer || !user_id) {
    return res.status(400).json({ 
      error: 'Invalid request, question_id, answer and user_id are required' 
    });
  }
  
  try {
    // Try to submit answer via the assessment API
    const response = await axios.post(
      `${ASSESSMENT_API_URL}/assessments/answer`, 
      { question_id, answer, user_id, time_taken },
      { timeout: 5000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to submit answer via API:', error.message);
    // Fallback: process the answer directly
    try {
      // Get the question
      const { rows: questionRows } = await pool.query(
        `SELECT id, question, domain, sub_domain, difficulty, 
         q_type, options, correct_answer, points
         FROM questions 
         WHERE id = $1`,
        [question_id]
      );
      
      if (questionRows.length === 0) {
        return res.status(404).json({ 
          error: 'Question not found' 
        });
      }
      
      const question = questionRows[0];
      const isCorrect = question.correct_answer === answer;
      const pointsEarned = isCorrect ? (question.points || question.difficulty * 5) : 0;
      
      // Update user points
      if (isCorrect) {
        await pool.query(
          `UPDATE users SET points = points + $1 WHERE id = $2`,
          [pointsEarned, user_id]
        );
      }
      
      // Record answer (if we have a table for it)
      try {
        await pool.query(
          `INSERT INTO assessment_answers 
           (user_id, question_id, user_answer, is_correct, points_earned)
           VALUES ($1, $2, $3, $4, $5)`,
          [user_id, question_id, answer, isCorrect, pointsEarned]
        );
      } catch (insertError) {
        // Table might not exist, continue anyway
        console.warn('Could not record answer in assessment_answers table:', insertError.message);
      }
      
      // Get next question (with higher difficulty if answered correctly)
      const nextDifficulty = isCorrect ? Math.min(5, question.difficulty + 1) : question.difficulty;
      
      // Check if assessment should be complete
      const isComplete = false; // We'll complete after 10 questions
      
      let response = {
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: null, // We don't have explanations in our schema
        points_earned: pointsEarned,
        message: isCorrect ? 
          "Correct! Well done." : 
          `Incorrect. The correct answer is ${question.correct_answer}.`,
        next_difficulty: nextDifficulty,
        assessment_complete: isComplete
      };
      
      // If complete, add completion stats
      if (isComplete) {
        response.completion_stats = {
          questions_attempted: 10,
          questions_correct: 5,
          accuracy: 0.5,
          proficiency: 3,
          highest_difficulty: nextDifficulty,
          total_points: pointsEarned
        };
      } else {
        // Get next question
        const { rows: nextQuestionRows } = await pool.query(
          `SELECT id, question, domain, sub_domain, difficulty, 
           q_type, options, correct_answer, points, time_limit
           FROM questions 
           WHERE domain = $1 AND difficulty = $2
           AND id != $3
           ORDER BY RANDOM() 
           LIMIT 1`,
          [question.domain, nextDifficulty, question_id]
        );
        
        if (nextQuestionRows.length > 0) {
          const nextQuestion = nextQuestionRows[0];
          let options = {};
          
          // Parse options if they're stored as a string
          if (nextQuestion.options && typeof nextQuestion.options === 'string') {
            try {
              options = JSON.parse(nextQuestion.options);
            } catch {
              try {
                // Try eval as a fallback
                options = eval(`(${nextQuestion.options})`);
              } catch {
                options = { a: "Option A", b: "Option B", c: "Option C", d: "Option D" };
              }
            }
          }
          
          response.next_question = {
            id: nextQuestion.id,
            question: nextQuestion.question,
            domain: nextQuestion.domain,
            sub_domain: nextQuestion.sub_domain,
            difficulty: nextQuestion.difficulty || 1,
            q_type: nextQuestion.q_type || 'multiple_choice',
            options: options,
            time_limit: nextQuestion.time_limit,
            points_value: nextQuestion.points || (nextQuestion.difficulty * 5)
          };
        }
      }
      
      return res.json(response);
    } catch (dbError) {
      console.error('Database fallback failed:', dbError.message);
      return res.status(500).json({ 
        error: 'Failed to process answer' 
      });
    }
  }
});

/**
 * Get user progress
 */
router.get('/users/:userId/progress', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Try to get progress via the assessment API
    const response = await axios.get(
      `${ASSESSMENT_API_URL}/users/${userId}/progress`,
      { timeout: 3000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to get user progress via API:', error.message);
    // Return a minimal progress object
    return res.json({
      user_id: userId,
      domains: {},
      total_points: 0,
      total_questions_answered: 0,
      total_correct: 0,
      accuracy: 0,
      last_active: new Date()
    });
  }
});

/**
 * Get user learning path
 */
router.get('/users/:userId/learning-path', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Try to get learning path via the assessment API
    const response = await axios.get(
      `${ASSESSMENT_API_URL}/users/${userId}/learning-path`,
      { timeout: 3000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to get learning path via API:', error.message);
    // Generate a simple learning path
    return res.json({
      user_id: parseInt(userId),
      questions_asked: 0,
      questions_correct: 0,
      strongest_domain: "Child Development",
      weakest_domain: "Classroom Management",
      user_name: "Teacher",
      total_points_earned: 0,
      recommendations: [
        {
          type: 'domain_focus',
          domain: 'Classroom Management',
          message: 'Start working on Classroom Management',
          description: 'Strategies for creating a positive learning environment',
          accuracy: 0,
          current_difficulty: 1,
          target_difficulty: 1
        },
        {
          type: 'domain_focus',
          domain: 'Child Development',
          message: 'Start working on Child Development',
          description: 'Understanding how children grow, develop and learn',
          accuracy: 0,
          current_difficulty: 1,
          target_difficulty: 1
        }
      ],
      achievement_opportunities: [
        {
          id: 1,
          name: "Domain Master",
          description: "Complete 10 questions in a domain with at least 80% accuracy",
          points_reward: 50,
          bear_bucks_reward: 1
        },
        {
          id: 2,
          name: "Knowledge Explorer",
          description: "Complete assessments in at least 3 different domains",
          points_reward: 100,
          bear_bucks_reward: 2
        }
      ]
    });
  }
});

/**
 * Get leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  const schoolId = req.query.school_id;
  const limit = parseInt(req.query.limit as string) || 10;
  
  try {
    // Try to get leaderboard via the assessment API
    const url = schoolId 
      ? `${ASSESSMENT_API_URL}/leaderboard?school_id=${schoolId}&limit=${limit}`
      : `${ASSESSMENT_API_URL}/leaderboard?limit=${limit}`;
      
    const response = await axios.get(url, { timeout: 3000 });
    return res.json(response.data);
  } catch (error) {
    console.error('Failed to get leaderboard via API:', error.message);
    
    // Fallback to our database
    try {
      const query = schoolId 
        ? `SELECT id, username, "firstName", "lastName", points, level, "schoolId"
           FROM users 
           WHERE "schoolId" = $1
           ORDER BY points DESC, "firstName" ASC
           LIMIT $2`
        : `SELECT id, username, "firstName", "lastName", points, level, "schoolId"
           FROM users 
           ORDER BY points DESC, "firstName" ASC
           LIMIT $1`;
      
      const params = schoolId ? [schoolId, limit] : [limit];
      const { rows } = await pool.query(query, params);
      
      // Format the results
      const leaderboard = rows.map((user, idx) => {
        const levelTitles = [
          "Teacher in Training",
          "Assistant Teacher",
          "Associate Teacher",
          "Lead Teacher",
          "Master Lead Teacher",
          "Mentor Teacher"
        ];
        
        return {
          user_id: user.id,
          username: user.username,
          full_name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
          points: user.points || 0,
          level: user.level || 1,
          level_title: levelTitles[(user.level || 1) - 1] || levelTitles[0],
          rank: idx + 1,
          profile_image_url: null,
          school_id: user.schoolId
        };
      });
      
      return res.json(leaderboard);
    } catch (dbError) {
      console.error('Database fallback failed:', dbError.message);
      return res.status(500).json({ 
        error: 'Failed to get leaderboard data' 
      });
    }
  }
});

export default router;