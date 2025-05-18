import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AssessmentCelebration from "@/components/AssessmentCelebration";
import { Trophy, Sparkles, GraduationCap, ArrowRight, Map, Undo } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, AlertTriangle, Award, BookOpen, Check, CheckCircle, ChevronRight, 
  ClipboardList, MapIcon, RefreshCw, Star, TrendingUp 
} from "lucide-react";

// Audio feedback functions for Nintendo-like game experience
const playLevelUpSound = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create multiple oscillators for a richer sound
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const osc3 = context.createOscillator();
    
    // Create gain nodes for volume control
    const gainNode1 = context.createGain();
    const gainNode2 = context.createGain();
    const gainNode3 = context.createGain();
    
    // Connect oscillators to gain nodes
    osc1.connect(gainNode1);
    osc2.connect(gainNode2);
    osc3.connect(gainNode3);
    
    // Connect gain nodes to output
    gainNode1.connect(context.destination);
    gainNode2.connect(context.destination);
    gainNode3.connect(context.destination);
    
    // Classic Nintendo level-up progression
    osc1.type = 'triangle';
    osc2.type = 'square';
    osc3.type = 'sine';
    
    // Set initial gain values
    gainNode1.gain.value = 0.2;
    gainNode2.gain.value = 0.1;
    gainNode3.gain.value = 0.3;
    
    // Start at different frequencies for a chord-like effect
    osc1.frequency.value = 523.25; // C5
    osc2.frequency.value = 659.25; // E5
    osc3.frequency.value = 783.99; // G5
    
    // Start oscillators
    osc1.start(context.currentTime);
    osc2.start(context.currentTime);
    osc3.start(context.currentTime);
    
    // Create a Mario-like ascending pattern
    osc1.frequency.setValueAtTime(523.25, context.currentTime);
    osc1.frequency.linearRampToValueAtTime(783.99, context.currentTime + 0.2);
    osc1.frequency.linearRampToValueAtTime(1046.50, context.currentTime + 0.4);
    
    osc2.frequency.setValueAtTime(659.25, context.currentTime + 0.1);
    osc2.frequency.linearRampToValueAtTime(880.00, context.currentTime + 0.3);
    osc2.frequency.linearRampToValueAtTime(1318.51, context.currentTime + 0.5);
    
    osc3.frequency.setValueAtTime(783.99, context.currentTime + 0.2);
    osc3.frequency.linearRampToValueAtTime(1046.50, context.currentTime + 0.4);
    osc3.frequency.linearRampToValueAtTime(1567.98, context.currentTime + 0.6);
    
    // Fade out
    gainNode1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
    gainNode3.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.9);
    
    // Stop oscillators after fade out
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      osc3.stop();
    }, 900);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
};

const playCorrectSound = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create multiple oscillators for a richer sound
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    
    // Create gain nodes
    const gainNode1 = context.createGain();
    const gainNode2 = context.createGain();
    
    // Connect oscillators to gain nodes
    osc1.connect(gainNode1);
    osc2.connect(gainNode2);
    
    // Connect gain nodes to output
    gainNode1.connect(context.destination);
    gainNode2.connect(context.destination);
    
    // Set oscillator types for a game-like sound
    osc1.type = 'square';
    osc2.type = 'triangle';
    
    // Set initial gain values
    gainNode1.gain.value = 0.2;
    gainNode2.gain.value = 0.1;
    
    // Coin sound effect (Mario-like)
    osc1.frequency.value = 987.77; // B5
    osc2.frequency.value = 1318.51; // E6
    
    // Frequency movement for coin-like sound
    osc1.frequency.setValueAtTime(987.77, context.currentTime);
    osc1.frequency.linearRampToValueAtTime(1318.51, context.currentTime + 0.1);
    
    osc2.frequency.setValueAtTime(1318.51, context.currentTime);
    osc2.frequency.linearRampToValueAtTime(1567.98, context.currentTime + 0.1);
    
    // Start oscillators
    osc1.start();
    osc2.start();
    
    // Fade out
    gainNode1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    
    // Stop oscillators
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
    }, 300);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
};

