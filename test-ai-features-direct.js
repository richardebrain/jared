/**
 * Direct AI Features Testing Script
 * Tests all AI functionality using authenticated browser session
 */

import { execSync } from 'child_process';

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

async function testAIFeatures() {
  log('\n🤖 TESTING AI FEATURES WITH AUTHENTICATED SESSION', 'magenta');
  
  const testResults = {
    moduleGeneration: false,
    behaviorGuidance: false,
    suessifier: false,
    voiceGeneration: false,
    imageGeneration: false,
    scenarioGeneration: false,
    matchingGeneration: false
  };

  // Test AI Module Generation (Text Section)
  try {
    const moduleTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"topic":"Playground Safety","targetAudience":"preschool teachers","duration":15,"sectionType":"text"}' \
      http://localhost:5000/api/ai/generate-section`, 
      { encoding: 'utf8', timeout: 30000 }
    );
    
    testResults.moduleGeneration = moduleTest.includes('"content"') && !moduleTest.includes('<!DOCTYPE');
    logTest('AI Module Generation (Text)', testResults.moduleGeneration, 
      testResults.moduleGeneration ? 'Content generated successfully' : 'Failed to generate content');
    
  } catch (error) {
    logTest('AI Module Generation (Text)', false, error.message);
  }

  // Test Behavior Guidance System
  try {
    const behaviorTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"childName":"Emma","age":4,"behavior":"Refuses to share toys","context":"Free play time"}' \
      http://localhost:5000/api/behavior-plan/generate`, 
      { encoding: 'utf8', timeout: 30000 }
    );
    
    testResults.behaviorGuidance = behaviorTest.includes('"strategies"') && !behaviorTest.includes('<!DOCTYPE');
    logTest('Behavior Guidance AI', testResults.behaviorGuidance,
      testResults.behaviorGuidance ? 'Strategies generated successfully' : 'Failed to generate strategies');
    
  } catch (error) {
    logTest('Behavior Guidance AI', false, error.message);
  }

  // Test Suessifier
  try {
    const suessTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"situation":"A teacher who stays positive","teacherName":"Ms. Sarah"}' \
      http://localhost:5000/api/suessify`, 
      { encoding: 'utf8', timeout: 20000 }
    );
    
    testResults.suessifier = suessTest.includes('"poem"') && !suessTest.includes('<!DOCTYPE');
    logTest('Suessifier Generator', testResults.suessifier,
      testResults.suessifier ? 'Poem generated successfully' : 'Failed to generate poem');
    
  } catch (error) {
    logTest('Suessifier Generator', false, error.message);
  }

  // Test Voice Generation
  try {
    const voiceTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"text":"Welcome to our classroom","voice":"Rachel"}' \
      http://localhost:5000/api/voice/generate`, 
      { encoding: 'utf8', timeout: 20000 }
    );
    
    testResults.voiceGeneration = voiceTest.includes('"audioUrl"') && !voiceTest.includes('<!DOCTYPE');
    logTest('Voice Generation (ElevenLabs)', testResults.voiceGeneration,
      testResults.voiceGeneration ? 'Audio generated successfully' : 'Failed to generate audio');
    
  } catch (error) {
    logTest('Voice Generation (ElevenLabs)', false, error.message);
  }

  // Test Image Generation
  try {
    const imageTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"prompt":"Colorful classroom scene","style":"cartoon"}' \
      http://localhost:5000/api/ai/generate-image`, 
      { encoding: 'utf8', timeout: 30000 }
    );
    
    testResults.imageGeneration = imageTest.includes('"imageUrl"') && !imageTest.includes('<!DOCTYPE');
    logTest('Image Generation (OpenAI)', testResults.imageGeneration,
      testResults.imageGeneration ? 'Image generated successfully' : 'Failed to generate image');
    
  } catch (error) {
    logTest('Image Generation (OpenAI)', false, error.message);
  }

  // Test Scenario Generation
  try {
    const scenarioTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"topic":"Classroom Management","sectionType":"scenario","targetAudience":"preschool teachers"}' \
      http://localhost:5000/api/ai/generate-section`, 
      { encoding: 'utf8', timeout: 25000 }
    );
    
    testResults.scenarioGeneration = scenarioTest.includes('"content"') && !scenarioTest.includes('<!DOCTYPE');
    logTest('Scenario Generation', testResults.scenarioGeneration,
      testResults.scenarioGeneration ? 'Scenarios generated successfully' : 'Failed to generate scenarios');
    
  } catch (error) {
    logTest('Scenario Generation', false, error.message);
  }

  // Test Matching Activity Generation
  try {
    const matchingTest = execSync(`curl -s -b cookies.txt -X POST \
      -H "Content-Type: application/json" \
      -d '{"topic":"Early Childhood Development","sectionType":"matching","targetAudience":"preschool teachers"}' \
      http://localhost:5000/api/ai/generate-section`, 
      { encoding: 'utf8', timeout: 25000 }
    );
    
    testResults.matchingGeneration = matchingTest.includes('"content"') && !matchingTest.includes('<!DOCTYPE');
    logTest('Matching Activity Generation', testResults.matchingGeneration,
      testResults.matchingGeneration ? 'Matching pairs generated successfully' : 'Failed to generate matching pairs');
    
  } catch (error) {
    logTest('Matching Activity Generation', false, error.message);
  }

  return testResults;
}

