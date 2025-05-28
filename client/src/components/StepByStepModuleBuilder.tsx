import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  Video, 
  Lightbulb, 
  CheckCircle,
  Sparkles,
  Play,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BuilderStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface VideoLessonData {
  title: string;
  topic: string;
  duration: string;
  ageGroup: string;
  learningObjectives: string[];
  videoDescription: string;
  keyPoints: string[];
  discussionQuestions: string[];
  followUpActivities: string[];
}

export default function StepByStepModuleBuilder() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoLessonData, setVideoLessonData] = useState<VideoLessonData>({
    title: "",
    topic: "",
    duration: "",
    ageGroup: "",
    learningObjectives: [],
    videoDescription: "",
    keyPoints: [],
    discussionQuestions: [],
    followUpActivities: []
  });

  const steps: BuilderStep[] = [
    {
      id: "basics",
      title: "Basic Information",
      description: "Let's start with the fundamentals of your video lesson",
      component: <BasicInfoStep />
    },
    {
      id: "objectives",
      title: "Learning Objectives",
      description: "Define what children will learn from this video",
      component: <ObjectivesStep />
    },
    {
      id: "content",
      title: "Video Content",
      description: "Plan the main content and key points",
      component: <ContentStep />
    },
    {
      id: "engagement",
      title: "Engagement & Follow-up",
      description: "Add discussion questions and activities",
      component: <EngagementStep />
    },
    {
      id: "review",
      title: "Review & Generate",
      description: "Review your lesson and generate the final module",
      component: <ReviewStep />
    }
  ];

  function BasicInfoStep() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              placeholder="e.g., Understanding Emotions Through Colors"
              value={videoLessonData.title}
              onChange={(e) => setVideoLessonData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="topic">Main Topic</Label>
            <Select value={videoLessonData.topic} onValueChange={(value) => setVideoLessonData(prev => ({ ...prev, topic: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social-emotional">Social-Emotional Learning</SelectItem>
                <SelectItem value="cognitive">Cognitive Development</SelectItem>
                <SelectItem value="language">Language & Literacy</SelectItem>
                <SelectItem value="math">Math Concepts</SelectItem>
                <SelectItem value="science">Science & Discovery</SelectItem>
                <SelectItem value="physical">Physical Development</SelectItem>
                <SelectItem value="creative">Creative Arts</SelectItem>
                <SelectItem value="behavior">Behavior Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Video Duration</Label>
            <Select value={videoLessonData.duration} onValueChange={(value) => setVideoLessonData(prev => ({ ...prev, duration: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="How long should the video be?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-3 minutes">2-3 minutes (Quick concept)</SelectItem>
                <SelectItem value="5-7 minutes">5-7 minutes (Standard lesson)</SelectItem>
                <SelectItem value="10-12 minutes">10-12 minutes (Detailed exploration)</SelectItem>
                <SelectItem value="15+ minutes">15+ minutes (Comprehensive topic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup">Target Age Group</Label>
            <Select value={videoLessonData.ageGroup} onValueChange={(value) => setVideoLessonData(prev => ({ ...prev, ageGroup: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toddlers">Toddlers (18-36 months)</SelectItem>
                <SelectItem value="preschool">Preschool (3-4 years)</SelectItem>
                <SelectItem value="pre-k">Pre-K (4-5 years)</SelectItem>
                <SelectItem value="mixed">Mixed Ages (2-5 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Builder Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                Keep video lessons short and focused on one main concept. Children's attention spans are limited, 
                so aim for engagement over duration.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ObjectivesStep() {
    const [newObjective, setNewObjective] = useState("");

    const addObjective = () => {
      if (newObjective.trim()) {
        setVideoLessonData(prev => ({
          ...prev,
          learningObjectives: [...prev.learningObjectives, newObjective.trim()]
        }));
        setNewObjective("");
      }
    };

    const removeObjective = (index: number) => {
      setVideoLessonData(prev => ({
        ...prev,
        learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
      }));
    };

    const generateObjectives = async () => {
      if (!videoLessonData.title || !videoLessonData.topic) {
        toast({
          title: "Missing Information",
          description: "Please complete the basic information first",
          variant: "destructive"
        });
        return;
      }

      setIsGenerating(true);
      try {
        const result = await apiRequest("/api/ai/generate-objectives", {
          method: "POST",
          data: {
            title: videoLessonData.title,
            topic: videoLessonData.topic,
            ageGroup: videoLessonData.ageGroup
          }
        });

        if (result.objectives) {
          setVideoLessonData(prev => ({
            ...prev,
            learningObjectives: result.objectives
          }));
          toast({
            title: "Objectives Generated!",
            description: "AI has suggested learning objectives for your lesson"
          });
        }
      } catch (error) {
        toast({
          title: "Generation Failed",
          description: "Unable to generate objectives. Please add them manually.",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">What will children learn?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Define 2-4 clear, measurable learning objectives for your video lesson.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Children will identify basic emotions"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addObjective()}
            />
            <Button onClick={addObjective} disabled={!newObjective.trim()}>
              Add
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={generateObjectives}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {videoLessonData.learningObjectives.length > 0 && (
          <div className="space-y-2">
            <Label>Learning Objectives ({videoLessonData.learningObjectives.length})</Label>
            <div className="space-y-2">
              {videoLessonData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{objective}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function ContentStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Plan Your Video Content</h3>
          <p className="text-sm text-gray-600 mb-4">
            Describe what will happen in the video and the key points to cover.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoDescription">Video Description & Flow</Label>
            <Textarea
              id="videoDescription"
              placeholder="Describe what happens in the video: introduction, main content, examples, demonstrations, etc."
              value={videoLessonData.videoDescription}
              onChange={(e) => setVideoLessonData(prev => ({ ...prev, videoDescription: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Play className="mr-2 h-4 w-4" />
                Key Points to Cover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeyPointsEditor 
                points={videoLessonData.keyPoints}
                onChange={(points) => setVideoLessonData(prev => ({ ...prev, keyPoints: points }))}
              />
            </CardContent>
          </Card>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Video Structure Tips</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Start with a hook (question, surprise, or familiar character)</li>
                  <li>• Keep explanations simple and visual</li>
                  <li>• Include opportunities for children to participate</li>
                  <li>• End with a clear summary or call to action</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function KeyPointsEditor({ points, onChange }: { points: string[], onChange: (points: string[]) => void }) {
    const [newPoint, setNewPoint] = useState("");

    const addPoint = () => {
      if (newPoint.trim()) {
        onChange([...points, newPoint.trim()]);
        setNewPoint("");
      }
    };

    const removePoint = (index: number) => {
      onChange(points.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder="Add a key point to cover"
            value={newPoint}
            onChange={(e) => setNewPoint(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPoint()}
          />
          <Button onClick={addPoint} disabled={!newPoint.trim()} size="sm">
            Add
          </Button>
        </div>

        {points.length > 0 && (
          <div className="space-y-2">
            {points.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm">{point}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePoint(index)}
                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function EngagementStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Engagement & Follow-up</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add discussion questions and follow-up activities to reinforce learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Discussion Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ListEditor 
                items={videoLessonData.discussionQuestions}
                placeholder="Add a discussion question"
                onChange={(items) => setVideoLessonData(prev => ({ ...prev, discussionQuestions: items }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Follow-up Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ListEditor 
                items={videoLessonData.followUpActivities}
                placeholder="Add a follow-up activity"
                onChange={(items) => setVideoLessonData(prev => ({ ...prev, followUpActivities: items }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function ListEditor({ items, placeholder, onChange }: { 
    items: string[], 
    placeholder: string, 
    onChange: (items: string[]) => void 
  }) {
    const [newItem, setNewItem] = useState("");

    const addItem = () => {
      if (newItem.trim()) {
        onChange([...items, newItem.trim()]);
        setNewItem("");
      }
    };

    const removeItem = (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <Button onClick={addItem} disabled={!newItem.trim()} size="sm">
            Add
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-start justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm flex-1">{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0 ml-2"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function ReviewStep() {
    const generateModule = async () => {
      setIsGenerating(true);
      try {
        const result = await apiRequest("/api/modules/create-video-lesson", {
          method: "POST",
          data: videoLessonData
        });

        if (result.success) {
          toast({
            title: "Module Created!",
            description: "Your video lesson module has been successfully created and saved."
          });
          // Reset form or redirect to module
        }
      } catch (error) {
        toast({
          title: "Creation Failed",
          description: "Unable to create module. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Review Your Video Lesson</h3>
          <p className="text-sm text-gray-600 mb-4">
            Review all the details before generating your final module.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="mr-2 h-5 w-5" />
              {videoLessonData.title || "Untitled Lesson"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Topic:</strong> {videoLessonData.topic}</div>
              <div><strong>Duration:</strong> {videoLessonData.duration}</div>
              <div><strong>Age Group:</strong> {videoLessonData.ageGroup}</div>
              <div><strong>Objectives:</strong> {videoLessonData.learningObjectives.length}</div>
            </div>

            {videoLessonData.videoDescription && (
              <div>
                <strong>Video Description:</strong>
                <p className="text-sm text-gray-600 mt-1">{videoLessonData.videoDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Key Points:</strong> {videoLessonData.keyPoints.length}</div>
              <div><strong>Discussion Questions:</strong> {videoLessonData.discussionQuestions.length}</div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={generateModule}
          disabled={isGenerating || !videoLessonData.title}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Creating Your Module...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Video Lesson Module
            </>
          )}
        </Button>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic info
        return videoLessonData.title && videoLessonData.topic && videoLessonData.duration && videoLessonData.ageGroup;
      case 1: // Objectives
        return videoLessonData.learningObjectives.length > 0;
      case 2: // Content
        return videoLessonData.videoDescription;
      case 3: // Engagement
        return true; // Optional step
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Video Lesson Builder</h1>
        <p className="text-gray-600 mb-4">Create engaging video lessons step by step with AI assistance</p>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center space-x-4 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-1 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {steps[currentStep].component}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button 
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Badge variant="secondary" className="px-4 py-2">
            Ready to Create!
          </Badge>
        )}
      </div>
    </div>
  );
}