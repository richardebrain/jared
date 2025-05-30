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
  powerUp?: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface RoutinePellet {
  id: number;
  position: Position;
  type: 'circle-time' | 'snack' | 'cleanup' | 'line-up' | 'transition';
  eaten: boolean;
  quiz?: {
    question: string;
    answer: string;
  };
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

const ROUTINE_QUIZZES: Record<string, { question: string; answer: string }> = {
  'line-up': { 
    question: "What's the face-to-name rule for line-up time?", 
    answer: "Make eye contact and say each child's name as they line up to ensure connection and attention."
  },
  'circle-time': { 
    question: "How long should circle time last for preschoolers?", 
    answer: "5-15 minutes maximum, matching their attention span and developmental stage."
  },
  'snack': { 
    question: "What's a key strategy for peaceful snack time?", 
    answer: "Use consistent routines like hand washing, sitting, and quiet conversation to create structure."
  },
  'cleanup': { 
    question: "How can you make cleanup time engaging?", 
    answer: "Use songs, timers, and specific job assignments to make cleanup fun and organized."
  },
  'transition': { 
    question: "What helps children during transitions between activities?", 
    answer: "Give warnings, use visual cues, and maintain consistent routines to reduce anxiety."
  }
};

const POSITIVE_PHRASES = [
  "I see you're upset",
  "You seem frustrated", 
  "Help me understand",
  "Let's solve this together",
  "I notice you need space"
];

const ECE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the most effective way to handle a child's tantrum?",
    options: [
      "Ignore the child completely until they stop",
      "Stay calm, validate their feelings, and offer comfort",
      "Give them what they want to stop the behavior",
      "Remove them from the situation immediately"
    ],
    correctAnswer: 1,
    explanation: "Staying calm and validating feelings helps children learn emotional regulation while feeling supported."
  },
  {
    id: 2,
    question: "Which strategy best supports a shy child in group activities?",
    options: [
      "Force them to participate to build confidence",
      "Let them sit out all activities",
      "Gradually encourage participation with support",
      "Put them with the most outgoing children"
    ],
    correctAnswer: 2,
    explanation: "Gradual encouragement with support respects the child's temperament while building confidence."
  },
  {
    id: 3,
    question: "What is the best approach for teaching emotional vocabulary to preschoolers?",
    options: [
      "Use feeling faces and books during calm moments",
      "Only discuss emotions when children are upset",
      "Avoid labeling emotions to prevent drama",
      "Tell children to 'use their words' when upset"
    ],
    correctAnswer: 0,
    explanation: "Teaching emotional vocabulary during calm moments helps children better express themselves when emotions are high."
  },
  {
    id: 4,
    question: "How should you respond when a child bites another child?",
    options: [
      "Bite them back so they understand how it feels",
      "Focus attention on the hurt child first, then address the biter calmly",
      "Put the biting child in timeout immediately",
      "Tell the biting child they are bad"
    ],
    correctAnswer: 1,
    explanation: "Attending to the hurt child first prevents giving the biter attention for negative behavior, then address the behavior calmly."
  },
  {
    id: 5,
    question: "What helps children develop self-regulation skills?",
    options: [
      "Strict rules with immediate consequences",
      "Teaching breathing techniques and providing calm-down spaces",
      "Avoiding any situations that might upset them",
      "Telling them to control themselves"
    ],
    correctAnswer: 1,
    explanation: "Teaching concrete techniques like breathing and providing safe spaces helps children develop internal regulation skills."
  }
];

