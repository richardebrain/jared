// Types for video resources
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
}

// Comprehensive database of high-quality early childhood education videos
export const videoResourcesData: VideoResource[] = [
  // INSPIRATIONAL & PHILOSOPHICAL VIDEOS
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
  },
  {
    id: "video-002",
    title: "How to Find the Good in Children | Dr. Becky Bailey",
    description: "Learn how to see the best in every child and create a positive connection, even with the most challenging behaviors.",
    youtubeId: "5CTI7rGSYsw",
    category: ["inspiration", "teaching-philosophy", "behavior"],
    tags: ["conscious discipline", "positive guidance", "classroom culture"],
    duration: 15,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
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
  },
  
  // Mindfulness Videos
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
  },
  
  // Active Listening Skills
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
  },
  
  // Social-Emotional Learning
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
  },
  {
    id: "video-009",
    title: "Building Empathy in Early Childhood Classrooms",
    description: "Strategies for developing empathy in young children through everyday interactions.",
    youtubeId: "aU3UEtdAHls", // Teaching empathy to children video
    category: ["social-emotional", "empathy", "community-building"],
    tags: ["empathy development", "classroom community", "caring behaviors"],
    duration: 14,
    source: "Edutopia",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Inclusive Teaching
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
  },
  {
    id: "video-011",
    title: "Supporting Children with Sensory Processing Differences",
    description: "Classroom accommodations and strategies for children with sensory needs.",
    youtubeId: "D1G1l5FE38A", // Sensory processing in early childhood education
    category: ["inclusion", "sensory", "adaptations"],
    tags: ["sensory processing", "accommodations", "inclusive environment"],
    duration: 10,
    source: "Special Education Guide",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Family Engagement
  {
    id: "video-012",
    title: "Effective Parent-Teacher Communication Strategies",
    description: "Building strong partnerships with families through various communication channels.",
    youtubeId: "LO7vR1mxQIU", // Family engagement strategies
    category: ["family-engagement", "communication", "partnerships"],
    tags: ["parent communication", "family partnership", "relationship building"],
    duration: 13,
    source: "NAEYC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-013",
    title: "Engaging Families in Children's Learning Journey",
    description: "Creative ways to involve families in curriculum and learning experiences.",
    youtubeId: "1t8LMxIMV1I", // "Engaging Families in Early Childhood" by NAEYC
    category: ["family-engagement", "curriculum", "community"],
    tags: ["family involvement", "learning at home", "community connections"],
    duration: 12,
    source: "NAEYC",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // HEAD START TRAINING VIDEOS
  {
    id: "video-014",
    title: "Powerful Interactions: How Teachers Connect with Children to Extend Learning",
    description: "Learn how to have powerful interactions with children to extend their learning in meaningful ways.",
    youtubeId: "3hT91-L5e6g",
    category: ["teaching-methods", "interactions", "child-development"],
    tags: ["teacher-child interactions", "extending learning", "Head Start"],
    duration: 18,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-015",
    title: "CLASS: The Power of Interactions",
    description: "An overview of the CLASS framework and how teacher-child interactions impact development and learning.",
    youtubeId: "waSEI59wxDw",
    category: ["teaching-methods", "assessment", "CLASS"],
    tags: ["CLASS assessment", "teacher-child interactions", "quality teaching"],
    duration: 12,
    source: "Teachstone",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-016",
    title: "Trauma-Informed Care in Early Childhood",
    description: "Understanding and addressing the impact of trauma on young children in early childhood settings.",
    youtubeId: "lsLH8M2NovM",
    category: ["trauma-informed", "social-emotional", "mental-health"],
    tags: ["trauma", "ACEs", "responsive teaching", "safety"],
    duration: 22,
    source: "Head Start ECLKC",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // TED TALKS FOR TEACHERS
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
  },
  {
    id: "video-019",
    title: "The Way We Teach Math Is Holding Women Back | Jo Boaler",
    description: "Jo Boaler explains how we can redesign math education to provide more equitable opportunities for all children.",
    youtubeId: "Mq3Ad7Pf5-0",
    category: ["math", "equity", "teaching-methods"],
    tags: ["TED Talk", "mathematics", "gender equity", "teaching approaches"],
    duration: 15,
    source: "TED",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // MANDATED REPORTER TRAINING
  {
    id: "video-020",
    title: "Early Childhood Educators as Mandated Reporters",
    description: "Essential training for early childhood educators on recognizing and reporting suspected child abuse and neglect.",
    youtubeId: "nMdgrSYK6-I",
    category: ["mandated-reporting", "child-protection", "professional-responsibilities"],
    tags: ["child abuse", "neglect", "reporting procedures", "signs of abuse"],
    duration: 26,
    source: "Childcare Education Institute",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // BUILDING CHAPTER ONE PHILOSOPHY VIDEOS
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
  },
  {
    id: "video-022",
    title: "How To Find the Good in Every Child | Dr. Becky Bailey",
    description: "Dr. Becky Bailey explains how to see beyond challenging behaviors to connect with every child.",
    youtubeId: "5CTI7rGSYsw",
    category: ["chapter-one-philosophy", "behavior", "connections"],
    tags: ["challenging behaviors", "positive relationships", "seeing the good"],
    duration: 16,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // STEM AND SCIENCE TEACHING
  {
    id: "video-023",
    title: "Ramps and Pathways: Physics for Young Children",
    description: "Explore how simple materials can be used to teach physics concepts to preschoolers through play.",
    youtubeId: "UJY4Cgg4ps4",
    category: ["stem", "science", "hands-on-learning"],
    tags: ["physics", "ramps", "inquiry-based learning", "scientific method"],
    duration: 14,
    source: "NAEYC",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-024",
    title: "Math Talk: Supporting Mathematical Thinking in Early Childhood",
    description: "Learn strategies for incorporating math language and concepts naturally throughout the day.",
    youtubeId: "aXSSrIMXJz4",
    category: ["stem", "math", "language"],
    tags: ["math talk", "numerical concepts", "spatial reasoning"],
    duration: 18,
    source: "Development and Research in Early Math Education",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // LANGUAGE AND LITERACY
  {
    id: "video-025",
    title: "Fostering Language Development Through Storybook Reading",
    description: "Effective techniques for reading with young children to maximize language growth.",
    youtubeId: "UrBxWz11Ysw",
    category: ["literacy", "language", "reading"],
    tags: ["book reading", "vocabulary", "dialogic reading", "comprehension"],
    duration: 16,
    source: "READ for Life",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
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
  },
  
  // HEALTH AND SAFETY
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
  },
  
  // OUTDOOR AND NATURE PLAY
  {
    id: "video-028",
    title: "The Outdoor Classroom: Learning in Nature",
    description: "Benefits of outdoor learning environments and how to effectively use outdoor spaces for education.",
    youtubeId: "MGo8vPVkGPM",
    category: ["outdoor-play", "nature", "environment"],
    tags: ["outdoor classroom", "nature-based learning", "risk taking"],
    duration: 19,
    source: "Natural Start Alliance",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // MUSIC AND MOVEMENT
  {
    id: "video-029",
    title: "Music and Movement in Early Childhood Education",
    description: "How music and movement support brain development and learning across all domains.",
    youtubeId: "gB2acdOIUEY",
    category: ["music", "movement", "brain-development"],
    tags: ["musical activities", "rhythmic movement", "brain development"],
    duration: 12,
    source: "Early Childhood Music and Movement Association",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // CHILD DEVELOPMENT
  {
    id: "video-030",
    title: "The Science of Early Brain Development",
    description: "Research-based overview of how experiences shape brain architecture in the early years.",
    youtubeId: "cVc2nHumVxY",
    category: ["brain-development", "neuroscience", "child-development"],
    tags: ["brain architecture", "serve and return", "neural connections"],
    duration: 20,
    source: "Center on the Developing Child at Harvard University",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // ADDITIONAL INSPIRATIONAL TALKS
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
  },
  {
    id: "video-032",
    title: "How Every Child Can Thrive by Five | Molly Wright",
    description: "7-year-old Molly Wright shows how the early years are when our brains develop the most, and how simple interactions with children can have profound impacts.",
    youtubeId: "aISXCw0pi94",
    category: ["brain-development", "interactions", "early-years"],
    tags: ["TED Talk", "serve and return", "child development", "brain science"],
    duration: 8,
    source: "TED",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
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
  },
  
  // CONSCIOUS DISCIPLINE PRACTICAL EXAMPLES
  {
    id: "video-035",
    title: "Conscious Discipline: Creating a Safe Place in Your Classroom",
    description: "Dr. Becky Bailey demonstrates how to set up and use a Safe Place in the classroom to help children develop emotional regulation skills.",
    youtubeId: "8Qm5Olgz_k4",
    category: ["conscious-discipline", "classroom-management", "social-emotional"],
    tags: ["safe place", "emotional regulation", "classroom setup", "calming strategies"],
    duration: 12,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-036",
    title: "Conscious Discipline: Teaching Children to Manage Emotions",
    description: "Practical strategies for teaching children how to identify and manage their emotions effectively.",
    youtubeId: "t28GAKLaaz0",
    category: ["conscious-discipline", "social-emotional", "behavior"],
    tags: ["emotions", "self-regulation", "calming techniques", "feelings"],
    duration: 9,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // EFFECTIVE TEACHING STRATEGIES
  {
    id: "video-037",
    title: "Effective Questioning Techniques in Early Childhood Education",
    description: "Learn how to use open-ended questions to stimulate critical thinking and language development in young children.",
    youtubeId: "5tJ2iVSXcfE",
    category: ["teaching-methods", "language", "critical-thinking"],
    tags: ["questioning", "open-ended questions", "inquiry", "discussion"],
    duration: 11,
    source: "Center for Early Childhood Education",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-038",
    title: "Documenting Children's Learning: Making Learning Visible",
    description: "Strategies for documenting children's thinking and learning processes to deepen understanding and inform teaching.",
    youtubeId: "trEQDf4jeOA",
    category: ["assessment", "documentation", "observation"],
    tags: ["documentation", "learning stories", "portfolios", "assessment"],
    duration: 15,
    source: "Center for Early Childhood Education",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // MINDFUL MORNINGS SPECIFIC VIDEOS
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
  },
  
  // CONSCIOUS DISCIPLINE ADDITIONAL RESOURCES
  {
    id: "video-044",
    title: "Conscious Discipline: The Safe Place Self-Regulation Center",
    description: "Learn how to set up and use the Safe Place in your classroom to help children develop emotional regulation skills.",
    youtubeId: "2MJkPMp5RpI",
    category: ["conscious-discipline", "social-emotional", "classroom-management"],
    tags: ["safe place", "emotional regulation", "classroom tools", "calming strategies"],
    duration: 8,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-045",
    title: "Wish Well Board: A Tool for Building Empathy and Connection",
    description: "Dr. Becky Bailey demonstrates how to implement the Wish Well Board in your classroom to develop empathy and social connections.",
    youtubeId: "r_LOYHDz4Vw",
    category: ["conscious-discipline", "social-emotional", "empathy"],
    tags: ["wish well board", "empathy", "classroom tools", "social connections"],
    duration: 6,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-046",
    title: "Time Machine: Conflict Resolution Tool for Early Childhood",
    description: "Learn to use the Time Machine structure to help children resolve conflicts and develop problem-solving skills.",
    youtubeId: "U46pnN0_QjE",
    category: ["conscious-discipline", "conflict-resolution", "social-emotional"],
    tags: ["time machine", "conflict resolution", "problem-solving", "social skills"],
    duration: 10,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-047",
    title: "I Love You Rituals: Building Positive Connections with Children",
    description: "Dr. Becky Bailey explains how to use I Love You Rituals to build connections and develop healthy brain pathways.",
    youtubeId: "9z0KxrJvySM",
    category: ["conscious-discipline", "relationships", "social-emotional"],
    tags: ["i love you rituals", "connection", "brain development", "relationships"],
    duration: 7,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-048",
    title: "Conscious Discipline: Managing Anger in the Classroom",
    description: "Strategies for helping children identify and manage anger in healthy, productive ways in the classroom setting.",
    youtubeId: "QcMbZFIpQwQ",
    category: ["conscious-discipline", "social-emotional", "emotions", "anger-management"],
    tags: ["anger", "emotional regulation", "calming strategies", "challenging behaviors"],
    duration: 9,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-049",
    title: "Conscious Discipline Brain State Model Explained",
    description: "Dr. Becky Bailey explains the three brain states and how they impact behavior and learning in young children.",
    youtubeId: "ogBOysX7Atk",
    category: ["conscious-discipline", "brain-development", "behavior"],
    tags: ["brain states", "survival state", "emotional state", "executive state", "neuroscience"],
    duration: 12,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-050",
    title: "Morning Greeting Routine: Conscious Discipline in Action",
    description: "See how teachers implement morning greeting routines that build connection and set a positive tone for the day.",
    youtubeId: "OoHQrFw7Bqo",
    category: ["conscious-discipline", "classroom-management", "mindful-mornings"],
    tags: ["greeting ritual", "morning routine", "connection", "belonging"],
    duration: 5,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // EDUTOPIA RESOURCES
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
  },
  {
    id: "video-052",
    title: "Making Connections with Greetings at the Door",
    description: "Learn how greeting each child at the door helps build relationships and sets a positive tone for learning.",
    youtubeId: "GwdtVzitHLM", // "Morning Greeting Strategies" from Edutopia
    category: ["classroom-management", "relationships", "mindful-mornings"],
    tags: ["greetings", "door greetings", "relationships", "classroom climate"],
    duration: 3,
    source: "Edutopia",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-053",
    title: "Encouraging Academic Risk Taking Through a Safe Classroom Environment",
    description: "Learn how to create a classroom environment where children feel safe to take risks and learn from mistakes.",
    youtubeId: "J0QkNGx4v9g",
    category: ["classroom-management", "teaching-philosophy", "mindset"],
    tags: ["safe environment", "risk-taking", "growth mindset", "mistakes"],
    duration: 5,
    source: "Edutopia",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-054",
    title: "60-Second Strategy: Pom-Pom Jar",
    description: "A simple and effective positive reinforcement strategy to encourage good behavior and build classroom community.",
    youtubeId: "DSs1X0LlOUo",
    category: ["classroom-management", "behavior", "positive-reinforcement"],
    tags: ["pom-pom jar", "positive reinforcement", "whole class", "rewards"],
    duration: 2,
    source: "Edutopia",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-055",
    title: "Teaching Executive Function with Movement and Music",
    description: "Fun and engaging ways to use movement and music to develop executive function skills in young children.",
    youtubeId: "5gMdThSrQC4",
    category: ["executive-function", "music", "movement"],
    tags: ["executive function", "music", "movement", "self-regulation"],
    duration: 4,
    source: "Edutopia",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // ZERO TO THREE RESOURCES
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
  },
  {
    id: "video-057",
    title: "Supporting the Development of Emotional Regulation",
    description: "Practical strategies for helping young children develop critical emotional regulation skills from the earliest years.",
    youtubeId: "CVgpHYB9Q7Y",
    category: ["social-emotional", "emotional-regulation", "development"],
    tags: ["emotional regulation", "co-regulation", "development", "early years"],
    duration: 8,
    source: "ZERO TO THREE",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-058",
    title: "Tuning In: Active Observation in Early Childhood Settings",
    description: "Learn the practice of intentional observation to better understand and respond to children's individual needs.",
    youtubeId: "fnp9NrFQEQM",
    category: ["observation", "responsive-teaching", "individualization"],
    tags: ["observation", "documentation", "individualized teaching", "child cues"],
    duration: 7,
    source: "ZERO TO THREE",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // CENTER FOR EARLY CHILDHOOD EDUCATION VIDEOS
  {
    id: "video-059",
    title: "Cultivating Young Scientists: STEM in Early Childhood",
    description: "Discover how to promote scientific inquiry and STEM concepts in developmentally appropriate ways for young children.",
    youtubeId: "9VtxBGM3V80",
    category: ["stem", "science", "curriculum"],
    tags: ["scientific inquiry", "STEM", "early science", "exploration"],
    duration: 13,
    source: "Center for Early Childhood Education",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-060",
    title: "Supporting Language Development Through Play",
    description: "See how teachers can foster language development through intentional play-based learning experiences.",
    youtubeId: "qdMQQWXpYKM",
    category: ["language", "play", "development"],
    tags: ["language development", "play-based learning", "vocabulary", "communication"],
    duration: 9,
    source: "Center for Early Childhood Education",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-061",
    title: "Quality Block Play for Early Learning",
    description: "Research-based strategies for enhancing block play to develop math, spatial reasoning, and problem-solving skills.",
    youtubeId: "sNxxN9yCwz0",
    category: ["play", "math", "spatial-reasoning"],
    tags: ["block play", "construction", "spatial skills", "manipulatives"],
    duration: 11,
    source: "Center for Early Childhood Education",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-062",
    title: "Teacher Research: Documentation and Reflection",
    description: "Learn how teacher research through documentation can improve teaching practices and children's learning outcomes.",
    youtubeId: "NWUFiJF2gCo",
    category: ["professional-development", "documentation", "reflection"],
    tags: ["teacher research", "documentation", "reflection", "professional growth"],
    duration: 14,
    source: "Center for Early Childhood Education",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-063",
    title: "Supporting Children with Autism in Preschool Classrooms",
    description: "Evidence-based strategies for successfully including and supporting children with autism in inclusive classrooms.",
    youtubeId: "Jt4_-W2s9Eo",
    category: ["inclusion", "autism", "special-education"],
    tags: ["autism", "inclusion", "visual supports", "structure", "sensory"],
    duration: 18,
    source: "Center for Early Childhood Education",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // NAEYC PROFESSIONAL DEVELOPMENT VIDEOS
  {
    id: "video-064",
    title: "Developmentally Appropriate Practice (DAP) Introduction",
    description: "An introduction to the core concepts of Developmentally Appropriate Practice and why it matters in early childhood education.",
    youtubeId: "KbTCRT4paQM",
    category: ["foundations", "dap", "teaching-methods"],
    tags: ["developmentally appropriate practice", "DAP", "best practices", "NAEYC"],
    duration: 8,
    source: "NAEYC",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-065",
    title: "Engaging Families in Meaningful Ways",
    description: "Learn strategies for building authentic partnerships with all families in your early childhood program.",
    youtubeId: "vRWFJxwPJQE",
    category: ["family-engagement", "partnerships", "communication"],
    tags: ["family engagement", "partnerships", "communication", "relationships"],
    duration: 12,
    source: "NAEYC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-066",
    title: "Creating Language-Rich Environments",
    description: "Practical ways to create environments that foster language development throughout the day.",
    youtubeId: "O7F5JkvXkG4",
    category: ["language", "environment", "communication"],
    tags: ["language-rich", "vocabulary", "conversation", "literacy"],
    duration: 10,
    source: "NAEYC",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-067",
    title: "Anti-Bias Education in Action",
    description: "See real examples of anti-bias education approaches in diverse early childhood classrooms.",
    youtubeId: "s3iMJ-bKWbY",
    category: ["diversity", "equity", "anti-bias"],
    tags: ["anti-bias", "identity", "diversity", "equity", "inclusion"],
    duration: 20,
    source: "NAEYC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-068",
    title: "Supporting Mathematical Development in Young Children",
    description: "Learn how to foster foundational math skills through play and everyday activities.",
    youtubeId: "e1uOoXlx_HA",
    category: ["math", "curriculum", "development"],
    tags: ["mathematics", "number sense", "spatial skills", "patterns"],
    duration: 15,
    source: "NAEYC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // HEAD START ECLKC ADDITIONAL RESOURCES
  {
    id: "video-069",
    title: "Effective Teaching Practices: Teacher-Child Interactions",
    description: "Learn about the importance of quality teacher-child interactions and strategies to improve them.",
    youtubeId: "xpIKrAYhyZk",
    category: ["teaching-methods", "interactions", "relationships"],
    tags: ["teacher-child interactions", "quality teaching", "responsive", "engagement"],
    duration: 14,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-070",
    title: "Supporting Dual Language Learners",
    description: "Research-based strategies for supporting the development of both home language and English in young dual language learners.",
    youtubeId: "7S4M0IoG9_I",
    category: ["language", "diversity", "dual-language"],
    tags: ["dual language learners", "bilingualism", "home language", "cultural responsiveness"],
    duration: 17,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-071",
    title: "Home Visiting: Building Relationships with Families",
    description: "Best practices for building trusting relationships with families during home visits.",
    youtubeId: "nPpwJ9-bK_w",
    category: ["family-engagement", "home-visiting", "relationships"],
    tags: ["home visits", "family partnerships", "trust", "communication"],
    duration: 11,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-072",
    title: "Fostering Children's Thinking Skills",
    description: "Strategies for promoting children's critical thinking, problem-solving, and higher-order thinking skills.",
    youtubeId: "KDla3DxxLRc",
    category: ["cognitive-development", "critical-thinking", "teaching-methods"],
    tags: ["thinking skills", "problem-solving", "questioning", "cognitive development"],
    duration: 13,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-073",
    title: "Curriculum Modifications for Children with Disabilities",
    description: "Learn practical, effective ways to adapt curriculum and activities to meet the needs of all children.",
    youtubeId: "pKc4328zR7Q",
    category: ["inclusion", "adaptations", "special-education"],
    tags: ["curriculum modifications", "adaptations", "disabilities", "inclusion"],
    duration: 16,
    source: "Head Start ECLKC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // TED TALKS ON EDUCATION AND CHILD DEVELOPMENT
  {
    id: "video-074",
    title: "How to Repair the Teaching Crisis",
    description: "Nínive Calegari shares insights into why we need to invest in teachers and how to create a sustainable career that attracts top talent.",
    youtubeId: "UChjMsNSV2g",
    category: ["teaching-philosophy", "education-reform", "professional-development"],
    tags: ["teacher support", "education reform", "teacher compensation", "teaching as profession"],
    duration: 18,
    source: "TED",
    expertLevel: "all-levels",
    dateAdded: "2025-05-14",
    featured: true
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
  },
  
  // PRACTICAL CLASSROOM MANAGEMENT VIDEOS
  {
    id: "video-081",
    title: "Quick Transitions: Efficient Classroom Management Techniques",
    description: "Learn practical strategies for smooth and quick transitions between activities to maximize learning time and minimize disruptions.",
    youtubeId: "gBa0rVb2Bnc",
    category: ["classroom-management", "transitions", "quick-transition-techniques"],
    tags: ["transitions", "time management", "classroom routines", "efficiency"],
    duration: 9,
    source: "Teaching Channel",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-082",
    title: "Setting Up Classroom Centers That Work",
    description: "A step-by-step guide to creating effective learning centers that promote independence and engagement in your early childhood classroom.",
    youtubeId: "eGLBivmwt_s",
    category: ["classroom-management", "centers", "environment"],
    tags: ["learning centers", "classroom setup", "independent learning", "classroom design"],
    duration: 14,
    source: "Teaching Channel",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-083",
    title: "Positive Behavior Management Strategies for Early Childhood",
    description: "Evidence-based positive behavior management techniques specifically designed for preschool and kindergarten classrooms.",
    youtubeId: "JQ7cR_TH-P4",
    category: ["classroom-management", "behavior", "positive-discipline"],
    tags: ["positive behavior", "redirection", "behavior management", "early childhood"],
    duration: 12,
    source: "Teaching Channel",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-084",
    title: "Small Group Instruction: Best Practices for Early Childhood",
    description: "Effective strategies for managing small group instruction while keeping the rest of the class engaged in meaningful learning.",
    youtubeId: "0e7ZiGULFCM",
    category: ["teaching-methods", "small-groups", "classroom-management"],
    tags: ["small groups", "differentiation", "group management", "independent work"],
    duration: 15,
    source: "Teaching Channel",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-085",
    title: "Creating Clear Classroom Expectations with Visual Supports",
    description: "How to create and implement visual supports to clarify expectations and routines for young children in the classroom.",
    youtubeId: "WfEX7eTGjtk",
    category: ["classroom-management", "visual-supports", "structure"],
    tags: ["visual supports", "classroom expectations", "routines", "behavior support"],
    duration: 8,
    source: "Teaching Channel",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // ADDITIONAL MINDFUL MORNINGS RESOURCES
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
  },
  {
    id: "video-087",
    title: "Morning Meeting: Building Community in the Classroom",
    description: "How to structure effective morning meetings that build classroom community, practice social skills, and set a positive tone for the day.",
    youtubeId: "R5J_SYv6W6M", // "Morning Meeting: Building Community" from ASCD
    category: ["mindful-mornings", "community-building", "social-skills"],
    tags: ["morning meeting", "classroom community", "social skills", "routines"],
    duration: 11,
    source: "Responsive Classroom",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
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
  },
  {
    id: "video-089",
    title: "Emotional Check-ins: Starting the Day with Emotional Awareness",
    description: "Learn how to implement morning emotional check-ins that help children identify, express, and manage their feelings.",
    youtubeId: "1EosPr0ilDQ",
    category: ["mindful-mornings", "emotions", "social-emotional"],
    tags: ["emotional awareness", "check-ins", "feelings", "emotional vocabulary"],
    duration: 9,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-090",
    title: "Gratitude Practices for Early Childhood Classrooms",
    description: "Simple gratitude activities and routines to incorporate into your morning meetings that foster positivity and appreciation.",
    youtubeId: "l4r9z0rBP-U",
    category: ["mindful-mornings", "gratitude", "social-emotional"],
    tags: ["gratitude", "positive mindset", "appreciation", "morning routines"],
    duration: 6,
    source: "Raising Arizona Preschool",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // EARLY LITERACY AND STEM EDUCATION
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
  },
  {
    id: "video-092",
    title: "Interactive Read-Alouds That Build Comprehension",
    description: "Learn techniques for conducting interactive read-alouds that actively engage children and develop their comprehension skills.",
    youtubeId: "D6EB_9u_O_g",
    category: ["literacy", "reading", "teaching-methods"],
    tags: ["read-aloud", "comprehension", "questioning strategies", "dialogic reading"],
    duration: 10,
    source: "Reading Rockets",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-093",
    title: "STEM in Early Childhood: Everyday Science Explorations",
    description: "Simple ways to incorporate authentic scientific inquiry and exploration into everyday preschool activities.",
    youtubeId: "4u66d5I-9w0",
    category: ["stem", "science", "inquiry"],
    tags: ["science exploration", "inquiry-based learning", "hands-on science", "questioning"],
    duration: 16,
    source: "National Science Teaching Association",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-094",
    title: "Math Talk: Building Number Sense in Early Childhood",
    description: "How to integrate purposeful mathematical conversations into daily routines and activities to develop strong number sense.",
    youtubeId: "3xpW0iQ88EU",
    category: ["stem", "math", "teaching-methods"],
    tags: ["math talk", "number sense", "mathematical thinking", "everyday math"],
    duration: 11,
    source: "National Council of Teachers of Mathematics",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-095",
    title: "Writing Centers That Inspire Young Authors",
    description: "Tips for creating engaging writing centers that motivate young children to express themselves through drawing and early writing.",
    youtubeId: "WL6GJk2E9Fc",
    category: ["literacy", "writing", "environment"],
    tags: ["writing centers", "emergent writing", "author development", "literacy environment"],
    duration: 9,
    source: "Reading Rockets",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // CULTURALLY RESPONSIVE TEACHING
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
  },
  {
    id: "video-097",
    title: "Honoring Home Languages in the Classroom",
    description: "Strategies for supporting multilingual learners by incorporating and celebrating home languages within the classroom environment.",
    youtubeId: "jDspCLxox_k",
    category: ["language", "diversity", "dual-language"],
    tags: ["multilingual learners", "home language", "language diversity", "cultural identity"],
    duration: 13,
    source: "Colorín Colorado",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-098",
    title: "Diverse Books Matter: Building an Inclusive Classroom Library",
    description: "How to select and use diverse children's literature that represents a variety of cultures, family structures, and experiences.",
    youtubeId: "U2P_vp6RFhg",
    category: ["diversity", "literacy", "environment"],
    tags: ["diverse books", "classroom library", "representation", "inclusive curriculum"],
    duration: 12,
    source: "Teaching Tolerance",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-099",
    title: "Addressing Bias in Early Childhood: Teacher Self-Reflection",
    description: "Guidance for teachers on recognizing and addressing implicit bias to create a more equitable classroom environment.",
    youtubeId: "uZq66ulGgX0",
    category: ["equity", "professional-development", "reflection"],
    tags: ["implicit bias", "self-reflection", "equity", "anti-bias education"],
    duration: 19,
    source: "Teaching Tolerance",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-100",
    title: "Family Engagement Across Cultures",
    description: "Effective strategies for building authentic partnerships with families from diverse cultural backgrounds.",
    youtubeId: "tV6EC-pIAcE",
    category: ["family-engagement", "diversity", "partnerships"],
    tags: ["family engagement", "cultural competence", "communication", "home-school connection"],
    duration: 15,
    source: "Harvard Family Research Project",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  
  // BRENÉ BROWN ON EMPATHY AND VULNERABILITY
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
  },
  
  // CONSCIOUS DISCIPLINE VIDEOS
  {
    id: "video-107",
    title: "Conscious Discipline: Introduction to Brain State Model",
    description: "Dr. Becky Bailey introduces the Brain State Model, showing how different emotional states affect behavior and learning in early childhood classrooms.",
    youtubeId: "M-H9hGX9Xuw",
    category: ["conscious-discipline", "behavior", "social-emotional"],
    tags: ["brain state", "self-regulation", "emotional intelligence", "classroom management"],
    duration: 10,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-108",
    title: "Conscious Discipline: I Love You Rituals",
    description: "Learn how to implement I Love You Rituals to build deep connections with children, strengthen attachment, and enhance emotional development.",
    youtubeId: "PadcO9SH-mM",
    category: ["conscious-discipline", "relationships", "social-emotional"],
    tags: ["rituals", "connection", "attachment", "emotional development"],
    duration: 7,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-109",
    title: "Conscious Discipline: The Safe Place Self-Regulation Center",
    description: "Dr. Becky Bailey demonstrates how to create and use a Safe Place in your classroom to help children learn emotional regulation skills.",
    youtubeId: "0ImHVqCpUH4",
    category: ["conscious-discipline", "self-regulation", "classroom-management"],
    tags: ["safe place", "emotional regulation", "calming techniques", "classroom setup"],
    duration: 12,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-110",
    title: "Conscious Discipline: Teaching Assertiveness to Children",
    description: "Practical strategies for helping children develop assertiveness skills and use their voice effectively in social situations.",
    youtubeId: "PdQoS3zMgkI",
    category: ["conscious-discipline", "social-skills", "communication"],
    tags: ["assertiveness", "boundaries", "communication skills", "social development"],
    duration: 9,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-111",
    title: "Conscious Discipline: Building School Family Through Meaningful Jobs",
    description: "How to create a sense of belonging and purpose by implementing classroom jobs that develop executive function skills and community responsibility.",
    youtubeId: "FKc5OHNjYYU",
    category: ["conscious-discipline", "classroom-management", "community-building"],
    tags: ["classroom jobs", "school family", "executive function", "responsibility"],
    duration: 8,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-112",
    title: "Conscious Discipline: Composure and Anger Management",
    description: "Tools and techniques for teachers to maintain composure and model healthy anger management for young children.",
    youtubeId: "jMWpSQRdLDQ",
    category: ["conscious-discipline", "teacher-development", "social-emotional"],
    tags: ["composure", "anger management", "teacher skills", "emotional regulation"],
    duration: 15,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-113",
    title: "Conscious Discipline: Using Visual Routines for Success",
    description: "How to implement visual routines that provide safety, connection, and problem-solving opportunities throughout the school day.",
    youtubeId: "YHBYR05Ezmg",
    category: ["conscious-discipline", "classroom-management", "routines"],
    tags: ["visual routines", "classroom structure", "transitions", "predictability"],
    duration: 11,
    source: "Conscious Discipline",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-114",
    title: "Conscious Discipline: Noticing and Managing Emotional Triggers",
    description: "Dr. Becky Bailey guides teachers through the process of identifying personal triggers and developing strategies to maintain composure in challenging situations.",
    youtubeId: "QZ0fTgBQH-I",
    category: ["conscious-discipline", "teacher-development", "self-awareness"],
    tags: ["emotional triggers", "self-awareness", "stress management", "teacher wellness"],
    duration: 14,
    source: "Conscious Discipline",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  },
  {
    id: "video-115",
    title: "Conscious Discipline: Empathy and Building Connections with Children",
    description: "Learn practical ways to develop and demonstrate empathy with children to build deeper relationships and foster social-emotional growth.",
    youtubeId: "vC9OT21lYc0",
    category: ["conscious-discipline", "empathy", "relationships"],
    tags: ["empathy", "connection", "relationship-building", "social-emotional learning"],
    duration: 10,
    source: "Conscious Discipline",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  }
];