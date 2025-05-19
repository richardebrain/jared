import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardDescription, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Award, Check, AlertTriangle } from 'lucide-react';
import assessmentService from '../services/assessmentService';
import ConfettiExplosion from 'react-confetti-explosion';

interface EnhancedAssessmentProps {
  userId: number;
}

interface Question {
  id: number;
  question: string;
  domain: string;
  sub_domain?: string;
  difficulty: number;
  q_type: string;
  options: Record<string, string>;
  hints?: string[];
  time_limit?: number;
}

interface AssessmentResult {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  points_earned: number;
  message: string;
  next_difficulty: number;
  next_question?: Question;
  assessment_complete: boolean;
}

const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({ userId }) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentActive, setAssessmentActive] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [assessmentComplete, setAssessmentComplete] = useState<boolean>(false);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check API health when component mounts
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await assessmentService.checkHealth();
        setApiHealthy(health.status === 'healthy');
        if (health.status !== 'healthy') {
          setError('Assessment API is not available. Please try again later.');
        } else {
          loadDomains();
        }
      } catch (err) {
        console.error('Error checking API health:', err);
        setApiHealthy(false);
        setError('Assessment API is not available. Please try again later.');
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  // Load available domains
  const loadDomains = async () => {
    try {
      setLoading(true);
      const domainsData = await assessmentService.getDomains();
      setDomains(domainsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading domains:', err);
      setError('Failed to load assessment domains. Please try again later.');
      setLoading(false);
    }
  };

  // Start a new assessment
  const startAssessment = async () => {
    if (!selectedDomain) {
      toast({
        title: "Domain Required",
        description: "Please select a domain to start the assessment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setAssessmentActive(true);
      setQuestionCount(0);
      setCorrectCount(0);
      setTotalPoints(0);
      setResult(null);
      
      const questionData = await assessmentService.startAssessment(selectedDomain, userId);
      setCurrentQuestion(questionData);
      setLoading(false);
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError('Failed to start assessment. Please try again later.');
      setLoading(false);
      setAssessmentActive(false);
    }
  };

  // Submit an answer
  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer) {
      toast({
        title: "Answer Required",
        description: "Please select an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const resultData = await assessmentService.submitAnswer(
        currentQuestion.id,
        userAnswer,
        userId
      );
      
      setResult(resultData);
      setQuestionCount(prev => prev + 1);
      if (resultData.is_correct) {
        setCorrectCount(prev => prev + 1);
      }
      setTotalPoints(prev => prev + resultData.points_earned);
      setSubmitting(false);
      
      // If assessment is complete, show confetti
      if (resultData.assessment_complete) {
        setAssessmentComplete(true);
        setShowConfetti(true);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      toast({
        title: "Submission Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // Go to next question
  const goToNextQuestion = () => {
    if (result && result.next_question) {
      setCurrentQuestion(result.next_question);
      setUserAnswer('');
      setResult(null);
      setShowHint(false);
      setCurrentHintIndex(0);
    } else {
      // No more questions, end assessment
      setAssessmentActive(false);
      setCurrentQuestion(null);
    }
  };

  // Show next hint
  const showNextHint = () => {
    if (currentQuestion?.hints && currentQuestion.hints.length > currentHintIndex) {
      setShowHint(true);
      setCurrentHintIndex(prev => Math.min(prev + 1, (currentQuestion.hints?.length || 1) - 1));
    }
  };

  // Reset assessment
  const resetAssessment = () => {
    setSelectedDomain('');
    setCurrentQuestion(null);
    setUserAnswer('');
    setResult(null);
    setQuestionCount(0);
    setCorrectCount(0);
    setTotalPoints(0);
    setAssessmentActive(false);
    setAssessmentComplete(false);
  };

  // Complete assessment and go to dashboard
  const completeAssessment = () => {
    toast({
      title: "Assessment Complete",
      description: `Great job! You earned ${totalPoints} points in this assessment.`,
    });
    resetAssessment();
    navigate('/dashboard');
  };

  // Format difficulty level as text
  const formatDifficulty = (level: number): string => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Advanced';
      case 4: return 'Expert';
      default: return `Level ${level}`;
    }
  };

  // If API is not healthy, show error
  if (!apiHealthy) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-red-500">
            <AlertTriangle className="inline-block mr-2" />
            Assessment System Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            The assessment system is currently unavailable. Please try again later or contact support.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading assessment system...</p>
      </div>
    );
  }

  // Show error message if any
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-red-500">
            <AlertTriangle className="inline-block mr-2" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  // Show assessment complete screen
  if (assessmentComplete && !currentQuestion) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        {showConfetti && <ConfettiExplosion duration={3000} particleCount={100} width={1600} />}
        <CardHeader>
          <CardTitle className="text-center text-2xl text-primary">
            <Award className="inline-block mr-2" />
            Assessment Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Your Results:</h3>
            <p className="text-lg mb-1">
              <span className="font-semibold">Questions Answered:</span> {questionCount}
            </p>
            <p className="text-lg mb-1">
              <span className="font-semibold">Correct Answers:</span> {correctCount}
            </p>
            <p className="text-lg mb-1">
              <span className="font-semibold">Accuracy:</span> {questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0}%
            </p>
            <p className="text-lg mb-1">
              <span className="font-semibold">Points Earned:</span> {totalPoints}
            </p>
            <div className="mt-4">
              <p className="text-xl font-bold mb-2">
                {correctCount >= 7 
                  ? "Congratulations! You've passed this assessment." 
                  : "Keep practicing! You can try this assessment again."}
              </p>
              <p className="text-lg">
                {correctCount >= 7 
                  ? "You've demonstrated strong knowledge in this area." 
                  : "Don't worry! Every attempt helps you improve."}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={resetAssessment}>
            Try Another Assessment
          </Button>
          <Button onClick={completeAssessment}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show domain selection if no assessment is active
  if (!assessmentActive) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Enhanced Assessment</CardTitle>
          <CardDescription className="text-center">
            Select a domain to assess your knowledge and skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Select Domain</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a knowledge domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={startAssessment} 
            disabled={!selectedDomain || loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Start Assessment'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show active assessment with current question
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Progress information */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-medium">Domain:</span> {selectedDomain}
            </div>
            <div>
              <span className="font-medium">Difficulty:</span> {currentQuestion && formatDifficulty(currentQuestion.difficulty)}
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-medium">Questions:</span> {questionCount}
            </div>
            <div>
              <span className="font-medium">Correct:</span> {correctCount}
            </div>
            <div>
              <span className="font-medium">Points:</span> {totalPoints}
            </div>
          </div>
          <Progress value={(questionCount / 15) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Question card */}
      {currentQuestion && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.sub_domain && (
              <CardDescription>
                Topic: {currentQuestion.sub_domain}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {currentQuestion.q_type === 'multiple_choice' && (
              <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`option-${key}`} disabled={!!result} />
                      <Label htmlFor={`option-${key}`} className="flex-grow cursor-pointer">
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Hints */}
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={showNextHint}
                          disabled={!!result || (showHint && currentHintIndex === currentQuestion.hints.length - 1)}
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Need a hint?
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click for a helpful hint. Using hints may reduce points.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {showHint && (
                    <span className="text-sm text-muted-foreground">
                      Hint {currentHintIndex + 1} of {currentQuestion.hints.length}
                    </span>
                  )}
                </div>
                
                {showHint && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    {currentQuestion.hints[currentHintIndex]}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={submitAnswer} 
              disabled={!userAnswer || submitting || !!result}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Results card */}
      {result && (
        <Card className={`border-2 ${result.is_correct ? 'border-green-500' : 'border-amber-500'} shadow-lg`}>
          <CardHeader>
            <CardTitle className={result.is_correct ? 'text-green-600' : 'text-amber-600'}>
              {result.is_correct ? (
                <><Check className="inline-block mr-2" /> Correct!</>
              ) : (
                <><AlertTriangle className="inline-block mr-2" /> Not Quite</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Correct Answer: {result.correct_answer} - {currentQuestion?.options[result.correct_answer]}</p>
                {result.explanation && (
                  <p className="mt-2">{result.explanation}</p>
                )}
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{result.message}</p>
              </div>
              
              <div>
                <p className="font-medium">Points earned: {result.points_earned}</p>
                {result.next_difficulty > (currentQuestion?.difficulty || 0) && (
                  <p className="text-green-600">You've advanced to {formatDifficulty(result.next_difficulty)}!</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {result.assessment_complete ? (
              <Button onClick={() => setAssessmentComplete(true)}>
                Complete Assessment
              </Button>
            ) : (
              <Button onClick={goToNextQuestion}>
                Next Question
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAssessment;