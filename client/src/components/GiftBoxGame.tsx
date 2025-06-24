import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSimpleAuth } from "@/lib/simple-auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SparklesIcon, Package, PackageOpen, Coins, Star, Trophy, Heart, Award, Gift } from "lucide-react";
import { User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

// Box color options
const BOX_COLORS = [
  "from-primary to-primary/70",
  "from-yellow-500 to-yellow-400",
  "from-pink-500 to-purple-500",
  "from-blue-500 to-blue-400",
  "from-green-500 to-green-400",
  "from-orange-500 to-red-500",
];

interface GiftBoxGameProps {
  canOpen?: boolean;
  onComplete?: (reward: any) => void;
}

export default function GiftBoxGame({ canOpen = true, onComplete }: GiftBoxGameProps) {
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [rewardWon, setRewardWon] = useState<any>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [costTierLabel, setCostTierLabel] = useState("Standard");
  const [costTier, setCostTier] = useState<'free' | 'standard' | 'premium'>('standard');
  
  // References
  const giftBoxRef = useRef<HTMLDivElement>(null);
  const colorChangeInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Track level up info for the reward dialog
  const [levelUpInfo, setLevelUpInfo] = useState<{levelUp: boolean, level: number} | null>(null);
  
  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: async (data: { type: string, value: number }) => {
      let updateData = {};
      
      if (data.type === "points") {
        updateData = { points: data.value };
      } else if (data.type === "bearBucks") {
        updateData = { bearBucks: data.value };
      }
      
      const response = await apiRequest(`/api/users/${user?.id}/rewards`, {
        method: "POST",
        body: {
          type: data.type,
          value: data.value,
          source: "gift_box"
        }
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      console.error("Error adding points:", error);
      toast({
        title: "Error",
        description: "There was a problem adding your reward.",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle the gift box animation and reward
  const openGiftBox = async () => {
    if (opening || !canOpen) return;
    
    // Check if user can afford the spin
    if (costTier === 'premium' && (user?.bearBucks || 0) < 5) {
      toast({
        title: "Not enough Bear Bucks",
        description: "You need 5 Bear Bucks to open a Premium gift. Complete more modules to earn Bear Bucks!",
        variant: "destructive",
      });
      return;
    }
    
    setOpening(true);
    
    try {
      // If using Bear Bucks for premium, deduct cost
      if (costTier === 'premium') {
        await apiRequest(`/api/users/${user?.id}`, {
          method: "PATCH",
          body: { bearBucks: (user?.bearBucks || 0) - 5 }
        });
      }
      
      // Start color change animation
      colorChangeInterval.current = setInterval(() => {
        setCurrentColorIndex(prev => (prev + 1) % BOX_COLORS.length);
      }, 200);
      
      // After some time, stop the color change and open the box
      setTimeout(() => {
        if (colorChangeInterval.current) {
          clearInterval(colorChangeInterval.current);
        }
        
        setIsOpened(true);
        
        // After the box opens, reveal the reward
        setTimeout(async () => {
          // Select reward based on tier
          const reward = selectReward();
          
          // Apply reward
          if (reward.type === "points" || reward.type === "bearBucks") {
            await addPointsMutation.mutateAsync({
              type: reward.type,
              value: reward.value
            });
          } else if (reward.type === "jackpot") {
            // Special handling for jackpot
            await addPointsMutation.mutateAsync({ type: "points", value: 25 });
            await addPointsMutation.mutateAsync({ type: "bearBucks", value: 10 });
          }
          
          // Set reward and show dialog
          setRewardWon(reward);
          setShowRewardDialog(true);
          
          // Reset state after a delay
          setTimeout(() => {
            setIsOpened(false);
            setOpening(false);
            setCurrentColorIndex(0);
          }, 1000);
          
          // Call the onComplete callback if provided
          if (onComplete) {
            onComplete(reward);
          }
        }, 800);
      }, 2000);
    } catch (error) {
      console.error("Error opening gift box:", error);
      setOpening(false);
      toast({
        title: "Error",
        description: "There was a problem opening the gift box. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to select reward based on tier
  const selectReward = () => {
    let rewardPool = [...REWARDS];
    
    // Free tier - No jackpot or high value rewards
    if (costTier === 'free') {
      rewardPool = rewardPool.filter(r => 
        r.type !== "jackpot" && 
        !(r.type === "points" && r.value > 10) && 
        !(r.type === "bearBucks" && r.value > 2)
      );
    }
    // Premium tier - Better odds for good rewards
    else if (costTier === 'premium') {
      // Weighted selection for premium tier
      rewardPool = [
        ...rewardPool.filter(r => r.type === "points" && r.value >= 10),
        ...rewardPool.filter(r => r.type === "bearBucks" && r.value >= 2),
        ...rewardPool.filter(r => r.type === "item"),
        ...Array(3).fill(rewardPool.find(r => r.type === "jackpot")), // Higher chance for jackpot
      ];
    }
    
    // Return a random reward from the pool
    return rewardPool[Math.floor(Math.random() * rewardPool.length)];
  };
  
  // Toggle between gift box tiers
  const toggleTier = () => {
    if (costTier === 'standard') {
      setCostTier('premium');
      setCostTierLabel('Premium (5 Bear Bucks)');
    } else if (costTier === 'premium') {
      setCostTier('free');
      setCostTierLabel('Free');
    } else {
      setCostTier('standard');
      setCostTierLabel('Standard');
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-pink-500/20 via-primary/20 to-purple-500/20 pb-0 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMTAiIGN5PSIxMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-60"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-pink-500" />
              Gift Box Surprise!
            </CardTitle>
            <CardDescription className="mt-1">
              Open the gift box to discover rewards and surprises
            </CardDescription>
          </div>
          
          <Badge variant="outline" className="font-semibold px-3 py-1 bg-white/80 backdrop-blur-sm">
            {user?.points || 0} Points
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex flex-col items-center">
        {/* Gift Box Container */}
        <div className="relative w-64 h-64 my-4 flex items-center justify-center">
          <div 
            ref={giftBoxRef}
            className={cn(
              "w-40 h-40 relative",
              opening && !isOpened ? "animate-pulse" : ""
            )}
          >
            {/* Box base */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 w-full h-24 rounded-md bg-gradient-to-br",
                BOX_COLORS[currentColorIndex],
                isOpened ? "translate-y-12 opacity-50" : "",
                "transition-all duration-500 ease-in-out"
              )}
              style={{ 
                boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -10px 20px rgba(0,0,0,0.1)'
              }}
            >
              {/* Box front stripe */}
              <div className="absolute top-1/2 left-0 w-full h-4 bg-white/20 transform -translate-y-1/2"></div>
            </div>
            
            {/* Box lid */}
            <div 
              className={cn(
                "absolute top-0 left-0 w-full h-16 rounded-t-md bg-gradient-to-br",
                BOX_COLORS[currentColorIndex],
                isOpened ? "-translate-y-20 -rotate-[20deg] opacity-50" : "",
                "transition-all duration-500 ease-in-out origin-bottom"
              )}
              style={{ 
                boxShadow: 'inset 0 5px 15px rgba(255,255,255,0.3)'
              }}
            >
              {/* Lid top stripe */}
              <div className="absolute bottom-1 w-full h-4 bg-white/20"></div>
            </div>
            
            {/* Ribbon vertical */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 w-6 h-40 bg-white/30 -ml-3 z-10",
                isOpened ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300 ease-in-out"
              )}
            ></div>
            
            {/* Ribbon horizontal */}
            <div 
              className={cn(
                "absolute top-1/2 left-0 w-40 h-6 bg-white/30 -mt-3 z-20",
                isOpened ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300 ease-in-out"
              )}
            ></div>
            
            {/* Ribbon bow */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 -ml-6 -mt-6 w-12 h-12 z-30",
                isOpened ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300 ease-in-out"
              )}
            >
              <div className="absolute w-12 h-6 bg-white/50 rounded-full" style={{ transform: 'rotate(45deg)' }}></div>
              <div className="absolute w-12 h-6 bg-white/50 rounded-full" style={{ transform: 'rotate(-45deg)' }}></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white/70 rounded-full -mt-2 -ml-2"></div>
            </div>
            
            {/* Gift shine effect */}
            {opening && !isOpened && (
              <div className="absolute inset-0 overflow-hidden z-40">
                <div 
                  className="absolute top-0 left-0 w-20 h-150 bg-white/20"
                  style={{ 
                    transform: 'rotate(45deg) translate(-50%, -50%)',
                    animation: 'shine 1.5s infinite'
                  }}
                ></div>
                <style jsx>{`
                  @keyframes shine {
                    0% { transform: rotate(45deg) translateX(-100%); }
                    100% { transform: rotate(45deg) translateX(200%); }
                  }
                `}</style>
              </div>
            )}
            
            {/* Surprise burst (when opened) */}
            {isOpened && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
                <div className="relative w-24 h-24">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-1.5 h-16 bg-yellow-400 left-1/2 top-1/2 -ml-[3px]"
                      style={{ 
                        transformOrigin: 'center bottom',
                        transform: `rotate(${i * 45}deg)`,
                        animation: `burstRay 0.6s ease-out forwards`,
                        opacity: 0
                      }}
                    ></div>
                  ))}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-500/20 rounded-full animate-ping"></div>
                  <style jsx>{`
                    @keyframes burstRay {
                      0% { height: 0; opacity: 1; }
                      60% { height: 24px; opacity: 1; }
                      100% { height: 32px; opacity: 0; }
                    }
                  `}</style>
                </div>
              </div>
            )}
            
            {/* Reward preview (briefly shown when opened) */}
            {isOpened && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce">
                <div className="text-3xl">🎁</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Cost and tier options */}
        <div className="w-full text-center mt-2">
          <div className={cn(
            "text-sm font-medium flex items-center justify-center gap-1 mb-1",
            costTier === 'premium' ? "text-amber-600" : 
            costTier === 'free' ? "text-green-600" : "text-primary"
          )}>
            <Badge variant="outline" className="cursor-pointer" onClick={toggleTier}>
              {costTierLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {costTier === 'premium' 
              ? "Premium gifts have better rewards and higher jackpot chances!" 
              : costTier === 'free'
              ? "Free gifts have basic rewards. Try Standard or Premium for better prizes!"
              : "Standard gifts have a good balance of rewards."}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gradient-to-b from-muted/5 to-muted/30 p-4 flex flex-col relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiIGN4PSIyMCIgY3k9IjIwIiByPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50 z-0"></div>
        
        <Button 
          onClick={openGiftBox} 
          disabled={opening || !canOpen || (costTier === 'premium' && (user?.bearBucks || 0) < 5)}
          className="w-full relative z-10 bg-gradient-to-r from-pink-500 to-primary hover:from-pink-600 hover:to-primary/90 shadow-md"
          size="lg"
        >
          {opening ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              {isOpened ? "Revealing..." : "Opening..."}
            </>
          ) : (
            <div className="flex items-center">
              {costTier === 'premium' ? (
                <PackageOpen className="h-5 w-5 mr-2" />
              ) : (
                <Package className="h-5 w-5 mr-2" />
              )}
              <span>Open Gift Box</span>
            </div>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3 text-center relative z-10 font-medium">
          Each gift box contains a surprise reward to help with your teaching journey!
        </p>
      </CardFooter>
      
      {/* Reward dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="max-w-sm overflow-hidden border-2 border-primary/20 shadow-xl p-0">
          <div className="bg-gradient-to-r from-pink-500/30 via-primary/20 to-purple-500/20 p-6 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBjeD0iMTAiIGN5PSIxMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-center flex flex-col items-center justify-center gap-1">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center shadow-inner mb-1">
                  <SparklesIcon className="h-10 w-10 text-yellow-500" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-primary bg-clip-text text-transparent">
                  Congratulations!
                </span>
              </DialogTitle>
              <DialogDescription className="text-center text-lg font-medium mt-1">
                You found a reward!
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {rewardWon && (
            <div className="flex flex-col items-center p-6 space-y-5">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 duration-300",
                rewardWon.color
              )}>
                <div className="text-white text-4xl flex items-center justify-center">
                  {rewardWon.icon}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {rewardWon.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
                  {rewardWon.type === "points" && "Achievement points help you level up and unlock new features. Keep earning points to reach the next teacher level!"}
                  {rewardWon.type === "bearBucks" && "Bear Bucks can be used to purchase premium items and unlock exclusive content."}
                  {rewardWon.type === "jackpot" && "JACKPOT! You won a major prize with bonus points and Bear Bucks. Congratulations on your amazing luck!"}
                  {rewardWon.type === "item" && "You've unlocked a special item for your teacher profile! Visit your profile page to view your collection."}
                  {rewardWon.type === "hearts" && "Extra lives will help you in learning activities. Use them to retry questions without losing progress!"}
                </p>
              </div>
              
              {/* Level Up Information */}
              {levelUpInfo?.levelUp && (
                <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 rounded-lg border border-amber-100 w-full">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-green-700 flex items-center justify-center">
                      <span className="mr-1">🎓</span> Level Up!
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                      You've reached level {levelUpInfo.level}! Congratulations on your progress!
                    </p>
                  </div>
                </div>
              )}
              
              <DialogFooter className="w-full flex justify-center">
                <Button 
                  onClick={() => setShowRewardDialog(false)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Claim Reward
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}