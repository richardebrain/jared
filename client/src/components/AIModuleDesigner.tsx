import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Clock, 
  Users, 
  Zap,
  ChevronRight,
  ArrowLeft,
  Wand2,
  BookOpen,
  Play,
  CheckCircle,
  MessageSquare,
  Gamepad2,
  Video,
  FileQuestion,
  Eye,
  Loader2
} from "lucide-react";

interface ModuleOutline {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  totalDuration: number;
  learningObjectives: string[];
  keyTopics: string[];
  suggestedActivities: Array<{
    type: string;
    title: string;
    description: string;
    duration: number;
    engagement: string;
    rationale: string;
  }>;
  assessmentStrategy: string;
  adaptiveElements: string[];
}

interface AIModuleDesignerProps {
  onModuleComplete: (moduleData: any) => void;
  onBack: () => void;
}

export default function AIModuleDesigner({ onModuleComplete, onBack }: AIModuleDesignerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [moduleOutline, setModuleOutline] = useState<ModuleOutline | null>(null);
  const { toast } = useToast();

  // Form data for step-by-step collection
  const [formData, setFormData] = useState({
    topic: '',
    audience: '',
    goals: '',
    duration: '',
    difficulty: '',
    learningStyle: '',
    constraints: '',
    context: ''
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateModuleOutline = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-module-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          audience: formData.audience,
          goals: formData.goals,
          duration: parseInt(formData.duration),
          difficulty: formData.difficulty,
          learningStyle: formData.learningStyle,
          constraints: formData.constraints,
          context: formData.context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate module outline');
      }

      const outline = await response.json();
      setModuleOutline(outline);
      setCurrentStep(4);
      
      toast({
        title: "Module Outline Generated!",
        description: "AI has created a comprehensive learning design for your module.",
      });
    } catch (error) {
      console.error('Error generating module outline:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your module outline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const refineOutline = async (feedback: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/refine-module-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentOutline: moduleOutline,
          feedback: feedback,
          originalRequirements: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine module outline');
      }

      const refinedOutline = await response.json();
      setModuleOutline(refinedOutline);
      
      toast({
        title: "Module Refined!",
        description: "AI has updated your module based on your feedback.",
      });
    } catch (error) {
      console.error('Error refining module outline:', error);
      toast({
        title: "Refinement Failed",
        description: "There was an error refining your module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDetailedModule = async () => {
    if (!moduleOutline) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-detailed-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline: moduleOutline,
          requirements: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate detailed module');
      }

      const detailedModule = await response.json();
      
      // Ensure the original form data is preserved in the module data
      const moduleWithFormData = {
        ...detailedModule,
        originalTopic: formData.topic,
        originalGoals: formData.goals,
        originalContext: formData.context,
        formData: formData // Include full form data for reference
      };
      
      onModuleComplete(moduleWithFormData);
      
      toast({
        title: "Module Generated!",
        description: "Your complete learning module is ready for use.",
      });
    } catch (error) {
      console.error('Error generating detailed module:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the detailed module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'interactive': return <Brain className="h-4 w-4" />;
      case 'quiz': return <FileQuestion className="h-4 w-4" />;
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      case 'gamification': return <Gamepad2 className="h-4 w-4" />;
      case 'demonstration': return <Eye className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Step 1: Define Your Learning Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">What topic or skill do you want to teach?</Label>
                <Input 
                  id="topic"
                  placeholder="e.g., Effective Communication, Time Management, Conflict Resolution"
                  value={formData.topic}
                  onChange={(e) => updateFormData('topic', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="goals">What specific outcomes should learners achieve?</Label>
                <Textarea 
                  id="goals"
                  placeholder="e.g., Learners will be able to identify conflict triggers, apply active listening techniques, and facilitate productive conversations"
                  value={formData.goals}
                  onChange={(e) => updateFormData('goals', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="context">Where and when will this learning be applied?</Label>
                <Textarea 
                  id="context"
                  placeholder="e.g., In workplace team meetings, during customer service interactions, in daily management activities"
                  value={formData.context}
                  onChange={(e) => updateFormData('context', e.target.value)}
                />
              </div>

              <Button 
                onClick={() => setCurrentStep(2)} 
                className="w-full"
                disabled={!formData.topic || !formData.goals}
              >
                Next: Define Your Audience <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Step 2: Know Your Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audience">Who are your learners?</Label>
                <Textarea 
                  id="audience"
                  placeholder="e.g., New managers with 1-3 years experience, Customer service representatives, All staff members"
                  value={formData.audience}
                  onChange={(e) => updateFormData('audience', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">What's their experience level with this topic?</Label>
                <Select value={formData.difficulty} onValueChange={(value) => updateFormData('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Little to no experience</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Significant experience</SelectItem>
                    <SelectItem value="mixed">Mixed - Varied experience levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="learningStyle">How do they prefer to learn?</Label>
                <Select value={formData.learningStyle} onValueChange={(value) => updateFormData('learningStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select learning preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual - Charts, diagrams, videos</SelectItem>
                    <SelectItem value="hands-on">Hands-on - Practice and application</SelectItem>
                    <SelectItem value="collaborative">Collaborative - Discussion and teamwork</SelectItem>
                    <SelectItem value="self-paced">Self-paced - Individual progression</SelectItem>
                    <SelectItem value="mixed">Mixed - Variety of methods</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)} 
                  className="flex-1"
                  disabled={!formData.audience || !formData.difficulty}
                >
                  Next: Set Constraints <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Step 3: Set Your Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="duration">How much time do learners have?</Label>
                <Select value={formData.duration} onValueChange={(value) => updateFormData('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes - Quick bite</SelectItem>
                    <SelectItem value="10">10 minutes - Coffee break</SelectItem>
                    <SelectItem value="15">15 minutes - Short session</SelectItem>
                    <SelectItem value="20">20 minutes - Standard module</SelectItem>
                    <SelectItem value="30">30 minutes - Extended session</SelectItem>
                    <SelectItem value="45">45 minutes - Workshop style</SelectItem>
                    <SelectItem value="60">60 minutes - Full session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="constraints">Any specific constraints or requirements?</Label>
                <Textarea 
                  id="constraints"
                  placeholder="e.g., Mobile-friendly, no videos (low bandwidth), must include assessment, needs to be completed in one sitting"
                  value={formData.constraints}
                  onChange={(e) => updateFormData('constraints', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">AI will optimize for:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Varied engagement methods to maintain attention</li>
                  <li>• Appropriate pacing for your time constraints</li>
                  <li>• Learning activities that match your audience</li>
                  <li>• Clear progression from basic to applied knowledge</li>
                  <li>• Built-in assessment and reinforcement</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={generateModuleOutline} 
                  className="flex-1"
                  disabled={!formData.duration || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Module Design
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return moduleOutline ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Generated Module Design
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{moduleOutline.title}</h3>
                  <p className="text-muted-foreground">{moduleOutline.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">{moduleOutline.category}</Badge>
                    <Badge variant="outline">{moduleOutline.totalDuration} minutes</Badge>
                    <Badge variant="outline">{moduleOutline.targetAudience}</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Learning Objectives</h4>
                  <div className="grid gap-2">
                    {moduleOutline.learningObjectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Suggested Learning Journey</h4>
                  <div className="space-y-3">
                    {moduleOutline.suggestedActivities.map((activity, index) => (
                      <Card key={index} className="border-l-4 border-l-primary/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {getActivityIcon(activity.type)}
                                  <h5 className="font-medium">{activity.title}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {activity.duration}m
                            </div>
                          </div>
                          <div className="ml-11">
                            <p className="text-xs text-muted-foreground">
                              <strong>Why this works:</strong> {activity.rationale}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Assessment Strategy</h4>
                    <p className="text-sm text-muted-foreground">{moduleOutline.assessmentStrategy}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Adaptive Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {moduleOutline.adaptiveElements.map((element, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Zap className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                          {element}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Refine This Design</h4>
                  <Textarea 
                    placeholder="What would you like to change? e.g., 'Add more interactive elements', 'Make it more focused on practical application', 'Include group activities'"
                    className="min-h-[80px]"
                    id="refinement-feedback"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const feedback = (document.getElementById('refinement-feedback') as HTMLTextAreaElement)?.value;
                        if (feedback) refineOutline(feedback);
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Refine Design
                    </Button>
                    <Button onClick={generateDetailedModule} disabled={isGenerating}>
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Build Complete Module
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Module Designer</h2>
          <p className="text-muted-foreground">Let AI help you design effective micro-learning experiences</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
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
              {step < 4 && (
                <div className={`w-8 h-1 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {renderStep()}
    </div>
  );
}