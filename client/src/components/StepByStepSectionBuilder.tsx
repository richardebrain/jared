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
  Trash2
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
  const { toast } = useToast();

  const currentSection = SECTION_TYPES.find(s => s.id === currentSectionType);

  const handleGenerateContent = async () => {
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
      const response = await fetch('/api/ai-suggestions/content-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: contentTopic,
          sectionType: currentSectionType,
          sectionTitle: sectionTitle,
          moduleTopic: moduleTopic
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.blocks && data.blocks.length > 0) {
        setGeneratedBlocks(data.blocks);
        setStep('select');
        toast({
          title: "Content generated!",
          description: `Generated ${data.blocks.length} content options for your ${currentSection?.name.toLowerCase()}`
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
    }
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
                onClick={handleGenerateContent}
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
                    className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => handleSelectContent(block.content)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{block.type}</Badge>
                        <Button size="sm" variant="outline">
                          Select This Content
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{block.preview}</p>
                      <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 p-3 rounded">
                        {block.content.substring(0, 200)}...
                      </div>
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