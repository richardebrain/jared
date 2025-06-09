import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Enhanced game constants
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const GRID_SIZE = 45;
const LANE_HEIGHT = 55;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const ROWS = Math.floor(CANVAS_HEIGHT / LANE_HEIGHT);
const PLAYER_START_ROW = ROWS - 2;
const SAFE_ZONE_ROW = Math.floor(ROWS / 2);
const GOAL_ROW = 1;

// Enhanced interfaces with new features
interface Player {
  row: number;
  col: number;
  lives: number;
  xp: number;
  isInvulnerable: boolean;
  hasShield: boolean;
  animationFrame: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  row: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'bike' | 'stroller' | 'snack-cart' | 'scooter' | 'meltdown-monster' | 'bus';
  color: string;
  size: 'small' | 'medium' | 'large';
  animationFrame: number;
  trail: Array<{x: number, opacity: number}>;
}

interface PowerUp {
  id: number;
  x: number;
  row: number;
  type: 'shield' | 'turbo' | 'sticker-storm' | 'team-rally' | 'time-warp' | 'extra-life';
  color: string;
  collected: boolean;
  pulsePhase: number;
  sparkles: Array<{x: number, y: number, life: number}>;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'circle' | 'star' | 'heart' | 'spark';
}

interface GameStats {
  dodgeStreak: number;
  questionStreak: number;
  combos: number;
  totalDodges: number;
  perfectAnswers: number;
  coins: number;
  runTime: number;
  maxCombo: number;
  safetyScore: number;
}

interface SafetyQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'supervision' | 'safety' | 'emergency' | 'health' | 'behavior';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Expanded categorized safety questions
const safetyQuestions: SafetyQuestion[] = [
  // Supervision Category
  {
    id: 1,
    question: "What is the appropriate adult-to-child ratio for 3-year-olds during outdoor play?",
    options: ["1:15", "1:10", "1:7", "1:5"],
    correctAnswer: 2,
    explanation: "A 1:7 ratio ensures adequate supervision for 3-year-olds' safety and developmental needs.",
    category: 'supervision',
    difficulty: 'easy'
  },
  {
    id: 2,
    question: "How often should you visually scan the playground during active supervision?",
    options: ["Every 30 seconds", "Every 2 minutes", "Every 5 minutes", "Only when children call for help"],
    correctAnswer: 0,
    explanation: "Active supervision requires continuous visual scanning every 30 seconds to identify potential risks.",
    category: 'supervision',
    difficulty: 'medium'
  },
  {
    id: 3,
    question: "When should you intervene in children's play for safety reasons?",
    options: ["Only after an injury occurs", "When you see potential danger developing", "Never interrupt natural play", "Only if parents request it"],
    correctAnswer: 1,
    explanation: "Proactive intervention prevents injuries by addressing dangerous situations before they escalate.",
    category: 'supervision',
    difficulty: 'easy'
  },

  // Safety Category
  {
    id: 4,
    question: "What is the safest way to transport a group of preschoolers to the playground?",
    options: ["Let them run freely", "Use a walking rope or hold hands in pairs", "Single file line only", "Adults carry all children"],
    correctAnswer: 1,
    explanation: "Walking ropes or hand-holding pairs keep children together while allowing safe, supervised movement.",
    category: 'safety',
    difficulty: 'easy'
  },
  {
    id: 5,
    question: "How should playground equipment be checked before children use it?",
    options: ["Visual inspection for hazards, sharp edges, and stability", "Only check if children complain", "Equipment doesn't need daily checks", "Parents should check equipment"],
    correctAnswer: 0,
    explanation: "Daily visual inspections identify potential hazards before children are exposed to danger.",
    category: 'safety',
    difficulty: 'medium'
  },
  {
    id: 6,
    question: "What should you do if you notice broken glass on the playground?",
    options: ["Let children play around it", "Remove children from area and clean up immediately", "Point it out to children to avoid", "Wait until after playtime to clean"],
    correctAnswer: 1,
    explanation: "Immediate removal of children and hazard cleanup prevents injuries from sharp objects.",
    category: 'safety',
    difficulty: 'easy'
  },

  // Emergency Category
  {
    id: 7,
    question: "What is your first action if a child goes missing during outdoor play?",
    options: ["Call parents immediately", "Search alone quietly", "Alert other staff and begin systematic search", "Wait 10 minutes to see if they return"],
    correctAnswer: 2,
    explanation: "Immediate team response ensures thorough, organized search while maintaining supervision of other children.",
    category: 'emergency',
    difficulty: 'hard'
  },
  {
    id: 8,
    question: "How should you respond to a child's serious injury on the playground?",
    options: ["Move child immediately", "Stay with child, call for help, don't move unless necessary", "Send child to nurse alone", "Continue activities normally"],
    correctAnswer: 1,
    explanation: "Staying with the injured child while getting help ensures proper care without causing additional harm.",
    category: 'emergency',
    difficulty: 'medium'
  },
  {
    id: 9,
    question: "What information should you document after a playground incident?",
    options: ["Nothing, incidents happen", "Just the child's name", "Time, location, witnesses, injuries, actions taken", "Only if parents ask"],
    correctAnswer: 2,
    explanation: "Thorough documentation protects children, staff, and provides important information for prevention.",
    category: 'emergency',
    difficulty: 'hard'
  },

  // Health Category
  {
    id: 10,
    question: "When should children wash hands during outdoor play transitions?",
    options: ["Only if visibly dirty", "Before snacks and after playground time", "Once at the end of the day", "Handwashing isn't necessary outdoors"],
    correctAnswer: 1,
    explanation: "Regular handwashing prevents disease transmission, especially important before eating.",
    category: 'health',
    difficulty: 'easy'
  },
  {
    id: 11,
    question: "How should you handle a child's scraped knee on the playground?",
    options: ["Ignore minor scrapes", "Clean wound, apply bandage, document incident", "Send child home immediately", "Put dirt on it to 'toughen them up'"],
    correctAnswer: 1,
    explanation: "Proper wound care prevents infection while documentation ensures proper communication with parents.",
    category: 'health',
    difficulty: 'medium'
  },
  {
    id: 12,
    question: "What should you do if a child shows signs of heat exhaustion?",
    options: ["Continue activities in shade", "Move to cool area, offer water, monitor closely", "Send child to run around more", "Ignore mild symptoms"],
    correctAnswer: 1,
    explanation: "Immediate cooling and hydration prevent heat exhaustion from becoming dangerous heat stroke.",
    category: 'health',
    difficulty: 'hard'
  },

  // Behavior Category
  {
    id: 13,
    question: "How should you handle aggressive behavior on the playground?",
    options: ["Let children work it out", "Immediately separate children and address behavior calmly", "Punish all involved children", "Ignore unless someone gets hurt"],
    correctAnswer: 1,
    explanation: "Quick, calm intervention teaches appropriate behavior while ensuring all children's safety.",
    category: 'behavior',
    difficulty: 'medium'
  },
  {
    id: 14,
    question: "What's the best way to redirect unsafe playground behavior?",
    options: ["Yell to get attention", "Use positive language and suggest safer alternatives", "Remove child from playground", "Threaten consequences"],
    correctAnswer: 1,
    explanation: "Positive redirection teaches safety while maintaining children's engagement and self-esteem.",
    category: 'behavior',
    difficulty: 'easy'
  },
  {
    id: 15,
    question: "How do you encourage inclusive play among children with different abilities?",
    options: ["Separate children by ability", "Adapt activities so all can participate safely", "Focus only on typical children", "Avoid playground time for children with disabilities"],
    correctAnswer: 1,
    explanation: "Inclusive adaptation ensures all children can play safely while learning acceptance and cooperation.",
    category: 'behavior',
    difficulty: 'hard'
  }
];

