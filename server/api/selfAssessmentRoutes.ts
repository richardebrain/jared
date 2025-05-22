import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { checkAuth } from '../middleware/auth';

const router = express.Router();

// Schema for validating self-assessment submissions
// Reusing the existing assessment schema but adding a selfAssessment flag
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
    
    // Calculate an overall score based on the ratings (1-5 scale)
    const skillValues = Object.values(results).map(rating => {
      return parseInt(rating) || 1;
    });
    
    const averageScore = skillValues.length > 0 
      ? Math.round(skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length * 20) // Convert 1-5 scale to percentage
      : 20; // Minimum score
    
    // Determine teacher level based on average score
    let teacherLevel = "beginner";
    if (averageScore >= 90) {
      teacherLevel = "mentor";
    } else if (averageScore >= 75) {
      teacherLevel = "advanced";
    } else if (averageScore >= 60) {
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
    
    // Store the self-assessment data using the existing assessment system
    const assessment = await storage.createAssessment({
      userId,
      type: 'self', // Mark this as a self-assessment
      overallScore: averageScore,
      completedAt: new Date(),
      domainScores: {}, // Empty for self-assessments
      answers: {}, // Not used for self-assessments
      strengthAreas,
      growthAreas,
      teacherLevel,
      results // Store the raw results in the assessment
    });
    
    // Award points for completing self-assessment
    const user = await storage.getUser(userId);
    if (user) {
      const currentPoints = user.points || 0;
      await storage.updateUser(userId, { points: currentPoints + 25, teacherLevel });
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
    
    // Use the existing assessment storage methods but filter by type = 'self'
    const assessments = await storage.getAssessmentsByUserId(userId);
    const selfAssessments = assessments.filter(a => a.type === 'self');
    
    if (selfAssessments.length === 0) {
      return res.status(404).json({ message: 'No self-assessment found for this user' });
    }
    
    // Return the most recent self-assessment
    const latestAssessment = selfAssessments.sort((a, b) => {
      return new Date(b.completedAt || b.createdAt).getTime() - 
             new Date(a.completedAt || a.createdAt).getTime();
    })[0];
    
    return res.json(latestAssessment);
  } catch (error) {
    console.error('Error fetching self-assessment:', error);
    return res.status(500).json({ error: 'Failed to fetch self-assessment' });
  }
});

export default router;