import express from 'express';
import { db } from '../db';
import { assessments, users } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { PersonalizationService } from '../services/personalizationService';
import axios from 'axios';

const router = express.Router();

// Get personalized modules for a user
router.get('/personalized-modules/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get recent incorrect assessment answers
    const recentAssessments = await db.query.assessments.findMany({
      where: and(
        eq(assessments.userId, userId),
        eq(assessments.completed, true)
      ),
      orderBy: [desc(assessments.completedAt)]
    });
    
    if (!recentAssessments || recentAssessments.length === 0) {
      return res.json([]);
    }
    
    // Use the personalization service to generate learning paths
    const personalizedModules = await PersonalizationService.generatePersonalizedPath(userId);
    
    // Return the personalized modules
    return res.json(personalizedModules);
  } catch (error) {
    console.error('Error getting personalized modules:', error);
    return res.status(500).json({ error: 'Failed to get personalized modules' });
  }
});

// Update progress for a personalized module
router.post('/personalized-modules/progress', async (req, res) => {
  try {
    const { userId, lessonId, questionId, sectionType, completed } = req.body;
    
    if (!userId || !lessonId || !questionId || !sectionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For now, we'll just record this progress in memory
    // In a real implementation, this would update a database table
    
    // Return success
    return res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating module progress:', error);
    return res.status(500).json({ error: 'Failed to update module progress' });
  }
});

// Mark a personalized module as complete and award points
router.post('/personalized-modules/complete', async (req, res) => {
  try {
    const { userId, lessonId } = req.body;
    
    if (!userId || !lessonId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Award points (default to 15 if not specified)
    const pointsToAward = 15;
    
    // Update user points
    await db.update(users)
      .set({ 
        points: (user.points || 0) + pointsToAward,
        lifetimePoints: (user.lifetimePoints || 0) + pointsToAward
      })
      .where(eq(users.id, userId));
    
    // In a production implementation, we would also:
    // 1. Mark the module as completed in a personalized_modules table
    // 2. Record the completion in a user_progress or similar table
    // 3. Check if this completion triggers any achievements
    
    // Return the updated points
    return res.json({ 
      success: true, 
      pointsAwarded: pointsToAward,
      totalPoints: (user.points || 0) + pointsToAward
    });
    
  } catch (error) {
    console.error('Error completing module:', error);
    return res.status(500).json({ error: 'Failed to complete module' });
  }
});

// Get assessment question content from the backend API
router.get('/assessment-questions/:questionId', async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    // Try to reach the Python backend for enriched question data
    try {
      const response = await axios.get(`http://localhost:8088/api/questions/${questionId}`);
      return res.json(response.data);
    } catch (err) {
      console.error('Failed to reach assessment API, using fallback question data:', err.message);
      
      // Return basic question data if API is unavailable
      return res.json({
        id: questionId,
        question: "This question's enriched content is currently unavailable",
        explanation: "Please try again later to access the teaching explanation and background information."
      });
    }
  } catch (error) {
    console.error('Error getting question content:', error);
    return res.status(500).json({ error: 'Failed to get question content' });
  }
});

export default router;