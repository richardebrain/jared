import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Timer, Trophy, RotateCcw, CheckCircle, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface MemoryCard {
  id: number;
  content: string;
  category: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
  emoji: string;
}

interface MemoryGameState {
  cards: MemoryCard[];
  flippedCards: number[];
  matchedPairs: number;
  score: number;
  moves: number;
  timeLeft: number;
  gameComplete: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  streak: number;
}

const DEVELOPMENTAL_PAIRS = {
  easy: [
    { content: 'Sits without support', match: '6-8 months', category: 'Physical', emoji: '👶' },
    { content: 'First words', match: '12 months', category: 'Language', emoji: '🗣️' },
    { content: 'Walks independently', match: '12-15 months', category: 'Physical', emoji: '🚶' },
    { content: 'Parallel play', match: '2-3 years', category: 'Social', emoji: '👫' },
    { content: 'Potty training', match: '2-4 years', category: 'Self-care', emoji: '🚽' },
    { content: 'Shares toys', match: '3-4 years', category: 'Social', emoji: '🧸' }
  ],
  medium: [
    { content: 'Object permanence', match: '8-12 months', category: 'Cognitive', emoji: '🔍' },
    { content: 'Separation anxiety', match: '8-18 months', category: 'Emotional', emoji: '😢' },
    { content: 'Pretend play begins', match: '18-24 months', category: 'Cognitive', emoji: '🎭' },
    { content: 'Two-word phrases', match: '18-24 months', category: 'Language', emoji: '💬' },
    { content: 'Cooperative play', match: '4-5 years', category: 'Social', emoji: '🤝' },
    { content: 'Theory of mind', match: '4-5 years', category: 'Cognitive', emoji: '🧠' },
    { content: 'Emotional regulation', match: '3-5 years', category: 'Emotional', emoji: '😌' },
    { content: 'Complex sentences', match: '4-5 years', category: 'Language', emoji: '📝' }
  ],
  hard: [
    { content: 'Symbolic thinking', match: '2-3 years', category: 'Cognitive', emoji: '🔤' },
    { content: 'Self-concept emerges', match: '18-24 months', category: 'Identity', emoji: '🪞' },
    { content: 'Moral reasoning', match: '5-6 years', category: 'Moral', emoji: '⚖️' },
    { content: 'Metacognition begins', match: '4-6 years', category: 'Cognitive', emoji: '🤔' },
    { content: 'Peer relationships', match: '3-5 years', category: 'Social', emoji: '👭' },
    { content: 'Executive function', match: '3-7 years', category: 'Cognitive', emoji: '🎯' },
    { content: 'Empathy development', match: '2-4 years', category: 'Emotional', emoji: '❤️' },
    { content: 'Abstract concepts', match: '5-7 years', category: 'Cognitive', emoji: '💭' },
    { content: 'Rule understanding', match: '4-6 years', category: 'Social', emoji: '📋' },
    { content: 'Identity formation', match: '3-6 years', category: 'Identity', emoji: '🌟' }
  ]
};

const GAME_TIMES = {
  easy: 180,   // 3 minutes
  medium: 240, // 4 minutes
  hard: 300    // 5 minutes
};

