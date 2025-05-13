import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, XCircle, ArrowRight, Award, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfettiExplosion from 'react-confetti-explosion';
import { Badge } from '@/components/ui/badge';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  correctExplanation?: string;  // Specific explanation for correct answers
  incorrectExplanation?: string; // Specific explanation for incorrect answers
}

interface InteractiveQuizProps {
  questions: QuizQuestion[] | QuizQuestion;
  onComplete?: (score: number) => void;
}

export function InteractiveQuiz({ questions, onComplete }: InteractiveQuizProps) {
  // Convert single question to array for consistent handling
  const questionArray = Array.isArray(questions) ? questions : [questions];
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(questionArray.length).fill(null));
  const [showExplanations, setShowExplanations] = useState<boolean[]>(Array(questionArray.length).fill(false));
  const [isCorrectAnswers, setIsCorrectAnswers] = useState<boolean[]>(Array(questionArray.length).fill(false));
  const [completedQuestions, setCompletedQuestions] = useState<boolean[]>(Array(questionArray.length).fill(false));
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  
  const currentQuestion = questionArray[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const showExplanation = showExplanations[currentQuestionIndex];
  const isCorrect = isCorrectAnswers[currentQuestionIndex];
  const hasCompletedQuestion = completedQuestions[currentQuestionIndex];
  
  const handleAnswerSelect = (index: number) => {
    if (hasCompletedQuestion) return;
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = index;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    
    // Update the state arrays
    const newIsCorrectAnswers = [...isCorrectAnswers];
    newIsCorrectAnswers[currentQuestionIndex] = correct;
    setIsCorrectAnswers(newIsCorrectAnswers);
    
    const newShowExplanations = [...showExplanations];
    newShowExplanations[currentQuestionIndex] = true;
    setShowExplanations(newShowExplanations);
    
    const newCompletedQuestions = [...completedQuestions];
    newCompletedQuestions[currentQuestionIndex] = true;
    setCompletedQuestions(newCompletedQuestions);
    
    // Update score if answer is correct
    if (correct) {
      setScore(prevScore => prevScore + 1);
    }
    
    // Check if all questions are completed
    const allCompleted = newCompletedQuestions.every(completed => completed);
    if (allCompleted) {
      setQuizCompleted(true);
      setShowConfetti(true);
      
      // Call onComplete with final score if provided
      if (onComplete) {
        const finalScore = newIsCorrectAnswers.filter(correct => correct).length;
        onComplete(finalScore);
      }
    }
  };
  
  const handleTryAgain = () => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = null;
    setSelectedAnswers(newSelectedAnswers);
    
    const newShowExplanations = [...showExplanations];
    newShowExplanations[currentQuestionIndex] = false;
    setShowExplanations(newShowExplanations);
    
    const newCompletedQuestions = [...completedQuestions];
    newCompletedQuestions[currentQuestionIndex] = false;
    setCompletedQuestions(newCompletedQuestions);
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questionArray.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const getExplanationText = () => {
    if (isCorrect && currentQuestion.correctExplanation) {
      return currentQuestion.correctExplanation;
    } else if (!isCorrect && currentQuestion.incorrectExplanation) {
      return currentQuestion.incorrectExplanation;
    } else {
      return currentQuestion.explanation || "Let's learn more about this concept.";
    }
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-md">
      <CardHeader className="bg-muted/50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Quick Knowledge Check
          </CardTitle>
          
          {questionArray.length > 1 && (
            <Badge variant="outline" className="ml-auto">
              Question {currentQuestionIndex + 1} of {questionArray.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="font-medium text-lg">{currentQuestion.question}</div>
          
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 border rounded-md cursor-pointer transition-all flex items-center",
                  selectedAnswer === index && !hasCompletedQuestion ? "border-primary bg-primary/5" : "",
                  hasCompletedQuestion && index === currentQuestion.correctAnswer ? "border-green-500 bg-green-50" : "",
                  hasCompletedQuestion && selectedAnswer === index && index !== currentQuestion.correctAnswer ? "border-red-500 bg-red-50" : "",
                  hasCompletedQuestion ? "cursor-default" : "hover:border-primary/50"
                )}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex-1">
                  {option}
                </div>
                {hasCompletedQuestion && index === currentQuestion.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                )}
                {hasCompletedQuestion && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          
          {showExplanation && (
            <div className={cn(
              "mt-4 p-4 rounded-md",
              isCorrect ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            )}>
              <div className="font-medium flex items-center mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">Great job! 🎉</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-amber-700">Let's learn why</span>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">{getExplanationText()}</p>
                
                {!isCorrect && (
                  <p className="text-sm text-amber-700 font-medium mt-2">
                    The correct answer is: {currentQuestion.options[currentQuestion.correctAnswer]}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {showConfetti && quizCompleted && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <ConfettiExplosion particleCount={150} force={0.8} duration={2500} />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 pb-4">
        <div className="flex space-x-2 w-full">
          {questionArray.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {!hasCompletedQuestion ? (
            <Button 
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
              className="flex-grow"
            >
              Check Answer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : !isCorrect ? (
            <Button 
              onClick={handleTryAgain}
              variant="outline"
              className="flex-grow"
            >
              Try Again
            </Button>
          ) : (
            <div className="flex-grow flex items-center justify-center bg-green-100 text-green-800 p-2 rounded-md">
              <Award className="h-5 w-5 mr-2" />
              You got it right!
            </div>
          )}
          
          {questionArray.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questionArray.length - 1}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
      
      {quizCompleted && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="text-center">
            <h3 className="font-bold text-lg text-blue-700">Quiz Complete!</h3>
            <p className="text-blue-600">
              You scored {score} out of {questionArray.length}
              {score === questionArray.length ? " - Perfect!" : ""}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}