const playWrongSound = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillators
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    
    // Create gain nodes
    const gainNode1 = context.createGain();
    const gainNode2 = context.createGain();
    
    // Connect oscillators to gain nodes
    osc1.connect(gainNode1);
    osc2.connect(gainNode2);
    
    // Connect gain nodes to output
    gainNode1.connect(context.destination);
    gainNode2.connect(context.destination);
    
    // Set oscillator types
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    
    // Set initial gain values
    gainNode1.gain.value = 0.2;
    gainNode2.gain.value = 0.1;
    
    // Mario-like "bump" sound effect
    osc1.frequency.value = 196.00; // G3
    osc2.frequency.value = 130.81; // C3
    
    // Frequency movement
    osc1.frequency.setValueAtTime(196.00, context.currentTime);
    osc1.frequency.linearRampToValueAtTime(146.83, context.currentTime + 0.2);
    
    osc2.frequency.setValueAtTime(130.81, context.currentTime);
    osc2.frequency.linearRampToValueAtTime(98.00, context.currentTime + 0.2);
    
    // Start oscillators
    osc1.start();
    osc2.start();
    
    // Fade out
    gainNode1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    
    // Stop oscillators
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
    }, 300);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
};

// Define types for assessment domain
type Domain = {
  id: string;
  name: string;
};

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface AssessmentQuestion {
  id: string;
  domain: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
  explanation?: string;
}

type AssessmentState = 'initial' | 'assessment' | 'celebration';

