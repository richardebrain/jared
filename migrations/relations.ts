import { relations } from "drizzle-orm/relations";
import { users, assessmentQuestions, assessmentDomains, assessments, commentVotes, discussionComments, discussionThreads, learningModules, communityModules, schools, coreValuesShoutOuts, communityModuleAwards, eduTokUserInteractions, eduTokSnippets, meetings, moduleRatings, spinGameRewards, storeItems, gameCompletions, educationalGames, teacherInvitations, teacherMessages, teacherSelfAssessments, userAchievements, achievements, userItems, streakRewards, userAvatarItems, avatarItems, userAvatars, userProgress, avatarCategories, videoQuizCompletions, questionAvailability, assessmentConfig, assessmentResults, lessonPlans, videoRatings, learningPaths, coreValueShoutouts, bearBucksTransactions, dailyLogins, assessmentResponses, newsletters, newsletterDeliveries } from "./schema";

export const assessmentQuestionsRelations = relations(assessmentQuestions, ({one, many}) => ({
	user_createdBy: one(users, {
		fields: [assessmentQuestions.createdBy],
		references: [users.id],
		relationName: "assessmentQuestions_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [assessmentQuestions.approvedBy],
		references: [users.id],
		relationName: "assessmentQuestions_approvedBy_users_id"
	}),
	assessmentDomain: one(assessmentDomains, {
		fields: [assessmentQuestions.domainId],
		references: [assessmentDomains.id]
	}),
	questionAvailabilities: many(questionAvailability),
	assessmentResponses: many(assessmentResponses),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	assessmentQuestions_createdBy: many(assessmentQuestions, {
		relationName: "assessmentQuestions_createdBy_users_id"
	}),
	assessmentQuestions_approvedBy: many(assessmentQuestions, {
		relationName: "assessmentQuestions_approvedBy_users_id"
	}),
	assessments: many(assessments),
	commentVotes: many(commentVotes),
	discussionComments: many(discussionComments),
	coreValuesShoutOuts_nominatorId: many(coreValuesShoutOuts, {
		relationName: "coreValuesShoutOuts_nominatorId_users_id"
	}),
	coreValuesShoutOuts_nomineeId: many(coreValuesShoutOuts, {
		relationName: "coreValuesShoutOuts_nomineeId_users_id"
	}),
	discussionThreads: many(discussionThreads),
	eduTokUserInteractions: many(eduTokUserInteractions),
	meetings_hostId: many(meetings, {
		relationName: "meetings_hostId_users_id"
	}),
	meetings_guestId: many(meetings, {
		relationName: "meetings_guestId_users_id"
	}),
	moduleRatings: many(moduleRatings),
	spinGameRewards: many(spinGameRewards),
	gameCompletions: many(gameCompletions),
	teacherInvitations: many(teacherInvitations),
	teacherMessages_senderId: many(teacherMessages, {
		relationName: "teacherMessages_senderId_users_id"
	}),
	teacherMessages_recipientId: many(teacherMessages, {
		relationName: "teacherMessages_recipientId_users_id"
	}),
	teacherSelfAssessments: many(teacherSelfAssessments),
	userAchievements: many(userAchievements),
	userItems: many(userItems),
	streakRewards: many(streakRewards),
	school: one(schools, {
		fields: [users.schoolId],
		references: [schools.id]
	}),
	userAvatarItems: many(userAvatarItems),
	userAvatars: many(userAvatars),
	userProgresses: many(userProgress),
	videoQuizCompletions: many(videoQuizCompletions),
	questionAvailabilities: many(questionAvailability),
	assessmentConfigs: many(assessmentConfig),
	lessonPlans: many(lessonPlans),
	videoRatings: many(videoRatings),
	learningPaths: many(learningPaths),
	coreValueShoutouts_nominatorId: many(coreValueShoutouts, {
		relationName: "coreValueShoutouts_nominatorId_users_id"
	}),
	coreValueShoutouts_nomineeId: many(coreValueShoutouts, {
		relationName: "coreValueShoutouts_nomineeId_users_id"
	}),
	bearBucksTransactions_recipientId: many(bearBucksTransactions, {
		relationName: "bearBucksTransactions_recipientId_users_id"
	}),
	bearBucksTransactions_senderId: many(bearBucksTransactions, {
		relationName: "bearBucksTransactions_senderId_users_id"
	}),
	dailyLogins: many(dailyLogins),
	assessmentResponses: many(assessmentResponses),
	newsletterDeliveries: many(newsletterDeliveries),
	newsletters_authorId: many(newsletters, {
		relationName: "newsletters_authorId_users_id"
	}),
	newsletters_createdBy: many(newsletters, {
		relationName: "newsletters_createdBy_users_id"
	}),
}));

