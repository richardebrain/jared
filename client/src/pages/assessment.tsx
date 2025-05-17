import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AssessmentCelebration } from "@/components/AssessmentCelebration";
import { Trophy, Sparkles, GraduationCap, ArrowRight, Map, Undo } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Audio feedback functions for game-like experience
const playLevelUpSound = () => {
  try {
    // Just use a beep sound for now as audio files might not be available
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    
    // Start with a higher note
    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
    gainNode.gain.setValueAtTime(0.4, context.currentTime);
    oscillator.start();
    
    // Then up to higher note
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.2); // E5
    
    // Then to highest note
    oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.4); // G5
    
    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
    oscillator.stop(context.currentTime + 1.5);
  } catch (e) {
    console.error("Error playing level up sound", e);
  }
};

const playCorrectSound = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    
    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    oscillator.start();
    
    // Quick up arpeggio
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
    
    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
    oscillator.stop(context.currentTime + 0.7);
  } catch (e) {
    console.error("Error playing correct sound", e);
  }
};

const playIncorrectSound = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    
    oscillator.frequency.setValueAtTime(369.99, context.currentTime); // F#4
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    oscillator.start();
    
    // Down to another note
    oscillator.frequency.setValueAtTime(311.13, context.currentTime + 0.2); // D#4
    
    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
    oscillator.stop(context.currentTime + 0.7);
  } catch (e) {
    console.error("Error playing incorrect sound", e);
  }
};

// Difficulty levels and question types
type QuestionType = 'multiple-choice';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Helper types
type AssessmentState = 'initial' | 'assessment' | 'celebration';
type AssessmentDomainFilters = 'all' | 'completed' | 'remaining';

// Define question interface
interface Question {
  id: string;
  text: string;
  domain: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: string;
  required: boolean;
  explanation?: string; // For internal reference, not shown to user
}

