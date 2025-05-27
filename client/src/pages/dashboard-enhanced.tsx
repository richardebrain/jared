import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import ModuleView from "@/components/ModuleView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb, 
  Book, 
  Award, 
  Star, 
  Trophy, 
  Medal, 
  Coins, 
  Clock, 
  ArrowRight,
  CheckCircle,
  Building2,
  Shield,
  Music,
  Gift,
  Sparkles,
  Puzzle,
  Flame,
  Home
} from "lucide-react";

// Import our new gamification components
import GameNavigation from "@/components/GameNavigation";
import DailyLoginBonus from "@/components/DailyLoginBonus";
import DailyChallenge from "@/components/DailyChallenge";
import GameAchievements from "@/components/GameAchievements";
import AchievementPopup from "@/components/AchievementPopup";
import { UltimateEscalator } from "@/components/UltimateEscalator";
import BearAssistant from "@/components/BearAssistant";
import MediaSidebar from "@/components/MediaSidebar";

// Define the BearBuck conversion rate
const POINTS_PER_BEAR_BUCK = 50;

export default function EnhancedDashboard() {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{
    title: string;
    description: string;
    points: number;
    type: "achievement" | "level-up" | "challenge";
  }>({
    title: "Consistency Champion",
    description: "You've logged in 3 days in a row!",
    points: 10,
    type: "achievement"
  });
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    retry: 3
  });
  
  // Only fetch these resources if we have a user
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  const { data: modules } = useQuery({ 
    queryKey: ["/api/modules"],
    enabled: !!user,
  });
  
  useEffect(() => {
    // Show an achievement popup occasionally based on user activity
    const hasSeenAchievement = sessionStorage.getItem('hasSeenAchievement');
    
    if (!hasSeenAchievement && Math.random() > 0.7) {
      // Generate a random achievement to show
      const achievements = [
        { 
          title: "Explorer", 
          description: "You've checked out multiple areas of the app!",
          points: 5,
          type: "achievement" as const
        },
        {
          title: "Level Up!",
          description: "You've gained enough XP to reach the next level!",
          points: 0,
          type: "level-up" as const 
        },
        {
          title: "Challenge Complete",
          description: "You finished your daily learning challenge!",
          points: 15,
          type: "challenge" as const
        }
      ];
      
      const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
      setAchievementData(randomAchievement);
      setShowAchievement(true);
      
      // Mark as seen for this session
      sessionStorage.setItem('hasSeenAchievement', 'true');
      
      // Hide after a few seconds
      setTimeout(() => {
        setShowAchievement(false);
      }, 5000);
    }
  }, []);
  
  // Calculate Bear Bucks from points
  const bearBucks = user?.points ? Math.floor(user.points / POINTS_PER_BEAR_BUCK) : 0;
  
  // Let's check if the user has completed certain key modules
  const coreValuesModule = modules ? modules.find(m => m.category === 'onboarding') : null;
  const hasCompletedCoreValues = userProgress && Array.isArray(userProgress) ? userProgress.some(p => 
    coreValuesModule && p.moduleId === coreValuesModule.id && p.completed
  ) : false;
  
  // Handle module selection
  const handleModuleSelect = (moduleId: number) => {
    setSelectedModuleId(moduleId);
  };
  
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-800 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If we have a selected module, show the module view
  if (selectedModuleId) {
    return <ModuleView moduleId={selectedModuleId} onBack={() => setSelectedModuleId(null)} user={user || null} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-orange-50/80">
      <Header />
      
      {/* Show achievement popup conditionally */}
      {showAchievement && (
        <AchievementPopup 
          title={achievementData.title}
          description={achievementData.description}
          points={achievementData.points}
          type={achievementData.type}
        />
      )}
      
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section with Teacher Stats and Daily Bonus */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left side column for navigation */}
            <div className="hidden md:block">
              <GameNavigation />
            </div>
            
            {/* Main Content (2 columns on medium+) */}
            <div className="md:col-span-3 space-y-6">
              {/* Welcome Card with Stats */}
              <Card className="border-amber-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-2xl">Welcome back, {user?.firstName || "Teacher"}!</CardTitle>
                      <CardDescription className="text-amber-100">
                        Your teaching journey progress
                      </CardDescription>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <Badge className="bg-white text-amber-800">
                        Level {user?.level || 1} Teacher
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Daily Login Bonus */}
                    <div className="md:col-span-2">
                      <DailyLoginBonus />
                    </div>
                    
                    {/* Point Stats */}
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <div className="text-sm text-gray-500">XP Points</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">{user?.points || 0}</div>
                          <div className="bg-amber-100 p-2 rounded-full">
                            <Star className="h-5 w-5 text-amber-500" />
                          </div>
                        </div>
                        <Progress value={user?.points ? (user.points % 100) : 0} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {user?.points ? (100 - (user.points % 100)) : 100} XP until next level
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <div className="text-sm text-gray-500">Bear Bucks</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">{bearBucks}</div>
                          <div className="bg-green-100 p-2 rounded-full">
                            <Coins className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="bg-amber-100 p-1 rounded-md">
                            <div className="text-xs text-amber-700 font-semibold">
                              50 XP = 1 Bear Buck
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <div className="text-sm text-gray-500">Login Streak</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">{user?.streak || 0} days</div>
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Flame className="h-5 w-5 text-purple-500" />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.streak ? 'Keep it up!' : 'Log in daily to build your streak!'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Daily Challenge */}
              <DailyChallenge />
              
              {/* Training Modules Section */}
              <Card className="border-amber-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        <span>Required Training</span>
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Complete these modules to earn core certifications
                      </CardDescription>
                    </div>
                    <Badge className="bg-white text-blue-600">
                      Priority
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Core Values Training */}
                    {coreValuesModule && (
                      <div 
                        onClick={() => handleModuleSelect(coreValuesModule.id)}
                        className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-lg p-4 cursor-pointer hover:shadow-md transition relative group"
                      >
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Required
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity"></div>
                        
                        <h3 className="font-heading font-semibold text-lg mb-1">Raising Arizona's CORE Values</h3>
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          Learn the foundational principles that guide everything we do at Raising Arizona Preschool.
                        </p>
                        
                        {/* Completion status */}
                        {hasCompletedCoreValues ? (
                          <div className="flex items-center mb-3 px-2 py-1.5 bg-green-50 border border-green-100 rounded-md">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <p className="text-xs text-green-700 font-medium">
                              Completed
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center mb-3 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                            <div className="flex-shrink-0 mr-2">
                              <Award className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-xs text-blue-700 font-medium">
                              Complete for 50 XP Points
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-neutral-500">45 min</div>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-1/3 bg-amber-500 hover:bg-amber-600"
                          >
                            {hasCompletedCoreValues ? "Review" : "Start Now"}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* More module recommendations would go here */}
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-50 border-t border-gray-100 flex justify-between p-4">
                  <div className="text-sm text-gray-600">
                    Need help finding the right training?
                  </div>
                  <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={() => setLocation("/modules")}>
                    <span>View all training modules</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Game Elements Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UltimateEscalator Preview */}
                <Card className="border-amber-200 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center text-base sm:text-lg">
                        <Puzzle className="h-5 w-5 mr-2" />
                        <span>Ultimate Escalator</span>
                      </CardTitle>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white">
                        Earn Points
                      </Badge>
                    </div>
                    <CardDescription className="text-purple-100">
                      Quick challenges to boost your teaching skills
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4 mb-3">
                      <h3 className="font-medium text-purple-800 mb-1">Today's Challenges</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center text-purple-700">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span>Core Values Reflection</span>
                        </li>
                        <li className="flex items-center text-purple-700">
                          <div className="h-4 w-4 mr-2 border border-purple-300 rounded-sm"></div>
                          <span>Classroom Management Quiz</span>
                        </li>
                        <li className="flex items-center text-purple-700">
                          <div className="h-4 w-4 mr-2 border border-purple-300 rounded-sm"></div>
                          <span>Child Development Challenge</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => setLocation("/ultimate-escalator")}
                    >
                      Take a Challenge
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Achievements */}
                <GameAchievements user={user || null} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation (only visible on small screens) */}
        <div className="block md:hidden sticky bottom-4 pb-4">
          <Card className="border-amber-200 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-2">
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant={location === "/dashboard" ? "default" : "ghost"}
                  className="flex flex-col items-center justify-center h-16 p-0"
                  onClick={() => setLocation("/dashboard")}
                >
                  <Home className="h-5 w-5 mb-1" />
                  <span className="text-xs">Home</span>
                </Button>
                <Button 
                  variant={location === "/modules" ? "default" : "ghost"}
                  className="flex flex-col items-center justify-center h-16 p-0"
                  onClick={() => setLocation("/modules")}
                >
                  <Book className="h-5 w-5 mb-1" />
                  <span className="text-xs">Training</span>
                </Button>
                <Button 
                  variant={location === "/ultimate-escalator" ? "default" : "ghost"}
                  className="flex flex-col items-center justify-center h-16 p-0"
                  onClick={() => setLocation("/ultimate-escalator")}
                >
                  <Award className="h-5 w-5 mb-1" />
                  <span className="text-xs">Challenges</span>
                </Button>
                <Button 
                  variant={location === "/classroom-music" ? "default" : "ghost"}
                  className="flex flex-col items-center justify-center h-16 p-0"
                  onClick={() => setLocation("/classroom-music")}
                >
                  <Music className="h-5 w-5 mb-1" />
                  <span className="text-xs">Music</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}