export const assessmentDomainsRelations = relations(assessmentDomains, ({many}) => ({
	assessmentQuestions: many(assessmentQuestions),
	assessmentResponses: many(assessmentResponses),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	user: one(users, {
		fields: [assessments.userId],
		references: [users.id]
	}),
	assessmentResults: many(assessmentResults),
	learningPaths: many(learningPaths),
	assessmentResponses: many(assessmentResponses),
}));

export const commentVotesRelations = relations(commentVotes, ({one}) => ({
	user: one(users, {
		fields: [commentVotes.userId],
		references: [users.id]
	}),
	discussionComment: one(discussionComments, {
		fields: [commentVotes.commentId],
		references: [discussionComments.id]
	}),
}));

export const discussionCommentsRelations = relations(discussionComments, ({one, many}) => ({
	commentVotes: many(commentVotes),
	user: one(users, {
		fields: [discussionComments.authorId],
		references: [users.id]
	}),
	discussionThread: one(discussionThreads, {
		fields: [discussionComments.threadId],
		references: [discussionThreads.id]
	}),
	discussionComment: one(discussionComments, {
		fields: [discussionComments.parentCommentId],
		references: [discussionComments.id],
		relationName: "discussionComments_parentCommentId_discussionComments_id"
	}),
	discussionComments: many(discussionComments, {
		relationName: "discussionComments_parentCommentId_discussionComments_id"
	}),
}));

export const discussionThreadsRelations = relations(discussionThreads, ({one, many}) => ({
	discussionComments: many(discussionComments),
	user: one(users, {
		fields: [discussionThreads.authorId],
		references: [users.id]
	}),
}));

export const communityModulesRelations = relations(communityModules, ({one}) => ({
	learningModule: one(learningModules, {
		fields: [communityModules.moduleId],
		references: [learningModules.id]
	}),
	school: one(schools, {
		fields: [communityModules.sharedBySchoolId],
		references: [schools.id]
	}),
}));

export const learningModulesRelations = relations(learningModules, ({one, many}) => ({
	communityModules: many(communityModules),
	communityModuleAwards: many(communityModuleAwards),
	moduleRatings: many(moduleRatings),
	school: one(schools, {
		fields: [learningModules.schoolId],
		references: [schools.id]
	}),
	userProgresses: many(userProgress),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	communityModules: many(communityModules),
	communityModuleAwards: many(communityModuleAwards),
	learningModules: many(learningModules),
	teacherInvitations: many(teacherInvitations),
	teacherMessages: many(teacherMessages),
	users: many(users),
	questionAvailabilities: many(questionAvailability),
	assessmentConfigs: many(assessmentConfig),
	lessonPlans: many(lessonPlans),
	newsletters: many(newsletters),
}));

export const coreValuesShoutOutsRelations = relations(coreValuesShoutOuts, ({one}) => ({
	user_nominatorId: one(users, {
		fields: [coreValuesShoutOuts.nominatorId],
		references: [users.id],
		relationName: "coreValuesShoutOuts_nominatorId_users_id"
	}),
	user_nomineeId: one(users, {
		fields: [coreValuesShoutOuts.nomineeId],
		references: [users.id],
		relationName: "coreValuesShoutOuts_nomineeId_users_id"
	}),
}));

export const communityModuleAwardsRelations = relations(communityModuleAwards, ({one}) => ({
	learningModule: one(learningModules, {
		fields: [communityModuleAwards.moduleId],
		references: [learningModules.id]
	}),
	school: one(schools, {
		fields: [communityModuleAwards.schoolId],
		references: [schools.id]
	}),
}));

export const eduTokUserInteractionsRelations = relations(eduTokUserInteractions, ({one}) => ({
	user: one(users, {
		fields: [eduTokUserInteractions.userId],
		references: [users.id]
	}),
	eduTokSnippet: one(eduTokSnippets, {
		fields: [eduTokUserInteractions.snippetId],
		references: [eduTokSnippets.id]
	}),
}));

