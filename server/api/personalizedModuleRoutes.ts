import { Router } from 'express';
import { PersonalizationService } from '../services/personalizationService';

const router = Router();

/**
 * Get personalized mini-lessons for a user
 * These are generated based on the user's assessment results
 */
router.get('/personalized-modules/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const personalizedModules = await PersonalizationService.generatePersonalizedPath(userId);
    
    return res.json(personalizedModules);
  } catch (error) {
    console.error('Error fetching personalized modules:', error);
    return res.status(500).json({ error: 'Failed to fetch personalized modules' });
  }
});

/**
 * Update a user's progress on a personalized mini-lesson
 */
router.post('/personalized-modules/:userId/progress', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { moduleId, progress, isCompleted } = req.body;
    
    if (isNaN(userId) || !moduleId) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // TODO: Store the user's progress in a new table
    // For now, we'll just return success
    
    // If the module is completed, award points to the user
    if (isCompleted) {
      // TODO: Add points to the user's account (15 points per completed mini-lesson)
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating module progress:', error);
    return res.status(500).json({ error: 'Failed to update module progress' });
  }
});

export default router;