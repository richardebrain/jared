import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Gift, 
  Sparkles, 
  Package, 
  Ticket, 
  Medal, 
  Calendar, 
  RotateCcw, 
  History, 
  Clock,
  Flame,
  Check,
  Shield,
  Info,
  Trophy,
  Star
} from "lucide-react";

import { SpinWheel } from "./SpinWheel";
import ScratchCard from "./ScratchCard";
import MysteryBox from "./MysteryBox";

interface DailyRewardsProps {
  className?: string;
}

export default function DailyRewards({ className }: DailyRewardsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("daily-rewards");
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [streakCount, setStreakCount] = useState(user?.streak || 0);
  
  // For demo purposes - in a real implementation these would come from the backend
  const [lastRewardClaimed, setLastRewardClaimed] = useState<Date | null>(null);
  const [streakProtectionActive, setStreakProtectionActive] = useState(false);
  
  // Calculate streak points based on streak count
  const calculateStreakPoints = (streak: number) => {
    if (streak < 2) return 0;
    return Math.min(5, streak); // 2 points for day 2, 3 for day 3, etc. up to max 5 points
  };
  
  // Current streak points
  const streakPoints = calculateStreakPoints(streakCount);
  
  // Mutation for claiming streak points
  const claimStreakPointsMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would be an API call to claim the streak points
      const response = await apiRequest(
        "POST",
        "/api/user/claim-streak-points",
        { userId: user?.id, points: streakPoints }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Streak Points Claimed!",
        description: `You've earned ${streakPoints} points for your ${streakCount}-day streak!`,
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Error Claiming Points",
        description: "There was a problem claiming your streak points.",
        variant: "destructive",
      });
    }
  });
  
  const activateStreakProtection = useMutation({
    mutationFn: async () => {
      // In a real app, this would be an API call to activate streak protection
      const response = await apiRequest(
        "POST",
        "/api/user/activate-streak-protection",
        { userId: user?.id }
      );
      return response.json();
    },
    onSuccess: () => {
      setStreakProtectionActive(true);
      toast({
        title: "Streak Protection Activated",
        description: "Your streak is now protected for the next 24 hours!",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const canClaimDailyReward = true; // In a real app, check against the last claimed timestamp
  
  // Calculate remaining time until next rewards reset
  const getNextResetTime = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };
  
  return (
    <Card className={`${className} bg-white shadow-md border-2 border-purple-100 overflow-hidden`}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Daily Rewards
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-white/20 text-white border-white/30 px-2.5 py-0.5 text-xs"
          >
            <Clock className="mr-1.5 h-3 w-3" />
            Resets in {getNextResetTime()}
          </Badge>
        </div>
        <CardDescription className="text-purple-100 mt-1">
          Claim your daily rewards and increase your streak!
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="daily-rewards" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 bg-gray-100">
          <TabsTrigger value="daily-rewards" className="text-sm py-2">
            <Gift className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Daily</span> Rewards
          </TabsTrigger>
          <TabsTrigger value="streak" className="text-sm py-2">
            <Flame className="h-4 w-4 mr-2" />
            Streak Bonus <span className="ml-1.5 bg-purple-100 text-purple-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold">{streakCount}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily-rewards" className="p-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Spin Wheel Game */}
            <div 
              className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg border border-amber-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowSpinWheel(true)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center mb-2">
                  <RotateCcw className="h-7 w-7 text-white transform -rotate-45" />
                </div>
                <h3 className="font-semibold text-amber-800">Daily Spin</h3>
                <p className="text-xs text-amber-700 mt-1">Spin for points & prizes!</p>
                <Badge className="mt-2 bg-amber-500 hover:bg-amber-600">3 spins left</Badge>
              </div>
            </div>
            
            {/* Scratch Card Game */}
            <div 
              className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg border border-purple-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowScratchCard(true)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mb-2">
                  <Ticket className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-purple-800">Scratch Cards</h3>
                <p className="text-xs text-purple-700 mt-1">Scratch & reveal rewards!</p>
                <Badge className="mt-2 bg-purple-500 hover:bg-purple-600">2 cards left</Badge>
              </div>
            </div>
            
            {/* Mystery Box Game */}
            <div 
              className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-lg border border-cyan-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowMysteryBox(true)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-2">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-cyan-800">Mystery Boxes</h3>
                <p className="text-xs text-cyan-700 mt-1">Open boxes for surprise gifts!</p>
                <Badge className="mt-2 bg-cyan-500 hover:bg-cyan-600">1 free box</Badge>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="streak" className="p-4 pt-2">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-2">
              <div className="flex items-center mb-1">
                <Flame className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="font-bold text-lg text-gray-800">Streak Rewards</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 ml-1" onClick={() => setShowStreakInfo(true)}>
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Learn about streak rewards</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {streakCount >= 2 ? (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm px-3 py-1 rounded-full flex items-center mb-2">
                  <Star className="h-3 w-3 mr-1.5" />
                  Earning {streakPoints} points per day!
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full flex items-center mb-2">
                  Log in tomorrow to start earning streak points!
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-1 py-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div 
                  key={index}
                  className={`w-9 h-9 rounded-full flex flex-col items-center justify-center border relative ${
                    index < streakCount 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white border-purple-300 shadow-md' 
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  {index < streakCount ? (
                    <>
                      <Check className="h-4 w-4" />
                      {index >= 1 && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                          {Math.min(5, index + 1)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center mt-3">
              <p className="text-sm text-gray-700 mb-1">
                Current streak: <span className="font-bold text-purple-600">{streakCount} days</span>
              </p>
              
              {streakCount >= 7 ? (
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <Medal className="h-3 w-3 mr-1" /> Week Champion!
                </Badge>
              ) : (
                <p className="text-xs text-gray-500">
                  {7 - streakCount} more days for a weekly bonus reward!
                </p>
              )}
            </div>
            
            {streakCount >= 2 && (
              <Button
                className="mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                size="sm"
                onClick={() => claimStreakPointsMutation.mutate()}
                disabled={claimStreakPointsMutation.isPending}
              >
                {claimStreakPointsMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-1.5" />
                    Claim {streakPoints} Points
                  </>
                )}
              </Button>
            )}
            
            <div className="w-full bg-gray-50 rounded-lg p-3 mt-4 border border-gray-200">
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-1.5 text-purple-500" />
                Streak Protection
              </h4>
              
              {streakProtectionActive ? (
                <div className="flex items-center text-green-600 text-sm">
                  <Check className="h-4 w-4 mr-1.5" />
                  <span>Active until {formatDate(new Date(Date.now() + 86400000 * 2))}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">Protect your streak from being reset!</div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => activateStreakProtection.mutate()}
                    disabled={activateStreakProtection.isPending}
                  >
                    Use 5 Points
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Streak Info Dialog */}
        <Dialog open={showStreakInfo} onOpenChange={setShowStreakInfo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Flame className="h-5 w-5 text-red-500 mr-2" />
                Streak Point System
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="font-semibold text-lg mb-3 text-purple-700">How Streak Points Work:</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">1</div>
                  <p>Log in for 2 consecutive days to start earning streak points.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">2</div>
                  <p>Day 2: Earn <span className="font-semibold">2 points</span></p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">3</div>
                  <p>Day 3: Earn <span className="font-semibold">3 points</span></p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">4</div>
                  <p>Day 4: Earn <span className="font-semibold">4 points</span></p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">5</div>
                  <p>Day 5 and beyond: Earn <span className="font-semibold">5 points per day</span></p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <p>Your streak continues until you miss a day, then it resets.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    <Shield className="h-3 w-3" />
                  </div>
                  <p>Use Streak Protection to prevent losing your streak if you miss a day!</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="default" onClick={() => setShowStreakInfo(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
      
      {/* Spin Wheel Dialog */}
      <Dialog open={showSpinWheel} onOpenChange={setShowSpinWheel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spin & Win</DialogTitle>
          </DialogHeader>
          <SpinWheel onClose={() => setShowSpinWheel(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Scratch Card Dialog */}
      <Dialog open={showScratchCard} onOpenChange={setShowScratchCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scratch & Win</DialogTitle>
          </DialogHeader>
          <ScratchCard maxDailyScratchCards={3} />
        </DialogContent>
      </Dialog>
      
      {/* Mystery Box Dialog */}
      <Dialog open={showMysteryBox} onOpenChange={setShowMysteryBox}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mystery Boxes</DialogTitle>
          </DialogHeader>
          <MysteryBox maxDailyBoxes={2} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}