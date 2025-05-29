import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Trophy, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { playSuccessSound, playWrongSound, playCelebrationSound } from '@/lib/soundEffects';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
}

interface GamefiedQuizProps {
  title: string;
  questions: QuizQuestion[];
  onComplete: (score: number, totalPoints: number) => void;
  onClose?: () => void;
}

export function GamefiedQuiz({ title, questions, onComplete, onClose }: GamefiedQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setShowExplanation(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const pointsEarned = currentQuestion.points || 10;

    if (isCorrect) {
      setScore(score + 1);
      setTotalPoints(totalPoints + pointsEarned);
      
      // Play success sound for correct answer and points earned
      playSuccessSound();
      
      toast({
        title: "Correct! 🎉",
        description: `You earned ${pointsEarned} points!`,
        className: "bg-green-50 border-green-200",
      });
    } else {
      // Play wrong answer sound
      playWrongSound();
      
      toast({
        title: "Not quite right",
        description: "Don't worry, keep learning!",
        variant: "destructive",
      });
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setIsComplete(true);
      onComplete(score, totalPoints);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setIsComplete(false);
    setScore(0);
    setTotalPoints(0);
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">{percentage}%</div>
            <div className="text-lg text-muted-foreground">
              {score} out of {questions.length} correct
            </div>
          </div>

          <div className="flex justify-center items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{totalPoints} Points Earned!</span>
          </div>

          <div className="space-y-2">
            {percentage >= 80 && (
              <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                Excellent Work! 🌟
              </Badge>
            )}
            {percentage >= 60 && percentage < 80 && (
              <Badge className="bg-blue-100 text-blue-800 text-base px-4 py-2">
                Good Job! 👍
              </Badge>
            )}
            {percentage < 60 && (
              <Badge className="bg-orange-100 text-orange-800 text-base px-4 py-2">
                Keep Practicing! 💪
              </Badge>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                Continue Learning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold leading-relaxed">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                    {
                      "border-primary bg-primary/5": isSelected && !showResult,
                      "border-gray-200 hover:border-gray-300": !isSelected && !showResult,
                      "border-green-500 bg-green-50": showResult && isCorrect,
                      "border-red-500 bg-red-50": showResult && isSelected && !isCorrect,
                      "border-gray-200 bg-gray-50": showResult && !isSelected && !isCorrect,
                      "cursor-not-allowed": showExplanation
                    }
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{option}</span>
                    {showResult && (
                      <div className="ml-2">
                        {isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{currentQuestion.points || 10} points</span>
          </div>
          
          <div className="flex gap-2">
            {!showExplanation ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="min-w-[120px]"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="min-w-[120px]">
                {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}