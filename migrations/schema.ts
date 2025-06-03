import { pgTable, index, foreignKey, text, integer, timestamp, boolean, serial, json, unique, varchar, doublePrecision, date, check, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const assessmentQuestions = pgTable("assessment_questions", {
	id: text().primaryKey().notNull(),
	domainId: integer("domain_id").notNull(),
	text: text().notNull(),
	options: text().notNull(),
	correctAnswer: integer("correct_answer").notNull(),
	difficulty: text().notNull(),
	explanation: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	miniLesson: text("mini_lesson"),
	tags: text(),
	createdBy: integer("created_by"),
	approvedBy: integer("approved_by"),
	isApproved: boolean("is_approved").default(false),
	isEnabled: boolean("is_enabled").default(true),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("assessment_questions_approval_status_idx").using("btree", table.isApproved.asc().nullsLast().op("bool_ops")),
	index("assessment_questions_approved_enabled_idx").using("btree", table.isApproved.asc().nullsLast().op("bool_ops"), table.isEnabled.asc().nullsLast().op("bool_ops")),
	index("assessment_questions_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("assessment_questions_difficulty_idx").using("btree", table.difficulty.asc().nullsLast().op("text_ops")),
	index("assessment_questions_domain_difficulty_idx").using("btree", table.domainId.asc().nullsLast().op("bool_ops"), table.difficulty.asc().nullsLast().op("int4_ops"), table.isEnabled.asc().nullsLast().op("int4_ops")),
	index("assessment_questions_domain_idx").using("btree", table.domainId.asc().nullsLast().op("int4_ops")),
	index("assessment_questions_enabled_idx").using("btree", table.isEnabled.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "assessment_questions_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "assessment_questions_approved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [assessmentDomains.id],
			name: "assessment_questions_domain_id_fkey"
		}),
]);

export const assessments = pgTable("assessments", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: text().default('initial'),
	overallScore: integer("overall_score"),
	completed: boolean().default(false),
	results: json(),
	categoryScores: json("category_scores"),
	domainScores: json("domain_scores"),
	strengthAreas: json("strength_areas"),
	growthAreas: json("growth_areas"),
	incorrectAnswers: json("incorrect_answers"),
	recommendedModules: json("recommended_modules"),
	personalizedLearningPath: json("personalized_learning_path"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	assessmentType: text("assessment_type").default('INITIAL_ADAPTIVE'),
	notes: text(),
	teacherLevel: text("teacher_level"),
	currentDifficulty: integer("current_difficulty").default(3),
	difficultyProgression: json("difficulty_progression"),
	domainCoverage: json("domain_coverage"),
}, (table) => [
	index("assessments_assessment_type_idx").using("btree", table.assessmentType.asc().nullsLast().op("text_ops")),
	index("assessments_completed_at_idx").using("btree", table.completedAt.asc().nullsLast().op("timestamp_ops")),
	index("assessments_completed_idx").using("btree", table.completed.asc().nullsLast().op("bool_ops")),
	index("assessments_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("assessments_user_completed_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.completed.asc().nullsLast().op("int4_ops")),
	index("assessments_user_type_completed_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.type.asc().nullsLast().op("bool_ops"), table.completed.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assessments_user_id_users_id_fk"
		}),
]);

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	icon: text().notNull(),
	category: text().notNull(),
	requiredPoints: integer("required_points"),
	requiredModules: integer("required_modules"),
	level: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const commentVotes = pgTable("comment_votes", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	commentId: integer("comment_id").notNull(),
	voteType: text("vote_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comment_votes_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [discussionComments.id],
			name: "comment_votes_comment_id_discussion_comments_id_fk"
		}),
]);

export const discussionComments = pgTable("discussion_comments", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	content: text().notNull(),
	authorId: integer("author_id").notNull(),
	threadId: integer("thread_id").notNull(),
	parentCommentId: integer("parent_comment_id"),
	endorsed: boolean().default(false),
	upvotes: integer().default(0),
	downvotes: integer().default(0),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "discussion_comments_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [discussionThreads.id],
			name: "discussion_comments_thread_id_discussion_threads_id_fk"
		}),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "discussion_comments_parent_comment_id_discussion_comments_id_fk"
		}),
]);

export const communityModules = pgTable("community_modules", {
	id: serial().primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	sharedBySchoolId: integer("shared_by_school_id").notNull(),
	sharedDate: timestamp("shared_date", { mode: 'string' }).defaultNow(),
	status: text().default('active').notNull(),
	totalCompletions: integer("total_completions").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModules.id],
			name: "community_modules_module_id_learning_modules_id_fk"
		}),
	foreignKey({
			columns: [table.sharedBySchoolId],
			foreignColumns: [schools.id],
			name: "community_modules_shared_by_school_id_schools_id_fk"
		}),
]);

export const coreValuesShoutOuts = pgTable("core_values_shout_outs", {
	id: serial().primaryKey().notNull(),
	nominatorId: integer("nominator_id").notNull(),
	nomineeId: integer("nominee_id").notNull(),
	coreValue: text("core_value").notNull(),
	description: text().notNull(),
	pointsAwarded: integer("points_awarded").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.nominatorId],
			foreignColumns: [users.id],
			name: "core_values_shout_outs_nominator_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.nomineeId],
			foreignColumns: [users.id],
			name: "core_values_shout_outs_nominee_id_users_id_fk"
		}),
]);

export const discussionThreads = pgTable("discussion_threads", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	authorId: integer("author_id").notNull(),
	category: text().notNull(),
	tags: text().array().notNull(),
	pinned: boolean().default(false),
	viewCount: integer("view_count").default(0),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "discussion_threads_author_id_users_id_fk"
		}),
]);

export const communityModuleAwards = pgTable("community_module_awards", {
	id: serial().primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	schoolId: integer("school_id").notNull(),
	awardDate: timestamp("award_date", { mode: 'string' }).defaultNow(),
	prizePoints: integer("prize_points").notNull(),
	rank: integer().notNull(),
	monthYear: text("month_year").notNull(),
	averageRating: integer("average_rating").notNull(),
	totalRatings: integer("total_ratings").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModules.id],
			name: "community_module_awards_module_id_learning_modules_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "community_module_awards_school_id_schools_id_fk"
		}),
]);

export const eduTokUserInteractions = pgTable("edu_tok_user_interactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	snippetId: integer("snippet_id").notNull(),
	liked: boolean().default(false),
	viewed: boolean().default(false),
	shared: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "edu_tok_user_interactions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.snippetId],
			foreignColumns: [eduTokSnippets.id],
			name: "edu_tok_user_interactions_snippet_id_edu_tok_snippets_id_fk"
		}),
]);

export const eduTokSnippets = pgTable("edu_tok_snippets", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	videoUrl: text("video_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	sourceUrl: text("source_url"),
	license: text(),
	viewCount: integer("view_count").default(0),
	likes: integer().default(0),
	category: text(),
	tags: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const meetings = pgTable("meetings", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	hostId: integer("host_id").notNull(),
	guestId: integer("guest_id"),
	timeZone: text("time_zone").notNull(),
	status: text().default('scheduled').notNull(),
	meetingLink: text("meeting_link"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.hostId],
			foreignColumns: [users.id],
			name: "meetings_host_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [users.id],
			name: "meetings_guest_id_users_id_fk"
		}),
]);

export const schools = pgTable("schools", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	logoUrl: text("logo_url"),
	websiteUrl: text("website_url"),
	subscriptionActive: boolean("subscription_active").default(false),
	subscriptionType: text("subscription_type").default('basic'),
	subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: 'string' }),
	teacherCount: integer("teacher_count").default(0),
	isFreeAccess: boolean("is_free_access").default(false),
	adminPasswordHash: text("admin_password_hash"),
	customization: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("schools_name_unique").on(table.name),
]);

export const moduleRatings = pgTable("module_ratings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	moduleId: integer("module_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "module_ratings_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModules.id],
			name: "module_ratings_module_id_learning_modules_id_fk"
		}),
]);

export const spinGameRewards = pgTable("spin_game_rewards", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	rewardType: text("reward_type").notNull(),
	rewardAmount: integer("reward_amount"),
	itemId: integer("item_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "spin_game_rewards_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [storeItems.id],
			name: "spin_game_rewards_item_id_store_items_id_fk"
		}),
]);

