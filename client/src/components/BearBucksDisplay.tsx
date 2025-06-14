import { Coins, Star, Trophy, TrendingUp } from "lucide-react";
import { User } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  user: User;
  variant?: "compact" | "full";
  className?: string;
}

export default function PointsDisplay({ 
  user, 
  variant = "full", 
  className 
}: PointsDisplayProps) {
  if (!user) {
    return null;
  }

  const levelPercentage = calculateLevelProgress(user.points || 0, user.level || 1);
  const nextLevelPoints = getPointsForNextLevel(user.level || 1);
  const pointsToNextLevel = nextLevelPoints - (user.points || 0);

  // Get teacher level title
  const teacherLevelTitle = getTeacherLevelTitle(user.level || 1);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="flex items-center text-green-600">
          <Coins className="h-4 w-4 mr-1" />
          <span className="font-bold">{user.bearBucks || 0}</span>
        </div>
        <div className="flex items-center text-amber-500">
          <Star className="h-4 w-4 mr-1" />
          <span className="font-bold">{user.points || 0}</span>
        </div>
        <div className="flex items-center text-purple-600">
          <Trophy className="h-4 w-4 mr-1" />
          <span className="font-bold">{user.level || 1}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Teacher Profile</h3>
            <p className="text-sm text-muted-foreground">Your current progress</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Level</span>
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-1 text-purple-600" />
              <span className="font-bold text-lg">{user.level || 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Level progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
              <span className="text-sm font-medium">{teacherLevelTitle}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {pointsToNextLevel} points to next level
            </span>
          </div>
          <Progress value={levelPercentage} className="h-2" />
        </div>

        {/* Currency display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-green-700">Redeemable Points</div>
              <div className="font-bold text-xl text-green-800">{user.bearBucks || 0}</div>
              <div className="text-xs text-green-600 mt-1">Trade for Bear Bucks</div>
            </div>
            <Coins className="h-6 w-6 text-green-600" />
          </div>

          <div className="bg-amber-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-700">Achievement Points</div>
              <div className="font-bold text-xl text-amber-800">{user.points || 0}</div>
            </div>
            <Star className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        {/* Streak display */}
        {(user.streak || 0) > 0 && (
          <div className="mt-4 bg-orange-50 rounded-lg p-2 text-center">
            <span className="text-xs text-orange-700">
              🔥 {user.streak} day streak! Keep learning to earn bonus rewards!
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Helper functions for level calculations
import { 
  calculateLevelProgress, 
  getPointsForNextLevel, 
  getPointsForLevel, 
  getTeacherLevelTitle 
} from "@shared/levelUtils";