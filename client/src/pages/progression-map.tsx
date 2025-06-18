import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Award, 
  BookOpen, 
  Brain, 
  Calendar,
  CheckCircle, 
  Clock, 
  Crown, 
  Medal, 
  Star, 
  TrendingUp, 
  Trophy,
  BookIcon,
  BadgeCheck,
  LucideIcon
} from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BearAssistant from "@/components/BearAssistant";
import BearBucksRewards from "@/components/BearBucksRewards";

interface LevelRequirement {
  points: number;
  assessmentScore?: number;
  hoursRequired?: number;
  experienceRequired?: string;
  directorApproval?: boolean;
  inPersonAssessment?: boolean;
  modules?: string[];
  icon: LucideIcon;
  color: string;
  description: string;
  benefits: string[];
}

export default function ProgressionMap() {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  
  // Also fetch user data directly to ensure we have the most current points
  const { data: userData, refetch: refetchUserData } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });
  
  // Force refetch user data when this page loads to ensure we have current points
  React.useEffect(() => {
    refetchUserData();
  }, [refetchUserData]);
  
  // Define teacher levels and their requirements
  const teacherLevels: Record<string, LevelRequirement> = {
    "assistant": {
      points: 0,
      icon: BookOpen,
      color: "bg-blue-500",
      description: "Entry level position focused on learning the basics of early childhood education while assisting lead teachers.",
      benefits: [
        "Access to all basic training modules",
        "Mentorship from experienced teachers",
        "Opportunities to observe different classrooms"
      ]
    },
    "associate": {
      points: 100,
      assessmentScore: 60,
      hoursRequired: 30,
      icon: Star,
      color: "bg-yellow-500",
      description: "Developing teacher who can lead certain activities under supervision and is building core competencies.",
      benefits: [
        "Limited classroom leadership opportunities",
        "Increased responsibility for planning activities",
        "Access to intermediate training modules",
        "Eligible for Bear Bucks bonus rewards"
      ]
    },
    "lead": {
      points: 250,
      assessmentScore: 70,
      hoursRequired: 100,
      experienceRequired: "6 months",
      directorApproval: true,
      modules: ["classroom-management", "child-development-basics", "curriculum-planning"],
      icon: Medal,
      color: "bg-purple-500",
      description: "Qualified teacher capable of independently managing a classroom and implementing curriculum. Requires 6 months of experience and director approval.",
      benefits: [
        "Full classroom leadership",
        "Curriculum development input",
        "Mentoring opportunities for assistant teachers",
        "Access to advanced training modules",
        "Higher Bear Bucks earning potential"
      ]
    },
    "senior": {
      points: 500,
      assessmentScore: 80,
      hoursRequired: 200,
      experienceRequired: "6 months",
      directorApproval: true,
      modules: ["advanced-curriculum", "parent-relations", "behavioral-management"],
      icon: Trophy,
      color: "bg-orange-500",
      description: "Experienced educator who demonstrates excellence in teaching and leadership abilities. Requires 6 months of experience and director approval.",
      benefits: [
        "Leadership role in curriculum planning",
        "Opportunity to conduct workshops for other teachers",
        "Input on school policy decisions",
        "Access to all training modules",
        "Premium Bear Bucks rewards"
      ]
    },
    "master": {
      points: 1000,
      assessmentScore: 90,
      hoursRequired: 300,
      experienceRequired: "6 months",
      directorApproval: true,
      inPersonAssessment: true,
      modules: ["leadership-in-ece", "advanced-child-development", "evaluation-methods"],
      icon: Crown,
      color: "bg-red-500",
      description: "Highest level of teaching excellence with comprehensive knowledge of early childhood education and exceptional classroom results. Requires 6 months of experience, director approval, and passing an in-person 2-part assessment.",
      benefits: [
        "School-wide leadership role",
        "Curriculum development authority",
        "Training and mentoring responsibilities",
        "Represent school at conferences and events",
        "Maximum Bear Bucks earning potential",
        "Recognition as Master Lead Teacher with certificate and pin"
      ]
    }
  };
  
  // Query to get user progress and modules
  const { data: userProgress = [] } = useQuery({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  const { data: modules = [] } = useQuery({
    queryKey: ["/api/modules"],
    enabled: !!user,
  });

  // Query to get ECE hours
  const { data: eceHours } = useQuery({
    queryKey: ["/api/ece-hours"],
    enabled: !!user,
  });
  
  // Calculate current level and progress
  const currentLevel = React.useMemo(() => {
    if (!user) return "assistant";
    
    const userPoints = userData?.points || user.points || 0;
    const userECEHours = eceHours?.totalHours || 0;
    const levels = Object.keys(teacherLevels).reverse(); // Start from highest level
    
    for (const level of levels) {
      const requirements = teacherLevels[level];
      const pointsRequirement = userPoints >= requirements.points;
      const hoursRequirement = !requirements.hoursRequired || userECEHours >= requirements.hoursRequired;
      
      // Must meet BOTH points and hours requirements
      if (pointsRequirement && hoursRequirement) {
        return level;
      }
    }
    return "assistant";
  }, [user, userData, teacherLevels, eceHours]);
  
  const nextLevel = React.useMemo(() => {
    const levels = Object.keys(teacherLevels);
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }, [currentLevel, teacherLevels]);
  
  const progress = React.useMemo(() => {
    if (!user || !nextLevel) return 100;
    
    const userPoints = userData?.points || user.points || 0;
    const currentLevelPoints = teacherLevels[currentLevel].points;
    const nextLevelPoints = teacherLevels[nextLevel].points;
    
    const pointsInCurrentLevel = userPoints - currentLevelPoints;
    const pointsNeededForNextLevel = nextLevelPoints - currentLevelPoints;
    
    return Math.min(100, Math.max(0, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
  }, [user, userData, currentLevel, nextLevel, teacherLevels]);
  
  // Calculate completed modules count
  const calculateCompletedModules = () => {
    if (!userProgress || !Array.isArray(userProgress)) return 0;
    
    try {
      return userProgress.filter((progress: any) => 
        progress && (progress.progress === 100 || progress.completed)
      ).length;
    } catch (error) {
      console.error("Error calculating completed modules:", error);
      return 0;
    }
  };
  
  // Calculate completed hours based on modules
  const getCompletedHours = () => {
    if (!userProgress || !modules || !Array.isArray(userProgress) || !Array.isArray(modules)) {
      return 0;
    }
    
    // Calculate hours based on completed module durations
    const completedModuleIds = userProgress
      .filter((progress: any) => progress && (progress.progress === 100 || progress.completed))
      .map((progress: any) => progress.moduleId);
    
    if (completedModuleIds.length === 0) return 0;
    
    // Sum up durations of completed modules (in minutes), then convert to hours
    const totalMinutes = modules
      .filter((module: any) => module && module.id && completedModuleIds.includes(module.id))
      .reduce((sum: number, module: any) => sum + (module.duration || 30), 0);
    
    return Math.round(totalMinutes / 60);
  };
  
  // Get assessment data
  const { data: assessments = [] } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: !!user,
  });
  
  // Calculate highest assessment score
  const getHighestAssessmentScore = () => {
    if (!user) return 0;
    
    // If we have assessment data, use it
    if (Array.isArray(assessments) && assessments.length > 0) {
      try {
        // Find the highest score
        const highestScore = Math.max(...assessments.map((a: any) => a.overallScore || 0));
        return isNaN(highestScore) ? 0 : highestScore;
      } catch (error) {
        console.error("Error calculating assessment score:", error);
      }
    }
    
    // Fallback based on points - users with more points likely have better scores
    return user.points ? Math.min(Math.floor(user.points / 10) + 50, 100) : 0;
  };
  
  // Check if the master level assessment is unlocked
  const isMasterAssessmentUnlocked = () => {
    return currentLevel === "senior" && progress >= 80;
  };
  
  // Helper functions
  function getNextLevelRequirements() {
    if (!user || !nextLevel) return null;
    
    const userPoints = user.points || 0;
    const userECEHours = eceHours?.totalHours || 0;
    const nextLevelReq = teacherLevels[nextLevel];
    
    const pointsNeeded = Math.max(0, nextLevelReq.points - userPoints);
    const hoursNeeded = nextLevelReq.hoursRequired ? Math.max(0, nextLevelReq.hoursRequired - userECEHours) : 0;
    
    return {
      pointsNeeded,
      hoursNeeded,
      hasHourRequirement: !!nextLevelReq.hoursRequired
    };
  }
  
  function getCompletionStatus(level: string) {
    if (!user) return "locked";
    
    const userPoints = user.points || 0;
    const userECEHours = eceHours?.totalHours || 0;
    const levelReq = teacherLevels[level];
    
    const pointsComplete = userPoints >= levelReq.points;
    const hoursComplete = !levelReq.hoursRequired || userECEHours >= levelReq.hoursRequired;
    
    // Level is completed only if BOTH requirements are met
    if (pointsComplete && hoursComplete) {
      if (level === currentLevel) return "active";
      return "completed";
    }
    
    // Check if it's the next level
    if (level === nextLevel) return "in-progress";
    
    return "locked";
  }
  
  function formatModuleName(moduleSlug: string) {
    return moduleSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  function isModuleCompleted(moduleSlug: string) {
    if (!userProgress || !modules || !Array.isArray(userProgress) || !Array.isArray(modules)) return false;

    try {
      // Look up the module ID by slug
      const module = modules.find((m: any) => 
        m && m.title && m.title.toLowerCase().includes(moduleSlug.replace('-', ' '))
      );
      
      if (!module) return false;
      
      // Check if there's progress for this module
      const progress = userProgress.find((p: any) => p && p.moduleId === module.id);
      return progress ? (progress.progress === 100 || progress.completed) : false;
    } catch (error) {
      console.error("Error checking module completion:", error);
      return false;
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="space-y-8">
          {/* Header and Current Level Card */}
          <div className="text-center space-y-4">
            <div className="relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                🌟 Teacher Progression Map 🌟
              </h1>
              <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🎯</div>
            </div>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Embark on your journey from Assistant Teacher to Master Lead Teacher at Raising Arizona Preschool. 
              Level up your skills, unlock achievements, and become an education champion!
            </p>
          </div>
            
          {/* Current level card */}
          <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    {React.createElement(teacherLevels[currentLevel]?.icon || Star, { 
                      className: "h-6 w-6 text-yellow-300" 
                    })}
                  </div>
                  Your Current Level
                </CardTitle>
                <Badge className="bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                  ⭐ {currentLevel.toUpperCase()} TEACHER ⭐
                </Badge>
              </div>
              <CardDescription className="text-blue-100 text-lg">
                {(() => {
                  if (!nextLevel) return "🏆 Maximum level reached!";
                  const requirements = getNextLevelRequirements();
                  if (!requirements) return "🎯 Keep up the great work!";
                  
                  const { pointsNeeded, hoursNeeded, hasHourRequirement } = requirements;
                  
                  if (pointsNeeded === 0 && hoursNeeded === 0) {
                    return `🎉 Ready to advance to ${nextLevel} Teacher!`;
                  }
                  
                  if (pointsNeeded === 0 && hasHourRequirement) {
                    return `🎯 ${hoursNeeded} more ECE hours needed for ${nextLevel} Teacher`;
                  }
                  
                  if (hoursNeeded === 0 && hasHourRequirement) {
                    return `🎯 ${pointsNeeded} more points needed for ${nextLevel} Teacher`;
                  }
                  
                  if (hasHourRequirement) {
                    return `🎯 Need ${pointsNeeded} points and ${hoursNeeded} ECE hours for ${nextLevel} Teacher`;
                  }
                  
                  return `🎯 ${pointsNeeded} points until ${nextLevel} Teacher`;
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Points Progress */}
                  <div>
                    <div className="flex items-center justify-between text-white/90 mb-3">
                      <span className="font-medium">🎯 Points Progress</span>
                      <span className="font-bold text-yellow-300 text-lg">{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-yellow-300 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* ECE Hours Progress */}
                  {nextLevel && teacherLevels[nextLevel]?.hoursRequired && (
                    <div>
                      {(() => {
                        const userECEHours = eceHours?.totalHours || 0;
                        const requiredHours = teacherLevels[nextLevel].hoursRequired;
                        const eceProgress = Math.min((userECEHours / requiredHours) * 100, 100);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between text-white/90 mb-3">
                              <span className="font-medium">🎓 ECE Hours Progress</span>
                              <span className="font-bold text-purple-300 text-lg">{Math.round(eceProgress)}%</span>
                            </div>
                            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-purple-300 to-blue-400 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${eceProgress}%` }}
                              />
                            </div>
                            <div className="text-xs text-purple-200 mt-1 text-center">
                              {userECEHours} of {requiredHours} hours completed
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-yellow-300 mb-2">
                      <TrendingUp className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-white">{userData?.points || user?.points || 0}</div>
                    <div className="text-xs text-blue-100">Current Points</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-orange-300 mb-2">
                      <Award className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-white">{userData?.lifetimePoints || user?.lifetimePoints || 0}</div>
                    <div className="text-xs text-blue-100">Lifetime Points</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-green-300 mb-2">
                      <Clock className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-white">{getCompletedHours()}</div>
                    <div className="text-xs text-blue-100">Training Hours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Achievement Badges Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700 mb-2">📚 Modules Completed</h3>
                <div className="text-3xl font-bold text-green-600">{calculateCompletedModules()}</div>
                <p className="text-sm text-green-600 mt-2">Learning modules successfully finished</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-orange-700 mb-2">🎯 Assessment Score</h3>
                <div className="text-3xl font-bold text-orange-600">{getHighestAssessmentScore()}%</div>
                <p className="text-sm text-orange-600 mt-2">Your highest assessment result</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-purple-700 mb-2">🏆 Current Level</h3>
                <div className="text-2xl font-bold text-purple-600 capitalize">{currentLevel}</div>
                <p className="text-sm text-purple-600 mt-2">Teacher certification level</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Visual Progression Line */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-indigo-700">
                🎯 Your Progression Journey 🎯
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Track your advancement through the teacher certification levels
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(Object.keys(teacherLevels).indexOf(currentLevel) / (Object.keys(teacherLevels).length - 1)) * 100}%` 
                    }}
                  />
                </div>
                
                {/* Level Markers */}
                <div className="flex justify-between items-center relative">
                  {Object.entries(teacherLevels).map(([level, requirements], index) => {
                    const isCompleted = getCompletionStatus(level) === "completed";
                    const isActive = getCompletionStatus(level) === "active";
                    const isNext = getCompletionStatus(level) === "in-progress";
                    
                    return (
                      <div key={level} className="flex flex-col items-center">
                        {/* Level Circle */}
                        <div className={`relative w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                          isCompleted 
                            ? "bg-green-500 border-green-600 shadow-lg" 
                            : isActive
                            ? "bg-blue-500 border-blue-600 shadow-lg animate-pulse"
                            : isNext
                            ? "bg-yellow-400 border-yellow-500 shadow-lg"
                            : "bg-gray-200 border-gray-300"
                        }`}>
                          {React.createElement(requirements.icon, { 
                            className: `h-6 w-6 ${
                              isCompleted || isActive ? "text-white" : isNext ? "text-gray-700" : "text-gray-400"
                            }` 
                          })}
                          
                          {/* Teacher Avatar - only show on current level */}
                          {isActive && (
                            <div className="absolute -top-12 animate-bounce">
                              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <span className="text-white text-lg">👩‍🏫</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Level Name */}
                        <div className="mt-3 text-center">
                          <div className={`font-bold text-sm ${
                            isCompleted || isActive ? "text-indigo-700" : "text-gray-500"
                          }`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <span>{requirements.points} pts</span>
                              {(() => {
                                const userPoints = userData?.points || user?.points || 0;
                                const pointsComplete = userPoints >= requirements.points;
                                return pointsComplete ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <span className="text-xs text-red-500">✗</span>
                                );
                              })()}
                            </div>
                            {requirements.hoursRequired && (
                              <div className="flex items-center gap-1">
                                <span>{requirements.hoursRequired}h ECE</span>
                                {(() => {
                                  const userECEHours = eceHours?.totalHours || 0;
                                  const hoursComplete = userECEHours >= requirements.hoursRequired;
                                  return hoursComplete ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <span className="text-xs text-red-500">✗</span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mt-2">
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                              ✅ Complete
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="bg-blue-500 text-white text-xs px-2 py-1 animate-pulse">
                              ⭐ Current
                            </Badge>
                          )}
                          {isNext && (
                            <Badge className="bg-yellow-500 text-black text-xs px-2 py-1">
                              🚀 Next
                            </Badge>
                          )}
                          {!isCompleted && !isActive && !isNext && (
                            <Badge className="bg-gray-300 text-gray-600 text-xs px-2 py-1">
                              🔒 Locked
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Text */}
                <div className="text-center mt-8 p-4 bg-white/50 rounded-lg">
                  <p className="text-lg font-semibold text-indigo-700">
                    You are currently a <span className="capitalize bg-yellow-200 px-2 py-1 rounded">{currentLevel} Teacher</span>
                  </p>
                  {nextLevel && (
                    <p className="text-sm text-gray-600 mt-2">
                      {(() => {
                        const requirements = getNextLevelRequirements();
                        if (!requirements) return "Keep up the great work!";
                        
                        const { pointsNeeded, hoursNeeded, hasHourRequirement } = requirements;
                        
                        if (pointsNeeded === 0 && hoursNeeded === 0) {
                          return `Ready to advance to ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Teacher level!`;
                        }
                        
                        if (pointsNeeded === 0 && hasHourRequirement) {
                          return `${hoursNeeded} more ECE hours needed to reach ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Teacher level`;
                        }
                        
                        if (hoursNeeded === 0 && hasHourRequirement) {
                          return `${pointsNeeded} more points needed to reach ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Teacher level`;
                        }
                        
                        if (hasHourRequirement) {
                          return `Need ${pointsNeeded} points and ${hoursNeeded} ECE hours to reach ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Teacher level`;
                        }
                        
                        return `${pointsNeeded} more points needed to reach ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Teacher level`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Teacher Levels */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🏆 Teacher Progression Levels 🏆
              </h2>
              <p className="text-lg text-neutral-700">
                Click on any level to learn more about the requirements and benefits
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(teacherLevels).map(([level, requirements]) => (
                <Card 
                  key={level}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
                    getCompletionStatus(level) === "completed" 
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200" 
                      : getCompletionStatus(level) === "active"
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-200"
                      : getCompletionStatus(level) === "in-progress"
                      ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-yellow-200"
                      : "border-neutral-300 bg-gradient-to-br from-neutral-50 to-gray-50"
                  } shadow-lg`}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${requirements.color} shadow-lg`}>
                          {React.createElement(requirements.icon, { 
                            className: "h-6 w-6 text-white" 
                          })}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                          <div className="text-sm text-neutral-600">Teacher</div>
                        </div>
                      </CardTitle>
                      <Badge 
                        className={`text-xs font-bold px-3 py-1 ${
                          getCompletionStatus(level) === "completed" 
                            ? "bg-green-500 text-white" 
                            : getCompletionStatus(level) === "active"
                            ? "bg-blue-500 text-white"
                            : getCompletionStatus(level) === "in-progress"
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {getCompletionStatus(level) === "completed" 
                          ? "✅ Completed" 
                          : getCompletionStatus(level) === "active"
                          ? "⭐ Current"
                          : getCompletionStatus(level) === "in-progress"
                          ? "🚀 Next"
                          : "🔒 Locked"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                        <span className="font-medium">🎯 Points Required:</span>
                        <span className="font-bold text-blue-600">{requirements.points}</span>
                      </div>
                      {requirements.assessmentScore && (
                        <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                          <span className="font-medium">🧠 Assessment Score:</span>
                          <span className="font-bold text-green-600">{requirements.assessmentScore}%</span>
                        </div>
                      )}
                      {requirements.hoursRequired && (
                        <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                          <span className="font-medium">⏰ Training Hours:</span>
                          <span className="font-bold text-purple-600">{requirements.hoursRequired}h</span>
                        </div>
                      )}
                      {requirements.experienceRequired && (
                        <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                          <span className="font-medium">📅 Experience Required:</span>
                          <span className="font-bold text-orange-600">{requirements.experienceRequired}</span>
                        </div>
                      )}
                      {requirements.directorApproval && (
                        <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                          <span className="font-medium">✅ Director Approval:</span>
                          <span className="font-bold text-green-600">Required</span>
                        </div>
                      )}
                      {requirements.inPersonAssessment && (
                        <div className="flex items-center justify-between text-sm bg-white/50 p-2 rounded">
                          <span className="font-medium">🎯 In-Person Assessment:</span>
                          <span className="font-bold text-red-600">2-Part Required</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Level Details Modal */}
          {selectedLevel && (
            <Card className="mt-8 border-2 border-primary shadow-2xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/20 shadow-lg`}>
                      {React.createElement(teacherLevels[selectedLevel].icon, { 
                        className: "h-6 w-6 text-white" 
                      })}
                    </div>
                    {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Teacher Level
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedLevel(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <p className="text-lg text-neutral-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    {teacherLevels[selectedLevel].description}
                  </p>
                  
                  <div>
                    <h4 className="font-bold text-xl mb-4 text-blue-700">📋 Requirements:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center">
                        <div className="text-blue-500 mb-2">
                          <TrendingUp className="h-8 w-8 mx-auto" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{teacherLevels[selectedLevel].points}</div>
                        <div className="text-sm text-blue-700 font-medium">Points Required</div>
                      </div>
                      
                      {teacherLevels[selectedLevel].assessmentScore && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 text-center">
                          <div className="text-green-500 mb-2">
                            <Brain className="h-8 w-8 mx-auto" />
                          </div>
                          <div className="text-2xl font-bold text-green-600">{teacherLevels[selectedLevel].assessmentScore}%</div>
                          <div className="text-sm text-green-700 font-medium">Assessment Score</div>
                        </div>
                      )}
                      
                      {teacherLevels[selectedLevel].hoursRequired && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 text-center">
                          <div className="text-purple-500 mb-2">
                            <Clock className="h-8 w-8 mx-auto" />
                          </div>
                          <div className="text-2xl font-bold text-purple-600">{teacherLevels[selectedLevel].hoursRequired}h</div>
                          <div className="text-sm text-purple-700 font-medium">Training Hours</div>
                        </div>
                      )}
                      
                      {teacherLevels[selectedLevel].experienceRequired && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 text-center">
                          <div className="text-orange-500 mb-2">
                            <Calendar className="h-8 w-8 mx-auto" />
                          </div>
                          <div className="text-2xl font-bold text-orange-600">{teacherLevels[selectedLevel].experienceRequired}</div>
                          <div className="text-sm text-orange-700 font-medium">Experience Required</div>
                        </div>
                      )}
                      
                      {teacherLevels[selectedLevel].directorApproval && (
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 text-center">
                          <div className="text-emerald-500 mb-2">
                            <CheckCircle className="h-8 w-8 mx-auto" />
                          </div>
                          <div className="text-xl font-bold text-emerald-600">Required</div>
                          <div className="text-sm text-emerald-700 font-medium">Director Approval</div>
                        </div>
                      )}
                      
                      {teacherLevels[selectedLevel].inPersonAssessment && (
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 text-center">
                          <div className="text-red-500 mb-2">
                            <Award className="h-8 w-8 mx-auto" />
                          </div>
                          <div className="text-xl font-bold text-red-600">2-Part Test</div>
                          <div className="text-sm text-red-700 font-medium">In-Person Assessment</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {teacherLevels[selectedLevel].modules && (
                    <div>
                      <h4 className="font-bold text-xl mb-4 text-green-700">📚 Required Modules:</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {teacherLevels[selectedLevel].modules.map((moduleSlug) => (
                          <div 
                            key={moduleSlug}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                              isModuleCompleted(moduleSlug) 
                                ? "bg-green-50 border-green-300 shadow-green-100" 
                                : "bg-orange-50 border-orange-300 shadow-orange-100"
                            }`}
                          >
                            <span className="font-medium">{formatModuleName(moduleSlug)}</span>
                            {isModuleCompleted(moduleSlug) ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-green-600 font-bold text-sm">Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <span className="text-orange-600 font-bold text-sm">Pending</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-bold text-xl mb-4 text-purple-700">🎁 Benefits & Opportunities:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {teacherLevels[selectedLevel].benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-purple-700 font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* BearBucks Rewards */}
          <div className="max-w-2xl mx-auto">
            <BearBucksRewards />
          </div>
          
          {/* Motivational Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Your Teaching Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <blockquote className="text-sm italic text-center text-neutral-700">
                    "Every child deserves a champion – an adult who will never give up on them, 
                    who understands the power of connection, and insists they become the best they can possibly be."
                  </blockquote>
                  <p className="text-xs text-right mt-2 text-neutral-500">- Raising Arizona Preschool Motto</p>
                </div>
                
                <p className="text-sm text-neutral-600">
                  Your growth as an educator directly impacts the development of the children in your care. 
                  Each level you achieve represents new skills and knowledge that create better learning 
                  experiences for our students.
                </p>
                
                <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Award className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Did you know? Master Lead Teachers at Raising Arizona earn higher compensation 
                    and receive special recognition throughout the year!
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-indigo-500" />
                  Quick Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">1</span>
                  </div>
                  <p className="text-sm">Complete training modules regularly to earn points and improve your skills</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">2</span>
                  </div>
                  <p className="text-sm">Take assessments to demonstrate your knowledge and unlock higher levels</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">3</span>
                  </div>
                  <p className="text-sm">Participate in school activities and games to earn bonus Bear Bucks</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">4</span>
                  </div>
                  <p className="text-sm">Connect with mentors and colleagues to share knowledge and experiences</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}