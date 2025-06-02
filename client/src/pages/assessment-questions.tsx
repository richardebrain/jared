import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';
import AssessmentQuestion from '@/components/assessment/AssessmentQuestion';
import AssessmentTimer from '@/components/assessment/AssessmentTimer';
import AssessmentProgress from '@/components/assessment/AssessmentProgress';

interface SessionStatus {
  assessmentId: number;
  userId: number;
  type: string;
  startedAt: string;
  currentDifficulty: number;
  difficultyProgression: number[];
  domainCoverage: Record<string, number>;
  progress: {
    questionsAnswered: number;
    totalQuestions: number;
    currentSequence: number;
    percentComplete: number;
  };
  config: {
    questionCount: number;
    timePerQuestion: number;
    startingDifficulty: number;
  };
  currentQuestion?: QuestionData | null;
  completed?: boolean;
  completionReason?: string;
}

interface QuestionData {
  id: string;
  text: string;
  options: string[];
  domain: string;
  domainName: string;
  difficulty: number;
  sequence: number;
  explanation?: string;
  tags?: string[];
}

interface AnswerResponse {
  success: boolean;
  message: string;
  response: {
    questionSequence: number;
    isCorrect: boolean;
    pointsEarned: number;
    timedOut: boolean;
  };
  assessment: {
    completed: boolean;
    totalQuestions: number;
    questionsAnswered: number;
    nextSequence?: number;
    percentComplete?: number;
  };
}

export default function AssessmentQuestions() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Session and question state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Answer and timer state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  const { toast: toastFunction } = useToast();

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue your assessment.",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);

  // Load session status and current question
  const loadSessionStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/assessment/session/status', {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load session status');
      }

      if (result.success && result.session) {
        setSessionStatus(result.session);
        setTimeRemaining(result.session.config.timePerQuestion || 60);
        setQuestionStartTime(new Date());
        
        // Check if assessment was completed due to question pool exhaustion
        if (result.session.completed && result.session.completionReason === 'question_pool_exhausted') {
          toast({
            title: "Assessment Complete",
            description: `Assessment completed with ${result.session.progress.questionsAnswered} questions. No more unique questions available.`,
          });
          setLocation('/assessment-results');
          return;
        }
        
        // Check if we have a current question from the session
        if (result.session.currentQuestion) {
          setCurrentQuestion(result.session.currentQuestion);
          setSelectedAnswer(null);
        } else {
          // No current question - assessment might be complete or there's an error
          if (result.session.progress.questionsAnswered >= result.session.progress.totalQuestions) {
            toast({
              title: "Assessment Complete",
              description: "You have completed all questions. Redirecting to results...",
            });
            setLocation('/assessment-results');
          } else if (result.session.completed) {
            // Assessment marked as complete for other reasons
            const reason = result.session.completionReason === 'question_pool_exhausted' 
              ? 'No more unique questions available'
              : 'Assessment completed';
            toast({
              title: "Assessment Complete",
              description: reason,
            });
            setLocation('/assessment-results');
          } else {
            throw new Error('No current question available and assessment not marked complete');
          }
        }
      } else {
        throw new Error('No active assessment session found');
      }
    } catch (error: any) {
      console.error('Error loading session status:', error);
      setError(error.message);
      
      // Handle specific error cases
      if (error.message.includes('question pool exhausted')) {
        toast({
          title: "Assessment Complete",
          description: "Assessment completed. No more unique questions available in the question pool.",
        });
        setLocation('/assessment-results');
      } else if (error.message.includes('No active session') || error.message.includes('not found')) {
        toast({
          title: "No Active Assessment",
          description: "No active assessment session found. Please start a new assessment.",
          variant: "destructive",
        });
        setLocation('/initial-assessment');
      } else {
        toast({
          title: "Error Loading Assessment",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setLocation, toast]);

  // Submit answer
  const submitAnswer = useCallback(async (answerIndex: number | null, isTimeout: boolean = false) => {
    if (!sessionStatus || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const responseTime = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);

      const requestBody: any = {
        assessmentId: sessionStatus.assessmentId,
        questionId: currentQuestion.id,
        responseTime,
        timedOut: isTimeout
      };

      if (!isTimeout && answerIndex !== null) {
        requestBody.selectedAnswer = answerIndex;
      }

      const response = await fetch('/api/assessment/session/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const result: AnswerResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit answer');
      }

      if (result.success) {
        // Show feedback (without revealing correct answer)
        const feedbackMessage = isTimeout 
          ? "Time expired. Moving to next question..."
          : "Answer submitted successfully!";
          
        toast({
          title: feedbackMessage,
          description: `Points earned: ${result.response.pointsEarned}`,
        });

        // Check if assessment is complete
        if (result.assessment.completed) {
          toast({
            title: "Assessment Complete!",
            description: "Congratulations! You've completed all questions. Calculating results...",
          });
          setLocation('/assessment-results');
        } else {
          // Update session status and load next question
          setSessionStatus(prev => prev ? {
            ...prev,
            progress: {
              ...prev.progress,
              questionsAnswered: result.assessment.questionsAnswered,
              currentSequence: result.assessment.nextSequence || prev.progress.currentSequence + 1,
              percentComplete: result.assessment.percentComplete || 0
            }
          } : null);

          // Load next question after a brief delay
          setTimeout(() => {
            loadSessionStatus();
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error Submitting Answer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionStatus, currentQuestion, isSubmitting, questionStartTime, toast, setLocation, loadSessionStatus]);

  // Handle timer expiration
  const handleTimerExpire = useCallback(() => {
    if (!isSubmitting) {
      submitAnswer(null, true);
    }
  }, [submitAnswer, isSubmitting]);

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (selectedAnswer !== null && !isSubmitting) {
      submitAnswer(selectedAnswer, false);
    }
  };

  // Load session on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadSessionStatus();
    }
  }, [isAuthenticated, loadSessionStatus]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading assessment...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={() => setLocation('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main assessment interface
  if (!sessionStatus || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading question...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress and Timer Header */}
          <div className="grid md:grid-cols-2 gap-4">
            <AssessmentProgress 
              current={sessionStatus.progress.questionsAnswered + 1}
              total={sessionStatus.progress.totalQuestions}
              percentage={sessionStatus.progress.percentComplete}
              domain={currentQuestion.domainName}
              difficulty={currentQuestion.difficulty}
            />
            <AssessmentTimer
              timeRemaining={timeRemaining}
              totalTime={sessionStatus.config.timePerQuestion}
              onTimeExpire={handleTimerExpire}
              isActive={!isSubmitting}
            />
          </div>

          {/* Main Question Component */}
          <AssessmentQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            onAnswerSubmit={handleAnswerSubmit}
            isSubmitting={isSubmitting}
            hasSelectedAnswer={selectedAnswer !== null}
          />
        </div>
      </div>
    </div>
  );
} 