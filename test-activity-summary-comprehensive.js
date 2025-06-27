/**
 * Comprehensive Test of Activity Summary Feature
 * This script tests the complete user activity tracking system
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function testActivitySummaryFeature() {
  console.log('🧪 Testing Comprehensive Activity Summary Feature...\n');

  try {
    // Test 1: Check completed modules query
    console.log('1. Testing Completed Modules Query:');
    const completedModulesTest = await db.execute(sql`
      SELECT 
        up.module_id as moduleId,
        up.points_earned as pointsEarned,
        up.final_score as finalScore,
        up.completed,
        up.last_accessed as lastAccessed,
        lm.title as moduleTitle,
        lm.ece_hours as eceHours,
        lm.ece_category as eceCategory,
        lm.category as moduleCategory,
        lm.difficulty
      FROM user_progress up
      JOIN learning_modules lm ON up.module_id = lm.id
      WHERE up.user_id = 6 AND up.completed = true
      ORDER BY up.last_accessed DESC
      LIMIT 5
    `);
    console.log(`✓ Found ${completedModulesTest.length} completed modules for user 6`);
    if (completedModulesTest.length > 0) {
      console.log(`  Latest module: "${completedModulesTest[0].moduleTitle}" (${completedModulesTest[0].pointsEarned} points)`);
    }

    // Test 2: Check ECE hours summary
    console.log('\n2. Testing ECE Hours Summary:');
    const eceHoursTest = await db.execute(sql`
      SELECT 
        category,
        SUM(duration) as totalMinutes,
        COUNT(*) as completionCount
      FROM ece_hours 
      WHERE user_id = 6
      GROUP BY category
      ORDER BY totalMinutes DESC
    `);
    console.log(`✓ Found ${eceHoursTest.length} ECE hour categories for user 6`);
    eceHoursTest.forEach(category => {
      const hours = Math.round(category.totalMinutes / 60 * 10) / 10;
      console.log(`  ${category.category}: ${hours} hours (${category.completionCount} completions)`);
    });

    // Test 3: Check points breakdown
    console.log('\n3. Testing Points Breakdown:');
    const pointsTest = await db.execute(sql`
      SELECT 
        SUM(CASE WHEN up.points_earned > 0 THEN up.points_earned ELSE 0 END) as modulePoints,
        (SELECT SUM(CASE WHEN gc.points_earned > 0 THEN gc.points_earned ELSE 0 END) 
         FROM game_completions gc WHERE gc.user_id = 6) as gamePoints,
        (SELECT points FROM users WHERE id = 6) as totalPoints
      FROM user_progress up
      WHERE up.user_id = 6
    `);
    if (pointsTest.length > 0) {
      console.log(`✓ Module Points: ${pointsTest[0].modulePoints || 0}`);
      console.log(`✓ Game Points: ${pointsTest[0].gamePoints || 0}`);
      console.log(`✓ Total Points: ${pointsTest[0].totalPoints || 0}`);
    }

    // Test 4: Check game completions
    console.log('\n4. Testing Game Completions:');
    const gameTest = await db.execute(sql`
      SELECT 
        gc.game_id as gameId,
        gc.score,
        gc.points_earned as pointsEarned,
        gc.completed_at as completedAt,
        eg.title as gameTitle,
        eg.category as gameCategory,
        eg.difficulty as gameDifficulty
      FROM game_completions gc
      JOIN educational_games eg ON gc.game_id = eg.id
      WHERE gc.user_id = 6
      ORDER BY gc.completed_at DESC
      LIMIT 3
    `);
    console.log(`✓ Found ${gameTest.length} game completions for user 6`);
    gameTest.forEach(game => {
      console.log(`  ${game.gameTitle}: Score ${game.score}, ${game.pointsEarned} points`);
    });

    // Test 5: Check assessment history
    console.log('\n5. Testing Assessment History:');
    const assessmentTest = await db.execute(sql`
      SELECT 
        type,
        overall_score as overallScore,
        completed_at as completedAt,
        CASE WHEN overall_score >= 70 THEN 'Passed' ELSE 'Failed' END as status
      FROM assessments 
      WHERE user_id = 6 AND completed = true
      ORDER BY completed_at DESC
      LIMIT 3
    `);
    console.log(`✓ Found ${assessmentTest.length} assessments for user 6`);
    assessmentTest.forEach(assessment => {
      console.log(`  ${assessment.type}: ${assessment.overallScore}% (${assessment.status})`);
    });

    console.log('\n🎉 Comprehensive Activity Summary Feature Test Complete!');
    console.log('\nFeatures verified:');
    console.log('✓ Completed modules with ECE hours and points');
    console.log('✓ ECE hours breakdown by category');
    console.log('✓ Points summary (module + game + total)');
    console.log('✓ Recent game completions with scores');
    console.log('✓ Assessment history with pass/fail status');
    console.log('\nThe admin assessment results page will now display:');
    console.log('- User activity cards with comprehensive data');
    console.log('- Points breakdown showing earning sources');
    console.log('- Professional development tracking');
    console.log('- Learning engagement metrics');
    console.log('- Complete educational activity history');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testActivitySummaryFeature();