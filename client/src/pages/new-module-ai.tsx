import React, { useState } from 'react';
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
import {
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  Video,
  Users,
  FileText,
  Mic,
  MessageSquare,
  ArrowRight,
  Wand2,
  Zap,
  BookOpen,
  Target,
  Wrench
} from 'lucide-react';

const PROVEN_TEMPLATES = [
  {
    id: 'lightning',
    title: 'Lightning Module',
    description: 'A super-condensed, single-idea burst perfect for quick refreshers (3-4 sections, ~5 min)',
    duration: '5 min',
    modules: 1,
    icon: Zap,
    color: 'bg-yellow-50 border-yellow-200',
    sections: [
      { type: 'scenario', title: 'Hook (scenario or question)', duration: 1 },
      { type: 'text', title: 'Core Concept (AI-generated key points)', duration: 2 },
      { type: 'example', title: 'Micro-Activity (2-step interactive prompt)', duration: 1 },
      { type: 'quiz', title: 'Quick Quiz (1-2 questions)', duration: 1 }
    ]
  },
  {
    id: 'standard',
    title: 'Standard Module',
    description: 'Your go-to template for everyday trainings (5-6 sections, ~10 min)',
    duration: '10 min',
    modules: 1,
    icon: BookOpen,
    color: 'bg-blue-50 border-blue-200',
    sections: [
      { type: 'text', title: 'Intro & Objectives', duration: 1 },
      { type: 'video', title: 'Video or Case Story', duration: 3 },
      { type: 'matching', title: 'Interactive Activity (matching, drag-and-drop)', duration: 2 },
      { type: 'example', title: 'Why & Science (rationale slide)', duration: 2 },
      { type: 'text', title: 'Reflection Prompt (text or journal)', duration: 1 },
      { type: 'quiz', title: 'Quiz & Feedback', duration: 1 }
    ]
  },
  {
    id: 'deep-dive',
    title: 'Deep-Dive Workshop',
    description: 'A thorough exploration, great for new topics or certifications (8-10 sections, ~15 min)',
    duration: '15 min',
    modules: 1,
    icon: Target,
    color: 'bg-green-50 border-green-200',
    sections: [
      { type: 'text', title: 'Welcome & Agenda', duration: 1 },
      { type: 'quiz', title: 'Pre-Check Question (knowledge gauge)', duration: 1 },
      { type: 'video', title: 'Foundational Video', duration: 3 },
      { type: 'mnemonic', title: 'Key Terms & Definitions (flash cards)', duration: 1 },
      { type: 'example', title: 'Guided Activity (step-by-step)', duration: 2 },
      { type: 'story', title: 'Case Study / Story', duration: 2 },
      { type: 'text', title: 'Why It Matters (science + policy)', duration: 2 },
      { type: 'simulation', title: 'Hands-On Practice (AI-guided scenario)', duration: 2 },
      { type: 'text', title: 'Reflection & Action Plan', duration: 1 },
      { type: 'quiz', title: 'Post-Test Quiz (certification)', duration: 2 }
    ]
  },
  {
    id: 'toolkit',
    title: 'Toolkit Module',
    description: 'Focuses on giving managers a "kit" of resources they can reuse (variable sections, ~5-12 min)',
    duration: '8 min',
    modules: 1,
    icon: Wrench,
    color: 'bg-purple-50 border-purple-200',
    sections: [
      { type: 'text', title: 'Resource Gallery (videos, PDFs, links)', duration: 2 },
      { type: 'example', title: 'Template Launcher (lesson-plan, email-scripts)', duration: 2 },
      { type: 'text', title: 'Best-Practice Snippets (AI-written talking points)', duration: 2 },
      { type: 'text', title: 'FAQ Chatbot (embedded "Ask AI" widget)', duration: 2 }
    ]
  },
  {
    id: 'scenario-driven',
    title: 'Scenario-Driven Module',
    description: 'Learners work through a single extended scenario (4-7 sections, ~8 min)',
    duration: '8 min',
    modules: 1,
    icon: Users,
    color: 'bg-indigo-50 border-indigo-200',
    sections: [
      { type: 'story', title: 'Scenario Setup (video or text)', duration: 2 },
      { type: 'triage', title: 'Decision Point #1 (choose A/B/C → AI-branch)', duration: 1 },
      { type: 'text', title: 'Feedback & Micro-Lesson', duration: 1 },
      { type: 'triage', title: 'Decision Point #2', duration: 1 },
      { type: 'example', title: 'Why Behind It', duration: 2 },
      { type: 'text', title: 'Reflection', duration: 1 },
      { type: 'quiz', title: 'Knowledge Check', duration: 1 }
    ]
  }
];

