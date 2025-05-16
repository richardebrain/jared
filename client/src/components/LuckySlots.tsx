import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Cherry, 
  Star, 
  Gem, 
  Award, 
  Diamond, 
  Sparkles 
} from "lucide-react";

interface LuckySlotsProps {
  onClose: () => void;
  onWin?: (points: number) => void;
  dailySpinsRemaining?: number;
}

export default function LuckySlots({ 
  onClose, 
  onWin, 
  dailySpinsRemaining = 3 
}: LuckySlotsProps) {
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [symbols, setSymbols] = useState<string[]>(["cherry", "star", "gift"]);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const symbolIcons = {
    cherry: <Cherry className="h-8 w-8 text-red-500" />,
    star: <Star className="h-8 w-8 text-yellow-500" />,
    gift: <Gift className="h-8 w-8 text-blue-500" />,
    gem: <Gem className="h-8 w-8 text-purple-500" />,
    award: <Award className="h-8 w-8 text-amber-500" />,
    diamond: <Diamond className="h-8 w-8 text-cyan-500" />,
    sparkles: <Sparkles className="h-8 w-8 text-pink-500" />,
  };

  const availableSymbols = ["cherry", "star", "gift", "gem", "award", "diamond", "sparkles"];

  const handleSpin = () => {
    if (dailySpinsRemaining <= 0) {
      toast({
        title: "No Spins Left",
        description: "Complete more activities to earn daily spins!",
        variant: "destructive"
      });
      return;
    }

    // Start spinning animation
    setIsSpinning(true);
    setWinAmount(null);
    
    // Generate random symbols after a short delay
    setTimeout(() => {
      const newSymbols = Array(3).fill(0).map(() => 
        availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
      );
      
      setSymbols(newSymbols);
      setIsSpinning(false);
      
      // Calculate winnings
      const uniqueSymbols = new Set(newSymbols);
      let points = 0;
      
      if (uniqueSymbols.size === 1) {
        // All three symbols match (jackpot)
        const symbol = newSymbols[0];
        if (symbol === "diamond") {
          points = 20; // Jackpot
        } else if (symbol === "sparkles") {
          points = 10; // High value
        } else if (symbol === "award") {
          points = 7; // Medium-high value
        } else if (symbol === "gem") {
          points = 5; // Medium value
        } else {
          points = 3; // Basic match
        }
      } else if (uniqueSymbols.size === 2) {
        // Two symbols match
        points = 1;
      }
      
      if (points > 0) {
        setWinAmount(points);
        if (onWin) onWin(points);
        
        toast({
          title: "You Won!",
          description: `Congratulations! You earned ${points} points!`,
          variant: "default"
        });
      } else {
        toast({
          title: "Try Again",
          description: "Better luck next time!",
          variant: "default"
        });
      }
    }, 1000);
  };

  return (
    <Card className="w-full border shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-red-600 to-yellow-600 text-white">
        <CardTitle className="text-2xl font-bold">Lucky Slots</CardTitle>
        <CardDescription className="text-amber-100">
          Match symbols to win points!
        </CardDescription>
        <div className="flex justify-center space-x-2 mt-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white">
            <Gift className="h-3 w-3 mr-1" /> Daily Spins: {dailySpinsRemaining}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-lg border-4 border-amber-600 shadow-inner mb-4 w-full">
          {/* Reels */}
          <div className="flex justify-center gap-2 bg-gray-100 p-3 rounded-md">
            {symbols.map((symbol, index) => (
              <div 
                key={index} 
                className={`relative bg-white border-2 border-gray-300 rounded-md p-2 flex items-center justify-center shadow-inner w-20 h-20 ${isSpinning ? 'animate-pulse' : ''}`}
              >
                {isSpinning ? (
                  <div className="animate-spin text-gray-400">
                    <Star className="h-8 w-8" />
                  </div>
                ) : (
                  symbolIcons[symbol as keyof typeof symbolIcons]
                )}
              </div>
            ))}
          </div>
          
          {/* Pay line */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>PAY LINE →</span>
            <span>← PAY LINE</span>
          </div>
        </div>
        
        {winAmount !== null && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 p-2 rounded-md mb-4 text-center">
            <span className="font-bold text-yellow-800">
              You won {winAmount} points!
            </span>
          </div>
        )}
        
        {/* Prize table */}
        <div className="bg-gray-100 p-3 rounded-md mb-4 w-full text-sm">
          <h3 className="font-bold text-gray-700 mb-2 text-center">Prize Table</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <Diamond className="h-5 w-5 text-cyan-500 mr-1" />
              <span className="text-gray-700">3× Jackpot: 20 points</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-pink-500 mr-1" />
              <span className="text-gray-700">3× Sparkles: 10 points</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-amber-500 mr-1" />
              <span className="text-gray-700">3× Awards: 7 points</span>
            </div>
            <div className="flex items-center">
              <Gem className="h-5 w-5 text-purple-500 mr-1" />
              <span className="text-gray-700">3× Gems: 5 points</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">Any 2 matching: 1-3 points</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="default" 
          onClick={handleSpin}
          disabled={isSpinning || dailySpinsRemaining <= 0}
          className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white w-full relative"
          size="lg"
        >
          {isSpinning ? "Spinning..." : "SPIN NOW"}
          {isSpinning && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            </span>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full mt-4"
        >
          Back to Games
        </Button>
      </CardContent>
    </Card>
  );
}