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
  ThumbsUp
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
                  <Badge 
                    variant="outline" 
                    className={`ml-3 ${categoryColors[selectedLesson.category]?.bg || 'bg-gray-100'} ${categoryColors[selectedLesson.category]?.text || 'text-gray-800'}`}
                  >
                    {selectedLesson.category.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Badge>
                </div>
                <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-200 inline-flex w-auto">
                  <Award className="h-4 w-4 mr-1" />
                  Worth {selectedLesson.duration} points
                </Badge>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <p className="text-base">{selectedLesson.description}</p>
                
                {/* Interactive content based on the lesson category */}
                {selectedLesson.category === 'quick-transition-techniques' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100 shadow-sm">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">5 Transition Techniques</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Music className="h-5 w-5 mr-2 text-blue-500" />
                            Technique 1: Transition Songs
                          </h4>
                          <p className="mt-2 text-gray-700">Use simple, catchy songs to signal transition times. For example:</p>
                          <div className="bg-yellow-50 p-3 rounded mt-2 border-l-4 border-yellow-300">
                            <p className="italic">"Clean up, clean up, everybody everywhere. Clean up, clean up, everybody do your share!"</p>
                          </div>
                          <div className="mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Play className="h-4 w-4 mr-1" /> Listen to example
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-blue-500" />
                            Technique 2: Visual Timers
                          </h4>
                          <p className="mt-2 text-gray-700">Use visual timers like hourglasses or digital timers that children can see. Give 5-minute and 1-minute warnings.</p>
                          <div className="bg-blue-50 p-2 rounded mt-2 flex justify-center">
                            <div className="relative w-20 h-24 bg-gradient-to-b from-red-400 to-red-500 rounded-md overflow-hidden">
                              <div className="absolute top-0 left-0 w-full bg-gray-200 h-1/2"></div>
                              <div className="absolute top-0 left-0 right-0 h-full flex justify-center items-center text-white font-bold">
                                Timer
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-blue-500" />
                            Technique 3: Sound Signals
                          </h4>
                          <p className="mt-2 text-gray-700">Use different instruments or sounds to signal different transitions:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                            <li>Xylophone for cleanup time</li>
                            <li>Bell for circle time</li>
                            <li>Maraca for lining up</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                            Technique 4: Transition Books
                          </h4>
                          <p className="mt-2 text-gray-700">Keep special books that are only read during transition times while children are waiting.</p>
                          <p className="mt-1 text-sm text-gray-500"><i>Hint: Try choosing books that relate to your current learning themes.</i></p>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                            Technique 5: Transition Tricks
                          </h4>
                          <p className="mt-2 text-gray-700">Make transitions fun with movement challenges:</p>
                          <ul className="list-disc list-inside mt-2 text-gray-700">
                            <li>"Move like a robot to the bathroom"</li>
                            <li>"Tiptoe like a mouse to your cubby"</li>
                            <li>"Hop like a frog to the carpet"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-5 border border-green-100">
                      <h3 className="text-lg font-semibold text-green-800 mb-3">Knowledge Check</h3>
                      <p className="mb-4">Which transition technique would work best for these situations?</p>
                      
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded shadow-sm">
                          <p className="font-medium">Scenario: You need children to quickly clean up after free play</p>
                          <RadioGroup defaultValue="" className="mt-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="songs" id="songs1" />
                              <Label htmlFor="songs1">Transition Songs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="books" id="books1" />
                              <Label htmlFor="books1">Transition Books</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="bg-white p-3 rounded shadow-sm">
                          <p className="font-medium">Scenario: Children get distracted when moving from classroom to playground</p>
                          <RadioGroup defaultValue="" className="mt-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="tricks" id="tricks1" />
                              <Label htmlFor="tricks1">Transition Tricks</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="timers" id="timers1" />
                              <Label htmlFor="timers1">Visual Timers</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedLesson.category === 'active-listening' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-lg p-5 border border-cyan-100 shadow-sm">
                      <h3 className="text-lg font-semibold text-cyan-800 mb-3">Active Listening Techniques</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Eye className="h-5 w-5 mr-2 text-cyan-500" />
                            Technique 1: Eye-Level Engagement
                          </h4>
                          <p className="mt-2 text-gray-700">Always kneel or sit to get at a child's eye level when they're speaking to you. This simple act shows respect and full attention.</p>
                          <div className="bg-cyan-50 p-3 rounded mt-2">
                            <div className="flex justify-center">
                              <div className="relative">
                                <div className="h-16 w-8 bg-purple-300 rounded-t-full"></div>
                                <div className="h-20 w-16 bg-purple-400 rounded-t-lg absolute -left-4 top-16"></div>
                                <div className="absolute top-6 left-1 w-6 h-3 bg-pink-200 rounded-full flex justify-center items-center">
                                  <div className="w-2 h-2 bg-black rounded-full"></div>
                                </div>
                              </div>
                              <div className="h-5"></div>
                              <div className="relative ml-10 mt-16">
                                <div className="h-12 w-6 bg-blue-300 rounded-t-full"></div>
                                <div className="h-12 w-12 bg-blue-400 rounded-t-lg absolute -left-3 top-12"></div>
                                <div className="absolute top-4 left-1 w-4 h-2 bg-pink-200 rounded-full flex justify-center items-center">
                                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-sm mt-2 italic">Eye-level communication builds trust</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <Repeat className="h-5 w-5 mr-2 text-cyan-500" />
                            Technique 2: Reflective Listening
                          </h4>
                          <p className="mt-2 text-gray-700">Repeat back what the child has said to confirm understanding and show that you value their words.</p>
                          <div className="bg-yellow-50 p-3 rounded mt-2 border-l-4 border-yellow-300">
                            <p className="text-sm"><span className="font-medium">Child:</span> "I don't want to play with the blocks today."</p>
                            <p className="text-sm mt-1"><span className="font-medium">Teacher:</span> "I hear that you're not interested in the blocks today. What would you like to explore instead?"</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-3 shadow-sm">
                          <h4 className="font-medium flex items-center">
                            <HelpCircle className="h-5 w-5 mr-2 text-cyan-500" />
                            Technique 3: Open-Ended Questions
                          </h4>
                          <p className="mt-2 text-gray-700">Ask questions that cannot be answered with a simple "yes" or "no" to encourage children to express their thoughts more fully.</p>
                          <div className="mt-3 space-y-2">
                            <div className="flex">
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Instead of:</span>
                              <span className="ml-2 py-1">"Did you like the story?"</span>
                            </div>
                            <div className="flex">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Try:</span>
                              <span className="ml-2 py-1">"What was your favorite part of the story?"</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">Practice Activity</h3>
                      <p className="mb-4">Try this practice scenario:</p>
                      
                      <div className="bg-white p-4 rounded shadow-sm space-y-4">
                        <p><span className="font-medium">Scenario:</span> A child approaches you during center time looking upset.</p>
                        <p><span className="font-medium">Child says:</span> "Nobody wants to play with me."</p>
                        
                        <div className="pt-2">
                          <p className="font-medium text-blue-800">What would be the best active listening response?</p>
                          <RadioGroup defaultValue="" className="mt-2 space-y-2">
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="option1" id="option1" className="mt-1" />
                              <div>
                                <Label htmlFor="option1" className="font-medium">Response 1:</Label>
                                <p className="text-sm">"Don't worry, I'm sure someone will play with you. Why don't you try the art center?"</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="option2" id="option2" className="mt-1" />
                              <div>
                                <Label htmlFor="option2" className="font-medium">Response 2:</Label>
                                <p className="text-sm">"I can see you're feeling sad because you don't have a friend to play with right now. Can you tell me more about what happened?"</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="option3" id="option3" className="mt-1" />
                              <div>
                                <Label htmlFor="option3" className="font-medium">Response 3:</Label>
                                <p className="text-sm">"You should ask them nicely if you can play. Did you try that?"</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedLesson.category === 'core-values' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-100 shadow-sm">
                      <h3 className="text-lg font-semibold text-green-800 mb-3">Building Chapter One: Meaningful Greetings</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded p-4 shadow-sm">
                          <h4 className="font-medium text-green-700">Why Greetings Matter</h4>
                          <p className="mt-2 text-gray-700">A meaningful greeting is often the first interaction of a child's day and sets the tone for everything that follows. Each greeting is a "brick" in building Chapter One of a child's life story.</p>
                          
                          <div className="mt-4 p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-400">
                            <p className="text-sm italic">"The way we greet a child communicates whether they are seen, valued, and belong in our classroom community."</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-4 shadow-sm">
                          <h4 className="font-medium text-green-700">4 Elements of a Meaningful Greeting</h4>
                          
                          <div className="mt-3 space-y-3">
                            <div className="flex items-start">
                              <div className="bg-green-100 text-green-800 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                              <div className="ml-3">
                                <p className="font-medium">Eye Contact</p>
                                <p className="text-sm text-gray-600">Get on the child's level and make genuine eye contact to show they have your full attention.</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="bg-green-100 text-green-800 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                              <div className="ml-3">
                                <p className="font-medium">Use Their Name</p>
                                <p className="text-sm text-gray-600">Always use the child's name in your greeting. This acknowledges their individual identity.</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="bg-green-100 text-green-800 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                              <div className="ml-3">
                                <p className="font-medium">Physical Connection</p>
                                <p className="text-sm text-gray-600">Offer connection options: a handshake, high-five, fist bump, or gentle touch on the shoulder.</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="bg-green-100 text-green-800 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                              <div className="ml-3">
                                <p className="font-medium">Personal Connection</p>
                                <p className="text-sm text-gray-600">Include something specific to that child: "I remembered you were excited about your soccer game!"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-4 shadow-sm">
                          <h4 className="font-medium text-green-700">Interactive Greeting Chart</h4>
                          <p className="mt-1 text-sm text-gray-600">Consider creating a greeting choice board for your classroom entrance:</p>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="border rounded p-2 text-center bg-blue-50">
                              <ThumbsUp className="h-6 w-6 mx-auto text-blue-500" />
                              <p className="text-sm mt-1">High Five</p>
                            </div>
                            <div className="border rounded p-2 text-center bg-purple-50">
                              <Hand className="h-6 w-6 mx-auto text-purple-500" />
                              <p className="text-sm mt-1">Handshake</p>
                            </div>
                            <div className="border rounded p-2 text-center bg-red-50">
                              <Heart className="h-6 w-6 mx-auto text-red-500" />
                              <p className="text-sm mt-1">Hug</p>
                            </div>
                            <div className="border rounded p-2 text-center bg-amber-50">
                              <Star className="h-6 w-6 mx-auto text-amber-500" />
                              <p className="text-sm mt-1">Special Wave</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-100">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-3">Chapter One Connection</h3>
                      
                      <div className="bg-white p-4 rounded shadow-sm space-y-4">
                        <p className="text-gray-700">Each meaningful greeting adds a positive "sentence" to a child's life story. When children feel truly seen and welcomed each day, they develop:</p>
                        
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>A sense of belonging and community</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>Trust in caring adults</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>A positive self-concept as someone worthy of attention</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>Social skills for greeting others respectfully</span>
                          </li>
                        </ul>
                        
                        <div className="bg-purple-50 p-3 rounded-md border border-purple-100 mt-3">
                          <p className="text-sm italic">"When we invest in meaningful greetings, we're not just starting a day - we're building a foundation for a child's lifelong story."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Default content for other categories */}
                {!['quick-transition-techniques', 'active-listening', 'core-values'].includes(selectedLesson.category) && (
                  <div className="space-y-6">
                    {/* Video content */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-100 shadow-sm">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-3">Video Demonstration</h3>
                      
                      <div className="bg-black rounded-md aspect-video flex items-center justify-center mb-4 overflow-hidden relative">
                        {selectedLesson.category === 'mindful-mornings' ? (
                          /* Mindful Mornings video from Raising Arizona */
                          <video 
                            controls 
                            poster="https://placehold.co/600x400/14b8a6/fff?text=Mindful+Mornings+Video"
                            className="w-full h-full object-cover"
                          >
                            <source src="/attached_assets/Raising Arizona Preschool .mp4" type="video/mp4" />
                            Your browser doesn't support video playback.
                          </video>
                        ) : selectedLesson.category === 'classroom-management' ? (
                          /* Classroom management YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/EF1Y-eS-3KU"
                            title="Classroom Management Strategies for Early Childhood Education"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'social-emotional' ? (
                          /* Social emotional development YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/H_O1brYwdSY"
                            title="Supporting Social-Emotional Development in Early Childhood"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'health-safety' ? (
                          /* Health and safety YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/d_4t3tDcU_o" 
                            title="Health and Safety Practices in Early Childhood Education"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'family-engagement' ? (
                          /* Family engagement YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/kin2OdchKMQ" 
                            title="Family Engagement in Early Childhood Education"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'curriculum-planning' ? (
                          /* Curriculum planning YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/kKz5yvwH6Ck" 
                            title="Early Childhood Curriculum Planning and Implementation"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'active-listening' ? (
                          /* Active listening YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/oWe_ogA5YCU" 
                            title="Active Listening Techniques for Early Childhood Educators"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'quick-transition-techniques' ? (
                          /* Quick transition techniques YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/4RfJ-4CJ0ZU" 
                            title="Effective Transition Techniques for Preschool Classrooms"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : selectedLesson.category === 'core-values' ? (
                          /* Core values YouTube embed */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/LbB4QdKW954" 
                            title="Building Character and Core Values in Early Childhood"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          /* Default educational content for other categories */
                          <iframe
                            className="w-full h-full absolute inset-0"
                            src="https://www.youtube.com/embed/djPdXSqHV28" 
                            title="Early Childhood Education Fundamentals"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        )}
                      </div>
                      
                      <div className="bg-white rounded p-4 shadow-sm">
                        <h4 className="font-medium text-indigo-700 mb-2">Key Points to Remember</h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          <li>Each technique should be tailored to the developmental level of your students</li>
                          <li>Consistency is key - practice these techniques daily for best results</li>
                          <li>Model the behaviors and techniques you want children to learn</li>
                          <li>Remember that these practices help write "Chapter One" of each child's story</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Knowledge Check Quiz */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-5 border border-amber-100">
                      <h3 className="text-lg font-semibold text-amber-800 mb-3">Knowledge Check</h3>
                      
                      <div className="space-y-4">
                        {/* Dynamically show questions based on the category */}
                        {selectedLesson.category === 'classroom-management' ? (
                          <>
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 1: What is the most effective way to redirect a child who is disrupting the class?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q1-correct" />
                                  <Label htmlFor="q1-correct">Calmly approach the child and offer an alternative activity that meets their need for engagement</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q1-incorrect1" />
                                  <Label htmlFor="q1-incorrect1">Immediately remove the child from the activity and apply a consequence</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q1-incorrect2" />
                                  <Label htmlFor="q1-incorrect2">Ignore the behavior so you don't reinforce it with attention</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 2: How can classroom layout contribute to effective management?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q2-incorrect1" />
                                  <Label htmlFor="q2-incorrect1">By creating a maze-like environment that keeps children occupied</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q2-correct" />
                                  <Label htmlFor="q2-correct">By creating clearly defined areas with visible boundaries and ensuring good sightlines for supervision</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q2-incorrect2" />
                                  <Label htmlFor="q2-incorrect2">By segregating children by ability level in different areas</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        ) : selectedLesson.category === 'social-emotional' ? (
                          <>
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 1: Which approach best supports children's emotional regulation skills?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q1-incorrect1" />
                                  <Label htmlFor="q1-incorrect1">Having children suppress negative emotions to maintain classroom calm</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q1-incorrect2" />
                                  <Label htmlFor="q1-incorrect2">Removing children from the group when they show strong emotions</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q1-correct" />
                                  <Label htmlFor="q1-correct">Labeling emotions, validating feelings, and teaching calming strategies</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 2: How does empathy development relate to "Building Chapter One"?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q2-correct" />
                                  <Label htmlFor="q2-correct">It creates neural pathways for lifelong compassion and relationship skills that benefit the child's entire future</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q2-incorrect1" />
                                  <Label htmlFor="q2-incorrect1">It's mainly useful for making children follow classroom rules</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q2-incorrect2" />
                                  <Label htmlFor="q2-incorrect2">It's only relevant once children reach elementary school</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        ) : selectedLesson.category === 'health-safety' ? (
                          <>
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 1: What is the proper handwashing technique to teach children?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q1-incorrect1" />
                                  <Label htmlFor="q1-incorrect1">Quick rinse with water before eating</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q1-correct" />
                                  <Label htmlFor="q1-correct">Wet hands, apply soap, scrub for 20 seconds, rinse thoroughly, and dry with clean towel</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q1-incorrect2" />
                                  <Label htmlFor="q1-incorrect2">Using hand sanitizer instead of washing whenever possible</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 2: What should be included in regular playground safety checks?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q2-incorrect1" />
                                  <Label htmlFor="q2-incorrect1">Just checking that the gate is locked</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q2-incorrect2" />
                                  <Label htmlFor="q2-incorrect2">Ensuring play equipment is challenging enough for all ages</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q2-correct" />
                                  <Label htmlFor="q2-correct">Inspecting for proper surfacing depth, broken equipment, entrapment hazards, and foreign objects</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        ) : selectedLesson.category === 'mindful-mornings' ? (
                          <>
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 1: What is the primary goal of the Mindful Mornings program?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q1-incorrect1" />
                                  <Label htmlFor="q1-incorrect1">To make mornings more efficient for teachers</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q1-correct" />
                                  <Label htmlFor="q1-correct">To create a calm, intentional start to each day that helps children self-regulate and prepare for learning</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q1-incorrect2" />
                                  <Label htmlFor="q1-incorrect2">To extend the outdoor play period into the morning</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 2: Which of these is a key practice in Mindful Mornings?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q2-incorrect1" />
                                  <Label htmlFor="q2-incorrect1">Immediately starting academic work</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q2-incorrect2" />
                                  <Label htmlFor="q2-incorrect2">Playing high-energy games to wake children up</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q2-correct" />
                                  <Label htmlFor="q2-correct">Guided breathing exercises and gentle movement to center attention</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        ) : (
                          // Default quiz questions for other categories
                          <>
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 1: Why is consistency important when implementing these techniques?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q1-correct" />
                                  <Label htmlFor="q1-correct">It builds reliable routines that help children feel secure</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q1-incorrect1" />
                                  <Label htmlFor="q1-incorrect1">It makes the teacher's job easier</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q1-incorrect2" />
                                  <Label htmlFor="q1-incorrect2">It impresses parents during observations</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="bg-white p-4 rounded shadow-sm">
                              <p className="font-medium text-gray-800 mb-3">Question 2: How does this technique contribute to "Building Chapter One"?</p>
                              <RadioGroup defaultValue="" className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect1" id="q2-incorrect1" />
                                  <Label htmlFor="q2-incorrect1">It makes children remember their preschool years</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id="q2-correct" />
                                  <Label htmlFor="q2-correct">It builds foundational skills and positive experiences that shape a child's development</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="incorrect2" id="q2-incorrect2" />
                                  <Label htmlFor="q2-incorrect2">It prepares children for kindergarten curriculum</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200">
                          Check Answers
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 border rounded-md bg-blue-50">
                  <h3 className="font-semibold mb-2">How to Apply This in Your Classroom</h3>
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
                    {progressMutation.isPending ? "Saving..." : `Complete & Earn ${selectedLesson.duration} Points`}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center justify-center p-2 rounded-md bg-green-50 text-green-700 border border-green-200 w-full">
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