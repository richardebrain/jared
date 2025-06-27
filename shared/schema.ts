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

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});

// User schema  
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // Can be null for users who haven't selected a school yet
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  language: text("language").notNull(),
  nativeLanguage: text("native_language").notNull(),
  timeZone: text("time_zone").notNull(),
  profilePicture: text("profile_picture"),
  // Avatar customization fields
  activeAvatarId: integer("active_avatar_id"), // Reference to the current avatar configuration
  learningStyle: json("learning_style").$type<{
    visual: number,
    auditory: number,
    reading: number,
    kinesthetic: number,
    preferred: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | null
  }>(),
  bearBucks: integer("bear_bucks").default(0),
  points: integer("points").default(0),
  lifetimePoints: integer("lifetime_points").default(0), // Track total earned points for level progression
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active"),
  achievementCount: integer("achievement_count").default(0),
  isAdmin: boolean("is_admin").default(false),
  isSchoolAdmin: boolean("is_school_admin").default(false), // School directors/admins
  isOwner: boolean("is_owner").default(false), // App owner with full access to subscription management
  // Certification tracking fields
  fingerprintExpiration: date("fingerprint_expiration"), // Expiration date for Fingerprint card
  cprExpiration: date("cpr_expiration"), // Expiration date for CPR certification
  firstAidExpiration: date("first_aid_expiration"), // Expiration date for First Aid certification
  foodHandlerExpiration: date("food_handler_expiration"), // Expiration date for Food Handler card
  jobTitle: text("job_title"), // Teacher, Lead Teacher, Director, etc.
  designations: json("designations").$type<string[]>(), // Special qualifications or designations
  hasUnreadMessages: boolean("has_unread_messages").default(false), // Flag for unread welcome messages
  // OAuth integration fields
  googleId: text("google_id").unique(), // Google OAuth ID for SSO
  // ECE Hours renewal tracking
  eceHoursRenewalDate: date("ece_hours_renewal_date"), // Annual ECE hours renewal date, defaults to first login if not set
  // Song generation tracking fields for MusicMakerPrek
  songRequestsThisWeek: integer("song_requests_this_week").default(0),
  lastSongWeek: text("last_song_week"), // Format: "YYYY-WW"
  // Tutorial completion tracking
  hasCompletedTutorial: boolean("has_completed_tutorial").default(false),
  // Password reset fields
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Bear Bucks Transactions table for tracking bear bucks transfers between users
export const bearBucksTransactions = pgTable("bear_bucks_transactions", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  senderId: integer("sender_id").references(() => users.id), // null for system transactions
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBearBucksTransactionSchema = createInsertSchema(bearBucksTransactions).omit({
  id: true,
  createdAt: true,
});

// Daily Logins table for tracking user login activity
export const dailyLogins = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loginDate: date("login_date").notNull(), // date of login (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyLoginSchema = createInsertSchema(dailyLogins).omit({
  id: true,
  createdAt: true,
});

// Learning Modules schema
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  pointValue: integer("point_value").default(5), // points awarded for completing the module
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  category: text("category").notNull(),
  content: text("content"), // HTML content of the module
  quiz: json("quiz").$type<{
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }[]
  }>(),
  isVisible: boolean("is_visible").default(true), // controls visibility on dashboard
  // New fields for module ratings and community sharing
  averageRating: integer("average_rating").default(0), // Average rating (0-5)
  ratingCount: integer("rating_count").default(0), // Number of ratings received
  isSharedToCommunity: boolean("is_shared_to_community").default(false), // Whether shared to community
  schoolId: integer("school_id").references(() => schools.id), // School that created this module
  creatorId: integer("creator_id").references(() => users.id), // User who created this module
  
  // Enhanced features for advanced module types
  moduleType: text("module_type").default("single"), // single, course, interactive
  courseStructure: json("course_structure").$type<{
    modules?: Array<{
      id: string;
      title: string;
      description: string;
      duration: number;
      activities: Array<{
        type: 'watch' | 'read' | 'practice' | 'reflect' | 'quiz' | 'journal' | 'breathing' | 'recording';
        title: string;
        duration: number;
        content: string;
        videoUrl?: string;
        audioUrl?: string;
        interactionType?: 'timer' | 'recorder' | 'worksheet' | 'form';
      }>;
      completionRequirements: {
        passingScore?: number;
        requiredActivities?: string[];
        timeRequirement?: number;
      };
    }>;
    sequentialUnlock?: boolean;
    certificateAwarded?: boolean;
    badgeType?: string;
  }>(),
  
  interactiveElements: json("interactive_elements").$type<{
    hasTimer?: boolean;
    hasAudioRecording?: boolean;
    hasJournaling?: boolean;
    hasBreathingExercises?: boolean;
    hasWorksheets?: boolean;
    customInteractions?: Array<{
      type: string;
      config: Record<string, any>;
    }>;
  }>(),
  
  advancedQuizTypes: json("advanced_quiz_types").$type<{
    matching?: Array<{
      prompt: string;
      pairs: Array<{ left: string; right: string }>;
    }>;
    trueFalse?: Array<{
      statement: string;
      correct: boolean;
      explanation?: string;
    }>;
    multipleResponse?: Array<{
      question: string;
      options: string[];
      correctAnswers: number[];
      explanation?: string;
    }>;
  }>(),
  
  certificationSystem: json("certification_system").$type<{
    enabled?: boolean;
    badgeName?: string;
    badgeImageUrl?: string;
    requirements?: {
      completionPercentage?: number;
      minimumScore?: number;
      timeSpent?: number;
      activitiesCompleted?: string[];
    };
    sharingOptions?: {
      allowSocialShare?: boolean;
      generatePDF?: boolean;
      addToProfile?: boolean;
    };
  }>(),
  
  // ECE Training Hours fields
  eceHoursEligible: boolean("ece_hours_eligible").default(false),
  eceHours: integer("ece_hours"), // actual ECE hours awarded for this module
  eceCategory: text("ece_category"), // e.g., "social-emotional", "cognitive-development"
  trainingDuration: integer("training_duration"), // minutes - actual training time
  approvedTrainerId: integer("approved_trainer_id").references(() => users.id), // trainer who created this
  
  // Onboarding system fields
  isOnboardingModule: boolean("is_onboarding_module").default(false), // true if this is required for new teacher onboarding
  onboardingOrder: integer("onboarding_order"), // order in which onboarding modules should be completed
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
});

// User Progress schema
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  progress: integer("progress").notNull().default(0), // percentage complete
  completed: boolean("completed").default(false),
  passed: boolean("passed").default(false), // true only if passed the final assessment
  finalScore: integer("final_score"), // percentage score on final assessment
  recommended: boolean("recommended").default(false), // added for personalized recommendations
  pointsEarned: integer("points_earned").default(0), // points earned from this module
  lastAccessed: timestamp("last_accessed").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastAccessed: true,
});

// Meetings schema
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  hostId: integer("host_id").notNull().references(() => users.id),
  guestId: integer("guest_id").references(() => users.id),
  timeZone: text("time_zone").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

