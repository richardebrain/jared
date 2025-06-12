import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, varchar, date, doublePrecision, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Sessions table for storing user sessions
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Schools schema
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  subscriptionActive: boolean("subscription_active").default(false),
  subscriptionType: text("subscription_type").default("basic"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  teacherCount: integer("teacher_count").default(0),
  isFreeAccess: boolean("is_free_access").default(false),
  adminPasswordHash: text("admin_password_hash"),
  customization: json("customization").$type<{
    primaryColor?: string,
    secondaryColor?: string,
    coreValues?: string[]
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User schema  
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  language: text("language").notNull(),
  nativeLanguage: text("native_language").notNull(),
  timeZone: text("time_zone").notNull(),
  profilePicture: text("profile_picture"),
  activeAvatarId: integer("active_avatar_id"),
  learningStyle: json("learning_style").$type<{
    visual: number,
    auditory: number,
    reading: number,
    kinesthetic: number,
    preferred: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | null
  }>(),
  bearBucks: integer("bear_bucks").default(0),
  points: integer("points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active"),
  achievementCount: integer("achievement_count").default(0),
  isAdmin: boolean("is_admin").default(false),
  isSchoolAdmin: boolean("is_school_admin").default(false),
  isOwner: boolean("is_owner").default(false),
  fingerprintExpiration: date("fingerprint_expiration"),
  cprExpiration: date("cpr_expiration"),
  firstAidExpiration: date("first_aid_expiration"),
  foodHandlerExpiration: date("food_handler_expiration"),
  jobTitle: text("job_title"),
  designations: json("designations").$type<string[]>(),
  hasUnreadMessages: boolean("has_unread_messages").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Logins table
export const dailyLogins = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loginDate: date("login_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning Modules schema
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(),
  pointValue: integer("point_value").default(5),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  content: text("content"),
  quiz: json("quiz").$type<{
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }[]
  }>(),
  isVisible: boolean("is_visible").default(true),
  averageRating: integer("average_rating").default(0),
  ratingCount: integer("rating_count").default(0),
  isSharedToCommunity: boolean("is_shared_to_community").default(false),
  schoolId: integer("school_id").references(() => schools.id),
  creatorId: integer("creator_id").references(() => users.id),
  moduleType: text("module_type").default("single"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Progress schema
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  completed: boolean("completed").default(false),
  progress: integer("progress").default(0),
  pointsEarned: integer("points_earned").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Basic required tables for functionality
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoQuizCompletions = pgTable("video_quiz_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: text("video_id").notNull(),
  pointsEarned: integer("points_earned").default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Essential type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = typeof learningModules.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertSchoolSchema = createInsertSchema(schools);
export const insertLearningModuleSchema = createInsertSchema(learningModules);