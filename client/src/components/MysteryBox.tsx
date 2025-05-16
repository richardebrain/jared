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

export default function MysteryBox({ maxDailyBoxes = 2 }: MysteryBoxProps) {
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
  
  // Track level up info for the reward dialog
  const [levelUpInfo, setLevelUpInfo] = useState<{levelUp: boolean, level: number} | null>(null);
  
  // Box references
  const mysteryBoxRef = useRef<HTMLDivElement>(null);
  
  // Update reward mutation
  const updateUserReward = useMutation({
    mutationFn: async (data: {
      userId: number;
      rewardType: string;
      rewardAmount: number;
      points?: number;
      bearBucks?: number;
      itemType?: string;
      itemCount?: number;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/mystery-box/reward",
        data
      );
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
      
      // Trigger confetti for significant rewards
      if (
        (currentReward.type === 'points' && currentReward.value >= 100) || 
        (currentReward.type === 'bearBucks' && currentReward.value >= 3) || 
        currentReward.type === 'item'
      ) {
        confetti({
          particleCount: currentReward.type === 'bearBucks' && currentReward.value >= 5 ? 150 : 100,
          spread: 70,
          origin: { y: 0.6 }
        });
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

  // Simulate fetching daily boxes left
  useEffect(() => {
    // In a real implementation, this would fetch from the backend
    const fetchDailyBoxesLeft = async () => {
      try {
        // Simulated API call
        setDailyBoxesLeft(Math.floor(Math.random() * (maxDailyBoxes + 1)));
      } catch (error) {
        console.error("Failed to fetch daily boxes left", error);
      }
    };
    
    fetchDailyBoxesLeft();
  }, [maxDailyBoxes]);
  
  // Simulate fetching reward history
  useEffect(() => {
    // In a real implementation, this would fetch from the backend
    const fetchRewardHistory = async () => {
      try {
        // Simulated API call - empty history for now
        setRewardHistory([]);
      } catch (error) {
        console.error("Failed to fetch reward history", error);
      }
    };
    
    fetchRewardHistory();
  }, []);
  
  const handleBoxOpen = () => {
    const boxType = BOX_TYPES.find(box => box.id === selectedBoxType);
    
    if (!boxType) {
      toast({
        title: "Invalid box type",
        description: "Please select a valid mystery box type.",
        variant: "destructive",
      });
      return;
    }
    
    if (dailyBoxesLeft <= 0 && boxType.cost === 0) {
      toast({
        title: "No free boxes left",
        description: "You've used all your free mystery boxes for today. Purchase premium boxes or come back tomorrow!",
        variant: "destructive",
      });
      return;
    }
    
    if (boxType.cost > 0 && user.points < boxType.cost) {
      toast({
        title: "Not enough points",
        description: `You need ${boxType.cost} points to open this ${boxType.name}.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsOpening(true);
    setIsRevealed(false);
    setOpenProgress(0);
    
    // Get the rewards for this box type
    const boxRewards = REWARDS[boxType.id as keyof typeof REWARDS];
    
    // Determine the reward based on probability
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    let selectedReward;
    
    for (const reward of boxRewards) {
      cumulativeProbability += reward.probability;
      if (randomValue <= cumulativeProbability) {
        selectedReward = reward;
        break;
      }
    }
    
    setCurrentReward(selectedReward);
    
    // Simulate box opening animation
    const openInterval = setInterval(() => {
      setOpenProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(openInterval);
          setIsRevealed(true);
          setShowRewardDialog(true);
          
          // Only decrement daily boxes for free boxes
          if (boxType.cost === 0) {
            setDailyBoxesLeft(prev => Math.max(0, prev - 1));
          }
          
          // Process the reward
          if (selectedReward) {
            if (selectedReward.type === 'points') {
              updateUserReward.mutate({
                userId: user.id,
                rewardType: selectedReward.type,
                rewardAmount: selectedReward.value,
                points: user.points + selectedReward.value - boxType.cost
              });
            } else if (selectedReward.type === 'bearBucks') {
              updateUserReward.mutate({
                userId: user.id,
                rewardType: selectedReward.type,
                rewardAmount: selectedReward.value,
                points: user.points - boxType.cost,
                bearBucks: (user.bearBucks || 0) + selectedReward.value
              });
            } else if (selectedReward.type === 'item') {
              updateUserReward.mutate({
                userId: user.id,
                rewardType: 'item',
                rewardAmount: 1,
                points: user.points - boxType.cost,
                itemType: selectedReward.id,
                itemCount: selectedReward.value
              });
            }
          }
          
          return 100;
        }
        return newProgress;
      });
    }, 150);
    
    return () => clearInterval(openInterval);
  };
  
  const getSelectedBox = () => {
    return BOX_TYPES.find(box => box.id === selectedBoxType) || BOX_TYPES[0];
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get background color and other properties for the selected box
  const selectedBox = getSelectedBox();
  
  return (
    <Card className="w-full max-w-md mx-auto bg-white border shadow-lg">
      <CardHeader className={`text-center bg-gradient-to-r ${selectedBox.color} text-white`}>
        <CardTitle className="text-2xl font-bold">Mystery Boxes</CardTitle>
        <CardDescription className="text-white/80">
          Open mystery boxes for exciting rewards!
        </CardDescription>
        <div className="flex justify-center space-x-2 mt-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white">
            <Gift className="h-3 w-3 mr-1" /> Free Boxes: {dailyBoxesLeft}
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white">
            <Coins className="h-3 w-3 mr-1" /> Your Points: {user.points || 0}
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="boxes" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="boxes" className="text-sm">
            <Package className="h-4 w-4 mr-2" /> Mystery Boxes
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            <History className="h-4 w-4 mr-2" /> Reward History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="boxes" className="mt-0 p-4">
          <div className="flex flex-col">
            {/* Box selector */}
            <div className="mb-4">
              <Select value={selectedBoxType} onValueChange={setSelectedBoxType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a mystery box" />
                </SelectTrigger>
                <SelectContent>
                  {BOX_TYPES.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${box.color} mr-2`}></div>
                        {box.name} {box.cost > 0 && `(${box.cost} points)`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {selectedBox.description}
              </p>
            </div>
            
            {/* Box display */}
            <div 
              className="relative w-full h-64 mb-4 rounded-lg overflow-hidden shadow-inner flex items-center justify-center"
              ref={mysteryBoxRef}
            >
              {/* Mystery box content */}
              {isOpening ? (
                <div className="h-full w-full flex items-center justify-center relative">
                  {/* Box opening animation */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${selectedBox.color} transition-opacity duration-500 flex items-center justify-center`}
                    style={{ opacity: 1 - (openProgress / 100) }}
                  >
                    <div className="text-white text-center">
                      <div className="text-xl font-bold mb-1">Opening...</div>
                      <div className="text-sm">{openProgress}% revealed</div>
                    </div>
                  </div>
                  
                  {/* Reward (revealed when opened) */}
                  {currentReward && (
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
                          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                          transition={{ type: "spring", duration: 0.5 }}
                          className="text-center z-10"
                        >
                          <div className={`
                            rounded-full w-24 h-24 mx-auto mb-2 flex items-center justify-center
                            ${currentReward.type === 'item' 
                              ? 'bg-purple-100 text-purple-600' 
                              : currentReward.type === 'bearBucks' 
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                            }
                          `}>
                            {currentReward.icon}
                          </div>
                          <div className="text-2xl font-bold text-gray-800">{currentReward.label}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ) : (
                <div className={`
                  w-48 h-48 rounded-lg bg-gradient-to-br ${selectedBox.color} 
                  shadow-lg border-4 ${selectedBox.borderColor} flex items-center justify-center
                  relative overflow-hidden
                `}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10"></div>
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <Package className="h-16 w-16 text-white/80 mb-2" />
                      <div className="text-white font-bold text-center text-sm">
                        {selectedBox.name}
                      </div>
                      {selectedBox.cost > 0 && (
                        <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-xs flex items-center">
                          <Coins className="h-3 w-3 mr-1" />
                          {selectedBox.cost} points
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
                    <div className="h-full bg-white"></div>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              variant="default" 
              onClick={handleBoxOpen} 
              disabled={isOpening || (selectedBox.cost === 0 && dailyBoxesLeft <= 0) || (selectedBox.cost > 0 && user.points < selectedBox.cost)}
              className={`bg-gradient-to-r ${selectedBox.color} hover:brightness-110 text-white w-full mt-4`}
              size="lg"
            >
              {isOpening ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Opening...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-5 w-5" /> 
                  {selectedBox.cost === 0 ? "Open Free Box" : `Open for ${selectedBox.cost} Points`}
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <History className="mr-2 h-5 w-5 text-blue-600" />
              Your Rewards History
            </h3>
            
            {rewardHistory.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No rewards yet. Open mystery boxes to win prizes!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {rewardHistory.map((reward) => (
                  <div 
                    key={reward.id} 
                    className="bg-gray-50 p-3 rounded-md flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center mr-3
                        ${reward.type === 'item' 
                          ? 'bg-purple-100 text-purple-600' 
                          : reward.type === 'bearBucks' 
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }
                      `}>
                        {reward.icon}
                      </div>
                      <div>
                        <div className="font-medium">{reward.label}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(reward.date)} • {BOX_TYPES.find(b => b.id === reward.boxType)?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Mystery Box Reward!
            </DialogTitle>
          </DialogHeader>
          
          {currentReward && (
            <div className="flex flex-col items-center py-4">
              <div className={`
                rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center
                ${currentReward.type === 'item' 
                  ? 'bg-purple-100 text-purple-600' 
                  : currentReward.type === 'bearBucks' 
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }
              `}>
                {currentReward.icon}
              </div>
              <div className="text-2xl font-bold text-center mb-2">{currentReward.label}</div>
              <p className="text-gray-600 text-center">
                {currentReward.type === 'points' && 'Points added to your account!'}
                {currentReward.type === 'bearBucks' && 'Bear Bucks added to your account!'}
                {currentReward.type === 'item' && currentReward.id === 'streak_shield' && 
                  'Streak Shield will protect your streak when you miss a day.'}
                {currentReward.type === 'item' && currentReward.id === 'double_xp' && 
                  'Double XP Boost activated! Earn twice the points for all activities.'}
              </p>
              
              {levelUpInfo && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg w-full">
                  <h4 className="font-bold text-center text-yellow-700 flex items-center justify-center">
                    <Award className="h-5 w-5 mr-2" />
                    Level Up!
                  </h4>
                  <p className="text-center text-yellow-600">
                    Congratulations! You've reached level {levelUpInfo.level}!
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-center">
            <Button 
              onClick={() => setShowRewardDialog(false)}
              className={`bg-gradient-to-r ${selectedBox.color}`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}