// Main Assessment Component
export default function AssessmentPage() {
  // Access router
  const [location, navigate] = useLocation();
  
  // Get auth user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  
  // Assessment questions state
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('initial');
  
  // Define assessment domains
  const domains: Domain[] = [
    { id: "core", name: "Raising Arizona CORE Values" },
    { id: "mindful", name: "Mindful Morning" },
    { id: "build", name: "Building a Human (Ch.1)" },
    { id: "language", name: "Language & Literacy" },
    { id: "reasoning", name: "Reasoning & Math" },
    { id: "social", name: "Social & Emotional" },
    { id: "classroom", name: "Classroom Management" },
    { id: "ages", name: "Ages & Stages" },
    { id: "inclusion", name: "Inclusion & Diversity" },
    { id: "health", name: "Health & Safety" },
  ];
  
  // Track current domain and questions
  const [activeDomainIndex, setActiveDomainIndex] = useState<number>(0);
  const [currentDomain, setCurrentDomain] = useState<string>(domains[0].id);
  const [domainQuestions, setDomainQuestions] = useState<AssessmentQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  
  // User interaction state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerFeedback, setAnswerFeedback] = useState({
    shown: false,
    correct: false,
    message: "",
    explanation: ""
  });
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Get assessment results if they exist
  const { data: assessmentResults } = useQuery({
    queryKey: ["/api/assessment-results"], 
    enabled: assessmentState === 'celebration' && !!user,
  });
  
  // Flag to show the completion view
  const [showCompletionView, setShowCompletionView] = useState(false);
  
  // Track points earned from assessment completion
  const [pointsEarned, setPointsEarned] = useState(10);
  
  // Handle viewing detailed assessment results
  const handleViewResults = () => {
    // Navigate to results page or show detailed results view
    navigate('/assessment-results');  // Redirect to the assessment results page
  };
  
  // Function to initialize the assessment
  const initializeAssessment = () => {
    // Reset all state
    setAnswers({});
    setActiveDomainIndex(0);
    setCurrentDomain(domains[0].id);
    setActiveQuestionIndex(0);
    setAssessmentState('assessment');
    
    // Load first domain questions
    updateDomainQuestions(domains[0].id, 'beginner');
  };
  
  // Load assessment questions from the server or a local file
  useEffect(() => {
    // Load questions from a local file for now (can be replaced with an API call)
    const loadQuestions = async () => {
      try {
        const response = await fetch('/assessment-questions.json');
        if (!response.ok) {
          throw new Error('Failed to load assessment questions');
        }
        const data = await response.json();
        setAssessmentQuestions(data);
      } catch (error) {
        console.error('Error loading assessment questions:', error);
        toast({
          variant: "destructive",
          title: "Error Loading Assessment",
          description: "Could not load assessment questions. Please try again later.",
        });
      }
    };
    
    loadQuestions();
  }, [toast]);
  
  // Function to update questions for the current domain
  const updateDomainQuestions = (domainId: string, difficulty: DifficultyLevel) => {
    // Filter questions for the current domain and difficulty level
    const questions = assessmentQuestions.filter(
      q => q.domain === domainId && q.difficulty === difficulty
    );
    
    // If no questions are available, try a different difficulty level
    if (questions.length === 0) {
      if (difficulty === 'beginner') {
        // Try intermediate if beginner has no questions
        updateDomainQuestions(domainId, 'intermediate');
      } else if (difficulty === 'intermediate') {
        // Try beginner if intermediate has no questions (fallback)
        updateDomainQuestions(domainId, 'beginner');
      } else {
        // If still no questions, show error
        toast({
          variant: "destructive",
          title: "No Questions Available",
          description: `No questions available for ${domainId}. Moving to next domain.`,
        });
        
        // Move to next domain if possible
        const nextDomainIndex = activeDomainIndex + 1;
        if (nextDomainIndex < domains.length) {
          setActiveDomainIndex(nextDomainIndex);
          setCurrentDomain(domains[nextDomainIndex].id);
          updateDomainQuestions(domains[nextDomainIndex].id, 'beginner');
        }
      }
      return;
    }
    
    // Shuffle questions and limit to a reasonable number (5)
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffled.slice(0, 5);
    
    setDomainQuestions(limitedQuestions);
    setActiveQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };
  
  // Calculate the current overall progress as a percentage
  const getProgressPercentage = () => {
    if (assessmentState === 'initial') return 0;
    if (assessmentState === 'celebration') return 100;
    
    const totalDomains = domains.length;
    const completedDomains = activeDomainIndex;
    
    const currentDomainProgress = 
      domainQuestions.length > 0 
        ? (activeQuestionIndex / domainQuestions.length) 
        : 0;
    
    const overallProgress = 
      ((completedDomains + currentDomainProgress) / totalDomains) * 100;
    
    return Math.round(overallProgress);
  };
  
  // Play sound for correct answer
  const playCorrectSound = () => {
    const audio = new Audio("/sounds/correct-answer.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Error playing correct sound:", e));
  };
  
  // Play sound for incorrect answer
  const playWrongSound = () => {
    const audio = new Audio("/sounds/wrong-answer.mp3");
    audio.volume = 0.4;
    audio.play().catch(e => console.error("Error playing wrong sound:", e));
  };
  
  // Play sound for level up / assessment completion
  const playLevelUpSound = () => {
    const audio = new Audio("/sounds/level-up.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Error playing level up sound:", e));
  };
  
  // Get the current active question
  const activeQuestion = domainQuestions[activeQuestionIndex] || {
    id: '',
    text: 'Loading question...',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctAnswer: '',
    domain: '',
    difficulty: 'beginner' as DifficultyLevel
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (answerFeedback.shown) return; // Prevent changing answers during feedback
    setSelectedAnswer(answer);
  };
  
  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;
    
    // Determine if answer is correct
    const correct = selectedAnswer === activeQuestion.correctAnswer;
    
    // Record the answer
    setAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: selectedAnswer
    }));
    
    // Set correctness state
    setIsCorrect(correct);
    
    // Show appropriate sound effect
    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    
    // Show feedback
    setAnswerFeedback({
      shown: true,
      correct,
      message: correct ? "You got it right!" : "Not quite right, but that's okay!",
      explanation: activeQuestion.explanation || 
        (correct 
          ? "Great job! You've demonstrated knowledge in this area." 
          : `The correct answer is: ${activeQuestion.correctAnswer}`)
    });
    
    // After a delay, move to next question or domain
    setTimeout(() => {
      // Reset feedback and selected answer
      setAnswerFeedback({
        shown: false,
        correct: false,
        message: "",
        explanation: ""
      });
      setSelectedAnswer(null);
      
      // Move to next question if available
      if (activeQuestionIndex < domainQuestions.length - 1) {
        setActiveQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        // If no more questions in this domain
        if (activeDomainIndex < domains.length - 1) {
          // Move to next domain
          const nextDomainIndex = activeDomainIndex + 1;
          setActiveDomainIndex(nextDomainIndex);
          setCurrentDomain(domains[nextDomainIndex].id);
          updateDomainQuestions(domains[nextDomainIndex].id, 'beginner');
          setSelectedAnswer(null);
          setIsCorrect(null);
        } else {
          // Assessment is complete, submit results
          submitAssessmentResults();
        }
      }
    }, 2000);
  };
  
  // Submit assessment results to server
  const queryClient = useQueryClient();
  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/submit-assessment', {
        answers,
        domains: domains.map(d => d.id)
      });
    },
    onSuccess: (data) => {
      // Refetch assessment results
      queryClient.invalidateQueries({ queryKey: ["/api/assessment-results"] });
      
      // Play level up sound for completion
      playLevelUpSound();
      
      // Set points earned from the response
      if (data?.pointsEarned) {
        setPointsEarned(data.pointsEarned);
      }
      
      // Show completion view
      setShowCompletionView(true);
      setAssessmentState('celebration');
      
      // Show toast notification
      toast({
        title: "Assessment Complete!",
        description: `Great job! You've earned ${data?.pointsEarned || 10} points for completing the assessment.`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to submit assessment:', error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "There was a problem submitting your assessment. Please try again.",
      });
    }
  });
  
  // Function to submit assessment results
  const submitAssessmentResults = () => {
    submitAssessmentMutation.mutate();
  };

  // Main assessment interface
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {assessmentState === 'celebration' ? (
        // Show celebration screen if assessment is complete
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <AssessmentCelebration 
            pointsEarned={pointsEarned}
            onViewResults={handleViewResults}
          />
        </main>
      ) : (
        // Show assessment interface
        <main className="container max-w-4xl mx-auto px-4 py-8">
          {assessmentState === 'initial' ? (
            <section className="w-full max-w-4xl mx-auto px-4 pb-16">
              <Card className="shadow-md">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                    <GraduationCap className="h-7 w-7 text-primary" />
                    Teacher Assessment
                  </CardTitle>
                  <CardDescription>
                    Complete this assessment to identify your teaching strengths and areas for growth
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">What You'll Discover:</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>Receive a detailed breakdown of your strengths and growth areas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>Get a personalized learning path with recommended modules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>Track your progress toward becoming a Master Lead Teacher</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-center pb-6 pt-2">
                  <Button 
                    size="lg" 
                    className="w-full max-w-md text-lg font-semibold gap-2"
                    onClick={initializeAssessment}
                  >
                    <Sparkles className="h-5 w-5" />
                    Start Assessment
                  </Button>
                </CardFooter>
              </Card>
            </section>
          ) : (
            <>
              {/* Progress Bar and Domain Navigation */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Assessment Progress
                  </h2>
                  <span className="text-sm font-medium text-primary">
                    {getProgressPercentage()}% Complete
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {domains.map((domain, index) => (
                  <Badge 
                    key={domain.id}
                    variant={activeDomainIndex === index ? "default" : 
                            (activeDomainIndex > index ? "outline" : "secondary")}
                    className={`cursor-default text-xs py-1 px-3 ${
                      activeDomainIndex === index ? '' : 
                      (activeDomainIndex > index ? 'bg-green-100 text-green-800 hover:bg-green-100' : '')
                    }`}
                  >
                    {activeDomainIndex > index && (
                      <Check className="w-3 h-3 mr-1 inline" />
                    )}
                    {domain.name}
                  </Badge>
                  ))}
                </div>
              </div>
              
              {/* Current Question Card */}
              <Card className="mb-6 shadow-md border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5">
                      {domains[activeDomainIndex].name}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-sm">
                      Question {activeQuestionIndex + 1} of {domainQuestions.length}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-3">
                    {activeQuestion.text}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <RadioGroup 
                    value={selectedAnswer || ""}
                    className="space-y-3"
                  >
                    {activeQuestion.options.map((option, index) => (
                      <div 
                        key={option}
                        className={`flex items-center space-x-3 rounded-md border p-4 transition-all duration-200
                          ${selectedAnswer === option ? 'border-primary bg-primary/5' : 'border-input'}
                          ${answerFeedback.shown && answers[activeQuestion.id] === option ? 
                            (option === activeQuestion.correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50') 
                            : ''}
                          hover:border-primary/50 hover:bg-primary/5 cursor-pointer
                        `}
                        onClick={() => handleAnswerSelect(option)}
                      >
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${index}`} 
                          className="text-primary"
                        />
                        <Label 
                          htmlFor={`option-${index}`}
                          className="w-full cursor-pointer font-normal"
                        >
                          {option}
                        </Label>
                        
                        {answerFeedback.shown && option === activeQuestion.correctAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                
                <CardFooter className="pt-2 pb-4">
                  <Button 
                    className="w-full" 
                    disabled={!selectedAnswer || answerFeedback.shown}
                    onClick={handleAnswerSubmit}
                  >
                    Submit Answer
                  </Button>
                </CardFooter>
              </Card>
            
              {/* Answer Feedback Overlay */}
              {answerFeedback.shown && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${answerFeedback.shown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <Card className={`max-w-md w-full mx-4 shadow-lg transform transition-transform duration-300 ${answerFeedback.shown ? 'scale-100' : 'scale-95'}`}>
                    <CardHeader className={answerFeedback.correct ? "bg-green-50" : "bg-red-50"}>
                      <CardTitle className="flex items-center gap-2">
                        {answerFeedback.correct ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <span className="text-green-800">Correct!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <span className="text-red-800">Incorrect</span>
                          </>
                        )}
                      </CardTitle>
                      <CardDescription className={answerFeedback.correct ? "text-green-700" : "text-red-700"}>
                        {answerFeedback.message}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-muted-foreground mb-2 text-sm font-medium">Explanation:</p>
                      <p>{answerFeedback.explanation || "Moving to the next question..."}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}

// Helper component: Info Icon
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24"
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}