export default function EnhancedFroggerGame(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>();
  const startTimeRef = useRef<number>();
  const lastObstacleSpawn = useRef<number>(0);
  const lastPowerUpSpawn = useRef<number>(0);
  const animationFrame = useRef<number>(0);
  
  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me')
  });
  
  // Enhanced game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'question' | 'levelComplete' | 'gameOver' | 'paused'>('menu');
  const [player, setPlayer] = useState<Player>({
    row: PLAYER_START_ROW,
    col: Math.floor(COLS / 2),
    lives: 3,
    xp: 0,
    isInvulnerable: false,
    hasShield: false,
    animationFrame: 0,
    direction: 'up',
    isMoving: false
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [stats, setStats] = useState<GameStats>({
    dodgeStreak: 0,
    questionStreak: 0,
    combos: 0,
    totalDodges: 0,
    perfectAnswers: 0,
    coins: 0,
    runTime: 0,
    maxCombo: 0,
    safetyScore: 0
  });
  
  // Enhanced question system
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const [questionResult, setQuestionResult] = useState<'correct' | 'incorrect' | null>(null);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Enhanced visual effects
  const [activeBuffs, setActiveBuffs] = useState<Record<string, number>>({});
  const [checkpoint, setCheckpoint] = useState(PLAYER_START_ROW);
  const [screenShake, setScreenShake] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showComboText, setShowComboText] = useState(false);
  
  // Enhanced audio system
  const audioContext = useRef<AudioContext | null>(null);
  
  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      try {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.log('Audio not available');
      }
    }
  }, []);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    if (!audioContext.current) return;
    
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
      
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);
    } catch (error) {
      console.log('Audio playback failed');
    }
  }, []);

  // Enhanced points system
  const awardPoints = useCallback(async (points: number, reason: string) => {
    try {
      await apiRequest('/api/points/award', {
        method: 'POST',
        data: { 
          points: Math.floor(points * comboMultiplier), 
          reason: `${reason} (x${comboMultiplier} combo)`,
          gameType: 'enhanced-frogger-safety'
        }
      });
      
      toast({
        title: "Points Earned!",
        description: `+${Math.floor(points * comboMultiplier)} points for ${reason}`,
        variant: "default"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }, [toast, queryClient, comboMultiplier]);

  // Enhanced movement with smooth animations
  const handleMovement = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing' || player.isMoving) return;
    
    let newRow = player.row;
    let newCol = player.col;
    
    switch (direction) {
      case 'up':
        newRow = Math.max(0, player.row - 1);
        break;
      case 'down':
        newRow = Math.min(ROWS - 1, player.row + 1);
        break;
      case 'left':
        newCol = Math.max(0, player.col - 1);
        break;
      case 'right':
        newCol = Math.min(COLS - 1, player.col + 1);
        break;
    }
    
    if (newRow !== player.row || newCol !== player.col) {
      setPlayer(prev => ({ 
        ...prev, 
        row: newRow, 
        col: newCol, 
        direction,
        isMoving: true,
        animationFrame: 0
      }));
      
      // Enhanced audio feedback
      playSound(220 + newRow * 15, 0.1, 'sine', 0.05);
      
      // Enhanced particle effects
      createParticles(
        newCol * GRID_SIZE + GRID_SIZE / 2, 
        newRow * LANE_HEIGHT + LANE_HEIGHT / 2, 
        '#4CAF50', 
        8,
        'circle'
      );
      
      // Movement animation timeout
      setTimeout(() => {
        setPlayer(prev => ({ ...prev, isMoving: false }));
      }, 150);
      
      // Check for goal completion
      if (newRow === GOAL_ROW) {
        playSound(523, 0.4, 'square', 0.2);
        const levelBonus = 100 + level * 50;
        setScore(prev => prev + levelBonus);
        setPlayer(prev => ({ ...prev, xp: prev.xp + 25 }));
        awardPoints(levelBonus, 'level completion');
        
        if (level < 5) {
          nextLevel();
        } else {
          setGameState('levelComplete');
        }
        return;
      }
      
      // Enhanced checkpoint system
      if (newRow === SAFE_ZONE_ROW && newRow < checkpoint) {
        setCheckpoint(newRow);
        playSound(349, 0.3, 'triangle', 0.15);
        createParticles(
          newCol * GRID_SIZE + GRID_SIZE / 2, 
          newRow * LANE_HEIGHT + LANE_HEIGHT / 2, 
          '#FFD700', 
          15,
          'star'
        );
        toast({ title: "Checkpoint!", description: "Progress saved - great job!" });
        awardPoints(25, 'checkpoint reached');
      }
      
      // Enhanced combo system
      if (Math.abs(newRow - player.row) === 1 && newRow !== GOAL_ROW) {
        setStats(prev => {
          const newDodgeStreak = prev.dodgeStreak + 1;
          const newCombos = prev.combos + 1;
          const newMaxCombo = Math.max(prev.maxCombo, newCombos);
          
          // Calculate combo multiplier
          if (newCombos >= 10) {
            setComboMultiplier(3);
            setShowComboText(true);
            setTimeout(() => setShowComboText(false), 2000);
          } else if (newCombos >= 5) {
            setComboMultiplier(2);
          } else {
            setComboMultiplier(1);
          }
          
          // Special effects for streak milestones
          if (newDodgeStreak % 10 === 0) {
            playSound(440, 0.5, 'sawtooth', 0.2);
            createParticles(
              newCol * GRID_SIZE + GRID_SIZE / 2, 
              newRow * LANE_HEIGHT + LANE_HEIGHT / 2, 
              '#FF6B6B', 
              20,
              'heart'
            );
            toast({ 
              title: "Amazing Streak!", 
              description: `${newDodgeStreak} moves without collision!` 
            });
          }
          
          return {
            ...prev,
            dodgeStreak: newDodgeStreak,
            combos: newCombos,
            totalDodges: prev.totalDodges + 1,
            maxCombo: newMaxCombo
          };
        });
      }
    }
  }, [gameState, player, checkpoint, playSound, awardPoints, level]);

  // Enhanced keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'question') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMovement('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMovement('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMovement('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMovement('right');
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          if (gameState === 'playing') {
            setGameState('paused');
          } else if (gameState === 'paused') {
            setGameState('playing');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMovement]);

  // Enhanced particle system
  const createParticles = useCallback((
    x: number, 
    y: number, 
    color: string, 
    count: number = 10,
    type: Particle['type'] = 'circle'
  ) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 60,
        maxLife: 60,
        color: color,
        size: 2 + Math.random() * 4,
        type: type
      });
    }
    setParticles(prev => [...prev.slice(-50), ...newParticles]); // Limit particles for performance
  }, []);

  // Enhanced question selection with difficulty progression
  const selectRandomQuestion = useCallback(() => {
    const difficultyLevels: SafetyQuestion['difficulty'][] = 
      level <= 2 ? ['easy'] : 
      level <= 4 ? ['easy', 'medium'] : 
      ['easy', 'medium', 'hard'];
    
    const availableQuestions = safetyQuestions.filter(q => 
      !usedQuestions.has(q.id) && difficultyLevels.includes(q.difficulty)
    );
    
    if (availableQuestions.length === 0) {
      setUsedQuestions(new Set());
      return safetyQuestions.filter(q => difficultyLevels.includes(q.difficulty))[0];
    }
    
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }, [usedQuestions, level]);

  // Enhanced collision detection with precise hitboxes
  const checkCollisions = useCallback(() => {
    if (player.isInvulnerable || player.hasShield) return;
    
    const playerCenterX = player.col * GRID_SIZE + GRID_SIZE / 2;
    const playerCenterY = player.row * LANE_HEIGHT + LANE_HEIGHT / 2;
    const playerRadius = GRID_SIZE / 3; // Smaller hitbox for better gameplay
    
    // Check obstacle collisions
    for (const obstacle of obstacles) {
      const obstacleCenterX = obstacle.x + obstacle.width / 2;
      const obstacleCenterY = obstacle.row * LANE_HEIGHT + obstacle.height / 2;
      const obstacleRadius = Math.min(obstacle.width, obstacle.height) / 2;
      
      const distance = Math.sqrt(
        Math.pow(playerCenterX - obstacleCenterX, 2) + 
        Math.pow(playerCenterY - obstacleCenterY, 2)
      );
      
      if (distance < playerRadius + obstacleRadius) {
        // Collision detected
        handleCollision(obstacle);
        break;
      }
    }
    
    // Check power-up collections
    powerUps.forEach(powerUp => {
      if (!powerUp.collected && player.row === powerUp.row) {
        const powerUpCenterX = powerUp.x + 15;
        const distance = Math.abs(playerCenterX - powerUpCenterX);
        
        if (distance < GRID_SIZE / 2) {
          collectPowerUp(powerUp);
        }
      }
    });
  }, [player, obstacles, powerUps]);

  // Enhanced collision handling
  const handleCollision = useCallback((obstacle: Obstacle) => {
    playSound(200, 0.4, 'sawtooth', 0.3);
    
    // Screen shake effect
    setScreenShake(10);
    setTimeout(() => setScreenShake(0), 200);
    
    // Enhanced impact particles
    const playerX = player.col * GRID_SIZE + GRID_SIZE / 2;
    const playerY = player.row * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    createParticles(playerX, playerY, '#FF4444', 15, 'spark');
    createParticles(obstacle.x + obstacle.width / 2, obstacle.row * LANE_HEIGHT + obstacle.height / 2, obstacle.color, 10, 'circle');
    
    // Reset combo system
    setStats(prev => ({ ...prev, dodgeStreak: 0, combos: 0 }));
    setComboMultiplier(1);
    
    // Trigger educational question (70% chance)
    if (!currentQuestion && Math.random() < 0.7) {
      setTimeout(() => {
        const question = selectRandomQuestion();
        setCurrentQuestion(question);
        setTotalQuestions(prev => prev + 1);
        setGameState('question');
        playSound(800, 0.3, 'sine', 0.15);
        
        toast({
          title: "Safety Learning Moment",
          description: "Learn from this experience! Answer correctly to continue safely.",
          variant: "default"
        });
      }, 1000);
    }
    
    // Handle life loss and respawn
    setPlayer(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        setGameState('gameOver');
        return prev;
      }
      
      // Temporary invulnerability
      setTimeout(() => {
        setPlayer(p => ({ ...p, isInvulnerable: false }));
      }, 2500);
      
      return {
        ...prev,
        lives: newLives,
        row: checkpoint,
        col: Math.floor(COLS / 2),
        isInvulnerable: true,
        direction: 'up'
      };
    });
    
    toast({
      title: "Safety Collision!",
      description: `Lives remaining: ${player.lives - 1}. Stay focused!`,
      variant: "destructive"
    });
  }, [player, checkpoint, playSound, toast, currentQuestion, selectRandomQuestion]);

  // Enhanced power-up collection
  const collectPowerUp = useCallback((powerUp: PowerUp) => {
    setPowerUps(prev => prev.map(p => 
      p.id === powerUp.id ? { ...p, collected: true } : p
    ));
    
    applyPowerUp(powerUp.type);
    
    // Enhanced collection effects
    const playerX = player.col * GRID_SIZE + GRID_SIZE / 2;
    const playerY = player.row * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    createParticles(powerUp.x + 15, powerUp.row * LANE_HEIGHT + 15, powerUp.color, 20, 'star');
    playSound(523, 0.3, 'square', 0.2);
    
    awardPoints(50, `${powerUp.type} collection`);
  }, [player, awardPoints]);

  // Enhanced power-up effects
  const applyPowerUp = useCallback((type: PowerUp['type']) => {
    switch (type) {
      case 'shield':
        setPlayer(prev => ({ ...prev, hasShield: true, isInvulnerable: true }));
        setActiveBuffs(prev => ({ ...prev, shield: 6000 })); // 6 seconds
        toast({
          title: "Safety Shield Activated!",
          description: "Protected from all hazards for 6 seconds!",
          variant: "default"
        });
        break;
        
      case 'turbo':
        setStats(prev => ({ ...prev, dodgeStreak: prev.dodgeStreak + 10 }));
        setScore(prev => prev + 300);
        toast({
          title: "Turbo Boost!",
          description: "+300 points and +10 streak bonus!",
          variant: "default"
        });
        break;
        
      case 'sticker-storm':
        setPlayer(prev => ({ ...prev, xp: prev.xp + 100 }));
        setScore(prev => prev + 250);
        setStats(prev => ({ ...prev, safetyScore: prev.safetyScore + 25 }));
        toast({
          title: "Sticker Storm!",
          description: "+250 points, +100 XP, and safety bonus!",
          variant: "default"
        });
        break;
        
      case 'team-rally':
        setPlayer(prev => ({ ...prev, lives: Math.min(prev.lives + 1, 5) }));
        toast({
          title: "Team Rally Support!",
          description: "Extra life from your teaching team!",
          variant: "default"
        });
        break;
        
      case 'time-warp':
        setObstacles(prev => prev.map(obs => ({ ...obs, speed: obs.speed * 0.4 })));
        setActiveBuffs(prev => ({ ...prev, timeWarp: 4000 })); // 4 seconds
        setTimeout(() => {
          setObstacles(prev => prev.map(obs => ({ ...obs, speed: obs.speed / 0.4 })));
        }, 4000);
        toast({
          title: "Time Warp!",
          description: "Everything slowed down for 4 seconds!",
          variant: "default"
        });
        break;
        
      case 'extra-life':
        setPlayer(prev => ({ ...prev, lives: Math.min(prev.lives + 2, 6) }));
        toast({
          title: "Extra Lives!",
          description: "+2 lives! Safety first approach!",
          variant: "default"
        });
        break;
    }
  }, [toast]);

  // Enhanced obstacle spawning with patterns
  const spawnObstacle = useCallback(() => {
    const now = Date.now();
    const spawnInterval = Math.max(200, 600 - (level * 80)); // Faster spawning as level increases
    
    if (now - lastObstacleSpawn.current < spawnInterval) return;
    
    // Don't spawn on safe zones or near player
    const availableRows = Array.from({ length: ROWS }, (_, i) => i)
      .filter(row => 
        row !== 0 && 
        row !== ROWS - 1 && 
        row !== SAFE_ZONE_ROW && 
        Math.abs(row - player.row) > 1
      );
    
    if (availableRows.length === 0) return;
    
    const row = availableRows[Math.floor(Math.random() * availableRows.length)];
    const types = ['car', 'bike', 'stroller', 'snack-cart', 'scooter', 'meltdown-monster', 'bus'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const sizes = ['small', 'medium', 'large'] as const;
    const sizeWeights = [0.4, 0.4, 0.2]; // Favor smaller obstacles
    const randomWeight = Math.random();
    let size: typeof sizes[number] = 'small';
    if (randomWeight > 0.4) size = 'medium';
    if (randomWeight > 0.8) size = 'large';
    
    const colorPalettes = {
      car: ['#FF6B6B', '#FF8E53', '#FF6B9D'],
      bike: ['#4ECDC4', '#45B7D1', '#96CEB4'],
      stroller: ['#DDA0DD', '#C8A2C8', '#BA55D3'],
      'snack-cart': ['#32CD32', '#90EE90', '#98FB98'],
      scooter: ['#FF8C00', '#FFA500', '#FFB347'],
      'meltdown-monster': ['#8B0000', '#DC143C', '#B22222'],
      bus: ['#FFD700', '#FFA500', '#FF8C00']
    };
    
    const colors = colorPalettes[type];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const widthMap = { 
      small: type === 'bus' ? 60 : 35, 
      medium: type === 'bus' ? 80 : 55, 
      large: type === 'bus' ? 100 : 75 
    };
    
    const baseSpeed = 1.5 + (level * 0.4);
    const speedVariation = 0.7 + Math.random() * 0.8;
    const finalSpeed = baseSpeed * speedVariation;
    
    const direction = row % 2 === 0 ? 1 : -1;
    
    const newObstacle: Obstacle = {
      id: Date.now() + Math.random(),
      x: direction > 0 ? -widthMap[size] : CANVAS_WIDTH,
      row,
      width: widthMap[size],
      height: LANE_HEIGHT - 8,
      speed: finalSpeed * direction,
      type,
      color,
      size,
      animationFrame: 0,
      trail: []
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    lastObstacleSpawn.current = now;
  }, [level, player.row]);

  // Enhanced power-up spawning
  const spawnPowerUp = useCallback(() => {
    const now = Date.now();
    if (now - lastPowerUpSpawn.current < 8000) return; // Every 8 seconds
    
    const availableRows = Array.from({ length: ROWS }, (_, i) => i)
      .filter(row => row !== 0 && row !== ROWS - 1 && row !== player.row);
    
    const row = availableRows[Math.floor(Math.random() * availableRows.length)];
    const types = ['shield', 'turbo', 'sticker-storm', 'team-rally', 'time-warp', 'extra-life'] as const;
    
    // Weight power-ups based on game state
    let type: PowerUp['type'];
    if (player.lives <= 1) {
      type = Math.random() < 0.6 ? 'extra-life' : 'team-rally';
    } else if (stats.combos >= 5) {
      type = Math.random() < 0.4 ? 'turbo' : 'sticker-storm';
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    const colors = {
      shield: '#4169E1',
      turbo: '#FF4500',
      'sticker-storm': '#FFD700',
      'team-rally': '#32CD32',
      'time-warp': '#9370DB',
      'extra-life': '#FF69B4'
    };
    
    const newPowerUp: PowerUp = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 60) + 30,
      row,
      type,
      color: colors[type],
      collected: false,
      pulsePhase: 0,
      sparkles: []
    };
    
    setPowerUps(prev => [...prev, newPowerUp]);
    lastPowerUpSpawn.current = now;
  }, [player, stats]);

  // Enhanced rendering with modern graphics
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save context for screen shake
    ctx.save();
    if (screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * screenShake,
        (Math.random() - 0.5) * screenShake
      );
    }
    
    // Enhanced gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.2, '#98FB98');
    bgGradient.addColorStop(0.4, '#F0E68C');
    bgGradient.addColorStop(0.6, '#DDA0DD');
    bgGradient.addColorStop(0.8, '#FFB6C1');
    bgGradient.addColorStop(1, '#E6E6FA');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw enhanced lane markings
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    for (let i = 1; i < ROWS; i++) {
      const y = i * LANE_HEIGHT;
      
      // Special styling for safe zones
      if (i === SAFE_ZONE_ROW) {
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
      } else if (i === GOAL_ROW + 1) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
      } else {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
      }
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Draw safe zone background
    ctx.fillStyle = 'rgba(50, 205, 50, 0.2)';
    ctx.fillRect(0, SAFE_ZONE_ROW * LANE_HEIGHT, CANVAS_WIDTH, LANE_HEIGHT);
    
    // Draw goal zone background
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, LANE_HEIGHT * 2);
    
    // Enhanced obstacle rendering with trails and animations
    obstacles.forEach(obstacle => {
      // Update trail
      obstacle.trail.push({ x: obstacle.x + obstacle.width / 2, opacity: 1 });
      obstacle.trail = obstacle.trail
        .map(t => ({ ...t, opacity: t.opacity - 0.05 }))
        .filter(t => t.opacity > 0)
        .slice(-8);
      
      // Draw trail
      obstacle.trail.forEach((trail, index) => {
        ctx.fillStyle = `${obstacle.color}${Math.floor(trail.opacity * 255).toString(16).padStart(2, '0')}`;
        const size = (obstacle.height / 4) * trail.opacity;
        ctx.fillRect(
          trail.x - size / 2,
          obstacle.row * LANE_HEIGHT + obstacle.height / 2 - size / 2,
          size,
          size
        );
      });
      
      // Enhanced obstacle rendering
      const x = obstacle.x;
      const y = obstacle.row * LANE_HEIGHT + (LANE_HEIGHT - obstacle.height) / 2;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x + 2, y + 2, obstacle.width, obstacle.height);
      
      // Main body with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + obstacle.height);
      gradient.addColorStop(0, obstacle.color);
      gradient.addColorStop(0.5, obstacle.color);
      gradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, obstacle.width, obstacle.height);
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, y, obstacle.width, obstacle.height / 3);
      
      // Type-specific details
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      
      const centerX = x + obstacle.width / 2;
      const centerY = y + obstacle.height / 2 + 4;
      
      switch (obstacle.type) {
        case 'car':
          ctx.fillText('🚗', centerX, centerY);
          break;
        case 'bike':
          ctx.fillText('🚲', centerX, centerY);
          break;
        case 'stroller':
          ctx.fillText('👶', centerX, centerY);
          break;
        case 'snack-cart':
          ctx.fillText('🍎', centerX, centerY);
          break;
        case 'scooter':
          ctx.fillText('🛴', centerX, centerY);
          break;
        case 'bus':
          ctx.fillText('🚌', centerX, centerY);
          break;
        case 'meltdown-monster':
          ctx.fillText('😤', centerX, centerY);
          break;
      }
      
      obstacle.animationFrame = (obstacle.animationFrame + 1) % 60;
    });
    
    // Enhanced power-up rendering with sparkles
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      // Update sparkles
      if (Math.random() < 0.3) {
        powerUp.sparkles.push({
          x: powerUp.x + Math.random() * 30,
          y: powerUp.row * LANE_HEIGHT + Math.random() * LANE_HEIGHT,
          life: 30
        });
      }
      
      powerUp.sparkles = powerUp.sparkles
        .map(s => ({ ...s, life: s.life - 1 }))
        .filter(s => s.life > 0);
      
      // Draw sparkles
      powerUp.sparkles.forEach(sparkle => {
        const alpha = sparkle.life / 30;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(sparkle.x, sparkle.y, 2, 2);
      });
      
      // Pulsing effect
      powerUp.pulsePhase = (powerUp.pulsePhase + 0.1) % (Math.PI * 2);
      const pulseScale = 1 + Math.sin(powerUp.pulsePhase) * 0.2;
      
      const size = 30 * pulseScale;
      const x = powerUp.x + 15 - size / 2;
      const y = powerUp.row * LANE_HEIGHT + LANE_HEIGHT / 2 - size / 2;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(
        powerUp.x + 15, powerUp.row * LANE_HEIGHT + LANE_HEIGHT / 2, 0,
        powerUp.x + 15, powerUp.row * LANE_HEIGHT + LANE_HEIGHT / 2, size
      );
      glowGradient.addColorStop(0, `${powerUp.color}80`);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
      
      // Power-up body
      ctx.fillStyle = powerUp.color;
      ctx.fillRect(x, y, size, size);
      
      // Icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      
      const iconMap = {
        shield: '🛡️',
        turbo: '⚡',
        'sticker-storm': '⭐',
        'team-rally': '👥',
        'time-warp': '⏰',
        'extra-life': '❤️'
      };
      
      ctx.fillText(
        iconMap[powerUp.type],
        powerUp.x + 15,
        powerUp.row * LANE_HEIGHT + LANE_HEIGHT / 2 + 6
      );
    });
    
    // Enhanced player rendering with animations
    const playerX = player.col * GRID_SIZE;
    const playerY = player.row * LANE_HEIGHT + (LANE_HEIGHT - GRID_SIZE) / 2;
    
    // Player glow when invulnerable
    if (player.isInvulnerable) {
      const glowSize = GRID_SIZE + 10;
      const glowGradient = ctx.createRadialGradient(
        playerX + GRID_SIZE / 2, playerY + GRID_SIZE / 2, 0,
        playerX + GRID_SIZE / 2, playerY + GRID_SIZE / 2, glowSize / 2
      );
      glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(
        playerX - 5, playerY - 5,
        glowSize, glowSize
      );
    }
    
    // Shield effect
    if (player.hasShield) {
      const shieldGradient = ctx.createRadialGradient(
        playerX + GRID_SIZE / 2, playerY + GRID_SIZE / 2, 0,
        playerX + GRID_SIZE / 2, playerY + GRID_SIZE / 2, GRID_SIZE
      );
      shieldGradient.addColorStop(0, 'rgba(65, 105, 225, 0.3)');
      shieldGradient.addColorStop(0.8, 'rgba(65, 105, 225, 0.7)');
      shieldGradient.addColorStop(1, 'rgba(65, 105, 225, 0.1)');
      
      ctx.fillStyle = shieldGradient;
      ctx.fillRect(playerX - 10, playerY - 10, GRID_SIZE + 20, GRID_SIZE + 20);
    }
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(playerX + 2, playerY + 2, GRID_SIZE, GRID_SIZE);
    
    // Player body with movement animation
    const moveOffset = player.isMoving ? Math.sin(player.animationFrame * 0.3) * 2 : 0;
    
    const playerGradient = ctx.createLinearGradient(
      playerX, playerY,
      playerX, playerY + GRID_SIZE
    );
    playerGradient.addColorStop(0, '#4CAF50');
    playerGradient.addColorStop(0.6, '#2E7D32');
    playerGradient.addColorStop(1, '#1B5E20');
    
    ctx.fillStyle = playerGradient;
    ctx.fillRect(
      playerX + moveOffset, 
      playerY + moveOffset, 
      GRID_SIZE, 
      GRID_SIZE
    );
    
    // Player face based on direction
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    
    const directionEmojis = {
      up: '😊',
      down: '😐',
      left: '😏',
      right: '😎'
    };
    
    ctx.fillText(
      directionEmojis[player.direction],
      playerX + GRID_SIZE / 2 + moveOffset,
      playerY + GRID_SIZE / 2 + 8 + moveOffset
    );
    
    // Enhanced particle rendering
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      switch (particle.type) {
        case 'circle':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'star':
          drawStar(ctx, particle.x, particle.y, size, particle.color);
          break;
          
        case 'heart':
          drawHeart(ctx, particle.x, particle.y, size, particle.color);
          break;
          
        case 'spark':
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(particle.x - size, particle.y);
          ctx.lineTo(particle.x + size, particle.y);
          ctx.moveTo(particle.x, particle.y - size);
          ctx.lineTo(particle.x, particle.y + size);
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    });
    
    // Combo multiplier display
    if (showComboText && comboMultiplier > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      const text = `${comboMultiplier}x COMBO!`;
      ctx.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    ctx.restore();
  }, [
    obstacles, powerUps, particles, player, screenShake, 
    showComboText, comboMultiplier
  ]);

  // Helper functions for particle shapes
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const outerRadius = size;
      const innerRadius = size * 0.4;
      
      if (i === 0) {
        ctx.moveTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);
      } else {
        ctx.lineTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);
      }
      
      const innerAngle = angle + Math.PI / 5;
      ctx.lineTo(x + Math.cos(innerAngle) * innerRadius, y + Math.sin(innerAngle) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x - size / 2, y - size / 4, x - size / 4, y);
    ctx.quadraticCurveTo(x, y + size / 4, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y - size / 4, x, y + size / 4);
    ctx.fill();
  };

  // Enhanced game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const currentTime = Date.now();
    animationFrame.current++;
    
    // Update obstacle positions and animations
    setObstacles(prev => prev
      .map(obstacle => ({
        ...obstacle,
        x: obstacle.x + obstacle.speed,
        animationFrame: (obstacle.animationFrame + 1) % 60
      }))
      .filter(obstacle => 
        obstacle.x > -obstacle.width - 50 && 
        obstacle.x < CANVAS_WIDTH + 50
      )
    );
    
    // Update power-up animations
    setPowerUps(prev => prev
      .filter(powerUp => !powerUp.collected)
      .map(powerUp => ({
        ...powerUp,
        pulsePhase: (powerUp.pulsePhase + 0.1) % (Math.PI * 2)
      }))
    );
    
    // Update particles
    setParticles(prev => prev
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 1,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98
      }))
      .filter(particle => particle.life > 0)
    );
    
    // Update active buffs
    setActiveBuffs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] -= 16; // ~60fps
        if (updated[key] <= 0) {
          delete updated[key];
          
          // Remove buff effects
          if (key === 'shield') {
            setPlayer(p => ({ ...p, hasShield: false, isInvulnerable: false }));
          }
        }
      });
      return updated;
    });
    
    // Update player animation
    if (player.isMoving) {
      setPlayer(prev => ({
        ...prev,
        animationFrame: (prev.animationFrame + 1) % 30
      }));
    }
    
    // Spawn obstacles and power-ups
    spawnObstacle();
    spawnPowerUp();
    
    // Update stats
    setStats(prev => ({
      ...prev,
      runTime: currentTime - (startTimeRef.current || currentTime)
    }));
    
    checkCollisions();
    render();
  }, [
    gameState, spawnObstacle, spawnPowerUp, checkCollisions, 
    render, player.isMoving
  ]);

  // Game loop effect
  useEffect(() => {
    if (gameState === 'playing') {
      const intervalId = window.setInterval(gameLoop, 16); // ~60fps
      gameLoopRef.current = intervalId;
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [gameState, gameLoop]);

  // Next level progression
  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setPlayer(prev => ({
      ...prev,
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      xp: prev.xp + 50,
      isInvulnerable: false,
      hasShield: false,
      direction: 'up'
    }));
    setCheckpoint(PLAYER_START_ROW);
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setActiveBuffs({});
    setStats(prev => ({ ...prev, combos: 0, dodgeStreak: 0 }));
    setComboMultiplier(1);
    
    toast({
      title: `Level ${level + 1} Unlocked!`,
      description: "New challenges await. Stay safe out there!",
      variant: "default"
    });
    
    awardPoints(100 + level * 25, `Level ${level} completion`);
  }, [level, toast, awardPoints]);

  // Start game function
  const startGame = async () => {
    if (!user || user.points < 1) {
      toast({
        title: "Insufficient Points",
        description: "You need 1 point to play this enhanced safety game!",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest('/api/points/spend', {
        method: 'POST',
        data: { 
          points: 1, 
          reason: "Enhanced Frogger Safety Game",
          gameType: 'enhanced-frogger-safety'
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      initAudio();
      setGameState('playing');
      setScore(0);
      setLevel(1);
      setPlayer({
        row: PLAYER_START_ROW,
        col: Math.floor(COLS / 2),
        lives: 3,
        xp: 0,
        isInvulnerable: false,
        hasShield: false,
        animationFrame: 0,
        direction: 'up',
        isMoving: false
      });
      setObstacles([]);
      setPowerUps([]);
      setParticles([]);
      setStats({
        dodgeStreak: 0,
        questionStreak: 0,
        combos: 0,
        totalDodges: 0,
        perfectAnswers: 0,
        coins: 0,
        runTime: 0,
        maxCombo: 0,
        safetyScore: 0
      });
      setUsedQuestions(new Set());
      setQuestionsCorrect(0);
      setTotalQuestions(0);
      setCheckpoint(PLAYER_START_ROW);
      setActiveBuffs({});
      setComboMultiplier(1);
      startTimeRef.current = Date.now();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Answer question function
  const answerQuestion = useCallback((answerIndex: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    setQuestionResult(isCorrect ? 'correct' : 'incorrect');
    setShowExplanation(true);
    
    if (isCorrect) {
      setQuestionsCorrect(prev => prev + 1);
      setStats(prev => ({ 
        ...prev, 
        perfectAnswers: prev.perfectAnswers + 1,
        questionStreak: prev.questionStreak + 1,
        safetyScore: prev.safetyScore + (currentQuestion.difficulty === 'hard' ? 15 : currentQuestion.difficulty === 'medium' ? 10 : 5)
      }));
      
      const points = currentQuestion.difficulty === 'hard' ? 100 : currentQuestion.difficulty === 'medium' ? 75 : 50;
      setScore(prev => prev + points);
      awardPoints(points, `Correct ${currentQuestion.difficulty} safety question`);
      
      playSound(523, 0.3, 'square', 0.2);
      
      toast({
        title: "Excellent Safety Knowledge!",
        description: `+${points} points for correct answer!`,
        variant: "default"
      });
    } else {
      setStats(prev => ({ ...prev, questionStreak: 0 }));
      playSound(200, 0.5, 'sawtooth', 0.15);
      
      toast({
        title: "Learning Opportunity",
        description: "Review the explanation to improve your safety knowledge.",
        variant: "destructive"
      });
    }
    
    setUsedQuestions(prev => new Set([...prev, currentQuestion.id]));
    
    setTimeout(() => {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionResult(null);
      setGameState('playing');
    }, 3000);
  }, [currentQuestion, awardPoints, playSound, toast]);

  // Render the game
  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Playground Safety Frogger
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Navigate safely through the playground while learning crucial safety principles
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Game Stats HUD */}
          {gameState !== 'menu' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="text-center">
                <div className="text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-blue-600">{score.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Level</div>
                <div className="text-2xl font-bold text-purple-600">{level}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Lives</div>
                <div className="text-2xl font-bold text-red-600">
                  {'❤️'.repeat(player.lives)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Streak</div>
                <div className="text-2xl font-bold text-green-600">{stats.dodgeStreak}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Combo</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.combos} <span className="text-sm">x{comboMultiplier}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Safety Score</div>
                <div className="text-2xl font-bold text-indigo-600">{stats.safetyScore}</div>
              </div>
            </div>
          )}
          
          {/* Active Buffs Display */}
          {Object.keys(activeBuffs).length > 0 && (
            <div className="flex gap-2 justify-center">
              {Object.entries(activeBuffs).map(([buff, time]) => (
                <Badge key={buff} variant="secondary" className="px-3 py-1">
                  {buff.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {Math.ceil(time / 1000)}s
                </Badge>
              ))}
            </div>
          )}
          
          {/* Main Game Canvas */}
          <div className="flex justify-center">
            <div className="relative border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block"
              />
              
              {/* Game State Overlays */}
              {gameState === 'menu' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
                  <h2 className="text-4xl font-bold mb-4">Enhanced Playground Safety</h2>
                  <p className="text-lg mb-6 text-center max-w-md">
                    Master advanced safety navigation while learning crucial playground supervision skills!
                  </p>
                  <div className="space-y-4 text-center mb-6">
                    <div>🎯 Enhanced graphics and animations</div>
                    <div>🧠 Advanced educational content</div>
                    <div>⚡ Power-ups and combo system</div>
                    <div>🏆 Progressive difficulty levels</div>
                  </div>
                  <Button onClick={startGame} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Start Enhanced Game (1 Point)
                  </Button>
                  <div className="mt-4 text-sm opacity-75">
                    Use Arrow Keys or WASD to move • Space/Escape to pause
                  </div>
                </div>
              )}
              
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
                  <h2 className="text-3xl font-bold mb-4">Game Paused</h2>
                  <Button onClick={() => setGameState('playing')} size="lg">
                    Resume Game
                  </Button>
                  <div className="mt-4 text-sm opacity-75">
                    Press Space or Escape to resume
                  </div>
                </div>
              )}
              
              {gameState === 'gameOver' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
                  <h2 className="text-4xl font-bold mb-4">Game Over</h2>
                  <div className="grid grid-cols-2 gap-6 mb-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</div>
                      <div className="text-sm">Final Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{stats.maxCombo}</div>
                      <div className="text-sm">Max Combo</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{questionsCorrect}/{totalQuestions}</div>
                      <div className="text-sm">Questions Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{stats.safetyScore}</div>
                      <div className="text-sm">Safety Score</div>
                    </div>
                  </div>
                  <Button onClick={startGame} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Play Again (1 Point)
                  </Button>
                </div>
              )}
              
              {gameState === 'levelComplete' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
                  <h2 className="text-4xl font-bold mb-4 text-yellow-400">All Levels Complete!</h2>
                  <div className="text-xl mb-6">Congratulations! You've mastered playground safety!</div>
                  <div className="grid grid-cols-2 gap-6 mb-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</div>
                      <div className="text-sm">Final Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{stats.perfectAnswers}</div>
                      <div className="text-sm">Perfect Answers</div>
                    </div>
                  </div>
                  <Button onClick={startGame} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Play Again (1 Point)
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Question Modal */}
          {gameState === 'question' && currentQuestion && (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={
                    currentQuestion.difficulty === 'hard' ? 'destructive' : 
                    currentQuestion.difficulty === 'medium' ? 'default' : 
                    'secondary'
                  }>
                    {currentQuestion.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{currentQuestion.category}</Badge>
                  Safety Knowledge Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">{currentQuestion.question}</p>
                
                {!showExplanation ? (
                  <div className="grid gap-2">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4"
                        onClick={() => answerQuestion(index)}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      questionResult === 'correct' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {questionResult === 'correct' ? '✅' : '❌'}
                        </span>
                        <span className="font-bold">
                          {questionResult === 'correct' ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm">{currentQuestion.explanation}</p>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500">
                      Returning to game in a moment...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Game Instructions */}
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Enhanced Game Features</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-2">🎮 Enhanced Controls</h4>
                <ul className="text-sm space-y-1">
                  <li>• Arrow Keys or WASD to move</li>
                  <li>• Space/Escape to pause</li>
                  <li>• Smooth grid-based movement</li>
                  <li>• Visual feedback for all actions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">⚡ Power-Up System</h4>
                <ul className="text-sm space-y-1">
                  <li>• 🛡️ Shield: Temporary protection</li>
                  <li>• ⚡ Turbo: Score and streak boost</li>
                  <li>• ⭐ Sticker Storm: XP and points</li>
                  <li>• 👥 Team Rally: Extra life</li>
                  <li>• ⏰ Time Warp: Slow obstacles</li>
                  <li>• ❤️ Extra Life: +2 lives bonus</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">🏆 Scoring System</h4>
                <ul className="text-sm space-y-1">
                  <li>• Combo multipliers for streaks</li>
                  <li>• Difficulty-based question points</li>
                  <li>• Level completion bonuses</li>
                  <li>• Safety knowledge scoring</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">📚 Educational Content</h4>
                <ul className="text-sm space-y-1">
                  <li>• 15 categorized safety questions</li>
                  <li>• Progressive difficulty levels</li>
                  <li>• Detailed explanations</li>
                  <li>• Real-world safety scenarios</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}