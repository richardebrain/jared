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
      
      // Update points via API
      const response = await fetch('/api/rewards/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });
      
      if (response.ok) {
        toast({
          title: "Points Added!",
          description: `${points} points have been added to your account!`,
        });
        
        // Refresh user data to show updated points
        window.setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
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
      
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
            Teacher Rewards
          </h1>
          <Link to="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
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
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300">
            <TabsTrigger value="games" disabled={!hasCompletedActivity} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <Trophy className="h-4 w-4 mr-2" />
              Bonus Games
            </TabsTrigger>
            <TabsTrigger value="rewards" disabled={!hasCompletedActivity} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <Gift className="h-4 w-4 mr-2" />
              Rewards History
            </TabsTrigger>
          </TabsList>
          
          {/* Game selection tab */}
          <TabsContent value="games" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lucky Slots */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Lucky Slots</CardTitle>
                    <Badge className="bg-amber-500 hover:bg-amber-600">
                      <Star className="h-3 w-3 mr-1" /> Popular
                    </Badge>
                  </div>
                  <CardDescription>
                    Spin to win points!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-md flex items-center justify-center mb-4">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="bg-white rounded-md p-2 flex items-center justify-center">
                        <Cherry className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="bg-white rounded-md p-2 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="bg-white rounded-md p-2 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("game-slot")}
                    disabled={!hasCompletedActivity}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Scratch Card */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Scratch Cards</CardTitle>
                  <CardDescription>
                    Reveal hidden treasures!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md flex items-center justify-center mb-4">
                    <div className="relative w-20 h-20 bg-white rounded-md flex items-center justify-center">
                      <Ticket className="h-8 w-8 text-purple-500" />
                      <div className="absolute inset-0 bg-gray-200 opacity-50 rounded-md"></div>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("game-scratch")}
                    disabled={!hasCompletedActivity}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Mystery Box */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Mystery Box</CardTitle>
                  <CardDescription>
                    What's inside today?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-md flex items-center justify-center mb-4">
                    <Package className="h-12 w-12 text-teal-500" />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("game-mystery")}
                    disabled={!hasCompletedActivity}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Daily Rewards */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Daily Rewards</CardTitle>
                  <CardDescription>
                    Claim your daily prize!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-md flex items-center justify-center mb-4">
                    <Calendar className="h-12 w-12 text-pink-500" />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("game-daily")}
                    disabled={!hasCompletedActivity}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Streak Protection */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Streak Protection</CardTitle>
                  <CardDescription>
                    Safeguard your daily streak!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-md flex items-center justify-center mb-4">
                    <Shield className="h-12 w-12 text-indigo-500" />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("game-streak")}
                    disabled={!hasCompletedActivity}
                  >
                    Play Now
                  </Button>
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