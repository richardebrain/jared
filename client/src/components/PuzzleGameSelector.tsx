import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Grid3X3, Brain, Play, ArrowLeft, Coins } from 'lucide-react';
import WordSearchGame from './games/WordSearchGame';
import CrosswordGame from './games/CrosswordGame';
import EnhancedMemoryMatch from './games/EnhancedMemoryMatch';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

type GameType = 'wordsearch' | 'crossword' | 'memory' | null;

export default function PuzzleGameSelector() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const { toast } = useToast();

  // Get current user data to check points
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const handleGameComplete = () => {
    // Game completion is handled by individual games
  };

  const handleStartGame = async (gameType: GameType) => {
    if (!user) return;
    
    // Check if user has enough points
    if (((user as any).points || 0) < 1) {
      toast({
        title: "Not enough points",
        description: "You need at least 1 point to play puzzle games. Complete training modules to earn points.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct 1 point to start the game
      await apiRequest('/api/award-points', {
        method: 'POST',
        data: {
          points: -1,
          source: 'puzzle_game_cost',
          description: 'Puzzle game entry fee'
        }
      });

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      setActiveGame(gameType);
      
      toast({
        title: "Game Started!",
        description: "1 point deducted. Good luck!",
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: "Error",
        description: "Could not start the game. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePointsEarned = async (points: number) => {
    setTotalPointsEarned(prev => prev + points);
    
    try {
      // Award points to user account
      await apiRequest('/api/award-points', {
        method: 'POST',
        data: {
          points,
          source: 'puzzle_game',
          description: 'Educational puzzle game completion'
        }
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  const handleBackToSelector = () => {
    setActiveGame(null);
  };

  if (activeGame) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={handleBackToSelector}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        
        {activeGame === 'wordsearch' && (
          <WordSearchGame 
            onComplete={handleGameComplete}
            onPointsEarned={handlePointsEarned}
          />
        )}
        
        {activeGame === 'crossword' && (
          <CrosswordGame 
            onComplete={handleGameComplete}
            onPointsEarned={handlePointsEarned}
          />
        )}
        
        {activeGame === 'memory' && (
          <EnhancedMemoryMatch 
            onComplete={handleGameComplete}
            onPointsEarned={handlePointsEarned}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Word Search */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-800">ECE Word Search</CardTitle>
                <CardDescription className="text-purple-600">
                  Find hidden terms
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-500 text-white">Puzzle</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Word Search Grid Visual */}
          <div className="bg-white p-4 rounded-lg border-2 border-purple-100 mb-4">
            <div className="grid grid-cols-8 gap-1 text-xs font-mono">
              {['S','A','F','E','T','Y','M','N',
                'C','D','A','R','E','L','A','O',
                'H','E','A','L','T','H','G','I',
                'I','V','E','L','O','P','M','E',
                'L','E','A','R','N','I','N','G',
                'D','L','S','C','A','F','F','O',
                'R','O','U','T','I','N','E','S',
                'E','P','L','A','Y','B','A','S'].map((letter, i) => (
                <div key={i} className={`w-6 h-6 flex items-center justify-center text-purple-700 font-bold ${
                  [0,1,2,3,4,5].includes(i) ? 'bg-purple-200 rounded' : 
                  [16,17,18,19,20,21].includes(i) ? 'bg-purple-200 rounded' : 
                  'bg-gray-50'
                }`}>
                  {letter}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-purple-600 mb-4 text-sm">
              Search for CDA competency terms in challenging word puzzles
            </p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleStartGame('wordsearch')}
              disabled={!user || ((user as any).points || 0) < 1}
            >
              <Coins className="h-4 w-4 mr-2" />
              Play (1 point)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Crossword */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Grid3X3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-800">Teaching Crossword</CardTitle>
                <CardDescription className="text-blue-600">
                  Test your knowledge
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500 text-white">Puzzle</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Crossword Grid Visual */}
          <div className="bg-white p-4 rounded-lg border-2 border-blue-100 mb-4">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 49}, (_, i) => {
                const isBlack = [0,1,2,4,5,6,7,8,9,13,20,27,34,35,36,40,41,42,43,44,45,46,47,48].includes(i);
                const hasNumber = [3,10,14,17,21,28,31,37,39].includes(i);
                const number = hasNumber ? ['1','2','3','4','5','6','7','8','9'][Math.floor(Math.random() * 9)] : '';
                return (
                  <div key={i} className={`w-6 h-6 border ${
                    isBlack ? 'bg-gray-800' : 'bg-white border-gray-300'
                  } flex items-center justify-center text-xs font-bold text-blue-700`}>
                    {hasNumber && <span className="text-[8px]">{number}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center">
            <p className="text-blue-600 mb-4 text-sm">
              Solve clues related to child development and teaching strategies
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleStartGame('crossword')}
              disabled={!user || ((user as any).points || 0) < 1}
            >
              <Coins className="h-4 w-4 mr-2" />
              Play (1 point)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Memory Match */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-800">Memory Match</CardTitle>
                <CardDescription className="text-green-600">
                  Match concepts
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">Puzzle</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Memory Match Visual */}
          <div className="bg-white p-4 rounded-lg border-2 border-green-100 mb-4">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({length: 16}, (_, i) => {
                const isFlipped = [2,5,8,11].includes(i);
                const symbols = ['🎓','📚','❤️','🎯'];
                const symbol = isFlipped ? symbols[i % 4] : '?';
                return (
                  <div key={i} className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold ${
                    isFlipped ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}>
                    {symbol}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center">
            <p className="text-green-600 mb-4 text-sm">
              Improve memory while learning developmental milestones
            </p>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleStartGame('memory')}
              disabled={!user || ((user as any).points || 0) < 1}
            >
              <Coins className="h-4 w-4 mr-2" />
              Play (1 point)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}