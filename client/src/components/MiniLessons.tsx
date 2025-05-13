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

export function MiniLessons() {
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
  
  // Matching game state
  const [matchingPairs, setMatchingPairs] = useState<{id: number; text: string; matched: boolean; flipped: boolean}[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [matchingMoves, setMatchingMoves] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  
  // Function to generate quiz questions based on the selected lesson
  const generateQuizQuestions = () => {
    if (!selectedLesson) return;
    
    // Generate different questions based on the category
    const questions = [];
    
    if (selectedLesson.category === 'core-values') {
      questions.push(
        {
          question: "Which of the following best describes why positive attitude is important in early childhood education?",
          options: [
            "It helps manage paperwork efficiently",
            "It creates a nurturing environment that fosters learning",
            "It prevents children from misbehaving",
            "It reduces the need for lesson planning"
          ],
          correctAnswer: 1
        },
        {
          question: "How does a teacher's positive attitude impact children?",
          options: [
            "It has minimal impact on children's development",
            "It only affects children with positive home environments",
            "It models behavior and creates emotional safety",
            "It is primarily important for administrative purposes"
          ],
          correctAnswer: 2
        },
        {
          question: "What is the 'Chapter One' philosophy at Raising Arizona?",
          options: [
            "Starting each day with reading time",
            "Understanding we're writing the first chapter of children's lives",
            "Following a specific curriculum outlined in chapter one of our handbook",
            "Focusing only on literacy in the first year"
          ],
          correctAnswer: 1
        }
      );
    } else if (selectedLesson.category === 'active-listening') {
      questions.push(
        {
          question: "Which of the following is a key component of active listening with children?",
          options: [
            "Interrupting to correct mistakes",
            "Maintaining eye contact at their level",
            "Multitasking while they speak",
            "Speaking in a louder voice than them"
          ],
          correctAnswer: 1
        },
        {
          question: "Why is active listening particularly important for young children?",
          options: [
            "It makes classroom management easier",
            "It builds trust and validates their feelings",
            "It reduces the time spent in conversation",
            "It's only important for verbal children"
          ],
          correctAnswer: 1
        },
        {
          question: "What should you do when a child is speaking to you?",
          options: [
            "Think about your response while they talk",
            "Stop what you're doing and give full attention",
            "Correct grammar mistakes as they occur",
            "Keep working while listening"
          ],
          correctAnswer: 1
        }
      );
    } else if (selectedLesson.category === 'quick-transition-techniques') {
      questions.push(
        {
          question: "What is the main purpose of transition techniques in a preschool classroom?",
          options: [
            "To give teachers a break",
            "To smoothly move children between activities and reduce disruption",
            "To discipline children who aren't following directions",
            "To extend activity time"
          ],
          correctAnswer: 1
        },
        {
          question: "Which transition technique uses sound cues?",
          options: [
            "Visual countdown cards",
            "Hand signals",
            "Singing a cleanup song",
            "Whispering instructions"
          ],
          correctAnswer: 2
        },
        {
          question: "Why is it important to give a warning before transitions?",
          options: [
            "To make sure children have time to mentally prepare for change",
            "To allow teachers time to set up the next activity",
            "It's not important - transitions should be surprising",
            "To test children's ability to follow directions quickly"
          ],
          correctAnswer: 0
        }
      );
    } else if (selectedLesson.category === 'mindful-mornings') {
      questions.push(
        {
          question: "What is a benefit of starting the day with mindfulness?",
          options: [
            "It eliminates the need for lesson planning",
            "It creates a calm, focused atmosphere for learning",
            "It takes up time in the schedule",
            "It makes children tired so they nap better"
          ],
          correctAnswer: 1
        },
        {
          question: "Which of these is a simple mindfulness technique for young children?",
          options: [
            "Complex meditation mantras",
            "Deep breathing with a visual aid like a stuffed animal on their belly",
            "Extended periods of complete silence",
            "Competitive relaxation games"
          ],
          correctAnswer: 1
        },
        {
          question: "How long should a mindfulness activity last for preschoolers?",
          options: [
            "30-45 minutes",
            "15-30 minutes",
            "3-7 minutes",
            "At least an hour"
          ],
          correctAnswer: 2
        }
      );
    } else {
      // Generic questions for other categories
      questions.push(
        {
          question: `What is the main focus of the "${selectedLesson.title}" mini-lesson?`,
          options: [
            "Building administrative skills",
            "Classroom decoration techniques",
            `${selectedLesson.description.split(".")[0]}`,
            "Paperwork management"
          ],
          correctAnswer: 2
        },
        {
          question: "How can this knowledge help you in your teaching practice?",
          options: [
            "It has little practical application",
            "It helps create a better learning environment for children",
            "It's mainly for theoretical knowledge",
            "It only helps with specific children"
          ],
          correctAnswer: 1
        },
        {
          question: "What makes this topic important in early childhood education?",
          options: [
            "It's required by regulations but not important",
            "It helps develop foundational skills in children",
            "It's only important for older children",
            "It's primarily for parent communication"
          ],
          correctAnswer: 1
        }
      );
    }
    
    // Randomize questions order
    const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffledQuestions.slice(0, 5)); // Limit to 5 questions
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setBonusPoints(0);
  };
  
  // Function to handle answering a question
  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };
  
  // Function to go to the next question or complete the quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;
      Object.entries(selectedAnswers).forEach(([qIndex, answerIndex]) => {
        const questionIndex = parseInt(qIndex);
        if (quizQuestions[questionIndex].correctAnswer === answerIndex) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / quizQuestions.length) * 100);
      setQuizScore(score);
      
      // Calculate bonus points based on score
      const points = Math.floor(score / 20); // 0-5 points based on score
      setBonusPoints(points);
      
      setQuizCompleted(true);
    }
  };
  
  // Function to generate matching pairs for the matching game
  const generateMatchingPairs = () => {
    if (!selectedLesson) return;
    
    let pairs = [];
    
    if (selectedLesson.category === 'patience') {
      pairs = [
        { id: 1, text: "Deep breathing", matched: false, flipped: false },
        { id: 2, text: "Calming technique", matched: false, flipped: false },
        { id: 3, text: "Counting to ten", matched: false, flipped: false },
        { id: 4, text: "Self-regulation strategy", matched: false, flipped: false },
        { id: 5, text: "Taking a break", matched: false, flipped: false },
        { id: 6, text: "Stepping away briefly", matched: false, flipped: false },
        { id: 7, text: "Positive self-talk", matched: false, flipped: false },
        { id: 8, text: "Encouraging internal dialogue", matched: false, flipped: false }
      ];
    } else if (selectedLesson.category === 'core-values') {
      pairs = [
        { id: 1, text: "Respect", matched: false, flipped: false },
        { id: 2, text: "Treating others with dignity", matched: false, flipped: false },
        { id: 3, text: "Integrity", matched: false, flipped: false },
        { id: 4, text: "Doing the right thing", matched: false, flipped: false },
        { id: 5, text: "Compassion", matched: false, flipped: false },
        { id: 6, text: "Showing kindness to others", matched: false, flipped: false },
        { id: 7, text: "Growth mindset", matched: false, flipped: false },
        { id: 8, text: "Embracing challenges", matched: false, flipped: false }
      ];
    } else if (selectedLesson.category === 'active-listening') {
      pairs = [
        { id: 1, text: "Eye contact", matched: false, flipped: false },
        { id: 2, text: "Shows attention", matched: false, flipped: false },
        { id: 3, text: "Nodding", matched: false, flipped: false },
        { id: 4, text: "Nonverbal acknowledgment", matched: false, flipped: false },
        { id: 5, text: "Paraphrasing", matched: false, flipped: false },
        { id: 6, text: "Restating in your own words", matched: false, flipped: false },
        { id: 7, text: "Open-ended questions", matched: false, flipped: false },
        { id: 8, text: "Encourages elaboration", matched: false, flipped: false }
      ];
    } else if (selectedLesson.category === 'quick-transition-techniques') {
      pairs = [
        { id: 1, text: "Cleanup song", matched: false, flipped: false },
        { id: 2, text: "Musical transition cue", matched: false, flipped: false },
        { id: 3, text: "Visual timer", matched: false, flipped: false },
        { id: 4, text: "Shows time remaining", matched: false, flipped: false },
        { id: 5, text: "Transition warnings", matched: false, flipped: false },
        { id: 6, text: "Prepares children for change", matched: false, flipped: false },
        { id: 7, text: "Cleanup buddies", matched: false, flipped: false },
        { id: 8, text: "Teamwork approach", matched: false, flipped: false }
      ];
    } else if (selectedLesson.category === 'mindful-mornings') {
      pairs = [
        { id: 1, text: "Breathing exercise", matched: false, flipped: false },
        { id: 2, text: "Calming technique", matched: false, flipped: false },
        { id: 3, text: "Body scan", matched: false, flipped: false },
        { id: 4, text: "Physical awareness", matched: false, flipped: false },
        { id: 5, text: "Gratitude practice", matched: false, flipped: false },
        { id: 6, text: "Expressing thankfulness", matched: false, flipped: false },
        { id: 7, text: "Movement breaks", matched: false, flipped: false },
        { id: 8, text: "Physical mindfulness", matched: false, flipped: false }
      ];
    } else {
      // Generic pairs for other categories
      pairs = [
        { id: 1, text: `${selectedLesson.title}`, matched: false, flipped: false },
        { id: 2, text: "Key teaching concept", matched: false, flipped: false },
        { id: 3, text: "Child development", matched: false, flipped: false },
        { id: 4, text: "Growth and learning", matched: false, flipped: false },
        { id: 5, text: "Classroom environment", matched: false, flipped: false },
        { id: 6, text: "Learning space", matched: false, flipped: false },
        { id: 7, text: "Chapter One philosophy", matched: false, flipped: false },
        { id: 8, text: "Lifelong foundation", matched: false, flipped: false }
      ];
    }
    
    // Create matching pairs (1 matches with 2, 3 with 4, etc.)
    const matchingPairsArray = [];
    for (let i = 0; i < pairs.length; i += 2) {
      matchingPairsArray.push({
        id: i,
        text: pairs[i].text,
        matched: false,
        flipped: false,
        matchId: i + 1
      });
      matchingPairsArray.push({
        id: i + 1,
        text: pairs[i + 1].text,
        matched: false,
        flipped: false,
        matchId: i
      });
    }
    
    // Shuffle the array
    const shuffled = [...matchingPairsArray].sort(() => 0.5 - Math.random());
    setMatchingPairs(shuffled);
    setSelectedCard(null);
    setMatchingMoves(0);
    setMatchesFound(0);
  };
  
  // Handle flipping a card in the matching game
  const handleCardFlip = (id: number) => {
    // Ignore if the card is already matched
    if (matchingPairs.find(card => card.id === id)?.matched) return;
    
    // If no card is selected, select this one
    if (selectedCard === null) {
      setSelectedCard(id);
      setMatchingPairs(matchingPairs.map(card => 
        card.id === id ? { ...card, flipped: true } : card
      ));
      return;
    }
    
    // If same card is clicked, ignore
    if (selectedCard === id) return;
    
    // Flip the second card
    setMatchingPairs(matchingPairs.map(card => 
      card.id === id ? { ...card, flipped: true } : card
    ));
    
    // Increment move counter
    setMatchingMoves(prev => prev + 1);
    
    // Check if it's a match
    const firstCard = matchingPairs.find(card => card.id === selectedCard);
    const secondCard = matchingPairs.find(card => card.id === id);
    
    if (firstCard && secondCard && firstCard.matchId === secondCard.id) {
      // It's a match!
      setMatchingPairs(matchingPairs.map(card => 
        (card.id === selectedCard || card.id === id) 
          ? { ...card, matched: true, flipped: true } 
          : card
      ));
      setSelectedCard(null);
      setMatchesFound(prev => prev + 1);
      
      // Check if all matches are found
      if (matchesFound + 1 === matchingPairs.length / 2) {
        // Calculate bonus points based on moves
        const maxMoves = matchingPairs.length;
        const efficiency = Math.max(0, maxMoves - (matchingMoves + 1));
        const bonusPoints = Math.floor(efficiency / 2);
        
        setBonusPoints(bonusPoints);
        setQuizCompleted(true); // Reuse this state for game completion
      }
    } else {
      // Not a match, flip back after a delay
      setTimeout(() => {
        setMatchingPairs(matchingPairs.map(card => 
          (card.id === selectedCard || card.id === id) 
            ? { ...card, flipped: false } 
            : card
        ));
        setSelectedCard(null);
      }, 1000);
    }
  };
  
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
    
    // Award points equal to the duration plus any bonus points from the quiz
    const basePoints = selectedLesson.duration;
    const totalPoints = quizCompleted ? basePoints + bonusPoints : basePoints;
    
    progressMutation.mutate({
      moduleId: selectedLesson.id,
      progress: 100,
      completed: true,
      pointsEarned: totalPoints // Award points based on duration and quiz performance
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
            5-minute activities for when you have a short break. All mini-lessons are shown below. Each one awards points equal to their duration.
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
              
              {/* Show all mini-lessons */}
              {allModules.map((lesson: MiniLesson) => {
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
                          <h3 className="text-lg font-semibold mb-3">Video Demonstrations</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-md font-medium mb-2">Classroom Transitions: 5 Strategies for Smooth Transitions</h4>
                              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe 
                                  width="100%" 
                                  height="100%" 
                                  src="https://www.youtube.com/embed/bWte1oMd4Qk" 
                                  title="Transition Techniques" 
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                                ></iframe>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Learn practical strategies for smooth classroom transitions that minimize disruption and maximize learning time.
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-md font-medium mb-2">Creative Transition Techniques for Preschoolers</h4>
                              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe 
                                  width="100%" 
                                  height="100%" 
                                  src="https://www.youtube.com/embed/yYHT-TF--og" 
                                  title="Creative Transition Techniques" 
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                                ></iframe>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Discover fun and engaging ways to help preschoolers transition between activities using music, movement, and games.
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-md font-medium mb-2">Managing Transitions in Early Childhood Classrooms</h4>
                              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe 
                                  width="100%" 
                                  height="100%" 
                                  src="https://www.youtube.com/embed/4IpNZlAkmns" 
                                  title="Managing Classroom Transitions" 
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                                ></iframe>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Expert teachers share their best practices for helping young children smoothly move from one activity to another.
                              </p>
                            </div>
                          </div>
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
                              src="https://www.youtube.com/embed/ryuuaifO8MQ" 
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
                              src="https://www.youtube.com/embed/owppju3jwPE" 
                              title="Active Listening Skills for Preschool" 
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
                              src="https://www.youtube.com/embed/Z4aD4RKoeLU" 
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

              {showGame ? (
                <div className="mt-4 mb-4">
                  {gameType === 'quiz' && !quizCompleted ? (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-indigo-900">Quiz: {selectedLesson.title}</h3>
                          <Badge variant="outline" className="bg-white">
                            Question {currentQuestionIndex + 1} of {quizQuestions.length}
                          </Badge>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="text-md font-medium mb-4">{quizQuestions[currentQuestionIndex]?.question}</h4>
                          
                          <RadioGroup 
                            value={selectedAnswers[currentQuestionIndex]?.toString()} 
                            onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, parseInt(value))}
                            className="space-y-3"
                          >
                            {quizQuestions[currentQuestionIndex]?.options.map((option, index) => (
                              <div key={index} className="flex items-start">
                                <RadioGroupItem 
                                  value={index.toString()} 
                                  id={`option-${index}`} 
                                  className="mt-1"
                                />
                                <Label htmlFor={`option-${index}`} className="ml-2 cursor-pointer">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowGame(false)}
                          >
                            Exit Quiz
                          </Button>
                          <Button 
                            onClick={handleNextQuestion}
                            disabled={selectedAnswers[currentQuestionIndex] === undefined}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : gameType === 'matching' && !quizCompleted ? (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-indigo-900">Memory Match: {selectedLesson.title}</h3>
                          <div className="flex space-x-4">
                            <Badge variant="outline" className="bg-white">
                              Moves: {matchingMoves}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              Matches: {matchesFound} / {matchingPairs.length / 2}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          {matchingPairs.map((card) => (
                            <div 
                              key={card.id} 
                              className={`
                                aspect-square rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-center text-center p-2 text-sm
                                ${card.flipped 
                                  ? 'bg-white border-indigo-400 shadow-md rotate-0' 
                                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 shadow rotate-y-180'
                                }
                                ${card.matched ? 'border-green-500 bg-green-50' : ''}
                              `}
                              onClick={() => !card.flipped && !card.matched && handleCardFlip(card.id)}
                            >
                              {card.flipped || card.matched ? (
                                <span>{card.text}</span>
                              ) : (
                                <span className="text-transparent">Hidden</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowGame(false)}
                          >
                            Exit Game
                          </Button>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setGameType('quiz');
                                generateQuizQuestions();
                              }}
                            >
                              Switch to Quiz
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100 text-center">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                          {gameType === 'matching' ? 'Game Complete!' : 'Quiz Complete!'}
                        </h3>
                        
                        <div className="mb-4 flex justify-center">
                          {quizScore >= 80 || (gameType === 'matching' && matchesFound === matchingPairs.length / 2) ? (
                            <Trophy className="h-16 w-16 text-yellow-500" />
                          ) : quizScore >= 60 ? (
                            <Star className="h-16 w-16 text-indigo-500" />
                          ) : (
                            <BookOpen className="h-16 w-16 text-blue-500" />
                          )}
                        </div>
                        
                        <div className="mb-4">
                          {gameType === 'quiz' ? (
                            <>
                              <h4 className="font-medium mb-2">Your Score: {quizScore}%</h4>
                              <Progress value={quizScore} className="h-2 w-full" />
                            </>
                          ) : (
                            <>
                              <h4 className="font-medium mb-2">Matching Complete!</h4>
                              <p>You found all matches in {matchingMoves} moves.</p>
                            </>
                          )}
                        </div>
                        
                        <div className="mb-6">
                          {gameType === 'quiz' ? (
                            quizScore >= 80 ? (
                              <p className="text-green-700">Excellent work! You've mastered this topic.</p>
                            ) : quizScore >= 60 ? (
                              <p className="text-blue-700">Good job! You understand the key concepts.</p>
                            ) : (
                              <p className="text-amber-700">You might want to review the material again.</p>
                            )
                          ) : (
                            <p className="text-green-700">
                              Great memory skills! You've reinforced key concepts from this lesson.
                            </p>
                          )}
                          
                          {bonusPoints > 0 && (
                            <p className="mt-2 text-indigo-700 font-medium">
                              Bonus: +{bonusPoints} extra points for your {gameType === 'quiz' ? 'score' : 'efficiency'}!
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowGame(false);
                                setQuizCompleted(false);
                              }}
                            >
                              Back to Lesson
                            </Button>
                            
                            {gameType === 'quiz' ? (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setGameType('matching');
                                  setQuizCompleted(false);
                                  generateMatchingPairs();
                                }}
                              >
                                Try Matching Game
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setGameType('quiz');
                                  setQuizCompleted(false);
                                  generateQuizQuestions();
                                }}
                              >
                                Try Quiz
                              </Button>
                            )}
                          </div>
                          
                          <Button 
                            onClick={handleCompleteMiniLesson}
                            disabled={progressMutation.isPending || lessonCompleted}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            {progressMutation.isPending ? 'Saving...' : lessonCompleted ? 'Already Completed' : 'Complete & Earn Points'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <DialogFooter>
                  {!lessonCompleted ? (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={handleCompleteMiniLesson} 
                        disabled={progressMutation.isPending}
                      >
                        {progressMutation.isPending ? 'Saving...' : 'Skip Games & Complete'}
                      </Button>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => {
                            setShowGame(true);
                            setGameType('quiz');
                            generateQuizQuestions();
                          }}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                          <Gamepad className="mr-2 h-4 w-4" />
                          Take Quiz
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowGame(true);
                            setGameType('matching');
                            generateMatchingPairs();
                          }}
                          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Memory Match
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>You've completed this mini-lesson and earned {progressMap[selectedLesson.id]?.pointsEarned || selectedLesson.duration} points!</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => {
                            setShowGame(true);
                            setGameType('quiz');
                            generateQuizQuestions();
                          }}
                          variant="outline"
                        >
                          <Gamepad className="mr-2 h-4 w-4" />
                          Quiz
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowGame(true);
                            setGameType('matching');
                            generateMatchingPairs();
                          }}
                          variant="outline"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Match
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}