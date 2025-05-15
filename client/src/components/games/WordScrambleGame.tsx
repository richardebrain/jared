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
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  RefreshCw, 
  Sparkles, 
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
      words?: Word[];
      timeLimit?: number;
      passingScore?: number;
    };
  };
  onClose: () => void;
}

// Define word type
interface Word {
  word: string;
  hint: string;
  category?: string;
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

export default function WordScrambleGame({ game, onClose }: GameProps): React.ReactNode {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(60); // Default 60 seconds per word
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(0);
  const [words, setWords] = useState<Word[]>([]);
  const [currentScrambledWord, setCurrentScrambledWord] = useState<string>("");
  const [userGuess, setUserGuess] = useState<string>("");
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [skippedWords, setSkippedWords] = useState<number>(0);

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
        title: "Word Scramble Completed!",
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

  // Initialize game with words from configuration
  useEffect(() => {
    if (game.config?.words) {
      // Shuffle the words
      const shuffledWords = [...game.config.words].sort(() => Math.random() - 0.5);
      
      // Limit to 10 words max per game round
      const limitedWords = shuffledWords.slice(0, 10);
      setWords(limitedWords);
      setTotalRounds(limitedWords.length);
      
      // Set time limit from config if available
      if (game.config.timeLimit) {
        setTimeLimit(game.config.timeLimit);
      }
    } else {
      // Fallback words if none provided in config
      const fallbackWords: Word[] = [
        { word: "development", hint: "The process of growth and progress" },
        { word: "curriculum", hint: "Planned educational content" },
        { word: "preschool", hint: "Early childhood education setting" },
        { word: "learning", hint: "Acquiring knowledge or skills" },
        { word: "childhood", hint: "Early period of development" }
      ];
      setWords(fallbackWords);
      setTotalRounds(fallbackWords.length);
    }
  }, [game]);

  // Start game and set first word
  useEffect(() => {
    if (gameStarted && !gameOver && words.length > 0) {
      scrambleCurrentWord();
      setIsRunning(true);
    }
  }, [gameStarted, currentRound, words]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1;
          
          // Check if time limit has been reached for this round
          if (timeLimit > 0 && newTime % timeLimit === 0 && !showResult) {
            handleTimeUp();
          }
          
          return newTime;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLimit, showResult]);

  // Handle when time is up for a word
  const handleTimeUp = (): void => {
    if (showResult) return;
    
    setShowResult(true);
    setIsCorrect(false);
    setSkippedWords(prev => prev + 1);
    
    toast({
      title: "Time's Up!",
      description: `The word was: ${getCurrentWord().word}`,
      variant: "destructive",
    });
  };

  // Get current word object
  const getCurrentWord = (): Word => {
    return words[currentRound];
  };

