/**
 * Micro-Learning Module Templates
 * Inspired by effective platforms like Duolingo - bite-sized, varied teaching methods
 */

export interface LessonActivity {
  id: string;
  type: 'video' | 'interactive' | 'quiz' | 'discussion' | 'reflection' | 'practice' | 'demonstration' | 'scenario' | 'storytelling' | 'gamification';
  title: string;
  description: string;
  content: string;
  duration: number; // in minutes
  engagement: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completionCriteria: string;
  pointsAwarded: number;
}

export interface MicroModule {
  id: string;
  title: string;
  category: string;
  description: string;
  totalDuration: number;
  learningObjectives: string[];
  activities: LessonActivity[];
  assessmentMethod: string;
  reinforcementStrategy: string;
  adaptiveElements: string[];
}

export const microLearningTemplates: MicroModule[] = [
  {
    id: 'conflict-resolution-basics',
    title: 'Conflict Resolution Fundamentals',
    category: 'Communication Skills',
    description: 'Learn essential conflict resolution techniques through interactive scenarios and practice exercises.',
    totalDuration: 15,
    learningObjectives: [
      'Identify different types of workplace conflicts',
      'Apply active listening techniques',
      'Use de-escalation strategies effectively',
      'Practice collaborative problem-solving'
    ],
    activities: [
      {
        id: 'conflict-intro',
        type: 'video',
        title: 'What is Workplace Conflict?',
        description: 'Brief animated introduction to types of conflicts',
        content: 'Short, engaging video explaining common workplace conflicts with real examples and visual storytelling.',
        duration: 3,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Watch entire video',
        pointsAwarded: 5
      },
      {
        id: 'listening-practice',
        type: 'interactive',
        title: 'Active Listening Challenge',
        description: 'Interactive exercise to practice listening skills',
        content: 'Click-through scenarios where learners choose appropriate listening responses. Immediate feedback provided.',
        duration: 4,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Complete 5 scenarios with 80% accuracy',
        pointsAwarded: 10
      },
      {
        id: 'scenario-practice',
        type: 'scenario',
        title: 'Conflict Resolution Simulation',
        description: 'Apply techniques in realistic workplace scenario',
        content: 'Branching scenario where learners navigate a team disagreement using learned techniques.',
        duration: 5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Successfully resolve conflict scenario',
        pointsAwarded: 15
      },
      {
        id: 'knowledge-check',
        type: 'quiz',
        title: 'Quick Knowledge Check',
        description: 'Test understanding of key concepts',
        content: 'Interactive quiz with immediate feedback and explanations for incorrect answers.',
        duration: 2,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Score 70% or higher',
        pointsAwarded: 8
      },
      {
        id: 'action-planning',
        type: 'reflection',
        title: 'Personal Action Plan',
        description: 'Create specific goals for applying skills',
        content: 'Guided reflection prompts to help learners identify one conflict situation and plan their approach.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Complete action plan template',
        pointsAwarded: 7
      }
    ],
    assessmentMethod: 'Formative assessment through scenario completion and quiz performance',
    reinforcementStrategy: 'Spaced repetition reminders and follow-up challenges',
    adaptiveElements: [
      'Difficulty adjusts based on quiz performance',
      'Additional scenarios unlocked for advanced learners',
      'Personalized feedback based on learning style'
    ]
  },
  {
    id: 'effective-feedback',
    title: 'Giving Effective Feedback',
    category: 'Leadership Skills',
    description: 'Master the art of constructive feedback through practice and real-world application.',
    totalDuration: 12,
    learningObjectives: [
      'Structure feedback using proven frameworks',
      'Deliver feedback with empathy and clarity',
      'Handle defensive reactions professionally',
      'Follow up effectively after feedback conversations'
    ],
    activities: [
      {
        id: 'feedback-framework',
        type: 'demonstration',
        title: 'The SBI Model Demo',
        description: 'See the Situation-Behavior-Impact model in action',
        content: 'Interactive demonstration showing good vs. poor feedback examples using the SBI framework.',
        duration: 3,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Complete interactive examples',
        pointsAwarded: 6
      },
      {
        id: 'feedback-builder',
        type: 'practice',
        title: 'Feedback Builder Tool',
        description: 'Build your own feedback using guided prompts',
        content: 'Step-by-step tool helping learners construct effective feedback messages with real-time suggestions.',
        duration: 4,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Create 3 feedback messages',
        pointsAwarded: 12
      },
      {
        id: 'difficult-conversations',
        type: 'scenario',
        title: 'Handling Defensive Responses',
        description: 'Navigate challenging feedback situations',
        content: 'Branching scenarios dealing with defensive, emotional, or resistant responses to feedback.',
        duration: 3,
        engagement: 'high',
        difficulty: 'advanced',
        completionCriteria: 'Successfully handle 2 difficult scenarios',
        pointsAwarded: 15
      },
      {
        id: 'peer-discussion',
        type: 'discussion',
        title: 'Share Your Experience',
        description: 'Discuss feedback challenges with peers',
        content: 'Structured discussion prompts for sharing experiences and learning from others.',
        duration: 2,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Post one experience and respond to one peer',
        pointsAwarded: 8
      }
    ],
    assessmentMethod: 'Peer evaluation of feedback scenarios and self-assessment rubric',
    reinforcementStrategy: 'Weekly practice prompts and feedback quality tracking',
    adaptiveElements: [
      'Scenarios adjust to learner\'s role and experience level',
      'Additional practice unlocked based on confidence ratings',
      'Personalized tips based on common mistakes'
    ]
  },
  {
    id: 'digital-wellness',
    title: 'Digital Wellness Essentials',
    category: 'Personal Development',
    description: 'Develop healthy digital habits and maintain work-life balance in the digital age.',
    totalDuration: 18,
    learningObjectives: [
      'Assess current digital habits and their impact',
      'Implement boundaries for healthy technology use',
      'Practice mindful technology consumption',
      'Create a sustainable digital wellness plan'
    ],
    activities: [
      {
        id: 'digital-audit',
        type: 'interactive',
        title: 'Your Digital Footprint Assessment',
        description: 'Analyze your current digital habits',
        content: 'Interactive self-assessment tool that tracks daily digital usage patterns and identifies areas for improvement.',
        duration: 5,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Complete full assessment',
        pointsAwarded: 10
      },
      {
        id: 'boundary-setting',
        type: 'practice',
        title: 'Digital Boundary Workshop',
        description: 'Learn to set healthy digital boundaries',
        content: 'Guided exercises for creating phone-free zones, notification management, and work-life separation.',
        duration: 6,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Set up 3 digital boundaries',
        pointsAwarded: 15
      },
      {
        id: 'mindful-tech',
        type: 'demonstration',
        title: 'Mindful Technology Use',
        description: 'Practice intentional technology engagement',
        content: 'Guided mindfulness exercises for conscious social media use and purposeful device interaction.',
        duration: 4,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Complete mindfulness exercises',
        pointsAwarded: 8
      },
      {
        id: 'wellness-challenge',
        type: 'gamification',
        title: '7-Day Digital Wellness Challenge',
        description: 'Gamified habit-building experience',
        content: 'Daily challenges with point tracking, badges, and social sharing to build lasting digital wellness habits.',
        duration: 3,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Complete 5 out of 7 daily challenges',
        pointsAwarded: 20
      }
    ],
    assessmentMethod: 'Habit tracking and behavior change measurement over time',
    reinforcementStrategy: 'Daily check-ins and weekly progress reviews with social accountability',
    adaptiveElements: [
      'Challenges personalized to individual usage patterns',
      'Difficulty scales based on baseline digital habits',
      'Custom recommendations based on goals and lifestyle'
    ]
  },
  {
    id: 'data-storytelling',
    title: 'Data Storytelling Mastery',
    category: 'Communication Skills',
    description: 'Transform complex data into compelling narratives that drive decision-making.',
    totalDuration: 20,
    learningObjectives: [
      'Structure data presentations for maximum impact',
      'Choose appropriate visualizations for different data types',
      'Create compelling narratives around data insights',
      'Handle questions and objections about data effectively'
    ],
    activities: [
      {
        id: 'story-structure',
        type: 'video',
        title: 'The Data Story Framework',
        description: 'Learn the structure of effective data stories',
        content: 'Animated breakdown of the context-conflict-resolution framework applied to data presentation.',
        duration: 4,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Watch video and identify framework elements',
        pointsAwarded: 6
      },
      {
        id: 'visualization-choice',
        type: 'interactive',
        title: 'Chart Type Challenge',
        description: 'Match data types with optimal visualizations',
        content: 'Drag-and-drop exercise matching different datasets with appropriate chart types and explanations.',
        duration: 5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Achieve 90% accuracy on chart matching',
        pointsAwarded: 12
      },
      {
        id: 'narrative-building',
        type: 'practice',
        title: 'Data Narrative Workshop',
        description: 'Build compelling stories from sample datasets',
        content: 'Guided practice using real datasets to craft narratives with clear insights and recommendations.',
        duration: 6,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Create complete data story presentation',
        pointsAwarded: 18
      },
      {
        id: 'presentation-sim',
        type: 'scenario',
        title: 'Stakeholder Presentation Simulator',
        description: 'Practice presenting data to different audiences',
        content: 'Realistic scenarios with different stakeholder types (executives, technical teams, clients) requiring adapted presentations.',
        duration: 4,
        engagement: 'high',
        difficulty: 'advanced',
        completionCriteria: 'Successfully adapt presentation for 3 audience types',
        pointsAwarded: 15
      },
      {
        id: 'peer-review',
        type: 'discussion',
        title: 'Data Story Peer Review',
        description: 'Give and receive feedback on data presentations',
        content: 'Structured peer review process with specific rubrics for evaluating data storytelling effectiveness.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Complete peer review exchange',
        pointsAwarded: 9
      }
    ],
    assessmentMethod: 'Portfolio assessment of data story presentations with peer and expert evaluation',
    reinforcementStrategy: 'Monthly data storytelling challenges with real organizational data',
    adaptiveElements: [
      'Complexity of datasets scales with demonstrated skill level',
      'Industry-specific examples based on learner background',
      'Advanced modules unlocked based on presentation quality'
    ]
  },
  {
    id: 'emotional-intelligence',
    title: 'Emotional Intelligence Foundations',
    category: 'Personal Development',
    description: 'Develop self-awareness, empathy, and relationship management skills through interactive experiences.',
    totalDuration: 25,
    learningObjectives: [
      'Recognize and understand personal emotional patterns',
      'Practice empathy in various interpersonal situations',
      'Develop emotional regulation strategies',
      'Apply emotional intelligence in leadership contexts'
    ],
    activities: [
      {
        id: 'eq-assessment',
        type: 'interactive',
        title: 'Emotional Intelligence Self-Assessment',
        description: 'Discover your EQ strengths and growth areas',
        content: 'Comprehensive but engaging assessment covering self-awareness, self-regulation, motivation, empathy, and social skills.',
        duration: 8,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Complete full EQ assessment',
        pointsAwarded: 12
      },
      {
        id: 'emotion-journal',
        type: 'reflection',
        title: 'Daily Emotion Tracking',
        description: 'Build emotional self-awareness through tracking',
        content: 'Guided journaling prompts for identifying emotions, triggers, and patterns with weekly insights.',
        duration: 5,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Complete 7 days of emotion tracking',
        pointsAwarded: 15
      },
      {
        id: 'empathy-scenarios',
        type: 'scenario',
        title: 'Empathy in Action',
        description: 'Practice perspective-taking in workplace situations',
        content: 'Interactive scenarios requiring learners to understand different perspectives and respond with empathy.',
        duration: 6,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Successfully navigate 4 empathy scenarios',
        pointsAwarded: 18
      },
      {
        id: 'regulation-toolkit',
        type: 'practice',
        title: 'Emotional Regulation Toolkit',
        description: 'Learn and practice emotional regulation techniques',
        content: 'Interactive toolkit with breathing exercises, reframing techniques, and stress management strategies.',
        duration: 4,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Practice 3 regulation techniques',
        pointsAwarded: 10
      },
      {
        id: 'leadership-eq',
        type: 'storytelling',
        title: 'EQ Leadership Stories',
        description: 'Learn from real leadership scenarios',
        content: 'Interactive case studies of leaders using emotional intelligence to navigate challenges and inspire teams.',
        duration: 2,
        engagement: 'medium',
        difficulty: 'advanced',
        completionCriteria: 'Analyze 2 leadership scenarios',
        pointsAwarded: 8
      }
    ],
    assessmentMethod: '360-degree feedback and behavioral observation over time',
    reinforcementStrategy: 'Weekly EQ challenges and peer accountability partnerships',
    adaptiveElements: [
      'Scenarios adapt based on individual EQ assessment results',
      'Practice frequency adjusts to emotional regulation progress',
      'Advanced content unlocked as foundational skills develop'
    ]
  }
];

export const getTemplateById = (id: string): MicroModule | undefined => {
  return microLearningTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): MicroModule[] => {
  return microLearningTemplates.filter(template => template.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(microLearningTemplates.map(template => template.category))];
};

export const getActivityTypeOptions = (): string[] => {
  return ['video', 'interactive', 'quiz', 'discussion', 'reflection', 'practice', 'demonstration', 'scenario', 'storytelling', 'gamification'];
};

export const getDifficultyLevels = (): string[] => {
  return ['beginner', 'intermediate', 'advanced'];
};

export const getEngagementLevels = (): string[] => {
  return ['low', 'medium', 'high'];
};