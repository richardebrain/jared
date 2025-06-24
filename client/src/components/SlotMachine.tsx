import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Gift, Award, Star, Gem, 
  History, Clock, Check, Sparkles, 
  Cherry, Diamond, DollarSign
} from "lucide-react";

interface SlotMachineProps {
  onClose?: () => void;
}

// Define the symbols that can appear on the reels
const SYMBOLS = [
  { id: 'cherry', icon: <Cherry className="h-8 w-8 text-red-500" />, value: 1 },
  { id: 'star', icon: <Star className="h-8 w-8 text-yellow-500" />, value: 2 },
  { id: 'gift', icon: <Gift className="h-8 w-8 text-blue-500" />, value: 3 },
  { id: 'gem', icon: <Gem className="h-8 w-8 text-purple-500" />, value: 5 },
  { id: 'award', icon: <Award className="h-8 w-8 text-amber-500" />, value: 7 },
  { id: 'sparkles', icon: <Sparkles className="h-8 w-8 text-pink-500" />, value: 10 },
  { id: 'diamond', icon: <Diamond className="h-8 w-8 text-cyan-500" />, value: 15 },
  { id: 'jackpot', icon: <DollarSign className="h-8 w-8 text-green-500" />, value: 20 },
];

// Reward history interface
interface RewardHistory {
  id: number;
  reward_type: string;
  reward_amount: number;
  created_at: string;
  symbols: string[];
  is_jackpot: boolean;
}

