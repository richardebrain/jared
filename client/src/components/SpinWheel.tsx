import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Confetti } from "@/components/ui/confetti";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { TrophyIcon, Gift, Award, Star, Gem, GemIcon, StarIcon, SparklesIcon, CircleDollarSign, Calendar } from "lucide-react";

interface SpinWheelProps {
  onClose?: () => void;
}

interface Prize {
  id: number;
  name: string;
  type: 'points' | 'bearBucks' | 'dayOff' | 'lunch' | 'cash';
  value: number;
  probability: number;
  icon: React.ElementType;
  color: string;
}

const PRIZES: Prize[] = [
  { id: 1, name: "10 Points", type: "points", value: 10, probability: 25, icon: Star, color: "bg-yellow-500" },
  { id: 2, name: "25 Points", type: "points", value: 25, probability: 15, icon: Star, color: "bg-yellow-600" },
  { id: 3, name: "50 Points", type: "points", value: 50, probability: 10, icon: StarIcon, color: "bg-yellow-700" },
  { id: 4, name: "5 Bear Bucks", type: "bearBucks", value: 5, probability: 20, icon: CircleDollarSign, color: "bg-green-500" },
  { id: 5, name: "15 Bear Bucks", type: "bearBucks", value: 15, probability: 12, icon: CircleDollarSign, color: "bg-green-600" },
  { id: 6, name: "Free Lunch", type: "lunch", value: 1, probability: 8, icon: GemIcon, color: "bg-purple-500" },
  { id: 7, name: "Day Off", type: "dayOff", value: 1, probability: 1, icon: Calendar, color: "bg-blue-500" },
  { id: 8, name: "$100 Cash", type: "cash", value: 100, probability: 1, icon: SparklesIcon, color: "bg-orange-500" }
];

const getTotalProbability = () => PRIZES.reduce((acc, prize) => acc + prize.probability, 0);

export function SpinWheel({ onClose }: SpinWheelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [rotation, setRotation] = useState(0);
  const [dailySpinsLeft, setDailySpinsLeft] = useState(3);
  const [isGrandPrizeEligible, setIsGrandPrizeEligible] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has completed modules or logged in today to enable spinning
    checkSpinEligibility();
    
    // Check if it's a new month for grand prize eligibility
    const today = new Date();
    const isFirstDayOfMonth = today.getDate() === 1;
    setIsGrandPrizeEligible(isFirstDayOfMonth);
  }, [user]);

  const checkSpinEligibility = () => {
    // In a real implementation, this would check the user's history
    // For now, we'll just enable spinning if the user is logged in
    setSpinEnabled(!!user);
    
    // Simulate daily spins count (in real app, this would come from the database)
    // 3 spins per day is a common pattern in games
    setDailySpinsLeft(3);
  };

  const getRandomPrize = (): Prize => {
    // If it's first day of month and eligible for grand prize, higher chance for special rewards
    const isGrandPrizeDay = isGrandPrizeEligible;
    
    const totalProbability = getTotalProbability();
    let randomNum = Math.random() * totalProbability;
    
    // If it's a grand prize eligible day, boost the probability of rare items
    if (isGrandPrizeDay && Math.random() < 0.2) {
      // 20% chance of getting one of the grand prizes on eligible day
      const grandPrizes = PRIZES.filter(p => p.type === 'dayOff' || p.type === 'cash' || p.type === 'lunch');
      return grandPrizes[Math.floor(Math.random() * grandPrizes.length)];
    }
    
    // Normal probability distribution
    let cumulativeProbability = 0;
    for (const prize of PRIZES) {
      cumulativeProbability += prize.probability;
      if (randomNum <= cumulativeProbability) {
        return prize;
      }
    }
    
    // Fallback
    return PRIZES[0];
  };

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
    setResult(null);

    // Determine the prize
    const prize = getRandomPrize();
    
    // Calculate rotation to land on the prize
    const numPrizes = PRIZES.length;
    const degreesPerPrize = 360 / numPrizes;
    const prizeIndex = PRIZES.findIndex(p => p.id === prize.id);
    
    // Calculate the rotation to make the prize land at the top
    // We add 1080 degrees (3 full rotations) plus some random offset to make the spinning more dramatic
    const targetRotation = 1080 + (prizeIndex * degreesPerPrize) + (Math.random() * (degreesPerPrize * 0.8));
    
    setRotation(targetRotation);
    
    // Wait for spinning animation to complete
    setTimeout(async () => {
      setResult(prize);
      setSpinning(false);
      setDailySpinsLeft(prev => prev - 1);
      
      if (prize.type === 'dayOff' || prize.type === 'cash' || prize.type === 'lunch') {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 5000);
      }
      
      // Record the reward in the database
      try {
        const response = await apiRequest('POST', '/api/spin-game/reward', {
          rewardType: prize.type,
          rewardAmount: prize.value
        });
        
        if (response) {
          // Reload user data to get updated points/bear bucks
          window.location.reload();
        }
      } catch (error) {
        console.error("Error recording spin reward:", error);
      }
      
    }, 5000); // 5 seconds for the wheel to spin
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-b from-amber-50 to-yellow-100 border-2 border-amber-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-amber-800">Spin & Win</CardTitle>
        <CardDescription>
          Spin the wheel to win points, Bear Bucks, and special prizes!
        </CardDescription>
        {isGrandPrizeEligible && (
          <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
            Grand Prize Month!
          </Badge>
        )}
        <div className="flex justify-center mt-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Daily Spins Left: {dailySpinsLeft}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        <div className="relative w-64 h-64 mb-4">
          {/* Spinner indicator (triangle pointer) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-6 h-6 bg-amber-600 rotate-45 transform origin-bottom"></div>
          </div>
          
          {/* Wheel */}
          <motion.div 
            ref={wheelRef}
            className="w-full h-full rounded-full border-4 border-amber-400 overflow-hidden relative"
            style={{ 
              transformOrigin: "center", 
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 5s cubic-bezier(0.2, 0.8, 0.25, 1)" : "none"
            }}
          >
            {/* Wheel segments */}
            {PRIZES.map((prize, index) => {
              const anglePerSegment = 360 / PRIZES.length;
              const rotationAngle = index * anglePerSegment;
              
              return (
                <div
                  key={prize.id}
                  className={`absolute top-0 left-0 w-full h-full ${prize.color} origin-bottom-right`}
                  style={{ 
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotationAngle + anglePerSegment) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotationAngle + anglePerSegment) * Math.PI / 180)}%, 50% 50%)`,
                    transform: `rotate(${rotationAngle}deg)`,
                  }}
                >
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs">
                    {prize.name}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
        
        {result && (
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold">You won:</h3>
            <div className="flex items-center justify-center mt-2 space-x-2">
              <result.icon className="h-6 w-6 text-amber-600" />
              <span className="text-xl font-bold text-amber-800">{result.name}</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button 
          variant="default" 
          onClick={handleSpin} 
          disabled={spinning || !spinEnabled || dailySpinsLeft <= 0}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
        >
          {spinning ? "Spinning..." : "Spin the Wheel"}
        </Button>
      </CardFooter>
      
      {confetti && <Confetti />}
    </Card>
  );
}

export default SpinWheel;