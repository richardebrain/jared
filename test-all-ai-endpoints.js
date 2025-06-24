/**
 * Comprehensive AI Endpoints Testing Script
 * Tests all AI-powered features before redeployment
 */

const baseUrl = 'http://localhost:5000';
const sessionCookie = 'connect.sid=s%3AoHXNqA375sDNLp-Dwygp0P-Qn6QEYUpd';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function testEndpoint(name, endpoint, data, expectedFields = [], timeout = 15000) {
  try {
    log(`Testing ${name}...`, 'blue');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error('Received HTML instead of JSON - routing issue');
      }
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const result = await response.json();
    
    // Check for expected fields
    for (const field of expectedFields) {
      if (!(field in result)) {
        throw new Error(`Missing expected field: ${field}`);
      }
    }
    
    const responseTime = Date.now() - start;
    log(`✓ ${name} - Success (${Math.round(responseTime)}ms)`, 'green');
    return { success: true, result, responseTime: Math.round(responseTime) };
    
  } catch (error) {
    const responseTime = Date.now() - start;
    const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
    log(`✗ ${name} - Failed: ${errorMsg}`, 'red');
    return { success: false, error: errorMsg, responseTime: Math.round(responseTime) };
  }
}

async function runAllTests() {
  log('🔬 Starting comprehensive AI endpoints testing...', 'yellow');
  log('=========================================', 'yellow');
  
  const tests = [
    {
      name: 'Suessifier Tool',
      endpoint: '/api/ai/suessify',
      data: { text: 'Children should wash their hands before lunch' },
      expectedFields: ['suessifiedText']
    },
    {
      name: 'Single Quiz Question',
      endpoint: '/api/ai/generate-single-quiz-question',
      data: {
        moduleTitle: 'Playground Safety',
        sectionTitle: 'Basic Safety',
        difficulty: 'easy'
      },
      expectedFields: ['question']
    },
    {
      name: 'Teaching Strategies',
      endpoint: '/api/ai-suggestions/generate-teaching-strategies',
      data: {
        topic: 'classroom management',
        difficulty: 'beginner'
      },
      expectedFields: ['strategies']
    },
    {
      name: 'Quiz Questions Generator',
      endpoint: '/api/ai-suggestions/generate-quiz-questions',
      data: {
        topic: 'child development',
        difficulty: 'intermediate',
        count: 3
      },
      expectedFields: ['questions']
    },
    {
      name: 'Assessment Questions',
      endpoint: '/api/ai-suggestions/generate-assessment-questions',
      data: {
        topic: 'safety procedures',
        difficulty: 'intermediate'
      },
      expectedFields: ['assessmentQuestions']
    },
    {
      name: 'Text Section Generation',
      endpoint: '/api/ai-suggestions/generate-section',
      data: {
        topic: 'Circle Time Activities',
        sectionType: 'text',
        sectionTitle: 'Introduction'
      },
      expectedFields: ['blocks']
    },
    {
      name: 'Quiz Section Generation',
      endpoint: '/api/ai-suggestions/generate-section',
      data: {
        topic: 'Hand Washing',
        sectionType: 'quiz',
        sectionTitle: 'Knowledge Check'
      },
      expectedFields: ['blocks']
    },
    {
      name: 'Matching Section Generation',
      endpoint: '/api/ai-suggestions/generate-section',
      data: {
        topic: 'Playground Equipment',
        sectionType: 'matching',
        sectionTitle: 'Equipment Matching'
      },
      expectedFields: ['blocks']
    },
    {
      name: 'Scenario Section Generation',
      endpoint: '/api/ai-suggestions/generate-section',
      data: {
        topic: 'Conflict Resolution',
        sectionType: 'scenario',
        sectionTitle: 'Classroom Scenarios'
      },
      expectedFields: ['blocks']
    }
  ];
  
  const results = [];
  let start = Date.now();
  
  for (const test of tests) {
    start = Date.now();
    const result = await testEndpoint(
      test.name,
      test.endpoint,
      test.data,
      test.expectedFields
    );
    results.push({ ...test, ...result });
  }
  
  // Summary
  log('\n📊 Test Results Summary:', 'yellow');
  log('=========================================', 'yellow');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => r.success === false).length;
  
  log(`Total Tests: ${results.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.filter(r => !r.success).forEach(test => {
      log(`  • ${test.name}: ${test.error}`, 'red');
    });
  }
  
  if (passed > 0) {
    log('\n✅ Successful Tests:', 'green');
    results.filter(r => r.success).forEach(test => {
      log(`  • ${test.name}: ${test.responseTime}ms`, 'green');
    });
  }
  
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / passed;
  
  if (passed > 0) {
    log(`\n⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`, 'blue');
  }
  
  const readyForDeployment = failed === 0;
  log(`\n🚀 Deployment Ready: ${readyForDeployment ? 'YES' : 'NO'}`, 
      readyForDeployment ? 'green' : 'red');
  
  return { passed, failed, readyForDeployment, results };
}

// Run the tests
runAllTests().then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch((error) => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});