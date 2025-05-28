import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  Download, 
  Play,
  Pause,
  Volume2,
  Clock,
  Users,
  Lightbulb,
  Sparkles,
  FileAudio,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PodcastData {
  title: string;
  topic: string;
  style: string;
  duration: string;
  ageGroup: string;
  content: string;
  learningObjectives: string[];
  keyMessages: string[];
}

export default function NotebookLMPodcastGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [podcastData, setPodcastData] = useState<PodcastData>({
    title: "",
    topic: "",
    style: "",
    duration: "",
    ageGroup: "",
    content: "",
    learningObjectives: [],
    keyMessages: []
  });

  const podcastStyles = [
    {
      id: "educational-conversation",
      title: "Educational Conversation",
      description: "Two educators discussing the topic in an engaging dialogue",
      icon: Users,
      duration: "3-8 minutes"
    },
    {
      id: "story-narrative",
      title: "Story-Based Learning",
      description: "Educational content presented as an engaging story",
      icon: FileAudio,
      duration: "5-10 minutes"
    },
    {
      id: "guided-reflection",
      title: "Guided Reflection",
      description: "Thoughtful exploration of teaching practices and strategies",
      icon: Lightbulb,
      duration: "4-7 minutes"
    },
    {
      id: "quick-tips",
      title: "Quick Tips & Strategies",
      description: "Fast-paced, practical tips for immediate classroom use",
      icon: Sparkles,
      duration: "2-5 minutes"
    }
  ];

  const generatePodcast = async () => {
    if (!podcastData.title || !podcastData.content || !podcastData.style) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title, content, and select a style",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await apiRequest("/api/notebook-lm/generate-podcast", {
        method: "POST",
        data: {
          title: podcastData.title,
          topic: podcastData.topic,
          style: podcastData.style,
          duration: podcastData.duration,
          ageGroup: podcastData.ageGroup,
          content: podcastData.content,
          learningObjectives: podcastData.learningObjectives,
          keyMessages: podcastData.keyMessages
        }
      });

      if (result.success && result.audioUrl) {
        setGeneratedAudio(result.audioUrl);
        toast({
          title: "Podcast Generated!",
          description: "Your audio content is ready to use in lessons"
        });
      } else {
        throw new Error("Failed to generate podcast");
      }
    } catch (error) {
      console.error("Error generating podcast:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate podcast. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addLearningObjective = (objective: string) => {
    if (objective.trim()) {
      setPodcastData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objective.trim()]
      }));
    }
  };

  const addKeyMessage = (message: string) => {
    if (message.trim()) {
      setPodcastData(prev => ({
        ...prev,
        keyMessages: [...prev.keyMessages, message.trim()]
      }));
    }
  };

  const removeItem = (list: string[], index: number, field: 'learningObjectives' | 'keyMessages') => {
    setPodcastData(prev => ({
      ...prev,
      [field]: list.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
          <Mic className="mr-3 h-6 w-6 text-purple-600" />
          Podcast-Style Audio Generator
        </h2>
        <p className="text-gray-600">
          Create engaging audio content using AI-powered conversation generation
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Podcast Details</CardTitle>
          <CardDescription>
            Set up the basic information for your educational audio content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Podcast Title</Label>
              <Input
                id="title"
                placeholder="e.g., Managing Challenging Behaviors"
                value={podcastData.title}
                onChange={(e) => setPodcastData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic">Main Topic</Label>
              <Select value={podcastData.topic} onValueChange={(value) => setPodcastData(prev => ({ ...prev, topic: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classroom-management">Classroom Management</SelectItem>
                  <SelectItem value="child-development">Child Development</SelectItem>
                  <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                  <SelectItem value="parent-communication">Parent Communication</SelectItem>
                  <SelectItem value="sel">Social-Emotional Learning</SelectItem>
                  <SelectItem value="assessment">Assessment & Observation</SelectItem>
                  <SelectItem value="inclusive-practices">Inclusive Practices</SelectItem>
                  <SelectItem value="professional-growth">Professional Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Target Duration</Label>
              <Select value={podcastData.duration} onValueChange={(value) => setPodcastData(prev => ({ ...prev, duration: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="How long should it be?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-3 minutes">2-3 minutes (Quick tip)</SelectItem>
                  <SelectItem value="5-7 minutes">5-7 minutes (Standard)</SelectItem>
                  <SelectItem value="8-12 minutes">8-12 minutes (In-depth)</SelectItem>
                  <SelectItem value="15+ minutes">15+ minutes (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageGroup">Target Age Group</Label>
              <Select value={podcastData.ageGroup} onValueChange={(value) => setPodcastData(prev => ({ ...prev, ageGroup: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infants">Infants (0-18 months)</SelectItem>
                  <SelectItem value="toddlers">Toddlers (18-36 months)</SelectItem>
                  <SelectItem value="preschool">Preschool (3-4 years)</SelectItem>
                  <SelectItem value="pre-k">Pre-K (4-5 years)</SelectItem>
                  <SelectItem value="mixed">Mixed Ages (0-5 years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Podcast Style</CardTitle>
          <CardDescription>
            Choose how you want your content to be presented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {podcastStyles.map((style) => {
              const IconComponent = style.icon;
              return (
                <Card 
                  key={style.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    podcastData.style === style.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPodcastData(prev => ({ ...prev, style: style.id }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-6 w-6 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{style.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                        <Badge variant="outline" className="mt-2">
                          <Clock className="mr-1 h-3 w-3" />
                          {style.duration}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Input */}
      <Card>
        <CardHeader>
          <CardTitle>Content & Learning Goals</CardTitle>
          <CardDescription>
            Provide the educational content and key points you want covered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Main Content</Label>
            <Textarea
              id="content"
              placeholder="Describe the educational content, key concepts, strategies, or information you want to include in the podcast..."
              value={podcastData.content}
              onChange={(e) => setPodcastData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Learning Objectives</Label>
              <ListEditor 
                items={podcastData.learningObjectives}
                placeholder="Add a learning objective"
                onAdd={addLearningObjective}
                onRemove={(index) => removeItem(podcastData.learningObjectives, index, 'learningObjectives')}
              />
            </div>

            <div className="space-y-3">
              <Label>Key Messages</Label>
              <ListEditor 
                items={podcastData.keyMessages}
                placeholder="Add a key message or takeaway"
                onAdd={addKeyMessage}
                onRemove={(index) => removeItem(podcastData.keyMessages, index, 'keyMessages')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation & Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Podcast</CardTitle>
          <CardDescription>
            Create AI-generated audio content based on your specifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generatePodcast}
            disabled={isGenerating || !podcastData.title || !podcastData.content || !podcastData.style}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                Generating Audio Content...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Generate Podcast-Style Audio
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing with Notebook LM AI...</span>
                <span>This may take 2-3 minutes</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}

          {/* Audio Preview */}
          {generatedAudio && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-900">Your Podcast is Ready!</h4>
                <Badge variant="default" className="bg-green-600">
                  <FileAudio className="mr-1 h-3 w-3" />
                  Audio Generated
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center"
                >
                  {isPlaying ? (
                    <Pause className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'} Preview
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Audio
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Add to Lesson
                </Button>
              </div>

              <audio 
                controls 
                className="w-full"
                src={generatedAudio}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Podcast Creation Tips</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Be specific about the educational concepts and strategies you want covered</li>
              <li>• Include real classroom scenarios or examples in your content description</li>
              <li>• Shorter podcasts (5-7 minutes) are often more engaging for busy teachers</li>
              <li>• Consider creating series of related podcasts for comprehensive topics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ 
  items, 
  placeholder, 
  onAdd, 
  onRemove 
}: { 
  items: string[], 
  placeholder: string, 
  onAdd: (item: string) => void,
  onRemove: (index: number) => void
}) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem);
      setNewItem("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newItem.trim()} size="sm">
          Add
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <span className="text-sm flex-1">{item}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
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