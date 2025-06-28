import { eq, sql, and, desc, inArray, or } from "drizzle-orm";
import {
  schools,
  users,
  learningModules,
  teacherInvitations,
  newsletters,
  eceReportingSettings,
  teacherMessages,
  questionAvailability,
  assessmentConfig,
  communityModuleAwards,
  lessonPlans,
  eceHours,
  teacherSelfAssessments,
  communityModules,
  userAchievements,
  userProgress,
  userItems,
  userAvatarItems,
  userAvatars,
  gameCompletions,
  commentVotes,
  discussionComments,
  videoRatings,
  discussionThreads,
  assessmentRetakePermissions,
  dailyLogins,
  bearBucksTransactions,
  coreValuesShoutOuts,
  eduTokUserInteractions,
  videoQuizCompletions,
  moduleRatings,
  assessmentResults,
  spinGameRewards,
  streakRewards,
} from "@shared/schema";
import { db } from "server/db";

export async function deleteSchool(schoolId: number) {
  try {
    // Get school information first
    const school = await db.select().from(schools).where(eq(schools.id, schoolId));

    if (school.length === 0) {
      throw new Error("School not found");
    }

    console.log(`Deleting school: ${school[0].name} (ID: ${schoolId})`);

    // Get all users in this school before deletion
    const schoolUsers = await db.select().from(users).where(eq(users.schoolId, schoolId));

    console.log(`Found ${schoolUsers.length} users in school to be deleted`);

    // Use transaction to ensure all-or-nothing deletion
    await db.transaction(async (tx) => {
      console.log("Starting school deletion transaction...");

      // STEP 1: Delete school-related data (tables that reference schools)
      console.log("Step 1: Deleting school-related data...");

      // 1. Delete teacher invitations for this school
      await tx.delete(teacherInvitations).where(eq(teacherInvitations.schoolId, schoolId));
      console.log("Deleted teacher invitations");

      // 2. Delete newsletters for this school
      await tx.delete(newsletters).where(eq(newsletters.schoolId, schoolId));
      console.log("Deleted newsletters");

      // 3. Delete ECE reporting settings for this school
      await tx.delete(eceReportingSettings).where(eq(eceReportingSettings.schoolId, schoolId));
      console.log("Deleted ECE reporting settings");

      // 4. Delete teacher messages for this school
      await tx.delete(teacherMessages).where(eq(teacherMessages.schoolId, schoolId));
      console.log("Deleted teacher messages");

      // 5. Delete question availability settings for this school
      await tx.delete(questionAvailability).where(eq(questionAvailability.schoolId, schoolId));
      console.log("Deleted question availability settings");

      // 6. Delete assessment config for this school
      await tx.delete(assessmentConfig).where(eq(assessmentConfig.schoolId, schoolId));
      console.log("Deleted assessment config");

      // 7. Delete community module awards for this school
      await tx.delete(communityModuleAwards).where(eq(communityModuleAwards.schoolId, schoolId));
      console.log("Deleted community module awards");

      // 8. Delete lesson plans for this school
      await tx.delete(lessonPlans).where(eq(lessonPlans.schoolId, schoolId));
      console.log("Deleted lesson plans");

      // 9. Delete ECE hours for this school
      await tx.delete(eceHours).where(eq(eceHours.schoolId, schoolId));
      console.log("Deleted ECE hours");

   
      console.log("Deleted teacher self assessments");

      // 11. Handle learning modules - preserve community modules, delete others
      const schoolModules = await tx.select().from(learningModules).where(eq(learningModules.schoolId, schoolId));
      console.log(`Found ${schoolModules.length} learning modules for this school`);

      // Check which modules are shared to community
      const communityModulesList = await tx.select().from(communityModules).where(eq(communityModules.sharedBySchoolId, schoolId));
      console.log(`Found ${communityModulesList.length} community modules from this school`);

      // Delete modules that are NOT shared to community
      const modulesToDelete = schoolModules.filter(module => 
        !communityModulesList.some(cm => cm.moduleId === module.id)
      );

      if (modulesToDelete.length > 0) {
        const moduleIdsToDelete = modulesToDelete.map(m => m.id);
        await tx.delete(learningModules).where(inArray(learningModules.id, moduleIdsToDelete));
        console.log(`Deleted ${modulesToDelete.length} non-community modules`);
      }

      // STEP 2: Delete user-related data for all users in this school
      console.log("Step 2: Deleting user-related data...");

      const userIds = schoolUsers.map(user => user.id);

      if (userIds.length > 0) {
        // Delete user achievements
        await tx.delete(userAchievements).where(inArray(userAchievements.userId, userIds));
        console.log("Deleted user achievements");

        // Delete user progress
        await tx.delete(userProgress).where(inArray(userProgress.userId, userIds));
        console.log("Deleted user progress");

        // Delete user items
        await tx.delete(userItems).where(inArray(userItems.userId, userIds));
        console.log("Deleted user items");

        // Delete user avatar items
        await tx.delete(userAvatarItems).where(inArray(userAvatarItems.userId, userIds));
        console.log("Deleted user avatar items");

        // Delete user avatars
        await tx.delete(userAvatars).where(inArray(userAvatars.userId, userIds));
        console.log("Deleted user avatars");

        // Delete game completions
        await tx.delete(gameCompletions).where(inArray(gameCompletions.userId, userIds));
        console.log("Deleted game completions");

        // Delete comment votes
        await tx.delete(commentVotes).where(inArray(commentVotes.userId, userIds));
        console.log("Deleted comment votes");

        // Delete discussion comments
        await tx.delete(discussionComments).where(inArray(discussionComments.userId, userIds));
        console.log("Deleted discussion comments");

        // Delete video ratings
        await tx.delete(videoRatings).where(inArray(videoRatings.userId, userIds));
        console.log("Deleted video ratings");

        // Delete discussion threads
        await tx.delete(discussionThreads).where(inArray(discussionThreads.userId, userIds));
        console.log("Deleted discussion threads");

        // Delete assessment retake permissions
        await tx.delete(assessmentRetakePermissions).where(inArray(assessmentRetakePermissions.userId, userIds));
        console.log("Deleted assessment retake permissions");

        // Delete daily logins
        await tx.delete(dailyLogins).where(inArray(dailyLogins.userId, userIds));
        console.log("Deleted daily logins");

        // Delete bear bucks transactions
        await tx.delete(bearBucksTransactions).where(
          or(
            inArray(bearBucksTransactions.recipientId, userIds),
            inArray(bearBucksTransactions.senderId, userIds)
          )
        );
        console.log("Deleted bear bucks transactions");

        // Delete core values shout outs
        await tx.delete(coreValuesShoutOuts).where(
          or(
            inArray(coreValuesShoutOuts.nominatorId, userIds),
            inArray(coreValuesShoutOuts.nomineeId, userIds)
          )
        );
        console.log("Deleted core values shout outs");

        // Delete edu tok user interactions
        await tx.delete(eduTokUserInteractions).where(inArray(eduTokUserInteractions.userId, userIds));
        console.log("Deleted edu tok user interactions");

        // Delete video quiz completions
        await tx.delete(videoQuizCompletions).where(inArray(videoQuizCompletions.userId, userIds));
        console.log("Deleted video quiz completions");

        // Delete module ratings
        await tx.delete(moduleRatings).where(inArray(moduleRatings.userId, userIds));
        console.log("Deleted module ratings");

        // // Delete assessment results
        // await tx.delete(assessmentResults).where(inArray(assessmentResults.userId, userIds));
        console.log("Deleted assessment results");

        // Delete spin game rewards
        await tx.delete(spinGameRewards).where(inArray(spinGameRewards.userId, userIds));
        console.log("Deleted spin game rewards");

        // Delete streak rewards
        await tx.delete(streakRewards).where(inArray(streakRewards.userId, userIds));
        console.log("Deleted streak rewards");
      }

      // STEP 3: Delete users
      console.log("Step 3: Deleting users...");
      await tx.delete(users).where(eq(users.schoolId, schoolId));
      console.log(`Deleted ${schoolUsers.length} users`);

      // STEP 4: Delete the school
      console.log("Step 4: Deleting school...");
      await tx.delete(schools).where(eq(schools.id, schoolId));
      console.log("School deleted successfully");

      console.log("School deletion transaction completed successfully");

      // 10. Delete teacher self assessments for this school
      await tx.delete(teacherSelfAssessments).where(eq(teacherSelfAssessments.userId, userId));
    });

    return {
      success: true,
      message: "School and all related data deleted successfully",
      deletedSchool: school[0].name,
      deletedUsers: schoolUsers.length,
      // preservedCommunityModules: communityModulesList?.length || 0
    };

  } catch (error) {
    console.error("Error deleting school:", error);
    throw error;
  }
}

// Express endpoint function
export function createSchoolDeletionEndpoint(requireOwner: any) {
  return async (req: any, res: any) => {
    try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json({ message: "Valid school ID is required" });
      }

      const result = await deleteSchool(schoolId);

      res.json(result);

    } catch (error) {
      console.error("Error in school deletion endpoint:", error);
      res.status(500).json({ 
        message: "Failed to delete school",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
} 