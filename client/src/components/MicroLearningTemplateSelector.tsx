import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  MessageSquare, 
  Brain,
  Target,
  Clock,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  ArrowLeft,
  Video,
  FileQuestion,
  Lightbulb,
  Users2,
  Gamepad2,
  BookOpen,
  Eye,
  Presentation,
  MessageCircle
} from "lucide-react";

interface LessonActivity {
  id: string;
  type: 'video' | 'interactive' | 'quiz' | 'discussion' | 'reflection' | 'practice' | 'demonstration' | 'scenario' | 'storytelling' | 'gamification' | 'presentation';
  title: string;
  description: string;
  content: string;
  duration: number;
  engagement: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completionCriteria: string;
  pointsAwarded: number;
}

interface MicroModule {
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

interface MicroLearningTemplateSelectorProps {
  onSelectTemplate: (template: MicroModule) => void;
  onCustomModule: () => void;
}

const moduleTemplates: MicroModule[] = [
  // Lightning Module Template (3-4 Sections | ~5 min)
  {
    id: 'lightning-module',
    title: 'Lightning Module',
    category: 'Quick Learning',
    description: 'A super-condensed, single-idea burst perfect for quick refreshers. Complete in just 5 minutes.',
    totalDuration: 5,
    learningObjectives: [
      'Understand one core concept quickly',
      'Apply knowledge through micro-activity',
      'Retain key information for immediate use'
    ],
    activities: [
      {
        id: 'hook-scenario',
        type: 'scenario',
        title: 'Hook (Scenario or Question)',
        description: 'Engaging opening scenario that captures attention',
        content: 'Present a compelling real-world scenario or thought-provoking question to immediately engage learners.',
        duration: 1,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Review scenario and respond to opening question',
        pointsAwarded: 3
      },
      {
        id: 'core-concept',
        type: 'video',
        title: 'Core Concept (AI-Generated Key Points)',
        description: 'Essential information delivered concisely',
        content: 'AI-generated key points presented in clear, digestible format with visual aids.',
        duration: 2,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Complete concept review',
        pointsAwarded: 5
      },
      {
        id: 'micro-activity',
        type: 'interactive',
        title: 'Micro-Activity (2-Step Interactive Prompt)',
        description: 'Quick hands-on practice',
        content: 'Simple 2-step interactive exercise to immediately apply the core concept.',
        duration: 1.5,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Complete both steps successfully',
        pointsAwarded: 7
      },
      {
        id: 'quick-quiz',
        type: 'quiz',
        title: 'Quick Quiz (1-2 Questions)',
        description: 'Brief knowledge check',
        content: 'Optional quick quiz with 1-2 questions to reinforce learning.',
        duration: 0.5,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Answer questions correctly',
        pointsAwarded: 5
      }
    ],
    assessmentMethod: 'Quick interactive check and optional mini-quiz',
    reinforcementStrategy: 'Immediate application through micro-activity',
    adaptiveElements: [
      'Adjusts complexity based on learner response',
      'Optional deeper dive for interested learners'
    ]
  },

  // Standard Module Template (5-6 Sections | ~10 min)
  {
    id: 'standard-module',
    title: 'Standard Module',
    category: 'Core Training',
    description: 'Your go-to template for everyday trainings. Comprehensive yet efficient 10-minute learning experience.',
    totalDuration: 10,
    learningObjectives: [
      'Understand learning objectives clearly',
      'Engage with multimedia content',
      'Practice skills through interactive activities',
      'Reflect on application to work context'
    ],
    activities: [
      {
        id: 'intro-objectives',
        type: 'presentation',
        title: 'Intro & Objectives',
        description: 'Clear learning goals and expectations',
        content: 'Introduction to the module with clear, measurable learning objectives.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Review objectives and confirm understanding',
        pointsAwarded: 3
      },
      {
        id: 'video-case-story',
        type: 'video',
        title: 'Video or Case Story',
        description: 'Engaging multimedia content',
        content: 'Video demonstration or compelling case story that illustrates key concepts.',
        duration: 3,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Watch complete video/story',
        pointsAwarded: 5
      },
      {
        id: 'interactive-activity',
        type: 'interactive',
        title: 'Interactive Activity',
        description: 'Matching, drag-and-drop, or simulation exercise',
        content: 'Hands-on interactive activity such as matching concepts, drag-and-drop exercises, or simulations.',
        duration: 3,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Complete activity with 80% accuracy',
        pointsAwarded: 10
      },
      {
        id: 'why-science',
        type: 'presentation',
        title: 'Why & Science (Rationale Slide)',
        description: 'Evidence-based reasoning',
        content: 'Explanation of the science and rationale behind the concepts being taught.',
        duration: 1.5,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Review scientific basis',
        pointsAwarded: 4
      },
      {
        id: 'reflection-prompt',
        type: 'reflection',
        title: 'Reflection Prompt',
        description: 'Personal application planning',
        content: 'Guided reflection on how to apply learning to specific work situations.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Complete reflection exercise',
        pointsAwarded: 6
      },
      {
        id: 'quiz-feedback',
        type: 'quiz',
        title: 'Quiz & Feedback',
        description: 'Knowledge assessment with detailed feedback',
        content: 'Comprehensive quiz with immediate feedback and explanations.',
        duration: 0.5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Score 75% or higher',
        pointsAwarded: 8
      }
    ],
    assessmentMethod: 'Interactive activities and comprehensive quiz',
    reinforcementStrategy: 'Reflection exercises and immediate feedback',
    adaptiveElements: [
      'Personalized feedback based on quiz performance',
      'Additional resources for struggling learners',
      'Advanced challenges for high performers'
    ]
  },

  // Deep-Dive Workshop Template (8-10 Sections | ~15 min)
  {
    id: 'deep-dive-workshop',
    title: 'Deep-Dive Workshop',
    category: 'Comprehensive Training',
    description: 'A thorough exploration great for brand-new topics or certifications. Complete workshop experience.',
    totalDuration: 15,
    learningObjectives: [
      'Master foundational concepts thoroughly',
      'Apply knowledge in complex scenarios',
      'Develop practical skills through guided practice',
      'Create actionable implementation plan'
    ],
    activities: [
      {
        id: 'welcome-agenda',
        type: 'presentation',
        title: 'Welcome & Agenda',
        description: 'Workshop overview and expectations',
        content: 'Comprehensive welcome with detailed agenda and learning pathway.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Review agenda and confirm commitment',
        pointsAwarded: 3
      },
      {
        id: 'pre-check-question',
        type: 'quiz',
        title: 'Pre-Check Question (Knowledge Gauge)',
        description: 'Assess current knowledge level',
        content: 'Brief assessment to gauge existing knowledge and tailor learning experience.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'beginner',
        completionCriteria: 'Complete knowledge assessment',
        pointsAwarded: 4
      },
      {
        id: 'foundational-video',
        type: 'video',
        title: 'Foundational Video',
        description: 'Core concept introduction',
        content: 'Comprehensive video covering foundational concepts and principles.',
        duration: 3,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Watch complete foundational content',
        pointsAwarded: 6
      },
      {
        id: 'key-terms-definitions',
        type: 'interactive',
        title: 'Key Terms & Definitions (Flash Cards)',
        description: 'Interactive vocabulary building',
        content: 'Digital flash cards for learning and memorizing key terminology.',
        duration: 2,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Master all key terms',
        pointsAwarded: 8
      },
      {
        id: 'guided-activity',
        type: 'practice',
        title: 'Guided Activity (Step-by-Step)',
        description: 'Structured skill development',
        content: 'Step-by-step guided practice activity with instructor support.',
        duration: 3,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Complete all guided steps',
        pointsAwarded: 12
      },
      {
        id: 'case-study-story',
        type: 'storytelling',
        title: 'Case Study / Story',
        description: 'Real-world application example',
        content: 'Detailed case study or story demonstrating practical application.',
        duration: 2,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Analyze case study thoroughly',
        pointsAwarded: 8
      },
      {
        id: 'why-it-matters',
        type: 'presentation',
        title: 'Why It Matters (Science + Policy)',
        description: 'Evidence and regulatory context',
        content: 'Explanation of scientific evidence and policy implications.',
        duration: 1.5,
        engagement: 'medium',
        difficulty: 'advanced',
        completionCriteria: 'Understand regulatory context',
        pointsAwarded: 6
      },
      {
        id: 'hands-on-practice',
        type: 'scenario',
        title: 'Hands-On Practice (AI-Guided Scenario)',
        description: 'Complex scenario practice',
        content: 'AI-guided complex scenario requiring application of all learned skills.',
        duration: 2,
        engagement: 'high',
        difficulty: 'advanced',
        completionCriteria: 'Successfully navigate scenario',
        pointsAwarded: 15
      },
      {
        id: 'reflection-action-plan',
        type: 'reflection',
        title: 'Reflection & Action Plan',
        description: 'Implementation planning',
        content: 'Comprehensive reflection and creation of detailed action plan.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Create complete action plan',
        pointsAwarded: 8
      },
      {
        id: 'post-test-quiz',
        type: 'quiz',
        title: 'Post-Test Quiz (Passing Threshold + Certificate)',
        description: 'Certification assessment',
        content: 'Comprehensive assessment with passing threshold for certification.',
        duration: 0.5,
        engagement: 'high',
        difficulty: 'advanced',
        completionCriteria: 'Score 85% or higher for certification',
        pointsAwarded: 20
      }
    ],
    assessmentMethod: 'Comprehensive assessment with certification threshold',
    reinforcementStrategy: 'Multi-layered practice with AI guidance and peer interaction',
    adaptiveElements: [
      'AI adjusts scenario complexity based on performance',
      'Personalized action planning based on role and context',
      'Advanced certification pathway for exceptional learners'
    ]
  },

  // Toolkit Module Template (Variable Sections | ~5-12 min)
  {
    id: 'toolkit-module',
    title: 'Toolkit Module',
    category: 'Resource Library',
    description: 'Focuses on giving managers a "kit" of resources they can reuse. Variable length based on exploration.',
    totalDuration: 8,
    learningObjectives: [
      'Access curated resource library',
      'Customize templates for specific needs',
      'Implement best practices immediately',
      'Build ongoing resource collection'
    ],
    activities: [
      {
        id: 'resource-gallery',
        type: 'interactive',
        title: 'Resource Gallery (Videos, PDFs, Links)',
        description: 'Curated collection of resources',
        content: 'Interactive gallery of videos, PDFs, links, and other resources organized by topic.',
        duration: 3,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Explore resource categories',
        pointsAwarded: 8
      },
      {
        id: 'template-launcher',
        type: 'practice',
        title: 'Template Launcher',
        description: 'Lesson plans, email scripts, parent handouts',
        content: 'Customizable templates for lesson plans, email scripts, parent handouts, and more.',
        duration: 3,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Customize at least one template',
        pointsAwarded: 12
      },
      {
        id: 'best-practice-snippets',
        type: 'presentation',
        title: 'Best-Practice Snippets',
        description: 'AI-written talking points',
        content: 'Ready-to-use talking points and best practice snippets generated by AI.',
        duration: 1.5,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Review talking points',
        pointsAwarded: 5
      },
      {
        id: 'faq-chatbot',
        type: 'interactive',
        title: 'FAQ Chatbot (Embedded "Ask AI" Widget)',
        description: 'Interactive AI assistance',
        content: 'Embedded AI chatbot for asking questions about resources and best practices.',
        duration: 0.5,
        engagement: 'high',
        difficulty: 'beginner',
        completionCriteria: 'Interact with AI assistant',
        pointsAwarded: 6
      }
    ],
    assessmentMethod: 'Practical application through template customization',
    reinforcementStrategy: 'Ongoing access to resources and AI support',
    adaptiveElements: [
      'Resources personalized to role and experience level',
      'AI assistant learns from user interactions',
      'Resource recommendations based on usage patterns'
    ]
  },

  // Scenario-Driven Module Template (4-7 Sections | ~8 min)
  {
    id: 'scenario-driven-module',
    title: 'Scenario-Driven Module',
    category: 'Applied Learning',
    description: 'Learners work through a single extended scenario with branching decisions and real-time feedback.',
    totalDuration: 8,
    learningObjectives: [
      'Navigate complex real-world scenarios',
      'Make informed decisions under pressure',
      'Learn from consequences and feedback',
      'Apply knowledge in authentic contexts'
    ],
    activities: [
      {
        id: 'scenario-setup',
        type: 'storytelling',
        title: 'Scenario Setup (Video or Text)',
        description: 'Immersive scenario introduction',
        content: 'Rich scenario setup through video or detailed text that establishes context and characters.',
        duration: 2,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Understand scenario context',
        pointsAwarded: 5
      },
      {
        id: 'decision-point-1',
        type: 'scenario',
        title: 'Decision Point #1 (Choose A/B/C → AI-Branch)',
        description: 'First critical decision',
        content: 'Present multiple choice decision with AI-powered branching based on selection.',
        duration: 1.5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Make informed decision',
        pointsAwarded: 8
      },
      {
        id: 'feedback-micro-lesson',
        type: 'presentation',
        title: 'Feedback & Micro-Lesson',
        description: 'Immediate learning from decision',
        content: 'Immediate feedback on decision with micro-lesson explaining consequences.',
        duration: 1.5,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Understand decision impact',
        pointsAwarded: 6
      },
      {
        id: 'decision-point-2',
        type: 'scenario',
        title: 'Decision Point #2',
        description: 'Second critical decision',
        content: 'Follow-up decision point that builds on previous choice and learning.',
        duration: 1.5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Apply learned concepts',
        pointsAwarded: 10
      },
      {
        id: 'why-behind-it',
        type: 'presentation',
        title: 'Why Behind It',
        description: 'Deeper understanding of principles',
        content: 'Explanation of underlying principles and theory behind best practices.',
        duration: 1,
        engagement: 'medium',
        difficulty: 'advanced',
        completionCriteria: 'Understand underlying principles',
        pointsAwarded: 7
      },
      {
        id: 'reflection',
        type: 'reflection',
        title: 'Reflection',
        description: 'Personal learning integration',
        content: 'Guided reflection on scenario experience and personal application.',
        duration: 0.5,
        engagement: 'medium',
        difficulty: 'intermediate',
        completionCriteria: 'Complete reflection exercise',
        pointsAwarded: 5
      },
      {
        id: 'knowledge-check',
        type: 'quiz',
        title: 'Knowledge Check',
        description: 'Scenario-based assessment',
        content: 'Final knowledge check based on scenario experience and key learning points.',
        duration: 0.5,
        engagement: 'high',
        difficulty: 'intermediate',
        completionCriteria: 'Demonstrate scenario learning',
        pointsAwarded: 9
      }
    ],
    assessmentMethod: 'Decision-making quality and scenario navigation',
    reinforcementStrategy: 'Immediate feedback and consequential learning',
    adaptiveElements: [
      'AI adjusts scenario complexity based on decisions',
      'Personalized feedback based on decision patterns',
      'Alternative scenario paths for different outcomes'
    ]
  },

  // Keep one existing template for reference
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

const getActivityTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'interactive':
      return <Brain className="h-4 w-4" />;
    case 'quiz':
      return <FileQuestion className="h-4 w-4" />;
    case 'discussion':
      return <MessageCircle className="h-4 w-4" />;
    case 'reflection':
      return <Lightbulb className="h-4 w-4" />;
    case 'practice':
      return <Target className="h-4 w-4" />;
    case 'demonstration':
      return <Eye className="h-4 w-4" />;
    case 'scenario':
      return <Users2 className="h-4 w-4" />;
    case 'storytelling':
      return <BookOpen className="h-4 w-4" />;
    case 'gamification':
      return <Gamepad2 className="h-4 w-4" />;
    case 'presentation':
      return <Presentation className="h-4 w-4" />;
    default:
      return <Play className="h-4 w-4" />;
  }
};