export const gameCompletions = pgTable("game_completions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	gameId: integer("game_id").notNull(),
	score: integer(),
	timeTaken: integer("time_taken"),
	pointsEarned: integer("points_earned").notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "game_completions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [educationalGames.id],
			name: "game_completions_game_id_educational_games_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
});

export const storeItems = pgTable("store_items", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	icon: text().notNull(),
	category: text().notNull(),
	bearBucksCost: integer("bear_bucks_cost").notNull(),
	levelRequired: integer("level_required").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const learningModules = pgTable("learning_modules", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	duration: integer().notNull(),
	pointValue: integer("point_value").default(5),
	imageUrl: text("image_url"),
	featured: boolean().default(false),
	difficulty: text().notNull(),
	category: text().notNull(),
	content: text(),
	quiz: json(),
	isVisible: boolean("is_visible").default(true),
	averageRating: integer("average_rating").default(0),
	ratingCount: integer("rating_count").default(0),
	isSharedToCommunity: boolean("is_shared_to_community").default(false),
	schoolId: integer("school_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "learning_modules_school_id_schools_id_fk"
		}),
]);

export const educationalGames = pgTable("educational_games", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	type: text().notNull(),
	difficulty: text().notNull(),
	category: text().notNull(),
	pointsValue: integer("points_value").notNull(),
	config: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const teacherInvitations = pgTable("teacher_invitations", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	email: text().notNull(),
	invitationToken: text("invitation_token").notNull(),
	invitedByUserId: integer("invited_by_user_id").notNull(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "teacher_invitations_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.invitedByUserId],
			foreignColumns: [users.id],
			name: "teacher_invitations_invited_by_user_id_users_id_fk"
		}),
	unique("teacher_invitations_invitation_token_unique").on(table.invitationToken),
]);

export const teacherMessages = pgTable("teacher_messages", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	recipientId: integer("recipient_id").notNull(),
	schoolId: integer("school_id"),
	messageType: text("message_type").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	important: boolean().default(false),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	relatedId: integer("related_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "teacher_messages_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "teacher_messages_recipient_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "teacher_messages_school_id_schools_id_fk"
		}),
]);

export const teacherSelfAssessments = pgTable("teacher_self_assessments", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	results: json().notNull(),
	strengthAreas: text("strength_areas").array(),
	growthAreas: text("growth_areas").array(),
	averageSkillLevel: doublePrecision("average_skill_level"),
	teacherLevel: text("teacher_level"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "teacher_self_assessments_user_id_users_id_fk"
		}),
]);

export const userAchievements = pgTable("user_achievements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	achievementId: integer("achievement_id").notNull(),
	earnedAt: timestamp("earned_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_achievements_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_achievements_id_fk"
		}),
]);

export const userItems = pgTable("user_items", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	itemId: integer("item_id").notNull(),
	acquired: timestamp({ mode: 'string' }).defaultNow(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_items_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [storeItems.id],
			name: "user_items_item_id_store_items_id_fk"
		}),
]);

export const streakRewards = pgTable("streak_rewards", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	rewardType: text("reward_type").notNull(),
	streakCount: integer("streak_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "streak_rewards_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id"),
	username: text().notNull(),
	password: text().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	language: text().notNull(),
	nativeLanguage: text("native_language").notNull(),
	timeZone: text("time_zone").notNull(),
	profilePicture: text("profile_picture"),
	activeAvatarId: integer("active_avatar_id"),
	learningStyle: json("learning_style"),
	bearBucks: integer("bear_bucks").default(0),
	points: integer().default(0),
	lifetimePoints: integer("lifetime_points").default(0),
	level: integer().default(1),
	streak: integer().default(0),
	lastActive: timestamp("last_active", { mode: 'string' }),
	achievementCount: integer("achievement_count").default(0),
	isAdmin: boolean("is_admin").default(false),
	isSchoolAdmin: boolean("is_school_admin").default(false),
	isOwner: boolean("is_owner").default(false),
	fingerprintExpiration: date("fingerprint_expiration"),
	cprExpiration: date("cpr_expiration"),
	firstAidExpiration: date("first_aid_expiration"),
	foodHandlerExpiration: date("food_handler_expiration"),
	jobTitle: text("job_title"),
	designations: json(),
	hasUnreadMessages: boolean("has_unread_messages").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "users_school_id_schools_id_fk"
		}),
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const userAvatarItems = pgTable("user_avatar_items", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	itemId: integer("item_id").notNull(),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_avatar_items_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [avatarItems.id],
			name: "user_avatar_items_item_id_avatar_items_id_fk"
		}),
]);

