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
import BounceAwayBlocks from '@/components/games/BounceAwayBlocks';
import GameTokenMachine from '@/components/games/GameTokenMachine';
import { GameWindowManager } from '@/components/games/GameWindowManager';
import { openGameInWindow, GameRenderer } from '@/components/games/GameRenderer';
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
  Puzzle,
  Search,
  Grid3X3,
  Brain
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
          <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto h-12">
            <TabsTrigger value="educational" className="text-sm font-medium">Educational Games</TabsTrigger>
            <TabsTrigger value="puzzle" className="text-sm font-medium">Teaching Puzzles</TabsTrigger>
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
              <GameTokenMachine 
                userPoints={user?.points || 0} 
                onPointsUpdate={(newPoints) => {
                  // Invalidate user data to refresh from server
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                  console.log('Points updated:', newPoints);
                }} 
              />

              {/* Teaching Puzzles Section */}
              <div className="space-y-6">
                <div className="text-center space-y-4 mb-8">
                  <div className="flex items-center justify-center space-x-2">
                    <Puzzle className="h-8 w-8 text-purple-500" />
                    <h2 className="text-2xl font-bold text-gray-800">Teaching Puzzles</h2>
                  </div>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Challenge your problem-solving skills with educational puzzles designed to reinforce teaching concepts and strategies.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Word Search */}
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Search className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-purple-800">ECE Word Search</CardTitle>
                            <CardDescription className="text-purple-600">
                              Find hidden terms
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-purple-500 text-white">Puzzle</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Word Search Grid Visual */}
                      <div className="bg-white p-4 rounded-lg border-2 border-purple-100 mb-4">
                        <div className="grid grid-cols-8 gap-1 text-xs font-mono">
                          {['S','A','F','E','T','Y','M','N',
                            'C','D','A','R','E','L','A','O',
                            'H','E','A','L','T','H','G','I',
                            'I','V','E','L','O','P','M','E',
                            'L','E','A','R','N','I','N','G',
                            'D','L','S','C','A','F','F','O',
                            'R','O','U','T','I','N','E','S',
                            'E','P','L','A','Y','B','A','S'].map((letter, i) => (
                            <div key={i} className={`w-6 h-6 flex items-center justify-center text-purple-700 font-bold ${
                              [0,1,2,3,4,5].includes(i) ? 'bg-purple-200 rounded' : 
                              [16,17,18,19,20,21].includes(i) ? 'bg-purple-200 rounded' : 
                              'bg-gray-50'
                            }`}>
                              {letter}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-purple-800 mb-2">Coming Soon!</h3>
                        <p className="text-purple-600 mb-4 text-sm">
                          Search for CDA competency terms in challenging word puzzles
                        </p>
                        <Badge className="bg-purple-600 text-white px-4 py-2">
                          In Development
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Crossword */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Grid3X3 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-blue-800">Teaching Crossword</CardTitle>
                            <CardDescription className="text-blue-600">
                              Test your knowledge
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-blue-500 text-white">Puzzle</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Crossword Grid Visual */}
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-100 mb-4">
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({length: 49}, (_, i) => {
                            const isBlack = [0,1,2,4,5,6,7,8,9,13,20,27,34,35,36,40,41,42,43,44,45,46,47,48].includes(i);
                            const hasNumber = [3,10,14,17,21,28,31,37,39].includes(i);
                            const number = hasNumber ? ['1','2','3','4','5','6','7','8','9'][Math.floor(Math.random() * 9)] : '';
                            return (
                              <div key={i} className={`w-6 h-6 border ${
                                isBlack ? 'bg-gray-800' : 'bg-white border-gray-300'
                              } flex items-center justify-center text-xs font-bold text-blue-700`}>
                                {hasNumber && <span className="text-[8px]">{number}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-blue-800 mb-2">Coming Soon!</h3>
                        <p className="text-blue-600 mb-4 text-sm">
                          Solve clues related to child development and teaching strategies
                        </p>
                        <Badge className="bg-blue-600 text-white px-4 py-2">
                          In Development
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Memory Match */}
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Brain className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-green-800">Memory Match</CardTitle>
                            <CardDescription className="text-green-600">
                              Match concepts
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">Puzzle</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Memory Match Visual */}
                      <div className="bg-white p-4 rounded-lg border-2 border-green-100 mb-4">
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({length: 16}, (_, i) => {
                            const isFlipped = [2,5,8,11].includes(i);
                            const symbols = ['🎓','📚','❤️','🎯'];
                            const symbol = isFlipped ? symbols[i % 4] : '?';
                            return (
                              <div key={i} className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold ${
                                isFlipped ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'
                              }`}>
                                {symbol}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-green-800 mb-2">Coming Soon!</h3>
                        <p className="text-green-600 mb-4 text-sm">
                          Improve memory while learning developmental milestones
                        </p>
                        <Badge className="bg-green-600 text-white px-4 py-2">
                          In Development
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Teaching Puzzle Benefits:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                    <div>• Reinforce learning through play</div>
                    <div>• Improve problem-solving skills</div>
                    <div>• Practice recall of key concepts</div>
                    <div>• Build confidence in subject knowledge</div>
                  </div>
                </div>
              </div>

              <Card className="border border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Gamepad2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-700">More Games Coming Soon!</CardTitle>
                      <CardDescription>
                        Additional educational games to enhance your teaching skills
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="text-gray-500 mb-4">
                      <Sparkles className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-sm">More exciting games in development:</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border">
                        <strong className="text-blue-600">Mindful Breathing Game</strong>
                        <p className="text-gray-600 mt-1">Interactive calming techniques</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <strong className="text-green-600">Emotion Detective</strong>
                        <p className="text-gray-600 mt-1">Identify children's emotions</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <strong className="text-purple-600">Conflict Resolution</strong>
                        <p className="text-gray-600 mt-1">Handle classroom conflicts</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <strong className="text-orange-600">Communication Builder</strong>
                        <p className="text-gray-600 mt-1">Parent & child communication</p>
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