import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;
const LANE_HEIGHT = 50;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const ROWS = Math.floor(CANVAS_HEIGHT / LANE_HEIGHT);
const PLAYER_START_ROW = ROWS - 2;
const SAFE_ZONE_ROW = Math.floor(ROWS / 2);

// Enhanced game interfaces
interface Player {
  row: number;
  col: number;
  lives: number;
  xp: number;
  isInvulnerable: boolean;
  hasShield: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  row: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'bike' | 'stroller' | 'snack-cart' | 'scooter' | 'meltdown-monster';
  color: string;
  size: 'small' | 'medium' | 'large';
}

interface PowerUp {
  id: number;
  x: number;
  row: number;
  type: 'shield' | 'turbo' | 'sticker-storm' | 'team-rally' | 'time-warp';
  color: string;
  collected: boolean;
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
}

interface GameStats {
  dodgeStreak: number;
  questionStreak: number;
  combos: number;
  totalDodges: number;
  perfectAnswers: number;
  coins: number;
  runTime: number;
}

interface SafetyQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Expanded safety questions for educational content
const safetyQuestions: SafetyQuestion[] = [
  {
    id: 1,
    question: "What should you do when a child has a meltdown in the classroom?",
    options: [
      "Ignore the child until they calm down",
      "Stay calm, get down to their level, and speak softly",
      "Remove the child from the room immediately",
      "Raise your voice to get their attention"
    ],
    correctAnswer: 1,
    explanation: "Staying calm and getting down to the child's level helps de-escalate the situation and shows empathy."
  },
  {
    id: 2,
    question: "How often should you count children during outdoor play?",
    options: [
      "Only at the beginning and end",
      "Every 15 minutes",
      "Every 5-10 minutes",
      "Only when moving to a new area"
    ],
    correctAnswer: 2,
    explanation: "Regular head counts every 5-10 minutes ensure all children are accounted for and safe."
  },
  {
    id: 3,
    question: "What should you do first when you notice a child is missing during outdoor play?",
    options: [
      "Call the police immediately",
      "Check all nearby areas and count remaining children",
      "Wait to see if they return on their own",
      "Continue activities as normal"
    ],
    correctAnswer: 1,
    explanation: "Immediately check all areas while securing remaining children, then follow emergency protocols if child is not found quickly."
  },
  {
    id: 4,
    question: "When should you wash your hands during a preschool day?",
    options: [
      "Only before meals",
      "Before meals and after using the bathroom",
      "Before meals, after bathroom, after playground, and when visibly dirty",
      "Only when they look dirty"
    ],
    correctAnswer: 2,
    explanation: "Frequent handwashing at key times prevents the spread of germs and illness."
  },
  {
    id: 5,
    question: "How should you respond to aggressive behavior between children?",
    options: [
      "Let them work it out themselves",
      "Separate them immediately and use calm, clear language",
      "Punish both children equally",
      "Ignore it unless someone gets hurt"
    ],
    correctAnswer: 1,
    explanation: "Quick intervention with calm guidance helps children learn appropriate conflict resolution."
  },
  {
    id: 6,
    question: "What is the most important safety rule for playground equipment?",
    options: [
      "Children can play on any equipment",
      "Only age-appropriate equipment should be used",
      "Equipment doesn't need regular inspection",
      "One adult can supervise unlimited children"
    ],
    correctAnswer: 1,
    explanation: "Age-appropriate equipment ensures children can play safely within their developmental abilities."
  },
  {
    id: 7,
    question: "How do you handle a child who refuses to follow safety rules?",
    options: [
      "Force them to comply immediately",
      "Use positive redirection and explain the safety reason",
      "Send them to timeout right away",
      "Let them learn from natural consequences"
    ],
    correctAnswer: 1,
    explanation: "Positive redirection with clear explanations helps children understand and internalize safety rules."
  },
  {
    id: 8,
    question: "What should you do if you suspect child abuse or neglect?",
    options: [
      "Investigate the situation yourself first",
      "Report immediately to appropriate authorities",
      "Talk to the parents directly",
      "Wait to see if it happens again"
    ],
    correctAnswer: 1,
    explanation: "Immediate reporting to proper authorities is legally required and protects the child's safety."
  },
  {
    id: 9,
    question: "How should art supplies be stored for safety?",
    options: [
      "All supplies accessible to children",
      "Toxic materials secured, safe supplies accessible",
      "Everything locked away from children",
      "Storage location doesn't matter"
    ],
    correctAnswer: 1,
    explanation: "Safe supplies should be accessible for creativity while hazardous materials must be secured."
  },
  {
    id: 10,
    question: "What is the best way to prevent choking during snack time?",
    options: [
      "Cut all foods into small pieces and supervise eating",
      "Let children eat however they want",
      "Only serve liquid foods",
      "Don't worry about food preparation"
    ],
    correctAnswer: 0,
    explanation: "Proper food preparation and active supervision during eating prevents choking incidents."
  },
  {
    id: 11,
    question: "When is it appropriate to leave children unsupervised?",
    options: [
      "During naptime if they're sleeping",
      "Never - children should always have adult supervision",
      "When they're playing quietly",
      "During bathroom breaks"
    ],
    correctAnswer: 1,
    explanation: "Continuous adult supervision is essential for child safety and regulatory compliance."
  },
  {
    id: 12,
    question: "How do you create a safe sleep environment for naptime?",
    options: [
      "Any comfortable position is fine",
      "Back sleeping, clear cribs, room temperature monitoring",
      "Stomach sleeping with extra blankets",
      "Sleep position doesn't matter for preschoolers"
    ],
    correctAnswer: 1,
    explanation: "Safe sleep practices reduce SIDS risk and ensure comfortable, secure rest periods."
  }
];

