import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Star, 
  Shield, 
  Zap,
  Heart,
  Award,
  Target,
  Coins,
  Sparkles
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface GameBrick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  term: string;
  definition: string;
  category: string;
  color: string;
  isLocked: boolean;
  health: number;
  maxHealth: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'research' | 'multiball' | 'sticky' | 'key';
  active: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  level: number;
  score: number;
  lives: number;
  combo: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  victory: boolean;
  showDefinition: boolean;
  currentDefinition: { term: string; definition: string; category: string } | null;
  userPoints: number;
  gameStarted: boolean;
  pointsEarned: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 5;

// CDA Level Data
const LEVEL_DATA = [
  {
    level: 1,
    title: "Health & Safety",
    color: "#10b981", // green
    bricks: [
      { term: "Handwashing", definition: "Proper technique to prevent spread of germs and illness", category: "Health & Safety" },
      { term: "Diapering", definition: "Safe and sanitary diaper changing procedures", category: "Health & Safety" },
      { term: "First Aid", definition: "Immediate care for injuries or medical emergencies", category: "Health & Safety" },
      { term: "Sanitation", definition: "Maintaining clean and hygienic environment", category: "Health & Safety" },
      { term: "Emergency Plan", definition: "Procedures for handling various emergency situations", category: "Health & Safety" },
      { term: "Food Safety", definition: "Proper handling and storage of food to prevent illness", category: "Health & Safety" },
      { term: "Medication", definition: "Safe administration and storage of children's medicines", category: "Health & Safety" },
      { term: "Injury Report", definition: "Documentation of any injuries that occur in care", category: "Health & Safety" }
    ]
  },
  {
    level: 2,
    title: "Classroom Management",
    color: "#3b82f6", // blue
    bricks: [
      { term: "Transitions", definition: "Smooth movement between activities and routines", category: "Classroom Management" },
      { term: "Positive Reinforcement", definition: "Encouraging good behavior through praise and rewards", category: "Classroom Management" },
      { term: "Routines", definition: "Consistent daily schedule and procedures", category: "Classroom Management" },
      { term: "Expectations", definition: "Clear behavioral guidelines for children", category: "Classroom Management" },
      { term: "Redirection", definition: "Guiding children toward appropriate behavior", category: "Classroom Management" },
      { term: "Environment", definition: "Physical space organized for learning and safety", category: "Classroom Management" },
      { term: "Group Time", definition: "Structured activities with all children together", category: "Classroom Management" },
      { term: "Quiet Spaces", definition: "Areas for children to self-regulate and calm down", category: "Classroom Management" }
    ]
  },
  {
    level: 3,
    title: "Curriculum & Instruction",
    color: "#8b5cf6", // purple
    bricks: [
      { term: "DAP", definition: "Developmentally Appropriate Practice based on child development", category: "Curriculum & Instruction" },
      { term: "Scaffolding", definition: "Providing just enough support for children to succeed", category: "Curriculum & Instruction" },
      { term: "Lesson Planning", definition: "Intentional design of learning experiences", category: "Curriculum & Instruction" },
      { term: "Assessment", definition: "Ongoing observation and documentation of learning", category: "Curriculum & Instruction" },
      { term: "Learning Centers", definition: "Organized areas for specific types of play and learning", category: "Curriculum & Instruction" },
      { term: "Emergent Curriculum", definition: "Following children's interests to guide learning", category: "Curriculum & Instruction" },
      { term: "Documentation", definition: "Recording children's learning through photos and notes", category: "Curriculum & Instruction" },
      { term: "Standards", definition: "Early learning guidelines and benchmarks", category: "Curriculum & Instruction" }
    ]
  },
  {
    level: 4,
    title: "Child Development",
    color: "#f59e0b", // orange
    bricks: [
      { term: "Attachment", definition: "Strong emotional bond between child and caregiver", category: "Child Development" },
      { term: "Serve-and-Return", definition: "Back-and-forth interactions that build brain connections", category: "Child Development" },
      { term: "Fine Motor", definition: "Small muscle skills like writing and cutting", category: "Child Development" },
      { term: "Gross Motor", definition: "Large muscle skills like running and jumping", category: "Child Development" },
      { term: "Social Skills", definition: "Ability to interact appropriately with others", category: "Child Development" },
      { term: "Emotional Regulation", definition: "Managing feelings and responses appropriately", category: "Child Development" },
      { term: "Language Development", definition: "Growth in communication and vocabulary skills", category: "Child Development" },
      { term: "Cognitive Growth", definition: "Development of thinking and problem-solving skills", category: "Child Development" }
    ]
  },
  {
    level: 5,
    title: "Family & Community",
    color: "#ec4899", // pink
    bricks: [
      { term: "Family Partnership", definition: "Collaborative relationship with families", category: "Family & Community" },
      { term: "Cultural Competency", definition: "Understanding and respecting diverse backgrounds", category: "Family & Community" },
      { term: "Community Resources", definition: "Local services and support for families", category: "Family & Community" },
      { term: "Communication", definition: "Clear and respectful information sharing", category: "Family & Community" },
      { term: "Home Visits", definition: "Meeting families in their own environment", category: "Family & Community" },
      { term: "Conferences", definition: "Formal meetings to discuss child's progress", category: "Family & Community" },
      { term: "Inclusion", definition: "Welcoming all children and families regardless of differences", category: "Family & Community" },
      { term: "Advocacy", definition: "Speaking up for children and families' needs", category: "Family & Community" }
    ]
  }
];

