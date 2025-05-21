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
      // Parse the module topic from the prompt
      const moduleTitle = prompt.match(/\"([^\"]+)\"/)?.[1] || "";
      console.log("Module title for quiz generation:", moduleTitle);
      
      let quizQuestions = [];
      
      // Generate topic-specific quiz questions based on module title
      if (moduleTitle.toLowerCase().includes('potty training')) {
        quizQuestions = [
          {
            question: "What is generally considered the optimal age range to begin potty training?",
            options: [
              "12-18 months",
              "18-24 months",
              "24-36 months",
              "36-48 months"
            ],
            correctAnswer: "24-36 months"
          },
          {
            question: "Which of the following is NOT a sign of potty training readiness?",
            options: [
              "Showing interest in the bathroom or toilet",
              "Having dry periods of at least 2 hours",
              "Being able to follow simple instructions",
              "Being able to tie their own shoes"
            ],
            correctAnswer: "Being able to tie their own shoes"
          },
          {
            question: "What is the most appropriate response when a child has an accident during potty training?",
            options: [
              "Express disappointment to motivate improvement",
              "Respond calmly and reassure the child that accidents happen",
              "Implement a time-out to reinforce proper bathroom behavior",
              "Return to diapers for a week before trying again"
            ],
            correctAnswer: "Respond calmly and reassure the child that accidents happen"
          },
          {
            question: "Which environmental modification is most helpful for potty training success in a classroom?",
            options: [
              "Having a bathroom schedule that all children must follow",
              "Child-sized toilets or adaptors and step stools",
              "Limiting fluid intake to prevent accidents",
              "Requiring children to ask permission before using the bathroom"
            ],
            correctAnswer: "Child-sized toilets or adaptors and step stools"
          },
          {
            question: "What strategy helps maintain consistency between home and school potty training approaches?",
            options: [
              "Requiring parents to use the exact same method as the school",
              "Regular communication with families about potty training progress and techniques",
              "Sending home detailed reports of bathroom successes and failures",
              "Having parents observe classroom potty training procedures"
            ],
            correctAnswer: "Regular communication with families about potty training progress and techniques"
          }
        ];
      } else if (moduleTitle.toLowerCase().includes('classroom management')) {
        quizQuestions = [
          {
            question: "What classroom management strategy is most effective for transitions between activities?",
            options: [
              "Abruptly stopping one activity to immediately start another",
              "Using visual timers and giving multiple warnings before transitions",
              "Keeping children in the same activity for long periods to avoid transitions",
              "Letting each child transition whenever they individually feel ready"
            ],
            correctAnswer: "Using visual timers and giving multiple warnings before transitions"
          },
          {
            question: "Which approach best supports children with sensory processing challenges in the classroom?",
            options: [
              "Keeping all classroom stimuli at the same level throughout the day",
              "Creating a designated quiet space with reduced stimulation",
              "Encouraging children to overcome their sensitivities through repeated exposure",
              "Separating children with sensory challenges from the main group"
            ],
            correctAnswer: "Creating a designated quiet space with reduced stimulation"
          },
          {
            question: "What is a key principle of effective classroom management?",
            options: [
              "Addressing behavior issues in front of the class to set examples",
              "Establishing clear, consistent routines and expectations",
              "Using rewards as the primary behavior management strategy",
              "Implementing strict consequences for all infractions"
            ],
            correctAnswer: "Establishing clear, consistent routines and expectations"
          },
          {
            question: "How can teachers effectively redirect challenging behavior?",
            options: [
              "Immediately remove the child from the activity",
              "Ignore minor disruptions completely",
              "Clearly state the expected behavior rather than focusing on the negative",
              "Use time-outs as the first intervention strategy"
            ],
            correctAnswer: "Clearly state the expected behavior rather than focusing on the negative"
          }
        ];
      } else {
        // Default generic quiz questions if no specific topic is detected
        quizQuestions = [
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
      }
      
      return res.json({ quizQuestions });
    }
    
    let suggestions = [];
    
    // Parse the module topic from the prompt
    const moduleTitle = prompt.match(/\"([^\"]+)\"/)?.[1] || "";
    console.log("Module title for AI suggestions:", moduleTitle);
    
    // Generate topic-specific suggestions based on the module title
    if (moduleTitle.toLowerCase().includes('potty training')) {
      if (prompt.includes('questions')) {
        suggestions = [
          "What are the key developmental signs that indicate a child is ready for potty training?",
          "How would you handle a child who is resistant to using the toilet despite showing physical readiness?",
          "What strategies would you use to maintain consistency between home and school potty training approaches?",
          "How would you address accidents in a way that's supportive and maintains a child's dignity?",
          "What environmental modifications can make bathroom facilities more accessible for young children?"
        ];
      } else if (prompt.includes('strategies')) {
        suggestions = [
          "Create a visual potty training schedule with rewards to motivate children.",
          "Use specialized children's books about potty training to build interest and reduce anxiety.",
          "Implement a 'potty partner' system where a slightly older child models appropriate bathroom behavior.",
          "Design a bathroom environment with step stools, child-sized fixtures, and visual instructions.",
          "Use puppets or dolls to demonstrate potty procedures and normalize the process."
        ];
      } else {
        suggestions = [
          "Include a section on developmental readiness signs for potty training.",
          "Add a troubleshooting guide for common potty training challenges.",
          "Incorporate recent research on effective potty training approaches.",
          "Include tips for culturally-responsive potty training that respects family practices.",
          "Add printable potty training charts and reward systems for teachers to use."
        ];
      }
    } else if (moduleTitle.toLowerCase().includes('classroom management')) {
      if (prompt.includes('questions')) {
        suggestions = [
          "What preventative strategies have you found most effective in minimizing behavioral disruptions?",
          "How do you establish clear behavioral expectations at the beginning of the year?",
          "What techniques do you use to redirect a child who is disturbing other students?",
          "How do you modify your classroom management approach for children with special needs?",
          "What systems do you have in place for consistently reinforcing positive behavior?"
        ];
      } else if (prompt.includes('strategies')) {
        suggestions = [
          "Implement a visual behavior chart system with clear expectations and consequences.",
          "Use attention signals like bells, clapping patterns, or songs for smooth transitions.",
          "Create a peace corner where children can self-regulate when feeling overwhelmed.",
          "Develop class rules collaboratively with students to increase buy-in and understanding.",
          "Use positive behavior reinforcement systems like token economies or marble jars."
        ];
      }
    } else {
      // Default generic suggestions if no specific topic is detected
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
    }
    
    // Apply general category customizations if needed
    if (prompt.includes('classroom-management') && !moduleTitle.toLowerCase().includes('classroom management')) {
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