// Assessment schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").default("initial"), // initial, self, progress (changed from "standard")
  overallScore: integer("overall_score"),
  completed: boolean("completed").default(false),
  results: json("results").$type<Record<string, string>>(),
  
  // Updated for 6-level adaptive system
  domainScores: json("domain_scores").$type<Record<string, { 
    score: number, 
    maxDifficulty: number, // Changed from string to number (1-6)
    questionsAnswered: number,
    correctAnswers: number
  }>>(),
  
  // Adaptive algorithm tracking fields
  currentDifficulty: integer("current_difficulty").default(3), // Current global difficulty (1-6)
  difficultyProgression: json("difficulty_progression").$type<number[]>(), // Track difficulty changes throughout assessment
  domainCoverage: json("domain_coverage").$type<Record<string, number>>(), // Track questions per domain
  
  // Legacy field for backward compatibility - keeping for now
  categoryScores: json("category_scores").$type<Array<{
    category: string;
    score: number;
    level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery';
    description: string;
    questionsAnswered: number;
    correctAnswers: number;
  }>>(),
  
  strengthAreas: json("strength_areas").$type<string[]>(),
  growthAreas: json("growth_areas").$type<string[]>(),
  incorrectAnswers: json("incorrect_answers").$type<Record<string, string[]>>(),
  recommendedModules: json("recommended_modules").$type<number[]>(),
  personalizedLearningPath: json("personalized_learning_path").$type<Array<{
    domainId: string;
    domainName: string;
    priority: 'high' | 'medium' | 'low' | 'suggested';
    recommendation: string;
    moduleType: 'foundational' | 'intermediate' | 'advanced' | 'mastery';
    reason: string;
  }>>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  assessmentType: text("assessment_type").default("INITIAL_ADAPTIVE"), // Updated default
  notes: text("notes"),
  teacherLevel: text("teacher_level"),
}, (table) => ({
  // Critical index for user assessment queries (user + type + completed)
  userTypeCompletedIdx: index("assessments_user_type_completed_idx").on(table.userId, table.type, table.completed),
  // Index for user's completed assessments
  userCompletedIdx: index("assessments_user_completed_idx").on(table.userId, table.completed),
  // Index for assessment type filtering
  typeIdx: index("assessments_type_idx").on(table.type),
  // Index for completion status
  completedIdx: index("assessments_completed_idx").on(table.completed),
  // Index for temporal analytics
  completedAtIdx: index("assessments_completed_at_idx").on(table.completedAt),
  // Index for assessment type analytics
  assessmentTypeIdx: index("assessments_assessment_type_idx").on(table.assessmentType),
}));

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

// Relations definitions below are commented out as they are redefined at the end of the file
/*
export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users)
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id]
  }),
  progress: many(userProgress),
  meetings: many(meetings, { relationName: "host" }),
  guestMeetings: many(meetings, { relationName: "guest" }),
  assessments: many(assessments)
}));
*/

export const learningModulesRelations = relations(learningModules, ({ many, one }) => ({
  progress: many(userProgress),
  ratings: many(moduleRatings),
  school: one(schools, {
    fields: [learningModules.schoolId],
    references: [schools.id]
  })
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  }),
  module: one(learningModules, {
    fields: [userProgress.moduleId],
    references: [learningModules.id]
  })
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  host: one(users, {
    fields: [meetings.hostId],
    references: [users.id],
    relationName: "host"
  }),
  guest: one(users, {
    fields: [meetings.guestId],
    references: [users.id],
    relationName: "guest"
  })
}));

// Achievements schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  requiredPoints: integer("required_points"),
  requiredModules: integer("required_modules"),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// User achievements schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher invitations schema
export const teacherInvitations = pgTable("teacher_invitations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  email: text("email").notNull(),
  invitationToken: text("invitation_token").notNull().unique(),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeacherInvitationSchema = createInsertSchema(teacherInvitations, {
  invitationToken: z.string().min(40),
  email: z.string().email("Valid email address is required"),
  expiresAt: z.date(),
}).omit({
  id: true,
  sentAt: true,
  acceptedAt: true,
  createdAt: true,
});

// Define relation types for teacher invitations
export const teacherInvitationsRelations = relations(teacherInvitations, ({ one }) => ({
  school: one(schools, {
    fields: [teacherInvitations.schoolId],
    references: [schools.id]
  }),
  invitedBy: one(users, {
    fields: [teacherInvitations.invitedByUserId],
    references: [users.id]
  })
}));

export type TeacherInvitation = typeof teacherInvitations.$inferSelect;
export type InsertTeacherInvitation = z.infer<typeof insertTeacherInvitationSchema>;

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
  createdAt: true,
});

