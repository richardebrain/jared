import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { queryClient } from '@/lib/queryClient';
import { 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Trophy,
  Target,
  Timer,
  ArrowRight,
  Zap
} from 'lucide-react';

interface TransitionScenario {
  id: number;
  title: string;
  situation: string;
  timeLimit: number;
  strategies: {
    id: number;
    text: string;
    effectiveness: number;
    points: number;
    explanation: string;
  }[];
}

const transitionScenarios: TransitionScenario[] = [
  {
    id: 1,
    title: "Circle Time to Centers",
    situation: "It's time to transition from circle time to learning centers. The children are excited and chatty after story time. How do you guide them smoothly?",
    timeLimit: 15,
    strategies: [
      {
        id: 1,
        text: "Use a calm signal like a chime and wait for quiet attention before giving directions",
        effectiveness: 95,
        points: 10,
        explanation: "Excellent! A calm signal helps children regulate and prepares them to listen to instructions."
      },
      {
        id: 2,
        text: "Loudly announce 'Time for centers!' and let children choose where to go",
        effectiveness: 30,
        points: 2,
        explanation: "This approach often leads to chaos. Children need clear, calm guidance during transitions."
      },
      {
        id: 3,
        text: "Dismiss children one by one based on clothing colors or other attributes",
        effectiveness: 80,
        points: 7,
        explanation: "Good strategy! This prevents rushing and gives children clear direction while making it engaging."
      },
      {
        id: 4,
        text: "Start singing a transition song and have children move when they're ready",
        effectiveness: 85,
        points: 8,
        explanation: "Great choice! Music naturally regulates children and makes transitions enjoyable."
      }
    ]
  },
  {
    id: 2,
    title: "Outdoor to Indoor Transition",
    situation: "Children are returning from outdoor play, full of energy and excitement. They need to wash hands and prepare for lunch. Several children are resistant to coming inside.",
    timeLimit: 20,
    strategies: [
      {
        id: 1,
        text: "Give a 5-minute warning, then use a special outdoor cleanup song",
        effectiveness: 90,
        points: 9,
        explanation: "Perfect! Warnings help children mentally prepare, and songs make cleanup fun and engaging."
      },
      {
        id: 2,
        text: "Immediately call all children inside and start lunch preparation",
        effectiveness: 25,
        points: 1,
        explanation: "Too abrupt! Children need time to process the transition and wind down from outdoor energy."
      },
      {
        id: 3,
        text: "Have children line up at the door and practice deep breathing before entering",
        effectiveness: 85,
        points: 8,
        explanation: "Excellent strategy! Deep breathing helps children self-regulate and transition their energy level."
      },
      {
        id: 4,
        text: "Create a visual schedule showing outdoor cleanup steps posted near the door",
        effectiveness: 80,
        points: 7,
        explanation: "Good approach! Visual schedules help children understand expectations and follow routines independently."
      }
    ]
  },
  {
    id: 3,
    title: "Snack Time Setup",
    situation: "It's snack time and children are finishing up their activities at different paces. Some are eager to eat while others want to continue playing. How do you transition everyone smoothly?",
    timeLimit: 12,
    strategies: [
      {
        id: 1,
        text: "Announce snack time and expect all children to stop immediately",
        effectiveness: 35,
        points: 3,
        explanation: "This can create resistance. Children need time to finish their thoughts and activities."
      },
      {
        id: 2,
        text: "Use a timer and give children a chance to find a stopping point in their play",
        effectiveness: 90,
        points: 9,
        explanation: "Excellent! Timers help children anticipate transitions and find natural stopping points."
      },
      {
        id: 3,
        text: "Have children wash hands in small groups while others continue playing briefly",
        effectiveness: 85,
        points: 8,
        explanation: "Smart approach! Staggered transitions prevent crowding and reduce waiting time."
      },
      {
        id: 4,
        text: "Start a hand-washing song and invite children to join when they're ready",
        effectiveness: 75,
        points: 6,
        explanation: "Good strategy! Songs create a positive atmosphere, though some structure helps ensure everyone participates."
      }
    ]
  },
  {
    id: 4,
    title: "Cleanup Time Challenge",
    situation: "Free play time is ending and the classroom needs to be cleaned up. Toys are scattered everywhere and some children are reluctant to help clean up.",
    timeLimit: 18,
    strategies: [
      {
        id: 1,
        text: "Turn cleanup into a game: 'Let's see if we can put away all the blocks before I count to 20!'",
        effectiveness: 92,
        points: 10,
        explanation: "Brilliant! Gamifying cleanup makes it fun and creates positive urgency without stress."
      },
      {
        id: 2,
        text: "Assign specific children to specific areas and insist they clean their assigned space",
        effectiveness: 60,
        points: 4,
        explanation: "This can work but may create resistance. Collaborative approaches often work better with young children."
      },
      {
        id: 3,
        text: "Play upbeat cleanup music and model enthusiastic cleaning",
        effectiveness: 88,
        points: 9,
        explanation: "Excellent! Music energizes children and your enthusiasm is contagious."
      },
      {
        id: 4,
        text: "Threaten to take away toys that aren't put away properly",
        effectiveness: 20,
        points: 1,
        explanation: "Threats create negative associations with cleanup. Positive motivation works much better."
      }
    ]
  },
  {
    id: 5,
    title: "Naptime Transition",
    situation: "After lunch, it's time for rest/quiet time. Some children are tired while others are still energetic. You need to create a calm environment for everyone.",
    timeLimit: 25,
    strategies: [
      {
        id: 1,
        text: "Dim the lights, play soft music, and guide children through gentle stretching",
        effectiveness: 95,
        points: 10,
        explanation: "Perfect! Environmental changes and calming activities help children's bodies prepare for rest."
      },
      {
        id: 2,
        text: "Tell children to be quiet and lie down on their mats immediately",
        effectiveness: 30,
        points: 2,
        explanation: "Too demanding. Children need help regulating their energy and emotions for rest time."
      },
      {
        id: 3,
        text: "Read a short, calming story while children settle on their mats",
        effectiveness: 85,
        points: 8,
        explanation: "Great choice! Stories naturally calm children and give them something positive to focus on."
      },
      {
        id: 4,
        text: "Practice deep breathing exercises and progressive muscle relaxation",
        effectiveness: 90,
        points: 9,
        explanation: "Excellent! These techniques teach children valuable self-regulation skills."
      }
    ]
  }
];