export function SlotMachine({ onClose }: SlotMachineProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [dailySpinsLeft, setDailySpinsLeft] = useState(3);
  const [activeTab, setActiveTab] = useState("slots");
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);
  
  // Define the state for each reel
  const [reels, setReels] = useState<string[][]>([
    [SYMBOLS[0].id, SYMBOLS[1].id, SYMBOLS[2].id],
    [SYMBOLS[1].id, SYMBOLS[2].id, SYMBOLS[3].id],
    [SYMBOLS[2].id, SYMBOLS[3].id, SYMBOLS[4].id]
  ]);
  
  // Define the position of each reel (for animation)
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  
  // Winning state
  const [winAmount, setWinAmount] = useState(0);
  const [isWin, setIsWin] = useState(false);
  
  useEffect(() => {
    // Check if user has completed modules or logged in today to enable spinning
    checkSpinEligibility();
  }, [user]);

  const checkSpinEligibility = () => {
    // In a real implementation, this would check the user's history
    // For now, we'll just enable spinning if the user is logged in
    setSpinEnabled(!!user);
    
    // Simulate daily spins count (in real app, this would come from the database)
    setDailySpinsLeft(3);
  };

  // Function to get random symbols for a reel
  const getRandomSymbolsForReel = () => {
    // Create an array of 20 random symbols (to animate through)
    const randomSymbols = Array(20).fill(0).map(() => {
      const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
      return SYMBOLS[randomIndex].id;
    });
    
    // The last 3 elements are what will show when the spin is complete
    return randomSymbols;
  };

  // Function to handle spinning the reels
  const handleSpin = async () => {
    if (!spinEnabled || spinning || dailySpinsLeft <= 0) {
      toast({
        title: dailySpinsLeft <= 0 ? "No spins left" : "Cannot spin now",
        description: dailySpinsLeft <= 0 ? 
          "You've used all your spins for today. Complete more modules or come back tomorrow!" : 
          "Please wait for the current spin to complete.",
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    setIsWin(false);
    setWinAmount(0);
    
    // Generate random symbols for each reel
    const newReelSymbols = [
      getRandomSymbolsForReel(),
      getRandomSymbolsForReel(),
      getRandomSymbolsForReel()
    ];
    
    // Create a staggered spinning effect
    const spinReel = (reelIndex: number, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Update the reel position to simulate spinning
          setReelPositions(prev => {
            const newPositions = [...prev];
            newPositions[reelIndex] = 20; // Set to the max position
            return newPositions;
          });
          
          // After the animation completes, display the final symbols
          setTimeout(() => {
            setReels(prev => {
              const newReels = [...prev];
              // Get the last 3 symbols from the random symbols array
              newReels[reelIndex] = newReelSymbols[reelIndex].slice(-3);
              return newReels;
            });
            
            // Reset position for next spin
            setReelPositions(prev => {
              const newPositions = [...prev];
              newPositions[reelIndex] = 0;
              return newPositions;
            });
            
            resolve();
          }, 800); // Time for the reel to finish spinning
        }, delay);
      });
    };
    
    // Spin each reel with a staggered effect
    await spinReel(0, 0);
    await spinReel(1, 400);
    await spinReel(2, 800);
    
    // After all reels have stopped, check for wins
    const centerRow = [reels[0][1], reels[1][1], reels[2][1]];
    
    // Check for wins (3 matching symbols)
    if (centerRow[0] === centerRow[1] && centerRow[1] === centerRow[2]) {
      // All 3 match - jackpot!
      const matchedSymbol = SYMBOLS.find(s => s.id === centerRow[0]);
      const points = matchedSymbol ? matchedSymbol.value * 3 : 5; // Multiply by 3 for all matching
      
      setWinAmount(points);
      setIsWin(true);
      
      // Show win animation
      confetti({
        particleCount: points >= 15 ? 200 : 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast({
        title: "You Win!",
        description: `You won ${points} points!`,
        variant: "default",
      });
      
      // Add to history
      const newReward: RewardHistory = {
        id: Date.now(),
        reward_type: "points",
        reward_amount: points,
        created_at: new Date().toISOString(),
        symbols: centerRow,
        is_jackpot: points >= 15
      };
      
      setRewardHistory(prev => [newReward, ...prev]);
      
    } else if (centerRow[0] === centerRow[1] || centerRow[1] === centerRow[2]) {
      // 2 match - smaller win
      const matchedSymbol = centerRow[0] === centerRow[1] 
        ? SYMBOLS.find(s => s.id === centerRow[0])
        : SYMBOLS.find(s => s.id === centerRow[1]);
      
      const points = matchedSymbol ? matchedSymbol.value : 2;
      
      setWinAmount(points);
      setIsWin(true);
      
      toast({
        title: "Small Win!",
        description: `You won ${points} points!`,
        variant: "default",
      });
      
      // Add to history
      const newReward: RewardHistory = {
        id: Date.now(),
        reward_type: "points",
        reward_amount: points,
        created_at: new Date().toISOString(),
        symbols: centerRow,
        is_jackpot: false
      };
      
      setRewardHistory(prev => [newReward, ...prev]);
    } else {
      toast({
        title: "Try Again!",
        description: "No matching symbols this time. Better luck next spin!",
        variant: "default",
      });
    }
    
    // Decrement daily spins
    setDailySpinsLeft(prev => prev - 1);
    setSpinning(false);
  };

  // Function to render a symbol
  const renderSymbol = (symbolId: string) => {
    const symbol = SYMBOLS.find(s => s.id === symbolId);
    return symbol ? symbol.icon : <Star className="h-8 w-8 text-gray-400" />;
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white border shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-red-600 to-yellow-600 text-white">
        <CardTitle className="text-2xl font-bold">Lucky Slots</CardTitle>
        <CardDescription className="text-amber-100">
          Spin to match symbols and win points!
        </CardDescription>
        <div className="flex justify-center space-x-2 mt-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white">
            <Gift className="h-3 w-3 mr-1" /> Daily Spins: {dailySpinsLeft}
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="slots" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slots" className="text-sm">
            <Gift className="h-4 w-4 mr-2" /> Slot Machine
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            <History className="h-4 w-4 mr-2" /> Win History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="slots" className="mt-0 p-4">
          <div className="flex flex-col items-center">
            {/* Slot machine display */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-lg border-4 border-amber-600 shadow-inner mb-4 w-full">
              {/* Win amount display */}
              {isWin && (
                <div className="bg-yellow-400 text-center p-1 rounded-t-md -mt-4 -mx-4 mb-3">
                  <span className="text-yellow-900 font-bold text-lg">+ {winAmount} POINTS!</span>
                </div>
              )}
              
              {/* Reels */}
              <div className="flex justify-center gap-2 bg-gray-100 p-3 rounded-md">
                {[0, 1, 2].map((reelIndex) => (
                  <div key={reelIndex} className="bg-white border-2 border-gray-300 rounded-md p-2 flex flex-col items-center shadow-inner w-20">
                    {reels[reelIndex].map((symbol, symbolIndex) => (
                      <div 
                        key={symbolIndex} 
                        className={`p-2 ${symbolIndex === 1 ? 'bg-yellow-100 rounded-md border border-yellow-300' : ''}`}
                      >
                        {renderSymbol(symbol)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Pay line */}
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>PAY LINE →</span>
                <span>← PAY LINE</span>
              </div>
            </div>
            
            {/* Prize table */}
            <div className="bg-gray-100 p-3 rounded-md mb-4 w-full text-sm">
              <h3 className="font-bold text-gray-700 mb-2 text-center">Prize Table</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <Diamond className="h-5 w-5 text-cyan-500 mr-1" />
                  <span className="text-gray-700">3× Jackpot: 60 points</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-pink-500 mr-1" />
                  <span className="text-gray-700">3× Sparkles: 30 points</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-amber-500 mr-1" />
                  <span className="text-gray-700">3× Awards: 21 points</span>
                </div>
                <div className="flex items-center">
                  <Gem className="h-5 w-5 text-purple-500 mr-1" />
                  <span className="text-gray-700">3× Gems: 15 points</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700">Any 2 matching: Symbol value</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="default" 
              onClick={handleSpin} 
              disabled={spinning || !spinEnabled || dailySpinsLeft <= 0}
              className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white w-full mt-4"
              size="lg"
            >
              {spinning ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Spinning...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-5 w-5" /> SPIN NOW
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <History className="mr-2 h-5 w-5 text-amber-600" />
              Your Win History
            </h3>
            
            {rewardHistory.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Gift className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No wins yet. Spin the slots to win prizes!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {rewardHistory.map((reward) => (
                  <div 
                    key={reward.id} 
                    className={`p-3 rounded-lg border flex items-center ${
                      reward.is_jackpot ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="mr-3 flex">
                      {reward.symbols.map((symbol, i) => (
                        <div key={i} className="w-8 h-8 flex items-center justify-center">
                          {renderSymbol(symbol)}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {reward.reward_amount} Points
                        {reward.is_jackpot && (
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                            Jackpot!
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(reward.created_at), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}