export default function BounceAwayBlocks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const { toast } = useToast();

  // Sound effects
  const playSound = (type: 'hit' | 'score' | 'levelup' | 'powerup' | 'gamestart') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      switch (type) {
        case 'hit':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          break;
        case 'score':
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
          break;
        case 'levelup':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.3);
          break;
        case 'powerup':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.2);
          break;
        case 'gamestart':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.5);
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

  // Create particles
  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };
  
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    lives: 3,
    combo: 0,
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    victory: false,
    showDefinition: false,
    currentDefinition: null,
    userPoints: 0,
    gameStarted: false,
    pointsEarned: 0
  });

  const [paddle, setPaddle] = useState({ x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - 40 });
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<GameBrick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stickyPaddle, setStickyPaddle] = useState(false);
  const [ballAttached, setBallAttached] = useState(true);

  // Initialize level
  const initializeLevel = useCallback((levelNum: number) => {
    const levelData = LEVEL_DATA[levelNum - 1];
    if (!levelData) return;

    const newBricks: GameBrick[] = [];
    const bricksPerRow = Math.floor(GAME_WIDTH / (BRICK_WIDTH + BRICK_PADDING));
    const rows = Math.ceil(levelData.bricks.length / bricksPerRow);

    levelData.bricks.forEach((brickData, index) => {
      const row = Math.floor(index / bricksPerRow);
      const col = index % bricksPerRow;
      const x = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING;
      const y = row * (BRICK_HEIGHT + BRICK_PADDING) + 60;

      newBricks.push({
        id: `brick-${index}`,
        x,
        y,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        term: brickData.term,
        definition: brickData.definition,
        category: brickData.category,
        color: levelData.color,
        isLocked: false,
        health: 1,
        maxHealth: 1
      });
    });

    setBricks(newBricks);
    setBalls([{
      x: paddle.x + PADDLE_WIDTH / 2,
      y: paddle.y - BALL_RADIUS,
      dx: 0,
      dy: 0,
      radius: BALL_RADIUS
    }]);
    setBallAttached(true);
    setPowerUps([]);
    setStickyPaddle(false);
  }, [paddle.x, paddle.y]);

  // Fetch user points
  const fetchUserPoints = async () => {
    try {
      const response = await apiRequest('/api/auth/me');
      setGameState(prev => ({ ...prev, userPoints: response.points || 0 }));
    } catch (error) {
      console.error('Failed to fetch user points:', error);
    }
  };

  // Cost to play game
  const playGame = async () => {
    if (gameState.userPoints < 1) {
      toast({
        title: "Not enough points!",
        description: "You need at least 1 point to play this game. Complete modules to earn points!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct 1 point to play
      await apiRequest('/api/auth/update-points', {
        method: 'POST',
        data: { pointsToAdd: -1 }
      });
      
      setGameState(prev => ({ 
        ...prev, 
        userPoints: prev.userPoints - 1,
        gameStarted: true,
        isPlaying: true, 
        gameOver: false, 
        victory: false 
      }));
      
      initializeLevel(gameState.level);
      playSound('gamestart');
      
      toast({
        title: "Game Started!",
        description: "1 point deducted. Complete levels to earn up to 10 points!",
        variant: "default"
      });
      
      if (ballAttached) {
        setBalls(prev => prev.map(ball => ({
          ...ball,
          dx: (Math.random() - 0.5) * 6,
          dy: -5
        })));
        setBallAttached(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Award points for completing level
  const awardLevelPoints = async (levelNum: number) => {
    const pointsAwarded = levelNum * 2; // 2 points per level
    try {
      await apiRequest('/api/auth/update-points', {
        method: 'POST',
        data: { pointsToAdd: pointsAwarded }
      });
      
      setGameState(prev => ({ 
        ...prev, 
        userPoints: prev.userPoints + pointsAwarded,
        pointsEarned: prev.pointsEarned + pointsAwarded
      }));
      
      toast({
        title: `Level ${levelNum} Complete!`,
        description: `You earned ${pointsAwarded} points!`,
        variant: "default"
      });
      
      playSound('levelup');
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  // Start game
  const startGame = () => {
    if (!gameState.gameStarted) {
      playGame();
    } else {
      setGameState(prev => ({ ...prev, isPlaying: true, gameOver: false, victory: false }));
      initializeLevel(gameState.level);
      
      if (ballAttached) {
        setBalls(prev => prev.map(ball => ({
          ...ball,
          dx: (Math.random() - 0.5) * 6,
          dy: -5
        })));
        setBallAttached(false);
      }
    }
  };

  // Pause/Resume game
  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  // Reset game
  const resetGame = () => {
    setGameState({
      level: 1,
      score: 0,
      lives: 3,
      combo: 0,
      isPlaying: false,
      isPaused: false,
      gameOver: false,
      victory: false,
      showDefinition: false,
      currentDefinition: null,
      userPoints: gameState.userPoints, // Keep current points
      gameStarted: false,
      pointsEarned: 0
    });
    setPaddle({ x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - 40 });
    setBalls([]);
    setBricks([]);
    setPowerUps([]);
    setParticles([]);
    setBallAttached(true);
  };



  // Mouse movement for paddle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPaddleX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    
    setPaddle(prev => ({ ...prev, x: newPaddleX }));
    
    if (ballAttached) {
      setBalls(prev => prev.map(ball => ({
        ...ball,
        x: newPaddleX + PADDLE_WIDTH / 2
      })));
    }
  };

  // Click to launch ball
  const handleClick = () => {
    if (!gameState.isPlaying && !gameState.gameOver) {
      startGame();
    } else if (ballAttached) {
      setBalls(prev => prev.map(ball => ({
        ...ball,
        dx: (Math.random() - 0.5) * 6,
        dy: -5
      })));
      setBallAttached(false);
    }
  };

  // Collision detection
  const checkCollisions = useCallback(() => {
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        let newBall = { ...ball };

        // Wall collisions
        if (newBall.x <= newBall.radius || newBall.x >= GAME_WIDTH - newBall.radius) {
          newBall.dx = -newBall.dx;
        }
        if (newBall.y <= newBall.radius) {
          newBall.dy = -newBall.dy;
        }

        // Paddle collision
        if (
          newBall.y + newBall.radius >= paddle.y &&
          newBall.y - newBall.radius <= paddle.y + PADDLE_HEIGHT &&
          newBall.x >= paddle.x &&
          newBall.x <= paddle.x + PADDLE_WIDTH
        ) {
          newBall.dy = -Math.abs(newBall.dy);
          const hitPos = (newBall.x - paddle.x) / PADDLE_WIDTH;
          newBall.dx = (hitPos - 0.5) * 8;
        }

        // Brick collisions
        bricks.forEach(brick => {
          if (
            newBall.x + newBall.radius >= brick.x &&
            newBall.x - newBall.radius <= brick.x + brick.width &&
            newBall.y + newBall.radius >= brick.y &&
            newBall.y - newBall.radius <= brick.y + brick.height
          ) {
            newBall.dy = -newBall.dy;
            
            // Show definition
            setGameState(prev => ({
              ...prev,
              showDefinition: true,
              currentDefinition: {
                term: brick.term,
                definition: brick.definition,
                category: brick.category
              },
              score: prev.score + 10 * (prev.combo + 1),
              combo: prev.combo + 1
            }));

            // Remove brick
            setBricks(prevBricks => prevBricks.filter(b => b.id !== brick.id));

            // Generate power-up chance
            if (Math.random() < 0.1) {
              setPowerUps(prev => [...prev, {
                id: `powerup-${Date.now()}`,
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height,
                type: 'research',
                active: true
              }]);
            }

            setTimeout(() => {
              setGameState(prev => ({ ...prev, showDefinition: false, currentDefinition: null }));
            }, 2000);
          }
        });

        return newBall;
      });
    });
  }, [paddle, bricks]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    // Move balls
    setBalls(prevBalls => {
      const updatedBalls = prevBalls.map(ball => ({
        ...ball,
        x: ball.x + ball.dx,
        y: ball.y + ball.dy
      }));

      // Check for balls that fell off screen
      const activeBalls = updatedBalls.filter(ball => ball.y < GAME_HEIGHT + 50);
      
      if (activeBalls.length === 0 && !ballAttached) {
        setGameState(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            return { ...prev, lives: 0, gameOver: true, isPlaying: false };
          }
          return { ...prev, lives: newLives };
        });
        
        // Reset ball
        setBallAttached(true);
        return [{
          x: paddle.x + PADDLE_WIDTH / 2,
          y: paddle.y - BALL_RADIUS,
          dx: 0,
          dy: 0,
          radius: BALL_RADIUS
        }];
      }

      return activeBalls;
    });

    // Move power-ups
    setPowerUps(prev => prev.map(powerUp => ({
      ...powerUp,
      y: powerUp.y + 2
    })).filter(powerUp => powerUp.y < GAME_HEIGHT));

    checkCollisions();

    // Check win condition
    if (bricks.length === 0) {
      if (gameState.level < LEVEL_DATA.length) {
        setGameState(prev => ({ ...prev, level: prev.level + 1 }));
        initializeLevel(gameState.level + 1);
      } else {
        setGameState(prev => ({ ...prev, victory: true, isPlaying: false }));
      }
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.level, paddle, bricks, ballAttached, checkCollisions, initializeLevel]);

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(function loop() {
        gameLoop();
        gameLoopRef.current = requestAnimationFrame(loop);
      });
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
  }, [gameState.isPlaying, gameState.isPaused, gameLoop]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(brick.term, brick.x + brick.width / 2, brick.y + brick.height / 2 + 3);
    });

    // Draw paddle
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw balls
    balls.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });

  const currentLevel = LEVEL_DATA[gameState.level - 1];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Game Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
        <div>
          <h2 className="text-2xl font-bold">Bounce-Away Blocks 2.0</h2>
          <p className="text-blue-100">Level {gameState.level}: {currentLevel?.title}</p>
        </div>
        <div className="flex items-center space-x-4 text-right">
          <div>
            <div className="text-sm opacity-90">Score</div>
            <div className="text-xl font-bold">{gameState.score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Lives</div>
            <div className="flex space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart 
                  key={i} 
                  className={`h-5 w-5 ${i < gameState.lives ? 'text-red-400 fill-current' : 'text-gray-400'}`} 
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90">Combo</div>
            <div className="text-xl font-bold">×{gameState.combo}</div>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <Card className="relative">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border rounded-lg cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          />
          
          {/* Game State Overlays */}
          {!gameState.isPlaying && !gameState.gameOver && !gameState.victory && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Trophy className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Ready to Play?</h3>
                <p className="mb-4">Click to start Level {gameState.level}: {currentLevel?.title}</p>
                <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600">
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {gameState.isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Pause className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Game Paused</h3>
                <Button onClick={togglePause} className="bg-blue-500 hover:bg-blue-600">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              </div>
            </div>
          )}

          {gameState.gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Target className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-2xl font-bold mb-2">Game Over</h3>
                <p className="mb-4">Final Score: {gameState.score.toLocaleString()}</p>
                <Button onClick={resetGame} className="bg-red-500 hover:bg-red-600">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {gameState.victory && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Award className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                <p className="mb-2">You've mastered all CDA competencies!</p>
                <p className="mb-4">Final Score: {gameState.score.toLocaleString()}</p>
                <Button onClick={resetGame} className="bg-green-500 hover:bg-green-600">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {/* Definition Popup */}
          {gameState.showDefinition && gameState.currentDefinition && (
            <div className="absolute top-4 left-4 right-4 bg-white/95 p-4 rounded-lg border-2 border-blue-500 shadow-lg">
              <Badge className="mb-2">{gameState.currentDefinition.category}</Badge>
              <h4 className="font-bold text-lg text-blue-800">{gameState.currentDefinition.term}</h4>
              <p className="text-gray-700">{gameState.currentDefinition.definition}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Controls */}
      <div className="flex items-center justify-center space-x-4">
        {gameState.isPlaying && !gameState.gameOver && (
          <Button onClick={togglePause} variant="outline">
            {gameState.isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {gameState.isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button onClick={resetGame} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Game
        </Button>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            CDA Competency Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {LEVEL_DATA.map((level, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: gameState.level > index + 1 ? level.color : '#e5e7eb' }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${gameState.level === index + 1 ? 'text-blue-600' : gameState.level > index + 1 ? 'text-green-600' : 'text-gray-500'}`}>
                      Level {index + 1}: {level.title}
                    </span>
                    {gameState.level > index + 1 && <Badge className="bg-green-500">Complete</Badge>}
                    {gameState.level === index + 1 && <Badge className="bg-blue-500">Current</Badge>}
                  </div>
                  {gameState.level === index + 1 && (
                    <Progress 
                      value={(level.bricks.length - bricks.length) / level.bricks.length * 100} 
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}