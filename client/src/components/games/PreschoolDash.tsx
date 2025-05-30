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
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Sparkles,
  BookOpen,
  Users,
  Timer
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Player {
  x: number;
  y: number;
  lane: number; // 0, 1, or 2 (left, center, right)
  isJumping: boolean;
  isSliding: boolean;
  speed: number;
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  lane: number;
  type: 'collectible' | 'obstacle' | 'powerup';
  subtype: string;
  label: string;
  points: number;
  effect?: string;
  collected: boolean;
}

interface PowerUp {
  type: string;
  timeLeft: number;
  active: boolean;
}

interface GameStats {
  score: number;
  distance: number;
  level: number;
  lives: number;
  combo: number;
  pointsEarned: number;
  showPointAnimation: boolean;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const LANE_WIDTH = GAME_WIDTH / 3;
const PLAYER_SIZE = 40;
const ITEM_SIZE = 30;

// Game items configuration
const COLLECTIBLES = [
  { subtype: 'praise', label: 'Specific Praise', points: 10, color: '#10b981', icon: '👏' },
  { subtype: 'choice', label: 'Offer Choice', points: 15, color: '#3b82f6', icon: '🤝' },
  { subtype: 'story', label: 'Read Aloud', points: 20, color: '#8b5cf6', icon: '📚' },
  { subtype: 'routine', label: 'Clear Routine', points: 12, color: '#f59e0b', icon: '⏰' }
];

const OBSTACLES = [
  { 
    subtype: 'yelling', 
    label: 'Yelling No', 
    points: -10, 
    color: '#ef4444', 
    icon: '🚫',
    explanation: 'Yelling "No" without explanation confuses children and doesn\'t teach them why the behavior is inappropriate. Instead, use calm, specific guidance like "Please use gentle hands with friends."'
  },
  { 
    subtype: 'missed_cue', 
    label: 'Missed Name Call', 
    points: -5, 
    color: '#f97316', 
    icon: '😔',
    explanation: 'Missing name calls makes children feel invisible and disconnected. Greeting each child by name builds strong relationships and shows you value their presence in the classroom.'
  },
  { 
    subtype: 'ignore_emotion', 
    label: 'Ignoring Emotions', 
    points: -15, 
    color: '#dc2626', 
    icon: '💔',
    explanation: 'Ignoring children\'s emotions teaches them their feelings don\'t matter. Instead, acknowledge their feelings first: "I see you\'re upset" before redirecting behavior.'
  },
  { 
    subtype: 'rushed', 
    label: 'Rushing Transitions', 
    points: -8, 
    color: '#b91c1c', 
    icon: '⚡',
    explanation: 'Rushing transitions creates anxiety and behavioral problems. Give children warnings ("5 more minutes") and clear expectations to help them feel secure during changes.'
  }
];

const POWERUPS = [
  { subtype: 'compassion', label: 'Compassion Shield', duration: 10000, color: '#06d6a0', icon: '🛡️' },
  { subtype: 'timeout_turbo', label: 'Time-Out Turbo', duration: 5000, color: '#ffd23f', icon: '🚀' },
  { subtype: 'reflection', label: 'Reflection Beacon', duration: 3000, color: '#9d4edd', icon: '💡' }
];

export default function PreschoolDash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 80,
    lane: 1,
    isJumping: false,
    isSliding: false,
    speed: 3
  });

  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    level: 1,
    lives: 3,
    combo: 0,
    pointsEarned: 0,
    showPointAnimation: false
  });

  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<PowerUp[]>([]);
  const [showTip, setShowTip] = useState<{ message: string; type: 'positive' | 'negative' } | null>(null);
  const [showExplanation, setShowExplanation] = useState<{ title: string; explanation: string } | null>(null);
  const [lastItemGenerated, setLastItemGenerated] = useState(0);

  // Initialize game
  const initializeGame = useCallback(() => {
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      lane: 1,
      isJumping: false,
      isSliding: false,
      speed: 3
    });
    
    setGameStats({
      score: 0,
      distance: 0,
      level: 1,
      lives: 3,
      combo: 0,
      pointsEarned: 0,
      showPointAnimation: false
    });
    
    setGameItems([]);
    setActivePowerUps([]);
    setShowTip(null);
    setLastItemGenerated(0);
  }, []);

  // Generate random game items
  const generateGameItem = useCallback((distance: number) => {
    const lane = Math.floor(Math.random() * 3);
    const itemType = Math.random();
    
    let item: GameItem;
    
    if (itemType < 0.5) {
      // Collectible
      const collectible = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
      item = {
        id: `collectible-${Date.now()}-${Math.random()}`,
        x: lane * LANE_WIDTH + LANE_WIDTH / 2,
        y: -ITEM_SIZE,
        lane,
        type: 'collectible',
        subtype: collectible.subtype,
        label: collectible.label,
        points: collectible.points,
        collected: false
      };
    } else if (itemType < 0.8) {
      // Obstacle
      const obstacle = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
      item = {
        id: `obstacle-${Date.now()}-${Math.random()}`,
        x: lane * LANE_WIDTH + LANE_WIDTH / 2,
        y: -ITEM_SIZE,
        lane,
        type: 'obstacle',
        subtype: obstacle.subtype,
        label: obstacle.label,
        points: obstacle.points,
        collected: false
      };
    } else {
      // Power-up
      const powerup = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
      item = {
        id: `powerup-${Date.now()}-${Math.random()}`,
        x: lane * LANE_WIDTH + LANE_WIDTH / 2,
        y: -ITEM_SIZE,
        lane,
        type: 'powerup',
        subtype: powerup.subtype,
        label: powerup.label,
        points: 0,
        effect: powerup.subtype,
        collected: false
      };
    }
    
    return item;
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setPlayer(prev => ({ 
            ...prev, 
            lane: Math.max(0, prev.lane - 1),
            x: Math.max(0, prev.lane - 1) * LANE_WIDTH + LANE_WIDTH / 2
          }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setPlayer(prev => ({ 
            ...prev, 
            lane: Math.min(2, prev.lane + 1),
            x: Math.min(2, prev.lane + 1) * LANE_WIDTH + LANE_WIDTH / 2
          }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          if (!player.isJumping && !player.isSliding) {
            setPlayer(prev => ({ ...prev, isJumping: true }));
            setTimeout(() => {
              setPlayer(prev => ({ ...prev, isJumping: false }));
            }, 500);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (!player.isJumping && !player.isSliding) {
            setPlayer(prev => ({ ...prev, isSliding: true }));
            setTimeout(() => {
              setPlayer(prev => ({ ...prev, isSliding: false }));
            }, 300);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, player.isJumping, player.isSliding]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update distance and score
    setGameStats(prev => ({
      ...prev,
      distance: prev.distance + player.speed,
      score: prev.score + Math.floor(player.speed / 10)
    }));

    // Generate new items
    setGameItems(prevItems => {
      let items = [...prevItems];
      
      // Generate new items periodically
      if (Math.random() < 0.03) {
        items.push(generateGameItem(gameStats.distance));
      }
      
      // Move items down and remove off-screen items (slower for better readability)
      items = items
        .map(item => ({ ...item, y: item.y + player.speed * 1.2 }))
        .filter(item => item.y < GAME_HEIGHT + 50);
      
      return items;
    });

    // Check collisions
    setGameItems(prevItems => {
      return prevItems.map(item => {
        if (item.collected) return item;
        
        const playerLane = player.lane;
        const itemLane = item.lane;
        const distance = Math.abs(item.y - player.y);
        
        if (playerLane === itemLane && distance < 40) {
          // Collision detected
          if (item.type === 'collectible') {
            setGameStats(prev => ({
              ...prev,
              score: prev.score + item.points,
              combo: prev.combo + 1
            }));
            setShowTip({ message: `+${item.points} ${item.label}!`, type: 'positive' });
          } else if (item.type === 'obstacle') {
            const hasShield = activePowerUps.some(p => p.type === 'compassion' && p.active);
            if (!hasShield) {
              setGameStats(prev => ({
                ...prev,
                score: Math.max(0, prev.score + item.points),
                combo: 0,
                lives: prev.lives - 1
              }));
              setShowTip({ message: `${item.label} - ${item.points} points!`, type: 'negative' });
              
              // Show explanation for why this practice isn't recommended
              const obstacleConfig = OBSTACLES.find(o => o.subtype === item.subtype);
              if (obstacleConfig && obstacleConfig.explanation) {
                setShowExplanation({
                  title: `Why avoid "${item.label}"?`,
                  explanation: obstacleConfig.explanation
                });
                setTimeout(() => setShowExplanation(null), 6000); // Show for 6 seconds
              }
            }
          } else if (item.type === 'powerup') {
            const powerupConfig = POWERUPS.find(p => p.subtype === item.subtype);
            if (powerupConfig) {
              setActivePowerUps(prev => [...prev, {
                type: item.subtype,
                timeLeft: powerupConfig.duration,
                active: true
              }]);
              setShowTip({ message: `${item.label} activated!`, type: 'positive' });
            }
          }
          
          setTimeout(() => setShowTip(null), 2000);
          return { ...item, collected: true };
        }
        
        return item;
      });
    });

    // Update power-ups
    setActivePowerUps(prev => 
      prev
        .map(powerup => ({ ...powerup, timeLeft: powerup.timeLeft - 16 }))
        .filter(powerup => powerup.timeLeft > 0)
    );

    // Check game over
    if (gameStats.lives <= 0) {
      setGameState('gameOver');
      
      // Award points for distance traveled (capped at 5 points maximum)
      const basePoints = Math.floor(gameStats.distance / 200); // Reduced from /100 to /200
      const distancePoints = Math.min(5, basePoints); // Cap at 5 points maximum
      setGameStats(prev => ({ 
        ...prev, 
        pointsEarned: distancePoints,
        showPointAnimation: true 
      }));
      
      // Award points to user account
      setTimeout(async () => {
        try {
          await apiRequest('/api/auth/update-points', {
            method: 'POST',
            data: { points: distancePoints }
          });
        } catch (error) {
          console.error('Error updating points:', error);
        }
        setGameStats(prev => ({ ...prev, showPointAnimation: false }));
      }, 2000);
    }
  }, [gameState, player, gameStats, activePowerUps, generateGameItem]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, 16) as NodeJS.Timeout;
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background (Preschool Parkway)
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98fb98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw lanes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, GAME_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw player
    const playerY = player.isJumping ? player.y - 30 : (player.isSliding ? player.y + 15 : player.y);
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(player.x, playerY, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw teacher emoji on player
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👩‍🏫', player.x, playerY + 8);

    // Draw game items
    gameItems.forEach(item => {
      if (item.collected) return;
      
      let config;
      if (item.type === 'collectible') {
        config = COLLECTIBLES.find(c => c.subtype === item.subtype);
      } else if (item.type === 'obstacle') {
        config = OBSTACLES.find(o => o.subtype === item.subtype);
      } else {
        config = POWERUPS.find(p => p.subtype === item.subtype);
      }
      
      if (config) {
        // Draw item background
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, ITEM_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw item icon
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(config.icon, item.x, item.y + 5);
        
        // Draw label
        ctx.font = '10px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(item.label, item.x, item.y + 25);
      }
    });
  });

  const startGame = () => {
    initializeGame();
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('menu');
    initializeGame();
  };

  // Mobile controls
  const moveLeft = () => {
    if (gameState !== 'playing') return;
    setPlayer(prev => ({ 
      ...prev, 
      lane: Math.max(0, prev.lane - 1),
      x: Math.max(0, prev.lane - 1) * LANE_WIDTH + LANE_WIDTH / 2
    }));
  };

  const moveRight = () => {
    if (gameState !== 'playing') return;
    setPlayer(prev => ({ 
      ...prev, 
      lane: Math.min(2, prev.lane + 1),
      x: Math.min(2, prev.lane + 1) * LANE_WIDTH + LANE_WIDTH / 2
    }));
  };

  const jump = () => {
    if (gameState !== 'playing' || player.isJumping || player.isSliding) return;
    setPlayer(prev => ({ ...prev, isJumping: true }));
    setTimeout(() => {
      setPlayer(prev => ({ ...prev, isJumping: false }));
    }, 500);
  };

  const slide = () => {
    if (gameState !== 'playing' || player.isJumping || player.isSliding) return;
    setPlayer(prev => ({ ...prev, isSliding: true }));
    setTimeout(() => {
      setPlayer(prev => ({ ...prev, isSliding: false }));
    }, 300);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Point Animation Overlay */}
      {gameStats.showPointAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold animate-bounce shadow-lg">
            +{gameStats.pointsEarned} Points!
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg">
        <div>
          <h2 className="text-2xl font-bold">Preschool Dash</h2>
          <p className="text-green-100">Sprint down Early Learning Lane!</p>
        </div>
        <div className="flex items-center space-x-4 text-right">
          <div>
            <div className="text-sm opacity-90">Score</div>
            <div className="text-xl font-bold">{gameStats.score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Distance</div>
            <div className="text-xl font-bold">{Math.floor(gameStats.distance)}m</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Lives</div>
            <div className="flex space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart 
                  key={i} 
                  className={`h-5 w-5 ${i < gameStats.lives ? 'text-red-400 fill-current' : 'text-gray-400'}`} 
                />
              ))}
            </div>
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
            className="border rounded-lg w-full h-auto max-w-full"
          />
          
          {/* Tip Overlay */}
          {showTip && (
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white font-bold text-sm ${
              showTip.type === 'positive' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {showTip.message}
            </div>
          )}
          
          {/* Explanation Overlay */}
          {showExplanation && (
            <div className="absolute top-16 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg border-2 border-blue-400">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-300 text-lg">💡</div>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-300 mb-2">{showExplanation.title}</h4>
                  <p className="text-sm leading-relaxed">{showExplanation.explanation}</p>
                </div>
                <button 
                  onClick={() => setShowExplanation(null)}
                  className="text-white hover:text-yellow-300 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Power-ups Display */}
      {activePowerUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Power-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              {activePowerUps.map((powerup, index) => {
                const config = POWERUPS.find(p => p.subtype === powerup.type);
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="text-lg">{config?.icon}</div>
                    <div>
                      <div className="text-xs font-bold">{config?.label}</div>
                      <div className="text-xs text-gray-600">{Math.ceil(powerup.timeLeft / 1000)}s</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-center text-sm font-bold">Movement</div>
              <div className="flex justify-center space-x-2">
                <Button onClick={moveLeft} disabled={gameState !== 'playing'}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button onClick={moveRight} disabled={gameState !== 'playing'}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-center text-sm font-bold">Actions</div>
              <div className="flex justify-center space-x-2">
                <Button onClick={jump} disabled={gameState !== 'playing'}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button onClick={slide} disabled={gameState !== 'playing'}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Desktop: Use WASD or Arrow Keys
          </div>
        </CardContent>
      </Card>

      {/* Game Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center space-x-4">
            {gameState === 'menu' && (
              <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            )}
            
            {gameState === 'playing' && (
              <Button onClick={pauseGame} className="bg-yellow-500 hover:bg-yellow-600">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            {gameState === 'paused' && (
              <>
                <Button onClick={resumeGame} className="bg-green-500 hover:bg-green-600">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button onClick={resetGame} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
            
            {gameState === 'gameOver' && (
              <>
                <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
                  <Play className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={resetGame} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Main Menu
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Instructions */}
      {gameState === 'menu' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gamepad2 className="h-5 w-5 mr-2" />
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-green-600 mb-2">Collect Good Practices:</h4>
                <ul className="text-sm space-y-1">
                  <li>👏 Specific Praise (+10 pts)</li>
                  <li>🤝 Offer Choice (+15 pts)</li>
                  <li>📚 Read Aloud (+20 pts)</li>
                  <li>⏰ Clear Routine (+12 pts)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-600 mb-2">Avoid Pitfalls:</h4>
                <ul className="text-sm space-y-1">
                  <li>🚫 Yelling No (-10 pts)</li>
                  <li>😔 Missed Name Call (-5 pts)</li>
                  <li>💔 Ignoring Emotions (-15 pts)</li>
                  <li>⚡ Rushing Transitions (-8 pts)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-blue-600 mb-2">Power-ups:</h4>
              <div className="text-sm grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>🛡️ Compassion Shield (10s invincibility)</div>
                <div>🚀 Time-Out Turbo (5s speed boost)</div>
                <div>💡 Reflection Beacon (3s learning pause)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Game Over!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-lg">Final Score: <span className="font-bold">{gameStats.score.toLocaleString()}</span></div>
              <div className="text-lg">Distance: <span className="font-bold">{Math.floor(gameStats.distance)}m</span></div>
              <div className="text-lg">Points Earned: <span className="font-bold text-green-600">+{gameStats.pointsEarned}</span></div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold text-green-700 mb-2">Learning Recap:</h4>
                <p className="text-sm text-green-600">
                  Great job practicing ECE best practices! Remember: specific praise, offering choices, 
                  and validating emotions are key to supporting children's development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}