export const userAvatars = pgTable("user_avatars", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	isActive: boolean("is_active").default(false),
	components: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_avatars_user_id_users_id_fk"
		}),
]);

export const userProgress = pgTable("user_progress", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	moduleId: integer("module_id").notNull(),
	progress: integer().default(0).notNull(),
	completed: boolean().default(false),
	recommended: boolean().default(false),
	pointsEarned: integer("points_earned").default(0),
	lastAccessed: timestamp("last_accessed", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_progress_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModules.id],
			name: "user_progress_module_id_learning_modules_id_fk"
		}),
]);

export const avatarCategories = pgTable("avatar_categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	displayOrder: integer("display_order").default(0),
	isLayerable: boolean("is_layerable").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("avatar_categories_name_unique").on(table.name),
]);

export const avatarItems = pgTable("avatar_items", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	categoryId: integer("category_id").notNull(),
	svgPath: text("svg_path").notNull(),
	pointsCost: integer("points_cost").default(50).notNull(),
	levelRequired: integer("level_required").default(1),
	rarity: text().default('common'),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [avatarCategories.id],
			name: "avatar_items_category_id_avatar_categories_id_fk"
		}),
]);

export const videoQuizCompletions = pgTable("video_quiz_completions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	videoId: text("video_id").notNull(),
	pointsEarned: integer("points_earned").notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "video_quiz_completions_user_id_users_id_fk"
		}),
]);

export const questionAvailability = pgTable("question_availability", {
	id: serial().primaryKey().notNull(),
	questionId: text("question_id").notNull(),
	schoolId: integer("school_id"),
	isEnabled: boolean("is_enabled").default(true),
	enabledBy: integer("enabled_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("question_availability_enabled_idx").using("btree", table.isEnabled.asc().nullsLast().op("bool_ops")),
	index("question_availability_question_idx").using("btree", table.questionId.asc().nullsLast().op("text_ops")),
	index("question_availability_question_school_enabled_idx").using("btree", table.questionId.asc().nullsLast().op("bool_ops"), table.schoolId.asc().nullsLast().op("int4_ops"), table.isEnabled.asc().nullsLast().op("bool_ops")),
	index("question_availability_school_enabled_idx").using("btree", table.schoolId.asc().nullsLast().op("bool_ops"), table.isEnabled.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [assessmentQuestions.id],
			name: "question_availability_question_id_assessment_questions_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "question_availability_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.enabledBy],
			foreignColumns: [users.id],
			name: "question_availability_enabled_by_users_id_fk"
		}),
]);

export const assessmentConfig = pgTable("assessment_config", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id"),
	questionCount: integer("question_count").default(40),
	timePerQuestion: integer("time_per_question").default(60),
	startingDifficulty: integer("starting_difficulty").default(3),
	minDomainCoverage: integer("min_domain_coverage").default(1),
	updatedBy: integer("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("assessment_config_platform_idx").using("btree", table.schoolId.asc().nullsLast().op("int4_ops")),
	index("assessment_config_school_idx").using("btree", table.schoolId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "assessment_config_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "assessment_config_updated_by_users_id_fk"
		}),
]);

export const assessmentDomains = pgTable("assessment_domains", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	questionWeight: integer("question_weight").notNull(),
	displayOrder: integer("display_order").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("assessment_domains_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("assessment_domains_display_order_idx").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("assessment_domains_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("assessment_domains_name_unique").on(table.name),
]);

