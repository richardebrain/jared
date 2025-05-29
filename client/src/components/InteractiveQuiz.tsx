import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface InteractiveQuizProps {
  title: string;
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

function InteractiveQuiz({ title, questions, onComplete }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setShowExplanation(true);

    // Auto-advance after showing explanation
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } else {
        // Quiz complete
        const correctCount = newAnswers.reduce((count, answer, index) => {
          return count + (answer === questions[index].correctAnswer ? 1 : 0);
        }, 0);
        
        const score = Math.round((correctCount / questions.length) * 100);
        setIsComplete(true);
        onComplete(score);
        
        toast({
          title: "Quiz Complete!",
          description: `You scored ${score}% (${correctCount}/${questions.length} correct)`,
        });
      }
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isComplete) {
    const correctCount = answers.reduce((count, answer, index) => {
      return count + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-6 w-6" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <div className="text-gray-700">
              You answered {correctCount} out of {questions.length} questions correctly.
            </div>
            <div className="text-sm text-gray-600">
              Points earned: {Math.max(1, Math.floor(score / 10))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">{title}</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation;
              
              let buttonClass = "w-full text-left p-4 border rounded-lg transition-colors ";
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += "border-green-500 bg-green-50 text-green-800";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                }
              } else if (isSelected) {
                buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
              } else {
                buttonClass += "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={buttonClass}
                  disabled={showExplanation}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
            <p className="text-blue-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {!showExplanation && (
          <Button 
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {showExplanation && currentQuestionIndex < questions.length - 1 && (
          <div className="text-center text-sm text-gray-600">
            Next question in 3 seconds...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractiveQuiz;