import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Gamepad2, Trophy, Star, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

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
  powerUp?: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const BOARD_WIDTH = 19;
const BOARD_HEIGHT = 15;
const CELL_SIZE = 18;

// Simple maze layout (1 = wall, 0 = path)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
  [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const isWall = (x: number, y: number): boolean => {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return true;
  return MAZE[y][x] === 1;
};

const sampleQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "When a child is having a meltdown, what's the most therapeutic response?",
    options: [
      "Tell them to calm down immediately",
      "Validate their feelings and offer comfort",
      "Put them in timeout",
      "Ignore the behavior"
    ],
    correctAnswer: 1,
    explanation: "Validating feelings helps children feel understood and teaches emotional regulation skills."
  },
  {
    id: 2,
    question: "Which approach best supports a child's emotional development?",
    options: [
      "Labeling emotions and teaching coping strategies",
      "Distracting them from negative emotions",
      "Telling them emotions aren't important",
      "Comparing them to other children"
    ],
    correctAnswer: 0,
    explanation: "Emotion labeling and coping strategies build emotional intelligence and self-regulation skills."
  }
];

export default function PacHealGame() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'quiz'>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [badFeelings, setBadFeelings] = useState<BadFeeling[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
  const [collectedAffirmations, setCollectedAffirmations] = useState<string[]>([]);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const affirmations = [
    "You are helping children grow",
    "Your patience makes a difference", 
    "Every child benefits from your care",
    "You create safe spaces for learning"
  ];

  // Initialize game board
  const initializeGame = useCallback(() => {
    setPlayerPos({ x: 1, y: 1 });
    setScore(0);
    setLives(3);
    setCollectedAffirmations([]);
    
    // Generate bad feelings (dots to collect) only on open paths
    const feelings: BadFeeling[] = [];
    let feelingId = 0;
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
      for (let x = 1; x < BOARD_WIDTH - 1; x++) {
        if (!isWall(x, y) && !(x === 1 && y === 1)) { // Don't place on player start position
          if (Math.random() < 0.3) { // 30% chance to place a feeling
            feelings.push({
              id: feelingId++,
              position: { x, y },
              type: ['fear', 'shame', 'anger', 'worry'][Math.floor(Math.random() * 4)] as any,
              eaten: false,
              powerUp: feelingId % 10 === 0 // Every 10th feeling is a power-up
            });
          }
        }
      }
    }
    setBadFeelings(feelings);

    // Generate ghosts in open areas
    const gameGhosts: Ghost[] = [
      {
        id: 1,
        position: { x: 17, y: 1 },
        direction: { x: -1, y: 0 },
        type: 'freeze',
        emotion: 'Overwhelm'
      },
      {
        id: 2,
        position: { x: 17, y: 13 },
        direction: { x: 0, y: -1 },
        type: 'freeze',
        emotion: 'Stress'
      }
    ];
    setGhosts(gameGhosts);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      let newPos = { ...playerPos };
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (!isWall(newPos.x, newPos.y - 1)) {
            newPos.y = newPos.y - 1;
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (!isWall(newPos.x, newPos.y + 1)) {
            newPos.y = newPos.y + 1;
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (!isWall(newPos.x - 1, newPos.y)) {
            newPos.x = newPos.x - 1;
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (!isWall(newPos.x + 1, newPos.y)) {
            newPos.x = newPos.x + 1;
          }
          break;
      }
      
      setPlayerPos(newPos);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, playerPos]);

  // Game logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move ghosts
      setGhosts(prevGhosts => 
        prevGhosts.map(ghost => {
          let newPos = {
            x: ghost.position.x + ghost.direction.x,
            y: ghost.position.y + ghost.direction.y
          };
          
          let newDir = { ...ghost.direction };
          
          // Bounce off walls
          if (newPos.x <= 0 || newPos.x >= BOARD_WIDTH - 1) {
            newDir.x *= -1;
            newPos.x = ghost.position.x;
          }
          if (newPos.y <= 0 || newPos.y >= BOARD_HEIGHT - 1) {
            newDir.y *= -1;
            newPos.y = ghost.position.y;
          }
          
          return {
            ...ghost,
            position: newPos,
            direction: newDir
          };
        })
      );
    }, 200);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  // Check collisions when player moves
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check collisions with bad feelings
    const collectedFeeling = badFeelings.find(feeling => 
      !feeling.eaten && 
      feeling.position.x === playerPos.x && 
      feeling.position.y === playerPos.y
    );

    if (collectedFeeling) {
      setBadFeelings(prevFeelings => 
        prevFeelings.map(feeling => 
          feeling.id === collectedFeeling.id 
            ? { ...feeling, eaten: true }
            : feeling
        )
      );
      
      setScore(prev => prev + (collectedFeeling.powerUp ? 20 : 10));
      
      if (collectedFeeling.powerUp) {
        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        setCollectedAffirmations(prev => [...prev, randomAffirmation]);
      }
    }

    // Check collisions with ghosts (with tolerance for better detection)
    const ghostCollision = ghosts.find(ghost => 
      Math.abs(ghost.position.x - playerPos.x) <= 0.5 && 
      Math.abs(ghost.position.y - playerPos.y) <= 0.5
    );
    
    if (ghostCollision && !isInvulnerable) {
      const randomQuiz = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
      setCurrentQuiz(randomQuiz);
      setGameState('quiz');
      setIsInvulnerable(true);
      setTimeout(() => setIsInvulnerable(false), 1000);
    }

    // Check win condition
    const remainingFeelings = badFeelings.filter(f => !f.eaten).length;
    if (remainingFeelings === 0 && badFeelings.length > 0) {
      // Award 5 points for completing a Pac-Heal level
      setPointsEarned(5);
      setShowPointAnimation(true);
      
      // Award points to user account
      setTimeout(async () => {
        try {
          await apiRequest('/api/auth/update-points', {
            method: 'POST',
            body: JSON.stringify({ points: 5 }),
            headers: { 'Content-Type': 'application/json' }
          });
          toast({
            title: "Level Complete!",
            description: "You earned 5 points for completing this level!",
          });
        } catch (error) {
          console.error('Error updating points:', error);
        }
        setShowPointAnimation(false);
        setGameState('gameOver');
      }, 2000);
    }
  }, [playerPos, badFeelings]);

  const startGame = () => {
    initializeGame();
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('menu');
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer === null || !currentQuiz) return;
    
    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
    setQuizResult(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(prev => prev + 25);
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState('gameOver');
        }
        return newLives;
      });
    }
  };

  const continueGame = () => {
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setQuizResult(null);
    if (lives > 0) {
      setGameState('playing');
    }
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return;
    
    let newPos = { ...playerPos };
    
    switch (direction) {
      case 'up':
        if (!isWall(newPos.x, newPos.y - 1)) {
          newPos.y = newPos.y - 1;
        }
        break;
      case 'down':
        if (!isWall(newPos.x, newPos.y + 1)) {
          newPos.y = newPos.y + 1;
        }
        break;
      case 'left':
        if (!isWall(newPos.x - 1, newPos.y)) {
          newPos.x = newPos.x - 1;
        }
        break;
      case 'right':
        if (!isWall(newPos.x + 1, newPos.y)) {
          newPos.x = newPos.x + 1;
        }
        break;
    }
    
    setPlayerPos(newPos);
  };

  const getFeelingColor = (type: string, powerUp?: boolean) => {
    if (powerUp) return '#FFD700'; // Gold for power-ups
    switch (type) {
      case 'fear': return '#FF6B6B';
      case 'shame': return '#4ECDC4';
      case 'anger': return '#FF8E53';
      case 'worry': return '#95E1D3';
      default: return '#FFF';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="bg-white/20 p-2 rounded-full">
              <Heart className="h-8 w-8 text-pink-200" />
            </div>
            Pac-Heal: Emotional Regulation Adventure
            <Badge className="ml-auto bg-yellow-400 text-purple-900 font-bold">
              Educational Game
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 relative">
          {/* Point Animation Overlay */}
          {showPointAnimation && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold animate-bounce shadow-lg">
                +{pointsEarned} Points!
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="text-center space-y-8">
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-10 rounded-2xl border-2 border-purple-200 shadow-lg">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Gamepad2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
                  Ready to Transform Negative Energy?
                </h3>
                <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                  Navigate the classroom and collect negative emotions to transform them into positive affirmations. 
                  Answer ECE quiz questions when you encounter challenging situations!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
                    <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-purple-700 mb-3 text-lg">How to Play:</h4>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-purple-500 mr-2">•</span> Use arrow keys or WASD to move</li>
                      <li className="flex items-center"><span className="text-purple-500 mr-2">•</span> Collect negative emotions (colorful dots)</li>
                      <li className="flex items-center"><span className="text-purple-500 mr-2">•</span> Answer quiz questions correctly</li>
                      <li className="flex items-center"><span className="text-purple-500 mr-2">•</span> Avoid losing all your lives</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow">
                    <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-blue-700 mb-3 text-lg">You'll Learn:</h4>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-blue-500 mr-2">•</span> Therapeutic responses to behaviors</li>
                      <li className="flex items-center"><span className="text-blue-500 mr-2">•</span> Emotional regulation techniques</li>
                      <li className="flex items-center"><span className="text-blue-500 mr-2">•</span> Child development principles</li>
                      <li className="flex items-center"><span className="text-blue-500 mr-2">•</span> Classroom management skills</li>
                    </ul>
                  </div>
                </div>
                
                <Button 
                  onClick={startGame} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Gamepad2 className="h-6 w-6 mr-3" />
                  Start Your Adventure
                  <Star className="h-6 w-6 ml-3" />
                </Button>
              </div>
            </div>
          )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Game Stats */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-3 py-1">
                    Score: {score}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white font-bold px-3 py-1">
                    <Heart className="h-3 w-3 mr-1" />
                    Lives: {lives}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold px-3 py-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    Level: {currentLevel}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Transform negative emotions into positive energy!
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 rounded-2xl shadow-2xl mx-auto border-4 border-purple-300">
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl p-2 mx-auto overflow-hidden border-2 border-purple-400" 
                   style={{ 
                     width: BOARD_WIDTH * CELL_SIZE + 16,
                     height: BOARD_HEIGHT * CELL_SIZE + 16
                   }}>
                
                {/* Render Maze Walls */}
                {MAZE.map((row, y) => 
                  row.map((cell, x) => (
                    cell === 1 && (
                      <div
                        key={`wall-${x}-${y}`}
                        className="absolute bg-gradient-to-br from-blue-500 to-purple-600 border border-blue-300 shadow-sm"
                        style={{
                          left: x * CELL_SIZE + 8,
                          top: y * CELL_SIZE + 8,
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: '2px'
                        }}
                      />
                    )
                  ))
                )}
              
              {/* Player (Teacher Character) */}
              <div 
                className="absolute bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold transition-all duration-100"
                style={{
                  left: playerPos.x * CELL_SIZE + 8,
                  top: playerPos.y * CELL_SIZE + 8,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  fontSize: '12px'
                }}
              >
                👩‍🏫
              </div>

              {/* Bad Feelings (Dots to Collect) */}
              {badFeelings.filter(f => !f.eaten).map(feeling => (
                <div
                  key={feeling.id}
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    left: feeling.position.x * CELL_SIZE + 8 + (feeling.powerUp ? 2 : 6),
                    top: feeling.position.y * CELL_SIZE + 8 + (feeling.powerUp ? 2 : 6),
                    width: feeling.powerUp ? CELL_SIZE - 4 : CELL_SIZE - 12,
                    height: feeling.powerUp ? CELL_SIZE - 4 : CELL_SIZE - 12,
                    backgroundColor: getFeelingColor(feeling.type, feeling.powerUp),
                    boxShadow: feeling.powerUp ? '0 0 8px #FFD700' : 'none',
                    fontSize: feeling.powerUp ? '10px' : '8px'
                  }}
                >
                  {feeling.powerUp ? '⭐' : '•'}
                </div>
              ))}

              {/* Ghosts */}
              {ghosts.map(ghost => (
                <div
                  key={ghost.id}
                  className="absolute rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    left: ghost.position.x * CELL_SIZE + 8,
                    top: ghost.position.y * CELL_SIZE + 8,
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  }}
                >
                  👻
                </div>
              ))}
            </div>

            {/* Mobile Controls - Always Visible */}
            <div className="flex flex-col items-center space-y-3 mt-4">
              <div className="text-sm text-gray-600 mb-2">Use arrow keys or buttons below to move:</div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => movePlayer('up')}
                className="w-16 h-16 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300"
              >
                <ArrowUp className="h-6 w-6 text-blue-600" />
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => movePlayer('left')}
                  className="w-16 h-16 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300"
                >
                  <ArrowLeft className="h-6 w-6 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => movePlayer('down')}
                  className="w-16 h-16 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300"
                >
                  <ArrowDown className="h-6 w-6 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => movePlayer('right')}
                  className="w-16 h-16 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300"
                >
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </Button>
              </div>
              <div className="text-xs text-gray-500">Desktop: Use WASD or Arrow Keys</div>
            </div>

            {/* Collected Affirmations */}
            {collectedAffirmations.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">Positive Affirmations Collected:</h4>
                <div className="flex flex-wrap gap-2">
                  {collectedAffirmations.map((affirmation, index) => (
                    <Badge key={index} variant="outline" className="bg-green-100 text-green-700">
                      {affirmation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {gameState === 'quiz' && currentQuiz && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">ECE Challenge Question</h3>
              <p className="text-gray-700 mb-4">{currentQuiz.question}</p>
              
              <div className="space-y-2">
                {currentQuiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedAnswer === index 
                        ? 'border-blue-500 bg-blue-100' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {quizResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  quizResult === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <p className="font-semibold mb-2">
                    {quizResult === 'correct' ? 'Correct! +25 points' : 'Incorrect. -1 life'}
                  </p>
                  <p className="text-sm">{currentQuiz.explanation}</p>
                </div>
              )}

              <div className="flex justify-center mt-6">
                {!quizResult ? (
                  <Button 
                    onClick={handleQuizAnswer}
                    disabled={selectedAnswer === null}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={continueGame} className="bg-green-500 hover:bg-green-600">
                    Continue Game
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-4">
            <div className="text-xl font-bold text-blue-600">
              {badFeelings.filter(f => !f.eaten).length === 0 ? 'Level Complete!' : 'Game Over'}
            </div>
            <div className="text-lg">Final Score: {score}</div>
            <div className="text-sm text-gray-600">
              Affirmations Collected: {collectedAffirmations.length}
            </div>
            
            {collectedAffirmations.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">Your Positive Messages:</h4>
                {collectedAffirmations.map((affirmation, index) => (
                  <div key={index} className="text-green-600 text-sm">
                    • {affirmation}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600">
                <Trophy className="h-4 w-4 mr-2" />
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
    </div>
  );
}