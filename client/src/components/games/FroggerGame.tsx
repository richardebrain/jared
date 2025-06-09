import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Core Frogger mechanics constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE); // 20 columns
const ROWS = 13;
const LANE_HEIGHT = CANVAS_HEIGHT / ROWS;
const PLAYER_START_ROW = ROWS - 2;
const GOAL_ROW = 1;
const SAFE_ZONE_ROW = Math.floor(ROWS / 2);

interface Player {
  row: number;
  col: number;
  lives: number;
}

interface Obstacle {
  id: number;
  x: number;
  row: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'bike' | 'stroller';
  color: string;
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
  
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'question' | 'gameOver' | 'levelComplete'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Player with grid coordinates
  const [player, setPlayer] = useState<Player>({
    row: PLAYER_START_ROW,
    col: Math.floor(COLS / 2),
    lives: 3
  });
  
  const [checkpoint, setCheckpoint] = useState(PLAYER_START_ROW);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Lane configuration for authentic Frogger
  const [laneDirections] = useState<number[]>(() => {
    return Array.from({ length: ROWS }, (_, i) => {
      if (i === 0 || i === ROWS - 1 || i === SAFE_ZONE_ROW) return 0; // Safe zones
      return i % 2 === 0 ? 1 : -1; // Alternate directions
    });
  });
  
  const [laneTimers, setLaneTimers] = useState<number[]>(new Array(ROWS).fill(0));

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

  // Obstacle spawning with consistent timers
  const spawnObstacle = useCallback((row: number) => {
    if (laneDirections[row] === 0) return; // Skip safe zones
    
    const obstacleTypes = ['car', 'bike', 'stroller'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as 'car' | 'bike' | 'stroller';
    const colors = { car: '#FF6B6B', bike: '#FFD700', stroller: '#DDA0DD' };
    
    const newObstacle: Obstacle = {
      id: Math.random(),
      x: laneDirections[row] > 0 ? -GRID_SIZE : CANVAS_WIDTH,
      row: row,
      width: GRID_SIZE,
      height: GRID_SIZE * 0.8,
      speed: (1 + level * 0.3) * laneDirections[row],
      type: type,
      color: colors[type]
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [level, laneDirections]);

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

  // Main game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // Update obstacle positions
    setObstacles(prev => prev
      .map(obstacle => ({
        ...obstacle,
        x: obstacle.x + obstacle.speed
      }))
      .filter(obstacle => 
        obstacle.x > -GRID_SIZE * 2 && obstacle.x < CANVAS_WIDTH + GRID_SIZE * 2
      )
    );
    
    // Spawn new obstacles based on lane timers
    setLaneTimers(prev => prev.map((timer, row) => {
      const newTimer = timer + 1;
      const spawnInterval = 120 - (level * 10); // Faster spawning each level
      
      if (newTimer >= spawnInterval && laneDirections[row] !== 0) {
        spawnObstacle(row);
        return 0;
      }
      return newTimer;
    }));
    
    checkCollisions();
  }, [gameState, level, spawnObstacle, checkCollisions, laneDirections]);

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
      lives: 3
    });
    setCheckpoint(PLAYER_START_ROW);
    setObstacles([]);
    setLaneTimers(new Array(ROWS).fill(0));
  };

  const handleQuestionAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestion?.correctAnswer) {
      playSound(523, 200);
      setScore(prev => prev + 50);
    } else {
      playSound(150, 300);
      setPlayer(prev => ({ ...prev, lives: prev.lives - 1 }));
    }
  };

  const continueAfterQuestion = () => {
    setShowExplanation(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    
    if (player.lives <= 0) {
      setGameState('gameOver');
    } else {
      // Reset to checkpoint
      setPlayer(prev => ({
        ...prev,
        row: checkpoint,
        col: Math.floor(COLS / 2)
      }));
      setGameState('playing');
    }
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setPlayer(prev => ({
      ...prev,
      row: PLAYER_START_ROW,
      col: Math.floor(COLS / 2)
    }));
    setCheckpoint(PLAYER_START_ROW);
    setObstacles([]);
    setGameState('playing');
  };

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">Preschool Safety Dash</h1>
          <p className="text-lg text-gray-600 mb-6">
            Navigate safely through the playground to reach the child who needs help!
            Answer safety questions along the way.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">How to Play:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use arrow keys to move one step at a time</li>
              <li>• Avoid obstacles in each lane</li>
              <li>• Answer safety questions when you get hit</li>
              <li>• Reach the green goal zone to complete the level</li>
            </ul>
          </div>
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl"
          >
            Start Playing
          </button>
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