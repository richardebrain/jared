import { useState, useEffect, useMemo } from "react";
import { videoResourcesData, VideoResource } from '@shared/videoResources';

// Utility function to get relevant videos by category
const getRelevantVideos = (categories: string[], limit: number = 3): VideoResource[] => {
  // Get videos that match any of the provided categories
  const matchingVideos = videoResourcesData.filter(video => 
    video.category.some(cat => categories.some(c => cat.toLowerCase().includes(c.toLowerCase())))
  );
  
  // If we have no matches with the exact categories, try a more flexible search
  if (matchingVideos.length === 0) {
    // Look for partial matches in categories, tags, or title
    return videoResourcesData.filter(video => 
      // Check for partial matches in categories
      video.category.some(cat => categories.some(c => cat.toLowerCase().includes(c.toLowerCase()))) ||
      // Check for partial matches in tags
      video.tags.some(tag => categories.some(c => tag.toLowerCase().includes(c.toLowerCase()))) ||
      // Check for partial matches in title
      categories.some(c => video.title.toLowerCase().includes(c.toLowerCase()))
    ).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, limit);
  }
  
  // Prioritize featured videos
  const featuredVideos = matchingVideos.filter(v => v.featured);
  const otherVideos = matchingVideos.filter(v => !v.featured);
  
  // Return a mix of featured and other videos, with featured ones first
  return [...featuredVideos, ...otherVideos].slice(0, limit);
};
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
  Zap,
  Gamepad,
  Trophy,
  Check,
  X
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

interface MiniLessonsProps {
  title?: string;
  subtitle?: string;
  modules?: any[];
  onSelect?: (moduleId: number) => void;
}

