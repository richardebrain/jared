import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import ModuleView from "@/components/ModuleView";
import { CompactModuleCard } from "@/components/CompactModuleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import BonusGamesButton from "@/components/BonusGamesButton";
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
  BrainCircuit as Brain,
  Sparkles
} from "lucide-react";
import { MonthlyNewsletter } from "@/components/MonthlyNewsletter";
import Leaderboard from "@/components/Leaderboard";
import SimpleLeaderboard from "@/components/SimpleLeaderboard";
import RecentShoutOuts from "@/components/RecentShoutOuts";
import BearAssistant from "@/components/BearAssistant";
import { UltimateEscalator } from "@/components/UltimateEscalator";
import MediaSidebar from "@/components/MediaSidebar";
import AdminTools from "@/components/AdminTools";
import DailyChallenge from "@/components/DailyChallenge";
import AchievementPopup from "@/components/AchievementPopup";
import PersonalizedLearningPath from "@/components/PersonalizedLearningPath";
import PersonalizedMiniLessons from "@/components/PersonalizedMiniLessons";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [showAchievement, setShowAchievement] = useState(false);
  const [lastCompletedModule, setLastCompletedModule] = useState<string | null>(null);
  const [showMindfulnessReminder, setShowMindfulnessReminder] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
  // Handle module selection - navigate to the module page
  useEffect(() => {
    if (selectedModuleId) {
      setLocation(`/modules/${selectedModuleId}`);
    }
  }, [selectedModuleId, setLocation]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch authenticated user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: true,
  });
  
  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  // Fetch modules
  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
  });
  
  // Fetch assessments
  const { data: assessments } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: !!user,
  });

  // Fetch game history to check if games have been played today
  const { data: gameHistory } = useQuery({
    queryKey: ["/api/games/history"],
    enabled: !!user,
  });

  // Fetch Core Values shoutouts
  const { data: coreValuesShoutouts } = useQuery({
    queryKey: ["/api/core-values-shoutouts"], 
    enabled: !!user,
  });
  
  // Fetch leaderboard
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Check if the user has completed the Core Values module (ID: 33)
  const hasCoreValuesComplete = useMemo(() => {
    if (!userProgress) return false;
    return Array.isArray(userProgress) && userProgress.some((progress) => progress.moduleId === 33 && progress.completed);
  }, [userProgress]);
  
  // Check if Mindful Mornings module is completed (ID: 28)
  const hasMindfulMorningsComplete = useMemo(() => {
    if (!userProgress) return false;
    return Array.isArray(userProgress) && userProgress.some((progress) => progress.moduleId === 28 && progress.completed);
  }, [userProgress]);

  // Check if a bonus game has been played today via localStorage or gameHistory
  const bonusGamePlayedToday = useMemo(() => {
    // Check localStorage first (for immediate feedback after playing)
    const lastPlayedDate = localStorage.getItem("lastGamePlayedDate");
    const today = new Date().toDateString();
    if (lastPlayedDate === today) {
      return true;
    }

    // Then check game history from API
    if (gameHistory && Array.isArray(gameHistory) && gameHistory.length > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      return gameHistory.some(game => {
        if (!game.completedAt) return false;
        const gameDate = new Date(game.completedAt);
        return gameDate >= todayStart;
      });
    }
    
    return false;
  }, [gameHistory]);

  // Set points target based on current points
  const pointsTarget = useMemo(() => {
    if (!user) return 100;
    const currentPoints = user.points || 0;
    // Target is next 50 point increment
    return Math.ceil((currentPoints + 1) / 50) * 50;
  }, [user]);
  
  // Handle achievement popup on module completion
  useEffect(() => {
    const moduleCompletionState = localStorage.getItem('moduleCompletionState');
    if (moduleCompletionState) {
      const { moduleId, title } = JSON.parse(moduleCompletionState);
      setLastCompletedModule(title);
      setShowAchievement(true);
      localStorage.removeItem('moduleCompletionState');
    }
  }, []);

  // Refresh points when coming back from casino page
  useEffect(() => {
    const lastPointsEarned = localStorage.getItem('lastPointsEarned');
    if (lastPointsEarned) {
      // If there were points earned in a game, refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/history"] });
      localStorage.removeItem('lastPointsEarned');
    }
  }, [queryClient]);
  
  // Calculate Bear Bucks Conversion info
  const bearBucksInfo = useMemo(() => {
    if (!user) return { current: 0, nextAtPoints: 50 };
    const pointsPerBearBuck = 50; // Updated conversion rate: 50 points = 1 Bear Buck
    const currentPoints = user.points || 0;
    const currentBearBucks = user.bearBucks || 0;
    const pointsToNextBearBuck = pointsPerBearBuck - (currentPoints % pointsPerBearBuck);
    const nextBearBuckAtPoints = (Math.floor(currentPoints / pointsPerBearBuck) + 1) * pointsPerBearBuck;
    
    return {
      current: currentBearBucks,
      pointsPerBearBuck,
      pointsToNextBearBuck,
      nextAtPoints: nextBearBuckAtPoints
    };
  }, [user]);
  
  // Check if any recommended modules are available
  const hasRecommendedModules = useMemo(() => {
    if (!userProgress) return false;
    return Array.isArray(userProgress) && userProgress.some((progress) => progress.recommended);
  }, [userProgress]);
  
  // Get the featured module
  const featuredModule = useMemo(() => {
    if (!modules) return null;
    return Array.isArray(modules) && modules.find((m) => m.featured);
  }, [modules]);
  
  // Get modules prioritized by assessment results
  const recommendedModules = useMemo(() => {
    if (!userProgress || !modules || !assessments || !Array.isArray(assessments) || assessments.length === 0) {
      // Fall back to default recommended modules if no assessment available
      const recommended = Array.isArray(userProgress) 
        ? userProgress.filter((p) => p.recommended)
        : [];
      
      return recommended.map((progress) => {
        const module = Array.isArray(modules) 
          ? modules.find((m) => m.id === progress.moduleId)
          : null;
        return { ...progress, module };
      });
    }
    
    // Get the most recent assessment
    const latestAssessment = assessments.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
    
    if (!latestAssessment.scores || !Array.isArray(latestAssessment.scores)) {
      return [];
    }
    
    // Handle case where scores might not be an array or might be null
    const scores = latestAssessment.scores && Array.isArray(latestAssessment.scores) 
      ? latestAssessment.scores 
      : [];
    
    // Sort scores from lowest to highest to determine priority areas
    const priorityCategories = scores.length > 0
      ? [...scores]
          .sort((a, b) => a.score - b.score)
          .slice(0, 6) // Get 6 lowest scores to have enough potential matches
          .map(score => score.category.toLowerCase())
      : [];
    
    // Match modules to the priority categories
    const categoryBasedModules = Array.isArray(modules) 
      ? modules.filter(module => {
          // Check if the module's category, tags, or title contains any of the priority categories
          const moduleText = `${module.category} ${module.tags || ''} ${module.title}`.toLowerCase();
          return priorityCategories.some(category => 
            moduleText.includes(category) || 
            // Also match common variations/alternate spellings
            moduleText.includes(category.replace(/\s+/g, '-')) ||
            moduleText.includes(category.replace(/\s+/g, '_')) ||
            moduleText.includes(category.replace(/\-/g, ' ')) ||
            moduleText.includes(category.replace(/\_/g, ' '))
          );
        })
      : [];
      
    // Get progress for these modules
    return categoryBasedModules.map(module => {
      const progress = Array.isArray(userProgress)
        ? userProgress.find(p => p.moduleId === module.id) || { moduleId: module.id, progress: 0, completed: false }
        : { moduleId: module.id, progress: 0, completed: false };
        
      return { ...progress, module };
    }).slice(0, 3); // Limit to 3 modules
  }, [userProgress, modules, assessments]);
  
  // Get user's recent progress to show on dashboard
  const recentProgress = useMemo(() => {
    // Early returns with an empty array if data is missing or invalid
    if (!userProgress) return [];
    if (!modules) return [];
    if (!Array.isArray(modules) || modules.length === 0) return [];
    
    // Ensure userProgress is an array (sometimes it might be undefined during loading)
    const progressArray = Array.isArray(userProgress) ? userProgress : [];
    
    // Only get incomplete modules with some progress
    const inProgress = progressArray.filter((p) => !p.completed && p.progress > 0);
    
    // If there are no modules in progress, get 3 unstarted modules to recommend
    if (inProgress.length === 0) {
      // Get modules that haven't been started yet
      const completedModuleIds = progressArray
        .filter(p => p.completed)
        .map(p => p.moduleId);
      
      // Filter modules that aren't already completed
      const uncompletedModules = modules.filter(m => !completedModuleIds.includes(m.id));
      
      // Make sure we have modules to work with
      if (uncompletedModules.length === 0) return [];
      
      // Sort by most recent first (ensuring we handle null createdAt fields)
      const sortedModules = [...uncompletedModules].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      // Create progress objects for modules that haven't been started
      return sortedModules.slice(0, 3).map(module => ({
        moduleId: module.id,
        progress: 0,
        completed: false,
        module,
        lastAccessed: new Date().toISOString()
      }));
    }
    
    // Sort by last accessed, most recent first
    const sorted = [...inProgress].sort((a, b) => {
      const dateA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
      const dateB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
      return dateB - dateA;
    });
    
    // Get only top 3
    const recent = sorted.slice(0, 3);
    
    // Attach module data
    return recent.map((progress) => {
      const module = modules.find((m) => m.id === progress.moduleId);
      return module ? { ...progress, module } : null;
    }).filter(Boolean); // Remove null items
  }, [userProgress, modules]);
  
  // Check if Chapter 1 (ID:34) is complete
  const hasChapterOneComplete = useMemo(() => {
    if (!userProgress) return false;
    return Array.isArray(userProgress) && userProgress.some((progress) => progress.moduleId === 34 && progress.completed);
  }, [userProgress]);
  
  // Core Values Module card
  const CoreValuesCard = () => {
    const coreValuesModule = Array.isArray(modules) && modules.find((m) => m.id === 33);
    
    if (!coreValuesModule) return null;
    
    const progress = Array.isArray(userProgress) 
      ? userProgress.find((p) => p.moduleId === 33)
      : null;
    
    const progressValue = progress ? progress.progress : 0;
    const isComplete = progress && progress.completed;
    
    return (
      <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4">
          <CardTitle className="text-xl font-bold text-white mb-0 flex justify-between items-center">
            <span>
              <Shield className="h-5 w-5 mr-2 inline-block" />
              {coreValuesModule.title}
            </span>
            {isComplete && <CheckCircle className="h-5 w-5 text-white" />}
          </CardTitle>
          <CardDescription className="text-white font-medium opacity-90 m-0">
            Raising Arizona's 5 Core Values
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          <div className="flex justify-between items-center">
            <Badge variant={isComplete ? "success" : "outline"} className="font-normal">
              {isComplete ? "Completed" : "Required"}
            </Badge>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setLocation(`/core-values-module-new`)}
            >
              {isComplete ? "Review" : "Start"} Module
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Mindful Mornings Card
  const MindfulMorningsCard = () => {
    const mindfulModule = Array.isArray(modules) && modules.find((m) => m.id === 28);
    
    if (!mindfulModule) return null;
    
    const progress = Array.isArray(userProgress) 
      ? userProgress.find((p) => p.moduleId === 28)
      : null;
    
    const progressValue = progress ? progress.progress : 0;
    const isComplete = progress && progress.completed;
    
    return (
      <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
          <CardTitle className="text-xl font-bold text-white mb-0 flex justify-between items-center">
            <span>
              <Clock className="h-5 w-5 mr-2 inline-block" />
              {mindfulModule.title}
            </span>
            {isComplete && <CheckCircle className="h-5 w-5 text-white" />}
          </CardTitle>
          <CardDescription className="text-white font-medium opacity-90 m-0">
            Start your day with mindfulness
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          <div className="flex justify-between items-center">
            <Badge variant={isComplete ? "success" : "outline"} className="font-normal">
              {isComplete ? "Completed" : "Recommended"}
            </Badge>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setLocation(`/modules/${mindfulModule.id}`)}
            >
              {isComplete ? "Review" : "Start"} Module
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Chapter 1 Card
  const ChapterOneCard = () => {
    const chapterOneModule = Array.isArray(modules) && modules.find((m) => m.id === 34);
    
    if (!chapterOneModule) return null;
    
    const progress = Array.isArray(userProgress) 
      ? userProgress.find((p) => p.moduleId === 34)
      : null;
    
    const progressValue = progress ? progress.progress : 0;
    const isComplete = progress && progress.completed;
    
    return (
      <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4">
          <CardTitle className="text-xl font-bold text-white mb-0 flex justify-between items-center">
            <span>
              <Book className="h-5 w-5 mr-2 inline-block" />
              {chapterOneModule.title}
            </span>
            {isComplete && <CheckCircle className="h-5 w-5 text-white" />}
          </CardTitle>
          <CardDescription className="text-white font-medium opacity-90 m-0">
            Understanding childhood development
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          <div className="flex justify-between items-center">
            <Badge variant={isComplete ? "success" : "outline"} className="font-normal">
              {isComplete ? "Completed" : "Required"}
            </Badge>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setLocation(`/modules/${chapterOneModule.id}`)}
            >
              {isComplete ? "Review" : "Start"} Module
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Now rendering the actual dashboard UI
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {showAchievement && (
        <AchievementPopup 
          title={`Module Completed!`}
          message={`You've completed "${lastCompletedModule}"`}
          onClose={() => setShowAchievement(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-6">
        {!user ? (
          <div className="text-center my-12">
            <h2 className="text-2xl font-bold mb-4">Loading User Data...</h2>
            <p>Please wait while we retrieve your information.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Section */}
              <Card className="bg-white shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <h1 className="text-2xl font-bold text-white">
                    Welcome back, {user.firstName}!
                  </h1>
                  <p className="text-blue-100">
                    Ready to continue your professional development journey?
                  </p>
                </div>
                
                <CardContent className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link href="/core-values-shout-out">
                      <div className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-green-400 transform transition duration-200 ease-in-out hover:scale-105">
                        {/* Corner decorations */}
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
                        
                        <div className="relative flex items-center justify-center">
                          <span className="mr-2 text-white text-lg">🎯</span>
                          <span className="text-white text-sm tracking-wider pb-1">CORE VALUES SHOUTOUT</span>
                          <span className="ml-2 text-white text-lg">🏆</span>
                        </div>
                        
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">GIVE!</div>
                      </div>
                    </Link>
                    
                    <Link href="/tools">
                      <div className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-purple-400 transform transition duration-200 ease-in-out hover:scale-105">
                        {/* Corner decorations */}
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
                        
                        <div className="relative flex items-center justify-center">
                          <span className="mr-2 text-white text-lg">🧰</span>
                          <span className="text-white text-sm tracking-wider pb-1">TEACHER TOOLS</span>
                          <span className="ml-3 text-white text-xl">🔧</span>
                        </div>
                        
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-purple-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">NEW!</div>
                      </div>
                    </Link>
                    
                    {user && (
                      // Show games button for any of these conditions:
                      // 1. User has completed modules
                      // 2. User is jlcookie20 (special admin)
                      // 3. User has a streak of at least 1 day (logged in two consecutive days)
                      Array.isArray(userProgress) && userProgress.some((p) => p.completed === true) || 
                      user.username === 'jlcookie20' || 
                      (user.streak && user.streak > 0)
                    ) ? (
                      <BonusGamesButton />
                    ) : (
                      <div className="group relative overflow-hidden bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-gray-400 opacity-90">
                        {/* Disabled state decorations */}
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-400 rounded"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded"></div>
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-400 rounded"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded"></div>
                        
                        <div className="relative flex items-center justify-center">
                          <span className="mr-2 text-gray-300 text-lg">🔒</span>
                          <span className="text-gray-100 text-sm tracking-wider pb-1">BONUS GAMES</span>
                          <span className="ml-2 text-gray-300 text-lg">🎰</span>
                        </div>
                        
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-600 text-gray-200 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">LOCKED</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Bear Bucks and Points Progress Bar */}
              <div className="bg-white rounded-xl shadow-md p-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Points */}
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Points</p>
                      <p className="text-xl font-bold">{user?.points || 0}</p>
                    </div>
                  </div>
                  
                  {/* Bear Bucks */}
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <Coins className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500">Bear Bucks</p>
                      <div className="flex items-baseline">
                        <p className="text-xl font-bold">{bearBucksInfo.current}</p>
                        <p className="text-xs text-gray-500 ml-2">Next at {bearBucksInfo.nextAtPoints} points</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Streak */}
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <Lightbulb className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Learning Streak</p>
                      <p className="text-xl font-bold">{user?.streak || 0} days</p>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Points Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress to next Bear Buck</span>
                    <span className="text-sm font-medium text-gray-600">
                      <span className="font-bold text-primary">{user?.points || 0}</span> / {bearBucksInfo.nextAtPoints} points
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={(user?.points || 0) % 50 * 2} 
                      className="h-3 bg-gray-100" 
                    />
                    
                    {/* Animated coin icon at current progress position */}
                    <div 
                      className="absolute top-0 transform -translate-y-1/3 transition-all duration-500 ease-in-out"
                      style={{ 
                        left: `${Math.min(((user?.points || 0) % 50) * 2, 100)}%`,
                        animation: "slight-bounce 2s infinite ease-in-out"
                      }}
                    >
                      <div className="bg-yellow-400 p-1 rounded-full shadow-md">
                        <Coins className="h-4 w-4 text-yellow-800" />
                      </div>
                    </div>
                    
                    {/* Bear Buck target icon */}
                    <div 
                      className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/3"
                    >
                      <div className="bg-green-500 p-1 rounded-full shadow-md border-2 border-white">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Points remaining text */}
                    <div className="text-xs text-center mt-4 text-gray-600">
                      <span className="font-medium text-primary">{bearBucksInfo.pointsToNextBearBuck}</span> more points until your next Bear Buck!
                    </div>
                  </div>
                </div>
                
                {/* Custom animations are added through global CSS instead */}
              </div>
              
              {/* Required Modules Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                  Required Training
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Replace CoreValuesCard with CompactModuleCard */}
                  <CompactModuleCard 
                    module={{
                      id: 33,
                      title: "Raising Arizona's CORE Values",
                      description: "Learn the essential values that guide our work with children",
                      duration: 20,
                      pointValue: 10,
                      category: "training",
                      difficulty: "beginner",
                      content: null,
                      quiz: null,
                      imageUrl: null,
                      featured: true,
                      isVisible: true,
                      createdAt: null
                    }}
                    onClick={(moduleId) => setSelectedModuleId(moduleId)}
                  />
                  
                  {/* Replace ChapterOneCard with CompactModuleCard */}
                  <CompactModuleCard 
                    module={{
                      id: 34,
                      title: "Chapter 1: Building a Human",
                      description: "Understanding child development from the ground up",
                      duration: 30,
                      pointValue: 15,
                      category: "training",
                      difficulty: "beginner",
                      content: null,
                      quiz: null,
                      imageUrl: null,
                      featured: true,
                      isVisible: true,
                      createdAt: null
                    }}
                    onClick={(moduleId) => setSelectedModuleId(moduleId)}
                  />
                </div>
              </div>
              
              {/* Ultimate Escalator - Moved to middle of dashboard */}
              <Card className="overflow-hidden bg-white shadow-md mt-8">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                  <CardTitle className="text-lg font-bold text-white mb-0">
                    Ultimate Escalator
                  </CardTitle>
                  <CardDescription className="text-white opacity-90 m-0">
                    Track your career progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <UltimateEscalator 
                    currentLevel={user?.level || 1}
                    points={user?.points || 0}
                    assessments={assessments || []}
                  />
                </CardContent>
              </Card>
              
              {/* Assessment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {/* Simple AI Assessment Card */}
                <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
                    <CardTitle className="text-xl font-bold text-white mb-0 flex items-center">
                      <Brain className="h-5 w-5 mr-2 inline-block" />
                      Quick Assessment
                    </CardTitle>
                    <CardDescription className="text-white font-medium opacity-90 m-0">
                      5-minute knowledge check
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-700 mb-4">
                      Test your ECE knowledge with our simplified assessment tool. Get immediate feedback 
                      and explanations on each question.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        onClick={() => {
                          window.open('/assessment.html', '_blank');
                        }}
                      >
                        Start Assessment
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Original AI Assessment Card */}
                <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                    <CardTitle className="text-xl font-bold text-white mb-0 flex items-center">
                      <Brain className="h-5 w-5 mr-2 inline-block" />
                      AI-Powered Assessment
                    </CardTitle>
                    <CardDescription className="text-white font-medium opacity-90 m-0">
                      Adaptive question difficulty
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-700 mb-4">
                      Experience our advanced assessment technology that adapts to your knowledge level.
                      Get personalized feedback and explanations.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        onClick={() => {
                          window.open('/assessment.html', '_blank');
                        }}
                      >
                        Try Assessment
                        <Star className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Enhanced AI Assessment Card */}
                <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow border-2 border-amber-300">
                  <div className="absolute -top-3 right-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-md font-bold z-10">
                    NEW
                  </div>
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
                    <CardTitle className="text-xl font-bold text-white mb-0 flex items-center">
                      <Brain className="h-5 w-5 mr-2 inline-block" />
                      Master ECE Assessment
                    </CardTitle>
                    <CardDescription className="text-white font-medium opacity-90 m-0">
                      From our master question database
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-700 mb-4">
                      Our most comprehensive assessment draws real questions from our master ECE database.
                      Includes detailed analytics and strength/weakness analysis.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        onClick={() => {
                          window.open('/assessment.html', '_blank');
                        }}
                      >
                        Take Master Assessment
                        <Award className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Basic ECE Assessment Card */}
                <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow border-2 border-blue-300">
                  <div className="absolute -top-3 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-bold z-10">
                    RELIABLE
                  </div>
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
                    <CardTitle className="text-xl font-bold text-white mb-0 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 inline-block" />
                      Basic ECE Assessment
                    </CardTitle>
                    <CardDescription className="text-white font-medium opacity-90 m-0">
                      Test your knowledge quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-700 mb-4">
                      Take this reliable assessment to test your early childhood education knowledge.
                      Includes instant feedback and domain-specific performance analysis.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                        onClick={() => window.location.href = "/basic-ai-assessment"}
                      >
                        Take Assessment
                        <CheckCircle className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Personalized Learning Path */}
              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                  Your Growth Priorities
                </h2>
                <div className="mb-6">
                  <PersonalizedLearningPath 
                    assessments={assessments || []} 
                    user={user || {}} 
                    modules={modules || []}
                  />
                </div>
              </div>
              
              {/* Personalized Mini-Lessons */}
              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Book className="h-5 w-5 mr-2 text-emerald-600" />
                  Personalized Mini-Lessons
                </h2>
                <p className="text-neutral-600 mb-4">
                  These short, targeted lessons are created specifically for you based on assessment questions you missed, 
                  featuring enriched content with teaching explanations, scientific background, and practical applications.
                </p>
                <div className="mb-6">
                  {user && (
                    <PersonalizedMiniLessons userId={user.id} />
                  )}
                </div>
                
                {/* Recent Shout-Outs Section */}
                <div className="mb-6">
                  <RecentShoutOuts limit={5} />
                </div>
              </div>
              
              {/* Modules For Your Growth */}
              {assessments && assessments.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-amber-500" />
                    Modules For Your Growth
                  </h2>
                  <p className="text-neutral-600 mb-4">
                    These modules are prioritized based on your assessment results to help you improve in your lowest-scoring areas.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MindfulMorningsCard />
                    {recommendedModules.map((item, index) => (
                      <div key={index}>
                        {item.module && (
                          <CompactModuleCard 
                            module={item.module}
                            progress={item.progress}
                            onClick={(moduleId) => setSelectedModuleId(moduleId)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Continue Learning */}
              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Book className="h-5 w-5 mr-2 text-blue-600" />
                  Continue Learning
                </h2>
                
                {recentProgress.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentProgress.map((item, index) => (
                      <div key={index}>
                        {item.module && (
                          <CompactModuleCard
                            module={item.module}
                            progress={item.progress}
                            onClick={(moduleId) => setSelectedModuleId(moduleId)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {/* Always show recommended modules, not dependent on API data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => setLocation('/modules/8')}>
                          <div className="h-36 bg-gradient-to-r from-blue-500 to-purple-500 relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-white font-semibold text-xl text-center p-4">Mindful Morning</div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-white/90 text-xs font-medium rounded-full px-2 py-0.5">
                              15 min
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold line-clamp-2">Mindful Morning Practices</h3>
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">wellness</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">Start your day with techniques to promote mindfulness, reduce stress, and improve classroom management.</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">10 points</span>
                              <div className="bg-gray-100 h-2 rounded-full w-24">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => setLocation('/modules/7')}>
                          <div className="h-36 bg-gradient-to-r from-green-500 to-teal-500 relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-white font-semibold text-xl text-center p-4">Core Values</div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-white/90 text-xs font-medium rounded-full px-2 py-0.5">
                              20 min
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold line-clamp-2">Raising Arizona's CORE Values</h3>
                              <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded">onboarding</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">Learn about our school's guiding principles: Consistency, Preparedness, Commitment, Caring, and Positivity.</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">15 points</span>
                              <div className="bg-gray-100 h-2 rounded-full w-24">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar - Right 1/3 */}
            <div className="space-y-6">
              {/* User Stats Card */}
              <Card className="bg-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-1.5 rounded-full mr-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm">Modules Completed</span>
                      </div>
                      <Badge variant="secondary">
                        {Array.isArray(userProgress) ? userProgress.filter((p) => p.completed).length : 0}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-1.5 rounded-full mr-3">
                          <Trophy className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm">Achievements</span>
                      </div>
                      <Badge variant="secondary">
                        {user?.achievementCount || 0}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-1.5 rounded-full mr-3">
                          <Medal className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm">Teacher Level</span>
                      </div>
                      <Badge variant="secondary">
                        {user?.level || 1}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Core Values Shoutouts */}
              {hasCoreValuesComplete && (
                <RecentShoutOuts 
                  shoutouts={coreValuesShoutouts || []} 
                  userData={users || []} 
                  currentUserId={user?.id}
                  onShoutoutAdded={() => {}}
                />
              )}
              

              {/* Bear Assistant */}
              <BearAssistant />
              
              {/* Leaderboard */}
              <SimpleLeaderboard users={users || []} currentUserId={user?.id} />
              
              {/* Media Section */}
              <MediaSidebar />
              
              {/* Admin Tools (if admin) */}
              {user && user.username === "admin" && (
                <AdminTools />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}