export default function NewModuleAI() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<'template' | 'topic' | 'sections' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionContents, setSectionContents] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [moduleConfig, setModuleConfig] = useState({
    title: '',
    description: '',
    topic: '',
    targetAudience: 'preschool-teachers',
    difficulty: 'intermediate'
  });

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = PROVEN_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setModuleConfig(prev => ({
        ...prev,
        title: prev.title || `${template.title}`,
        description: prev.description || template.description
      }));
      // Initialize empty content for each section
      setSectionContents(new Array(template.sections.length).fill(null));
    }
    setCurrentStep('topic');
  };

  const handleTopicComplete = () => {
    if (!moduleConfig.topic) {
      toast({
        title: "Missing Topic",
        description: "Please provide a topic for your module.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('sections');
  };

  const generateSectionContent = async (sectionIndex: number) => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    try {
      const section = selectedTemplate.sections[sectionIndex];
      
      const response = await fetch('/api/ai/generate-content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: moduleConfig.topic,
          sectionTitle: section.title,
          moduleTitle: `${selectedTemplate.title} - ${moduleConfig.topic}`,
          sectionType: section.type,
          templateType: selectedTemplate.id,
          config: moduleConfig,
          isRegeneration: false
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      
      const data = await response.json();
      
      // Update the specific section content
      setSectionContents(prev => {
        const newContents = [...prev];
        newContents[sectionIndex] = data;
        return newContents;
      });

      toast({
        title: "Section Generated!",
        description: `AI has created content for "${section.title}".`
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate section content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveModule = async () => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleConfig.title,
          description: moduleConfig.description,
          category: 'ai-generated',
          difficulty: moduleConfig.difficulty,
          estimatedTime: moduleConfig.estimatedTime,
          customPoints: '25',
          shareWithCommunity: false,
          sections: [{
            title: moduleConfig.title,
            content: JSON.stringify(generatedContent),
            type: selectedTemplate,
            duration: parseInt(moduleConfig.estimatedTime),
            videoUrl: '',
            imageUrl: '',
            activities: []
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to save module');

      toast({
        title: "Module Saved!",
        description: "Your AI-generated module has been saved successfully."
      });

      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save module. Please try again.",
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
              <Brain className="h-8 w-8 text-blue-600" />
              AI-Powered Module Creator
            </h1>
            <p className="text-gray-600 mt-2">Let AI build your educational module based on your requirements</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/new-module')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creator
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
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'config' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>
              2
            </div>
            <span>Configure</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'generate' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'generate' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>
              3
            </div>
            <span>Generate</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'preview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>
              4
            </div>
            <span>Preview</span>
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
                Select a template that best fits your educational objectives. AI will customize the content for you.
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

      {/* Step 2: Configuration */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Your Module</CardTitle>
              <CardDescription>
                Provide details about your module so AI can create tailored content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select 
                    value={moduleConfig.targetAudience} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, targetAudience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preschool-teachers">Preschool Teachers</SelectItem>
                      <SelectItem value="elementary-teachers">Elementary Teachers</SelectItem>
                      <SelectItem value="administrators">Administrators</SelectItem>
                      <SelectItem value="support-staff">Support Staff</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Module Description</Label>
                <Textarea
                  id="description"
                  value={moduleConfig.description}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what learners will gain from this module..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="learningObjectives">Learning Objectives</Label>
                <Textarea
                  id="learningObjectives"
                  value={moduleConfig.learningObjectives}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, learningObjectives: e.target.value }))}
                  placeholder="What specific skills or knowledge should learners gain? (e.g., Understand child development stages, Apply positive behavior strategies...)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="keyTopics">Key Topics to Cover</Label>
                <Textarea
                  id="keyTopics"
                  value={moduleConfig.keyTopics}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, keyTopics: e.target.value }))}
                  placeholder="List the main topics this module should address (e.g., Communication strategies, Conflict resolution, Safety protocols...)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="practicalApplications">Practical Applications</Label>
                <Textarea
                  id="practicalApplications"
                  value={moduleConfig.practicalApplications}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, practicalApplications: e.target.value }))}
                  placeholder="How should learners apply this knowledge in their daily work? (e.g., During circle time, When handling transitions...)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('template')}>
                  Back to Templates
                </Button>
                <Button onClick={handleConfigComplete} className="flex-1">
                  Continue to Generation
                  <Wand2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Generate */}
      {currentStep === 'generate' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Content</CardTitle>
              <CardDescription>
                Ready to create your module! AI will generate comprehensive content based on your configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Module Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {moduleConfig.title}
                  </div>
                  <div>
                    <span className="font-medium">Template:</span> {moduleTemplates.find(t => t.id === selectedTemplate)?.title}
                  </div>
                  <div>
                    <span className="font-medium">Audience:</span> {moduleConfig.targetAudience.replace('-', ' ')}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {moduleConfig.estimatedTime} minutes
                  </div>
                </div>
                <div className="mt-4">
                  <span className="font-medium">Description:</span>
                  <p className="text-sm mt-1">{moduleConfig.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('config')}>
                  Back to Configuration
                </Button>
                <Button 
                  onClick={generateModule} 
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Module Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Preview & Save */}
      {currentStep === 'preview' && generatedContent && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview Generated Module</CardTitle>
              <CardDescription>
                Review your AI-generated content and save when ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Module Generated Successfully!
                </h3>
                
                {generatedContent.blocks && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Generated {generatedContent.blocks.length} content blocks for your module.
                    </p>
                    
                    <div className="space-y-3">
                      {generatedContent.blocks.slice(0, 3).map((block: any, index: number) => (
                        <div key={index} className="bg-white p-4 rounded border">
                          <h4 className="font-medium mb-2">{block.type}</h4>
                          <p className="text-sm text-gray-600 mb-2">{block.preview}</p>
                          <p className="text-sm">{block.content.substring(0, 200)}...</p>
                        </div>
                      ))}
                      
                      {generatedContent.blocks.length > 3 && (
                        <div className="text-center">
                          <Badge variant="outline">
                            +{generatedContent.blocks.length - 3} more content blocks
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('generate')}>
                  Regenerate Content
                </Button>
                <Button onClick={saveModule} className="flex-1">
                  Save Module
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}