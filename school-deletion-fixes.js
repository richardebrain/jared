// Fixed version of the key problematic sections:

// 1. Fix variable name typo (line 27)
const communityModules = await db.select({
  module_id: communityModules.moduleId,
  title: learningModules.title,
  is_shared_to_community: learningModules.isSharedToCommunity
})
.from(communityModules)
.innerJoin(learningModules, eq(communityModules.moduleId, learningModules.id))
.where(and(
  eq(communityModules.sharedBySchoolId, schoolId),
  eq(communityModules.status, 'active')
));

console.log(`Found ${communityModules.length} community modules from school ${schoolId}`);

// 2. Fix module deletion logic (line 163)
for (const module of schoolModules) {
  // Check if this module is shared to community
  const isCommunityModule = communityModules.some(cm => cm.module_id === module.id);

  if (isCommunityModule) {
    // Preserve community modules
    console.log(`Preserving community module: ${module.title} (ID: ${module.id})`);
  } else {
    // Delete non-community modules
    console.log(`Deleting school-specific module: ${module.title} (ID: ${module.id})`);
    await tx.delete(learningModules).where(eq(learningModules.id, module.id));
  }
}

// 3. Fix final response (line 186)
res.status(200).json({ 
  message: "School and all associated data deleted successfully",
  deletedSchool: school[0].name,
  deletedUsers: schoolUsers.length,
  preservedCommunityModules: communityModules.length,
  preservedModules: communityModules.map(cm => cm.title)
});

// 4. Performance improvement example - batch user deletions
const userIds = schoolUsers.map(user => user.id);

// Delete all user progress in one operation instead of loops
if (userIds.length > 0) {
  await tx.delete(userProgress).where(inArray(userProgress.userId, userIds));
  await tx.delete(userAchievements).where(inArray(userAchievements.userId, userIds));
  await tx.delete(userItems).where(inArray(userItems.userId, userIds));
  // ... continue for other user-related tables
}