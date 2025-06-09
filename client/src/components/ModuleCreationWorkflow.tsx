import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import StepByStepSectionBuilder from './StepByStepSectionBuilder';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Target,
  ArrowRight,
  Book,
  Wand2,
  Brain,
  Edit
} from 'lucide-react';

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
  moduleType: 'single' | 'course' | 'interactive';
  sections: ModuleSection[];
  courseStructure: {
    overview: string;
    learningPath: string[];
    prerequisites: string[];
  };
  interactiveElements: {
    hasQuizzes: boolean;
    hasScenarios: boolean;
    hasReflections: boolean;
  };
  certificationSystem: {
    enabled: boolean;
    criteria: string;
    badgeName: string;
  };
}

const SECTION_WORKFLOW = [
  { id: 'hook', name: 'Hook', description: 'Engaging opening to capture attention', icon: Wand2 },
  { id: 'introduction', name: 'Introduction', description: 'Overview and learning objectives', icon: Target },
  { id: 'content', name: 'Main Content', description: 'Core learning material', icon: Book },
  { id: 'quiz', name: 'Quiz', description: 'Knowledge check and assessment', icon: Brain },
  { id: 'reflection', name: 'Reflection', description: 'Personal reflection and planning', icon: Edit }
];

export default function ModuleCreationWorkflow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Module setup state
  const [currentStep, setCurrentStep] = useState<'setup' | 'sections' | 'review'>('setup');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [moduleData, setModuleData] = useState<Partial<Module>>({
    title: '',
    description: '',
    category: 'behavior-management',
    difficulty: 'intermediate',
    estimatedTime: '15',
    customPoints: '10',
    shareWithCommunity: false,
    moduleType: 'single',
    sections: [],
    courseStructure: {
      overview: '',
      learningPath: [],
      prerequisites: []
    },
    interactiveElements: {
      hasQuizzes: true,
      hasScenarios: true,
      hasReflections: true
    },
    certificationSystem: {
      enabled: false,
      criteria: '',
      badgeName: ''
    }
  });

  const saveModuleMutation = useMutation({
    mutationFn: async (moduleToSave: Module) => {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleToSave)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({
        title: "Module created successfully!",
        description: "Your module has been saved and is ready for use."
      });
      setLocation('/modules');
    },
    onError: (error) => {
      console.error('Error saving module:', error);
      toast({
        title: "Error saving module",
        description: "There was a problem saving your module. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSetupComplete = () => {
    if (!moduleData.title || !moduleData.description) {
      toast({
        title: "Setup incomplete",
        description: "Please fill in the module title and description.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('sections');
  };

  const handleSectionComplete = (section: ModuleSection) => {
    const updatedSections = [...(moduleData.sections || [])];
    updatedSections[currentSectionIndex] = section;
    
    setModuleData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const handleNextSection = () => {
    if (currentSectionIndex < SECTION_WORKFLOW.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setCurrentStep('review');
    }
  };

  const handleSaveModule = () => {
    const moduleToSave: Module = {
      title: moduleData.title!,
      description: moduleData.description!,
      category: moduleData.category!,
      difficulty: moduleData.difficulty!,
      estimatedTime: moduleData.estimatedTime!,
      customPoints: moduleData.customPoints!,
      shareWithCommunity: moduleData.shareWithCommunity!,
      moduleType: moduleData.moduleType!,
      sections: moduleData.sections!,
      courseStructure: moduleData.courseStructure!,
      interactiveElements: moduleData.interactiveElements!,
      certificationSystem: moduleData.certificationSystem!
    };

    saveModuleMutation.mutate(moduleToSave);
  };

  const currentSection = SECTION_WORKFLOW[currentSectionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/modules')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Modules
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Step-by-Step Module Creator</h1>
                <p className="text-gray-600">Build engaging content section by section</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              {['setup', 'sections', 'review'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep === step ? 'bg-blue-600 text-white' : 
                      ['setup', 'sections', 'review'].indexOf(currentStep) > index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {['setup', 'sections', 'review'].indexOf(currentStep) > index ? '✓' : index + 1}
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ${
                      ['setup', 'sections', 'review'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Setup Step */}
        {currentStep === 'setup' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Module Setup</CardTitle>
              <CardDescription>
                Let's start by setting up the basic information for your module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  value={moduleData.title || ''}
                  onChange={(e) => setModuleData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, engaging title for your module"
                />
              </div>

              <div>
                <Label htmlFor="description">Module Description</Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={moduleData.description || ''}
                  onChange={(e) => setModuleData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what teachers will learn and how it will help them"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={moduleData.category || ''}
                    onChange={(e) => setModuleData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="behavior-management">Behavior Management</option>
                    <option value="curriculum-planning">Curriculum Planning</option>
                    <option value="child-development">Child Development</option>
                    <option value="family-engagement">Family Engagement</option>
                    <option value="assessment">Assessment & Documentation</option>
                    <option value="environment">Learning Environment</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <select
                    id="difficulty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={moduleData.difficulty || ''}
                    onChange={(e) => setModuleData(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleSetupComplete} className="w-full" size="lg">
                Start Building Sections
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sections Step */}
        {currentStep === 'sections' && (
          <div>
            {/* Section Progress */}
            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Building Module: {moduleData.title}</h2>
                <Badge variant="outline">
                  Section {currentSectionIndex + 1} of {SECTION_WORKFLOW.length}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {SECTION_WORKFLOW.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center">
                      <div className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg
                        ${index === currentSectionIndex ? 'bg-blue-100 text-blue-800' : 
                          index < currentSectionIndex ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                      `}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.name}</span>
                        {index < currentSectionIndex && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      {index < SECTION_WORKFLOW.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <StepByStepSectionBuilder
              currentSectionType={currentSection.id}
              currentSectionTitle={`${currentSection.name} Section`}
              onSectionComplete={handleSectionComplete}
              onNext={handleNextSection}
              moduleTopic={moduleData.title || 'Your Module'}
            />
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Review Your Module</CardTitle>
              <CardDescription>
                Review all sections before saving your module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Module Overview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">{moduleData.title}</h3>
                <p className="text-blue-800 text-sm mb-2">{moduleData.description}</p>
                <div className="flex space-x-4 text-xs">
                  <Badge variant="secondary">{moduleData.category}</Badge>
                  <Badge variant="secondary">{moduleData.difficulty}</Badge>
                  <Badge variant="secondary">{moduleData.estimatedTime} minutes</Badge>
                </div>
              </div>

              {/* Sections Review */}
              <div className="space-y-4">
                <h4 className="font-medium">Module Sections</h4>
                {moduleData.sections?.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{section.title}</h5>
                      <Badge variant="outline">{SECTION_WORKFLOW[index]?.name}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {section.content.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('sections')}
                  className="flex-1"
                >
                  Edit Sections
                </Button>
                
                <Button 
                  onClick={handleSaveModule}
                  disabled={saveModuleMutation.isPending}
                  className="flex-1"
                >
                  {saveModuleMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Module
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}