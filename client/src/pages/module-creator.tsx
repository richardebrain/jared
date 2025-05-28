import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Video, 
  Gamepad2, 
  ImageIcon, 
  Brain, 
  Headphones, 
  Drama,
  Sparkles,
  ArrowLeft,
  Save,
  Play,
  Clock,
  Award,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";

// Interface for module data
interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
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
}

// Module template types
const MODULE_TEMPLATES = [
  {
    id: "mini-video",
    title: "🎥 Mini Video Lessons",
    duration: "2-5 minutes",
    description: "Energetic, visual lessons with clear voiceovers. Perfect for 'How to Guide a Meltdown' or 'Positive Redirection Tips'",
    icon: Video,
    color: "bg-blue-50 border-blue-200",
    features: ["One concept per video", "Add bloopers for humor", "Classroom clips", "Clear voiceovers"]
  },
  {
    id: "interactive-scenario", 
    title: "🎮 Interactive Scenarios",
    duration: "3-7 minutes",
    description: "Choose-Your-Own-Adventure style learning. Like 'Jayden's Having a Rough Morning—What Do You Do?'",
    icon: Gamepad2,
    color: "bg-green-50 border-green-200",
    features: ["Multiple choice paths", "See consequences", "Real scenarios", "Interactive outcomes"]
  },
  {
    id: "visual-storyboard",
    title: "📸 Visual Storyboards", 
    duration: "1-3 minutes",
    description: "4-6 illustrated steps with captions or GIFs showing best practices",
    icon: ImageIcon,
    color: "bg-purple-50 border-purple-200",
    features: ["Step-by-step visuals", "GIF animations", "Quick reference", "Visual learning"]
  },
  {
    id: "quiz-teachback",
    title: "🧩 Quick Quiz + Teachback",
    duration: "2-4 minutes", 
    description: "3-question quiz with auto-feedback and 'why it matters' explanation",
    icon: Brain,
    color: "bg-orange-50 border-orange-200",
    features: ["Auto-feedback", "Badge rewards", "Knowledge check", "Bite-sized learning"]
  },
  {
    id: "audio-nugget",
    title: "🎙️ Podcast-Style Audio",
    duration: "3-8 minutes",
    description: "Perfect for commuting or classroom prep. 'In 5 Minutes: What Trauma-Informed Really Means'",
    icon: Headphones,
    color: "bg-pink-50 border-pink-200", 
    features: ["Voice variety", "On-the-go learning", "Expert interviews", "Story format"]
  },
  {
    id: "roleplay-reel",
    title: "🎭 Roleplay Reels",
    duration: "2-6 minutes",
    description: "Short skits showing 'What Not to Do' vs 'What to Try Instead' with voting",
    icon: Drama,
    color: "bg-yellow-50 border-yellow-200",
    features: ["Before/after scenarios", "Teacher voting", "Real situations", "Engaging skits"]
  }
];

interface ModuleCreatorProps {}

