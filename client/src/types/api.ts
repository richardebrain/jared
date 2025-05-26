// API response types for client-side TypeScript safety
// These types define the structure of API responses to eliminate implicit any types

import type { User } from './user';
import type { 
  LearningModule, 
  UserProgress, 
  Assessment, 
  Achievement, 
  UserAchievement,
  StoreItem,
  UserItem,
  Meeting,
  DiscussionThread,
  DiscussionComment,
  School
} from '@shared/schema';

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Authentication responses
export interface AuthResponse extends ApiResponse<{
  user: User;
  token: string;
}> {}

export interface RefreshTokenResponse extends ApiResponse<{
  token: string;
}> {}

// User-related responses
export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends ApiResponse<User[]> {}

export interface UserStatsResponse extends ApiResponse<{
  totalPoints: number;
  currentStreak: number;
  achievementsCount: number;
  modulesCompleted: number;
  rank: number;
  level: number;
}> {}

// Learning module responses
export interface LearningModuleResponse extends ApiResponse<LearningModule> {}
export interface LearningModulesResponse extends ApiResponse<LearningModule[]> {}

export interface UserProgressResponse extends ApiResponse<UserProgress> {}
export interface UserProgressListResponse extends ApiResponse<UserProgress[]> {}

// Assessment responses
export interface AssessmentResponse extends ApiResponse<Assessment> {}
export interface AssessmentsResponse extends ApiResponse<Assessment[]> {}

export interface AssessmentResultResponse extends ApiResponse<{
  assessment: Assessment;
  recommendedModules: LearningModule[];
  strengthAreas: string[];
  growthAreas: string[];
}> {}

// Achievement responses
export interface AchievementResponse extends ApiResponse<Achievement> {}
export interface AchievementsResponse extends ApiResponse<Achievement[]> {}
export interface UserAchievementsResponse extends ApiResponse<UserAchievement[]> {}

// Store and items responses
export interface StoreItemsResponse extends ApiResponse<StoreItem[]> {}
export interface UserItemsResponse extends ApiResponse<UserItem[]> {}

export interface PurchaseResponse extends ApiResponse<{
  item: StoreItem;
  userItem: UserItem;
  remainingBearBucks: number;
}> {}

// Meeting responses
export interface MeetingResponse extends ApiResponse<Meeting> {}
export interface MeetingsResponse extends ApiResponse<Meeting[]> {}

export interface MeetingBookingResponse extends ApiResponse<{
  meeting: Meeting;
  confirmationCode: string;
}> {}

// Discussion responses
export interface DiscussionThreadResponse extends ApiResponse<DiscussionThread> {}
export interface DiscussionThreadsResponse extends ApiResponse<DiscussionThread[]> {}
export interface DiscussionCommentsResponse extends ApiResponse<DiscussionComment[]> {}

// School responses
export interface SchoolResponse extends ApiResponse<School> {}
export interface SchoolsResponse extends ApiResponse<School[]> {}

// Points and rewards responses
export interface PointsUpdateResponse extends ApiResponse<{
  newPoints: number;
  pointsEarned: number;
  newLevel?: number;
  achievements?: Achievement[];
}> {}

export interface SpinGameResponse extends ApiResponse<{
  reward: {
    type: 'points' | 'bearBucks' | 'item';
    amount?: number;
    item?: StoreItem;
  };
  newBalance: {
    points: number;
    bearBucks: number;
  };
}> {}

// Leaderboard responses
export interface LeaderboardEntry {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePicture'>;
  points: number;
  rank: number;
  streak: number;
}

export interface LeaderboardResponse extends ApiResponse<{
  entries: LeaderboardEntry[];
  userRank: number;
  totalUsers: number;
}> {}

// File upload responses
export interface FileUploadResponse extends ApiResponse<{
  url: string;
  filename: string;
  size: number;
}> {}

// Error response types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiResponse {
  success: false;
  errors: ValidationError[];
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {}

// Search and filter types
export interface SearchParams {
  query?: string;
  category?: string;
  difficulty?: string;
  featured?: boolean;
}

export interface FilteredModulesResponse extends PaginatedResponse<LearningModule> {}

// Notification types
export interface NotificationResponse extends ApiResponse<{
  id: string;
  type: 'achievement' | 'level_up' | 'reminder' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}[]> {}

// Analytics types
export interface AnalyticsResponse extends ApiResponse<{
  dailyActivity: Array<{
    date: string;
    points: number;
    modulesCompleted: number;
    timeSpent: number;
  }>;
  weeklyProgress: {
    currentWeek: number;
    previousWeek: number;
    percentChange: number;
  };
  topCategories: Array<{
    category: string;
    completedModules: number;
    totalTime: number;
  }>;
}> {} 