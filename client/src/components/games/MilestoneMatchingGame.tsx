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
import { Brain, Clock, ChevronRight, RotateCcw, CheckCircle, Timer, Trophy } from "lucide-react";
import confetti, { ConfettiOptions } from "canvas-confetti";

// Define milestone types for game data
interface Milestone {
  id: string;
  age: string;
  description: string;
  category: string;
}

// Available categories with colors
const categories = [
  { id: "motor", name: "Motor Skills", color: "bg-blue-100 border-blue-300 text-blue-700" },
  { id: "cognitive", name: "Cognitive", color: "bg-purple-100 border-purple-300 text-purple-700" },
  { id: "language", name: "Language", color: "bg-green-100 border-green-300 text-green-700" },
  { id: "social", name: "Social/Emotional", color: "bg-orange-100 border-orange-300 text-orange-700" }
];

// Child development milestones by age (0-5 years)
const milestones: Milestone[] = [
  // 0-12 months
  { id: "m1", age: "0-12 months", description: "Rolls over from back to stomach", category: "motor" },
  { id: "m2", age: "0-12 months", description: "Sits without support", category: "motor" },
  { id: "m3", age: "0-12 months", description: "Crawls or scoots on belly", category: "motor" },
  { id: "m4", age: "0-12 months", description: "Pulls to stand", category: "motor" },
  { id: "c1", age: "0-12 months", description: "Follows moving objects with eyes", category: "cognitive" },
  { id: "c2", age: "0-12 months", description: "Explores objects with hands and mouth", category: "cognitive" },
  { id: "c3", age: "0-12 months", description: "Finds partially hidden objects", category: "cognitive" },
  { id: "l1", age: "0-12 months", description: "Coos and babbles", category: "language" },
  { id: "l2", age: "0-12 months", description: "Responds to name", category: "language" },
  { id: "l3", age: "0-12 months", description: "Says 'mama' and 'dada'", category: "language" },
  { id: "s1", age: "0-12 months", description: "Smiles socially", category: "social" },
  { id: "s2", age: "0-12 months", description: "Shows separation anxiety", category: "social" },

  // 1-2 years
  { id: "m5", age: "1-2 years", description: "Walks without help", category: "motor" },
  { id: "m6", age: "1-2 years", description: "Climbs on furniture", category: "motor" },
  { id: "m7", age: "1-2 years", description: "Scribbles with crayon or pencil", category: "motor" },
  { id: "c4", age: "1-2 years", description: "Points to body parts when asked", category: "cognitive" },
  { id: "c5", age: "1-2 years", description: "Follows simple 1-step directions", category: "cognitive" },
  { id: "c6", age: "1-2 years", description: "Sorts objects by shape or color", category: "cognitive" },
  { id: "l4", age: "1-2 years", description: "Uses 10-50 words", category: "language" },
  { id: "l5", age: "1-2 years", description: "Combines two words", category: "language" },
  { id: "s3", age: "1-2 years", description: "Imitates others' behaviors", category: "social" },
  { id: "s4", age: "1-2 years", description: "Shows increasing independence", category: "social" },
  
  // 2-3 years
  { id: "m8", age: "2-3 years", description: "Runs with coordination", category: "motor" },
  { id: "m9", age: "2-3 years", description: "Kicks and throws ball", category: "motor" },
  { id: "m10", age: "2-3 years", description: "Turns pages of book one at a time", category: "motor" },
  { id: "c7", age: "2-3 years", description: "Completes simple puzzles", category: "cognitive" },
  { id: "c8", age: "2-3 years", description: "Engages in pretend play", category: "cognitive" },
  { id: "c9", age: "2-3 years", description: "Understands concept of 'two'", category: "cognitive" },
  { id: "l6", age: "2-3 years", description: "Uses sentences of 3-4 words", category: "language" },
  { id: "l7", age: "2-3 years", description: "Follows 2-step directions", category: "language" },
  { id: "s5", age: "2-3 years", description: "Shows concern for crying friend", category: "social" },
  { id: "s6", age: "2-3 years", description: "Takes turns with assistance", category: "social" },
  
  // 3-4 years
  { id: "m11", age: "3-4 years", description: "Hops on one foot", category: "motor" },
  { id: "m12", age: "3-4 years", description: "Uses scissors to cut paper", category: "motor" },
  { id: "m13", age: "3-4 years", description: "Draws circles and squares", category: "motor" },
  { id: "c10", age: "3-4 years", description: "Counts to 10", category: "cognitive" },
  { id: "c11", age: "3-4 years", description: "Names some colors and numbers", category: "cognitive" },
  { id: "c12", age: "3-4 years", description: "Follows 3-step commands", category: "cognitive" },
  { id: "l8", age: "3-4 years", description: "Uses pronouns correctly", category: "language" },
  { id: "l9", age: "3-4 years", description: "Asks 'why' questions", category: "language" },
  { id: "s7", age: "3-4 years", description: "Plays cooperatively with others", category: "social" },
  { id: "s8", age: "3-4 years", description: "Expresses a wide range of emotions", category: "social" },
  
  // 4-5 years
  { id: "m14", age: "4-5 years", description: "Stands on one foot for 10 seconds", category: "motor" },
  { id: "m15", age: "4-5 years", description: "Uses fork and spoon competently", category: "motor" },
  { id: "m16", age: "4-5 years", description: "Copies simple shapes and letters", category: "motor" },
  { id: "c13", age: "4-5 years", description: "Understands concept of time", category: "cognitive" },
  { id: "c14", age: "4-5 years", description: "Names four or more colors", category: "cognitive" },
  { id: "c15", age: "4-5 years", description: "Counts 10 or more objects", category: "cognitive" },
  { id: "l10", age: "4-5 years", description: "Speaks in complete sentences", category: "language" },
  { id: "l11", age: "4-5 years", description: "Tells simple stories", category: "language" },
  { id: "s9", age: "4-5 years", description: "Shows more independence", category: "social" },
  { id: "s10", age: "4-5 years", description: "Follows rules and takes turns", category: "social" }
];

