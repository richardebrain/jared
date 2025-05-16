import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  Cherry 
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
  
  // Points reward handler for all games
  const handlePointsReward = async (points: number) => {
    try {
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Teacher Casino
          </h1>
          <Link to="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <p className="mt-2 text-muted-foreground">
          Celebrate your learning journey with these fun rewards!
        </p>
        
        {!hasCompletedActivity && (
          <Card className="mt-4 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Calendar className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-yellow-800">Complete an activity first</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Complete at least one learning activity today to unlock casino games and earn rewards.
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="games" disabled={!hasCompletedActivity}>
              <Trophy className="h-4 w-4 mr-2" />
              Casino Games
            </TabsTrigger>
            <TabsTrigger value="rewards" disabled={!hasCompletedActivity}>
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
              <LuckySlots 
                onClose={() => setActiveTab("games")} 
                onWin={handlePointsReward}
                dailySpinsRemaining={3}
              />
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