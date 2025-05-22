import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { auth } from '../middleware/auth';

const router = express.Router();

// Schema for validating self-assessment submissions
const selfAssessmentSchema = z.object({
  userId: z.number(),
  assessments: z.record(z.string(), z.string())
});

/**
 * Submit a teacher self-assessment
 * Adds the assessment results to the user's profile and learning path
 */
router.post('/self-assessment', auth, async (req, res) => {
  try {
    const validation = selfAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid assessment data',
        details: validation.error.format() 
      });
    }
    
    const { userId, assessments } = validation.data;
    
    // Map skill levels to numeric values for easier processing
    const skillLevelMap = {
      'no_experience': 1,
      'some_experience': 2,
      'comfortable': 3,
      'confident': 4
    };
    
    // Calculate average skill level
    const skillValues = Object.values(assessments).map(level => {
      return skillLevelMap[level as keyof typeof skillLevelMap] || 1;
    });
    
    const averageSkillLevel = skillValues.length > 0 
      ? skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length
      : 1;
    
    // Determine teacher level based on average skill
    let teacherLevel = "beginner";
    if (averageSkillLevel >= 3.5) {
      teacherLevel = "mentor";
    } else if (averageSkillLevel >= 2.7) {
      teacherLevel = "advanced";
    } else if (averageSkillLevel >= 2) {
      teacherLevel = "intermediate";
    }
    
    // Identify strength and growth areas
    const strengthAreas: string[] = [];
    const growthAreas: string[] = [];
    
    Object.entries(assessments).forEach(([skillId, level]) => {
      const skillLevel = skillLevelMap[level as keyof typeof skillLevelMap] || 1;
      
      if (skillLevel >= 3) {
        strengthAreas.push(skillId);
      } else {
        growthAreas.push(skillId);
      }
    });
    
    // Store the self-assessment data
    const assessment = await storage.createSelfAssessment({
      userId,
      results: assessments,
      strengthAreas,
      growthAreas,
      averageSkillLevel,
      teacherLevel
    });
    
    // Update the user's teacher level
    await storage.updateUserTeacherLevel(userId, teacherLevel);
    
    // Award points for completing self-assessment
    await storage.updateUserPoints(userId, 25);
    
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
router.get('/self-assessment/:userId', auth, async (req, res) => {
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