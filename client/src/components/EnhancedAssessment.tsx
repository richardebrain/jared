import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  finishAssessment,
  type Question,
  type AnswerFeedback,
  type AssessmentHistoryItem,
  type LearningPath
} from '@/services/assessmentService';

// Sound effects
const CORRECT_SOUND = new Audio('/sounds/correct.mp3');
const INCORRECT_SOUND = new Audio('/sounds/incorrect.mp3');
const COMPLETE_SOUND = new Audio('/sounds/complete.mp3');

interface EnhancedAssessmentProps {
  onComplete?: (learningPath: LearningPath) => void;
  onUpdate?: (progress: { domain: string, score: number }[]) => void;
}

const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({ onComplete, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize assessment
  useEffect(() => {
    const initAssessment = async () => {
      if (!user) {
        setIsLoading(false);
        setError("Please log in to take the assessment");
        return;
      }

      try {
        const assessmentId = await startAssessment(user.id);
        setAssessmentId(assessmentId);
        loadNextQuestion(assessmentId, []);
      } catch (error) {
        console.error('Error starting assessment:', error);
        setIsLoading(false);
        setApiAvailable(false);
        setError("Could not connect to the assessment service. Please try again later.");
      }
    };

    initAssessment();
  }, [user]);

  // Load the next question
  const loadNextQuestion = async (assessmentId: number, history: AssessmentHistoryItem[]) => {
    setIsLoading(true);
    setShowFeedback(false);
    setFeedback(null);
    setSelectedAnswer('');
    
    try {
      const response = await getNextQuestion(assessmentId, history);
      
      if ('status' in response) {
        // This is a status message, not a question
        if (response.status === 'completed') {
          handleAssessmentCompletion();
        } else if (response.status === 'error') {
          setError(response.message);
          setIsLoading(false);
        }
      } else {
        // This is a question
        setCurrentQuestion(response);
        setStartTime(Date.now());
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading next question:', error);
      setIsLoading(false);
      setError("Failed to load the next question. Please try refreshing the page.");
    }
  };

  // Handle assessment completion
  const handleAssessmentCompletion = async () => {
    setIsLoading(true);
    
    try {
      if (assessmentId) {
        const learningPath = await finishAssessment(assessmentId);
        setLearningPath(learningPath);
        setAssessmentComplete(true);
        
        // Play completion sound
        COMPLETE_SOUND.play();
        
        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Notify parent component
        if (onComplete) {
          onComplete(learningPath);
        }
        
        // Show toast notification
        toast({
          title: "Assessment Complete!",
          description: `You got ${learningPath.questions_correct} out of ${learningPath.questions_asked} questions correct!`,
          variant: "default",
        });
        
        // Award points (this would be handled by the backend typically)
        toast({
          title: "Points Awarded!",
          description: "You earned 10 points for completing the assessment.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error finishing assessment:', error);
      setError("Failed to complete the assessment. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!assessmentId || !currentQuestion || !selectedAnswer || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate time taken
      const timeTakenMs = Date.now() - startTime;
      
      // Submit the answer
      const feedback = await submitAnswer(
        assessmentId, 
        currentQuestion.id, 
        selectedAnswer,
        timeTakenMs
      );
      
      setFeedback(feedback);
      setShowFeedback(true);
      
      // Play sound based on correctness
      if (feedback.is_correct) {
        CORRECT_SOUND.play();
      } else {
        INCORRECT_SOUND.play();
      }
      
      // Update history
      const newHistoryItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: feedback.is_correct,
        difficulty: feedback.next_difficulty
      };
      
      const updatedHistory = [...history, newHistoryItem];
      setHistory(updatedHistory);
      
      // Notify parent component of progress update
      if (onUpdate) {
        // Calculate domain scores (simplified version)
        const domainScores = updatedHistory.reduce((acc, item) => {
          if (!acc[item.domain]) {
            acc[item.domain] = { correct: 0, total: 0 };
          }
          acc[item.domain].total++;
          if (item.correct) {
            acc[item.domain].correct++;
          }
          return acc;
        }, {} as Record<string, { correct: number, total: number }>);
        
        const scores = Object.entries(domainScores).map(([domain, stats]) => ({
          domain,
          score: (stats.correct / stats.total) * 100
        }));
        
        onUpdate(scores);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle continuing to the next question
  const handleContinue = () => {
    if (assessmentId) {
      loadNextQuestion(assessmentId, history);
    }
  };

  // Handle viewing assessment results
  const handleViewResults = () => {
    // This would navigate to the results page or show results modal
    toast({
      title: "Results Ready",
      description: "Your personalized learning path is now available.",
      variant: "default",
    });
  };

  // Render the current progress
  const renderProgress = () => {
    if (!currentQuestion || history.length === 0) return null;
    
    // Group history by domain to show domain-specific progress
    const domainProgress = history.reduce((acc, item) => {
      if (!acc[item.domain]) {
        acc[item.domain] = { correct: 0, total: 0 };
      }
      acc[item.domain].total++;
      if (item.correct) {
        acc[item.domain].correct++;
      }
      return acc;
    }, {} as Record<string, { correct: number, total: number }>);
    
    // Calculate overall progress
    const totalQuestions = history.length;
    const correctAnswers = history.filter(item => item.correct).length;
    const progressPercentage = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100) 
      : 0;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{correctAnswers}/{totalQuestions} Correct</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        
        {/* Domain-specific progress */}
        {Object.entries(domainProgress).map(([domain, stats]) => {
          const domainPercentage = Math.round((stats.correct / stats.total) * 100);
          return (
            <div key={domain} className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{domain}</span>
                <span className="text-sm font-medium">{stats.correct}/{stats.total}</span>
              </div>
              <Progress value={domainPercentage} className="h-2" />
            </div>
          );
        })}
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading assessment...</p>
      </div>
    );
  }

  // Render error state
  if (error || !apiAvailable) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>
            {error || "The assessment service is currently unavailable. Please try again later."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render completed assessment state
  if (assessmentComplete && learningPath) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Assessment Complete!</CardTitle>
          <CardDescription className="text-center text-lg">
            You got {learningPath.questions_correct} out of {learningPath.questions_asked} questions correct.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-lg mb-2">Your Strongest Area</h3>
              <p className="text-green-700">{learningPath.strongest_domain}</p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-lg mb-2">Area for Growth</h3>
              <p className="text-amber-700">{learningPath.weakest_domain}</p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold text-xl mb-3">Your Personalized Learning Path</h3>
              <div className="space-y-4">
                {Object.entries(learningPath.domain_scores).map(([domain, score]) => (
                  <div key={domain} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-lg">{domain}</h4>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                        {score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mb-2">
                      <Progress value={score} className="h-2" />
                    </div>
                    {learningPath.learning_path[domain] && (
                      <ul className="list-disc pl-5 space-y-1 mt-3">
                        {learningPath.learning_path[domain].map((item, index) => (
                          <li key={index} className="text-sm text-gray-700">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleViewResults}
            className="px-8"
          >
            Take Me To Assessment Results
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render question view
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Assessment</CardTitle>
            <CardDescription>
              {currentQuestion?.domain} - Difficulty Level {currentQuestion?.difficulty}
            </CardDescription>
          </div>
          <div className="text-sm bg-primary/10 px-3 py-1 rounded-full">
            Question {history.length + 1}
          </div>
        </div>
        
        {renderProgress()}
      </CardHeader>
      
      <CardContent>
        {currentQuestion && (
          <div className="space-y-4">
            <div className="text-lg font-medium">{currentQuestion.question}</div>
            
            <RadioGroup 
              value={selectedAnswer} 
              onValueChange={setSelectedAnswer}
              disabled={showFeedback}
              className="space-y-3"
            >
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <div key={key} className={`flex items-start space-x-2 p-3 rounded-lg ${
                  showFeedback && key === feedback?.correct_answer 
                    ? 'bg-green-50 border border-green-200' 
                    : showFeedback && key === selectedAnswer && key !== feedback?.correct_answer
                      ? 'bg-red-50 border border-red-200'
                      : 'border'
                }`}>
                  <RadioGroupItem 
                    value={key} 
                    id={`option-${key}`} 
                    disabled={showFeedback}
                    className="mt-1"
                  />
                  <div className="w-full">
                    <Label htmlFor={`option-${key}`} className="flex justify-between w-full cursor-pointer">
                      <span>{value}</span>
                      {showFeedback && (
                        key === feedback?.correct_answer 
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : key === selectedAnswer && key !== feedback?.correct_answer
                            ? <XCircle className="h-5 w-5 text-red-500" />
                            : null
                      )}
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            {showFeedback && feedback && (
              <div className={`mt-6 p-4 rounded-lg ${
                feedback.is_correct ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className="font-semibold mb-2">
                  {feedback.message}
                </p>
                {feedback.explanation && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-1">Explanation:</h4>
                    <p className="text-sm">{feedback.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between flex-wrap gap-2">
        {!showFeedback ? (
          <Button 
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Answer'
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleContinue}
            className="ml-auto"
          >
            Next Question
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EnhancedAssessment;