// School Deletion API Fixes Applied ✅

## Issues Fixed:

1. ✅ Variable Name Typo Fixed
   - Changed `communityModuless` to `schoolCommunityModules`
   - Avoided naming conflict with database table `communityModules`

2. ✅ Property Access Error Fixed
   - Changed `communityModules.rows.some()` to `schoolCommunityModules.some()`
   - Database query results don't have a `.rows` property in Drizzle ORM

3. ✅ Variable Reference Consistency
   - Updated all references throughout the code
   - Fixed console.log statements
   - Fixed response JSON references

## Final Working Code Structure:

```javascript
// Correct variable declaration
const schoolCommunityModules = await db.select({
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

// Correct property access
const isCommunityModule = schoolCommunityModules.some(cm => cm.module_id === module.id);

// Correct response references
res.status(200).json({ 
  message: "School and all associated data deleted successfully",
  deletedSchool: school[0].name,
  deletedUsers: schoolUsers.length,
  preservedCommunityModules: schoolCommunityModules.length,
  preservedModules: schoolCommunityModules.map(cm => cm.title)
});
```

## Status: All Critical Issues Resolved ✅
The school deletion endpoint should now work correctly without runtime errors.
const userIds = schoolUsers.map(user => user.id);

// Delete all user progress in one operation instead of loops
if (userIds.length > 0) {
  await tx.delete(userProgress).where(inArray(userProgress.userId, userIds));
  await tx.delete(userAchievements).where(inArray(userAchievements.userId, userIds));
  await tx.delete(userItems).where(inArray(userItems.userId, userIds));
  // ... continue for other user-related tables
}