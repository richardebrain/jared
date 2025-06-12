import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Import our new components
import CreationMethodSelector from '@/components/module-creator/CreationMethodSelector';
import ModuleForm from '@/components/module-creator/ModuleForm';
import SectionEditor from '@/components/module-creator/SectionEditor';
import ModulePreview from '@/components/module-creator/ModulePreview';
import VideoSearch from '@/components/module-creator/VideoSearch';
import VoiceFeatures from '@/components/module-creator/VoiceFeatures';

// Import existing components
import StepByStepModuleBuilder from '@/components/StepByStepModuleBuilder';
import PowerPointImporter from '@/components/PowerPointImporter';
import ModulePublishingDialog from '@/components/ModulePublishingDialog';
import MultilingualBearyAI from '@/components/MultilingualBearyAI';

import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  Wand2,
  Search,
  Loader2
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
  id?: number;
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

export default function ComprehensiveModuleCreatorRefactored() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main workflow state
  const [creationMethod, setCreationMethod] = useState<'selection' | 'stepByStep' | 'powerPoint' | 'manual'>('selection');
  const [currentStep, setCurrentStep] = useState<'method' | 'form' | 'sections' | 'preview'>('method');
  
  // Module data
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    category: 'classroom-management',
    difficulty: 'beginner',
    estimatedTime: '15',
    customPoints: '',
    pointValue: 10,
    shareWithCommunity: false,
    sections: [] as ModuleSection[]
  });

  // UI state
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [showVoiceFeatures, setShowVoiceFeatures] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Load AI-generated data from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const aiGeneratedData = urlParams.get('ai-generated');
    
    if (aiGeneratedData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(aiGeneratedData));
        console.log('Loading AI-generated module data:', parsedData);
        
        setModuleData(prev => ({
          ...prev,
          title: parsedData.title || parsedData.originalTopic || '',
          description: parsedData.originalTopic || parsedData.description || '',
          category: parsedData.category || prev.category,
          difficulty: parsedData.difficulty || prev.difficulty,
          estimatedTime: parsedData.estimatedTime || prev.estimatedTime,
          sections: parsedData.sections || []
        }));
        
        setCreationMethod('manual');
        setCurrentStep('sections');
        
        toast({
          title: "AI Module Loaded",
          description: "Your AI-generated module is ready for customization",
        });
      } catch (error) {
        console.error('Error parsing AI-generated module data:', error);
      }
    }
  }, [location]);

  // Handlers for method selection
  const handleMethodSelect = (method: 'ai-assisted' | 'powerPoint' | 'manual') => {
    if (method === 'ai-assisted') {
      navigate('/module-wizard');
    } else if (method === 'powerPoint') {
      setCreationMethod('powerPoint');
    } else {
      setCreationMethod('manual');
      setCurrentStep('form');
    }
  };

  // Handlers for form data
  const handleModuleDataChange = (field: string, value: any) => {
    setModuleData(prev => ({ ...prev, [field]: value }));
  };

  // Handlers for sections
  const handleSectionChange = (index: number, field: keyof ModuleSection, value: any) => {
    const updatedSections = [...moduleData.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setModuleData(prev => ({ ...prev, sections: updatedSections }));
  };

  const addSection = () => {
    const newSection: ModuleSection = {
      title: `Section ${moduleData.sections.length + 1}`,
      content: '',
      videoUrl: '',
      imageUrl: '',
      type: 'text',
      duration: 10,
      activities: []
    };
    setModuleData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const deleteSection = (index: number) => {
    const updatedSections = moduleData.sections.filter((_, i) => i !== index);
    setModuleData(prev => ({ ...prev, sections: updatedSections }));
  };

  // AI content generation
  const generateSectionContent = async (sectionIndex: number, prompt: string) => {
    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/ai/generate-section-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          sectionType: moduleData.sections[sectionIndex]?.type || 'text',
          moduleTitle: moduleData.title,
          category: moduleData.category
        })
      });

      if (response.ok) {
        const generatedContent = await response.json();
        handleSectionChange(sectionIndex, 'content', generatedContent.content);
        
        if (generatedContent.questions) {
          handleSectionChange(sectionIndex, 'questions', generatedContent.questions);
        }
        
        toast({
          title: "Content Generated",
          description: "AI has generated content for your section",
        });
      }
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive",
      });
    }
    setIsGeneratingContent(false);
  };

  // Video search handlers
  const handleVideoSelect = (videoUrl: string, videoTitle: string) => {
    // Add video to the most recently edited section or create a new video section
    const videoSection: ModuleSection = {
      title: videoTitle,
      content: `Video: ${videoTitle}`,
      videoUrl,
      imageUrl: '',
      type: 'video',
      duration: 15,
      activities: [{
        type: 'watch',
        title: 'Watch Video',
        duration: 15,
        content: 'Watch and learn from this educational video',
        videoUrl
      }]
    };
    
    setModuleData(prev => ({ ...prev, sections: [...prev.sections, videoSection] }));
    setShowVideoSearch(false);
  };

  // Module creation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('POST', '/api/modules', moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({
        title: 'Module Created',
        description: 'Your module has been successfully created and saved.',
      });
      navigate('/dashboard');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create module. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleCreateModule = async () => {
    setIsCreatingModule(true);
    
    const moduleToCreate = {
      ...moduleData,
      createdBy: user?.id,
      is_visible: true
    };
    
    createModuleMutation.mutate(moduleToCreate);
    setIsCreatingModule(false);
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStep === 'form') {
      setCurrentStep('sections');
      // Add initial section if none exist
      if (moduleData.sections.length === 0) {
        addSection();
      }
    } else if (currentStep === 'sections') {
      setCurrentStep('preview');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'preview') {
      setCurrentStep('sections');
    } else if (currentStep === 'sections') {
      setCurrentStep('form');
    } else if (currentStep === 'form') {
      setCurrentStep('method');
    }
  };

  const handleStepByStepComplete = (data: any) => {
    setModuleData(prev => ({ ...prev, ...data }));
    setCreationMethod('manual');
    setCurrentStep('preview');
  };

  const handlePowerPointComplete = (data: any) => {
    setModuleData(prev => ({ ...prev, ...data }));
    setCreationMethod('manual');
    setCurrentStep('preview');
  };

  // Authentication check
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

  // Render different creation methods
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

  // Main manual creation interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'method') {
                  navigate('/dashboard');
                } else {
                  handlePreviousStep();
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentStep === 'method' && 'Module Creator'}
                {currentStep === 'form' && 'Module Information'}
                {currentStep === 'sections' && 'Build Content'}
                {currentStep === 'preview' && 'Preview & Publish'}
              </h1>
              <p className="text-gray-600">
                {currentStep === 'method' && 'Choose how you want to create your module'}
                {currentStep === 'form' && 'Define your module details'}
                {currentStep === 'sections' && 'Add sections and content to your module'}
                {currentStep === 'preview' && 'Review your module before publishing'}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            {currentStep === 'sections' && (
              <>
                <Button variant="outline" onClick={() => setShowVideoSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
                <Button variant="outline" onClick={() => setShowVoiceFeatures(true)}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Voice Features
                </Button>
              </>
            )}
            {currentStep === 'preview' && (
              <Button onClick={() => setShowPublishDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Publish Module
              </Button>
            )}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'method' && (
          <CreationMethodSelector onMethodSelect={handleMethodSelect} />
        )}

        {currentStep === 'form' && (
          <ModuleForm
            data={moduleData}
            onDataChange={handleModuleDataChange}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            isValid={moduleData.title.trim() && moduleData.description.trim()}
          />
        )}

        {currentStep === 'sections' && (
          <div className="space-y-6">
            {/* Section controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Module Sections ({moduleData.sections.length})</h3>
                  <div className="flex gap-2">
                    <Button onClick={addSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                    <Button onClick={handleNextStep} disabled={moduleData.sections.length === 0}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Module
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section editors */}
            {moduleData.sections.map((section, index) => (
              <SectionEditor
                key={index}
                section={section}
                sectionIndex={index}
                onSectionChange={handleSectionChange}
                onDeleteSection={deleteSection}
                onGenerateContent={generateSectionContent}
                isGenerating={isGeneratingContent}
              />
            ))}

            {moduleData.sections.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                  <p className="text-gray-600 mb-4">Start building your module by adding your first section</p>
                  <Button onClick={addSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Section
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <ModulePreview
            module={moduleData as Module}
            onBack={handlePreviousStep}
            onPublish={handleCreateModule}
            isPublishing={isCreatingModule}
          />
        )}

        {/* Dialogs */}
        <Dialog open={showVideoSearch} onOpenChange={setShowVideoSearch}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Video to Module</DialogTitle>
            </DialogHeader>
            <VideoSearch
              onVideoSelect={handleVideoSelect}
              onClose={() => setShowVideoSearch(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showVoiceFeatures} onOpenChange={setShowVoiceFeatures}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Voice & Audio Features</DialogTitle>
            </DialogHeader>
            <VoiceFeatures />
          </DialogContent>
        </Dialog>

        {showPublishDialog && (
          <ModulePublishingDialog
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            moduleData={moduleData}
            onPublish={handleCreateModule}
            isPublishing={isCreatingModule}
          />
        )}

        {/* AI Assistant */}
        <MultilingualBearyAI />
      </div>
    </div>
  );
}