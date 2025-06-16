import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  BookOpen
} from 'lucide-react';

// Import reusable section handlers
import ExampleSectionHandler from '@/components/ExampleSectionHandler';

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

  const [currentStep, setCurrentStep] = useState<'template' | 'config' | 'build' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentSectionType, setCurrentSectionType] = useState<string | null>(null);
  const [sections, setSections] = useState<ModuleSection[]>([]);

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
      const content = typeof existingModule.content === 'string' 
        ? JSON.parse(existingModule.content) 
        : existingModule.content;

      setModuleConfig({
        title: existingModule.title || '',
        description: existingModule.description || '',
        category: existingModule.category || 'professional-development',
        difficulty: existingModule.difficulty || 'intermediate',
        estimatedTime: existingModule.duration?.toString() || '15',
        pointValue: existingModule.pointValue || 10,
        shareWithCommunity: existingModule.isShared || false
      });

      if (content && content.sections) {
        // Ensure sections have unique IDs for React rendering
        const sectionsWithIds = content.sections.map((section: any, index: number) => ({
          ...section,
          id: section.id || `section-${index}-${Date.now()}`
        }));
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

  const handleSectionSave = (sectionData: any) => {
    const newSection: ModuleSection = {
      id: Date.now().toString(),
      title: sectionData.title,
      content: sectionData.content || JSON.stringify(sectionData),
      type: sectionData.type,
      duration: sectionData.duration || 10,
      videoUrl: sectionData.videoUrl || '',
      imageUrl: sectionData.imageUrl || ''
    };

    setSections(prev => [...prev, newSection]);
    setCurrentSectionType(null);
    
    toast({
      title: "Section Added",
      description: `${sectionData.title} has been added to your module.`
    });
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    toast({
      title: "Section Removed",
      description: "Section has been removed from your module."
    });
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
        response = await apiRequest('PATCH', `/api/modules/${editModuleId}`, moduleData);
      } else {
        // Create new module
        response = await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleData)
        });
        
        if (!response.ok) throw new Error('Failed to save module');
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

  const renderSectionHandler = () => {
    if (!currentSectionType) return null;

    switch (currentSectionType) {
      case 'example':
        return (
          <ExampleSectionHandler
            moduleTitle={moduleConfig.title}
            moduleDescription={moduleConfig.description}
            sectionTitle="Examples"
            onSave={handleSectionSave}
          />
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Section Builder</CardTitle>
              <CardDescription>
                Manual builder for {currentSectionType} sections is coming soon. 
                For now, you can add basic content below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input placeholder="Enter section title..." />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea placeholder="Enter section content..." rows={6} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentSectionType(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Basic section save for unsupported types
                  handleSectionSave({
                    title: `${currentSectionType} Section`,
                    content: 'Basic content placeholder',
                    type: currentSectionType,
                    duration: 10
                  });
                }}>
                  Add Section
                </Button>
              </div>
            </CardContent>
          </Card>
        );
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
          <Button variant="outline" onClick={() => setLocation('/new-module')}>
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
                <Textarea
                  id="description"
                  value={moduleConfig.description}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what learners will gain from this module..."
                  rows={3}
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

      {/* Step 3: Build */}
      {currentStep === 'build' && (
        <div className="space-y-6">
          {currentSectionType ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSectionType(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Section Types
                </Button>
              </div>
              {renderSectionHandler()}
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Add Content Sections</CardTitle>
                  <CardDescription>
                    Choose the type of content you want to add to your module
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionTypes.map((sectionType) => {
                      const IconComponent = sectionType.icon;
                      return (
                        <Card 
                          key={sectionType.type}
                          className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
                          onClick={() => setCurrentSectionType(sectionType.type)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-green-600" />
                              <CardTitle className="text-base">{sectionType.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-gray-600">{sectionType.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {sections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Module Sections ({sections.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{section.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {typeof section.content === 'string' 
                                ? section.content.substring(0, 100) + '...'
                                : `${section.type} section`}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{section.type}</Badge>
                              <Badge variant="outline">{section.duration} min</Badge>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('config')}>
                  Back to Configuration
                </Button>
                <Button 
                  onClick={saveModule}
                  disabled={sections.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Module' : 'Save Module'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}