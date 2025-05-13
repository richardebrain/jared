import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfettiExplosion from 'react-confetti-explosion';

// Define the card types for memory match
interface MemoryCard {
  id: number;
  content: string;
  matched: boolean;
  flipped: boolean;
}

interface MemoryMatchGameProps {
  title?: string;
  pairs?: { content: string, description: string }[];
  onComplete?: () => void;
}

// Default memory pairs for ECE concepts
const DEFAULT_MEMORY_PAIRS = [
  { content: "👶", description: "Infant Development" },
  { content: "🧒", description: "Toddler Care" },
  { content: "📚", description: "Literacy" },
  { content: "🧮", description: "Early Math" },
  { content: "🎨", description: "Creative Arts" },
  { content: "🌿", description: "Nature Exploration" },
];

export function MemoryMatchGame({ 
  title = "Match & Learn", 
  pairs = DEFAULT_MEMORY_PAIRS, 
  onComplete 
}: MemoryMatchGameProps) {
  // Limit to 6 pairs for playability
  const actualPairs = pairs.slice(0, 6);
  
  // Initialize cards by creating pairs
  const createCards = (): MemoryCard[] => {
    const cards: MemoryCard[] = [];
    actualPairs.forEach((pair, index) => {
      // Create two identical cards for each pair
      cards.push({
        id: index * 2,
        content: pair.content,
        matched: false,
        flipped: false
      });
      cards.push({
        id: index * 2 + 1,
        content: pair.content,
        matched: false,
        flipped: false
      });
    });
    
    // Shuffle the cards
    return cards.sort(() => Math.random() - 0.5);
  };
  
  const [cards, setCards] = useState<MemoryCard[]>(createCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  
  // Handle card click
  const handleCardClick = (index: number) => {
    // Prevent clicking if:
    // - Already two cards flipped and being checked
    // - The clicked card is already flipped or matched
    if (
      flippedIndices.length >= 2 || 
      cards[index].flipped || 
      cards[index].matched ||
      gameComplete
    ) {
      return;
    }
    
    // Create a new copy of cards with the clicked card flipped
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    // Add this card to flippedIndices
    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);
    
    // If this is the second card flipped, check for match
    if (newFlippedIndices.length === 2) {
      setMoves(moves + 1);
      
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      // Check if the two flipped cards match
      if (cards[firstIndex].content === cards[secondIndex].content) {
        // Mark both cards as matched
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIndex].matched = true;
          matchedCards[secondIndex].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Check if game is complete (all pairs matched)
          if (matchedPairs + 1 >= actualPairs.length) {
            setGameComplete(true);
            setShowConfetti(true);
            if (onComplete) {
              onComplete();
            }
          }
        }, 600);
      } else {
        // If no match, flip them back after a delay
        setTimeout(() => {
          const unflippedCards = [...cards];
          unflippedCards[firstIndex].flipped = false;
          unflippedCards[secondIndex].flipped = false;
          setCards(unflippedCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setCards(createCards());
    setFlippedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
    setShowConfetti(false);
  };
  
  // Calculate score (fewer moves = better score)
  const calculateScore = () => {
    // Perfect score would be exactly the number of pairs
    const perfectMoves = actualPairs.length;
    // Score decreases as moves increase beyond perfect
    const score = Math.max(100 - Math.floor((moves - perfectMoves) * 10), 50);
    return score;
  };

  return (
    <Card className="relative border-t-4 border-t-primary shadow-md">
      {showConfetti && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ConfettiExplosion particleCount={200} force={0.8} duration={2500} />
        </div>
      )}
      
      <CardHeader className="bg-muted/50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center">
            <Gamepad2 className="h-5 w-5 mr-2 text-indigo-500" />
            {title}
          </CardTitle>
          <div className="text-sm font-medium">
            Moves: {moves} | Matched: {matchedPairs}/{actualPairs.length}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Game grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-2xl md:text-3xl transition-all duration-300 cursor-pointer shadow-sm",
                card.flipped || card.matched ? "bg-white" : "bg-gray-200",
                card.matched ? "ring-2 ring-green-500" : card.flipped ? "ring-2 ring-blue-500" : "",
                gameComplete ? "pointer-events-none" : ""
              )}
              onClick={() => handleCardClick(index)}
              style={{ 
                transform: `rotateY(${card.flipped || card.matched ? '180deg' : '0deg'})` 
              }}
            >
              {(card.flipped || card.matched) ? card.content : "?"}
            </div>
          ))}
        </div>
        
        {/* Game Results */}
        {gameComplete && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center mb-4">
            <div className="flex justify-center mb-2">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="font-bold text-lg mb-1">Game Complete!</h3>
            <p className="text-sm text-gray-700 mb-2">
              You matched all pairs in {moves} moves
            </p>
            <p className="font-medium">
              Score: {calculateScore()}/100
            </p>
          </div>
        )}
        
        {/* Game Controls */}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> New Game
          </Button>
        </div>
        
        {/* Concept Descriptions */}
        {gameComplete && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Concepts You Matched:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {actualPairs.map((pair, index) => (
                <div key={index} className="p-2 bg-muted rounded-md flex items-center">
                  <span className="text-lg mr-2">{pair.content}</span>
                  <span>{pair.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}