export const earlyLearningStandards = pgTable("early_learning_standards", {
	id: serial().primaryKey().notNull(),
	standardArea: text("standard_area").notNull(),
	strand: text().notNull(),
	standardCode: text("standard_code").notNull(),
	ageGroup: text("age_group").notNull(),
	standardText: text("standard_text").notNull(),
	description: text(),
	keywords: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("standards_age_group_idx").using("btree", table.ageGroup.asc().nullsLast().op("text_ops")),
	index("standards_area_strand_idx").using("btree", table.standardArea.asc().nullsLast().op("text_ops"), table.strand.asc().nullsLast().op("text_ops")),
	index("standards_keywords_idx").using("btree", table.keywords.asc().nullsLast().op("array_ops")),
	unique("early_learning_standards_standard_code_unique").on(table.standardCode),
]);

export const assessmentResults = pgTable("assessment_results", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	overallScore: integer("overall_score").notNull(),
	totalQuestions: integer("total_questions").notNull(),
	totalCorrect: integer("total_correct").notNull(),
	accuracyRate: doublePrecision("accuracy_rate").notNull(),
	primaryMiniLessons: json("primary_mini_lessons").notNull(),
	estimatedImprovementTime: integer("estimated_improvement_time"),
	domainBreakdown: json("domain_breakdown").notNull(),
	strengthAreas: json("strength_areas").notNull(),
	growthAreas: json("growth_areas").notNull(),
	personalizedSummary: text("personalized_summary"),
	immediateNextSteps: json("immediate_next_steps"),
	calculatedAt: timestamp("calculated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("assessment_results_accuracy_idx").using("btree", table.accuracyRate.asc().nullsLast().op("float8_ops")),
	index("assessment_results_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops")),
	index("assessment_results_score_idx").using("btree", table.overallScore.asc().nullsLast().op("int4_ops")),
	index("assessment_results_unique_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_results_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
]);

export const lessonPlans = pgTable("lesson_plans", {
	id: serial().primaryKey().notNull(),
	createdBy: integer("created_by").notNull(),
	schoolId: integer("school_id"),
	title: text().notNull(),
	description: text(),
	ageGroup: text("age_group").notNull(),
	duration: integer(),
	objectives: text().array(),
	materials: text().array(),
	activities: json(),
	assessment: text(),
	notes: text(),
	standardsReferenced: integer("standards_referenced").array(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("lesson_plans_age_group_idx").using("btree", table.ageGroup.asc().nullsLast().op("text_ops")),
	index("lesson_plans_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("lesson_plans_public_idx").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("lesson_plans_school_idx").using("btree", table.schoolId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "lesson_plans_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "lesson_plans_school_id_schools_id_fk"
		}),
]);

export const videoRatings = pgTable("video_ratings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	videoId: text("video_id").notNull(),
	rating: integer().notNull(),
	review: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("video_ratings_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("video_ratings_video_id_idx").using("btree", table.videoId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "video_ratings_user_id_fkey"
		}),
	unique("video_ratings_user_id_video_id_key").on(table.userId, table.videoId),
	check("video_ratings_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const learningPaths = pgTable("learning_paths", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	userId: integer("user_id").notNull(),
	domainGroups: json("domain_groups").notNull(),
	totalFailedQuestions: integer("total_failed_questions").notNull(),
	totalDomains: integer("total_domains").notNull(),
	estimatedCompletionTime: integer("estimated_completion_time").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("learning_paths_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops")),
	index("learning_paths_failed_questions_idx").using("btree", table.totalFailedQuestions.asc().nullsLast().op("int4_ops")),
	index("learning_paths_unique_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops")),
	index("learning_paths_user_assessment_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.assessmentId.asc().nullsLast().op("int4_ops")),
	index("learning_paths_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "learning_paths_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "learning_paths_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const coreValueShoutouts = pgTable("core_value_shoutouts", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	nominatorId: integer("nominator_id"),
	nomineeId: integer("nominee_id"),
	coreValue: varchar("core_value", { length: 50 }).notNull(),
	description: text().notNull(),
	pointsAwarded: integer("points_awarded").default(5),
}, (table) => [
	foreignKey({
			columns: [table.nominatorId],
			foreignColumns: [users.id],
			name: "core_value_shoutouts_nominator_id_fkey"
		}),
	foreignKey({
			columns: [table.nomineeId],
			foreignColumns: [users.id],
			name: "core_value_shoutouts_nominee_id_fkey"
		}),
]);

