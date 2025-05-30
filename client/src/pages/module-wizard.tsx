import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wand2, Play, BookOpen, Headphones, HelpCircle, Eye, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface ModuleConfig {
  title: string;
  description: string;
  sectionCount: number;
  includeQuiz: boolean;
  includeVideo: boolean;
  includePodcast: boolean;
  targetAudience: string;
  difficulty: string;
}

interface GeneratedSection {
  id: number;
  title: string;
  type: 'text' | 'video' | 'quiz' | 'podcast';
  content: string;
  isGenerated: boolean;
}

const wizardSteps: WizardStep[] = [
  { id: 1, title: "Module Basics", description: "Tell us about your training module" },
  { id: 2, title: "Content Preferences", description: "Choose your content types" },
  { id: 3, title: "AI Generation", description: "Let AI build your sections" },
  { id: 4, title: "Review & Preview", description: "Review and finalize your module" }
];

export default function ModuleWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSectionGeneration, setCurrentSectionGeneration] = useState(0);
  
  const [config, setConfig] = useState<ModuleConfig>({
    title: '',
    description: '',
    sectionCount: 3,
    includeQuiz: false,
    includeVideo: false,
    includePodcast: false,
    targetAudience: 'preschool-teachers',
    difficulty: 'beginner'
  });
  
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [modulePreview, setModulePreview] = useState<any>(null);

  const handleNext = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateModuleSections = async () => {
    setIsGenerating(true);
    setGeneratedSections([]);
    setCurrentSectionGeneration(0);
    
    try {
      const totalSections = config.sectionCount + (config.includeQuiz ? 1 : 0);
      const sections: GeneratedSection[] = [];
      
      // Generate main content sections
      for (let i = 1; i <= config.sectionCount; i++) {
        setCurrentSectionGeneration(i);
        
        const sectionPrompt = `Create section ${i} of ${config.sectionCount} for a training module titled "${config.title}".
        Module description: ${config.description}
        Target audience: ${config.targetAudience}
        Difficulty level: ${config.difficulty}
        
        This should be educational content for early childhood educators. Make it practical and engaging.
        Provide the content in HTML format suitable for display.`;
        
        const result = await apiRequest("/api/ai-suggestions/generate-section", {
          method: "POST",
          data: {
            prompt: sectionPrompt,
            sectionType: 'text',
            moduleTitle: config.title,
            moduleDescription: config.description
          }
        });
        
        console.log('AI Section Result:', result);
        
        sections.push({
          id: i,
          title: `Section ${i}: ${result.title || `Part ${i}`}`,
          type: 'text',
          content: result.content || result.html || `<p>Generated content for ${config.title}</p>`,
          isGenerated: true
        });
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Add optional content sections
      if (config.includeVideo) {
        sections.push({
          id: sections.length + 1,
          title: 'Video Resource',
          type: 'video',
          content: `<div class="video-section">
            <h3>Recommended Video</h3>
            <p>A curated video resource related to ${config.title} will be included here.</p>
            <p><em>Video suggestions can be added during final editing.</em></p>
          </div>`,
          isGenerated: true
        });
      }
      
      if (config.includePodcast) {
        sections.push({
          id: sections.length + 1,
          title: 'Audio Learning',
          type: 'podcast',
          content: `<div class="podcast-section">
            <h3>Audio Learning Component</h3>
            <p>An AI-generated audio lesson on ${config.title} can be created for on-the-go learning.</p>
            <p><em>Audio content will be generated in the final step.</em></p>
          </div>`,
          isGenerated: true
        });
      }
      
      if (config.includeQuiz) {
        setCurrentSectionGeneration(sections.length + 1);
        
        const quizPrompt = `Create a 5-question quiz for the training module "${config.title}".
        Description: ${config.description}
        Target audience: ${config.targetAudience}
        
        Generate practical, scenario-based questions that test understanding of the key concepts.
        Format as multiple choice questions with 4 options each.`;
        
        const quizResult = await apiRequest("/api/ai-suggestions/generate-section", {
          method: "POST",
          data: {
            prompt: quizPrompt + "\n\nGenerate quiz and teachback session content.",
            sectionType: 'quiz',
            moduleTitle: config.title,
            moduleDescription: config.description
          }
        });
        
        sections.push({
          id: sections.length + 1,
          title: 'Knowledge Check Quiz',
          type: 'quiz',
          content: `<div class="quiz-section">
            <h3>Knowledge Check</h3>
            <p>Interactive quiz with ${quizResult.questions?.length || 5} questions to reinforce learning.</p>
            <p><em>Quiz questions: ${quizResult.questions?.map((q: any, i: number) => `${i + 1}. ${q.question}`).join(' | ') || 'Generated successfully'}</em></p>
          </div>`,
          isGenerated: true
        });
      }
      
      setGeneratedSections(sections);
      
      // Create module preview
      const moduleHtml = `
        <div class="generated-module">
          <h1>${config.title}</h1>
          <p class="module-description">${config.description}</p>
          <div class="module-metadata">
            <span class="badge">Sections: ${sections.length}</span>
            <span class="badge">Difficulty: ${config.difficulty}</span>
            <span class="badge">Target: ${config.targetAudience}</span>
          </div>
          ${sections.map(section => `
            <div class="module-section" data-type="${section.type}">
              <h2>${section.title}</h2>
              <div class="section-content">${section.content}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      setModulePreview({
        title: config.title,
        description: config.description,
        content: moduleHtml,
        sections: sections.length,
        estimatedTime: sections.length * 5 // 5 minutes per section estimate
      });
      
      toast({
        title: "Module Generated!",
        description: `Successfully created ${sections.length} sections for your training module.`
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Error", 
        description: "There was an issue generating content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentSectionGeneration(0);
    }
  };

  const createModule = async () => {
    try {
      const moduleData = {
        title: config.title,
        description: config.description,
        content: modulePreview.content,
        sections: generatedSections,
        estimatedTime: modulePreview.estimatedTime,
        difficulty: config.difficulty,
        targetAudience: config.targetAudience
      };
      
      const response = await apiRequest("POST", "/api/ai-suggestions/create-complete-module", moduleData);
      const result = await response.json();
      
      toast({
        title: "Module Created!",
        description: "Your training module has been published successfully."
      });
      
      setLocation(`/learning-module/${result.moduleId}`);
      
    } catch (error) {
      console.error('Module creation error:', error);
      toast({
        title: "Creation Error",
        description: "Failed to create the module. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Module Basics
              </CardTitle>
              <CardDescription>Tell us about the training module you want to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Positive Behavior Support Strategies"
                  value={config.title}
                  onChange={(e) => setConfig({...config, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Module Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what teachers will learn and why it's important..."
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={config.difficulty} onValueChange={(value) => setConfig({...config, difficulty: value})}>
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
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={config.targetAudience} onValueChange={(value) => setConfig({...config, targetAudience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preschool-teachers">Preschool Teachers</SelectItem>
                      <SelectItem value="new-teachers">New Teachers</SelectItem>
                      <SelectItem value="lead-teachers">Lead Teachers</SelectItem>
                      <SelectItem value="directors">Directors</SelectItem>
                      <SelectItem value="all-staff">All Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Content Preferences
              </CardTitle>
              <CardDescription>Choose what types of content to include in your module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Number of Learning Sections</Label>
                <Select value={config.sectionCount.toString()} onValueChange={(value) => setConfig({...config, sectionCount: parseInt(value)})}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 sections</SelectItem>
                    <SelectItem value="3">3 sections</SelectItem>
                    <SelectItem value="4">4 sections</SelectItem>
                    <SelectItem value="5">5 sections</SelectItem>
                    <SelectItem value="6">6 sections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Additional Content Types</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quiz"
                    checked={config.includeQuiz}
                    onCheckedChange={(checked) => setConfig({...config, includeQuiz: checked as boolean})}
                  />
                  <Label htmlFor="quiz" className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Include Knowledge Check Quiz
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="video"
                    checked={config.includeVideo}
                    onCheckedChange={(checked) => setConfig({...config, includeVideo: checked as boolean})}
                  />
                  <Label htmlFor="video" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Include Video Resources
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="podcast"
                    checked={config.includePodcast}
                    onCheckedChange={(checked) => setConfig({...config, includePodcast: checked as boolean})}
                  />
                  <Label htmlFor="podcast" className="flex items-center gap-2">
                    <Headphones className="w-4 h-4" />
                    Include Audio Learning Component
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI Generation
              </CardTitle>
              <CardDescription>Let AI create your module content section by section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isGenerating && generatedSections.length === 0 && (
                <div className="text-center py-8">
                  <Wand2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-gray-600 mb-4">
                    AI will create {config.sectionCount} learning sections
                    {config.includeQuiz && " + 1 quiz"}
                    {config.includeVideo && " + video resources"}
                    {config.includePodcast && " + audio content"}
                  </p>
                  <Button onClick={generateModuleSections} className="bg-blue-600 hover:bg-blue-700">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Module Content
                  </Button>
                </div>
              )}
              
              {isGenerating && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Generating Content...</h3>
                  <p className="text-gray-600 mb-4">
                    Creating section {currentSectionGeneration} of {config.sectionCount + (config.includeQuiz ? 1 : 0)}
                  </p>
                  <Progress 
                    value={(currentSectionGeneration / (config.sectionCount + (config.includeQuiz ? 1 : 0))) * 100} 
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              )}
              
              {generatedSections.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Generated Sections
                  </h3>
                  {generatedSections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={section.type === 'quiz' ? 'destructive' : section.type === 'video' ? 'default' : 'secondary'}>
                          {section.type}
                        </Badge>
                        <span className="font-semibold">{section.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: section.content.replace(/```html|```/g, '').substring(0, 300) + '...' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Module Preview
                </CardTitle>
                <CardDescription>Review your generated module before publishing</CardDescription>
              </CardHeader>
              <CardContent>
                {modulePreview && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-xl font-bold">{modulePreview.title}</h3>
                      <p className="text-gray-600 mt-2">{config.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge>Sections: {modulePreview.sections}</Badge>
                        <Badge>Est. Time: {modulePreview.estimatedTime} min</Badge>
                        <Badge>Level: {config.difficulty}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {generatedSections.map((section) => (
                        <div key={section.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={section.type === 'quiz' ? 'destructive' : section.type === 'video' ? 'default' : 'secondary'}>
                              {section.type}
                            </Badge>
                            <span className="font-medium text-lg">{section.title}</span>
                          </div>
                          <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded border max-h-48 overflow-y-auto">
                            <div dangerouslySetInnerHTML={{ 
                              __html: section.content.replace(/```html|```/g, '').substring(0, 800) + (section.content.length > 800 ? '...' : '')
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <Button onClick={createModule} className="bg-green-600 hover:bg-green-700 flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Publish Module
                      </Button>
                      <Button variant="outline" onClick={() => setCurrentStep(3)}>
                        Regenerate Content
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.title.trim() && config.description.trim();
      case 2:
        return true;
      case 3:
        return generatedSections.length > 0;
      case 4:
        return modulePreview !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Module Creation Wizard
          </h1>
          <p className="text-gray-600">
            Let AI help you create professional training modules in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-400 border-gray-300'
                  }
                `}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                {index < wizardSteps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/comprehensive-module-creator')}
            >
              Advanced Creator
            </Button>
            
            {currentStep < wizardSteps.length ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}