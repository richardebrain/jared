import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: number;
  type: 'car' | 'bike' | 'stroller' | 'snack-cart' | 'glitter-puddle' | 'runaway-child';
  color: string;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'time-out-timer' | 'sticker-storm' | 'team-rally' | 'goldfish-bomb';
  color: string;
  active: boolean;
}

interface SafetyQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  domain: string;
}

interface GameLevel {
  level: number;
  dialogue: string;
  speed: number;
  obstacleCount: number;
  powerUpChance: number;
}

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 1,
    question: "A child runs toward the playground gate that was accidentally left open. What's your first action?",
    options: [
      "Shout loudly to stop them",
      "Quickly but calmly intercept while calling their name",
      "Send another child to get them",
      "Wait to see if they notice the gate"
    ],
    correctAnswer: 1,
    explanation: "Moving quickly but calmly while using their name helps redirect without causing panic or modeling unsafe behavior.",
    domain: "Safety & Emergency Procedures"
  },
  {
    id: 2,
    question: "You notice a child has a severe peanut allergy. What's the most important safety protocol?",
    options: [
      "Keep them away from all food",
      "Have an EpiPen nearby and know how to use it",
      "Only serve nut-free snacks to everyone",
      "Call parents immediately"
    ],
    correctAnswer: 1,
    explanation: "Having epinephrine auto-injectors accessible and staff trained to use them is the most critical safety measure for severe allergies.",
    domain: "Health & Medical Safety"
  },
  {
    id: 3,
    question: "During outdoor play, you see a child climbing too high on equipment. Best response?",
    options: [
      "Tell them to get down immediately",
      "Position yourself to spot them while calmly redirecting",
      "Remove them from the playground",
      "Ignore it - kids need to take risks"
    ],
    correctAnswer: 1,
    explanation: "Positioning for safety while offering calm guidance balances safety with allowing age-appropriate risk-taking and independence.",
    domain: "Playground Safety"
  },
  {
    id: 4,
    question: "A child starts choking during snack time. What's your immediate action sequence?",
    options: [
      "Back blows, then call 911",
      "Heimlich maneuver immediately",
      "Encourage them to cough first, then intervene if needed",
      "Turn them upside down"
    ],
    correctAnswer: 2,
    explanation: "If a child can cough, cry, or speak, encourage coughing first. If they cannot, then proceed with appropriate first aid measures.",
    domain: "First Aid & Emergency Response"
  },
  {
    id: 5,
    question: "You notice a parent seems agitated during pickup. How do you handle this professionally?",
    options: [
      "Avoid them and let someone else deal with it",
      "Approach with empathy and offer to talk privately",
      "Immediately call your supervisor",
      "Document everything they say"
    ],
    correctAnswer: 1,
    explanation: "Approaching with empathy and offering private conversation shows professionalism while protecting family privacy and child wellbeing.",
    domain: "Family Communication"
  },
  {
    id: 6,
    question: "A child reports that another child hit them. What's your first step?",
    options: [
      "Immediately discipline the aggressor",
      "Comfort the hurt child and assess for injuries",
      "Make both children apologize",
      "Separate them for the rest of the day"
    ],
    correctAnswer: 1,
    explanation: "First priority is always ensuring the injured child's physical and emotional safety, then addressing the incident appropriately.",
    domain: "Behavior Management"
  },
  {
    id: 7,
    question: "During a fire drill, a child with autism becomes overwhelmed and refuses to move. You should:",
    options: [
      "Carry them out immediately",
      "Use their preferred calming strategy while guiding them to safety",
      "Leave them with another adult",
      "Wait until they're ready to move"
    ],
    correctAnswer: 1,
    explanation: "Using familiar calming strategies while ensuring safety accommodates individual needs during emergency procedures.",
    domain: "Inclusive Emergency Procedures"
  },
  {
    id: 8,
    question: "You suspect a child may be experiencing abuse at home. Your appropriate action is:",
    options: [
      "Confront the parents directly",
      "Report to Child Protective Services and document observations",
      "Wait to gather more evidence",
      "Discuss with other parents"
    ],
    correctAnswer: 1,
    explanation: "Mandated reporters must report suspected abuse immediately while maintaining confidentiality and proper documentation.",
    domain: "Child Protection"
  }
];

