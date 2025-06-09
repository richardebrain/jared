import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy,
  Heart,
  Timer,
  Users,
  AlertTriangle,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: number;
  type: 'car' | 'bike' | 'stroller' | 'snack-cart' | 'glitter-puddle' | 'runaway-child';
  color: string;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'time-out-timer' | 'sticker-storm' | 'team-rally' | 'goldfish-bomb';
  color: string;
  active: boolean;
}

interface SafetyQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  domain: string;
}

interface GameLevel {
  level: number;
  dialogue: string;
  speed: number;
  obstacleCount: number;
  powerUpChance: number;
}

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 1,
    question: "A child runs toward the playground gate that was accidentally left open. What's your first action?",
    options: [
      "Shout loudly to stop them",
      "Quickly but calmly intercept while calling their name",
      "Send another child to get them",
      "Wait to see if they notice the gate"
    ],
    correctAnswer: 1,
    explanation: "Moving quickly but calmly while using their name helps redirect without causing panic or modeling unsafe behavior.",
    domain: "Safety & Emergency Procedures"
  },
  {
    id: 2,
    question: "You notice a child has a severe peanut allergy. What's the most important safety protocol?",
    options: [
      "Keep them away from all food",
      "Have an EpiPen nearby and know how to use it",
      "Only serve nut-free snacks to everyone",
      "Call parents immediately"
    ],
    correctAnswer: 1,
    explanation: "Having epinephrine auto-injectors accessible and staff trained to use them is the most critical safety measure for severe allergies.",
    domain: "Health & Medical Safety"
  },
  {
    id: 3,
    question: "During outdoor play, you see a child climbing too high on equipment. Best response?",
    options: [
      "Tell them to get down immediately",
      "Position yourself to spot them while calmly redirecting",
      "Remove them from the playground",
      "Ignore it - kids need to take risks"
    ],
    correctAnswer: 1,
    explanation: "Positioning for safety while offering calm guidance balances safety with allowing age-appropriate risk-taking and independence.",
    domain: "Playground Safety"
  }
];

const GAME_LEVELS: GameLevel[] = [
  {
    level: 1,
    dialogue: "Oh no! Little Timmy spotted the playground gate was left open and took off running! Chase him safely while avoiding obstacles!",
    speed: 1,
    obstacleCount: 3,
    powerUpChance: 0.3
  },
  {
    level: 2,
    dialogue: "Now Emma has joined the escape! Multiple children are heading for the street. Stay calm and rescue them both!",
    speed: 1.5,
    obstacleCount: 5,
    powerUpChance: 0.25
  },
  {
    level: 3,
    dialogue: "Code Red! A whole group decided the outside world looks fun. Show your master-level safety skills!",
    speed: 2,
    obstacleCount: 7,
    powerUpChance: 0.2
  }
];

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 8;

