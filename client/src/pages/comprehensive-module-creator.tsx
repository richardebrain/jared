import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
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
  X,
  ChevronRight,
  Wand2
} from 'lucide-react';
import StepByStepModuleBuilder from '@/components/StepByStepModuleBuilder';
import PowerPointImporter from '@/components/PowerPointImporter';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  type: 'text' | 'quiz' | 'scenario-match' | 'podcast' | 'slide' | 'video';
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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [showStepByStepBuilder, setShowStepByStepBuilder] = useState(false);
  const [showPowerPointImport, setShowPowerPointImport] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [creationMethod, setCreationMethod] = useState<'selection' | 'stepByStep' | 'powerPoint' | 'manual'>('selection');
  
  // Module Creator state - comprehensive version
  const [newModule, setNewModule] = useState({
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
        imageUrl: '',
        type: 'text' as const
      }
    ]
  });
  
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [generatingContent, setGeneratingContent] = useState<number | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState<number | null>(null);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<{[key: number]: string}>({});

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
      const newSection = {
        title: 'Knowledge Check Quiz',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'quiz' as const
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'interactive-scenario') {
      // Create a scenario match section
      const newSection = {
        title: 'Interactive Scenario',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'scenario-match' as const
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'podcast-audio') {
      // Create a podcast section
      const newSection = {
        title: 'Podcast Discussion',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'podcast' as const
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else if (templateId === 'slide-storyboard') {
      // Create a slide section
      const newSection = {
        title: 'Slide Presentation',
        content: content,
        videoUrl: '',
        imageUrl: '',
        type: 'slide' as const
      };
      
      setNewModule(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    } else {
      // For other templates, parse as regular text sections
      const contentLines = content.split('\n').filter(Boolean);
      const newSections = [];
      
      let currentSection = { title: '', content: '', videoUrl: '', imageUrl: '', type: 'text' as const };
      
      contentLines.forEach((line, index) => {
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
            type: 'text' as const
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
    setSelectedTemplate(null);
    
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      
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
      
      let successMessage = "Your custom module has been created successfully.";
      
      // Handle community sharing response
      if (newModule.shareWithCommunity && data?.competitionInfo) {
        successMessage += ` ${data.competitionInfo.message}`;
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

  // Add section to module
  const addSection = () => {
    setNewModule(prev => ({
      ...prev,
      sections: [...prev.sections, {
        title: '',
        content: '',
        videoUrl: '',
        imageUrl: '',
        type: 'text' as const
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

  // Fetch all modules including hidden ones
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules']
  });

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
        {/* AI Step-by-Step Builder */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300">
          <CardContent className="p-6 text-center" onClick={() => setCreationMethod('stepByStep')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Step-by-Step Builder</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build your module one section at a time with AI assistance. Perfect for creating structured, engaging content with 10 different learning section types.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Stories, scenarios, matching exercises
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Triage situations and simulations
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                AI-generated content for each section
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Start Building
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Module Creator</h1>
          <p className="text-gray-600 mt-2">Create engaging learning modules with AI assistance and professional templates</p>
        </div>
        <div className="flex gap-3">
          {creationMethod === 'manual' && (
            <Button
              onClick={() => setCreationMethod('selection')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Change Creation Method
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>
      </div>

      {creationMethod === 'selection' ? renderCreationMethodSelection() : null}

      {/* Module Creation Form */}
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
                Custom Points 
                <span className="text-sm text-gray-500 ml-1">
                  (Suggested: {calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime)})
                </span>
              </Label>
              <Input
                id="customPoints"
                type="number"
                value={newModule.customPoints}
                onChange={(e) => setNewModule(prev => ({ ...prev, customPoints: e.target.value }))}
                placeholder={calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime).toString()}
              />
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
                    selectedTemplate === template.id ? 'ring-2 ring-purple-500 bg-purple-50' : template.color
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
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
            {selectedTemplate && (
              <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center">
                    {React.createElement(moduleTemplates.find(t => t.id === selectedTemplate)?.icon || BookOpen, { className: "h-4 w-4 mr-2" })}
                    {moduleTemplates.find(t => t.id === selectedTemplate)?.title}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  AI will generate: {moduleTemplates.find(t => t.id === selectedTemplate)?.features.join(', ')}
                </div>
                <Button
                  onClick={() => generateTemplateContent(selectedTemplate)}
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
                      Generate {moduleTemplates.find(t => t.id === selectedTemplate)?.title} Content
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
                    <>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Enter section content..."
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Video URL (optional)</Label>
                          <Input
                            value={section.videoUrl}
                            onChange={(e) => updateSection(index, 'videoUrl', e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                        <div>
                          <Label>Image URL (optional)</Label>
                          <Input
                            value={section.imageUrl}
                            onChange={(e) => updateSection(index, 'imageUrl', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </>
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
                        <div className="flex items-center mb-2">
                          <Heart className="h-4 w-4 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-purple-800">Story Elements</span>
                        </div>
                        <p className="text-sm text-purple-700">
                          Create an engaging narrative that teaches through character experiences and decisions. AI can help generate story elements based on your content.
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
                        <div className="flex items-center mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">Example Builder</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Share concrete examples from your experience or industry best practices. Show how concepts apply in real situations.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Matching Exercise Template */}
                  {section.type === 'matching' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Matching Instructions</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Explain what learners should match (terms to definitions, problems to solutions, etc.)..."
                          rows={3}
                        />
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Link className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">Matching Activity</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Create connections between concepts, terms, and definitions. AI can generate matching pairs based on your topic.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scenario Decision Template */}
                  {section.type === 'scenario' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Scenario Description</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Describe a realistic scenario where learners must make decisions..."
                          rows={4}
                        />
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Brain className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Decision Making</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Present challenging situations where learners practice decision-making skills. Include multiple options with feedback for each choice.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Priority Sorting Template */}
                  {section.type === 'triage' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Triage Instructions</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Describe how to prioritize items (urgent/important, high/medium/low, etc.)..."
                          rows={3}
                        />
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Target className="h-4 w-4 text-red-600 mr-2" />
                          <span className="text-sm font-medium text-red-800">Priority Training</span>
                        </div>
                        <p className="text-sm text-red-700">
                          Help learners practice prioritization skills by sorting items based on urgency, importance, or other criteria.
                        </p>
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
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Quiz questions will be generated using AI when you create the module, or you can add them manually later.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mnemonic Device Builder Template */}
                  {section.type === 'mnemonic' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Memory Content</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Enter the information learners need to memorize (steps, lists, key points)..."
                          rows={4}
                        />
                      </div>
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <div className="flex items-center mb-3">
                          <Music className="h-5 w-5 text-pink-600 mr-2" />
                          <span className="text-sm font-medium text-pink-800">Fun Memory Device Builder</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <button 
                            onClick={() => generateMnemonicDevice(index, 'song')}
                            className="p-2 text-xs bg-white rounded border border-pink-200 hover:bg-pink-50 text-pink-700 transition-colors"
                          >
                            🎵 Funny Song
                          </button>
                          <button 
                            onClick={() => generateMnemonicDevice(index, 'rap')}
                            className="p-2 text-xs bg-white rounded border border-pink-200 hover:bg-pink-50 text-pink-700 transition-colors"
                          >
                            🎤 Catchy Rap
                          </button>
                          <button 
                            onClick={() => generateMnemonicDevice(index, 'poem')}
                            className="p-2 text-xs bg-white rounded border border-pink-200 hover:bg-pink-50 text-pink-700 transition-colors"
                          >
                            📝 Funny Poem
                          </button>
                          <button 
                            onClick={() => generateMnemonicDevice(index, 'acronym')}
                            className="p-2 text-xs bg-white rounded border border-pink-200 hover:bg-pink-50 text-pink-700 transition-colors"
                          >
                            🔤 Acronym
                          </button>
                        </div>
                        <p className="text-sm text-pink-700">
                          AI will create fun, memorable devices like poems, raps, songs, or acronyms to help learners remember important information. Perfect for procedures, safety steps, or key concepts!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Role-Play Simulation Template */}
                  {section.type === 'simulation' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Simulation Setup</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Describe the role-play scenario, characters, and objectives..."
                          rows={4}
                        />
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Users className="h-4 w-4 text-indigo-600 mr-2" />
                          <span className="text-sm font-medium text-indigo-800">Interactive Simulation</span>
                        </div>
                        <p className="text-sm text-indigo-700">
                          Create immersive role-playing experiences where learners practice skills in realistic situations. Include character roles and interaction guidelines.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scenario Match Template */}
                  {section.type === 'scenario-match' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-blue-600 font-semibold">Scenarios (Left Column)</Label>
                          <Textarea
                            value={section.content?.scenarios || ''}
                            onChange={(e) => {
                              const currentContent = section.content || {};
                              updateSection(index, 'content', {
                                ...currentContent,
                                scenarios: e.target.value
                              });
                            }}
                            placeholder="Enter scenarios, one per line:&#10;&#10;A child is having a meltdown during circle time&#10;Two children are fighting over a toy&#10;A shy child won't participate in group activities"
                            rows={6}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-green-600 font-semibold">Response Options (Right Column)</Label>
                          <Textarea
                            value={section.content?.responses || ''}
                            onChange={(e) => {
                              const currentContent = section.content || {};
                              updateSection(index, 'content', {
                                ...currentContent,
                                responses: e.target.value
                              });
                            }}
                            placeholder="Enter response options, one per line:&#10;&#10;Offer a calm-down corner with sensory tools&#10;Implement a sharing timer system&#10;Use gentle encouragement and offer choices"
                            rows={6}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          onClick={() => generateScenarioMatchContent(index)}
                          disabled={generatingContent === index}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {generatingContent === index ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              AI Thinking...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Scenarios & Responses
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          🎯 AI will create an interactive matching game where teachers drag scenarios to their best response options. Each line becomes a separate item to match.
                        </p>
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

                  {/* Slide Template */}
                  {section.type === 'slide' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Slide Content Overview</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          placeholder="Outline the key points for this slide presentation..."
                          rows={3}
                        />
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-700">
                          📊 AI will create a complete slide deck with presenter notes and visual suggestions.
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
                        <Label>Video URL</Label>
                        <div className="space-y-3">
                          <Input
                            value={section.videoUrl}
                            onChange={(e) => updateSection(index, 'videoUrl', e.target.value)}
                            placeholder="https://youtube.com/watch?v=... or generate with AI"
                          />
                          
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
    </div>
  );
}