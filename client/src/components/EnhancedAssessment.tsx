import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  finishAssessment,
  AssessmentHistoryItem,
  QuestionResponse,
  AnswerResult,
  LearningPathResponse
} from '../services/assessmentService';

// Sound effects for feedback
const CORRECT_SOUND = new Audio('/sounds/correct.mp3');
const INCORRECT_SOUND = new Audio('/sounds/incorrect.mp3');
const COMPLETE_SOUND = new Audio('/sounds/complete.mp3');

export interface EnhancedAssessmentProps {
  userId: number;
  onComplete?: (result: LearningPathResponse) => void;
}

const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({ userId, onComplete }) => {
  // Assessment state
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [showingFeedback, setShowingFeedback] = useState<boolean>(false);
  const [assessmentComplete, setAssessmentComplete] = useState<boolean>(false);
  const [learningPath, setLearningPath] = useState<LearningPathResponse | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);

  const navigate = useNavigate();

  // Initialize assessment
  useEffect(() => {
    const initAssessment = async () => {
      try {
        setLoading(true);
        const id = await startAssessment(userId);
        setAssessmentId(id);
        console.log('Question tracking reset for new assessment');

        // Get first question
        const firstQuestion = await getNextQuestion(id, []);
        setCurrentQuestion(firstQuestion);
      } catch (error) {
        console.error('Error initializing assessment:', error);
        toast({
          title: 'Error',
          description: 'Failed to start assessment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      initAssessment();
    }
  }, [userId]);

  // Load next question when submitting an answer
  const loadNextQuestion = async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);
      setAnswerResult(null);
      setSelectedAnswer(null);
      setShowingFeedback(false);

      const nextQuestion = await getNextQuestion(assessmentId, history);
      
      if (!nextQuestion) {
        // No more questions - complete assessment
        completeAssessment();
        return;
      }

      setCurrentQuestion(nextQuestion);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading next question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load next question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit an answer
  const handleAnswerSubmit = async (answer: string) => {
    if (!assessmentId || !currentQuestion || showingFeedback) return;

    try {
      setSelectedAnswer(answer);
      const timeTaken = Date.now() - startTime;
      
      const result = await submitAnswer(
        assessmentId,
        currentQuestion.id,
        answer,
        timeTaken
      );

      setAnswerResult(result);
      setShowingFeedback(true);
      
      // Play sound based on result
      if (result.is_correct) {
        CORRECT_SOUND.play();
        setQuestionsCorrect(prev => prev + 1);
      } else {
        INCORRECT_SOUND.play();
      }

      setQuestionsAnswered(prev => prev + 1);
      
      // Add to history
      const historyItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: result.is_correct,
        difficulty: currentQuestion.difficulty,
      };
      
      setHistory(prev => [...prev, historyItem]);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Complete the assessment
  const completeAssessment = async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);
      const result = await finishAssessment(assessmentId);
      setLearningPath(result);
      setAssessmentComplete(true);
      
      // Play completion sound and trigger confetti
      COMPLETE_SOUND.play();
      launchConfetti();
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Launch confetti animation
  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Render question
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <div className="py-4">
          <h3 className="text-lg font-medium mb-2">Domain: {currentQuestion.domain}</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Difficulty:</span>
            <div className="flex">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-5 h-2 mx-0.5 rounded-sm ${
                    level <= currentQuestion.difficulty
                      ? 'bg-primary'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xl font-semibold mb-6">{currentQuestion.question}</p>
          
          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  selectedAnswer === key
                    ? showingFeedback
                      ? answerResult?.correct_answer === key
                        ? 'bg-green-100 border-green-500'
                        : answerResult?.is_correct === false && selectedAnswer === key
                        ? 'bg-red-100 border-red-500'
                        : 'bg-blue-100 border-blue-500'
                      : 'bg-blue-100 border-blue-500'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => handleAnswerSubmit(key)}
                disabled={showingFeedback}
              >
                <span className="font-medium mr-2">{key}.</span> {value}
              </button>
            ))}
          </div>
        </div>

        {showingFeedback && answerResult && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className={`p-3 rounded-lg mb-4 ${
              answerResult.is_correct ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <h4 className="font-medium mb-1">
                {answerResult.is_correct
                  ? 'Correct! Great job!'
                  : `Incorrect. The correct answer is ${answerResult.correct_answer}.`}
              </h4>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-1">Explanation:</h4>
              <p>{answerResult.explanation}</p>
            </div>
            
            {answerResult.extended_content && (
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium mb-1">Additional Information:</h4>
                {answerResult.extended_content.story_why && (
                  <div className="mb-2">
                    <h5 className="text-sm font-medium">Why This Matters:</h5>
                    <p className="text-sm">{answerResult.extended_content.story_why}</p>
                  </div>
                )}
                {answerResult.extended_content.implementation_how && (
                  <div className="mb-2">
                    <h5 className="text-sm font-medium">How to Implement:</h5>
                    <p className="text-sm">{answerResult.extended_content.implementation_how}</p>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              className="mt-4 w-full" 
              onClick={loadNextQuestion}
            >
              Next Question
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render assessment completion
  const renderCompletion = () => {
    if (!learningPath) return null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-lg">
            You answered {learningPath.questions_correct} out of {learningPath.questions_asked} questions correctly.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {Math.round((learningPath.questions_correct / learningPath.questions_asked) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Your Strengths & Areas for Growth</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 border-green-200 bg-green-50">
              <h4 className="font-medium mb-2">Strongest Area: {learningPath.strongest_domain}</h4>
              <p className="text-sm">
                You demonstrated strong understanding in this domain. Consider mentoring others!
              </p>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50">
              <h4 className="font-medium mb-2">Growth Area: {learningPath.weakest_domain}</h4>
              <p className="text-sm">
                Focus your learning journey on this area to improve your overall expertise.
              </p>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Your Personalized Learning Path</h3>
          <div className="space-y-4">
            {Object.entries(learningPath.domain_scores).map(([domain, score]) => (
              <div key={domain} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{domain}</h4>
                  <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  ></div>
                </div>
                {learningPath.learning_path[domain] && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-1">Recommended Resources:</h5>
                    <ul className="list-disc pl-5 text-sm">
                      {learningPath.learning_path[domain].map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-6">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline"
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={() => navigate('/learning-path')}
          >
            View Full Learning Path
          </Button>
        </div>
      </div>
    );
  };

  // Main render
  if (loading && !currentQuestion && !assessmentComplete) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3">Loading assessment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!assessmentComplete ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Adaptive Assessment</h2>
              <p className="text-gray-600">
                Questions: {questionsAnswered} | Correct: {questionsCorrect}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progress</p>
              <div className="w-32 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${Math.min((questionsAnswered / 30) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <Card className="p-6">
            {renderQuestion()}
          </Card>
        </div>
      ) : (
        <Card className="p-8">
          {renderCompletion()}
        </Card>
      )}
    </div>
  );
};

export default EnhancedAssessment;