export const eduTokSnippetsRelations = relations(eduTokSnippets, ({many}) => ({
	eduTokUserInteractions: many(eduTokUserInteractions),
}));

export const meetingsRelations = relations(meetings, ({one}) => ({
	user_hostId: one(users, {
		fields: [meetings.hostId],
		references: [users.id],
		relationName: "meetings_hostId_users_id"
	}),
	user_guestId: one(users, {
		fields: [meetings.guestId],
		references: [users.id],
		relationName: "meetings_guestId_users_id"
	}),
}));

export const moduleRatingsRelations = relations(moduleRatings, ({one}) => ({
	user: one(users, {
		fields: [moduleRatings.userId],
		references: [users.id]
	}),
	learningModule: one(learningModules, {
		fields: [moduleRatings.moduleId],
		references: [learningModules.id]
	}),
}));

export const spinGameRewardsRelations = relations(spinGameRewards, ({one}) => ({
	user: one(users, {
		fields: [spinGameRewards.userId],
		references: [users.id]
	}),
	storeItem: one(storeItems, {
		fields: [spinGameRewards.itemId],
		references: [storeItems.id]
	}),
}));

export const storeItemsRelations = relations(storeItems, ({many}) => ({
	spinGameRewards: many(spinGameRewards),
	userItems: many(userItems),
}));

export const gameCompletionsRelations = relations(gameCompletions, ({one}) => ({
	user: one(users, {
		fields: [gameCompletions.userId],
		references: [users.id]
	}),
	educationalGame: one(educationalGames, {
		fields: [gameCompletions.gameId],
		references: [educationalGames.id]
	}),
}));

export const educationalGamesRelations = relations(educationalGames, ({many}) => ({
	gameCompletions: many(gameCompletions),
}));

