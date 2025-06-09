import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Enhanced game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE); // 20 columns
const ROWS = 13;
const LANE_HEIGHT = CANVAS_HEIGHT / ROWS;
const PLAYER_START_ROW = ROWS - 2;
const GOAL_ROW = 1;
const SAFE_ZONE_ROW = Math.floor(ROWS / 2);

// Enhanced gameplay constants
const COMBO_THRESHOLD = 5;
const QUESTION_STREAK_THRESHOLD = 3;
const PRAISE_POWER_DURATION = 5000;
const POWER_UP_DURATION = 3000;

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
  oscillating?: boolean;
  oscillateOffset?: number;
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

interface LaneConfig {
  type: 'rush-hour' | 'slow-mo' | 'power-up' | 'quiz-gate' | 'normal';
  spawnInterval: number;
  speedMultiplier: number;
  lastSpawn: number;
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

const safetyQuestions: SafetyQuestion[] = [
  {
    id: 1,
    question: "What should you do when a child runs toward the gate?",
    options: ["Chase after them", "Call their name loudly", "Stay calm and redirect gently", "Ignore it"],
    correctAnswer: 2,
    explanation: "Staying calm and redirecting gently helps maintain a safe environment while teaching appropriate behavior."
  },
  {
    id: 2,
    question: "How do you ensure all children are accounted for during outdoor time?",
    options: ["Count heads occasionally", "Use a buddy system", "Take regular attendance", "Trust they'll stay close"],
    correctAnswer: 2,
    explanation: "Taking regular attendance ensures no child is left behind or missing during transitions."
  }
];

export default function FroggerGame() {
  // const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(0);
  
  // Enhanced game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'question' | 'gameOver' | 'levelComplete' | 'endless'>('menu');
  const [gameMode, setGameMode] = useState<'normal' | 'endless' | 'timeAttack' | 'dailyChallenge'>('normal');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Enhanced player with new abilities
  const [player, setPlayer] = useState<Player>({
    row: PLAYER_START_ROW,
    col: Math.floor(COLS / 2),
    lives: 3,
    xp: 0,
    isInvulnerable: false,
    hasShield: false
  });
  
  const [checkpoint, setCheckpoint] = useState(PLAYER_START_ROW);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Enhanced lane system with procedural types
  const [laneConfigs, setLaneConfigs] = useState<LaneConfig[]>(() => {
    return Array.from({ length: ROWS }, (_, i) => {
      if (i === 0 || i === ROWS - 1 || i === SAFE_ZONE_ROW) {
        return { type: 'normal', spawnInterval: 0, speedMultiplier: 0, lastSpawn: 0 };
      }
      
      const types: LaneConfig['type'][] = ['normal', 'rush-hour', 'slow-mo', 'power-up'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      return {
        type: randomType,
        spawnInterval: 1000 + Math.random() * 2000, // 1-3 seconds
        speedMultiplier: randomType === 'rush-hour' ? 1.5 : randomType === 'slow-mo' ? 0.7 : 1,
        lastSpawn: 0
      };
    });
  });
  
  const [laneDirections] = useState<number[]>(() => {
    return Array.from({ length: ROWS }, (_, i) => {
      if (i === 0 || i === ROWS - 1 || i === SAFE_ZONE_ROW) return 0; // Safe zones
      return i % 2 === 0 ? 1 : -1; // Alternate directions
    });
  });
  
  // Game stats and progression
  const [stats, setStats] = useState<GameStats>({
    dodgeStreak: 0,
    questionStreak: 0,
    combos: 0,
    totalDodges: 0,
    perfectAnswers: 0,
    coins: 0,
    runTime: 0
  });
  
  // Power-up states
  const [praisePowerActive, setPraisePowerActive] = useState(false);
  const [praisePowerTimer, setPraisePowerTimer] = useState(0);
  const [activeBuffs, setActiveBuffs] = useState<{[key: string]: number}>({});
  
  // Question system
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Audio feedback
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Grid-based movement system
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || keysRef.current.has(e.key)) return;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      keysRef.current.add(e.key);
      
      let newRow = player.row;
      let newCol = player.col;
      
      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, player.row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(ROWS - 1, player.row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, player.col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(COLS - 1, player.col + 1);
          break;
      }
      
      if (newRow !== player.row || newCol !== player.col) {
        setPlayer(prev => ({ ...prev, row: newRow, col: newCol }));
        playSound(220, 50);
        
        // Check for goal
        if (newRow === GOAL_ROW) {
          playSound(523, 200, 'square');
          setScore(prev => prev + 100);
          setGameState('levelComplete');
        }
        
        // Update checkpoint
        if (newRow === SAFE_ZONE_ROW && newRow < checkpoint) {
          setCheckpoint(newRow);
          playSound(349, 100);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, player, checkpoint, playSound]);

  // Enhanced obstacle spawning with procedural variety
  const spawnObstacle = useCallback((row: number) => {
    if (laneDirections[row] === 0) return; // Skip safe zones
    
    const laneConfig = laneConfigs[row];
    const obstacleTypes = ['car', 'bike', 'stroller', 'snack-cart', 'scooter'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as Obstacle['type'];
    
    // Enhanced obstacle properties
    const sizes: Obstacle['size'][] = ['small', 'medium', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const sizeMultiplier = size === 'small' ? 0.7 : size === 'large' ? 1.4 : 1;
    
    const colors = { 
      car: '#FF6B6B', 
      bike: '#FFD700', 
      stroller: '#DDA0DD',
      'snack-cart': '#32CD32',
      scooter: '#FF8C00',
      'meltdown-monster': '#8B0000'
    };
    
    const baseSpeed = (1 + level * 0.2) * laneConfig.speedMultiplier;
    const speedVariation = 0.5 + Math.random() * 1; // 0.5x to 1.5x speed variation
    
    const newObstacle: Obstacle = {
      id: Math.random(),
      x: laneDirections[row] > 0 ? -GRID_SIZE * sizeMultiplier : CANVAS_WIDTH,
      row: row,
      width: GRID_SIZE * sizeMultiplier,
      height: GRID_SIZE * 0.8 * sizeMultiplier,
      speed: baseSpeed * speedVariation * laneDirections[row],
      type: type,
      color: colors[type] || '#888888',
      size: size,
      oscillating: Math.random() < 0.2, // 20% chance of oscillating
      oscillateOffset: 0
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    
    // Chance to spawn power-up in power-up lanes
    if (laneConfig.type === 'power-up' && Math.random() < 0.3) {
      spawnPowerUp(row);
    }
  }, [level, laneDirections, laneConfigs]);

  // Power-up spawning system
  const spawnPowerUp = useCallback((row: number) => {
    const powerUpTypes: PowerUp['type'][] = ['shield', 'turbo', 'sticker-storm', 'team-rally', 'time-warp'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const colors = {
      shield: '#4169E1',
      turbo: '#FF4500',
      'sticker-storm': '#FFD700',
      'team-rally': '#32CD32',
      'time-warp': '#9370DB'
    };
    
    const newPowerUp: PowerUp = {
      id: Math.random(),
      x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * CANVAS_WIDTH * 0.6,
      row: row,
      type: type,
      color: colors[type],
      collected: false
    };
    
    setPowerUps(prev => [...prev, newPowerUp]);
  }, []);

  // Particle system for visual effects
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: 1,
        color: color,
        size: 2 + Math.random() * 4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Collision detection
  const checkCollisions = useCallback(() => {
    const playerX = player.col * GRID_SIZE;
    const playerY = player.row * LANE_HEIGHT;
    
    obstacles.forEach(obstacle => {
      if (obstacle.row === player.row &&
          playerX < obstacle.x + obstacle.width &&
          playerX + GRID_SIZE > obstacle.x &&
          playerY < obstacle.row * LANE_HEIGHT + obstacle.height &&
          playerY + GRID_SIZE > obstacle.row * LANE_HEIGHT) {
        
        // Collision detected - trigger safety question
        const question = safetyQuestions[Math.floor(Math.random() * safetyQuestions.length)];
        setCurrentQuestion(question);
        setGameState('question');
        playSound(150, 300);
      }
    });
  }, [player, obstacles, playSound]);

  // Enhanced main game loop with all systems
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const currentTime = Date.now();
    
    // Update obstacle positions with oscillation
    setObstacles(prev => prev
      .map(obstacle => {
        let newX = obstacle.x + obstacle.speed;
        let newOscillateOffset = obstacle.oscillateOffset || 0;
        
        if (obstacle.oscillating) {
          newOscillateOffset += 0.1;
          const oscillateY = Math.sin(newOscillateOffset) * 10;
          // Apply oscillation to visual rendering, not collision
        }
        
        return {
          ...obstacle,
          x: newX,
          oscillateOffset: newOscillateOffset
        };
      })
      .filter(obstacle => 
        obstacle.x > -GRID_SIZE * 3 && obstacle.x < CANVAS_WIDTH + GRID_SIZE * 3
      )
    );
    
    // Update power-ups
    setPowerUps(prev => prev.filter(powerUp => !powerUp.collected));
    
    // Update particles
    setParticles(prev => prev
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 0.02,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98
      }))
      .filter(particle => particle.life > 0)
    );
    
    // Enhanced lane-based spawning with procedural timers
    setLaneConfigs(prev => prev.map((config, row) => {
      if (config.type === 'normal' || laneDirections[row] === 0) return config;
      
      const timeSinceLastSpawn = currentTime - config.lastSpawn;
      if (timeSinceLastSpawn >= config.spawnInterval) {
        spawnObstacle(row);
        return {
          ...config,
          lastSpawn: currentTime,
          spawnInterval: 1000 + Math.random() * 2000 // Randomize next spawn
        };
      }
      return config;
    }));
    
    // Update stats
    setStats(prev => ({
      ...prev,
      runTime: currentTime - startTimeRef.current
    }));
    
    // Update power-up timers
    setActiveBuffs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] -= 16; // ~60fps
        if (updated[key] <= 0) {
          delete updated[key];
        }
      });
      return updated;
    });
    
    // Update praise power
    if (praisePowerActive) {
      setPraisePowerTimer(prev => {
        if (prev <= 16) {
          setPraisePowerActive(false);
          return 0;
        }
        return prev - 16;
      });
    }
    
    checkCollisions();
    checkPowerUpCollections();
  }, [gameState, level, spawnObstacle, checkCollisions, laneDirections, praisePowerActive]);

  // Power-up collection detection
  const checkPowerUpCollections = useCallback(() => {
    const playerX = player.col * GRID_SIZE;
    const playerY = player.row * LANE_HEIGHT;
    
    powerUps.forEach(powerUp => {
      if (!powerUp.collected &&
          Math.abs(powerUp.x - playerX) < GRID_SIZE &&
          Math.abs(powerUp.row * LANE_HEIGHT - playerY) < LANE_HEIGHT) {
        
        // Collect power-up
        setPowerUps(prev => prev.map(p => 
          p.id === powerUp.id ? { ...p, collected: true } : p
        ));
        
        // Apply power-up effect
        applyPowerUp(powerUp.type);
        
        // Visual feedback
        createParticles(powerUp.x, powerUp.row * LANE_HEIGHT, powerUp.color, 15);
        playSound(523, 200, 'square');
      }
    });
  }, [player, powerUps, createParticles, playSound]);

  // Power-up effects system
  const applyPowerUp = useCallback((type: PowerUp['type']) => {
    switch (type) {
      case 'shield':
        setPlayer(prev => ({ ...prev, hasShield: true }));
        setActiveBuffs(prev => ({ ...prev, shield: POWER_UP_DURATION }));
        toast({ title: "Shield Active!", description: "Next collision blocked" });
        break;
        
      case 'turbo':
        setActiveBuffs(prev => ({ ...prev, turbo: POWER_UP_DURATION }));
        toast({ title: "Turbo Boost!", description: "Move faster for 3 seconds" });
        break;
        
      case 'sticker-storm':
        setStats(prev => ({ ...prev, coins: prev.coins + 10 }));
        createParticles(player.col * GRID_SIZE, player.row * LANE_HEIGHT, '#FFD700', 25);
        toast({ title: "Sticker Storm!", description: "+10 coins collected" });
        break;
        
      case 'team-rally':
        setActiveBuffs(prev => ({ ...prev, teamRally: POWER_UP_DURATION }));
        toast({ title: "Team Rally!", description: "Co-teacher helps block obstacles" });
        break;
        
      case 'time-warp':
        setActiveBuffs(prev => ({ ...prev, timeWarp: POWER_UP_DURATION }));
        toast({ title: "Time Warp!", description: "All obstacles slowed" });
        break;
    }
  }, [player, toast, createParticles]);

  // Game loop effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(gameLoop, 16); // ~60fps

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // Rendering
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#E6F3FF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lanes
    for (let row = 0; row < ROWS; row++) {
      const y = row * LANE_HEIGHT;
      
      if (row === GOAL_ROW) {
        ctx.fillStyle = 'rgba(50, 205, 50, 0.3)';
      } else if (row === SAFE_ZONE_ROW) {
        ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
      } else if (row === PLAYER_START_ROW || row === ROWS - 1) {
        ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
      } else {
        ctx.fillStyle = row % 2 === 0 ? 'rgba(128, 128, 128, 0.1)' : 'rgba(64, 64, 64, 0.1)';
      }
      
      ctx.fillRect(0, y, CANVAS_WIDTH, LANE_HEIGHT);
      
      // Lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + LANE_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH, y + LANE_HEIGHT);
      ctx.stroke();
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * GRID_SIZE, 0);
      ctx.lineTo(col * GRID_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.row * LANE_HEIGHT + 5, obstacle.width, obstacle.height);
      
      // Add simple visual indicators
      ctx.fillStyle = '#FFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = obstacle.row * LANE_HEIGHT + LANE_HEIGHT / 2 + 5;
      
      if (obstacle.type === 'car') ctx.fillText('🚗', centerX, centerY);
      else if (obstacle.type === 'bike') ctx.fillText('🚲', centerX, centerY);
      else if (obstacle.type === 'stroller') ctx.fillText('🍼', centerX, centerY);
    });

    // Draw player
    const playerX = player.col * GRID_SIZE;
    const playerY = player.row * LANE_HEIGHT;
    
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(playerX + 2, playerY + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // Player face
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(playerX + GRID_SIZE/2, playerY + GRID_SIZE/3, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(playerX + GRID_SIZE/2 - 3, playerY + GRID_SIZE/3 - 2, 1, 0, Math.PI * 2);
    ctx.arc(playerX + GRID_SIZE/2 + 3, playerY + GRID_SIZE/3 - 2, 1, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = '#2F4F2F';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 30);
    ctx.fillStyle = '#F5F5DC';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${player.lives}`, 150, 20);
    ctx.fillText(`Level: ${level}`, 250, 20);
    ctx.textAlign = 'right';
    ctx.fillText('Arrow keys to move • Reach the green zone!', CANVAS_WIDTH - 10, 20);

  }, [gameState, player, obstacles, score, level]);

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
      runTime: 0
    });
    setActiveBuffs({});
    setPraisePowerActive(false);
    startTimeRef.current = Date.now();
    
    // Reset lane configs with new procedural setup
    setLaneConfigs(Array.from({ length: ROWS }, (_, i) => {
      if (i === 0 || i === ROWS - 1 || i === SAFE_ZONE_ROW) {
        return { type: 'normal', spawnInterval: 0, speedMultiplier: 0, lastSpawn: 0 };
      }
      
      const types: LaneConfig['type'][] = ['normal', 'rush-hour', 'slow-mo', 'power-up'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      return {
        type: randomType,
        spawnInterval: 1000 + Math.random() * 2000,
        speedMultiplier: randomType === 'rush-hour' ? 1.5 : randomType === 'slow-mo' ? 0.7 : 1,
        lastSpawn: Date.now()
      };
    }));
  };

  const handleQuestionAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestion?.correctAnswer) {
      playSound(523, 200);
      setScore(prev => prev + 50);
      setStats(prev => ({ 
        ...prev, 
        questionStreak: prev.questionStreak + 1,
        perfectAnswers: prev.perfectAnswers + 1
      }));
      
      // Check for question streak bonus
      if (stats.questionStreak + 1 >= QUESTION_STREAK_THRESHOLD) {
        toast({ title: "Question Master!", description: "Free spin unlocked!" });
      }
    } else {
      playSound(150, 300);
      if (player.hasShield) {
        setPlayer(prev => ({ ...prev, hasShield: false }));
        toast({ title: "Shield Protected!", description: "Shield absorbed the hit" });
      } else {
        setPlayer(prev => ({ ...prev, lives: prev.lives - 1 }));
      }
      setStats(prev => ({ ...prev, questionStreak: 0 }));
    }
  };

  const continueAfterQuestion = () => {
    setShowExplanation(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    
    if (player.lives <= 0) {
      setGameState('gameOver');
    } else {
      // Enhanced respawn with smooth animation
      setPlayer(prev => ({
        ...prev,
        row: checkpoint,
        col: Math.floor(COLS / 2),
        isInvulnerable: true
      }));
      
      // Remove invulnerability after brief period
      setTimeout(() => {
        setPlayer(prev => ({ ...prev, isInvulnerable: false }));
      }, 1000);
      
      setGameState('playing');
    }
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setPlayer(prev => ({
      ...prev,
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      xp: prev.xp + 100
    }));
    setCheckpoint(PLAYER_START_ROW);
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    
    // Generate new procedural lane layout
    setLaneConfigs(Array.from({ length: ROWS }, (_, i) => {
      if (i === 0 || i === ROWS - 1 || i === SAFE_ZONE_ROW) {
        return { type: 'normal', spawnInterval: 0, speedMultiplier: 0, lastSpawn: 0 };
      }
      
      const types: LaneConfig['type'][] = ['normal', 'rush-hour', 'slow-mo', 'power-up', 'quiz-gate'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      return {
        type: randomType,
        spawnInterval: Math.max(500, 1500 - (level * 50)), // Faster each level
        speedMultiplier: randomType === 'rush-hour' ? 1.5 : randomType === 'slow-mo' ? 0.7 : 1,
        lastSpawn: Date.now()
      };
    }));
    
    setGameState('playing');
    toast({ title: `Level ${level + 1}!`, description: "New lane patterns ahead" });
  };

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">🎮 Preschool Safety Dash</h1>
          <p className="text-lg text-gray-600 mb-6">
            Modern Frogger-style safety training with power-ups, combos, and procedural lanes!
          </p>
          
          {/* Game Mode Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => { setGameMode('normal'); startGame(); }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg"
            >
              📚 Classic Mode
              <div className="text-xs mt-1">Progressive levels</div>
            </button>
            <button
              onClick={() => { setGameMode('endless'); startGame(); }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-4 rounded-lg"
            >
              ♾️ Endless Mode
              <div className="text-xs mt-1">Infinite challenge</div>
            </button>
            <button
              onClick={() => { setGameMode('timeAttack'); startGame(); }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-lg"
            >
              ⏱️ Time Trial
              <div className="text-xs mt-1">Speed challenge</div>
            </button>
            <button
              onClick={() => { setGameMode('dailyChallenge'); startGame(); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-4 rounded-lg"
            >
              🏆 Daily Challenge
              <div className="text-xs mt-1">Special modifiers</div>
            </button>
          </div>

          {/* Enhanced Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">🎯 New Features</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Procedural lane types</li>
                <li>• Power-up arsenal</li>
                <li>• Combo & streak system</li>
                <li>• Particle effects</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">⚡ Power-Ups</h4>
              <ul className="text-blue-700 space-y-1">
                <li>🛡️ Compassion Shield</li>
                <li>🚀 Timeout Turbo</li>
                <li>⭐ Sticker Storm</li>
                <li>👥 Team Rally</li>
                <li>🌀 Time Warp</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-800 mb-2">🏅 Progression</h4>
              <ul className="text-purple-700 space-y-1">
                <li>• XP & Level system</li>
                <li>• Question streaks</li>
                <li>• Dodge combos</li>
                <li>• Coin collection</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-amber-800 mb-2">🎮 Enhanced Controls:</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Arrow keys for precise grid movement</li>
              <li>• Collect power-ups for special abilities</li>
              <li>• Build combos by dodging obstacles</li>
              <li>• Answer safety questions correctly for streaks</li>
              <li>• Mid-level checkpoints preserve progress</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-4">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Safety Question</h2>
          <p className="text-lg mb-6">{currentQuestion.question}</p>
          
          {!showExplanation ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionAnswer(index)}
                  className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-transparent hover:border-blue-300"
                >
                  {index + 1}. {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className={`p-4 rounded-lg mb-4 ${
                selectedAnswer === currentQuestion.correctAnswer 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <p className="text-gray-700 mb-6">{currentQuestion.explanation}</p>
              <button
                onClick={continueAfterQuestion}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                Continue
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-400 bg-white shadow-lg"
      />
    </div>
  );
}