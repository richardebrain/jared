import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SlotMachine } from "@/components";
import { ScratchCard, MysteryBox, DailyRewards, StreakProtection } from "@/components";

import {
  Trophy,
  Gift,
  Coins,
  Star,
  Calendar,
  Clock,
  Sparkles,
  History,
  Package,
  Ticket,
  RotateCcw,
  Info,
  Check,
  DollarSign,
  Diamond,
  Cherry
} from "lucide-react";

export default function CasinoPage() {
  const [activeTab, setActiveTab] = useState("daily");
  
  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Daily Rewards & Games</h1>
            <p className="text-gray-600">
              Play games, earn rewards, and build your streak!
            </p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <Card className="bg-gradient-to-r from-amber-100 to-yellow-100 border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center">
                  <div className="bg-yellow-200 rounded-full p-2 mr-3">
                    <Coins className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700">Bear Bucks</p>
                    <p className="text-xl font-bold text-yellow-800">{user?.bearBucks || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center">
                  <div className="bg-indigo-200 rounded-full p-2 mr-3">
                    <Calendar className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700">Daily Streak</p>
                    <p className="text-xl font-bold text-indigo-800">{user?.streak || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="daily" className="py-3">
              <Gift className="h-4 w-4 mr-2" />
              Daily Rewards
            </TabsTrigger>
            <TabsTrigger value="games" className="py-3">
              <Star className="h-4 w-4 mr-2" />
              Casino Games
            </TabsTrigger>
            <TabsTrigger value="streak" className="py-3">
              <Calendar className="h-4 w-4 mr-2" />
              Streak Rewards
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <DailyRewards />
              </div>
              
              <div>
                <StreakProtection />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="games" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Slot Machine Section */}
              <Card className="group hover:shadow-lg transition-shadow overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-100">
                <CardHeader className="bg-gradient-to-r from-red-500 to-yellow-600 text-white">
                  <CardTitle className="text-xl flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Lucky Slots
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Match symbols to win points!
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 bg-gray-800 rounded-md flex items-center justify-center mx-auto mb-4 text-amber-800 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-300/10 to-yellow-400/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      <Cherry className="h-8 w-8 text-red-500" />
                      <Star className="h-8 w-8 text-yellow-500" />
                      <Diamond className="h-8 w-8 text-cyan-500" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-amber-800 mb-1">Lucky Slots</h3>
                  <p className="text-sm text-amber-700 mb-4">3 spins left today</p>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600"
                    size="lg"
                    onClick={() => setActiveTab("game-slot")}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Scratch Card Section */}
              <Card className="group hover:shadow-lg transition-shadow overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-indigo-100">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  <CardTitle className="text-xl flex items-center">
                    <Ticket className="h-5 w-5 mr-2" />
                    Scratch & Win
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Scratch cards for instant rewards!
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 bg-purple-200 rounded-md flex items-center justify-center mx-auto mb-4 text-purple-800 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-indigo-300 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-purple-200 flex items-center justify-center">
                          <div className="text-purple-400 text-lg">?</div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 group-hover:opacity-0 transition-opacity"></div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-purple-800 mb-1">Scratch Cards</h3>
                  <p className="text-sm text-purple-700 mb-4">2 cards left today</p>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                    size="lg"
                    onClick={() => setActiveTab("game-scratch")}
                  >
                    Scratch Now
                  </Button>
                </CardContent>
              </Card>
              
              {/* Mystery Box Section */}
              <Card className="group hover:shadow-lg transition-shadow overflow-hidden border-0 bg-gradient-to-br from-cyan-50 to-blue-100">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  <CardTitle className="text-xl flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Mystery Boxes
                  </CardTitle>
                  <CardDescription className="text-cyan-100">
                    Open boxes for premium rewards!
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 bg-cyan-200 rounded-lg flex items-center justify-center mx-auto mb-4 text-cyan-800 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-blue-300 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <Package className="h-16 w-16 z-10 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-cyan-400/30"></div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-cyan-800 mb-1">Mystery Boxes</h3>
                  <p className="text-sm text-cyan-700 mb-4">1 free box available</p>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    size="lg"
                    onClick={() => setActiveTab("game-box")}
                  >
                    Open Box
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="streak" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <Card className="border-2 border-indigo-100">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <CardTitle className="text-xl flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Daily Streak Rewards
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      Log in every day to increase your streak and earn special rewards!
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Your Current Streak</h3>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 px-3 py-1">
                          {user?.streak || 0} Days
                        </Badge>
                      </div>
                      
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                          style={{ width: `${Math.min(100, ((user?.streak || 0) / 30) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>0 days</span>
                        <span>15 days</span>
                        <span>30 days</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-3 mb-8">
                      {[
                        { day: 1, reward: "5 Points", icon: Star, active: (user?.streak || 0) >= 1 },
                        { day: 3, reward: "15 Points", icon: Star, active: (user?.streak || 0) >= 3 },
                        { day: 5, reward: "30 Points", icon: Star, active: (user?.streak || 0) >= 5 },
                        { day: 7, reward: "1 Bear Buck", icon: Coins, active: (user?.streak || 0) >= 7 },
                        { day: 14, reward: "3 Bear Bucks", icon: Coins, active: (user?.streak || 0) >= 14 },
                        { day: 21, reward: "5 Bear Bucks", icon: Coins, active: (user?.streak || 0) >= 21 },
                        { day: 30, reward: "10 Bear Bucks", icon: Sparkles, active: (user?.streak || 0) >= 30 },
                      ].map((reward, index) => (
                        <Card key={index} className={`overflow-hidden ${reward.active ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className={`p-2 text-white text-center ${reward.active ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                            Day {reward.day}
                          </div>
                          <div className="p-3 text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${reward.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                              <reward.icon className="h-5 w-5" />
                            </div>
                            <p className={`text-sm font-medium ${reward.active ? 'text-indigo-700' : 'text-gray-500'}`}>
                              {reward.reward}
                            </p>
                            {reward.active && (
                              <Badge className="mt-1 bg-green-500 text-white">Claimed</Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="font-semibold text-amber-800 flex items-center mb-2">
                        <Info className="h-5 w-5 mr-2 text-amber-600" />
                        Streak Tips
                      </h3>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                          Log in every day to maintain your streak.
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                          Use Streak Protection to guard against missed days.
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                          Complete at least one activity each day to increase your streak.
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-4">
                <StreakProtection />
                
                <Card className="mt-6 border-0 bg-gradient-to-br from-green-50 to-emerald-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CardTitle className="text-lg flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Streak Statistics
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Streak</span>
                        <span className="font-semibold">{user?.streak || 0} days</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Best Streak</span>
                        <span className="font-semibold">{Math.max(user?.streak || 0, 7)} days</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Streak Protected</span>
                        <Badge variant="outline" className="bg-red-50 text-red-600 font-medium">
                          No
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Bear Bucks Earned</span>
                        <span className="font-semibold">{user?.bearBucks || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Game content tabs */}
          <TabsContent value="game-slot" className="mt-6">
            <div className="max-w-md mx-auto">
              <SlotMachine onClose={() => setActiveTab("games")} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-scratch" className="mt-6">
            <div className="max-w-md mx-auto">
              <ScratchCard maxDailyScratchCards={3} />
            </div>
          </TabsContent>
          
          <TabsContent value="game-box" className="mt-6">
            <div className="max-w-md mx-auto">
              <MysteryBox maxDailyBoxes={2} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}