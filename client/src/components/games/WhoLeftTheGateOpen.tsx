import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { queryClient, apiRequest } from '@/lib/queryClient';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy,
  Heart,
  Timer,
  Users,
  Target,
  Zap,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Type definitions
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

// Game data
const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 1,
    question: "A child has run toward the street. Your first priority is:",
    options: [
      "Call their name loudly to stop them",
      "Run after them while watching for traffic",
      "Send another child to get them",
      "Wait and see if they stop on their own"
    ],
    correctAnswer: 1,
    explanation: "Safety requires immediate action. Run after the child while being aware of traffic and other hazards to ensure both your safety and theirs.",
    domain: "Emergency Response"
  },
  {
    id: 2,
    question: "When multiple children escape, you should:",
    options: [
      "Chase the fastest runner first",
      "Focus on the child closest to danger",
      "Call for backup immediately while monitoring all children",
      "Try to catch them all at once"
    ],
    correctAnswer: 2,
    explanation: "Multiple escapes require systematic response. Call for help while prioritizing children based on immediate danger level.",
    domain: "Crisis Management"
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
  // All hooks must be called at the top level consistently
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Game state - all useState calls at top level
  const [gameState, setGameState] = useState<'menu' | 'onboarding' | 'playing' | 'paused' | 'question' | 'completed' | 'game-over' | 'daily-spin' | 'reward-screen'>('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Gamification state - all useState calls at top level
  const [coins, setCoins] = useState(0);
  const [dailySpinUsed, setDailySpinUsed] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(1);
  const [lootCrates, setLootCrates] = useState(0);
  const [powerUpsCollected, setPowerUpsCollected] = useState<string[]>([]);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);
  const [showDoubleOrNothing, setShowDoubleOrNothing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Game objects - all useState calls at top level
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    lives: 3
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  
  // Game effects - ALL useState calls must be at top level
  const [timeSlowActive, setTimeSlowActive] = useState(false);
  const [stickerStormActive, setStickerStormActive] = useState(false);
  const [teamRallyActive, setTeamRallyActive] = useState(false);
  const [glitterStuck, setGlitterStuck] = useState(false);

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
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
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
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? 50 : 10;
    
    setScore(prev => prev + pointsEarned);
    
    if (isCorrect) {
      playSound(800, 0.2);
    } else {
      playSound(200, 0.5);
    }

    // Submit to backend
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

  // Render main menu with gamification features
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Target className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Who Left the Gate Open?
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A fast-paced safety training game where you chase escaped preschoolers while demonstrating your emergency response skills!
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">🏃‍♀️</div>
                  <h3 className="font-semibold text-red-800">Chase Mode</h3>
                  <p className="text-sm text-red-600">Catch runaway children before they reach danger</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">🧠</div>
                  <h3 className="font-semibold text-blue-800">Safety Quiz</h3>
                  <p className="text-sm text-blue-600">Answer questions about emergency response</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="font-semibold text-green-800">Level Up</h3>
                  <p className="text-sm text-green-600">Progress through increasingly challenging scenarios</p>
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

  // Basic game interface for other states
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Who Left the Gate Open?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>Game State: {gameState}</p>
            <Button onClick={() => setGameState('menu')}>Return to Menu</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}