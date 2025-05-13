import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  CheckCircle2, 
  Award,
  Bell,
  BookOpen,
  Eye,
  Hand,
  Heart,
  HelpCircle,
  Music,
  Play,
  Repeat,
  Sparkles,
  Star,
  ThumbsUp,
  Loader2,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define mini-lesson types
interface MiniLesson {
  id: number;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  difficulty: string;
  completed?: boolean;
  progress?: number;
}

interface UserProgress {
  id: number;
  userId: number;
  moduleId: number;
  progress: number;
  completed: boolean | null;
  recommended: boolean | null;
  pointsEarned: number | null;
  lastAccessed: Date | null;
}

export function MiniLessons() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<MiniLesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  
  // Get mini modules from the API (short duration modules, ≤ 7 minutes)
  const { data: allModules = [], isLoading: modulesLoading, isError: modulesError } = useQuery({
    queryKey: ['/api/modules'],
    select: (data: any) => {
      console.log("Modules data:", data);
      return Array.isArray(data) ? data.filter((module: any) => module.duration <= 7) : [];
    }
  });
  
  // Get assessments to determine recommended categories
  const { data: assessmentData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/assessments'],
  });
  
  // Log assessment data for debugging
  useEffect(() => {
    console.log("Assessment data received:", assessmentData);
  }, [assessmentData]);
  
  // Extract recommended categories from the most recent assessment
  const recentAssessment = useMemo(() => {
    // Check if assessment data exists
    if (!assessmentData) return null;
    
    // Handle case where assessments are directly an array
    if (Array.isArray(assessmentData)) {
      return assessmentData.length > 0 ? assessmentData[assessmentData.length - 1] : null;
    }
    
    // Handle case where assessments are nested in a property
    if (assessmentData?.assessments && Array.isArray(assessmentData.assessments)) {
      return assessmentData.assessments.length > 0 
        ? assessmentData.assessments[assessmentData.assessments.length - 1] 
        : null;
    }
    
    // Handle case where a single assessment is returned
    if (assessmentData?.id && assessmentData?.userId) {
      return assessmentData;
    }
    
    // No valid assessment found
    return null;
  }, [assessmentData]);
  
  // Extract growth areas from assessment if available
  const growthAreas = useMemo(() => {
    // If we have a recent assessment with growth areas
    if (recentAssessment?.growthAreas && Array.isArray(recentAssessment.growthAreas)) {
      return recentAssessment.growthAreas;
    }
    
    // Fallback: Extract from domain scores if available
    if (recentAssessment?.domainScores) {
      // Find domains with low scores (below 70%)
      const lowScoreDomains = Object.entries(recentAssessment.domainScores)
        .filter(([domain, data]) => data.score < 70)
        .map(([domain]) => domain);
      
      if (lowScoreDomains.length > 0) {
        return lowScoreDomains;
      }
    }
    
    // Final fallback: Use common essential categories
    return ['foundations', 'teaching-methods', 'classroom-management'];
  }, [recentAssessment]);
  
  // Filter modules to show only three recommended ones
  const modules = useMemo(() => {
    // If we have growth areas, prioritize mini-lessons from those categories
    if (growthAreas.length > 0) {
      // Create a map of category to its modules
      const categoryModules: Record<string, MiniLesson[]> = {};
      
      // Group modules by category
      allModules.forEach((module: MiniLesson) => {
        if (!categoryModules[module.category]) {
          categoryModules[module.category] = [];
        }
        categoryModules[module.category].push(module);
      });
      
      // Select one module from each growth area category if available
      const selectedModules: MiniLesson[] = [];
      
      // Map growth areas to module categories (since they might have slightly different naming)
      const growthAreaToCategory: Record<string, string> = {
        'social-emotional': 'social-emotional',
        'child-development': 'child-development',
        'curriculum-planning': 'curriculum-planning',
        'health-safety': 'health-safety',
        'teaching-methods': 'teaching-methods',
        'family-engagement': 'family-engagement',
        'classroom-management': 'classroom-management',
        'mindfulness': 'mindful-mornings',
        'inclusion': 'inclusion',
        'core-values': 'core-values'
      };
      
      // For each growth area, try to find a mini-lesson
      growthAreas.forEach(area => {
        const category = growthAreaToCategory[area] || area;
        if (categoryModules[category] && categoryModules[category].length > 0) {
          // Get a random module from this category
          const moduleIndex = Math.floor(Math.random() * categoryModules[category].length);
          selectedModules.push(categoryModules[category][moduleIndex]);
          // Remove this module so we don't select it again
          categoryModules[category].splice(moduleIndex, 1);
        }
      });
      
      // If we have less than 3 modules, add random modules from other categories
      if (selectedModules.length < 3) {
        const remainingModules = allModules.filter(module => 
          !selectedModules.some(m => m.id === module.id)
        );
        
        // Randomly select remaining modules
        while (selectedModules.length < 3 && remainingModules.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingModules.length);
          selectedModules.push(remainingModules[randomIndex]);
          remainingModules.splice(randomIndex, 1);
        }
      }
      
      // If we have more than 3, take only the first 3
      return selectedModules.slice(0, 3);
    }
    
    // If no growth areas (no assessment done), just return 3 random modules
    if (allModules.length <= 3) return allModules;
    
    // Select 3 random modules
    const randomModules = [...allModules].sort(() => 0.5 - Math.random()).slice(0, 3);
    return randomModules;
  }, [allModules, growthAreas]);
  
  // Get user progress
  const { data: progress = [] } = useQuery({
    queryKey: ['/api/progress'],
  });
  
  // Create a map of module progress with type safety
  const progressMap = useMemo(() => {
    if (!Array.isArray(progress)) return {};
    
    return progress.reduce((acc: Record<number, UserProgress>, curr: UserProgress) => {
      if (curr && typeof curr.moduleId === 'number') {
        acc[curr.moduleId] = curr;
      }
      return acc;
    }, {});
  }, [progress]);

  // Mutation for updating progress
  // Generate personalized lesson content
  // Get the user's profile data for learning style preferences
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLesson) return null;
      
      // Extract learning style from user preferences or default to visual
      const learningStyle = userData?.learningStyle?.preferred || 'visual';
      
      // Get personalized content from the API
      return apiRequest(`/api/lesson/generate`, {
        method: 'POST',
        data: {
          moduleId: selectedLesson.id,
          challenge: "Implementing personalized learning strategies for diverse learning styles",
          learningStyle
        }
      });
    },
    onSuccess: (data) => {
      setAiGeneratedContent(data);
      setIsGeneratingContent(false);
      setActiveTab('content');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate personalized content. Using default content instead.",
        variant: "destructive"
      });
      setIsGeneratingContent(false);
    }
  });

  const progressMutation = useMutation({
    mutationFn: (data: { moduleId: number, progress: number, completed: boolean }) => {
      return apiRequest(`/api/progress`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLessonCompleted(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle completing a mini-lesson
  const handleCompleteMiniLesson = () => {
    if (!selectedLesson) return;
    
    progressMutation.mutate({
      moduleId: selectedLesson.id,
      progress: 100,
      completed: true
    });
  };

  // Categories with their corresponding colors
  const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
    'classroom-management': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'social-emotional': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'mindful-mornings': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'health-safety': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'family-engagement': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'curriculum-planning': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    'core-values': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'active-listening': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    'quick-transition-techniques': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Quick Mini-Lessons</CardTitle>
            </div>
            <Link href="/mini-lessons">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                View All
              </Badge>
            </Link>
          </div>
          <CardDescription>
            5-10 minute activities for when you have a short break. Each mini-lesson awards points equal to their duration.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {modulesLoading ? (
            <div className="text-center py-8">Loading mini-lessons...</div>
          ) : modulesError ? (
            <div className="text-center py-8 text-red-500">Failed to load mini-lessons. Please try again later.</div>
          ) : allModules.length === 0 ? (
            <div className="text-center py-8">No mini-lessons available at this time.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Debug info in development */}
              {import.meta.env.DEV && (
                <div className="col-span-3 p-2 mb-4 bg-gray-100 text-xs rounded overflow-auto max-h-40">
                  <p>Growth Areas: {growthAreas.join(', ') || 'None'}</p>
                  <p>Total Modules: {allModules.length}</p>
                  <p>Selected Modules: {modules.length}</p>
                  <p>Progress Records: {Array.isArray(progress) ? progress.length : 0}</p>
                </div>
              )}
              
              {/* Fallback to allModules when modules is empty */}
              {(modules.length > 0 ? modules : allModules.slice(0, 3)).map((lesson: MiniLesson) => {
                const userProgress = progressMap[lesson.id];
                const completed = userProgress?.completed || false;
                const pointsEarned = userProgress?.pointsEarned || 0;
                
                const categoryStyle = categoryColors[lesson.category] || 
                  { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
                
                return (
                  <div 
                    key={lesson.id}
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} text-xs`}
                        >
                          {lesson.category.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                        <div className="flex items-center text-gray-500 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{lesson.duration} min</span>
                          {completed && (
                            <div className="flex items-center ml-2 text-green-600">
                              <Award className="h-3 w-3 mr-1" />
                              <span>{pointsEarned || lesson.duration} pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="font-medium mb-1">
                        {lesson.title}
                        {completed && <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-500" />}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      <Button 
                        variant={completed ? "outline" : "default"} 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setIsLessonOpen(true);
                          setLessonCompleted(completed);
                        }}
                      >
                        {completed ? 'Review Lesson' : 'Start Lesson'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Lesson Dialog */}
      <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center">
                  {selectedLesson.title}
                  {lessonCompleted && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
                </DialogTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{selectedLesson.duration} minutes</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`mt-2 ${
                    categoryColors[selectedLesson.category]?.bg || 'bg-gray-100'
                  } ${
                    categoryColors[selectedLesson.category]?.text || 'text-gray-800'
                  } ${
                    categoryColors[selectedLesson.category]?.border || 'border-gray-200'
                  }`}
                >
                  {selectedLesson.category.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Badge>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <p className="text-base">{selectedLesson.description}</p>
                
                {/* Tabs for different content types */}
                <Tabs defaultValue="video" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Play className="h-4 w-4" /> Video Content
                    </TabsTrigger>
                    <TabsTrigger 
                      value="content" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (!aiGeneratedContent && !isGeneratingContent) {
                          setIsGeneratingContent(true);
                          generateContentMutation.mutate();
                        }
                      }}
                    >
                      <Sparkles className="h-4 w-4" /> Personalized Content
                      {isGeneratingContent && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="video" className="mt-4">
                    {/* Interactive content based on the lesson category */}
                    {selectedLesson.category === 'quick-transition-techniques' && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100 shadow-sm">
                          <h3 className="text-lg font-semibold text-blue-800 mb-3">5 Transition Techniques</h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-blue-700 flex items-center">
                                <Music className="h-4 w-4 mr-2" />
                                Clean-Up Song
                              </h4>
                              <p className="text-sm mt-1">
                                Use a special song that signals it's time to clean up. Children know when the song ends, everyone should be finished cleaning.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-blue-700 flex items-center">
                                <Bell className="h-4 w-4 mr-2" />
                                Sound Signals
                              </h4>
                              <p className="text-sm mt-1">
                                Different sounds for different transitions: one bell for cleanup, two bells for lining up, etc.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-blue-700 flex items-center">
                                <Eye className="h-4 w-4 mr-2" />
                                Visual Countdown
                              </h4>
                              <p className="text-sm mt-1">
                                Show a visual timer so children can see how much time is left in the current activity.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-blue-700 flex items-center">
                                <Hand className="h-4 w-4 mr-2" />
                                Hand Signals
                              </h4>
                              <p className="text-sm mt-1">
                                Teach children to recognize different hand signals for various transitions.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-blue-700 flex items-center">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Question Game
                              </h4>
                              <p className="text-sm mt-1">
                                Ask fun questions like "If your name starts with A-M, line up first" to create organized movement.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Video Demonstration</h3>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src="https://www.youtube.com/embed/4T2Xq6-KRSk" 
                              title="Transition Techniques" 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Watch this video to see these transition techniques demonstrated in a real classroom setting.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedLesson.category === 'mindful-mornings' && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-5 border border-emerald-100 shadow-sm">
                          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Morning Mindfulness Routine</h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-emerald-700 flex items-center">
                                <Heart className="h-4 w-4 mr-2" />
                                Gratitude Circle
                              </h4>
                              <p className="text-sm mt-1">
                                Begin the day with children sharing one thing they're grateful for today.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-emerald-700 flex items-center">
                                <Eye className="h-4 w-4 mr-2" />
                                Mindful Seeing
                              </h4>
                              <p className="text-sm mt-1">
                                Guide children to silently observe something in the classroom for 30 seconds, noticing details.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-emerald-700 flex items-center">
                                <Repeat className="h-4 w-4 mr-2" />
                                Breathing Exercise
                              </h4>
                              <p className="text-sm mt-1">
                                Practice "balloon breathing" - inhale to fill the balloon, exhale to deflate it.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Video Demonstration</h3>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src="https://www.youtube.com/embed/n0DPXbwS9hQ" 
                              title="Morning Mindfulness for Children" 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            This video demonstrates simple mindfulness exercises that are perfect for starting the day.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedLesson.category === 'active-listening' && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-5 border border-cyan-100 shadow-sm">
                          <h3 className="text-lg font-semibold text-cyan-800 mb-3">Active Listening Techniques</h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-cyan-700 flex items-center">
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                SLANT Strategy
                              </h4>
                              <p className="text-sm mt-1">
                                Sit up straight, Listen, Ask questions, Nod your head, Track the speaker.
                              </p>
                            </div>
                            
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-cyan-700 flex items-center">
                                <Star className="h-4 w-4 mr-2" />
                                Paraphrase Practice
                              </h4>
                              <p className="text-sm mt-1">
                                Children practice repeating back what they heard in their own words.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Video Demonstration</h3>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src="https://www.youtube.com/embed/D6-L3LlenHQ" 
                              title="Active Listening Skills" 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            This video demonstrates how to teach active listening skills to young children.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedLesson.category !== 'quick-transition-techniques' && 
                     selectedLesson.category !== 'mindful-mornings' && 
                     selectedLesson.category !== 'active-listening' && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-5 border border-gray-200 shadow-sm">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">{selectedLesson.title} Key Points</h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded p-3 shadow-sm">
                              <h4 className="font-medium text-gray-700 flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Key Concept
                              </h4>
                              <p className="text-sm mt-1">
                                Explore the foundational concepts of {selectedLesson.category.split('-').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')} with practical examples.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Video Resources</h3>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                              title={selectedLesson.title} 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Watch this video to learn more about this topic and see practical demonstrations.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="content" className="mt-4">
                    {isGeneratingContent && !aiGeneratedContent && (
                      <div className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-center text-muted-foreground">Generating personalized content for you...</p>
                      </div>
                    )}
                    
                    {aiGeneratedContent && (
                      <div className="space-y-4 prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: aiGeneratedContent.content }} />
                        
                        {aiGeneratedContent.resources && aiGeneratedContent.resources.length > 0 && (
                          <div className="mt-6 border-t pt-4">
                            <h4 className="font-medium text-primary mb-2 flex items-center">
                              <Zap className="h-4 w-4 mr-2" />
                              Additional Resources
                            </h4>
                            <ul className="space-y-2">
                              {aiGeneratedContent.resources.map((resource, i) => (
                                <li key={i}>
                                  <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-start"
                                  >
                                    <span className="mr-2">•</span>
                                    {resource.title || resource.url}
                                  </a>
                                  {resource.description && (
                                    <p className="text-sm text-muted-foreground ml-4">{resource.description}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Building Chapter One
                  </h4>
                  <p className="text-sm">
                    Remember that this technique contributes to "Building Chapter One" for each child by 
                    creating a foundation of trust, engagement, and emotional safety in your classroom.
                  </p>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Complete the Mini-Lesson</h4>
                  <p>To earn your {selectedLesson.duration} points for this mini-lesson:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Review all of the content above</li>
                    <li>Try implementing one technique in your classroom</li>
                    <li>Consider how this helps build "Chapter One" for each child</li>
                    <li>Mark the lesson as completed below to receive your points</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                {!lessonCompleted ? (
                  <Button 
                    onClick={handleCompleteMiniLesson} 
                    disabled={progressMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {progressMutation.isPending ? 'Saving...' : 'Mark as Completed'}
                  </Button>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>You've completed this mini-lesson and earned {progressMap[selectedLesson.id]?.pointsEarned || selectedLesson.duration} points!</span>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}