// Store items schema
export const storeItems = pgTable("store_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), 
  category: text("category").notNull(),
  bearBucksCost: integer("bear_bucks_cost").notNull(),
  levelRequired: integer("level_required").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStoreItemSchema = createInsertSchema(storeItems).omit({
  id: true,
  createdAt: true,
});

// User items inventory schema
export const userItems = pgTable("user_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => storeItems.id),
  acquired: timestamp("acquired").defaultNow(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserItemSchema = createInsertSchema(userItems).omit({
  id: true,
  acquired: true,
  createdAt: true,
});

// Spin game rewards history
export const spinGameRewards = pgTable("spin_game_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardType: text("reward_type").notNull(), // points, bearBucks, item, etc.
  rewardAmount: integer("reward_amount"),
  itemId: integer("item_id").references(() => storeItems.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpinGameRewardSchema = createInsertSchema(spinGameRewards).omit({
  id: true,
  createdAt: true,
});

// Streak Rewards schema
export const streakRewards = pgTable("streak_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardType: text("reward_type").notNull(), // silver_box, gold_box, etc.
  streakCount: integer("streak_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStreakRewardSchema = createInsertSchema(streakRewards).omit({
  id: true,
  createdAt: true,
});

export const streakRewardsRelations = relations(streakRewards, ({ one }) => ({
  user: one(users, {
    fields: [streakRewards.userId],
    references: [users.id],
  }),
}));

export type StreakReward = typeof streakRewards.$inferSelect;
export type InsertStreakReward = z.infer<typeof insertStreakRewardSchema>;

// Educational games schema
export const educationalGames = pgTable("educational_games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // milestone-matching, scenario-response, knowledge-quiz, etc.
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  category: text("category").notNull(), // child-development, classroom-management, etc.
  pointsValue: integer("points_value").notNull(), // How many points is this game worth
  config: json("config").$type<{
    questions?: any[],
    timeLimit?: number,
    attempts?: number,
    passingScore?: number,
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEducationalGameSchema = createInsertSchema(educationalGames).omit({
  id: true,
  createdAt: true,
});

// Game completions to track user progress and daily limits
export const gameCompletions = pgTable("game_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => educationalGames.id),
  score: integer("score"), // The user's score (percentage or points)
  timeTaken: integer("time_taken"), // Time in seconds
  pointsEarned: integer("points_earned").notNull(), // Points earned from this game
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertGameCompletionSchema = createInsertSchema(gameCompletions).omit({
  id: true,
  completedAt: true,
});

// Avatar item categories table
export const avatarCategories = pgTable("avatar_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // head, hair, eyes, clothes, accessories, etc.
  displayOrder: integer("display_order").default(0), // For ordering in UI
  isLayerable: boolean("is_layerable").default(false), // Whether this category can be worn with other items
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAvatarCategorySchema = createInsertSchema(avatarCategories).omit({
  id: true,
  createdAt: true,
});

// Avatar items table for customization pieces
export const avatarItems = pgTable("avatar_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull().references(() => avatarCategories.id),
  svgPath: text("svg_path").notNull(), // Path to SVG asset
  pointsCost: integer("points_cost").notNull().default(50), // Cost in points
  levelRequired: integer("level_required").default(1), // Minimum level to purchase
  rarity: text("rarity").default("common"), // common, uncommon, rare, epic, legendary
  isDefault: boolean("is_default").default(false), // Default items are free and available to all
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAvatarItemSchema = createInsertSchema(avatarItems).omit({
  id: true,
  createdAt: true,
});

// User avatars - users can create and save multiple avatar configurations
export const userAvatars = pgTable("user_avatars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // User-given name for this avatar
  isActive: boolean("is_active").default(false), // Whether this is the currently active avatar
  components: json("components").$type<{
    [categoryId: string]: number // Category ID to item ID mapping
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserAvatarSchema = createInsertSchema(userAvatars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User purchased avatar items
export const userAvatarItems = pgTable("user_avatar_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => avatarItems.id),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertUserAvatarItemSchema = createInsertSchema(userAvatarItems).omit({
  id: true,
  purchasedAt: true,
});

// Newsletter schema
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: json("content").$type<{
    sections: Array<{
      id: string;
      type: 'text' | 'image' | 'event' | 'announcement' | 'staff_spotlight';
      title?: string;
      content?: string;
      imageUrl?: string;
      date?: string;
      location?: string;
      metadata?: Record<string, any>;
    }>;
  }>().notNull(),
  featuredImage: text("featured_image"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  recipientGroups: text("recipient_groups").notNull().default("all"),
  readCount: integer("read_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const newslettersRelations = relations(newsletters, ({ one }) => ({
  school: one(schools, {
    fields: [newsletters.schoolId],
    references: [schools.id]
  }),
  creator: one(users, {
    fields: [newsletters.createdBy],
    references: [users.id]
  })
}));

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

// Module drafts schema for save-and-resume functionality
export const moduleDrafts = pgTable("module_drafts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  moduleData: json("module_data").$type<{
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedTime: string;
    customPoints?: string;
    pointValue: number;
    is_visible: boolean;
    sections: any[];
    shareWithCommunity?: boolean;
    moduleType?: string;
    courseStructure?: any;
    interactiveElements?: any;
    certificationSystem?: any;
  }>().notNull(),
  creationMethod: text("creation_method"),
  aiWorkflowStep: text("ai_workflow_step"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertModuleDraftSchema = createInsertSchema(moduleDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const moduleDraftsRelations = relations(moduleDrafts, ({ one }) => ({
  user: one(users, {
    fields: [moduleDrafts.userId],
    references: [users.id]
  })
}));

export type ModuleDraft = typeof moduleDrafts.$inferSelect;
export type InsertModuleDraft = z.infer<typeof insertModuleDraftSchema>;

export type EducationalGame = typeof educationalGames.$inferSelect;
export type InsertEducationalGame = z.infer<typeof insertEducationalGameSchema>;
export type GameCompletion = typeof gameCompletions.$inferSelect;
export type InsertGameCompletion = z.infer<typeof insertGameCompletionSchema>;
export type TeacherMessage = typeof teacherMessages.$inferSelect;
export type InsertTeacherMessage = z.infer<typeof insertTeacherMessageSchema>;

// Avatar relations
export const avatarCategoriesRelations = relations(avatarCategories, ({ many }) => ({
  items: many(avatarItems)
}));

export const avatarItemsRelations = relations(avatarItems, ({ one, many }) => ({
  category: one(avatarCategories, {
    fields: [avatarItems.categoryId],
    references: [avatarCategories.id]
  }),
  userItems: many(userAvatarItems)
}));

export const userAvatarsRelations = relations(userAvatars, ({ one }) => ({
  user: one(users, {
    fields: [userAvatars.userId],
    references: [users.id]
  })
}));

export const userAvatarItemsRelations = relations(userAvatarItems, ({ one }) => ({
  user: one(users, {
    fields: [userAvatarItems.userId],
    references: [users.id]
  }),
  item: one(avatarItems, {
    fields: [userAvatarItems.itemId],
    references: [avatarItems.id]
  })
}));

// Export the types for the avatar-related tables
export type AvatarCategory = typeof avatarCategories.$inferSelect;
export type InsertAvatarCategory = z.infer<typeof insertAvatarCategorySchema>;
export type AvatarItem = typeof avatarItems.$inferSelect;
export type InsertAvatarItem = z.infer<typeof insertAvatarItemSchema>;
export type UserAvatar = typeof userAvatars.$inferSelect;
export type InsertUserAvatar = z.infer<typeof insertUserAvatarSchema>;
export type UserAvatarItem = typeof userAvatarItems.$inferSelect;
export type InsertUserAvatarItem = z.infer<typeof insertUserAvatarItemSchema>;

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id]
  }),
  responses: many(assessmentResponses)
}));

export const educationalGamesRelations = relations(educationalGames, ({ many }) => ({
  completions: many(gameCompletions)
}));

export const gameCompletionsRelations = relations(gameCompletions, ({ one }) => ({
  game: one(educationalGames, {
    fields: [gameCompletions.gameId],
    references: [educationalGames.id]
  }),
  user: one(users, {
    fields: [gameCompletions.userId],
    references: [users.id]
  })
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id]
  })
}));

export const storeItemsRelations = relations(storeItems, ({ many }) => ({
  userItems: many(userItems),
  spinGameRewards: many(spinGameRewards)
}));

export const userItemsRelations = relations(userItems, ({ one }) => ({
  user: one(users, {
    fields: [userItems.userId],
    references: [users.id]
  }),
  storeItem: one(storeItems, {
    fields: [userItems.itemId],
    references: [storeItems.id]
  })
}));

export const spinGameRewardsRelations = relations(spinGameRewards, ({ one }) => ({
  user: one(users, {
    fields: [spinGameRewards.userId],
    references: [users.id]
  }),
  storeItem: one(storeItems, {
    fields: [spinGameRewards.itemId],
    references: [storeItems.id]
  })
}));

// School relations definition
export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  learningModules: many(learningModules),
  questionAvailability: many(questionAvailability),
  assessmentConfig: many(assessmentConfig),
  teacherMessages: many(teacherMessages)
}));

// Assessment domains table for weighted question distribution
export const assessmentDomains = pgTable("assessment_domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  questionWeight: integer("question_weight").notNull(), // Number of questions from this domain
  displayOrder: integer("display_order").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for active domains lookup
  activeDomainsIdx: index("assessment_domains_active_idx").on(table.isActive),
  // Index for ordered domain display  
  displayOrderIdx: index("assessment_domains_display_order_idx").on(table.displayOrder),
  // Index for domain name lookups
  nameIdx: index("assessment_domains_name_idx").on(table.name),
}));

