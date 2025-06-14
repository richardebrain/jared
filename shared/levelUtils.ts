/**
 * Teacher level calculation utilities
 * Maps teacher roles to numeric levels based on points and requirements
 */

export interface TeacherLevelRequirement {
  points: number;
  assessmentScore?: number;
  hoursRequired?: number;
  experienceRequired?: string;
  directorApproval?: boolean;
  inPersonAssessment?: boolean;
  modules?: string[];
}

export const TEACHER_LEVELS: Record<string, TeacherLevelRequirement> = {
  "assistant": {
    points: 0,
  },
  "associate": {
    points: 100,
    assessmentScore: 60,
    hoursRequired: 10,
  },
  "lead": {
    points: 250,
    assessmentScore: 70,
    hoursRequired: 20,
    experienceRequired: "6 months",
    directorApproval: true,
    modules: ["classroom-management", "child-development-basics", "curriculum-planning"],
  },
  "senior": {
    points: 500,
    assessmentScore: 80,
    hoursRequired: 40,
    experienceRequired: "6 months",
    directorApproval: true,
    modules: ["advanced-curriculum", "parent-relations", "behavioral-management"],
  },
  "master": {
    points: 1000,
    assessmentScore: 90,
    hoursRequired: 60,
    experienceRequired: "6 months",
    directorApproval: true,
    inPersonAssessment: true,
    modules: ["leadership-in-ece", "advanced-child-development", "evaluation-methods"],
  }
};

export const LEVEL_TO_ROLE: Record<number, string> = {
  1: "assistant",
  2: "associate", 
  3: "lead",
  4: "senior",
  5: "master"
};

export const ROLE_TO_LEVEL: Record<string, number> = {
  "assistant": 1,
  "associate": 2,
  "lead": 3,
  "senior": 4,
  "master": 5
};

/**
 * Calculate user's level based on their points
 */
export function calculateUserLevel(points: number): number {
  const levels = Object.keys(TEACHER_LEVELS).reverse(); // Start from highest level
  
  for (const role of levels) {
    if (points >= TEACHER_LEVELS[role].points) {
      return ROLE_TO_LEVEL[role];
    }
  }
  
  return 1; // Default to assistant level
}

/**
 * Get teacher role name from level number
 */
export function getLevelRole(level: number): string {
  return LEVEL_TO_ROLE[level] || "assistant";
}

/**
 * Get level number from teacher role name
 */
export function getRoleLevel(role: string): number {
  return ROLE_TO_LEVEL[role] || 1;
}

/**
 * Get teacher level title for display
 */
export function getTeacherLevelTitle(level: number): string {
  const role = getLevelRole(level);
  
  switch (role) {
    case "assistant":
      return "Assistant Teacher";
    case "associate":
      return "Associate Teacher";
    case "lead":
      return "Lead Teacher";
    case "senior":
      return "Senior Teacher";
    case "master":
      return "Master Lead Teacher";
    default:
      return "Assistant Teacher";
  }
}

/**
 * Calculate points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  const nextRole = getLevelRole(nextLevel);
  
  if (nextRole && TEACHER_LEVELS[nextRole]) {
    return TEACHER_LEVELS[nextRole].points;
  }
  
  return TEACHER_LEVELS["master"].points; // Max level
}

/**
 * Calculate points needed to reach current level
 */
export function getPointsForLevel(level: number): number {
  const role = getLevelRole(level);
  return TEACHER_LEVELS[role]?.points || 0;
}

/**
 * Calculate progress percentage to next level
 */
export function calculateLevelProgress(points: number, currentLevel: number): number {
  const currentLevelPoints = getPointsForLevel(currentLevel);
  const nextLevelPoints = getPointsForNextLevel(currentLevel);
  
  if (currentLevel >= 5) return 100; // At max level
  
  const pointsInCurrentLevel = points - currentLevelPoints;
  const pointsRequiredForNextLevel = nextLevelPoints - currentLevelPoints;
  
  return Math.min(100, Math.floor((pointsInCurrentLevel / pointsRequiredForNextLevel) * 100));
}