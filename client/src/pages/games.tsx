import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import PacHealGame from '@/components/games/PacHealGameWorking';
import { useToast } from "@/hooks/use-toast";
import { 
  LuckySlots, 
  DailyRewards, 
  StreakProtection 
} from "@/components";
import { StreakRewardsSummary } from "@/components/DailyRewards";
import { 
  Sparkles, 
  Gift, 
  Package, 
  Star, 
  CircleHelp, 
  Heart, 
  Gamepad2,
  Trophy,
  Coins,
  Calendar,
  Clock,
  History,
  Ticket,
  Shield,
  Cherry,
  Diamond,
  Gem,
  Award,
  RefreshCcw,
  RefreshCw,
  Flame,
  Medal,
  Puzzle
} from 'lucide-react';

export default function GamesPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("play");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dailyGameUsed, setDailyGameUsed] = useState(false);
  
  // Force a refresh of user data when the page loads
  useEffect(() => {
    // This ensures we get fresh user data when the games page loads
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/games/history"] });
    console.log("Games page - Current user data:", user);
    
    // EMERGENCY FIX: Force games to be unlocked for Laura (user ID 5)
    // This overrides the user points in the cache to ensure games unlock
    if (user?.id === 5) {
      const enhancedUser = {...user, points: 15};
      queryClient.setQueryData(["/api/auth/me"], enhancedUser);
      console.log("EMERGENCY FIX: Enabling games for Laura by setting points to 15", enhancedUser);
    }
  }, [user?.id]);
  
  // Get user progress
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  // Get completed activities to check if user can access rewards
  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
  });
  
  // Check for special access for admin
  const isJLCookie = user?.username === 'jlcookie20';
  
  // User can access games if they have points OR are admin - no training requirement
  const hasCompletedActivity = 
    isJLCookie || 
    (user && user.points && user.points >= 0); // Allow access for all users with account
  
  // Function to reset games for jlcookie20
  const resetBonusGames = () => {
    if (isJLCookie) {
      localStorage.removeItem('lastGamePlayedDate');
      setDailyGameUsed(false);
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
  
  // Calculate user stats
  const completedModules = Array.isArray(userProgress) 
    ? userProgress.filter((p: any) => p.completed)?.length || 0 
    : 0;
  const totalPoints = user?.points || 0;
  const bearBucks = user?.bearBucks || 0;
  
  if (isLoading) {
    return <div className="container py-20 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

        {/* Streak Rewards Summary */}
        <StreakRewardsSummary streakCount={user?.streak || 0} className="mb-6" />
        
        <Tabs defaultValue="educational" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto h-12">
            <TabsTrigger value="educational" className="text-sm font-medium">Educational Games</TabsTrigger>
            <TabsTrigger value="slots" className="text-sm font-medium">Lucky Games</TabsTrigger>
            <TabsTrigger value="daily" className="text-sm font-medium">Daily Challenge</TabsTrigger>
          </TabsList>
          
          {/* Educational Games Tab */}
          <TabsContent value="educational" className="space-y-6">
            {!hasCompletedActivity ? (
              <Card className="p-8 text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 mr-3 text-amber-500" />
                    Complete Training to Unlock Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-6">
                    Educational games are unlocked after completing your first training module or earning points.
                  </p>
                  <Link to="/modules">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Star className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Puzzle className="h-6 w-6 mr-3 text-blue-500" />
                        Teaching Puzzle Games
                      </div>
                      <Badge className="bg-blue-500 text-white">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription>
                      Brain-training puzzles designed to enhance problem-solving skills for educators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 py-4">
                    <div className="text-center py-8">
                      <div className="text-blue-500 mb-4">
                        <Sparkles className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-blue-700 mb-2">Exciting Puzzles Coming Soon!</h3>
                        <p className="text-blue-600 mb-6">We're developing engaging puzzle games to help sharpen your teaching skills</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <strong className="text-blue-600">Classroom Logic Puzzles</strong>
                          <p className="text-gray-600 mt-1">Solve scenarios using teaching best practices</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <strong className="text-purple-600">Memory Matching</strong>
                          <p className="text-gray-600 mt-1">Match teaching concepts with practical applications</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <strong className="text-green-600">Pattern Recognition</strong>
                          <p className="text-gray-600 mt-1">Identify learning patterns in student behavior</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <strong className="text-orange-600">Word Puzzles</strong>
                          <p className="text-gray-600 mt-1">Build vocabulary for effective communication</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {isJLCookie && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-yellow-800">Admin Controls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={resetBonusGames}
                        variant="outline" 
                        className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All Games
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Lucky Games Tab */}
          <TabsContent value="slots" className="space-y-6">
            {!hasCompletedActivity ? (
              <Card className="p-8 text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center mb-4">
                    <Cherry className="h-8 w-8 mr-3 text-red-500" />
                    Complete Training to Play Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-6">
                    Lucky slots and scratch cards are unlocked after completing training modules.
                  </p>
                  <Link to="/modules">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Star className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LuckySlots onClose={() => {}} />
                  <ScratchCard />
                </div>
                <MysteryBox />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="daily" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <ScratchCard />
                </div>
                <div>
                  <MysteryBox />
                </div>
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

          <TabsContent value="educational" className="space-y-8">
            <div className="text-center space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <Heart className="h-8 w-8 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">Educational Games</h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Learn important emotional regulation and social skills through fun, interactive games designed specifically for early childhood educators.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <Heart className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-red-800">Pac-Heal Adventure</CardTitle>
                        <CardDescription className="text-red-600">
                          Navigate a maze and transform negative emotions into positive affirmations
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-red-500 text-white">Featured</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <PacHealGame />
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Gamepad2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-700">More Games Coming Soon!</CardTitle>
                      <CardDescription>
                        We're developing more educational games to help teach social-emotional learning skills
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <Sparkles className="h-12 w-12 mx-auto mb-2" />
                      <p>Stay tuned for exciting new games that will help you learn:</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-4 rounded-lg border">
                        <strong className="text-blue-600">Mindful Breathing Game</strong>
                        <p className="text-gray-600 mt-1">Practice calming techniques through interactive breathing exercises</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <strong className="text-green-600">Emotion Detective</strong>
                        <p className="text-gray-600 mt-1">Learn to identify and understand different emotions in children</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <strong className="text-purple-600">Conflict Resolution Scenarios</strong>
                        <p className="text-gray-600 mt-1">Practice handling common classroom conflicts</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <strong className="text-orange-600">Communication Builder</strong>
                        <p className="text-gray-600 mt-1">Develop effective communication strategies with children and parents</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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