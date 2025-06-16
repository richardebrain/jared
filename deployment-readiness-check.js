/**
 * Comprehensive Deployment Readiness Check
 * Tests all critical platform features before deployment
 */

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';

async function testAPIEndpoint(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Test/1.0'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    // Test database with a simple query
    const result = await testAPIEndpoint('/api/modules');
    if (result.statusCode === 200 || result.statusCode === 304) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed:', result.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function checkAIServices() {
  console.log('\n🤖 Testing AI Services...');
  
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ OPENAI_API_KEY not configured');
    return false;
  }
  
  console.log('✅ OpenAI API key configured');
  return true;
}

async function checkModuleSystem() {
  console.log('\n📚 Testing Module System...');
  try {
    // Test module endpoints
    const modulesResult = await testAPIEndpoint('/api/modules');
    const communityResult = await testAPIEndpoint('/api/community-modules');
    
    if (modulesResult.statusCode === 200 || modulesResult.statusCode === 304) {
      console.log('✅ Module listing works');
    } else {
      console.log('❌ Module listing failed');
      return false;
    }
    
    if (communityResult.statusCode === 200 || communityResult.statusCode === 304) {
      console.log('✅ Community modules work');
    } else {
      console.log('❌ Community modules failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Module system error:', error.message);
    return false;
  }
}

async function checkAssessmentSystem() {
  console.log('\n📝 Testing Assessment System...');
  try {
    const result = await testAPIEndpoint('/api/assessment-results');
    if (result.statusCode === 200 || result.statusCode === 304) {
      console.log('✅ Assessment system works');
      return true;
    } else {
      console.log('❌ Assessment system failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Assessment system error:', error.message);
    return false;
  }
}

async function checkAuthSystem() {
  console.log('\n🔐 Testing Authentication System...');
  try {
    const result = await testAPIEndpoint('/api/auth/clear-session');
    if (result.statusCode === 200 || result.statusCode === 304) {
      console.log('✅ Authentication system works');
      return true;
    } else {
      console.log('❌ Authentication system failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication system error:', error.message);
    return false;
  }
}

async function checkBuildProcess() {
  console.log('\n🔨 Testing Build Process...');
  try {
    // Check if build artifacts exist
    
    if (fs.existsSync('dist/public/index.html')) {
      console.log('✅ Frontend build exists');
    } else {
      console.log('⚠️ Frontend build not found, attempting build...');
      try {
        execSync('npm run build', { stdio: 'inherit', timeout: 120000 });
        if (fs.existsSync('dist/public/index.html')) {
          console.log('✅ Frontend build successful');
        } else {
          console.log('❌ Frontend build failed');
          return false;
        }
      } catch (buildError) {
        console.log('❌ Build process failed:', buildError.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Build process error:', error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🌍 Checking Environment Variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY'
  ];
  
  const optionalVars = [
    'SENDGRID_API_KEY',
    'ELEVENLABS_API_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  let allRequired = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.log(`❌ ${varName} missing (required)`);
      allRequired = false;
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.log(`⚠️ ${varName} missing (optional)`);
    }
  }
  
  return allRequired;
}

async function runDeploymentCheck() {
  console.log('🚀 Starting Comprehensive Deployment Readiness Check');
  console.log('=' .repeat(60));
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'AI Services', fn: checkAIServices },
    { name: 'Authentication System', fn: checkAuthSystem },
    { name: 'Module System', fn: checkModuleSystem },
    { name: 'Assessment System', fn: checkAssessmentSystem },
    { name: 'Build Process', fn: checkBuildProcess }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (error) {
      console.log(`❌ ${check.name} failed with error:`, error.message);
      results.push({ name: check.name, passed: false });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT READINESS SUMMARY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT! 🎉');
  } else {
    console.log('⚠️ SOME CHECKS FAILED - REVIEW ISSUES BEFORE DEPLOYMENT');
  }
  console.log('='.repeat(60));
  
  return allPassed;
}

// Run the deployment check
runDeploymentCheck().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('Deployment check failed:', error);
  process.exit(1);
});