export default function EnhancedMemoryMatch({ onComplete, onPointsEarned }: { 
  onComplete: () => void; 
  onPointsEarned: (points: number) => void; 
}) {
  const [gameState, setGameState] = useState<MemoryGameState>({
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    score: 0,
    moves: 0,
    timeLeft: GAME_TIMES.easy,
    gameComplete: false,
    difficulty: 'easy',
    streak: 0
  });
  const { toast } = useToast();

  const generateCards = (difficulty: 'easy' | 'medium' | 'hard') => {
    const pairs = DEVELOPMENTAL_PAIRS[difficulty];
    const cards: MemoryCard[] = [];
    
    pairs.forEach((pair, index) => {
      // Add the concept card
      cards.push({
        id: index * 2,
        content: pair.content,
        category: pair.category,
        pairId: index,
        isFlipped: false,
        isMatched: false,
        emoji: pair.emoji
      });
      
      // Add the milestone card
      cards.push({
        id: index * 2 + 1,
        content: pair.match,
        category: pair.category,
        pairId: index,
        isFlipped: false,
        isMatched: false,
        emoji: '📅'
      });
    });

    // Shuffle cards
    return cards.sort(() => Math.random() - 0.5);
  };

  const initializeGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    const cards = generateCards(difficulty);
    setGameState({
      cards,
      flippedCards: [],
      matchedPairs: 0,
      score: 0,
      moves: 0,
      timeLeft: GAME_TIMES[difficulty],
      gameComplete: false,
      difficulty,
      streak: 0
    });
  };

  useEffect(() => {
    initializeGame('easy');
  }, []);

  useEffect(() => {
    if (gameState.timeLeft > 0 && !gameState.gameComplete) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0) {
      endGame();
    }
  }, [gameState.timeLeft, gameState.gameComplete]);

  const endGame = () => {
    setGameState(prev => ({ ...prev, gameComplete: true }));
    onPointsEarned(gameState.score);
    onComplete();
    toast({
      title: "Time's Up!",
      description: `Final Score: ${gameState.score} points`,
    });
  };

  const handleCardClick = (cardId: number) => {
    if (
      gameState.flippedCards.length === 2 || 
      gameState.cards[cardId].isFlipped || 
      gameState.cards[cardId].isMatched ||
      gameState.gameComplete
    ) {
      return;
    }

    const newCards = [...gameState.cards];
    newCards[cardId].isFlipped = true;
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
    const [firstCardId, secondCardId] = flippedCards;
    const firstCard = gameState.cards[firstCardId];
    const secondCard = gameState.cards[secondCardId];
    
    const isMatch = firstCard.pairId === secondCard.pairId;
    const newCards = [...gameState.cards];

    if (isMatch) {
      newCards[firstCardId].isMatched = true;
      newCards[secondCardId].isMatched = true;
      
      const basePoints = gameState.difficulty === 'easy' ? 20 : 
                        gameState.difficulty === 'medium' ? 30 : 40;
      const streakBonus = gameState.streak * 5;
      const timeBonus = gameState.timeLeft > 60 ? 10 : 0;
      const totalPoints = basePoints + streakBonus + timeBonus;
      
      const newStreak = gameState.streak + 1;
      const newMatchedPairs = gameState.matchedPairs + 1;

      setGameState(prev => ({
        ...prev,
        cards: newCards,
        flippedCards: [],
        matchedPairs: newMatchedPairs,
        score: prev.score + totalPoints,
        streak: newStreak
      }));

      toast({
        title: "Perfect Match!",
        description: `+${totalPoints} points ${newStreak > 1 ? `(${newStreak}x streak!)` : ''}`,
      });

      // Check if game is complete
      const totalPairs = DEVELOPMENTAL_PAIRS[gameState.difficulty].length;
      if (newMatchedPairs === totalPairs) {
        const bonusPoints = Math.floor(gameState.timeLeft * 2) + (newStreak * 10);
        setGameState(prev => ({
          ...prev,
          score: prev.score + bonusPoints,
          gameComplete: true
        }));
        onPointsEarned(gameState.score + totalPoints + bonusPoints);
        onComplete();
        toast({
          title: "Congratulations!",
          description: `All pairs found! Bonus: +${bonusPoints} points`,
        });
      }
    } else {
      newCards[firstCardId].isFlipped = false;
      newCards[secondCardId].isFlipped = false;
      setGameState(prev => ({
        ...prev,
        cards: newCards,
        flippedCards: [],
        streak: 0 // Reset streak on miss
      }));
    }
  };

  const getGridColumns = () => {
    switch (gameState.difficulty) {
      case 'easy': return 'grid-cols-4';
      case 'medium': return 'grid-cols-4';
      case 'hard': return 'grid-cols-5';
      default: return 'grid-cols-4';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Physical': 'bg-blue-100 text-blue-800',
      'Language': 'bg-green-100 text-green-800',
      'Social': 'bg-purple-100 text-purple-800',
      'Cognitive': 'bg-orange-100 text-orange-800',
      'Emotional': 'bg-pink-100 text-pink-800',
      'Self-care': 'bg-yellow-100 text-yellow-800',
      'Identity': 'bg-indigo-100 text-indigo-800',
      'Moral': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">Score: {gameState.score}</Badge>
          <Badge variant="outline">Matches: {gameState.matchedPairs}/{DEVELOPMENTAL_PAIRS[gameState.difficulty].length}</Badge>
          <Badge variant="outline">Moves: {gameState.moves}</Badge>
          {gameState.streak > 1 && (
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              {gameState.streak}x Streak!
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className={gameState.timeLeft < 60 ? 'text-red-500 font-bold' : ''}>
            {formatTime(gameState.timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant={gameState.difficulty === 'easy' ? 'default' : 'outline'}
          size="sm"
          onClick={() => initializeGame('easy')}
          disabled={!gameState.gameComplete && gameState.moves > 0}
        >
          Easy (6 pairs)
        </Button>
        <Button
          variant={gameState.difficulty === 'medium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => initializeGame('medium')}
          disabled={!gameState.gameComplete && gameState.moves > 0}
        >
          Medium (8 pairs)
        </Button>
        <Button
          variant={gameState.difficulty === 'hard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => initializeGame('hard')}
          disabled={!gameState.gameComplete && gameState.moves > 0}
        >
          Hard (10 pairs)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Developmental Milestone Memory Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${getGridColumns()} gap-3 max-w-4xl mx-auto`}>
            {gameState.cards.map((card, index) => (
              <Card
                key={card.id}
                className={`h-32 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  card.isMatched 
                    ? 'bg-green-100 border-green-300 shadow-lg' 
                    : card.isFlipped 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                }`}
                onClick={() => handleCardClick(index)}
              >
                <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                  {card.isFlipped || card.isMatched ? (
                    <div className="text-center">
                      <div className="text-2xl mb-2">{card.emoji}</div>
                      <p className="text-xs font-medium mb-2">{card.content}</p>
                      <Badge className={`text-xs ${getCategoryColor(card.category)}`}>
                        {card.category}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Brain className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">?</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {gameState.gameComplete && (
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Memory Master!</h3>
          <p className="text-gray-600 mb-4">
            You matched {gameState.matchedPairs} pairs in {gameState.moves} moves
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Final Score</p>
              <p className="text-xl font-bold text-green-600">{gameState.score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Best Streak</p>
              <p className="text-xl font-bold text-purple-600">{gameState.streak}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button onClick={() => initializeGame(gameState.difficulty)} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">About Developmental Milestones:</h4>
        <p className="text-sm text-blue-700">
          This memory game helps you learn when children typically reach important developmental milestones. 
          Understanding these timelines is crucial for early childhood educators to provide appropriate 
          activities and identify when children might need additional support.
        </p>
      </div>
    </div>
  );
}