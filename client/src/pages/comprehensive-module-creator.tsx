import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { VoiceNarrationPanel } from "@/components/VoiceNarrationPanel";
import MultilingualBearyAI from "@/components/MultilingualBearyAI";
import ActivityBlockComponent from "@/components/ActivityBlockComponent";
import AssessmentRequiredDialog from "@/components/AssessmentRequiredDialog";
import TextSectionBuilder from "@/components/SectionBuilders/TextSectionBuilder";
import {
  Video,
  Link2,
  BookOpen,
  Brain,
  Eye,
  Sparkles,
  Lightbulb,
  Loader2,
  ArrowLeft,
  Trophy,
  Award,
  Medal,
  FileEdit,
  Save,
  PlusCircle,
  Trash2,
  Image,
  FileQuestion,
  Plus,
  Info,
  CheckCircle2,
  XCircle,
  Edit,
  Search,
  Filter,
  Clock,
  Users,
  MessageSquare,
  FileText,
  Mic,
  MicOff,
  FolderOpen,
  X,
  ChevronRight,
  Wand2,
  Upload,
  ArrowRight,
  Building,
  Heart,
  AlertCircle,
  Link,
  Target,
  Music,
  Zap,
  Play,
  HelpCircle,
  Gamepad,
  GripVertical,
  Wrench,
  RefreshCw
} from 'lucide-react';
import StepByStepModuleBuilder from '@/components/StepByStepModuleBuilder';
import PowerPointImporter from '@/components/PowerPointImporter';
import ModulePublishingDialog from '@/components/ModulePublishingDialog';

// Import new builder components
import ScenarioMatchBuilder from '@/components/builders/ScenarioMatchBuilder';
import SlideBuilder from '@/components/builders/SlideBuilder';
import ExampleBuilder from '@/components/builders/ExampleBuilder';
import MatchingBuilder from '@/components/builders/MatchingBuilder';
import ScenarioBuilder from '@/components/builders/ScenarioBuilder';
import TriageBuilder from '@/components/builders/TriageBuilder';
import MnemonicBuilder from '@/components/builders/MnemonicBuilder';
import SimulationBuilder from '@/components/builders/SimulationBuilder';
import ActivityBuilder from '@/components/builders/ActivityBuilder';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  type: 'text' | 'quiz' | 'scenario-match' | 'podcast' | 'slide' | 'video' | 'story' | 'example' | 'matching' | 'scenario' | 'triage' | 'mnemonic' | 'simulation';
  duration: number;
  activities: Array<{
    type: 'watch' | 'read' | 'practice' | 'reflect' | 'quiz' | 'journal' | 'breathing' | 'recording';
    title: string;
    duration: number;
    content: string;
    videoUrl?: string;
    audioUrl?: string;
    interactionType?: string;
  }>;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
  }>;
  scenarios?: Array<{
    scenario: string;
    response: string;
  }>;
  audioUrl?: string;
  slides?: Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  // Extended properties for refactored types
  builderData?: any; // Stores structured data from specialized builders
  interactiveConfig?: {
    allowMultipleAttempts?: boolean;
    showFeedback?: boolean;
    timeLimit?: number;
    difficulty?: string;
  };
}

interface Module {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  customPoints?: string;
  pointValue: number;
  is_visible: boolean;
  sections: ModuleSection[];
  shareWithCommunity?: boolean;
}