export const bearBucksTransactions = pgTable("bear_bucks_transactions", {
	id: serial().primaryKey().notNull(),
	recipientId: integer("recipient_id"),
	senderId: integer("sender_id"),
	amount: integer().notNull(),
	reason: text().notNull(),
	category: varchar({ length: 50 }).default('recognition'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "bear_bucks_transactions_recipient_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "bear_bucks_transactions_sender_id_fkey"
		}),
]);

export const dailyLogins = pgTable("daily_logins", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	loginDate: date("login_date").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_logins_user_id_fkey"
		}),
	unique("daily_logins_user_id_login_date_key").on(table.userId, table.loginDate),
]);

export const assessmentResponses = pgTable("assessment_responses", {
	id: serial().primaryKey().notNull(),
	assessmentId: integer("assessment_id").notNull(),
	questionId: text("question_id").notNull(),
	userId: integer("user_id").notNull(),
	questionSequence: integer("question_sequence").notNull(),
	selectedAnswer: integer("selected_answer"),
	isCorrect: boolean("is_correct").notNull(),
	pointsEarned: integer("points_earned").default(0),
	timeSpent: integer("time_spent"),
	timedOut: boolean("timed_out").default(false),
	difficulty: text().notNull(),
	domainId: integer("domain_id").notNull(),
	answeredAt: timestamp("answered_at", { mode: 'string' }).defaultNow(),
	wasLateSubmission: boolean("was_late_submission").default(false),
	processingTimestamp: timestamp("processing_timestamp", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("assessment_responses_answered_at_idx").using("btree", table.answeredAt.asc().nullsLast().op("timestamp_ops")),
	index("assessment_responses_assessment_sequence_idx").using("btree", table.assessmentId.asc().nullsLast().op("int4_ops"), table.questionSequence.asc().nullsLast().op("int4_ops")),
	index("assessment_responses_domain_performance_idx").using("btree", table.domainId.asc().nullsLast().op("int4_ops"), table.isCorrect.asc().nullsLast().op("text_ops"), table.difficulty.asc().nullsLast().op("text_ops")),
	index("assessment_responses_processing_timestamp_idx").using("btree", table.processingTimestamp.asc().nullsLast().op("timestamp_ops")),
	index("assessment_responses_question_performance_idx").using("btree", table.questionId.asc().nullsLast().op("text_ops"), table.isCorrect.asc().nullsLast().op("bool_ops")),
	index("assessment_responses_timeout_idx").using("btree", table.timedOut.asc().nullsLast().op("bool_ops")),
	index("assessment_responses_timing_analysis_idx").using("btree", table.timedOut.asc().nullsLast().op("bool_ops"), table.wasLateSubmission.asc().nullsLast().op("bool_ops")),
	index("assessment_responses_user_assessment_domain_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.assessmentId.asc().nullsLast().op("int4_ops"), table.domainId.asc().nullsLast().op("int4_ops")),
	index("assessment_responses_user_correct_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.isCorrect.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_responses_assessment_id_assessments_id_fk"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [assessmentQuestions.id],
			name: "assessment_responses_question_id_assessment_questions_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assessment_responses_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [assessmentDomains.id],
			name: "assessment_responses_domain_id_fkey"
		}),
]);

export const newsletterDeliveries = pgTable("newsletter_deliveries", {
	id: serial().primaryKey().notNull(),
	newsletterId: integer("newsletter_id").notNull(),
	recipientId: integer("recipient_id").notNull(),
	deliveryMethod: text("delivery_method").notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	openedAt: timestamp("opened_at", { mode: 'string' }),
	isRead: boolean("is_read").default(false),
}, (table) => [
	foreignKey({
			columns: [table.newsletterId],
			foreignColumns: [newsletters.id],
			name: "newsletter_deliveries_newsletter_id_fkey"
		}),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "newsletter_deliveries_recipient_id_fkey"
		}),
]);

export const newsletters = pgTable("newsletters", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	authorId: integer("author_id").notNull(),
	title: text().notNull(),
	subtitle: text(),
	content: jsonb(),
	featuredImage: text("featured_image"),
	status: text().default('draft').notNull(),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	recipientGroups: jsonb("recipient_groups").default([]),
	readCount: integer("read_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdBy: integer("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "newsletters_school_id_fkey"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "newsletters_author_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "newsletters_created_by_fkey"
		}),
]);
