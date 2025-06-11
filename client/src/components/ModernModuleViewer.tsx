import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LearningModule as LearningModuleType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FlashcardComponent } from "./FlashcardComponent";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Circle, 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Award,
  Lock,
  Unlock,
  Star,
  Trophy,
  Zap,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  FileText,
  Video,
  Brain,
  Lightbulb,
  Shield,
  Timer,
  Heart,
  Target,
  Users,
  Flame,
  Medal
} from "lucide-react";

interface ModuleSection {
  id: string;
  type: 'text' | 'story' | 'flashcard' | 'quiz' | 'video' | 'interactive';
  title: string;
  content: string;
  duration?: number;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  flashcards?: Array<{
    term: string;
    definition: string;
  }>;
  videoUrl?: string;
  imageUrl?: string;
  required?: boolean;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    questionIndex: number;
    selectedAnswer: number;
    correct: boolean;
  }>;
}

interface ModernModuleViewerProps {
  moduleId: number;
  onComplete?: (result: { passed: boolean; score: number }) => void;
}

// Visual components for different section types
const SectionTypeIcon = ({ type, completed }: { type: string; completed: boolean }) => {
  const iconProps = { className: `w-5 h-5 ${completed ? 'text-green-600' : 'text-gray-500'}` };
  
  switch (type) {
    case 'text': return <FileText {...iconProps} />;
    case 'story': return <BookOpen {...iconProps} />;
    case 'flashcard': return <Brain {...iconProps} />;
    case 'quiz': return <Target {...iconProps} />;
    case 'video': return <Video {...iconProps} />;
    case 'interactive': return <Lightbulb {...iconProps} />;
    default: return <Circle {...iconProps} />;
  }
};

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const colors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <Badge variant="outline" className={colors[difficulty as keyof typeof colors] || colors.intermediate}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
};

const ProgressRing = ({ progress, size = 120 }: { progress: number; size?: number }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-500 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const AchievementToast = ({ achievement }: { achievement: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -50, scale: 0.9 }}
    className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-3"
  >
    <Trophy className="w-6 h-6" />
    <div>
      <p className="font-semibold">Achievement Unlocked!</p>
      <p className="text-sm opacity-90">{achievement}</p>
    </div>
  </motion.div>
);

