/**
 * Comprehensive Pre-Deployment Testing Script
 * Tests all critical platform features and recent changes
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 14; // Laura's account for testing

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  failures: []
};

function logTest(testName, success, details = '') {
  if (success) {
    console.log(`✓ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`✗ ${testName} - ${details}`);
    testResults.failed++;
    testResults.failures.push({ test: testName, details });
  }
}

async function testAPI(endpoint, method = 'GET', data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000,
      headers: {
        'Cookie': 'connect.sid=n9silE830uWIrhz1EWZf39ztun0PZiou'
      }
    };
    
    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await axios(config);
    return {
      success: response.status === expectedStatus,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 'NO_RESPONSE'
    };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Pre-Deployment Testing\n');
  
  // 1. Authentication System Tests
  console.log('📋 Testing Authentication System...');
  
  const authTest = await testAPI('/api/auth/me');
  logTest('User Authentication', authTest.success && authTest.data?.id === TEST_USER_ID);
  
  // 2. Module System Tests
  console.log('\n📚 Testing Module System...');
  
  const modulesTest = await testAPI('/api/modules');
  logTest('Module Library Access', modulesTest.success && Array.isArray(modulesTest.data));
  
  const userModulesTest = await testAPI(`/api/modules/user/${TEST_USER_ID}`);
  logTest('User Modules Retrieval', userModulesTest.success && Array.isArray(userModulesTest.data));
  
  // 3. School Dashboard Tests
  console.log('\n🏫 Testing School Dashboard...');
  
  const schoolDataTest = await testAPI('/api/school/data');
  logTest('School Data API', schoolDataTest.success && schoolDataTest.data?.school);
  
  const teachersTest = await testAPI('/api/school/teachers');
  logTest('Teachers Data API', teachersTest.success && Array.isArray(teachersTest.data?.teachers));
  
  const progressTest = await testAPI('/api/school/progress');
  logTest('Progress Data API', progressTest.success && Array.isArray(progressTest.data?.progressData));
  
  const eosTest = await testAPI('/api/school/eos');
  logTest('EOS Data API', eosTest.success && Array.isArray(eosTest.data?.shoutOuts));
  
  // 4. Director Messages System
  console.log('\n📨 Testing Director Messages...');
  
  const messagesTest = await testAPI('/api/director-messages');
  logTest('Director Messages API', messagesTest.success && Array.isArray(messagesTest.data));
  
  // 5. Assessment System Tests
  console.log('\n📊 Testing Assessment System...');
  
  const assessmentTest = await testAPI('/api/assessment/session/start', 'POST', {});
  logTest('Assessment Session Start', assessmentTest.success || assessmentTest.status === 400);
  
  // 6. Points and Streak System
  console.log('\n🎯 Testing Points & Streak System...');
  
  const streakTest = await testAPI('/api/streak/status');
  logTest('Streak Status API', streakTest.success);
  
  // 7. Perfect Manager AI System
  console.log('\n🤖 Testing Perfect Manager AI...');
  
  const perfectManagerTest = await testAPI('/api/perfect-manager/scenarios');
  logTest('Perfect Manager Scenarios', perfectManagerTest.success && Array.isArray(perfectManagerTest.data));
  
  // 8. Video Library System
  console.log('\n🎬 Testing Video Library...');
  
  const videosTest = await testAPI('/api/videos');
  logTest('Video Library Access', videosTest.success);
  
  // 9. Community Modules
  console.log('\n🌟 Testing Community Modules...');
  
  const communityTest = await testAPI('/api/modules/community');
  logTest('Community Modules API', communityTest.success);
  
  // 10. Games/Activities System
  console.log('\n🎮 Testing Games System...');
  
  const gamesTest = await testAPI('/api/games/history');
  logTest('Games History API', gamesTest.success);
  
  // 11. ECE Hours Tracking
  console.log('\n⏰ Testing ECE Hours...');
  
  const eceHoursTest = await testAPI(`/api/ece-hours/${TEST_USER_ID}`);
  logTest('ECE Hours Tracking', eceHoursTest.success);
  
  // 12. User Management (Admin Functions)
  console.log('\n👥 Testing User Management...');
  
  const usersTest = await testAPI('/api/users');
  logTest('Users List API', usersTest.success || usersTest.status === 403); // May be admin-only
  
  // 13. Core Value System
  console.log('\n💝 Testing Core Value System...');
  
  const coreValuesTest = await testAPI('/api/core-values');
  logTest('Core Values API', coreValuesTest.success);
  
  // 14. Podcast Generation
  console.log('\n🎙️ Testing Podcast System...');
  
  const podcastTest = await testAPI('/api/podcast/scripts');
  logTest('Podcast Scripts API', podcastTest.success);
  
  // 15. Music Generation
  console.log('\n🎵 Testing Music Generation...');
  
  const musicTest = await testAPI('/api/music/status');
  logTest('Music Generation Status', musicTest.success);
  
  // Summary Report
  console.log('\n📊 Test Summary Report');
  console.log('========================');
  console.log(`✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failures.forEach(failure => {
      console.log(`  - ${failure.test}: ${failure.details}`);
    });
  }
  
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  console.log(`\nSuccess Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 DEPLOYMENT READY - High success rate achieved');
  } else if (successRate >= 75) {
    console.log('\n⚠️  DEPLOYMENT CAUTION - Some issues detected');
  } else {
    console.log('\n🚫 DEPLOYMENT NOT RECOMMENDED - Multiple critical issues');
  }
  
  return successRate >= 75; // Return true if deployment ready
}

// Run tests
runComprehensiveTests().catch(console.error);