// Main assessment component
export default function AssessmentPage() {
  // Get auth state
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Track assessment state
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('initial');
  
  // Store assessment questions
  const [assessmentQuestions, setAssessmentQuestions] = useState<Question[]>([]);
  
  // Store user answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Track the current domain
  const [currentDomain, setCurrentDomain] = useState("language");
  
  // Store domains
  const domains = [
    { id: "language", name: "Language & Literacy", required: true },
    { id: "reasoning", name: "Reasoning & Math", required: true },
    { id: "social", name: "Social & Emotional", required: true },
    { id: "classroom", name: "Classroom Management", required: true },
    { id: "ages", name: "Ages & Stages", required: true},
    { id: "inclusion", name: "Inclusion & Diversity", required: true },
    { id: "health", name: "Health & Safety", required: true },
  ];
  
  // Store for domain filters
  const [domainFilter, setDomainFilter] = useState<AssessmentDomainFilters>('all');
  
  // Active domain index and questions for that domain
  const [activeDomainIndex, setActiveDomainIndex] = useState(0);
  const [domainQuestions, setDomainQuestions] = useState<Question[]>([]);
  
  // Track active question in domain
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  // Track the selected answer for the current question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Track answer correctness
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // For managing the answer feedback overlay
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
  
  // Function to initialize the assessment
  const initializeAssessment = () => {
    // Reset all state
    setAnswers({});
    setActiveQuestionIndex(0);
    setActiveDomainIndex(0);
    setCurrentDomain(domains[0].id);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setDomainQuestions([]);
    setShowCompletionView(false);
    
    // Set initial state
    setAssessmentState('assessment');
    
    // Load questions for the first domain
    updateDomainQuestions(domains[0].id, 'beginner');
  };
  
  // Update the questions for the current domain and difficulty
  const updateDomainQuestions = (domainId: string, difficulty: DifficultyLevel) => {
    // Filter questions for the current domain and difficulty
    const filteredQuestions = assessmentQuestions.filter(
      q => q.domain === domainId && q.difficulty === difficulty
    );
    
    // Shuffle the questions for variety
    const shuffledQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);
    
    // Take only 5 questions per domain
    const selectedQuestions = shuffledQuestions.slice(0, 5);
    
    // Update the domain questions
    setDomainQuestions(selectedQuestions);
    
    // Reset active question index
    setActiveQuestionIndex(0);
    
    // Reset selected answer
    setSelectedAnswer(null);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    if (answerFeedback.shown) return; // Don't allow changes during feedback
    setSelectedAnswer(answerId);
  };
  
  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!selectedAnswer || answerFeedback.shown) return; // Require an answer & prevent double submission
    
    const currentQuestion = domainQuestions[activeQuestionIndex];
    const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    // Play appropriate sound
    if (isAnswerCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    
    // Set answer feedback
    setAnswerFeedback({
      shown: true,
      correct: isAnswerCorrect,
      message: isAnswerCorrect ? "Correct! Great job!" : "That's not quite right.",
      explanation: currentQuestion.explanation || ""
    });
    
    // Update answers object
    setAnswers({
      ...answers,
      [currentQuestion.id]: selectedAnswer
    });
    
    // Update correctness state
    setIsCorrect(isAnswerCorrect);
    
    // After 2 seconds, hide the feedback and move to next question
    setTimeout(() => {
      setAnswerFeedback({
        shown: false,
        correct: false,
        message: "",
        explanation: ""
      });
      
      // Check if we have more questions in this domain
      if (activeQuestionIndex < domainQuestions.length - 1) {
        // Move to next question in current domain
        setActiveQuestionIndex(activeQuestionIndex + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        // Check if we have more domains
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
    onSuccess: () => {
      // Refetch assessment results
      queryClient.invalidateQueries({ queryKey: ["/api/assessment-results"] });
      
      // Play level up sound for completion
      playLevelUpSound();
      
      // Show completion view
      setShowCompletionView(true);
      setAssessmentState('celebration');
      
      // Show toast notification
      toast({
        title: "Assessment Complete!",
        description: "Great job! You've earned points for completing the assessment.",
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
  
  // Load assessment questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Use the correct path to access the questions in client/public folder
        const response = await fetch('/assessment-questions.json');
        if (!response.ok) {
          console.error('Failed to load assessment questions, status:', response.status);
          throw new Error('Failed to load assessment questions');
        }
        const data = await response.json();
        console.log('Successfully loaded assessment questions:', data.length);
        setAssessmentQuestions(data);
      } catch (error) {
        console.error('Error loading assessment questions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assessment questions. Please try again.",
        });
      }
    };
    
    loadQuestions();
  }, [toast]);
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (domains.length === 0) return 0;
    
    const domainProgress = (activeDomainIndex / domains.length) * 100;
    
    // Add progress within the current domain
    if (domainQuestions.length > 0) {
      const questionProgressValue = (activeQuestionIndex / domainQuestions.length) * (100 / domains.length);
      return Math.min(Math.round(domainProgress + questionProgressValue), 100);
    }
    
    return Math.round(domainProgress);
  };
  
  // If assessment data is still loading, show loading state
  if (isUserLoading || assessmentQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-2xl mx-auto shadow-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Loading Assessment</CardTitle>
              <CardDescription className="text-center">
                Preparing your personalized assessment experience...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If showing completion view
  if (showCompletionView) {
    // Calculate total correct answers for display
    const totalAnswers = Object.keys(answers).length;
    const correctAnswers = Object.keys(answers).filter(qId => {
      const question = assessmentQuestions.find(q => q.id === qId);
      return question && answers[qId] === question.correctAnswer;
    }).length;
    
    // Function to reset and restart the assessment
    const resetAssessment = () => {
      setShowCompletionView(false);
      initializeAssessment();
    };
    
    return (
      <AssessmentCelebration 
        user={user}
        assessmentResults={assessmentResults}
        resetAssessment={resetAssessment}
        totalAnswers={totalAnswers}
        correctAnswers={correctAnswers}
      />
    );
  }
  
  // If in initial state, show start screen
  if (assessmentState === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <Header />
        <main className="container max-w-5xl mx-auto px-4 py-12">
          <Card className="max-w-3xl mx-auto shadow-md border-primary/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                Early Childhood Education Assessment
              </CardTitle>
              <CardDescription className="text-lg">
                Discover your strengths and growth areas as an early childhood educator
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-4">
              <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <InfoIcon className="h-5 w-5 text-primary" />
                  About This Assessment
                </h3>
                <p className="mb-3">
                  This comprehensive assessment will evaluate your knowledge and skills across 7 key domains of early childhood education:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {domains.map((domain) => (
                    <div key={domain.id} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{domain.name}</span>
                    </div>
                  ))}
                </div>
                <p>
                  Based on your results, we'll create a personalized learning path to help you grow as an educator.
                </p>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  What To Expect
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>The assessment takes approximately <strong>15-20 minutes</strong> to complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You'll answer <strong>35 multiple-choice questions</strong> (5 per domain)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Questions are based on ITERS/ECERS frameworks and CLASS standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You'll receive immediate feedback after completing each domain</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Rewards & Benefits
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Earn <strong>10 points</strong> for completing the assessment</span>
                  </li>
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
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6 pt-2">
              <Button 
                size="lg" 
                className="w-full max-w-md text-lg font-semibold gap-2"
                onClick={initializeAssessment}
              >
                Start Assessment
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  // Render the active assessment question
  const activeQuestion = domainQuestions[activeQuestionIndex];

  // If no active question is available
  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-2xl mx-auto shadow-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Loading Questions</CardTitle>
              <CardDescription className="text-center">
                Preparing questions for {domains[activeDomainIndex]?.name || "next domain"}...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main assessment interface
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
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
      </main>
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
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}