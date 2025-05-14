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
    youtubeId: "dQw4w9WgXcQ", // Using a common YouTube video as placeholder
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
    youtubeId: "dQw4w9WgXcQ", // Using a common YouTube video as placeholder
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
    youtubeId: "dQw4w9WgXcQ", // Using a common YouTube video as placeholder
    category: ["family-engagement", "curriculum", "community"],
    tags: ["family involvement", "learning at home", "community connections"],
    duration: 15,
    source: "Harvard Family Research Project",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  }
];