import { LucideIcon } from "lucide-react";

export interface AchievementLevel {
  level: number;
  title: string;
  color: string;
  icon: LucideIcon;
  requiredModules: number;
  requiredPoints: number;
}

export interface Milestone {
  id: number;
  name: string;
  x: number;
  y: number;
  value: number;
  description: string;
  icon: LucideIcon;
  achieved?: boolean;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  awarded: boolean;
  awardedAt?: Date;
  category: 'module' | 'assessment' | 'activity' | 'special';
}

export interface UserAchievement {
  userId: number;
  achievementId: number;
  awardedAt: Date;
  achievement: Achievement;
}

export const calculateTeacherLevel = (totalPoints: number): string => {
  if (totalPoints >= 3500) return "Mentor Teacher";
  if (totalPoints >= 2500) return "Master Lead Teacher";
  if (totalPoints >= 1500) return "Lead Teacher";
  if (totalPoints >= 800) return "Associate Teacher";
  if (totalPoints >= 300) return "Assistant Teacher";
  return "Teacher in Training";
};

export const calculatePointsForModule = (difficulty: string, progress: number, completed: boolean): number => {
  // Base points based on difficulty
  const basePoints = 
    difficulty === 'beginner' ? 50 : 
    difficulty === 'intermediate' ? 100 : 
    difficulty === 'advanced' ? 150 : 75;
  
  // Partial points for progress
  const progressPoints = Math.floor((progress / 100) * basePoints);
  
  // Bonus for completion
  const completionBonus = completed ? Math.floor(basePoints * 0.5) : 0;
  
  return progressPoints + completionBonus;
};