import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Enhanced 3D game constants for maximum difficulty
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 800;
const GRID_SIZE = 50;
const LANES = 16;
const LANE_HEIGHT = CANVAS_HEIGHT / LANES;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const PLAYER_START_ROW = LANES - 2;
const SAFE_ZONE_ROW = Math.floor(LANES / 2);
const GOAL_ROW = 1;

// 3D perspective constants
const PERSPECTIVE_SCALE = 0.6;
const HORIZON_Y = CANVAS_HEIGHT * 0.3;
const DEPTH_LAYERS = 5;

interface Player3D {
  row: number;
  col: number;
  x: number;
  y: number;
  z: number;
  lives: number;
  scale: number;
  rotation: number;
  bouncePhase: number;
  shadowOpacity: number;
  invulnerable: number;
  streakCount: number;
  lastMove: number;
}

interface Obstacle3D {
  id: number;
  x: number;
  y: number;
  z: number;
  row: number;
  width: number;
  height: number;
  speed: number;
  baseSpeed: number;
  acceleration: number;
  type: 'speedy-stroller' | 'runaway-scooter' | 'chaos-cart' | 'mega-bus' | 'ninja-bike' | 'tornado-trike';
  color: string;
  scale: number;
  rotation: number;
  wobble: number;
  trail: Array<{x: number, y: number, opacity: number, scale: number}>;
  personality: string;
  nextSpeedChange: number;
  isAngry: boolean;
  eyePosition: number;
  wheelRotation: number;
}

interface PowerUp3D {
  id: number;
  x: number;
  y: number;
  z: number;
  row: number;
  type: 'super-shield' | 'time-freeze' | 'giggle-gas' | 'rainbow-rush' | 'lucky-star' | 'mega-hop';
  collected: boolean;
  floatPhase: number;
  sparkles: Array<{x: number, y: number, z: number, life: number, color: string}>;
  scale: number;
  rotation: number;
  personality: string;
}

interface Particle3D {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'explosion' | 'giggle' | 'stardust' | 'rainbow';
  rotation: number;
  scale: number;
}

interface WittyMessage {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
  font: string;
}

// Witty obstacle personalities and behaviors
const obstaclePersonalities = {
  'speedy-stroller': {
    name: 'Speed Demon Stroller',
    colors: ['#FF6B6B', '#FF8E53'],
    personality: 'Thinks it\'s in a baby grand prix!',
    speedPattern: 'erratic',
    sound: 'vrooom-goo-goo!'
  },
  'runaway-scooter': {
    name: 'Escaped Scooter',
    colors: ['#4ECDC4', '#45B7A8'],
    personality: 'Freedom at last! No more tiny feet!',
    speedPattern: 'zigzag',
    sound: 'wheee-clank-wheee!'
  },
  'chaos-cart': {
    name: 'Shopping Cart of Mayhem',
    colors: ['#96CEB4', '#FECA57'],
    personality: 'Filled with bouncy balls and pure chaos',
    speedPattern: 'bouncy',
    sound: 'rattle-rattle-WHEEE!'
  },
  'mega-bus': {
    name: 'The Big Yellow Beast',
    colors: ['#F7B801', '#FA8231'],
    personality: 'Late for snack time AGAIN!',
    speedPattern: 'steady-but-huge',
    sound: 'HONK-honk-excuse-me!'
  },
  'ninja-bike': {
    name: 'Stealth Tricycle',
    colors: ['#2C3E50', '#34495E'],
    personality: 'Silent but deadly... to ankles',
    speedPattern: 'sneaky',
    sound: '...'
  },
  'tornado-trike': {
    name: 'Whirlwind Trike',
    colors: ['#A8E6CF', '#DCEDC1'],
    personality: 'Spins faster than a sugar-high toddler',
    speedPattern: 'spinning',
    sound: 'whirrrr-dizzy-whirrrr!'
  }
};

// Power-up personalities
const powerUpPersonalities = {
  'super-shield': {
    name: 'Bubble Wrap Shield',
    description: 'Pop! Pop! Protection!',
    effect: 'Makes you invincible and giggly',
    color: '#FFB6C1'
  },
  'time-freeze': {
    name: 'Naptime Clock',
    description: 'Even chaos needs a timeout',
    effect: 'Slows everything to sleepy pace',
    color: '#E6E6FA'
  },
  'giggle-gas': {
    name: 'Silly Spray',
    description: 'Spreads uncontrollable giggles',
    effect: 'Makes obstacles too busy laughing',
    color: '#98FB98'
  },
  'rainbow-rush': {
    name: 'Unicorn Speed',
    description: 'Taste the rainbow... of velocity!',
    effect: 'Super speed with sparkle trail',
    color: '#FF69B4'
  },
  'lucky-star': {
    name: 'Wishful Thinking',
    description: 'For when you really, REALLY need luck',
    effect: 'Attracts good fortune',
    color: '#FFD700'
  },
  'mega-hop': {
    name: 'Kangaroo Juice',
    description: 'Boing! Boing! MEGA BOING!',
    effect: 'Jump over obstacles',
    color: '#FFA500'
  }
};

