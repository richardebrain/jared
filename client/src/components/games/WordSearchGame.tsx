import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Timer, Trophy, RotateCcw, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface WordSearchState {
  grid: string[][];
  words: string[];
  foundWords: string[];
  selectedCells: number[][];
  isSelecting: boolean;
  score: number;
  timeLeft: number;
  gameComplete: boolean;
}

const ECE_WORDS = [
  'SAFETY', 'HEALTH', 'LEARNING', 'ROUTINES', 'PLAY',
  'CHILD', 'DEVELOP', 'SCAFFOLD', 'ASSESS', 'GUIDE',
  'OBSERVE', 'NURTURE', 'SUPPORT', 'ENGAGE', 'CREATE'
];

const GRID_SIZE = 15;
const GAME_TIME = 300; // 5 minutes

export default function WordSearchGame({ onComplete, onPointsEarned }: { 
  onComplete: () => void; 
  onPointsEarned: (points: number) => void; 
}) {
  const [gameState, setGameState] = useState<WordSearchState>({
    grid: [],
    words: [],
    foundWords: [],
    selectedCells: [],
    isSelecting: false,
    score: 0,
    timeLeft: GAME_TIME,
    gameComplete: false
  });
  const { toast } = useToast();

  const generateRandomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const canPlaceWord = (grid: string[][], word: string, row: number, col: number, direction: [number, number]) => {
    const [dr, dc] = direction;
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dr;
      const newCol = col + i * dc;
      if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
        return false;
      }
      if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
        return false;
      }
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, row: number, col: number, direction: [number, number]) => {
    const [dr, dc] = direction;
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dr;
      const newCol = col + i * dc;
      grid[newRow][newCol] = word[i];
    }
  };

  const generateWordSearch = () => {
    // Initialize empty grid
    const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    
    // Directions: horizontal, vertical, diagonal
    const directions: [number, number][] = [
      [0, 1],   // horizontal right
      [1, 0],   // vertical down
      [1, 1],   // diagonal down-right
      [-1, 1],  // diagonal up-right
      [0, -1],  // horizontal left
      [-1, 0],  // vertical up
      [-1, -1], // diagonal up-left
      [1, -1]   // diagonal down-left
    ];

    // Select random words to place
    const selectedWords = ECE_WORDS.slice(0, 8).sort(() => Math.random() - 0.5);
    const placedWords: string[] = [];

    // Try to place each word
    for (const word of selectedWords) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        if (canPlaceWord(grid, word, row, col, direction)) {
          placeWord(grid, word, row, col, direction);
          placedWords.push(word);
          placed = true;
        }
        attempts++;
      }
    }

    // Fill empty cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === '') {
          grid[row][col] = generateRandomLetter();
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      grid,
      words: placedWords,
      foundWords: [],
      selectedCells: [],
      score: 0,
      timeLeft: GAME_TIME,
      gameComplete: false
    }));
  };

  useEffect(() => {
    generateWordSearch();
  }, []);

  useEffect(() => {
    if (gameState.timeLeft > 0 && !gameState.gameComplete) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (gameState.timeLeft === 0) {
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

  const handleCellMouseDown = (row: number, col: number) => {
    setGameState(prev => ({
      ...prev,
      isSelecting: true,
      selectedCells: [[row, col]]
    }));
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (gameState.isSelecting) {
      setGameState(prev => ({
        ...prev,
        selectedCells: [...prev.selectedCells, [row, col]]
      }));
    }
  };

  const handleCellMouseUp = () => {
    if (gameState.selectedCells.length > 1) {
      checkSelectedWord();
    }
    setGameState(prev => ({
      ...prev,
      isSelecting: false,
      selectedCells: []
    }));
  };

  const checkSelectedWord = () => {
    const selectedWord = gameState.selectedCells
      .map(([row, col]) => gameState.grid[row][col])
      .join('');
    
    const reversedWord = selectedWord.split('').reverse().join('');
    
    const foundWord = gameState.words.find(word => 
      (word === selectedWord || word === reversedWord) && 
      !gameState.foundWords.includes(word)
    );

    if (foundWord) {
      const points = Math.min(Math.max(foundWord.length - 3, 2), 8); // 2-8 points based on word length
      setGameState(prev => ({
        ...prev,
        foundWords: [...prev.foundWords, foundWord],
        score: prev.score + points
      }));

      toast({
        title: "Word Found!",
        description: `${foundWord} - +${points} points`,
      });

      // Check if all words found
      if (gameState.foundWords.length + 1 === gameState.words.length) {
        const bonusPoints = 2; // Fixed bonus
        setGameState(prev => ({
          ...prev,
          score: prev.score + bonusPoints,
          gameComplete: true
        }));
        onPointsEarned(gameState.score + points + bonusPoints);
        onComplete();
        toast({
          title: "Congratulations!",
          description: `All words found! Bonus: +${bonusPoints} points`,
        });
      }
    }
  };

  const isCellSelected = (row: number, col: number) => {
    return gameState.selectedCells.some(([r, c]) => r === row && c === col);
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
          <Badge variant="outline">Found: {gameState.foundWords.length}/{gameState.words.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className={gameState.timeLeft < 60 ? 'text-red-500 font-bold' : ''}>
            {formatTime(gameState.timeLeft)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Word Search Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find the Hidden Words
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1 max-w-fit mx-auto" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                {gameState.grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-bold border cursor-pointer select-none ${
                        isCellSelected(rowIndex, colIndex)
                          ? 'bg-blue-200 border-blue-400 text-blue-800'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                      onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      onMouseUp={handleCellMouseUp}
                    >
                      {cell}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Word List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Words to Find</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gameState.words.map((word) => (
                  <div
                    key={word}
                    className={`p-2 rounded text-sm font-medium ${
                      gameState.foundWords.includes(word)
                        ? 'bg-green-100 text-green-800 line-through'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {word}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {gameState.gameComplete && (
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Game Complete!</h3>
          <p className="text-gray-600 mb-4">
            You found {gameState.foundWords.length} out of {gameState.words.length} words
          </p>
          <p className="text-xl font-bold text-green-600">Final Score: {gameState.score} points</p>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button onClick={generateWordSearch} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
      </div>
    </div>
  );
}