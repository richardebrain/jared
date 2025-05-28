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
  Share2,
  Upload,
  FileText,
  X
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
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

  // Handle file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file size (10MB max per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setIsProcessingFiles(true);
      
      // Process files and extract text content
      try {
        for (const file of validFiles) {
          const text = await extractTextFromFile(file);
          if (text) {
            setPodcastData(prev => ({
              ...prev,
              content: prev.content + (prev.content ? '\n\n' : '') + `# Content from ${file.name}\n\n${text}`
            }));
          }
        }
        
        toast({
          title: "Files uploaded successfully!",
          description: `Processed ${validFiles.length} file(s). Content has been added for podcast generation.`
        });
      } catch (error) {
        toast({
          title: "Error processing files",
          description: "There was an issue extracting content from some files.",
          variant: "destructive"
        });
      } finally {
        setIsProcessingFiles(false);
      }
    }
  };

  // Extract text content from uploaded files
  const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read ${file.name}`));
      };

      // For text files, read as text
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      } else {
        // For other files, we'll need a more sophisticated text extraction
        // For now, just prompt user to copy-paste content
        toast({
          title: "File format notice",
          description: `${file.name}: Please copy and paste the content manually for best results.`
        });
        resolve('');
      }
    });
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

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

      {/* Content Upload */}
      <Card>
        <CardHeader>
          <CardTitle>📁 Upload Your Content for AI Podcasters</CardTitle>
          <CardDescription>
            Provide your educational materials - the AI will analyze your content and create an engaging conversation between two podcast hosts discussing your topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">What to Upload for Your Podcast</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• <strong>Training materials</strong> - handouts, guides, or curriculum content</li>
                  <li>• <strong>Research articles</strong> - studies or best practices you want discussed</li>
                  <li>• <strong>Classroom strategies</strong> - techniques or methods you use</li>
                  <li>• <strong>Real scenarios</strong> - challenging situations and how to handle them</li>
                  <li>• <strong>Policy information</strong> - regulations or procedures to explain</li>
                </ul>
                <p className="text-sm text-blue-600 mt-2">
                  The AI will create natural conversations between podcast hosts who discuss your content in an engaging, educational way.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Your Educational Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your training materials, research findings, classroom strategies, or any educational content you want the podcast hosts to discuss. Be as detailed as possible - the more content you provide, the richer the conversation will be!"
                value={podcastData.content}
                onChange={(e) => setPodcastData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
              />
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Upload Documents</h4>
                  <p className="text-sm text-gray-600">Upload PDFs, Word docs, or text files for the AI to analyze</p>
                </div>
                <div className="flex justify-center">
                  <input
                    type="file"
                    id="document-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="document-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, Word docs, text files (Max 10MB each)
                </p>
              </div>
            </div>

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">{file.name}</span>
                        <span className="text-xs text-green-600">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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