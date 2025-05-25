import { Router } from 'express';

const router = Router();

/**
 * Helper function to add a witty tone to suggestions
 * Adds humor and personality to the suggestions
 */
function addWittyTone(suggestions: string[], moduleTitle: string) {
  // Add witty intros to some suggestions
  return suggestions.map((suggestion, index) => {
    // Only add witty intros to some suggestions to keep a balance
    if (index % 2 === 0) {
      const wittyIntros = [
        `Ready for a game-changer? ${suggestion}`,
        `Here's a sanity-saver: ${suggestion}`,
        `The secret weapon of veteran teachers: ${suggestion}`,
        `This one's pure gold: ${suggestion}`,
        `Your future self will thank you: ${suggestion}`,
        `Teacher hack alert! ${suggestion}`,
        `Classroom magic trick: ${suggestion}`,
        `This might just save your day: ${suggestion}`,
        `Brilliant idea coming through: ${suggestion}`,
        `Trust me on this one: ${suggestion}`
      ];
      
      // Select a random witty intro
      const randomIndex = Math.floor(Math.random() * wittyIntros.length);
      return wittyIntros[randomIndex];
    }
    return suggestion;
  });
}

/**
 * Helper function to make suggestions more specific to the module title
 */
function customizeForModuleTitle(suggestions: string[], moduleTitle: string) {
  // Replace generic terms with specific ones related to the module title
  const lowercaseTitle = moduleTitle.toLowerCase();
  
  return suggestions.map(suggestion => {
    let customized = suggestion;
    
    // Replace generic terms with specific module-related terms
    if (lowercaseTitle.includes('that one kid')) {
      customized = customized
        .replace(/children/g, 'challenging students')
        .replace(/child/g, 'challenging student')
        .replace(/preschoolers/g, 'students who test boundaries')
        .replace(/classroom environment/g, 'environment for diverse behavioral needs');
    } else if (lowercaseTitle.includes('difficult conversation')) {
      customized = customized
        .replace(/teaching/g, 'communication')
        .replace(/classroom management/g, 'difficult conversation management')
        .replace(/children/g, 'conversation participants');
    }
    
    return customized;
  });
}

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
      } else if (moduleTitle.toLowerCase().includes('that one kid')) {
        quizQuestions = [
          {
            question: "When dealing with a challenging student who consistently disrupts the class, what approach is most effective?",
            options: [
              "Immediately removing them from the classroom to maintain order",
              "Publicly addressing the behavior to set clear expectations for all students",
              "Understanding potential triggers and implementing preventative strategies",
              "Assigning a classroom buddy to monitor their behavior"
            ],
            correctAnswer: "Understanding potential triggers and implementing preventative strategies"
          },
          {
            question: "What strategy best helps build a positive relationship with a consistently challenging student?",
            options: [
              "Maintaining strict professional boundaries at all times",
              "Finding specific strengths to genuinely praise every day",
              "Focusing primarily on correcting negative behaviors",
              "Giving them special privileges to earn their cooperation"
            ],
            correctAnswer: "Finding specific strengths to genuinely praise every day"
          },
          {
            question: "Which statement reflects best practice when communicating with parents about their challenging child?",
            options: [
              "Focusing only on problematic behaviors that need immediate attention",
              "Comparing the child's behavior to peers to provide context",
              "Starting with positive observations before addressing challenges",
              "Suggesting they seek professional help for their child's behavior"
            ],
            correctAnswer: "Starting with positive observations before addressing challenges"
          },
          {
            question: "When a student has frequent emotional outbursts, which approach is most supported by research?",
            options: [
              "Immediately removing them from the situation to calm down alone",
              "Implementing a token system where calm behavior earns rewards",
              "Teaching self-regulation strategies during calm moments",
              "Extending their nap time to reduce stress and fatigue"
            ],
            correctAnswer: "Teaching self-regulation strategies during calm moments"
          },
          {
            question: "What is the most effective first step when a typically challenging student begins acting out?",
            options: [
              "Immediately implementing the predetermined consequence",
              "Calmly assessing if basic needs (hunger, sleep, security) are met",
              "Separating them from peers until they can rejoin appropriately",
              "Calling their parents to discuss the ongoing behavior issues"
            ],
            correctAnswer: "Calmly assessing if basic needs (hunger, sleep, security) are met"
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
    
    // Fix for title detection - if original regex fails, try a more flexible approach
    let extractedTitle = moduleTitle;
    if (!extractedTitle) {
      // Try alternate extraction methods
      const aboutMatch = prompt.match(/about\s+\"([^\"]+)\"/i);
      const titledMatch = prompt.match(/titled\s+\"([^\"]+)\"/i);
      extractedTitle = aboutMatch?.[1] || titledMatch?.[1] || prompt.split('"')[1] || "";
    }
    
    console.log("Module title for AI suggestions:", extractedTitle);
    
    // Generate topic-specific suggestions based on the module title
    if (extractedTitle.toLowerCase().includes('that one kid') || moduleTitle.toLowerCase().includes('that one kid')) {
      if (prompt.includes('questions')) {
        suggestions = [
          "What underlying needs might be driving your challenging student's behavior? (Remember: kids aren't giving you a hard time, they're having a hard time!)",
          "How do you differentiate between attention-seeking behavior and skill deficits in your most challenging students?",
          "What surprising strategies have worked with your most challenging students when nothing else seemed to?",
          "How do you maintain your own emotional regulation when dealing with 'that one kid' who knows exactly which buttons to push?",
          "What specific language do you use when speaking privately with a student about disruptive behavior that preserves their dignity?"
        ];
      } else if (prompt.includes('strategies')) {
        suggestions = [
          "Start each day with a 2-minute private check-in with your challenging student - it's like preventative medicine for behavior issues!",
          "Create a special signal between you and your challenging student to communicate 'I need a break' without words or drama.",
          "Use the 'connection before correction' approach - address the emotional need before the behavior, unless someone's bleeding!",
          "Implement the '10-to-1 ratio' rule: Give 10 positive comments for every correction. Your facial muscles might get tired from smiling, but trust us, it works!",
          "Create a personalized calm-down kit with sensory tools specifically chosen for your challenging student - like a behavioral first aid kit!"
        ];
      } else {
        suggestions = [
          "Include a section on 'Behavior Detective Work' - how to recognize when a challenging behavior is actually communicating a need.",
          "Add a flowchart for teachers called 'Is This the Hill to Die On?' to help prioritize which behaviors truly need intervention.",
          "Incorporate brain research that explains why traditional 'consequences' often backfire spectacularly with challenging students.",
          "Include role-playing scenarios titled 'What Would You Do If...?' featuring classic challenging behaviors.",
          "Add a section on teacher self-care strategies titled 'Keeping Your Cool When They're Pushing Your Buttons'."
        ];
      }
    } else if (moduleTitle.toLowerCase().includes('potty training')) {
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
    
    // Extract difficulty level from the prompt
    let difficultyLevel = "intermediate";
    if (prompt.includes("beginner level")) {
      difficultyLevel = "beginner";
    } else if (prompt.includes("advanced level")) {
      difficultyLevel = "advanced";
    } else if (prompt.includes("intermediate level")) {
      difficultyLevel = "intermediate";
    }
    
    // Check for "That one kid" module and directly return custom suggestions if found
    if (extractedTitle.toLowerCase().includes('that one kid') || moduleTitle.toLowerCase().includes('that one kid')) {
      if (type === 'strategies') {
        return res.json({
          suggestions: 
            "Try the 'invisible string' technique - connect with your challenging student privately before they act out. It's like having a teacher superpower for a " + difficultyLevel + " classroom!\n" +
            "Create a special responsibility just for that boundary-testing student. Nothing says 'I see your potential' like being the classroom's official lizard caretaker!\n" +
            "For that one spirited kid, try 'first-then' statements: 'First finish your worksheet, then you get to be my special helper.' Works like classroom magic!\n" +
            "Give that energetic student a secret signal only you two know - a wink or hand gesture that says 'I see you need a break' before they lose control.\n" +
            "The 'two positive comments for every redirection' rule works wonders for your challenging student - catch them being good twice as often as you correct!"
        });
      } else if (type === 'questions') {
        return res.json({
          suggestions: 
            "What underlying needs might be driving your challenging student's behavior? (Remember: kids aren't giving you a hard time, they're having a hard time!)\n" +
            "How do you differentiate between attention-seeking behavior and skill deficits in your most challenging students?\n" +
            "What environmental triggers might be affecting your challenging student, and how can you modify the classroom to reduce them?\n" +
            "How would you create a behavior intervention plan for that one student who consistently tests boundaries?\n" +
            "How might trauma-informed practices help you connect with your most challenging student?"
        });
      }
    }
    
    // Apply general category customizations if needed
    if (prompt.includes('classroom-management') && !moduleTitle.toLowerCase().includes('classroom management')) {
      suggestions = suggestions.map(s => s.replace(/children|preschoolers/g, 'students in your classroom'));
    } else if (prompt.includes('social-emotional')) {
      suggestions = suggestions.map(s => s.includes('emotion') ? s : s + ' Consider how this supports emotional development.');
    }
    
    // Add more wit and personality to the suggestions
    suggestions = addWittyTone(suggestions, moduleTitle);
    
    // Make suggestions more specific to the module title
    suggestions = customizeForModuleTitle(suggestions, moduleTitle);
    
    // Add custom suggestions for specific module titles that weren't matched earlier
    if (moduleTitle.toLowerCase().includes('that one kid')) {
      // Add module-specific suggestions to the list
      suggestions.push("Try the 'invisible string' technique - connect with your challenging student privately before they act out. It's like having a teacher superpower!");
      suggestions.push("Create a special responsibility just for that boundary-testing student. Nothing says 'I see your potential' like being the classroom's official lizard caretaker!");
    }
    
    res.json({ suggestions: suggestions.join('\n') });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({ message: 'Failed to generate AI suggestions' });
  }
});

export default router;