// Assessment questions table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: text("id").primaryKey(), // Using text ID to support various formats (e.g., "safety-3-001")
  domainId: integer("domain_id").notNull().references(() => assessmentDomains.id), // Foreign key to assessmentDomains
  text: text("text").notNull(), // The question text
  options: text("options").notNull(), // Temporarily as text to avoid conversion error - will store JSON as string
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based)
  difficulty: text("difficulty").notNull(), // Temporarily as text to avoid conversion error - existing data is text
  explanation: text("explanation"), // Explanation for correct answer
  miniLesson: text("mini_lesson"), // Required educational content for this question
  tags: text("tags"), // Temporarily as text to avoid conversion error - will store JSON as string
  createdBy: integer("created_by").references(() => users.id), // User who created this question
  approvedBy: integer("approved_by").references(() => users.id), // User who approved this question
  isApproved: boolean("is_approved").default(false), // Whether question is approved for use
  isEnabled: boolean("is_enabled").default(true), // Whether question is currently enabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
},
(table) => ({
  // Critical index for weighted question selection (EP-001-08)
  domainDifficultyAvailabilityIdx: index("assessment_questions_domain_difficulty_availability_idx").on(
    table.domainId, 
    table.difficulty, 
    table.isApproved,
    table.isEnabled
  ),
  // Index for user analytics and progress tracking
  userAssessmentDomainIdx: index("assessment_questions_user_assessment_domain_idx").on(table.domainId),
  // Index for approval and availability queries
  approvedEnabledIdx: index("assessment_questions_approved_enabled_idx").on(table.isApproved, table.isEnabled),
  // Index for difficulty-based queries
  difficultyIdx: index("assessment_questions_difficulty_idx").on(table.difficulty),
  // Index for domain-based queries  
  domainIdx: index("assessment_questions_domain_idx").on(table.domainId),
  // Index for availability queries
  enabledIdx: index("assessment_questions_enabled_idx").on(table.isEnabled),
  // Index for question approval workflow
  approvalStatusIdx: index("assessment_questions_approval_status_idx").on(table.isApproved),
  // Index for created by user (admin UI)
  createdByIdx: index("assessment_questions_created_by_idx").on(table.createdBy),
}));

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  createdAt: true,
  updatedAt: true,
});

// Note: Temporary types for text-based fields that will eventually be JSON
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

// Helper types for when we convert back to proper JSON structure
export type AssessmentQuestionWithParsedFields = Omit<AssessmentQuestion, 'options' | 'tags' | 'difficulty'> & {
  options: string[];
  tags?: string[];
  difficulty: number; // Will be 1-6 when converted from text
};

// Assessment responses table for tracking user answers
export const assessmentResponses = pgTable("assessment_responses", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  questionId: text("question_id").notNull().references(() => assessmentQuestions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  questionSequence: integer("question_sequence").notNull(), // Order of question in assessment (1-40)
  selectedAnswer: integer("selected_answer"), // Index of selected option, null if timed out
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").default(0),
  timeSpent: integer("time_spent"), // Seconds spent on question
  timedOut: boolean("timed_out").default(false), // Whether question was automatically submitted due to timeout
  domainId: integer("domain_id").notNull().references(() => assessmentDomains.id), // Domain this question belongs to for analytics
  difficulty: text("difficulty").notNull(), // Temporarily as text - difficulty level of the question (1-6)
  answeredAt: timestamp("answered_at"), // When the question was answered
  wasLateSubmission: boolean("was_late_submission").default(false), // Whether this was submitted after time limit
  processingTimestamp: timestamp("processing_timestamp"), // When the response was processed by the system
  createdAt: timestamp("created_at").defaultNow(),
},
(table) => ({
  // Critical index for user analytics and progress tracking
  userAssessmentDomainIdx: index("assessment_responses_user_assessment_domain_idx").on(
    table.userId, 
    table.assessmentId,
    table.domainId
  ),
  // Index for assessment completion analysis
  assessmentSequenceIdx: index("assessment_responses_assessment_sequence_idx").on(
    table.assessmentId, 
    table.questionSequence
  ),
  // Index for domain performance analytics
  domainPerformanceIdx: index("assessment_responses_domain_performance_idx").on(
    table.domainId, 
    table.isCorrect,
    table.difficulty
  ),
  // Index for user progress tracking
  userProgressIdx: index("assessment_responses_user_progress_idx").on(table.userId, table.createdAt),
  // Index for question analytics
  questionAnalyticsIdx: index("assessment_responses_question_analytics_idx").on(
    table.questionId, 
    table.isCorrect,
    table.timeSpent
  ),
  // Index for assessment completion status
  assessmentCompletionIdx: index("assessment_responses_assessment_completion_idx").on(
    table.assessmentId, 
    table.createdAt
  ),
}));

// Question availability control for school-level management
export const questionAvailability = pgTable("question_availability", {
  id: serial("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => assessmentQuestions.id),
  schoolId: integer("school_id").references(() => schools.id), // null for platform-wide
  isEnabled: boolean("is_enabled").default(true),
  enabledBy: integer("enabled_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Critical index for availability checking (question + school + enabled)
  questionSchoolEnabledIdx: index("question_availability_question_school_enabled_idx").on(table.questionId, table.schoolId, table.isEnabled),
  // Index for school-specific availability queries
  schoolEnabledIdx: index("question_availability_school_enabled_idx").on(table.schoolId, table.isEnabled),
  // Index for question-specific availability
  questionIdx: index("question_availability_question_idx").on(table.questionId),
  // Index for enabled status
  enabledIdx: index("question_availability_enabled_idx").on(table.isEnabled),
}));

// Assessment configuration
export const assessmentConfig = pgTable("assessment_config", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // null for platform-wide default
  questionCount: integer("question_count").default(40), // Configurable number of questions
  timePerQuestion: integer("time_per_question").default(60), // Seconds per question (school-level setting)
  startingDifficulty: integer("starting_difficulty").default(3), // Starting difficulty level (Medium)
  minDomainCoverage: integer("min_domain_coverage").default(1), // Minimum questions per domain
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for school-specific config lookup (most common query)
  schoolIdx: index("assessment_config_school_idx").on(table.schoolId),
  // Index for platform-wide config (schoolId = null)
  platformConfigIdx: index("assessment_config_platform_idx").on(table.schoolId),
}));

// Voice Narration Usage Tracking for Cost Control
export const voiceNarrationUsage = pgTable("voice_narration_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  usageDate: date("usage_date").notNull(), // Date when voice narration was used
  weekStart: date("week_start").notNull(), // Start of the week (Monday) for easy weekly limits
  usageCount: integer("usage_count").default(1), // Number of narrations used on this date
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Index for weekly usage checks (most common query)
  userWeekIdx: index("voice_narration_user_week_idx").on(table.userId, table.weekStart),
  // Index for daily usage tracking
  userDateIdx: index("voice_narration_user_date_idx").on(table.userId, table.usageDate),
  // Index for usage analytics
  weeklyUsageIdx: index("voice_narration_weekly_usage_idx").on(table.weekStart, table.usageCount),
}));

export const insertVoiceNarrationUsageSchema = createInsertSchema(voiceNarrationUsage).omit({
  id: true,
  createdAt: true,
});