export function ModernModuleViewer({ moduleId, onComplete }: ModernModuleViewerProps) {
  const [currentView, setCurrentView] = useState<'welcome' | 'content' | 'quiz' | 'results'>('welcome');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [quizResults, setQuizResults] = useState<{ [sectionId: string]: QuizResult }>({});
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [finalQuizPassed, setFinalQuizPassed] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState<{ [questionIndex: number]: number }>({});
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState(0);
  const [sectionStartTime, setSectionStartTime] = useState<number>(Date.now());
  const [streakCount, setStreakCount] = useState(0);
  const [showSectionOutline, setShowSectionOutline] = useState(true);
  const [currentQuizSection, setCurrentQuizSection] = useState<ModuleSection | null>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Get module data with enhanced handling
  const { data: module, isLoading: isModuleLoading } = useQuery<any>({
    queryKey: ['/api/modules', moduleId],
    queryFn: async () => {
      if (!moduleId) {
        throw new Error('Invalid module ID');
      }
      
      // Handle test module (ID 999) with static data
      if (moduleId === 999) {
        return {
          id: 999,
          title: "Effective Classroom Transitions",
          description: "Master the art of smooth transitions between activities to maximize learning time and minimize disruptions.",
          duration: 25,
          category: "classroom-management",
          difficulty: "intermediate",
          content: JSON.stringify([
            {
              id: "intro",
              type: "text",
              title: "Understanding Classroom Transitions",
              duration: 3,
              content: `Classroom transitions are the bridge between activities that can make or break your daily flow. Research shows that effective transitions can save up to 20 minutes of instructional time per day.

In this module, you'll learn evidence-based strategies for creating smooth, purposeful transitions that keep children engaged and learning continues seamlessly.

**Key benefits you'll gain:**
• Reduced behavioral challenges during transition times
• Increased instructional time
• Better classroom atmosphere
• Improved student independence

Let's begin by understanding what makes transitions successful and how to implement them in your classroom.`,
              required: true
            },
            {
              id: "story",
              type: "story", 
              title: "Maria's Transition Challenge",
              duration: 4,
              content: `Maria had been teaching for three years, but transitions were still her biggest challenge. Every time she announced "clean-up time," chaos ensued. Children would run around, materials would be left scattered, and it took 10 minutes to get everyone settled for the next activity.

One morning, Maria watched as her colleague Ms. Jennifer effortlessly transitioned her class from centers to circle time. The children moved calmly, cleaned up thoroughly, and were ready to learn in just 3 minutes.

"What's your secret?" Maria asked during lunch.

Ms. Jennifer smiled. "It's all about clear expectations, consistent routines, and making transitions part of the learning experience rather than a break from it."

That afternoon, Maria implemented her first transition strategy: the "Transition Song." She chose a familiar tune and created lyrics about cleaning up and moving to the next activity. To her amazement, the children began singing along and following the routine naturally.

By the end of the week, Maria's transitions had transformed from chaotic interruptions into smooth, purposeful moments that actually enhanced the learning environment.`,
              required: true
            },
            {
              id: "flashcards",
              type: "flashcard",
              title: "Key Transition Terms",
              duration: 5,
              flashcards: [
                {
                  term: "Transition Cue",
                  definition: "A consistent signal (visual, auditory, or verbal) that alerts children to prepare for a change in activity or routine."
                },
                {
                  term: "Transition Time",
                  definition: "The period between the end of one activity and the full engagement in the next activity."
                },
                {
                  term: "Clean-up Routine",
                  definition: "A systematic approach to organizing materials and preparing the environment for the next activity."
                },
                {
                  term: "Transition Song",
                  definition: "A musical cue that provides rhythm and structure to help children move smoothly between activities."
                },
                {
                  term: "Wait Time Strategy",
                  definition: "Purposeful activities or routines that engage children who finish transitions early while others complete their tasks."
                },
                {
                  term: "Visual Schedule",
                  definition: "A pictorial representation of the day's activities that helps children anticipate and prepare for transitions."
                }
              ],
              required: true
            },
            {
              id: "strategies",
              type: "text",
              title: "Evidence-Based Transition Strategies",
              duration: 6,
              content: `Research from early childhood education experts reveals five key strategies that make transitions successful:

**1. Preparation and Warning**
Give children advance notice before transitions. Use timers, countdowns, or verbal warnings like "We have 5 more minutes of center time."

**2. Clear Expectations**
Establish and practice specific steps for each transition. Children should know exactly what to do, where to go, and how to get there.

**3. Consistent Routines**
Use the same signals, songs, or procedures each time. Consistency builds security and automaticity.

**4. Engagement During Transitions**
Keep children actively involved rather than waiting passively. Use finger plays, songs, or movement activities.

**5. Individual Support**
Recognize that some children need extra time or support. Have strategies ready for children who struggle with changes.

**Implementation Tips:**
• Practice transitions when children are calm and focused
• Start with one transition at a time rather than changing everything at once
• Use positive reinforcement when children follow transition procedures
• Adjust strategies based on your specific classroom needs and children's developmental levels

Remember: Effective transitions are taught, practiced, and refined over time. Be patient with yourself and your students as you develop these new routines.`,
              required: true
            },
            {
              id: "practical",
              type: "text", 
              title: "Practical Implementation Guide",
              duration: 4,
              content: `Now let's put theory into practice with specific transition techniques you can implement immediately:

**Morning Arrival Transition:**
• Create a visual checklist: hang up backpack, wash hands, find name tag, choose first activity
• Use a greeting song that includes each child's name
• Designate transition helpers to assist newcomers

**Activity-to-Activity Transitions:**
• Use a transition basket with small manipulatives for early finishers
• Implement the "Magic Five" - five specific steps for cleaning up any area
• Create movement transitions: "Walk like a butterfly to the reading corner"

**Cleanup Transitions:**
• Assign specific cleanup jobs to different children
• Use cleanup music with clear start and stop points
• Make it a game: "Can you put away all the red blocks before the song ends?"

**End-of-Day Transitions:**
• Reflect on the day with a closing circle
• Use a goodbye song that reinforces positive experiences
• Create a visual checklist for gathering belongings

**Special Situations:**
• Outdoor to indoor: Use a transitional activity like removing shoes together
• Before meals: Establish hand-washing routines and seating procedures
• Naptime: Create calming rituals with soft music and dimmed lights

Start with one transition type and gradually expand your repertoire as children master each routine.`,
              required: true
            },
            {
              id: "quiz",
              type: "quiz",
              title: "Transition Mastery Assessment",
              duration: 3,
              questions: [
                {
                  question: "What is the most effective way to signal the beginning of a transition?",
                  answers: [
                    "Raise your voice to get attention",
                    "Use a consistent visual or auditory cue",
                    "Turn off the lights repeatedly", 
                    "Clap your hands loudly"
                  ],
                  correctAnswer: 1,
                  explanation: "Consistent cues help children anticipate and prepare for transitions, creating a sense of security and routine."
                },
                {
                  question: "How much instructional time can effective transitions save per day?",
                  answers: [
                    "5 minutes",
                    "10 minutes", 
                    "Up to 20 minutes",
                    "30 minutes"
                  ],
                  correctAnswer: 2,
                  explanation: "Research shows that smooth transitions can save up to 20 minutes of instructional time daily by reducing disruptions and wait time."
                },
                {
                  question: "What should you do for children who finish transitions early?",
                  answers: [
                    "Have them wait quietly",
                    "Send them to help other children",
                    "Provide purposeful engagement activities",
                    "Let them choose any activity"
                  ],
                  correctAnswer: 2,
                  explanation: "Wait time strategies keep early finishers engaged and prevent disruptions while other children complete their transitions."
                },
                {
                  question: "When introducing new transition routines, you should:",
                  answers: [
                    "Change all transitions at once for consistency",
                    "Implement one transition at a time",
                    "Only practice during difficult times",
                    "Expect immediate perfect execution"
                  ],
                  correctAnswer: 1,
                  explanation: "Gradual implementation allows children to master one routine before learning another, reducing confusion and building success."
                },
                {
                  question: "The most important element of successful transitions is:",
                  answers: [
                    "Having enough materials",
                    "Children moving quickly",
                    "Consistency and clear expectations", 
                    "Adult supervision at all times"
                  ],
                  correctAnswer: 2,
                  explanation: "Consistency and clear expectations provide the foundation for all successful transitions, helping children feel secure and confident."
                }
              ],
              required: true
            }
          ])
        };
      }
      
      // For regular modules, fetch from API
      if (isNaN(moduleId)) {
        throw new Error('Invalid module ID');
      }
      return await apiRequest(`/api/modules/${moduleId}`);
    },
    enabled: !!moduleId,
  });

  // Parse module sections
  const moduleSections: ModuleSection[] = (() => {
    if (!module?.content) return [];
    try {
      // First, try to parse the JSON content
      let parsed;
      try {
        parsed = JSON.parse(module.content);
      } catch (parseError) {
        console.error('Initial JSON parse failed:', parseError);
        // Try to handle escaped JSON
        const unescapedContent = module.content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        parsed = JSON.parse(unescapedContent);
      }
      
      // Handle different content structures
      let sections = [];
      if (Array.isArray(parsed)) {
        sections = parsed;
      } else if (parsed.sections && Array.isArray(parsed.sections)) {
        sections = parsed.sections;
      } else if (parsed.moduleType && parsed.sections) {
        // Handle wrapped module structure
        sections = parsed.sections;
      } else if (typeof parsed === 'string') {
        // Handle string content by creating text sections
        const contentParts = parsed.split('\n\n').filter(part => part.trim());
        sections = contentParts.map((part, index) => ({
          id: `section-${index}`,
          type: 'text',
          title: `Section ${index + 1}`,
          content: part.trim(),
          duration: Math.max(2, Math.ceil(part.length / 200)),
          required: true
        }));
      }
      
      console.log('Parsed sections:', sections);
      
      return sections.map((section: any, index: number) => ({
        ...section,
        id: section.id || `section-${index}`,
        type: section.type || 'text',
        title: section.title || `Section ${index + 1}`,
        content: section.content || '',
        duration: section.duration || 5,
        required: section.required !== false,
        questions: section.questions || (section.type === 'quiz' ? [] : undefined)
      }));
    } catch (error) {
      console.error('Error parsing module content:', error, 'Raw content:', module?.content);
      // Fallback: create a single text section from the raw content
      return [{
        id: 'section-0',
        type: 'text',
        title: 'Module Content',
        content: module?.content || '',
        duration: 10,
        required: true
      }];
    }
  })();

  const currentSection = moduleSections[currentSectionIndex];
  const totalSections = moduleSections.length;
  const progressPercentage = totalSections > 0 ? (completedSections.size / totalSections) * 100 : 0;

  // Study time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setStudyTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Achievement system
  const checkAchievements = (completedCount: number) => {
    if (completedCount === 1) {
      setShowAchievement("First Steps");
      setTimeout(() => setShowAchievement(null), 3000);
    } else if (completedCount === Math.floor(totalSections / 2)) {
      setShowAchievement("Halfway Hero");
      setTimeout(() => setShowAchievement(null), 3000);
    } else if (completedCount === totalSections) {
      setShowAchievement("Module Master");
      setTimeout(() => setShowAchievement(null), 3000);
    }
  };

  // Section completion handler
  const markSectionComplete = () => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(currentSectionIndex);
    setCompletedSections(newCompleted);
    checkAchievements(newCompleted.size);
    
    // Auto-advance to next section
    if (currentSectionIndex < totalSections - 1) {
      setTimeout(() => {
        setCurrentSectionIndex(currentSectionIndex + 1);
        setSectionStartTime(Date.now());
      }, 1000);
    } else {
      setModuleCompleted(true);
      if (onComplete) {
        const finalScore = calculateFinalScore();
        onComplete({ passed: finalScore >= 80, score: finalScore });
      }
    }
  };

  // Calculate final score
  const calculateFinalScore = () => {
    const quizSections = moduleSections.filter(s => s.type === 'quiz');
    if (quizSections.length === 0) return 100;
    
    const totalScore = Object.values(quizResults).reduce((sum, result) => sum + result.percentage, 0);
    return totalScore / quizSections.length;
  };

  // Quiz handling
  const handleQuizSubmit = () => {
    if (!currentSection?.questions) return;
    
    const answers = currentSection.questions.map((_, index) => ({
      questionIndex: index,
      selectedAnswer: currentQuizAnswers[index] || 0,
      correct: currentQuizAnswers[index] === currentSection.questions![index].correctAnswer
    }));
    
    const correctCount = answers.filter(a => a.correct).length;
    const percentage = (correctCount / currentSection.questions.length) * 100;
    const passed = percentage >= 80;
    
    const result: QuizResult = {
      score: correctCount,
      totalQuestions: currentSection.questions.length,
      percentage,
      passed,
      answers
    };
    
    setQuizResults(prev => ({ ...prev, [currentSection.id]: result }));
    
    if (passed) {
      markSectionComplete();
      toast({
        title: "Quiz Passed!",
        description: `You scored ${percentage.toFixed(0)}% - Great work!`,
      });
    } else {
      toast({
        title: "Quiz Failed",
        description: `You scored ${percentage.toFixed(0)}%. You need 80% or higher to pass. The module will restart.`,
        variant: "destructive"
      });
      
      setTimeout(() => {
        setCurrentSectionIndex(0);
        setCompletedSections(new Set());
        setQuizResults({});
        setCurrentQuizAnswers({});
      }, 2000);
    }
  };

  // Voice narration
  const generateNarration = async (text: string) => {
    try {
      setIsNarrating(true);
      
      let textToNarrate = text;
      if (currentSection.type === 'story') {
        textToNarrate = `${currentSection.title}. ${currentSection.content}`;
      }

      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        body: JSON.stringify({
          text: textToNarrate,
          voiceType: 'friendly-female',
          speed: 0.9
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Narration Error",
        description: "Could not generate audio narration.",
        variant: "destructive"
      });
    } finally {
      setIsNarrating(false);
    }
  };

  if (isModuleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning experience...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600">Module not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <audio ref={audioRef} />
      
      {/* Achievement Toast */}
      <AnimatePresence>
        {showAchievement && <AchievementToast achievement={showAchievement} />}
      </AnimatePresence>

      {/* Header with progress and stats */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.duration} min
                    </span>
                    <DifficultyBadge difficulty={module.difficulty || 'intermediate'} />
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {completedSections.size}/{totalSections} completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Study time */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(studyTime / 60)}:{(studyTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500">Study Time</div>
              </div>

              {/* Progress ring */}
              <ProgressRing progress={progressPercentage} size={80} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar with section outline */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Course Outline</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSectionOutline(!showSectionOutline)}
                  >
                    {showSectionOutline ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {showSectionOutline && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {moduleSections.map((section, index) => {
                          const isCompleted = completedSections.has(index);
                          const isCurrent = index === currentSectionIndex;
                          const isLocked = index > 0 && !completedSections.has(index - 1);
                          
                          return (
                            <motion.div
                              key={section.id}
                              whileHover={{ x: 4 }}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isCurrent 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : isCompleted 
                                    ? 'border-green-200 bg-green-50' 
                                    : isLocked
                                      ? 'border-gray-200 bg-gray-50 opacity-60'
                                      : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => !isLocked && setCurrentSectionIndex(index)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {isLocked ? (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <SectionTypeIcon type={section.type} completed={isCompleted} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                                  }`}>
                                    {section.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {section.duration} min
                                    </span>
                                    {section.type === 'quiz' && (
                                      <Badge variant="outline" className="text-xs">
                                        80% required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSectionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="min-h-[600px]">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentSection?.type === 'quiz' ? 'bg-orange-100' :
                          currentSection?.type === 'story' ? 'bg-purple-100' :
                          currentSection?.type === 'flashcard' ? 'bg-pink-100' :
                          'bg-blue-100'
                        }`}>
                          <SectionTypeIcon type={currentSection?.type || 'text'} completed={false} />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{currentSection?.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {currentSection?.type}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {currentSection?.duration} minutes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Voice narration button */}
                      {(currentSection?.type === 'text' || currentSection?.type === 'story') && (
                        <Button
                          onClick={() => generateNarration(currentSection.content)}
                          disabled={isNarrating}
                          variant="outline"
                          size="sm"
                        >
                          {isNarrating ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Volume2 className="w-4 h-4 mr-2" />
                          )}
                          {isNarrating ? 'Playing...' : 'Listen'}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-8">
                    {/* Section content rendering */}
                    {currentSection?.type === 'text' && (
                      <div className="prose max-w-none">
                        <div 
                          className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: currentSection.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }} 
                        />
                        
                        <div className="mt-8 flex justify-end">
                          <Button onClick={markSectionComplete} className="bg-blue-600 hover:bg-blue-700">
                            Complete Section
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentSection?.type === 'story' && (
                      <div className="prose max-w-none">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                            {currentSection.content}
                          </div>
                        </div>
                        
                        <div className="mt-8 flex justify-end">
                          <Button onClick={markSectionComplete} className="bg-purple-600 hover:bg-purple-700">
                            Complete Story
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentSection?.type === 'flashcard' && currentSection.flashcards && (
                      <FlashcardComponent
                        flashcards={currentSection.flashcards}
                        title={currentSection.title}
                        onComplete={markSectionComplete}
                      />
                    )}

                    {currentSection?.type === 'quiz' && currentSection.questions && (
                      <div className="space-y-6">
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold text-orange-800">
                              Assessment Requirement: 80% or higher to pass
                            </span>
                          </div>
                        </div>

                        {currentSection.questions.map((question, questionIndex) => (
                          <motion.div
                            key={questionIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: questionIndex * 0.1 }}
                            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                          >
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                                {questionIndex + 1}
                              </span>
                              {question.question}
                            </h3>
                            
                            <div className="space-y-3">
                              {question.answers.map((answer, answerIndex) => (
                                <motion.label
                                  key={answerIndex}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    currentQuizAnswers[questionIndex] === answerIndex
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${questionIndex}`}
                                    value={answerIndex}
                                    checked={currentQuizAnswers[questionIndex] === answerIndex}
                                    onChange={() => setCurrentQuizAnswers(prev => ({
                                      ...prev,
                                      [questionIndex]: answerIndex
                                    }))}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                    currentQuizAnswers[questionIndex] === answerIndex
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {currentQuizAnswers[questionIndex] === answerIndex && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <span className="text-gray-700">{answer}</span>
                                </motion.label>
                              ))}
                            </div>
                          </motion.div>
                        ))}

                        <div className="flex justify-center mt-8">
                          <Button
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(currentQuizAnswers).length < currentSection.questions.length}
                            className="bg-green-600 hover:bg-green-700 px-8 py-3"
                            size="lg"
                          >
                            <Award className="w-5 h-5 mr-2" />
                            Submit Assessment
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation controls */}
            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                disabled={currentSectionIndex === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Section {currentSectionIndex + 1} of {totalSections}
                </span>
                <Progress value={(currentSectionIndex / Math.max(totalSections - 1, 1)) * 100} className="w-32" />
              </div>

              <Button
                onClick={() => setCurrentSectionIndex(Math.min(totalSections - 1, currentSectionIndex + 1))}
                disabled={currentSectionIndex === totalSections - 1 || !completedSections.has(currentSectionIndex)}
                variant="outline"
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}