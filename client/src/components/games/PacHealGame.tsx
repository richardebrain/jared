import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Ghost, Star, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  id: number;
  position: Position;
  direction: Position;
  type: 'freeze' | 'helper';
  emotion: string;
}

interface BadFeeling {
  id: number;
  position: Position;
  type: 'fear' | 'shame' | 'anger' | 'worry';
  eaten: boolean;
}

interface Affirmation {
  type: string;
  message: string;
}

const AFFIRMATIONS: Record<string, Affirmation> = {
  fear: { type: 'courage', message: "I am brave and strong" },
  shame: { type: 'worth', message: "I matter and I'm valued" },
  anger: { type: 'calm', message: "I can stay calm and peaceful" },
  worry: { type: 'trust', message: "I trust that things will be okay" }
};

const MAZE_SIZE = 15;
const CELL_SIZE = 32;

// Simple maze layout (1 = wall, 0 = path)
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const STRATEGY_LABELS = [
  "Deep Breath Alley",
  "Grounding Corner", 
  "Safe Space Lane",
  "Mindful Path",
  "Courage Court",
  "Peace Plaza"
];

export default function PacHealGame() {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [badFeelings, setBadFeelings] = useState<BadFeeling[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'won'>('menu');
  const [collectedAffirmations, setCollectedAffirmations] = useState<string[]>([]);
  const gameLoopRef = useRef<number>();

  // Initialize game
  const initializeGame = useCallback(() => {
    setPlayerPos({ x: 1, y: 1 });
    setScore(0);
    setLives(3);
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setCollectedAffirmations([]);
    
    // Place bad feelings randomly on empty spaces
    const feelings: BadFeeling[] = [];
    let id = 0;
    for (let y = 1; y < MAZE_SIZE - 1; y++) {
      for (let x = 1; x < MAZE_SIZE - 1; x++) {
        if (MAZE_LAYOUT[y][x] === 0 && Math.random() < 0.3) {
          const types: Array<'fear' | 'shame' | 'anger' | 'worry'> = ['fear', 'shame', 'anger', 'worry'];
          feelings.push({
            id: id++,
            position: { x, y },
            type: types[Math.floor(Math.random() * types.length)],
            eaten: false
          });
        }
      }
    }
    setBadFeelings(feelings);

    // Initialize ghosts
    const initialGhosts: Ghost[] = [
      { id: 1, position: { x: 7, y: 7 }, direction: { x: 1, y: 0 }, type: 'freeze', emotion: 'overwhelm' },
      { id: 2, position: { x: 8, y: 7 }, direction: { x: -1, y: 0 }, type: 'freeze', emotion: 'doubt' },
      { id: 3, position: { x: 7, y: 8 }, direction: { x: 0, y: 1 }, type: 'freeze', emotion: 'stress' },
    ];
    setGhosts(initialGhosts);
  }, []);

  // Move player
  const movePlayer = useCallback((direction: Position) => {
    if (gameState !== 'playing') return;

    setPlayerPos(prev => {
      const newPos = {
        x: Math.max(0, Math.min(MAZE_SIZE - 1, prev.x + direction.x)),
        y: Math.max(0, Math.min(MAZE_SIZE - 1, prev.y + direction.y))
      };

      // Check if new position is a wall
      if (MAZE_LAYOUT[newPos.y][newPos.x] === 1) {
        return prev;
      }

      return newPos;
    });
  }, [gameState]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer({ x: 1, y: 0 });
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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move ghosts
      setGhosts(prev => prev.map(ghost => {
        let newPos = {
          x: ghost.position.x + ghost.direction.x,
          y: ghost.position.y + ghost.direction.y
        };

        // Bounce off walls
        if (newPos.x < 1 || newPos.x >= MAZE_SIZE - 1 || 
            newPos.y < 1 || newPos.y >= MAZE_SIZE - 1 ||
            MAZE_LAYOUT[newPos.y][newPos.x] === 1) {
          const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
          ];
          const validDirections = directions.filter(dir => {
            const testPos = {
              x: ghost.position.x + dir.x,
              y: ghost.position.y + dir.y
            };
            return testPos.x >= 1 && testPos.x < MAZE_SIZE - 1 &&
                   testPos.y >= 1 && testPos.y < MAZE_SIZE - 1 &&
                   MAZE_LAYOUT[testPos.y][testPos.x] === 0;
          });
          
          if (validDirections.length > 0) {
            const newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
            return {
              ...ghost,
              direction: newDirection,
              position: {
                x: ghost.position.x + newDirection.x,
                y: ghost.position.y + newDirection.y
              }
            };
          }
          return ghost;
        }

        return { ...ghost, position: newPos };
      }));

      // Update power-up timer
      setPowerUpTimer(prev => {
        const newTimer = Math.max(0, prev - 1);
        if (newTimer === 0) {
          setPowerUpActive(false);
          setGhosts(prev => prev.map(ghost => ({ ...ghost, type: 'freeze' })));
        }
        return newTimer;
      });
    };

    gameLoopRef.current = setInterval(gameLoop, 200);
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState]);

  // Check collisions
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check bad feelings collision
    setBadFeelings(prev => {
      const updated = prev.map(feeling => {
        if (!feeling.eaten && 
            feeling.position.x === playerPos.x && 
            feeling.position.y === playerPos.y) {
          
          setScore(s => s + 100);
          
          // Add affirmation
          const affirmation = AFFIRMATIONS[feeling.type];
          setCollectedAffirmations(prev => [...prev, affirmation.message]);
          
          // Activate power-up
          setPowerUpActive(true);
          setPowerUpTimer(100); // 20 seconds at 200ms intervals
          setGhosts(prev => prev.map(ghost => ({ ...ghost, type: 'helper' })));
          
          return { ...feeling, eaten: true };
        }
        return feeling;
      });
      
      // Check win condition
      if (updated.every(feeling => feeling.eaten)) {
        setGameState('won');
      }
      
      return updated;
    });

    // Check ghost collision
    const collision = ghosts.some(ghost => 
      ghost.position.x === playerPos.x && ghost.position.y === playerPos.y
    );

    if (collision) {
      const collidingGhost = ghosts.find(ghost => 
        ghost.position.x === playerPos.x && ghost.position.y === playerPos.y
      );

      if (collidingGhost?.type === 'freeze') {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
          }
          return newLives;
        });
        // Reset player position
        setPlayerPos({ x: 1, y: 1 });
      } else if (collidingGhost?.type === 'helper') {
        // Helpers give bonus points
        setScore(s => s + 200);
      }
    }
  }, [playerPos, ghosts, gameState]);

  const startGame = () => {
    initializeGame();
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('menu');
  };

  const getEmotionColor = (type: string) => {
    switch (type) {
      case 'fear': return 'bg-purple-500';
      case 'shame': return 'bg-red-500';
      case 'anger': return 'bg-orange-500';
      case 'worry': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Pac-Heal: Emotional Regulation Adventure
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold">Welcome to Pac-Heal!</div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Navigate the maze and collect "bad feelings" to transform them into positive affirmations!</p>
              <p>Use arrow keys or WASD to move. Spacebar to pause.</p>
              <p>When you eat bad feelings, you'll power up and turn scary ghosts into helpful friends!</p>
            </div>
            <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600">
              Start Healing Journey
            </Button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <Badge variant="outline">Score: {score}</Badge>
                <Badge variant="outline">Lives: {lives}</Badge>
                {powerUpActive && (
                  <Badge className="bg-green-500">Power-Up Active!</Badge>
                )}
              </div>
              <Button 
                onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                variant="outline"
              >
                {gameState === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            </div>

            {gameState === 'paused' && (
              <div className="text-center text-lg font-semibold text-blue-600">
                Game Paused - Press Space or Resume to continue
              </div>
            )}

            {/* Game Board */}
            <div 
              className="relative mx-auto border-2 border-gray-300"
              style={{ 
                width: MAZE_SIZE * CELL_SIZE, 
                height: MAZE_SIZE * CELL_SIZE,
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              {/* Maze walls */}
              {MAZE_LAYOUT.map((row, y) =>
                row.map((cell, x) => (
                  cell === 1 && (
                    <div
                      key={`wall-${x}-${y}`}
                      className="absolute bg-blue-900"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    />
                  )
                ))
              )}

              {/* Strategy labels */}
              {STRATEGY_LABELS.map((label, index) => (
                <div
                  key={`label-${index}`}
                  className="absolute text-xs text-blue-600 font-semibold bg-white bg-opacity-75 px-1 rounded"
                  style={{
                    left: (2 + index * 2) * CELL_SIZE,
                    top: (2 + (index % 3) * 4) * CELL_SIZE,
                    transform: 'rotate(-10deg)',
                    fontSize: '10px'
                  }}
                >
                  {label}
                </div>
              ))}

              {/* Bad feelings */}
              {badFeelings.map(feeling => (
                !feeling.eaten && (
                  <div
                    key={`feeling-${feeling.id}`}
                    className={`absolute rounded-full ${getEmotionColor(feeling.type)} flex items-center justify-center text-white text-xs font-bold`}
                    style={{
                      left: feeling.position.x * CELL_SIZE + 4,
                      top: feeling.position.y * CELL_SIZE + 4,
                      width: CELL_SIZE - 8,
                      height: CELL_SIZE - 8,
                    }}
                  >
                    {feeling.type.charAt(0).toUpperCase()}
                  </div>
                )
              ))}

              {/* Ghosts */}
              {ghosts.map(ghost => (
                <div
                  key={`ghost-${ghost.id}`}
                  className={`absolute rounded-full flex items-center justify-center text-white text-sm ${
                    ghost.type === 'freeze' ? 'bg-gray-700' : 'bg-green-500'
                  }`}
                  style={{
                    left: ghost.position.x * CELL_SIZE + 2,
                    top: ghost.position.y * CELL_SIZE + 2,
                    width: CELL_SIZE - 4,
                    height: CELL_SIZE - 4,
                  }}
                >
                  <Ghost className="h-4 w-4" />
                </div>
              ))}

              {/* Player */}
              <div
                className="absolute bg-yellow-400 rounded-full flex items-center justify-center"
                style={{
                  left: playerPos.x * CELL_SIZE + 2,
                  top: playerPos.y * CELL_SIZE + 2,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                }}
              >
                <Heart className="h-4 w-4 text-red-500" />
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
              <div></div>
              <Button
                onMouseDown={() => movePlayer({ x: 0, y: -1 })}
                variant="outline"
                size="sm"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div></div>
              <div></div>
              <Button
                onMouseDown={() => movePlayer({ x: -1, y: 0 })}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onMouseDown={() => movePlayer({ x: 0, y: 1 })}
                variant="outline"
                size="sm"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                onMouseDown={() => movePlayer({ x: 1, y: 0 })}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Collected Affirmations */}
            {collectedAffirmations.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Your Affirmations:</h4>
                <div className="space-y-1">
                  {collectedAffirmations.slice(-3).map((affirmation, index) => (
                    <div key={index} className="text-sm text-green-700 flex items-center gap-2">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {affirmation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-4">
            <div className="text-xl font-bold text-red-600">Game Over</div>
            <div className="text-lg">Final Score: {score}</div>
            <div className="text-sm text-gray-600">
              You collected {collectedAffirmations.length} positive affirmations!
            </div>
            {collectedAffirmations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Remember these affirmations:</h4>
                <div className="space-y-1">
                  {collectedAffirmations.map((affirmation, index) => (
                    <div key={index} className="text-sm text-blue-700">
                      • {affirmation}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-x-2">
              <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600">
                Try Again
              </Button>
              <Button onClick={resetGame} variant="outline">
                Back to Menu
              </Button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="text-center space-y-4">
            <div className="text-xl font-bold text-green-600">Congratulations!</div>
            <div className="text-lg">You transformed all the bad feelings!</div>
            <div className="text-lg">Final Score: {score}</div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">All your affirmations:</h4>
              <div className="space-y-1">
                {collectedAffirmations.map((affirmation, index) => (
                  <div key={index} className="text-sm text-green-700 flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {affirmation}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-x-2">
              <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
                Play Again
              </Button>
              <Button onClick={resetGame} variant="outline">
                Back to Menu
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}