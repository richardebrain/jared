import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Puzzle, 
  Trophy, 
  Star, 
  Brain, 
  Timer, 
  RotateCcw,
  CheckCircle,
  Target,
  Shuffle,
  Play,
  Award,
  Lightbulb,
  BookOpen,
  Users,
  Heart
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface PuzzleGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  icon: React.ElementType;
  color: string;
  points: number;
  estimatedTime: string;
}

interface GameProgress {
  gameId: string;
  score: number;
  completed: boolean;
  timeSpent: number;
  attempts: number;
}

interface WordScrambleState {
  currentWord: string;
  scrambledWord: string;
  userAnswer: string;
  score: number;
  round: number;
  maxRounds: number;
  isCorrect: boolean | null;
  showHint: boolean;
}

interface MemoryMatchState {
  cards: Array<{ id: number; concept: string; matched: boolean; flipped: boolean }>;
  flippedCards: number[];
  score: number;
  moves: number;
  gameComplete: boolean;
}

interface ConceptSortState {
  concepts: Array<{ id: number; text: string; category: string; placed: boolean }>;
  categories: Array<{ name: string; items: string[] }>;
  score: number;
  draggedItem: string | null;
}

const puzzleGames: PuzzleGame[] = [
  {
    id: 'word-scramble',
    title: 'ECE Word Scramble',
    description: 'Unscramble early childhood education terms and concepts',
    difficulty: 'Easy',
    category: 'Vocabulary',
    icon: Shuffle,
    color: 'from-blue-500 to-blue-600',
    points: 5,
    estimatedTime: '5 mins'
  },
  {
    id: 'memory-match',
    title: 'Teaching Concept Memory',
    description: 'Match teaching strategies with their applications',
    difficulty: 'Medium',
    category: 'Strategy',
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
    points: 8,
    estimatedTime: '8 mins'
  },
  {
    id: 'concept-sort',
    title: 'Developmental Sort',
    description: 'Sort activities by appropriate age groups and domains',
    difficulty: 'Medium',
    category: 'Development',
    icon: Target,
    color: 'from-green-500 to-green-600',
    points: 10,
    estimatedTime: '10 mins'
  },
  {
    id: 'sequence-puzzle',
    title: 'Lesson Sequence Builder',
    description: 'Arrange lesson components in the correct order',
    difficulty: 'Hard',
    category: 'Planning',
    icon: BookOpen,
    color: 'from-orange-500 to-orange-600',
    points: 12,
    estimatedTime: '12 mins'
  },
  {
    id: 'scenario-solver',
    title: 'Classroom Crisis Solver',
    description: 'Choose the best responses to challenging situations',
    difficulty: 'Hard',
    category: 'Management',
    icon: Lightbulb,
    color: 'from-red-500 to-red-600',
    points: 15,
    estimatedTime: '15 mins'
  },
  {
    id: 'social-emotional-match',
    title: 'Social-Emotional Skills',
    description: 'Match emotions with appropriate teaching responses',
    difficulty: 'Medium',
    category: 'Social-Emotional',
    icon: Heart,
    color: 'from-pink-500 to-pink-600',
    points: 8,
    estimatedTime: '7 mins'
  }
];

const eceWords = [
  { word: 'SCAFFOLDING', hint: 'Support structure for learning' },
  { word: 'MONTESSORI', hint: 'Educational approach emphasizing independence' },
  { word: 'PHONICS', hint: 'Method for teaching reading sounds' },
  { word: 'REGGIO', hint: 'Italian educational philosophy' },
  { word: 'SENSORY', hint: 'Related to the five senses' },
  { word: 'DRAMATIC', hint: 'Type of play involving role-playing' },
  { word: 'ASSESSMENT', hint: 'Process of evaluating progress' },
  { word: 'CURRICULUM', hint: 'Planned course of study' },
  { word: 'ENVIRONMENT', hint: 'Physical space for learning' },
  { word: 'MILESTONES', hint: 'Important developmental markers' }
];

const memoryPairs = [
  { concept: 'Positive Reinforcement', match: 'Praise good behavior immediately' },
  { concept: 'Redirection', match: 'Guide child to appropriate activity' },
  { concept: 'Natural Consequences', match: 'Let outcomes teach the lesson' },
  { concept: 'Time-In', match: 'Stay close and provide support' },
  { concept: 'Modeling', match: 'Demonstrate expected behavior' },
  { concept: 'Choice Making', match: 'Offer two acceptable options' },
  { concept: 'Environmental Cues', match: 'Use visual reminders' },
  { concept: 'Transition Warning', match: 'Give 5-minute notice before change' }
];

const conceptSortCategories = [
  {
    name: 'Infants (0-12 months)',
    concepts: ['Tummy Time', 'Peek-a-boo', 'Sensory Bottles', 'Lullabies', 'Object Permanence Games']
  },
  {
    name: 'Toddlers (1-2 years)', 
    concepts: ['Stacking Blocks', 'Simple Puzzles', 'Push-Pull Toys', 'Water Play', 'Finger Foods']
  },
  {
    name: 'Preschool (3-5 years)',
    concepts: ['Dramatic Play', 'Letter Recognition', 'Counting Games', 'Art Projects', 'Story Time']
  }
];

