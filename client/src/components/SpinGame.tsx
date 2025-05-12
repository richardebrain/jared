import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SparklesIcon, Award, Gift, Coins, Star, Trophy, Heart } from "lucide-react";
import { User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Game rewards
const REWARDS = [
  { type: "points", value: 5, label: "5 Achievement Points", icon: <Star className="h-5 w-5" />, color: "bg-yellow-500" },
  { type: "points", value: 10, label: "10 Achievement Points", icon: <Star className="h-5 w-5" />, color: "bg-yellow-500" },
  { type: "points", value: 25, label: "25 Achievement Points", icon: <Star className="h-5 w-5" />, color: "bg-yellow-500" },
  { type: "bearBucks", value: 1, label: "1 Redeemable Point", icon: <Coins className="h-5 w-5" />, color: "bg-green-500" },
  { type: "bearBucks", value: 2, label: "2 Redeemable Points", icon: <Coins className="h-5 w-5" />, color: "bg-green-500" },
  { type: "bearBucks", value: 5, label: "5 Redeemable Points", icon: <Coins className="h-5 w-5" />, color: "bg-green-500" },
  { type: "item", value: "badge", label: "Achievement Badge", icon: <Award className="h-5 w-5" />, color: "bg-purple-500" },
  { type: "item", value: "gift", label: "Mystery Gift", icon: <Gift className="h-5 w-5" />, color: "bg-pink-500" },
  { type: "jackpot", value: 50, label: "JACKPOT!", icon: <Trophy className="h-5 w-5" />, color: "bg-orange-500" },
  { type: "hearts", value: 3, label: "Extra Lives", icon: <Heart className="h-5 w-5" />, color: "bg-red-500" },
  { type: "points", value: 15, label: "15 Achievement Points", icon: <Star className="h-5 w-5" />, color: "bg-yellow-500" },
  { type: "bearBucks", value: 3, label: "3 Redeemable Points", icon: <Coins className="h-5 w-5" />, color: "bg-green-500" },
];

interface SpinGameProps {
  canSpin?: boolean;
  onSpinComplete?: (reward: any) => void;
}

export default function SpinGame({ canSpin = true, onSpinComplete }: SpinGameProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [rewardWon, setRewardWon] = useState<any>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [costTierLabel, setCostTierLabel] = useState("Standard");
  const [costTier, setCostTier] = useState<'free' | 'standard' | 'premium'>('standard');
  
  // References
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Update reward mutation
  const updateUserReward = useMutation({
    mutationFn: async (data: {
      userId: number;
      rewardType: string;
      rewardAmount: number;
      points?: number;
      bearBucks?: number;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/rewards/spin-game",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowRewardDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to record your reward: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update user directly mutation
  const updateUser = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const spinWheel = () => {
    if (!user || spinning || !canSpin) return;
    
    setSpinning(true);
    
    // Get spin cost based on tier
    const spinCost = costTier === 'free' ? 0 : costTier === 'premium' ? 10 : 5;
    
    // Check if user has enough points
    if (user.points < spinCost && costTier !== 'free') {
      toast({
        title: "Not enough points",
        description: `You need ${spinCost} points to spin the wheel.`,
        variant: "destructive",
      });
      setSpinning(false);
      return;
    }
    
    // Deduct points if not free spin
    if (costTier !== 'free' && user) {
      updateUser.mutate({
        id: user.id,
        points: user.points - spinCost
      });
    }
    
    // Calculate random spin result (2 to 5 full rotations + position)
    const fullRotations = 2 + Math.floor(Math.random() * 3); // 2-5 full rotations
    const segmentCount = REWARDS.length;
    const segmentSize = 360 / segmentCount;
    
    // Get a random reward index
    const rewardIndex = Math.floor(Math.random() * segmentCount);
    
    // Calculate final angle to stop at the chosen reward (plus full rotations)
    // We subtract from 360 because the wheel spins clockwise
    const finalAngle = (fullRotations * 360) + (360 - (rewardIndex * segmentSize) - (segmentSize / 2));
    
    // Set the spin angle with CSS transition for the animation
    setSpinAngle(finalAngle);
    
    // Wait for the animation to finish
    setTimeout(() => {
      const reward = REWARDS[rewardIndex];
      setRewardWon(reward);
      
      // Apply the reward
      if (user) {
        if (reward.type === 'points') {
          // Record reward in database
          updateUserReward.mutate({
            userId: user.id,
            rewardType: reward.type,
            rewardAmount: reward.value,
            points: user.points + reward.value - spinCost // Also account for the spin cost
          });
        } else if (reward.type === 'bearBucks') {
          updateUserReward.mutate({
            userId: user.id,
            rewardType: reward.type,
            rewardAmount: reward.value,
            bearBucks: (user.bearBucks || 0) + reward.value,
            points: user.points - spinCost // Account for the spin cost
          });
        } else if (reward.type === 'jackpot') {
          // Jackpot gives both points and bear bucks
          updateUserReward.mutate({
            userId: user.id,
            rewardType: reward.type,
            rewardAmount: reward.value,
            points: user.points + reward.value - spinCost,
            bearBucks: (user.bearBucks || 0) + 10
          });
        } else {
          // Other reward types (items, etc.)
          updateUserReward.mutate({
            userId: user.id,
            rewardType: reward.type,
            rewardAmount: 1,
            points: user.points - spinCost
          });
        }
      }
      
      // Callback
      if (onSpinComplete) {
        onSpinComplete(reward);
      }
      
      // Reset spinning state
      setSpinning(false);
    }, 5000); // Match this with CSS transition time
  };
  
  // Change cost tier
  const changeCostTier = (tier: 'free' | 'standard' | 'premium') => {
    setCostTier(tier);
    
    if (tier === 'free') {
      setCostTierLabel("Free Spin");
    } else if (tier === 'premium') {
      setCostTierLabel("Premium (10 pts)");
    } else {
      setCostTierLabel("Standard (5 pts)");
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 pb-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-yellow-500" />
              Spin to Win!
            </CardTitle>
            <CardDescription className="mt-1">
              Spin the wheel to earn Bear Bucks, points, and rewards
            </CardDescription>
          </div>
          
          <Badge variant="outline" className="font-semibold px-3 py-1">
            {user?.points || 0} Points
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex flex-col items-center">
        {/* Spin Wheel container with marker */}
        <div className="relative w-64 h-64 my-4">
          {/* Marker (pointer) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8">
            <div 
              className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary mx-auto"
            ></div>
          </div>
          
          {/* Wheel */}
          <div 
            ref={wheelRef}
            className="w-full h-full rounded-full border-4 border-gray-300 relative overflow-hidden transition-transform duration-5000 ease-out"
            style={{ 
              transform: `rotate(${spinAngle}deg)`,
              transitionDuration: spinning ? '5s' : '0s',
            }}
          >
            {/* Wheel segments */}
            {REWARDS.map((reward, index) => {
              const segmentSize = 360 / REWARDS.length;
              const rotation = index * segmentSize;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "absolute top-0 left-0 w-full h-full origin-center",
                    reward.color,
                    index % 2 === 0 ? 'opacity-90' : 'opacity-100'
                  )}
                  style={{ 
                    transform: `rotate(${rotation}deg) skewY(${90 - segmentSize}deg)`,
                    transformOrigin: 'bottom right',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }}
                >
                  <div 
                    className="absolute bottom-1/2 right-0 transform translate-x-1/2 rotate-45 text-white font-semibold text-xs flex flex-col items-center justify-center"
                    style={{ transform: `rotate(${segmentSize/2}deg) translateX(80px)` }}
                  >
                    {reward.icon}
                    <span className="mt-1 whitespace-nowrap text-center max-w-[60px] text-[9px]">
                      {reward.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tier selection */}
        <div className="flex gap-2 my-2 w-full">
          <Button 
            variant={costTier === 'free' ? "default" : "outline"} 
            size="sm" 
            className="flex-1" 
            onClick={() => changeCostTier('free')}
            disabled={!user?.learningStyle?.preferred}
          >
            Free
          </Button>
          <Button 
            variant={costTier === 'standard' ? "default" : "outline"} 
            size="sm" 
            className="flex-1" 
            onClick={() => changeCostTier('standard')}
          >
            Standard
          </Button>
          <Button 
            variant={costTier === 'premium' ? "default" : "outline"} 
            size="sm" 
            className="flex-1" 
            onClick={() => changeCostTier('premium')}
          >
            Premium
          </Button>
        </div>
        
        {!user?.learningStyle?.preferred && costTier === 'free' && (
          <p className="text-xs text-muted-foreground mb-2 text-center">
            Complete the learning style assessment to unlock free spins!
          </p>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/30 p-4 flex flex-col">
        <Button 
          onClick={spinWheel} 
          disabled={spinning || !canSpin || (costTier === 'free' && !user?.learningStyle?.preferred)}
          className="w-full"
          size="lg"
        >
          {spinning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Spinning...
            </>
          ) : (
            <>Spin ({costTierLabel})</>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Each spin gives you a chance to win points, Bear Bucks, or special items!
        </p>
      </CardFooter>
      
      {/* Reward dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <SparklesIcon className="h-5 w-5 text-yellow-500" />
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-center">
              You won a reward!
            </DialogDescription>
          </DialogHeader>
          
          {rewardWon && (
            <div className="flex flex-col items-center p-6 space-y-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                rewardWon.color
              )}>
                <div className="text-white text-3xl">
                  {rewardWon.icon}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold">{rewardWon.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {rewardWon.type === 'points' && 'Points help you level up and unlock special features.'}
                  {rewardWon.type === 'bearBucks' && 'Bear Bucks can be used to purchase items in the store.'}
                  {rewardWon.type === 'jackpot' && 'JACKPOT! You won 50 points and 10 Bear Bucks!'}
                  {rewardWon.type === 'item' && 'You won a special item for your profile!'}
                  {rewardWon.type === 'hearts' && 'Extra lives will help you in learning activities.'}
                </p>
              </div>
              
              <Button onClick={() => setShowRewardDialog(false)} className="w-full">
                Claim Reward
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}