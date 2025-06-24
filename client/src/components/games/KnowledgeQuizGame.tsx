import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Timer, 
  Trophy 
} from "lucide-react";
import confetti, { ConfettiOptions } from "canvas-confetti";

// Define interface for game props
interface GameProps {
  game: {
    id: number;
    title: string;
    description: string;
    type: string;
    category: string;
    difficulty: string;
    pointsValue: number;
    config?: {
      questions?: Question[];
      timeLimit?: number;
      passingScore?: number;
    };
  };
  onClose: () => void;
}

// Define quiz question type
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Game completion data interface
interface GameCompletionData {
  gameId: number;
  score: number;
  timeTaken: number;
  pointsEarned: number;
}

// Game completion response interface
interface GameCompletion {
  id: number;
  gameId: number;
  userId: number;
  score: number;
  pointsEarned: number;
  completedAt: string | Date;
  timeTaken?: number;
}

export default function KnowledgeQuizGame({ game, onClose }: GameProps): React.ReactNode {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  // Submit game completion
  const submitCompletionMutation = useMutation({
    mutationFn: async (data: GameCompletionData) => {
      return apiRequest('/api/game-completions', {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: (data: { completion: GameCompletion }) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/game-completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/game-completions/daily-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Quiz Completed!",
        description: `You earned ${data.completion.pointsEarned} points!`,
        variant: "default",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: "Failed to submit game completion",
        variant: "destructive",
      });
      console.error("Game completion error:", error);
    }
  });

  // Initialize game with questions from configuration
  useEffect(() => {
    if (game.config?.questions) {
      // Shuffle and limit questions if needed
      const shuffledQuestions = [...game.config.questions].sort(() => Math.random() - 0.5);
      const limitedQuestions = shuffledQuestions.slice(0, 10); // Maximum 10 questions per game
      setQuestions(limitedQuestions);
      setTotalQuestions(limitedQuestions.length);
    }
  }, [game]);

  // Start game
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Start timer
      setIsRunning(true);
      setStartTime(Date.now());
    }
  }, [gameStarted]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Handle selecting an option
  const handleSelectOption = (optionIndex: number): void => {
    if (!showResult) {
      setSelectedOption(optionIndex);
    }
  };

  // Submit answer and check if correct
  const submitAnswer = (): void => {
    if (selectedOption === null || questions.length === 0) return;
    
    const currentQuestionData = questions[currentQuestion];
    const correct = selectedOption === currentQuestionData.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Mark this question as answered
    setAnsweredQuestions(prev => [...prev, currentQuestion]);
    
    // Update score
    if (correct) {
      setGameScore(prev => prev + 1);
      
      // Show a small confetti celebration for correct answers
      const correctAnswerConfettiOptions: ConfettiOptions = {
        particleCount: 50,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39']
      };
      confetti(correctAnswerConfettiOptions);
    }
  };

  // Go to next question or end game
  const nextQuestion = (): void => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      endGame();
    }
  };

  // Start the game
  const startGame = (): void => {
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "No questions available for this quiz",
        variant: "destructive",
      });
      return;
    }
    
    setGameStarted(true);
    setCurrentQuestion(0);
    setGameScore(0);
    setTimer(0);
    setGameOver(false);
    setAnsweredQuestions([]);
    setSelectedOption(null);
    setShowResult(false);
  };

  // End the game and show results
  const endGame = (): void => {
    setIsRunning(false);
    setGameOver(true);
    
    // Calculate score percentage
    const scorePercentage = Math.round((gameScore / totalQuestions) * 100);
    
    // Calculate points based on score
    const basePoints = game.pointsValue;
    const earnedPoints = Math.round((scorePercentage / 100) * basePoints);
    
    // Show confetti celebration if score is good
    if (scorePercentage >= (game.config?.passingScore || 60)) {
      const gameCompletionConfettiOptions: ConfettiOptions = {
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      };
      confetti(gameCompletionConfettiOptions);
    }
    
    // Submit completion to the server
    const completionData: GameCompletionData = {
      gameId: game.id,
      score: scorePercentage,
      timeTaken: timer,
      pointsEarned: earnedPoints
    };
    submitCompletionMutation.mutate(completionData);
  };

  // Reset game to start over
  const resetGame = (): void => {
    setGameStarted(false);
    setGameOver(false);
    setCurrentQuestion(0);
    setGameScore(0);
    setTimer(0);
    setAnsweredQuestions([]);
  };

  // Restart the current game
  const restartGame = (): void => {
    resetGame();
    startGame();
  };

  // Format timer as minutes and seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    return ((currentQuestion + 1) / totalQuestions) * 100;
  };

  // Render game instructions
  const renderInstructions = (): React.ReactNode => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-primary" />
          {game.title}
        </CardTitle>
        <CardDescription>
          {game.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <h3 className="font-medium mb-2">How to Play:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Read each question carefully</li>
            <li>Select the best answer from the options provided</li>
            <li>Submit your answer to see if you're correct</li>
            <li>Complete all {totalQuestions} questions to finish the quiz</li>
            <li>Earn points based on your accuracy</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Details:</h3>
            <ul className="space-y-1 text-sm">
              <li>Category: {game.category}</li>
              <li>Questions: {totalQuestions}</li>
              <li>Difficulty: {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}</li>
              <li>Time Limit: {game.config?.timeLimit ? `${Math.floor(game.config.timeLimit / 60)}:${(game.config.timeLimit % 60).toString().padStart(2, '0')}` : 'None'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Points:</h3>
            <div className="text-sm">
              <p>Maximum Points: {game.pointsValue}</p>
              <p>Passing Score: {game.config?.passingScore || 60}%</p>
              <div className="mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Points earned based on accuracy
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={startGame} className="w-full">
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );

  // Render question
  const renderQuestion = (): React.ReactNode => {
    if (questions.length === 0 || currentQuestion >= questions.length) {
      return (
        <div className="text-center p-8">
          <p>No questions available</p>
        </div>
      );
    }

    const question = questions[currentQuestion];

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">{game.title}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatTime(timer)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{gameScore} / {totalQuestions}</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Question {currentQuestion + 1} of {totalQuestions}</span>
              <span>{Math.round(calculateProgress())}% complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{question.question}</h3>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  className={`
                    p-3 rounded-md border cursor-pointer transition-all
                    ${selectedOption === index ? 
                      'border-primary bg-primary/5' : 
                      'border-input hover:border-primary/50 hover:bg-primary/5'}
                    ${showResult && index === question.correctAnswer ? 
                      'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                    ${showResult && selectedOption === index && index !== question.correctAnswer ? 
                      'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}
                  `}
                >
                  <div className="flex items-start gap-2">
                    <div className={`
                      rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5
                      ${selectedOption === index ? 
                        'bg-primary text-primary-foreground' : 
                        'bg-muted text-muted-foreground'}
                      ${showResult && index === question.correctAnswer ? 
                        'bg-green-500 text-white' : ''}
                      ${showResult && selectedOption === index && index !== question.correctAnswer ? 
                        'bg-red-500 text-white' : ''}
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {showResult && (
            <div className={`
              p-4 rounded-md mt-4
              ${isCorrect ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900' : 
                'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900'}
            `}>
              <div className="flex items-start gap-2">
                {isCorrect ? 
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : 
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-sm mt-1">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {!showResult ? (
            <Button 
              onClick={submitAnswer} 
              disabled={selectedOption === null}
              className="w-full"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="w-full">
              {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Render game results
  const renderResults = (): React.ReactNode => {
    const scorePercentage = Math.round((gameScore / totalQuestions) * 100);
    const isPassing = scorePercentage >= (game.config?.passingScore || 60);
    const earnedPoints = Math.round((scorePercentage / 100) * game.pointsValue);
    
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className={isPassing ? "text-yellow-500" : "text-muted-foreground"} />
            Quiz Results
          </CardTitle>
          <CardDescription>
            {isPassing ? 
              "Great job! You completed the quiz successfully." : 
              "Quiz completed. You can review and try again to improve your score."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-3xl font-bold">{scorePercentage}%</p>
              <p className="text-xs mt-1">
                {isPassing ? "Passing score achieved!" : `Passing score: ${game.config?.passingScore || 60}%`}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
              <p className="text-3xl font-bold">{earnedPoints}</p>
              <p className="text-xs mt-1">
                {Math.round((earnedPoints / game.pointsValue) * 100)}% of available points
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Your Performance</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{gameScore}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{formatTime(timer)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="font-medium">Game Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p><span className="text-muted-foreground">Category:</span> {game.category}</p>
                <p><span className="text-muted-foreground">Game Type:</span> Knowledge Quiz</p>
              </div>
              <div>
                <p><span className="text-muted-foreground">Difficulty:</span> {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}</p>
                <p><span className="text-muted-foreground">Total Points:</span> {game.pointsValue}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={restartGame} variant="default" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            Return to Games
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render the appropriate stage of the game
  if (!gameStarted) {
    return renderInstructions();
  } else if (gameStarted && !gameOver) {
    return renderQuestion();
  } else {
    return renderResults();
  }
}