export default function ComprehensiveModuleCreator() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);

  // Edit mode detection and module loading
  const [isEditMode, setIsEditMode] = useState(false);
  const [editModuleId, setEditModuleId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing module data for edit mode
  const { data: existingModule, isLoading: moduleLoading, error: moduleError } = useQuery({
    queryKey: [`/api/modules/${editModuleId}`],
    enabled: !!editModuleId && isEditMode
  });

  // Extract URL parameters for AI-generated module data and edit mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const aiGeneratedData = urlParams.get('ai-generated');
    const editId = urlParams.get('edit');
    
    // Handle edit mode
    if (editId) {
      const moduleId = parseInt(editId, 10);
      if (!isNaN(moduleId)) {
        console.log(`[EDIT MODE] Loading module ${moduleId} for editing`);
        setIsEditMode(true);
        setEditModuleId(moduleId);
        return; // Exit early, don't process AI-generated data
      }
    }
    
    // Handle AI-generated module data
    if (aiGeneratedData) {
      try {
        const moduleData = JSON.parse(decodeURIComponent(aiGeneratedData));
        console.log('Loading AI-generated module data:', moduleData);
        
        // Update newModule with the AI-generated data, preserving the original topic and description
        setNewModule(prev => ({
          ...prev,
          title: moduleData.title || moduleData.originalTopic || prev.title,
          description: moduleData.originalTopic || moduleData.description || prev.description,
          category: moduleData.category || prev.category,
          difficulty: moduleData.difficulty || prev.difficulty,
          estimatedTime: moduleData.estimatedTime || prev.estimatedTime,
          sections: moduleData.sections || prev.sections,
          // Store original form data for quiz builder reference
          originalFormData: moduleData.formData
        }));
        
        // Set workflow to section builder mode
        setCreationMethod('manual');
        setAiWorkflowStep('section-builder');
        
        toast({
          title: "AI Module Loaded",
          description: "Your AI-generated module is ready for customization",
        });
      } catch (error) {
        console.error('Error parsing AI-generated module data:', error);
      }
    }
  }, [location]);

  // Load existing module data when available
  useEffect(() => {
    if (existingModule && isEditMode) {
      console.log('[EDIT MODE] Loading existing module data:', existingModule);
      
      // Handle both content and sections data structure
      let sectionsData = [];
      if (existingModule.content) {
        try {
          const content = typeof existingModule.content === 'string' 
            ? JSON.parse(existingModule.content) 
            : existingModule.content;
          
          // Check if content has a sections property
          if (content && content.sections && Array.isArray(content.sections)) {
            sectionsData = content.sections;
          } else if (Array.isArray(content)) {
            sectionsData = content;
          }
        } catch (error) {
          console.error('[EDIT MODE] Error parsing content:', error);
          sectionsData = [];
        }
      }
      
      // Check if module has direct sections field as well
      if (existingModule.sections && Array.isArray(existingModule.sections)) {
        sectionsData = existingModule.sections;
      }
      
      console.log('[EDIT MODE] Parsed sections data:', sectionsData);

      setNewModule(prev => ({
        ...prev,
        id: existingModule.id,
        title: existingModule.title || prev.title,
        description: existingModule.description || prev.description,
        category: existingModule.category || prev.category,
        difficulty: existingModule.difficulty || prev.difficulty,
        estimatedTime: existingModule.estimatedTime || prev.estimatedTime,
        pointValue: existingModule.pointValue || prev.pointValue,
        sections: sectionsData,
      }));

      // Set workflow to section builder mode for edit
      setCreationMethod('manual');
      setAiWorkflowStep('section-builder');
      
      console.log('[EDIT MODE] Module data loaded successfully', {
        moduleId: existingModule.id,
        title: existingModule.title,
        sectionsCount: sectionsData.length
      });
    }
  }, [existingModule, isEditMode]);

  // Handle draft management and other workflow states
  const [draftSaveInterval, setDraftSaveInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Universal quiz conversion function - applies to all module creation tools
  const convertContentToQuiz = (content: string, sectionTitle: string) => {
    if (!content || typeof content !== 'string') return null;
    
    try {
      const lines = content.split('\n').filter(line => line.trim());
      const questions = [];
      
      let currentQuestion: any = null;
      for (const line of lines) {
        // Detect question lines
        if (line.match(/^\d+\./) || 
            line.toLowerCase().includes('question') || 
            line.match(/^q\d+/i) ||
            line.endsWith('?')) {
          if (currentQuestion) questions.push(currentQuestion);
          currentQuestion = {
            question: line.replace(/^\d+\.?\s*/, '')
                         .replace(/question:\s*/i, '')
                         .replace(/^q\d+[:.]\s*/i, ''),
            answers: [] as string[],
            correctAnswer: 0,
            explanation: ''
          };
        } 
        // Detect answer options
        else if (line.match(/^[a-d]\)/i) && currentQuestion) {
          currentQuestion.answers.push(line.replace(/^[a-d]\)\s*/i, ''));
        }
        // Alternative answer format: A. B. C. D.
        else if (line.match(/^[A-D]\./i) && currentQuestion) {
          currentQuestion.answers.push(line.replace(/^[A-D]\.\s*/i, ''));
        }
        // Numbered answers: 1. 2. 3. 4.
        else if (line.match(/^\d+\.\s/) && currentQuestion && currentQuestion.answers.length < 4) {
          currentQuestion.answers.push(line.replace(/^\d+\.\s*/, ''));
        }
        // Detect correct answer
        else if ((line.toLowerCase().includes('answer:') || 
                  line.toLowerCase().includes('correct:')) && currentQuestion) {
          const answerText = line.replace(/answer:\s*/i, '').replace(/correct:\s*/i, '');
          // Find which answer option matches
          const matchIndex = currentQuestion.answers.findIndex((ans: string) => 
            ans.toLowerCase().includes(answerText.toLowerCase()) || 
            answerText.toLowerCase().includes(ans.toLowerCase())
          );
          if (matchIndex !== -1) currentQuestion.correctAnswer = matchIndex;
          
          // Handle letter-based answers (a, b, c, d)
          const letterMatch = answerText.match(/^[a-d]/i);
          if (letterMatch) {
            const letterIndex = letterMatch[0].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
            if (letterIndex >= 0 && letterIndex < currentQuestion.answers.length) {
              currentQuestion.correctAnswer = letterIndex;
            }
          }
        }
        // Detect explanation
        else if (line.toLowerCase().includes('explanation:') && currentQuestion) {
          currentQuestion.explanation = line.replace(/explanation:\s*/i, '');
        }
        // If we have a question but no specific markers, treat as part of question text
        else if (currentQuestion && !currentQuestion.answers.length && !line.toLowerCase().includes('answer')) {
          currentQuestion.question += ' ' + line;
        }
      }
      
      // Add the last question
      if (currentQuestion && currentQuestion.question.trim()) {
        questions.push(currentQuestion);
      }
      
      // Validate questions have minimum required data
      const validQuestions = questions.filter(q => 
        q.question.trim() && 
        q.answers.length >= 2 && 
        q.correctAnswer >= 0 && 
        q.correctAnswer < q.answers.length
      );
      
      if (validQuestions.length > 0) {
        return {
          type: 'quiz',
          questions: validQuestions,
          content: `Interactive Quiz: ${sectionTitle}`,
          title: sectionTitle
        };
      }
    } catch (error) {
      console.error('Error parsing quiz content:', error);
    }
    
    return null;
  };
  
  // Voice feature helper functions for workshop
  const generateQuickVoice = async (text: string, language: string) => {
    try {
      const endpoint = language === 'en' 
        ? '/api/voice/generate-speech'
        : '/api/voice/generate-multilingual-speech';
      
      const requestBody = language === 'en'
        ? { text, voiceType: 'friendly-female', optimize: true }
        : { text, voiceType: 'friendly-female', targetLanguage: language };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        toast({
          title: "Voice Generated",
          description: `Playing in ${language}`,
        });
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      toast({
        title: "Voice Generation Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    }
  };

  const generateSoundEffect = async (description: string) => {
    try {
      const response = await fetch('/api/voice/generate-sound-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, duration: "medium" }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        toast({
          title: "Sound Effect Created",
          description: "Playing custom audio effect",
        });
      }
    } catch (error) {
      console.error('Sound effect generation error:', error);
      toast({
        title: "Sound Effect Failed",
        description: "Unable to generate sound effect",
        variant: "destructive",
      });
    }
  };

  const generatePronunciationGuide = async (word: string, phonetic: string) => {
    try {
      const response = await fetch('/api/voice/generate-pronunciation-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, phonetic, language: 'en' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        toast({
          title: "Pronunciation Guide",
          description: `Playing pronunciation for "${word}"`,
        });
      }
    } catch (error) {
      console.error('Pronunciation guide error:', error);
      toast({
        title: "Pronunciation Failed",
        description: "Unable to generate pronunciation guide",
        variant: "destructive",
      });
    }
  };

  const generateEmotionalStory = async (emotion: string, story: string) => {
    try {
      const response = await fetch('/api/voice/generate-emotional-storytelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: story, emotion, voiceType: 'storytelling' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        toast({
          title: "Emotional Story Generated",
          description: `Playing ${emotion} storytelling voice`,
        });
      }
    } catch (error) {
      console.error('Emotional storytelling error:', error);
      toast({
        title: "Storytelling Failed",
        description: "Unable to generate emotional story",
        variant: "destructive",
      });
    }
  };

  const generateCustomVoice = async (text: string) => {
    try {
      const response = await fetch('/api/voice/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceType: 'friendly-female', optimize: true }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        toast({
          title: "Custom Voice Generated",
          description: "Playing custom voice",
        });
      }
    } catch (error) {
      console.error('Custom voice generation error:', error);
      toast({
        title: "Voice Generation Failed",
        description: "Please check your text and try again",
        variant: "destructive",
      });
    }
  };

  // Video search functions
  const searchVideoLibrary = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingVideos(true);
    try {
      const response = await fetch(`/api/video-search/search?q=${encodeURIComponent(query)}&topic=${encodeURIComponent(newModule.title || '')}`);
      if (response.ok) {
        const results = await response.json();
        setVideoSearchResults(results);
      }
    } catch (error) {
      console.error('Video library search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search video library. Please try again.",
        variant: "destructive",
      });
    }
    setIsSearchingVideos(false);
  };

  const searchYouTube = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingYoutube(true);
    try {
      const response = await fetch(`/api/video-search/youtube-search?q=${encodeURIComponent(query)}&topic=${encodeURIComponent(newModule.title || '')}`);
      if (response.ok) {
        const results = await response.json();
        setYoutubeSearchResults(results);
      }
    } catch (error) {
      console.error('YouTube search error:', error);
      toast({
        title: "YouTube Search Failed",
        description: "Unable to search YouTube. Please try again.",
        variant: "destructive",
      });
    }
    setIsSearchingYoutube(false);
  };

  const handleVideoSearch = async () => {
    if (!videoSearchQuery.trim()) return;
    
    // Search both library and YouTube simultaneously
    await Promise.all([
      searchVideoLibrary(videoSearchQuery),
      searchYouTube(videoSearchQuery)
    ]);
  };

  const selectVideoForSection = (videoUrl: string, videoTitle: string) => {
    // Use the same targeting logic as other video functions
    const targetIndex = selectedVideoForSection !== null ? selectedVideoForSection : currentSectionIndex;
    updateSection(targetIndex, 'videoUrl', videoUrl);
    updateSection(targetIndex, 'title', `${newModule.sections[targetIndex]?.title || 'Section'} - ${videoTitle}`);
    
    toast({
      title: "Video Added",
      description: `Added "${videoTitle}" to the section`,
    });
    
    setShowVideoSearch(false);
    setSelectedVideoForSection(null);
    setVideoSearchQuery('');
    setVideoSearchResults([]);
    setYoutubeSearchResults([]);
  };

  const addCustomVideoUrl = () => {
    if (!customVideoUrl.trim()) return;
    
    // Extract title from URL or use placeholder
    let videoTitle = 'Custom Video';
    if (customVideoUrl.includes('youtube.com') || customVideoUrl.includes('youtu.be')) {
      videoTitle = 'YouTube Video';
    } else if (customVideoUrl.includes('vimeo.com')) {
      videoTitle = 'Vimeo Video';
    }
    
    // Use the same targeting logic as other video functions
    const targetIndex = selectedVideoForSection !== null ? selectedVideoForSection : currentSectionIndex;
    updateSection(targetIndex, 'videoUrl', customVideoUrl);
    updateSection(targetIndex, 'title', `${newModule.sections[targetIndex]?.title || 'Section'} - ${videoTitle}`);
    
    toast({
      title: "Custom Video Added",
      description: `Added "${videoTitle}" to the section`,
    });
    
    setShowVideoSearch(false);
    setSelectedVideoForSection(null);
    setCustomVideoUrl('');
    setVideoSearchQuery('');
    setVideoSearchResults([]);
    setYoutubeSearchResults([]);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [showStepByStepBuilder, setShowStepByStepBuilder] = useState(false);
  const [showPowerPointImport, setShowPowerPointImport] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [creationMethod, setCreationMethod] = useState<'selection' | 'stepByStep' | 'powerPoint' | 'manual'>('selection');
  
  // AI-Assisted workflow states
  const [aiWorkflowStep, setAiWorkflowStep] = useState<'method-selection' | 'template-selection' | 'template-builder' | 'section-builder' | 'preview'>('method-selection');
  const [aiSelectedTemplate, setAiSelectedTemplate] = useState<any>(null);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  
  // Publishing dialog states
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishOptions, setPublishOptions] = useState({
    saveToModules: true,
    shareWithCommunity: false,
    sendToTeachers: false,
    sendToGroups: false,
    selectedTeachers: [] as number[],
    selectedGroups: [] as number[],
    notificationMessage: ''
  });



  // Proven template types for AI-assisted workflow
  const PROVEN_TEMPLATES = [
    {
      id: 'lightning',
      title: 'Lightning Module',
      description: 'A super-condensed, single-idea burst perfect for quick refreshers (3-4 sections, ~5 min)',
      duration: '5 min',
      modules: 1,
      icon: Zap,
      sections: [
        { type: 'scenario', title: 'Hook (scenario or question)', duration: 1 },
        { type: 'text', title: 'Core Concept (AI-generated key points)', duration: 2 },
        { type: 'example', title: 'Micro-Activity (2-step interactive prompt)', duration: 1 },
        { type: 'quiz', title: 'Quick Quiz (1-2 questions)', duration: 1 }
      ]
    },
    {
      id: 'standard',
      title: 'Standard Module',
      description: 'Your go-to template for everyday trainings (5-6 sections, ~10 min)',
      duration: '10 min',
      modules: 1,
      icon: BookOpen,
      sections: [
        { type: 'text', title: 'Intro & Objectives', duration: 1 },
        { type: 'video', title: 'Video or Case Story', duration: 3 },
        { type: 'matching', title: 'Interactive Activity (matching, drag-and-drop)', duration: 2 },
        { type: 'example', title: 'Why & Science (rationale slide)', duration: 2 },
        { type: 'text', title: 'Reflection Prompt (text or journal)', duration: 1 },
        { type: 'quiz', title: 'Quiz & Feedback', duration: 1 }
      ]
    },
    {
      id: 'deep-dive',
      title: 'Deep-Dive Workshop',
      description: 'A thorough exploration, great for new topics or certifications (8-10 sections, ~15 min)',
      duration: '15 min',
      modules: 1,
      icon: Target,
      sections: [
        { type: 'text', title: 'Welcome & Agenda', duration: 1 },
        { type: 'quiz', title: 'Pre-Check Question (knowledge gauge)', duration: 1 },
        { type: 'video', title: 'Foundational Video', duration: 3 },
        { type: 'mnemonic', title: 'Key Terms & Definitions (flash cards)', duration: 1 },
        { type: 'example', title: 'Guided Activity (step-by-step)', duration: 2 },
        { type: 'story', title: 'Case Study / Story', duration: 2 },
        { type: 'text', title: 'Why It Matters (science + policy)', duration: 2 },
        { type: 'simulation', title: 'Hands-On Practice (AI-guided scenario)', duration: 2 },
        { type: 'text', title: 'Reflection & Action Plan', duration: 1 },
        { type: 'quiz', title: 'Post-Test Quiz (certification)', duration: 2 }
      ]
    },
    {
      id: 'toolkit',
      title: 'Toolkit Module',
      description: 'Focuses on giving managers a "kit" of resources they can reuse (variable sections, ~5-12 min)',
      duration: '8 min',
      modules: 1,
      icon: Wrench,
      sections: [
        { type: 'text', title: 'Resource Gallery (videos, PDFs, links)', duration: 2 },
        { type: 'example', title: 'Template Launcher (lesson-plan, email-scripts)', duration: 2 },
        { type: 'text', title: 'Best-Practice Snippets (AI-written talking points)', duration: 2 },
        { type: 'text', title: 'FAQ Chatbot (embedded "Ask AI" widget)', duration: 2 }
      ]
    },
    {
      id: 'scenario-driven',
      title: 'Scenario-Driven Module',
      description: 'Learners work through a single extended scenario (4-7 sections, ~8 min)',
      duration: '8 min',
      modules: 1,
      icon: Users,
      sections: [
        { type: 'story', title: 'Scenario Setup (video or text)', duration: 2 },
        { type: 'triage', title: 'Decision Point #1 (choose A/B/C → AI-branch)', duration: 1 },
        { type: 'text', title: 'Feedback & Micro-Lesson', duration: 1 },
        { type: 'triage', title: 'Decision Point #2', duration: 1 },
        { type: 'example', title: 'Why Behind It', duration: 2 },
        { type: 'text', title: 'Reflection', duration: 1 },
        { type: 'quiz', title: 'Knowledge Check', duration: 1 }
      ]
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mindfulness': return Heart;
      case 'classroom-management': return Users;
      case 'child-development': return Brain;
      case 'health-safety': return CheckCircle2;
      case 'professional-development': return Trophy;
      default: return BookOpen;
    }
  };

  // Get existing user modules as additional template options
  const getUserModuleTemplates = () => {
    if (!modules || !Array.isArray(modules)) return [];
    
    return modules.filter(module => module.isVisible && module.sections).map(module => ({
      id: `user-${module.id}`,
      title: `${module.title} (Your Module)`,
      description: module.description,
      duration: module.estimatedTime + ' min',
      modules: 1,
      icon: getCategoryIcon(module.category),
      sections: JSON.parse(module.sections).map((section: any) => ({
        type: section.type || 'text',
        title: section.title,
        duration: section.duration || 5
      })),
      isUserModule: true,
      originalModuleId: module.id
    }));
  };

  // Section type definitions with AI assistance
  const SECTION_TYPES = [
    { type: 'text', icon: FileText, title: 'Text Content', description: 'Written educational content with AI assistance' },
    { type: 'video', icon: Play, title: 'Video Content', description: 'Video resources with AI-generated questions' },
    { type: 'quiz', icon: HelpCircle, title: 'Knowledge Quiz', description: 'AI-generated assessment questions' },
    { type: 'story', icon: BookOpen, title: 'Story/Scenario', description: 'Engaging narratives with AI storytelling' },
    { type: 'example', icon: Lightbulb, title: 'Examples', description: 'Real-world examples with AI insights' },
    { type: 'matching', icon: Link, title: 'Matching Exercise', description: 'Interactive matching with AI generation' },
    { type: 'scenario', icon: Users, title: 'Scenario Practice', description: 'Practice scenarios with AI feedback' },
    { type: 'triage', icon: Zap, title: 'Decision Triage', description: 'Quick decision-making exercises' },
    { type: 'mnemonic', icon: Brain, title: 'Memory Aids', description: 'AI-generated memory devices' },
    { type: 'simulation', icon: Gamepad, title: 'Interactive Simulation', description: 'Hands-on practice simulations' }
  ];
  
  // Module Creator state - comprehensive version
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    category: 'classroom-management',
    difficulty: 'beginner',
    estimatedTime: '15',
    customPoints: '',
    shareWithCommunity: false,
    moduleType: 'single' as 'single' | 'course' | 'interactive',
    sections: [
      {
        title: 'Introduction',
        content: '',
        videoUrl: '',
        imageUrl: '',
        type: 'text' as const,
        duration: 5,
        activities: [{
          type: 'read' as const,
          title: 'Introduction',
          duration: 5,
          content: '',
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form' as const
        }]
      }
    ] as ModuleSection[],
    // Advanced features for template support
    courseStructure: {
      sequentialUnlock: false,
      certificateAwarded: false,
      badgeType: '',
      modules: [] as Array<{
        id: string;
        title: string;
        description: string;
        duration: number;
        activities: Array<{
          type: 'watch' | 'read' | 'practice' | 'reflect' | 'quiz' | 'journal' | 'breathing' | 'recording';
          title: string;
          duration: number;
          content: string;
          videoUrl?: string;
          audioUrl?: string;
          interactionType?: 'timer' | 'recorder' | 'worksheet' | 'form';
        }>;
        completionRequirements: {
          passingScore?: number;
          requiredActivities?: string[];
          timeRequirement?: number;
        };
      }>
    },
    interactiveElements: {
      hasTimer: false,
      hasAudioRecording: false,
      hasJournaling: false,
      hasBreathingExercises: false,
      hasWorksheets: false
    },
    certificationSystem: {
      enabled: false,
      badgeName: '',
      requirements: {
        completionPercentage: 100,
        minimumScore: 70
      }
    }
  });
  
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Draft saving functionality  
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  
  // Initial setup phase for title and learning objective
  // Check if we're in edit mode to bypass initial setup
  const urlParams = new URLSearchParams(window.location.search);
  const isInEditMode = urlParams.get('edit');
  const [showInitialSetup, setShowInitialSetup] = useState(!isInEditMode);
  const [initialModuleData, setInitialModuleData] = useState({
    title: '',
    learningObjective: ''
  });

  // Voice input states
  const [isListening, setIsListening] = useState<{[key: string]: boolean}>({});
  const [recognition, setRecognition] = useState<any>(null);

  // Video search states
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoSearchResults, setVideoSearchResults] = useState<any[]>([]);
  const [youtubeSearchResults, setYoutubeSearchResults] = useState<any[]>([]);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [selectedVideoForSection, setSelectedVideoForSection] = useState<number | null>(null);

  // New builder states for refactored module types
  const [activeBuilder, setActiveBuilder] = useState<string | null>(null);
  const [builderData, setBuilderData] = useState<any>(null);
  const [currentBuilderSection, setCurrentBuilderSection] = useState<number | null>(null);

  // Auto-save function for immediate database persistence
  const autoSaveModule = async (moduleData: any) => {
    // Get module ID from current draft or edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editModuleId = urlParams.get('edit');
    const moduleId = currentDraftId || editModuleId;
    
    if (!moduleId) return;
    
    try {
      await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify({
            sections: moduleData.sections || [],
            moduleType: moduleData.moduleType || "deep-dive",
            courseStructure: moduleData.courseStructure || {},
            interactiveElements: moduleData.interactiveElements || {},
            certificationSystem: moduleData.certificationSystem || {},
          }),
          title: moduleData.title,
          description: moduleData.description,
        }),
      });
      console.log('Auto-saved module changes to database');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Content change handler with auto-save
  const handleContentChange = (updatedContent: any, sectionIndex?: number) => {
    let updatedModule;
    
    if (typeof sectionIndex === 'number') {
      // Update specific section
      const updatedSections = [...newModule.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: updatedContent
      };
      updatedModule = { ...newModule, sections: updatedSections };
    } else {
      // Update entire module
      updatedModule = { ...newModule, ...updatedContent };
    }
    
    setNewModule(updatedModule);
    
    // Auto-save to database
    if (currentDraftId) {
      autoSaveModule(updatedModule);
    }
  };

  // Builder handler functions
  const openBuilder = (builderType: string, sectionIndex: number) => {
    setActiveBuilder(builderType);
    setCurrentBuilderSection(sectionIndex);
    const existingData = newModule.sections[sectionIndex]?.builderData;
    setBuilderData(existingData || null);
  };

  const closeBuilder = () => {
    setActiveBuilder(null);
    setBuilderData(null);
    setCurrentBuilderSection(null);
  };

  const saveBuilderData = (data: any) => {
    if (currentBuilderSection !== null) {
      const updatedSections = [...newModule.sections];
      updatedSections[currentBuilderSection] = {
        ...updatedSections[currentBuilderSection],
        builderData: data,
        content: `Interactive ${activeBuilder} activity created with AI and manual input capabilities.`
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: updatedSections
      }));
      
      toast({
        title: "Activity Saved",
        description: `${activeBuilder} activity has been saved to the module section.`,
      });
    }
    closeBuilder();
  };





  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Voice input handler
  const startVoiceInput = (fieldName: string, currentValue: string, onUpdate: (value: string) => void) => {
    if (!recognition) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice input. Please type your text.",
        variant: "destructive",
      });
      return;
    }

    setIsListening(prev => ({ ...prev, [fieldName]: true }));

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
      onUpdate(newValue);
      
      toast({
        title: "Voice Input Added",
        description: `Added: "${transcript}"`,
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Voice Input Error",
        description: "Could not capture voice input. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(prev => ({ ...prev, [fieldName]: false }));
    };

    recognition.start();
  };

  const stopVoiceInput = (fieldName: string) => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(prev => ({ ...prev, [fieldName]: false }));
  };
  const [aiSuggestions, setAiSuggestions] = useState<{
    questions: string[];
    strategies: string[];
    quizQuestions: {
      question: string;
      options: string[];
      correctAnswer: string;
    }[];
  }>({ 
    questions: [], 
    strategies: [],
    quizQuestions: []
  });

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [isGeneratingQuizQuestion, setIsGeneratingQuizQuestion] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([]);
  const [showFlashcardPreview, setShowFlashcardPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [generatingContent, setGeneratingContent] = useState<number | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState<number | null>(null);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<{[key: number]: string}>({});

  // AI-Assisted workflow functions
  const handleAiAssistedFlow = () => {
    setCreationMethod('manual');
    setAiWorkflowStep('template-selection');
  };

  const handleTemplateSelection = (template: any) => {
    setAiSelectedTemplate(template);
    
    // Check if this is a user module template
    if (template.isUserModule && modules) {
      const originalModule = Array.isArray(modules) ? modules.find((m: any) => m.id === template.originalModuleId) : null;
      
      if (originalModule) {
        const parsedSections = originalModule.sections ? JSON.parse(originalModule.sections) : [];
        
        setNewModule(prev => ({
          ...prev,
          title: `${template.title} (Copy)`,
          description: template.description,
          category: originalModule.category,
          difficulty: originalModule.difficulty,
          estimatedTime: originalModule.estimatedTime,
          sections: parsedSections.map((section: any) => ({
            title: section.title,
            content: section.content || '',
            videoUrl: section.videoUrl || '',
            imageUrl: section.imageUrl || '',
            type: section.type || 'text',
            duration: section.duration || 5,
            activities: section.activities || [{
              type: 'read' as const,
              title: section.title,
              duration: section.duration || 5,
              content: section.content || '',
              videoUrl: section.videoUrl || '',
              audioUrl: section.audioUrl || '',
              interactionType: 'form' as const
            }],
            questions: section.questions || [],
            scenarios: section.scenarios || [],
            audioUrl: section.audioUrl || '',
            slides: section.slides || []
          }))
        }));
      }
    } else {
      // Handle proven template structure - preserve user's title if already set
      setNewModule(prev => ({
        ...prev,
        title: prev.title.trim() ? prev.title : template.title,
        description: prev.description.trim() ? prev.description : template.description,
        estimatedTime: prev.estimatedTime.trim() ? prev.estimatedTime : template.duration.replace(' min', ''),
        sections: template.sections.map((section: any) => ({
          title: section.title,
          content: '',
          videoUrl: '',
          imageUrl: '',
          type: section.type,
          duration: section.duration,
          activities: [{
            type: 'read' as const,
            title: section.title,
            duration: section.duration,
            content: '',
            videoUrl: '',
            audioUrl: '',
            interactionType: 'form' as const
          }],
          questions: [],
          scenarios: [],
          audioUrl: '',
          slides: []
        }))
      }));
    }
    
    setAiWorkflowStep('section-builder');
  };

  const handleCustomTemplateBuilder = () => {
    setAiWorkflowStep('template-builder');
  };

  const proceedToSectionBuilder = () => {
    setAiWorkflowStep('section-builder');
    setCurrentSectionIndex(0);
  };

  // Save current section content before navigating
  const saveCurrentSectionContent = () => {
    // This function ensures content is preserved when navigating between sections
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;
    
    // Apply universal quiz conversion to any section that might contain quiz content
    if (currentSection && (
      currentSection.title.toLowerCase().includes('pre-check') || 
      currentSection.title.toLowerCase().includes('quiz') ||
      currentSection.title.toLowerCase().includes('question') ||
      currentSection.type === 'quiz' ||
      (currentSection.content && typeof currentSection.content === 'string' && 
       (currentSection.content.includes('a)') || currentSection.content.includes('1.') ||
        currentSection.content.toLowerCase().includes('question')))
    )) {
      const quizData = convertContentToQuiz(currentSection.content as string, currentSection.title);
      
      if (quizData) {
        const updatedSections = [...newModule.sections];
        updatedSections[currentSectionIndex] = {
          ...currentSection,
          ...quizData,
          type: currentSection.type as 'text' | 'quiz' | 'scenario-match' | 'podcast' | 'slide' | 'video' | 'story' | 'example' | 'matching' | 'scenario' | 'triage' | 'mnemonic' | 'simulation'
        };
        setNewModule(prev => ({ ...prev, sections: updatedSections }));
        
        toast({
          title: "Quiz Created",
          description: `Converted content to interactive quiz with ${quizData.questions.length} questions`,
        });
      }
    }
  };

  const nextSection = () => {
    saveCurrentSectionContent();
    
    // Move to next section or preview
    if (currentSectionIndex < newModule.sections.length - 1) {
      setCompletedSections(prev => [...prev, currentSectionIndex]);
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setCompletedSections(prev => [...prev, currentSectionIndex]);
      setAiWorkflowStep('preview');
    }
  };

  const previousSection = () => {
    saveCurrentSectionContent();
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  // Jump to specific section (for editing)
  const jumpToSection = (sectionIndex: number) => {
    saveCurrentSectionContent();
    setCurrentSectionIndex(sectionIndex);
    setAiWorkflowStep('section-builder');
  };

  // AI Content Generation for Section Builder
  const [isGeneratingAIContent, setIsGeneratingAIContent] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [aiGeneratedBlocks, setAiGeneratedBlocks] = useState<Array<{
    type: string;
    content: string;
    preview: string;
  }>>([]);
  
  // Regeneration states
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerationGuidance, setRegenerationGuidance] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Interactive Quiz Builder State
  const [isQuizBuilder, setIsQuizBuilder] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState({
    question: '',
    answers: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [builtQuizQuestions, setBuiltQuizQuestions] = useState<Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
  }>>([]);

  // Interactive Activity Builder State
  const [isActivityBuilder, setIsActivityBuilder] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({
    title: '',
    activityType: 'drag-and-match',
    instructions: '',
    promptItems: ['', '', '', ''],
    answerKey: ['', '', '', ''],
    preview: '',
    uiHints: {
      leftColumnTitle: 'Items to Match',
      rightColumnTitle: 'Categories',
      dragInstruction: 'Drag items to their matching categories'
    },
    imageSupport: false
  });
  const [builtActivities, setBuiltActivities] = useState<Array<{
    title: string;
    activityType: string;
    instructions: string;
    promptItems: string[];
    answerKey: string[];
    preview: string;
    uiHints: any;
    imageSupport: boolean;
  }>>([]);
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);

  // Interactive Quiz Builder Functions
  const startQuizBuilder = () => {
    setIsQuizBuilder(true);
    setCurrentQuizQuestion({
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    setBuiltQuizQuestions([]);
  };

  const generateSingleQuizQuestion = async () => {
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;

    setIsGeneratingQuizQuestion(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai/generate-single-quiz-question', {
        moduleTitle: initialModuleData.title || newModule.title,
        moduleDescription: initialModuleData.learningObjective || newModule.description,
        sectionTitle: currentSection.title,
        category: newModule.category,
        difficulty: quizDifficulty,
        existingQuestions: builtQuizQuestions.map(q => q.question),
        learningObjective: initialModuleData.learningObjective
      });

      if (response.question) {
        setCurrentQuizQuestion({
          question: response.question.question || response.question,
          answers: response.question.answers || ['', '', '', ''],
          correctAnswer: response.question.correctAnswer || 0,
          explanation:  response.question.explanation || ''
        });
      }
    } catch (error) {
      console.error('Error generating quiz question:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate quiz question. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuizQuestion(false);
    }
  };

  const addQuestionToQuiz = () => {
    if (!currentQuizQuestion.question.trim() || 
        currentQuizQuestion.answers.filter(a => a.trim()).length < 2) {
      toast({
        title: "Incomplete Question",
        description: "Please add a question and at least 2 answers.",
        variant: "destructive",
      });
      return;
    }

    setBuiltQuizQuestions(prev => [...prev, { ...currentQuizQuestion }]);
    setCurrentQuizQuestion({
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });

    toast({
      title: "Question Added",
      description: `Quiz now has ${builtQuizQuestions.length + 1} questions`,
    });
  };

  const finishQuizAndSave = () => {
    if (builtQuizQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question to the quiz.",
        variant: "destructive",
      });
      return;
    }

    const updatedSections = [...newModule.sections];
    updatedSections[currentSectionIndex] = {
      ...updatedSections[currentSectionIndex],
      type: 'quiz',
      questions: builtQuizQuestions,
      content: `Interactive Quiz: ${updatedSections[currentSectionIndex].title}`
    };
    setNewModule(prev => ({ ...prev, sections: updatedSections }));
    
    setIsQuizBuilder(false);
    setBuiltQuizQuestions([]);
    
    toast({
      title: "Quiz Created Successfully",
      description: `Created interactive quiz with ${builtQuizQuestions.length} questions`,
    });
    
    // Auto-advance to next section
    nextSection();
  };

  const removeQuestionFromQuiz = (index: number) => {
    setBuiltQuizQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Interactive Activity Builder Functions
  const startActivityBuilder = () => {
    setIsActivityBuilder(true);
    setCurrentActivity({
      title: '',
      activityType: 'drag-and-match',
      instructions: '',
      promptItems: ['', '', '', ''],
      answerKey: ['', '', '', ''],
      preview: '',
      uiHints: {
        leftColumnTitle: 'Items to Match',
        rightColumnTitle: 'Categories',
        dragInstruction: 'Drag items to their matching categories'
      },
      imageSupport: false
    });
    setBuiltActivities([]);
  };

  const addActivityItem = () => {
    setCurrentActivity(prev => ({
      ...prev,
      promptItems: [...prev.promptItems, ''],
      answerKey: [...prev.answerKey, '']
    }));
  };

  const addCurrentActivityToList = () => {
    if (!currentActivity.title.trim() || !currentActivity.instructions.trim()) {
      toast({
        title: "Incomplete Activity",
        description: "Please provide both title and instructions for the activity.",
        variant: "destructive",
      });
      return;
    }

    const validItems = currentActivity.promptItems.filter(item => item.trim());
    const validAnswers = currentActivity.answerKey.filter(answer => answer.trim());

    if (validItems.length < 2 || validAnswers.length < 2) {
      toast({
        title: "Insufficient Content",
        description: "Please provide at least 2 items and 2 answer options.",
        variant: "destructive",
      });
      return;
    }

    const newActivity = {
      ...currentActivity,
      promptItems: validItems,
      answerKey: validAnswers,
      preview: `${currentActivity.activityType}: ${currentActivity.title}`
    };

    setBuiltActivities(prev => [...prev, newActivity]);
    
    // Reset current activity for next one
    setCurrentActivity({
      title: '',
      activityType: 'drag-and-match',
      instructions: '',
      promptItems: ['', '', '', ''],
      answerKey: ['', '', '', ''],
      preview: '',
      uiHints: {
        leftColumnTitle: 'Items to Match',
        rightColumnTitle: 'Categories',
        dragInstruction: 'Drag items to their matching categories'
      },
      imageSupport: false
    });

    toast({
      title: "Activity Added",
      description: `${newActivity.title} has been added to your activity list.`,
    });
  };

  // const finishActivityAndSave = () => {
  //   const activityContent = {
  //     activities: builtActivities,
  //     totalActivities: builtActivities.length,
  //     sectionType: 'interactive-activities'
  //   };

  //   const updatedSections = [...newModule.sections];
  //   updatedSections[currentSectionIndex] = {
  //     ...updatedSections[currentSectionIndex],
  //     type: 'matching',
  //     content: JSON.stringify(activityContent),
  //     activities: [{
  //       type: 'practice' as const,
  //       title: `Interactive Activities: ${updatedSections[currentSectionIndex].title}`,
  //       duration: 5,
  //       content: JSON.stringify(activityContent),
  //       interactionType: 'activity' as const
  //     }]
  //   };
  //   setNewModule(prev => ({ ...prev, sections: updatedSections }));
    
  //   setIsActivityBuilder(false);
  //   setBuiltActivities([]);
    
  //   toast({
  //     title: "Activities Created Successfully",
  //     description: `Created interactive section with ${builtActivities.length} activities`,
  //   });
    
  //   // Auto-advance to next section
  //   nextSection();
  // };


  const addActivityToList = () => {
    if (!currentActivity.title.trim() || 
        currentActivity.items.filter(i => i.trim()).length < 2 ||
        currentActivity.answers.filter(a => a.trim()).length < 2) {
      toast({
        title: "Incomplete Activity",
        description: "Please add a title and at least 2 items with answers.",
        variant: "destructive",
      });
      return;
    }

    setBuiltActivities(prev => [...prev, { ...currentActivity }]);
    setCurrentActivity({
      title: '',
      activityType: currentActivity.activityType,
      instructions: '',
      items: ['', ''],
      answers: ['', ''],
      preview: ''
    });

    toast({
      title: "Activity Added",
      description: `Activity list now has ${builtActivities.length + 1} activities`,
    });
  };

  const removeActivityFromList = (index: number) => {
    setBuiltActivities(prev => prev.filter((_, i) => i !== index));
  };

  const removeActivityItem = (index: number) => {
    setCurrentActivity(prev => ({
      ...prev,
      promptItems: prev.promptItems.filter((_, i) => i !== index),
      answerKey: prev.answerKey.filter((_, i) => i !== index)
    }));
  };

  const updateActivityItem = (index: number, field: 'promptItems' | 'answerKey', value: string) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const generateSingleActivity = async () => {
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;
    
    setIsGeneratingActivity(true);
    
    try {
      const response = await apiRequest('/api/ai/generate-single-activity', {
        method: 'POST',
        data: {
          moduleTitle: initialModuleData.title || newModule.title,
          moduleDescription: initialModuleData.learningObjective || newModule.description,
          sectionTitle: currentSection.title,
          category: newModule.category,
          activityType: currentActivity.activityType,
          existingActivities: builtActivities.map(a => a.title),
          learningObjective: initialModuleData.learningObjective
        }
      });

      if (response.activity) {
        setCurrentActivity({
          title: response.activity.title || '',
          activityType: response.activity.activityType || currentActivity.activityType,
          instructions: response.activity.instructions || '',
          promptItems: response.activity.promptItems || ['', '', '', ''],
          answerKey: response.activity.answerKey || ['', '', '', ''],
          preview: response.activity.preview || '',
          uiHints: response.activity.uiHints || currentActivity.uiHints,
          imageSupport: response.activity.imageSupport || false
        });
      }
    } catch (error) {
      console.error('Error generating activity:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate activity. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingActivity(false);
    }
  };


  const generateActivityList = async () => {
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;
    
    setIsGeneratingActivity(true);
    
    try {
      const response = await apiRequest('/api/ai/generate-activity-list', {
        method: 'POST',
        data: {
          moduleTitle: initialModuleData.title || newModule.title,
          moduleDescription: initialModuleData.learningObjective || newModule.description,
          sectionTitle: currentSection.title,
          category: newModule.category,
          learningObjective: initialModuleData.learningObjective
        }
      });

      if (response.activities && Array.isArray(response.activities)) {
        setBuiltActivities(response.activities);
        
        toast({
          title: "Activities Generated",
          description: `Generated ${response.activities.length} interactive activities`,
        });
      }
    } catch (error) {
      console.error('Error generating activities:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate activities. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingActivity(false);
    }
  };



  // Function to update existing module in edit mode
  const updateExistingModule = async () => {
    if (!editModuleId) return;
    
    setIsSaving(true);
    try {
      const moduleData = {
        title: newModule.title,
        description: newModule.description,
        category: newModule.category,
        difficulty: newModule.difficulty,
        estimatedTime: newModule.estimatedTime,
        customPoints: newModule.customPoints,
        sections: newModule.sections,
        shareWithCommunity: newModule.shareWithCommunity
      };

      await apiRequest(`/api/modules/${editModuleId}`, {
        method: 'PUT',
        data: moduleData
      });

      toast({
        title: "Module Updated",
        description: "Your changes have been saved successfully",
      });

      // Invalidate cache to refresh module data
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${editModuleId}`] });

    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const finishActivityAndSave = () => {
    if (builtActivities.length === 0) {
      toast({
        title: "No Activities Created",
        description: "Please create at least one activity before saving.",
        variant: "destructive",
      });
      return;
    }

    // Create the activity content in the expected format
    const activityContent = {
      activities: builtActivities,
      totalActivities: builtActivities.length,
      interactionType: 'guided-activity'
    };

    // Update the current section with the activity content
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => 
        index === currentSectionIndex 
          ? { 
              ...section, 
              content: JSON.stringify(activityContent),
              type: 'scenario-match' as const
            }
          : section
      )
    }));

    // Reset activity builder state
    setIsActivityBuilder(false);
    setBuiltActivities([]);
    
    toast({
      title: "Activities Created Successfully",
      description: `Created interactive activity section with ${builtActivities.length} activities`,
    });
    
    // Auto-advance to next section
    nextSection();
  };

  const completeInitialSetup = () => {
    if (!initialModuleData.title.trim() || !initialModuleData.learningObjective.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and learning objective.",
        variant: "destructive",
      });
      return;
    }

    // Update the module with the initial data
    setNewModule(prev => ({
      ...prev,
      title: initialModuleData.title,
      description: initialModuleData.learningObjective,
      // Store this as the primary context for all AI operations
      moduleContext: {
        title: initialModuleData.title,
        learningObjective: initialModuleData.learningObjective
      }
    }));

    setShowInitialSetup(false);
    
    toast({
      title: "Module Setup Complete",
      description: "Your title and learning objective will guide all AI content generation.",
    });
  };

  const generateAIContentForSection = async () => {
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;

    // Use the initial module data or fall back to asking for specific topic
    const primaryTopic = initialModuleData.title || newModule.title;
    const learningObjective = initialModuleData.learningObjective || newModule.description;
    
    if (!primaryTopic && !aiTopicInput.trim()) {
      setShowTopicInput(true);
      return;
    }

    setIsGeneratingAIContent(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai/generate-content-blocks', {
        topic: aiTopicInput.trim() || `${primaryTopic} - ${learningObjective}`,
        sectionTitle: currentSection.title,
        moduleTitle: primaryTopic || 'Professional Development Module',
        sectionType: currentSection.type,
        learningObjective: learningObjective,
        isRegeneration: false,
        regenerationGuidance: ''
      });
      setAiGeneratedBlocks([])

      if (response.blocks && response.blocks.length > 0) {
        console.log('content block generated',response.blocks)
        // Add new content blocks with humor and evidence-based content
        const newBlocks = response.blocks.map(block => ({
          type: block.type,
          content: block.content,
          preview: block.preview
        }));

        setAiGeneratedBlocks(prev => [...prev, ...newBlocks]);
        
        toast({
          title: 'Content Generated',
          description: `Generated ${newBlocks.length} engaging content blocks based on "${primaryTopic}".`,
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate content. Please try again or add content manually.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAIContent(false);
      setShowTopicInput(false);
    }
  };

  const handleTopicSubmit = () => {
    if (aiTopicInput.trim()) {
      generateAIContentForSection();
    }
  };

  // Regeneration function with additional guidance
  const regenerateContentWithGuidance = async () => {
    const currentSection = newModule.sections[currentSectionIndex];
    if (!currentSection) return;

    const primaryTopic = initialModuleData.title || newModule.title;
    const learningObjective = initialModuleData.learningObjective || newModule.description;
    
    if (!primaryTopic) {
      toast({
        title: "Missing Topic",
        description: "Please set a module title first to regenerate content.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai/generate-content-blocks', {
        topic: `${primaryTopic} - ${learningObjective}`,
        sectionTitle: currentSection.title,
        moduleTitle: primaryTopic,
        sectionType: currentSection.type,
        learningObjective: learningObjective,
        isRegeneration: true,
        regenerationGuidance: regenerationGuidance
      });

      if (response.blocks && response.blocks.length > 0) {
        const newBlocks = response.blocks.map((block: any) => ({
          type: block.type,
          content: block.content,
          preview: block.preview
        }));

        // Replace existing blocks with regenerated ones
        setAiGeneratedBlocks(newBlocks);
        
        toast({
          title: 'Content Regenerated',
          description: `Generated ${newBlocks.length} refined content blocks with your guidance.`,
        });
        
        setShowRegenerateDialog(false);
        setRegenerationGuidance('');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: 'Regeneration Failed',
        description: 'Unable to regenerate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const addCustomSection = (sectionType: string) => {
    const sectionTypeConfig = SECTION_TYPES.find(type => type.type === sectionType);
    if (!sectionTypeConfig) return;

    const newSection: ModuleSection = {
      title: sectionTypeConfig.title,
      content: '',
      videoUrl: '',
      imageUrl: '',
      type: sectionType as any,
      duration: 5,
      activities: [{
        type: 'read' as const,
        title: sectionTypeConfig.title,
        duration: 5,
        content: '',
        videoUrl: '',
        audioUrl: '',
        interactionType: 'form' as const
      }]
    };

    setCustomTemplate(prev => ({
      ...prev,
      sections: [...(prev?.sections || []), newSection]
    }));
  };

  // Function to load template data into the module creator
  const loadTemplateData = (template: any) => {
    if (!template) return;
    
    try {
      // Convert template activities to module sections
      const templateSections = template.activities?.map((activity: any, index: number) => ({
        title: activity.title || `Section ${index + 1}`,
        content: activity.content || activity.description || '',
        videoUrl: activity.videoUrl || '',
        imageUrl: '',
        type: 'text' as const,
        duration: activity.duration || 5,
        activities: [{
          type: activity.type || 'read',
          title: activity.title,
          duration: activity.duration || 5,
          content: activity.content || activity.description || '',
          videoUrl: activity.videoUrl,
          audioUrl: activity.audioUrl,
          interactionType: activity.interactionType
        }]
      })) || [];

      setNewModule(prev => ({
        ...prev,
        title: template.title || '',
        description: template.description || '',
        category: template.category || 'classroom-management',
        difficulty: template.difficulty || 'beginner',
        estimatedTime: String(template.totalDuration || template.duration || 15),
        moduleType: template.moduleType || (template.activities?.length > 1 ? 'course' : 'single'),
        sections: templateSections.length > 0 ? templateSections : prev.sections,
        courseStructure: {
          ...prev.courseStructure,
          sequentialUnlock: template.courseStructure?.sequentialUnlock || false,
          certificateAwarded: template.courseStructure?.certificateAwarded || false,
          badgeType: template.courseStructure?.badgeType || '',
          modules: template.courseStructure?.modules || []
        },
        interactiveElements: {
          ...prev.interactiveElements,
          hasTimer: template.interactiveElements?.hasTimer || false,
          hasAudioRecording: template.interactiveElements?.hasAudioRecording || false,
          hasJournaling: template.interactiveElements?.hasJournaling || false,
          hasBreathingExercises: template.interactiveElements?.hasBreathingExercises || false,
          hasWorksheets: template.interactiveElements?.hasWorksheets || false
        },
        certificationSystem: {
          ...prev.certificationSystem,
          enabled: template.certificationSystem?.enabled || false,
          badgeName: template.certificationSystem?.badgeName || template.title,
          requirements: {
            ...prev.certificationSystem.requirements,
            ...template.certificationSystem?.requirements
          }
        }
      }));

      toast({
        title: "Template Loaded",
        description: `Successfully loaded the ${template.title} template with ${templateSections.length} sections.`,
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Template Load Error",
        description: "Failed to load template data. Using default structure.",
        variant: "destructive",
      });
    }
  };

  // Check for template data in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateData = urlParams.get('template');
    
    if (templateData) {
      try {
        const template = JSON.parse(decodeURIComponent(templateData));
        loadTemplateData(template);
      } catch (error) {
        console.error('Error parsing template data:', error);
        toast({
          title: "Template Load Error",
          description: "Failed to load the selected template. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Generate AI story content for interactive story sections
  const generateStoryContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-story-content', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          currentContent: newModule.sections[sectionIndex].content,
          category: newModule.category
        }
      });

      if (response.story) {
        updateSection(sectionIndex, 'content', response.story);
        toast({
          title: "Story Generated",
          description: "AI has created an engaging interactive story for this section.",
        });
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate story content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Generate AI examples for real-world examples sections
  const generateExampleContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-examples', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.examples) {
        updateSection(sectionIndex, 'content', response.examples);
        toast({
          title: "Examples Generated",
          description: "AI has created practical real-world examples for this section.",
        });
      }
    } catch (error) {
      console.error('Error generating examples:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate example content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Delete a section from the module
  const deleteSection = (sectionIndex: number) => {
    if (newModule.sections.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "A module must have at least one section.",
        variant: "destructive",
      });
      return;
    }

    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
    }));

    // Adjust current section index if needed
    if (currentSectionIndex >= sectionIndex && currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    } else if (currentSectionIndex >= newModule.sections.length - 1) {
      setCurrentSectionIndex(0);
    }

    // Remove from completed sections if it was completed
    setCompletedSections(prev => 
      prev.filter(index => index !== sectionIndex)
        .map(index => index > sectionIndex ? index - 1 : index)
    );

    toast({
      title: "Section Deleted",
      description: "The section has been removed from your module.",
    });
  };

  // Generate AI matching exercises
  const generateMatchingContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-matching-exercise', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.matchingExercise) {
        updateSection(sectionIndex, 'content', response.matchingExercise);
        toast({
          title: "Matching Exercise Generated",
          description: "AI has created an interactive matching exercise for this section.",
        });
      }
    } catch (error) {
      console.error('Error generating matching exercise:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate matching exercise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Generate AI scenario content
  const generateScenarioContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-scenario', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.scenario) {
        updateSection(sectionIndex, 'content', response.scenario);
        toast({
          title: "Scenario Generated",
          description: "AI has created a realistic decision-making scenario for this section.",
        });
      }
    } catch (error) {
      console.error('Error generating scenario:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate scenario content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  const generateQuizContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-quiz-questions', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.questions) {
        // Convert AI response to proper quiz format using universal function
        const quizData = convertContentToQuiz(response.questions, newModule.sections[sectionIndex].title);
        
        if (quizData) {
          // Update section with proper quiz structure
          const updatedSections = [...newModule.sections];
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            ...quizData,
            type: updatedSections[sectionIndex].type as 'text' | 'quiz' | 'scenario-match' | 'podcast' | 'slide' | 'video' | 'story' | 'example' | 'matching' | 'scenario' | 'triage' | 'mnemonic' | 'simulation'
          };
          setNewModule(prev => ({ ...prev, sections: updatedSections }));
          
          toast({
            title: "Interactive Quiz Generated!",
            description: `Created ${quizData.questions.length} interactive quiz questions`,
          });
        } else {
          // Fallback to raw content if parsing fails
          updateSection(sectionIndex, 'content', response.questions);
          toast({
            title: "Quiz Content Generated",
            description: "AI has created quiz questions. Use 'Save & Next Section' to convert to interactive format.",
          });
        }
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate quiz content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Generate AI flashcards/key terms
  const generateFlashcards = async () => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFlashcards(true);
    
    try {
      console.log('Generating flashcards with data:', {
        moduleTitle: newModule.title,
        moduleDescription: newModule.description,
        sectionTitle: newModule.sections[currentSectionIndex]?.title || 'Key Terms',
        category: newModule.category,
        sectionType: 'flashcards'
      });

      const response = await apiRequest('POST', '/api/flashcards/generate-flashcards', {
        moduleTitle: newModule.title,
        moduleDescription: newModule.description,
        sectionTitle: newModule.sections[currentSectionIndex]?.title || 'Key Terms',
        category: newModule.category,
        sectionType: 'flashcards'
      });

      console.log('Flashcards API response:', response);

      if (response.flashcards && response.flashcards.length > 0) {
        // Store the flashcards for preview instead of immediately applying
        setGeneratedFlashcards(response.flashcards);
        setShowFlashcardPreview(true);
        
        toast({
          title: "Flashcards Generated",
          description: `Generated ${response.flashcards.length} flashcards. Review and apply them to your section.`,
        });
      } else {
        console.log('No flashcards in response or empty array');
        toast({
          title: "No Terms Generated",
          description: "No key terms were generated. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate key terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const generateReflectionContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-reflection-prompts', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.prompts) {
        updateSection(sectionIndex, 'content', response.prompts);
        toast({
          title: "Reflection Prompts Generated!",
          description: "AI has created thoughtful reflection questions for your section.",
        });
      }
    } catch (error) {
      console.error('Error generating reflection prompts:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate reflection content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  const generatePriorityContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please add a module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest('/api/ai/generate-priority-exercise', {
        method: 'POST',
        data: {
          moduleTitle: newModule.title,
          moduleDescription: newModule.description,
          sectionTitle: newModule.sections[sectionIndex].title,
          category: newModule.category
        }
      });

      if (response.priorityExercise) {
        updateSection(sectionIndex, 'content', response.priorityExercise);
        toast({
          title: "Priority Exercise Generated!",
          description: "AI has created a priority sorting exercise for your section.",
        });
      }
    } catch (error) {
      console.error('Error generating priority exercise:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate priority content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Generate AI video using Veo API
  const generateAiVideo = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingVideo(sectionIndex);
    setVideoGenerationStatus(prev => ({ ...prev, [sectionIndex]: 'starting' }));

    try {
      const section = newModule.sections[sectionIndex];
      
      toast({
        title: "Generating Video",
        description: "AI is creating a custom training video for your module...",
      });

      const response = await apiRequest('POST', '/api/video/generate', {
        moduleTitle: newModule.title,
        content: `${newModule.description}\n\nSection: ${section.title}\n${section.content}`,
        targetAudience: 'Early childhood educators',
        duration: 120, // 2 minutes
        style: 'professional'
      });

      if (response.success) {
        setVideoGenerationStatus(prev => ({ ...prev, [sectionIndex]: 'processing' }));
        
        // Poll for video completion
        const checkStatus = async () => {
          try {
            const statusResponse = await apiRequest('GET', `/api/video/status/${response.videoId}`);
            
            if (statusResponse.status === 'completed' && statusResponse.videoUrl) {
              // Update the section with the generated video URL
              const updatedSections = [...newModule.sections];
              updatedSections[sectionIndex] = {
                ...updatedSections[sectionIndex],
                videoUrl: statusResponse.videoUrl
              };
              
              setNewModule(prev => ({
                ...prev,
                sections: updatedSections
              }));

              setVideoGenerationStatus(prev => ({ ...prev, [sectionIndex]: 'completed' }));
              setGeneratingVideo(null);

              toast({
                title: "Video Generated Successfully",
                description: "Your custom training video is ready and has been added to the module section.",
              });
            } else if (statusResponse.status === 'failed') {
              throw new Error('Video generation failed');
            } else {
              // Still processing, check again in 10 seconds
              setTimeout(checkStatus, 10000);
            }
          } catch (error) {
            console.error('Status check error:', error);
            setVideoGenerationStatus(prev => ({ ...prev, [sectionIndex]: 'failed' }));
            setGeneratingVideo(null);
            toast({
              title: "Video Generation Failed",
              description: "There was an error generating your video. Please try again.",
              variant: "destructive",
            });
          }
        };

        // Start status checking after a short delay
        setTimeout(checkStatus, 5000);
        
      } else {
        throw new Error('Failed to start video generation');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      setGeneratingVideo(null);
      setVideoGenerationStatus(prev => ({ ...prev, [sectionIndex]: 'failed' }));
      toast({
        title: "Video Generation Failed",
        description: "There was an error generating your video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateScenarioMatchContent = async (sectionIndex: number) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the module title and description first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(sectionIndex);
    
    try {
      const response = await apiRequest("POST", "/api/ai-suggestions", {
        prompt: `Create scenario matching content for ECE module "${newModule.title}". 
        
Module Context: ${newModule.description}
Difficulty Level: ${newModule.difficulty}

Generate 4-6 realistic classroom scenarios specifically related to "${newModule.title}" and corresponding appropriate teacher responses for matching. Focus on practical situations teachers encounter when working with this topic.

Format the response as:
SCENARIOS:
[List realistic scenarios, one per line]

RESPONSES:
[List appropriate teacher responses, one per line]

Make sure scenarios directly relate to the module topic and description provided.`,
        moduleTopic: newModule.title,
        moduleDescription: newModule.description,
        difficultyLevel: newModule.difficulty,
        sectionContent: "Generate realistic classroom scenarios and appropriate teacher responses for matching"
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse the AI response to extract scenarios and responses
        if (data.content) {
          let scenarios = '';
          let responses = '';
          
          try {
            // Try to parse JSON first
            const parsed = JSON.parse(data.content);
            if (parsed.scenarios && parsed.responses) {
              scenarios = Array.isArray(parsed.scenarios) ? parsed.scenarios.join('\n') : parsed.scenarios;
              responses = Array.isArray(parsed.responses) ? parsed.responses.join('\n') : parsed.responses;
            }
          } catch {
            // If not JSON, try to extract from text
            const content = data.content;
            const scenarioMatch = content.match(/scenarios?:?\s*\n(.*?)(?=responses?:?|$)/is);
            const responseMatch = content.match(/responses?:?\s*\n(.*?)$/is);
            
            if (scenarioMatch && responseMatch) {
              scenarios = scenarioMatch[1].trim();
              responses = responseMatch[1].trim();
            } else {
              // Split content roughly in half if structure unclear
              const lines = content.split('\n').filter(line => line.trim());
              const midpoint = Math.ceil(lines.length / 2);
              scenarios = lines.slice(0, midpoint).join('\n');
              responses = lines.slice(midpoint).join('\n');
            }
          }
          
          updateSection(sectionIndex, 'content', {
            scenarios: scenarios || `Scenarios related to ${newModule.title} will be generated here`,
            responses: responses || `Appropriate responses for ${newModule.title} scenarios will be generated here`
          });
          
          toast({
            title: "Scenarios Generated",
            description: `AI-generated scenarios and responses for ${newModule.title} have been created.`,
          });
        } else {
          throw new Error('No content in AI response');
        }
      } else {
        throw new Error('Content generation failed');
      }
    } catch (error) {
      console.error('Scenario generation error:', error);
      
      // Provide realistic example content
      updateSection(sectionIndex, 'content', {
        scenarios: `A child is having a meltdown during circle time
Two children are fighting over a toy in dramatic play area
A shy child won't participate in group activities
Child spills paint during art activity and starts to cry
New child cries every morning at drop-off`,
        responses: `Offer a calm-down corner with sensory tools
Implement a sharing timer system and teach turn-taking
Use gentle encouragement and offer activity choices
Stay calm, offer help: 'Accidents happen, let's clean up together'
Establish a consistent goodbye routine with comfort items`
      });
      
      toast({
        title: "Example Content Provided",
        description: "Realistic scenarios and responses have been added to get you started.",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  // Module templates with AI generation capabilities
  const moduleTemplates = [
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

  // Calculate suggested points based on difficulty and estimated time
  const calculateSuggestedPoints = (difficulty: string, estimatedTime: string) => {
    const basePoints = parseInt(estimatedTime) || 15;
    const difficultyMultiplier = difficulty === 'beginner' ? 0.8 : difficulty === 'intermediate' ? 1.0 : 1.2;
    return Math.round(basePoints * difficultyMultiplier);
  };
  
  // Generate AI content for specific module templates
  const generateTemplateContent = async (templateId: string) => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title and description before generating content.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingContent(true);
    
    // Show encouraging message while AI generates content
    toast({
      title: "🤖 AI is thinking...",
      description: "Creating the best personalized content for your module. This may take up to a minute for the highest quality results.",
    });
    
    try {
      let promptText = '';
      
      switch (templateId) {
        case 'mini-video':
          promptText = `Create a mini video lesson script for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: video script, key takeaways, discussion questions, and follow-up activities.`;
          break;
        case 'interactive-scenario':
          promptText = `Design an interactive scenario for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: realistic scenario, decision points, multiple outcomes, and learning objectives.`;
          break;
        case 'slide-storyboard':
          promptText = `Create a slide storyboard for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: slide content, visual descriptions, animation suggestions, and presenter notes.`;
          break;
        case 'quiz-teachback':
          promptText = `Develop a quiz and teachback session for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: quiz questions, detailed explanations, teaching strategies, and practice scenarios.`;
          break;
        case 'podcast-audio':
          promptText = `Write a podcast-style audio script about "${newModule.title}" for ${newModule.difficulty} level ECE teachers. 

Module Description: ${newModule.description}

Category: ${newModule.category}

Content to discuss: ${newModule.sections.map(section => `${section.title}: ${section.content}`).join('\n\n')}

Create a natural conversation between two podcast hosts discussing this specific content. Include: conversational script, key insights from the provided content, discussion topics, and reflection prompts.`;
          break;
        case 'roleplay-reels':
          promptText = `Create roleplay scenarios for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: character roles, dialogue scripts, learning outcomes, and debrief questions.`;
          break;
      }

      const data = await apiRequest('/api/ai/generate', {
        method: 'POST',
        data: { 
          prompt: promptText,
          type: 'template-content',
          templateType: templateId
        }
      });

      if (data && data.suggestions) {
        setGeneratedContent({
          templateId,
          content: data.suggestions
        });
        
        toast({
          title: "AI Content Generated!",
          description: `Complete ${moduleTemplates.find(t => t.id === templateId)?.title} content has been created for your module.`,
        });
      }
    } catch (error) {
      console.error('AI content generation error:', error);
      toast({
        title: "Content Generation Failed",
        description: "There was an issue generating the content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Apply generated content to module
  const applyGeneratedContent = () => {
    if (!generatedContent) return;
    
    const { templateId, content } = generatedContent;
    
    // Handle different template types with proper formatting
    if (templateId === 'quiz-teachback') {
      // Create a quiz section
      const newSection: ModuleSection = {
        title: 'Knowledge Check Quiz',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'quiz' as const,
        duration: 10,
        activities: [{
          type: 'quiz' as const,
          title: 'Knowledge Check Quiz',
          duration: 10,
          content: content,
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form'
        }]
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'interactive-scenario') {
      // Create a scenario match section
      const newSection: ModuleSection = {
        title: 'Interactive Scenario',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'scenario-match' as const,
        duration: 15,
        activities: [{
          type: 'practice' as const,
          title: 'Interactive Scenario',
          duration: 15,
          content: content,
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form'
        }]
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'podcast-audio') {
      // Create a podcast section
      const newSection: ModuleSection = {
        title: 'Podcast Discussion',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'podcast' as const,
        duration: 20,
        activities: [{
          type: 'read' as const,
          title: 'Podcast Discussion',
          duration: 20,
          content: content,
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form'
        }]
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'slide-storyboard') {
      // Create a slide section
      const newSection: ModuleSection = {
        title: 'Slide Presentation',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'slide' as const,
        duration: 15,
        activities: [{
          type: 'read' as const,
          title: 'Slide Presentation',
          duration: 15,
          content: content,
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form'
        }]
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else {
      // For other templates, parse as regular text sections
      const contentLines = content.split('\n').filter(Boolean);
      const newSections: ModuleSection[] = [];
      
      let currentSection = { 
        title: '', 
        content: '', 
        videoUrl: '', 
        imageUrl: '', 
        type: 'text' as const,
        duration: 5,
        activities: [{
          type: 'read' as const,
          title: 'Content',
          duration: 5,
          content: '',
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form' as const
        }]
      };
      
      contentLines.forEach((line: string, index: number) => {
        if (line.includes(':') && line.length < 100) {
          // This looks like a section title
          if (currentSection.title || currentSection.content) {
            newSections.push({...currentSection});
          }
          currentSection = { 
            title: line.replace(':', '').trim(), 
            content: '', 
            videoUrl: '', 
            imageUrl: '',
            type: 'text' as const,
            duration: 5,
            activities: [{
              type: 'read' as const,
              title: 'Content',
              duration: 5,
              content: '',
              videoUrl: '',
              audioUrl: '',
              interactionType: 'form' as const
            }]
          };
        } else {
          // This is content
          currentSection.content += line + '\n';
        }
      });
      
      // Add the last section
      if (currentSection.title || currentSection.content) {
        newSections.push(currentSection);
      }
      
      // Update the module with generated sections
      setNewModule(prev => ({
        ...prev,
        sections: newSections.length > 0 ? newSections : prev.sections
      }));
    }
    
    setGeneratedContent(null);
    setAiSelectedTemplate(null);
    
    toast({
      title: "Content Applied!",
      description: "The AI-generated content has been added to your module sections.",
    });
  };

  // Generate AI suggestions for module content
  const generateAiSuggestions = async (type: 'questions' | 'strategies' | 'quiz') => {
    setIsGeneratingIdeas(true);
    try {
      if (!newModule.title || !newModule.category) {
        toast({
          title: "Missing Information",
          description: "Please provide a module title and category before generating suggestions.",
          variant: "destructive"
        });
        setIsGeneratingIdeas(false);
        return;
      }
      
      const isThatOneKidModule = newModule.title.toLowerCase().includes('that one kid');
      let promptText = '';
      
      if (isThatOneKidModule) {
        promptText = `That one kid - ${newModule.difficulty} level`;
      } else if (type === 'questions') {
        promptText = `Generate 3 creative assessment questions for a module about "${newModule.title}" in the category of "${newModule.category}". The questions should be suitable for ${newModule.difficulty} level ECE teachers.`;
      } else if (type === 'strategies') {
        promptText = `Suggest 3 creative teaching strategies for a module about "${newModule.title}" in the category of "${newModule.category}". The strategies should be suitable for ${newModule.difficulty} level ECE teachers.`;
      } else if (type === 'quiz') {
        promptText = `Generate quiz questions specifically for a module titled "${newModule.title}" in the category of "${newModule.category}" for ${newModule.difficulty} level ECE teachers. The content should directly relate to ${newModule.title}.`;
      }
      
      try {
        const data = await apiRequest('/api/ai/generate', {
          method: 'POST',
          data: { 
            prompt: promptText,
            type
          }
        });
        
        if (type === 'quiz') {
          if (data && data.quizQuestions && Array.isArray(data.quizQuestions)) {
            setAiSuggestions(prev => ({
              ...prev,
              quizQuestions: data.quizQuestions
            }));
            
            toast({
              title: `Quiz Questions Generated`,
              description: `${data.quizQuestions.length} multiple-choice quiz questions have been created for your module.`,
            });
          } else {
            throw new Error('Server returned invalid quiz question format');
          }
        } else {
          if (data && data.suggestions) {
            const suggestionsText = data.suggestions;
            let suggestionsArray = suggestionsText.split('\n').filter(Boolean);
            
            if (suggestionsArray.length <= 2 && suggestionsText.includes('!')) {
              suggestionsArray = suggestionsText.split(/(?<=!)\s+/).filter(Boolean);
            }
            
            setAiSuggestions(prev => ({
              ...prev,
              [type]: suggestionsArray
            }));
            
            toast({
              title: `AI Suggestions Generated`,
              description: `Creative ${type} have been generated for your module.`,
            });
          } else {
            throw new Error('Server returned invalid suggestions format');
          }
        }
      } catch (apiError) {
        throw apiError;
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      toast({
        title: "Suggestion Error",
        description: `Failed to generate ${type}. Please try again later.`,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('/api/modules', {
        method: 'POST',
        data: moduleData
      });
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      //queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      
      let successMessage = "Your custom module has been created successfully.";
      let competitionInfo = null;

     // console.log('Module creation response:', data)
      // If shareWithCommunity is enabled, call the community sharing API
      console.log('Module creation response before:', data,newModule)

      if (data?.module?.is_shared_to_community && data?.module?.id) {
        console.log('Module creation response after:', data,newModule)

        try {
          const shareResponse = await apiRequest('/api/community-modules/share', {
            method: 'POST',
            data: { moduleId: data.module.id }
          });
          
          competitionInfo = shareResponse.competitionInfo;
          successMessage += ` ${shareResponse.message}`;
          
          if (competitionInfo) {
            successMessage += ` ${competitionInfo.message}`;
          }
        } catch (error) {
          console.error('Error sharing module with community:', error);
          successMessage += " However, there was an issue sharing it with the community.";
        }
      }
      
      // Reset form
      setNewModule({
        title: '',
        description: '',
        category: 'classroom-management',
        difficulty: 'beginner',
        estimatedTime: '15',
        customPoints: '',
        shareWithCommunity: false,
        sections: [
          {
            title: 'Introduction',
            content: '',
            videoUrl: '',
            imageUrl: ''
          }
        ]
      });
      
      // Clear AI suggestions
      setAiSuggestions({
        questions: [], 
        strategies: [],
        quizQuestions: []
      });
      
      setIsCreatingModule(false);
      
      // Show appropriate toast message
      if (data?.module?.is_shared_to_community && competitionInfo) {
        toast({
          title: "Module Created & Shared!",
          description: successMessage,
          variant: "default",
        });
      } else {
        toast({
          title: "Module Created",
          description: successMessage,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: "Failed to create the module. Please try again.",
        variant: "destructive",
      });
      setIsCreatingModule(false);
    }
  });

  const handleStepByStepComplete = (moduleData: any) => {
    setCreationMethod('selection');
    createModuleMutation.mutate(moduleData);
  };

  const handlePowerPointComplete = (moduleData: any) => {
    setCreationMethod('selection');
    createModuleMutation.mutate(moduleData);
  };

  const generateMnemonicDevice = async (sectionIndex: number, deviceType: string) => {
    const section = newModule.sections[sectionIndex];
    if (!section.content) {
      toast({
        title: "Content Required",
        description: "Please enter the information to memorize first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingContent(true);
      
      const prompt = `Create a ${deviceType} to help memorize this information: "${section.content}". 
      
      Requirements:
      - Make it fun, catchy, and memorable
      - ${deviceType === 'song' ? 'Use a simple melody pattern like "Twinkle Twinkle Little Star"' : ''}
      - ${deviceType === 'rap' ? 'Use a simple rap rhythm with rhyming verses' : ''}
      - ${deviceType === 'poem' ? 'Create a simple rhyming poem that flows well' : ''}
      - ${deviceType === 'acronym' ? 'Create a memorable acronym with explanation' : ''}
      - Keep it appropriate for educational settings
      - Include the key information from the content
      
      Format: Just return the ${deviceType} text, nothing else.`;

      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to generate mnemonic device');
      
      const data = await response.json();
      
      // Update the section content with the generated mnemonic device
      const updatedSections = [...newModule.sections];
      updatedSections[sectionIndex] = {
        ...section,
        content: `${section.content}\n\n🎯 Memory Device (${deviceType.toUpperCase()}):\n${data.content}`
      };
      
      setNewModule(prev => ({ ...prev, sections: updatedSections }));
      
      toast({
        title: "Memory Device Created!",
        description: `Generated a fun ${deviceType} to help memorize the content.`,
      });
      
    } catch (error) {
      console.error('Error generating mnemonic device:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the memory device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };
  
  // Handle module creation
  const handleCreateModule = async () => {
    if (!newModule.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }

    if (!newModule.description.trim()) {
      toast({
        title: "Validation Error", 
        description: "Module description is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingModule(true);

    try {
      // Process video sections that need quiz generation
      const processedSections = [];
      
      for (const section of newModule.sections) {
        // Check if section has meaningful content based on its type
        const hasContent = section.title.trim() || 
          (typeof section.content === 'string' && section.content.trim()) ||
          (typeof section.content === 'object' && section.content && 
           (section.content.scenarios || section.content.responses)) ||
          section.videoUrl.trim();
          
        if (hasContent) {
          // Ensure content is properly serialized for scenario-match sections
          let processedContent = section.content;
          if (section.type === 'scenario-match' && typeof section.content === 'object') {
            processedContent = JSON.stringify(section.content);
          }
          
          processedSections.push({
            ...section,
            content: processedContent
          });
          
          // Generate quiz questions if requested for video sections
          if (section.type === 'video' && section.generateVideoQuestions && section.videoUrl) {
            try {
              toast({
                title: "Generating Video Quiz",
                description: "AI is analyzing the video content to create quiz questions...",
              });
              
              const response = await apiRequest('POST', '/api/ai/generate-video-quiz', {
                videoUrl: section.videoUrl,
                description: section.content || section.title
              });
              
              // Add the generated quiz as a new section
              processedSections.push({
                title: `${section.title} - Quiz Questions`,
                content: response.questions,
                videoUrl: '',
                imageUrl: '',
                type: 'quiz'
              });
              
            } catch (error) {
              console.error('Video quiz generation failed:', error);
              toast({
                title: "Video Quiz Generation Failed",
                description: "Could not generate quiz questions from the video. The module will be created without them.",
                variant: "destructive",
              });
            }
          }
        }
      }

      // Calculate points
      const suggestedPoints = calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime);
      const finalPoints = newModule.customPoints ? parseInt(newModule.customPoints) : suggestedPoints;

      const moduleData = {
        ...newModule,
        pointValue: finalPoints,
        sections: processedSections
      };

      await createModuleMutation.mutateAsync(moduleData);
      
      // Force refresh the module list
      await queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      
      // Reset the form
      setNewModule({
        title: '',
        description: '',
        category: '',
        difficulty: '',
        estimatedTime: '',
        customPoints: '',
        shareWithCommunity: false,
        sections: []
      });
      
    } catch (error) {
      console.error('Module creation error:', error);
      toast({
        title: "Creation Failed",
        description: "There was an issue creating your module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingModule(false);
    }
  };

  // Handle opening publish dialog
  const handleOpenPublishDialog = () => {
    if (!newModule.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a module title before publishing",
        variant: "destructive",
      });
      return;
    }

    if (newModule.sections.length === 0) {
      toast({
        title: "No Sections",
        description: "Please add at least one section before publishing",
        variant: "destructive",
      });
      return;
    }

    setShowPublishDialog(true);
  };

  // Handle module publishing with distribution options
  const handlePublishModule = async () => {
    setIsPublishing(true);
    try {
      // Process sections to ensure they have all required fields
      const processedSections = newModule.sections.map(section => ({
        ...section,
        duration: section.duration || 5,
        activities: section.activities || [{
          type: 'read' as const,
          title: section.title || 'Activity',
          duration: section.duration || 5,
          content: section.content || '',
          videoUrl: section.videoUrl || '',
          audioUrl: '',
          interactionType: 'form' as const
        }]
      }));

      // Calculate points
      const suggestedPoints = calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime);
      const finalPoints = newModule.customPoints ? parseInt(newModule.customPoints) : suggestedPoints;

      const moduleData = {
        title: newModule.title,
        description: newModule.description,
        category: newModule.category,
        difficulty: newModule.difficulty,
        estimatedTime: newModule.estimatedTime,
        pointValue: finalPoints,
        isVisible: publishOptions.saveToModules,
        shareWithCommunity: publishOptions.shareWithCommunity,
        sections: processedSections
      };

      // Save module to database
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to publish module');
      }

      const createdModule = await response.json();

      // Handle teacher notifications if selected
      if (publishOptions.sendToTeachers && publishOptions.selectedTeachers.length > 0) {
        await Promise.all(publishOptions.selectedTeachers.map(teacherId => 
          fetch('/api/teacher-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: teacherId,
              subject: `New Module Available: ${newModule.title}`,
              content: publishOptions.notificationMessage || `A new training module "${newModule.title}" has been shared with you.`,
              moduleId: createdModule.id
            })
          })
        ));
      }

      // Handle group notifications if selected
      if (publishOptions.sendToGroups && publishOptions.selectedGroups.length > 0) {
        // Implementation for group notifications would go here
        console.log('Group notifications not yet implemented');
      }

      let successMessage = "Module published successfully!";
      if (publishOptions.saveToModules) successMessage += " Available in Module Library.";
      if (publishOptions.shareWithCommunity) successMessage += " Shared with Community.";
      if (publishOptions.sendToTeachers) successMessage += ` Sent to ${publishOptions.selectedTeachers.length} teachers.`;

      toast({
        title: "Publishing Complete",
        description: successMessage,
      });

      // Force refresh the module list
      await queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      await queryClient.refetchQueries({ queryKey: ['/api/modules'] });
      
      // Reset states and navigate
      setShowPublishDialog(false);
      setPublishOptions({
        saveToModules: true,
        shareWithCommunity: false,
        sendToTeachers: false,
        sendToGroups: false,
        selectedTeachers: [],
        selectedGroups: [],
        notificationMessage: ''
      });
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Module publishing error:', error);
      toast({
        title: "Publishing Failed",
        description: "There was an issue publishing your module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Add section to module
  const addSection = () => {
    setNewModule(prev => ({
      ...prev,
      sections: [...prev.sections, {
        title: '',
        content: '',
        videoUrl: '',
        imageUrl: '',
        type: 'text' as const,
        duration: 5,
        activities: [{
          type: 'read' as const,
          title: 'Activity',
          duration: 5,
          content: '',
          videoUrl: '',
          audioUrl: '',
          interactionType: 'form' as const
        }]
      }]
    }));
  };

  // Remove section from module
  const removeSection = (index: number) => {
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  // Update section
  const updateSection = (index: number, field: string, value: string) => {
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };



  // Draft management functions
  const saveDraft = async (name?: string) => {
    if (!user?.id) return;
    
    setIsSavingDraft(true);
    try {
      const draftName = name || `${newModule.title || 'Untitled Module'} - ${new Date().toLocaleDateString()}`;
      
      const draftData = {
        name: draftName,
        moduleData: {
          ...newModule,
          initialModuleData,
          currentSectionIndex,
          completedSections,
          aiWorkflowStep,
          creationMethod
        },
        creationMethod: creationMethod,
        aiWorkflowStep: aiWorkflowStep
      };

      await apiRequest('/api/module-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: draftData
      });
      
      toast({
        title: "Draft Saved",
        description: `Your module draft "${draftName}" has been saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = async (draftId: number) => {
    setIsLoadingDraft(true);
    try {
      const draft = await apiRequest(`/api/module-drafts/${draftId}`);
      
      // Restore module state
      setNewModule(draft.moduleData);
      setInitialModuleData(draft.moduleData.initialModuleData || { title: '', learningObjective: '' });
      setCurrentSectionIndex(draft.moduleData.currentSectionIndex || 0);
      setCompletedSections(draft.moduleData.completedSections || []);
      setAiWorkflowStep(draft.moduleData.aiWorkflowStep || 'section-builder');
      setCreationMethod(draft.moduleData.creationMethod || 'manual');
      
      setShowDraftManager(false);
      setShowInitialSetup(false);
      
      toast({
        title: "Draft Loaded",
        description: `Module "${draft.name}" has been loaded successfully.`,
      });
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: "Load Failed",
        description: "Unable to load draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const deleteDraft = async (draftId: number) => {
    try {
      await apiRequest(`/api/module-drafts/${draftId}`, { method: 'DELETE' });
      
      toast({
        title: "Draft Deleted",
        description: "Draft has been deleted successfully.",
      });
      
      // Refresh drafts list
      queryClient.invalidateQueries({ queryKey: ['/api/module-drafts'] });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch user drafts
  const { data: drafts } = useQuery({
    queryKey: ['/api/module-drafts'],
    enabled: showDraftManager && !!user?.id
  });

  // Fetch all modules including hidden ones
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules']
  });

  // Combine proven templates with user module templates safely
  const ALL_TEMPLATES = React.useMemo(() => {
    return [...PROVEN_TEMPLATES, ...getUserModuleTemplates()];
  }, [modules]);

  // Update module visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ moduleId, visible }: { moduleId: number, visible: boolean }) => {
      return await apiRequest('PATCH', `/api/modules/${moduleId}/visibility`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({
        title: 'Module Updated',
        description: 'Module visibility has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update module visibility.',
        variant: 'destructive',
      });
    }
  });

  const handleVisibilityChange = (moduleId: number, currentVisibility: boolean) => {
    updateVisibilityMutation.mutate({ 
      moduleId, 
      visible: !currentVisibility 
    });
  };

  // Filter modules based on search
  const filteredModules = (modules && Array.isArray(modules)) ? modules.filter((module: Module) => {
    const searchLower = searchTerm.toLowerCase();
    return module.title.toLowerCase().includes(searchLower) ||
           module.description.toLowerCase().includes(searchLower) ||
           module.category.toLowerCase().includes(searchLower);
  }) : [];

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please log in to access the module creator.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCreationMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Module Creation Method</h2>
        <p className="text-gray-600">Select the approach that works best for your content and style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Assisted */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300">
          <CardContent className="p-6 text-center" onClick={handleAiAssistedFlow}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assisted</h3>
              <p className="text-gray-600 text-sm mb-4">
                Start with proven templates, then build step-by-step with AI assistance. Perfect for structured, engaging content creation.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Choose from proven templates
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Step-by-step AI section building
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Professional module creation workflow
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Start with Templates
            </Button>
          </CardContent>
        </Card>

        {/* PowerPoint Import */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300">
          <CardContent className="p-6 text-center" onClick={() => setCreationMethod('powerPoint')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PowerPoint Import</h3>
              <p className="text-gray-600 text-sm mb-4">
                Transform your existing PowerPoint presentations into interactive learning modules with AI enhancement.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Upload .ppt or .pptx files
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                AI converts static slides to interactive content
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Automatic quiz generation from content
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Import Presentation
            </Button>
          </CardContent>
        </Card>

        {/* Manual Creation */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-green-300">
          <CardContent className="p-6 text-center" onClick={() => setCreationMethod('manual')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manual Creation</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build your module from scratch with full control over every section. Includes AI templates and content suggestions.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Complete creative control
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                AI content templates available
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Multiple section types and formats
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              Create Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (creationMethod === 'stepByStep') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <StepByStepModuleBuilder
            onModuleComplete={handleStepByStepComplete}
            onBack={() => setCreationMethod('selection')}
          />
        </div>
      </div>
    );
  }

  if (creationMethod === 'powerPoint') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <PowerPointImporter
            onImportComplete={handlePowerPointComplete}
            onBack={() => setCreationMethod('selection')}
          />
        </div>
      </div>
    );
  }

  // Show loading state in edit mode
  if (isEditMode && moduleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Loading Module for Editing</h3>
            <p className="text-gray-600">Please wait while we load your module data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if module loading fails
  if (isEditMode && moduleError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold mb-2 text-red-800">Failed to Load Module</h3>
            <p className="text-gray-600 mb-4">Unable to load the module for editing.</p>
            <Button onClick={() => navigate('/admin')} variant="outline">
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Initial Setup Modal */}
      {showInitialSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Module Setup - Title & Learning Objective
              </CardTitle>
              <CardDescription>
                Before we begin, let's establish the core foundation of your module. This information will guide all AI content generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="moduleTitle" className="text-base font-medium">Module Title</Label>
                  <div className="relative mt-2">
                    <Input
                      id="moduleTitle"
                      placeholder="e.g., Managing Playground Transitions, Effective Communication Skills"
                      value={initialModuleData.title}
                      onChange={(e) => setInitialModuleData(prev => ({ ...prev, title: e.target.value }))}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => {
                        if (isListening.title) {
                          stopVoiceInput('title');
                        } else {
                          startVoiceInput('title', initialModuleData.title, (value) => 
                            setInitialModuleData(prev => ({ ...prev, title: value }))
                          );
                        }
                      }}
                      disabled={!recognition}
                    >
                      {isListening.title ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Choose a clear, descriptive title for your learning module</p>
                </div>

                <div>
                  <Label htmlFor="learningObjective" className="text-base font-medium">Primary Learning Objective</Label>
                  <div className="relative mt-2">
                    <Textarea
                      id="learningObjective"
                      placeholder="e.g., Teachers will learn effective strategies to smoothly transition children from high-energy playground activities to focused classroom learning, reducing disruptions and improving student readiness."
                      value={initialModuleData.learningObjective}
                      onChange={(e) => setInitialModuleData(prev => ({ ...prev, learningObjective: e.target.value }))}
                      rows={4}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                      onClick={() => {
                        if (isListening.learningObjective) {
                          stopVoiceInput('learningObjective');
                        } else {
                          startVoiceInput('learningObjective', initialModuleData.learningObjective, (value) => 
                            setInitialModuleData(prev => ({ ...prev, learningObjective: value }))
                          );
                        }
                      }}
                      disabled={!recognition}
                    >
                      {isListening.learningObjective ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Describe what learners will achieve after completing this module</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Context</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This title and objective will be used by AI to generate relevant content, questions, and activities throughout your module creation process.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={completeInitialSetup}
                  disabled={!initialModuleData.title.trim() || !initialModuleData.learningObjective.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Module Builder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Module Creator</h1>
          <p className="text-gray-600 mt-2">Create engaging learning modules with AI assistance and professional templates</p>
          {!showInitialSetup && initialModuleData.title && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-green-800">Working on: {initialModuleData.title}</div>
                <div className="text-green-700 mt-1">{initialModuleData.learningObjective}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {creationMethod === 'manual' && (
            <>
              <Button
                onClick={() => saveDraft()}
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                disabled={isSavingDraft}
              >
                {isSavingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => setShowDraftManager(true)}
                variant="outline"
                className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
              >
                <FolderOpen className="h-4 w-4" />
                Load Draft
              </Button>
              <Button
                onClick={() => setCreationMethod('selection')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Change Creation Method
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {creationMethod === 'selection' ? renderCreationMethodSelection() : null}

      {/* AI-Assisted Workflow */}
      {creationMethod === 'manual' && aiWorkflowStep === 'template-selection' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Choose Your Template
            </CardTitle>
            <CardDescription>
              Start with a proven template or build your own from scratch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ALL_TEMPLATES.map((template) => (
                <Card key={template.id} className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300">
                  <CardContent className="p-6" onClick={() => handleTemplateSelection(template)}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        {template.icon ? React.createElement(template.icon, { className: "h-6 w-6 text-white" }) : <BookOpen className="h-6 w-6 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{template.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {template.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {template.sections.length} sections
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <div className="text-gray-500 mb-4">or</div>
              <Button 
                variant="outline" 
                className="border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                onClick={handleCustomTemplateBuilder}
              >
                <Plus className="h-4 w-4 mr-2" />
                Build Custom Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Template Builder */}
      {creationMethod === 'manual' && aiWorkflowStep === 'template-builder' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Build Custom Template
            </CardTitle>
            <CardDescription>
              Create your own template by selecting section types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SECTION_TYPES.map((sectionType) => (
                <Button
                  key={sectionType.type}
                  variant="outline"
                  className="h-auto p-3 text-center border-2 hover:border-purple-300"
                  onClick={() => addCustomSection(sectionType.type)}
                >
                  <div>
                    {React.createElement(sectionType.icon, { className: "h-6 w-6 mx-auto mb-2 text-purple-600" })}
                    <div className="text-xs font-medium">{sectionType.title}</div>
                  </div>
                </Button>
              ))}
            </div>

            {customTemplate?.sections && customTemplate.sections.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Your Template Sections:</h4>
                {customTemplate.sections.map((section: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">{index + 1}.</div>
                    <div className="text-sm">{section.title}</div>
                  </div>
                ))}
                <Button 
                  onClick={proceedToSectionBuilder}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Start Building Sections
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Step-by-Step Section Builder */}
      {creationMethod === 'manual' && aiWorkflowStep === 'section-builder' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Section Outline Sidebar */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Module Outline</CardTitle>
                <CardDescription>{aiSelectedTemplate?.name || 'Custom Template'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {newModule.sections.map((section, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        index === currentSectionIndex 
                          ? 'border-purple-500 bg-purple-50' 
                          : completedSections.includes(index)
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => jumpToSection(index)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === currentSectionIndex 
                            ? 'bg-purple-500 text-white'
                            : completedSections.includes(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {completedSections.includes(index) ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.type}</div>
                        </div>
                        {newModule.sections.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSection(index);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Section Builder */}
          <div className="col-span-9">
            {/* Module Context Header */}
            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <CardTitle className="text-lg text-blue-900">
                      {newModule.title || 'Professional Development Module'}
                    </CardTitle>
                    <CardDescription className="text-blue-700 mt-1">
                      <strong>Topic:</strong> {newModule.description || 'Building effective teaching strategies'}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {newModule.category}
                      </Badge>
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        {newModule.difficulty} level
                      </Badge>
                      <span className="text-blue-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {newModule.estimatedTime} min
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build Section {currentSectionIndex + 1}: {newModule.sections[currentSectionIndex]?.title}</CardTitle>
                <CardDescription>
                  AI will use the module topic above to generate relevant content for this section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Interactive Quiz Builder */}
                {isQuizBuilder && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <HelpCircle className="h-5 w-5" />
                        Interactive Quiz Builder
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Build your quiz one question at a time. Add as many questions as you need.
                      </CardDescription>
                      
                      {/* Topic Context for AI */}
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Quiz Topic Context</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-blue-700">
                            <strong>Module:</strong> {initialModuleData.title || newModule.title || 'Professional Development Module'}
                          </div>
                          <div className="text-blue-700">
                            <strong>Learning Objective:</strong> {initialModuleData.learningObjective || newModule.description || 'Building effective teaching strategies'}
                          </div>
                          <div className="text-blue-700">
                            <strong>Section:</strong> {newModule.sections[currentSectionIndex]?.title}
                          </div>
                          <div className="text-blue-600 text-xs mt-2">
                            AI will generate questions specifically about this topic and section
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Quiz Progress */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                            {builtQuizQuestions.length}
                          </div>
                          <span className="text-sm font-medium">Questions Built</span>
                        </div>
                        {builtQuizQuestions.length > 0 && (
                          <Button
                            size="sm"
                            onClick={finishQuizAndSave}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Quiz Finished - Save & Move On
                          </Button>
                        )}
                      </div>

                      {/* Current Question Builder */}
                      <div className="space-y-4 p-4 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Question {builtQuizQuestions.length + 1}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={generateSingleQuizQuestion}
                              disabled={isGeneratingQuizQuestion}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              {isGeneratingQuizQuestion ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  AI Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Difficulty Selector for AI Generation */}
                        <div>
                          <Label className="text-sm font-medium">Question Difficulty</Label>
                          <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy - Basic understanding</SelectItem>
                              <SelectItem value="medium">Medium - Practical application</SelectItem>
                              <SelectItem value="hard">Hard - Critical thinking</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Question Input */}
                        <div>
                          <Label className="text-sm font-medium">Question</Label>
                          <Textarea
                            value={currentQuizQuestion.question}
                            onChange={(e) => setCurrentQuizQuestion(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter your quiz question..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-2 gap-3">
                          {currentQuizQuestion.answers.map((answer, index) => (
                            <div key={index}>
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={currentQuizQuestion.correctAnswer === index}
                                  onChange={() => setCurrentQuizQuestion(prev => ({ ...prev, correctAnswer: index }))}
                                  className="text-green-600"
                                />
                                Answer {String.fromCharCode(65 + index)} {currentQuizQuestion.correctAnswer === index && "(Correct)"}
                              </Label>
                              <Input
                                value={answer}
                                onChange={(e) => {
                                  const newAnswers = [...currentQuizQuestion.answers];
                                  newAnswers[index] = e.target.value;
                                  setCurrentQuizQuestion(prev => ({ ...prev, answers: newAnswers }));
                                }}
                                placeholder={`Answer option ${String.fromCharCode(65 + index)}`}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        <div>
                          <Label className="text-sm font-medium">Explanation (Optional)</Label>
                          <Input
                            value={currentQuizQuestion.explanation}
                            onChange={(e) => setCurrentQuizQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                            placeholder="Explain why this answer is correct..."
                            className="mt-1"
                          />
                        </div>

                        {/* Add Question Button */}
                        <Button
                          onClick={addQuestionToQuiz}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!currentQuizQuestion.question.trim() || currentQuizQuestion.answers.filter(a => a.trim()).length < 2}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question to Quiz
                        </Button>
                      </div>

                      {/* Built Questions List */}
                      {builtQuizQuestions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Quiz Questions ({builtQuizQuestions.length})</h4>
                          {builtQuizQuestions.map((question, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">Q{index + 1}: {question.question}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Correct: {String.fromCharCode(65 + question.correctAnswer)}) {question.answers[question.correctAnswer]}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeQuestionFromQuiz(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Exit Quiz Builder */}
                      <div className="flex justify-between pt-4 border-t border-green-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsQuizBuilder(false);
                            setCurrentQuizQuestion({
                              question: '',
                              answers: ['', '', '', ''],
                              correctAnswer: 0,
                              explanation: ''
                            });
                            setBuiltQuizQuestions([]);
                          }}
                        >
                          Cancel Quiz Builder
                        </Button>
                        
                        {builtQuizQuestions.length > 0 && (
                          <Button
                            onClick={finishQuizAndSave}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Finish Quiz & Continue
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interactive Activity Builder */}
                {isActivityBuilder && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Gamepad className="h-5 w-5" />
                        Interactive Activity Builder
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        Create engaging interactive activities for adult learners. Build drag-and-match, scenarios, or categorization games.
                      </CardDescription>
                      
                      {/* Topic Context for AI */}
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Activity Topic Context</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-green-700">
                            <strong>Module:</strong> {initialModuleData.title || newModule.title || 'Professional Development Module'}
                          </div>
                          <div className="text-green-700">
                            <strong>Learning Objective:</strong> {initialModuleData.learningObjective || newModule.description || 'Building effective teaching strategies'}
                          </div>
                          <div className="text-green-700">
                            <strong>Section:</strong> {newModule.sections[currentSectionIndex]?.title}
                          </div>
                          <div className="text-green-600 text-xs mt-2">
                            AI will generate interactive activities specifically about this topic and section
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Activity Progress */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                            {builtActivities.length}
                          </div>
                          <span className="text-sm font-medium">Activities Built</span>
                        </div>
                        {builtActivities.length > 0 && (
                          <Button
                            size="sm"
                            onClick={finishActivityAndSave}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Activities Finished - Save & Move On
                          </Button>
                        )}
                      </div>

                      {/* Current Activity Builder */}
                      <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Activity {builtActivities.length + 1}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={generateSingleActivity}
                              disabled={isGeneratingAIContent}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              {isGeneratingAIContent ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  AI Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Activity Type Selection */}
                        <div className="space-y-2">
                          <Label>Activity Type</Label>
                          <Select 
                            value={currentActivity.activityType} 
                            onValueChange={(value) => setCurrentActivity(prev => ({ ...prev, activityType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="drag-and-match">Drag and Match</SelectItem>
                              <SelectItem value="scenario-challenge">Scenario Challenge</SelectItem>
                              <SelectItem value="categorization">Categorization Game</SelectItem>
                              <SelectItem value="sequence-ordering">Sequence Ordering</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Activity Title */}
                        <div className="space-y-2">
                          <Label>Activity Title</Label>
                          <Input
                            value={currentActivity.title}
                            onChange={(e) => setCurrentActivity(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter activity title..."
                          />
                        </div>

                        {/* Activity Instructions */}
                        <div className="space-y-2">
                          <Label>Instructions</Label>
                          <Textarea
                            value={currentActivity.instructions}
                            onChange={(e) => setCurrentActivity(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="Provide clear instructions for learners..."
                            rows={3}
                          />
                        </div>

                        {/* Activity Items */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Activity Items & Answers</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addActivityItem}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Item
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Items to Match</Label>
                              {currentActivity.promptItems.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={item}
                                    onChange={(e) => updateActivityItem(index, 'promptItems', e.target.value)}
                                    placeholder={`Item ${index + 1}...`}
                                    className="text-sm"
                                  />
                                  {currentActivity.promptItems.length > 2 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeActivityItem(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Correct Matches</Label>
                              {currentActivity.answerKey.map((answer, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={answer}
                                    onChange={(e) => updateActivityItem(index, 'answerKey', e.target.value)}
                                    placeholder={`Answer ${index + 1}...`}
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Add Activity Button */}
                        <div className="flex justify-end pt-4 border-t border-blue-200">
                          <Button
                            onClick={addCurrentActivityToList}
                            disabled={!currentActivity.title.trim() || !currentActivity.instructions.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Activity
                          </Button>
                        </div>
                      </div>

                      {/* Built Activities List */}
                      {builtActivities.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Built Activities ({builtActivities.length})</h4>
                          {builtActivities.map((activity, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-blue-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{activity.title}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Type: {activity.activityType} • Items: {activity.promptItems.length}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {activity.instructions.substring(0, 80)}...
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeActivityFromList(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Exit Activity Builder */}
                      <div className="flex justify-between pt-4 border-t border-blue-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsActivityBuilder(false);
                            setCurrentActivity({
                              activityType: 'drag-and-match',
                              title: '',
                              instructions: '',
                              promptItems: ['', '', '', ''],
                              answerKey: ['', '', '', ''],
                              uiHints: {
                                leftColumnTitle: 'Items to Match',
                                rightColumnTitle: 'Categories',
                                dragInstruction: 'Drag items to their matching categories'
                              },
                              imageSupport: false
                            });
                            setBuiltActivities([]);
                          }}
                        >
                          Cancel Activity Builder
                        </Button>
                        
                        {builtActivities.length > 0 && (
                          <Button
                            onClick={finishActivityAndSave}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Finish Activities & Continue
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Specialized Builder Integration */}
                {activeBuilder === 'scenario-match' && (
                  <ScenarioMatchBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive scenario matching activity created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Scenario Match Activity Saved",
                        description: "Your scenario matching activity has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'slide' && (
                  <SlideBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive slide presentation created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Slide Presentation Saved",
                        description: "Your slide presentation has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'example' && (
                  <ExampleBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive examples and case studies created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Examples Activity Saved",
                        description: "Your examples and case studies have been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'matching' && (
                  <MatchingBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive matching exercise created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Matching Exercise Saved",
                        description: "Your matching exercise has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'scenario' && (
                  <ScenarioBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive scenario-based learning created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Scenario Activity Saved",
                        description: "Your scenario-based activity has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'triage' && (
                  <TriageBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive triage and priority assessment created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Triage Assessment Saved",
                        description: "Your triage assessment has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'mnemonic' && (
                  <MnemonicBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive memory techniques and mnemonics created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Memory Techniques Saved",
                        description: "Your memory techniques have been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {activeBuilder === 'simulation' && (
                  <SimulationBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive role-play simulation created with AI and manual input capabilities.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Simulation Saved",
                        description: "Your role-play simulation has been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

            {activeBuilder === 'activity' && (
                  <ActivityBuilder
                    moduleTitle={newModule.title}
                    moduleDescription={newModule.description}
                    sectionTitle={newModule.sections[currentSectionIndex]?.title || ''}
                    onSave={(data) => {
                      const updatedSections = [...newModule.sections];
                      updatedSections[currentSectionIndex] = {
                        ...updatedSections[currentSectionIndex],
                        builderData: data,
                        content: `Interactive learning activities with ${data.totalActivities || 0} activities created using AI and manual input.`
                      };
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: updatedSections
                      }));
                      
                      setActiveBuilder(null);
                      setBuilderData(null);
                      
                      toast({
                        title: "Activities Saved",
                        description: "Your interactive activities have been saved to this section.",
                      });
                    }}
                    onCancel={() => {
                      setActiveBuilder(null);
                      setBuilderData(null);
                    }}
                    initialData={builderData}
                  />
                )}

                {/* Drag and Drop Content Area */}
                {!isQuizBuilder && !isActivityBuilder && !activeBuilder && (
                  <div className="grid grid-cols-2 gap-6">
                  {/* Dynamic AI Tools Based on Section Type */}
                  <div className="space-y-4">
                    {(() => {
                      const currentSection = newModule.sections[currentSectionIndex];
                      const sectionType = currentSection?.type || 'text';
                      const sectionTitle = currentSection?.title?.toLowerCase() || '';
                      
                      // Specific section type detection for targeted tools
                      const isVideoSection = sectionType === 'video' || sectionTitle.includes('video') || sectionTitle.includes('foundational');
                      const isFlashcardSection = sectionTitle.includes('flash cards') || sectionTitle.includes('flashcards') ||
                                               sectionTitle.includes('definitions') || sectionTitle.includes('key terms');
                      const isQuizSection = sectionType === 'quiz' || sectionTitle.includes('quiz') || sectionTitle.includes('assessment');
                      const isActivitySection = sectionTitle.includes('guided activity') || sectionTitle.includes('step-by-step') ||
                                              (sectionTitle.includes('activity') && !sectionTitle.includes('flash'));
                      const isScenarioSection = sectionType === 'scenario' || sectionType === 'story' || 
                                              sectionTitle.includes('scenario') || sectionTitle.includes('case study');
                      
                      // Specialized builder type detection
                      const isScenarioMatchSection = sectionType === 'scenario-match';
                      const isSlideSection = sectionType === 'slide';
                      const isExampleSection = sectionType === 'example';
                      const isMatchingSection = sectionType === 'matching';
                      const isTriageSection = sectionType === 'triage';
                      const isMnemonicSection = sectionType === 'mnemonic';
                      const isSimulationSection = sectionType === 'simulation';
                      
                      const isTextSection = sectionType === 'text' || (!isVideoSection && !isQuizSection && !isFlashcardSection && 
                                          !isActivitySection && !isScenarioSection && !isScenarioMatchSection && !isSlideSection && 
                                          !isExampleSection && !isMatchingSection && !isTriageSection && !isMnemonicSection && !isSimulationSection);
                      
                      if (isVideoSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Video className="h-5 w-5 text-blue-600" />
                                Video Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => setShowVideoSearch(true)}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <Search className="h-4 w-4 mr-2" />
                                  Find Videos
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={generateAIContentForSection}
                                  disabled={isGeneratingAIContent}
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Discussion Questions
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {!showVideoSearch ? (
                                <div className="text-center py-6 text-gray-500">
                                  <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm font-medium">Video Section Tools</p>
                                  <p className="text-xs mt-1">Search educational videos or generate discussion questions</p>
                                </div>
                              ) : (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium text-blue-900">
                                        Find educational videos
                                      </Label>
                                      <p className="text-xs text-blue-700 mt-1">
                                        Search our curated library, YouTube, or add custom links
                                      </p>
                                    </div>
                                    
                                    <Input
                                      value={videoSearchQuery}
                                      onChange={(e) => setVideoSearchQuery(e.target.value)}
                                      placeholder="Search for educational videos..."
                                      className="border-blue-300 focus:border-blue-500"
                                      onKeyPress={(e) => e.key === 'Enter' && handleVideoSearch()}
                                    />
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-blue-300 text-blue-700"
                                        onClick={() => searchVideoLibrary(videoSearchQuery)}
                                        disabled={isSearchingVideos || !videoSearchQuery.trim()}
                                      >
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {isSearchingVideos ? 'Searching...' : 'Library'}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-red-300 text-red-700"
                                        onClick={() => searchYouTube(videoSearchQuery)}
                                        disabled={isSearchingYoutube || !videoSearchQuery.trim()}
                                      >
                                        <Search className="h-3 w-3 mr-1" />
                                        {isSearchingYoutube ? 'Searching...' : 'YouTube'}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-green-300 text-green-700"
                                        onClick={() => {
                                          const url = prompt('Enter video URL:');
                                          if (url && url.trim()) {
                                            // Extract title from URL or use placeholder
                                            let videoTitle = 'Custom Video';
                                            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                              videoTitle = 'YouTube Video';
                                            } else if (url.includes('vimeo.com')) {
                                              videoTitle = 'Vimeo Video';
                                            }
                                            
                                            // Add video to the correct section
                                            const targetIndex = selectedVideoForSection !== null ? selectedVideoForSection : currentSectionIndex;
                                            updateSection(targetIndex, 'videoUrl', url);
                                            updateSection(targetIndex, 'title', `${newModule.sections[targetIndex]?.title || 'Section'} - ${videoTitle}`);
                                            
                                            toast({
                                              title: "Custom Video Added",
                                              description: "Your custom video has been added to the section",
                                            });
                                            
                                            setShowVideoSearch(false);
                                            setVideoSearchQuery('');
                                            setVideoSearchResults([]);
                                            setYoutubeSearchResults([]);
                                            setSelectedVideoForSection(null);
                                          }
                                        }}
                                      >
                                        <Link2 className="h-3 w-3 mr-1" />
                                        Custom URL
                                      </Button>
                                    </div>
                                    
                                    {(videoSearchResults.length > 0 || youtubeSearchResults.length > 0) && (
                                      <div className="max-h-64 overflow-y-auto space-y-3">
                                        <h4 className="text-sm font-medium text-blue-800">Choose a video to add:</h4>
                                        
                                        {/* Library Videos */}
                                        {videoSearchResults.map((video, index) => (
                                          <div key={`library-${index}`} className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-blue-900 truncate">{video.title}</p>
                                                <p className="text-xs text-blue-700 mt-1">{video.description || video.category}</p>
                                                <p className="text-xs text-gray-500 mt-1">Library Video • {video.duration || 'Duration unknown'}</p>
                                              </div>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="ml-3 bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const targetIndex = selectedVideoForSection !== null ? selectedVideoForSection : currentSectionIndex;
                                                  updateSection(targetIndex, 'videoUrl', video.url);
                                                  updateSection(targetIndex, 'title', `${newModule.sections[targetIndex]?.title || 'Section'} - ${video.title}`);
                                                  
                                                  toast({
                                                    title: "Video Added",
                                                    description: `Added "${video.title}" to the section`,
                                                  });
                                                  
                                                  setShowVideoSearch(false);
                                                  setVideoSearchQuery('');
                                                  setVideoSearchResults([]);
                                                  setYoutubeSearchResults([]);
                                                  setSelectedVideoForSection(null);
                                                }}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Video
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                        
                                        {/* YouTube Videos */}
                                        {youtubeSearchResults.map((video, index) => (
                                          <div key={`youtube-${index}`} className="p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-red-900 truncate">{video.title}</p>
                                                <p className="text-xs text-red-700 mt-1">By {video.channelTitle || video.channel}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  YouTube • 
                                                  <a 
                                                    href={video.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    View on YouTube
                                                  </a>
                                                </p>
                                              </div>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="ml-3 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const targetIndex = selectedVideoForSection !== null ? selectedVideoForSection : currentSectionIndex;
                                                  updateSection(targetIndex, 'videoUrl', video.url);
                                                  updateSection(targetIndex, 'title', `${newModule.sections[targetIndex]?.title || 'Section'} - ${video.title}`);
                                                  
                                                  toast({
                                                    title: "YouTube Video Added",
                                                    description: `Added "${video.title}" to the section`,
                                                  });
                                                  
                                                  setShowVideoSearch(false);
                                                  setVideoSearchQuery('');
                                                  setVideoSearchResults([]);
                                                  setYoutubeSearchResults([]);
                                                  setSelectedVideoForSection(null);
                                                }}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Video
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setShowVideoSearch(false)}
                                      className="w-full"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      }
                      
                      if (isFlashcardSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-600" />
                                Flashcard Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={generateFlashcards}
                                  disabled={isGeneratingFlashcards || isRegenerating}
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  {isGeneratingFlashcards || isRegenerating ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Generate Flashcards
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {aiGeneratedBlocks.length > 0 && (
                              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                                <div className="text-sm font-medium text-purple-800 mb-2">
                                  Content Generated! ({aiGeneratedBlocks.length} blocks)
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowRegenerateDialog(true)}
                                  className="text-purple-700 border-purple-300 hover:bg-purple-50 w-full font-medium"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate with Guidance
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setAiGeneratedBlocks([]);
                                    setAiTopicInput('');
                                  }}
                                  className="text-gray-500 hover:text-gray-700 w-full"
                                >
                                  Clear Generated Content
                                </Button>
                              </div>
                            )}
                            
                            <div className="text-center py-6 text-gray-500">
                              <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Flashcard Section</p>
                              <p className="text-xs mt-1">Generate interactive flashcards for key terms and definitions</p>
                            </div>
                          </>
                        );
                      }
                      
                      if (isActivitySection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <FileEdit className="h-5 w-5 text-blue-600" />
                                Activity Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => openBuilder('activity', currentSectionIndex)}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Activities
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <FileEdit className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Interactive Activity Builder</p>
                              <p className="text-xs mt-1">Create step-by-step interactive activities with AI and manual input</p>
                            </div>
                          </>
                        );
                      }
                      
                      if (isQuizSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-green-600" />
                                Quiz Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={startQuizBuilder}
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Quiz
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={generateAIContentForSection}
                                  disabled={isGeneratingAIContent}
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  AI Questions
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Quiz Assessment Tools</p>
                              <p className="text-xs mt-1">Build interactive quizzes or generate AI questions</p>
                            </div>
                          </>
                        );
                      }
                      
                      if (isScenarioMatchSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                Scenario Match Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('scenario-match');
                                    setBuilderData(null);
                                  }}
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Scenario Match
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Scenario Matching Builder</p>
                              <p className="text-xs mt-1">Create scenario-response matching activities with AI and manual input</p>
                            </div>
                          </>
                        );
                      }

                      if (isSlideSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Slide Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('slide');
                                    setBuilderData(null);
                                  }}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Slides
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Slide Presentation Builder</p>
                              <p className="text-xs mt-1">Create interactive slide presentations with AI and manual input</p>
                            </div>
                          </>
                        );
                      }

                      if (isExampleSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                Example Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('example');
                                    setBuilderData(null);
                                  }}
                                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Examples
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Example Builder</p>
                              <p className="text-xs mt-1">Create real-world examples and case studies with AI and manual input</p>
                            </div>
                          </>
                        );
                      }

                      if (isMatchingSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Link className="h-5 w-5 text-green-600" />
                                Matching Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('matching');
                                    setBuilderData(null);
                                  }}
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Matching
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Link className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Matching Exercise Builder</p>
                              <p className="text-xs mt-1">Create interactive drag-and-drop matching activities</p>
                            </div>
                          </>
                        );
                      }

                      if (isTriageSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-red-600" />
                                Triage Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('triage');
                                    setBuilderData(null);
                                  }}
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Triage
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Decision Triage Builder</p>
                              <p className="text-xs mt-1">Create priority assessment and decision-making exercises</p>
                            </div>
                          </>
                        );
                      }

                      if (isMnemonicSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Brain className="h-5 w-5 text-indigo-600" />
                                Memory Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('mnemonic');
                                    setBuilderData(null);
                                  }}
                                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Memory Aids
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Memory Techniques Builder</p>
                              <p className="text-xs mt-1">Create mnemonic devices and memory aids with AI assistance</p>
                            </div>
                          </>
                        );
                      }

                      if (isSimulationSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Gamepad className="h-5 w-5 text-pink-600" />
                                Simulation Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('simulation');
                                    setBuilderData(null);
                                  }}
                                  className="border-pink-300 text-pink-700 hover:bg-pink-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Simulation
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Gamepad className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Role-Play Simulation Builder</p>
                              <p className="text-xs mt-1">Create immersive role-playing scenarios with decision points</p>
                            </div>
                          </>
                        );
                      }

                      if (isScenarioSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-orange-600" />
                                Scenario Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={() => {
                                    setActiveBuilder('scenario');
                                    setBuilderData(null);
                                  }}
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Build Scenarios
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center py-6 text-gray-500">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Scenario Practice Builder</p>
                              <p className="text-xs mt-1">Create realistic practice scenarios with feedback</p>
                            </div>
                          </>
                        );
                      }
                      
                      if (isTextSection) {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-600" />
                                Content Tools
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  onClick={generateAIContentForSection}
                                  disabled={isGeneratingAIContent || isRegenerating}
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  {isGeneratingAIContent || isRegenerating ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Generate Content
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {aiGeneratedBlocks.length > 0 && (
                              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                                <div className="text-sm font-medium text-purple-800 mb-2">
                                  Content Generated! ({aiGeneratedBlocks.length} blocks)
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowRegenerateDialog(true)}
                                  className="text-purple-700 border-purple-300 hover:bg-purple-50 w-full font-medium"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate with Guidance
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setAiGeneratedBlocks([]);
                                    setAiTopicInput('');
                                  }}
                                  className="text-gray-500 hover:text-gray-700 w-full"
                                >
                                  Clear Generated Content
                                </Button>
                              </div>
                            )}
                            
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Text Content Section</p>
                              <p className="text-xs mt-1">Generate educational content and learning materials</p>
                            </div>
                          </>
                        );
                      }
                      
                      // Default text content tools
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-600" />
                              Content Tools
                            </h3>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="outline" 
                                onClick={generateAIContentForSection}
                                disabled={isGeneratingAIContent}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                {isGeneratingAIContent ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Content
                                  </>
                                )}
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline" 
                                onClick={startQuizBuilder}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Add Quiz
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline" 
                                onClick={startActivityBuilder}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <Gamepad className="h-4 w-4 mr-2" />
                                Add Activity
                              </Button>
                            </div>
                          </div>
                          
                          {aiGeneratedBlocks.length > 0 && (
                            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                              <div className="text-sm font-medium text-purple-800 mb-2">
                                Content Generated! ({aiGeneratedBlocks.length} blocks)
                              </div>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRegenerateDialog(true)}
                                className="text-purple-700 border-purple-300 hover:bg-purple-50 w-full font-medium"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate with Guidance
                              </Button>
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setAiGeneratedBlocks([]);
                                  setAiTopicInput('');
                                }}
                                className="text-gray-500 hover:text-gray-700 w-full"
                              >
                                Clear Generated Content
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Topic Input Dialog */}
                    {showTopicInput && (
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-blue-900">
                              What specific topic should this section cover?
                            </Label>
                            <p className="text-xs text-blue-700 mt-1">
                              The AI needs a specific topic to create relevant content blocks for this section.
                            </p>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-blue-200">
                            <h4 className="text-xs font-medium text-blue-800 mb-2">Example topics for "{newModule.sections[currentSectionIndex]?.title}":</h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li>• "Managing classroom transitions after recess"</li>
                              <li>• "Supporting children with separation anxiety"</li>
                              <li>• "Creating inclusive learning environments"</li>
                              <li>• "Positive behavior reinforcement strategies"</li>
                            </ul>
                          </div>
                          
                          <Input
                            value={aiTopicInput}
                            onChange={(e) => setAiTopicInput(e.target.value)}
                            placeholder="e.g., Managing classroom transitions after recess"
                            className="border-blue-300 focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && aiTopicInput.trim() && handleTopicSubmit()}
                          />
                          
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowTopicInput(false);
                                setAiTopicInput('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={handleTopicSubmit}
                              disabled={!aiTopicInput.trim()}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Generate Content Ideas
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Regeneration Dialog */}
                    {showRegenerateDialog && (
                      <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-purple-900">
                              Provide additional guidance for regeneration
                            </Label>
                            <p className="text-xs text-purple-700 mt-1">
                              Tell the AI how to improve the content. Be specific about what you want to see.
                            </p>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <h4 className="text-xs font-medium text-purple-800 mb-2">Example guidance:</h4>
                            <ul className="text-xs text-purple-700 space-y-1">
                              <li>• "Include ECERS block material checklist"</li>
                              <li>• "Add more practical classroom examples"</li>
                              <li>• "Focus on age-appropriate activities for 3-5 year olds"</li>
                              <li>• "Include specific developmental milestones"</li>
                            </ul>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-purple-900 mb-2 block">
                              Your specific guidance:
                            </Label>
                            <Textarea
                              value={regenerationGuidance}
                              onChange={(e) => setRegenerationGuidance(e.target.value)}
                              placeholder="Type your specific instructions here, e.g., 'Include ECERS block material checklist and specific examples for outdoor play areas'"
                              className="border-purple-300 focus:border-purple-500 min-h-32 text-base"
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowRegenerateDialog(false);
                                setRegenerationGuidance('');
                              }}
                              disabled={isRegenerating}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={regenerateContentWithGuidance}
                              disabled={isRegenerating || !regenerationGuidance.trim()}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {isRegenerating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate Content
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Current Topic Display */}
                    {aiGeneratedBlocks.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-800">Content generated for:</span>
                          <span className="text-sm text-green-700">
                            "{aiTopicInput || (initialModuleData.title && `${initialModuleData.title} - ${initialModuleData.learningObjective}`) || newModule.title}"
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AI Generated Content Blocks */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {aiGeneratedBlocks.map((block, index) => {
                        // Check if this is a Guided Activity block
                        const isGuidedActivity = block.type === 'Guided Activity' || 
                                                block.type?.toLowerCase().includes('guided activity') ||
                                                block.type?.toLowerCase().includes('interactive activity');
                        console.log('block' ,block,index)
                        if (isGuidedActivity) {
                          return (
                            <div 
                              key={index}
                              draggable
                              onDragStart={(e) => {
                                console.log('isgudided dropped',e)
                                e.dataTransfer.setData('text/plain', block.content);
                                e.dataTransfer.setData('block-type', block.type);
                              }}
                            >
                              <ActivityBlockComponent 
                                block={block}
                                isDragging={false}
                              />
                            </div>
                          );
                        }
                        
                        // Default rendering for other block types
                        return (
                          <div 
                            key={index}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 transition-colors group"
                            draggable
                            onDragStart={(e) => {
                              // Ensure content is properly formatted as a string
                              let contentString = block.content;
                              if (typeof block.content === 'object' && block.content !== null) {
                                // Handle mnemonic-specific formatting
                                if (block.type === 'Mnemonic Device' && block.content.concept) {
                                  contentString = `# ${block.content.concept}\n\n**Memory Device:** ${block.content.mnemonic}\n\n**How to Use:** ${block.content.explanation}\n\n**Implementation Tip:** ${block.content.tip}`;
                                } else if (block.content.content) {
                                  contentString = block.content.content;
                                } else if (block.content.text) {
                                  contentString = block.content.text;
                                } else {
                                  contentString = Object.entries(block.content)
                                    .map(([key, value]) => `**${key}:** ${value}`)
                                    .join('\n\n');
                                }
                              }
                              e.dataTransfer.setData('text/plain', contentString);
                              e.dataTransfer.setData('block-type', block.type);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <GripVertical className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-purple-700 mb-1">{block.type}</div>
                                <div className="text-sm text-gray-700 line-clamp-3">{block.preview}</div>
                                <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Drag to section content area →
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {aiGeneratedBlocks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Click "Generate Ideas" to get AI content suggestions</p>
                          <p className="text-xs mt-1">You'll need to specify a topic first</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Content Builder */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Section Content</h3>
                      <div className="text-xs text-gray-500">
                        {newModule.sections[currentSectionIndex]?.content ? 
                          `${newModule.sections[currentSectionIndex]?.content.length} characters` : 
                          'Empty'
                        }
                      </div>
                    </div>
                    <div 
                      className="min-h-96 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 transition-colors relative"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-purple-400', 'bg-purple-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                        const rawContent = e.dataTransfer.getData('text/plain');
                        const blockType = e.dataTransfer.getData('block-type');
                        
                        // Handle different content types properly
                        let content = rawContent;
                        try {
                          // If content is a JSON object, parse and format it
                          const parsedContent = JSON.parse(rawContent);
                          if (typeof parsedContent === 'object' && parsedContent !== null) {
                            // Format object content as readable text
                            if (parsedContent.content) {
                              content = parsedContent.content;
                            } else if (parsedContent.text) {
                              content = parsedContent.text;
                            } else {
                              // Convert object to formatted string
                              content = Object.entries(parsedContent)
                                .map(([key, value]) => `**${key}:** ${value}`)
                                .join('\n\n');
                            }
                          }
                        } catch (err) {
                          // If not JSON, use the raw content as is
                          content = rawContent;
                        }
                        
                        const currentContent = newModule.sections[currentSectionIndex]?.content || '';
                        const updatedSections = [...newModule.sections];
                        updatedSections[currentSectionIndex] = {
                          ...updatedSections[currentSectionIndex],
                          content: currentContent + (currentContent ? '\n\n' : '') + content
                        };
                        setNewModule(prev => ({ ...prev, sections: updatedSections }));
                        
                        // Show success feedback
                        toast({
                          title: 'Content Added',
                          description: `${blockType} added to section content`,
                        });
                      }}
                    >
                      {/* Video Preview Section */}
                      {newModule.sections[currentSectionIndex]?.videoUrl && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-900 flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              Video Added to Section
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedSections = [...newModule.sections];
                                updatedSections[currentSectionIndex] = {
                                  ...updatedSections[currentSectionIndex],
                                  videoUrl: ''
                                };
                                setNewModule(prev => ({ ...prev, sections: updatedSections }));
                                toast({
                                  title: "Video Removed",
                                  description: "Video has been removed from this section",
                                });
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                          <div className="text-sm text-blue-800 mb-2">
                            <strong>Video URL:</strong> {newModule.sections[currentSectionIndex].videoUrl}
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={newModule.sections[currentSectionIndex].videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              Preview Video
                            </a>
                            <span className="text-gray-500">•</span>
                            <span className="text-sm text-gray-600">
                              This video will be embedded when the module is published
                            </span>
                          </div>
                        </div>
                      )}

                      {!newModule.sections[currentSectionIndex]?.content && !newModule.sections[currentSectionIndex]?.videoUrl && (
                        <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
                          <div className="text-center text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <ArrowRight className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium">Drop content blocks here</p>
                            <p className="text-xs mt-1">Or type directly in the text area below</p>
                          </div>
                        </div>
                      )}
                      <Textarea
                        value={newModule.sections[currentSectionIndex]?.content || ''}
                        onChange={(e) => {
                          const updatedSections = [...newModule.sections];
                          updatedSections[currentSectionIndex] = {
                            ...updatedSections[currentSectionIndex],
                            content: e.target.value
                          };
                          setNewModule(prev => ({ ...prev, sections: updatedSections }));
                        }}
                        placeholder="Type your content here or drag AI-generated content blocks from the left..."
                        className="min-h-80 resize-none border-0 bg-transparent placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  </div>
                )}

                {/* Section Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={previousSection}
                    disabled={currentSectionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous Section
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (!completedSections.includes(currentSectionIndex)) {
                          setCompletedSections(prev => [...prev, currentSectionIndex]);
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Section
                    </Button>
                    <Button 
                      onClick={nextSection}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {currentSectionIndex === newModule.sections.length - 1 ? 'Preview Module' : 'Save & Next Section'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {creationMethod === 'manual' && aiWorkflowStep === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Module Preview
            </CardTitle>
            <CardDescription>
              Review your module before publishing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{newModule.title}</h3>
              <p className="text-gray-600 mb-4">{newModule.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div>Category: {newModule.category}</div>
                <div>Sections: {newModule.sections.length}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Module Sections:</h4>
              {newModule.sections.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white">
                  <div className="font-medium text-lg mb-2">{index + 1}. {section.title}</div>
                  <div className="text-sm text-blue-600 mb-3 capitalize">{section.type} Section</div>
                  
                  {/* Display actual content */}
                  {section.content && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Content:</div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {section.content.substring(0, 300)}
                        {section.content.length > 300 && '...'}
                      </div>
                    </div>
                  )}
                  
                  {/* Display video if present */}
                  {section.videoUrl && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 mb-1">Video:</div>
                      <div className="text-xs text-blue-600 truncate">{section.videoUrl}</div>
                    </div>
                  )}
                  
                  {/* Display quiz questions if present */}
                  {section.questions && section.questions.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-700 mb-2">Quiz Questions: {section.questions.length}</div>
                      <div className="text-xs text-green-600">
                        {section.questions.map((q: any, qIndex: number) => (
                          <div key={qIndex} className="mb-1">Q{qIndex + 1}: {q.question?.substring(0, 80)}...</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Display activities if present */}
                  {section.activities && section.activities.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 mb-1">Activities: {section.activities.length}</div>
                      <div className="text-xs text-purple-600">
                        Interactive learning activities included
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setAiWorkflowStep('section-builder')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={handleOpenPublishDialog}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Publish Module
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Module Creation Form */}
      {creationMethod === 'manual' && aiWorkflowStep === 'method-selection' && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Create New Module
          </CardTitle>
          <CardDescription>
            Build custom learning modules with AI-powered content suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Module Title *</Label>
              <Input
                id="title"
                value={newModule.title}
                onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter module title"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newModule.category} onValueChange={(value) => setNewModule(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classroom-management">Classroom Management</SelectItem>
                  <SelectItem value="child-development">Child Development</SelectItem>
                  <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                  <SelectItem value="family-engagement">Family Engagement</SelectItem>
                  <SelectItem value="health-safety">Health & Safety</SelectItem>
                  <SelectItem value="professional-development">Professional Development</SelectItem>
                  <SelectItem value="special-needs">Special Needs</SelectItem>
                  <SelectItem value="mindfulness">Mindfulness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={newModule.description}
              onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this module covers..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={newModule.difficulty} onValueChange={(value) => setNewModule(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={newModule.estimatedTime}
                onChange={(e) => setNewModule(prev => ({ ...prev, estimatedTime: e.target.value }))}
                placeholder="15"
              />
            </div>
            
            <div>
              <Label htmlFor="customPoints">
                Point Value (5-30 points)
                <span className="text-sm text-gray-500 ml-1">
                  (Suggested: {calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime)})
                </span>
              </Label>
              <Select 
                value={newModule.customPoints || calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime).toString()} 
                onValueChange={(value) => setNewModule(prev => ({ ...prev, customPoints: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select point value" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 26 }, (_, i) => i + 5).map(points => (
                    <SelectItem key={points} value={points.toString()}>
                      {points} points {points <= 10 ? '(Quick)' : points <= 20 ? '(Standard)' : '(Comprehensive)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Community Sharing */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-purple-900">Share with Community</h3>
                  <p className="text-sm text-purple-700">Enter your module into the monthly competition for bonus points!</p>
                </div>
              </div>
              <Switch
                checked={newModule.shareWithCommunity}
                onCheckedChange={(checked) => setNewModule(prev => ({ ...prev, shareWithCommunity: checked }))}
              />
            </div>
          </div>

          {/* AI Module Creator Wizard */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
              AI Module Creator Wizard
            </h3>
            <div className="text-sm text-gray-700 mb-4">
              Choose a template and let AI generate complete, structured content for your module!
            </div>
            
            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {moduleTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    aiSelectedTemplate === template.id ? 'ring-2 ring-purple-500 bg-purple-50' : template.color
                  }`}
                  onClick={() => setAiSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <template.icon className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-sm">{template.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.duration}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Template Info */}
            {aiSelectedTemplate && (
              <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center">
                    {React.createElement(moduleTemplates.find(t => t.id === aiSelectedTemplate)?.icon || BookOpen, { className: "h-4 w-4 mr-2" })}
                    {moduleTemplates.find(t => t.id === aiSelectedTemplate)?.title}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAiSelectedTemplate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  AI will generate: {moduleTemplates.find(t => t.id === aiSelectedTemplate)?.features.join(', ')}
                </div>
                <Button
                  onClick={() => generateTemplateContent(aiSelectedTemplate)}
                  disabled={isGeneratingContent || !newModule.title || !newModule.description}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Complete Module Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {moduleTemplates.find(t => t.id === aiSelectedTemplate)?.title} Content
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Generated Content Preview */}
            {generatedContent && (
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-800 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    AI Content Generated!
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyGeneratedContent}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Apply to Module
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGeneratedContent(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {generatedContent.content.substring(0, 500)}
                    {generatedContent.content.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Additional AI Tools */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Brain className="h-5 w-5 text-blue-500 mr-2" />
              Additional AI Tools
            </h3>
            <div className="text-sm text-gray-600 mb-3">
              Need more ideas? Generate specific suggestions for your module.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAiSuggestions('questions')}
                disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {isGeneratingIdeas ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate Question Ideas
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAiSuggestions('strategies')}
                disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Teaching Strategies
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAiSuggestions('quiz')}
                disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Generate Quiz
              </Button>
            </div>
          </div>

          {/* AI Suggestions Display */}
          {(aiSuggestions.questions.length > 0 || aiSuggestions.strategies.length > 0 || aiSuggestions.quizQuestions.length > 0) && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-medium flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                AI Generated Suggestions
              </h3>
              
              {aiSuggestions.questions.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Assessment Questions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.questions.map((question, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiSuggestions.strategies.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Teaching Strategies</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.strategies.map((strategy, index) => (
                      <li key={index} className="text-sm text-green-800 flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiSuggestions.quizQuestions.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Quiz Questions</h4>
                  <div className="space-y-3">
                    {aiSuggestions.quizQuestions.map((quiz, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium text-purple-900 mb-1">{index + 1}. {quiz.question}</p>
                        <ul className="ml-4 space-y-1">
                          {quiz.options.map((option, optIndex) => (
                            <li key={optIndex} className={`text-purple-800 ${option === quiz.correctAnswer ? 'font-medium bg-purple-100 px-2 py-1 rounded' : ''}`}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === quiz.correctAnswer && <span className="text-green-600 ml-2">✓</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Voice Narration Panel with Multilingual Support */}
          <VoiceNarrationPanel
            defaultText={`${newModule.title}\n\n${newModule.description}\n\nModule Sections:\n${newModule.sections.map((section, index) => `${index + 1}. ${section.title}: ${section.content}`).join('\n\n')}`}
            onNarrationGenerated={(audioUrl, voiceType) => {
              toast({
                title: "Module Narration Generated",
                description: "Professional multilingual narration created with advanced AI voice technology",
              });
            }}
            className="mb-6"
          />

          {/* Module Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Module Sections</h3>
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
            
            {newModule.sections.map((section, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Section {index + 1}</h4>
                  {newModule.sections.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSection(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        placeholder="Enter section title"
                      />
                    </div>
                    
                    <div>
                      <Label>Section Type</Label>
                      <Select
                        value={section.type}
                        onValueChange={(value) => updateSection(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose section type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">📝 Text Content</SelectItem>
                          <SelectItem value="story">📚 Interactive Story</SelectItem>
                          <SelectItem value="example">💡 Real-World Examples</SelectItem>
                          <SelectItem value="matching">🔗 Matching Exercise</SelectItem>
                          <SelectItem value="scenario">🎯 Scenario Decision</SelectItem>
                          <SelectItem value="triage">🚦 Priority Sorting</SelectItem>
                          <SelectItem value="quiz">❓ Quiz Assessment</SelectItem>
                          <SelectItem value="video">🎥 Video Learning</SelectItem>
                          <SelectItem value="mnemonic">🎵 Memory Device Builder</SelectItem>
                          <SelectItem value="simulation">🎭 Role-Play Simulation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Text Content Template */}
                  {section.type === 'text' && (
                    <TextSectionBuilder
                      content={section.content}
                      onContentChange={(updatedContent) => {
                        // Update the section with the new content structure
                        const updatedSections = [...newModule.sections];
                        updatedSections[index] = {
                          ...updatedSections[index],
                          content: updatedContent
                        };
                        const updatedModule = { ...newModule, sections: updatedSections };
                        setNewModule(updatedModule);
                        
                        // Auto-save immediately when content changes
                        handleContentChange(updatedContent, index);
                      }}
                      isEditing={true}
                      onEditToggle={() => {}}
                    />
                  )}

                  {/* Interactive Story Template */}
                  {section.type === 'story' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Story Setup</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Set up your interactive story with characters, setting, and situation..."
                          rows={4}
                        />
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-purple-800">AI Story Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => generateStoryContent(index)}
                            disabled={generatingContent === index}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {generatingContent === index ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generate Story
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-purple-700">
                          AI will create an engaging interactive story with characters, setting, and decision points for {newModule.title || 'your topic'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Real-World Examples Template */}
                  {section.type === 'example' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Example Scenarios</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Provide real-world examples that illustrate the concept..."
                          rows={4}
                        />
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">AI Example Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => generateExampleContent(index)}
                            disabled={generatingContent === index}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            {generatingContent === index ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Lightbulb className="h-3 w-3 mr-1" />
                                Generate Examples
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-yellow-700">
                          AI will create practical real-world examples that illustrate {newModule.title || 'your concept'} in action.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Matching Exercise Template */}
                  {section.type === 'matching' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Link2 className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-800">Interactive Matching Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('matching', index)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-blue-700">
                          Create interactive matching activities with AI generation and manual editing capabilities.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-blue-600">
                            Activity configured with {section.builderData.pairs?.length || 0} matching pairs
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scenario Decision Template */}
                  {section.type === 'scenario' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800">Scenario-Based Learning Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('scenario', index)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-green-700">
                          Create realistic decision-making scenarios with multiple options, feedback, and branching paths.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-green-600">
                            Activity configured with {section.builderData.scenarios?.length || 0} scenarios
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priority Sorting Template */}
                  {section.type === 'triage' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">Triage & Priority Assessment Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('triage', index)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-red-700">
                          Create prioritization scenarios with urgent, high, medium, and low priority items.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-red-600">
                            Activity configured with {section.builderData.items?.length || 0} triage items
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz Template */}
                  {section.type === 'quiz' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Quiz Instructions</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Instructions for this quiz section..."
                          rows={2}
                        />
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-purple-800">AI Quiz Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => generateQuizContent(index)}
                            disabled={generatingContent === index}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {generatingContent === index ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <HelpCircle className="h-3 w-3 mr-1" />
                                Generate Quiz
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-purple-700">
                          AI will create quiz questions to assess understanding for {newModule.title || 'your topic'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mnemonic Device Builder Template */}
                  {section.type === 'mnemonic' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-pink-600 mr-2" />
                            <span className="text-sm font-medium text-pink-800">Memory Techniques Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('mnemonic', index)}
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-pink-700">
                          Create memorable devices like acronyms, songs, rhymes, and visual associations to help learners remember key information.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-pink-600">
                            Activity configured with {section.builderData.devices?.length || 0} memory techniques
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Role-Play Simulation Template */}
                  {section.type === 'simulation' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Gamepad className="h-4 w-4 text-indigo-600 mr-2" />
                            <span className="text-sm font-medium text-indigo-800">Interactive Simulation Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('simulation', index)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-indigo-700">
                          Create immersive role-playing simulations with decision points, branching paths, and realistic scenarios.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-indigo-600">
                            Activity configured with {section.builderData.steps?.length || 0} simulation steps
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Real-World Examples Template */}
                  {section.type === 'example' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Lightbulb className="h-4 w-4 text-amber-600 mr-2" />
                            <span className="text-sm font-medium text-amber-800">Examples & Case Studies Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('example', index)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-amber-700">
                          Create real-world examples with good vs poor practices, explanations, and key takeaways.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-amber-600">
                            Activity configured with {section.builderData.examples?.length || 0} examples
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Slide Presentation Template */}
                  {section.type === 'slide' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-cyan-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-cyan-600 mr-2" />
                            <span className="text-sm font-medium text-cyan-800">Interactive Slide Presentation Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('slide', index)}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-cyan-700">
                          Create interactive slide presentations with navigation, animations, and engagement features.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-cyan-600">
                            Activity configured with {section.builderData.slides?.length || 0} slides
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scenario Match Template */}
                  {section.type === 'scenario-match' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-emerald-600 mr-2" />
                            <span className="text-sm font-medium text-emerald-800">Scenario Matching Builder</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBuilder('scenario-match', index)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Open Builder
                          </Button>
                        </div>
                        <p className="text-sm text-emerald-700">
                          Create scenario-based matching activities where learners connect situations with appropriate responses.
                        </p>
                        {section.builderData && (
                          <div className="mt-2 text-xs text-emerald-600">
                            Activity configured with {section.builderData.pairs?.length || 0} scenario pairs
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Podcast Template */}
                  {section.type === 'podcast' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Podcast Description</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="What topics should this podcast episode cover..."
                          rows={3}
                        />
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700">
                          🎧 AI will generate a conversational podcast script and audio file for this section.
                        </p>
                      </div>
                    </div>
                  )}



                  {/* Video Template */}
                  {section.type === 'video' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Video Description</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Describe what this video should demonstrate..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Video Selection</Label>
                        <div className="space-y-3">
                          {/* Current Video Display */}
                          {section.videoUrl ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-green-800">Video Selected</div>
                                  <div className="text-xs text-green-600 truncate max-w-md">{section.videoUrl}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVideoForSection(index);
                                    setShowVideoSearch(true);
                                    setVideoSearchQuery(newModule.title || '');
                                  }}
                                  className="border-green-300 text-green-700 hover:bg-green-100"
                                >
                                  Change Video
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedVideoForSection(index);
                                setShowVideoSearch(true);
                                setVideoSearchQuery(newModule.title || '');
                              }}
                              className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 py-6"
                            >
                              <Search className="h-5 w-5 mr-2" />
                              Find Video for This Section
                            </Button>
                          )}
                          
                          {/* AI Video Generation */}
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-purple-800">AI Video Generation</div>
                              <div className="text-xs text-purple-600">Create a custom training video with Veo AI</div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => generateAiVideo(index)}
                              disabled={generatingVideo === index || !newModule.title || !newModule.description}
                              className="ml-3 border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              {generatingVideo === index ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {videoGenerationStatus[index] === 'starting' && 'Starting...'}
                                  {videoGenerationStatus[index] === 'processing' && 'Creating...'}
                                </>
                              ) : (
                                <>
                                  <Video className="h-4 w-4 mr-2" />
                                  Generate Video
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {videoGenerationStatus[index] && (
                            <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                              Status: {videoGenerationStatus[index] === 'starting' && 'Initializing video generation...'}
                              {videoGenerationStatus[index] === 'processing' && 'AI is creating your video (this may take 2-3 minutes)...'}
                              {videoGenerationStatus[index] === 'completed' && 'Video generated and added successfully!'}
                              {videoGenerationStatus[index] === 'failed' && 'Generation failed. Please try again.'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`generateQuestions-${index}`}
                          checked={section.generateVideoQuestions || false}
                          onChange={(e) => updateSection(index, 'generateVideoQuestions', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`generateQuestions-${index}`} className="text-sm text-blue-700 cursor-pointer">
                          🤖 Generate quiz questions automatically from this video content
                        </Label>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          🎥 Add your video URL above. When you check the box, AI will analyze the video and create relevant quiz questions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateModule}
              disabled={isCreatingModule || !newModule.title || !newModule.description}
              className="px-8"
            >
              {isCreatingModule ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Module...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Module
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Module Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Module Management</CardTitle>
              <CardDescription>Manage visibility and edit existing modules</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loading Modules</h3>
                <p className="text-gray-600">Please wait while we fetch all modules...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Modules</h3>
                <p className="text-gray-600 mb-4">There was a problem fetching the modules. Please try again later.</p>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/modules'] })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/modules'] })}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  Refresh List
                </Button>
              </div>
              {filteredModules.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No modules found. Create your first module to get started!</p>
                </div>
              ) : (
                filteredModules.map((module: Module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline">{module.category}</Badge>
                            <Badge variant={
                              module.difficulty === 'beginner' ? 'default' : 
                              module.difficulty === 'intermediate' ? 'secondary' : 
                              'destructive'
                            }>
                              {module.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-500">{module.pointValue} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/learning-module/${module.id}`)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <div className="flex items-center space-x-2">
                        {module.is_visible ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> 
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" /> 
                            Hidden
                          </Badge>
                        )}
                        <Switch
                          checked={module.is_visible}
                          onCheckedChange={() => handleVisibilityChange(module.id, module.is_visible)}
                          disabled={updateVisibilityMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-by-Step Voice Workshop */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            Voice Workshop - Step 1: Basic Voice Generation
            <Badge variant="secondary" className="bg-blue-500 text-white">
              Getting Started
            </Badge>
          </CardTitle>
          <CardDescription>
            Let's start with the fundamentals. First, we'll generate a simple voice message to test the basic functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Voice Test */}
          <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              Test Basic Voice Generation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to generate a welcome message using our AI voice technology.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded border">
                <p className="text-sm mb-3"><strong>Text to generate:</strong></p>
                <p className="italic">"Welcome to our advanced multilingual learning platform. This is a demonstration of AI-powered voice generation."</p>
              </div>
              <Button 
                onClick={() => generateQuickVoice("Welcome to our advanced multilingual learning platform. This is a demonstration of AI-powered voice generation.", "en")}
                className="w-full"
                size="lg"
              >
                <Mic className="h-4 w-4 mr-2" />
                Generate Welcome Message
              </Button>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">What happens when you click:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>The text is sent to ElevenLabs AI voice service</li>
              <li>AI generates high-quality speech audio</li>
              <li>Audio automatically plays in your browser</li>
              <li>You'll see a success notification</li>
            </ol>
          </div>

          {/* Next Step Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Coming up in Step 2:</h4>
            <p className="text-sm text-muted-foreground">
              We'll explore multilingual capabilities by generating the same message in Spanish, French, and Japanese.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Video Search Dialog */}
      {showVideoSearch && (
        <Dialog open={showVideoSearch} onOpenChange={setShowVideoSearch}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Find Video for Your Module</DialogTitle>
              <DialogDescription>
                Search our video library, find videos on YouTube, or add your own video link
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Search Input */}
              <div className="flex space-x-2">
                <Input
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="Search for videos about your topic..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleVideoSearch()}
                />
                <Button 
                  onClick={handleVideoSearch}
                  disabled={isSearchingVideos || isSearchingYoutube || !videoSearchQuery.trim()}
                >
                  {(isSearchingVideos || isSearchingYoutube) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {/* Custom URL Input */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Add Custom Video URL</h3>
                <div className="flex space-x-2">
                  <Input
                    value={customVideoUrl}
                    onChange={(e) => setCustomVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={addCustomVideoUrl}
                    disabled={!customVideoUrl.trim()}
                    variant="outline"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </div>
              </div>

              {/* Video Library Results */}
              {videoSearchResults.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-blue-800">Video Library Results ({videoSearchResults.length})</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {videoSearchResults.map((video, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {video.thumbnail && (
                              <img src={video.thumbnail} alt={video.title} className="w-20 h-14 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-blue-900 mb-1">{video.title}</h4>
                              <p className="text-xs text-blue-700 mb-1">{video.category}</p>
                              <p className="text-xs text-gray-500">Library Video • {video.duration || 'Duration unknown'}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="ml-3 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                            onClick={() => selectVideoForSection(video.url, video.title)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Video
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Results */}
              {youtubeSearchResults.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-red-600">YouTube Results ({youtubeSearchResults.length})</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {youtubeSearchResults.map((video, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {video.thumbnail && (
                              <img src={video.thumbnail} alt={video.title} className="w-20 h-14 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-red-900 mb-1">{video.title}</h4>
                              <p className="text-xs text-red-700 mb-1">By {video.channelTitle || video.channel}</p>
                              <p className="text-xs text-gray-500">
                                YouTube • 
                                <a 
                                  href={video.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View on YouTube
                                </a>
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="ml-3 bg-red-600 hover:bg-red-700 text-white flex-shrink-0"
                            onClick={() => selectVideoForSection(video.url, video.title)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Video
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {videoSearchQuery && videoSearchResults.length === 0 && youtubeSearchResults.length === 0 && 
               !isSearchingVideos && !isSearchingYoutube && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No videos found for "{videoSearchQuery}"</p>
                  <p className="text-sm">Try different search terms or add a custom URL above</p>
                </div>
              )}

              {/* Search Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Search Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use specific terms like "classroom management" or "early literacy"</li>
                  <li>• Include age groups: "preschool", "toddler", "kindergarten"</li>
                  <li>• Try topic keywords: "social emotional learning", "STEM activities"</li>
                  <li>• Use educator terms: "ECE", "developmentally appropriate", "scaffolding"</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Flashcard Preview Dialog */}
      {showFlashcardPreview && (
        <Dialog open={showFlashcardPreview} onOpenChange={setShowFlashcardPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Generated Flashcards</DialogTitle>
              <DialogDescription>
                Review the {generatedFlashcards.length} flashcards before adding them to your section
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {generatedFlashcards.map((card, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-700 mb-2">{card.term}</h4>
                      <p className="text-gray-700">{card.definition}</p>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFlashcardPreview(false);
                  setGeneratedFlashcards([]);
                }}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Regenerate flashcards
                    setShowFlashcardPreview(false);
                    setGeneratedFlashcards([]);
                    generateFlashcards();
                  }}
                >
                  Regenerate
                </Button>
                <Button
                  onClick={() => {
                    // Apply flashcards to section
                    const currentSection = newModule.sections[currentSectionIndex];
                    if (currentSection) {
                      const flashcardQuestions = generatedFlashcards.map((card: any) => ({
                        question: `What is the definition of: ${card.term}?`,
                        answers: [
                          card.definition,
                          "This is an incorrect definition",
                          "This is another incorrect definition", 
                          "This is also incorrect"
                        ],
                        correctAnswer: 0,
                        explanation: `${card.term}: ${card.definition}`
                      }));
                      
                      setNewModule(prev => ({
                        ...prev,
                        sections: prev.sections.map((section, index) => 
                          index === currentSectionIndex 
                            ? { 
                                ...section, 
                                type: 'quiz' as const,
                                questions: flashcardQuestions,
                                content: `This section contains ${generatedFlashcards.length} interactive flashcards to help you learn key terms and definitions.`
                              }
                            : section
                        )
                      }));
                      
                      toast({
                        title: "Flashcards Applied",
                        description: `Added ${generatedFlashcards.length} interactive flashcards to this section`,
                      });
                    }
                    
                    setShowFlashcardPreview(false);
                    setGeneratedFlashcards([]);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Apply to Section
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Module Publishing Dialog */}
      <ModulePublishingDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        module={{
          id: isEditMode ? editModuleId : undefined,
          title: newModule.title,
          description: newModule.description,
          category: newModule.category,
          difficulty: newModule.difficulty,
          estimatedTime: newModule.estimatedTime,
          customPoints: newModule.customPoints,
          shareWithCommunity: newModule.shareWithCommunity,
          moduleType: "deep-dive",
          sections: newModule.sections,
          courseStructure: { modules: [], totalDuration: 0, prerequisites: [] },
          interactiveElements: { hasQuizzes: false, hasSimulations: false, hasDiscussions: false },
          certificationSystem: { enabled: false, passingScore: 80, certificateTemplate: null }
        }}
        onPublishSuccess={() => {
          toast({
            title: isEditMode ? "Module Updated Successfully!" : "Module Published Successfully!",
            description: isEditMode ? "Your changes have been saved." : "Your module has been saved and distributed.",
          });
          // Navigate back to dashboard after successful publish
          navigate('/');
        }}
      />

      {/* Draft Manager Dialog */}
      <Dialog open={showDraftManager} onOpenChange={setShowDraftManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Load Saved Draft
            </DialogTitle>
            <DialogDescription>
              Continue working on a previously saved module draft
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingDraft ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading draft...</span>
              </div>
            ) : drafts && drafts.length > 0 ? (
              <div className="space-y-3">
                {drafts.map((draft: any) => (
                  <div key={draft.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{draft.name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Method: {draft.creation_method === 'manual' ? 'Manual Creation' : 'AI-Assisted'}</div>
                          <div>Last updated: {new Date(draft.updated_at).toLocaleDateString()}</div>
                          {draft.module_data?.sections && (
                            <div>Sections: {draft.module_data.sections.length}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => loadDraft(draft.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDraft(draft.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No saved drafts found</p>
                <p className="text-sm">Create and save a module to see your drafts here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Specialized Builder Components */}
      {activeBuilder === 'scenario-match' && currentBuilderSection !== null && (
        <ScenarioMatchBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'slide' && currentBuilderSection !== null && (
        <SlideBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'example' && currentBuilderSection !== null && (
        <ExampleBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'matching' && currentBuilderSection !== null && (
        <MatchingBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'scenario' && currentBuilderSection !== null && (
        <ScenarioBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'triage' && currentBuilderSection !== null && (
        <TriageBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'mnemonic' && currentBuilderSection !== null && (
        <MnemonicBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'simulation' && currentBuilderSection !== null && (
        <SimulationBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {activeBuilder === 'activity' && currentBuilderSection !== null && (
        <ActivityBuilder
          moduleTitle={newModule.title}
          moduleDescription={newModule.description}
          sectionTitle={newModule.sections[currentBuilderSection]?.title || ''}
          onSave={saveBuilderData}
          onCancel={closeBuilder}
          initialData={builderData}
        />
      )}

      {/* Assessment Required Dialog */}
      <AssessmentRequiredDialog 
        isOpen={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
      />

      {/* Edit Mode Action Bar */}
      {isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Editing: {newModule.title}
              </Badge>
              <span className="text-sm text-gray-600">
                {newModule.sections.length} sections • Last saved: Auto-draft
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/modules')}
                className="border-gray-300"
              >
                Cancel Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/modules/${editModuleId}`)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={updateExistingModule}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}