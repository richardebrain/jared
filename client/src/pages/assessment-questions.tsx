import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';
import AssessmentQuestion from '@/components/assessment/AssessmentQuestion';
import AssessmentTimer from '@/components/assessment/AssessmentTimer';
import AssessmentProgress from '@/components/assessment/AssessmentProgress';
import AssessmentCelebration from '@/components/AssessmentCelebration';

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
    resultsReady?: boolean;
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

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

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

      // Handle question pool exhausted error specifically
      if (response.status === 422 && result.error === 'question_pool_exhausted') {
        toast({
          title: "Assessment Cannot Continue",
          description: `You have answered all ${result.details.questionsAnswered} available questions. ${result.details.reason}`,
          variant: "destructive",
        });
        setError(`Question pool exhausted: ${result.details.reason}`);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load session status');
      }

      if (result.success && result.session) {
        setSessionStatus(result.session);
        setTimeRemaining(result.session.config.timePerQuestion || 60);
        setQuestionStartTime(new Date());
        
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
      if (error.message.includes('No active session') || error.message.includes('not found')) {
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
        // Check if assessment is complete
        if (result.assessment.completed) {
          // Show celebration page with completion data
          setCompletionData({
            totalQuestions: result.assessment.totalQuestions,
            questionsAnswered: result.assessment.questionsAnswered,
            completedAt: new Date().toISOString(),
            startedAt: sessionStatus.startedAt,
            resultsReady: result.assessment.resultsReady || false
          });
          setShowCelebration(true);
          
          // Show success toast
          toast({
            title: "Assessment Complete! 🎉",
            description: "Congratulations! You've completed all questions. Results are being prepared...",
          });
        } else {
          // Show simple feedback for regular answers without confusing point display
          const feedbackMessage = isTimeout 
            ? "Time expired. Moving to next question..."
            : "Answer submitted!";
            
          toast({
            title: feedbackMessage,
            description: result.response.isCorrect ? "Great job!" : "Keep going!",
          });

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

  // Handle viewing results from celebration page
  const handleViewResults = useCallback(() => {
    setLocation('/assessment-results');
  }, [setLocation]);

  // Handle continuing to dashboard from celebration page
  const handleContinueToDashboard = useCallback(() => {
    setLocation('/dashboard');
  }, [setLocation]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            {error.includes('Question pool exhausted') ? (
              <>
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Assessment Cannot Continue
                </h2>
                <p className="text-gray-600 mb-6">
                  You have answered all available unique questions in our current question pool. 
                  The assessment cannot continue as there are no more questions that haven't been asked yet.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Assessment Error
                </h2>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
              </>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setLocation('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
            
            {!error.includes('Question pool exhausted') && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
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

  // Show celebration page if assessment is complete
  if (showCelebration && completionData) {
    return (
      <AssessmentCelebration 
        assessmentData={completionData}
        onViewResults={handleViewResults}
        onContinue={handleContinueToDashboard}
      />
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