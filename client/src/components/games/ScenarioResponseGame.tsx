import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  LightbulbIcon, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Timer, 
  Trophy,
  ThumbsUp,
  ThumbsDown
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
      scenarios?: Scenario[];
      timeLimit?: number;
      passingScore?: number;
    };
  };
  onClose: () => void;
}

// Define scenario type
interface Scenario {
  id: number;
  situation: string;
  context?: string;
  responses: Response[];
}

// Define response type
interface Response {
  id: number;
  text: string;
  quality: "best" | "good" | "fair" | "poor";
  explanation: string;
  points: number;
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

export default function ScenarioResponseGame({ game, onClose }: GameProps): React.ReactNode {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentScenario, setCurrentScenario] = useState<number>(0);
  const [totalScenarios, setTotalScenarios] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState<number>(0);
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [responseQuality, setResponseQuality] = useState<string>("");
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

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
        title: "Scenario Game Completed!",
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

  // Initialize game with scenarios from configuration
  useEffect(() => {
    if (game.config?.scenarios) {
      // Shuffle and limit scenarios if needed
      const shuffledScenarios = [...game.config.scenarios].sort(() => Math.random() - 0.5);
      const limitedScenarios = shuffledScenarios.slice(0, 5); // Maximum 5 scenarios per game
      setScenarios(limitedScenarios);
      setTotalScenarios(limitedScenarios.length);
      
      // Calculate maximum possible score
      let maxScore = 0;
      limitedScenarios.forEach(scenario => {
        const bestResponse = scenario.responses.reduce((best, response) => {
          return response.points > best.points ? response : best;
        }, { points: 0 } as Response);
        maxScore += bestResponse.points;
      });
      setMaxPossibleScore(maxScore);
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

  // Handle selecting a response
  const handleSelectResponse = (responseId: number): void => {
    if (!showResult) {
      setSelectedResponse(responseId);
    }
  };

  // Submit response and evaluate
  const submitResponse = (): void => {
    if (selectedResponse === null || scenarios.length === 0 || currentScenario >= scenarios.length) return;
    
    const currentScenarioData = scenarios[currentScenario];
    const selectedResponseData = currentScenarioData.responses.find(r => r.id === selectedResponse);
    
    if (!selectedResponseData) return;
    
    // Set response quality and points
    setResponseQuality(selectedResponseData.quality);
    setEarnedPoints(selectedResponseData.points);
    setGameScore(prev => prev + selectedResponseData.points);
    setShowResult(true);
    
    // Show visual feedback based on quality
    if (selectedResponseData.quality === "best" || selectedResponseData.quality === "good") {
      const confettiOptions: ConfettiOptions = {
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39']
      };
      confetti(confettiOptions);
    }
  };

  // Go to next scenario or end game
  const nextScenario = (): void => {
    if (currentScenario < totalScenarios - 1) {
      setCurrentScenario(prev => prev + 1);
      setSelectedResponse(null);
      setShowResult(false);
      setResponseQuality("");
      setEarnedPoints(0);
    } else {
      endGame();
    }
  };

  // Start the game
  const startGame = (): void => {
    if (scenarios.length === 0) {
      toast({
        title: "Error",
        description: "No scenarios available for this game",
        variant: "destructive",
      });
      return;
    }
    
    setGameStarted(true);
    setCurrentScenario(0);
    setGameScore(0);
    setTimer(0);
    setGameOver(false);
    setSelectedResponse(null);
    setShowResult(false);
    setResponseQuality("");
    setEarnedPoints(0);
  };

  // End the game and show results
  const endGame = (): void => {
    setIsRunning(false);
    setGameOver(true);
    
    // Calculate score percentage
    const scorePercentage = Math.round((gameScore / maxPossibleScore) * 100);
    
    // Calculate points based on score
    const basePoints = game.pointsValue;
    const earnedGamePoints = Math.round((scorePercentage / 100) * basePoints);
    
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
      pointsEarned: earnedGamePoints
    };
    submitCompletionMutation.mutate(completionData);
  };

  // Reset game to start over
  const resetGame = (): void => {
    setGameStarted(false);
    setGameOver(false);
    setCurrentScenario(0);
    setGameScore(0);
    setTimer(0);
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
    return ((currentScenario + 1) / totalScenarios) * 100;
  };

  // Get quality badge color
  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case "best":
        return "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400";
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400";
      case "fair":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400";
      case "poor":
        return "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Get quality label text
  const getQualityLabel = (quality: string): string => {
    switch (quality) {
      case "best":
        return "Best Response";
      case "good":
        return "Good Response";
      case "fair":
        return "Fair Response";
      case "poor":
        return "Poor Response";
      default:
        return "Unknown";
    }
  };

  // Render game instructions
  const renderInstructions = (): React.ReactNode => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LightbulbIcon className="text-primary" />
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
            <li>Read each classroom scenario carefully</li>
            <li>Choose the response that you think is most appropriate</li>
            <li>Submit your answer to see feedback</li>
            <li>Complete all {totalScenarios} scenarios to finish the game</li>
            <li>Earn points based on the quality of your responses</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Details:</h3>
            <ul className="space-y-1 text-sm">
              <li>Category: {game.category}</li>
              <li>Scenarios: {totalScenarios}</li>
              <li>Difficulty: {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}</li>
              <li>Time Limit: {game.config?.timeLimit ? `${Math.floor(game.config.timeLimit / 60)}:${(game.config.timeLimit % 60).toString().padStart(2, '0')}` : 'None'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Response Ratings:</h3>
            <div className="space-y-1">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">
                Best Response: 4 points
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">
                Good Response: 3 points
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400">
                Fair Response: 1 point
              </Badge>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400">
                Poor Response: 0 points
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={startGame} className="w-full">
          Start Game
        </Button>
      </CardFooter>
    </Card>
  );

  // Render scenario
  const renderScenario = (): React.ReactNode => {
    if (scenarios.length === 0 || currentScenario >= scenarios.length) {
      return (
        <div className="text-center p-8">
          <p>No scenarios available</p>
        </div>
      );
    }

    const scenario = scenarios[currentScenario];

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
                <span className="text-sm font-medium">{gameScore} pts</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Scenario {currentScenario + 1} of {totalScenarios}</span>
              <span>{Math.round(calculateProgress())}% complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-md">
            <h3 className="text-lg font-medium mb-2">Scenario:</h3>
            <p>{scenario.situation}</p>
            {scenario.context && (
              <p className="text-sm text-muted-foreground mt-2">{scenario.context}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-3">How would you respond?</h3>
            <RadioGroup 
              value={selectedResponse?.toString() || ""}
              onValueChange={(value) => handleSelectResponse(parseInt(value))}
              className="space-y-3"
            >
              {scenario.responses.map((response) => (
                <div 
                  key={response.id}
                  className={`
                    rounded-md border p-3
                    ${!showResult ? 'hover:border-primary/50 hover:bg-primary/5' : ''}
                    ${selectedResponse === response.id && !showResult ? 'border-primary bg-primary/5' : ''}
                    ${showResult && selectedResponse === response.id ? 
                      getQualityColor(response.quality).replace('text-', 'border-') : 'border-input'}
                  `}
                >
                  <RadioGroupItem 
                    value={response.id.toString()} 
                    id={`response-${response.id}`}
                    disabled={showResult}
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={`response-${response.id}`}
                    className={`flex cursor-pointer ${showResult ? 'cursor-default' : ''}`}
                  >
                    <div className="flex-grow">
                      {response.text}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {showResult && (
            <div className={`p-4 rounded-md border ${getQualityColor(responseQuality)}`}>
              <div className="flex items-start gap-2">
                {responseQuality === "best" || responseQuality === "good" ? (
                  <ThumbsUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <ThumbsDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getQualityLabel(responseQuality)}</p>
                    <Badge variant="outline" className="ml-2">
                      {earnedPoints} points
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">
                    {scenario.responses.find(r => r.id === selectedResponse)?.explanation || ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {!showResult ? (
            <Button 
              onClick={submitResponse} 
              disabled={selectedResponse === null}
              className="w-full"
            >
              Submit Response
            </Button>
          ) : (
            <Button onClick={nextScenario} className="w-full">
              {currentScenario < totalScenarios - 1 ? 'Next Scenario' : 'See Results'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Render game results
  const renderResults = (): React.ReactNode => {
    const scorePercentage = Math.round((gameScore / maxPossibleScore) * 100);
    const isPassing = scorePercentage >= (game.config?.passingScore || 60);
    const earnedGamePoints = Math.round((scorePercentage / 100) * game.pointsValue);
    
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className={isPassing ? "text-yellow-500" : "text-muted-foreground"} />
            Game Results
          </CardTitle>
          <CardDescription>
            {isPassing ? 
              "Great job! You handled those scenarios well." : 
              "Game completed. You can review and try again to improve your responses."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Performance</p>
              <p className="text-3xl font-bold">{scorePercentage}%</p>
              <p className="text-xs mt-1">
                {isPassing ? "Good handling of situations!" : `Passing score: ${game.config?.passingScore || 60}%`}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
              <p className="text-3xl font-bold">{earnedGamePoints}</p>
              <p className="text-xs mt-1">
                {Math.round((earnedGamePoints / game.pointsValue) * 100)}% of available points
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Your Performance</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{totalScenarios}</p>
                <p className="text-xs text-muted-foreground">Scenarios</p>
              </div>
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{gameScore} / {maxPossibleScore}</p>
                <p className="text-xs text-muted-foreground">Response Points</p>
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
                <p><span className="text-muted-foreground">Game Type:</span> Scenario Response</p>
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
    return renderScenario();
  } else {
    return renderResults();
  }
}