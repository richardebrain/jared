import { Video, Users, FileText, FileQuestion, Mic, MessageSquare } from 'lucide-react';

export const moduleTemplates = [
  {
    id: 'mini-video',
    title: 'Mini Video Lessons',
    description: 'Short, focused video content with key takeaways',
    icon: Video,
    color: 'bg-blue-50 border-blue-200',
    duration: '5-10 minutes',
    features: ['Video script generation', 'Key points summary', 'Discussion questions', 'Follow-up activities']
  },
  {
    id: 'interactive-scenario',
    title: 'Interactive Scenarios',
    description: 'Real-world situations with decision-making branches',
    icon: Users,
    color: 'bg-green-50 border-green-200',
    duration: '10-15 minutes',
    features: ['Scenario narratives', 'Decision points', 'Outcome explanations', 'Learning objectives']
  },
  {
    id: 'slide-storyboard',
    title: 'Slide/GIF Storyboards',
    description: 'Visual learning with animated content and explanations',
    icon: FileText,
    color: 'bg-purple-50 border-purple-200',
    duration: '8-12 minutes',
    features: ['Slide content', 'Visual descriptions', 'Animation suggestions', 'Presenter notes']
  },
  {
    id: 'quiz-teachback',
    title: 'Quick Quiz + Teachback',
    description: 'Knowledge check followed by teaching reinforcement',
    icon: FileQuestion,
    color: 'bg-orange-50 border-orange-200',
    duration: '6-10 minutes',
    features: ['Quiz questions', 'Answer explanations', 'Teaching strategies', 'Practice scenarios']
  },
  {
    id: 'podcast-audio',
    title: 'Podcast-Style Audio Nuggets',
    description: 'Upload your content and AI creates engaging podcast conversations',
    icon: Mic,
    color: 'bg-pink-50 border-pink-200',
    duration: '3-8 minutes',
    features: ['Upload your materials', 'AI podcast generation', 'Natural conversations', 'Professional audio script']
  },
  {
    id: 'roleplay-reels',
    title: 'Roleplay Reels',
    description: 'Short practice scenarios with role-playing elements',
    icon: MessageSquare,
    color: 'bg-indigo-50 border-indigo-200',
    duration: '5-8 minutes',
    features: ['Character roles', 'Dialogue scripts', 'Learning outcomes', 'Debrief questions']
  }
];

export type ModuleTemplateId = typeof moduleTemplates[number]['id'];