import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Award, 
  BookOpen, 
  Brain, 
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
import { useAuth } from "@/hooks/use-auth";
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
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
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
      hoursRequired: 10,
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
      hoursRequired: 20,
      modules: ["classroom-management", "child-development-basics", "curriculum-planning"],
      icon: Medal,
      color: "bg-purple-500",
      description: "Qualified teacher capable of independently managing a classroom and implementing curriculum. Requires 1 year of experience.",
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
      hoursRequired: 40,
      modules: ["advanced-curriculum", "parent-relations", "behavioral-management"],
      icon: Trophy,
      color: "bg-orange-500",
      description: "Experienced educator who demonstrates excellence in teaching and leadership abilities.",
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
      hoursRequired: 60,
      modules: ["leadership-in-ece", "advanced-child-development", "evaluation-methods"],
      icon: Crown,
      color: "bg-red-500",
      description: "Highest level of teaching excellence with comprehensive knowledge of early childhood education and exceptional classroom results.",
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
  
  // Get modules data
  const { data: modules = [] } = useQuery({
    queryKey: ["/api/modules"],
    enabled: !!user,
  });
  
  // Determine user's current level and progress to next level
  const determineUserLevel = () => {
    if (!user) return { currentLevel: "assistant", nextLevel: "associate", progress: 0 };
    
    const pointsEarned = user.points || 0;
    const levelKeys = Object.keys(teacherLevels);
    
    for (let i = levelKeys.length - 1; i >= 0; i--) {
      if (pointsEarned >= teacherLevels[levelKeys[i]].points) {
        const currentLevel = levelKeys[i];
        const nextLevel = i < levelKeys.length - 1 ? levelKeys[i + 1] : null;
        
        if (!nextLevel) return { currentLevel, nextLevel: null, progress: 100 };
        
        const currentLevelPoints = teacherLevels[currentLevel].points;
        const nextLevelPoints = teacherLevels[nextLevel].points;
        const pointsRange = nextLevelPoints - currentLevelPoints;
        const pointsProgress = pointsEarned - currentLevelPoints;
        const progress = Math.min(Math.round((pointsProgress / pointsRange) * 100), 99);
        
        return { currentLevel, nextLevel, progress };
      }
    }
    
    return { currentLevel: "assistant", nextLevel: "associate", progress: 0 };
  };
  
  const { currentLevel, nextLevel, progress } = determineUserLevel();
  
  // Calculate stats for the current user
  const calculateCompletedModules = () => {
    if (!userProgress || !Array.isArray(userProgress) || userProgress.length === 0) return 0;
    return userProgress.filter((progress: any) => 
      progress && (progress.progress === 100 || progress.completed)
    ).length;
  };
  
  const calculateTotalHours = () => {
    if (!userProgress || !Array.isArray(userProgress) || userProgress.length === 0 || 
        !modules || !Array.isArray(modules) || modules.length === 0) {
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
  function pointsToNextLevel() {
    if (!user || !nextLevel) return "0";
    const pointsEarned = user.points || 0;
    const nextLevelPoints = teacherLevels[nextLevel].points;
    return nextLevelPoints - pointsEarned;
  }
  
  function getCompletionStatus(level: string) {
    if (!user) return "locked";
    
    const userPoints = user.points || 0;
    const levelPoints = teacherLevels[level].points;
    
    if (userPoints >= levelPoints) {
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header and Current Level Card */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Progression Map</h1>
            <p className="text-neutral-600 mb-6">
              Follow your journey from Assistant Teacher to Master Lead Teacher at Raising Arizona Preschool.
            </p>
            
            {/* Current level card */}
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Current Level</CardTitle>
                  <Badge variant="outline" className="text-xs uppercase">
                    {currentLevel} Teacher
                  </Badge>
                </div>
                <CardDescription>
                  {pointsToNextLevel()} points until {nextLevel ? `${nextLevel} Teacher` : "Maximum level reached"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress to next level</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-500 mb-1">
                        <TrendingUp className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-2xl font-bold">{userData?.points || user?.points || 0}</div>
                      <div className="text-xs text-neutral-600">Total Points</div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-500 mb-1">
                        <CheckCircle className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-2xl font-bold">{calculateCompletedModules()}</div>
                      <div className="text-xs text-neutral-600">Modules Completed</div>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-yellow-500 mb-1">
                        <Clock className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-2xl font-bold">{calculateTotalHours()}</div>
                      <div className="text-xs text-neutral-600">Training Hours</div>
                    </div>
                  </div>
                  
                  {currentLevel === "senior" && progress >= 80 && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                      <h3 className="text-lg font-bold text-red-800 flex items-center justify-center">
                        <Crown className="h-5 w-5 mr-2" />
                        Master Teacher Assessment Available!
                      </h3>
                      <p className="text-sm text-red-700 mb-2">
                        You've earned the right to take the 100-question Master Lead Teacher assessment.
                        Score 90% or higher to achieve our highest teaching rank!
                      </p>
                      <Button className="bg-red-600 hover:bg-red-700">
                        Start Master Assessment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Level progression visualization */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2"></div>
              <div className="relative flex justify-between px-4 py-10">
                {Object.entries(teacherLevels).map(([level, requirements]) => {
                  const LevelIcon = requirements.icon;
                  const isActive = level === currentLevel;
                  const isCompleted = getCompletionStatus(level) === "completed";
                  const isLocked = getCompletionStatus(level) === "locked";
                  
                  return (
                    <div 
                      key={level} 
                      className="relative flex flex-col items-center cursor-pointer"
                      onClick={() => setSelectedLevel(level)}
                    >
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${
                          isActive 
                            ? "ring-4 ring-primary ring-offset-2" 
                            : isCompleted 
                              ? "bg-green-100 text-green-600" 
                              : isLocked 
                                ? "bg-neutral-200 text-neutral-400" 
                                : requirements.color + " text-white"
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : <LevelIcon className="h-6 w-6" />}
                      </div>
                      <div className="absolute -bottom-16 text-center w-24">
                        <div className={`font-semibold ${isActive ? "text-primary" : isLocked ? "text-neutral-400" : ""}`}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {requirements.points} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Selected level details */}
            <div className="mt-24">
              {selectedLevel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${teacherLevels[selectedLevel].color} text-white`}>
                        {React.createElement(teacherLevels[selectedLevel].icon, { className: "h-5 w-5" })}
                      </div>
                      {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Teacher Level
                    </CardTitle>
                    <CardDescription>
                      {teacherLevels[selectedLevel].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="requirements">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="requirements">Requirements</TabsTrigger>
                        <TabsTrigger value="benefits">Benefits</TabsTrigger>
                      </TabsList>
                      <TabsContent value="requirements" className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Level Requirements</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex p-3 bg-neutral-50 rounded-lg border">
                              <div className="mr-2 mt-1 text-primary">
                                <TrendingUp className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">Points Required</div>
                                <div className="text-sm">{teacherLevels[selectedLevel].points} points</div>
                              </div>
                            </div>
                            
                            {teacherLevels[selectedLevel].assessmentScore && (
                              <div className="flex p-3 bg-neutral-50 rounded-lg border">
                                <div className="mr-2 mt-1 text-primary">
                                  <Brain className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">Assessment Score</div>
                                  <div className="text-sm">{teacherLevels[selectedLevel].assessmentScore}% or higher</div>
                                </div>
                              </div>
                            )}
                            
                            {teacherLevels[selectedLevel].hoursRequired && (
                              <div className="flex p-3 bg-neutral-50 rounded-lg border">
                                <div className="mr-2 mt-1 text-primary">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">Training Hours</div>
                                  <div className="text-sm">{teacherLevels[selectedLevel].hoursRequired} hours minimum</div>
                                </div>
                              </div>
                            )}
                            
                            {teacherLevels[selectedLevel].modules && teacherLevels[selectedLevel].modules.length > 0 && (
                              <div className="flex p-3 bg-neutral-50 rounded-lg border">
                                <div className="mr-2 mt-1 text-primary">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">Required Modules</div>
                                  <div className="text-sm space-y-1 mt-1">
                                    {teacherLevels[selectedLevel].modules.map(module => (
                                      <div key={module} className="flex items-center text-xs">
                                        {isModuleCompleted(module) ? (
                                          <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                        ) : (
                                          <div className="h-3 w-3 rounded-full border border-neutral-300 mr-1 flex-shrink-0" />
                                        )}
                                        {formatModuleName(module)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedLevel === "master" && (
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                            <h4 className="font-medium text-red-800 flex items-center">
                              <Crown className="h-4 w-4 mr-1" />
                              Master Teacher Assessment
                            </h4>
                            <p className="text-sm text-red-700 mt-1">
                              The final requirement for Master Teacher is passing our comprehensive assessment with a 90% or higher score.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="benefits" className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Benefit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teacherLevels[selectedLevel].benefits.map((benefit, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge className={`${teacherLevels[selectedLevel].color} text-white`}>{index + 1}</Badge>
                                </TableCell>
                                <TableCell>{benefit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Bear Bucks Rewards Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Bear Bucks Rewards Program</h2>
            <BearBucksRewards 
              bearBucks={user?.bearBucks || 0} 
              points={user?.points || 0}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <BearAssistant 
                user={user || undefined} 
                initiallyMinimized={true}
              />
            </div>
            
            <div className="md:col-span-2">
              {/* Motivation card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Progress Matters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <blockquote className="border-l-4 border-primary pl-3 italic text-neutral-700">
                      "Every genius that ever was had a Mentor"
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}