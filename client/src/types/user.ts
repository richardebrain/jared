// Client-side User type definitions
// These types provide better type safety for frontend components

import type { User as BaseUser } from '@shared/schema';

// Enhanced User type for client-side use
// Ensures commonly accessed fields are never null/undefined
export interface User extends Omit<BaseUser, 'points' | 'streak' | 'bearBucks' | 'level' | 'achievementCount'> {
  // Guarantee these fields are always numbers (never null)
  points: number;
  streak: number;
  bearBucks: number;
  level: number;
  achievementCount: number;
}

// Type guard to ensure a BaseUser has the required non-null fields
export function isValidUser(user: BaseUser | null | undefined): user is User {
  return (
    user !== null &&
    user !== undefined &&
    typeof user.points === 'number' &&
    typeof user.streak === 'number' &&
    typeof user.bearBucks === 'number' &&
    typeof user.level === 'number' &&
    typeof user.achievementCount === 'number'
  );
}

// Helper function to safely convert BaseUser to User with defaults
export function ensureUserDefaults(user: BaseUser | null | undefined): User | null {
  if (!user) return null;
  
  return {
    ...user,
    points: user.points ?? 0,
    streak: user.streak ?? 0,
    bearBucks: user.bearBucks ?? 0,
    level: user.level ?? 1,
    achievementCount: user.achievementCount ?? 0,
  };
}

// Common user-related types for client components
export interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

// API response types
export interface LoginResponse {
  user: User;
  token: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  language?: string;
  nativeLanguage?: string;
  timeZone?: string;
}

// Learning style types (extracted from schema for better typing)
export interface LearningStyle {
  visual: number;
  auditory: number;
  reading: number;
  kinesthetic: number;
  preferred: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | null;
}

// User with populated learning style
export interface UserWithLearningStyle extends User {
  learningStyle: LearningStyle | null;
} 