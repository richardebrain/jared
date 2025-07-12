import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CloudinaryMarkdownEditor from '@/components/CloudinaryMarkdownEditor';
import '@uiw/react-markdown-preview/markdown.css';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  ArrowLeft,
  FileEdit,
  Plus,
  Save,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Video,
  Users,
  FileText,
  Mic,
  MessageSquare,
  Lightbulb,
  Brain,
  Link,
  Zap,
  Gamepad,
  Play,
  HelpCircle,
  BookOpen,
  Clock,
  Type,
  Edit,
  AlertTriangle
} from 'lucide-react';

// Import reusable section handlers
import ExampleSectionHandler from '@/components/ExampleSectionHandler';
import QuizSectionBuilder from "@/components/SectionBuilders/QuizSectionBuilder";
import MatchingSectionBuilder from "@/components/SectionBuilders/MatchingSectionBuilder";
import ScenarioMatchSectionBuilder from "@/components/SectionBuilders/ScenarioMatchSectionBuilder";
import VideoSectionBuilder from "@/components/SectionBuilders/VideoSectionBuilder";
import TextSectionBuilder from "@/components/SectionBuilders/TextSectionBuilder";

const moduleTemplates = [
  {
    id: 'mini-video',
    title: 'Mini Video Lessons',
    description: 'Short, focused video content with key takeaways',
    icon: Video,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'interactive-scenario',
    title: 'Interactive Scenarios',
    description: 'Real-world situations with decision-making branches',
    icon: Users,
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'slide-storyboard',
    title: 'Slide/GIF Storyboards',
    description: 'Visual learning with animated content',
    icon: FileText,
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'quiz-teachback',
    title: 'Quick Quiz + Teachback',
    description: 'Knowledge check with teaching reinforcement',
    icon: CheckCircle2,
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'podcast-audio',
    title: 'Podcast-Style Audio',
    description: 'AI-generated engaging conversations',
    icon: Mic,
    color: 'bg-pink-50 border-pink-200'
  },
  {
    id: 'roleplay-reels',
    title: 'Roleplay Reels',
    description: 'Short practice scenarios with role-playing',
    icon: MessageSquare,
    color: 'bg-indigo-50 border-indigo-200'
  }
];

const sectionTypes = [
  { type: 'text', icon: FileText, title: 'Text Content', description: 'Written educational content' },
  { type: 'video', icon: Play, title: 'Video Content', description: 'Video resources with questions' },
  { type: 'quiz', icon: HelpCircle, title: 'Knowledge Quiz', description: 'Assessment questions' },
  { type: 'story', icon: BookOpen, title: 'Story/Scenario', description: 'Engaging narratives' },
  { type: 'example', icon: Lightbulb, title: 'Examples', description: 'Real-world examples' },
  { type: 'matching', icon: Link, title: 'Matching Exercise', description: 'Interactive matching' },
  { type: 'scenario', icon: Users, title: 'Scenario Practice', description: 'Practice scenarios' },
  { type: 'triage', icon: Zap, title: 'Decision Triage', description: 'Quick decision-making' },
  { type: 'mnemonic', icon: Brain, title: 'Memory Aids', description: 'Memory devices' },
  { type: 'simulation', icon: Gamepad, title: 'Interactive Simulation', description: 'Hands-on practice' }
];

interface ModuleSection {
  id: string;
  title: string;
  content: string;
  type: string;
  duration: number;
  videoUrl?: string;
  imageUrl?: string;
}

type Step = 'template' | 'config' | 'build' | 'preview';

