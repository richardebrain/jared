import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AssessmentQuestion, fetchQuestions, getQuestionsByDifficulty } from '../utils/questionLoader';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface EnhancedAIAssessmentProps {
  teacherId: number;
  teacherName: string;
  onComplete: (results: AssessmentResult) => void;
}

interface AssessmentResult {
  teacherId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  domainStrengths: Record<string, number>;
  domainWeaknesses: Record<string, number>;
  difficulty: number;
  pointsEarned: number;
  timeTaken: number;
  completedAt: Date;
}

export const EnhancedAIAssessment: React.FC<EnhancedAIAssessmentProps> = ({ 
  teacherId, 
  teacherName,
  onComplete 
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [domainResults, setDomainResults] = useState<Record<string, { correct: number, total: number }>>({});
  const [remainingQuestions, setRemainingQuestions] = useState(10);
  const { toast } = useToast();

  // Load questions based on difficulty
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const allQuestions = await getQuestionsByDifficulty(currentDifficulty);
        
        // If no questions are available for this difficulty, try to load from backup
        if (allQuestions.length === 0) {
          const backup = await fetchQuestions();
          setQuestions(backup.filter(q => q.difficulty === currentDifficulty).slice(0, 10));
        } else {
          // Shuffle and limit to 10 questions per difficulty level
          setQuestions(allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assessment questions. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    loadQuestions();
  }, [currentDifficulty, toast]);

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    
    // Update domain results
    const domain = currentQuestion.domain;
    setDomainResults(prev => {
      const domainData = prev[domain] || { correct: 0, total: 0 };
      return {
        ...prev,
        [domain]: {
          correct: isAnswerCorrect ? domainData.correct + 1 : domainData.correct,
          total: domainData.total + 1
        }
      };
    });
    
    // Update correct answer count
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setTotalPoints(prev => prev + currentQuestion.pointValue);
      
      // Play confetti for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    setAnsweredQuestions(prev => prev + 1);
    setShowFeedback(true);
    setRemainingQuestions(prev => prev - 1);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    
    // If we've reached the end of current questions set
    if (currentQuestionIndex >= questions.length - 1) {
      // If we've completed level 3, or if performance is poor, finish the assessment
      if (currentDifficulty === 3 || correctAnswers < answeredQuestions * 0.6) {
        completeAssessment();
      } else {
        // Move to next difficulty level
        setCurrentDifficulty(prev => prev + 1);
        setCurrentQuestionIndex(0);
        
        toast({
          title: 'Level Up!',
          description: `Great job! Moving to difficulty level ${currentDifficulty + 1}`,
          variant: 'default',
        });
      }
    } else {
      // Move to next question in current set
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Complete the assessment and process results
  const completeAssessment = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds
    
    // Calculate domain strengths and weaknesses
    const domainStrengths: Record<string, number> = {};
    const domainWeaknesses: Record<string, number> = {};
    
    Object.entries(domainResults).forEach(([domain, data]) => {
      const percentage = (data.correct / data.total) * 100;
      if (percentage >= 70) {
        domainStrengths[domain] = percentage;
      } else {
        domainWeaknesses[domain] = percentage;
      }
    });
    
    const results: AssessmentResult = {
      teacherId,
      score: Math.round((correctAnswers / answeredQuestions) * 100),
      totalQuestions: answeredQuestions,
      correctAnswers,
      domainStrengths,
      domainWeaknesses,
      difficulty: currentDifficulty,
      pointsEarned: totalPoints,
      timeTaken,
      completedAt: new Date()
    };
    
    // Show celebratory confetti for completion
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6 }
    });
    
    // Save results to local storage for persistence
    const savedAssessments = localStorage.getItem('assessmentResults');
    const assessmentHistory = savedAssessments ? JSON.parse(savedAssessments) : [];
    localStorage.setItem('assessmentResults', JSON.stringify([...assessmentHistory, results]));
    
    // Call the onComplete callback with the results
    onComplete(results);
  };

  // Generate encouragement message based on performance
  const getEncouragementMessage = () => {
    const percentage = (correctAnswers / answeredQuestions) * 100;
    
    if (percentage >= 90) return `Amazing work, ${teacherName}! You're showing master teacher knowledge!`;
    if (percentage >= 80) return `Great job, ${teacherName}! You're on your way to becoming a mentor teacher!`;
    if (percentage >= 70) return `Good progress, ${teacherName}! Keep building your knowledge!`;
    if (percentage >= 60) return `You're doing well, ${teacherName}. Keep learning and growing!`;
    return `You're on your way, ${teacherName}. Every question helps you improve!`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Loading Assessment...</CardTitle>
          <CardDescription className="text-center">
            Preparing your personalized assessment experience
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Assessment Unavailable</CardTitle>
          <CardDescription className="text-center">
            We couldn't load the assessment questions. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-center text-2xl">Enhanced AI Assessment</CardTitle>
        <CardDescription className="text-center text-white/90">
          Level {currentDifficulty} • {remainingQuestions} questions remaining
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Progress indicators */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{answeredQuestions} of {answeredQuestions + remainingQuestions} questions</span>
          </div>
          <Progress value={(answeredQuestions / (answeredQuestions + remainingQuestions)) * 100} />
        </div>
        
        {/* Points and difficulty indicators */}
        <div className="flex justify-between mb-6">
          <div className="bg-blue-100 rounded-lg p-2 text-center w-32">
            <p className="text-xs text-blue-800">Difficulty</p>
            <p className="font-bold text-blue-900">{['Beginner', 'Intermediate', 'Advanced'][currentDifficulty - 1]}</p>
          </div>
          
          <div className="bg-green-100 rounded-lg p-2 text-center w-32">
            <p className="text-xs text-green-800">Points Earned</p>
            <p className="font-bold text-green-900">{totalPoints}</p>
          </div>
        </div>
        
        {/* Actual question */}
        <div className="py-4">
          <h3 className="text-lg font-bold mb-4">
            Question {answeredQuestions + 1}: {currentQuestion.question}
          </h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`} 
                  disabled={showFeedback}
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className={`flex-1 cursor-pointer ${
                    showFeedback && option === currentQuestion.correctAnswer 
                      ? 'text-green-600 font-bold' 
                      : showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer
                        ? 'text-red-600 line-through' 
                        : ''
                  }`}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Feedback section */}
        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <h4 className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            <p className="mt-1">
              {currentQuestion.explanation || 
                (isCorrect 
                  ? 'Great job on this question!' 
                  : `The correct answer is: ${currentQuestion.correctAnswer}`
                )
              }
            </p>
            <p className="mt-2 font-semibold">
              {isCorrect 
                ? `+${currentQuestion.pointValue} points!` 
                : "Keep learning - you will get it next time!"}
            </p>
          </div>
        )}
        
        {/* Encouragement message */}
        {answeredQuestions > 0 && (
          <div className="mt-6 text-center text-blue-700 font-medium">
            {getEncouragementMessage()}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between p-6 bg-slate-50 rounded-b-lg">
        <div className="text-sm text-slate-500">
          Domain: <span className="font-medium">{currentQuestion.domain}</span>
        </div>
        
        {showFeedback ? (
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex >= questions.length - 1 && (currentDifficulty === 3 || correctAnswers < answeredQuestions * 0.6)
              ? 'Complete Assessment'
              : currentQuestionIndex >= questions.length - 1
                ? 'Next Level'
                : 'Next Question'
            }
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedAnswer}
          >
            Submit Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EnhancedAIAssessment;