export default function TransitionMaster() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'complete'>('menu');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setCurrentScenario(0);
    setScore(0);
    setTimeLeft(transitionScenarios[0].timeLimit);
    setSelectedStrategy(null);
    setShowResult(false);
    setCompletedScenarios([]);
    setTotalPoints(0);
  };

  const selectStrategy = (strategyId: number) => {
    if (selectedStrategy !== null || showResult) return;
    
    setSelectedStrategy(strategyId);
    const strategy = transitionScenarios[currentScenario].strategies.find(s => s.id === strategyId);
    if (strategy) {
      setScore(score + strategy.effectiveness);
      setTotalPoints(totalPoints + strategy.points);
      setCompletedScenarios([...completedScenarios, currentScenario]);
    }
    setShowResult(true);
  };

  const nextScenario = () => {
    if (currentScenario < transitionScenarios.length - 1) {
      const nextIndex = currentScenario + 1;
      setCurrentScenario(nextIndex);
      setTimeLeft(transitionScenarios[nextIndex].timeLimit);
      setSelectedStrategy(null);
      setShowResult(false);
    } else {
      completeGame();
    }
  };

  const completeGame = async () => {
    setGameState('complete');
    
    // Award points and save completion
    try {
      const finalScore = Math.round(score / transitionScenarios.length);
      await fetch('/api/games/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: 'transition-master',
          score: finalScore,
          pointsEarned: totalPoints,
          timeTaken: 0
        })
      });

      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Transition Master Complete!",
        description: `You earned ${totalPoints} points! Average effectiveness: ${finalScore}%`
      });
    } catch (error) {
      console.error('Error saving game completion:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing' && !showResult) {
      // Time's up - auto-select lowest scoring option
      selectStrategy(transitionScenarios[currentScenario].strategies[transitionScenarios[currentScenario].strategies.length - 1].id);
    }
  }, [timeLeft, gameState, showResult, currentScenario]);

  const scenario = transitionScenarios[currentScenario];
  const selectedStrategyData = selectedStrategy ? scenario?.strategies.find(s => s.id === selectedStrategy) : null;

  if (gameState === 'menu') {
    return (
      <Card className="max-w-4xl mx-auto border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ArrowRight className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-blue-800 mb-2">Transition Master</CardTitle>
            <p className="text-blue-600 text-lg">Master the art of smooth classroom transitions</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">How to Play:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Read each transition scenario carefully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Choose the best strategy quickly</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Earn points for effective choices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Build transition mastery skills</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-700 mb-2">What You'll Learn:</h4>
            <div className="text-sm text-green-600 space-y-1">
              <p>• Effective transition strategies for different classroom situations</p>
              <p>• Timing and pacing techniques for smooth flow</p>
              <p>• Evidence-based approaches to managing classroom transitions</p>
              <p>• Creative solutions for common transition challenges</p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={startGame}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Transition Challenge
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'complete') {
    const averageScore = Math.round(score / transitionScenarios.length);
    const performance = averageScore >= 85 ? 'Excellent' : averageScore >= 70 ? 'Good' : averageScore >= 55 ? 'Fair' : 'Needs Practice';
    
    return (
      <Card className="max-w-4xl mx-auto border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <CardTitle className="text-3xl text-green-800 mb-2">Transition Master Complete!</CardTitle>
            <p className="text-green-600">You've completed all transition scenarios</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600">{averageScore}%</div>
              <div className="text-sm text-gray-600">Average Effectiveness</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-purple-600">{performance}</div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Transition Strategies:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Use calm signals and warnings to prepare children for transitions</p>
              <p>✓ Incorporate music, songs, and games to make transitions engaging</p>
              <p>✓ Provide visual schedules and clear expectations</p>
              <p>✓ Practice breathing and calming techniques</p>
              <p>✓ Allow time for children to process and find natural stopping points</p>
            </div>
          </div>

          <div className="text-center space-x-4">
            <Button 
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Playing state
  return (
    <Card className="max-w-4xl mx-auto border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl text-purple-800">
              Scenario {currentScenario + 1} of {transitionScenarios.length}
            </CardTitle>
            <p className="text-purple-600">{scenario.title}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{timeLeft}s</div>
                <Badge variant="outline" className="text-xs">Time Left</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
                <Badge variant="outline" className="text-xs">Points</Badge>
              </div>
            </div>
          </div>
        </div>
        <Progress value={(currentScenario / transitionScenarios.length) * 100} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-start gap-3">
            <Users className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-700 mb-2">Classroom Situation:</h3>
              <p className="text-gray-700">{scenario.situation}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-purple-700">Choose your transition strategy:</h3>
          {scenario.strategies.map((strategy) => (
            <Button
              key={strategy.id}
              onClick={() => selectStrategy(strategy.id)}
              disabled={selectedStrategy !== null}
              variant={selectedStrategy === strategy.id ? "default" : "outline"}
              className={`w-full text-left p-4 h-auto justify-start ${
                selectedStrategy === strategy.id 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-purple-50'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-bold flex items-center justify-center">
                  {strategy.id}
                </span>
                <span className="text-sm leading-relaxed">{strategy.text}</span>
              </div>
            </Button>
          ))}
        </div>

        {showResult && selectedStrategyData && (
          <div className={`p-4 rounded-lg border-l-4 ${
            selectedStrategyData.effectiveness >= 80 
              ? 'bg-green-50 border-green-500' 
              : selectedStrategyData.effectiveness >= 60
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {selectedStrategyData.effectiveness >= 80 ? (
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              ) : selectedStrategyData.effectiveness >= 60 ? (
                <Clock className="h-6 w-6 text-yellow-500 mt-1" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500 mt-1" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">Effectiveness: {selectedStrategyData.effectiveness}%</span>
                  <Badge variant="secondary">+{selectedStrategyData.points} points</Badge>
                </div>
                <p className="text-sm text-gray-700">{selectedStrategyData.explanation}</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button onClick={nextScenario} className="bg-purple-600 hover:bg-purple-700 text-white">
                {currentScenario < transitionScenarios.length - 1 ? 'Next Scenario' : 'Complete Game'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}