  // Scramble the current word
  const scrambleCurrentWord = (): void => {
    const currentWord = getCurrentWord().word;
    let scrambled = currentWord.split('').sort(() => Math.random() - 0.5).join('');
    
    // Make sure the scrambled word is different from original
    while (scrambled === currentWord) {
      scrambled = currentWord.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    setCurrentScrambledWord(scrambled);
    setUserGuess("");
    setUsedHint(false);
    setRoundScore(10); // Starting score for this round
  };

  // Handle input change
  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!showResult) {
      setUserGuess(e.target.value);
    }
  };

  // Submit guess
  const submitGuess = (): void => {
    if (showResult) return;
    
    const currentWord = getCurrentWord().word;
    const isGuessCorrect = userGuess.toLowerCase().trim() === currentWord.toLowerCase();
    
    setIsCorrect(isGuessCorrect);
    setShowResult(true);
    
    if (isGuessCorrect) {
      // Add score based on time used and whether hint was used
      const earnedPoints = usedHint ? Math.floor(roundScore / 2) : roundScore;
      setGameScore(prev => prev + earnedPoints);
      
      // Show confetti for correct answer
      const correctAnswerConfettiOptions: ConfettiOptions = {
        particleCount: 50,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39']
      };
      confetti(correctAnswerConfettiOptions);
    }
  };

  // Use hint - reveal first and last letter
  const useHint = (): void => {
    if (showResult || usedHint) return;
    
    const currentWord = getCurrentWord().word;
    const firstLetter = currentWord.charAt(0);
    const lastLetter = currentWord.charAt(currentWord.length - 1);
    
    toast({
      title: "Hint Used",
      description: `The word starts with "${firstLetter}" and ends with "${lastLetter}"`,
    });
    
    setUsedHint(true);
    // Reduce potential score when hint is used
    setRoundScore(Math.max(5, roundScore - 5));
  };

  // Scramble the word again
  const rescrambleWord = (): void => {
    if (showResult) return;
    
    scrambleCurrentWord();
    // Small score reduction for rescrambling
    setRoundScore(Math.max(5, roundScore - 2));
  };

  // Skip current word
  const skipWord = (): void => {
    if (showResult) return;
    
    setShowResult(true);
    setIsCorrect(false);
    setSkippedWords(prev => prev + 1);
  };

  // Go to next word or end game
  const nextWord = (): void => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound(prev => prev + 1);
      setShowResult(false);
    } else {
      endGame();
    }
  };

  // Start the game
  const startGame = (): void => {
    if (words.length === 0) {
      toast({
        title: "Error",
        description: "No words available for this game",
        variant: "destructive",
      });
      return;
    }
    
    setGameStarted(true);
    setCurrentRound(0);
    setGameScore(0);
    setTimer(0);
    setGameOver(false);
    setSkippedWords(0);
  };

  // End the game and show results
  const endGame = (): void => {
    setIsRunning(false);
    setGameOver(true);
    
    // Calculate score percentage based on words solved vs total
    const wordsAttempted = totalRounds - skippedWords;
    const percentSolved = Math.round((wordsAttempted / totalRounds) * 100);
    
    // Calculate points based on score and game value
    const basePoints = game.pointsValue;
    const earnedPoints = Math.max(1, Math.round((gameScore / (totalRounds * 10)) * basePoints));
    
    // Show confetti celebration
    if (percentSolved >= 60) {
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
      score: percentSolved,
      timeTaken: timer,
      pointsEarned: earnedPoints
    };
    submitCompletionMutation.mutate(completionData);
  };

  // Reset game to start over
  const resetGame = (): void => {
    setGameStarted(false);
    setGameOver(false);
    setCurrentRound(0);
    setGameScore(0);
    setTimer(0);
    setSkippedWords(0);
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
    return ((currentRound + 1) / totalRounds) * 100;
  };

  // Calculate remaining time percentage
  const calculateTimePercentage = (): number => {
    if (timeLimit <= 0) return 100;
    const currentTimeInRound = timer % timeLimit;
    return 100 - Math.min(100, Math.round((currentTimeInRound / timeLimit) * 100));
  };

  // Format countdown timer
  const formatCountdown = (): string => {
    if (timeLimit <= 0) return "--:--";
    const currentTimeInRound = timer % timeLimit;
    const remaining = timeLimit - currentTimeInRound;
    return `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
  };

  // Render game instructions
  const renderInstructions = (): React.ReactNode => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="text-primary" />
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
            <li>You'll see a scrambled early childhood education term</li>
            <li>Try to unscramble the word before the timer runs out</li>
            <li>Use hints if you get stuck, but they'll reduce your score</li>
            <li>Complete all {totalRounds} rounds to finish the game</li>
            <li>Earn points based on speed and accuracy</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Details:</h3>
            <ul className="space-y-1 text-sm">
              <li>Category: {game.category}</li>
              <li>Words: {totalRounds}</li>
              <li>Difficulty: {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}</li>
              <li>Time Limit: {timeLimit > 0 ? `${Math.floor(timeLimit / 60)}:${(timeLimit % 60).toString().padStart(2, '0')} per word` : 'None'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Scoring:</h3>
            <ul className="space-y-1 text-sm">
              <li>Correct Answer: Up to 10 points</li>
              <li>Using Hint: -50% points</li>
              <li>Skipping Words: 0 points</li>
              <li>Reshuffling: -2 points</li>
            </ul>
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

  // Render game play area
  const renderGame = (): React.ReactNode => {
    const currentWord = getCurrentWord();

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">Word Scramble</CardTitle>
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
              <span>Word {currentRound + 1} of {totalRounds}</span>
              <span>{Math.round(calculateProgress())}% complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {timeLimit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Time Remaining</span>
                <span>{formatCountdown()}</span>
              </div>
              <Progress value={calculateTimePercentage()} className="h-2" />
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-xs">
                Category: {currentWord.category || game.category}
              </Badge>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={rescrambleWord}
                  disabled={showResult}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reshuffle
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={useHint}
                  disabled={showResult || usedHint}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Hint
                </Button>
              </div>
            </div>
            
            <div className="text-center py-8 px-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Unscramble this word:</h3>
              <p className="text-3xl font-bold tracking-wide">{currentScrambledWord.toUpperCase()}</p>
              {usedHint && (
                <p className="text-sm text-primary mt-2">
                  Hint: Starts with "{currentWord.word.charAt(0)}" and ends with "{currentWord.word.charAt(currentWord.word.length - 1)}"
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Hint: {currentWord.hint}</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your answer..."
                  value={userGuess}
                  onChange={handleGuessChange}
                  className="flex-grow"
                  disabled={showResult}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                />
                <Button 
                  onClick={submitGuess} 
                  disabled={userGuess.trim() === '' || showResult}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
          
          {showResult && (
            <div className={`p-4 rounded-md mt-4 ${isCorrect ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}>
              <div className="flex flex-col items-center text-center">
                <p className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                  {isCorrect ? 'Correct!' : 'Sorry, that\'s not right.'}
                </p>
                <p className="mt-1">
                  The correct word is: <span className="font-bold">{currentWord.word.toUpperCase()}</span>
                </p>
                {isCorrect && (
                  <Badge className="mt-2 bg-primary/20 text-primary">
                    {usedHint ? `+${Math.floor(roundScore / 2)} points` : `+${roundScore} points`}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {!showResult ? (
            <Button 
              variant="outline" 
              onClick={skipWord} 
              className="w-full"
            >
              Skip Word
            </Button>
          ) : (
            <Button onClick={nextWord} className="w-full">
              {currentRound < totalRounds - 1 ? 'Next Word' : 'See Results'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Render game results
  const renderResults = (): React.ReactNode => {
    const wordsAttempted = totalRounds - skippedWords;
    const percentCompleted = Math.round((wordsAttempted / totalRounds) * 100);
    const pointsPerWord = 10;
    const maxPossiblePoints = totalRounds * pointsPerWord;
    const scorePercentage = Math.round((gameScore / maxPossiblePoints) * 100);
    const earnedPoints = Math.max(1, Math.round((gameScore / maxPossiblePoints) * game.pointsValue));
    
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className={scorePercentage >= 60 ? "text-yellow-500" : "text-muted-foreground"} />
            Word Scramble Results
          </CardTitle>
          <CardDescription>
            {scorePercentage >= 60 ? 
              "Great job! Your vocabulary skills are impressive." : 
              "Game completed. You can try again to improve your vocabulary skills."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Words Solved</p>
              <p className="text-3xl font-bold">{percentCompleted}%</p>
              <p className="text-xs mt-1">
                {wordsAttempted} of {totalRounds} words
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
              <p className="text-3xl font-bold">{earnedPoints}</p>
              <p className="text-xs mt-1">
                {gameScore} of {maxPossiblePoints} game points
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Your Performance</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{wordsAttempted}</p>
                <p className="text-xs text-muted-foreground">Words Solved</p>
              </div>
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{skippedWords}</p>
                <p className="text-xs text-muted-foreground">Words Skipped</p>
              </div>
              <div className="bg-muted/50 p-2 rounded-md text-center">
                <p className="text-sm font-medium">{formatTime(timer)}</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="font-medium">Game Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p><span className="text-muted-foreground">Category:</span> {game.category}</p>
                <p><span className="text-muted-foreground">Game Type:</span> Word Scramble</p>
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
    return renderGame();
  } else {
    return renderResults();
  }
}