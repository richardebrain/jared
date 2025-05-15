import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Gamepad2, Trophy, Clock, Award, Brain, Zap, Timer, BarChart } from "lucide-react";
// Import the milestone matching game directly with the updated path
import MilestoneMatchingGame from "../components/games/MilestoneMatchingGame";

interface Game {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  pointsValue: number;
  timeLimit?: number;
}

interface GameCompletion {
  id: number;
  gameId: number;
  userId: number;
  score: number;
  pointsEarned: number;
  completedAt: string | Date;
  timeTaken?: number;
}

interface DailyCount {
  count: number;
  limit: number;
}

export default function GamesPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [showGameInterface, setShowGameInterface] = useState(false);

  // Fetch all available games
  const { data: games, isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  // Fetch user's daily game completions count
  const { data: dailyCompletions, isLoading: isLoadingCompletions } = useQuery<DailyCount>({
    queryKey: ["/api/game-completions/daily-count"],
    enabled: isAuthenticated,
  });
  
  // Fetch user's recent game completions
  const { data: completions, isLoading: isLoadingHistory } = useQuery<GameCompletion[]>({
    queryKey: ["/api/game-completions"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access educational games
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleStartGame = (gameId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play games",
        variant: "destructive",
      });
      return;
    }

    if (dailyCompletions && dailyCompletions.count >= dailyCompletions.limit) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily limit of 2 educational games. Please come back tomorrow!",
        variant: "destructive",
      });
      return;
    }

    setSelectedGame(gameId);
    setShowGameInterface(true);
  };

  const handleCloseGame = () => {
    setShowGameInterface(false);
    setSelectedGame(null);
  };

  const renderGameCard = (game: Game) => {
    let GameIcon = Brain;
    
    // Assign icon based on game type
    if (game.type === "milestone-matching") {
      GameIcon = Brain;
    } else if (game.type === "knowledge-quiz") {
      GameIcon = Zap;
    }
    
    return (
      <Card key={game.id} className="flex flex-col overflow-hidden border-2 hover:border-primary/50 transition-all">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Badge variant={game.difficulty === "easy" ? "outline" : game.difficulty === "medium" ? "secondary" : "default"}>
              {game.difficulty === "easy" ? "Beginner" : game.difficulty === "medium" ? "Intermediate" : "Advanced"}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy size={14} />
              <span>{game.pointsValue} pts</span>
            </div>
          </div>
          <CardTitle className="flex items-center gap-2">
            <GameIcon className="text-primary" size={20} />
            {game.title}
          </CardTitle>
          <CardDescription>{game.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-muted-foreground mb-4">
            <span className="font-medium text-primary">Category:</span> {game.category}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/40 pt-2">
          <Button onClick={() => handleStartGame(game.id)} className="w-full">
            Start Game <Gamepad2 className="ml-2" size={16} />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderGameInterface = () => {
    if (!selectedGame) return null;
    
    const game = games?.find((g: Game) => g.id === selectedGame);
    if (!game) return null;
    
    // Render the appropriate game component based on type
    if (game.type === "milestone-matching") {
      return (
        <MilestoneMatchingGame 
          game={game} 
          onClose={handleCloseGame} 
        />
      );
    }
    
    // Default fallback
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-bold mb-4">Game Not Available</h3>
        <p>The selected game type is not currently implemented.</p>
        <Button onClick={handleCloseGame} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  };

  const renderGameHistory = () => {
    if (!completions || completions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't completed any games yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {completions && completions.map((completion: GameCompletion) => {
          const game = games?.find((g: Game) => g.id === completion.gameId);
          return (
            <Card key={completion.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">{game?.title || "Game"}</CardTitle>
                  <Badge variant="outline">
                    {new Date(completion.completedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div className="flex flex-col items-center">
                    <Trophy className="h-4 w-4 text-yellow-500 mb-1" />
                    <div className="text-muted-foreground">Points</div>
                    <div className="font-medium">{completion.pointsEarned}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <BarChart className="h-4 w-4 text-blue-500 mb-1" />
                    <div className="text-muted-foreground">Score</div>
                    <div className="font-medium">{completion.score || "N/A"}%</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-green-500 mb-1" />
                    <div className="text-muted-foreground">Time</div>
                    <div className="font-medium">
                      {completion.timeTaken 
                        ? `${Math.floor(completion.timeTaken / 60)}:${(completion.timeTaken % 60).toString().padStart(2, '0')}`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Educational Games</h1>
          <p className="text-muted-foreground mt-1">
            Challenge yourself with fun educational games and earn points
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <Clock className="mr-2 h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Daily Games: {isLoadingCompletions ? "Loading..." : `${dailyCompletions?.count ?? 0}/${dailyCompletions?.limit ?? 2}`}
            </span>
          </div>
          <Progress 
            value={isLoadingCompletions ? 0 : ((dailyCompletions?.count ?? 0) / (dailyCompletions?.limit ?? 2)) * 100} 
            className="h-2 w-[150px]" 
          />
        </div>
      </div>

      {showGameInterface ? (
        renderGameInterface()
      ) : (
        <Tabs defaultValue="games">
          <TabsList>
            <TabsTrigger value="games">Available Games</TabsTrigger>
            <TabsTrigger value="history">Game History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="mt-6">
            {isLoadingGames ? (
              <div className="text-center py-10">
                <p>Loading games...</p>
              </div>
            ) : !games || games.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No games available at the moment.</p>
                <p className="text-sm mt-2">Check back later for new educational games!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(renderGameCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            {isLoadingHistory ? (
              <div className="text-center py-10">
                <p>Loading history...</p>
              </div>
            ) : (
              renderGameHistory()
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}