export default function ModuleCreator({}: ModuleCreatorProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  
  // Module creation data
  const [moduleData, setModuleData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
    pointValue: 10,
    estimatedTime: "5",
    templateType: ""
  });

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    questions: [],
    strategies: [],
    quizQuestions: []
  });

  // Default value for a new section when adding
  const defaultNewSection = {
    title: 'New Section',
    content: '',
    videoUrl: '',
    imageUrl: ''
  };

  // Fetch all modules including hidden ones
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules/management']
  });

  // Update module visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ moduleId, visible }: { moduleId: number, visible: boolean }) => {
      return await apiRequest('PATCH', `/api/modules/${moduleId}/visibility`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      toast({
        title: 'Module Updated',
        description: 'Module visibility has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the module. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update module content mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (module: Module) => {
      return await apiRequest('PATCH', `/api/modules/${module.id}`, module);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      setIsEditDialogOpen(false);
      setEditingModule(null);
      setIsUpdatingModule(false);
      toast({
        title: 'Module Updated Successfully',
        description: 'Module content has been updated.',
      });
    },
    onError: () => {
      setIsUpdatingModule(false);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the module. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Create new module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('POST', '/api/modules', moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      setCreateMode(false);
      setSelectedTemplate(null);
      setModuleData({
        title: "",
        description: "",
        category: "",
        difficulty: "beginner",
        pointValue: 10,
        estimatedTime: "5",
        templateType: ""
      });
      toast({
        title: 'Module Created Successfully',
        description: 'Your new module has been created and saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Creation Failed',
        description: 'There was a problem creating the module. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCreateMode(true);
    setModuleData({...moduleData, templateType: templateId});
  };

  const generateContentWithAI = async () => {
    if (!moduleData.title || !moduleData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the title and description before generating AI content.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingContent(true);
    
    try {
      const promptText = `Generate engaging content for a module titled "${moduleData.title}" in the category of "${moduleData.category}". The module description is: "${moduleData.description}". This should be suitable for ${moduleData.difficulty} level ECE teachers.`;
      
      const data = await apiRequest('POST', '/api/ai/generate', { 
        prompt: promptText,
        type: 'content'
      });
      
      if (data && data.suggestions) {
        setModuleData(prev => ({
          ...prev,
          aiGeneratedContent: data.suggestions
        }));
        
        toast({
          title: 'AI Content Generated!',
          description: 'AI has created engaging content for your module. Check the AI suggestions section below.',
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: 'There was an issue generating AI content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Generate AI suggestions for different types
  const generateAiSuggestions = async (type: 'questions' | 'strategies' | 'quiz') => {
    if (!moduleData.title || !moduleData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the title and description before generating AI suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingIdeas(true);
    
    try {
      let promptText = '';
      if (type === 'questions') {
        promptText = `Generate 3 creative assessment questions for a module about "${moduleData.title}" in the category of "${moduleData.category}". The questions should be suitable for ${moduleData.difficulty} level ECE teachers.`;
      } else if (type === 'strategies') {
        promptText = `Suggest 3 creative teaching strategies for a module about "${moduleData.title}" in the category of "${moduleData.category}". The strategies should be suitable for ${moduleData.difficulty} level ECE teachers.`;
      } else if (type === 'quiz') {
        promptText = `Generate quiz questions specifically for a module titled "${moduleData.title}" in the category of "${moduleData.category}" for ${moduleData.difficulty} level ECE teachers. The content should directly relate to ${moduleData.title}.`;
      }
      
      const data = await apiRequest('POST', '/api/ai/generate', { 
        prompt: promptText,
        type
      });
      
      if (type === 'quiz') {
        if (data && data.quizQuestions && Array.isArray(data.quizQuestions)) {
          setAiSuggestions(prev => ({
            ...prev,
            quizQuestions: data.quizQuestions
          }));
          
          toast({
            title: 'Quiz Questions Generated',
            description: `${data.quizQuestions.length} multiple-choice quiz questions have been created for your module.`,
          });
        }
      } else {
        if (data && data.suggestions) {
          const suggestionsText = data.suggestions;
          let suggestionsArray = suggestionsText.split('\n').filter(Boolean);
          
          setAiSuggestions(prev => ({
            ...prev,
            [type]: suggestionsArray
          }));
          
          toast({
            title: 'AI Suggestions Generated',
            description: `Creative ${type} have been generated for your module.`,
          });
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: 'There was an issue generating AI suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const saveNewModule = () => {
    if (!moduleData.title || !moduleData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the title and description.',
        variant: 'destructive',
      });
      return;
    }

    const template = MODULE_TEMPLATES.find(t => t.id === selectedTemplate);
    const newModule = {
      ...moduleData,
      sections: [defaultNewSection],
      templateType: selectedTemplate,
      templateTitle: template?.title
    };

    createModuleMutation.mutate(newModule);
  };

  // Handle visibility toggle
  const handleVisibilityChange = (moduleId: number, currentVisible: boolean) => {
    updateVisibilityMutation.mutate({
      moduleId,
      visible: !currentVisible
    });
  };

  // Handle opening the edit dialog
  const handleEditClick = (module: Module) => {
    const moduleCopy = JSON.parse(JSON.stringify(module));
    
    if (!moduleCopy.customPoints) {
      moduleCopy.customPoints = "0";
    }
    
    if (!moduleCopy.sections || !Array.isArray(moduleCopy.sections)) {
      moduleCopy.sections = [defaultNewSection];
    }
    
    setEditingModule(moduleCopy);
    setIsEditDialogOpen(true);
  };

  // Handle saving module changes
  const handleSaveModuleChanges = () => {
    if (editingModule) {
      setIsUpdatingModule(true);
      updateModuleMutation.mutate(editingModule);
    }
  };

  // Handle updating module fields
  const updateModuleField = (field: string, value: string) => {
    if (editingModule) {
      setEditingModule({
        ...editingModule,
        [field]: value
      });
    }
  };

  // Handle updating section fields
  const updateSectionField = (sectionIndex: number, field: string, value: string) => {
    if (editingModule) {
      const currentSections = editingModule.sections || [];
      
      if (currentSections[sectionIndex]) {
        const updatedSections = [...currentSections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          [field]: value
        };
        
        setEditingModule({
          ...editingModule,
          sections: updatedSections
        });
      }
    }
  };

  // Add a new section
  const addNewSection = () => {
    if (editingModule) {
      const currentSections = editingModule.sections || [];
      setEditingModule({
        ...editingModule,
        sections: [...currentSections, defaultNewSection]
      });
    }
  };

  // Remove a section
  const removeSection = (index: number) => {
    if (editingModule) {
      const currentSections = editingModule.sections || [];
      
      if (currentSections.length > 1) {
        const updatedSections = currentSections.filter((_, i) => i !== index);
        setEditingModule({
          ...editingModule,
          sections: updatedSections
        });
      } else {
        toast({
          title: "Cannot Remove Section",
          description: "A module must have at least one section.",
          variant: "destructive"
        });
      }
    }
  };

  // Search/filter modules
  const filteredModules = (modules && Array.isArray(modules)) ? modules.filter((module: Module) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      module.title.toLowerCase().includes(term) ||
      module.description.toLowerCase().includes(term) ||
      module.category.toLowerCase().includes(term)
    );
  }) : [];

  // CREATE MODE - Template Selection or Module Builder
  if (createMode && selectedTemplate) {
    const template = MODULE_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return null;
    
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setCreateMode(false);
              setSelectedTemplate(null);
            }}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Templates</span>
          </Button>
          <div className="flex items-center space-x-2">
            <template.icon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">{template.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Setup */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="module-title">Module Title</Label>
                  <Input
                    id="module-title"
                    placeholder="e.g., How to Guide a Meltdown with Compassion"
                    value={moduleData.title}
                    onChange={(e) => setModuleData({...moduleData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="module-description">Description</Label>
                  <Textarea
                    id="module-description"
                    placeholder="Brief description of what teachers will learn..."
                    rows={3}
                    value={moduleData.description}
                    onChange={(e) => setModuleData({...moduleData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="module-category">Category</Label>
                    <Input
                      id="module-category"
                      placeholder="e.g., Behavior Management"
                      value={moduleData.category}
                      onChange={(e) => setModuleData({...moduleData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-difficulty">Difficulty</Label>
                    <Select value={moduleData.difficulty} onValueChange={(value) => setModuleData({...moduleData, difficulty: value})}>
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
                    <Label htmlFor="module-points">Point Value</Label>
                    <Input
                      id="module-points"
                      type="number"
                      value={moduleData.pointValue}
                      onChange={(e) => setModuleData({...moduleData, pointValue: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-time">Estimated Time (minutes)</Label>
                    <Input
                      id="module-time"
                      type="number"
                      value={moduleData.estimatedTime}
                      onChange={(e) => setModuleData({...moduleData, estimatedTime: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template-Specific Content Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>AI Content Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Our AI will help you create engaging {template.title.toLowerCase()} content based on your topic.
                  </p>
                  
                  <Button 
                    onClick={generateContentWithAI}
                    disabled={!moduleData.title || isGeneratingContent}
                    className="w-full"
                  >
                    {isGeneratingContent ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {template.title} Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Info & Preview */}
          <div className="space-y-6">
            <Card className={template.color}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <template.icon className="h-5 w-5" />
                  <span>Template Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{template.duration}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">{template.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Includes:</p>
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Save Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={saveNewModule}
                  disabled={createModuleMutation.isPending}
                  className="w-full"
                >
                  {createModuleMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Creating Module...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Module
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // TEMPLATE SELECTION MODE
  if (createMode && !selectedTemplate) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCreateMode(false)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Module Management</span>
          </Button>
          <h1 className="text-2xl font-bold">Choose Template Type</h1>
        </div>

        <div className="text-center space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Create Engaging Training Modules</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from six proven template formats to create professional development content that your teachers will love.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULE_TEMPLATES.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${template.color} hover:scale-105`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <template.icon className="h-8 w-8" />
                  <div>
                    <div className="text-lg">{template.title}</div>
                    <div className="text-sm font-normal text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{template.duration}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 2).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button className="w-full mt-4" variant="outline">
                  Select Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Professional Results, Easy Creation</h3>
          <p className="text-gray-600 max-w-xl mx-auto">
            Each template includes built-in AI assistance, engagement features, and proven educational design patterns 
            to help you create modules that teachers actually want to complete.
          </p>
        </div>
      </div>
    );
  }

  // MAIN MANAGEMENT VIEW
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Module Creator & Management</h1>
          <p className="text-gray-600">Create new engaging modules or manage existing content</p>
        </div>
        <Button 
          onClick={() => setCreateMode(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Module</span>
        </Button>
      </div>

      {/* Module Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Modules</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search modules by title, description, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loading Modules</h3>
                <p className="text-gray-600">Please wait while we fetch all modules...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Modules</h3>
                <p className="text-gray-600 mb-4">There was a problem fetching the modules. Please try again later.</p>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No modules found. Create your first module to get started!</p>
                </div>
              ) : (
                filteredModules.map((module: Module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline">{module.category}</Badge>
                            <Badge variant={
                              module.difficulty === 'beginner' ? 'default' : 
                              module.difficulty === 'intermediate' ? 'secondary' : 
                              'destructive'
                            }>
                              {module.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-500">{module.pointValue} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {module.is_visible ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> 
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" /> 
                            Hidden
                          </Badge>
                        )}
                        <Switch
                          checked={module.is_visible}
                          onCheckedChange={() => handleVisibilityChange(module.id, module.is_visible)}
                          disabled={updateVisibilityMutation.isPending}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditClick(module)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingModule(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Module
            </DialogTitle>
            <DialogDescription>
              Make changes to the module content. These changes will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          
          {editingModule && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-module-title">Module Title</Label>
                  <Input 
                    id="edit-module-title" 
                    value={editingModule.title}
                    onChange={(e) => updateModuleField('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-module-category">Category</Label>
                  <Input 
                    id="edit-module-category" 
                    value={editingModule.category}
                    onChange={(e) => updateModuleField('category', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-module-difficulty">Difficulty Level</Label>
                  <Select 
                    value={editingModule.difficulty} 
                    onValueChange={(value) => updateModuleField('difficulty', value)}
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

                <div className="space-y-2">
                  <Label htmlFor="edit-module-points">Point Value</Label>
                  <Input 
                    id="edit-module-points" 
                    type="number"
                    value={editingModule.pointValue}
                    onChange={(e) => updateModuleField('pointValue', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-module-description">Description</Label>
                <Textarea 
                  id="edit-module-description" 
                  value={editingModule.description}
                  onChange={(e) => updateModuleField('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Module Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Module Sections</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addNewSection}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Section
                  </Button>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {editingModule.sections?.map((section, index) => (
                    <AccordionItem value={`section-${index}`} key={index}>
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-2">
                          Section {index + 1}: {section.title || 'Untitled Section'}
                          {editingModule.sections && editingModule.sections.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSection(index);
                              }}
                              className="ml-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                            <Input
                              id={`section-title-${index}`}
                              value={section.title}
                              onChange={(e) => updateSectionField(index, 'title', e.target.value)}
                              placeholder="Enter section title..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`section-content-${index}`}>Content</Label>
                            <Textarea
                              id={`section-content-${index}`}
                              value={section.content}
                              onChange={(e) => updateSectionField(index, 'content', e.target.value)}
                              placeholder="Enter section content..."
                              rows={4}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`section-video-${index}`}>Video URL (optional)</Label>
                              <Input
                                id={`section-video-${index}`}
                                value={section.videoUrl}
                                onChange={(e) => updateSectionField(index, 'videoUrl', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`section-image-${index}`}>Image URL (optional)</Label>
                              <Input
                                id={`section-image-${index}`}
                                value={section.imageUrl}
                                onChange={(e) => updateSectionField(index, 'imageUrl', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveModuleChanges}
                  disabled={isUpdatingModule}
                >
                  {isUpdatingModule ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}