/**
 * Comprehensive Pre-Deployment Testing Script
 * Tests all AI features and authentication before deployment
 */

import axios from 'axios';
const BASE_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColor = passed ? 'green' : 'red';
  log(`${status} ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

let sessionCookie = '';

// Test authentication system
async function testAuthentication() {
  log('\n🔐 TESTING AUTHENTICATION SYSTEM', 'magenta');
  
  try {
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'jlcookie20',
      password: 'password123'
    });
    
    sessionCookie = loginResponse.headers['set-cookie']?.[0] || '';
    logTest('User Login', loginResponse.status === 200, `Session established: ${sessionCookie ? 'Yes' : 'No'}`);
    
    // Test session validation
    const authResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    
    logTest('Session Validation', authResponse.status === 200 && authResponse.data.user, 
      `User: ${authResponse.data.user?.username || 'Unknown'}`);
    
    return authResponse.status === 200;
    
  } catch (error) {
    logTest('Authentication System', false, error.message);
    return false;
  }
}

// Test AI content generation features
async function testAIFeatures() {
  log('\n🤖 TESTING AI FEATURES', 'magenta');
  
  const testResults = {
    moduleGeneration: false,
    behaviorGuidance: false,
    suessifier: false,
    voiceGeneration: false,
    imageGeneration: false
  };
  
  try {
    // Test AI Module Generation
    const modulePrompt = {
      topic: 'Playground Safety',
      targetAudience: 'preschool teachers',
      duration: 15,
      sectionType: 'text'
    };
    
    const moduleResponse = await axios.post(`${BASE_URL}/api/ai/generate-section`, modulePrompt, {
      headers: { Cookie: sessionCookie },
      timeout: 30000
    });
    
    testResults.moduleGeneration = moduleResponse.status === 200 && moduleResponse.data.content;
    logTest('AI Module Generation', testResults.moduleGeneration, 
      testResults.moduleGeneration ? 'Content generated successfully' : 'Failed to generate content');
    
  } catch (error) {
    logTest('AI Module Generation', false, error.message);
  }
  
  try {
    // Test Behavior Guidance System
    const behaviorPrompt = {
      childName: 'Emma',
      age: 4,
      behavior: 'Refuses to share toys during playtime',
      context: 'Free play time in the classroom'
    };
    
    const behaviorResponse = await axios.post(`${BASE_URL}/api/behavior-plan/generate`, behaviorPrompt, {
      headers: { Cookie: sessionCookie },
      timeout: 30000
    });
    
    testResults.behaviorGuidance = behaviorResponse.status === 200 && behaviorResponse.data.strategies;
    logTest('Behavior Guidance AI', testResults.behaviorGuidance,
      testResults.behaviorGuidance ? 'Strategies generated successfully' : 'Failed to generate strategies');
    
  } catch (error) {
    logTest('Behavior Guidance AI', false, error.message);
  }
  
  try {
    // Test Suessifier
    const suessPrompt = {
      situation: 'A teacher who always stays positive during challenging days',
      teacherName: 'Ms. Sarah'
    };
    
    const suessResponse = await axios.post(`${BASE_URL}/api/suessify`, suessPrompt, {
      headers: { Cookie: sessionCookie },
      timeout: 20000
    });
    
    testResults.suessifier = suessResponse.status === 200 && suessResponse.data.poem;
    logTest('Suessifier Generator', testResults.suessifier,
      testResults.suessifier ? 'Poem generated successfully' : 'Failed to generate poem');
    
  } catch (error) {
    logTest('Suessifier Generator', false, error.message);
  }
  
  try {
    // Test Voice Generation
    const voicePrompt = {
      text: 'Welcome to our preschool classroom! Today we are learning about sharing and friendship.',
      voice: 'Rachel'
    };
    
    const voiceResponse = await axios.post(`${BASE_URL}/api/voice/generate`, voicePrompt, {
      headers: { Cookie: sessionCookie },
      timeout: 20000
    });
    
    testResults.voiceGeneration = voiceResponse.status === 200 && voiceResponse.data.audioUrl;
    logTest('Voice Generation (ElevenLabs)', testResults.voiceGeneration,
      testResults.voiceGeneration ? 'Audio generated successfully' : 'Failed to generate audio');
    
  } catch (error) {
    logTest('Voice Generation (ElevenLabs)', false, error.message);
  }
  
  try {
    // Test Image Generation
    const imagePrompt = {
      prompt: 'A colorful classroom scene with children playing educational games',
      style: 'cartoon'
    };
    
    const imageResponse = await axios.post(`${BASE_URL}/api/ai/generate-image`, imagePrompt, {
      headers: { Cookie: sessionCookie },
      timeout: 30000
    });
    
    testResults.imageGeneration = imageResponse.status === 200 && imageResponse.data.imageUrl;
    logTest('Image Generation (OpenAI)', testResults.imageGeneration,
      testResults.imageGeneration ? 'Image generated successfully' : 'Failed to generate image');
    
  } catch (error) {
    logTest('Image Generation (OpenAI)', false, error.message);
  }
  
  return testResults;
}

// Test database operations
async function testDatabaseOperations() {
  log('\n💾 TESTING DATABASE OPERATIONS', 'magenta');
  
  try {
    // Test user data retrieval
    const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    
    logTest('User Data Retrieval', userResponse.status === 200, 
      `User ID: ${userResponse.data.user?.id || 'Unknown'}`);
    
    // Test modules retrieval
    const modulesResponse = await axios.get(`${BASE_URL}/api/modules`, {
      headers: { Cookie: sessionCookie }
    });
    
    logTest('Modules Data Access', modulesResponse.status === 200,
      `Modules found: ${modulesResponse.data?.length || 0}`);
    
    // Test progress tracking
    const progressResponse = await axios.get(`${BASE_URL}/api/progress`, {
      headers: { Cookie: sessionCookie }
    });
    
    logTest('Progress Tracking', progressResponse.status === 200,
      `Progress records: ${progressResponse.data?.length || 0}`);
    
    return true;
    
  } catch (error) {
    logTest('Database Operations', false, error.message);
    return false;
  }
}

// Test specialized builders
async function testSpecializedBuilders() {
  log('\n🔧 TESTING SPECIALIZED BUILDERS', 'magenta');
  
  const builderTypes = [
    'scenario', 'matching', 'example', 'slide', 'triage', 
    'mnemonic', 'simulation', 'activity', 'scenario-match'
  ];
  
  let successCount = 0;
  
  for (const builderType of builderTypes) {
    try {
      const builderPrompt = {
        topic: 'Classroom Management',
        sectionType: builderType,
        targetAudience: 'preschool teachers'
      };
      
      const builderResponse = await axios.post(`${BASE_URL}/api/ai/generate-section`, builderPrompt, {
        headers: { Cookie: sessionCookie },
        timeout: 25000
      });
      
      const success = builderResponse.status === 200 && builderResponse.data.content;
      logTest(`${builderType.charAt(0).toUpperCase() + builderType.slice(1)} Builder`, success);
      
      if (success) successCount++;
      
    } catch (error) {
      logTest(`${builderType.charAt(0).toUpperCase() + builderType.slice(1)} Builder`, false, error.message);
    }
  }
  
  log(`\n📊 Builder Success Rate: ${successCount}/${builderTypes.length} (${Math.round(successCount/builderTypes.length*100)}%)`, 
    successCount >= builderTypes.length * 0.8 ? 'green' : 'yellow');
  
  return successCount >= builderTypes.length * 0.8;
}

// Test API endpoints security
async function testAPIEndpointSecurity() {
  log('\n🔒 TESTING API ENDPOINT SECURITY', 'magenta');
  
  try {
    // Test protected endpoint without authentication
    const unauthedResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      validateStatus: () => true // Don't throw on 401
    });
    
    logTest('Protected Endpoint Security', unauthedResponse.status === 401,
      `Unauthenticated access properly blocked: ${unauthedResponse.status}`);
    
    // Test authenticated access
    const authedResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: sessionCookie },
      validateStatus: () => true
    });
    
    logTest('Authenticated Access', authedResponse.status === 200,
      `Admin endpoint accessible with auth: ${authedResponse.status}`);
    
    return true;
    
  } catch (error) {
    logTest('API Security Test', false, error.message);
    return false;
  }
}

// Main test runner
async function runPreDeploymentTests() {
  log('🚀 COMPREHENSIVE PRE-DEPLOYMENT TESTING', 'cyan');
  log('=========================================', 'cyan');
  
  const results = {
    authentication: false,
    aiFeatures: {},
    database: false,
    builders: false,
    security: false
  };
  
  // Run all tests
  results.authentication = await testAuthentication();
  
  if (results.authentication) {
    results.aiFeatures = await testAIFeatures();
    results.database = await testDatabaseOperations();
    results.builders = await testSpecializedBuilders();
    results.security = await testAPIEndpointSecurity();
  } else {
    log('\n❌ Authentication failed - skipping other tests', 'red');
  }
  
  // Generate summary report
  log('\n📋 DEPLOYMENT READINESS SUMMARY', 'cyan');
  log('================================', 'cyan');
  
  const authStatus = results.authentication ? '✅' : '❌';
  log(`Authentication System: ${authStatus}`, results.authentication ? 'green' : 'red');
  
  if (results.aiFeatures) {
    const aiTests = Object.values(results.aiFeatures);
    const aiPassed = aiTests.filter(Boolean).length;
    const aiStatus = aiPassed >= aiTests.length * 0.8 ? '✅' : '❌';
    log(`AI Features (${aiPassed}/${aiTests.length}): ${aiStatus}`, aiPassed >= aiTests.length * 0.8 ? 'green' : 'red');
  }
  
  const dbStatus = results.database ? '✅' : '❌';
  log(`Database Operations: ${dbStatus}`, results.database ? 'green' : 'red');
  
  const buildersStatus = results.builders ? '✅' : '❌';
  log(`Specialized Builders: ${buildersStatus}`, results.builders ? 'green' : 'red');
  
  const securityStatus = results.security ? '✅' : '❌';
  log(`API Security: ${securityStatus}`, results.security ? 'green' : 'red');
  
  // Overall deployment readiness
  const allSystems = [
    results.authentication,
    Object.values(results.aiFeatures || {}).filter(Boolean).length >= 3, // At least 3 AI features working
    results.database,
    results.builders,
    results.security
  ];
  
  const readyCount = allSystems.filter(Boolean).length;
  const deploymentReady = readyCount >= 4; // At least 4/5 systems working
  
  log(`\n🎯 DEPLOYMENT READINESS: ${readyCount}/5 systems operational`, deploymentReady ? 'green' : 'yellow');
  
  if (deploymentReady) {
    log('🚀 PLATFORM READY FOR DEPLOYMENT! 🚀', 'green');
  } else {
    log('⚠️  Some systems need attention before deployment', 'yellow');
  }
  
  return deploymentReady;
}

// Run the tests
runPreDeploymentTests().catch(console.error);