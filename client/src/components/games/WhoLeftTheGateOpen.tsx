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
  }
];

const GAME_LEVELS: GameLevel[] = [
  {
    level: 1,
    dialogue: "Oh no! Little Timmy spotted the playground gate was left open and took off running! Chase him safely while avoiding obstacles!",
    speed: 1,
    obstacleCount: 3,
    powerUpChance: 0.3
  },
  {
    level: 2,
    dialogue: "Now Emma has joined the escape! Multiple children are heading for the street. Stay calm and rescue them both!",
    speed: 1.5,
    obstacleCount: 5,
    powerUpChance: 0.25
  },
  {
    level: 3,
    dialogue: "Code Red! A whole group decided the outside world looks fun. Show your master-level safety skills!",
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

  // Start new game
  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      lives: 3
    });
    setObstacles([]);
    setPowerUps([]);
  };

  // Handle answer selection
  const handleAnswerSelect = async (answerIndex: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? 100 : 25;
    
    setScore(prev => prev + pointsEarned);
    
    if (isCorrect) {
      playSound(800, 0.5);
      toast({
        title: "Correct!",
        description: `+${pointsEarned} points for excellent safety knowledge!`,
        duration: 2000,
      });
    } else {
      playSound(200, 0.5);
      toast({
        title: "Not quite right",
        description: `+${pointsEarned} points for trying. Review the explanation!`,
        duration: 2000,
      });
    }

    // Submit completion to backend if user is logged in
    if (user) {
      try {
        await apiRequest('/api/games/complete', {
          method: 'POST',
          data: {
            gameType: 'who-left-the-gate-open',
            score: score + pointsEarned,
            level: currentLevel + 1,
            questionId: currentQuestion.id,
            isCorrect,
            pointsEarned
          }
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
        queryClient.invalidateQueries({ queryKey: ['/api/points/history'] });
      } catch (error) {
        console.error('Failed to submit game completion:', error);
      }
    }
  };

  // Continue after question
  const continueGame = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    if (currentLevel >= GAME_LEVELS.length - 1) {
      setGameState('completed');
    } else {
      setCurrentLevel(prev => prev + 1);
      setGameState('playing');
    }
  };

  // Reset game
  const resetGame = () => {
    setGameState('menu');
    setCurrentLevel(0);
    setScore(0);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  // Render game menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Who Left the Gate Open?!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oh no! Children are escaping through an open gate! Navigate safely through the chaos 
              while demonstrating your expertise in early childhood safety protocols. Answer safety 
              questions correctly to earn points and show your professional knowledge!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Mission</h3>
                  <p className="text-sm text-blue-600">Safely guide escaped children back while avoiding playground obstacles</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Learn</h3>
                  <p className="text-sm text-green-600">Answer safety questions to demonstrate your ECE expertise</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-800">Earn</h3>
                  <p className="text-sm text-purple-600">Gain points and achievements for your professional development</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                How to Play
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use arrow keys or WASD to move your character</li>
                <li>• Avoid obstacles while chasing escaped children</li>
                <li>• Answer safety questions when prompted</li>
                <li>• Earn points for correct answers and safe navigation</li>
                <li>• Complete all levels to master playground safety!</li>
              </ul>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={startGame}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Safety Challenge
              </Button>
              
              {user && (
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>Playing as {user.firstName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>Earn Bear Bucks & XP</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render safety question
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Safety Knowledge Check
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-blue-100">
                  Level {currentLevel + 1}
                </Badge>
                <Badge variant="outline" className="bg-green-100">
                  Score: {score}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full mt-1">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">{currentQuestion.domain}</h3>
                  <p className="text-blue-700 text-lg leading-relaxed">{currentQuestion.question}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  variant={
                    selectedAnswer === null ? "outline" :
                    index === currentQuestion.correctAnswer ? "default" :
                    index === selectedAnswer ? "destructive" : "outline"
                  }
                  className={`w-full text-left justify-start p-4 h-auto whitespace-normal ${
                    selectedAnswer === null ? "hover:bg-blue-50" :
                    index === currentQuestion.correctAnswer ? "bg-green-100 text-green-800 border-green-300" :
                    index === selectedAnswer ? "bg-red-100 text-red-800 border-red-300" : "bg-gray-50"
                  }`}
                >
                  <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
            
            {showExplanation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Explanation:</h4>
                <p className="text-green-700">{currentQuestion.explanation}</p>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <Button onClick={continueGame} className="bg-green-600 hover:bg-green-700">
                    Continue Challenge
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render game completion
  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">
                Safety Expert!
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600">
              Congratulations! You've successfully demonstrated excellent safety protocols and 
              rescued all the escaped children. Your professional knowledge is impressive!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Final Score</h3>
              <p className="text-4xl font-bold text-green-600 mb-4">{score} points</p>
              <div className="grid grid-cols-3 gap-4 text-sm text-green-700">
                <div>
                  <p className="font-semibold">Levels Completed</p>
                  <p>{GAME_LEVELS.length}</p>
                </div>
                <div>
                  <p className="font-semibold">Safety Knowledge</p>
                  <p>Expert Level</p>
                </div>
                <div>
                  <p className="font-semibold">Children Rescued</p>
                  <p>All Safe!</p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={resetGame}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mr-4"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Play Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/games'}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Try Other Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simple playing state (basic implementation)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Level {currentLevel + 1}: {GAME_LEVELS[currentLevel]?.dialogue}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-100">
                <Heart className="h-4 w-4 mr-1" />
                Lives: {player.lives}
              </Badge>
              <Badge variant="outline" className="bg-green-100">
                Score: {score}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              Use arrow keys to move around and catch the escaped children! 
              Navigate safely and answer questions when prompted.
            </p>
            <Button 
              onClick={() => {
                // Trigger a sample question after a short delay
                setTimeout(() => {
                  const randomQuestion = SAFETY_QUESTIONS[Math.floor(Math.random() * SAFETY_QUESTIONS.length)];
                  setCurrentQuestion(randomQuestion);
                  setGameState('question');
                }, 2000);
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Trigger Safety Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}