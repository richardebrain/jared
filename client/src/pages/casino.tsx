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
              <ScratchCard maxDailyScratchCards={3} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-mystery" className="mt-6">
            <div className="max-w-md mx-auto">
              <MysteryBox onClose={() => setActiveTab("games")} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-daily" className="mt-6">
            <div className="max-w-md mx-auto">
              <DailyRewards onClose={() => setActiveTab("games")} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-streak" className="mt-6">
            <div className="max-w-md mx-auto">
              <StreakProtection onClose={() => setActiveTab("games")} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}