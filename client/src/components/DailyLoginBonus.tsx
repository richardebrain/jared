import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift, Award, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function DailyLoginBonus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [daysInARow, setDaysInARow] = useState(0);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>("");
  
  // Daily bonus rewards by day
  const dailyBonuses = [
    { day: 1, points: 5, description: "Day 1 Login" },
    { day: 2, points: 10, description: "2 Days in a Row" },
    { day: 3, points: 15, description: "3 Days in a Row" },
    { day: 4, points: 20, description: "4 Days in a Row" },
    { day: 5, points: 30, description: "5 Days in a Row" },
    { day: 6, points: 40, description: "6 Days in a Row" },
    { day: 7, points: 100, description: "Weekly Reward!" }
  ];
  
  // Check if user can claim daily bonus
  useEffect(() => {
    // Get the last claim timestamp
    const lastClaimDate = localStorage.getItem('lastDailyBonusClaim');
    const streak = parseInt(localStorage.getItem('loginStreak') || '0');
    setDaysInARow(streak);
    
    if (lastClaimDate) {
      const lastClaim = new Date(lastClaimDate);
      const now = new Date();
      
      // Check if it's a new day (midnight reset)
      const lastClaimDay = lastClaim.setHours(0, 0, 0, 0);
      const today = now.setHours(0, 0, 0, 0);
      
      if (today > lastClaimDay) {
        setCanClaim(true);
        setClaimed(false);
      } else {
        setCanClaim(false);
        setClaimed(true);
        
        // Calculate time until next claim
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const updateCountdown = () => {
          const now = new Date();
          const timeLeft = tomorrow.getTime() - now.getTime();
          
          if (timeLeft <= 0) {
            setCanClaim(true);
            setClaimed(false);
            return;
          }
          
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          
          setTimeUntilNextClaim(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        };
        
        // Initial update
        updateCountdown();
        
        // Update every second
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      }
    } else {
      // First time visitor
      setCanClaim(true);
      setClaimed(false);
      setDaysInARow(0);
    }
  }, []);
  
  // Mutation to claim daily bonus
  const { mutate: claimBonus, isPending } = useMutation({
    mutationFn: async (bonus: { points: number, streak: number }) => {
      return await apiRequest("/api/daily-bonus", {
        method: "POST",
        data: bonus
      });
    },
    onSuccess: (data) => {
      // Update the last claim date
      const now = new Date();
      localStorage.setItem('lastDailyBonusClaim', now.toString());
      
      // Update login streak
      let newStreak = daysInARow + 1;
      
      // If it's past day 7, reset to day 1
      if (newStreak > 7) {
        newStreak = 1;
      }
      
      localStorage.setItem('loginStreak', newStreak.toString());
      setDaysInARow(newStreak);
      
      // Mark as claimed
      setCanClaim(false);
      setClaimed(true);
      
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Show success toast
      toast({
        title: "Daily Bonus Claimed!",
        description: `You earned ${dailyBonuses[(newStreak - 1) % 7].points} points. Come back tomorrow for more!`,
      });
    },
    onError: (error) => {
      console.error("Failed to claim bonus:", error);
      toast({
        title: "Failed to claim bonus",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Handle claiming bonus
  const handleClaimBonus = () => {
    const todayBonus = dailyBonuses[daysInARow % 7];
    claimBonus({ points: todayBonus.points, streak: daysInARow + 1 });
  };
  
  // Reset for testing (would be removed in production)
  const resetDailyBonus = () => {
    localStorage.removeItem('lastDailyBonusClaim');
    localStorage.removeItem('loginStreak');
    setDaysInARow(0);
    setCanClaim(true);
    setClaimed(false);
  };
  
  // Get current day's bonus
  const currentBonus = dailyBonuses[daysInARow % 7];
  const nextBonus = dailyBonuses[(daysInARow + 1) % 7];

  return (
    <Card className="overflow-hidden border border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-base sm:text-lg">Daily Login Bonus</CardTitle>
          </div>
          <Badge className="bg-white text-amber-600">Day {daysInARow + 1}</Badge>
        </div>
        <CardDescription className="text-amber-100">
          Login every day to earn more points!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Daily rewards progress */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dailyBonuses.map((bonus, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center p-2 rounded-md ${
                index < daysInARow ? 'bg-amber-100 border border-amber-300' : 
                index === daysInARow ? 'bg-amber-50 border border-amber-200 shadow-sm' : 
                'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-xs font-medium">Day {bonus.day}</div>
              <div className={`mt-1 text-xs ${index <= daysInARow ? 'text-amber-700' : 'text-gray-500'}`}>
                +{bonus.points}
              </div>
              {index < daysInARow && (
                <CheckCircle className="h-3 w-3 text-green-500 mt-1" />
              )}
            </div>
          ))}
        </div>
        
        {canClaim ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="bg-amber-100 p-4 rounded-lg inline-block">
                <Gift className="h-12 w-12 text-amber-600 mx-auto" />
              </div>
              <h3 className="font-bold text-lg mt-2">
                {currentBonus.points} Points Available!
              </h3>
              <p className="text-sm text-gray-600">{currentBonus.description}</p>
            </div>
            
            <Button 
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600"
              onClick={handleClaimBonus}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Claiming...
                </>
              ) : (
                <>Claim Daily Bonus</>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="mb-3">
              <div className="bg-gray-100 p-4 rounded-lg inline-block">
                <Clock className="h-10 w-10 text-gray-400 mx-auto" />
              </div>
              <h3 className="font-bold text-lg mt-2">Already Claimed Today</h3>
              <p className="text-sm text-gray-600">
                Come back tomorrow for another {nextBonus.points} points!
              </p>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-2 text-center mt-2">
              <p className="text-sm text-gray-500">Next bonus in</p>
              <p className="font-mono text-lg font-semibold text-gray-700">
                {timeUntilNextClaim}
              </p>
            </div>
            
            {/* Reset for development - remove in production */}
            <Button 
              variant="ghost" 
              className="mt-3 text-xs text-gray-400 hover:text-gray-600"
              onClick={resetDailyBonus}
            >
              Reset (Dev Only)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}