// Sound effects functions
const playSound = (type: 'collect' | 'powerup' | 'ghost' | 'quiz' | 'success') => {
  try {
    const audio = new Audio();
    switch(type) {
      case 'collect':
        // Mario coin sound effect
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwuWkdBzuBl+/T3jMFIGzQ8oA'; 
        break;
      case 'powerup':
        // Power up sound
        audio.src = 'data:audio/wav;base64,UklGRq4BAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYoBAAC4uLi4uLi4QEBAQEBAQDAwMDAwMDA=';
        break;
      case 'ghost':
        // Ghost collision sound
        audio.src = 'data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToBAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=';
        break;
      case 'quiz':
        // Quiz notification
        audio.src = 'data:audio/wav;base64,UklGRmABAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTwBAADBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHB=';
        break;
      case 'success':
        // Success sound
        audio.src = 'data:audio/wav;base64,UklGRkgBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSQBAADDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PD=';
        break;
    }
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore errors if sound fails
  } catch (error) {
    // Silently fail if audio is not supported
  }
};

const MAZE_SIZE = 15;
const CELL_SIZE = 40;

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
  const [routinePellets, setRoutinePellets] = useState<RoutinePellet[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameState, setGameState] = useState<'welcome' | 'menu' | 'playing' | 'paused' | 'gameOver' | 'won' | 'levelComplete' | 'quiz'>('welcome');
  const [collectedAffirmations, setCollectedAffirmations] = useState<string[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<{ question: string; answer: string } | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  const [eceQuiz, setEceQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
  const gameLoopRef = useRef<number>();

  // Initialize level
  const initializeLevel = useCallback((level: number) => {
    setPlayerPos({ x: 1, y: 1 });
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setCurrentQuiz(null);
    setShowQuizAnswer(false);
    
    if (level === 1) {
      // Level 1: Emotional Healing (Bad Feelings)
      const feelings: BadFeeling[] = [];
      let id = 0;
      for (let y = 1; y < MAZE_SIZE - 1; y++) {
        for (let x = 1; x < MAZE_SIZE - 1; x++) {
          if (MAZE_LAYOUT[y][x] === 0 && Math.random() < 0.3) {
            const types: Array<'fear' | 'shame' | 'anger' | 'worry'> = ['fear', 'shame', 'anger', 'worry'];
            const isPowerUp = Math.random() < 0.2; // 20% chance for power-up
            feelings.push({
              id: id++,
              position: { x, y },
              type: types[Math.floor(Math.random() * types.length)],
              eaten: false,
              powerUp: isPowerUp
            });
          }
        }
      }
      setBadFeelings(feelings);
      setRoutinePellets([]);

      // Emotional ghosts
      const initialGhosts: Ghost[] = [
        { id: 1, position: { x: 7, y: 7 }, direction: { x: 1, y: 0 }, type: 'freeze', emotion: 'overwhelm' },
        { id: 2, position: { x: 8, y: 7 }, direction: { x: -1, y: 0 }, type: 'freeze', emotion: 'doubt' },
        { id: 3, position: { x: 7, y: 8 }, direction: { x: 0, y: 1 }, type: 'freeze', emotion: 'stress' },
      ];
      setGhosts(initialGhosts);
    } else if (level === 2) {
      // Level 2: Routine Mastery (Routine Pellets)
      const routines: RoutinePellet[] = [];
      let id = 0;
      const routineTypes: Array<'circle-time' | 'snack' | 'cleanup' | 'line-up' | 'transition'> = 
        ['circle-time', 'snack', 'cleanup', 'line-up', 'transition'];
      
      for (let y = 1; y < MAZE_SIZE - 1; y++) {
        for (let x = 1; x < MAZE_SIZE - 1; x++) {
          if (MAZE_LAYOUT[y][x] === 0 && Math.random() < 0.25) {
            const routineType = routineTypes[Math.floor(Math.random() * routineTypes.length)];
            routines.push({
              id: id++,
              position: { x, y },
              type: routineType,
              eaten: false,
              quiz: ROUTINE_QUIZZES[routineType]
            });
          }
        }
      }
      setRoutinePellets(routines);
      setBadFeelings([]);

      // Chaos ghosts
      const chaosGhosts: Ghost[] = [
        { id: 1, position: { x: 7, y: 7 }, direction: { x: 1, y: 0 }, type: 'freeze', emotion: 'tardiness' },
        { id: 2, position: { x: 8, y: 7 }, direction: { x: -1, y: 0 }, type: 'freeze', emotion: 'tantrums' },
        { id: 3, position: { x: 7, y: 8 }, direction: { x: 0, y: 1 }, type: 'freeze', emotion: 'chaos' },
      ];
      setGhosts(chaosGhosts);
    }
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setCurrentLevel(1);
    setCollectedAffirmations([]);
    initializeLevel(1);
  }, [initializeLevel]);

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

    // Check bad feelings collision (Level 1)
    if (currentLevel === 1) {
      setBadFeelings(prev => {
        const updated = prev.map(feeling => {
          if (!feeling.eaten && 
              feeling.position.x === playerPos.x && 
              feeling.position.y === playerPos.y) {
            
            if (feeling.powerUp) {
              // Power-up collected
              playSound('powerup');
              setScore(s => s + 300);
              setPowerUpActive(true);
              setPowerUpTimer(200); // 200 * 200ms = 40 seconds
              setGhosts(prev => prev.map(ghost => ({ ...ghost, type: 'helper' })));
            } else {
              // Regular emotional pellet
              playSound('collect');
              setScore(s => s + 100);
            }
            
            // Add affirmation
            const affirmation = AFFIRMATIONS[feeling.type];
            setCollectedAffirmations(prev => [...prev, affirmation.message]);
            setGhosts(prev => prev.map(ghost => ({ ...ghost, type: 'helper' })));
            
            return { ...feeling, eaten: true };
          }
          return feeling;
        });
        
        // Check level complete condition
        if (updated.every(feeling => feeling.eaten)) {
          setGameState('levelComplete');
        }
        
        return updated;
      });
    }

    // Check routine pellets collision (Level 2)
    if (currentLevel === 2) {
      setRoutinePellets(prev => {
        const updated = prev.map(pellet => {
          if (!pellet.eaten && 
              pellet.position.x === playerPos.x && 
              pellet.position.y === playerPos.y) {
            
            setScore(s => s + 150);
            
            // Show quiz for this routine
            if (pellet.quiz) {
              setCurrentQuiz(pellet.quiz);
              setGameState('quiz');
            }
            
            // Activate power-up with positive phrases
            setPowerUpActive(true);
            setPowerUpTimer(80);
            setGhosts(prev => prev.map(ghost => ({ ...ghost, type: 'helper' })));
            
            return { ...pellet, eaten: true };
          }
          return pellet;
        });
        
        // Check level complete condition
        if (updated.every(pellet => pellet.eaten)) {
          setGameState('won');
        }
        
        return updated;
      });
    }

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

  const nextLevel = () => {
    setCurrentLevel(2);
    initializeLevel(2);
    setGameState('playing');
  };

  const continueFromQuiz = () => {
    setCurrentQuiz(null);
    setShowQuizAnswer(false);
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

  const getRoutineColor = (type: string) => {
    switch (type) {
      case 'circle-time': return 'bg-blue-500';
      case 'snack': return 'bg-green-500';
      case 'cleanup': return 'bg-yellow-600';
      case 'line-up': return 'bg-indigo-500';
      case 'transition': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case 'circle-time': return '○';
      case 'snack': return '🍎';
      case 'cleanup': return '🧹';
      case 'line-up': return '→';
      case 'transition': return '↔';
      default: return '?';
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
        {gameState === 'welcome' && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="text-center space-y-6">
              {/* Teacher Character */}
              <div className="flex justify-center items-center mb-6">
                <div className="bg-white rounded-full p-4 shadow-lg border-4 border-blue-200">
                  <div className="text-6xl">👩‍🏫</div>
                </div>
              </div>
              
              {/* Welcome Message */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-blue-700 mb-4">Welcome to Pac-Heal!</h2>
                <p className="text-lg text-gray-700 mb-4">
                  Hi there! I'm Ms. Sarah, and I'm excited to guide you through this special training game designed for early childhood educators like you.
                </p>
              </div>

              {/* Educational Purpose */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-700 mb-3">What You'll Learn:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-600">Level 1: Emotional Regulation</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Transform negative emotions into positive affirmations</li>
                      <li>• Practice identifying children's emotional states</li>
                      <li>• Learn therapeutic responses to difficult behaviors</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600">Level 2: Classroom Management</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Master daily routine transitions</li>
                      <li>• Practice conflict resolution strategies</li>
                      <li>• Learn evidence-based classroom techniques</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How to Play */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <h3 className="text-xl font-semibold text-orange-700 mb-3">How to Play:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Controls:</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex gap-1">
                        <ArrowUp className="w-4 h-4" />
                        <ArrowDown className="w-4 h-4" />
                        <ArrowLeft className="w-4 h-4" />
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <span>or WASD to move</span>
                    </div>
                    <p className="text-sm text-gray-600">Spacebar to pause</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Gameplay:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Collect emotional pellets to gain wisdom</li>
                      <li>• Answer quiz questions to progress</li>
                      <li>• Transform challenges into learning opportunities</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                <h3 className="text-xl font-semibold text-indigo-700 mb-3">Training Objectives:</h3>
                <div className="text-left space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Emotional Intelligence:</strong> Develop skills to recognize and respond to children's emotional needs with empathy and evidence-based strategies.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Classroom Management:</strong> Practice daily routines and transitions that create a safe, structured learning environment for young children.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Professional Development:</strong> Gain practical knowledge that directly applies to your work with children ages 3-5 in early childhood settings.
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => setGameState('menu')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                Start Your Training Adventure! 🎮
              </Button>
            </div>
          </div>
        )}

        {gameState === 'menu' && (
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold">Choose Your Learning Path</div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Ready to begin your professional development journey?</p>
              <p>Each level teaches essential skills for early childhood educators.</p>
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
              className="relative mx-auto border-4 border-blue-800 bg-black rounded-lg shadow-2xl"
              style={{ 
                width: MAZE_SIZE * CELL_SIZE, 
                height: MAZE_SIZE * CELL_SIZE
              }}
            >
              {/* Maze walls */}
              {MAZE_LAYOUT.map((row, y) =>
                row.map((cell, x) => (
                  cell === 1 && (
                    <div
                      key={`wall-${x}-${y}`}
                      className="absolute bg-blue-500 border border-blue-300 shadow-inner"
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

              {/* Path dots for collection */}
              {MAZE_LAYOUT.map((row, y) =>
                row.map((cell, x) => {
                  if (cell === 0 && !badFeelings.some(f => f.position.x === x && f.position.y === y && !f.eaten) && 
                      !routinePellets.some(r => r.position.x === x && r.position.y === y && !r.eaten)) {
                    return (
                      <div
                        key={`dot-${x}-${y}`}
                        className="absolute bg-yellow-300 rounded-full"
                        style={{
                          left: x * CELL_SIZE + CELL_SIZE/2 - 2,
                          top: y * CELL_SIZE + CELL_SIZE/2 - 2,
                          width: 4,
                          height: 4,
                        }}
                      />
                    );
                  }
                  return null;
                })
              )}

              {/* Bad feelings */}
              {badFeelings.map(feeling => (
                !feeling.eaten && (
                  <div
                    key={`feeling-${feeling.id}`}
                    className={`absolute rounded-full ${getEmotionColor(feeling.type)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                    style={{
                      left: feeling.position.x * CELL_SIZE + 6,
                      top: feeling.position.y * CELL_SIZE + 6,
                      width: CELL_SIZE - 12,
                      height: CELL_SIZE - 12,
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

              {/* Player - Teacher Character */}
              <div
                className="absolute bg-yellow-200 rounded-full flex items-center justify-center border-3 border-yellow-400 shadow-xl transition-all duration-100 animate-pulse"
                style={{
                  left: playerPos.x * CELL_SIZE + 2,
                  top: playerPos.y * CELL_SIZE + 2,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  zIndex: 20,
                }}
              >
                <span className="text-xl font-bold">👩‍🏫</span>
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