export default function WhoLeftTheGateOpen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'onboarding' | 'playing' | 'paused' | 'question' | 'completed' | 'game-over' | 'daily-spin' | 'reward-screen'>('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Gamification state
  const [coins, setCoins] = useState(0);
  const [dailySpinUsed, setDailySpinUsed] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(1);
  const [lootCrates, setLootCrates] = useState(0);
  const [powerUpsCollected, setPowerUpsCollected] = useState<string[]>([]);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);
  const [showDoubleOrNothing, setShowDoubleOrNothing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    lives: 3
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Initialize audio context and check first time user
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
    }
    
    // Check if this is the user's first time
    const hasPlayedBefore = localStorage.getItem('whoLeftGateOpen_played');
    if (!hasPlayedBefore) {
      setIsFirstTime(true);
      setGameState('onboarding');
    } else {
      setIsFirstTime(false);
      // Check daily spin
      const lastSpinDate = localStorage.getItem('whoLeftGateOpen_lastSpin');
      const today = new Date().toDateString();
      setDailySpinUsed(lastSpinDate === today);
      
      // Load saved progress
      const savedCoins = localStorage.getItem('whoLeftGateOpen_coins');
      const savedStreak = localStorage.getItem('whoLeftGateOpen_streak');
      if (savedCoins) setCoins(parseInt(savedCoins));
      if (savedStreak) setConsecutiveDays(parseInt(savedStreak));
    }
  }, []);

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, []);

  // Gamification helper functions
  const saveProgress = () => {
    localStorage.setItem('whoLeftGateOpen_coins', coins.toString());
    localStorage.setItem('whoLeftGateOpen_streak', consecutiveDays.toString());
    localStorage.setItem('whoLeftGateOpen_played', 'true');
  };

  const dailySpin = () => {
    const rewards = ['50 Coins', '100 Coins', 'Extra Life', 'Speed Boost', 'Quiz Skip'];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    
    if (randomReward.includes('Coins')) {
      const coinAmount = parseInt(randomReward.split(' ')[0]);
      setCoins(prev => prev + coinAmount);
    }
    
    setMysteryReward(randomReward);
    setDailySpinUsed(true);
    localStorage.setItem('whoLeftGateOpen_lastSpin', new Date().toDateString());
    
    toast({
      title: "Daily Spin Reward!",
      description: `You earned: ${randomReward}`,
      duration: 3000,
    });
  };

  const openLootCrate = () => {
    const rewards = ['25 Coins', '50 Coins', 'Power-Up', 'Extra Question Skip', 'Rare Costume'];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    if (reward.includes('Coins')) {
      const coinAmount = parseInt(reward.split(' ')[0]);
      setCoins(prev => prev + coinAmount);
    }
    
    setLootCrates(prev => Math.max(0, prev - 1));
    setMysteryReward(reward);
    
    toast({
      title: "Loot Crate Opened!",
      description: `You found: ${reward}`,
      duration: 3000,
    });
  };

  const doubleOrNothing = (risk: boolean) => {
    if (risk) {
      const success = Math.random() > 0.5;
      if (success) {
        setCoins(prev => prev * 2);
        toast({
          title: "Double Success!",
          description: "Your coins have been doubled!",
          duration: 3000,
        });
      } else {
        setCoins(prev => Math.floor(prev / 2));
        toast({
          title: "Oh no!",
          description: "You lost half your coins!",
          duration: 3000,
        });
      }
    }
    setShowDoubleOrNothing(false);
  };

  // Start new game
  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      lives: 3
    });
    setObstacles([]);
    setPowerUps([]);
    saveProgress();
  };

  // Handle answer selection
  const handleAnswerSelect = async (answerIndex: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? 100 : 25;
    
    setScore(prev => prev + pointsEarned);
    
    if (isCorrect) {
      playSound(800, 0.5);
      toast({
        title: "Correct!",
        description: `+${pointsEarned} points for excellent safety knowledge!`,
        duration: 2000,
      });
    } else {
      playSound(200, 0.5);
      toast({
        title: "Not quite right",
        description: `+${pointsEarned} points for trying. Review the explanation!`,
        duration: 2000,
      });
    }

    // Submit completion to backend if user is logged in
    if (user) {
      try {
        await apiRequest('/api/games/complete', {
          method: 'POST',
          data: {
            gameType: 'who-left-the-gate-open',
            score: score + pointsEarned,
            level: currentLevel + 1,
            questionId: currentQuestion.id,
            isCorrect,
            pointsEarned
          }
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
        queryClient.invalidateQueries({ queryKey: ['/api/points/history'] });
      } catch (error) {
        console.error('Failed to submit game completion:', error);
      }
    }
  };

  // Continue after question
  const continueGame = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    const coinsEarned = 25 + (currentLevel * 10);
    setCoins(prev => prev + coinsEarned);
    
    // Award loot crate every 3 levels
    if ((currentLevel + 1) % 3 === 0) {
      setLootCrates(prev => prev + 1);
    }
    
    if (currentLevel >= GAME_LEVELS.length - 1) {
      // Game completed - award bonus rewards
      setCoins(prev => prev + 100); // Completion bonus
      setLootCrates(prev => prev + 2); // Extra loot crates
      setGameState('reward-screen');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast({
        title: "Adventure Complete!",
        description: `You saved all the children! Earned ${coinsEarned + 100} coins and 2 loot crates!`,
        duration: 5000,
      });
    } else {
      setCurrentLevel(prev => prev + 1);
      setGameState('playing');
      
      toast({
        title: "Level Complete!",
        description: `Earned ${coinsEarned} coins! ${(currentLevel + 2) % 3 === 0 ? 'Next level awards a loot crate!' : ''}`,
        duration: 3000,
      });
    }
    
    saveProgress();
  };

  // Reset game
  const resetGame = () => {
    setGameState('menu');
    setCurrentLevel(0);
    setScore(0);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  // Render onboarding screen for first-time users
  if (gameState === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full animate-pulse">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to Preschool Dash!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              🎯 Save the kiddos! Chase escaped children through the Preschool Parkway while demonstrating your safety expertise!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">🎁 First-Time Magic Bonus!</h3>
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                  <div className="text-4xl animate-spin">🎯</div>
                </div>
                <p className="text-purple-700 mb-4">Claim your free welcome spin wheel!</p>
                <Button 
                  onClick={() => {
                    dailySpin();
                    setCoins(100); // Welcome bonus
                    setLootCrates(1); // Free power-up crate
                    setGameState('daily-spin');
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Claim Free Spin + 100 Coins!
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <ArrowLeft className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Lane-Swipe</h3>
                  <p className="text-sm text-blue-600">Use arrow keys to dodge obstacles</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <ArrowUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Jump & Slide</h3>
                  <p className="text-sm text-green-600">Navigate through the playground chaos</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-yellow-800">Quiz & Earn</h3>
                  <p className="text-sm text-yellow-600">Answer safety questions for rewards</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render daily spin wheel
  if (gameState === 'daily-spin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Daily Rainbow Wheel!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600">
              Spin the wheel for your daily reward bonus!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full shadow-lg mb-6">
                <div className="text-6xl animate-bounce">🎡</div>
              </div>
              
              {mysteryReward ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 You Won!</h3>
                  <p className="text-xl text-green-700 mb-4">{mysteryReward}</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-green-600">
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>Coins: {coins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      <span>Streak: {consecutiveDays} days</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setGameState(isFirstTime ? 'menu' : 'menu')}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {isFirstTime ? 'Start Tutorial!' : 'Continue Playing!'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Ready to spin?</p>
                  <Button 
                    onClick={dailySpin}
                    size="lg"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3"
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Spin the Wheel!
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render reward screen
  if (gameState === 'reward-screen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Level Complete!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-4">🎉 Reward Tally</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">{score}</p>
                  <p className="text-sm text-green-700">Points</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{coins}</p>
                  <p className="text-sm text-yellow-700">Coins</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">{lootCrates}</p>
                  <p className="text-sm text-purple-700">Loot Crates</p>
                </div>
              </div>
              
              {lootCrates > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-green-800 mb-3">🎁 Mystery Crate Available!</h4>
                  <Button 
                    onClick={openLootCrate}
                    className="bg-purple-600 hover:bg-purple-700 mr-4"
                  >
                    Open Loot Crate
                  </Button>
                </div>
              )}
              
              {coins > 0 && !showDoubleOrNothing && (
                <div className="mb-6">
                  <h4 className="font-semibold text-orange-800 mb-3">🎲 Feeling Lucky?</h4>
                  <Button 
                    onClick={() => setShowDoubleOrNothing(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Double-Or-Nothing Challenge!
                  </Button>
                </div>
              )}
              
              {showDoubleOrNothing && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-orange-800 mb-3">🎰 Double-Or-Nothing!</h4>
                  <p className="text-orange-700 mb-4">Risk {coins} coins for a chance to double them!</p>
                  <div className="space-x-4">
                    <Button 
                      onClick={() => doubleOrNothing(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Risk It!
                    </Button>
                    <Button 
                      onClick={() => doubleOrNothing(false)}
                      variant="outline"
                    >
                      Keep Safe
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={() => {
                  setGameState('menu');
                  saveProgress();
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mr-4"
              >
                <Play className="h-5 w-5 mr-2" />
                Play Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/games'}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Back to Games Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render game menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Who Left the Gate Open?!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oh no! Children are escaping through an open gate! Navigate safely through the chaos 
              while demonstrating your expertise in early childhood safety protocols. Answer safety 
              questions correctly to earn points and show your professional knowledge!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Mission</h3>
                  <p className="text-sm text-blue-600">Safely guide escaped children back while avoiding playground obstacles</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Learn</h3>
                  <p className="text-sm text-green-600">Answer safety questions to demonstrate your ECE expertise</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-800">Earn</h3>
                  <p className="text-sm text-purple-600">Gain points and achievements for your professional development</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Player Progress Bar */}
            {!isFirstTime && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-800">Your Progress</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Zap className="h-4 w-4" />
                      <span>{coins} Coins</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Trophy className="h-4 w-4" />
                      <span>{consecutiveDays} Day Streak</span>
                    </div>
                  </div>
                </div>
                
                {!dailySpinUsed && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl animate-spin">🎡</div>
                        <span className="text-yellow-800 font-medium">Daily Spin Available!</span>
                      </div>
                      <Button 
                        onClick={() => setGameState('daily-spin')}
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Spin Now!
                      </Button>
                    </div>
                  </div>
                )}
                
                {lootCrates > 0 && (
                  <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">📦</div>
                        <span className="text-purple-800 font-medium">{lootCrates} Loot Crate{lootCrates > 1 ? 's' : ''} Ready!</span>
                      </div>
                      <Button 
                        onClick={openLootCrate}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Open Crate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                How to Play Preschool Dash
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>🏃 Use arrow keys or WASD to chase escaped children</li>
                <li>🚗 Dodge obstacles like cars, bikes, and glitter puddles</li>
                <li>👶 Catch runaway children to trigger safety questions</li>
                <li>📚 Answer correctly to earn coins and advance levels</li>
                <li>🎁 Collect loot crates and power-ups for bonuses!</li>
                <li>🎯 Complete all levels to become a Safety Expert!</li>
              </ul>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={startGame}
                size="lg"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                {isFirstTime ? 'Start Adventure!' : 'Continue Chase!'}
              </Button>
              
              {!dailySpinUsed && !isFirstTime && (
                <Button 
                  onClick={() => setGameState('daily-spin')}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Daily Bonus Spin
                </Button>
              )}
              
              {user && (
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Playing as {user.firstName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>Earn Bear Bucks & XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    <span>Track Progress</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render safety question
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Safety Knowledge Check
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-blue-100">
                  Level {currentLevel + 1}
                </Badge>
                <Badge variant="outline" className="bg-green-100">
                  Score: {score}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full mt-1">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">{currentQuestion.domain}</h3>
                  <p className="text-blue-700 text-lg leading-relaxed">{currentQuestion.question}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  variant={
                    selectedAnswer === null ? "outline" :
                    index === currentQuestion.correctAnswer ? "default" :
                    index === selectedAnswer ? "destructive" : "outline"
                  }
                  className={`w-full text-left justify-start p-4 h-auto whitespace-normal ${
                    selectedAnswer === null ? "hover:bg-blue-50" :
                    index === currentQuestion.correctAnswer ? "bg-green-100 text-green-800 border-green-300" :
                    index === selectedAnswer ? "bg-red-100 text-red-800 border-red-300" : "bg-gray-50"
                  }`}
                >
                  <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
            
            {showExplanation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Explanation:</h4>
                <p className="text-green-700">{currentQuestion.explanation}</p>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <Button onClick={continueGame} className="bg-green-600 hover:bg-green-700">
                    Continue Challenge
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render game completion
  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Safety Expert!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600">
              Congratulations! You've successfully demonstrated excellent safety protocols and 
              rescued all the escaped children. Your professional knowledge is impressive!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Final Score</h3>
              <p className="text-4xl font-bold text-green-600 mb-4">{score} points</p>
              <div className="grid grid-cols-3 gap-4 text-sm text-green-700">
                <div>
                  <p className="font-semibold">Levels Completed</p>
                  <p>{GAME_LEVELS.length}</p>
                </div>
                <div>
                  <p className="font-semibold">Safety Knowledge</p>
                  <p>Expert Level</p>
                </div>
                <div>
                  <p className="font-semibold">Children Rescued</p>
                  <p>All Safe!</p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={resetGame}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mr-4"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Play Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/games'}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Try Other Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game effects
  const [timeSlowActive, setTimeSlowActive] = useState(false);
  const [stickerStormActive, setStickerStormActive] = useState(false);
  const [teamRallyActive, setTeamRallyActive] = useState(false);
  const [glitterStuck, setGlitterStuck] = useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      e.preventDefault();
      const moveSpeed = 8;
      
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            newX = Math.max(0, prev.x - moveSpeed);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            newX = Math.min(CANVAS_WIDTH - prev.width, prev.x + moveSpeed);
            break;
          case 'ArrowUp':
          case 'w':
          case 'W':
            newY = Math.max(0, prev.y - moveSpeed);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            newY = Math.min(CANVAS_HEIGHT - prev.height, prev.y + moveSpeed);
            break;
          case ' ':
            if (gameState === 'paused') {
              setGameState('playing');
            } else if (gameState === 'playing') {
              setGameState('paused');
            }
            break;
        }
        
        return { ...prev, x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Collision detection
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Generate obstacles
  const generateObstacle = useCallback((): Obstacle => {
    const types: Obstacle['type'][] = ['car', 'bike', 'stroller', 'snack-cart', 'glitter-puddle', 'runaway-child'];
    const type = types[Math.floor(Math.random() * types.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = (Math.random() * 2 + 1) * (timeSlowActive ? 0.5 : 1);
    
    const colors = {
      'car': '#ff6b6b',
      'bike': '#4ecdc4',
      'stroller': '#45b7d1',
      'snack-cart': '#f39c12',
      'glitter-puddle': '#e74c3c',
      'runaway-child': '#2ecc71'
    };

    return {
      id: Math.random(),
      x: direction === 1 ? -60 : CANVAS_WIDTH + 60,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      width: type === 'glitter-puddle' ? 80 : 60,
      height: type === 'glitter-puddle' ? 20 : 40,
      speed,
      direction,
      type,
      color: colors[type]
    };
  }, [timeSlowActive]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update obstacles
      setObstacles(prev => {
        const currentLevelData = GAME_LEVELS[currentLevel];
        let newObstacles = prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x + obstacle.speed * obstacle.direction * (teamRallyActive ? 0.3 : 1)
        })).filter(obstacle => 
          obstacle.x > -100 && obstacle.x < CANVAS_WIDTH + 100
        );

        // Add new obstacles
        if (newObstacles.length < currentLevelData.obstacleCount && Math.random() < 0.02) {
          newObstacles.push(generateObstacle());
        }

        // Check collisions
        newObstacles.forEach(obstacle => {
          if (checkCollision(player, obstacle)) {
            if (obstacle.type === 'glitter-puddle') {
              setGlitterStuck(true);
              playSound(200, 0.5);
              setTimeout(() => setGlitterStuck(false), 2000);
            } else if (obstacle.type === 'runaway-child') {
              // Success! Caught the child
              setScore(prev => prev + 100);
              playSound(1000, 0.5);
              
              // Trigger safety question
              const randomQuestion = SAFETY_QUESTIONS[Math.floor(Math.random() * SAFETY_QUESTIONS.length)];
              setCurrentQuestion(randomQuestion);
              setGameState('question');
            } else {
              // Hit obstacle - lose life
              setPlayer(prev => ({ ...prev, lives: prev.lives - 1 }));
              playSound(100, 0.8);
              
              if (player.lives <= 1) {
                setGameState('game-over');
              }
            }
          }
        });

        return newObstacles;
      });

      // Check level completion
      if (score >= (currentLevel + 1) * 500) {
        if (currentLevel >= GAME_LEVELS.length - 1) {
          setGameState('completed');
        } else {
          setCurrentLevel(prev => prev + 1);
        }
      }
    };

    const intervalId = setInterval(gameLoop, 50);
    return () => clearInterval(intervalId);
  }, [gameState, currentLevel, score, player, generateObstacle, checkCollision, playSound, teamRallyActive]);

  // Canvas rendering
  useEffect(() => {
    if (!canvasRef.current || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw playground background
    ctx.fillStyle = '#90EE90'; // Light green for grass
    ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

    // Draw school building
    ctx.fillStyle = '#8B4513'; // Brown building
    ctx.fillRect(0, 0, CANVAS_WIDTH, 100);
    ctx.fillStyle = '#FFD700'; // Yellow windows
    for (let i = 50; i < CANVAS_WIDTH; i += 100) {
      ctx.fillRect(i, 20, 30, 30);
    }

    // Draw gate (target area)
    ctx.fillStyle = '#FF6347'; // Red gate
    ctx.fillRect(CANVAS_WIDTH - 50, 100, 50, 100);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('GATE', CANVAS_WIDTH - 45, 130);

    // Draw player
    ctx.fillStyle = '#4169E1'; // Blue teacher
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText('👩‍🏫', player.x + 5, player.y + 20);

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Draw obstacle icons
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      switch (obstacle.type) {
        case 'car':
          ctx.fillText('🚗', obstacle.x + 15, obstacle.y + 25);
          break;
        case 'bike':
          ctx.fillText('🚲', obstacle.x + 15, obstacle.y + 25);
          break;
        case 'stroller':
          ctx.fillText('🍼', obstacle.x + 15, obstacle.y + 25);
          break;
        case 'snack-cart':
          ctx.fillText('🍪', obstacle.x + 15, obstacle.y + 25);
          break;
        case 'glitter-puddle':
          ctx.fillText('✨', obstacle.x + 25, obstacle.y + 15);
          break;
        case 'runaway-child':
          ctx.fillText('👶', obstacle.x + 15, obstacle.y + 25);
          break;
      }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      ctx.fillStyle = powerUp.color;
      ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText('⚡', powerUp.x + 5, powerUp.y + 20);
    });

    // Draw effects
    if (glitterStuck) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.fillRect(player.x - 10, player.y - 10, player.width + 20, player.height + 20);
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.fillText('STUCK! Press W to escape!', player.x - 30, player.y - 20);
    }

  }, [player, obstacles, powerUps, glitterStuck, gameState]);

  // Game over state
  if (gameState === 'game-over') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Safety Incident!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600">
              The children got away! Remember, constant supervision and quick reflexes 
              are essential for playground safety. Let's try again!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-red-800 mb-2">Final Score</h3>
              <p className="text-4xl font-bold text-red-600 mb-4">{score} points</p>
              <p className="text-red-700">Level {currentLevel + 1} reached</p>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={resetGame}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 mr-4"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/games'}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Back to Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing state with canvas
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Level {currentLevel + 1}: Safety Chase!
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-100">
                <Heart className="h-4 w-4 mr-1" />
                Lives: {player.lives}
              </Badge>
              <Badge variant="outline" className="bg-green-100">
                Score: {score}
              </Badge>
              <Badge variant="outline" className="bg-blue-100">
                Level: {currentLevel + 1}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-center text-lg font-medium">
              {GAME_LEVELS[currentLevel]?.dialogue}
            </p>
          </div>
          
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-2 border-gray-300 rounded-lg bg-white shadow-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Target</p>
              <p className="text-xs text-blue-500">Catch escaped children (👶)</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Avoid</p>
              <p className="text-xs text-red-500">Obstacles & hazards</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Controls</p>
              <p className="text-xs text-green-500">Arrow keys or WASD</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Goal</p>
              <p className="text-xs text-purple-500">{(currentLevel + 1) * 500} points to advance</p>
            </div>
          </div>
          
          {gameState === 'paused' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Game Paused</h3>
              <p className="text-gray-600 mb-4">Press SPACE to continue</p>
              <Button onClick={() => setGameState('playing')}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </div>
          )}
          
          {(timeSlowActive || stickerStormActive || teamRallyActive) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Active Power-ups:</h4>
              <div className="flex flex-wrap gap-2">
                {timeSlowActive && <Badge className="bg-blue-100 text-blue-800">⏰ Time Slow</Badge>}
                {stickerStormActive && <Badge className="bg-red-100 text-red-800">⭐ Sticker Storm</Badge>}
                {teamRallyActive && <Badge className="bg-green-100 text-green-800">👥 Team Rally</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}