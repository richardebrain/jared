// Barrel export for all client-side types
// This allows importing types from a single location: import { User, ApiResponse } from '@/types'

// User types
export type {
  User,
  UserContextType,
  LoginResponse,
  UserUpdateRequest,
  LearningStyle,
  UserWithLearningStyle,
} from './user';

export {
  isValidUser,
  ensureUserDefaults,
} from './user';

// API types
export type {
  ApiResponse,
  AuthResponse,
  RefreshTokenResponse,
  UserResponse,
  UsersResponse,
  UserStatsResponse,
  LearningModuleResponse,
  LearningModulesResponse,
  UserProgressResponse,
  UserProgressListResponse,
  AssessmentResponse,
  AssessmentsResponse,
  AssessmentResultResponse,
  AchievementResponse,
  AchievementsResponse,
  UserAchievementsResponse,
  StoreItemsResponse,
  UserItemsResponse,
  PurchaseResponse,
  MeetingResponse,
  MeetingsResponse,
  MeetingBookingResponse,
  DiscussionThreadResponse,
  DiscussionThreadsResponse,
  DiscussionCommentsResponse,
  SchoolResponse,
  SchoolsResponse,
  PointsUpdateResponse,
  SpinGameResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  FileUploadResponse,
  ValidationError,
  ValidationErrorResponse,
  PaginationParams,
  PaginatedResponse,
  SearchParams,
  FilteredModulesResponse,
  NotificationResponse,
  AnalyticsResponse,
} from './api';

// Re-export commonly used shared types for convenience
export type {
  User as BaseUser,
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
  School,
} from '@shared/schema'; 