// Assessment Results Table with Mini-Lesson Focus
export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  totalCorrect: integer("total_correct").notNull(),
  accuracyRate: doublePrecision("accuracy_rate").notNull(), // Percentage (0-100)
  totalTimeSeconds: integer("total_time_seconds"), // Total time spent on assessment in seconds
  
  // Primary recommendations - mini-lesson focus
  primaryMiniLessons: json("primary_mini_lessons").$type<Array<{
    miniLessonId: string;
    title: string;
    description: string;
    estimatedDuration: number;
    difficulty: number;
    domainId: number;
    domainName: string;
    priority: number;
    learningObjectives: string[];
    relatedQuestions: string[];
    directConnection: string;
  }>>().notNull(),
  
  estimatedImprovementTime: integer("estimated_improvement_time"), // Total time for recommended mini-lessons
  
  // Secondary insights - domain context
  domainBreakdown: json("domain_breakdown").$type<Array<{
    domainId: number;
    domainName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracyRate: number;
    strengthLevel: 'strength' | 'neutral' | 'growth';
  }>>().notNull(),
  
  strengthAreas: json("strength_areas").$type<string[]>().notNull(),
  growthAreas: json("growth_areas").$type<string[]>().notNull(),
  personalizedSummary: text("personalized_summary"),
  immediateNextSteps: json("immediate_next_steps").$type<string[]>(),
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => ({
  // Primary index for assessment lookup
  assessmentIdx: index("assessment_results_assessment_idx").on(table.assessmentId),
  // Index for performance analytics
  scoreIdx: index("assessment_results_score_idx").on(table.overallScore),
  // Index for accuracy rate queries
  accuracyIdx: index("assessment_results_accuracy_idx").on(table.accuracyRate),
  // Index for total time analytics
  totalTimeIdx: index("assessment_results_total_time_idx").on(table.totalTimeSeconds),
  // Unique constraint - one result per assessment
  uniqueAssessmentIdx: index("assessment_results_unique_assessment_idx").on(table.assessmentId),
}));

export const insertAssessmentResultsSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  calculatedAt: true,
});

// Learning Paths Table for EP-001-10 Enhanced Learning Path Recommendation
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Structured domain-grouped learning path
  domainGroups: json("domain_groups").$type<Array<{
    domainId: number;
    domainName: string;
    domainWeight: number;
    failedQuestionsCount: number;
    miniLessons: Array<{
      questionId: string;
      difficulty: number;
      miniLessonId: string;
      estimatedDuration: number;
    }>;
  }>>().notNull(),
  
  totalFailedQuestions: integer("total_failed_questions").notNull(),
  totalDomains: integer("total_domains").notNull(),
  estimatedCompletionTime: integer("estimated_completion_time").notNull(), // Total estimated time in minutes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Primary index for assessment lookup
  assessmentIdx: index("learning_paths_assessment_idx").on(table.assessmentId),
  // Index for user lookup
  userIdx: index("learning_paths_user_idx").on(table.userId),
  // Composite index for user assessment lookup
  userAssessmentIdx: index("learning_paths_user_assessment_idx").on(table.userId, table.assessmentId),
  // Index for analytics on failed question count
  failedQuestionsIdx: index("learning_paths_failed_questions_idx").on(table.totalFailedQuestions),
  // Unique constraint - one learning path per assessment
  uniqueAssessmentIdx: index("learning_paths_unique_assessment_idx").on(table.assessmentId),
}));

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Teacher welcome messages and notifications table
export const teacherMessages = pgTable("teacher_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  schoolId: integer("school_id").references(() => schools.id),
  messageType: text("message_type").notNull(), // welcome, certification_reminder, announcement, personal, shoutout
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  important: boolean("important").default(false),
  expiresAt: timestamp("expires_at"), // Optional expiration time for time-sensitive messages
  relatedId: integer("related_id"), // For linking to shoutouts or other entities
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeacherMessageSchema = createInsertSchema(teacherMessages).omit({
  id: true,
  createdAt: true,
});

// Newsletter delivery tracking
export const newsletterDeliveries = pgTable("newsletter_deliveries", {
  id: serial("id").primaryKey(),
  newsletterId: integer("newsletter_id").notNull(),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  deliveryMethod: text("delivery_method").notNull(), // email, platform, both
  sentAt: timestamp("sent_at").defaultNow(),
  openedAt: timestamp("opened_at"),
  isRead: boolean("is_read").default(false),
});

// Update user relations to include school relation
export const usersRelations = relations(users, ({ many, one }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id]
  }),
  progress: many(userProgress),
  meetings: many(meetings, { relationName: "host" }),
  guestMeetings: many(meetings, { relationName: "guest" }),
  assessments: many(assessments),
  assessmentResponses: many(assessmentResponses),
  learningPaths: many(learningPaths),
  createdQuestions: many(assessmentQuestions, { relationName: "questionCreator" }),
  approvedQuestions: many(assessmentQuestions, { relationName: "questionApprover" }),
  questionAvailabilityUpdates: many(questionAvailability),
  assessmentConfigUpdates: many(assessmentConfig),
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  spinGameRewards: many(spinGameRewards),
  moduleRatings: many(moduleRatings),
  // Avatar customization relations
  userAvatars: many(userAvatars),
  avatarItems: many(userAvatarItems),
  receivedMessages: many(teacherMessages, { relationName: "recipient" }),
  sentMessages: many(teacherMessages, { relationName: "sender" }),
  // New relations for added tables
  bearBucksTransactions: many(bearBucksTransactions),
  dailyLogins: many(dailyLogins),
  // Discussion relations
  threads: many(discussionThreads),
  comments: many(discussionComments),
  votes: many(commentVotes),
  // Video relations
  videoQuizCompletions: many(videoQuizCompletions),
  // Shout out relations
  nominatorShoutOuts: many(coreValuesShoutOuts, { relationName: "nominator" }),
  nomineeShoutOuts: many(coreValuesShoutOuts, { relationName: "nominee" })
}));

// Relations for new tables
export const bearBucksTransactionsRelations = relations(bearBucksTransactions, ({ one }) => ({
  recipient: one(users, {
    fields: [bearBucksTransactions.recipientId],
    references: [users.id],
    relationName: "recipient"
  }),
  sender: one(users, {
    fields: [bearBucksTransactions.senderId],
    references: [users.id],
    relationName: "sender"
  })
}));

export const dailyLoginsRelations = relations(dailyLogins, ({ one }) => ({
  user: one(users, {
    fields: [dailyLogins.userId],
    references: [users.id]
  })
}));

// Types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;

export type UserItem = typeof userItems.$inferSelect;
export type InsertUserItem = z.infer<typeof insertUserItemSchema>;

export type SpinGameReward = typeof spinGameRewards.$inferSelect;
export type InsertSpinGameReward = z.infer<typeof insertSpinGameRewardSchema>;

// Discussion threads
export const discussionThreads = pgTable("discussion_threads", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull(),
  pinned: boolean("pinned").default(false),
  viewCount: integer("view_count").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
});

export const insertDiscussionThreadSchema = createInsertSchema(discussionThreads).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
  viewCount: true,
});

// Discussion comments
export const discussionComments = pgTable("discussion_comments", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  threadId: integer("thread_id").references(() => discussionThreads.id).notNull(),
  parentCommentId: integer("parent_comment_id").references(() => discussionComments.id),
  endorsed: boolean("endorsed").default(false),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
});

export const insertDiscussionCommentSchema = createInsertSchema(discussionComments).omit({
  id: true,
  createdAt: true,
  upvotes: true,
  downvotes: true,
});

// User votes on comments
export const commentVotes = pgTable("comment_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  commentId: integer("comment_id").references(() => discussionComments.id).notNull(),
  voteType: text("vote_type").notNull(), // "upvote" or "downvote"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentVoteSchema = createInsertSchema(commentVotes).omit({
  id: true,
  createdAt: true,
});