const getEngagementColor = (level: string) => {
  switch (level) {
    case 'high':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'text-green-600 bg-green-100';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-100';
    case 'advanced':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default function MicroLearningTemplateSelector({ onSelectTemplate, onCustomModule }: MicroLearningTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MicroModule | null>(null);

  const categories = [...new Set(moduleTemplates.map(template => template.category))];
  const totalPoints = selectedTemplate?.activities.reduce((sum, activity) => sum + activity.pointsAwarded, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Pre-Designed Module Templates</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose from 5 proven templates designed for different learning objectives and time constraints. Each template provides a structured approach to building engaging content.
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Pre-Designed Templates</TabsTrigger>
          <TabsTrigger value="custom">Build Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {!selectedTemplate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {moduleTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50 group" onClick={() => setSelectedTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{template.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{template.category}</Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{template.totalDuration} min</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Activities</span>
                        <span className="font-medium">{template.activities.length} steps</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.activities.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-1 bg-muted rounded-full px-2 py-1">
                            {getActivityTypeIcon(activity.type)}
                            <span className="text-xs capitalize">{activity.type}</span>
                          </div>
                        ))}
                        {template.activities.length > 4 && (
                          <div className="flex items-center gap-1 bg-muted rounded-full px-2 py-1">
                            <span className="text-xs">+{template.activities.length - 4} more</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Up to {template.activities.reduce((sum, activity) => sum + activity.pointsAwarded, 0)} points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTemplate(null)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Button>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <CardTitle className="text-xl">{selectedTemplate.title}</CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{selectedTemplate.category}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{selectedTemplate.totalDuration} minutes total</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>{totalPoints} points available</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => onSelectTemplate(selectedTemplate)} size="lg">
                      Use This Template
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{selectedTemplate.description}</p>

                  <div>
                    <h4 className="font-semibold mb-3">Learning Objectives</h4>
                    <div className="grid gap-2">
                      {selectedTemplate.learningObjectives.map((objective, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4">Learning Journey ({selectedTemplate.activities.length} activities)</h4>
                    <div className="space-y-4">
                      {selectedTemplate.activities.map((activity, index) => (
                        <Card key={activity.id} className="border-l-4 border-l-primary/30">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {getActivityTypeIcon(activity.type)}
                                    <h5 className="font-medium">{activity.title}</h5>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{activity.duration} min</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm">
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                  <span>{activity.pointsAwarded} pts</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Engagement:</span>
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${getEngagementColor(activity.engagement)}`}></div>
                                    <span className="text-xs capitalize">{activity.engagement}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Level:</span>
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(activity.difficulty)}`}>
                                    {activity.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-xs text-muted-foreground">Completion: </span>
                                <span className="text-xs">{activity.completionCriteria}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Assessment Strategy</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.assessmentMethod}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Reinforcement</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.reinforcementStrategy}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Adaptive Features</h4>
                    <div className="grid gap-2">
                      {selectedTemplate.adaptiveElements.map((element, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{element}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Use Template Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => onSelectTemplate(selectedTemplate)} 
                      className="w-full" 
                      size="lg"
                    >
                      Use This Template
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Build Custom Micro-Learning Module</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create your own micro-learning experience with complete control over activities, pacing, and engagement methods. Perfect for specialized topics or unique learning objectives.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Brain className="h-8 w-8 mx-auto text-blue-500" />
                  <h5 className="font-medium">Interactive Elements</h5>
                  <p className="text-xs text-muted-foreground">Simulations, assessments, scenarios</p>
                </div>
                <div className="space-y-2">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-500" />
                  <h5 className="font-medium">Gamification</h5>
                  <p className="text-xs text-muted-foreground">Points, badges, progress tracking</p>
                </div>
                <div className="space-y-2">
                  <Zap className="h-8 w-8 mx-auto text-green-500" />
                  <h5 className="font-medium">Adaptive Learning</h5>
                  <p className="text-xs text-muted-foreground">Personalized difficulty and pacing</p>
                </div>
              </div>
              
              <Button onClick={onCustomModule} className="w-full" size="lg">
                Start Building Custom Module
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}