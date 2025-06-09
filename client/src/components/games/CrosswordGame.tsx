import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Grid3X3, Timer, Trophy, RotateCcw, CheckCircle, Lightbulb } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface CrosswordClue {
  id: number;
  number: string;
  clue: string;
  answer: string;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
}

interface CrosswordState {
  grid: (string | null)[][];
  clues: CrosswordClue[];
  userAnswers: { [key: string]: string };
  selectedClue: number | null;
  completedClues: number[];
  score: number;
  timeLeft: number;
  gameComplete: boolean;
  showHints: boolean;
}

const CROSSWORD_CLUES: Omit<CrosswordClue, 'id'>[] = [
  {
    number: '1',
    clue: 'Educational approach emphasizing child-led activities',
    answer: 'MONTESSORI',
    direction: 'across',
    startRow: 1,
    startCol: 1,
    length: 10
  },
  {
    number: '2',
    clue: 'Support structure for learning new skills',
    answer: 'SCAFFOLDING',
    direction: 'down',
    startRow: 1,
    startCol: 3,
    length: 11
  },
  {
    number: '3',
    clue: 'Type of play that involves imagination and role-playing',
    answer: 'DRAMATIC',
    direction: 'across',
    startRow: 3,
    startCol: 5,
    length: 8
  },
  {
    number: '4',
    clue: 'Method of teaching reading through letter sounds',
    answer: 'PHONICS',
    direction: 'down',
    startRow: 2,
    startCol: 8,
    length: 7
  },
  {
    number: '5',
    clue: 'Italian educational philosophy emphasizing community',
    answer: 'REGGIO',
    direction: 'across',
    startRow: 5,
    startCol: 2,
    length: 6
  },
  {
    number: '6',
    clue: 'Daily activities that provide structure and predictability',
    answer: 'ROUTINES',
    direction: 'down',
    startRow: 4,
    startCol: 5,
    length: 8
  },
  {
    number: '7',
    clue: 'Process of evaluating child development and learning',
    answer: 'ASSESSMENT',
    direction: 'across',
    startRow: 7,
    startCol: 1,
    length: 10
  },
  {
    number: '8',
    clue: 'Learning through hands-on exploration and discovery',
    answer: 'SENSORY',
    direction: 'down',
    startRow: 6,
    startCol: 9,
    length: 7
  }
];

const GRID_SIZE = 12;
const GAME_TIME = 600; // 10 minutes

