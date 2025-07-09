import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PointsAnimation from "./PointsAnimation";
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
  const [showAnimation, setShowAnimation] = useState(false);

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
          points = 5; // Jackpot
        } else if (symbol === "sparkles") {
          points = 4; // High value
        } else if (symbol === "award") {
          points = 3; // Medium-high value
        } else if (symbol === "gem") {
          points = 2; // Medium value
        } else {
          points = 1; // Basic match
        }
      } else if (uniqueSymbols.size === 2) {
        // Two symbols match
        points = 1;
      }
      
      if (points > 0) {
        setWinAmount(points);
        if (onWin) onWin(points);
        
        // Show the points animation
        setShowAnimation(true);
        
        // Hide animation after it completes
        setTimeout(() => {
          setShowAnimation(false);
        }, 2500);
        
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
      {/* Points Animation Component */}
      {winAmount !== null && (
        <PointsAnimation 
          points={winAmount} 
          show={showAnimation} 
          style="casino" 
          onComplete={() => setShowAnimation(false)}
        />
      )}
      
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
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-6 rounded-lg border-4 border-amber-600 shadow-inner mb-4 w-full relative overflow-hidden">
          {/* Casino machine decorations */}
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-red-700 to-amber-700 flex items-center justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
          
          {/* Slot machine arm */}
          <div className="absolute top-14 right-0 h-32 w-6 flex flex-col items-center">
            <div className="w-6 h-10 bg-gradient-to-b from-red-500 to-red-700 rounded-t-md"></div>
            <div className="w-3 h-24 bg-gradient-to-b from-gray-300 to-gray-500"></div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-red-400 to-red-600 cursor-pointer"></div>
          </div>
          
          {/* Reels with enhanced visuals */}
          <div className="flex justify-center gap-2 bg-black p-5 rounded-md mt-8 mx-4 border border-amber-900">
            {symbols.map((symbol, index) => (
              <div 
                key={index} 
                className={`relative bg-gradient-to-b from-gray-100 to-gray-300 border-2 ${isSpinning ? 'border-amber-400' : 'border-gray-400'} rounded-md p-2 flex items-center justify-center shadow-inner w-20 h-20 ${isSpinning ? 'animate-pulse' : ''}`}
                style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)" }}
              >
                {isSpinning ? (
                  <div className="animate-spin text-amber-500">
                    <Star className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="transform transition-all duration-100 hover:scale-110">
                    {symbolIcons[symbol as keyof typeof symbolIcons]}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pay line with flashing effect */}
          <div className="flex justify-between items-center mt-2 mx-8">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
            <span className="text-xs text-amber-500 px-2 font-bold">PAY LINE</span>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
          </div>
          
          {/* Machine controls */}
          <div className="flex justify-center mt-4 space-x-4">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-700 shadow-md"></div>
            <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-amber-700 shadow-md"></div>
          </div>
        </div>
        
        {winAmount !== null && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 p-2 rounded-md mb-4 text-center">
            <span className="font-bold text-yellow-800">
              You won {winAmount} points!
            </span>
          </div>
        )}
        
        {/* Prize table with enhanced casino theme */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-md mb-4 w-full text-sm shadow-md">
          <h3 className="font-bold text-amber-800 mb-2 text-center bg-gradient-to-r from-amber-600 to-red-600 text-white p-2 rounded-t-md -mt-4 -mx-4 shadow-sm">
            JACKPOT PAYOUT TABLE
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
              <Diamond className="h-6 w-6 text-cyan-500 mr-2 filter drop-shadow" />
              <div>
                <span className="text-gray-800 font-medium">3× Diamonds</span>
                <div className="text-amber-600 font-bold">5 POINTS</div>
              </div>
            </div>
            <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
              <Sparkles className="h-6 w-6 text-pink-500 mr-2 filter drop-shadow" />
              <div>
                <span className="text-gray-800 font-medium">3× Sparkles</span>
                <div className="text-amber-600 font-bold">4 POINTS</div>
              </div>
            </div>
            <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
              <Award className="h-6 w-6 text-amber-500 mr-2 filter drop-shadow" />
              <div>
                <span className="text-gray-800 font-medium">3× Awards</span>
                <div className="text-amber-600 font-bold">3 POINTS</div>
              </div>
            </div>
            <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
              <Gem className="h-6 w-6 text-purple-500 mr-2 filter drop-shadow" />
              <div>
                <span className="text-gray-800 font-medium">3× Gems</span>
                <div className="text-amber-600 font-bold">2 POINTS</div>
              </div>
            </div>
            <div className="flex items-center bg-white p-2 rounded-md shadow-sm col-span-2 transition-transform hover:scale-105">
              <Star className="h-6 w-6 text-yellow-500 mr-2 filter drop-shadow" />
              <div>
                <span className="text-gray-800 font-medium">Any 2 matching symbols</span>
                <div className="text-amber-600 font-bold">1 POINT</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative mb-1">
          {/* Casino-style button with flashing effect */}
          <Button 
            variant="default" 
            onClick={handleSpin}
            disabled={isSpinning || dailySpinsRemaining <= 0}
            className={`
              bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 
              text-white w-full relative border-2 border-amber-700 shadow-xl
              ${isSpinning ? '' : 'animate-pulse'} py-6 font-bold tracking-wide text-xl
            `}
            size="lg"
          >
            {isSpinning ? (
              <span className="animate-pulse">SPINNING...</span>
            ) : (
              <span className="relative z-10">
                SPIN & WIN
                <span className="absolute -right-8 top-0 rotate-12 bg-yellow-300 text-red-600 text-xs px-2 py-1 rounded-md font-bold transform -translate-y-1/2">
                  !
                </span>
              </span>
            )}
            
            {/* Animated effect when spinning */}
            {isSpinning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <span className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full absolute"></span>
                  <span className="animate-ping h-8 w-8 border-4 border-amber-300 border-t-transparent rounded-full absolute opacity-75" style={{ animationDuration: "1.5s" }}></span>
                </div>
              </div>
            )}
          </Button>
          
          {/* Button shine effect */}
          <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 ${isSpinning ? '' : 'animate-shine'}`} style={{ transform: "skewX(-20deg)" }}></div>
          </div>
        </div>
        
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