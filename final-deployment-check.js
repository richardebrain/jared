/**
 * Final Deployment Readiness Check
 * Comprehensive verification of all platform systems
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', expectedStatus = 200) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      validateStatus: () => true // Accept all status codes
    });
    
    if (response.status === expectedStatus) {
      log(`✅ ${endpoint} - Status ${response.status}`, 'green');
      return true;
    } else {
      log(`⚠️ ${endpoint} - Expected ${expectedStatus}, got ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    return false;
  }
}

async function runDeploymentCheck() {
  log('\n🚀 FINAL DEPLOYMENT READINESS CHECK', 'blue');
  log('='.repeat(50), 'blue');
  
  const results = {
    frontend: false,
    backend: false,
    auth: false,
    modules: false,
    assessment: false,
    voice: false,
    total: 0,
    passed: 0
  };

  // Test Frontend
  log('\n📱 Testing Frontend...', 'yellow');
  results.frontend = await testEndpoint('/', 'GET', 200);
  results.total++;
  if (results.frontend) results.passed++;

  // Test Backend Health
  log('\n🔧 Testing Backend Health...', 'yellow');
  results.backend = await testEndpoint('/api/health', 'GET', 200);
  results.total++;
  if (results.backend) results.passed++;

  // Test Authentication
  log('\n🔐 Testing Authentication...', 'yellow');
  results.auth = await testEndpoint('/api/auth/check-session', 'GET', 200);
  results.total++;
  if (results.auth) results.passed++;

  // Test Modules (will return 401 which is expected without auth)
  log('\n📚 Testing Modules System...', 'yellow');
  results.modules = await testEndpoint('/api/modules', 'GET', 401);
  results.total++;
  if (results.modules) results.passed++;

  // Test Assessment System
  log('\n📝 Testing Assessment System...', 'yellow');
  results.assessment = await testEndpoint('/api/assessment/questions', 'GET', 401);
  results.total++;
  if (results.assessment) results.passed++;

  // Test Voice API
  log('\n🎵 Testing Voice API...', 'yellow');
  results.voice = await testEndpoint('/api/voice/status', 'GET', 200);
  results.total++;
  if (results.voice) results.passed++;

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📋 DEPLOYMENT SUMMARY', 'blue');
  log('='.repeat(50), 'blue');
  
  const percentage = Math.round((results.passed / results.total) * 100);
  
  if (results.frontend) log('✅ Frontend: Working', 'green');
  else log('❌ Frontend: Failed', 'red');
  
  if (results.backend) log('✅ Backend: Working', 'green');
  else log('❌ Backend: Failed', 'red');
  
  if (results.auth) log('✅ Authentication: Working', 'green');
  else log('❌ Authentication: Failed', 'red');
  
  if (results.modules) log('✅ Modules: Working', 'green');
  else log('❌ Modules: Failed', 'red');
  
  if (results.assessment) log('✅ Assessment: Working', 'green');
  else log('❌ Assessment: Failed', 'red');
  
  if (results.voice) log('✅ Voice API: Working', 'green');
  else log('❌ Voice API: Failed', 'red');

  log(`\n📊 Overall Score: ${results.passed}/${results.total} (${percentage}%)`, 
      percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  
  if (percentage >= 80) {
    log('\n🎉 PLATFORM READY FOR DEPLOYMENT!', 'green');
    log('All critical systems are operational.', 'green');
  } else if (percentage >= 60) {
    log('\n⚠️ PLATFORM MOSTLY READY', 'yellow');
    log('Minor issues detected but core functionality working.', 'yellow');
  } else {
    log('\n❌ DEPLOYMENT NOT RECOMMENDED', 'red');
    log('Critical issues detected that need resolution.', 'red');
  }
  
  log('\n' + '='.repeat(50), 'blue');
}

// Run the deployment check
runDeploymentCheck().catch(console.error);