const GAME_LEVELS: GameLevel[] = [
  {
    level: 1,
    dialogue: "Oh no! Little Timmy spotted the playground gate was left open and took off running! Chase him safely while avoiding obstacles and demonstrating calm, professional responses to safety situations!",
    speed: 1,
    obstacleCount: 3,
    powerUpChance: 0.3
  },
  {
    level: 2,
    dialogue: "Now Emma has joined the escape! Multiple children are heading for the street. Stay calm, use your safety knowledge, and rescue them both!",
    speed: 1.5,
    obstacleCount: 5,
    powerUpChance: 0.25
  },
  {
    level: 3,
    dialogue: "Code Red! A whole group decided the outside world looks fun. Show your master-level safety skills to get everyone back safely!",
    speed: 2,
    obstacleCount: 7,
    powerUpChance: 0.2
  }
];

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 8;

export default function WhoLeftTheGateOpen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'question' | 'completed' | 'game-over'>('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SafetyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    lives: 3
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);

  // Game effects
  const [timeSlowActive, setTimeSlowActive] = useState(false);
  const [stickerStormActive, setStickerStormActive] = useState(false);
  const [teamRallyActive, setTeamRallyActive] = useState(false);
  const [glitterStuck, setGlitterStuck] = useState(false);
  const [fireDrillActive, setFireDrillActive] = useState(false);

  // Initialize audio context
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
    }
  }, []);

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      // Special actions
      if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'paused') {
          setGameState('playing');
        } else if (gameState === 'playing') {
          setGameState('paused');
        }
      }
      
      // Glitter puddle escape
      if (glitterStuck && e.key.toLowerCase() === 'w') {
        setGlitterStuck(false);
        playSound(600, 0.2);
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
  }, [gameState, glitterStuck, playSound]);

  // Player movement
  const updatePlayer = useCallback(() => {
    if (glitterStuck) return; // Can't move when stuck in glitter

    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;

      if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
        newX = Math.max(0, prev.x - PLAYER_SPEED);
      }
      if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
        newX = Math.min(CANVAS_WIDTH - prev.width, prev.x + PLAYER_SPEED);
      }
      if (keysRef.current.has('arrowup') || keysRef.current.has('w')) {
        newY = Math.max(0, prev.y - PLAYER_SPEED);
      }
      if (keysRef.current.has('arrowdown') || keysRef.current.has('s')) {
        newY = Math.min(CANVAS_HEIGHT - prev.height, prev.y + PLAYER_SPEED);
      }

      return { ...prev, x: newX, y: newY };
    });
  }, [glitterStuck]);

  // Collision detection
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Generate obstacles
  const generateObstacle = useCallback((): Obstacle => {
    const types: Obstacle['type'][] = ['car', 'bike', 'stroller', 'snack-cart', 'glitter-puddle', 'runaway-child'];
    const type = types[Math.floor(Math.random() * types.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = (Math.random() * 2 + 1) * (timeSlowActive ? 0.5 : 1) * (fireDrillActive ? 1.2 : 1);
    
    const colors = {
      'car': '#ff6b6b',
      'bike': '#4ecdc4',
      'stroller': '#45b7d1',
      'snack-cart': '#f39c12',
      'glitter-puddle': '#e74c3c',
      'runaway-child': '#2ecc71'
    };

    return {
      id: Math.random(),
      x: direction === 1 ? -60 : CANVAS_WIDTH + 60,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      width: type === 'glitter-puddle' ? 80 : 60,
      height: type === 'glitter-puddle' ? 20 : 40,
      speed,
      direction,
      type,
      color: colors[type]
    };
  }, [timeSlowActive, fireDrillActive]);

  // Generate power-ups
  const generatePowerUp = useCallback((): PowerUp => {
    const types: PowerUp['type'][] = ['time-out-timer', 'sticker-storm', 'team-rally', 'goldfish-bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const colors = {
      'time-out-timer': '#f39c12',
      'sticker-storm': '#e74c3c',
      'team-rally': '#3498db',
      'goldfish-bomb': '#f1c40f'
    };

    return {
      id: Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 40) + 20,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      width: 30,
      height: 30,
      type,
      color: colors[type],
      active: true
    };
  }, []);

  // Handle power-up collection
  const handlePowerUpCollection = useCallback((powerUp: PowerUp) => {
    playSound(800, 0.3);
    setScore(prev => prev + 50);
    
    switch (powerUp.type) {
      case 'time-out-timer':
        setTimeSlowActive(true);
        setTimeout(() => setTimeSlowActive(false), 5000);
        toast({
          title: "Time-Out Timer!",
          description: "All obstacles slowed for 5 seconds!",
          duration: 2000,
        });
        break;
      case 'sticker-storm':
        setStickerStormActive(true);
        setTimeout(() => setStickerStormActive(false), 10000);
        toast({
          title: "Sticker Storm!",
          description: "Bonus points for safety questions!",
          duration: 2000,
        });
        break;
      case 'team-rally':
        setTeamRallyActive(true);
        setTimeout(() => setTeamRallyActive(false), 8000);
        toast({
          title: "Team Rally!",
          description: "Obstacles part like a crowd!",
          duration: 2000,
        });
        break;
      case 'goldfish-bomb':
        // Trigger allergen question
        const allergenQuestion = SAFETY_QUESTIONS.find(q => q.domain === "Health & Medical Safety");
        if (allergenQuestion) {
          setCurrentQuestion(allergenQuestion);
          setGameState('question');
        }
        break;
    }
  }, [playSound, toast]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    updatePlayer();

    // Update obstacles
    setObstacles(prev => {
      const currentLevel = GAME_LEVELS[Math.min(currentLevel, GAME_LEVELS.length - 1)];
      let newObstacles = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x + obstacle.speed * obstacle.direction * (teamRallyActive ? 0.3 : 1)
      })).filter(obstacle => 
        obstacle.x > -100 && obstacle.x < CANVAS_WIDTH + 100
      );

      // Add new obstacles
      if (newObstacles.length < currentLevel.obstacleCount && Math.random() < 0.02) {
        newObstacles.push(generateObstacle());
      }

      // Check collisions
      newObstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
          if (obstacle.type === 'glitter-puddle') {
            setGlitterStuck(true);
            playSound(200, 0.5);
            setTimeout(() => setGlitterStuck(false), 2000);
          } else if (obstacle.type === 'runaway-child') {
            // Success! Caught the child
            setScore(prev => prev + 100);
            playSound(1000, 0.5);
            
            // Trigger safety question
            const randomQuestion = SAFETY_QUESTIONS[Math.floor(Math.random() * SAFETY_QUESTIONS.length)];
            setCurrentQuestion(randomQuestion);
            setGameState('question');
          } else {
            // Hit obstacle - lose life
            setPlayer(prev => ({ ...prev, lives: prev.lives - 1 }));
            playSound(150, 0.8, 'square');
            
            if (player.lives <= 1) {
              setGameState('game-over');
            }
          }
        }
      });

      return newObstacles;
    });

    // Update power-ups
    setPowerUps(prev => {
      let newPowerUps = prev.filter(powerUp => powerUp.active);
      
      // Add new power-ups
      const currentLevelData = GAME_LEVELS[Math.min(currentLevel, GAME_LEVELS.length - 1)];
      if (newPowerUps.length < 2 && Math.random() < currentLevelData.powerUpChance * 0.01) {
        newPowerUps.push(generatePowerUp());
      }

      // Check power-up collisions
      newPowerUps.forEach(powerUp => {
        if (checkCollision(player, powerUp)) {
          handlePowerUpCollection(powerUp);
          powerUp.active = false;
        }
      });

      return newPowerUps.filter(p => p.active);
    });

    // Random events
    if (Math.random() < 0.001) {
      setFireDrillActive(true);
      playSound(400, 0.2, 'sawtooth');
      toast({
        title: "🚨 Fire Drill Frenzy!",
        description: "All obstacles speed up!",
        duration: 3000,
      });
      setTimeout(() => setFireDrillActive(false), 5000);
    }

    // Level progression
    if (score > (currentLevel + 1) * 500 && currentLevel < GAME_LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1);
      toast({
        title: `Level ${currentLevel + 2}!`,
        description: GAME_LEVELS[currentLevel + 1].dialogue,
        duration: 4000,
      });
    }

  }, [gameState, updatePlayer, currentLevel, generateObstacle, generatePowerUp, checkCollision, player, handlePowerUpCollection, playSound, toast, teamRallyActive, score]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const intervalId = setInterval(gameLoop, 1000 / 60); // 60 FPS
      return () => clearInterval(intervalId);
    }
  }, [gameState, gameLoop]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw playground background
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

    if (gameState === 'playing' || gameState === 'paused') {
      // Draw obstacles
      obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add labels
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const labels = {
          'car': '🚗',
          'bike': '🚲',
          'stroller': '🍼',
          'snack-cart': '🍪',
          'glitter-puddle': '✨',
          'runaway-child': '👶'
        };
        ctx.fillText(labels[obstacle.type], obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 4);
      });

      // Draw power-ups
      powerUps.forEach(powerUp => {
        if (!powerUp.active) return;
        
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // Add power-up icons
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const icons = {
          'time-out-timer': '⏰',
          'sticker-storm': '⭐',
          'team-rally': '👥',
          'goldfish-bomb': '🐠'
        };
        ctx.fillText(icons[powerUp.type], powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 6);
      });

      // Draw player
      ctx.fillStyle = glitterStuck ? '#e74c3c' : '#3498db';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Player icon
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👩‍🏫', player.x + player.width/2, player.y + player.height/2 + 6);

      // Draw UI
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Lives: ${'❤️'.repeat(player.lives)}`, 10, 50);
      ctx.fillText(`Level: ${currentLevel + 1}`, 10, 70);
      
      // Active effects
      let effectY = 90;
      if (timeSlowActive) {
        ctx.fillText('⏰ Time Slow', 10, effectY);
        effectY += 20;
      }
      if (stickerStormActive) {
        ctx.fillText('⭐ Sticker Storm', 10, effectY);
        effectY += 20;
      }
      if (teamRallyActive) {
        ctx.fillText('👥 Team Rally', 10, effectY);
        effectY += 20;
      }
      if (glitterStuck) {
        ctx.fillText('✨ Stuck! Press W to escape!', 10, effectY);
        effectY += 20;
      }
      if (fireDrillActive) {
        ctx.fillText('🚨 Fire Drill!', 10, effectY);
      }

      // Controls
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('Arrow Keys/WASD: Move', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 60);
      ctx.fillText('Space: Pause', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 40);
      ctx.fillText('Chase the 👶 runaway children!', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
  }, [gameState, obstacles, powerUps, player, score, currentLevel, timeSlowActive, stickerStormActive, teamRallyActive, glitterStuck, fireDrillActive]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCurrentLevel(0);
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      lives: 3
    });
    setObstacles([]);
    setPowerUps([]);
    playSound(600, 0.5);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const bonusPoints = stickerStormActive ? 200 : 100;
      setScore(prev => prev + bonusPoints);
      playSound(800, 0.7);
    } else {
      playSound(200, 0.7);
    }
    
    setShowExplanation(true);
  };

  const continueAfterQuestion = async () => {
    if (!currentQuestion) return;

    try {
      // Award points for game completion
      await apiRequest('/api/games/complete', {
        method: 'POST',
        body: {
          gameType: 'who-left-gate-open',
          score: score,
          level: currentLevel + 1,
          questionsAnswered: 1,
          correctAnswers: selectedAnswer === currentQuestion.correctAnswer ? 1 : 0
        }
      });
      
      toast({
        title: "Points Awarded!",
        description: `You earned points for playing the safety game!`,
        duration: 3000,
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (error) {
      console.warn('Could not award points:', error);
    }
    
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameState('playing');
  };

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Safety Question - {currentQuestion.domain}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg font-medium">{currentQuestion.question}</p>
              
              {!showExplanation ? (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className="text-left justify-start h-auto p-4"
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                    >
                      <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                    <p className="font-medium">
                      {selectedAnswer === currentQuestion.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                    </p>
                    <p className="text-sm mt-2">{currentQuestion.explanation}</p>
                  </div>
                  
                  {selectedAnswer === currentQuestion.correctAnswer && stickerStormActive && (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <p className="text-sm font-medium">🌟 Sticker Storm Bonus! +100 extra points!</p>
                    </div>
                  )}
                  
                  <Button onClick={continueAfterQuestion} className="w-full">
                    Continue Game
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <Users className="h-6 w-6" />
            </div>
            Who Left the Gate Open? 
            <Badge variant="outline">ECE Safety Adventure</Badge>
          </CardTitle>
          <p className="text-gray-600 mt-2">
            A super silly ECE safety adventure! Chase runaway children, avoid obstacles, collect power-ups, and answer safety questions to become the ultimate preschool safety hero!
          </p>
        </CardHeader>
        <CardContent>
          {gameState === 'menu' && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">🏃‍♀️ How to Play:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><ArrowUp className="inline h-4 w-4" /> <ArrowDown className="inline h-4 w-4" /> <ArrowLeft className="inline h-4 w-4" /> <ArrowRight className="inline h-4 w-4" /> or WASD: Move</p>
                    <p>🎯 Chase the 👶 runaway children</p>
                    <p>🚗 Avoid cars, bikes, and other obstacles</p>
                    <p>⭐ Collect power-ups for special abilities</p>
                  </div>
                  <div className="space-y-2">
                    <p>💫 Answer safety questions for bonus points</p>
                    <p>❤️ You have 3 lives - don't get hit!</p>
                    <p>⏰ Time-Out Timer slows obstacles</p>
                    <p>✨ Get stuck in glitter? Press W to escape!</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-bold text-orange-800 mb-2">🎮 Power-Ups:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-orange-700">
                  <p>⏰ Time-Out Timer - Slows obstacles</p>
                  <p>⭐ Sticker Storm - Bonus question points</p>
                  <p>👥 Team Rally - Obstacles part like a crowd</p>
                  <p>🐠 Goldfish Bomb - Allergen safety question</p>
                </div>
              </div>
              
              <Button onClick={startGame} size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Play className="h-5 w-5 mr-2" />
                Start Safety Adventure!
              </Button>
            </div>
          )}

          {gameState === 'game-over' && (
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-red-600">Game Over!</h3>
              <p className="text-lg">Final Score: {score}</p>
              <p className="text-gray-600">All the children made it safely back to the classroom!</p>
              <Button onClick={startGame} size="lg">
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Badge variant="outline">Score: {score}</Badge>
                  <Badge variant="outline">Level: {currentLevel + 1}</Badge>
                  <Badge variant="outline">Lives: {'❤️'.repeat(player.lives)}</Badge>
                </div>
                <Button
                  onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                  variant="outline"
                >
                  {gameState === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {gameState === 'paused' ? 'Resume' : 'Pause'}
                </Button>
              </div>
              
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-orange-300 rounded-lg bg-sky-200 mx-auto block"
                tabIndex={0}
              />
              
              <div className="text-center text-sm text-gray-600">
                Current Level: {GAME_LEVELS[currentLevel]?.dialogue}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
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