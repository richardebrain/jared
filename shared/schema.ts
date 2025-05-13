import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  language: text("language").notNull(),
  nativeLanguage: text("native_language").notNull(),
  timeZone: text("time_zone").notNull(),
  profilePicture: text("profile_picture"),
  learningStyle: json("learning_style").$type<{
    visual: number,
    auditory: number,
    reading: number,
    kinesthetic: number,
    preferred: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | null
  }>(),
  bearBucks: integer("bear_bucks").default(0),
  points: integer("points").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active"),
  achievementCount: integer("achievement_count").default(0),
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
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  category: text("category").notNull(),
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
  overallScore: integer("overall_score"),
  completed: boolean("completed").default(false),
  results: json("results").$type<Record<string, string>>(),
  domainScores: json("domain_scores").$type<Record<string, { score: number, maxDifficulty: string }>>(),
  strengthAreas: json("strength_areas").$type<string[]>(),
  growthAreas: json("growth_areas").$type<string[]>(),
  incorrectAnswers: json("incorrect_answers").$type<Record<string, string[]>>(),
  recommendedModules: json("recommended_modules").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  assessmentType: text("assessment_type").default("ITERS_ECERS_CLASS"),
  notes: text("notes"),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  meetings: many(meetings, { relationName: "host" }),
  guestMeetings: many(meetings, { relationName: "guest" }),
  assessments: many(assessments),
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  spinGameRewards: many(spinGameRewards)
}));

export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  progress: many(userProgress)
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

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
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

// Update user relations to include new entities
export const usersRelationsUpdate = relations(users, ({ many }) => ({
  progress: many(userProgress),
  meetings: many(meetings, { relationName: "host" }),
  guestMeetings: many(meetings, { relationName: "guest" }),
  assessments: many(assessments),
  userAchievements: many(userAchievements),
  userItems: many(userItems),
  spinGameRewards: many(spinGameRewards)
}));

// Types
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
}));

export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionThread = z.infer<typeof insertDiscussionThreadSchema>;

export type DiscussionComment = typeof discussionComments.$inferSelect;
export type InsertDiscussionComment = z.infer<typeof insertDiscussionCommentSchema>;

export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;

export type SpinGameReward = typeof spinGameRewards.$inferSelect;
export type InsertSpinGameReward = z.infer<typeof insertSpinGameRewardSchema>;
