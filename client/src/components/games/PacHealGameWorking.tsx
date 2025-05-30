import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Gamepad2, Trophy, Star, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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

const BOARD_WIDTH = 15;
const BOARD_HEIGHT = 12;
const CELL_SIZE = 24;

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
    
    // Generate bad feelings (dots to collect)
    const feelings: BadFeeling[] = [];
    for (let i = 0; i < 20; i++) {
      feelings.push({
        id: i,
        position: {
          x: Math.floor(Math.random() * (BOARD_WIDTH - 2)) + 1,
          y: Math.floor(Math.random() * (BOARD_HEIGHT - 2)) + 1
        },
        type: ['fear', 'shame', 'anger', 'worry'][Math.floor(Math.random() * 4)] as any,
        eaten: false,
        powerUp: i % 8 === 0 // Every 8th feeling is a power-up
      });
    }
    setBadFeelings(feelings);

    // Generate ghosts
    const gameGhosts: Ghost[] = [
      {
        id: 1,
        position: { x: BOARD_WIDTH - 2, y: 1 },
        direction: { x: -1, y: 0 },
        type: 'freeze',
        emotion: 'Overwhelm'
      },
      {
        id: 2,
        position: { x: BOARD_WIDTH - 2, y: BOARD_HEIGHT - 2 },
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
          newPos.y = Math.max(0, newPos.y - 1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newPos.y = Math.min(BOARD_HEIGHT - 1, newPos.y + 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newPos.x = Math.max(0, newPos.x - 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newPos.x = Math.min(BOARD_WIDTH - 1, newPos.x + 1);
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

      // Check collisions with bad feelings
      setBadFeelings(prevFeelings => 
        prevFeelings.map(feeling => {
          if (!feeling.eaten && 
              feeling.position.x === playerPos.x && 
              feeling.position.y === playerPos.y) {
            
            setScore(prev => prev + (feeling.powerUp ? 20 : 10));
            
            if (feeling.powerUp) {
              const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
              setCollectedAffirmations(prev => [...prev, randomAffirmation]);
            }
            
            return { ...feeling, eaten: true };
          }
          return feeling;
        })
      );

      // Check collisions with ghosts
      ghosts.forEach(ghost => {
        if (ghost.position.x === playerPos.x && ghost.position.y === playerPos.y) {
          // Trigger quiz instead of losing life immediately
          const randomQuiz = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
          setCurrentQuiz(randomQuiz);
          setGameState('quiz');
        }
      });

      // Check win condition
      const remainingFeelings = badFeelings.filter(f => !f.eaten).length;
      if (remainingFeelings === 0) {
        setGameState('gameOver');
      }
    }, 200);

    return () => clearInterval(gameLoop);
  }, [gameState, playerPos, ghosts, badFeelings]);

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
        newPos.y = Math.max(0, newPos.y - 1);
        break;
      case 'down':
        newPos.y = Math.min(BOARD_HEIGHT - 1, newPos.y + 1);
        break;
      case 'left':
        newPos.x = Math.max(0, newPos.x - 1);
        break;
      case 'right':
        newPos.x = Math.min(BOARD_WIDTH - 1, newPos.x + 1);
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Pac-Heal: Emotional Regulation Adventure
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg">
              <Gamepad2 className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-blue-700 mb-4">Ready to Transform Negative Energy?</h3>
              <p className="text-gray-600 mb-6">
                Navigate the classroom and collect negative emotions to transform them into positive affirmations. 
                Answer ECE quiz questions when you encounter challenging situations!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-700 mb-2">How to Play:</h4>
                  <ul className="text-left space-y-1">
                    <li>• Use arrow keys or WASD to move</li>
                    <li>• Collect negative emotions (dots)</li>
                    <li>• Answer quiz questions correctly</li>
                    <li>• Avoid losing all your lives</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-700 mb-2">You'll Learn:</h4>
                  <ul className="text-left space-y-1">
                    <li>• Therapeutic responses to behaviors</li>
                    <li>• Emotional regulation techniques</li>
                    <li>• Child development principles</li>
                    <li>• Classroom management skills</li>
                  </ul>
                </div>
              </div>
              <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-4">
                <Badge variant="outline">Score: {score}</Badge>
                <Badge variant="outline">Lives: {lives}</Badge>
                <Badge variant="outline">Level: {currentLevel}</Badge>
              </div>
            </div>

            {/* Game Board */}
            <div className="relative bg-black rounded-lg p-4 mx-auto overflow-hidden" 
                 style={{ 
                   width: Math.min(BOARD_WIDTH * CELL_SIZE + 32, window.innerWidth - 40),
                   height: BOARD_HEIGHT * CELL_SIZE + 32
                 }}>
              
              {/* Player */}
              <div 
                className="absolute bg-yellow-400 rounded-full transition-all duration-100"
                style={{
                  left: playerPos.x * CELL_SIZE + 16,
                  top: playerPos.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4
                }}
              />

              {/* Bad Feelings */}
              {badFeelings.filter(f => !f.eaten).map(feeling => (
                <div
                  key={feeling.id}
                  className="absolute rounded-full"
                  style={{
                    left: feeling.position.x * CELL_SIZE + 16 + CELL_SIZE/4,
                    top: feeling.position.y * CELL_SIZE + 16 + CELL_SIZE/4,
                    width: feeling.powerUp ? CELL_SIZE/2 : CELL_SIZE/3,
                    height: feeling.powerUp ? CELL_SIZE/2 : CELL_SIZE/3,
                    backgroundColor: getFeelingColor(feeling.type, feeling.powerUp),
                    boxShadow: feeling.powerUp ? '0 0 10px #FFD700' : 'none'
                  }}
                />
              ))}

              {/* Ghosts */}
              {ghosts.map(ghost => (
                <div
                  key={ghost.id}
                  className="absolute rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    left: ghost.position.x * CELL_SIZE + 16,
                    top: ghost.position.y * CELL_SIZE + 16,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2
                  }}
                >
                  👻
                </div>
              ))}
            </div>

            {/* Mobile Controls */}
            <div className="flex flex-col items-center space-y-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => movePlayer('up')}
                className="w-16 h-12"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => movePlayer('left')}
                  className="w-16 h-12"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => movePlayer('down')}
                  className="w-16 h-12"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => movePlayer('right')}
                  className="w-16 h-12"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
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
  );
}