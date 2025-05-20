import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ThumbsUp, Award, CheckCircle, Star, Sparkles, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import enhancedAssessmentService, { AssessmentQuestion, AnswerResponse, Domain } from '../services/enhancedAssessmentService';
import confetti from 'canvas-confetti';
import { useQuery } from '@tanstack/react-query';
// Using direct audio refs instead of the useSound hook
import AssessmentFeedback from '@/components/AssessmentFeedback';

interface EnhancedAssessmentProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({
  userId,
  open,
  onOpenChange
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [difficultyIncreased, setDifficultyIncreased] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get user data for personalization
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: open
  });
  
  // Set up audio references for sound effects
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null);
  const levelUpAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      correctAudioRef.current = new Audio('/sounds/correct.mp3');
      incorrectAudioRef.current = new Audio('/sounds/incorrect.mp3');
      levelUpAudioRef.current = new Audio('/sounds/level-up.mp3');
      completionAudioRef.current = new Audio('/sounds/completion.mp3');
      
      // Set volume levels
      if (correctAudioRef.current) correctAudioRef.current.volume = 0.6;
      if (incorrectAudioRef.current) incorrectAudioRef.current.volume = 0.5;
      if (levelUpAudioRef.current) levelUpAudioRef.current.volume = 0.7;
      if (completionAudioRef.current) completionAudioRef.current.volume = 0.7;
    }
    
    // Clean up audio resources
    return () => {
      [correctAudioRef, incorrectAudioRef, levelUpAudioRef, completionAudioRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
        }
      });
    };
  }, []);

  // Check if assessment API is available
  useEffect(() => {
    const checkApiStatus = async () => {
      setIsLoading(true);
      try {
        // Load domains even if API check fails
        const domainsData = await enhancedAssessmentService.getDomains();
        setDomains(domainsData);
        
        // Then check API health
        const isAvailable = await enhancedAssessmentService.checkHealth();
        setApiAvailable(isAvailable);
      } catch (error) {
        console.error('Failed to connect to assessment API:', error);
        setApiAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      checkApiStatus();
    }
  }, [open]);

  // Load domains when assessment opens
  useEffect(() => {
    const loadDomains = async () => {
      if (!apiAvailable) return;
      
      try {
        const domainsData = await enhancedAssessmentService.getDomains();
        setDomains(domainsData);
      } catch (error) {
        console.error('Error loading domains:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment domains. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (open && apiAvailable) {
      loadDomains();
    }
  }, [open, apiAvailable, toast]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDomain('');
      setCurrentQuestion(null);
      setSelectedAnswer('');
      setFeedback(null);
      setIsReady(false);
      setShowResults(false);
      setQuestionsAnswered(0);
      setCorrectAnswers(0);
      setCurrentDifficulty(1);
    }
  }, [open]);

  // Start timer when question is loaded
  useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion]);

  const startAssessment = async () => {
    if (!selectedDomain) {
      toast({
        title: "Please select a domain",
        description: "Choose a topic area to begin your assessment",
        variant: "default"
      });
      return;
    }

    setIsStarting(true);
    try {
      const question = await enhancedAssessmentService.startAssessment(selectedDomain, userId);
      setCurrentQuestion(question);
      setIsReady(true);
      setCurrentDifficulty(question.difficulty);
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;
    
    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    try {
      const response = await enhancedAssessmentService.submitAnswer(
        currentQuestion.id,
        selectedAnswer,
        userId,
        timeTaken
      );
      
      setFeedback(response);
      setQuestionsAnswered(prev => prev + 1);
      
      // Check if answer is correct
      if (response.is_correct) {
        setCorrectAnswers(prev => prev + 1);
        // Play correct answer sound
        if (correctAudioRef.current) {
          correctAudioRef.current.currentTime = 0;
          correctAudioRef.current.play().catch(err => console.warn('Failed to play sound:', err));
        }
      } else {
        // Play incorrect answer sound
        if (incorrectAudioRef.current) {
          incorrectAudioRef.current.currentTime = 0;
          incorrectAudioRef.current.play().catch(err => console.warn('Failed to play sound:', err));
        }
      }
      
      // Check if assessment is complete
      if (response.assessment_complete) {
        // Play completion sound
        if (completionAudioRef.current) {
          completionAudioRef.current.currentTime = 0;
          completionAudioRef.current.play().catch(err => console.warn('Failed to play sound:', err));
        }
        
        // Delay showing results to let user see feedback for last question
        setTimeout(() => {
          setShowResults(true);
          // Trigger confetti for completion
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 2000);
      } else if (response.next_question) {
        // Check if difficulty has increased
        const newDifficulty = response.next_question.difficulty || 1;
        const difficultyHasIncreased = newDifficulty > currentDifficulty;
        setDifficultyIncreased(difficultyHasIncreased);
        
        // Queue up next question after feedback is shown
        setTimeout(() => {
          // If difficulty increased, play level up sound and show special message
          if (difficultyHasIncreased) {
            // Play level up sound
            if (levelUpAudioRef.current) {
              levelUpAudioRef.current.currentTime = 0;
              levelUpAudioRef.current.play().catch(err => console.warn('Failed to play level up sound:', err));
            }
            
            // Show special toast with personalized message
            const firstName = currentUser?.firstName || "Teacher";
            const compliments = [
              `Amazing work, ${firstName}! You're moving up to more challenging questions!`,
              `Wow, ${firstName}! Your knowledge is impressive - let's try something harder!`,
              `You're on fire, ${firstName}! Time to level up your challenges!`,
              `Fantastic job, ${firstName}! Your expertise deserves tougher questions!`,
              `Incredible answers, ${firstName}! Let's step up the difficulty!`
            ];
            
            // Show toast with fun message
            toast({
              title: "Difficulty Increased!",
              description: compliments[Math.floor(Math.random() * compliments.length)],
              variant: "default"
            });
            
            // Visual celebration for difficulty increase
            confetti({
              particleCount: 30,
              spread: 60,
              origin: { y: 0.7 }
            });
          }
          
          // Set up next question
          setCurrentQuestion(response.next_question);
          setSelectedAnswer('');
          setFeedback(null);
          setCurrentDifficulty(newDifficulty);
        }, 2500);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (feedback?.next_question) {
      setCurrentQuestion(feedback.next_question);
      setSelectedAnswer('');
      setFeedback(null);
    }
  };

  const finishAssessment = () => {
    onOpenChange(false);
    // Redirect to learning path or dashboard
    toast({
      title: "Assessment Complete",
      description: `You earned ${feedback?.completion_stats?.total_points || 0} points!`,
      variant: "default"
    });
  };

  // Helper function to get difficulty label
  const getDifficultyLabel = (difficulty: number) => {
    switch(difficulty) {
      case 1: return "Beginner";
      case 2: return "Basic";
      case 3: return "Intermediate";
      case 4: return "Advanced";
      case 5: return "Expert";
      default: return "Unknown";
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Assessment</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // We no longer need to show "Assessment Unavailable" message
  // Because we use fallback data from the server-side adapter instead
  // This ensures users always get a consistent experience even if the Python backend is down

  // Render domain selection
  if (!isReady) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Professional Assessment</DialogTitle>
            <DialogDescription>
              This assessment will help identify your strengths and areas for growth in early childhood education.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="text-sm font-medium mb-2">Select a knowledge area to assess:</h3>
            <RadioGroup value={selectedDomain} onValueChange={setSelectedDomain}>
              {Array.isArray(domains) ? domains.map(domain => (
                <div key={domain.id || domain.name} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={domain.name} id={`domain-${domain.id || domain.name}`} />
                  <Label htmlFor={`domain-${domain.id || domain.name}`} className="cursor-pointer">
                    {domain.name}
                    {domain.description && (
                      <span className="block text-xs text-muted-foreground">
                        {domain.description}
                      </span>
                    )}
                  </Label>
                </div>
              )) : (
                // Fallback domains if API response is not an array
                <>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="Child Development" id="domain-1" />
                    <Label htmlFor="domain-1" className="cursor-pointer">
                      Child Development
                      <span className="block text-xs text-muted-foreground">
                        Understanding how children grow and develop
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="Classroom Management" id="domain-2" />
                    <Label htmlFor="domain-2" className="cursor-pointer">
                      Classroom Management
                      <span className="block text-xs text-muted-foreground">
                        Strategies for effective classroom organization
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="Curriculum Planning" id="domain-3" />
                    <Label htmlFor="domain-3" className="cursor-pointer">
                      Curriculum Planning
                      <span className="block text-xs text-muted-foreground">
                        Creating engaging learning experiences
                      </span>
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={startAssessment} 
              disabled={isStarting || !selectedDomain}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : "Start Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render assessment completion results
  if (showResults && feedback?.completion_stats) {
    const stats = feedback.completion_stats;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="text-2xl font-bold">Assessment Complete!</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                <Award className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Congratulations!</h2>
              <p className="text-muted-foreground">
                You've completed the {selectedDomain} assessment
              </p>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex justify-between items-center">
                  <span>Questions Attempted:</span>
                  <span className="font-semibold">{stats.questions_attempted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Correct Answers:</span>
                  <span className="font-semibold">{stats.questions_correct}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy:</span>
                  <span className="font-semibold">{Math.round(stats.accuracy * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Highest Difficulty:</span>
                  <span className="font-semibold">{getDifficultyLabel(stats.highest_difficulty)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Points Earned:</span>
                  <span className="font-semibold text-amber-600">{stats.total_points} points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bear Bucks Earned:</span>
                  <span className="font-semibold text-emerald-600">{Math.floor(stats.total_points / 50)} Bear Bucks</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex justify-center">
                <p className="text-sm text-center">
                  Your learning path has been updated based on these results!
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={finishAssessment}
              className="w-full"
            >
              Continue to Learning Path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render question
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{selectedDomain} Assessment</DialogTitle>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
              Difficulty: {getDifficultyLabel(currentDifficulty)}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Question {questionsAnswered + 1}</span>
            <span>•</span>
            <span>{correctAnswers} correct</span>
          </div>
        </DialogHeader>
        
        {currentQuestion && (
          <div className="py-4">
            <h3 className="text-base font-medium mb-4">{currentQuestion.question}</h3>
            
            {currentQuestion.q_type === 'multiple_choice' && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={!!feedback}
                className="space-y-3"
              >
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem value={key} id={`option-${key}`} className="mt-1" />
                    <Label 
                      htmlFor={`option-${key}`} 
                      className={`cursor-pointer ${
                        feedback && feedback.correct_answer === key ? 'text-green-600 font-medium' : ''
                      }`}
                    >
                      {value}
                      {feedback && feedback.correct_answer === key && (
                        <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-600" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {currentQuestion.q_type === 'true_false' && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={!!feedback}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="true" id="option-true" className="mt-1" />
                  <Label 
                    htmlFor="option-true" 
                    className={`cursor-pointer ${
                      feedback && feedback.correct_answer === 'true' ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    True
                    {feedback && feedback.correct_answer === 'true' && (
                      <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-600" />
                    )}
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="false" id="option-false" className="mt-1" />
                  <Label 
                    htmlFor="option-false" 
                    className={`cursor-pointer ${
                      feedback && feedback.correct_answer === 'false' ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    False
                    {feedback && feedback.correct_answer === 'false' && (
                      <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-600" />
                    )}
                  </Label>
                </div>
              </RadioGroup>
            )}
            
            {feedback && (
              <AssessmentFeedback 
                feedback={feedback} 
                onContinue={handleNextQuestion}
                userName={currentUser?.firstName}
              />
            )}
          </div>
        )}
        
        <DialogFooter>
          {!feedback ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Exit</Button>
              <Button 
                onClick={submitAnswer} 
                disabled={isSubmitting || !selectedAnswer}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : "Submit Answer"}
              </Button>
            </>
          ) : !feedback.assessment_complete ? (
            <Button onClick={handleNextQuestion}>
              Next Question
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAssessment;