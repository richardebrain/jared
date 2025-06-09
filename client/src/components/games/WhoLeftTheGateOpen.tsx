import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { queryClient } from '@/lib/queryClient';
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
  Zap
} from 'lucide-react';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: number; // -1 for left, 1 for right
  type: 'car' | 'bike' | 'stroller' | 'snack-cart';
  color: string;
}

interface SafetyQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface GameLevel {
  level: number;
  dialogue: string;
  speed: number;
  obstacles: string[];
}

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 1,
    question: "How did this kid get out?",
    options: [
      "You left the gate open chasing a runaway crayon!",
      "Nap time turned into a ninja escape!",
      "Forgot the face-to-name count, didn't ya?"
    ],
    correctAnswer: 0,
    explanation: "Always secure gates immediately, even when distracted by classroom chaos!"
  },
  {
    id: 2,
    question: "Why is the playground empty?",
    options: [
      "Snack time turned into a Goldfish cracker stampede!",
      "You skipped the headcount for a juice box break!",
      "Storytime turned into a great escape!"
    ],
    correctAnswer: 1,
    explanation: "Never skip headcounts - they're your safety lifeline in ECE!"
  },
  {
    id: 3,
    question: "Who left the gate open?",
    options: [
      "You, distracted by a glitter glue disaster!",
      "The kids, plotting like tiny masterminds!",
      "A rogue parent sneaking in extra cookies!"
    ],
    correctAnswer: 0,
    explanation: "Even during craft emergencies, always secure exits first!"
  },
  {
    id: 4,
    question: "What's the golden rule of playground supervision?",
    options: [
      "Trust the kids to self-regulate!",
      "Eyes on children at ALL times!",
      "Coffee breaks come first!"
    ],
    correctAnswer: 1,
    explanation: "Constant visual supervision prevents most playground incidents!"
  },
  {
    id: 5,
    question: "Why did the safety protocol fail?",
    options: [
      "Too many bathroom breaks at once!",
      "Forgot to count heads during finger-paint chaos!",
      "The hand sanitizer ran out!"
    ],
    correctAnswer: 1,
    explanation: "Headcounts should happen continuously, not just at transitions!"
  }
];

const GAME_LEVELS: GameLevel[] = [
  {
    level: 1,
    dialogue: "Oh no! Did you leave the gate open during circle time?! Catch that kid!",
    speed: 3,
    obstacles: ['car', 'bike']
  },
  {
    level: 2,
    dialogue: "Who let the tricycles loose?! This playground's a zoo!",
    speed: 5,
    obstacles: ['car', 'bike', 'stroller']
  },
  {
    level: 3,
    dialogue: "The Great Diaper Dash! Save the day, or it's glitter glue chaos!",
    speed: 7,
    obstacles: ['car', 'bike', 'stroller', 'snack-cart']
  }
];

const OBSTACLE_COLORS = {
  car: '#ef4444',      // red
  bike: '#eab308',     // yellow
  stroller: '#f97316', // orange
  'snack-cart': '#8b5cf6' // purple
};

const LANES = [150, 250, 350, 450, 550]; // Y positions for obstacle lanes

export default function WhoLeftTheGateOpen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'question' | 'levelComplete' | 'gameComplete'>('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Player position
  const [playerX, setPlayerX] = useState(300);
  const [playerY, setPlayerY] = useState(700);
  
  // Child position (target)
  const [childX, setChildX] = useState(300);
  const [childY, setChildY] = useState(100);
  
  // Obstacles
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Game constants
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;
  const PLAYER_SIZE = 40;
  const CHILD_SIZE = 30;
  const OBSTACLE_WIDTH = 60;
  const OBSTACLE_HEIGHT = 40;

  // Initialize obstacles for current level
  const initializeObstacles = useCallback(() => {
    const newObstacles: Obstacle[] = [];
    const level = GAME_LEVELS[currentLevel];
    
    LANES.forEach((laneY, index) => {
      const direction = index % 2 === 0 ? 1 : -1; // Alternate directions
      const obstacleType = level.obstacles[Math.floor(Math.random() * level.obstacles.length)] as keyof typeof OBSTACLE_COLORS;
      
      newObstacles.push({
        id: index,
        x: direction === 1 ? -OBSTACLE_WIDTH : CANVAS_WIDTH,
        y: laneY,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        speed: level.speed,
        direction,
        type: obstacleType,
        color: OBSTACLE_COLORS[obstacleType]
      });
    });
    
    setObstacles(newObstacles);
  }, [currentLevel]);

  // Start new game
  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    setPlayerX(300);
    setPlayerY(700);
    setChildX(300);
    setChildY(100);
    initializeObstacles();
  };

  // Handle player movement
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState === 'playing') {
      const moveSpeed = 5;
      switch (event.key) {
        case 'ArrowLeft':
          setPlayerX(prev => Math.max(0, prev - moveSpeed));
          break;
        case 'ArrowRight':
          setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_SIZE, prev + moveSpeed));
          break;
        case 'ArrowUp':
          setPlayerY(prev => Math.max(0, prev - moveSpeed));
          break;
        case 'ArrowDown':
          setPlayerY(prev => Math.min(CANVAS_HEIGHT - PLAYER_SIZE, prev + moveSpeed));
          break;
      }
    } else if (gameState === 'question') {
      if (event.key >= '1' && event.key <= '3') {
        setSelectedAnswer(parseInt(event.key) - 1);
      } else if (event.key === 'Enter' && selectedAnswer !== null) {
        handleAnswerSubmit();
      }
    }
  }, [gameState, selectedAnswer]);

  // Handle safety question answer
  const handleAnswerSubmit = () => {
    if (!currentQuestion || selectedAnswer === null) return;
    
    setShowExplanation(true);
    
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 10);
      setTimeout(() => {
        // Reset player position and continue
        setPlayerX(300);
        setPlayerY(700);
        setGameState('playing');
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setShowExplanation(false);
      }, 2000);
    } else {
      setLives(prev => prev - 1);
      setTimeout(() => {
        if (lives <= 1) {
          // Game over
          endGame();
        } else {
          // Reset level
          setPlayerX(300);
          setPlayerY(700);
          setChildX(300);
          setChildY(100);
          initializeObstacles();
          setGameState('playing');
          setCurrentQuestion(null);
          setSelectedAnswer(null);
          setShowExplanation(false);
        }
      }, 2000);
    }
  };

  // Check collision
  const checkCollision = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Move child up slowly
    setChildY(prev => {
      const newY = prev + 1;
      // Check if player caught child
      if (checkCollision(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE, childX, newY, CHILD_SIZE, CHILD_SIZE)) {
        completeLevel();
        return newY;
      }
      return newY;
    });

    // Move obstacles
    setObstacles(prev => prev.map(obstacle => {
      const newX = obstacle.x + (obstacle.speed * obstacle.direction);
      
      // Reset obstacle when it goes off screen
      if (newX > CANVAS_WIDTH + OBSTACLE_WIDTH || newX < -OBSTACLE_WIDTH) {
        const level = GAME_LEVELS[currentLevel];
        const newType = level.obstacles[Math.floor(Math.random() * level.obstacles.length)] as keyof typeof OBSTACLE_COLORS;
        return {
          ...obstacle,
          x: obstacle.direction === 1 ? -OBSTACLE_WIDTH : CANVAS_WIDTH,
          type: newType,
          color: OBSTACLE_COLORS[newType]
        };
      }

      // Check collision with player
      if (checkCollision(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE, newX, obstacle.y, obstacle.width, obstacle.height)) {
        triggerSafetyQuestion();
      }

      return { ...obstacle, x: newX };
    }));

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, playerX, playerY, childX, currentLevel]);

  // Trigger safety question
  const triggerSafetyQuestion = () => {
    const randomQuestion = SAFETY_QUESTIONS[Math.floor(Math.random() * SAFETY_QUESTIONS.length)];
    setCurrentQuestion(randomQuestion);
    setGameState('question');
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  // Complete level
  const completeLevel = () => {
    setScore(prev => prev + 100);
    if (currentLevel < GAME_LEVELS.length - 1) {
      setGameState('levelComplete');
    } else {
      setGameState('gameComplete');
      saveGameCompletion();
    }
  };

  // Advance to next level
  const nextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setPlayerX(300);
    setPlayerY(700);
    setChildX(300);
    setChildY(100);
    setGameState('playing');
  };

  // End game
  const endGame = () => {
    setGameState('gameComplete');
    saveGameCompletion();
  };

  // Save game completion
  const saveGameCompletion = async () => {
    try {
      await fetch('/api/games/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: 'who-left-gate-open',
          score,
          pointsEarned: Math.floor(score / 10),
          timeTaken: 0
        })
      });

      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Gate Guardian Complete!",
        description: `You earned ${Math.floor(score / 10)} points! Final score: ${score}`
      });
    } catch (error) {
      console.error('Error saving game completion:', error);
    }
  };

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f0f9ff'; // Light blue background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'playing') {
      // Draw road lanes
      ctx.fillStyle = '#94a3b8'; // Gray for road
      LANES.forEach(laneY => {
        ctx.fillRect(0, laneY - 20, CANVAS_WIDTH, OBSTACLE_HEIGHT + 40);
      });

      // Draw lane dividers
      ctx.fillStyle = '#fbbf24'; // Yellow dividers
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        LANES.forEach(laneY => {
          ctx.fillRect(x, laneY + 15, 20, 5);
        });
      }

      // Draw obstacles
      obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add obstacle type text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obstacle.type.toUpperCase(), obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 4);
      });

      // Draw player (teacher)
      ctx.fillStyle = '#3b82f6'; // Blue teacher
      ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👩‍🏫', playerX + PLAYER_SIZE/2, playerY + PLAYER_SIZE/2 + 6);

      // Draw child (target)
      ctx.fillStyle = '#22c55e'; // Green child
      ctx.fillRect(childX, childY, CHILD_SIZE, CHILD_SIZE);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👶', childX + CHILD_SIZE/2, childY + CHILD_SIZE/2 + 5);

      // Draw level dialogue
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(GAME_LEVELS[currentLevel].dialogue, CANVAS_WIDTH/2, 30);
    }
  }, [gameState, playerX, playerY, childX, childY, obstacles, currentLevel]);

  // Setup event listeners and game loop
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop, gameState]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (gameState === 'playing') {
      initializeObstacles();
    }
  }, [gameState, initializeObstacles]);

  if (gameState === 'menu') {
    return (
      <Card className="max-w-4xl mx-auto border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-orange-600" />
            </div>
            <CardTitle className="text-3xl text-orange-800 mb-2">Who Left the Gate Open?</CardTitle>
            <p className="text-orange-600 text-lg">A super silly ECE safety adventure!</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold text-orange-700 mb-3">How to Play:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Use arrow keys to chase the runaway child</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Avoid cars, bikes, and ECE chaos!</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Answer safety questions when hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Complete 3 levels of ECE mayhem</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-700 mb-2">What You'll Learn:</h4>
            <div className="text-sm text-yellow-600 space-y-1">
              <p>• Essential preschool safety protocols and procedures</p>
              <p>• Playground supervision and headcount best practices</p>
              <p>• Emergency response in early childhood settings</p>
              <p>• How to maintain safety during daily ECE chaos!</p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={startGame}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start the Chase!
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'question') {
    return (
      <Card className="max-w-4xl mx-auto border-2 border-red-300 bg-gradient-to-br from-red-50 to-pink-50">
        <CardHeader>
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <CardTitle className="text-2xl text-red-800 mb-2">Safety Question!</CardTitle>
            <p className="text-red-600">Think fast - preschool safety depends on it!</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentQuestion && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <h3 className="text-xl font-semibold text-red-700 mb-4">{currentQuestion.question}</h3>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      disabled={showExplanation}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`w-full text-left p-4 h-auto justify-start ${
                        selectedAnswer === index 
                          ? 'bg-red-600 text-white' 
                          : 'hover:bg-red-50'
                      }`}
                    >
                      <span className="font-bold mr-3">{index + 1}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedAnswer !== null && !showExplanation && (
                <div className="text-center">
                  <Button 
                    onClick={handleAnswerSubmit}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Submit Answer
                  </Button>
                </div>
              )}

              {showExplanation && (
                <div className={`p-4 rounded-lg border-l-4 ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <Trophy className="h-5 w-5 text-green-500" />
                    ) : (
                      <Heart className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold">
                      {selectedAnswer === currentQuestion.correctAnswer ? 'Correct! +10 points' : 'Incorrect! -1 life'}
                    </span>
                  </div>
                  <p className="text-sm">{currentQuestion.explanation}</p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-center gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{score}</div>
              <Badge variant="outline">Score</Badge>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{lives}</div>
              <Badge variant="outline">Lives</Badge>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{currentLevel + 1}</div>
              <Badge variant="outline">Level</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'levelComplete') {
    return (
      <Card className="max-w-4xl mx-auto border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <CardTitle className="text-3xl text-green-800 mb-2">Child Caught!</CardTitle>
            <p className="text-green-600">You saved the day! +100 points</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-x-4">
            <Button 
              onClick={nextLevel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next Level
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'gameComplete') {
    return (
      <Card className="max-w-4xl mx-auto border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <CardTitle className="text-3xl text-purple-800 mb-2">All Kids Safe!</CardTitle>
            <p className="text-purple-600">You're a true safety superhero!</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">{score}</div>
            <p className="text-purple-600">Final Score</p>
          </div>

          <div className="text-center space-x-4">
            <Button 
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Playing state - show canvas and game info
  return (
    <Card className="max-w-4xl mx-auto border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl text-blue-800">Level {currentLevel + 1}</CardTitle>
            <p className="text-blue-600">Use arrow keys to move!</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{score}</div>
              <Badge variant="outline">Score</Badge>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{lives}</div>
              <Badge variant="outline">Lives</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 rounded-lg bg-sky-100"
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>👩‍🏫 = You (Teacher) | 👶 = Runaway Child | Avoid the obstacles!</p>
        </div>
      </CardContent>
    </Card>
  );
}