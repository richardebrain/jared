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

// Core Frogger mechanics constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40; // Fixed grid for snappy movement
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE); // 20 columns
const ROWS = 13; // Fixed number of rows
const LANE_HEIGHT = CANVAS_HEIGHT / ROWS;
const PLAYER_START_ROW = ROWS - 2; // Start near bottom
const GOAL_ROW = 1; // Top row is the goal
const SAFE_ZONE_ROW = Math.floor(ROWS / 2); // Middle checkpoint
const BASE_OBSTACLE_SPEED = 1.5;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

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
    x: Math.floor(COLS / 2) * GRID_SIZE, // Center column
    y: PLAYER_START_ROW * LANE_HEIGHT,   // Near bottom row
    width: GRID_SIZE,
    height: GRID_SIZE,
    lives: 3
  });
  
  // Grid-based player position tracking
  const [playerRow, setPlayerRow] = useState(PLAYER_START_ROW);
  const [playerCol, setPlayerCol] = useState(Math.floor(COLS / 2));
  const [checkpoint, setCheckpoint] = useState(PLAYER_START_ROW);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  
  // Game effects - ALL useState calls must be at top level
  const [timeSlowActive, setTimeSlowActive] = useState(false);
  const [stickerStormActive, setStickerStormActive] = useState(false);
  const [teamRallyActive, setTeamRallyActive] = useState(false);
  const [glitterStuck, setGlitterStuck] = useState(false);
  
  // Animation and feedback state
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<any[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const [collectionEffects, setCollectionEffects] = useState<any[]>([]);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  
  // Core Frogger lane mechanics
  const [laneTimers, setLaneTimers] = useState<number[]>(new Array(ROWS).fill(0));
  const [laneDirections, setLaneDirections] = useState<number[]>(() => {
    // Alternate lane directions for classic Frogger feel
    return Array.from({ length: ROWS }, (_, i) => i % 2 === 0 ? 1 : -1);
  });
  const [comboCount, setComboCount] = useState(0);
  const [flowModeActive, setFlowModeActive] = useState(false);
  const [nearMissCount, setNearMissCount] = useState(0);
  
  // Performance optimization states
  const MAX_PARTICLES = 30;
  const [fpsCounter, setFpsCounter] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastFpsUpdate, setLastFpsUpdate] = useState(Date.now());
  const [particlePool, setParticlePool] = useState<any[]>([]);
  const backgroundLayerRef = useRef<HTMLCanvasElement | null>(null);
  const [backgroundRendered, setBackgroundRendered] = useState(false);

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

  // Enhanced sound effects with crisp audio cues
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, []);

  // Crisp feedback sounds for instant responsiveness
  const playCrispFeedback = useCallback((type: 'collect' | 'jump' | 'hit' | 'powerup' | 'child') => {
    switch (type) {
      case 'collect':
        playSound(800, 0.1, 'sine', 0.4); // Quick "boop" for coin collection
        break;
      case 'jump':
        playSound(400, 0.15, 'square', 0.3); // Satisfying jump sound
        break;
      case 'hit':
        playSound(150, 0.3, 'sawtooth', 0.5); // Impact feedback
        break;
      case 'powerup':
        playSound(600, 0.2, 'triangle', 0.4); // Power-up activation
        setTimeout(() => playSound(800, 0.15, 'sine', 0.3), 100); // Chord effect
        break;
      case 'child':
        playSound(500, 0.25, 'sine', 0.4); // Child caught - celebratory
        setTimeout(() => playSound(700, 0.2, 'triangle', 0.3), 150);
        break;
    }
  }, [playSound]);

  // Particle system for satisfying visual feedback
  const createParticles = useCallback((x: number, y: number, type: 'coin' | 'explosion' | 'powerup' | 'child', count = 8) => {
    const newParticles = [];
    const colors = {
      coin: ['#FFD700', '#FFA500', '#FFFF00'],
      explosion: ['#FF4444', '#FF8844', '#FFAA44'],
      powerup: ['#44AAFF', '#4444FF', '#AA44FF'],
      child: ['#44FF44', '#88FF88', '#AAFFAA']
    };
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 3 + Math.random() * 4,
        color: colors[type][Math.floor(Math.random() * colors[type].length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Screen shake for impactful feedback
  const triggerScreenShake = useCallback((intensity = 5) => {
    setScreenShake(intensity);
    setTimeout(() => setScreenShake(0), 150);
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

  // Start new game with proper Frogger positioning
  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    
    // Reset to grid-based starting position
    const startCol = Math.floor(COLS / 2);
    const startRow = PLAYER_START_ROW;
    
    setPlayerRow(startRow);
    setPlayerCol(startCol);
    setCheckpoint(startRow);
    
    setPlayer({
      x: startCol * GRID_SIZE,
      y: startRow * LANE_HEIGHT,
      width: GRID_SIZE,
      height: GRID_SIZE,
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

  // Collision detection helper
  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    if (gameState !== 'playing') return;

    const obstacleTypes = ['car', 'bike', 'stroller', 'snack-cart', 'glitter-puddle', 'runaway-child'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as any;
    
    const colors = {
      'car': '#ff4444',
      'bike': '#44ff44', 
      'stroller': '#4444ff',
      'snack-cart': '#ffff44',
      'glitter-puddle': '#ff44ff',
      'runaway-child': '#ff8844'
    };

    const newObstacle: Obstacle = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 40),
      y: -40,
      width: type === 'glitter-puddle' ? 60 : 40,
      height: type === 'glitter-puddle' ? 20 : 40,
      speed: (GAME_LEVELS[currentLevel]?.speed || 1) * (2 + Math.random() * 3),
      direction: 1,
      type,
      color: colors[type]
    };

    setObstacles(prev => [...prev, newObstacle]);
  }, [gameState, currentLevel]);

  // Spawn power-ups
  const spawnPowerUp = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const powerUpTypes = ['time-out-timer', 'sticker-storm', 'team-rally', 'goldfish-bomb'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] as any;
    
    const colors = {
      'time-out-timer': '#00aaff',
      'sticker-storm': '#ffaa00', 
      'team-rally': '#aa00ff',
      'goldfish-bomb': '#ff00aa'
    };

    const newPowerUp: PowerUp = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 30),
      y: -30,
      width: 30,
      height: 30,
      type,
      color: colors[type],
      active: false
    };

    setPowerUps(prev => [...prev, newPowerUp]);
  }, [gameState]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Move obstacles
    setObstacles(prev => prev.map(obstacle => ({
      ...obstacle,
      y: obstacle.y + obstacle.speed
    })).filter(obstacle => obstacle.y < CANVAS_HEIGHT + 50));

    // Move power-ups
    setPowerUps(prev => prev.map(powerUp => ({
      ...powerUp,
      y: powerUp.y + 2
    })).filter(powerUp => powerUp.y < CANVAS_HEIGHT + 50));

    // Check collisions with obstacles
    setObstacles(prev => {
      const collisions = prev.filter(obstacle => checkCollision(player, obstacle));
      
      if (collisions.length > 0) {
        // Handle collision
        const obstacle = collisions[0];
        
        if (obstacle.type === 'runaway-child') {
          // Caught a child - celebratory feedback with particles and sound
          playCrispFeedback('child');
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 'child', 12);
          triggerScreenShake(3);
          setScore(prevScore => prevScore + 100);
          
          // Add collection effect
          setCollectionEffects(prev => [...prev, {
            id: Date.now(),
            x: obstacle.x + obstacle.width/2,
            y: obstacle.y + obstacle.height/2,
            text: '+100 Points!',
            life: 1,
            decay: 0.02
          }]);
          
          // Select random question
          const randomQuestion = SAFETY_QUESTIONS[Math.floor(Math.random() * SAFETY_QUESTIONS.length)];
          setCurrentQuestion(randomQuestion);
          setGameState('question');
          
          return prev.filter(o => o.id !== obstacle.id);
        } else {
          // Hit an obstacle - impactful feedback with screen shake and explosion
          playCrispFeedback('hit');
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 'explosion', 15);
          triggerScreenShake(8);
          
          setPlayer(prevPlayer => {
            const newLives = prevPlayer.lives - 1;
            if (newLives <= 0) {
              setGameState('game-over');
            }
            return { ...prevPlayer, lives: newLives };
          });
          
          return prev.filter(o => o.id !== obstacle.id);
        }
      }
      
      return prev;
    });

    // Check collisions with power-ups
    setPowerUps(prev => {
      const collisions = prev.filter(powerUp => checkCollision(player, powerUp));
      
      if (collisions.length > 0) {
        const powerUp = collisions[0];
        playCrispFeedback('powerup');
        createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 'powerup', 10);
        triggerScreenShake(4);
        setScore(prevScore => prevScore + 25);
        
        // Add collection effect with power-up name
        const powerUpNames = {
          'time-out-timer': 'Time Slow!',
          'sticker-storm': 'Invincible!',
          'team-rally': 'Speed Boost!',
          'goldfish-bomb': 'Clear All!'
        };
        
        setCollectionEffects(prev => [...prev, {
          id: Date.now(),
          x: powerUp.x + powerUp.width/2,
          y: powerUp.y + powerUp.height/2,
          text: powerUpNames[powerUp.type as keyof typeof powerUpNames] || 'Power Up!',
          life: 1,
          decay: 0.015
        }]);
        
        // Activate power-up effect with enhanced feedback
        switch (powerUp.type) {
          case 'time-out-timer':
            setTimeSlowActive(true);
            setTimeout(() => setTimeSlowActive(false), 3000);
            break;
          case 'sticker-storm':
            setStickerStormActive(true);
            setTimeout(() => setStickerStormActive(false), 2000);
            break;
          case 'team-rally':
            setTeamRallyActive(true);
            setTimeout(() => setTeamRallyActive(false), 4000);
            break;
          case 'goldfish-bomb':
            // Clear all obstacles with explosive effect
            obstacles.forEach(obs => {
              createParticles(obs.x + obs.width/2, obs.y + obs.height/2, 'explosion', 6);
            });
            setObstacles([]);
            triggerScreenShake(10);
            break;
        }
        
        return prev.filter(p => p.id !== powerUp.id);
      }
      
      return prev;
    });

  }, [gameState, player, playCrispFeedback, createParticles, triggerScreenShake]);

  // Get obstacle color based on type
  const getObstacleColor = (type: string): string => {
    const obstacleColors = {
      'car': '#FF4444',
      'bike': '#4444FF', 
      'stroller': '#FF8844',
      'snack-cart': '#8844FF',
      'glitter-puddle': '#44FFFF',
      'runaway-child': '#32CD32'
    };
    return obstacleColors[type as keyof typeof obstacleColors] || '#888888';
  };

  // Update particles and effects for satisfying visual feedback
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateEffects = () => {
      // Update particles with physics
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.3, // Gravity
        vx: particle.vx * 0.98, // Air resistance
        life: particle.life - particle.decay
      })).filter(particle => particle.life > 0));

      // Update collection effects
      setCollectionEffects(prev => prev.map(effect => ({
        ...effect,
        y: effect.y - 1, // Float upward
        life: effect.life - effect.decay
      })).filter(effect => effect.life > 0));

      // Update difficulty multiplier for flow state curve
      const baseMultiplier = 1 + (currentLevel * 0.1) + (score / 1000);
      setDifficultyMultiplier(baseMultiplier);
    };

    const interval = setInterval(updateEffects, 16); // 60fps
    return () => clearInterval(interval);
  }, [gameState, currentLevel, score]);

  // Frogger-style grid movement - discrete key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      e.preventDefault();
      const key = e.key.toLowerCase();
      
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        // Grid-based movement - snap to lanes and columns
        if (key === 'arrowleft' || key === 'a') {
          newX = Math.max(0, prev.x - PLAYER_GRID_SIZE);
          playSound(400, 0.1);
        } else if (key === 'arrowright' || key === 'd') {
          newX = Math.min(CANVAS_WIDTH - prev.width, prev.x + PLAYER_GRID_SIZE);
          playSound(400, 0.1);
        } else if (key === 'arrowup' || key === 'w') {
          // Move up one lane
          const currentLaneIndex = LANE_Y_POSITIONS.findIndex(y => Math.abs(y - prev.y) < 20);
          if (currentLaneIndex > 0) {
            newY = LANE_Y_POSITIONS[currentLaneIndex - 1];
            playSound(500, 0.1);
          }
        } else if (key === 'arrowdown' || key === 's') {
          // Move down one lane
          const currentLaneIndex = LANE_Y_POSITIONS.findIndex(y => Math.abs(y - prev.y) < 20);
          if (currentLaneIndex < LANE_COUNT - 1 && currentLaneIndex !== -1) {
            newY = LANE_Y_POSITIONS[currentLaneIndex + 1];
            playSound(450, 0.1);
          }
        }
        
        return { ...prev, x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playCrispFeedback]);

  // Horizontal obstacle movement for Frogger-style gameplay
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveObstacles = () => {
      setObstacles(prev => prev.map(obstacle => {
        const speed = (BASE_OBSTACLE_SPEED + currentLevel) * (timeSlowActive ? 0.5 : 1);
        let newX = obstacle.x + speed * obstacle.direction;
        
        // Wrap around screen edges
        if (newX > CANVAS_WIDTH) {
          newX = -obstacle.width;
        } else if (newX + obstacle.width < 0) {
          newX = CANVAS_WIDTH;
        }
        
        return { ...obstacle, x: newX };
      }));
    };

    const interval = setInterval(moveObstacles, 16); // 60fps movement
    return () => clearInterval(interval);
  }, [gameState, currentLevel, timeSlowActive]);

  // Enhanced per-lane obstacle spawning system
  const spawnObstacleInLane = useCallback((laneIndex: number) => {
    if (laneIndex === 0 || laneIndex === LANE_COUNT - 1) return; // Skip goal and start lanes
    
    const getObstacleColor = (type: string): string => {
      const obstacleColors = {
        'car': '#FF4444',
        'bike': '#4444FF', 
        'stroller': '#FF8844',
        'snack-cart': '#8844FF',
        'glitter-puddle': '#44FFFF',
        'runaway-child': '#32CD32'
      };
      return obstacleColors[type as keyof typeof obstacleColors] || '#888888';
    };

    const level = GAME_LEVELS[currentLevel] || GAME_LEVELS[0];
    const direction = laneIndex % 2 === 0 ? 1 : -1;
    const laneY = LANE_Y_POSITIONS[laneIndex];
    const startX = direction === 1 ? -60 : CANVAS_WIDTH + 60;
    
    const obstacleTypes = ['car', 'bike', 'stroller', 'snack-cart'];
    if (currentLevel >= 2) obstacleTypes.push('glitter-puddle'); // Special hazard in higher levels
    
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as any;
    
    const speedMultiplier = fireDrillActive ? 1.25 : (slowMoLane === laneIndex ? 0.5 : 1);
    
    setObstacles(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: startX,
      y: laneY,
      width: 50,
      height: 40,
      speed: level.speed * speedMultiplier,
      direction,
      type,
      color: getObstacleColor(type)
    }]);
  }, [currentLevel, fireDrillActive, slowMoLane]);

  // Initialize level with drifting child target
  const initializeLevel = useCallback(() => {
    // Clear existing obstacles and reset child position
    setObstacles([]);
    setChildTarget({ x: CANVAS_WIDTH / 2, direction: 1 });
    setCheckpointReached(false);
    setComboCount(0);
    setFlowModeActive(false);
    setLaneTimers(new Array(LANE_COUNT).fill(0));
    
    // Initialize some obstacles for immediate gameplay
    for (let laneIndex = 1; laneIndex < LANE_COUNT - 1; laneIndex++) {
      setTimeout(() => spawnObstacleInLane(laneIndex), laneIndex * 500);
    }
  }, [currentLevel, spawnObstacleInLane]);

  // Initialize level when starting
  useEffect(() => {
    if (gameState === 'playing') {
      initializeLevel();
    }
  }, [gameState, currentLevel, initializeLevel]);

  // Enhanced game mechanics - Fire Drill and Special Modes
  useEffect(() => {
    if (gameState !== 'playing') return;

    const fireDrillInterval = setInterval(() => {
      // Fire drill every 20 seconds for 5 seconds
      setFireDrillActive(true);
      setFireDrillTimer(20000);
      
      setTimeout(() => {
        setFireDrillActive(false);
      }, 5000);
    }, 20000);

    const slowMoInterval = setInterval(() => {
      // Random slow-mo zone every 15 seconds
      const randomLane = Math.floor(Math.random() * (LANE_COUNT - 2)) + 1;
      setSlowMoLane(randomLane);
      
      setTimeout(() => {
        setSlowMoLane(null);
      }, 8000);
    }, 15000);

    return () => {
      clearInterval(fireDrillInterval);
      clearInterval(slowMoInterval);
    };
  }, [gameState]);

  // Per-lane spawning timers
  useEffect(() => {
    if (gameState !== 'playing') return;

    const laneSpawnInterval = setInterval(() => {
      setLaneTimers(prev => {
        const newTimers = [...prev];
        
        for (let laneIndex = 1; laneIndex < LANE_COUNT - 1; laneIndex++) {
          newTimers[laneIndex] += 100; // 100ms increment
          
          const spawnInterval = 1500 + Math.random() * 1500; // 1.5-3s random
          if (newTimers[laneIndex] >= spawnInterval) {
            spawnObstacleInLane(laneIndex);
            newTimers[laneIndex] = 0;
          }
        }
        
        return newTimers;
      });
    }, 100);

    return () => clearInterval(laneSpawnInterval);
  }, [gameState, spawnObstacleInLane]);

  // Drifting child target
  useEffect(() => {
    if (gameState !== 'playing') return;

    const childDriftInterval = setInterval(() => {
      setChildTarget(prev => {
        let newX = prev.x + (prev.direction * 30); // Slow drift
        let newDirection = prev.direction;
        
        // Bounce off edges
        if (newX <= 50) {
          newX = 50;
          newDirection = 1;
        } else if (newX >= CANVAS_WIDTH - 50) {
          newX = CANVAS_WIDTH - 50;
          newDirection = -1;
        }
        
        return { x: newX, direction: newDirection };
      });
    }, 500);

    return () => clearInterval(childDriftInterval);
  }, [gameState]);

  // FPS monitoring and adaptive performance
  useEffect(() => {
    if (gameState !== 'playing') return;

    const fpsInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastFpsUpdate;
      
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        setFpsCounter(currentFps);
        
        // Adaptive performance - reduce particles if FPS drops
        if (currentFps < 50) {
          setParticles(prev => prev.slice(0, Math.floor(MAX_PARTICLES * 0.6)));
        }
        
        setFrameCount(0);
        setLastFpsUpdate(now);
      }
    }, 100);

    return () => clearInterval(fpsInterval);
  }, [gameState, frameCount, lastFpsUpdate]);

  // Optimized main game loop with frame counting
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      gameLoop();
      setFrameCount(prev => prev + 1);
    }, 16); // ~60fps

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // Pre-render static background for performance
  const renderStaticBackground = useCallback(() => {
    if (!backgroundLayerRef.current) {
      backgroundLayerRef.current = document.createElement('canvas');
      backgroundLayerRef.current.width = CANVAS_WIDTH;
      backgroundLayerRef.current.height = CANVAS_HEIGHT;
    }
    
    const bgCtx = backgroundLayerRef.current.getContext('2d');
    if (!bgCtx) return;

    // Storybook-style layered playground panorama
    const skyGradient = bgCtx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.6);
    skyGradient.addColorStop(0, '#E6F3FF'); // Soft watercolor sky
    skyGradient.addColorStop(0.5, '#FFF8DC'); // Warm cream
    skyGradient.addColorStop(1, '#F0F8E8'); // Pastel green
    bgCtx.fillStyle = skyGradient;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.6);

    // Far background - school building silhouettes
    bgCtx.fillStyle = 'rgba(180, 200, 220, 0.4)';
    bgCtx.fillRect(CANVAS_WIDTH * 0.1, CANVAS_HEIGHT * 0.1, CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.15);
    bgCtx.fillRect(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.08, CANVAS_WIDTH * 0.25, CANVAS_HEIGHT * 0.18);
    
    // Add simple roof triangles
    bgCtx.beginPath();
    bgCtx.moveTo(CANVAS_WIDTH * 0.08, CANVAS_HEIGHT * 0.1);
    bgCtx.lineTo(CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.05);
    bgCtx.lineTo(CANVAS_WIDTH * 0.32, CANVAS_HEIGHT * 0.1);
    bgCtx.fill();

    // Mid-layer - preschool facades
    bgCtx.fillStyle = '#FFE4B5'; // Warm peach
    bgCtx.fillRect(CANVAS_WIDTH * 0.05, CANVAS_HEIGHT * 0.3, CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.2);
    bgCtx.fillStyle = '#E6E6FA'; // Lavender
    bgCtx.fillRect(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.32, CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.18);
    
    // Playground surface with watercolor texture
    const playgroundGradient = bgCtx.createLinearGradient(0, CANVAS_HEIGHT * 0.5, 0, CANVAS_HEIGHT);
    playgroundGradient.addColorStop(0, '#F5F5DC'); // Beige
    playgroundGradient.addColorStop(0.3, '#DDD8C0'); // Warm sand  
    playgroundGradient.addColorStop(1, '#C8B99C'); // Deeper sand
    bgCtx.fillStyle = playgroundGradient;
    bgCtx.fillRect(0, CANVAS_HEIGHT * 0.5, CANVAS_WIDTH, CANVAS_HEIGHT * 0.5);

    // Add chalk drawing elements scattered around
    bgCtx.strokeStyle = 'rgba(255, 182, 193, 0.6)'; // Light pink chalk
    bgCtx.lineWidth = 3;
    bgCtx.beginPath();
    bgCtx.arc(CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.65, 20, 0, Math.PI * 2);
    bgCtx.stroke();
    
    // Chalk flower
    bgCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow chalk
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      bgCtx.beginPath();
      bgCtx.arc(CANVAS_WIDTH * 0.8 + Math.cos(angle) * 15, CANVAS_HEIGHT * 0.7 + Math.sin(angle) * 15, 8, 0, Math.PI * 2);
      bgCtx.stroke();
    }
    
    // Draw horizontal lane markings
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    bgCtx.lineWidth = 1;
    LANE_Y_POSITIONS.forEach((laneY, index) => {
      // Lane zones
      if (index === 0) {
        bgCtx.fillStyle = 'rgba(50, 205, 50, 0.2)';
        bgCtx.fillRect(0, laneY - 10, CANVAS_WIDTH, LANE_HEIGHT);
      } else if (index === LANE_COUNT - 1) {
        bgCtx.fillStyle = 'rgba(100, 149, 237, 0.2)';
        bgCtx.fillRect(0, laneY - 10, CANVAS_WIDTH, LANE_HEIGHT);
      } else {
        bgCtx.fillStyle = index % 2 === 0 ? 'rgba(128, 128, 128, 0.1)' : 'rgba(64, 64, 64, 0.1)';
        bgCtx.fillRect(0, laneY - 10, CANVAS_WIDTH, LANE_HEIGHT);
      }
      
      // Lane divider lines
      bgCtx.beginPath();
      bgCtx.moveTo(0, laneY + LANE_HEIGHT / 2);
      bgCtx.lineTo(CANVAS_WIDTH, laneY + LANE_HEIGHT / 2);
      bgCtx.stroke();
    });
    
    setBackgroundRendered(true);
  }, []);

  // Initialize background
  useEffect(() => {
    if (gameState === 'playing' && !backgroundRendered) {
      renderStaticBackground();
    }
  }, [gameState, backgroundRendered, renderStaticBackground]);

  // Optimized canvas rendering with static background blitting
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Apply screen shake
      ctx.save();
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // Blit pre-rendered background for performance
      if (backgroundLayerRef.current) {
        ctx.drawImage(backgroundLayerRef.current, 0, 0);
      }

      // Storybook-style teacher avatar with rounded corners and warm colors
      const teacherColor = stickerStormActive ? '#FFD700' : teamRallyActive ? '#DA70D6' : '#4682B4'; // Warm blue
      const animationOffset = Math.sin(Date.now() * 0.005) * 2; // Gentle bob animation
      
      // Teacher body - rounded rectangle with soft corners
      ctx.fillStyle = teacherColor;
      ctx.shadowColor = stickerStormActive || teamRallyActive ? teacherColor : 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = stickerStormActive || teamRallyActive ? 12 : 4;
      ctx.shadowOffsetY = 2;
      
      // Main body with rounded corners
      ctx.beginPath();
      ctx.roundRect(player.x, player.y + animationOffset, player.width, player.height - 8, 8);
      ctx.fill();
      
      // Oversized friendly head
      ctx.fillStyle = '#FDBCB4'; // Warm peach skin tone
      ctx.beginPath();
      ctx.arc(player.x + player.width/2, player.y - 5 + animationOffset, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Polka-dot neck scarf
      ctx.fillStyle = '#FF6B6B'; // Soft red
      ctx.fillRect(player.x + 8, player.y + 20 + animationOffset, player.width - 16, 8);
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(player.x + 12, player.y + 24 + animationOffset, 2, 0, Math.PI * 2);
      ctx.arc(player.x + 20, player.y + 24 + animationOffset, 2, 0, Math.PI * 2);
      ctx.arc(player.x + 28, player.y + 24 + animationOffset, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Friendly facial features with high contrast
      ctx.fillStyle = '#000';
      // Eyes with slight animation
      const eyeOffset = Math.sin(Date.now() * 0.003) * 0.5;
      ctx.beginPath();
      ctx.arc(player.x + player.width/2 - 6 + eyeOffset, player.y - 8 + animationOffset, 2, 0, Math.PI * 2);
      ctx.arc(player.x + player.width/2 + 6 - eyeOffset, player.y - 8 + animationOffset, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Smiling mouth
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + player.width/2, player.y - 2 + animationOffset, 6, 0, Math.PI);
      ctx.stroke();
      
      // Cartoon loafers that "slide" with motion feedback
      ctx.fillStyle = '#8B4513'; // Brown
      ctx.fillRect(player.x + 2, player.y + player.height - 6 + animationOffset, 12, 6);
      ctx.fillRect(player.x + player.width - 14, player.y + player.height - 6 + animationOffset, 12, 6);

      // Storybook-style charming obstacles with personality
      obstacles.forEach(obstacle => {
        const bounceOffset = Math.sin(Date.now() * 0.008 + obstacle.id) * 1; // Gentle bounce animation
        
        if (obstacle.type === 'car') {
          // Shiny 2-tone car with googly headlights
          const carGradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
          carGradient.addColorStop(0, '#FF6B6B'); // Bright red
          carGradient.addColorStop(1, '#CC5555'); // Darker red
          ctx.fillStyle = carGradient;
          
          // Car body with rounded corners
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacle.y + bounceOffset, obstacle.width, obstacle.height - 4, 6);
          ctx.fill();
          
          // Googly headlights
          ctx.fillStyle = '#FFFACD'; // Light yellow
          ctx.beginPath();
          ctx.arc(obstacle.x + 8, obstacle.y + 8 + bounceOffset, 6, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width - 8, obstacle.y + 8 + bounceOffset, 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Pupils that "look" at player
          ctx.fillStyle = '#000';
          const lookX = (player.x - obstacle.x) * 0.02;
          ctx.beginPath();
          ctx.arc(obstacle.x + 8 + Math.max(-2, Math.min(2, lookX)), obstacle.y + 8 + bounceOffset, 2, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width - 8 + Math.max(-2, Math.min(2, lookX)), obstacle.y + 8 + bounceOffset, 2, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (obstacle.type === 'bike') {
          // Yellow tricycle with smiling face
          ctx.fillStyle = '#FFD700'; // Golden yellow
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacle.y + bounceOffset, obstacle.width, obstacle.height, 4);
          ctx.fill();
          
          // Wheels
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(obstacle.x + 6, obstacle.y + obstacle.height - 2 + bounceOffset, 4, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width - 6, obstacle.y + obstacle.height - 2 + bounceOffset, 4, 0, Math.PI * 2);
          ctx.stroke();
          
          // Smiling face on front
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2 - 3, obstacle.y + 6 + bounceOffset, 1, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width/2 + 3, obstacle.y + 6 + bounceOffset, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + 10 + bounceOffset, 3, 0, Math.PI);
          ctx.stroke();
          
        } else if (obstacle.type === 'stroller') {
          // Pastel stroller with oversized wheels
          ctx.fillStyle = '#DDA0DD'; // Plum
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacle.y + bounceOffset, obstacle.width, obstacle.height - 6, 4);
          ctx.fill();
          
          // Oversized wheels with rubbery wobble
          const wheelWobble = Math.sin(Date.now() * 0.01 + obstacle.id) * 0.5;
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.ellipse(obstacle.x + 6, obstacle.y + obstacle.height - 3 + bounceOffset, 5 + wheelWobble, 5 - wheelWobble, 0, 0, Math.PI * 2);
          ctx.ellipse(obstacle.x + obstacle.width - 6, obstacle.y + obstacle.height - 3 + bounceOffset, 5 - wheelWobble, 5 + wheelWobble, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Trailing pacifier icon
          ctx.fillStyle = '#FFB6C1'; // Light pink
          ctx.beginPath();
          ctx.arc(obstacle.x - 8, obstacle.y + obstacle.height/2 + bounceOffset, 3, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (obstacle.type === 'snack-cart') {
          // Mini-dessert trolley with pastels
          ctx.fillStyle = '#98FB98'; // Pale green
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacle.y + bounceOffset, obstacle.width, obstacle.height, 6);
          ctx.fill();
          
          // Dessert icons on top
          ctx.fillStyle = '#FF69B4'; // Hot pink donut
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + 4 + bounceOffset, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#98FB98';
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + 4 + bounceOffset, 2, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (obstacle.type === 'glitter-puddle') {
          // Sparkly puddle with animated glitter
          ctx.fillStyle = '#E6E6FA'; // Lavender
          ctx.beginPath();
          ctx.ellipse(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + bounceOffset, obstacle.width/2, obstacle.height/3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Animated sparkles
          for (let i = 0; i < 3; i++) {
            const sparkleTime = Date.now() * 0.01 + i * 2;
            const sparkleX = obstacle.x + (Math.sin(sparkleTime) + 1) * obstacle.width/2;
            const sparkleY = obstacle.y + (Math.cos(sparkleTime * 1.3) + 1) * obstacle.height/2 + bounceOffset;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          
        } else if (obstacle.type === 'runaway-child') {
          // Small green rounded child with bouncing pigtails
          ctx.fillStyle = '#32CD32'; // Lime green
          ctx.shadowColor = '#90EE90';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacle.y + bounceOffset, obstacle.width, obstacle.height - 4, 8);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Friendly child head
          ctx.fillStyle = '#FDBCB4'; // Peach skin
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y - 2 + bounceOffset, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Bouncing pigtails
          const pigtailBounce = Math.sin(Date.now() * 0.01 + obstacle.id) * 2;
          ctx.fillStyle = '#8B4513'; // Brown hair
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2 - 8, obstacle.y - 6 + bounceOffset + pigtailBounce, 3, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width/2 + 8, obstacle.y - 6 + bounceOffset - pigtailBounce, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Happy face
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2 - 3, obstacle.y - 4 + bounceOffset, 1, 0, Math.PI * 2);
          ctx.arc(obstacle.x + obstacle.width/2 + 3, obstacle.y - 4 + bounceOffset, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + bounceOffset, 2, 0, Math.PI);
          ctx.stroke();
        }
      });

      // Draw drifting child target at top lane
      const childY = LANE_Y_POSITIONS[0];
      const childPulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
      
      // Glowing goal child
      ctx.shadowColor = '#32CD32';
      ctx.shadowBlur = 15 * childPulse;
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(childTarget.x - 25, childY, 50, 40);
      ctx.shadowBlur = 0;
      
      // Child emoji with outline for visibility
      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 3;
      ctx.strokeText('👶', childTarget.x, childY + 25);
      ctx.fillText('👶', childTarget.x, childY + 25);
      
      // Goal indicator arrow
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(childTarget.x - 15, childY - 10);
      ctx.lineTo(childTarget.x, childY - 20);
      ctx.lineTo(childTarget.x + 15, childY - 10);
      ctx.fill();

      // Special zone indicators
      if (fireDrillActive) {
        // Fire drill warning
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeText('🚨 FIRE DRILL! 🚨', CANVAS_WIDTH / 2, 40);
        ctx.fillText('🚨 FIRE DRILL! 🚨', CANVAS_WIDTH / 2, 40);
      }

      if (slowMoLane !== null) {
        // Slow-mo zone indicator
        const laneY = LANE_Y_POSITIONS[slowMoLane];
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fillRect(0, laneY - 10, CANVAS_WIDTH, LANE_HEIGHT);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeText('⏱️ TIME-OUT ZONE', CANVAS_WIDTH / 2, laneY + 15);
        ctx.fillText('⏱️ TIME-OUT ZONE', CANVAS_WIDTH / 2, laneY + 15);
      }

      if (flowModeActive) {
        // Flow mode indicator
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('⚡ FLOW MODE! POINTS x2 ⚡', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
        ctx.fillText('⚡ FLOW MODE! POINTS x2 ⚡', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
      }

      // Draw power-ups with shimmering gold effect
      powerUps.forEach(powerUp => {
        // Animated shimmer effect
        const shimmer = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15 * shimmer;
        
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // Golden border for clarity
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.shadowBlur = 0;
        
        // Clear power-up icon
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        const iconX = powerUp.x + powerUp.width/2;
        const iconY = powerUp.y + powerUp.height/2 + 4;
        ctx.strokeText('⚡', iconX, iconY);
        ctx.fillText('⚡', iconX, iconY);
      });

      // Draw particle effects for satisfying feedback
      particles.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
      });
      ctx.globalAlpha = 1;

      // Draw collection effects with floating text
      collectionEffects.forEach(effect => {
        ctx.globalAlpha = effect.life;
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(effect.text, effect.x, effect.y);
        ctx.fillText(effect.text, effect.x, effect.y);
      });
      ctx.globalAlpha = 1;

      // Draw active power-up overlays with clear visual feedback
      if (timeSlowActive) {
        ctx.fillStyle = 'rgba(0, 170, 255, 0.15)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Time slow indicator
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#00AAFF';
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText('TIME SLOW ACTIVE', CANVAS_WIDTH/2, 30);
        ctx.fillText('TIME SLOW ACTIVE', CANVAS_WIDTH/2, 30);
      }
      
      if (stickerStormActive) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Invincibility indicator
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText('INVINCIBLE!', CANVAS_WIDTH/2, 30);
        ctx.fillText('INVINCIBLE!', CANVAS_WIDTH/2, 30);
      }
      
      if (teamRallyActive) {
        ctx.fillStyle = 'rgba(170, 0, 255, 0.15)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Speed boost indicator
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#AA00FF';
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText('SPEED BOOST!', CANVAS_WIDTH/2, 30);
        ctx.fillText('SPEED BOOST!', CANVAS_WIDTH/2, 30);
      }

      ctx.restore();
    };

    const animationId = requestAnimationFrame(function animate() {
      render();
      if (gameState === 'playing') {
        requestAnimationFrame(animate);
      }
    });

    return () => cancelAnimationFrame(animationId);
  }, [gameState, player, obstacles, powerUps, timeSlowActive, stickerStormActive, teamRallyActive]);

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

  // Game playing state with canvas
  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setGameState('paused')}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  <span className="font-semibold">Level {currentLevel + 1}</span>
                  <span className="text-gray-500 ml-2">Score: {score}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>{player.lives}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>{coins}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                {GAME_LEVELS[currentLevel]?.dialogue || "Chase the runaway children safely!"}
              </p>
            </div>
            
            <div className="relative bg-sky-200 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-gray-300 rounded-lg w-full max-w-4xl"
                style={{ imageRendering: 'pixelated' }}
              />
              
              <div className="absolute top-2 left-2 bg-white/90 rounded px-2 py-1 text-xs">
                Use WASD or Arrow Keys to move
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button
                onClick={() => setGameState('menu')}
                variant="outline"
                size="sm"
              >
                Exit Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game paused state
  if (gameState === 'paused') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Game Paused</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">Take a breather! Ready to continue?</p>
            <div className="space-x-4">
              <Button onClick={() => setGameState('playing')}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button onClick={() => setGameState('menu')} variant="outline">
                Exit to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question state
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-purple-800">Safety Quiz</CardTitle>
            <div className="text-center">
              <Badge variant="secondary">{currentQuestion.domain}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-900 mb-4">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className={`w-full text-left justify-start p-4 h-auto ${
                      selectedAnswer !== null
                        ? index === currentQuestion.correctAnswer
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : selectedAnswer === index
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'opacity-50'
                        : ''
                    }`}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="mr-3 font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
              
              {selectedAnswer !== null && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800">{currentQuestion.explanation}</p>
                  
                  <div className="mt-4 text-center">
                    <Button onClick={continueGame}>
                      Continue Adventure
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game over state
  if (gameState === 'game-over') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-800">Game Over!</CardTitle>
            <p className="text-red-600 mt-2">Don't worry - every expert started as a beginner!</p>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-red-800 mb-4">Final Score</h3>
              <div className="text-4xl font-bold text-red-600 mb-2">{score}</div>
              <p className="text-red-700">Level {currentLevel + 1} reached</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={startGame}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => setGameState('menu')}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Mission Accomplished!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600">
              You've successfully rescued all the children and proven your safety expertise!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-4">🎉 Achievement Unlocked!</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">{score}</p>
                  <p className="text-sm text-green-700">Final Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{coins}</p>
                  <p className="text-sm text-yellow-700">Coins Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">{GAME_LEVELS.length}</p>
                  <p className="text-sm text-purple-700">Levels Completed</p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={startGame}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 mr-4"
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

  // Fallback for any other states
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