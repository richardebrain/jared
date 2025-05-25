/**
 * Test script for the 5-day streak Silver Box reward feature
 * This script simulates updating a user's streak to 5 days and tests
 * the claim functionality.
 */

import pkg from 'pg';
const { Pool } = pkg;

// Create a database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// User ID to test with (default: 4 for jlcookie20)
const TEST_USER_ID = 4;

async function setUserStreak(userId, streakDays) {
  try {
    // Update the user's streak to the specified number of days
    const result = await pool.query(
      'UPDATE users SET streak = $1 WHERE id = $2 RETURNING id, username, streak',
      [streakDays, userId]
    );
    
    if (result.rows.length === 0) {
      console.error(`❌ User with ID ${userId} not found`);
      return null;
    }
    
    console.log(`✅ Updated user ${result.rows[0].username} (ID: ${result.rows[0].id}) streak to ${result.rows[0].streak} days`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error updating user streak:', error.message);
    return null;
  }
}

async function clearStreakRewards(userId) {
  try {
    // Delete any streak rewards for the user to allow testing again
    const result = await pool.query(
      'DELETE FROM streak_rewards WHERE user_id = $1 RETURNING id',
      [userId]
    );
    
    console.log(`✅ Cleared ${result.rowCount} previous streak rewards for user ID ${userId}`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Error clearing streak rewards:', error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🔍 Testing 5-day streak Silver Box reward feature');
    
    // Clear any previous streak rewards for clean testing
    await clearStreakRewards(TEST_USER_ID);
    
    // Set the user's streak to 5 days to make them eligible for the silver box reward
    const updatedUser = await setUserStreak(TEST_USER_ID, 5);
    
    if (updatedUser) {
      console.log('\n✅ Test setup complete');
      console.log('--------------------------------------');
      console.log(`User ${updatedUser.username} now has a ${updatedUser.streak}-day streak`);
      console.log('They should be eligible for a Silver Box reward');
      console.log('--------------------------------------');
      console.log('\n🔍 Next steps:');
      console.log('1. Log into the application with this user account');
      console.log('2. Navigate to the Mystery Boxes page');
      console.log('3. Verify that the 5-day streak Silver Box reward is available');
      console.log('4. Click "Claim Free Silver Box" to test the claim functionality');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Run the test
main();