export default function FroggerGame(): JSX.Element {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>();
  const startTimeRef = useRef<number>();
  const lastObstacleSpawn = useRef<number>(0);
  const lastPowerUpSpawn = useRef<number>(0);
  
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'question' | 'levelComplete' | 'gameOver'>('menu');
  const [player, setPlayer] = useState<Player>({
    row: PLAYER_START_ROW,
    col: Math.floor(COLS / 2),
    lives: 3,
    xp: 0,
    isInvulnerable: false,
    hasShield: false
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
    runTime: 0
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
  
  // Points system integration
  const awardPoints = useCallback(async (points: number, reason: string) => {
    try {
      await apiRequest('/api/points/award', {
        method: 'POST',
        data: { 
          points, 
          reason,
          gameType: 'frogger-safety'
        }
      });
      
      toast({
        title: "Points Earned!",
        description: `+${points} points for ${reason}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }, [toast]);

  // Audio system using Web Audio API
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio not available');
    }
  }, []);

  // Enhanced question selection to prevent repetition
  const selectRandomQuestion = useCallback(() => {
    const availableQuestions = safetyQuestions.filter(q => !usedQuestions.has(q.id));
    
    // Reset used questions if all have been used
    if (availableQuestions.length === 0) {
      setUsedQuestions(new Set());
      return safetyQuestions[Math.floor(Math.random() * safetyQuestions.length)];
    }
    
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }, [usedQuestions]);

  // Enhanced collision detection with precise hitboxes
  const checkCollisions = useCallback(() => {
    if (player.isInvulnerable || player.hasShield) return;
    
    const playerLeft = player.col * GRID_SIZE + 5;
    const playerRight = playerLeft + GRID_SIZE - 10;
    const playerTop = player.row * LANE_HEIGHT + 5;
    const playerBottom = playerTop + LANE_HEIGHT - 10;
    
    for (const obstacle of obstacles) {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const obstacleTop = obstacle.row * LANE_HEIGHT;
      const obstacleBottom = obstacleTop + obstacle.height;
      
      if (playerLeft < obstacleRight && 
          playerRight > obstacleLeft && 
          playerTop < obstacleBottom && 
          playerBottom > obstacleTop) {
        
        // Collision detected
        playSound(200, 0.3, 'sawtooth');
        
        // Create impact particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 8; i++) {
          newParticles.push({
            id: Date.now() + i,
            x: playerLeft + GRID_SIZE / 2,
            y: playerTop + LANE_HEIGHT / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            maxLife: 30,
            color: '#FF4444',
            size: 3 + Math.random() * 2
          });
        }
        setParticles(prev => [...prev, ...newParticles]);
        
        // Reset streaks
        setStats(prev => ({ ...prev, dodgeStreak: 0, combos: 0 }));
        
        // Trigger safety question after collision (learning from mistakes)
        if (!currentQuestion && Math.random() < 0.7) {
          setTimeout(() => {
            const question = selectRandomQuestion();
            setCurrentQuestion(question);
            setTotalQuestions(prev => prev + 1);
            setGameState('question');
            playSound(800, 0.2, 'sine');
            
            toast({
              title: "Safety Reflection",
              description: "Learn from this mistake! Answer correctly to continue.",
              variant: "default"
            });
          }, 1000);
        }
        
        // Lose life and reset position
        setPlayer(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
            return prev;
          }
          
          // Make player invulnerable temporarily
          const timeoutId = window.setTimeout(() => {
            setPlayer(p => ({ ...p, isInvulnerable: false }));
          }, 2000);
          
          return {
            ...prev,
            lives: newLives,
            row: checkpoint,
            col: Math.floor(COLS / 2),
            isInvulnerable: true
          };
        });
        
        toast({
          title: "Collision!",
          description: `Lives remaining: ${player.lives - 1}`,
          variant: "destructive"
        });
        
        break;
      }
    }
  }, [player, obstacles, checkpoint, playSound, toast]);

  // Enhanced obstacle spawning with varied patterns
  const spawnObstacle = useCallback(() => {
    const now = Date.now();
    if (now - lastObstacleSpawn.current < 400 - (level * 30)) return;
    
    // Don't spawn on safe zones or player start row
    const availableRows = Array.from({ length: ROWS }, (_, i) => i)
      .filter(row => row !== 0 && row !== ROWS - 1 && row !== SAFE_ZONE_ROW && row !== player.row);
    
    if (availableRows.length === 0) return;
    
    const row = availableRows[Math.floor(Math.random() * availableRows.length)];
    const types = ['car', 'bike', 'stroller', 'snack-cart', 'scooter', 'meltdown-monster'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const sizes = ['small', 'medium', 'large'] as const;
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    const widthMap = { small: 30, medium: 50, large: 70 };
    const speedMap = { small: 2 + level * 0.5, medium: 1.5 + level * 0.3, large: 1 + level * 0.2 };
    
    const newObstacle: Obstacle = {
      id: Date.now() + Math.random(),
      x: row % 2 === 0 ? -widthMap[size] : CANVAS_WIDTH,
      row,
      width: widthMap[size],
      height: LANE_HEIGHT - 10,
      speed: (row % 2 === 0 ? 1 : -1) * speedMap[size],
      type,
      color: colors[Math.floor(Math.random() * colors.length)],
      size
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    lastObstacleSpawn.current = now;
  }, [level, player.row]);

  // Enhanced power-up spawning
  const spawnPowerUp = useCallback(() => {
    const now = Date.now();
    if (now - lastPowerUpSpawn.current < 5000) return;
    
    const availableRows = Array.from({ length: ROWS }, (_, i) => i)
      .filter(row => row !== 0 && row !== ROWS - 1);
    
    const row = availableRows[Math.floor(Math.random() * availableRows.length)];
    const types = ['shield', 'turbo', 'sticker-storm', 'team-rally', 'time-warp'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const colors = {
      shield: '#4169E1',
      turbo: '#FF4500',
      'sticker-storm': '#FFD700',
      'team-rally': '#32CD32',
      'time-warp': '#9370DB'
    };
    
    const newPowerUp: PowerUp = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 50) + 25,
      row,
      type,
      color: colors[type],
      collected: false
    };
    
    setPowerUps(prev => [...prev, newPowerUp]);
    lastPowerUpSpawn.current = now;
  }, []);

  // Enhanced rendering with modern Canvas techniques
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.3, '#98FB98');
    bgGradient.addColorStop(0.7, '#F0E68C');
    bgGradient.addColorStop(1, '#DDA0DD');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw lanes with enhanced visuals
    for (let row = 0; row < ROWS; row++) {
      const y = row * LANE_HEIGHT;
      
      // Lane background
      if (row === 0 || row === ROWS - 1) {
        ctx.fillStyle = '#228B22'; // Safe zones
      } else if (row === SAFE_ZONE_ROW) {
        ctx.fillStyle = '#FFD700'; // Checkpoint
      } else {
        ctx.fillStyle = row % 2 === 0 ? '#696969' : '#778899'; // Roads
      }
      ctx.fillRect(0, y, CANVAS_WIDTH, LANE_HEIGHT);
      
      // Lane markings
      if (row > 0 && row < ROWS - 1 && row !== SAFE_ZONE_ROW) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.lineDashOffset = -(Date.now() / 50) % 30;
        ctx.beginPath();
        ctx.moveTo(0, y + LANE_HEIGHT / 2);
        ctx.lineTo(CANVAS_WIDTH, y + LANE_HEIGHT / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Draw obstacles with enhanced graphics
    obstacles.forEach(obstacle => {
      const obstacleY = obstacle.row * LANE_HEIGHT + 5;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(obstacle.x + 2, obstacleY + 2, obstacle.width, obstacle.height);
      
      // Main obstacle with gradient
      const obstacleGradient = ctx.createLinearGradient(
        obstacle.x, obstacleY,
        obstacle.x + obstacle.width, obstacleY + obstacle.height
      );
      obstacleGradient.addColorStop(0, obstacle.color);
      obstacleGradient.addColorStop(0.5, '#FFFFFF');
      obstacleGradient.addColorStop(1, obstacle.color);
      
      ctx.fillStyle = obstacleGradient;
      ctx.fillRect(obstacle.x, obstacleY, obstacle.width, obstacle.height);
      
      // Obstacle icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      const icons = {
        car: '🚗', bike: '🚲', stroller: '🍼',
        'snack-cart': '🛒', scooter: '🛴', 'meltdown-monster': '👹'
      };
      ctx.fillText(
        icons[obstacle.type] || '⚫',
        obstacle.x + obstacle.width / 2,
        obstacleY + obstacle.height / 2 + 7
      );
    });
    
    // Draw power-ups with glow effects
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      const powerUpY = powerUp.row * LANE_HEIGHT + LANE_HEIGHT / 2;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(
        powerUp.x, powerUpY, 0,
        powerUp.x, powerUpY, 25
      );
      glowGradient.addColorStop(0, powerUp.color + 'AA');
      glowGradient.addColorStop(1, powerUp.color + '00');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(powerUp.x - 25, powerUpY - 25, 50, 50);
      
      // Power-up icon
      ctx.fillStyle = powerUp.color;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUpY, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      const powerUpIcons = {
        shield: '🛡️', turbo: '🚀', 'sticker-storm': '⭐',
        'team-rally': '👥', 'time-warp': '🌀'
      };
      ctx.fillText(powerUpIcons[powerUp.type] || '⚡', powerUp.x, powerUpY + 5);
    });
    
    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw player with enhanced visuals
    const playerX = player.col * GRID_SIZE + GRID_SIZE / 2;
    const playerY = player.row * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(playerX + 2, playerY + 20, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shield effect
    if (player.hasShield) {
      ctx.strokeStyle = 'rgba(65, 105, 225, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -Date.now() / 50;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Player body
    const alpha = player.isInvulnerable && Math.floor(Date.now() / 100) % 2 ? 0.5 : 1;
    ctx.globalAlpha = alpha;
    
    const playerGradient = ctx.createRadialGradient(
      playerX - 5, playerY - 5, 0,
      playerX, playerY, 20
    );
    playerGradient.addColorStop(0, '#FFB6C1');
    playerGradient.addColorStop(1, '#FF69B4');
    
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Player face
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👩‍🏫', playerX, playerY + 7);
    
    ctx.globalAlpha = 1;
    
    // HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`Lives: ${player.lives}`, 120, 25);
    ctx.fillText(`Level: ${level}`, 200, 25);
    ctx.fillText(`XP: ${player.xp}`, 280, 25);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Streak: ${stats.dodgeStreak}`, CANVAS_WIDTH - 10, 25);
    
    // Question progress indicator
    if (totalQuestions > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Q: ${questionsCorrect}/${totalQuestions}`, CANVAS_WIDTH - 120, 25);
    }
    
  }, [obstacles, powerUps, particles, player, score, level, stats]);

  // Game loop with enhanced physics and mechanics
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // Update obstacles
    setObstacles(prev => prev.filter(obstacle => {
      obstacle.x += obstacle.speed;
      return obstacle.x > -100 && obstacle.x < CANVAS_WIDTH + 100;
    }));
    
    // Update particles
    setParticles(prev => prev.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life--;
      return particle.life > 0;
    }));
    
    // Update buff timers
    setActiveBuffs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(buff => {
        updated[buff] -= 16; // ~60fps
        if (updated[buff] <= 0) {
          delete updated[buff];
        }
      });
      return updated;
    });
    
    // Spawn new obstacles and power-ups
    spawnObstacle();
    spawnPowerUp();
    
    // Check collisions
    checkCollisions();
    
    // Check level completion
    if (player.row <= 0) {
      setGameState('levelComplete');
      playSound(523, 0.5, 'sine'); // C5 note
      setScore(prev => prev + 100 * level);
      
      // Award points based on level (2-10 points, max 10 for completing all levels)
      const pointsEarned = Math.min(2 + level - 1, 10);
      awardPoints(pointsEarned, `Level ${level} Completion`);
      
      return;
    }
    
    // Check for checkpoint
    if (player.row <= SAFE_ZONE_ROW && checkpoint !== SAFE_ZONE_ROW) {
      setCheckpoint(SAFE_ZONE_ROW);
      toast({
        title: "Checkpoint!",
        description: "Progress saved",
        variant: "default"
      });
      playSound(659, 0.3, 'sine'); // E5 note
    }
    
    render();
  }, [gameState, player, spawnObstacle, spawnPowerUp, checkCollisions, render, level, checkpoint, playSound, toast]);

  // Input handling (keyboard and touch)
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const handleMovement = (newRow: number, newCol: number) => {
      // Movement sound
      playSound(440, 0.1, 'square');
      
      // Update dodge streak
      if (newRow !== player.row || newCol !== player.col) {
        setStats(prev => ({ ...prev, dodgeStreak: prev.dodgeStreak + 1, totalDodges: prev.totalDodges + 1 }));
      }
      
      setPlayer(prev => ({ ...prev, row: newRow, col: newCol }));
      
      // Questions no longer trigger from movement - will trigger from collisions instead
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      let newRow = player.row;
      let newCol = player.col;
      
      switch (e.key) {
        case 'ArrowUp':
          if (player.row > 0) newRow = player.row - 1;
          break;
        case 'ArrowDown':
          if (player.row < ROWS - 1) newRow = player.row + 1;
          break;
        case 'ArrowLeft':
          if (player.col > 0) newCol = player.col - 1;
          break;
        case 'ArrowRight':
          if (player.col < COLS - 1) newCol = player.col + 1;
          break;
        default:
          return;
      }
      
      e.preventDefault();
      handleMovement(newRow, newCol);
    };
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      // Minimum swipe distance to register movement
      const minSwipeDistance = 30;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && player.col < COLS - 1) {
            handleMovement(player.row, player.col + 1);
          } else if (deltaX < 0 && player.col > 0) {
            handleMovement(player.row, player.col - 1);
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY < 0 && player.row > 0) {
            handleMovement(player.row - 1, player.col);
          } else if (deltaY > 0 && player.row < ROWS - 1) {
            handleMovement(player.row + 1, player.col);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, player, currentQuestion, playSound]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const intervalId = window.setInterval(gameLoop, 16); // ~60fps
      gameLoopRef.current = intervalId;
      return () => {
        window.clearInterval(intervalId);
      };
    }
    return undefined;
  }, [gameState, gameLoop]);

  // Game control functions
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setPlayer({
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      lives: 3,
      xp: 0,
      isInvulnerable: false,
      hasShield: false
    });
    setCheckpoint(PLAYER_START_ROW);
    
    // Pre-spawn initial obstacles to prevent easy run-across
    const initialObstacles: Obstacle[] = [];
    for (let i = 2; i < ROWS - 2; i++) {
      if (i !== SAFE_ZONE_ROW) {
        const types = ['car', 'bike', 'stroller', 'snack-cart'] as const;
        const type = types[Math.floor(Math.random() * types.length)];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        
        initialObstacles.push({
          id: Date.now() + i,
          x: i % 2 === 0 ? Math.random() * CANVAS_WIDTH * 0.6 : CANVAS_WIDTH - (Math.random() * CANVAS_WIDTH * 0.6),
          row: i,
          width: 40,
          height: LANE_HEIGHT - 10,
          speed: (i % 2 === 0 ? 1 : -1) * (1.5 + Math.random()),
          type,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 'medium'
        });
      }
    }
    
    setObstacles(initialObstacles);
    setPowerUps([]);
    setParticles([]);
    setStats({
      dodgeStreak: 0,
      questionStreak: 0,
      combos: 0,
      totalDodges: 0,
      perfectAnswers: 0,
      coins: 0,
      runTime: 0
    });
    setActiveBuffs({});
    startTimeRef.current = Date.now();
    lastObstacleSpawn.current = Date.now();
  };

  const handleQuestionAnswer = (answerIndex: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    setQuestionResult(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      playSound(523, 0.3, 'sine');
      const bonusPoints = 100 + (stats.questionStreak * 25);
      const bonusXP = 20 + (stats.questionStreak * 5);
      
      setScore(prev => prev + bonusPoints);
      setPlayer(prev => ({ ...prev, xp: prev.xp + bonusXP }));
      setStats(prev => ({ ...prev, questionStreak: prev.questionStreak + 1, perfectAnswers: prev.perfectAnswers + 1 }));
      setQuestionsCorrect(prev => prev + 1);
      setUsedQuestions(prev => new Set([...prev, currentQuestion.id]));
      
      toast({
        title: "Excellent Safety Knowledge!",
        description: `+${bonusPoints} points, +${bonusXP} XP! Question streak: ${stats.questionStreak + 1}`,
        variant: "default"
      });
    } else {
      playSound(200, 0.3, 'sawtooth');
      setStats(prev => ({ ...prev, questionStreak: 0 }));
      
      toast({
        title: "Study This Safety Concept",
        description: "Review the explanation and try again next time!",
        variant: "destructive"
      });
    }
  };

  const continueAfterQuestion = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuestionResult(null);
    setGameState('playing');
  };

  const nextLevel = () => {
    const nextLevelNumber = level + 1;
    
    // Check if this is level 10 completion (maximum level for full game completion)
    if (level >= 10) {
      // Award maximum completion bonus for finishing all levels
      awardPoints(10, "Game Completion - All Levels Mastered");
      
      toast({
        title: "Game Master Achievement!",
        description: "You've completed all 10 levels! Maximum 10 points awarded.",
        variant: "default"
      });
      
      setGameState('gameOver');
      return;
    }
    
    setLevel(nextLevelNumber);
    setPlayer(prev => ({ ...prev, row: PLAYER_START_ROW, col: Math.floor(COLS / 2) }));
    setCheckpoint(PLAYER_START_ROW);
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setGameState('playing');
    
    // Reset spawn timer for new level
    lastObstacleSpawn.current = Date.now();
  };

  // Render game states
  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Preschool Dash</h1>
          <p className="text-lg text-gray-700 mb-8">
            Navigate safely through the preschool environment while learning important safety protocols!
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Game Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Grid-based Frogger gameplay</li>
                <li>• Educational safety questions</li>
                <li>• Power-ups and special abilities</li>
                <li>• Progressive difficulty levels</li>
                <li>• XP & achievement system</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">🎮 Controls:</h3>
              <ul className="text-sm text-amber-700 space-y-1 text-left">
                <li>• Arrow keys or swipe gestures to move</li>
                <li>• On-screen buttons available on mobile</li>
                <li>• Avoid obstacles crossing lanes</li>
                <li>• Collect power-ups for special abilities</li>
                <li>• Safety questions appear after collisions</li>
                <li>• Learn from mistakes with educational content</li>
                <li>• Reach the top to advance levels</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-75">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-4 border-4 border-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-600">🎯 Safety Challenge</h2>
            <div className="text-sm bg-yellow-100 px-3 py-1 rounded-full">
              Question {totalQuestions} • Streak: {stats.questionStreak}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-medium text-gray-800">{currentQuestion.question}</p>
          </div>
          
          {!showExplanation ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                💡 Choose the best answer to earn bonus XP and maintain your learning streak!
              </p>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionAnswer(index)}
                  className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all duration-200 font-medium"
                >
                  <span className="inline-block w-8 h-8 bg-blue-200 text-blue-800 rounded-full text-center leading-8 mr-3 font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className={`p-6 rounded-lg mb-6 text-center ${
                selectedAnswer === currentQuestion.correctAnswer 
                  ? 'bg-green-100 border-2 border-green-300' 
                  : 'bg-red-100 border-2 border-red-300'
              }`}>
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div>
                    <div className="text-2xl text-green-600 mb-2">🎉 Excellent!</div>
                    <div className="text-green-800 font-bold mb-2">
                      +{100 + (stats.questionStreak * 25)} Points, +{20 + (stats.questionStreak * 5)} XP
                    </div>
                    <div className="text-green-700">Question Streak: {stats.questionStreak + 1}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl text-red-600 mb-2">📚 Learning Opportunity</div>
                    <div className="text-red-800 font-bold">Review this safety concept</div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-bold text-gray-800 mb-2">Why this matters:</h4>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
              
              <button
                onClick={continueAfterQuestion}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Continue Playing
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'levelComplete') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">Level Complete!</h2>
          <p className="text-xl mb-6">Score: {score}</p>
          <button
            onClick={nextLevel}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            Next Level
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over</h2>
          <p className="text-xl mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Mobile controls component
  const MobileControls = () => {
    const handleDirectionalInput = (direction: 'up' | 'down' | 'left' | 'right') => {
      let newRow = player.row;
      let newCol = player.col;
      
      switch (direction) {
        case 'up':
          if (player.row > 0) newRow = player.row - 1;
          break;
        case 'down':
          if (player.row < ROWS - 1) newRow = player.row + 1;
          break;
        case 'left':
          if (player.col > 0) newCol = player.col - 1;
          break;
        case 'right':
          if (player.col < COLS - 1) newCol = player.col + 1;
          break;
      }
      
      if (newRow !== player.row || newCol !== player.col) {
        playSound(440, 0.1, 'square');
        setStats(prev => ({ ...prev, dodgeStreak: prev.dodgeStreak + 1, totalDodges: prev.totalDodges + 1 }));
        setPlayer(prev => ({ ...prev, row: newRow, col: newCol }));
        
        if (Math.random() < 0.1 && !currentQuestion) {
          const question = safetyQuestions[Math.floor(Math.random() * safetyQuestions.length)];
          setCurrentQuestion(question);
          setGameState('question');
        }
      }
    };

    return (
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="relative w-32 h-32">
          {/* Up button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionalInput('up'); }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
          >
            ↑
          </button>
          
          {/* Down button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionalInput('down'); }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
          >
            ↓
          </button>
          
          {/* Left button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionalInput('left'); }}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
          >
            ←
          </button>
          
          {/* Right button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionalInput('right'); }}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
          >
            →
          </button>
        </div>
        
        <div className="text-center mt-2 text-sm text-gray-600 bg-white px-2 py-1 rounded shadow">
          Tap to move
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-400 bg-white shadow-lg max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {gameState === 'playing' && <MobileControls />}
    </div>
  );
}