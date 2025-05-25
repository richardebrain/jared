import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
import { usePointsReward } from "@/hooks/use-points";
import {
  Trophy,
  Gift,
  Coins,
  Star,
  Calendar,
  Clock,
  History,
  Package,
  Ticket,
  Shield,
  Cherry,
  Diamond,
  Gem,
  Award,
  Sparkles,
  RefreshCcw,
  RefreshCw,
  Flame,
  Medal
} from "lucide-react";

// Import our gamification components from the barrel file
import { 
  LuckySlots, 
  ScratchCard, 
  MysteryBox, 
  DailyRewards, 
  StreakProtection 
} from "@/components";

import { StreakRewardsSummary } from "@/components/DailyRewards";

export default function CasinoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("games");
  const [dailyGameUsed, setDailyGameUsed] = useState(false);
  
  // Get user data to check points, daily streaks, etc.
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  // Get completed activities to check if user can access rewards
  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
  });
  
  // Check for special access for admin
  const isJLCookie = user?.username === 'jlcookie20';
  
  // User can access games if they've completed activities OR earned at least 1 point
  // This ensures users who earned points through any method can play games
  const hasCompletedActivity = 
    isJLCookie || 
    (user && user.points && user.points > 0) || 
    (progress && Array.isArray(progress) && progress.some((p: any) => p.completed));
  
  // Function to reset games for jlcookie20
  const resetBonusGames = () => {
    if (isJLCookie) {
      // Clear the localStorage flags
      localStorage.removeItem('lastGamePlayedDate');
      
      // Update the UI state
      setDailyGameUsed(false);
      
      // Show success message
      toast({
        title: "Games Reset!",
        description: "Your bonus games have been reset. You can play them again!",
        variant: "default",
      });
    }
  };
  
  // Override daily usage restriction for jlcookie20
  useEffect(() => {
    if (isJLCookie) {
      setDailyGameUsed(false);
    }
  }, [isJLCookie, user]);
  
  // Check if user has already played a game today (limit of one game per login)
  // Users with special access (jlcookie20) bypass this restriction
  useEffect(() => {
    // Special access for jlcookie20 - always allow access to games
    if (user?.username === 'jlcookie20') {
      setDailyGameUsed(false);
      // Clear any existing restriction
      localStorage.removeItem('lastGamePlayedDate');
      return;
    }
    
    // Check with server if user has played a game today
    const checkGameHistory = async () => {
      try {
        const gameHistory = await apiRequest('/api/games/history', {
          method: 'GET'
        });
        
        if (Array.isArray(gameHistory)) {
          // Check if any game was played today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const playedToday = gameHistory.some(game => {
            if (!game.completedAt) return false;
            const gameDate = new Date(game.completedAt);
            return gameDate.toDateString() === today.toDateString();
          });
          
          setDailyGameUsed(playedToday);
          
          // Update localStorage to match server state
          if (playedToday) {
            localStorage.setItem('lastGamePlayedDate', today.toDateString());
          } else {
            localStorage.removeItem('lastGamePlayedDate');
          }
        }
      } catch (error) {
        console.error("Failed to fetch game history", error);
      }
    };
    
    checkGameHistory();
  }, [user?.username]);
  
  // Use the new points reward hook
  const { awardPoints, isPending } = usePointsReward({
    redirectDelay: 1200, // Wait a bit longer before redirecting
    onSuccess: () => {
      // Mark the game as used for today on success
      setDailyGameUsed(true);
    }
  });
  
  // Points reward handler for all games
  const handlePointsReward = (points: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to earn points",
        variant: "destructive",
      });
      return;
    }
    
    // Use our new hook to award the points
    awardPoints(points);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Header />
      
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent mr-4">
              Teacher Rewards
            </h1>
            <Link to="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Bonus Games Button - Core Values Style */}
            <div 
              className={`group relative overflow-hidden transform hover:scale-105 transition-all ${hasCompletedActivity && !dailyGameUsed ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 opacity-90'} text-white font-bold py-3 px-6 rounded-xl ${hasCompletedActivity && !dailyGameUsed ? 'shadow-[0_5px_0_rgb(76,29,149)] hover:shadow-[0_3px_0_rgb(76,29,149)] active:shadow-[0_0px_0_rgb(76,29,149)] active:translate-y-1' : ''} border-2 ${hasCompletedActivity && !dailyGameUsed ? 'border-purple-200' : 'border-gray-400'} cursor-pointer`}
              onClick={() => hasCompletedActivity && !dailyGameUsed && setActiveTab("games")}
            >
              {/* Pixel-art style decorations */}
              <div className={`absolute -bottom-1 -left-1 w-3 h-3 ${hasCompletedActivity && !dailyGameUsed ? 'bg-pink-400' : 'bg-gray-400'} rounded`}></div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${hasCompletedActivity && !dailyGameUsed ? 'bg-pink-400' : 'bg-gray-400'} rounded`}></div>
              <div className={`absolute -top-1 -left-1 w-3 h-3 ${hasCompletedActivity && !dailyGameUsed ? 'bg-pink-400' : 'bg-gray-400'} rounded`}></div>
              <div className={`absolute -top-1 -right-1 w-3 h-3 ${hasCompletedActivity && !dailyGameUsed ? 'bg-pink-400' : 'bg-gray-400'} rounded`}></div>
              
              {/* Shimmer effect */}
              {hasCompletedActivity && !dailyGameUsed && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-300/30 to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-400/0 via-pink-400/40 to-pink-400/0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity"></div>
                </>
              )}
              
              <div className="relative flex items-center justify-center">
                <span className={`mr-3 ${hasCompletedActivity && !dailyGameUsed ? 'text-yellow-200' : 'text-gray-300'} text-xl`}>🎮</span>
                <span className={`${hasCompletedActivity && !dailyGameUsed ? 'text-white' : 'text-gray-100'} text-sm md:text-base tracking-wider pb-1`}>
                  BONUS GAMES
                </span>
                <span className={`ml-3 ${hasCompletedActivity && !dailyGameUsed ? 'text-yellow-200' : 'text-gray-300'} text-xl`}>🎰</span>
              </div>
              
              {!hasCompletedActivity && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">LOCKED</div>
              )}
              
              {dailyGameUsed && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">USED</div>
              )}
              
              {hasCompletedActivity && !dailyGameUsed && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">PLAY!</div>
              )}
            </div>
            
            {/* Rewards History Button - Core Values Style */}
            <div 
              className="group relative overflow-hidden transform hover:scale-105 transition-all bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_5px_0_rgb(194,65,12)] hover:shadow-[0_3px_0_rgb(194,65,12)] active:shadow-[0_0px_0_rgb(194,65,12)] active:translate-y-1 border-2 border-orange-200 cursor-pointer"
              onClick={() => setActiveTab("rewards")}
            >
              {/* Pixel-art style decorations */}
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 rounded"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded"></div>
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-400 rounded"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/30 to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/0 via-amber-400/40 to-amber-400/0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity"></div>
              
              <div className="relative flex items-center justify-center">
                <span className="mr-3 text-yellow-200 text-xl">🏆</span>
                <span className="text-white text-sm md:text-base tracking-wider pb-1">
                  REWARDS HISTORY
                </span>
                <span className="ml-3 text-yellow-200 text-xl">💎</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Left column - 2/3 width */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500">
                <Gift className="h-5 w-5" />
              </span>
              <p className="text-muted-foreground">
                Celebrate your learning journey with these fun rewards!
              </p>
              <span className="text-amber-500">
                <Trophy className="h-5 w-5" />
              </span>
            </div>
            
            {!hasCompletedActivity && (
              <Card className="mt-4 border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Calendar className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Complete an activity first</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        Complete at least one learning activity today to unlock bonus games and earn rewards.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          
            {hasCompletedActivity && dailyGameUsed && (
              <Card className="mt-4 border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Clock className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-purple-800">Daily game limit reached</h3>
                      <p className="text-purple-700 text-sm mt-1">
                        You've already played a bonus game today. Return tomorrow for another chance to win points!
                      </p>
                      
                      {/* Special reset button only for jlcookie20 */}
                      {isJLCookie && (
                        <div className="mt-4">
                          <Button 
                            onClick={resetBonusGames}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                            size="sm"
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reset Bonus Games (Special Access)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right column - 1/3 width - Streak information */}
          <div className="md:col-span-1">
            <Card className="border-blue-200 shadow-md">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold">Login Streak</CardTitle>
                  <Badge className="bg-blue-700 hover:bg-blue-800">
                    <Flame className="h-3 w-3 mr-1 text-yellow-300" /> ACTIVE
                  </Badge>
                </div>
                <CardDescription className="text-blue-100">
                  Keep your streak alive for bonus points!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <StreakRewardsSummary streak={user?.streak || 0} />
                
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Medal className="h-4 w-4 mr-1 text-amber-500" />
                    Login daily to earn 2-5 points each day
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="hidden">
            <TabsTrigger value="games" disabled={!hasCompletedActivity}>
              Bonus Games
            </TabsTrigger>
            <TabsTrigger value="rewards" disabled={!hasCompletedActivity}>
              Rewards History
            </TabsTrigger>
          </TabsList>
          
          {/* Game selection tab */}
          <TabsContent value="games" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lucky Slots - Enhanced Casino Style */}
              <Card className="shadow-2xl hover:shadow-glow-red transition-all transform hover:scale-105 border-2 border-red-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-red-600 to-amber-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-amber-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Lucky Slots</CardTitle>
                    <Badge className="bg-amber-700 border-amber-500 hover:bg-amber-800 animate-pulse-slow">
                      <Star className="h-3 w-3 mr-1 text-yellow-300" /> HOT
                    </Badge>
                  </div>
                  <CardDescription className="text-amber-200">
                    Spin for jackpot points!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-amber-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Slot machine lights */}
                    <div className="absolute top-0 left-0 w-full flex justify-center">
                      <div className="flex space-x-2 py-1">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Slot machine display */}
                    <div className="flex flex-col items-center">
                      <div className="grid grid-cols-3 gap-2 bg-black p-3 rounded-md border border-amber-800 shadow-lg">
                        <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-md p-3 flex items-center justify-center shadow-inner">
                          <Cherry className="h-6 w-6 text-red-500 animate-pulse-slow" />
                        </div>
                        <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-md p-3 flex items-center justify-center shadow-inner">
                          <Diamond className="h-6 w-6 text-amber-500 animate-bounce" style={{ animationDuration: '2s' }} />
                        </div>
                        <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-md p-3 flex items-center justify-center shadow-inner">
                          <Star className="h-6 w-6 text-yellow-500 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-center font-bold text-amber-500">
                        WIN UP TO 20 POINTS!
                      </div>
                    </div>
                    
                    {/* Slot machine decoration */}
                    <div className="absolute top-6 right-2 h-24 w-4 flex flex-col items-center">
                      <div className="w-4 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-t-md"></div>
                      <div className="w-2 h-14 bg-gradient-to-b from-gray-300 to-gray-500"></div>
                      <div className="w-4 h-4 rounded-full bg-gradient-to-b from-red-400 to-red-600"></div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-amber-700"
                    disabled={!hasCompletedActivity || (dailyGameUsed && !isJLCookie)}
                    onClick={() => setActiveTab("game-slot")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:from-red-500 group-hover:to-amber-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Sparkles className="h-4 w-4 mr-2" />
                      SPIN & WIN
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && !isJLCookie && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Scratch Card - Enhanced Game Style */}
              <Card className="shadow-2xl hover:shadow-glow-green transition-all transform hover:scale-105 border-2 border-green-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Scratch Card</CardTitle>
                    <Badge className="bg-emerald-700 border-emerald-500 hover:bg-emerald-800">
                      NEW
                    </Badge>
                  </div>
                  <CardDescription className="text-green-100">
                    Match symbols to win points!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-green-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Scratch card display */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-2 w-3/4 h-3/4 p-2 bg-green-800 rounded-md border border-green-600 shadow-lg">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="bg-gradient-to-b from-green-200 to-green-300 rounded-md flex items-center justify-center shadow-inner overflow-hidden"
                          style={{ 
                            opacity: i % 2 === 0 ? 0.9 : 0.7,
                            transform: i % 3 === 0 ? 'rotate(1deg)' : i % 3 === 1 ? 'rotate(-1deg)' : 'rotate(0deg)'
                          }}
                        >
                          {i === 4 && (
                            <Coins className="h-5 w-5 text-yellow-500 animate-pulse" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Decorative scratch marks */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                      <div className="absolute top-[20%] left-[35%] w-[30%] h-2 bg-gray-200 rounded-full transform rotate-45"></div>
                      <div className="absolute top-[50%] left-[25%] w-[20%] h-2 bg-gray-200 rounded-full transform -rotate-30"></div>
                      <div className="absolute bottom-[30%] right-[25%] w-[25%] h-2 bg-gray-200 rounded-full transform rotate-15"></div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-green-700"
                    disabled={!hasCompletedActivity || (dailyGameUsed && !isJLCookie)}
                    onClick={() => setActiveTab("game-scratch")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:from-green-500 group-hover:to-emerald-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 15L17 7M15 15L12 12M9 9L5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      SCRATCH & WIN
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && !isJLCookie && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Mystery Box - Enhanced Treasure Style */}
              <Card className="shadow-2xl hover:shadow-glow-blue transition-all transform hover:scale-105 border-2 border-blue-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Mystery Box</CardTitle>
                    <Badge className="bg-blue-700 border-blue-500 hover:bg-blue-800 animate-pulse-slow">
                      <Gem className="h-3 w-3 mr-1 text-cyan-300" /> PREMIUM
                    </Badge>
                  </div>
                  <CardDescription className="text-blue-100">
                    Unlock treasures and points!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-blue-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Mystery box display */}
                    <div className="relative w-24 h-24">
                      {/* Treasure chest */}
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <div className="w-20 h-16 bg-gradient-to-b from-amber-700 to-amber-900 rounded-md relative border-2 border-amber-600">
                          {/* Chest lid */}
                          <div className="absolute -top-4 left-0 w-full h-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-md border-2 border-amber-500 origin-bottom transform transition-all"></div>
                          
                          {/* Chest lock */}
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-600 rounded-sm border border-yellow-400"></div>
                          
                          {/* Chest glow */}
                          <div className="absolute inset-0 w-full h-full opacity-60 animate-pulse-slow">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating particles */}
                      <div className="absolute top-0 left-0 w-full h-full">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-70 animate-float-particle"
                            style={{ 
                              left: `${15 + (i * 15)}%`, 
                              top: `${50 + (i % 3 * 10)}%`,
                              animationDelay: `${i * 0.5}s`,
                              animationDuration: `${3 + (i % 2)}s`
                            }}
                          ></div>
                        ))}
                      </div>
                      
                      {/* Mystery sparkles */}
                      <div className="absolute -top-2 -right-2 text-yellow-400 animate-ping">✨</div>
                      <div className="absolute -bottom-2 -left-2 text-purple-400 animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-blue-700"
                    disabled={!hasCompletedActivity || (dailyGameUsed && !isJLCookie)}
                    onClick={() => setActiveTab("game-mystery")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Package className="h-4 w-4 mr-2" />
                      OPEN TREASURE
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && !isJLCookie && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Rewards history tab */}
          <TabsContent value="rewards" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Rewards History</CardTitle>
                <CardDescription>
                  Track your points and rewards earned from bonus games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                        <Coins className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Mystery Box Treasure</p>
                        <p className="text-sm text-muted-foreground">May 23, 2025</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600">+5 Points</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Scratch Card Win</p>
                        <p className="text-sm text-muted-foreground">May 22, 2025</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600">+10 Points</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-full text-red-600">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Lucky Slots Jackpot</p>
                        <p className="text-sm text-muted-foreground">May 21, 2025</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600">+15 Points</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Streak Protection Used</p>
                        <p className="text-sm text-muted-foreground">May 20, 2025</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600">Streak Saved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lucky Slots Game Tab */}
          <TabsContent value="game-slot" className="mt-6">
            <div className="flex flex-col items-center max-w-xl mx-auto">
              <Card className="w-full border-amber-300 bg-gradient-to-b from-gray-900 to-black shadow-glow-red">
                <CardHeader className="bg-gradient-to-r from-red-600 to-amber-600 text-white">
                  <CardTitle className="text-center">Lucky Slots</CardTitle>
                  <CardDescription className="text-center text-white/80">Spin the reels to win points!</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <LuckySlots 
                      onWin={handlePointsReward}
                      onClose={() => setActiveTab("games")}
                      isDisabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Scratch Card Game Tab */}
          <TabsContent value="game-scratch" className="mt-6">
            <div className="flex flex-col items-center max-w-xl mx-auto">
              <Card className="w-full border-green-300 bg-gradient-to-b from-gray-900 to-black shadow-glow-green">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="text-center">Scratch Card</CardTitle>
                  <CardDescription className="text-center text-white/80">Scratch to reveal prizes!</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <ScratchCard 
                      onWin={handlePointsReward}
                      onClose={() => setActiveTab("games")}
                      isDisabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Mystery Box Game Tab */}
          <TabsContent value="game-mystery" className="mt-6">
            <div className="flex flex-col items-center max-w-xl mx-auto">
              <Card className="w-full border-blue-300 bg-gradient-to-b from-gray-900 to-black shadow-glow-blue">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="text-center">Mystery Box</CardTitle>
                  <CardDescription className="text-center text-white/80">Open the treasure chest for rewards!</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <MysteryBox 
                      onWin={handlePointsReward}
                      onClose={() => setActiveTab("games")}
                      isDisabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}