import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, varchar, date, doublePrecision } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
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
  type: text("type").default("standard"), // standard, self (for self-assessments)
  overallScore: integer("overall_score"),
  completed: boolean("completed").default(false),
  results: json("results").$type<Record<string, string>>(),
  
  // Detailed category scores with levels for all 18 categories
  categoryScores: json("category_scores").$type<Array<{
    category: string;
    score: number;
    level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery';
    description: string;
    questionsAnswered: number;
    correctAnswers: number;
  }>>(),
  
  // Legacy field for backward compatibility
  domainScores: json("domain_scores").$type<Record<string, { score: number, maxDifficulty: string }>>(),
  
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
  assessmentType: text("assessment_type").default("ITERS_ECERS_CLASS"),
  notes: text("notes"),
  teacherLevel: text("teacher_level"),
});

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

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id]
  })
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
}));

// Assessment questions table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: text("id").primaryKey(), // Using text ID to support various formats (e.g., "build-1", "csv-123")
  domain: text("domain").notNull(), // core, mindful, build, language, etc.
  text: text("text").notNull(), // The question text
  options: text("options").notNull(), // JSON string of options array
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced, expert
  explanation: text("explanation"), // Optional explanation for the answer
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  createdAt: true,
});

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

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
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  spinGameRewards: many(spinGameRewards),
  moduleRatings: many(moduleRatings),
  // Avatar customization relations
  userAvatars: many(userAvatars),
  avatarItems: many(userAvatarItems),
  receivedMessages: many(teacherMessages, { relationName: "recipient" }),
  sentMessages: many(teacherMessages, { relationName: "sender" })
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

export const insertCommunityModuleSchema = createInsertSchema(communityModules).omit({
  id: true,
  sharedDate: true, 
  totalCompletions: true,
  createdAt: true,
});

export const communityModulesRelations = relations(communityModules, ({ one }) => ({
  module: one(learningModules, {
    fields: [communityModules.moduleId],
    references: [learningModules.id],
  }),
  school: one(schools, {
    fields: [communityModules.sharedBySchoolId],
    references: [schools.id],
  }),
}));

export type ModuleRating = typeof moduleRatings.$inferSelect;
export type InsertModuleRating = z.infer<typeof insertModuleRatingSchema>;

export type CommunityModule = typeof communityModules.$inferSelect;
export type InsertCommunityModule = z.infer<typeof insertCommunityModuleSchema>;

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