// Video ratings table for teacher video ratings
export const videoRatings = pgTable("video_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: text("video_id").notNull(), // References video resources ID
  rating: integer("rating").notNull(), // 1-5 star rating
  review: text("review"), // Optional text review
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure one rating per user per video
  userVideoUnique: index("video_ratings_user_video_unique_idx").on(table.userId, table.videoId),
  // Index for video rating lookups
  videoIdIdx: index("video_ratings_video_id_idx").on(table.videoId),
  // Index for user rating history
  userIdIdx: index("video_ratings_user_id_idx").on(table.userId),
}));

export const insertVideoRatingSchema = createInsertSchema(videoRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VideoRating = typeof videoRatings.$inferSelect;
export type InsertVideoRating = z.infer<typeof insertVideoRatingSchema>;

// Add relationships
export const discussionThreadsRelations = relations(discussionThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [discussionThreads.authorId],
    references: [users.id],
  }),
  comments: many(discussionComments),
}));

export const discussionCommentsRelations = relations(discussionComments, ({ one, many }) => ({
  author: one(users, {
    fields: [discussionComments.authorId],
    references: [users.id],
  }),
  thread: one(discussionThreads, {
    fields: [discussionComments.threadId],
    references: [discussionThreads.id],
  }),
  parentComment: one(discussionComments, {
    fields: [discussionComments.parentCommentId],
    references: [discussionComments.id],
  }),
  replies: many(discussionComments, {
    relationName: "parentChild"
  }),
  votes: many(commentVotes),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  user: one(users, {
    fields: [commentVotes.userId],
    references: [users.id],
  }),
  comment: one(discussionComments, {
    fields: [commentVotes.commentId],
    references: [discussionComments.id],
  }),
}));

// Add discussions to user relations
export const usersRelationsWithDiscussions = relations(users, ({ many }) => ({
  progress: many(userProgress),
  meetings: many(meetings),
  assessments: many(assessments),
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  threads: many(discussionThreads),
  comments: many(discussionComments),
  votes: many(commentVotes),
  spinGameRewards: many(spinGameRewards),
  nominatorShoutOuts: many(coreValuesShoutOuts, { relationName: "nominator" }),
  nomineeShoutOuts: many(coreValuesShoutOuts, { relationName: "nominee" }),
}));

export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionThread = z.infer<typeof insertDiscussionThreadSchema>;

export type DiscussionComment = typeof discussionComments.$inferSelect;
export type InsertDiscussionComment = z.infer<typeof insertDiscussionCommentSchema>;

export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;

