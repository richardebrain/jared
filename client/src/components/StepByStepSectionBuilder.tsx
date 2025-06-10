import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Wand2,
  ArrowRight,
  Save,
  Plus,
  CheckCircle2,
  Loader2,
  GripVertical,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface ContentBlock {
  type: string;
  preview: string;
  content: string;
}

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

interface StepByStepSectionBuilderProps {
  currentSectionType: string;
  currentSectionTitle: string;
  onSectionComplete: (section: ModuleSection) => void;
  onNext: () => void;
  moduleTopic: string;
}

const SECTION_TYPES = [
  { id: 'hook', name: 'Hook', description: 'Engaging opening to capture attention' },
  { id: 'introduction', name: 'Introduction', description: 'Overview and learning objectives' },
  { id: 'content', name: 'Main Content', description: 'Core learning material' },
  { id: 'quiz', name: 'Quiz', description: 'Knowledge check and assessment' },
  { id: 'reflection', name: 'Reflection', description: 'Personal reflection and planning' }
];

export default function StepByStepSectionBuilder({
  currentSectionType,
  currentSectionTitle,
  onSectionComplete,
  onNext,
  moduleTopic
}: StepByStepSectionBuilderProps) {
  const [contentTopic, setContentTopic] = useState('');
  const [generatedBlocks, setGeneratedBlocks] = useState<ContentBlock[]>([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [sectionTitle, setSectionTitle] = useState(currentSectionTitle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'input' | 'generate' | 'select' | 'finalize'>('input');
  const [showRegenerateOptions, setShowRegenerateOptions] = useState<number | null>(null);
  const [regenerateGuidance, setRegenerateGuidance] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const currentSection = SECTION_TYPES.find(s => s.id === currentSectionType);

  const handleGenerateContent = async (isRegeneration = false, additionalGuidance = '') => {
    if (!contentTopic.trim()) {
      toast({
        title: "Content topic required",
        description: "Please enter what you want the content to be about",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        topic: contentTopic,
        sectionType: currentSectionType,
        sectionTitle: sectionTitle,
        moduleTopic: moduleTopic,
        ...(isRegeneration && additionalGuidance && {
          regenerationGuidance: additionalGuidance,
          isRegeneration: true
        })
      };

      const response = await fetch('/api/ai-suggestions/content-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.blocks && data.blocks.length > 0) {
        setGeneratedBlocks(data.blocks);
        setStep('select');
        setShowRegenerateOptions(null);
        setRegenerateGuidance('');
        toast({
          title: isRegeneration ? "Content regenerated!" : "Content generated!",
          description: `Generated ${data.blocks.length} ${isRegeneration ? 'refined' : ''} content options for your ${currentSection?.name.toLowerCase()}`
        });
      } else {
        throw new Error('No content blocks received');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerateWithGuidance = async (blockIndex: number) => {
    if (!regenerateGuidance.trim()) {
      toast({
        title: "Additional guidance required",
        description: "Please provide specific guidance for how to improve the content",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    await handleGenerateContent(true, regenerateGuidance);
  };

  const handleSelectContent = (content: string) => {
    setSelectedContent(content);
    setStep('finalize');
  };

  const handleSaveSection = () => {
    const section: ModuleSection = {
      title: sectionTitle,
      content: selectedContent,
      videoUrl: '',
      imageUrl: '',
      type: 'text',
      duration: 5,
      activities: [{
        type: 'read',
        title: sectionTitle,
        duration: 5,
        content: selectedContent
      }]
    };

    onSectionComplete(section);
    toast({
      title: "Section saved!",
      description: `${currentSection?.name} section has been created and saved.`
    });
  };

  const handleNext = () => {
    handleSaveSection();
    onNext();
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hook': return <Wand2 className="w-5 h-5" />;
      case 'introduction': return <ArrowRight className="w-5 h-5" />;
      case 'quiz': return <CheckCircle2 className="w-5 h-5" />;
      case 'reflection': return <Edit className="w-5 h-5" />;
      default: return <Plus className="w-5 h-5" />;
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'input':
        return `What specific aspect of "${moduleTopic}" should this ${currentSection?.name.toLowerCase()} focus on?`;
      case 'generate':
        return 'Generating content options...';
      case 'select':
        return 'Choose the content that best fits your vision:';
      case 'finalize':
        return 'Review and save your section:';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          {getSectionIcon(currentSectionType)}
          <h1 className="text-3xl font-bold">
            Building Your {currentSection?.name} Section
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {currentSection?.description}
        </p>
        <Badge variant="outline" className="text-sm">
          Module: {moduleTopic}
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {['input', 'generate', 'select', 'finalize'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === stepName ? 'bg-blue-600 text-white' : 
                  ['input', 'generate', 'select', 'finalize'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {['input', 'generate', 'select', 'finalize'].indexOf(step) > index ? '✓' : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-0.5 ${
                  ['input', 'generate', 'select', 'finalize'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Step {['input', 'generate', 'select', 'finalize'].indexOf(step) + 1}</span>
          </CardTitle>
          <CardDescription>
            {getStepDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Input Content Topic */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sectionTitle">Section Title</Label>
                <Input
                  id="sectionTitle"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder={`Enter title for your ${currentSection?.name.toLowerCase()}`}
                />
              </div>
              
              <div>
                <Label htmlFor="contentTopic">Content Focus</Label>
                <Textarea
                  id="contentTopic"
                  value={contentTopic}
                  onChange={(e) => setContentTopic(e.target.value)}
                  placeholder={`Describe what specific aspect of "${moduleTopic}" this ${currentSection?.name.toLowerCase()} should cover...`}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Content Tips for {currentSection?.name}:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {currentSectionType === 'hook' && (
                    <>
                      <li>• Start with a relatable classroom scenario</li>
                      <li>• Ask a thought-provoking question</li>
                      <li>• Share a surprising research insight</li>
                    </>
                  )}
                  {currentSectionType === 'introduction' && (
                    <>
                      <li>• Outline clear learning objectives</li>
                      <li>• Set expectations for the module</li>
                      <li>• Connect to teachers' daily experiences</li>
                    </>
                  )}
                  {currentSectionType === 'quiz' && (
                    <>
                      <li>• Create scenario-based questions</li>
                      <li>• Include practical application items</li>
                      <li>• Test understanding, not memorization</li>
                    </>
                  )}
                  {currentSectionType === 'reflection' && (
                    <>
                      <li>• Encourage honest self-assessment</li>
                      <li>• Provide action planning templates</li>
                      <li>• Connect learning to practice</li>
                    </>
                  )}
                </ul>
              </div>

              <Button 
                onClick={() => setStep('generate')} 
                className="w-full"
                disabled={!contentTopic.trim() || !sectionTitle.trim()}
              >
                Continue to Generate Content
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Generate Content */}
          {step === 'generate' && (
            <div className="text-center space-y-4">
              <Button 
                onClick={() => handleGenerateContent()}
                disabled={isGenerating}
                size="lg"
                className="px-8"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate {currentSection?.name} Content
                  </>
                )}
              </Button>
              
              {isGenerating && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">
                    Creating witty, evidence-based content about "{contentTopic}" for your {currentSection?.name.toLowerCase()} section...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Content */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Choose the content that best matches your vision:
              </p>
              
              <div className="grid gap-4">
                {generatedBlocks.map((block, index) => (
                  <Card 
                    key={index}
                    className="border-2 hover:border-blue-300 transition-all"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{block.type}</Badge>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectContent(block.content)}
                          >
                            Select This Content
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => setShowRegenerateOptions(index)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{block.preview}</p>
                      <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 p-3 rounded mb-3">
                        {block.content.substring(0, 200)}...
                      </div>

                      {/* Regeneration Options */}
                      {showRegenerateOptions === index && (
                        <div className="border-t pt-3 space-y-3">
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <h4 className="font-medium text-orange-900 mb-2">
                              Regenerate with Additional Guidance
                            </h4>
                            <p className="text-sm text-orange-800 mb-3">
                              Provide specific instructions to refine this content. For example:
                            </p>
                            <ul className="text-xs text-orange-700 space-y-1 mb-3">
                              <li>• "Include a specific ECERS block material checklist"</li>
                              <li>• "Add more practical classroom examples"</li>
                              <li>• "Make it more suitable for toddler classrooms"</li>
                              <li>• "Include step-by-step implementation guide"</li>
                            </ul>
                            <Textarea
                              placeholder="What would you like to see improved or added to this content?"
                              value={regenerateGuidance}
                              onChange={(e) => setRegenerateGuidance(e.target.value)}
                              rows={3}
                              className="mb-3"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRegenerateWithGuidance(index)}
                                disabled={isRegenerating || !regenerateGuidance.trim()}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                {isRegenerating ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Regenerating...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-3 h-3 mr-1" />
                                    Regenerate Content
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowRegenerateOptions(null);
                                  setRegenerateGuidance('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setStep('generate')}
                className="w-full"
              >
                Generate More Options
              </Button>
            </div>
          )}

          {/* Step 4: Finalize Section */}
          {step === 'finalize' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="finalTitle">Final Section Title</Label>
                <Input
                  id="finalTitle"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Selected Content Preview</Label>
                <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50 text-sm">
                  {selectedContent}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('select')}
                  className="flex-1"
                >
                  Choose Different Content
                </Button>
                
                <Button 
                  onClick={handleNext}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Continue to Next Section
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}