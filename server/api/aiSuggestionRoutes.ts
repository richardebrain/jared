import { Router } from 'express';

const router = Router();

// AI suggestion generation endpoint for module creator
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    // This is a simple implementation that returns pre-generated responses
    // In a production environment, this would call an actual AI service
    
    let suggestions = [];
    
    // Generate different suggestions based on the content of the prompt
    if (prompt.includes('questions')) {
      suggestions = [
        "What are three key strategies for creating a trauma-informed classroom environment?",
        "How would you adapt your teaching approach for a child with sensory processing challenges?",
        "Describe how you would implement positive reinforcement techniques with preschoolers.",
        "What steps would you take to de-escalate a conflict between two children?",
        "How can you incorporate culturally responsive teaching practices in an early childhood setting?"
      ];
    } else if (prompt.includes('strategies')) {
      suggestions = [
        "Create a visual daily schedule with movable picture cards to help children understand routines and transitions.",
        "Use emotion coaching by naming feelings and helping children develop vocabulary for their emotional experiences.",
        "Implement peer buddy systems where children with more experience can help guide newer students.",
        "Design learning centers that allow for various levels of engagement to accommodate different developmental needs.",
        "Use storytelling and puppets to model social skills and problem-solving strategies."
      ];
    } else {
      suggestions = [
        "Include a brief history of early childhood education to provide context.",
        "Add an interactive activity where teachers can practice the techniques.",
        "Incorporate recent research findings to demonstrate effectiveness.",
        "Include a section on adapting strategies for different age groups.",
        "Add downloadable resources teachers can use in their classrooms."
      ];
    }
    
    // If the prompt mentions specific categories, customize suggestions further
    if (prompt.includes('classroom-management')) {
      suggestions = suggestions.map(s => s.replace(/children|preschoolers/g, 'students in your classroom'));
    } else if (prompt.includes('social-emotional')) {
      suggestions = suggestions.map(s => s.includes('emotion') ? s : s + ' Consider how this supports emotional development.');
    }
    
    res.json({ suggestions: suggestions.join('\n') });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({ message: 'Failed to generate AI suggestions' });
  }
});

export default router;