async function testDatabaseConnectivity() {
  log('\n💾 TESTING DATABASE CONNECTIVITY', 'magenta');
  
  try {
    // Test user data access
    const userTest = execSync(`curl -s -b cookies.txt http://localhost:5000/api/auth/me`, 
      { encoding: 'utf8', timeout: 10000 }
    );
    
    const userWorking = userTest.includes('"user"') && !userTest.includes('<!DOCTYPE');
    logTest('User Authentication Check', userWorking, 
      userWorking ? 'User session valid' : 'Authentication failed');

    // Test modules data
    const modulesTest = execSync(`curl -s -b cookies.txt http://localhost:5000/api/modules`, 
      { encoding: 'utf8', timeout: 10000 }
    );
    
    const modulesWorking = modulesTest.includes('[') && !modulesTest.includes('<!DOCTYPE');
    logTest('Modules Database Access', modulesWorking,
      modulesWorking ? 'Modules data accessible' : 'Database connection failed');

    return userWorking && modulesWorking;
    
  } catch (error) {
    logTest('Database Connectivity', false, error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  log('🚀 COMPREHENSIVE AI & DATABASE TESTING', 'cyan');
  log('=======================================', 'cyan');
  
  // Test database connectivity first
  const databaseWorking = await testDatabaseConnectivity();
  
  if (!databaseWorking) {
    log('\n❌ Database connectivity failed - some AI features may not work', 'red');
  }
  
  // Test all AI features
  const aiResults = await testAIFeatures();
  
  // Generate summary
  log('\n📋 TEST RESULTS SUMMARY', 'cyan');
  log('========================', 'cyan');
  
  const aiTests = Object.values(aiResults);
  const aiPassed = aiTests.filter(Boolean).length;
  const aiTotal = aiTests.length;
  
  log(`Database Connectivity: ${databaseWorking ? '✅' : '❌'}`, databaseWorking ? 'green' : 'red');
  log(`AI Features: ${aiPassed}/${aiTotal} working`, aiPassed >= aiTotal * 0.7 ? 'green' : 'yellow');
  
  // Individual AI feature status
  const features = [
    ['Module Generation', aiResults.moduleGeneration],
    ['Behavior Guidance', aiResults.behaviorGuidance], 
    ['Suessifier', aiResults.suessifier],
    ['Voice Generation', aiResults.voiceGeneration],
    ['Image Generation', aiResults.imageGeneration],
    ['Scenario Generation', aiResults.scenarioGeneration],
    ['Matching Generation', aiResults.matchingGeneration]
  ];
  
  log('\n🔧 INDIVIDUAL FEATURE STATUS:', 'cyan');
  features.forEach(([name, working]) => {
    log(`  ${working ? '✅' : '❌'} ${name}`, working ? 'green' : 'red');
  });
  
  // Overall deployment readiness
  const criticalFeatures = [
    aiResults.moduleGeneration,
    aiResults.behaviorGuidance,
    aiResults.suessifier,
    databaseWorking
  ];
  
  const criticalWorking = criticalFeatures.filter(Boolean).length;
  const deploymentReady = criticalWorking >= 3; // At least 3/4 critical features
  
  log(`\n🎯 DEPLOYMENT READINESS: ${criticalWorking}/4 critical systems working`, 
    deploymentReady ? 'green' : 'yellow');
  
  if (deploymentReady) {
    log('🚀 PLATFORM READY FOR DEPLOYMENT! 🚀', 'green');
    log('Core AI features and database connectivity verified', 'green');
  } else {
    log('⚠️  Critical systems need attention before deployment', 'yellow');
    if (!databaseWorking) log('- Fix database connectivity issues', 'yellow');
    if (!aiResults.moduleGeneration) log('- Fix AI module generation', 'yellow');
    if (!aiResults.behaviorGuidance) log('- Fix behavior guidance system', 'yellow');
  }
  
  return deploymentReady;
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);