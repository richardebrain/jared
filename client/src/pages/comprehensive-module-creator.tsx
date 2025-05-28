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
  MessageSquare
} from 'lucide-react';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
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
        imageUrl: ''
      }
    ]
  });
  
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
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
      description: 'Conversational audio content with transcripts',
      icon: Mic,
      color: 'bg-pink-50 border-pink-200',
      duration: '7-12 minutes',
      features: ['Audio script', 'Conversation flow', 'Key insights', 'Reflection prompts']
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
          promptText = `Write a podcast-style audio script for "${newModule.title}" in ${newModule.category} for ${newModule.difficulty} level ECE teachers. Include: conversational script, key insights, discussion topics, and reflection prompts.`;
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
    
    // Parse the generated content and add it to sections
    const contentLines = generatedContent.content.split('\n').filter(Boolean);
    const newSections = [];
    
    let currentSection = { title: '', content: '', videoUrl: '', imageUrl: '' };
    
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
          imageUrl: '' 
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
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      
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
  
  // Handle module creation
  const handleCreateModule = () => {
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

    // Calculate points
    const suggestedPoints = calculateSuggestedPoints(newModule.difficulty, newModule.estimatedTime);
    const finalPoints = newModule.customPoints ? parseInt(newModule.customPoints) : suggestedPoints;

    const moduleData = {
      ...newModule,
      pointValue: finalPoints,
      sections: newModule.sections.filter(section => 
        section.title.trim() || section.content.trim() || section.videoUrl.trim()
      )
    };

    setIsCreatingModule(true);
    createModuleMutation.mutate(moduleData);
  };

  // Add section to module
  const addSection = () => {
    setNewModule(prev => ({
      ...prev,
      sections: [...prev.sections, {
        title: '',
        content: '',
        videoUrl: '',
        imageUrl: ''
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
    queryKey: ['/api/modules/management']
  });

  // Update module visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ moduleId, visible }: { moduleId: number, visible: boolean }) => {
      return await apiRequest('PATCH', `/api/modules/${moduleId}/visibility`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Creator</h1>
          <p className="text-gray-600 mt-2">Create and manage custom learning modules with AI assistance</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Button>
      </div>

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
                  <div>
                    <Label>Section Title</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                      placeholder="Enter section title"
                    />
                  </div>
                  
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
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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