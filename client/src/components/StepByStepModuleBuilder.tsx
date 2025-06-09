import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  ArrowRight, 
  ArrowLeft,
  Video,
  FileQuestion,
  BookOpen,
  Users,
  Wand2,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Heart,
  Target,
  Link,
  MessageCircle,
  Play,
  Shuffle,
  Upload,
  FileText,
  Music,
  Trophy,
  Presentation,
  ExternalLink
} from "lucide-react";

interface ModuleSection {
  id: string;
  type: 'story' | 'example' | 'matching' | 'scenario' | 'triage' | 'quiz' | 'video' | 'discussion' | 'simulation' | 'mnemonic' | 'slides';
  title: string;
  content: string;
  duration: number;
  videoUrl?: string;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  scenarios?: Array<{
    situation: string;
    options: string[];
    correctChoice: number;
    feedback: string;
  }>;
  matchingPairs?: Array<{
    left: string;
    right: string;
  }>;
  storyElements?: {
    character: string;
    situation: string;
    challenge: string;
    resolution: string;
  };
  triageItems?: Array<{
    situation: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  mnemonicDevice?: {
    technique: 'acronym' | 'rhyme' | 'song' | 'story' | 'visual';
    content: string;
    keyPoints: string[];
    practiceExercise: string;
  };
  slidesData?: {
    presentationId?: string;
    presentationUrl?: string;
    slides: Array<{
      slideId: string;
      title: string;
      content: string;
      speakerNotes?: string;
      imageUrl?: string;
    }>;
    generatedFromText: boolean;
  };
  learningObjectives?: string[];
  materials?: string[];
  instructions?: string[];
}

interface ModuleOutline {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  totalDuration: number;
  learningObjectives: string[];
  sections: Array<{
    type: string;
    title: string;
    description: string;
    duration: number;
  }>;
}

interface StepByStepModuleBuilderProps {
  initialData?: any;
  onModuleComplete: (moduleData: any) => void;
  onBack: () => void;
}

export default function StepByStepModuleBuilder({ initialData, onModuleComplete, onBack }: StepByStepModuleBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [moduleOutline, setModuleOutline] = useState<ModuleOutline | null>(null);
  const [sections, setSections] = useState<ModuleSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { toast } = useToast();

  const [moduleBasics, setModuleBasics] = useState({
    title: '',
    description: '',
    category: '',
    targetAudience: '',
    difficulty: 'intermediate',
    estimatedTime: '15',
    shareWithCommunity: false
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.template) {
        // Handle template data
        const template = typeof initialData.template === 'string' 
          ? JSON.parse(initialData.template) 
          : initialData.template;
        
        setModuleBasics({
          title: template.title || '',
          description: template.description || '',
          category: template.category || '',
          targetAudience: template.targetAge || '',
          difficulty: 'intermediate',
          estimatedTime: template.totalDuration?.toString() || '15',
          shareWithCommunity: false
        });
        
        if (template.activities) {
          const convertedSections = template.activities.map((activity: any, index: number) => ({
            id: `section-${index}`,
            type: activity.type === 'quiz' ? 'quiz' : 
                  activity.type === 'video' ? 'video' :
                  activity.type === 'reflection' ? 'reflection' : 'learning_content',
            title: activity.title,
            content: activity.description,
            duration: activity.duration,
            learningObjectives: activity.learningObjectives || [],
            materials: activity.materials || [],
            instructions: activity.instructions || []
          }));
          setSections(convertedSections);
          setCurrentStep(3);
        }
      } else if (initialData.aiGenerated) {
        // Handle AI-generated data
        const aiData = typeof initialData.aiGenerated === 'string' 
          ? JSON.parse(initialData.aiGenerated) 
          : initialData.aiGenerated;
        
        setModuleBasics({
          title: aiData.moduleInfo?.title || '',
          description: aiData.moduleInfo?.description || '',
          category: aiData.moduleInfo?.category || '',
          targetAudience: aiData.moduleInfo?.targetAudience || '',
          difficulty: aiData.moduleInfo?.difficultyLevel || 'intermediate',
          estimatedTime: aiData.moduleInfo?.totalDuration?.toString() || '15',
          shareWithCommunity: false
        });

        if (aiData.sections) {
          setSections(aiData.sections);
          setCurrentStep(3);
        }
      }
    }
  }, [initialData]);

  const generateModuleOutline = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-module-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: moduleBasics.title,
          audience: moduleBasics.targetAudience,
          goals: moduleBasics.description,
          duration: parseInt(moduleBasics.estimatedTime),
          difficulty: moduleBasics.difficulty,
          category: moduleBasics.category
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate module outline');
      }

      const outline = await response.json();
      setModuleOutline(outline);
      setCurrentStep(2);
      
      toast({
        title: "Module outline generated!",
        description: "Review the suggested structure and proceed to build sections.",
      });
    } catch (error) {
      console.error('Error generating module outline:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your module outline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSectionContent = async (sectionOutline: any, index: number) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-section-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionOutline,
          moduleContext: {
            title: moduleBasics.title,
            description: moduleBasics.description,
            targetAudience: moduleBasics.targetAudience,
            learningObjectives: moduleOutline?.learningObjectives || []
          },
          sectionIndex: index,
          totalSections: moduleOutline?.sections.length || 1
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate section content');
      }

      const sectionContent = await response.json();
      
      const newSection: ModuleSection = {
        id: `section-${index}`,
        type: sectionContent.type || 'learning_content',
        title: sectionContent.title,
        content: sectionContent.content,
        duration: sectionContent.duration,
        videoUrl: sectionContent.videoUrl || '',
        questions: sectionContent.questions || [],
        learningObjectives: sectionContent.learningObjectives || [],
        materials: sectionContent.materials || [],
        instructions: sectionContent.instructions || []
      };

      setSections(prev => [...prev, newSection]);
      
      toast({
        title: "Section generated!",
        description: `Section "${sectionContent.title}" has been created.`,
      });
    } catch (error) {
      console.error('Error generating section content:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating the section content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllSections = async () => {
    if (!moduleOutline) return;
    
    setSections([]);
    for (let i = 0; i < moduleOutline?.sections?.length; i++) {
      await generateSectionContent(moduleOutline?.sections[i], i);
    }
    setCurrentStep(3);
  };

  const updateSection = (index: number, updatedSection: Partial<ModuleSection>) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, ...updatedSection } : section
    ));
  };

  const addQuestion = (sectionIndex: number) => {
    const newQuestion = {
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    
    updateSection(sectionIndex, {
      questions: [...(sections[sectionIndex].questions || []), newQuestion]
    });
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...(sections[sectionIndex].questions || [])];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    updateSection(sectionIndex, { questions: updatedQuestions });
  };

  const completeModule = () => {
    const moduleData = {
      title: moduleBasics.title,
      description: moduleBasics.description,
      category: moduleBasics.category,
      difficulty: moduleBasics.difficulty,
      estimatedTime: moduleBasics.estimatedTime,
      shareWithCommunity: moduleBasics.shareWithCommunity,
      pointValue: sections.length * 10, // Base points calculation
      sections: sections.map(section => ({
        title: section.title,
        content: section.content,
        type: section.type === 'quiz' ? 'quiz' : 'text',
        videoUrl: section.videoUrl || '',
        questions: section.questions || [],
        imageUrl: ''
      }))
    };
    
    onModuleComplete(moduleData);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'story': return <Heart className="h-4 w-4" />;
      case 'example': return <BookOpen className="h-4 w-4" />;
      case 'matching': return <Link className="h-4 w-4" />;
      case 'scenario': return <Brain className="h-4 w-4" />;
      case 'triage': return <Target className="h-4 w-4" />;
      case 'quiz': return <FileQuestion className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'discussion': return <MessageCircle className="h-4 w-4" />;
      case 'simulation': return <Play className="h-4 w-4" />;
      case 'mnemonic': return <Music className="h-4 w-4" />;
      case 'slides': return <Presentation className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getSectionDescription = (type: string) => {
    switch (type) {
      case 'story': return 'Narrative-based learning with characters and scenarios';
      case 'example': return 'Real-world examples and case studies';
      case 'matching': return 'Connect concepts with definitions or examples';
      case 'scenario': return 'Decision-making exercises with multiple options';
      case 'triage': return 'Priority-based sorting and categorization';
      case 'quiz': return 'Knowledge assessment with questions and answers';
      case 'video': return 'Video content with guided viewing';
      case 'discussion': return 'Interactive discussion prompts and activities';
      case 'simulation': return 'Role-play and interactive simulations';
      case 'mnemonic': return 'Fun memory devices: poems, raps, acronyms, and songs';
      case 'slides': return 'AI-generated Google Slides presentation with visual content';
      default: return 'Interactive learning content';
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Module Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Module Title</Label>
          <Input 
            id="title"
            value={moduleBasics.title}
            onChange={(e) => setModuleBasics(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Effective Communication Skills"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={moduleBasics.description}
            onChange={(e) => setModuleBasics(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what learners will achieve..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={moduleBasics.category} onValueChange={(value) => setModuleBasics(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Communication Skills">Communication Skills</SelectItem>
                <SelectItem value="Leadership">Leadership</SelectItem>
                <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                <SelectItem value="Personal Development">Personal Development</SelectItem>
                <SelectItem value="Safety & Compliance">Safety & Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={moduleBasics.difficulty} onValueChange={(value) => setModuleBasics(prev => ({ ...prev, difficulty: value }))}>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Input 
              id="audience"
              value={moduleBasics.targetAudience}
              onChange={(e) => setModuleBasics(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="e.g., New managers, All staff"
            />
          </div>
          
          <div>
            <Label htmlFor="time">Estimated Time (minutes)</Label>
            <Input 
              id="time"
              type="number"
              value={moduleBasics.estimatedTime}
              onChange={(e) => setModuleBasics(prev => ({ ...prev, estimatedTime: e.target.value }))}
            />
          </div>
        </div>

        {/* Community Sharing */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-900">Share with Community</h3>
                <p className="text-sm text-purple-700">Enter your module into the monthly competition for bonus points!</p>
              </div>
            </div>
            <Switch
              checked={moduleBasics.shareWithCommunity}
              onCheckedChange={(checked) => setModuleBasics(prev => ({ ...prev, shareWithCommunity: checked }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={generateModuleOutline} 
            disabled={!moduleBasics.title || !moduleBasics.description || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Outline...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Module Outline
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    moduleOutline && (
      <Card>
        <CardHeader>
          <CardTitle>Review Module Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">{moduleOutline.title}</h3>
            <p className="text-muted-foreground">{moduleOutline.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{moduleOutline.category}</Badge>
              <Badge variant="outline">{moduleOutline.totalDuration} minutes</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Learning Objectives</h4>
            <ul className="space-y-1">
              {moduleOutline.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3">Suggested Sections ({moduleOutline?.sections?.length})</h4>
            <div className="space-y-3">
              {moduleOutline?.sections?.map((section, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSectionIcon(section.type)}
                      <h5 className="font-medium">{section.title}</h5>
                      <Badge variant="outline" className="text-xs">{section.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {section.duration}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Basics
            </Button>
            <Button onClick={generateAllSections} disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building Sections...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Build All Sections
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">
              Section {currentSectionIndex + 1} of {sections.length}
            </h4>
            <Progress value={((currentSectionIndex + 1) / sections.length) * 100} className="w-32" />
          </div>
          
          {sections[currentSectionIndex] && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">Section Title</Label>
                <Input 
                  id="section-title"
                  value={sections[currentSectionIndex].title}
                  onChange={(e) => updateSection(currentSectionIndex, { title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="section-content">Content</Label>
                <Textarea 
                  id="section-content"
                  value={sections[currentSectionIndex].content}
                  onChange={(e) => updateSection(currentSectionIndex, { content: e.target.value })}
                  rows={6}
                />
              </div>

              {sections[currentSectionIndex].type === 'video' && (
                <div>
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input 
                    id="video-url"
                    value={sections[currentSectionIndex].videoUrl || ''}
                    onChange={(e) => updateSection(currentSectionIndex, { videoUrl: e.target.value })}
                    placeholder="YouTube or Vimeo URL"
                  />
                </div>
              )}

              {sections[currentSectionIndex].type === 'quiz' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Quiz Questions</Label>
                    <Button size="sm" onClick={() => addQuestion(currentSectionIndex)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                  
                  {sections[currentSectionIndex].questions?.map((question, qIndex) => (
                    <Card key={qIndex} className="p-4">
                      <div className="space-y-3">
                        <Input 
                          placeholder="Question text"
                          value={question.question}
                          onChange={(e) => updateQuestion(currentSectionIndex, qIndex, 'question', e.target.value)}
                        />
                        
                        {question.answers.map((answer, aIndex) => (
                          <div key={aIndex} className="flex gap-2">
                            <Input 
                              placeholder={`Answer ${aIndex + 1}`}
                              value={answer}
                              onChange={(e) => {
                                const newAnswers = [...question.answers];
                                newAnswers[aIndex] = e.target.value;
                                updateQuestion(currentSectionIndex, qIndex, 'answers', newAnswers);
                              }}
                            />
                            <Button 
                              size="sm" 
                              variant={question.correctAnswer === aIndex ? "default" : "outline"}
                              onClick={() => updateQuestion(currentSectionIndex, qIndex, 'correctAnswer', aIndex)}
                            >
                              {question.correctAnswer === aIndex ? 'Correct' : 'Mark Correct'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {sections[currentSectionIndex].type === 'slides' && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Presentation className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Google Slides Integration</h4>
                    </div>
                    <p className="text-sm text-blue-800 mb-3">
                      Generate an interactive Google Slides presentation based on your section content.
                    </p>
                    
                    {sections[currentSectionIndex].slidesData ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Presentation Created</span>
                          <Badge className="bg-green-100 text-green-800">
                            {sections[currentSectionIndex].slidesData.slides.length} slides
                          </Badge>
                        </div>
                        
                        {sections[currentSectionIndex].slidesData.presentationUrl && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(sections[currentSectionIndex].slidesData?.presentationUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Slides
                          </Button>
                        )}
                        
                        <div className="text-xs text-gray-600">
                          <strong>Slides:</strong>
                          {sections[currentSectionIndex].slidesData.slides.map((slide: any, idx: number) => (
                            <div key={idx} className="ml-2">• {slide.title}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => {
                          // We'll implement slides generation here
                          toast({
                            title: "Slides Generation",
                            description: "Google Slides integration will be available once configured.",
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Slides
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
              disabled={currentSectionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Section
            </Button>
            
            {currentSectionIndex < sections.length - 1 ? (
              <Button 
                onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
                className="flex-1"
              >
                Next Section
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={completeModule} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Module
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Step-by-Step Module Builder</h2>
          <p className="text-muted-foreground">Build your module one section at a time</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-8 h-1 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
}