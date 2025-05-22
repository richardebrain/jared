import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { checkAuth } from '../middleware/auth';

const router = express.Router();

// Schema for validating self-assessment submissions
const selfAssessmentSchema = z.object({
  userId: z.number(),
  results: z.record(z.string(), z.string()),
  strengthAreas: z.array(z.string()).optional().default([]),
  growthAreas: z.array(z.string()).optional().default([])
});

/**
 * Submit a teacher self-assessment
 * Adds the assessment results to the user's profile and learning path
 */
router.post('/self-assessment', checkAuth, async (req, res) => {
  try {
    const validation = selfAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid assessment data',
        details: validation.error.format() 
      });
    }
    
    const { userId, results, strengthAreas: initialStrengthAreas, growthAreas: initialGrowthAreas } = validation.data;
    
    // Map numeric ratings to skill levels for easier processing
    // Our frontend uses 1-5 scale for ratings
    
    // Calculate average skill level based on numeric ratings
    const skillValues = Object.values(results).map(rating => {
      return parseInt(rating) || 1;
    });
    
    const averageSkillLevel = skillValues.length > 0 
      ? skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length
      : 1;
    
    // Determine teacher level based on average skill
    let teacherLevel = "beginner";
    if (averageSkillLevel >= 4.5) {
      teacherLevel = "mentor";
    } else if (averageSkillLevel >= 3.7) {
      teacherLevel = "advanced";
    } else if (averageSkillLevel >= 2.8) {
      teacherLevel = "intermediate";
    }
    
    // Identify strength and growth areas if not provided
    const strengthAreas = initialStrengthAreas.length > 0 ? initialStrengthAreas : [];
    const growthAreas = initialGrowthAreas.length > 0 ? initialGrowthAreas : [];
    
    // If strength/growth areas weren't provided, derive them from ratings
    if (strengthAreas.length === 0 && growthAreas.length === 0) {
      Object.entries(results).forEach(([questionId, rating]) => {
        const ratingValue = parseInt(rating) || 1;
        
        if (ratingValue >= 4) {
          strengthAreas.push(questionId);
        } else if (ratingValue <= 3) {
          growthAreas.push(questionId);
        }
      });
    }
    
    // Store the self-assessment data
    const assessment = await storage.createSelfAssessment({
      userId,
      results,
      strengthAreas,
      growthAreas,
      averageSkillLevel,
      teacherLevel
    });
    
    // Update the user's teacher level
    await storage.updateUserTeacherLevel(userId, teacherLevel);
    
    // Award points for completing self-assessment
    // Use the user update method that supports points
    const user = await storage.getUser(userId);
    if (user) {
      const currentPoints = user.points || 0;
      await storage.updateUser(userId, { points: currentPoints + 25 });
    }
    
    return res.status(201).json({
      message: 'Self-assessment submitted successfully',
      assessment,
      pointsEarned: 25
    });
  } catch (error) {
    console.error('Error submitting self-assessment:', error);
    return res.status(500).json({ error: 'Failed to submit self-assessment' });
  }
});

/**
 * Get a user's latest self-assessment
 */
router.get('/self-assessment/:userId', checkAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const assessment = await storage.getLatestSelfAssessment(userId);
    
    if (!assessment) {
      return res.status(404).json({ message: 'No self-assessment found for this user' });
    }
    
    return res.json(assessment);
  } catch (error) {
    console.error('Error fetching self-assessment:', error);
    return res.status(500).json({ error: 'Failed to fetch self-assessment' });
  }
});

export default router;