// Witty messages for different situations
const wittyMessages = {
  dodge: [
    "Matrix move!", "Slick!", "Butter smooth!", "Like a ninja!", "Whoosh!",
    "Close shave!", "Dancing queen!", "Slippery fish!", "Smooth operator!"
  ],
  collision: [
    "Oops!", "Bonk!", "That tickled!", "Ouchie!", "Speed bump!",
    "Surprise hug!", "Gentle tap!", "Boink!", "Reality check!"
  ],
  powerUp: [
    "Sparkly!", "Magical!", "Delicious!", "Shiny!", "Fancy!",
    "Oooh, pretty!", "Jackpot!", "Score!", "Yummy!"
  ],
  levelUp: [
    "Level up, buttercup!", "Next stop: Chaos!", "Buckle up!",
    "Plot twist incoming!", "Here we go again!", "Challenge accepted!"
  ]
};

export default function Enhanced3DFrogger(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef<number>(0);
  const spawnTimers = useRef<number[]>(new Array(LANES).fill(0));
  const difficultyTimer = useRef<number>(0);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'question'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // 3D Player
  const [player, setPlayer] = useState<Player3D>({
    row: PLAYER_START_ROW,
    col: Math.floor(COLS / 2),
    x: Math.floor(COLS / 2) * GRID_SIZE,
    y: PLAYER_START_ROW * LANE_HEIGHT,
    z: 0,
    lives: 3,
    scale: 1,
    rotation: 0,
    bouncePhase: 0,
    shadowOpacity: 0.3,
    invulnerable: 0,
    streakCount: 0,
    lastMove: 0
  });

  // Enhanced game objects
  const [obstacles, setObstacles] = useState<Obstacle3D[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp3D[]>([]);
  const [particles, setParticles] = useState<Particle3D[]>([]);
  const [wittyTexts, setWittyTexts] = useState<WittyMessage[]>([]);
  
  // Enhanced difficulty system
  const [currentDifficulty, setCurrentDifficulty] = useState({
    spawnRate: 1.0,
    speedMultiplier: 1.0,
    obstacleVariety: 3,
    smartObstacles: false,
    chaosMode: false
  });

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me')
  });

  // Save game results
  const saveGameResult = useCallback(async (finalScore: number, questionsAnswered: number) => {
    if (!user) return;
    
    try {
      await apiRequest('/api/user/points', {
        method: 'POST',
        body: JSON.stringify({
          points: Math.floor(finalScore / 10),
          source: 'enhanced_frogger_3d',
          description: `Enhanced 3D Frogger - Level ${level} - ${questionsAnswered} questions`
        })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Game Complete!",
        description: `Earned ${Math.floor(finalScore / 10)} points! That was some serious playground navigation!`
      });
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }, [user, level, queryClient, toast]);

  // Enhanced 3D rendering system
  const calculate3DPosition = useCallback((x: number, y: number, z: number = 0) => {
    const depth = (y - HORIZON_Y) / (CANVAS_HEIGHT - HORIZON_Y);
    const scale = PERSPECTIVE_SCALE + (1 - PERSPECTIVE_SCALE) * depth;
    const perspective3D = {
      x: x * scale + (CANVAS_WIDTH * (1 - scale)) / 2,
      y: HORIZON_Y + (y - HORIZON_Y) * scale + z * scale,
      scale: scale
    };
    return perspective3D;
  }, []);

  // Enhanced obstacle spawning with personality-based behavior
  const spawnObstacle = useCallback((row: number) => {
    if (row <= 1 || row >= LANES - 1 || row === SAFE_ZONE_ROW) return;

    const types = Object.keys(obstaclePersonalities) as Array<keyof typeof obstaclePersonalities>;
    const availableTypes = types.slice(0, Math.min(types.length, currentDifficulty.obstacleVariety));
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const personality = obstaclePersonalities[type];
    
    // Smart obstacle positioning - avoid creating easy gaps
    const existingInRow = obstacles.filter(obs => obs.row === row);
    let startX = Math.random() < 0.5 ? -100 : CANVAS_WIDTH + 100;
    
    // Make it harder by analyzing player position and creating challenging scenarios
    if (currentDifficulty.smartObstacles && existingInRow.length > 0) {
      const playerDistance = Math.abs(player.row - row);
      if (playerDistance <= 2) {
        // Player is nearby - create more challenging patterns
        const gaps = findGaps(existingInRow);
        if (gaps.length > 1) {
          // Fill one of the larger gaps to reduce escape options
          const largestGap = gaps.reduce((max, gap) => gap.size > max.size ? gap : max);
          startX = largestGap.start + largestGap.size * 0.3;
        }
      }
    }

    const baseSpeed = 2 + (level * 0.5) + (Math.random() * 2);
    const obstacle: Obstacle3D = {
      id: Date.now() + Math.random(),
      x: startX,
      y: row * LANE_HEIGHT,
      z: Math.random() * 10 - 5,
      row,
      width: GRID_SIZE + (Math.random() * 20 - 10),
      height: LANE_HEIGHT * 0.8,
      speed: baseSpeed * currentDifficulty.speedMultiplier,
      baseSpeed: baseSpeed,
      acceleration: 0,
      type,
      color: personality.colors[Math.floor(Math.random() * personality.colors.length)],
      scale: 0.8 + Math.random() * 0.4,
      rotation: 0,
      wobble: 0,
      trail: [],
      personality: personality.personality,
      nextSpeedChange: Date.now() + 1000 + Math.random() * 2000,
      isAngry: false,
      eyePosition: 0,
      wheelRotation: 0
    };

    setObstacles(prev => [...prev, obstacle]);
  }, [obstacles, level, currentDifficulty, player.row]);

  // Find gaps between obstacles for smart AI
  const findGaps = (obstaclesInRow: Obstacle3D[]) => {
    const sorted = obstaclesInRow.sort((a, b) => a.x - b.x);
    const gaps = [];
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = sorted[i].x + sorted[i].width;
      const gapEnd = sorted[i + 1].x;
      const gapSize = gapEnd - gapStart;
      
      if (gapSize > GRID_SIZE * 1.5) {
        gaps.push({ start: gapStart, end: gapEnd, size: gapSize });
      }
    }
    
    return gaps;
  };

  // Enhanced power-up spawning
  const spawnPowerUp = useCallback(() => {
    if (Math.random() > 0.02) return; // 2% chance per frame
    
    const availableRows = Array.from({length: LANES - 4}, (_, i) => i + 2)
      .filter(row => row !== SAFE_ZONE_ROW);
    const row = availableRows[Math.floor(Math.random() * availableRows.length)];
    
    const types = Object.keys(powerUpPersonalities) as Array<keyof typeof powerUpPersonalities>;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerUp: PowerUp3D = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - GRID_SIZE),
      y: row * LANE_HEIGHT,
      z: 10 + Math.random() * 5,
      row,
      type,
      collected: false,
      floatPhase: Math.random() * Math.PI * 2,
      sparkles: [],
      scale: 0.6 + Math.random() * 0.4,
      rotation: 0,
      personality: powerUpPersonalities[type].description
    };

    setPowerUps(prev => [...prev, powerUp]);
  }, []);

  // Enhanced movement system with 3D effects
  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing' || player.invulnerable > 0) return;

    let newRow = player.row;
    let newCol = player.col;
    let newRotation = player.rotation;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, player.row - 1);
        newRotation = 0;
        break;
      case 'down':
        newRow = Math.min(LANES - 1, player.row + 1);
        newRotation = 180;
        break;
      case 'left':
        newCol = Math.max(0, player.col - 1);
        newRotation = 270;
        break;
      case 'right':
        newCol = Math.min(COLS - 1, player.col + 1);
        newRotation = 90;
        break;
    }

    // Add witty movement messages
    if (newRow !== player.row || newCol !== player.col) {
      const now = Date.now();
      if (now - player.lastMove > 100) { // Prevent spam
        addWittyMessage(wittyMessages.dodge[Math.floor(Math.random() * wittyMessages.dodge.length)], 
                       player.x, player.y - 30, '#4ECDC4', '16px Comic Sans MS');
      }

      setPlayer(prev => ({
        ...prev,
        row: newRow,
        col: newCol,
        x: newCol * GRID_SIZE,
        y: newRow * LANE_HEIGHT,
        rotation: newRotation,
        bouncePhase: Math.PI,
        lastMove: now,
        streakCount: prev.streakCount + 1
      }));

      // Check for goal
      if (newRow === GOAL_ROW) {
        handleLevelComplete();
      }
    }
  }, [gameState, player]);

  // Add witty message system
  const addWittyMessage = useCallback((text: string, x: number, y: number, color: string = '#FFD700', font: string = '14px Arial') => {
    const message: WittyMessage = {
      text,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 20 - 10),
      life: 60,
      color,
      font
    };
    
    setWittyTexts(prev => [...prev.slice(-10), message]); // Keep last 10 messages
  }, []);

  // Level completion with celebration
  const handleLevelComplete = useCallback(() => {
    const bonusPoints = level * 100 + player.streakCount * 10;
    setScore(prev => prev + bonusPoints);
    
    addWittyMessage(wittyMessages.levelUp[Math.floor(Math.random() * wittyMessages.levelUp.length)], 
                   CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FF6B6B', '24px Comic Sans MS');
    
    // Create celebration particles
    for (let i = 0; i < 20; i++) {
      createParticle(player.x, player.y, 'rainbow');
    }
    
    setLevel(prev => prev + 1);
    setPlayer(prev => ({
      ...prev,
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      x: Math.floor(COLS / 2) * GRID_SIZE,
      y: PLAYER_START_ROW * LANE_HEIGHT,
      streakCount: 0
    }));

    // Increase difficulty
    setCurrentDifficulty(prev => ({
      spawnRate: Math.min(prev.spawnRate * 1.2, 3.0),
      speedMultiplier: Math.min(prev.speedMultiplier * 1.1, 2.5),
      obstacleVariety: Math.min(prev.obstacleVariety + 1, 6),
      smartObstacles: level >= 3,
      chaosMode: level >= 5
    }));
  }, [level, player, addWittyMessage]);

  // Enhanced particle system
  const createParticle = useCallback((x: number, y: number, type: Particle3D['type']) => {
    const colors = {
      sparkle: ['#FFD700', '#FFA500', '#FF69B4'],
      explosion: ['#FF6B6B', '#FF8E53', '#FECA57'],
      giggle: ['#4ECDC4', '#45B7A8', '#96CEB4'],
      stardust: ['#E6E6FA', '#DDA0DD', '#FFB6C1'],
      rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
    };

    const particleColors = colors[type];
    
    for (let i = 0; i < (type === 'rainbow' ? 10 : 5); i++) {
      const particle: Particle3D = {
        id: Date.now() + Math.random() + i,
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        z: Math.random() * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        vz: Math.random() * 5,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        size: 3 + Math.random() * 5,
        type,
        rotation: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.5
      };
      
      setParticles(prev => [...prev, particle]);
    }
  }, []);

  // Enhanced rendering with 3D effects
  const render = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.3, '#98FB98'); // Light green
    gradient.addColorStop(1, '#228B22'); // Forest green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw road lanes with 3D perspective
    for (let i = 1; i < LANES - 1; i++) {
      if (i === SAFE_ZONE_ROW) {
        // Safe zone - park bench area
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(0, i * LANE_HEIGHT, CANVAS_WIDTH, LANE_HEIGHT);
        
        // Draw benches with 3D effect
        for (let j = 0; j < 3; j++) {
          const benchX = (j + 1) * (CANVAS_WIDTH / 4);
          const pos3D = calculate3DPosition(benchX, i * LANE_HEIGHT + LANE_HEIGHT / 2);
          
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(pos3D.x - 30 * pos3D.scale, pos3D.y - 5 * pos3D.scale, 
                      60 * pos3D.scale, 10 * pos3D.scale);
        }
      } else {
        // Road lanes with perspective lines
        const pos3D = calculate3DPosition(0, i * LANE_HEIGHT);
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, pos3D.y, CANVAS_WIDTH, LANE_HEIGHT * pos3D.scale);
        
        // Lane dividers
        ctx.fillStyle = '#FFFF00';
        for (let j = 0; j < CANVAS_WIDTH; j += 60) {
          ctx.fillRect(j, pos3D.y + LANE_HEIGHT * pos3D.scale / 2 - 1, 30, 2);
        }
      }
    }

    // Render obstacles with 3D personalities
    obstacles.forEach(obstacle => {
      const pos3D = calculate3DPosition(obstacle.x, obstacle.y, obstacle.z);
      
      ctx.save();
      ctx.translate(pos3D.x, pos3D.y);
      ctx.scale(pos3D.scale * obstacle.scale, pos3D.scale * obstacle.scale);
      ctx.rotate(obstacle.rotation);

      // Draw vehicle based on type with personality
      switch (obstacle.type) {
        case 'speedy-stroller':
          drawSpeedyStroller(ctx, obstacle);
          break;
        case 'runaway-scooter':
          drawRunawayScooter(ctx, obstacle);
          break;
        case 'chaos-cart':
          drawChaosCart(ctx, obstacle);
          break;
        case 'mega-bus':
          drawMegaBus(ctx, obstacle);
          break;
        case 'ninja-bike':
          drawNinjaBike(ctx, obstacle);
          break;
        case 'tornado-trike':
          drawTornadoTrike(ctx, obstacle);
          break;
      }

      ctx.restore();

      // Draw personality bubble occasionally
      if (Math.random() < 0.001) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(pos3D.x + 30, pos3D.y - 40, 150, 25);
        ctx.fillStyle = '#333';
        ctx.font = '12px Comic Sans MS';
        ctx.fillText(obstacle.personality.substring(0, 20) + '...', pos3D.x + 35, pos3D.y - 22);
      }
    });

    // Render power-ups with 3D sparkles
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      const pos3D = calculate3DPosition(powerUp.x, powerUp.y, powerUp.z + Math.sin(powerUp.floatPhase) * 5);
      
      ctx.save();
      ctx.translate(pos3D.x, pos3D.y);
      ctx.scale(pos3D.scale * powerUp.scale, pos3D.scale * powerUp.scale);
      ctx.rotate(powerUp.rotation);

      // Draw power-up with personality
      const personality = powerUpPersonalities[powerUp.type];
      ctx.fillStyle = personality.color;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      
      // Star shape for power-ups
      drawStar(ctx, 0, 0, 20, 30, 5);
      ctx.fill();
      ctx.stroke();
      
      // Add sparkles
      for (let i = 0; i < 3; i++) {
        const sparkleX = Math.sin(powerUp.floatPhase + i * 2) * 25;
        const sparkleY = Math.cos(powerUp.floatPhase + i * 2) * 25;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(sparkleX - 2, sparkleY - 2, 4, 4);
      }

      ctx.restore();
    });

    // Render 3D player with enhanced animation
    const playerPos3D = calculate3DPosition(player.x, player.y, player.z);
    ctx.save();
    ctx.translate(playerPos3D.x, playerPos3D.y);
    ctx.scale(playerPos3D.scale * player.scale, playerPos3D.scale * player.scale);
    ctx.rotate(player.rotation * Math.PI / 180);

    // Player shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${player.shadowOpacity})`;
    ctx.fillRect(-15, 20, 30, 10);

    // Player character (cute child)
    const bounceOffset = Math.sin(player.bouncePhase) * 3;
    
    // Body
    ctx.fillStyle = player.invulnerable > 0 ? '#FFD700' : '#FF69B4';
    ctx.fillRect(-10, -10 + bounceOffset, 20, 25);
    
    // Head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(0, -20 + bounceOffset, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -25 + bounceOffset, 3, 3);
    ctx.fillRect(3, -25 + bounceOffset, 3, 3);
    
    // Smile
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -20 + bounceOffset, 6, 0, Math.PI);
    ctx.stroke();

    ctx.restore();

    // Render 3D particles
    particles.forEach(particle => {
      const particlePos3D = calculate3DPosition(particle.x, particle.y, particle.z);
      const alpha = particle.life / particle.maxLife;
      
      ctx.save();
      ctx.translate(particlePos3D.x, particlePos3D.y);
      ctx.scale(particlePos3D.scale * particle.scale, particlePos3D.scale * particle.scale);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;

      switch (particle.type) {
        case 'sparkle':
          ctx.fillStyle = particle.color;
          drawStar(ctx, 0, 0, particle.size, particle.size * 1.5, 4);
          ctx.fill();
          break;
        case 'rainbow':
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
          break;
        default:
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();
    });

    // Render witty messages
    wittyTexts.forEach(message => {
      const alpha = message.life / 60;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = message.color;
      ctx.font = message.font;
      ctx.textAlign = 'center';
      ctx.fillText(message.text, message.x, message.y - (60 - message.life));
      ctx.globalAlpha = 1;
    });

    // UI elements with enhanced styling
    renderUI(ctx);
  }, [player, obstacles, powerUps, particles, wittyTexts, level, score, calculate3DPosition]);

  // Helper function to draw star shapes
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, innerRadius: number, outerRadius: number, points: number) => {
    const step = Math.PI / points;
    let rot = Math.PI / 2 * 3;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < points; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // Enhanced obstacle drawing functions with personalities
  const drawSpeedyStroller = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Stroller body
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(-20, -15, 40, 25);
    
    // Racing stripes
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(-18, -10, 36, 3);
    ctx.fillRect(-18, -2, 36, 3);
    
    // Wheels with rotation
    ctx.fillStyle = '#000';
    ctx.save();
    ctx.translate(-15, 12);
    ctx.rotate(obstacle.wheelRotation);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    
    ctx.save();
    ctx.translate(15, 12);
    ctx.rotate(obstacle.wheelRotation);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    
    // Speed lines
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-30 - i * 10, -5 + i * 5);
      ctx.lineTo(-25 - i * 10, -5 + i * 5);
      ctx.stroke();
    }
  };

  const drawRunawayScooter = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Scooter platform
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(-15, -5, 30, 10);
    
    // Handle
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(10, -25);
    ctx.lineTo(15, -25);
    ctx.stroke();
    
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-12, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Wobble effect
    ctx.save();
    ctx.rotate(Math.sin(obstacle.wobble) * 0.1);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-2, -15, 4, 8);
    ctx.restore();
  };

  const drawChaosCart = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Cart body
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(-25, -20, 50, 30);
    
    // Mesh pattern
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    for (let i = -20; i < 20; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, -15);
      ctx.lineTo(i, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-20, i);
      ctx.lineTo(20, i);
      ctx.stroke();
    }
    
    // Bouncy balls inside
    for (let i = 0; i < 5; i++) {
      const ballX = (Math.sin(obstacle.wobble + i) * 15);
      const ballY = (Math.cos(obstacle.wobble + i * 2) * 8) - 5;
      ctx.fillStyle = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][i];
      ctx.beginPath();
      ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Wheels
    ctx.fillStyle = '#000';
    const wheels = [-20, -10, 10, 20];
    wheels.forEach(wheelX => {
      ctx.beginPath();
      ctx.arc(wheelX, 12, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMegaBus = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Bus body
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(-40, -25, 80, 35);
    
    // Windows
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(-35 + i * 12, -20, 8, 10);
    }
    
    // Door
    ctx.fillStyle = '#666';
    ctx.fillRect(35, -15, 8, 25);
    
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-25, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(25, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyes if bus is late
    if (obstacle.isAngry) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(-10, -22, 5, 3);
      ctx.fillRect(5, -22, 5, 3);
    }
  };

  const drawNinjaBike = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Semi-transparent for stealth
    ctx.globalAlpha = 0.7;
    
    // Bike frame
    ctx.strokeStyle = obstacle.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(0, -5);
    ctx.lineTo(15, -10);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.stroke();
    
    // Wheels
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-15, 5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 5, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Ninja smoke trail
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-25 - i * 8, Math.sin(obstacle.wobble + i) * 5, 3 + i, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  };

  const drawTornadoTrike = (ctx: CanvasRenderingContext2D, obstacle: Obstacle3D) => {
    // Spinning effect
    ctx.save();
    ctx.rotate(obstacle.wobble * 2);
    
    // Trike body
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(-12, -8, 24, 16);
    
    // Handlebars
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(-8, -18);
    ctx.lineTo(8, -18);
    ctx.lineTo(8, -8);
    ctx.stroke();
    
    ctx.restore();
    
    // Wheels (don't rotate with body)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-10, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Dizzy stars
    for (let i = 0; i < 3; i++) {
      const starX = Math.sin(obstacle.wobble + i * 2) * 20;
      const starY = Math.cos(obstacle.wobble + i * 2) * 20 - 25;
      ctx.fillStyle = '#FFFF00';
      drawStar(ctx, starX, starY, 3, 6, 4);
      ctx.fill();
    }
  };

  // Enhanced UI rendering
  const renderUI = (ctx: CanvasRenderingContext2D) => {
    // Score and level with 3D effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.fillText(`Score: ${score}`, 20, 35);
    
    ctx.fillStyle = '#FF69B4';
    ctx.font = 'bold 16px Comic Sans MS';
    ctx.fillText(`Level: ${level}`, 20, 55);
    
    ctx.fillStyle = '#4ECDC4';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText(`Streak: ${player.streakCount}`, 20, 75);
    
    // Lives with hearts
    for (let i = 0; i < player.lives; i++) {
      ctx.fillStyle = '#FF1493';
      drawHeart(ctx, 250 + i * 30, 30, 12);
    }
    
    // Difficulty indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(CANVAS_WIDTH - 150, 10, 140, 60);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Difficulty', CANVAS_WIDTH - 140, 30);
    
    ctx.fillStyle = currentDifficulty.chaosMode ? '#FF0000' : 
                   currentDifficulty.smartObstacles ? '#FF8800' : '#00FF00';
    ctx.fillText(currentDifficulty.chaosMode ? 'CHAOS!' : 
                currentDifficulty.smartObstacles ? 'SMART' : 'NORMAL', 
                CANVAS_WIDTH - 140, 50);
  };

  // Helper function to draw hearts
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  };

  // Enhanced game loop with improved timing
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return;

    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    // Update time
    setTimeElapsed(prev => prev + deltaTime);

    // Update player animation
    setPlayer(prev => ({
      ...prev,
      bouncePhase: prev.bouncePhase + 0.2,
      invulnerable: Math.max(0, prev.invulnerable - 1)
    }));

    // Update obstacles with personality behaviors
    setObstacles(prev => prev.map(obstacle => {
      const direction = obstacle.speed > 0 ? 1 : -1;
      let newSpeed = obstacle.speed;
      
      // Personality-based speed changes
      if (currentTime > obstacle.nextSpeedChange) {
        const personality = obstaclePersonalities[obstacle.type];
        switch (personality.speedPattern) {
          case 'erratic':
            newSpeed = obstacle.baseSpeed * (0.5 + Math.random() * 1.5) * direction;
            break;
          case 'zigzag':
            newSpeed = obstacle.baseSpeed * (0.8 + Math.sin(currentTime * 0.005) * 0.4) * direction;
            break;
          case 'bouncy':
            newSpeed = obstacle.baseSpeed * (1 + Math.sin(currentTime * 0.01) * 0.3) * direction;
            break;
        }
        obstacle.nextSpeedChange = currentTime + 1000 + Math.random() * 2000;
      }

      return {
        ...obstacle,
        x: obstacle.x + newSpeed,
        speed: newSpeed,
        rotation: obstacle.rotation + 0.05,
        wobble: obstacle.wobble + 0.1,
        wheelRotation: obstacle.wheelRotation + Math.abs(newSpeed) * 0.1,
        eyePosition: Math.sin(currentTime * 0.01) * 2
      };
    }).filter(obstacle => obstacle.x > -200 && obstacle.x < CANVAS_WIDTH + 200));

    // Update power-ups
    setPowerUps(prev => prev.map(powerUp => ({
      ...powerUp,
      floatPhase: powerUp.floatPhase + 0.1,
      rotation: powerUp.rotation + 0.05
    })));

    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      z: particle.z + particle.vz,
      life: particle.life - 1,
      rotation: particle.rotation + 0.1,
      vy: particle.vy + 0.2 // Gravity
    })).filter(particle => particle.life > 0));

    // Update witty messages
    setWittyTexts(prev => prev.map(message => ({
      ...message,
      life: message.life - 1
    })).filter(message => message.life > 0));

    // Spawn obstacles with enhanced timing
    for (let row = 1; row < LANES - 1; row++) {
      if (row === SAFE_ZONE_ROW) continue;
      
      spawnTimers.current[row] -= deltaTime;
      if (spawnTimers.current[row] <= 0) {
        if (Math.random() < currentDifficulty.spawnRate * 0.01) {
          spawnObstacle(row);
        }
        // Variable spawn timing based on difficulty
        spawnTimers.current[row] = 800 + Math.random() * 1200 - (level * 50);
      }
    }

    // Spawn power-ups
    spawnPowerUp();

    // Collision detection
    checkCollisions();

    // Render
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        render(ctx, currentTime);
      }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, render, spawnObstacle, spawnPowerUp, level, currentDifficulty]);

  // Enhanced collision detection
  const checkCollisions = useCallback(() => {
    if (player.invulnerable > 0) return;

    // Check obstacle collisions
    const playerRect = {
      x: player.x - GRID_SIZE / 3,
      y: player.y - GRID_SIZE / 3,
      width: GRID_SIZE * 2 / 3,
      height: GRID_SIZE * 2 / 3
    };

    for (const obstacle of obstacles) {
      if (obstacle.row === player.row) {
        const obstacleRect = {
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        };

        if (isColliding(playerRect, obstacleRect)) {
          handlePlayerHit();
          return;
        }
      }
    }

    // Check power-up collection
    for (const powerUp of powerUps) {
      if (!powerUp.collected && powerUp.row === player.row) {
        const distance = Math.sqrt(
          Math.pow(player.x - powerUp.x, 2) + 
          Math.pow(player.y - powerUp.y, 2)
        );

        if (distance < GRID_SIZE) {
          collectPowerUp(powerUp);
        }
      }
    }
  }, [player, obstacles, powerUps]);

  // Enhanced collision detection helper
  const isColliding = (rect1: any, rect2: any): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // Handle player hit with enhanced effects
  const handlePlayerHit = useCallback(() => {
    addWittyMessage(wittyMessages.collision[Math.floor(Math.random() * wittyMessages.collision.length)], 
                   player.x, player.y, '#FF6B6B', '18px Comic Sans MS');
    
    createParticle(player.x, player.y, 'explosion');
    
    setPlayer(prev => ({
      ...prev,
      lives: prev.lives - 1,
      invulnerable: 120, // 2 seconds at 60fps
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      x: Math.floor(COLS / 2) * GRID_SIZE,
      y: PLAYER_START_ROW * LANE_HEIGHT,
      streakCount: 0
    }));

    if (player.lives <= 1) {
      setGameState('gameOver');
      saveGameResult(score, level);
    }
  }, [player, addWittyMessage, createParticle, score, level, saveGameResult]);

  // Enhanced power-up collection
  const collectPowerUp = useCallback((powerUp: PowerUp3D) => {
    setPowerUps(prev => prev.map(p => 
      p.id === powerUp.id ? { ...p, collected: true } : p
    ));

    const personality = powerUpPersonalities[powerUp.type];
    addWittyMessage(personality.name + '!', powerUp.x, powerUp.y, personality.color, '16px Comic Sans MS');
    createParticle(powerUp.x, powerUp.y, 'sparkle');

    // Apply power-up effects
    switch (powerUp.type) {
      case 'super-shield':
        setPlayer(prev => ({ ...prev, invulnerable: 300 }));
        break;
      case 'time-freeze':
        setCurrentDifficulty(prev => ({ ...prev, speedMultiplier: prev.speedMultiplier * 0.3 }));
        setTimeout(() => {
          setCurrentDifficulty(prev => ({ ...prev, speedMultiplier: prev.speedMultiplier / 0.3 }));
        }, 3000);
        break;
      case 'giggle-gas':
        // Slow down nearby obstacles
        setObstacles(prev => prev.map(obs => 
          Math.abs(obs.row - powerUp.row) <= 1 ? { ...obs, speed: obs.speed * 0.5 } : obs
        ));
        break;
      case 'rainbow-rush':
        setPlayer(prev => ({ ...prev, scale: 1.2 }));
        setTimeout(() => {
          setPlayer(prev => ({ ...prev, scale: 1 }));
        }, 2000);
        break;
      case 'lucky-star':
        setScore(prev => prev + 100);
        break;
      case 'mega-hop':
        // Instant teleport to safe zone
        setPlayer(prev => ({
          ...prev,
          row: SAFE_ZONE_ROW,
          y: SAFE_ZONE_ROW * LANE_HEIGHT
        }));
        break;
    }

    setScore(prev => prev + 50);
  }, [addWittyMessage, createParticle]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          movePlayer('up');
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          movePlayer('right');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'playing') {
            setGameState('paused');
          } else if (gameState === 'paused') {
            setGameState('playing');
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movePlayer, gameState]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastFrameTime.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Game start/restart
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setTimeElapsed(0);
    setPlayer({
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2),
      x: Math.floor(COLS / 2) * GRID_SIZE,
      y: PLAYER_START_ROW * LANE_HEIGHT,
      z: 0,
      lives: 3,
      scale: 1,
      rotation: 0,
      bouncePhase: 0,
      shadowOpacity: 0.3,
      invulnerable: 0,
      streakCount: 0,
      lastMove: 0
    });
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setWittyTexts([]);
    setCurrentDifficulty({
      spawnRate: 1.0,
      speedMultiplier: 1.0,
      obstacleVariety: 3,
      smartObstacles: false,
      chaosMode: false
    });
    spawnTimers.current = new Array(LANES).fill(0);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <Card className="w-full max-w-6xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎮 Enhanced 3D Playground Safety Adventure 🎮
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">
            Navigate through chaotic playground obstacles with style and wit! 
            Now with enhanced 3D graphics, personality-driven obstacles, and maximum difficulty!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {gameState === 'menu' && (
            <div className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">🚀 Enhanced Features</h3>
                  <ul className="text-left space-y-1">
                    <li>• Full 3D perspective graphics</li>
                    <li>• Smart AI obstacles with personalities</li>
                    <li>• 6 unique obstacle types</li>
                    <li>• Witty commentary system</li>
                    <li>• Enhanced particle effects</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">🎯 Difficulty Features</h3>
                  <ul className="text-left space-y-1">
                    <li>• No easy initial crossing</li>
                    <li>• Adaptive obstacle spawning</li>
                    <li>• Smart gap-filling AI</li>
                    <li>• Progressive chaos mode</li>
                    <li>• Dynamic speed variations</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">⭐ Power-ups</h3>
                  <ul className="text-left space-y-1">
                    <li>• Bubble Wrap Shield</li>
                    <li>• Naptime Clock</li>
                    <li>• Giggle Gas</li>
                    <li>• Rainbow Rush</li>
                    <li>• Lucky Star & Mega Hop</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">🎮 Controls</h3>
                <p>Use ARROW KEYS or WASD to move • SPACEBAR to pause • Watch for witty commentary!</p>
              </div>
              
              <Button 
                onClick={startGame}
                className="text-xl px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                🚀 Start Enhanced Adventure!
              </Button>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-red-600">Game Over!</h2>
              <p className="text-lg">Final Score: <span className="font-bold text-green-600">{score}</span></p>
              <p className="text-lg">Levels Completed: <span className="font-bold text-blue-600">{level - 1}</span></p>
              <p className="text-sm text-gray-600">Those playground obstacles got the better of you this time!</p>
              <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
                Try Again!
              </Button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Score: {score}</div>
                  <div className="text-sm text-gray-600">Level: {level}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-sm">Lives: {'❤️'.repeat(player.lives)}</div>
                  <div className="text-sm text-gray-600">Streak: {player.streakCount}</div>
                </div>
              </div>
              
              {gameState === 'paused' && (
                <div className="text-center bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-800">Game Paused</h3>
                  <p className="text-sm text-gray-600">Press SPACEBAR to continue</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-4 border-gray-300 rounded-lg shadow-lg bg-gradient-to-b from-sky-200 to-green-200"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Enhanced 3D Playground Safety Game - Navigate with style and avoid the chaos!</p>
            <p className="font-bold">New: Smart obstacles that adapt to your movements!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}