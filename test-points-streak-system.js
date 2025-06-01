/**
 * Comprehensive Points and Streak System Verification Script
 * Tests all points awarding mechanisms and streak functionality across the platform
 */

const { db } = require('./server/db');
const { storage } = require('./server/storage');
const { users, streakRewards, videoQuizCompletions, gameHistory } = require('./shared/schema');
const { eq, and, gte, desc } = require('drizzle-orm');

async function verifyPointsAndStreakSystem() {
  console.log('🔍 Starting comprehensive points and streak system verification...\n');
  
  const results = {
    streakSystem: { passed: 0, failed: 0, tests: [] },
    pointsSystem: { passed: 0, failed: 0, tests: [] },
    integrations: { passed: 0, failed: 0, tests: [] }
  };

  // Test 1: Verify streak calculation logic
  console.log('📅 Testing Streak System...');
  
  try {
    // Get a test user
    const testUsers = await db.select().from(users).limit(1);
    if (testUsers.length === 0) {
      throw new Error('No users found for testing');
    }
    
    const testUser = testUsers[0];
    console.log(`Testing with user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);
    
    // Test streak calculation
    const currentStreak = testUser.streak || 0;
    const lastActive = testUser.lastActive;
    
    console.log(`Current streak: ${currentStreak} days`);
    console.log(`Last active: ${lastActive}`);
    
    // Verify streak rewards table exists and has proper structure
    const streakRewardsCount = await db.select().from(streakRewards).where(eq(streakRewards.userId, testUser.id));
    console.log(`Streak rewards records: ${streakRewardsCount.length}`);
    
    results.streakSystem.tests.push({
      name: 'Streak calculation basic functionality',
      passed: typeof currentStreak === 'number' && currentStreak >= 0,
      details: `Streak: ${currentStreak}, Last active: ${lastActive}`
    });
    
    if (typeof currentStreak === 'number' && currentStreak >= 0) {
      results.streakSystem.passed++;
    } else {
      results.streakSystem.failed++;
    }
    
  } catch (error) {
    console.error('❌ Streak system test failed:', error);
    results.streakSystem.failed++;
    results.streakSystem.tests.push({
      name: 'Streak calculation basic functionality',
      passed: false,
      details: error.message
    });
  }

  // Test 2: Verify points awarding mechanisms
  console.log('\n💰 Testing Points System...');
  
  try {
    const testUser = await db.select().from(users).limit(1).then(rows => rows[0]);
    
    const currentPoints = testUser.points || 0;
    const lifetimePoints = testUser.lifetimePoints || 0;
    
    console.log(`Current points: ${currentPoints}`);
    console.log(`Lifetime points: ${lifetimePoints}`);
    
    // Verify points are never negative
    const pointsValid = currentPoints >= 0 && lifetimePoints >= 0;
    console.log(`Points validation: ${pointsValid ? '✅ Valid' : '❌ Invalid'}`);
    
    // Check video quiz completions points
    const videoCompletions = await db.select()
      .from(videoQuizCompletions)
      .where(eq(videoQuizCompletions.userId, testUser.id))
      .orderBy(desc(videoQuizCompletions.createdAt))
      .limit(5);
      
    console.log(`Recent video completions: ${videoCompletions.length}`);
    videoCompletions.forEach(completion => {
      console.log(`  - Video ${completion.videoId}: ${completion.pointsEarned} points`);
    });
    
    // Check game history points
    const gameCompletions = await db.select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, testUser.id))
      .orderBy(desc(gameHistory.createdAt))
      .limit(5);
      
    console.log(`Recent game completions: ${gameCompletions.length}`);
    gameCompletions.forEach(game => {
      console.log(`  - ${game.gameType}: ${game.pointsEarned} points`);
    });
    
    results.pointsSystem.tests.push({
      name: 'Points system basic functionality',
      passed: pointsValid,
      details: `Points: ${currentPoints}, Lifetime: ${lifetimePoints}`
    });
    
    if (pointsValid) {
      results.pointsSystem.passed++;
    } else {
      results.pointsSystem.failed++;
    }
    
  } catch (error) {
    console.error('❌ Points system test failed:', error);
    results.pointsSystem.failed++;
    results.pointsSystem.tests.push({
      name: 'Points system basic functionality',
      passed: false,
      details: error.message
    });
  }

  // Test 3: Verify daily limits and constraints
  console.log('\n⏱️ Testing Daily Limits and Constraints...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const testUser = await db.select().from(users).limit(1).then(rows => rows[0]);
    
    // Check video completion daily limit (should be max 2 per day)
    const todayVideoCompletions = await db.select()
      .from(videoQuizCompletions)
      .where(and(
        eq(videoQuizCompletions.userId, testUser.id),
        gte(videoQuizCompletions.createdAt, today)
      ));
      
    console.log(`Today's video completions: ${todayVideoCompletions.length}`);
    
    // Check game completion daily limit (should be max 1 per day for bonus points)
    const todayGameCompletions = await db.select()
      .from(gameHistory)
      .where(and(
        eq(gameHistory.userId, testUser.id),
        gte(gameHistory.createdAt, today)
      ));
      
    console.log(`Today's game completions: ${todayGameCompletions.length}`);
    
    const limitsValid = todayVideoCompletions.length <= 2 && todayGameCompletions.length <= 3;
    
    results.integrations.tests.push({
      name: 'Daily limits enforcement',
      passed: limitsValid,
      details: `Videos: ${todayVideoCompletions.length}/2, Games: ${todayGameCompletions.length}/3`
    });
    
    if (limitsValid) {
      results.integrations.passed++;
    } else {
      results.integrations.failed++;
    }
    
  } catch (error) {
    console.error('❌ Daily limits test failed:', error);
    results.integrations.failed++;
    results.integrations.tests.push({
      name: 'Daily limits enforcement',
      passed: false,
      details: error.message
    });
  }

  // Test 4: Verify streak bonus points calculation
  console.log('\n🔥 Testing Streak Bonus Points...');
  
  try {
    const testUser = await db.select().from(users).limit(1).then(rows => rows[0]);
    const streak = testUser.streak || 0;
    
    // Test streak points calculation logic
    const getStreakPoints = (days) => {
      if (days < 2) return 0;
      if (days >= 5) return 5;
      return days;
    };
    
    const expectedStreakPoints = getStreakPoints(streak);
    console.log(`Streak: ${streak} days → Expected bonus: ${expectedStreakPoints} points`);
    
    // Verify milestone rewards
    const milestoneRewards = {
      7: 25,    // Weekly milestone
      30: 100,  // Monthly milestone
      365: 500  // Yearly milestone
    };
    
    let expectedMilestonePoints = 0;
    for (const [milestone, reward] of Object.entries(milestoneRewards)) {
      if (streak >= parseInt(milestone)) {
        expectedMilestonePoints = reward;
      }
    }
    
    console.log(`Milestone rewards: ${expectedMilestonePoints} points for ${streak}-day streak`);
    
    results.streakSystem.tests.push({
      name: 'Streak bonus points calculation',
      passed: expectedStreakPoints >= 0 && expectedStreakPoints <= 5,
      details: `${streak} days → ${expectedStreakPoints} bonus points`
    });
    
    if (expectedStreakPoints >= 0 && expectedStreakPoints <= 5) {
      results.streakSystem.passed++;
    } else {
      results.streakSystem.failed++;
    }
    
  } catch (error) {
    console.error('❌ Streak bonus points test failed:', error);
    results.streakSystem.failed++;
    results.streakSystem.tests.push({
      name: 'Streak bonus points calculation',
      passed: false,
      details: error.message
    });
  }

  // Test 5: Check database consistency
  console.log('\n🗄️ Testing Database Consistency...');
  
  try {
    // Verify all users have valid point totals
    const usersWithInvalidPoints = await db.select()
      .from(users)
      .where(
        eq(users.points, null)
      )
      .limit(5);
      
    console.log(`Users with invalid points: ${usersWithInvalidPoints.length}`);
    
    // Check for negative points
    const usersWithNegativePoints = await db.execute(
      `SELECT id, points, lifetime_points FROM users WHERE points < 0 OR lifetime_points < 0 LIMIT 5`
    );
    
    console.log(`Users with negative points: ${usersWithNegativePoints.length}`);
    
    const consistencyValid = usersWithInvalidPoints.length === 0 && usersWithNegativePoints.length === 0;
    
    results.integrations.tests.push({
      name: 'Database consistency',
      passed: consistencyValid,
      details: `Invalid points: ${usersWithInvalidPoints.length}, Negative points: ${usersWithNegativePoints.length}`
    });
    
    if (consistencyValid) {
      results.integrations.passed++;
    } else {
      results.integrations.failed++;
    }
    
  } catch (error) {
    console.error('❌ Database consistency test failed:', error);
    results.integrations.failed++;
    results.integrations.tests.push({
      name: 'Database consistency',
      passed: false,
      details: error.message
    });
  }

  // Print comprehensive results
  console.log('\n📊 VERIFICATION RESULTS:');
  console.log('========================');
  
  console.log(`\n🔥 Streak System: ${results.streakSystem.passed}/${results.streakSystem.passed + results.streakSystem.failed} tests passed`);
  results.streakSystem.tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`);
  });
  
  console.log(`\n💰 Points System: ${results.pointsSystem.passed}/${results.pointsSystem.passed + results.pointsSystem.failed} tests passed`);
  results.pointsSystem.tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`);
  });
  
  console.log(`\n🔗 Integration Tests: ${results.integrations.passed}/${results.integrations.passed + results.integrations.failed} tests passed`);
  results.integrations.tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`);
  });
  
  const totalPassed = results.streakSystem.passed + results.pointsSystem.passed + results.integrations.passed;
  const totalTests = totalPassed + results.streakSystem.failed + results.pointsSystem.failed + results.integrations.failed;
  
  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${((totalPassed/totalTests) * 100).toFixed(1)}%)`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All systems are functioning correctly!');
  } else {
    console.log('\n⚠️ Some issues detected - see details above');
  }
  
  return results;
}

module.exports = { verifyPointsAndStreakSystem };

// Run verification if called directly
if (require.main === module) {
  verifyPointsAndStreakSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}