import { Router } from 'express';

const router = Router();

// AI suggestion generation endpoint for module creator
router.post('/generate', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    // This is a simple implementation that returns pre-generated responses
    // In a production environment, this would call an actual AI service
    
    // Handle quiz question generation separately
    if (type === 'quiz') {
      const quizQuestions = [
        {
          question: "What is the most effective way to support emotional development in preschoolers?",
          options: [
            "Ignore emotional outbursts to avoid reinforcing negative behavior",
            "Label and validate emotions while offering coping strategies",
            "Reward only positive emotions like happiness and excitement",
            "Remove children from the group when they show strong emotions"
          ],
          correctAnswer: "Label and validate emotions while offering coping strategies"
        },
        {
          question: "Which approach best supports children with sensory processing challenges?",
          options: [
            "Keeping all classroom stimuli at the same level throughout the day",
            "Creating a designated quiet space with reduced stimulation",
            "Encouraging children to overcome their sensitivities through repeated exposure",
            "Separating children with sensory challenges from the main group"
          ],
          correctAnswer: "Creating a designated quiet space with reduced stimulation"
        },
        {
          question: "What is a key principle of trauma-informed teaching?",
          options: [
            "Maintaining strict disciplinary consequences for all behaviors",
            "Creating predictable routines and clear expectations",
            "Addressing traumatic experiences directly during class discussions",
            "Focusing on academic achievement over emotional support"
          ],
          correctAnswer: "Creating predictable routines and clear expectations"
        }
      ];
      
      // Customize quiz questions based on module topic
      if (prompt.includes('classroom-management')) {
        quizQuestions[0].question = "What classroom management strategy is most effective for transitions between activities?";
        quizQuestions[0].options = [
          "Abruptly stopping one activity to immediately start another",
          "Using visual timers and giving multiple warnings before transitions",
          "Keeping children in the same activity for long periods to avoid transitions",
          "Letting each child transition whenever they individually feel ready"
        ];
        quizQuestions[0].correctAnswer = "Using visual timers and giving multiple warnings before transitions";
      } else if (prompt.includes('literacy')) {
        quizQuestions[1].question = "Which practice best supports early literacy development?";
        quizQuestions[1].options = [
          "Focusing primarily on letter recognition and writing",
          "Interactive read-alouds with open-ended questions",
          "Daily flashcard drills of sight words",
          "Having children copy sentences from the board"
        ];
        quizQuestions[1].correctAnswer = "Interactive read-alouds with open-ended questions";
      }
      
      return res.json({ quizQuestions });
    }
    
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