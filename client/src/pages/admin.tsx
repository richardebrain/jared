import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import AdminTools from '@/components/AdminTools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Video, 
  Link2, 
  BookOpen,
  Brain,
  Sparkles,
  Lightbulb,
  Loader2,
  ArrowLeft, 
  FileEdit, 
  Save, 
  PlusCircle, 
  Trash2, 
  Image,
  FileQuestion,
  Plus,
  Settings,
  Users,
  ChevronRight,
  Info,
  Award,
  School,
  X
} from 'lucide-react';

export default function AdminPage({ skipPasswordCheck = false }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if already authenticated from sessionStorage or if skipPasswordCheck is true
    return sessionStorage.getItem('adminAuthenticated') === 'true' || skipPasswordCheck;
  });
  
  // Module Creator state
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    category: 'classroom-management',
    difficulty: 'beginner',
    estimatedTime: '15',
    customPoints: '',  // Added custom points field
    sections: [
      {
        title: 'Introduction',
        content: '',
        videoUrl: '',
        imageUrl: ''
      }
    ]
  });
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    questions: string[];
    strategies: string[];
    quizQuestions: {
      question: string;
      options: string[];
      correctAnswer: string;
    }[];
  }>({ 
    questions: [], 
    strategies: [],
    quizQuestions: []
  });
  

  
  // Admin password
  const ADMIN_PASSWORD = 'BIGSURF55';

  // User must be logged in to access admin page
  React.useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Login Required",
        description: "Please log in to access the admin page.",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [user, isLoading, navigate, toast]);

  const verifyPassword = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store authentication state in session storage
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
      setPassword('');
    }
  };

  const updateChildDevelopmentModule = async () => {
    try {
      await apiRequest('/api/modules/update-child-development', {
        method: 'POST'
      });
      
      toast({
        title: "Success",
        description: "Child Development module updated successfully",
      });
    } catch (error) {
      console.error("Error updating Child Development module:", error);
      toast({
        title: "Error",
        description: "Failed to update the Child Development module",
        variant: "destructive",
      });
    }
  };
  
  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('/api/modules', {
        method: 'POST',
        data: moduleData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setNewModule({
        title: '',
        description: '',
        category: 'classroom-management',
        difficulty: 'beginner',
        estimatedTime: '15',
        sections: [
          {
            title: 'Introduction',
            content: '',
            videoUrl: '',
            imageUrl: ''
          }
        ]
      });
      setIsCreatingModule(false);
      toast({
        title: "Module Created",
        description: "Your custom module has been created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: "Failed to create the module. Please try again.",
        variant: "destructive",
      });
      setIsCreatingModule(false);
    }
  });
  
  // Handle module creation
  const handleCreateModule = () => {
    // Validate module data
    if (!newModule.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!newModule.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Module description is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check if at least one section has content
    const hasContent = newModule.sections.some(section => 
      section.content.trim() || section.videoUrl.trim() || section.imageUrl.trim()
    );
    
    if (!hasContent) {
      toast({
        title: "Validation Error",
        description: "At least one section must have content, video, or image",
        variant: "destructive",
      });
      return;
    }
    
    // Create the module
    setIsCreatingModule(true);
    const moduleData = {
      ...newModule,
      schoolId: user?.schoolId,
      createdBy: user?.id,
      // Add tags based on category
      tags: [newModule.category, newModule.difficulty],
      // Add points based on estimated time and difficulty
      points: calculatePoints(newModule.estimatedTime, newModule.difficulty),
      createdAt: new Date().toISOString()
    };
    
    createModuleMutation.mutate(moduleData);
  };
  
  // Add a new section to the module
  const addModuleSection = () => {
    setNewModule(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: `Section ${prev.sections.length + 1}`,
          content: '',
          videoUrl: '',
          imageUrl: ''
        }
      ]
    }));
  };
  
  // Remove a section from the module
  const removeModuleSection = (index: number) => {
    if (newModule.sections.length <= 1) {
      toast({
        title: "Cannot Remove Section",
        description: "A module must have at least one section",
        variant: "destructive",
      });
      return;
    }
    
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };
  
  // Update a section in the module
  const updateModuleSection = (index: number, field: string, value: string) => {
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };
  
  // Calculate module points based on time and difficulty or use custom value
  const calculatePoints = (timeEstimate: string, difficulty: string): number => {
    // If custom points are set, use that value
    if (newModule.customPoints && !isNaN(parseInt(newModule.customPoints))) {
      return parseInt(newModule.customPoints);
    }
    
    // Otherwise calculate based on time and difficulty
    const basePoints = parseInt(timeEstimate) || 15;
    const difficultyMultiplier = 
      difficulty === 'advanced' ? 2 :
      difficulty === 'intermediate' ? 1.5 : 1;
    
    return Math.round(basePoints * difficultyMultiplier);
  };
  
  // Generate AI suggestions for module content
  const generateAiSuggestions = async (type: 'questions' | 'strategies' | 'quiz') => {
    setIsGeneratingIdeas(true);
    try {
      // Don't proceed if module title or category is empty
      if (!newModule.title || !newModule.category) {
        toast({
          title: "Missing Information",
          description: "Please provide a module title and category before generating suggestions.",
          variant: "destructive"
        });
        setIsGeneratingIdeas(false);
        return;
      }
      
      let promptText = '';
      
      if (type === 'questions') {
        promptText = `Generate 3 creative assessment questions for a module about "${newModule.title}" in the category of "${newModule.category}". The questions should be suitable for ${newModule.difficulty} level ECE teachers.`;
      } else if (type === 'strategies') {
        promptText = `Suggest 3 creative teaching strategies for a module about "${newModule.title}" in the category of "${newModule.category}". The strategies should be suitable for ${newModule.difficulty} level ECE teachers.`;
      } else if (type === 'quiz') {
        promptText = `Generate quiz questions about "${newModule.title}" in the category of "${newModule.category}" for ${newModule.difficulty} level ECE teachers.`;
      }
      
      console.log(`Making API request to /api/ai/generate with type: ${type}`);
      
      try {
        // Use a simple fetch call with proper error handling
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: promptText,
            type
          }),
          credentials: 'include'
        });
        
        console.log(`API Response status:`, response.status);
        
        if (!response.ok) {
          console.error(`Error response:`, response);
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`API Response data:`, data);
        
        if (type === 'quiz') {
          if (data.quizQuestions && Array.isArray(data.quizQuestions)) {
            setAiSuggestions(prev => ({
              ...prev,
              quizQuestions: data.quizQuestions
            }));
            
            toast({
              title: `Quiz Questions Generated`,
              description: `${data.quizQuestions.length} multiple-choice quiz questions have been created for your module.`,
            });
          }
        } else {
          // Split the suggestions string into an array by newline
          const suggestionsArray = data.suggestions ? data.suggestions.split('\n').filter(Boolean) : [];
          
          setAiSuggestions(prev => ({
            ...prev,
            [type]: suggestionsArray
          }));
          
          toast({
            title: `AI Suggestions Generated`,
            description: `Creative ${type} have been generated for your module.`,
          });
        }
      } catch (apiError) {
        console.error(`API call error:`, apiError);
        throw apiError;
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      toast({
        title: "Suggestion Error",
        description: `Could not generate creative ${type}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  if (isLoading || !user) return <div>Loading...</div>;
  
  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {if (e.key === 'Enter') verifyPassword()}}
                  placeholder="Enter admin password"
                />
              </div>
              <Button onClick={verifyPassword} className="w-full">
                Access Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Teacher Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="management">
        <TabsList className="mb-6">
          <TabsTrigger value="management">Content Management</TabsTrigger>
          <TabsTrigger value="module-creator">Module Creator</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="tools">System Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Management</CardTitle>
                <CardDescription>Update and fix learning module content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={updateChildDevelopmentModule}
                    className="w-full"
                  >
                    Update Child Development Module
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/modules');
                    }}
                  >
                    Manage All Modules
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Core Values Management</CardTitle>
                <CardDescription>Manage Core Values and Shout-Out system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/core-values');
                    }}
                  >
                    Manage Core Values System
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/shoutouts');
                    }}
                  >
                    View All Shout-Outs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="module-creator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-orange-500" />
                  <span>Custom Module Creator</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreateModule}
                  disabled={isCreatingModule}
                  className="flex items-center gap-2"
                >
                  {isCreatingModule ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Module</span>
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Create custom training modules for your teachers. These modules will appear in their dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Module Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Module Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-title">Module Title</Label>
                      <Input 
                        id="module-title" 
                        placeholder="Enter a concise, descriptive title" 
                        value={newModule.title}
                        onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="module-category">Category</Label>
                      <Select 
                        value={newModule.category}
                        onValueChange={(value) => setNewModule({...newModule, category: value})}
                      >
                        <SelectTrigger id="module-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classroom-management">Classroom Management</SelectItem>
                          <SelectItem value="child-development">Child Development</SelectItem>
                          <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="family-engagement">Family Engagement</SelectItem>
                          <SelectItem value="health-safety">Health & Safety</SelectItem>
                          <SelectItem value="inclusion">Inclusion & Diversity</SelectItem>
                          <SelectItem value="professional-development">Professional Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-difficulty">Difficulty Level</Label>
                      <Select 
                        value={newModule.difficulty}
                        onValueChange={(value) => setNewModule({...newModule, difficulty: value})}
                      >
                        <SelectTrigger id="module-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="module-time">Estimated Time (minutes)</Label>
                      <Input 
                        id="module-time" 
                        type="number" 
                        placeholder="15" 
                        value={newModule.estimatedTime}
                        onChange={(e) => setNewModule({...newModule, estimatedTime: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="module-custom-points">
                        Custom Points Value 
                        <span className="text-sm text-gray-500 ml-2">(Optional)</span>
                      </Label>
                      <Input 
                        id="module-custom-points" 
                        type="number" 
                        min="1"
                        max="100"
                        placeholder="Auto-calculated"
                        value={newModule.customPoints}
                        onChange={(e) => setNewModule({...newModule, customPoints: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current value: {calculatePoints(newModule.estimatedTime, newModule.difficulty)} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="module-description">Description</Label>
                    <Textarea 
                      id="module-description" 
                      placeholder="Provide a brief description of what teachers will learn in this module"
                      className="min-h-[100px]"
                      value={newModule.description}
                      onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                    />
                  </div>

                  {/* AI Creative Suggestion Tools */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <Brain className="h-5 w-5 text-blue-500 mr-2" />
                      AI Creative Tools
                    </h3>
                    <div className="text-sm text-gray-600 mb-3">
                      Need inspiration? Let AI help you generate creative ideas for your module.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiSuggestions('questions')}
                        disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {isGeneratingIdeas ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Generate Question Ideas
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiSuggestions('strategies')}
                        disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {isGeneratingIdeas ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Teaching Strategies
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiSuggestions('quiz')}
                        disabled={isGeneratingIdeas || !newModule.title || !newModule.description}
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        {isGeneratingIdeas ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileQuestion className="h-4 w-4 mr-2" />
                            Generate Quiz Questions
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* AI Suggestions Results Container - Always visible */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      {isGeneratingIdeas && (
                        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md border border-blue-100">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Generating creative suggestions...</p>
                          </div>
                        </div>
                      )}
                      
                      {!isGeneratingIdeas && aiSuggestions.questions.length === 0 && 
                       aiSuggestions.strategies.length === 0 && 
                       aiSuggestions.quizQuestions.length === 0 && (
                        <div className="p-6 bg-gray-50 rounded-md border border-blue-100 text-center">
                          <Brain className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <h3 className="text-sm font-medium mb-1">AI Suggestions Will Appear Here</h3>
                          <p className="text-xs text-gray-500">
                            Click any of the buttons above to generate creative content
                          </p>
                        </div>
                      )}
                      
                      {aiSuggestions.questions.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Question Ideas:</h4>
                          <ul className="space-y-2 text-sm">
                            {aiSuggestions.questions.map((question, i) => (
                              <li key={i} className="bg-white p-2 rounded border border-blue-100">
                                {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiSuggestions.strategies.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Teaching Strategy Ideas:</h4>
                          <ul className="space-y-2 text-sm">
                            {aiSuggestions.strategies.map((strategy, i) => (
                              <li key={i} className="bg-white p-2 rounded border border-blue-100">
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiSuggestions.quizQuestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <FileQuestion className="h-4 w-4 mr-2 text-purple-600" />
                            Quiz Questions:
                          </h4>
                          <div className="space-y-4 text-sm">
                            {aiSuggestions.quizQuestions.map((quizItem, i) => (
                              <div key={i} className="bg-white p-3 rounded border border-purple-200 space-y-2">
                                <p className="font-medium">{i+1}. {quizItem.question}</p>
                                <div className="pl-4">
                                  <ul className="space-y-1 list-disc ml-2">
                                    {quizItem.options.map((option, j) => (
                                      <li key={j} className={option === quizItem.correctAnswer ? "text-green-600 font-medium" : ""}>
                                        {option} {option === quizItem.correctAnswer && 
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-1">
                                            Correct Answer
                                          </span>
                                        }
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Add quiz questions to the module content
                                const newSection = {
                                  title: "Module Quiz",
                                  content: aiSuggestions.quizQuestions.map((q, i) => 
                                    `### Question ${i+1}: ${q.question}\n\n` +
                                    q.options.map((o, j) => `${j+1}. ${o}`).join('\n') +
                                    `\n\n**Correct Answer: ${q.correctAnswer}**\n\n`
                                  ).join('\n---\n'),
                                  videoUrl: '',
                                  imageUrl: ''
                                };
                                
                                setNewModule({
                                  ...newModule,
                                  sections: [...newModule.sections, newSection]
                                });
                                
                                toast({
                                  title: "Quiz Added to Module",
                                  description: "Quiz questions have been added as a new section",
                                });
                              }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Quiz to Module
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Module Sections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Module Sections</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addModuleSection}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Section
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {newModule.sections.map((section, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                              <Input
                                id={`section-title-${index}`}
                                value={section.title}
                                onChange={(e) => updateModuleSection(index, 'title', e.target.value)}
                                placeholder="Section Title"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => removeModuleSection(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`section-content-${index}`}>Content</Label>
                            <Textarea
                              id={`section-content-${index}`}
                              value={section.content}
                              onChange={(e) => updateModuleSection(index, 'content', e.target.value)}
                              placeholder="Enter the content for this section (Markdown formatting supported)"
                              className="min-h-[150px]"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`section-video-${index}`} className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-blue-500" />
                                Video URL (YouTube)
                              </Label>
                              <Input
                                id={`section-video-${index}`}
                                value={section.videoUrl}
                                onChange={(e) => updateModuleSection(index, 'videoUrl', e.target.value)}
                                placeholder="e.g., https://www.youtube.com/watch?v=..."
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`section-image-${index}`} className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-green-500" />
                                Image URL
                              </Label>
                              <Input
                                id={`section-image-${index}`}
                                value={section.imageUrl}
                                onChange={(e) => updateModuleSection(index, 'imageUrl', e.target.value)}
                                placeholder="e.g., https://example.com/image.jpg"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* Preview Section */}
                <Card className="bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Module Preview</CardTitle>
                    <CardDescription>
                      This is how your module will appear to teachers in their dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{newModule.title || "Module Title"}</h3>
                          <p className="text-sm text-gray-500">{newModule.description || "Module description will appear here."}</p>
                          
                          <div className="flex items-center gap-2 my-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {newModule.category === 'classroom-management' ? 'Classroom Management' :
                               newModule.category === 'child-development' ? 'Child Development' :
                               newModule.category === 'curriculum-planning' ? 'Curriculum Planning' :
                               newModule.category === 'assessment' ? 'Assessment' :
                               newModule.category === 'family-engagement' ? 'Family Engagement' :
                               newModule.category === 'health-safety' ? 'Health & Safety' :
                               newModule.category === 'inclusion' ? 'Inclusion & Diversity' :
                               'Professional Development'}
                            </Badge>
                            <Badge variant="outline" className={
                              newModule.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                              newModule.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }>
                              {newModule.difficulty === 'beginner' ? 'Beginner' :
                               newModule.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {newModule.estimatedTime} min
                            </span>
                          </div>
                        </div>
                        <div className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md text-sm">
                          {calculatePoints(newModule.estimatedTime, newModule.difficulty)} points
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Sections:</p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {newModule.sections.map((section, index) => (
                            <li key={index}>{section.title || `Section ${index + 1}`}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage teacher accounts, progress, and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTools />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>View system analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">This section is under development. Coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>System validation and maintenance tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Content Validation</h3>
                  <p className="text-muted-foreground mb-4">
                    Validate links, videos, and learning content across the platform
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <Video className="h-8 w-8 mb-2" />
                      <span>Validate Videos</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <Link2 className="h-8 w-8 mb-2" />
                      <span>Check Links</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <BookOpen className="h-8 w-8 mb-2" />
                      <span>Validate Module Content</span>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Database Maintenance</h3>
                  <p className="text-muted-foreground mb-4">
                    Database tools for system maintenance and optimization
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Database tools will be available in a future update."
                      });
                    }}
                  >
                    Database Maintenance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}