export function MiniLessons({ 
  title = "Personalized Mini-Lessons", 
  subtitle = "Quick lessons based on your interests and assessment results",
  modules: providedModules = [],
  onSelect
}: MiniLessonsProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<MiniLesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  
  // Gamification state
  const [showGame, setShowGame] = useState(false);
  const [gameType, setGameType] = useState<'quiz' | 'matching' | 'flashcards'>('quiz');
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  
  // Icon resolver
  const Icon = (props: any) => {
    const { name, ...rest } = props;
    
    const IconMap: Record<string, any> = {
      Circle: Check,
      CheckCircle, 
      CheckCircle2, 
      Award,
      Bell,
      BookOpen,
      Clock,
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
      Zap,
      Gamepad,
      Trophy
    };
    
    const IconComponent = IconMap[name] || Check;
    return <IconComponent {...rest} />;
  };
  
  // Get modules data
  const { data: allModulesData, isLoading: modulesLoading, error: modulesError } = useQuery({
    queryKey: ['/api/modules'],
    enabled: providedModules.length === 0 // Only fetch if modules weren't provided
  });
  
  // Get progress data
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/progress'],
  });
  
  // Get assessment data to identify growth areas
  const { data: assessmentData } = useQuery({
    queryKey: ['/api/assessments'],
  });
  
  // Extract growth areas from assessment
  const growthAreas = useMemo(() => {
    if (!assessmentData || !assessmentData.assessments || assessmentData.assessments.length === 0) {
      return [];
    }
    
    // Get the most recent assessment
    const latestAssessment = assessmentData.assessments.reduce((latest: any, current: any) => {
      if (!latest) return current;
      return new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest;
    }, null);
    
    if (!latestAssessment || !latestAssessment.growthAreas) {
      return [];
    }
    
    return latestAssessment.growthAreas;
  }, [assessmentData]);
  
  // Compute modules to display
  const allModules = useMemo(() => {
    if (providedModules && providedModules.length > 0) {
      return providedModules;
    }
    
    return allModulesData || [];
  }, [allModulesData, providedModules]);
  
  // Compute modules with usage frequency
  const computedModules = useMemo(() => {
    // If modules are provided directly, use those
    if (providedModules && providedModules.length > 0) {
      return providedModules.map(module => ({
        ...module,
        usageCount: 0
      }));
    }
    
    // Otherwise compute based on progress data
    const modules = allModules || [];
    
    // Count how often each module appears in progress records
    const usageCounts: Record<number, number> = {};
    if (Array.isArray(progress)) {
      progress.forEach(record => {
        const moduleId = record.moduleId;
        usageCounts[moduleId] = (usageCounts[moduleId] || 0) + 1;
      });
    }
    
    // Add usage count to each module
    return modules.map(module => ({
      ...module,
      usageCount: usageCounts[module.id] || 0
    }));
  }, [allModules, progress, providedModules]);
  
  // Sort and filter modules for display
  const displayedModules = useMemo(() => {
    // Create a copy we can manipulate
    let modules = [...computedModules];
    
    // Mark recommended modules based on growth areas
    if (Array.isArray(progress) && growthAreas.length > 0) {
      // Check which modules are already marked as recommended
      const recommendedModuleIds = progress
        .filter(p => p.recommended)
        .map(p => p.moduleId);
      
      // Add recommendation status to modules
      modules = modules.map(module => ({
        ...module,
        recommended: recommendedModuleIds.includes(module.id) ||
          // Check if module category matches any growth area
          growthAreas.some(area => 
            module.category?.toLowerCase().includes(area.toLowerCase()) ||
            module.title?.toLowerCase().includes(area.toLowerCase()) ||
            module.description?.toLowerCase().includes(area.toLowerCase())
          )
      }));
    }
    
    // Sort: first recommended modules, then featured, then least used
    return modules.sort((a, b) => {
      // First by recommendation status
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      
      // Then by featured status
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then by usage count (least used first)
      return (a.usageCount || 0) - (b.usageCount || 0);
    })
    // Limit to 3 modules
    .slice(0, 3);
  }, [computedModules, progress, growthAreas]);
  
  // Handle lesson selection
  const handleLessonSelect = (lesson: MiniLesson) => {
    setSelectedLesson(lesson);
    setIsLessonOpen(true);
    
    // Get completion status
    if (Array.isArray(progress)) {
      const progressRecord = progress.find(p => p.moduleId === lesson.id);
      setLessonCompleted(progressRecord?.completed || false);
    } else {
      setLessonCompleted(false);
    }
    
    // Reset AI content and game state
    setAiGeneratedContent(null);
    setShowGame(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    
    // If a handler was provided, call it
    if (onSelect) {
      onSelect(lesson.id);
    }
  };
  
  // Mark a lesson as completed
  const completeMutation = useMutation({
    mutationFn: async ({ moduleId, completed }: { moduleId: number, completed: boolean }) => {
      return await apiRequest(`/api/progress/${moduleId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completed })
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Show toast
      toast({
        title: 'Progress updated',
        description: 'Your progress has been saved.',
        duration: 3000
      });
      
      // Update local state
      setLessonCompleted(true);
    },
    onError: (error) => {
      console.error('Failed to update progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    }
  });
  
  // Function to mark the current lesson as completed
  const markAsCompleted = () => {
    if (selectedLesson) {
      completeMutation.mutate({ 
        moduleId: selectedLesson.id,
        completed: true
      });
    }
  };
  
  // Start the quiz
  const startQuiz = () => {
    if (selectedLesson) {
      generateQuizQuestions();
      setShowGame(true);
      setGameType('quiz');
    }
  };
  
  // Helper to get category keywords from a category string
  const getCategoryKeywords = (category: string): string[] => {
    if (!category) return [];
    
    const keywords = category.toLowerCase().split('-').filter(k => k.trim().length > 0);
    const flattenedKeywords = keywords.map(k => k.split(' ')).flat();
    
    // Add common variations
    const variations: Record<string, string[]> = {
      'classroom': ['management', 'organize', 'discipline'],
      'management': ['classroom', 'organize', 'discipline'],
      'communication': ['language', 'verbal', 'speaking', 'listening'],
      'language': ['communication', 'verbal', 'speaking'],
      'development': ['cognitive', 'growth', 'milestone'],
      'cognitive': ['development', 'thinking', 'learning'],
      'social': ['emotional', 'interpersonal', 'relationships'],
      'emotional': ['social', 'feelings', 'regulation'],
      'art': ['creative', 'craft', 'expression'],
      'creative': ['art', 'imagination', 'expression'],
      'literacy': ['reading', 'writing', 'language'],
      'reading': ['literacy', 'books', 'language'],
      'math': ['numbers', 'counting', 'arithmetic'],
      'numbers': ['math', 'counting', 'arithmetic'],
      'science': ['experiment', 'nature', 'discovery'],
      'nature': ['science', 'outdoor', 'environment']
    };
    
    // Add variations for each keyword
    const expandedKeywords = [...flattenedKeywords];
    flattenedKeywords.forEach(keyword => {
      if (variations[keyword]) {
        expandedKeywords.push(...variations[keyword]);
      }
    });
    
    return Array.from(new Set(expandedKeywords));
  };
  
  // Get style for category
  const getCategoryStyle = (category: string) => {
    const categoryStyleMap: Record<string, { bg: string, text: string, border: string }> = {
      'curriculum': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'development': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'management': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'health': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      'safety': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      'families': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'professional': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'classroom': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'literacy': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'emotional': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'social': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'cognitive': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'physical': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      'creative': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'community': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
      'diversity': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      'inclusion': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      'leadership': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'policy': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
      'technology': { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
      'observation': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
      'assessment': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
      'iters': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'ecers': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'class': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'core-values': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      'core': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      'patience': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'empathy': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'mindful': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
      'active-listening': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
      'quick-transition-techniques': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' }
    };
  
    // Default style
    const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    
    // Find matching category
    for (const key in categoryStyleMap) {
      if (category.toLowerCase().includes(key)) {
        return categoryStyleMap[key];
      }
    }
    
    return defaultStyle;
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Link href="/mini-lessons">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                View All
              </Badge>
            </Link>
          </div>
          <CardDescription>
            {subtitle}
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
                  <p>Selected Modules: {providedModules && providedModules.length > 0 ? providedModules.length : computedModules.length}</p>
                  <p>Progress Records: {Array.isArray(progress) ? progress.length : 0}</p>
                  <p>Usage Frequency: {computedModules.map(m => `${m.id}(${m.usageCount || 0})`).join(', ')}</p>
                </div>
              )}
              
              {displayedModules.map((lesson) => {
                // Get the progress record for this module if it exists
                const progressRecord = Array.isArray(progress) 
                  ? progress.find(p => p.moduleId === lesson.id)
                  : null;
                
                // Extract the completion status and progress
                const completed = progressRecord?.completed || false;
                const lessonProgress = progressRecord?.progress || 0;
                
                // Determine if this lesson is recommended based on assessment
                const isRecommended = progressRecord?.recommended || false;
                
                // Select category styling
                const categoryKeywords = getCategoryKeywords(lesson.category);
                const categoryStyle = getCategoryStyle(categoryKeywords[0] || lesson.category);
                
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
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-sm mb-1 line-clamp-2">{lesson.title}</h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-3">{lesson.description}</p>
                      
                      {/* Progress bar */}
                      {lessonProgress !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${lessonProgress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          {completed ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          ) : lessonProgress ? (
                            <span className="inline-flex items-center text-xs text-blue-600">
                              <Icon name="Circle" className="h-3 w-3 mr-1" />
                              {lessonProgress}% Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Star className="h-3 w-3 mr-1" />
                              {lesson.difficulty}
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-2"
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          {completed ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