function WordScrambleGame({ onComplete, onPointsEarned }: { onComplete: () => void; onPointsEarned: (points: number) => void }) {
  const [gameState, setGameState] = useState<WordScrambleState>({
    currentWord: '',
    scrambledWord: '',
    userAnswer: '',
    score: 0,
    round: 1,
    maxRounds: 5,
    isCorrect: null,
    showHint: false
  });
  const [timeLeft, setTimeLeft] = useState(60);
  const { toast } = useToast();

  const scrambleWord = (word: string) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  const startNewRound = () => {
    const randomWord = eceWords[Math.floor(Math.random() * eceWords.length)];
    setGameState(prev => ({
      ...prev,
      currentWord: randomWord.word,
      scrambledWord: scrambleWord(randomWord.word),
      userAnswer: '',
      isCorrect: null,
      showHint: false
    }));
  };

  useEffect(() => {
    startNewRound();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleGameEnd();
    }
  }, [timeLeft]);

  const handleSubmit = () => {
    const isCorrect = gameState.userAnswer.toUpperCase() === gameState.currentWord;
    const points = isCorrect ? 10 : 0;
    
    setGameState(prev => ({ 
      ...prev, 
      isCorrect,
      score: prev.score + points
    }));

    if (isCorrect) {
      toast({
        title: "Correct!",
        description: `+${points} points`,
      });
    }

    setTimeout(() => {
      if (gameState.round < gameState.maxRounds) {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }));
        startNewRound();
      } else {
        handleGameEnd();
      }
    }, 2000);
  };

  const handleGameEnd = () => {
    onPointsEarned(gameState.score);
    onComplete();
    toast({
      title: "Game Complete!",
      description: `Final Score: ${gameState.score} points`,
    });
  };

  const currentHint = eceWords.find(w => w.word === gameState.currentWord)?.hint || '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Badge variant="outline">Round {gameState.round}/{gameState.maxRounds}</Badge>
          <Badge variant="secondary">Score: {gameState.score}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className={timeLeft < 20 ? 'text-red-500 font-bold' : ''}>{timeLeft}s</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Unscramble this ECE term:</h3>
            <div className="text-4xl font-mono tracking-widest text-blue-600 bg-blue-50 py-4 rounded-lg">
              {gameState.scrambledWord}
            </div>
            
            {gameState.showHint && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800">💡 Hint: {currentHint}</p>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                value={gameState.userAnswer}
                onChange={(e) => setGameState(prev => ({ ...prev, userAnswer: e.target.value }))}
                className="w-full p-3 text-center text-xl border rounded-lg"
                placeholder="Enter your answer..."
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              
              <div className="flex gap-2 justify-center">
                <Button onClick={handleSubmit} disabled={!gameState.userAnswer || gameState.isCorrect !== null}>
                  Submit Answer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setGameState(prev => ({ ...prev, showHint: true }))}
                  disabled={gameState.showHint}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Hint
                </Button>
              </div>
            </div>

            {gameState.isCorrect !== null && (
              <div className={`p-4 rounded-lg ${gameState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {gameState.isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Correct! The answer was {gameState.currentWord}</span>
                  </div>
                ) : (
                  <span>Incorrect. The answer was {gameState.currentWord}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MemoryMatchGame({ onComplete, onPointsEarned }: { onComplete: () => void; onPointsEarned: (points: number) => void }) {
  const [gameState, setGameState] = useState<MemoryMatchState>({
    cards: [],
    flippedCards: [],
    score: 0,
    moves: 0,
    gameComplete: false
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initialize cards
    const shuffledPairs = [...memoryPairs].sort(() => Math.random() - 0.5).slice(0, 6);
    const cards = [];
    
    shuffledPairs.forEach((pair, index) => {
      cards.push({ id: index * 2, concept: pair.concept, matched: false, flipped: false });
      cards.push({ id: index * 2 + 1, concept: pair.match, matched: false, flipped: false });
    });
    
    setGameState(prev => ({ ...prev, cards: cards.sort(() => Math.random() - 0.5) }));
  }, []);

  const handleCardClick = (cardId: number) => {
    if (gameState.flippedCards.length === 2 || gameState.cards[cardId].matched || gameState.cards[cardId].flipped) {
      return;
    }

    const newCards = [...gameState.cards];
    newCards[cardId].flipped = true;
    const newFlippedCards = [...gameState.flippedCards, cardId];

    setGameState(prev => ({
      ...prev,
      cards: newCards,
      flippedCards: newFlippedCards,
      moves: prev.moves + 1
    }));

    if (newFlippedCards.length === 2) {
      setTimeout(() => {
        checkForMatch(newFlippedCards);
      }, 1000);
    }
  };

  const checkForMatch = (flippedCards: number[]) => {
    const [first, second] = flippedCards;
    const firstCard = gameState.cards[first];
    const secondCard = gameState.cards[second];
    
    // Find if these cards are a matching pair
    const isMatch = memoryPairs.some(pair => 
      (firstCard.concept === pair.concept && secondCard.concept === pair.match) ||
      (firstCard.concept === pair.match && secondCard.concept === pair.concept)
    );

    const newCards = [...gameState.cards];
    
    if (isMatch) {
      newCards[first].matched = true;
      newCards[second].matched = true;
      const newScore = gameState.score + 20;
      
      setGameState(prev => ({
        ...prev,
        cards: newCards,
        flippedCards: [],
        score: newScore
      }));

      toast({
        title: "Match Found!",
        description: "+20 points",
      });

      // Check if game is complete
      if (newCards.every(card => card.matched)) {
        const bonusPoints = Math.max(0, 100 - gameState.moves * 2);
        onPointsEarned(newScore + bonusPoints);
        onComplete();
        toast({
          title: "Game Complete!",
          description: `Total Score: ${newScore + bonusPoints} points`,
        });
      }
    } else {
      newCards[first].flipped = false;
      newCards[second].flipped = false;
      setGameState(prev => ({
        ...prev,
        cards: newCards,
        flippedCards: []
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="secondary">Score: {gameState.score}</Badge>
        <Badge variant="outline">Moves: {gameState.moves}</Badge>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {gameState.cards.map((card, index) => (
          <Card 
            key={card.id}
            className={`h-24 cursor-pointer transition-all duration-300 ${
              card.matched ? 'bg-green-100 border-green-300' : 
              card.flipped ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => handleCardClick(index)}
          >
            <CardContent className="p-2 h-full flex items-center justify-center">
              {card.flipped || card.matched ? (
                <div className="text-center">
                  <p className="text-xs font-medium">{card.concept}</p>
                </div>
              ) : (
                <Puzzle className="h-8 w-8 text-gray-400" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Match teaching strategies with their applications</p>
        <p>Find all {memoryPairs.length} pairs to complete the game</p>
      </div>
    </div>
  );
}

export default function TeachingPuzzleGames() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handleGameComplete = (gameId: string) => {
    setIsPlaying(false);
    setSelectedGame(null);
    
    // Update progress
    setGameProgress(prev => {
      const existing = prev.find(p => p.gameId === gameId);
      if (existing) {
        return prev.map(p => p.gameId === gameId ? { ...p, completed: true, attempts: p.attempts + 1 } : p);
      } else {
        return [...prev, { gameId, score: 0, completed: true, timeSpent: 0, attempts: 1 }];
      }
    });
  };

  const handlePointsEarned = async (points: number) => {
    try {
      await apiRequest('/api/rewards/points', {
        method: 'POST',
        body: JSON.stringify({ 
          points, 
          source: 'puzzle_game',
          description: 'Teaching puzzle game completion'
        })
      });
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    setIsPlaying(true);
  };

  const renderGameContent = () => {
    if (!selectedGame || !isPlaying) return null;

    switch (selectedGame) {
      case 'word-scramble':
        return (
          <WordScrambleGame 
            onComplete={() => handleGameComplete(selectedGame)}
            onPointsEarned={handlePointsEarned}
          />
        );
      case 'memory-match':
        return (
          <MemoryMatchGame 
            onComplete={() => handleGameComplete(selectedGame)}
            onPointsEarned={handlePointsEarned}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Game Coming Soon!</h3>
              <p className="text-gray-600">This puzzle game is under development.</p>
            </div>
            <Button onClick={() => setIsPlaying(false)}>
              Back to Games
            </Button>
          </div>
        );
    }
  };

  if (isPlaying && selectedGame) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsPlaying(false)}>
              ← Back to Games
            </Button>
            <h2 className="text-xl font-bold">
              {puzzleGames.find(g => g.id === selectedGame)?.title}
            </h2>
          </div>
        </div>
        {renderGameContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Puzzle className="h-8 w-8 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-800">Teaching Puzzle Games</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Challenge your problem-solving skills with educational puzzles designed to reinforce teaching concepts and strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {puzzleGames.map((game) => {
          const IconComponent = game.icon;
          const progress = gameProgress.find(p => p.gameId === game.id);
          
          return (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${game.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{game.title}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {game.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {game.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4" />
                      <span className="text-sm font-medium">{game.points}pts</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {game.estimatedTime}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{game.description}</p>
                
                {progress?.completed && (
                  <div className="flex items-center gap-2 mb-3 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Completed {progress.attempts} time(s)</span>
                  </div>
                )}

                <Button 
                  onClick={() => startGame(game.id)}
                  className="w-full"
                  disabled={!['word-scramble', 'memory-match'].includes(game.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {progress?.completed ? 'Play Again' : 'Start Game'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-semibold text-purple-800 mb-3">Teaching Puzzle Benefits:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Reinforce learning through play</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Improve problem-solving skills</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Practice recall of key concepts</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Build confidence in subject knowledge</span>
          </div>
        </div>
      </div>
    </div>
  );
}