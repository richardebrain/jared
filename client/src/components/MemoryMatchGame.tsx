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
  isPhrase: boolean;
  pairIndex: number;
  matched: boolean;
  flipped: boolean;
}

interface MemoryMatchGameProps {
  title?: string;
  pairs?: { phrase: string, response: string, category?: string }[];
  moduleName?: string;
  onComplete?: () => void;
}

// Get appropriate memory pairs based on the module topic
const getMemoryPairsByTopic = (moduleName: string = "") => {
  const topicLower = moduleName.toLowerCase();
  
  // Transition Techniques specific pairs
  if (topicLower.includes('transition')) {
    return [
      { phrase: "Visual timers", response: "5-minute countdown for Chapter One", category: "tool" },
      { phrase: "Transition songs", response: "Clean-up time is almost here", category: "auditory" },
      { phrase: "Picture schedules", response: "First centers, then story time", category: "visual" },
      { phrase: "Movement cues", response: "Tiptoe like a mouse to line up", category: "kinesthetic" },
      { phrase: "Sensory signals", response: "Bell rings for attention", category: "auditory" },
      { phrase: "Chapter One phrases", response: "Building your story, one page at a time", category: "language" },
    ];
  }
  
  // Active Listening specific pairs
  else if (topicLower.includes('listen') || topicLower.includes('communication')) {
    return [
      { phrase: "Ask open-ended questions", response: "Tell me more about that", category: "listening" },
      { phrase: "Reflect feelings", response: "You seem frustrated", category: "listening" },
      { phrase: "Summarize what's heard", response: "So what I hear you saying is...", category: "listening" },
      { phrase: "Remove distractions", response: "Let's talk in a quiet area", category: "environment" },
      { phrase: "Use encouraging sounds", response: "Mmm-hmm, I see", category: "technique" },
      { phrase: "Maintain eye contact", response: "Getting down at child's level", category: "technique" },
    ];
  }
  
  // Empathy specific pairs
  else if (topicLower.includes('empathy') || topicLower.includes('perspective')) {
    return [
      { phrase: "Perspective taking", response: "I wonder how they feel", category: "technique" },
      { phrase: "Validate feelings", response: "It's okay to be sad", category: "technique" },
      { phrase: "Show compassion", response: "I care about your feelings", category: "technique" },
      { phrase: "Notice emotions", response: "I see you're feeling upset", category: "observation" },
      { phrase: "Share similar experiences", response: "That happened to me too", category: "connection" },
      { phrase: "Offer comfort", response: "Would you like a hug?", category: "support" },
    ];
  }
  
  // Positive attitude specific pairs
  else if (topicLower.includes('positive') || topicLower.includes('attitude')) {
    return [
      { phrase: "Use positive language", response: "Walking feet please", category: "language" },
      { phrase: "Reframe challenges", response: "Let's try a different way", category: "mindset" },
      { phrase: "Celebrate attempts", response: "You worked so hard on that!", category: "encouragement" },
      { phrase: "Model gratitude", response: "Thank you for helping", category: "gratitude" },
      { phrase: "Show enthusiasm", response: "I'm excited to learn with you", category: "energy" },
      { phrase: "Acknowledge feelings", response: "It's okay to feel frustrated", category: "emotion" },
    ];
  }
  
  // Default to general ECE concept pairs
  return [
    { phrase: "Use positive language", response: "Walking feet please", category: "guidance" },
    { phrase: "Support independence", response: "You can try it yourself", category: "autonomy" },
    { phrase: "Promote cooperation", response: "Let's work together", category: "social" },
    { phrase: "Encourage questions", response: "What do you wonder about?", category: "inquiry" },
    { phrase: "Validate emotions", response: "It's okay to feel sad", category: "emotional" },
    { phrase: "Model problem-solving", response: "Let's think of solutions", category: "cognitive" },
  ];
};

export function MemoryMatchGame({ 
  title = "Match & Learn", 
  pairs, 
  moduleName = "",
  onComplete 
}: MemoryMatchGameProps) {
  // Get topic-specific pairs or use provided pairs
  const actualPairs = pairs || getMemoryPairsByTopic(moduleName);
  
  // Limit to 6 pairs for playability
  const gamePairs = actualPairs.slice(0, 6);
  
  // Initialize cards by creating pairs
  const createCards = (): MemoryCard[] => {
    const cards: MemoryCard[] = [];
    
    gamePairs.forEach((pair, index) => {
      // Create phrase card
      cards.push({
        id: index * 2,
        content: pair.phrase,
        isPhrase: true,
        pairIndex: index,
        matched: false,
        flipped: false
      });
      
      // Create response card
      cards.push({
        id: index * 2 + 1,
        content: pair.response,
        isPhrase: false,
        pairIndex: index,
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
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];
      
      // Check if the two cards form a matched pair (same pairIndex but different types)
      const isMatch = firstCard.pairIndex === secondCard.pairIndex && 
                      firstCard.isPhrase !== secondCard.isPhrase;
      
      if (isMatch) {
        // Mark both cards as matched
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIndex].matched = true;
          matchedCards[secondIndex].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Check if game is complete (all pairs matched)
          if (matchedPairs + 1 >= gamePairs.length) {
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
                "aspect-square rounded-md flex items-center justify-center p-1 transition-all duration-500 cursor-pointer shadow-sm text-center",
                card.flipped || card.matched ? (
                  card.isPhrase ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                ) : "bg-gray-200",
                card.matched ? "ring-2 ring-green-500" : card.flipped ? "ring-2 ring-blue-500" : "",
                gameComplete ? "pointer-events-none" : "",
                "text-sm md:text-md lg:text-lg"
              )}
              onClick={() => handleCardClick(index)}
              // Remove the rotation transform to make text readable
            >
              {(card.flipped || card.matched) ? (
                <div className={cn(
                  "w-full h-full flex items-center justify-center overflow-hidden",
                  card.isPhrase ? "font-medium" : ""
                )}>
                  {card.content}
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-500">?</div>
              )}
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
            <h4 className="font-medium mb-2">Learning Concepts You Matched:</h4>
            <div className="flex flex-col gap-2 text-sm">
              {gamePairs.map((pair, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md flex flex-col border">
                  <div className="flex gap-2 mb-1.5">
                    <div className="flex-1 p-2 bg-blue-100 rounded border border-blue-200 font-medium text-blue-800">
                      {pair.phrase}
                    </div>
                    <div className="flex items-center justify-center px-2">→</div>
                    <div className="flex-1 p-2 bg-emerald-100 rounded border border-emerald-200 text-emerald-800">
                      {pair.response}
                    </div>
                  </div>
                  {pair.category && (
                    <div className="text-xs text-muted-foreground italic">
                      Category: {pair.category.charAt(0).toUpperCase() + pair.category.slice(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}