export const teacherInvitationsRelations = relations(teacherInvitations, ({one}) => ({
	school: one(schools, {
		fields: [teacherInvitations.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [teacherInvitations.invitedByUserId],
		references: [users.id]
	}),
}));

export const teacherMessagesRelations = relations(teacherMessages, ({one}) => ({
	user_senderId: one(users, {
		fields: [teacherMessages.senderId],
		references: [users.id],
		relationName: "teacherMessages_senderId_users_id"
	}),
	user_recipientId: one(users, {
		fields: [teacherMessages.recipientId],
		references: [users.id],
		relationName: "teacherMessages_recipientId_users_id"
	}),
	school: one(schools, {
		fields: [teacherMessages.schoolId],
		references: [schools.id]
	}),
}));

export const teacherSelfAssessmentsRelations = relations(teacherSelfAssessments, ({one}) => ({
	user: one(users, {
		fields: [teacherSelfAssessments.userId],
		references: [users.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const userItemsRelations = relations(userItems, ({one}) => ({
	user: one(users, {
		fields: [userItems.userId],
		references: [users.id]
	}),
	storeItem: one(storeItems, {
		fields: [userItems.itemId],
		references: [storeItems.id]
	}),
}));

export const streakRewardsRelations = relations(streakRewards, ({one}) => ({
	user: one(users, {
		fields: [streakRewards.userId],
		references: [users.id]
	}),
}));

export const userAvatarItemsRelations = relations(userAvatarItems, ({one}) => ({
	user: one(users, {
		fields: [userAvatarItems.userId],
		references: [users.id]
	}),
	avatarItem: one(avatarItems, {
		fields: [userAvatarItems.itemId],
		references: [avatarItems.id]
	}),
}));

export const avatarItemsRelations = relations(avatarItems, ({one, many}) => ({
	userAvatarItems: many(userAvatarItems),
	avatarCategory: one(avatarCategories, {
		fields: [avatarItems.categoryId],
		references: [avatarCategories.id]
	}),
}));

export const userAvatarsRelations = relations(userAvatars, ({one}) => ({
	user: one(users, {
		fields: [userAvatars.userId],
		references: [users.id]
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	user: one(users, {
		fields: [userProgress.userId],
		references: [users.id]
	}),
	learningModule: one(learningModules, {
		fields: [userProgress.moduleId],
		references: [learningModules.id]
	}),
}));

export const avatarCategoriesRelations = relations(avatarCategories, ({many}) => ({
	avatarItems: many(avatarItems),
}));

export const videoQuizCompletionsRelations = relations(videoQuizCompletions, ({one}) => ({
	user: one(users, {
		fields: [videoQuizCompletions.userId],
		references: [users.id]
	}),
}));

export const questionAvailabilityRelations = relations(questionAvailability, ({one}) => ({
	assessmentQuestion: one(assessmentQuestions, {
		fields: [questionAvailability.questionId],
		references: [assessmentQuestions.id]
	}),
	school: one(schools, {
		fields: [questionAvailability.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [questionAvailability.enabledBy],
		references: [users.id]
	}),
}));

export const assessmentConfigRelations = relations(assessmentConfig, ({one}) => ({
	school: one(schools, {
		fields: [assessmentConfig.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [assessmentConfig.updatedBy],
		references: [users.id]
	}),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResults.assessmentId],
		references: [assessments.id]
	}),
}));

export const lessonPlansRelations = relations(lessonPlans, ({one}) => ({
	user: one(users, {
		fields: [lessonPlans.createdBy],
		references: [users.id]
	}),
	school: one(schools, {
		fields: [lessonPlans.schoolId],
		references: [schools.id]
	}),
}));

export const videoRatingsRelations = relations(videoRatings, ({one}) => ({
	user: one(users, {
		fields: [videoRatings.userId],
		references: [users.id]
	}),
}));

export const learningPathsRelations = relations(learningPaths, ({one}) => ({
	assessment: one(assessments, {
		fields: [learningPaths.assessmentId],
		references: [assessments.id]
	}),
	user: one(users, {
		fields: [learningPaths.userId],
		references: [users.id]
	}),
}));

export const coreValueShoutoutsRelations = relations(coreValueShoutouts, ({one}) => ({
	user_nominatorId: one(users, {
		fields: [coreValueShoutouts.nominatorId],
		references: [users.id],
		relationName: "coreValueShoutouts_nominatorId_users_id"
	}),
	user_nomineeId: one(users, {
		fields: [coreValueShoutouts.nomineeId],
		references: [users.id],
		relationName: "coreValueShoutouts_nomineeId_users_id"
	}),
}));

export const bearBucksTransactionsRelations = relations(bearBucksTransactions, ({one}) => ({
	user_recipientId: one(users, {
		fields: [bearBucksTransactions.recipientId],
		references: [users.id],
		relationName: "bearBucksTransactions_recipientId_users_id"
	}),
	user_senderId: one(users, {
		fields: [bearBucksTransactions.senderId],
		references: [users.id],
		relationName: "bearBucksTransactions_senderId_users_id"
	}),
}));

export const dailyLoginsRelations = relations(dailyLogins, ({one}) => ({
	user: one(users, {
		fields: [dailyLogins.userId],
		references: [users.id]
	}),
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentResponses.assessmentId],
		references: [assessments.id]
	}),
	assessmentQuestion: one(assessmentQuestions, {
		fields: [assessmentResponses.questionId],
		references: [assessmentQuestions.id]
	}),
	user: one(users, {
		fields: [assessmentResponses.userId],
		references: [users.id]
	}),
	assessmentDomain: one(assessmentDomains, {
		fields: [assessmentResponses.domainId],
		references: [assessmentDomains.id]
	}),
}));

export const newsletterDeliveriesRelations = relations(newsletterDeliveries, ({one}) => ({
	newsletter: one(newsletters, {
		fields: [newsletterDeliveries.newsletterId],
		references: [newsletters.id]
	}),
	user: one(users, {
		fields: [newsletterDeliveries.recipientId],
		references: [users.id]
	}),
}));

export const newslettersRelations = relations(newsletters, ({one, many}) => ({
	newsletterDeliveries: many(newsletterDeliveries),
	school: one(schools, {
		fields: [newsletters.schoolId],
		references: [schools.id]
	}),
	user_authorId: one(users, {
		fields: [newsletters.authorId],
		references: [users.id],
		relationName: "newsletters_authorId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [newsletters.createdBy],
		references: [users.id],
		relationName: "newsletters_createdBy_users_id"
	}),
}));