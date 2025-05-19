// Types for video resources
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number | string; // Can be index number or actual answer string
  explanation?: string;
}

export interface VideoQuiz {
  questions: QuizQuestion[];
}

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string[];
  tags: string[];
  duration: number; // duration in minutes
  source: string;
  expertLevel: string; // beginner, intermediate, advanced
  dateAdded: string;
  featured: boolean;
  watched?: boolean;
  bookmarked?: boolean;
  quiz?: VideoQuiz; // Optional quiz property
}

// Comprehensive database of high-quality early childhood education videos
export const videoResourcesData: VideoResource[] = [
{
    id: "video-001",
    title: "Every Kid Needs A Champion | Rita Pierson",
    description: "Rita Pierson, a teacher for 40 years, talks about the importance of human connection and championing children, especially those who need it most.",
    youtubeId: "SFnMTHhKdkw",
    category: ["inspiration", "teaching-philosophy"],
    tags: ["TED Talk", "student relationships", "motivation", "teaching philosophy"],
    duration: 8,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What is the main message of this inspirational video?",
                "options": [
                      "Teaching is just a job like any other",
                      "Building relationships with students is foundational to learning",
                      "Strict discipline is the key to classroom success",
                      "Technology should replace traditional teaching methods"
                ],
                "correctAnswer": 1,
                "explanation": "The video emphasizes that positive teacher-student relationships are at the heart of effective education."
          },
          {
                "question": "How can you apply the principles from this video in your classroom?",
                "options": [
                      "Focus only on academic outcomes and test scores",
                      "Create opportunities for positive interactions and connection with each child",
                      "Minimize emotional support to maintain professional distance",
                      "Treat all children exactly the same regardless of their needs"
                ],
                "correctAnswer": 1,
                "explanation": "Building meaningful connections with each child helps create the foundation for successful learning."
          },
          {
                "question": "How might you apply the concepts from this video in your classroom tomorrow?",
                "options": [
                      "Make a small change to connect more deeply with one challenging student",
                      "Completely overhaul your entire teaching approach immediately",
                      "Ignore the concepts as they're too idealistic",
                      "Wait until next school year to implement any changes"
                ],
                "correctAnswer": 0,
                "explanation": "Small, intentional changes in how we connect with students can have meaningful impacts."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-003",
    title: "Coco the Butterfly | Mindful Movement Activity",
    description: "A mindful movement activity that works well as both a transition and a core activity for developing body awareness.",
    youtubeId: "pT-s1-phgxs",
    category: ["mindfulness", "movement", "transitions"],
    tags: ["mindful transitions", "body awareness", "calm movement"],
    duration: 15,
    source: "Cosmic Kids Yoga",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-004",
    title: "Belly Breathing with Elmo",
    description: "A simple, effective breathing technique for young children demonstrated by Elmo and friends.",
    youtubeId: "_mZbzDOpylA",
    category: ["mindfulness", "self-regulation", "social-emotional"],
    tags: ["breathing exercises", "emotional regulation", "calm down technique"],
    duration: 3,
    source: "Sesame Street",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-005",
    title: "Mindful Listening: Sound Awareness for Young Children",
    description: "A guided mindful listening exercise perfect for circle time or transitions.",
    youtubeId: "uUIGKhG_Vq8", // Mindful listening activity
    category: ["mindfulness", "sensory", "attention"],
    tags: ["mindful listening", "attention skills", "sensory awareness"],
    duration: 5,
    source: "Mindful Schools",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-006",
    title: "Whole Body Listening for Children",
    description: "Clear, child-friendly explanation of active listening skills with visual supports.",
    youtubeId: "j87nbA2I7Zo",
    category: ["active-listening", "communication", "classroom-management"],
    tags: ["whole body listening", "listening skills", "communication"],
    duration: 7,
    source: "Mr. T's Phonics",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-007",
    title: "5 Active Listening Games for Children",
    description: "Engaging games to develop strong listening skills in preschool and kindergarten.",
    youtubeId: "H_O1brYwdSY",
    category: ["active-listening", "games", "group-activities"],
    tags: ["listening games", "group activities", "skill development"],
    duration: 11,
    source: "Kreative Leadership",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-008",
    title: "Identifying and Expressing Feelings for Young Children",
    description: "A teacher-led discussion about emotional awareness with preschoolers.",
    youtubeId: "ZxfJicfyCdg", // Sesame Street emotions video
    category: ["social-emotional", "feelings", "communication"],
    tags: ["emotions", "self-awareness", "expression"],
    duration: 9,
    source: "Head Start",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-010",
    title: "Universal Design for Learning in Early Childhood",
    description: "Practical applications of UDL principles in preschool and kindergarten settings.",
    youtubeId: "pGLTJw0GSxk", // UDL in early childhood
    category: ["inclusion", "teaching-methods", "differentiation"],
    tags: ["UDL", "inclusive teaching", "diverse learners"],
    duration: 12,
    source: "CAST Professional Learning",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-017",
    title: "How to Escape Education's Death Valley | Sir Ken Robinson",
    description: "Sir Ken Robinson outlines three principles crucial for the human mind to flourish, and how education currently works against them.",
    youtubeId: "wX78iKhInsc",
    category: ["inspiration", "teaching-philosophy", "education-reform"],
    tags: ["TED Talk", "creativity", "education reform", "personalized learning"],
    duration: 19,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What is the main message of this inspirational video?",
                "options": [
                      "Teaching is just a job like any other",
                      "Building relationships with students is foundational to learning",
                      "Strict discipline is the key to classroom success",
                      "Technology should replace traditional teaching methods"
                ],
                "correctAnswer": 1,
                "explanation": "The video emphasizes that positive teacher-student relationships are at the heart of effective education."
          },
          {
                "question": "How can you apply the principles from this video in your classroom?",
                "options": [
                      "Focus only on academic outcomes and test scores",
                      "Create opportunities for positive interactions and connection with each child",
                      "Minimize emotional support to maintain professional distance",
                      "Treat all children exactly the same regardless of their needs"
                ],
                "correctAnswer": 1,
                "explanation": "Building meaningful connections with each child helps create the foundation for successful learning."
          },
          {
                "question": "How might you apply the concepts from this video in your classroom tomorrow?",
                "options": [
                      "Make a small change to connect more deeply with one challenging student",
                      "Completely overhaul your entire teaching approach immediately",
                      "Ignore the concepts as they're too idealistic",
                      "Wait until next school year to implement any changes"
                ],
                "correctAnswer": 0,
                "explanation": "Small, intentional changes in how we connect with students can have meaningful impacts."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-018",
    title: "The Power of Play | Dr. Stuart Brown",
    description: "Dr. Stuart Brown explores how play is essential for development and shapes the brain.",
    youtubeId: "HHwXlcHcTHc",
    category: ["play", "child-development", "neuroscience"],
    tags: ["TED Talk", "play-based learning", "brain development", "creativity"],
    duration: 27,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-021",
    title: "Every Child Needs a Champion | Rita Pierson",
    description: "Rita Pierson's powerful message about the importance of building strong relationships with every child and becoming their champion.",
    youtubeId: "SFnMTHhKdkw",
    category: ["chapter-one-philosophy", "relationships", "inspiration"],
    tags: ["TED Talk", "student connections", "relationships", "making a difference"],
    duration: 8,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What is the main message of this inspirational video?",
                "options": [
                      "Teaching is just a job like any other",
                      "Building relationships with students is foundational to learning",
                      "Strict discipline is the key to classroom success",
                      "Technology should replace traditional teaching methods"
                ],
                "correctAnswer": 1,
                "explanation": "The video emphasizes that positive teacher-student relationships are at the heart of effective education."
          },
          {
                "question": "How can you apply the principles from this video in your classroom?",
                "options": [
                      "Focus only on academic outcomes and test scores",
                      "Create opportunities for positive interactions and connection with each child",
                      "Minimize emotional support to maintain professional distance",
                      "Treat all children exactly the same regardless of their needs"
                ],
                "correctAnswer": 1,
                "explanation": "Building meaningful connections with each child helps create the foundation for successful learning."
          },
          {
                "question": "How might you apply the concepts from this video in your classroom tomorrow?",
                "options": [
                      "Make a small change to connect more deeply with one challenging student",
                      "Completely overhaul your entire teaching approach immediately",
                      "Ignore the concepts as they're too idealistic",
                      "Wait until next school year to implement any changes"
                ],
                "correctAnswer": 0,
                "explanation": "Small, intentional changes in how we connect with students can have meaningful impacts."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-026",
    title: "Supporting Dual Language Learners in the Preschool Classroom",
    description: "Strategies for creating an inclusive and supportive environment for children learning multiple languages.",
    youtubeId: "09PrmLppQ1A",
    category: ["language", "diversity", "inclusion"],
    tags: ["dual language learners", "bilingualism", "cultural responsiveness"],
    duration: 22,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-027",
    title: "Handwashing in Child Care Settings: Best Practices",
    description: "Proper handwashing techniques and strategies for teaching handwashing to young children.",
    youtubeId: "_KirHm_sYfI",
    category: ["health-safety", "routines", "hygiene"],
    tags: ["handwashing", "disease prevention", "health practices", "routines"],
    duration: 7,
    source: "CDC",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-031",
    title: "Do Schools Kill Creativity? | Sir Ken Robinson",
    description: "Sir Ken Robinson makes an entertaining and profoundly moving case for creating an education system that nurtures (rather than undermines) creativity.",
    youtubeId: "iG9CE55wbtY",
    category: ["inspiration", "creativity", "teaching-philosophy"],
    tags: ["TED Talk", "creativity", "arts education", "innovative thinking"],
    duration: 20,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What is the main message of this inspirational video?",
                "options": [
                      "Teaching is just a job like any other",
                      "Building relationships with students is foundational to learning",
                      "Strict discipline is the key to classroom success",
                      "Technology should replace traditional teaching methods"
                ],
                "correctAnswer": 1,
                "explanation": "The video emphasizes that positive teacher-student relationships are at the heart of effective education."
          },
          {
                "question": "How can you apply the principles from this video in your classroom?",
                "options": [
                      "Focus only on academic outcomes and test scores",
                      "Create opportunities for positive interactions and connection with each child",
                      "Minimize emotional support to maintain professional distance",
                      "Treat all children exactly the same regardless of their needs"
                ],
                "correctAnswer": 1,
                "explanation": "Building meaningful connections with each child helps create the foundation for successful learning."
          },
          {
                "question": "How might you apply the concepts from this video in your classroom tomorrow?",
                "options": [
                      "Make a small change to connect more deeply with one challenging student",
                      "Completely overhaul your entire teaching approach immediately",
                      "Ignore the concepts as they're too idealistic",
                      "Wait until next school year to implement any changes"
                ],
                "correctAnswer": 0,
                "explanation": "Small, intentional changes in how we connect with students can have meaningful impacts."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-033",
    title: "Wiring the Brain for Success | Dr. Becky Bailey",
    description: "Dr. Becky Bailey explains the brain science behind self-regulation and connection that underpins effective classroom management.",
    youtubeId: "sr-OXkk3i8E",
    category: ["brain-development", "self-regulation", "conscious-discipline"],
    tags: ["TEDx Talk", "brain science", "emotional regulation", "connection"],
    duration: 17,
    source: "TEDx",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-034",
    title: "Grit: The Power of Passion and Perseverance | Angela Lee Duckworth",
    description: "Psychologist Angela Lee Duckworth explains her theory of 'grit' as a predictor of success and how to develop it in children.",
    youtubeId: "H14bBuluwB8",
    category: ["social-emotional", "mindset", "motivation"],
    tags: ["TED Talk", "grit", "perseverance", "growth mindset"],
    duration: 6,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-039",
    title: "Morning Meeting Ideas for Preschool",
    description: "Engaging morning meeting activities and ideas specifically designed for preschool classrooms.",
    youtubeId: "RuLudWAjGA0",
    category: ["mindful-mornings", "classroom-management", "community-building"],
    tags: ["morning meeting", "classroom routines", "community building", "Raising Arizona"],
    duration: 11,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-040",
    title: "Morning Circle Time with Preschoolers",
    description: "Effective strategies for conducting engaging and productive morning circle time in early childhood settings.",
    youtubeId: "IgA1zhnn5AQ",
    category: ["mindful-mornings", "circle-time", "classroom-routine"],
    tags: ["circle time", "morning routine", "group activities", "Raising Arizona"],
    duration: 8,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-041",
    title: "Building Classroom Community Through Morning Routines",
    description: "Learn how consistent morning routines help foster a strong sense of community and belonging in preschool classrooms.",
    youtubeId: "Ocyqu5ceH3Y",
    category: ["mindful-mornings", "community-building", "classroom-management"],
    tags: ["classroom community", "belonging", "morning routines", "Raising Arizona"],
    duration: 14,
    source: "Raising Arizona Preschool",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-042",
    title: "Mindfulness Activities for Young Children",
    description: "Simple and effective mindfulness activities that can be incorporated into preschool morning routines.",
    youtubeId: "eqtzqg6dlFk",
    category: ["mindful-mornings", "social-emotional", "self-regulation"],
    tags: ["mindfulness", "breathing exercises", "calming techniques", "Raising Arizona"],
    duration: 9,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-043",
    title: "Mindful Morning Example Session",
    description: "Watch a complete example of a Mindful Morning session as implemented at Raising Arizona Preschool.",
    youtubeId: "C7HZuJpvNk0",
    category: ["mindful-mornings", "demonstration", "example"],
    tags: ["demonstration", "example session", "complete routine", "Raising Arizona"],
    duration: 16,
    source: "Raising Arizona Preschool",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-051",
    title: "Social and Emotional Learning: Strategies for Parents and Teachers",
    description: "Evidence-based social and emotional learning strategies that parents and teachers can use to support young children.",
    youtubeId: "y2d0da6BZWA",
    category: ["social-emotional", "partnerships", "teaching-methods"],
    tags: ["SEL", "parent involvement", "strategies", "emotional intelligence"],
    duration: 6,
    source: "Edutopia",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-056",
    title: "Brain Development: Serve and Return Interactions",
    description: "Learn how serve and return interactions build brain architecture in the early years of life.",
    youtubeId: "m_5u8-QSh6A",
    category: ["brain-development", "interactions", "relationships"],
    tags: ["serve and return", "brain architecture", "responsive caregiving", "early development"],
    duration: 6,
    source: "ZERO TO THREE",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-075",
    title: "How to Escape Education's Death Valley",
    description: "Sir Ken Robinson outlines three principles crucial for the human mind to flourish and how current education culture works against them.",
    youtubeId: "wX78iKhInsc",
    category: ["education-reform", "teaching-philosophy", "creativity"],
    tags: ["education reform", "creativity", "individualized learning", "teaching culture"],
    duration: 19,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-076",
    title: "Every Kid Needs a Champion",
    description: "Rita Pierson calls on educators to believe in their students and connect with them on a real, human, personal level.",
    youtubeId: "SFnMTHhKdkw",
    category: ["relationships", "teaching-philosophy", "motivation"],
    tags: ["teacher-student relationships", "champion", "belief in students", "personal connection"],
    duration: 8,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-077",
    title: "The Power of Believing You Can Improve",
    description: "Carol Dweck discusses the 'growth mindset' — the idea that we can grow our brain's capacity to learn and solve problems.",
    youtubeId: "_X0mgOOSpLU",
    category: ["mindset", "growth-mindset", "psychology"],
    tags: ["growth mindset", "fixed mindset", "brain development", "motivation"],
    duration: 10,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-078",
    title: "Let's Teach for Mastery, Not Test Scores",
    description: "Sal Khan shares his plan to turn traditional classroom models upside down to ensure students truly master subjects before moving forward.",
    youtubeId: "-MTRxRO5SRA",
    category: ["teaching-methods", "assessment", "curriculum"],
    tags: ["mastery-based learning", "assessment", "curriculum design", "scaffolding"],
    duration: 10,
    source: "TED",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-079",
    title: "The Linguistic Genius of Babies",
    description: "Patricia Kuhl shares astonishing findings about how babies learn language during the critical developmental window.",
    youtubeId: "G2XBIkHW954",
    category: ["language", "development", "brain-development"],
    tags: ["language acquisition", "infant development", "critical periods", "neuroscience"],
    duration: 10,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-080",
    title: "How to Fix a Broken School? Lead Fearlessly, Love Hard",
    description: "Linda Cliatt-Wayman shares her success story of transforming one of Philadelphia's most dangerous high schools through leadership and love.",
    youtubeId: "Xe2nlti47kA",
    category: ["leadership", "school-culture", "management"],
    tags: ["leadership", "school culture", "transformation", "high expectations"],
    duration: 17,
    source: "TED",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-086",
    title: "Mindful Mornings: Focused Breathing Exercises for Children",
    description: "Simple, age-appropriate breathing techniques to help young children start their day with focus and calm.",
    youtubeId: "CvF9AEe-ozc",
    category: ["mindful-mornings", "mindfulness", "self-regulation"],
    tags: ["breathing exercises", "morning routines", "self-regulation", "focus"],
    duration: 7,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-088",
    title: "Mindful Movement for Young Children",
    description: "Age-appropriate yoga and movement activities designed to engage children's bodies and minds during morning routines.",
    youtubeId: "LhYtcadR9nw",
    category: ["mindful-mornings", "movement", "mindfulness"],
    tags: ["yoga", "mindful movement", "body awareness", "morning activities"],
    duration: 8,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What benefit of mindfulness practice was highlighted in the video?",
                "options": [
                      "It makes children sit still for longer periods",
                      "It helps children develop self-regulation skills",
                      "It eliminates all behavioral issues",
                      "It improves academic test scores immediately"
                ],
                "correctAnswer": 1,
                "explanation": "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
          },
          {
                "question": "How often should mindfulness activities be incorporated into the classroom?",
                "options": [
                      "Once a month during special occasions",
                      "Only when children are misbehaving",
                      "Daily, as part of regular classroom routines",
                      "Just during parent-teacher conferences"
                ],
                "correctAnswer": 2,
                "explanation": "Regular daily practice helps children develop mindfulness skills over time."
          },
          {
                "question": "What is a practical way to introduce mindfulness in your classroom tomorrow?",
                "options": [
                      "Begin with a simple 1-minute breathing exercise during circle time",
                      "Have children sit silently for 30 minutes",
                      "Skip outdoor time to practice meditation",
                      "Eliminate all transitions in the schedule"
                ],
                "correctAnswer": 0,
                "explanation": "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-091",
    title: "Emergent Literacy: Supporting Early Reading Skills",
    description: "Evidence-based strategies for nurturing emergent literacy skills in preschool classrooms through intentional teaching and a print-rich environment.",
    youtubeId: "ey68uVUuyvs",
    category: ["literacy", "language", "development"],
    tags: ["emergent literacy", "reading skills", "print awareness", "phonological awareness"],
    duration: 14,
    source: "Reading Rockets",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-096",
    title: "Culturally Responsive Teaching in Early Childhood",
    description: "Foundational practices for creating a culturally responsive classroom that honors and reflects the diverse backgrounds of all children.",
    youtubeId: "nGTVjJuRaZ8",
    category: ["diversity", "equity", "teaching-methods"],
    tags: ["culturally responsive", "diversity", "equity", "inclusion"],
    duration: 17,
    source: "Teaching Tolerance",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-101",
    title: "Brené Brown: The Power of Empathy",
    description: "Brené Brown explains the crucial difference between empathy and sympathy, and why empathy fuels connection while sympathy drives disconnection.",
    youtubeId: "1Evwgu369Jw",
    category: ["empathy", "social-emotional", "relationships"],
    tags: ["empathy", "connection", "vulnerability", "emotional intelligence"],
    duration: 3,
    source: "RSA",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-102",
    title: "Brené Brown: The Power of Vulnerability",
    description: "Brené Brown shares insights from her research on human connection, vulnerability, courage, and shame, revealing how vulnerability is the path to authentic connection.",
    youtubeId: "iCvmsMzlF7o",
    category: ["empathy", "social-emotional", "personal-growth"],
    tags: ["vulnerability", "connection", "courage", "authenticity"],
    duration: 20,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-103",
    title: "Brené Brown: Daring Classrooms",
    description: "Learn how to create brave spaces in your classroom where vulnerability is seen as courage and empathy is practiced daily.",
    youtubeId: "DVD8YRgA-ck",
    category: ["empathy", "classroom-culture", "social-emotional"],
    tags: ["brave spaces", "vulnerability", "courage", "classroom culture"],
    duration: 15,
    source: "SXSW EDU",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-104",
    title: "Brené Brown: Listening to Shame",
    description: "Brené Brown explores how shame affects us and why understanding it is crucial for educators who want to create empathetic learning environments.",
    youtubeId: "psN1DORYYV0",
    category: ["empathy", "social-emotional", "personal-growth"],
    tags: ["shame", "vulnerability", "resilience", "emotional awareness"],
    duration: 20,
    source: "TED",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-105",
    title: "Brené Brown: Why Your Critics Aren't The Ones Who Count",
    description: "A powerful short talk about facing criticism and finding the courage to show up even when you can't control the outcome.",
    youtubeId: "8-JXOnFOXQk",
    category: ["empathy", "personal-growth", "mindset"],
    tags: ["criticism", "courage", "vulnerability", "resilience"],
    duration: 7,
    source: "The GATE",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
},
{
    id: "video-106",
    title: "Brené Brown: Empathy vs Sympathy",
    description: "A short animated excerpt that perfectly illustrates the difference between empathy and sympathy in everyday interactions.",
    youtubeId: "KZBTYViDPlQ",
    category: ["empathy", "social-emotional", "communication"],
    tags: ["empathy", "sympathy", "connection", "communication"],
    duration: 3,
    source: "The Work of the People",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  ,
  quiz: {
    questions:     [
          {
                "question": "What was the main concept presented in this video?",
                "options": [
                      "The importance of teacher-child relationships",
                      "Strategies for classroom management",
                      "Developmentally appropriate practices",
                      "Building a supportive learning environment"
                ],
                "correctAnswer": 0,
                "explanation": "The video emphasized how positive teacher-child relationships form the foundation for learning."
          },
          {
                "question": "How could you apply what you learned in this video?",
                "options": [
                      "Immediately change all classroom policies",
                      "Start with small, intentional changes in daily interactions",
                      "Wait until next school year to implement",
                      "Delegate these responsibilities to assistants"
                ],
                "correctAnswer": 1,
                "explanation": "Making small, purposeful changes is the most effective way to implement new practices."
          },
          {
                "question": "What is one practical strategy from this video that you could implement tomorrow?",
                "options": [
                      "Completely redesign your classroom layout",
                      "Begin one new routine based on the video's principles",
                      "Purchase expensive new materials",
                      "Schedule a meeting to discuss in the future"
                ],
                "correctAnswer": 1,
                "explanation": "Starting with one concrete action helps turn learning into practice."
          },
          {
                "question": "How will implementing concepts from this video benefit children in your classroom?",
                "options": [
                      "By creating a more engaging and supportive learning environment",
                      "By making classroom management easier for teachers",
                      "By impressing administrators during observations",
                      "By reducing the amount of planning required"
                ],
                "correctAnswer": 0,
                "explanation": "The ultimate goal is creating an environment where children can thrive and learn effectively."
          },
          {
                "question": "What is a potential challenge in implementing these ideas, and how might you overcome it?",
                "options": [
                      "Time constraints - start with brief, focused implementation",
                      "Resistance to change - ignore new approaches entirely",
                      "Limited resources - wait until you have perfect conditions",
                      "Colleague support - implement without team collaboration"
                ],
                "correctAnswer": 0,
                "explanation": "Recognizing challenges and planning strategic responses helps ensure successful implementation."
          },
          {
                "question": "How will you implement what you've learned from this video in your classroom?",
                "options": [
                      "I'll try one new strategy from the video this week",
                      "I'll share what I learned with a colleague",
                      "I'll reflect on how these concepts connect to our school philosophy",
                      "I'll observe my classroom to identify where these concepts could help"
                ],
                "correctAnswer": 0,
                "explanation": "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
          }
    ]
  }
}
];