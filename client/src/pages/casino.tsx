import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
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
  Sparkles
} from "lucide-react";

// Import our gamification components from the barrel file
import { 
  LuckySlots, 
  ScratchCard, 
  MysteryBox, 
  DailyRewards, 
  StreakProtection 
} from "@/components";

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
  
  // Check if user has completed any activities today
  const hasCompletedActivity = progress.some((p: any) => p.completed);
  
  // Check if user has already played a game today (limit of one game per login)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastPlayedDate = localStorage.getItem('lastGamePlayedDate');
    if (lastPlayedDate === today) {
      setDailyGameUsed(true);
    }
  }, []);
  
  // Points reward handler for all games
  const handlePointsReward = async (points: number) => {
    try {
      // Mark that the user has played a game today
      const today = new Date().toDateString();
      localStorage.setItem('lastGamePlayedDate', today);
      setDailyGameUsed(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Record game play first to mark it as used for the day
      await fetch('/api/games/played/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score: points * 10, // Score is just a multiplier of points for tracking
          timeTaken: 30 // Default time spent in seconds
        }),
      });
      
      toast({
        title: "Points Added!",
        description: `${points} points have been added to your account!`,
      });
      
      // Invalidate queries to refresh user data across all components
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/history"] });
      
      // Redirect to dashboard to see updated points
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Error",
        description: "Could not award points. Please try again.",
        variant: "destructive",
      });
    }
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
        
        <div className="mt-4">
          <div className="flex items-center gap-2">
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
                  <div>
                    <h3 className="font-medium text-purple-800">Daily game limit reached</h3>
                    <p className="text-purple-700 text-sm mt-1">
                      You've already played a bonus game today. Return tomorrow for another chance to win points!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                    disabled={!hasCompletedActivity || dailyGameUsed}
                    onClick={() => setActiveTab("game-slot")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:from-red-500 group-hover:to-amber-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Sparkles className="h-4 w-4 mr-2" />
                      SPIN & WIN
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Scratch Card - Enhanced Casino Style */}
              <Card className="shadow-2xl hover:shadow-glow-blue transition-all transform hover:scale-105 border-2 border-blue-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Scratch Cards</CardTitle>
                    <Badge className="bg-purple-700 border-purple-500 hover:bg-purple-800">
                      <Sparkles className="h-3 w-3 mr-1 text-yellow-300" /> WIN
                    </Badge>
                  </div>
                  <CardDescription className="text-blue-200">
                    Scratch & reveal treasures!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-blue-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Scratch card display */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-md shadow-lg flex items-center justify-center overflow-hidden">
                      {/* Card design */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-purple-300 opacity-50"></div>
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-100/30">
                          <Gift className="h-12 w-12 text-blue-600 drop-shadow-lg" />
                          <div className="mt-2 text-blue-900 font-bold text-lg">?</div>
                        </div>
                      </div>
                      
                      {/* Scratched layer */}
                      <div className="absolute inset-0 bg-gray-300 opacity-70 flex items-center justify-center">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center -rotate-6">
                              <div className="text-gray-800 font-bold text-xl">SCRATCH</div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center rotate-6 translate-y-6">
                              <div className="text-gray-800 font-bold text-xl">HERE</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scratch marks */}
                      <div className="absolute top-3 right-4 h-10 w-24 bg-blue-300/10 rounded-full transform rotate-45"></div>
                      <div className="absolute bottom-3 left-4 h-8 w-20 bg-blue-300/10 rounded-full transform -rotate-30"></div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-2 left-2">
                      <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Award className="h-4 w-4 text-purple-400 animate-pulse" style={{animationDelay: '0.5s'}} />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-blue-700"
                    disabled={!hasCompletedActivity || dailyGameUsed}
                    onClick={() => setActiveTab("game-scratch")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Ticket className="h-4 w-4 mr-2" />
                      SCRATCH NOW
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Mystery Box - Enhanced Casino Style */}
              <Card className="shadow-2xl hover:shadow-glow-amber transition-all transform hover:scale-105 border-2 border-amber-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Mystery Box</CardTitle>
                    <Badge className="bg-amber-700 border-amber-500 hover:bg-amber-800">
                      <Gift className="h-3 w-3 mr-1 text-yellow-300" /> SURPRISE
                    </Badge>
                  </div>
                  <CardDescription className="text-amber-200">
                    Unlock mysterious prizes!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-amber-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Mystery box display */}
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg shadow-2xl relative overflow-hidden">
                      {/* Box lid */}
                      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-br from-amber-600 to-amber-800 rounded-t-md border-b-2 border-amber-500"></div>
                      
                      {/* Box highlights */}
                      <div className="absolute top-[33%] left-0 right-0 h-1 bg-amber-500"></div>
                      <div className="absolute inset-y-0 left-0 w-1 bg-amber-500"></div>
                      <div className="absolute inset-y-0 right-0 w-1 bg-amber-500"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                      
                      {/* Lock */}
                      <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-400 rounded-full border-2 border-amber-800"></div>
                      
                      {/* Magical glow */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-amber-400/30 rounded-full blur-md animate-pulse"></div>
                      </div>
                      
                      {/* Sparkles */}
                      <div className="absolute top-1/4 left-1/4 animate-ping">
                        <Sparkles className="h-3 w-3 text-yellow-400" />
                      </div>
                      <div className="absolute bottom-1/4 right-1/4 animate-ping" style={{animationDelay: '0.7s'}}>
                        <Sparkles className="h-3 w-3 text-yellow-400" />
                      </div>
                    </div>
                    
                    {/* Rays of light */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-amber-700"
                    disabled={!hasCompletedActivity || dailyGameUsed}
                    onClick={() => setActiveTab("game-mystery")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 group-hover:from-amber-500 group-hover:to-orange-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Package className="h-4 w-4 mr-2" />
                      OPEN BOX
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Streak Protection - Enhanced Casino Style */}
              <Card className="shadow-2xl hover:shadow-glow-indigo transition-all transform hover:scale-105 border-2 border-indigo-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Streak Guardian</CardTitle>
                    <Badge className="bg-indigo-700 border-indigo-500 hover:bg-indigo-800">
                      <Shield className="h-3 w-3 mr-1 text-blue-300" /> PROTECT
                    </Badge>
                  </div>
                  <CardDescription className="text-indigo-200">
                    Shield your daily streaks!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-indigo-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Shield display */}
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center relative">
                        {/* Shield aura */}
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse filter blur-md"></div>
                        
                        {/* Shield image */}
                        <div className="relative z-10">
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center shadow-2xl">
                            <Shield className="h-10 w-10 text-white" />
                          </div>
                        </div>
                        
                        {/* Shield ring */}
                        <div className="absolute inset-0 border-2 border-indigo-400/30 rounded-full animate-spin-slow"></div>
                        
                        {/* Magical runes */}
                        <div className="absolute inset-0">
                          <div className="w-28 h-28 rounded-full border border-indigo-500/20 flex items-center justify-center animate-reverse-spin-slow">
                            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                              <div 
                                key={i} 
                                className="absolute w-1 h-1 bg-indigo-400 rounded-full"
                                style={{ 
                                  transform: `rotate(${deg}deg) translateY(-12px)`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Text */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
                        <p className="text-xs font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                          STREAK PROTECTOR
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-indigo-700"
                    disabled={!hasCompletedActivity || dailyGameUsed}
                    onClick={() => setActiveTab("game-streak")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Shield className="h-4 w-4 mr-2" />
                      ACTIVATE SHIELD
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-4">
                        <Clock className="h-10 w-10 text-white/70 mx-auto mb-2" />
                        <p className="text-white font-bold">Come back tomorrow!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Daily Rewards - Enhanced Casino Style */}
              <Card className="shadow-2xl hover:shadow-glow-pink transition-all transform hover:scale-105 border-2 border-pink-500/30 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
                <CardHeader className="relative pb-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-400"></div>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Daily Rewards</CardTitle>
                    <Badge className="bg-pink-700 border-pink-500 hover:bg-pink-800">
                      <Calendar className="h-3 w-3 mr-1 text-white" /> DAILY
                    </Badge>
                  </div>
                  <CardDescription className="text-pink-200">
                    Claim bonus points daily!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative">
                  <div className="h-40 bg-gradient-to-b from-black to-gray-900 rounded-md border-2 border-pink-700 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
                    {/* Calendar display */}
                    <div className="w-32 h-32 bg-gradient-to-br from-white to-gray-100 rounded-md shadow-2xl relative overflow-hidden">
                      {/* Calendar header */}
                      <div className="h-8 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">MAY 2025</span>
                      </div>
                      
                      {/* Calendar body */}
                      <div className="p-2">
                        <div className="grid grid-cols-7 gap-1">
                          {/* Week days */}
                          {['S','M','T','W','T','F','S'].map((day, i) => (
                            <div key={i} className="h-3 flex items-center justify-center">
                              <span className="text-[6px] text-gray-500">{day}</span>
                            </div>
                          ))}
                          
                          {/* Days - first row (empty + days) */}
                          {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-3 flex items-center justify-center">
                              {i >= 3 ? (
                                <span className="text-[6px] text-gray-700">{i-2}</span>
                              ) : null}
                            </div>
                          ))}
                          
                          {/* Days - second row */}
                          {[...Array(7)].map((_, i) => (
                            <div key={i+7} className="h-3 flex items-center justify-center">
                              <span className="text-[6px] text-gray-700">{i+5}</span>
                            </div>
                          ))}
                          
                          {/* Days - third row with today */}
                          {[...Array(7)].map((_, i) => (
                            <div key={i+14} className={`h-3 flex items-center justify-center ${i+12 === 16 ? 'bg-pink-500 rounded-full' : ''}`}>
                              <span className={`text-[6px] ${i+12 === 16 ? 'text-white' : 'text-gray-700'}`}>{i+12}</span>
                            </div>
                          ))}
                          
                          {/* More days */}
                          {[...Array(14)].map((_, i) => (
                            <div key={i+21} className="h-3 flex items-center justify-center">
                              <span className="text-[6px] text-gray-700">{i+19 <= 31 ? i+19 : i+19-31}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Reward marker */}
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <div className="flex items-center">
                          <Gift className="h-3 w-3 text-white mr-1" />
                          <span className="text-white text-[8px] font-bold">DAILY REWARDS</span>
                        </div>
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-white/0 opacity-30"></div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-3 left-3">
                      <Gift className="h-4 w-4 text-pink-400 animate-bounce" style={{animationDuration: '3s'}} />
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Coins className="h-4 w-4 text-yellow-400 animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}} />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full relative overflow-hidden group border-2 border-pink-700"
                    disabled={!hasCompletedActivity || dailyGameUsed}
                    onClick={() => setActiveTab("game-daily")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 group-hover:from-pink-500 group-hover:to-rose-500"></span>
                    <span className="relative flex items-center justify-center text-white font-bold tracking-wider py-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      CLAIM REWARD
                    </span>
                    <span className="absolute top-0 right-0 w-12 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-100%] animate-shine"></span>
                  </Button>
                  
                  {dailyGameUsed && (
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
                <CardTitle>Your Reward History</CardTitle>
                <CardDescription>
                  Recent points and rewards you've earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="p-2 bg-green-100 rounded-full mr-3">
                        <Coins className="h-4 w-4 text-green-600" />
                      </span>
                      <div>
                        <h4 className="font-medium">Daily Login Bonus</h4>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Today at 9:15 AM
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">+3 points</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="p-2 bg-amber-100 rounded-full mr-3">
                        <Star className="h-4 w-4 text-amber-600" />
                      </span>
                      <div>
                        <h4 className="font-medium">Lucky Slots Win</h4>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Yesterday at 2:30 PM
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500">+5 points</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="p-2 bg-blue-100 rounded-full mr-3">
                        <Trophy className="h-4 w-4 text-blue-600" />
                      </span>
                      <div>
                        <h4 className="font-medium">Module Completion</h4>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          2 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500">+10 points</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Game content tabs */}
          <TabsContent value="game-slot" className="mt-6">
            <div className="max-w-md mx-auto">
              <Card className="w-full border shadow-lg overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-red-600 to-yellow-600 text-white">
                  <CardTitle className="text-2xl font-bold">Lucky Slots</CardTitle>
                  <CardDescription className="text-amber-100">
                    Match symbols to win points!
                  </CardDescription>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge variant="outline" className="bg-white/20 text-white border-white">
                      <Gift className="h-3 w-3 mr-1" /> Daily Spins: 3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Casino machine with enhanced visuals */}
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
                      {/* Reel 1 */}
                      <div className="relative bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-gray-400 rounded-md p-2 flex items-center justify-center shadow-inner w-20 h-20" style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)" }}>
                        <Cherry className="h-8 w-8 text-red-500" />
                      </div>
                      
                      {/* Reel 2 */}
                      <div className="relative bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-gray-400 rounded-md p-2 flex items-center justify-center shadow-inner w-20 h-20" style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)" }}>
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                      
                      {/* Reel 3 */}
                      <div className="relative bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-gray-400 rounded-md p-2 flex items-center justify-center shadow-inner w-20 h-20" style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)" }}>
                        <Gift className="h-8 w-8 text-blue-500" />
                      </div>
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
                  
                  {/* Prize table with enhanced casino theme */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-md mb-4 w-full text-sm shadow-md">
                    <h3 className="font-bold text-amber-800 mb-2 text-center bg-gradient-to-r from-amber-600 to-red-600 text-white p-2 rounded-t-md -mt-4 -mx-4 shadow-sm">
                      JACKPOT PAYOUT TABLE
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Diamond className="h-6 w-6 text-cyan-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">3× Diamonds</span>
                          <div className="text-amber-600 font-bold">20 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Sparkles className="h-6 w-6 text-pink-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">3× Sparkles</span>
                          <div className="text-amber-600 font-bold">10 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Award className="h-6 w-6 text-amber-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">3× Awards</span>
                          <div className="text-amber-600 font-bold">7 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Gem className="h-6 w-6 text-purple-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">3× Gems</span>
                          <div className="text-amber-600 font-bold">5 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm col-span-2 transition-transform hover:scale-105">
                        <Star className="h-6 w-6 text-yellow-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Any 2 matching symbols</span>
                          <div className="text-amber-600 font-bold">1-3 POINTS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Casino-style button with flashing effect */}
                  <div className="relative mb-4">
                    <Button 
                      variant="default" 
                      onClick={() => toast({
                        title: "Coming Soon!",
                        description: "The slot machine will be available after your next activity!",
                      })}
                      className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 
                        text-white w-full relative border-2 border-amber-700 shadow-xl
                        animate-pulse py-6 font-bold tracking-wide text-xl"
                      size="lg"
                    >
                      <span className="relative z-10">
                        SPIN & WIN
                        <span className="absolute -right-8 top-0 rotate-12 bg-yellow-300 text-red-600 text-xs px-2 py-1 rounded-md font-bold transform -translate-y-1/2">
                          !
                        </span>
                      </span>
                    </Button>
                    
                    {/* Button shine effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine" style={{ transform: "skewX(-20deg)" }}></div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("games")}
                    className="w-full"
                  >
                    Back to Games
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="game-scratch" className="mt-6">
            <div className="max-w-md mx-auto">
              <Card className="w-full border shadow-lg overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="text-2xl font-bold">Lucky Scratch Card</CardTitle>
                  <CardDescription className="text-blue-100">
                    Scratch to reveal amazing rewards!
                  </CardDescription>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge variant="outline" className="bg-white/20 text-white border-white">
                      <Gift className="h-3 w-3 mr-1" /> Daily Scratches: 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Enhanced scratch card visuals */}
                  <div className="bg-gradient-to-br from-blue-800 to-purple-900 p-6 rounded-lg border-4 border-blue-600 shadow-inner mb-4 w-full relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-blue-700 to-purple-700 flex items-center justify-center">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Scratch card area */}
                    <div className="mt-8 relative bg-gradient-to-br from-slate-200 to-white rounded-lg p-4 shadow-md w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 absolute"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center z-10">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full"></div>
                            <Gift className="h-12 w-12 text-blue-600 relative z-20" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full transform rotate-12 animate-pulse">
                          <Sparkles className="h-3 w-3" />
                        </div>
                        <div className="absolute bottom-4 right-4 p-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full transform -rotate-12 animate-pulse" style={{animationDelay: '1s'}}>
                          <Award className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gray-300 opacity-90 rounded-lg"></div>
                    </div>
                    
                    {/* Scratch instructions */}
                    <div className="flex justify-center mt-2 text-center">
                      <p className="text-xs text-blue-100 bg-blue-900/50 px-2 py-1 rounded-full">
                        Scratch to reveal your prize!
                      </p>
                    </div>
                  </div>
                  
                  {/* Prize table with enhanced casino theme */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-md mb-4 w-full text-sm shadow-md">
                    <h3 className="font-bold text-blue-800 mb-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-t-md -mt-4 -mx-4 shadow-sm">
                      POSSIBLE PRIZES
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Award className="h-6 w-6 text-yellow-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Jackpot Prize</span>
                          <div className="text-blue-600 font-bold">20 POINTS!</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Sparkles className="h-6 w-6 text-purple-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Rare Find</span>
                          <div className="text-blue-600 font-bold">10-15 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105 col-span-2">
                        <Gift className="h-6 w-6 text-blue-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Standard Prize</span>
                          <div className="text-blue-600 font-bold">1-5 POINTS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scratch button with flashing effect */}
                  <div className="relative mb-4">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        // Mark that the user has played a game today
                        const today = new Date().toDateString();
                        localStorage.setItem('lastGamePlayedDate', today);
                        
                        toast({
                          title: "Congratulations!",
                          description: "You won 5 points with your scratch card!",
                        });
                        
                        // Refresh to show updated points in 2 seconds
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                        text-white w-full relative border-2 border-blue-700 shadow-xl
                        animate-pulse py-6 font-bold tracking-wide text-xl"
                      size="lg"
                      disabled={dailyGameUsed}
                    >
                      <span className="relative z-10">
                        SCRATCH NOW
                        <span className="absolute -right-8 top-0 rotate-12 bg-yellow-300 text-purple-600 text-xs px-2 py-1 rounded-md font-bold transform -translate-y-1/2">
                          !
                        </span>
                      </span>
                    </Button>
                    
                    {/* Button shine effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine" style={{ transform: "skewX(-20deg)" }}></div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("games")}
                    className="w-full"
                  >
                    Back to Games
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="game-mystery" className="mt-6">
            <div className="max-w-md mx-auto">
              <Card className="w-full border shadow-lg overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <CardTitle className="text-2xl font-bold">Mystery Treasure Box</CardTitle>
                  <CardDescription className="text-amber-100">
                    Open a magical box of mystery rewards!
                  </CardDescription>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge variant="outline" className="bg-white/20 text-white border-white">
                      <Gift className="h-3 w-3 mr-1" /> Daily Boxes: 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Mystery box with enhanced visuals */}
                  <div className="bg-gradient-to-br from-amber-800 to-orange-900 p-6 rounded-lg border-4 border-amber-600 shadow-inner mb-4 w-full relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-amber-700 to-orange-700 flex items-center justify-center">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Mystery box display */}
                    <div className="mt-8 flex items-center justify-center">
                      <div className="relative">
                        {/* Base box */}
                        <div className="w-48 h-48 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg shadow-2xl relative overflow-hidden">
                          {/* Box lid */}
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 rounded-t-lg h-1/3 transform origin-bottom transition-transform duration-500"></div>
                          
                          {/* Box edges */}
                          <div className="absolute inset-x-0 top-1/3 h-2 bg-amber-400"></div>
                          <div className="absolute left-0 top-0 w-2 h-full bg-amber-500"></div>
                          <div className="absolute right-0 top-0 w-2 h-full bg-amber-500"></div>
                          <div className="absolute inset-x-0 bottom-0 h-2 bg-amber-500"></div>
                          
                          {/* Box lock */}
                          <div className="absolute top-1/6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-300 rounded-full border-4 border-amber-800 z-10"></div>
                          
                          {/* Sparkle effects */}
                          <div className="absolute top-1/4 left-1/4 text-yellow-300 animate-ping">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="absolute bottom-1/4 right-1/4 text-yellow-300 animate-ping" style={{animationDelay: '1s'}}>
                            <Sparkles className="h-4 w-4" />
                          </div>
                        </div>
                        
                        {/* Magical glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-400 opacity-30 rounded-lg filter blur-xl animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Mystery box instructions */}
                    <div className="flex justify-center mt-4 text-center">
                      <p className="text-xs text-amber-100 bg-amber-900/50 px-2 py-1 rounded-full">
                        Click to open your mystery box!
                      </p>
                    </div>
                  </div>
                  
                  {/* Prize table with enhanced casino theme */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-md mb-4 w-full text-sm shadow-md">
                    <h3 className="font-bold text-amber-800 mb-2 text-center bg-gradient-to-r from-amber-600 to-orange-600 text-white p-2 rounded-t-md -mt-4 -mx-4 shadow-sm">
                      POTENTIAL TREASURES
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Award className="h-6 w-6 text-amber-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Golden Treasure</span>
                          <div className="text-amber-600 font-bold">10-20 POINTS!</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105">
                        <Gift className="h-6 w-6 text-orange-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Special Prize</span>
                          <div className="text-amber-600 font-bold">5-10 POINTS</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md shadow-sm transition-transform hover:scale-105 col-span-2">
                        <Package className="h-6 w-6 text-amber-500 mr-2" />
                        <div>
                          <span className="text-gray-800 font-medium">Mystery Reward</span>
                          <div className="text-amber-600 font-bold">1-5 POINTS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Open box button with flashing effect */}
                  <div className="relative mb-4">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        // Mark that the user has played a game today
                        const today = new Date().toDateString();
                        localStorage.setItem('lastGamePlayedDate', today);
                        
                        toast({
                          title: "Amazing Find!",
                          description: "You opened a mystery box and found 7 points!",
                        });
                        
                        // Refresh to show updated points in 2 seconds
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                        text-white w-full relative border-2 border-amber-700 shadow-xl
                        animate-pulse py-6 font-bold tracking-wide text-xl"
                      size="lg"
                      disabled={dailyGameUsed}
                    >
                      <span className="relative z-10">
                        OPEN TREASURE BOX
                        <span className="absolute -right-8 top-0 rotate-12 bg-yellow-300 text-orange-600 text-xs px-2 py-1 rounded-md font-bold transform -translate-y-1/2">
                          !
                        </span>
                      </span>
                    </Button>
                    
                    {/* Button shine effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine" style={{ transform: "skewX(-20deg)" }}></div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("games")}
                    className="w-full"
                  >
                    Back to Games
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="game-daily" className="mt-6">
            <div className="max-w-md mx-auto">
              <DailyRewards onClose={() => setActiveTab("games")} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-streak" className="mt-6">
            <div className="max-w-md mx-auto">
              <Card className="w-full border shadow-lg overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardTitle className="text-2xl font-bold">Streak Guardian</CardTitle>
                  <CardDescription className="text-indigo-100">
                    Protect your daily streaks from being broken!
                  </CardDescription>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge variant="outline" className="bg-white/20 text-white border-white">
                      <Shield className="h-3 w-3 mr-1" /> Shields Available: 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Streak protection with enhanced visuals */}
                  <div className="bg-gradient-to-br from-indigo-800 to-purple-900 p-6 rounded-lg border-4 border-indigo-600 shadow-inner mb-4 w-full relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-indigo-700 to-purple-700 flex items-center justify-center">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Shield display */}
                    <div className="mt-8 flex items-center justify-center">
                      <div className="relative">
                        {/* Magical shield */}
                        <div className="w-48 h-48 rounded-full flex items-center justify-center relative">
                          {/* Inner glow */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 animate-pulse"></div>
                          
                          {/* Shield image */}
                          <div className="relative z-10 transform transition-transform duration-300 hover:scale-110">
                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center shadow-2xl">
                              <Shield className="h-16 w-16 text-white" />
                            </div>
                            
                            {/* Shield outer ring */}
                            <div className="absolute inset-0 border-4 border-indigo-400 rounded-full animate-spin-slow"></div>
                            
                            {/* Protection aura */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full filter blur-md"></div>
                          </div>
                          
                          {/* Magical runes */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-2 border-indigo-400/30 flex items-center justify-center animate-reverse-spin-slow">
                              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                <div 
                                  key={i} 
                                  className="absolute w-2 h-2 bg-indigo-400 rounded-full"
                                  style={{ 
                                    transform: `rotate(${deg}deg) translateY(-20px)`,
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Streak protection instructions */}
                    <div className="flex justify-center mt-4 text-center">
                      <p className="text-xs text-indigo-100 bg-indigo-900/50 px-2 py-1 rounded-full">
                        Activate to protect your streak for one day!
                      </p>
                    </div>
                  </div>
                  
                  {/* Information box */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-md mb-4 w-full text-sm shadow-md">
                    <h3 className="font-bold text-indigo-800 mb-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-t-md -mt-4 -mx-4 shadow-sm">
                      STREAK PROTECTION
                    </h3>
                    <div className="space-y-3 pt-1">
                      <div className="flex items-start bg-white p-2 rounded-md shadow-sm">
                        <Shield className="h-6 w-6 text-indigo-500 mr-2 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-gray-800 font-medium block">Why Protect Your Streak?</span>
                          <p className="text-gray-600 text-xs">A streak protector shields you from losing your daily progress streak when you miss a day. Keep building points without interruption!</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-2 rounded-md shadow-sm">
                        <Clock className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-gray-800 font-medium block">How It Works</span>
                          <p className="text-gray-600 text-xs">Activate a shield today to protect your streak for 24 hours if you can't complete an activity tomorrow. Each shield costs 8 points.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activation button with flashing effect */}
                  <div className="relative mb-4">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        // Mark that the user has played a game today
                        const today = new Date().toDateString();
                        localStorage.setItem('lastGamePlayedDate', today);
                        
                        toast({
                          title: "Shield Activated!",
                          description: "Your streak is now protected for the next 24 hours!",
                        });
                        
                        // Refresh to show updated points in 2 seconds
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600
                        text-white w-full relative border-2 border-indigo-700 shadow-xl
                        animate-pulse py-6 font-bold tracking-wide text-xl"
                      size="lg"
                      disabled={dailyGameUsed}
                    >
                      <span className="relative z-10">
                        ACTIVATE SHIELD
                        <span className="absolute -right-8 top-0 rotate-12 bg-yellow-300 text-purple-600 text-xs px-2 py-1 rounded-md font-bold transform -translate-y-1/2">
                          !
                        </span>
                      </span>
                    </Button>
                    
                    {/* Button shine effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine" style={{ transform: "skewX(-20deg)" }}></div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("games")}
                    className="w-full"
                  >
                    Back to Games
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}