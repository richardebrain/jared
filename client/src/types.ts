/**
 * Type definitions for the application
 */

// Difficulty levels for assessment questions
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Structure for an assessment question
export interface AssessmentQuestion {
  id: string;
  domain: string;
  text: string;
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Structure for storing assessment answers
export interface AssessmentAnswers {
  [questionId: string]: number;
}

// User learning style preferences
export interface LearningStyle {
  visual: number;
  reading: number;
  auditory: number;
  kinesthetic: number;
  preferred: string | null;
}

// User profile information
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  nativeLanguage: string;
  timeZone: string;
  profilePicture: string | null;
  learningStyle: LearningStyle;
  points: number | null;
  lifetimePoints: number | null;
  bearBucks: number;
  level: number;
  streak: number;
  lastActive: string;
  achievementCount: number;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isOwner: boolean;
  schoolId: number;
  createdAt: string;
  fingerprint_expiration?: string | null;
  cpr_expiration?: string | null;
  first_aid_expiration?: string | null;
  food_handler_expiration?: string | null;
  hasUnreadMessages?: boolean;
}

// Domain definition for the assessment
export interface AssessmentDomain {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Stats tracking for assessment performance
export interface DomainStats {
  questionsAttempted: number;
  questionsCorrect: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  currentDifficulty: DifficultyLevel;
}

// Assessment feedback display
export interface AnswerFeedback {
  shown: boolean;
  correct: boolean;
  message: string;
  explanation: string;
}

// Assessment state
export type AssessmentState = 'initial' | 'assessment' | 'celebration' | 'results';