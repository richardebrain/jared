import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  Wand2
} from 'lucide-react';
import StepByStepModuleBuilder from '@/components/StepByStepModuleBuilder';
import PowerPointImporter from '@/components/PowerPointImporter';
import ModulePublishingDialog from '@/components/ModulePublishingDialog';
import ModuleBasicInfo from '@/components/ModuleCreator/ModuleBasicInfo';
import ModuleSectionManager from '@/components/ModuleCreator/ModuleSectionManager';
import ModuleAIGeneration from '@/components/ModuleCreator/ModuleAIGeneration';

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

  // Form data for basic module information
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    estimatedDuration: 30,
    tags: [] as string[],
    moduleType: 'training',
    isPublic: false,
    points: 10,
    certificationEligible: false
  });

  // Module sections management
  const [sections, setSections] = useState<ModuleSection[]>([]);
  const [currentSection, setCurrentSection] = useState<ModuleSection | null>(null);
  const [isEditingSection, setIsEditingSection] = useState(false);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [includeVideos, setIncludeVideos] = useState(true);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeScenarios, setIncludeScenarios] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'ai' | 'manual'>('ai');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);

  // UI states
  const [tagInput, setTagInput] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showStepBuilder, setShowStepBuilder] = useState(false);
  const [showPowerPointImporter, setShowPowerPointImporter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle AI module loading from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const aiGeneratedData = urlParams.get('ai-generated');
    
    if (aiGeneratedData) {
      try {
        const moduleData = JSON.parse(decodeURIComponent(aiGeneratedData));
        console.log('Loading AI-generated module data:', moduleData);
        
        setFormData(prev => ({
          ...prev,
          title: moduleData.title || prev.title,
          description: moduleData.description || prev.description,
          category: moduleData.category || prev.category,
          level: moduleData.difficulty || prev.level,
          estimatedDuration: parseInt(moduleData.estimatedTime) || prev.estimatedDuration
        }));
        
        if (moduleData.sections) {
          setSections(moduleData.sections);
        }
        
        setGenerationMode('manual');
        
        toast({
          title: "AI Module Loaded",
          description: "Your AI-generated module is ready for customization",
        });
      } catch (error) {
        console.error('Error parsing AI-generated module data:', error);
      }
    }
  }, [location]);

  // Tag management
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // AI Generation
  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a description for your module",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await apiRequest('/api/ai/generate-module', {
        method: 'POST',
        data: {
          prompt: aiPrompt,
          language: selectedLanguage,
          includeVideos,
          includeQuizzes,
          includeActivities,
          includeScenarios,
          moduleType: formData.moduleType,
          level: formData.level || 'Intermediate'
        }
      });

      setAiGeneratedContent(response);
      setShowAIDialog(true);
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.response?.data?.error || "Failed to generate module content",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGeneratedContent = () => {
    if (!aiGeneratedContent) return;

    setFormData(prev => ({
      ...prev,
      title: aiGeneratedContent.title || prev.title,
      description: aiGeneratedContent.description || prev.description,
      category: aiGeneratedContent.category || prev.category,
      level: aiGeneratedContent.level || prev.level,
      estimatedDuration: aiGeneratedContent.estimatedDuration || prev.estimatedDuration,
      tags: aiGeneratedContent.tags || prev.tags
    }));

    if (aiGeneratedContent.sections) {
      setSections(aiGeneratedContent.sections);
    }

    setShowAIDialog(false);
    setGenerationMode('manual');
    
    toast({
      title: "Content Applied",
      description: "AI-generated content has been applied to your module",
    });
  };

  const handleRegenerateContent = () => {
    setShowAIDialog(false);
    handleAIGeneration();
  };

  // Module saving
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('/api/modules', {
        method: 'POST',
        data: moduleData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({
        title: "Module Created",
        description: "Your training module has been created successfully",
      });
      navigate('/modules');
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.response?.data?.error || "Failed to create module",
        variant: "destructive"
      });
    }
  });

  const handleSaveModule = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a module title",
        variant: "destructive"
      });
      return;
    }

    if (sections.length === 0) {
      toast({
        title: "Missing Content",
        description: "Please add at least one section to your module",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    const moduleData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: formData.level,
      estimatedTime: `${formData.estimatedDuration} minutes`,
      pointValue: formData.points,
      is_visible: formData.isPublic,
      sections: sections,
      moduleType: formData.moduleType,
      certificationEligible: formData.certificationEligible,
      tags: formData.tags,
      content: JSON.stringify({
        sections: sections,
        moduleType: formData.moduleType,
        tags: formData.tags,
        estimatedDuration: formData.estimatedDuration,
        certificationEligible: formData.certificationEligible
      })
    };

    createModuleMutation.mutate(moduleData);
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/modules')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Comprehensive Module Creator
              </h1>
              <p className="text-gray-600">
                Create engaging training modules with AI assistance or build them manually
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStepBuilder(true)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Step Builder
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPowerPointImporter(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import PowerPoint
              </Button>
              <Button
                onClick={handleSaveModule}
                disabled={isSaving || sections.length === 0}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Module
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* AI Generation Component */}
            <ModuleAIGeneration
              aiPrompt={aiPrompt}
              onAiPromptChange={setAiPrompt}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              includeVideos={includeVideos}
              onIncludeVideosChange={setIncludeVideos}
              includeQuizzes={includeQuizzes}
              onIncludeQuizzesChange={setIncludeQuizzes}
              includeActivities={includeActivities}
              onIncludeActivitiesChange={setIncludeActivities}
              includeScenarios={includeScenarios}
              onIncludeScenariosChange={setIncludeScenarios}
              isGenerating={isGenerating}
              onGenerate={handleAIGeneration}
              generationMode={generationMode}
              onGenerationModeChange={setGenerationMode}
              showAIDialog={showAIDialog}
              onShowAIDialogChange={setShowAIDialog}
              aiGeneratedContent={aiGeneratedContent}
              onUseGeneratedContent={handleUseGeneratedContent}
              onRegenerateContent={handleRegenerateContent}
            />

            {/* Basic Module Information */}
            <ModuleBasicInfo
              formData={formData}
              onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Section Manager */}
            <ModuleSectionManager
              sections={sections}
              onSectionsChange={setSections}
              currentSection={currentSection}
              onCurrentSectionChange={setCurrentSection}
              isEditingSection={isEditingSection}
              onEditingSectionChange={setIsEditingSection}
            />
          </div>
        </div>

        {/* Step-by-Step Builder Dialog */}
        {showStepBuilder && (
          <StepByStepModuleBuilder
            isOpen={showStepBuilder}
            onClose={() => setShowStepBuilder(false)}
            onModuleCreated={(module) => {
              setFormData(prev => ({
                ...prev,
                title: module.title,
                description: module.description,
                category: module.category,
                level: module.difficulty,
                estimatedDuration: parseInt(module.estimatedTime) || 30
              }));
              setSections(module.sections || []);
              setShowStepBuilder(false);
            }}
          />
        )}

        {/* PowerPoint Importer Dialog */}
        {showPowerPointImporter && (
          <PowerPointImporter
            isOpen={showPowerPointImporter}
            onClose={() => setShowPowerPointImporter(false)}
            onImportComplete={(importedSections) => {
              setSections(prev => [...prev, ...importedSections]);
              setShowPowerPointImporter(false);
              toast({
                title: "Import Complete",
                description: `${importedSections.length} sections imported from PowerPoint`,
              });
            }}
          />
        )}

        {/* Publishing Dialog */}
        {showPublishDialog && (
          <ModulePublishingDialog
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            module={{
              title: formData.title,
              description: formData.description,
              category: formData.category,
              difficulty: formData.level,
              estimatedTime: `${formData.estimatedDuration} minutes`,
              pointValue: formData.points,
              is_visible: formData.isPublic,
              sections: sections
            }}
            onPublish={() => {
              setShowPublishDialog(false);
              handleSaveModule();
            }}
          />
        )}
      </div>
    </div>
  );
}