export default function NewModuleManual() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editModuleId = urlParams.get('edit');
  const isEditMode = !!editModuleId;
  
  console.log(`[EDIT MODE] URL: ${window.location.pathname}${window.location.search}`);
  console.log(`[EDIT MODE] Edit module ID: ${editModuleId}, isEditMode: ${isEditMode}`);
  console.log(`[EDIT MODE] Query will be enabled: ${isEditMode && !!editModuleId}`);

  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sections, setSections] = useState<ModuleSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [editingSections, setEditingSections] = useState<{ [key: number]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);

  const [moduleConfig, setModuleConfig] = useState({
    title: '',
    description: '',
    category: 'professional-development',
    difficulty: 'intermediate',
    estimatedTime: '15',
    pointValue: 10,
    shareWithCommunity: false
  });

  // Fetch existing module data if in edit mode
  const { data: existingModule, isLoading: moduleLoading, error: moduleError } = useQuery({
    queryKey: [`/api/modules/${editModuleId}`],
    enabled: isEditMode && !!editModuleId,
    queryFn: async () => {
      const response = await fetch(`/api/modules/${editModuleId}`);
      if (!response.ok) throw new Error('Failed to fetch module');
      return response.json();
    },
  });

  // Log query results
  React.useEffect(() => {
    if (existingModule && isEditMode) {
      console.log(`[EDIT FETCH SUCCESS] Module ${editModuleId} data:`, existingModule);
    }
    if (moduleError && isEditMode) {
      console.error(`[EDIT FETCH ERROR] Failed to fetch module ${editModuleId}:`, moduleError);
    }
  }, [existingModule, moduleError, editModuleId, isEditMode]);

  // Load existing module data when available
  useEffect(() => {
    if (existingModule && isEditMode) {
      const moduleData = existingModule as any;
      const content = typeof moduleData.content === 'string' 
        ? JSON.parse(moduleData.content) 
        : moduleData.content;

      setModuleConfig({
        title: moduleData.title || '',
        description: moduleData.description || '',
        category: moduleData.category || 'professional-development',
        difficulty: moduleData.difficulty || 'intermediate',
        estimatedTime: moduleData.duration?.toString() || '15',
        pointValue: moduleData.pointValue || 10,
        shareWithCommunity: moduleData.isShared || false
      });

      if (content && content.sections) {
        // Parse sections and extract content from nested structures
        const sectionsWithIds = content.sections.map((section: any, index: number) => {
          let extractedContent = '';
          
          // Handle different content structures
          if (section.content) {
            if (typeof section.content === 'string') {
              extractedContent = section.content;
            } else if (section.content.blocks && Array.isArray(section.content.blocks)) {
              // Extract content from blocks structure
              extractedContent = section.content.blocks
                .map((block: any) => block.content || '')
                .join('\n\n');
            } else if (section.content.content) {
              extractedContent = section.content.content;
            }
          }

          return {
            id: section.id || `section-${index}-${Date.now()}`,
            title: section.title || `Section ${index + 1}`,
            content: extractedContent,
            type: section.type || 'text',
            duration: section.duration || 5,
            videoUrl: section.videoUrl || '',
            imageUrl: section.imageUrl || ''
          };
        });
        setSections(sectionsWithIds);
      }

      // Skip template selection and config for edit mode - go directly to build
      setCurrentStep('build');
    }
  }, [existingModule, isEditMode]);

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Show loading state when fetching existing module data
  if (isEditMode && moduleLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading module data...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = moduleTemplates.find(t => t.id === templateId);
    if (template) {
      setModuleConfig(prev => ({
        ...prev,
        title: prev.title || `${template.title} Module`,
        description: prev.description || template.description
      }));
    }
    setCurrentStep('config');
  };

  const handleConfigComplete = () => {
    if (!moduleConfig.title || !moduleConfig.description) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and description.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('build');
  };

  const addSection = (type: string, title: string, duration: number) => {
    const newSection: ModuleSection = {
      id: Date.now().toString(),
      title,
      content: '',
      type,
      duration
    };
    setSections(prev => [...prev, newSection]);
    setCurrentSectionIndex(sections.length);
    setShowAddSectionDialog(false);
    
    toast({
      title: "Section Added",
      description: `${title} has been added to your module.`
    });
  };

  const handleDeleteSection = (sectionIndex: number) => {
    setSectionToDelete(sectionIndex);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSection = () => {
    if (sectionToDelete !== null) {
      const updatedSections = sections.filter((_, index) => index !== sectionToDelete);
      setSections(updatedSections);
      
      // Adjust current section index if needed
      if (currentSectionIndex >= updatedSections.length) {
        setCurrentSectionIndex(Math.max(0, updatedSections.length - 1));
      } else if (currentSectionIndex > sectionToDelete) {
        setCurrentSectionIndex(currentSectionIndex - 1);
      }
    }
    setShowDeleteDialog(false);
    setSectionToDelete(null);
    toast({
      title: "Section Deleted",
      description: "The section has been removed from your module.",
    });
  };

  const updateSection = (sectionIndex: number, updates: Partial<ModuleSection>) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, ...updates }
        : section
    ));
  };

  const toggleSectionEdit = (sectionIndex: number) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case "text":
        return "📝";
      case "example":
        return "💡";
      case "scenario":
        return "🎭";
      case "quiz":
        return "❓";
      case "video":
        return "🎬";
      case "matching":
        return "🔗";
      case "story":
        return "📖";
      case "mnemonic":
        return "🧠";
      case "simulation":
        return "⚡";
      case "triage":
        return "🎯";
      default:
        return "📋";
    }
  };

  const renderSectionBuilder = (section: ModuleSection, index: number) => {
    const isEditing = editingSections[index] !== false;

    const handleContentChange = (updatedContent: any) => {
      updateSection(index, { content: updatedContent });
    };

    const handleEditToggle = () => {
      toggleSectionEdit(index);
    };

    const handleRegenerateAI = () => {
      // For manual builder, we don't have AI regeneration, so this is a no-op
      // or could show a toast message that AI features are not available in manual mode
      toast({
        title: "Manual Mode",
        description: "AI regeneration is not available in manual builder mode. Please edit content manually.",
      });
    };

    // Route to appropriate builder based on section type
    switch (section.type) {
      case "quiz":
        return (
          <QuizSectionBuilder
            key={`quiz-${index}`}
            content={section.content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "matching":
        return (
          <MatchingSectionBuilder
            key={`matching-${index}`}
            content={section.content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "scenario-match":
        return (
          <ScenarioMatchSectionBuilder
            key={`scenario-match-${index}`}
            content={section.content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "video":
        return (
          <VideoSectionBuilder
            key={`video-${index}`}
            content={section.content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
          />
        );

      case "example":
        return (
          <ExampleSectionHandler
            key={`example-${index}`}
            moduleTitle={moduleConfig.title}
            moduleDescription={moduleConfig.description}
            sectionTitle={section.title}
            onSave={(sectionData) => {
              updateSection(index, {
                title: sectionData.title,
                content: sectionData.content || JSON.stringify(sectionData),
                type: sectionData.type,
                duration: sectionData.duration || 10
              });
            }}
          />
        );

      case "text":
      case "scenario":
      case "story":
      case "mnemonic":
      case "simulation":
      case "triage":
      default:
        return (
          <TextSectionBuilder
            key={`text-${index}`}
            content={section.content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );
    }
  };

  const saveModule = async () => {
    if (!moduleConfig.title || sections.length === 0) {
      toast({
        title: "Incomplete Module",
        description: "Please provide a title and at least one section.",
        variant: "destructive"
      });
      return;
    }

    try {
      const moduleData = {
        title: moduleConfig.title,
        description: moduleConfig.description,
        category: moduleConfig.category,
        difficulty: moduleConfig.difficulty,
        estimatedTime: moduleConfig.estimatedTime,
        pointValue: moduleConfig.pointValue,
        shareWithCommunity: moduleConfig.shareWithCommunity,
        sections: sections.map(section => ({
          title: section.title,
          content: section.content,
          type: section.type,
          duration: section.duration,
          videoUrl: section.videoUrl || '',
          imageUrl: section.imageUrl || '',
          activities: []
        }))
      };

      let response;
      if (isEditMode && editModuleId) {
        // Update existing module
        response = await apiRequest(`/api/modules/${editModuleId}`, {
          method: 'PATCH',
          data: moduleData
        });
      } else {
        // Create new module using apiRequest for proper authentication
        response = await apiRequest('/api/modules', {
          method: 'POST',
          data: moduleData
        });
      }

      toast({
        title: isEditMode ? "Module Updated!" : "Module Saved!",
        description: isEditMode ? "Your module has been updated successfully." : "Your manual module has been saved successfully."
      });

      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: isEditMode ? "Update Error" : "Save Error",
        description: isEditMode ? "Failed to update module. Please try again." : "Failed to save module. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileEdit className="h-8 w-8 text-green-600" />
              {isEditMode ? 'Edit Module' : 'Manual Module Builder'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode ? 'Update your module with full control over content' : 'Build your module step-by-step with full control over content'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/new-module-creator')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creator
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className={`flex items-center gap-2 ${currentStep === 'template' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'template' ? 'bg-green-100 text-green-600' : 'bg-gray-100'
            }`}>
              1
            </div>
            <span>Template</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'config' ? 'bg-green-100 text-green-600' : 'bg-gray-100'
            }`}>
              2
            </div>
            <span>Configure</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'build' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'build' ? 'bg-green-100 text-green-600' : 'bg-gray-100'
            }`}>
              3
            </div>
            <span>Build</span>
          </div>
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {currentStep === 'template' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Module Template</CardTitle>
              <CardDescription>
                Select a template structure for your manual module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleTemplates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-green-500' : ''
                      } ${template.color}`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6 text-green-600" />
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Configuration */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Your Module</CardTitle>
              <CardDescription>
                Set up the basic information for your module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Module Title</Label>
                  <Input
                    id="title"
                    value={moduleConfig.title}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter module title..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={moduleConfig.category} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional-development">Professional Development</SelectItem>
                      <SelectItem value="classroom-management">Classroom Management</SelectItem>
                      <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                      <SelectItem value="assessment-strategies">Assessment Strategies</SelectItem>
                      <SelectItem value="parent-communication">Parent Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <CloudinaryMarkdownEditor
                  value={moduleConfig.description}
                  onChange={(value) => setModuleConfig(prev => ({ ...prev, description: value || '' }))}
                  height={120}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={moduleConfig.difficulty} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={moduleConfig.estimatedTime}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <Label htmlFor="pointValue">Point Value</Label>
                  <Select 
                    value={moduleConfig.pointValue.toString()} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, pointValue: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 points (Quick)</SelectItem>
                      <SelectItem value="10">10 points (Standard)</SelectItem>
                      <SelectItem value="15">15 points (Standard)</SelectItem>
                      <SelectItem value="20">20 points (Comprehensive)</SelectItem>
                      <SelectItem value="25">25 points (Comprehensive)</SelectItem>
                      <SelectItem value="30">30 points (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('template')}>
                  Back to Templates
                </Button>
                <Button onClick={handleConfigComplete} className="flex-1">
                  Continue to Builder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Build - Sidebar Layout */}
      {currentStep === 'build' && (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Module Outline */}
          <div className="w-80 flex-shrink-0">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Module Outline</CardTitle>
                <CardDescription className="text-sm">
                  Manual Builder
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`p-3 mx-4 mb-2 rounded-lg border cursor-pointer transition-all ${
                        currentSectionIndex === index
                          ? "bg-green-100 border-green-300"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setCurrentSectionIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                            currentSectionIndex === index
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {section.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {section.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {section.content && section.content.trim() && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(index);
                            }}
                            disabled={sections.length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Section Button */}
                  <div className="mx-4 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => setShowAddSectionDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area - Section Builder */}
          <div className="flex-1 min-w-0">
            <Card className="h-full">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {sections.length > 0 ? (
                        <>
                          Build Section {currentSectionIndex + 1}:{" "}
                          {sections[currentSectionIndex]?.title}
                        </>
                      ) : (
                        "Add Your First Section"
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {sections.length > 0 
                        ? "Add content to this section of your module"
                        : "Start building your module by adding sections"
                      }
                    </CardDescription>
                  </div>
                  {sections.length > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {sections[currentSectionIndex]?.duration || 5} min
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto">
                {sections.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleSectionEdit(currentSectionIndex)}
                          variant="outline"
                          size="sm"
                        >
                          <Type className="h-4 w-4 mr-1" />
                          Edit Content
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      {renderSectionBuilder(sections[currentSectionIndex], currentSectionIndex)}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (currentSectionIndex > 0) {
                            setCurrentSectionIndex(currentSectionIndex - 1);
                          }
                        }}
                        disabled={currentSectionIndex === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous Section
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Save className="h-4 w-4 mr-2" />
                          Save Section
                        </Button>
                        <Button
                          onClick={() => {
                            if (currentSectionIndex < sections.length - 1) {
                              setCurrentSectionIndex(currentSectionIndex + 1);
                            } else {
                              setCurrentStep("preview");
                            }
                          }}
                          disabled={currentSectionIndex >= sections.length - 1}
                        >
                          {currentSectionIndex === sections.length - 1
                            ? "Preview Module"
                            : "Save & Next Section"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FileEdit className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Sections Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start building your module by adding your first section
                    </p>
                    <Button
                      onClick={() => setShowAddSectionDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {currentStep === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Preview</CardTitle>
              <CardDescription>
                Review your manual module before saving it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {moduleConfig.title}
                </h3>
                <p className="text-gray-700 mb-4">
                  {moduleConfig.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <div className="text-gray-800 capitalize">
                      {moduleConfig.category.replace("-", " ")}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Difficulty:</span>
                    <div className="text-gray-800 capitalize">
                      {moduleConfig.difficulty}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sections:</span>
                    <div className="text-gray-800">
                      {sections.length} sections
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Module Sections:</h4>
                {sections.map((section, index) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{section.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {section.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {section.duration}m
                      </Badge>
                      {section.content && section.content.trim() && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                    {section.content && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {section.content.substring(0, 150) + "..."}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("build")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Builder
                </Button>
                <Button
                  onClick={saveModule}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Module' : 'Save Module'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section Deletion Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Section</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{sections[sectionToDelete || 0]?.title}"? 
              All content for this section will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSectionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSection}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Dialog */}
      {showAddSectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Section</h3>
            <AddSectionForm
              onAdd={(type, title, duration) => {
                addSection(type, title, duration);
                setShowAddSectionDialog(false);
              }}
              onCancel={() => setShowAddSectionDialog(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Add Section Form Component
function AddSectionForm({ onAdd, onCancel }: {
  onAdd: (type: string, title: string, duration: number) => void;
  onCancel: () => void;
}) {
  const [sectionType, setSectionType] = useState('text');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDuration, setSectionDuration] = useState(5);

  const sectionTypes = [
    { value: 'text', label: 'Text Content' },
    { value: 'video', label: 'Video Section' },
    { value: 'quiz', label: 'Quiz/Assessment' },
    { value: 'matching', label: 'Matching Activity' },
    { value: 'scenario', label: 'Scenario Practice' },
    { value: 'example', label: 'Examples' },
    { value: 'story', label: 'Story/Case Study' },
    { value: 'triage', label: 'Triage Activity' },
    { value: 'mnemonic', label: 'Memory Techniques' },
    { value: 'simulation', label: 'Simulation' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sectionTitle.trim()) {
      onAdd(sectionType, sectionTitle.trim(), sectionDuration);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Section Type</label>
        <select
          value={sectionType}
          onChange={(e) => setSectionType(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          {sectionTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Section Title</label>
        <input
          type="text"
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
          placeholder="Enter section title..."
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
        <input
          type="number"
          value={sectionDuration}
          onChange={(e) => setSectionDuration(parseInt(e.target.value) || 5)}
          min="1"
          max="60"
          className="w-full p-2 border rounded-lg"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Section
        </button>
      </div>
    </form>
  );
}