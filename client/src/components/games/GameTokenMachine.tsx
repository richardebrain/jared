import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Play, 
  Trophy, 
  Star, 
  Gamepad2,
  Sparkles,
  Target,
  Heart,
  ExternalLink
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import BounceAwayBlocks from './BounceAwayBlocks';
import PacHealGame from './PacHealGameWorking';
import PreschoolDash from './PreschoolDash';
import { openGameInWindow, GameRenderer } from './GameRenderer';

interface GameTokenMachineProps {
  userPoints: number;
  onPointsUpdate: (newPoints: number) => void;
}

export default function GameTokenMachine({ userPoints, onPointsUpdate }: GameTokenMachineProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const games = [
    {
      id: 'bounce',
      title: 'Bounce-Away Blocks 2.0',
      description: 'Master CDA competencies through brick-breaking adventure',
      icon: Trophy,
      color: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-300',
      levels: 5,
      maxPoints: 10,
      features: ['CDA Curriculum', 'Flash Cards', 'Power-ups', 'Level Progression']
    },
    {
      id: 'pacheal',
      title: 'Pac-Heal Adventure',
      description: 'Learn emotional regulation and classroom management',
      icon: Heart,
      color: 'from-blue-500 to-purple-600',
      borderColor: 'border-blue-300',
      levels: 3,
      maxPoints: 6,
      features: ['Emotional Skills', 'Self-Regulation', 'Mindfulness', 'Calm Techniques']
    },
    {
      id: 'dash',
      title: 'Preschool Dash',
      description: 'Sprint through Early Learning Lane collecting best practices',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-300',
      levels: 'Endless',
      maxPoints: 'Distance-based',
      features: ['ECE Best Practices', 'Endless Runner', 'Power-ups', 'Real-time Learning']
    }
  ];

  const playSound = (type: 'select' | 'purchase' | 'error') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      switch (type) {
        case 'select':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          break;
        case 'purchase':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          break;
      }
      
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Sound not available
    }
  };

  const purchaseGame = async (gameId: 'bounce' | 'pacheal') => {
    if (userPoints < 1) {
      playSound('error');
      toast({
        title: "Insufficient Points!",
        description: "You need at least 1 point to play. Complete modules to earn points!",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Deduct 1 point to play
      const response = await apiRequest('/api/auth/update-points', {
        method: 'POST',
        data: { pointsToAdd: -1 }
      });
      
      onPointsUpdate(response.points);
      playSound('purchase');
      
      // Get game component and title
      const game = games.find(g => g.id === gameId);
      if (game) {
        let GameComponent;
        switch (gameId) {
          case 'bounce':
            GameComponent = BounceAwayBlocks;
            break;
          case 'pacheal':
            GameComponent = PacHealGame;
            break;
          case 'dash':
            GameComponent = PreschoolDash;
            break;
          default:
            return;
        }
        
        // Open game in new window
        openGameInWindow(GameComponent, game.title);
      }
      
      toast({
        title: "Game Started!",
        description: `1 point deducted. Game opened in new window. Complete levels to earn up to ${game?.maxPoints} points!`,
        variant: "default"
      });
      
    } catch (error) {
      playSound('error');
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Coins className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-yellow-800 flex items-center gap-2">
                Educational Game Arcade
                <ExternalLink className="h-5 w-5" />
              </CardTitle>
              <p className="text-yellow-600">Insert 1 point to play • Games open in new windows • Earn up to 10 points!</p>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Coins className="h-5 w-5" />
              <span className="text-xl font-bold">{userPoints}</span>
            </div>
            <Badge className="bg-yellow-500 text-white">Your Points</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card 
                key={game.id}
                className={`border-2 ${game.borderColor} bg-gradient-to-br ${game.color} text-white transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
                onClick={() => {
                  playSound('select');
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-full">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{game.title}</CardTitle>
                        <p className="text-white/80 text-sm">{game.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white">
                      {game.levels} Levels
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {game.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4" />
                          <span>Cost: 1 point</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>Earn up to {game.maxPoints} points</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          purchaseGame(game.id as 'bounce' | 'pacheal');
                        }}
                        disabled={userPoints < 1 || isLoading}
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      >
                        {isLoading ? (
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Open Game
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {userPoints < 1 && (
          <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <Target className="h-5 w-5" />
              <span className="font-semibold">Need more points?</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Complete learning modules, assessments, or daily challenges to earn points!
            </p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">How to Earn Points:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-700">
            <div>• Complete modules: 5-15 points</div>
            <div>• Finish assessments: 10-25 points</div>
            <div>• Daily challenges: 1-5 points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}