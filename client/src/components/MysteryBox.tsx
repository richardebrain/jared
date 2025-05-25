import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { Sparkles, Gift, Package, History, Coins, Award, ShieldCheck, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MysteryBoxProps {
  maxDailyBoxes?: number;
  freeStreak5SilverBox?: boolean;
}

const BOX_TYPES = [
  { 
    id: 'basic', 
    name: 'Basic Box', 
    cost: 0, 
    description: 'A free basic mystery box with small rewards.',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400' 
  },
  { 
    id: 'silver', 
    name: 'Silver Box', 
    cost: 25, 
    description: 'A mid-tier box with better odds for higher rewards.',
    color: 'from-slate-400 to-slate-500',
    borderColor: 'border-slate-300' 
  },
  { 
    id: 'gold', 
    name: 'Gold Box', 
    cost: 50, 
    description: 'A premium box with excellent rewards and special items.',
    color: 'from-amber-400 to-amber-600',
    borderColor: 'border-amber-300' 
  },
  { 
    id: 'diamond', 
    name: 'Diamond Box', 
    cost: 100, 
    description: 'An exclusive box with the best rewards and guaranteed Bear Bucks.',
    color: 'from-cyan-400 to-cyan-600',
    borderColor: 'border-cyan-300' 
  }
];

// Rewards definitions by box type
const REWARDS = {
  basic: [
    { id: 'points_5', type: 'points', value: 5, probability: 0.5, label: '5 Points', icon: <Gift className="h-5 w-5" /> },
    { id: 'points_10', type: 'points', value: 10, probability: 0.3, label: '10 Points', icon: <Gift className="h-5 w-5" /> },
    { id: 'points_25', type: 'points', value: 25, probability: 0.15, label: '25 Points!', icon: <Gift className="h-5 w-5" /> },
    { id: 'bear_1', type: 'bearBucks', value: 1, probability: 0.05, label: '1 Bear Buck!', icon: <Coins className="h-5 w-5" /> },
  ],
  silver: [
    { id: 'points_25', type: 'points', value: 25, probability: 0.45, label: '25 Points', icon: <Gift className="h-5 w-5" /> },
    { id: 'points_50', type: 'points', value: 50, probability: 0.3, label: '50 Points!', icon: <Gift className="h-5 w-5" /> },
    { id: 'bear_1', type: 'bearBucks', value: 1, probability: 0.15, label: '1 Bear Buck', icon: <Coins className="h-5 w-5" /> },
    { id: 'bear_2', type: 'bearBucks', value: 2, probability: 0.08, label: '2 Bear Bucks!', icon: <Coins className="h-5 w-5" /> },
    { id: 'streak_shield', type: 'item', value: 1, probability: 0.02, label: 'Streak Shield', icon: <ShieldCheck className="h-5 w-5" /> },
  ],
  gold: [
    { id: 'points_50', type: 'points', value: 50, probability: 0.4, label: '50 Points', icon: <Gift className="h-5 w-5" /> },
    { id: 'points_100', type: 'points', value: 100, probability: 0.3, label: '100 Points!', icon: <Gift className="h-5 w-5" /> },
    { id: 'bear_2', type: 'bearBucks', value: 2, probability: 0.15, label: '2 Bear Bucks', icon: <Coins className="h-5 w-5" /> },
    { id: 'bear_5', type: 'bearBucks', value: 5, probability: 0.1, label: '5 Bear Bucks!', icon: <Coins className="h-5 w-5" /> },
    { id: 'streak_shield', type: 'item', value: 1, probability: 0.03, label: 'Streak Shield', icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'double_xp', type: 'item', value: 1, probability: 0.02, label: 'Double XP Boost (24h)', icon: <Zap className="h-5 w-5" /> },
  ],
  diamond: [
    { id: 'points_100', type: 'points', value: 100, probability: 0.35, label: '100 Points', icon: <Gift className="h-5 w-5" /> },
    { id: 'points_200', type: 'points', value: 200, probability: 0.2, label: '200 Points!', icon: <Gift className="h-5 w-5" /> },
    { id: 'bear_3', type: 'bearBucks', value: 3, probability: 0.2, label: '3 Bear Bucks', icon: <Coins className="h-5 w-5" /> },
    { id: 'bear_5', type: 'bearBucks', value: 5, probability: 0.15, label: '5 Bear Bucks!', icon: <Coins className="h-5 w-5" /> },
    { id: 'bear_10', type: 'bearBucks', value: 10, probability: 0.05, label: '10 Bear Bucks!!', icon: <Coins className="h-5 w-5" /> },
    { id: 'streak_shield', type: 'item', value: 2, probability: 0.03, label: '2 Streak Shields', icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'double_xp', type: 'item', value: 1, probability: 0.02, label: 'Double XP Boost (48h)', icon: <Zap className="h-5 w-5" /> },
  ]
};

export default function MysteryBox({ maxDailyBoxes = 2, freeStreak5SilverBox = true }: MysteryBoxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dailyBoxesLeft, setDailyBoxesLeft] = useState(maxDailyBoxes);
  const [activeTab, setActiveTab] = useState('boxes');
  const [selectedBoxType, setSelectedBoxType] = useState(BOX_TYPES[0].id);
  const [isOpening, setIsOpening] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [openProgress, setOpenProgress] = useState(0);
  const [currentReward, setCurrentReward] = useState<any>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  
  // 5-day streak Silver Box eligibility state
  const [streakSilverBoxEligible, setStreakSilverBoxEligible] = useState(false);
  const [streakSilverBoxClaimed, setStreakSilverBoxClaimed] = useState(false);
  
  // Track level up info for the reward dialog
  const [levelUpInfo, setLevelUpInfo] = useState<{levelUp: boolean, level: number} | null>(null);
  
  // Box references
  const mysteryBoxRef = useRef<HTMLDivElement>(null);
  
  // Helper function to select a reward based on probability
  const selectWeightedReward = (rewards: any[]) => {
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (randomValue <= cumulativeProbability) {
        return reward;
      }
    }
    
    // Fallback to the first reward if something goes wrong
    return rewards[0];
  };
  
  // Helper function to get the selected box type
  const getSelectedBox = () => {
    return BOX_TYPES.find(box => box.id === selectedBoxType) || BOX_TYPES[0];
  };
  
  // Handle opening of a box with option for free streak box
  const handleOpenBox = (boxTypeId: string, isStreakReward = false) => {
    const boxType = BOX_TYPES.find(box => box.id === boxTypeId);
    
    if (!boxType) {
      toast({
        title: "Invalid box type",
        description: "Please select a valid mystery box type.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user reached daily point limit (20 points)
    const dailyPointLimit = 20;
    const currentPoints = user?.points || 0;
    
    if (currentPoints >= dailyPointLimit) {
      toast({
        title: "Daily point limit reached",
        description: `You've reached the daily limit of ${dailyPointLimit} points. Come back tomorrow for more rewards!`,
        variant: "destructive",
      });
      return;
    }
    
    // Skip the daily box check for streak rewards
    if (!isStreakReward && dailyBoxesLeft <= 0 && boxType.cost === 0) {
      toast({
        title: "No free boxes left",
        description: "You've used all your free mystery boxes for today. Purchase premium boxes or come back tomorrow!",
        variant: "destructive",
      });
      return;
    }
    
    // Skip the point cost check for streak rewards
    if (!isStreakReward && boxType.cost > 0 && (user?.points || 0) < boxType.cost) {
      toast({
        title: "Not enough points",
        description: `You need ${boxType.cost} points to open this ${boxType.name}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Proceed with box opening animation and reward selection
    setIsOpening(true);
    setIsRevealed(false);
    setOpenProgress(0);
    
    // Get the rewards for this box type
    const boxRewards = REWARDS[boxType.id as keyof typeof REWARDS];
    
    // Use weighted random selection based on probability
    const selectedReward = selectWeightedReward(boxRewards);
    setCurrentReward(selectedReward);
    
    // Start the opening animation
    const openingInterval = setInterval(() => {
      setOpenProgress(prev => {
        const newProgress = prev + 2;
        
        if (newProgress >= 100) {
          clearInterval(openingInterval);
          setIsRevealed(true);
          
          // Update user rewards in database
          updateUserReward.mutate({
            rewardType: selectedReward.type,
            rewardAmount: selectedReward.value,
            itemType: selectedReward.type === 'item' ? selectedReward.id : undefined
          });
          
          // Update the daily boxes left if this was a free box
          if (!isStreakReward && boxType.cost === 0) {
            setDailyBoxesLeft(prev => Math.max(0, prev - 1));
          }
          
          return 100;
        }
        
        return newProgress;
      });
    }, 30);
  };
  
  const handleBoxOpen = () => {
    handleOpenBox(selectedBoxType);
  };
  
  // Claim streak silver box mutation
  const claimStreakSilverBox = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/streak/claim-silver-box", {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to claim streak reward");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setStreakSilverBoxClaimed(true);
      
      // Show success toast
      toast({
        title: "Reward Claimed!",
        description: "You've successfully claimed your 5-day streak Silver Box reward!",
        variant: "default",
      });
      
      // Set silver box as selected and trigger opening
      setSelectedBoxType('silver');
      handleOpenBox('silver', true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Claiming Reward",
        description: error.message || "There was a problem claiming your streak reward.",
        variant: "destructive",
      });
    }
  });
  
  // Update reward mutation
  const updateUserReward = useMutation({
    mutationFn: async (data: {
      rewardType: string;
      rewardAmount: number;
      itemType?: string;
    }) => {
      const response = await apiRequest("/api/mystery-box/reward", {
        method: "POST",
        data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process reward");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Save level up info for the reward dialog
      if (data.levelUp) {
        setLevelUpInfo({
          levelUp: true,
          level: data.level
        });
      }
      
      // Update history
      setRewardHistory(prev => [
        {
          id: Date.now(),
          date: new Date(),
          boxType: selectedBoxType,
          ...currentReward,
        },
        ...prev
      ]);
      
      // Trigger enhanced confetti effects for all rewards
      // First, always trigger confetti for any reward
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // For better rewards, add additional confetti effects with different colors and patterns
      if (
        (currentReward.type === 'points' && currentReward.value >= 50) || 
        (currentReward.type === 'bearBucks' && currentReward.value >= 2) || 
        currentReward.type === 'item'
      ) {
        // Add a second burst of confetti with delay
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#ffd700', '#ffb700', '#ffa500']
          });
        }, 300);
        
        // Add a third burst from the other side
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#87CEFA', '#00BFFF', '#1E90FF']
          });
        }, 600);
      }
      
      // For premium rewards, add even more spectacular effects
      if (
        (currentReward.type === 'points' && currentReward.value >= 100) || 
        (currentReward.type === 'bearBucks' && currentReward.value >= 5) || 
        (currentReward.type === 'item' && (currentReward.id === 'streak_shield' || currentReward.id === 'double_xp'))
      ) {
        // Add confetti cannon effect
        setTimeout(() => {
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
          
          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
          
          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
              return clearInterval(interval);
            }
            
            const particleCount = 50 * (timeLeft / duration);
            
            // Since particles fall down, start a bit higher than random
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }, 1000);
      }
    },
    onError: () => {
      toast({
        title: "Error claiming reward",
        description: "There was a problem claiming your reward. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Load user data, daily boxes left, and streak silver box eligibility on component mount
  useEffect(() => {
    // In a real application, would fetch from the server
    const fetchDailyBoxesOpened = async () => {
      try {
        const response = await apiRequest('/api/rewards/daily-boxes', {
          method: 'GET'
        });
        const data = await response.json();
        
        if (response.ok) {
          setDailyBoxesLeft(Math.max(0, maxDailyBoxes - data.opened));
          if (data.history) {
            setRewardHistory(data.history);
          }
        }
      } catch (error) {
        console.error('Error fetching daily boxes data:', error);
        // Fallback to default in case of error
        setDailyBoxesLeft(maxDailyBoxes);
      }
    };
    
    // Check if user is eligible for a 5-day streak silver box
    const checkStreakSilverBoxEligibility = async () => {
      if (!freeStreak5SilverBox) return; // Skip if feature is disabled
      
      try {
        const response = await apiRequest('/api/streak/silver-box-eligibility', {
          method: 'GET'
        });
        const data = await response.json();
        
        if (response.ok) {
          setStreakSilverBoxEligible(data.eligible);
          setStreakSilverBoxClaimed(data.alreadyClaimed || false);
          
          // If eligible and not already notified, show a toast
          if (data.eligible && !sessionStorage.getItem('streakSilverBoxNotified')) {
            toast({
              title: "5-Day Streak Reward!",
              description: "You've earned a free Silver Mystery Box for your 5-day login streak!",
              variant: "default"
            });
            sessionStorage.setItem('streakSilverBoxNotified', 'true');
          }
        }
      } catch (error) {
        console.error('Error checking streak silver box eligibility:', error);
      }
    };
    
    fetchDailyBoxesOpened();
    checkStreakSilverBoxEligibility();
  }, [maxDailyBoxes, freeStreak5SilverBox, toast]);
  
  // Render component
  const selectedBox = getSelectedBox();
  
  return (
    <Card className="w-full max-w-md mx-auto bg-white border shadow-lg">
      <CardHeader className={`text-center bg-gradient-to-r ${selectedBox.color} text-white`}>
        <CardTitle className="text-2xl font-bold">Mystery Boxes</CardTitle>
        <CardDescription className="text-white/90">Open boxes to earn rewards!</CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="boxes">Boxes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="boxes" className="p-4">
          {/* Streak Silver Box Special Reward */}
          {streakSilverBoxEligible && !streakSilverBoxClaimed && freeStreak5SilverBox && (
            <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-amber-500" />
                <h3 className="font-bold text-lg">5-Day Streak Reward!</h3>
              </div>
              <p className="text-sm mb-3">You've earned a free Silver Box for maintaining a 5-day login streak!</p>
              <Button 
                onClick={() => claimStreakSilverBox.mutate()}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700"
                disabled={claimStreakSilverBox.isPending}
              >
                {claimStreakSilverBox.isPending ? 'Claiming...' : 'Claim Free Silver Box'}
              </Button>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Select Box Type:</h3>
            <Select
              value={selectedBoxType}
              onValueChange={setSelectedBoxType}
              disabled={isOpening}
            >
              <SelectTrigger className={`border-2 ${selectedBox.borderColor}`}>
                <SelectValue placeholder="Select box type" />
              </SelectTrigger>
              <SelectContent>
                {BOX_TYPES.map(box => (
                  <SelectItem key={box.id} value={box.id}>
                    <div className="flex items-center gap-2">
                      <span>{box.name}</span>
                      {box.cost > 0 && <Badge variant="outline">{box.cost} Points</Badge>}
                      {box.cost === 0 && <Badge variant="outline">Free</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <p className="text-sm text-gray-600 mt-2">{selectedBox.description}</p>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm font-medium">Free Boxes Left Today: </span>
              <Badge variant="outline">{dailyBoxesLeft}</Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Your Points: </span>
              <Badge>{user?.points || 0}</Badge>
            </div>
          </div>
          
          <div 
            ref={mysteryBoxRef}
            className={`relative aspect-square w-48 mx-auto mb-6 transition-all duration-300 ${isOpening ? 'scale-110' : 'hover:scale-105'}`}
          >
            {isOpening ? (
              // Opening animation
              <div className="w-full h-full flex items-center justify-center">
                {!isRevealed ? (
                  // Progress circular animation
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${selectedBox.color} shadow-lg flex items-center justify-center`}>
                      <Package className="h-20 w-20 text-white animate-pulse" />
                    </div>
                    <div className="absolute bottom-4 w-4/5 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-white h-2.5 rounded-full" 
                        style={{ width: `${openProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  // Revealed reward
                  <div className={`w-full h-full rounded-xl bg-gradient-to-r ${selectedBox.color} shadow-lg flex flex-col items-center justify-center p-4`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 100 }}
                      className="text-white mb-2"
                    >
                      {currentReward?.icon}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <h3 className="text-xl font-bold text-white">{currentReward?.label}</h3>
                      <p className="text-sm text-white/80 mt-1">Tap to continue</p>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              // Unopened box
              <Button
                variant="outline"
                className={`w-full h-full rounded-xl bg-gradient-to-r ${selectedBox.color} shadow-lg flex flex-col items-center justify-center border-0`}
                onClick={handleBoxOpen}
                disabled={isOpening}
              >
                <Package className="h-20 w-20 text-white mb-2" />
                <span className="text-white font-semibold">Open {selectedBox.name}</span>
                {selectedBox.cost > 0 && (
                  <Badge variant="outline" className="mt-2 bg-white/20 text-white border-0">
                    {selectedBox.cost} Points
                  </Badge>
                )}
              </Button>
            )}
          </div>
          
          {isRevealed && (
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
              onClick={() => {
                setIsOpening(false);
                setIsRevealed(false);
                setCurrentReward(null);
              }}
            >
              Continue
            </Button>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="p-4">
          <h3 className="font-semibold mb-2">Reward History</h3>
          
          {rewardHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No rewards claimed yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {rewardHistory.map((reward) => {
                const boxType = BOX_TYPES.find(box => box.id === reward.boxType) || BOX_TYPES[0];
                return (
                  <div 
                    key={reward.id} 
                    className={`p-3 rounded-lg border ${boxType.borderColor} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${boxType.color} flex items-center justify-center text-white`}>
                        {reward.icon}
                      </div>
                      <div>
                        <p className="font-medium">{reward.label}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(reward.date).toLocaleDateString()} at {new Date(reward.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={boxType.borderColor}>
                      {boxType.name}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-gray-50 p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <p className="text-sm text-gray-600">Daily Limit: 20 points</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Free Boxes:</span> {dailyBoxesLeft}/{maxDailyBoxes}
          </p>
        </div>
        {freeStreak5SilverBox && (
          <p className="text-xs text-gray-500 italic">Maintain a 5-day login streak to earn a free Silver Box!</p>
        )}
      </CardFooter>
      
      {/* Level Up Dialog */}
      <Dialog open={!!levelUpInfo} onOpenChange={(open) => !open && setLevelUpInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Level Up!</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 w-24 h-24 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-center">Congratulations!</h3>
            <p className="text-center mt-2">
              You've reached Level {levelUpInfo?.level}!
            </p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
              onClick={() => setLevelUpInfo(null)}
            >
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}