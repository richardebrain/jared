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

import { moduleTemplates } from '@/components/ModuleTemplates';
import ExampleSectionHandler from '@/components/ExampleSectionHandler';

// Define section types that match the comprehensive module creator
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
}

interface Module {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  customPoints: string;
  shareWithCommunity: boolean;
  sections: ModuleSection[];
}

export default function NewComprehensiveModuleCreator() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'config' | 'build'>('template');
  const [moduleConfig, setModuleConfig] = useState({
    title: '',
    description: '',
    category: 'professional-development',
    difficulty: 'intermediate',
    estimatedTime: '15',
    customPoints: '25',
    shareWithCommunity: false
  });
  const [sections, setSections] = useState<ModuleSection[]>([]);
  const [currentSectionType, setCurrentSectionType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Save module mutation
  const saveModuleMutation = useMutation({
    mutationFn: async (moduleData: Module) => {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save module');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module Created Successfully!",
        description: "Your comprehensive module has been saved."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save module. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Reset to template selection
  const resetToTemplateSelection = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setCurrentSectionType(null);
    setSections([]);
  };

  // Template selection handler
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

  // Configuration completion handler
  const handleConfigComplete = () => {
    setCurrentStep('build');
  };

  // Section save handler
  const handleSectionSave = (sectionData: any) => {
    const newSection: ModuleSection = {
      title: sectionData.title,
      content: sectionData.content,
      videoUrl: sectionData.videoUrl || '',
      imageUrl: sectionData.imageUrl || '',
      type: sectionData.type,
      duration: sectionData.duration,
      activities: []
    };

    setSections(prev => [...prev, newSection]);
    setCurrentSectionType(null);
    
    toast({
      title: "Section Added",
      description: `${sectionData.title} has been added to your module.`
    });
  };

  // Remove section handler
  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Section Removed",
      description: "Section has been removed from your module."
    });
  };

  // Save complete module
  const handleSaveModule = () => {
    if (!moduleConfig.title || sections.length === 0) {
      toast({
        title: "Incomplete Module",
        description: "Please provide a title and at least one section.",
        variant: "destructive"
      });
      return;
    }

    const moduleData: Module = {
      ...moduleConfig,
      sections
    };

    saveModuleMutation.mutate(moduleData);
  };

  // Render section type handler
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
      // Add other section handlers here as they're built
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Section Handler</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Handler for {currentSectionType} sections is coming soon.</p>
              <Button 
                variant="outline" 
                onClick={() => setCurrentSectionType(null)}
                className="mt-4"
              >
                Back to Section Selection
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  // If not authenticated, redirect
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive Module Creator</h1>
            <p className="text-gray-600 mt-2">Build engaging educational modules with AI assistance</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className={`flex items-center gap-2 ${currentStep === 'template' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'template' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>
              1
            </div>
            <span>Template</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'config' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>
              2
            </div>
            <span>Configure</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'build' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'build' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
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
                Select a template that best fits your educational objectives
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
                        selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                      } ${template.color}`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{template.title}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {template.duration}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="space-y-1">
                          {template.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="text-xs">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Module Configuration */}
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
                  <Label htmlFor="customPoints">Points Reward</Label>
                  <Input
                    id="customPoints"
                    type="number"
                    value={moduleConfig.customPoints}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, customPoints: e.target.value }))}
                    min="5"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="shareWithCommunity" 
                  checked={moduleConfig.shareWithCommunity}
                  onCheckedChange={(checked) => setModuleConfig(prev => ({ ...prev, shareWithCommunity: checked }))}
                />
                <Label htmlFor="shareWithCommunity">Share with community</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={resetToTemplateSelection}>
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

      {/* Step 3: Module Building */}
      {currentStep === 'build' && (
        <div className="space-y-6">
          {currentSectionType ? (
            // Render specific section handler
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
            // Section type selection
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
                    {SECTION_TYPES.map((sectionType) => {
                      const IconComponent = sectionType.icon;
                      return (
                        <Card 
                          key={sectionType.type}
                          className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
                          onClick={() => setCurrentSectionType(sectionType.type)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-blue-600" />
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

              {/* Current sections */}
              {sections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Module Sections ({sections.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sections.map((section, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{section.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{section.content.substring(0, 100)}...</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{section.type}</Badge>
                              <Badge variant="outline">{section.duration} min</Badge>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSection(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('config')}>
                  Back to Configuration
                </Button>
                <Button 
                  onClick={handleSaveModule}
                  disabled={sections.length === 0 || saveModuleMutation.isPending}
                >
                  {saveModuleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Module
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}