// Video Quiz Completions for tracking daily limits (only 2 videos per day)
export const videoQuizCompletions = pgTable("video_quiz_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: text("video_id").notNull(), // ID of the video from videoResources
  pointsEarned: integer("points_earned").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertVideoQuizCompletionSchema = createInsertSchema(videoQuizCompletions).omit({
  id: true,
  completedAt: true,
});

export const videoQuizCompletionsRelations = relations(videoQuizCompletions, ({ one }) => ({
  user: one(users, {
    fields: [videoQuizCompletions.userId],
    references: [users.id],
  }),
}));

// Update user relations to include video completions
export const usersRelationsWithVideos = relations(users, ({ many }) => ({
  progress: many(userProgress),
  meetings: many(meetings),
  assessments: many(assessments),
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  threads: many(discussionThreads),
  comments: many(discussionComments),
  votes: many(commentVotes),
  spinGameRewards: many(spinGameRewards),
  videoQuizCompletions: many(videoQuizCompletions),
  nominatorShoutOuts: many(coreValuesShoutOuts, { relationName: "nominator" }),
  nomineeShoutOuts: many(coreValuesShoutOuts, { relationName: "nominee" }),
}));

export type VideoQuizCompletion = typeof videoQuizCompletions.$inferSelect;
export type InsertVideoQuizCompletion = z.infer<typeof insertVideoQuizCompletionSchema>;

// These are already defined elsewhere in the schema

// Module Ratings schema
export const moduleRatings = pgTable("module_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  rating: integer("rating").notNull(), // 1-5 star rating
  comment: text("comment"), // Optional comment with the rating
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleRatingSchema = createInsertSchema(moduleRatings).omit({
  id: true,
  createdAt: true,
});

export const moduleRatingsRelations = relations(moduleRatings, ({ one }) => ({
  user: one(users, {
    fields: [moduleRatings.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [moduleRatings.moduleId],
    references: [learningModules.id],
  }),
}));

// Community Module Sharing schema
export const communityModules = pgTable("community_modules", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  sharedBySchoolId: integer("shared_by_school_id").notNull().references(() => schools.id),
  sharedDate: timestamp("shared_date").defaultNow(),
  status: text("status").notNull().default("active"), // active, featured, archived
  totalCompletions: integer("total_completions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Module Awards schema for monthly competitions
export const communityModuleAwards = pgTable("community_module_awards", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  awardDate: timestamp("award_date").defaultNow(),
  prizePoints: integer("prize_points").notNull(), // Points awarded to the school
  rank: integer("rank").notNull(), // 1 = First place, 2 = Second place, etc.
  monthYear: text("month_year").notNull(), // e.g., "May 2025"
  averageRating: integer("average_rating").notNull(), // The module's rating at time of award
  totalRatings: integer("total_ratings").notNull(), // Number of ratings at time of award
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityModuleAwardSchema = createInsertSchema(communityModuleAwards).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityModuleSchema = createInsertSchema(communityModules).omit({
  id: true,
  sharedDate: true, 
  totalCompletions: true,
  createdAt: true,
});

export const communityModulesRelations = relations(communityModules, ({ one, many }) => ({
  module: one(learningModules, {
    fields: [communityModules.moduleId],
    references: [learningModules.id],
  }),
  school: one(schools, {
    fields: [communityModules.sharedBySchoolId],
    references: [schools.id],
  }),
  awards: many(communityModuleAwards),
}));

export const communityModuleAwardsRelations = relations(communityModuleAwards, ({ one }) => ({
  module: one(learningModules, {
    fields: [communityModuleAwards.moduleId],
    references: [learningModules.id],
  }),
  school: one(schools, {
    fields: [communityModuleAwards.schoolId],
    references: [schools.id],
  }),
}));

export type ModuleRating = typeof moduleRatings.$inferSelect;
export type InsertModuleRating = z.infer<typeof insertModuleRatingSchema>;

export type CommunityModule = typeof communityModules.$inferSelect;
export type InsertCommunityModule = z.infer<typeof insertCommunityModuleSchema>;
export type CommunityModuleAward = typeof communityModuleAwards.$inferSelect;
export type InsertCommunityModuleAward = z.infer<typeof insertCommunityModuleAwardSchema>;

// Assessment Retake Permissions schema
export const assessmentRetakePermissions = pgTable("assessment_retake_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id), // Teacher requesting retake
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved/denied
  schoolId: integer("school_id").notNull().references(() => schools.id),
  requestReason: text("request_reason").notNull(), // Why the retake is needed
  adminNotes: text("admin_notes"), // Admin's notes on the decision
  status: text("status").notNull().default("pending"), // pending, approved, denied
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"), // When admin approved/denied
  expiresAt: timestamp("expires_at"), // When permission expires (24-48 hours after approval)
  used: boolean("used").default(false), // Whether permission has been used
  usedAt: timestamp("used_at"), // When the retake was actually taken
}, (table) => ({
  // Index for pending requests by school
  pendingRequestsIdx: index("assessment_retake_permissions_pending_idx").on(table.schoolId, table.status),
  // Index for user request history
  userRequestsIdx: index("assessment_retake_permissions_user_idx").on(table.userId),
  // Index for active permissions (approved and not expired)
  activePermissionsIdx: index("assessment_retake_permissions_active_idx").on(table.userId, table.status, table.expiresAt),
}));

export const insertAssessmentRetakePermissionSchema = createInsertSchema(assessmentRetakePermissions).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
  usedAt: true,
});

export type AssessmentRetakePermission = typeof assessmentRetakePermissions.$inferSelect;
export type InsertAssessmentRetakePermission = z.infer<typeof insertAssessmentRetakePermissionSchema>;

// Streak Rewards schema
// Streak rewards are defined earlier in the file

// Core Values Shout Out schema
export const coreValuesShoutOuts = pgTable("core_values_shout_outs", {
  id: serial("id").primaryKey(),
  nominatorId: integer("nominator_id").notNull().references(() => users.id),
  nomineeId: integer("nominee_id").notNull().references(() => users.id),
  coreValue: text("core_value").notNull(),
  description: text("description").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCoreValuesShoutOutSchema = createInsertSchema(coreValuesShoutOuts).omit({
  id: true,
  createdAt: true,
  pointsAwarded: true,
});

export type CoreValuesShoutOut = typeof coreValuesShoutOuts.$inferSelect;
export type InsertCoreValuesShoutOut = z.infer<typeof insertCoreValuesShoutOutSchema>;

// EduTok (TikTok-style educational videos)
export const eduTokSnippets = pgTable("edu_tok_snippets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  video_url: text("video_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  source_url: text("source_url"),
  license: text("license"),
  view_count: integer("view_count").default(0),
  likes: integer("likes").default(0),
  category: text("category"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEduTokSnippetSchema = createInsertSchema(eduTokSnippets).omit({
  id: true,
  createdAt: true,
});

export const eduTokUserInteractions = pgTable("edu_tok_user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  snippetId: integer("snippet_id").notNull().references(() => eduTokSnippets.id),
  liked: boolean("liked").default(false),
  viewed: boolean("viewed").default(false),
  shared: boolean("shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEduTokUserInteractionSchema = createInsertSchema(eduTokUserInteractions).omit({
  id: true,
  createdAt: true,
});

export const eduTokUserInteractionsRelations = relations(eduTokUserInteractions, ({ one }) => ({
  user: one(users, {
    fields: [eduTokUserInteractions.userId],
    references: [users.id]
  }),
  snippet: one(eduTokSnippets, {
    fields: [eduTokUserInteractions.snippetId],
    references: [eduTokSnippets.id]
  })
}));

export const eduTokSnippetsRelations = relations(eduTokSnippets, ({ many }) => ({
  interactions: many(eduTokUserInteractions)
}));

// Teacher Self-Assessment schema
export const teacherSelfAssessments = pgTable("teacher_self_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  results: json("results").$type<Record<string, string>>().notNull(),
  strengthAreas: text("strength_areas").array(),
  growthAreas: text("growth_areas").array(),
  averageSkillLevel: doublePrecision("average_skill_level"),
  teacherLevel: text("teacher_level")
});

export const insertTeacherSelfAssessmentSchema = createInsertSchema(teacherSelfAssessments, {
  id: undefined,
  createdAt: undefined,
});

export const teacherSelfAssessmentsRelations = relations(teacherSelfAssessments, ({ one }) => ({
  user: one(users, {
    fields: [teacherSelfAssessments.userId],
    references: [users.id]
  })
}));

export type EduTokSnippet = typeof eduTokSnippets.$inferSelect;
export type InsertEduTokSnippet = z.infer<typeof insertEduTokSnippetSchema>;
export type EduTokUserInteraction = typeof eduTokUserInteractions.$inferSelect;
export type InsertEduTokUserInteraction = z.infer<typeof insertEduTokUserInteractionSchema>;
export type TeacherSelfAssessment = typeof teacherSelfAssessments.$inferSelect;
export type InsertTeacherSelfAssessment = z.infer<typeof insertTeacherSelfAssessmentSchema>;

export const coreValuesShoutOutRelations = relations(coreValuesShoutOuts, ({ one }) => ({
  nominator: one(users, {
    fields: [coreValuesShoutOuts.nominatorId],
    references: [users.id],
    relationName: "nominator"
  }),
  nominee: one(users, {
    fields: [coreValuesShoutOuts.nomineeId],
    references: [users.id],
    relationName: "nominee"
  })
}));

// Assessment domains insert schema and types
export const insertAssessmentDomainSchema = createInsertSchema(assessmentDomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AssessmentDomain = typeof assessmentDomains.$inferSelect;
export type InsertAssessmentDomain = z.infer<typeof insertAssessmentDomainSchema>;

// Assessment responses insert schema and types
export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
});

export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;

// Arizona Early Learning Standards table
export const earlyLearningStandards = pgTable("early_learning_standards", {
  id: serial("id").primaryKey(),
  standardArea: text("standard_area").notNull(), // e.g., "Social Emotional", "Language and Literacy"
  strand: text("strand").notNull(), // e.g., "Self-Awareness and Emotional Skills"
  standardCode: text("standard_code").notNull().unique(), // e.g., "SE.1.1"
  ageGroup: text("age_group").notNull(), // e.g., "3-5 years"
  standardText: text("standard_text").notNull(),
  description: text("description"),
  keywords: text("keywords").array(), // For search functionality
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Index for searching by area and strand
  areaStrandIdx: index("standards_area_strand_idx").on(table.standardArea, table.strand),
  // Index for age group filtering
  ageGroupIdx: index("standards_age_group_idx").on(table.ageGroup),
  // Index for keyword searches
  keywordsIdx: index("standards_keywords_idx").on(table.keywords),
}));

export const insertEarlyLearningStandardSchema = createInsertSchema(earlyLearningStandards).omit({
  id: true,
  createdAt: true,
});

export type EarlyLearningStandard = typeof earlyLearningStandards.$inferSelect;
export type InsertEarlyLearningStandard = z.infer<typeof insertEarlyLearningStandardSchema>;

// Lesson plans table
export const lessonPlans = pgTable("lesson_plans", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  schoolId: integer("school_id").references(() => schools.id),
  title: text("title").notNull(),
  description: text("description"),
  ageGroup: text("age_group").notNull(),
  duration: integer("duration"), // in minutes
  objectives: text("objectives").array(),
  materials: text("materials").array(),
  activities: json("activities").$type<{
    name: string;
    description: string;
    duration: number;
    instructions: string[];
  }[]>(),
  assessment: text("assessment"),
  notes: text("notes"),
  standardsReferenced: integer("standards_referenced").array(), // References to earlyLearningStandards.id
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for user's lesson plans
  createdByIdx: index("lesson_plans_created_by_idx").on(table.createdBy),
  // Index for school filtering
  schoolIdx: index("lesson_plans_school_idx").on(table.schoolId),
  // Index for age group filtering
  ageGroupIdx: index("lesson_plans_age_group_idx").on(table.ageGroup),
  // Index for public lesson plans
  publicIdx: index("lesson_plans_public_idx").on(table.isPublic),
}));

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertLessonPlan = z.infer<typeof insertLessonPlanSchema>;

// ECE Hours Tracking schema
export const eceHours = pgTable("ece_hours", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").references(() => learningModules.id), // null for non-module hours
  category: text("category").notNull(), // e.g., "social-emotional", "cognitive-development"
  duration: integer("duration").notNull(), // minutes completed
  completedAt: timestamp("completed_at").defaultNow(),
  trainingTitle: text("training_title").notNull(),
  approvedBy: integer("approved_by").references(() => users.id), // approved trainer who created/validated the content
  schoolId: integer("school_id").references(() => schools.id),
  certificateGenerated: boolean("certificate_generated").default(false),
  notes: text("notes"), // additional notes about the training
  // Manual training entry fields
  trainingType: text("training_type").notNull().default("online"), // "online" or "in_person"
  trainingLocation: text("training_location"), // venue for in-person training
  isManualEntry: boolean("is_manual_entry").default(false), // true for manually added hours
  addedBy: integer("added_by").references(() => users.id), // admin who manually added the hours
}, (table) => ({
  // Index for user's ECE hours lookup
  userHoursIdx: index("ece_hours_user_idx").on(table.userId),
  // Index for category-based reporting
  categoryIdx: index("ece_hours_category_idx").on(table.category),
  // Index for school reporting
  schoolIdx: index("ece_hours_school_idx").on(table.schoolId),
  // Index for completion date range queries
  completedDateIdx: index("ece_hours_completed_date_idx").on(table.completedAt),
  // Index for training type reporting
  trainingTypeIdx: index("ece_hours_training_type_idx").on(table.trainingType),
}));

export const insertEceHoursSchema = createInsertSchema(eceHours).omit({
  id: true,
  completedAt: true,
});

// ECE Monthly Reporting Settings schema
export const eceReportingSettings = pgTable("ece_reporting_settings", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  reportingEmails: json("reporting_emails").$type<string[]>().notNull(), // Array of email addresses
  frequency: text("frequency").notNull().default("monthly"), // monthly, quarterly, annually
  isActive: boolean("is_active").default(true),
  lastReportSent: timestamp("last_report_sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // One setting per school
  schoolSettingsIdx: index("ece_reporting_school_idx").on(table.schoolId),
}));