export default function CrosswordGame({ onComplete, onPointsEarned }: { 
  onComplete: () => void; 
  onPointsEarned: (points: number) => void; 
}) {
  const [gameState, setGameState] = useState<CrosswordState>({
    grid: [],
    clues: [],
    userAnswers: {},
    selectedClue: null,
    completedClues: [],
    score: 0,
    timeLeft: GAME_TIME,
    gameComplete: false,
    showHints: false
  });
  const { toast } = useToast();

  const initializeGrid = () => {
    // Create empty grid
    const grid: (string | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    
    // Add clues with IDs
    const cluesWithIds: CrosswordClue[] = CROSSWORD_CLUES.map((clue, index) => ({
      ...clue,
      id: index + 1
    }));

    // Place answer letters in grid
    cluesWithIds.forEach(clue => {
      for (let i = 0; i < clue.length; i++) {
        const row = clue.direction === 'across' ? clue.startRow : clue.startRow + i;
        const col = clue.direction === 'across' ? clue.startCol + i : clue.startCol;
        if (row < GRID_SIZE && col < GRID_SIZE) {
          grid[row][col] = clue.answer[i];
        }
      }
    });

    setGameState(prev => ({
      ...prev,
      grid,
      clues: cluesWithIds,
      userAnswers: {},
      selectedClue: null,
      completedClues: [],
      score: 0,
      timeLeft: GAME_TIME,
      gameComplete: false
    }));
  };

  useEffect(() => {
    initializeGrid();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (gameState.timeLeft > 0 && !gameState.gameComplete) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      cleanup = () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0) {
      endGame();
    }
    
    return cleanup;
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

  const handleAnswerChange = (clueId: number, value: string) => {
    const clue = gameState.clues.find(c => c.id === clueId);
    if (!clue) return;

    const upperValue = value.toUpperCase().slice(0, clue.length);
    setGameState(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [clueId]: upperValue }
    }));

    // Check if answer is correct
    if (upperValue === clue.answer) {
      if (!gameState.completedClues.includes(clueId)) {
        const points = clue.length * 15;
        setGameState(prev => ({
          ...prev,
          completedClues: [...prev.completedClues, clueId],
          score: prev.score + points
        }));

        toast({
          title: "Correct!",
          description: `${clue.answer} - +${points} points`,
        });

        // Check if all clues completed
        if (gameState.completedClues.length + 1 === gameState.clues.length) {
          const bonusPoints = gameState.timeLeft * 3;
          setGameState(prev => ({
            ...prev,
            score: prev.score + bonusPoints,
            gameComplete: true
          }));
          onPointsEarned(gameState.score + points + bonusPoints);
          onComplete();
          toast({
            title: "Congratulations!",
            description: `Crossword complete! Bonus: +${bonusPoints} points`,
          });
        }
      }
    }
  };

  const getCellContent = (row: number, col: number) => {
    if (!gameState.clues || gameState.clues.length === 0) return '';
    
    const clue = gameState.clues.find(c => {
      if (c.direction === 'across') {
        return row === c.startRow && col >= c.startCol && col < c.startCol + c.length;
      } else {
        return col === c.startCol && row >= c.startRow && row < c.startRow + c.length;
      }
    });

    if (!clue) return '';

    const userAnswer = gameState.userAnswers[clue.id] || '';
    const letterIndex = clue.direction === 'across' 
      ? col - clue.startCol 
      : row - clue.startRow;
    
    return userAnswer[letterIndex] || '';
  };

  const getCellNumber = (row: number, col: number) => {
    if (!gameState.clues || gameState.clues.length === 0) return null;
    const clue = gameState.clues.find(c => c.startRow === row && c.startCol === col);
    return clue ? clue.number : null;
  };

  const isActiveCellForClue = (row: number, col: number, clueId: number) => {
    if (!gameState.clues || gameState.clues.length === 0) return false;
    const clue = gameState.clues.find(c => c.id === clueId);
    if (!clue) return false;

    if (clue.direction === 'across') {
      return row === clue.startRow && col >= clue.startCol && col < clue.startCol + clue.length;
    } else {
      return col === clue.startCol && row >= clue.startRow && row < clue.startRow + clue.length;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">Score: {gameState.score}</Badge>
          <Badge variant="outline">Completed: {gameState.completedClues.length}/{gameState.clues.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className={gameState.timeLeft < 120 ? 'text-red-500 font-bold' : ''}>
            {formatTime(gameState.timeLeft)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crossword Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Teaching Crossword Puzzle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameState.grid.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading crossword...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-1 max-w-fit mx-auto">
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
                  const row = Math.floor(index / GRID_SIZE);
                  const col = index % GRID_SIZE;
                  const isAnswerCell = gameState.grid[row] && gameState.grid[row][col] !== null;
                  const cellNumber = getCellNumber(row, col);
                  const cellContent = getCellContent(row, col);
                  const isHighlighted = gameState.selectedClue && isActiveCellForClue(row, col, gameState.selectedClue);

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`w-8 h-8 border relative ${
                        isAnswerCell
                          ? `bg-white border-gray-400 ${isHighlighted ? 'bg-blue-100' : ''}`
                          : 'bg-gray-800 border-gray-800'
                      }`}
                    >
                      {cellNumber && (
                        <span className="absolute top-0 left-0 text-xs font-bold text-blue-600 leading-none">
                          {cellNumber}
                        </span>
                      )}
                      {isAnswerCell && (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                          {cellContent}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clues */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Clues</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGameState(prev => ({ ...prev, showHints: !prev.showHints }))}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Hints
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Across</h4>
                <div className="space-y-3">
                  {gameState.clues
                    .filter(clue => clue.direction === 'across')
                    .map(clue => (
                      <div key={clue.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-sm">{clue.number}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{clue.clue}</p>
                            {gameState.showHints && (
                              <p className="text-xs text-gray-500 mt-1">
                                ({clue.length} letters)
                              </p>
                            )}
                          </div>
                          {gameState.completedClues.includes(clue.id) && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <Input
                          value={gameState.userAnswers[clue.id] || ''}
                          onChange={(e) => handleAnswerChange(clue.id, e.target.value)}
                          onFocus={() => setGameState(prev => ({ ...prev, selectedClue: clue.id }))}
                          onBlur={() => setGameState(prev => ({ ...prev, selectedClue: null }))}
                          className="text-sm"
                          maxLength={clue.length}
                          placeholder={`${clue.length} letters`}
                        />
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Down</h4>
                <div className="space-y-3">
                  {gameState.clues
                    .filter(clue => clue.direction === 'down')
                    .map(clue => (
                      <div key={clue.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-sm">{clue.number}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{clue.clue}</p>
                            {gameState.showHints && (
                              <p className="text-xs text-gray-500 mt-1">
                                ({clue.length} letters)
                              </p>
                            )}
                          </div>
                          {gameState.completedClues.includes(clue.id) && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <Input
                          value={gameState.userAnswers[clue.id] || ''}
                          onChange={(e) => handleAnswerChange(clue.id, e.target.value)}
                          onFocus={() => setGameState(prev => ({ ...prev, selectedClue: clue.id }))}
                          onBlur={() => setGameState(prev => ({ ...prev, selectedClue: null }))}
                          className="text-sm"
                          maxLength={clue.length}
                          placeholder={`${clue.length} letters`}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {gameState.gameComplete && (
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Crossword Complete!</h3>
          <p className="text-gray-600 mb-4">
            You completed {gameState.completedClues.length} out of {gameState.clues.length} clues
          </p>
          <p className="text-xl font-bold text-green-600">Final Score: {gameState.score} points</p>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button onClick={initializeGrid} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
      </div>
    </div>
  );
}