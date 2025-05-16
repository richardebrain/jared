import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Flame, Lock, BookOpen, Calendar } from "lucide-react";
import { User } from "@shared/schema";

interface GameAchievementsProps {
  user: User | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: "engagement" | "learning" | "teaching" | "values";
  color: string;
}

export default function GameAchievements({ user }: GameAchievementsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Calculate achievements and progress based on user data
  const achievements: Achievement[] = [
    {
      id: "login-streak",
      name: "Dedication Star",
      description: "Log in 5 days in a row",
      icon: <Flame className="h-6 w-6" />,
      progress: user?.streak || 0,
      maxProgress: 5,
      unlocked: (user?.streak || 0) >= 5,
      category: "engagement",
      color: "bg-orange-500"
    },
    {
      id: "module-complete",
      name: "Knowledge Seeker",
      description: "Complete 3 training modules",
      icon: <BookOpen className="h-6 w-6" />,
      progress: user?.modules?.filter(m => m.completed)?.length || 0,
      maxProgress: 3,
      unlocked: (user?.modules?.filter(m => m.completed)?.length || 0) >= 3,
      category: "learning",
      color: "bg-blue-500"
    },
    {
      id: "core-values",
      name: "Core Values Champion",
      description: "Complete the CORE training module",
      icon: <Star className="h-6 w-6" />,
      progress: user?.modules?.some(m => m.moduleId === 33 && m.completed) ? 1 : 0,
      maxProgress: 1,
      unlocked: user?.modules?.some(m => m.moduleId === 33 && m.completed) || false,
      category: "values",
      color: "bg-amber-500"
    },
    {
      id: "bear-bucks-collector",
      name: "Bear Bucks Collector",
      description: "Earn your first 5 Bear Bucks",
      icon: <Award className="h-6 w-6" />,
      progress: user?.bearBucks || 0,
      maxProgress: 5,
      unlocked: (user?.bearBucks || 0) >= 5,
      category: "engagement",
      color: "bg-green-500"
    },
    {
      id: "master-teacher",
      name: "Master Teacher Path",
      description: "Reach level 5",
      icon: <Trophy className="h-6 w-6" />,
      progress: user?.level || 1,
      maxProgress: 5,
      unlocked: (user?.level || 1) >= 5,
      category: "teaching",
      color: "bg-purple-500"
    },
    {
      id: "assessment-complete",
      name: "Self-Aware Educator",
      description: "Complete the teaching assessment",
      icon: <Calendar className="h-6 w-6" />,
      progress: user?.assessments?.some(a => a.completed) ? 1 : 0,
      maxProgress: 1,
      unlocked: user?.assessments?.some(a => a.completed) || false,
      category: "teaching",
      color: "bg-teal-500"
    }
  ];
  
  // Filter achievements by category
  const filteredAchievements = activeCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);
  
  // Calculate total progress
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalProgress = Math.round((unlockedAchievements / totalAchievements) * 100);

  return (
    <Card className="overflow-hidden border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Teacher Achievements</span>
            </CardTitle>
            <CardDescription className="text-amber-100">
              Track your progress and unlock special badges
            </CardDescription>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/30">
            {unlockedAchievements}/{totalAchievements} Unlocked
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-500">Overall Progress</span>
            <span className="text-sm text-gray-500">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
        
        {/* Category Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <Badge 
            className={`cursor-pointer ${activeCategory === "all" ? "bg-amber-500" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </Badge>
          <Badge 
            className={`cursor-pointer ${activeCategory === "engagement" ? "bg-amber-500" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => setActiveCategory("engagement")}
          >
            Engagement
          </Badge>
          <Badge 
            className={`cursor-pointer ${activeCategory === "learning" ? "bg-amber-500" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => setActiveCategory("learning")}
          >
            Learning
          </Badge>
          <Badge 
            className={`cursor-pointer ${activeCategory === "teaching" ? "bg-amber-500" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => setActiveCategory("teaching")}
          >
            Teaching
          </Badge>
          <Badge 
            className={`cursor-pointer ${activeCategory === "values" ? "bg-amber-500" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => setActiveCategory("values")}
          >
            Core Values
          </Badge>
        </div>
        
        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`${achievement.unlocked ? "bg-white" : "bg-gray-50"} border ${achievement.unlocked ? "border-" + achievement.color.replace("bg-", "") : "border-gray-200"} rounded-lg p-3 relative`}
            >
              <div className="flex items-start gap-3">
                <div className={`${achievement.color} p-2 rounded-lg ${achievement.unlocked ? "" : "opacity-30"}`}>
                  {achievement.unlocked ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    {achievement.unlocked && (
                      <Badge className={`${achievement.color} text-white`}>Unlocked</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs text-gray-500">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className={`h-1.5 ${achievement.unlocked ? achievement.color.replace("bg", "bg") : "bg-gray-200"}`} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}