export const insertEceReportingSettingsSchema = createInsertSchema(eceReportingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const eceHoursRelations = relations(eceHours, ({ one }) => ({
  user: one(users, {
    fields: [eceHours.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [eceHours.moduleId],
    references: [learningModules.id],
  }),
  approver: one(users, {
    fields: [eceHours.approvedBy],
    references: [users.id],
    relationName: "approver"
  }),
  school: one(schools, {
    fields: [eceHours.schoolId],
    references: [schools.id],
  }),
}));

export type EceHours = typeof eceHours.$inferSelect;
export type InsertEceHours = z.infer<typeof insertEceHoursSchema>;

// Helper type for when we convert back to proper numeric structure
export type AssessmentResponseWithParsedFields = Omit<AssessmentResponse, 'difficulty'> & {
  difficulty: number; // Will be 1-6 when converted from text
};

// Question availability insert schema and types
export const insertQuestionAvailabilitySchema = createInsertSchema(questionAvailability).omit({
  id: true,
  updatedAt: true,
});

export type QuestionAvailability = typeof questionAvailability.$inferSelect;
export type InsertQuestionAvailability = z.infer<typeof insertQuestionAvailabilitySchema>;

// Assessment config insert schema and types
export const insertAssessmentConfigSchema = createInsertSchema(assessmentConfig).omit({
  id: true,
  updatedAt: true,
});

export type AssessmentConfig = typeof assessmentConfig.$inferSelect;
export type InsertAssessmentConfig = z.infer<typeof insertAssessmentConfigSchema>;

export type AssessmentResults = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResults = z.infer<typeof insertAssessmentResultsSchema>;

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;

// Assessment domains relations
export const assessmentDomainsRelations = relations(assessmentDomains, ({ many }) => ({
  // questions: many(assessmentQuestions), // Temporarily commented out due to type mismatch
  // responses: many(assessmentResponses)  // Temporarily commented out due to type mismatch
}));

// Assessment questions relations
export const assessmentQuestionsRelations = relations(assessmentQuestions, ({ one, many }) => ({
  // domain: one(assessmentDomains, {
  //   fields: [assessmentQuestions.domainId],
  //   references: [assessmentDomains.id]
  // }), // Temporarily commented out due to type mismatch
  createdByUser: one(users, {
    fields: [assessmentQuestions.createdBy],
    references: [users.id],
    relationName: "questionCreator"
  }),
  approvedByUser: one(users, {
    fields: [assessmentQuestions.approvedBy],
    references: [users.id],
    relationName: "questionApprover"
  }),
  responses: many(assessmentResponses),
  availability: many(questionAvailability)
}));

// Assessment responses relations
export const assessmentResponsesRelations = relations(assessmentResponses, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentResponses.assessmentId],
    references: [assessments.id]
  }),
  question: one(assessmentQuestions, {
    fields: [assessmentResponses.questionId],
    references: [assessmentQuestions.id]
  }),
  user: one(users, {
    fields: [assessmentResponses.userId],
    references: [users.id]
  })
  // domain: one(assessmentDomains, {
  //   fields: [assessmentResponses.domainId],
  //   references: [assessmentDomains.id]
  // }) // Temporarily commented out due to type mismatch
}));

// Question availability relations
export const questionAvailabilityRelations = relations(questionAvailability, ({ one }) => ({
  question: one(assessmentQuestions, {
    fields: [questionAvailability.questionId],
    references: [assessmentQuestions.id]
  }),
  school: one(schools, {
    fields: [questionAvailability.schoolId],
    references: [schools.id]
  }),
  enabledByUser: one(users, {
    fields: [questionAvailability.enabledBy],
    references: [users.id]
  })
}));

// Assessment config relations
export const assessmentConfigRelations = relations(assessmentConfig, ({ one }) => ({
  school: one(schools, {
    fields: [assessmentConfig.schoolId],
    references: [schools.id]
  }),
  updatedByUser: one(users, {
    fields: [assessmentConfig.updatedBy],
    references: [users.id]
  })
}));

// Learning paths relations
export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
  assessment: one(assessments, {
    fields: [learningPaths.assessmentId],
    references: [assessments.id]
  }),
  user: one(users, {
    fields: [learningPaths.userId],
    references: [users.id]
  })
}));

// Assessment retake permissions relations
export const assessmentRetakePermissionsRelations = relations(assessmentRetakePermissions, ({ one }) => ({
  user: one(users, {
    fields: [assessmentRetakePermissions.userId],
    references: [users.id],
    relationName: "retakeUser"
  }),
  requestedByUser: one(users, {
    fields: [assessmentRetakePermissions.requestedBy],
    references: [users.id],
    relationName: "retakeRequester"
  }),
  approvedByUser: one(users, {
    fields: [assessmentRetakePermissions.approvedBy],
    references: [users.id],
    relationName: "retakeApprover"
  }),
  school: one(schools, {
    fields: [assessmentRetakePermissions.schoolId],
    references: [schools.id]
  })
}));

// Export types for new tables
export type BearBucksTransaction = typeof bearBucksTransactions.$inferSelect;
export type InsertBearBucksTransaction = z.infer<typeof insertBearBucksTransactionSchema>;

export type DailyLogin = typeof dailyLogins.$inferSelect;
export type InsertDailyLogin = z.infer<typeof insertDailyLoginSchema>;
