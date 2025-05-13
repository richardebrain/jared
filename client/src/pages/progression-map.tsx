import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import { 
  Trophy, 
  Award, 
  Medal, 
  BookOpen, 
  GraduationCap,
  Brain, 
  Sparkles,
  Star,
  LucideIcon,
  CheckCircle2,
  Lock,
  Clock,
  Lightbulb
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import BearAssistant from "@/components/BearAssistant";

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
  const { user, isLoadingUser } = useAuth();
  
  // Get user progress data
  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
    enabled: !!user
  });
  
  // Get completed modules data
  const { data: modules } = useQuery({
    queryKey: ["/api/modules"]
  });

  // Get assessment data
  const { data: assessments } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: !!user
  });

  // Define teacher levels with requirements
  const levelRequirements: Record<number, LevelRequirement> = {
    1: {
      points: 0,
      icon: BookOpen,
      color: "bg-blue-500",
      description: "Begin your journey in early childhood education by completing the orientation modules and your initial assessment.",
      benefits: [
        "Access to basic learning modules",
        "Daily free spin on the reward wheel",
        "Mindful Mornings training access"
      ]
    },
    2: {
      points: 100,
      hoursRequired: 5,
      icon: Lightbulb,
      color: "bg-green-500",
      description: "Develop foundational knowledge of classroom practices and child development milestones.",
      benefits: [
        "Unlock beginner classroom management techniques",
        "Ability to add classroom observations to your portfolio",
        "Access to the teacher community forum"
      ]
    },
    3: {
      points: 250,
      assessmentScore: 70,
      hoursRequired: 12,
      icon: Brain,
      color: "bg-yellow-500",
      description: "Gain deeper understanding of teaching methodologies and enhance your classroom engagement strategies.",
      benefits: [
        "Access to interactive lesson planning tools",
        "Unlock mini-module creation privileges",
        "Early access to new training materials"
      ]
    },
    4: {
      points: 500,
      assessmentScore: 80,
      hoursRequired: 25,
      icon: Medal,
      color: "bg-orange-500",
      description: "Lead small groups and plan developmentally appropriate activities for your classroom with confidence.",
      benefits: [
        "Lead Teacher certification",
        "Ability to mentor Trainee and Assistant Teachers",
        "Access to advanced classroom management training",
        "Preferred classroom assignment priority"
      ]
    },
    5: {
      points: 1000,
      assessmentScore: 90,
      hoursRequired: 50,
      icon: Trophy,
      color: "bg-purple-500",
      description: "Achieve mastery in early childhood education with comprehensive knowledge across all developmental domains.",
      benefits: [
        "Master Lead Teacher certification",
        "Curriculum development privileges",
        "Leadership opportunities within Raising Arizona",
        "Professional development stipend eligibility"
      ]
    },
    6: {
      points: 2000,
      assessmentScore: 95,
      hoursRequired: 100,
      icon: GraduationCap,
      color: "bg-red-500",
      description: "Mentor other teachers while continuing to expand your own expertise in specialized areas of early childhood education.",
      benefits: [
        "Mentor Teacher certification",
        "Workshop facilitation opportunities",
        "Regional conference representation eligibility",
        "Input on organizational training strategies",
        "Career advancement opportunities"
      ]
    }
  };

  // Calculate user progress metrics
  const currentLevel = user?.level || 1;
  const totalPoints = user?.points || 0;
  const highestAssessmentScore = assessments?.length 
    ? Math.max(...assessments.map(a => a.overallScore || 0)) 
    : 0;
  
  // Calculate hours spent (estimate based on module completion)
  const hoursSpent = userProgress?.reduce((total, progress) => {
    const module = modules?.find(m => m.id === progress.moduleId);
    // Assume each percent of progress is roughly 0.01 hours (for illustration)
    return total + ((progress.progress || 0) / 100) * (module?.duration || 1);
  }, 0) || 0;
  
  // Get next level requirements
  const nextLevel = levelRequirements[currentLevel + 1];
  const currentLevelReq = levelRequirements[currentLevel];
  
  // Calculate progress to next level
  const pointsToNextLevel = nextLevel ? nextLevel.points - totalPoints : 0;
  const pointsProgress = nextLevel ? (totalPoints / nextLevel.points) * 100 : 100;
  
  // Calculate assessment progress
  const assessmentProgress = nextLevel?.assessmentScore 
    ? (highestAssessmentScore / nextLevel.assessmentScore) * 100 
    : 100;
    
  // Calculate hours progress  
  const hoursProgress = nextLevel?.hoursRequired 
    ? (hoursSpent / nextLevel.hoursRequired) * 100 
    : 100;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Current level overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Teacher Progression Map</h1>
                  <p className="text-neutral-600 max-w-2xl">
                    Track your journey to becoming a Master Lead Teacher with our professional advancement path.
                    Complete modules, earn points, and pass assessments to level up your teaching career.
                  </p>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 flex flex-col items-center min-w-[180px]">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                    currentLevelReq?.color || "bg-blue-500"
                  )}>
                    {currentLevelReq?.icon && (
                      <currentLevelReq.icon className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg">
                    Level {currentLevel}:
                  </h3>
                  <p className="font-medium text-neutral-600">
                    {currentLevel === 1 && "Trainee Teacher"}
                    {currentLevel === 2 && "Assistant Teacher"}
                    {currentLevel === 3 && "Associate Teacher"}
                    {currentLevel === 4 && "Lead Teacher"}
                    {currentLevel === 5 && "Master Lead Teacher"}
                    {currentLevel === 6 && "Mentor Teacher"}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{totalPoints} XP</p>
                </div>
              </div>
              
              {nextLevel && (
                <div className="mt-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h3 className="font-semibold mb-3">Next Level Progress</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">XP Points: {totalPoints}/{nextLevel.points}</span>
                        <span className="text-sm font-medium">{Math.round(pointsProgress)}%</span>
                      </div>
                      <Progress value={pointsProgress} className="h-2" />
                    </div>
                    
                    {nextLevel.assessmentScore && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Assessment Score: {highestAssessmentScore}/{nextLevel.assessmentScore}%</span>
                          <span className="text-sm font-medium">{Math.round(assessmentProgress)}%</span>
                        </div>
                        <Progress value={assessmentProgress} className="h-2" />
                      </div>
                    )}
                    
                    {nextLevel.hoursRequired && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Learning Hours: {Math.round(hoursSpent)}/{nextLevel.hoursRequired}hrs</span>
                          <span className="text-sm font-medium">{Math.round(hoursProgress)}%</span>
                        </div>
                        <Progress value={hoursProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                      <span>You need <strong>{pointsToNextLevel} more XP</strong> to reach Level {currentLevel + 1}!</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Level progression map */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4">Teacher Advancement Path</h2>
              
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-0 bottom-0 left-[39px] md:left-1/2 w-1 bg-neutral-200 -translate-x-1/2 z-0" />
                
                {/* Level steps */}
                <div className="space-y-12 relative z-10">
                  {Object.entries(levelRequirements).map(([level, req], index) => {
                    const levelNum = parseInt(level);
                    const isCurrentLevel = currentLevel === levelNum;
                    const isCompleted = currentLevel > levelNum;
                    const isLocked = currentLevel < levelNum;
                    
                    return (
                      <div key={level} className={cn(
                        "flex flex-col md:flex-row md:items-center gap-4",
                        index % 2 === 1 ? "md:flex-row-reverse" : ""
                      )}>
                        {/* Level circle */}
                        <div className={cn(
                          "w-20 h-20 rounded-full border-4 flex items-center justify-center z-10",
                          isCurrentLevel ? "border-yellow-400 bg-white" : "border-neutral-200",
                          isCompleted ? "bg-green-500 border-green-600" : "",
                          isLocked ? "bg-neutral-100" : "",
                          req.color
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-10 w-10 text-white" />
                          ) : isLocked ? (
                            <Lock className="h-10 w-10 text-neutral-400" />
                          ) : (
                            <req.icon className="h-10 w-10 text-white" />
                          )}
                        </div>
                        
                        {/* Level card */}
                        <Card className={cn(
                          "flex-1 md:w-[calc(50%-3rem)]",
                          isCurrentLevel ? "border-yellow-300 bg-yellow-50" : "",
                          isCompleted ? "border-green-200 bg-green-50" : "",
                          isLocked ? "opacity-75" : ""
                        )}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                Level {level}: {level === "1" ? "Trainee Teacher" : 
                                              level === "2" ? "Assistant Teacher" : 
                                              level === "3" ? "Associate Teacher" : 
                                              level === "4" ? "Lead Teacher" : 
                                              level === "5" ? "Master Lead Teacher" : 
                                              "Mentor Teacher"}
                              </CardTitle>
                              <Badge variant={isCurrentLevel ? "default" : 
                                           isCompleted ? "secondary" : 
                                           "outline"}>
                                {isCurrentLevel ? "Current" : 
                                 isCompleted ? "Completed" : 
                                 "Locked"}
                              </Badge>
                            </div>
                            <CardDescription>{req.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                                <span>{req.points} XP required</span>
                              </div>
                              
                              {req.assessmentScore && (
                                <div className="flex items-center">
                                  <Brain className="h-4 w-4 mr-2 text-purple-500" />
                                  <span>{req.assessmentScore}% assessment score minimum</span>
                                </div>
                              )}
                              
                              {req.hoursRequired && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                  <span>{req.hoursRequired} learning hours required</span>
                                </div>
                              )}
                            </div>
                            
                            {req.benefits && req.benefits.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Level Benefits:</h4>
                                <ul className="text-sm space-y-1">
                                  {req.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-green-500 mr-2">•</span>
                                      <span>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            {isCurrentLevel && (
                              <Button asChild className="w-full">
                                <Link href="/dashboard">Continue Learning</Link>
                              </Button>
                            )}
                            {isCompleted && (
                              <div className="w-full text-center text-green-700 font-medium text-sm">
                                Completed on {new Date(user?.updatedAt || Date.now()).toLocaleDateString()}
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Point scoring summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">XP Scoring System</CardTitle>
                <CardDescription>How to earn points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Learning Modules</h4>
                  <ul className="text-sm space-y-1 text-neutral-600">
                    <li className="flex justify-between">
                      <span>Quick Lessons (5 min)</span>
                      <span className="font-medium">5 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mini Lessons (10 min)</span>
                      <span className="font-medium">10 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Standard Modules (30 min)</span>
                      <span className="font-medium">30 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Advanced Modules (60 min)</span>
                      <span className="font-medium">60 XP</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Daily Activities</h4>
                  <ul className="text-sm space-y-1 text-neutral-600">
                    <li className="flex justify-between">
                      <span>Daily Login</span>
                      <span className="font-medium">2 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Completing Assessment</span>
                      <span className="font-medium">50 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Forum Participation</span>
                      <span className="font-medium">3 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Spin Game Rewards</span>
                      <span className="font-medium">5-25 XP</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-3 rounded border border-green-100">
                  <h4 className="font-medium text-green-800 mb-1">Streak Bonuses</h4>
                  <ul className="text-sm space-y-1 text-green-700">
                    <li className="flex justify-between">
                      <span>3-Day Streak</span>
                      <span className="font-medium">+5 XP daily</span>
                    </li>
                    <li className="flex justify-between">
                      <span>7-Day Streak</span>
                      <span className="font-medium">+10 XP daily</span>
                    </li>
                    <li className="flex justify-between">
                      <span>14-Day Streak</span>
                      <span className="font-medium">+15 XP daily</span>
                    </li>
                    <li className="flex justify-between">
                      <span>30-Day Streak</span>
                      <span className="font-medium">+25 XP daily</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            {/* Bear assistant */}
            <BearAssistant />
          </div>
        </div>
      </main>
    </div>
  );
}