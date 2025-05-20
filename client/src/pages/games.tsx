import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import SpinWheel from '@/components/SpinWheel';
import ScratchCard from '@/components/ScratchCard';
import MysteryBox from '@/components/MysteryBox';
import DailyChallenge from '@/components/DailyChallenge';
import { Sparkles, Gift, Package, Star, CircleHelp } from 'lucide-react';

export default function GamesPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("play");
  const queryClient = useQueryClient();
  
  // Force a refresh of user data when the page loads
  useEffect(() => {
    // This ensures we get fresh user data when the games page loads
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/games/history"] });
    console.log("Games page - Current user data:", user);
  }, []);
  
  // Get user progress
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  // Calculate user stats
  const completedModules = userProgress?.filter(p => p.completed)?.length || 0;
  const totalPoints = user?.points || 0;
  const bearBucks = user?.bearBucks || 0;
  
  if (isLoading) {
    return <div className="container py-20 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Rewards</h1>
            <p className="text-neutral-600 max-w-2xl">
              Play games and earn rewards for completing training modules and improving your teaching skills!
            </p>
          </div>
          
          {/* User stats */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 py-2 px-4">
              <Star className="h-4 w-4 mr-2 text-amber-500" />
              <span className="font-semibold">{totalPoints}</span> Points
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 py-2 px-4">
              <Sparkles className="h-4 w-4 mr-2 text-green-500" />
              <span className="font-semibold">{bearBucks}</span> Bear Bucks
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 py-2 px-4">
              <Gift className="h-4 w-4 mr-2 text-blue-500" />
              <span className="font-semibold">{completedModules}</span> Modules
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="play" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-xl mx-auto">
            <TabsTrigger value="play">Play & Rewards</TabsTrigger>
            <TabsTrigger value="daily">Daily Challenge</TabsTrigger>
            <TabsTrigger value="rewards">My Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="play" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SpinWheel />
              </div>
              <div>
                <ScratchCard />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div>
                <MysteryBox />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-indigo-100 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <CircleHelp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">How Rewards Work</h3>
                  <p className="text-neutral-600 mb-4">
                    Complete modules and assessments to earn points. Use your points to play games and win Bear Bucks and special items.
                  </p>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-amber-100 mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      </div>
                      <span>Your points refresh when you spend them on games</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-amber-100 mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      </div>
                      <span>Bear Bucks can be converted to real gift cards at partner stores</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-amber-100 mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      </div>
                      <span>Special items can protect streaks or boost your points</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Teaching Challenge</CardTitle>
                <CardDescription>Complete daily challenges to earn extra points and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <DailyChallenge />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>My Inventory</CardTitle>
                <CardDescription>View and use your earned items and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder for user inventory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-amber-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">Streak Shields</CardTitle>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">0 owned</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-600 mb-4">
                        Protects your daily login streak when you miss a day
                      </p>
                      <Button variant="outline" disabled className="w-full">Use Shield</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-amber-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">Double XP Boost</CardTitle>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">0 owned</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-600 mb-4">
                        Earn double points for 24 hours when activated
                      </p>
                      <Button variant="outline" disabled className="w-full">Activate Boost</Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-neutral-500 mb-4">
                    You can earn more items by playing games and completing challenges.
                  </p>
                  <Button onClick={() => setActiveTab("play")}>Play Games Now</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}