interface GameProps {
  game: {
    id: number;
    title: string;
    description: string;
    type: string;
    category: string;
    difficulty: string;
    pointsValue: number;
    timeLimit?: number;
  };
  onClose: () => void;
}

export default function MilestoneMatchingGame({ game, onClose }: GameProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds] = useState<number>(10); // 10 rounds per game
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(0);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Define the completion data type
  interface GameCompletionData {
    gameId: number;
    score: number;
    timeTaken: number;
    pointsEarned: number;
  }
  
  // Define the game completion response type
  interface GameCompletion {
    id: number;
    gameId: number;
    userId: number;
    score: number;
    pointsEarned: number;
    completedAt: string | Date;
    timeTaken?: number;
  }

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
        title: "Game Completed!",
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

  // Generate a random set of milestones for the game
  useEffect(() => {
    if (gameStarted && !gameOver) {
      generateRound();
      // Start timer
      setIsRunning(true);
      setStartTime(Date.now());
    }
  }, [gameStarted, currentRound]);

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

  // Generate a new round with 1 milestone and 4 age options
  const generateRound = (): void => {
    // Choose a random milestone
    const randomIndex = Math.floor(Math.random() * milestones.length);
    const milestone = milestones[randomIndex];
    setCurrentMilestone(milestone);
    
    // Create options including the correct age and 3 incorrect ones
    const uniqueAges = Array.from(new Set(milestones.map(m => m.age)));
    const wrongAges = uniqueAges.filter(age => age !== milestone.age);
    
    // Shuffle and take 3 wrong ages
    const shuffledWrongAges = wrongAges.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Combine with correct age and shuffle
    const allOptions = [milestone.age, ...shuffledWrongAges].sort(() => Math.random() - 0.5);
    
    setOptions(allOptions);
    setSelectedOption(null);
    setShowResult(false);
  };

  // Handle selecting an age option
  const handleSelectOption = (option: string): void => {
    setSelectedOption(option);
  };

  // Submit answer and check if correct
  const submitAnswer = (): void => {
    if (!selectedOption || !currentMilestone) return;
    
    const correct = selectedOption === currentMilestone.age;
    setIsCorrect(correct);
    setShowResult(true);
    
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

  // Go to next round or end game
  const nextRound = (): void => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound(prev => prev + 1);
    } else {
      endGame();
    }
  };

  // Start the game
  const startGame = (): void => {
    setGameStarted(true);
    setCurrentRound(0);
    setGameScore(0);
    setTimer(0);
    setGameOver(false);
  };

  // End the game and show results
  const endGame = (): void => {
    setIsRunning(false);
    setGameOver(true);
    
    // Calculate score percentage
    const scorePercentage = Math.round((gameScore / totalRounds) * 100);
    
    // Calculate points based on score
    const basePoints = game.pointsValue;
    const earnedPoints = Math.round((scorePercentage / 100) * basePoints);
    
    // Show confetti celebration
    const gameCompletionConfettiOptions: ConfettiOptions = {
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    };
    confetti(gameCompletionConfettiOptions);
    
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
    setCurrentRound(0);
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

  // Render game instructions
  const renderInstructions = (): React.ReactNode => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="text-primary" />
          Child Development Milestone Matching
        </CardTitle>
        <CardDescription>
          Match each developmental milestone with the correct age range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <h3 className="font-medium mb-2">How to Play:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>You'll see a child development milestone</li>
            <li>Select the age range when this milestone typically occurs</li>
            <li>Complete {totalRounds} rounds to finish the game</li>
            <li>Earn points based on your accuracy</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Age Ranges:</h3>
            <ul className="space-y-1">
              <li>0-12 months</li>
              <li>1-2 years</li>
              <li>2-3 years</li>
              <li>3-4 years</li>
              <li>4-5 years</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Categories:</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Badge key={category.id} className={category.color}>
                  {category.name}
                </Badge>
              ))}
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

  // Render the game interface
  const renderGame = () => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">Milestone Matching</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{gameScore}/{totalRounds}</span>
            </div>
          </div>
        </div>
        <Progress value={(currentRound / totalRounds) * 100} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentMilestone && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Match this milestone to its age range:</h2>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg">"{currentMilestone.description}"</p>
                <Badge className={
                  currentMilestone.category === "motor" ? "bg-blue-100 border-blue-300 text-blue-700" :
                  currentMilestone.category === "cognitive" ? "bg-purple-100 border-purple-300 text-purple-700" :
                  currentMilestone.category === "language" ? "bg-green-100 border-green-300 text-green-700" :
                  "bg-orange-100 border-orange-300 text-orange-700"
                }>
                  {categories.find(c => c.id === currentMilestone.category)?.name}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? "default" : "outline"}
                  className={`h-auto py-3 ${
                    showResult && option === currentMilestone.age
                      ? "border-2 border-green-500"
                      : showResult && option === selectedOption && option !== currentMilestone.age
                      ? "border-2 border-red-500"
                      : ""
                  }`}
                  onClick={() => !showResult && handleSelectOption(option)}
                  disabled={showResult}
                >
                  {option}
                  {showResult && option === currentMilestone.age && (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </Button>
              ))}
            </div>
            
            {showResult && (
              <div className={`p-4 rounded-lg ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                <p className="font-medium text-center">
                  {isCorrect 
                    ? "Correct! This milestone typically appears during this age range." 
                    : `Incorrect. This milestone typically appears during the ${currentMilestone.age} age range.`}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!showResult ? (
          <Button 
            onClick={submitAnswer} 
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={nextRound} 
            className="w-full"
          >
            {currentRound < totalRounds - 1 ? "Next Milestone" : "Finish Game"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  // Render game results
  const renderGameResults = (): React.ReactNode => {
    const scorePercentage = Math.round((gameScore / totalRounds) * 100);
    const basePoints = game.pointsValue;
    const earnedPoints = Math.round((scorePercentage / 100) * basePoints);
    
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Game Complete!</CardTitle>
          <CardDescription className="text-center">
            Child Development Milestone Matching
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Trophy className="h-20 w-20 text-yellow-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-2xl font-bold">{scorePercentage}%</div>
              <div className="text-sm">({gameScore}/{totalRounds} correct)</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Time</div>
              <div className="text-2xl font-bold">{formatTime(timer)}</div>
              <div className="text-sm">{timer} seconds</div>
            </div>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Points Earned</div>
            <div className="text-3xl font-bold text-primary">{earnedPoints}</div>
            <div className="text-sm">out of {basePoints} possible points</div>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={restartGame} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          <Button onClick={onClose} className="flex-1">
            Return to Games
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="py-4">
      {!gameStarted && !gameOver && renderInstructions()}
      {gameStarted && !gameOver && renderGame()}
      {gameOver && renderGameResults()}
    </div>
  );
}