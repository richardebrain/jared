import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, varchar, date, doublePrecision, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Clean schema without problematic drizzle-zod insertSchema calls

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
  subscriptionType: text("subscription_type").default("basic"), // basic, owner_toolkit, premium_branding
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  teacherCount: integer("teacher_count").default(0),
  isFreeAccess: boolean("is_free_access").default(false), // Set to true for Raising Arizona
  adminPasswordHash: text("admin_password_hash"), // Password hash for school admin access
  customization: json("customization").$type<{
    primaryColor?: string,
    secondaryColor?: string,
    coreValues?: string[]
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual insert schema for schools to avoid TypeScript conflicts
export const insertSchoolSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  subscriptionActive: z.boolean().default(false),
  subscriptionType: z.string().default("basic"),
  subscriptionExpiresAt: z.date().optional(),
  teacherCount: z.number().default(0),
  isFreeAccess: z.boolean().default(false),
  adminPasswordHash: z.string().optional(),
  customization: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    coreValues: z.array(z.string()).optional()
  }).optional(),
});

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

// User schema  
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture"),
  isAdmin: boolean("is_admin").default(false),
  isSchoolAdmin: boolean("is_school_admin").default(false),
  isOwner: boolean("is_owner").default(false),
  level: text("level").default("Associate Teacher"),
  points: integer("points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  bearBucks: integer("bear_bucks").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActiveDate: date("last_active_date"),
  hasCompletedTutorial: boolean("has_completed_tutorial").default(false),
  hasCompletedAssessment: boolean("has_completed_assessment").default(false),
  languagePreference: text("language_preference").default("en"),
  timezonePreference: text("timezone_preference").default("UTC"),
  jobTitle: text("job_title"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  dateOfBirth: date("date_of_birth"),
  eceHours: doublePrecision("ece_hours").default(0),
  personalityType: text("personality_type"),
  yearOfExperience: integer("year_of_experience"),
  teachingApproach: text("teaching_approach"),
  specialization: text("specialization"),
  certifications: json("certifications").$type<{
    fingerprint?: string,
    firstAid?: string,
    cpr?: string,
    foodHandler?: string
  }>(),
  hasUnreadMessages: boolean("has_unread_messages").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = z.object({
  schoolId: z.number().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  profilePicture: z.string().optional(),
  isAdmin: z.boolean().default(false),
  isSchoolAdmin: z.boolean().default(false),
  isOwner: z.boolean().default(false),
  level: z.string().default("Associate Teacher"),
  points: z.number().default(0),
  lifetimePoints: z.number().default(0),
  bearBucks: z.number().default(0),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastActiveDate: z.date().optional(),
  hasCompletedTutorial: z.boolean().default(false),
  hasCompletedAssessment: z.boolean().default(false),
  languagePreference: z.string().default("en"),
  timezonePreference: z.string().default("UTC"),
  jobTitle: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  eceHours: z.number().default(0),
  personalityType: z.string().optional(),
  yearOfExperience: z.number().optional(),
  teachingApproach: z.string().optional(),
  specialization: z.string().optional(),
  certifications: z.object({
    fingerprint: z.string().optional(),
    firstAid: z.string().optional(),
    cpr: z.string().optional(),
    foodHandler: z.string().optional()
  }).optional(),
  hasUnreadMessages: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Learning Modules schema
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration"), // Duration in minutes
  pointValue: integer("point_value").default(5),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  difficulty: text("difficulty").default("beginner"),
  category: text("category").default("general"),
  content: text("content"), // JSON string containing module sections
  quiz: text("quiz"), // JSON string containing quiz data
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  averageRating: doublePrecision("average_rating").default(0),
  ratingCount: integer("rating_count").default(0),
  isSharedToCommunity: boolean("is_shared_to_community").default(false),
  schoolId: integer("school_id").references(() => schools.id),
  eceHours: doublePrecision("ece_hours"),
  eceCategory: text("ece_category"),
  creatorId: integer("creator_id").references(() => users.id),
});

export const insertLearningModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().optional(),
  pointValue: z.number().default(5),
  imageUrl: z.string().optional(),
  featured: z.boolean().default(false),
  difficulty: z.string().default("beginner"),
  category: z.string().default("general"),
  content: z.string().optional(),
  quiz: z.string().optional(),
  isVisible: z.boolean().default(true),
  averageRating: z.number().default(0),
  ratingCount: z.number().default(0),
  isSharedToCommunity: z.boolean().default(false),
  schoolId: z.number().optional(),
  eceHours: z.number().optional(),
  eceCategory: z.string().optional(),
  creatorId: z.number().optional(),
});

export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModules.$inferSelect;

// Export all schema types for compatibility
export type SchoolType = typeof schools.$inferSelect;
export type UserType = typeof users.$inferSelect;
export type LearningModuleType = typeof learningModules.$inferSelect;