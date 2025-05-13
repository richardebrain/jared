import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfettiExplosion from 'react-confetti-explosion';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface InteractiveQuizProps {
  question: QuizQuestion;
  onComplete?: (correct: boolean) => void;
}

export function InteractiveQuiz({ question, onComplete }: InteractiveQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleAnswerSelect = (index: number) => {
    if (hasCompletedQuiz) return;
    setSelectedAnswer(index);
  };
  
  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    setHasCompletedQuiz(true);
    
    if (correct) {
      setShowConfetti(true);
    }
    
    if (onComplete) {
      onComplete(correct);
    }
  };
  
  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setHasCompletedQuiz(false);
    setShowConfetti(false);
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-md">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          Quick Knowledge Check
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="font-medium text-lg">{question.question}</div>
          
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 border rounded-md cursor-pointer transition-all flex items-center",
                  selectedAnswer === index && !hasCompletedQuiz ? "border-primary bg-primary/5" : "",
                  hasCompletedQuiz && index === question.correctAnswer ? "border-green-500 bg-green-50" : "",
                  hasCompletedQuiz && selectedAnswer === index && index !== question.correctAnswer ? "border-red-500 bg-red-50" : "",
                  hasCompletedQuiz ? "cursor-default" : "hover:border-primary/50"
                )}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex-1">
                  {option}
                </div>
                {hasCompletedQuiz && index === question.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                )}
                {hasCompletedQuiz && selectedAnswer === index && index !== question.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          
          {showExplanation && question.explanation && (
            <div className={cn(
              "mt-4 p-3 rounded-md",
              isCorrect ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            )}>
              <div className="font-medium mb-1">
                {isCorrect ? "Correct! 🎉" : "Not quite right"}
              </div>
              <p>{question.explanation}</p>
            </div>
          )}
          
          {showConfetti && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <ConfettiExplosion particleCount={150} force={0.8} duration={2500} />
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            {!hasCompletedQuiz ? (
              <Button 
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="w-full"
              >
                Check Answer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                {isCorrect ? (
                  <div className="w-full bg-green-100 text-green-800 p-3 rounded-md flex items-center justify-center">
                    <Award className="h-5 w-5 mr-2" />
                    Well done! You got it right.
                  </div>
                ) : (
                  <Button 
                    onClick={handleTryAgain}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}