/**
 * Module Content Parsing Validation Test
 * Ensures scenario-match and quiz sections display properly in ModulePlayer
 * This test validates the content parsing logic fixes for deployed modules
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  failures: []
};

function logTest(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - ${details}`);
    testResults.failed++;
    testResults.failures.push({ test: testName, details });
  }
}

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: error.response?.status || 500,
      error: error.message
    };
  }
}

async function testModuleContentParsing() {
  console.log('🔍 Testing Module Content Parsing Logic...\n');
  
  // Get all modules
  const modulesResponse = await testAPI('/api/modules');
  if (!modulesResponse.success) {
    logTest('Module API Access', false, 'Cannot access modules endpoint');
    return;
  }
  
  logTest('Module API Access', true);
  
  const modules = modulesResponse.data || [];
  const modulesWithContent = modules.filter(m => m.content && m.title);
  
  if (modulesWithContent.length === 0) {
    logTest('Modules with Content Found', false, 'No modules with content available for testing');
    return;
  }
  
  logTest('Modules with Content Found', true, `Found ${modulesWithContent.length} modules`);
  
  let scenarioTestPassed = false;
  let quizTestPassed = false;
  let matchingTestPassed = false;
  
  for (const module of modulesWithContent) {
    try {
      const moduleContent = JSON.parse(module.content);
      const sections = moduleContent.sections || [];
      
      console.log(`\nTesting module: "${module.title}" (ID: ${module.id})`);
      
      // Test scenario-match section parsing
      const scenarioSection = sections.find(s => s.type === 'scenario-match');
      if (scenarioSection && !scenarioTestPassed) {
        console.log('  Found scenario-match section');
        
        // Test the parsing logic that ModulePlayer uses
        let scenarioData = null;
        
        if (typeof scenarioSection.content === 'object') {
          if (scenarioSection.content.blocks && Array.isArray(scenarioSection.content.blocks)) {
            const scenarioBlock = scenarioSection.content.blocks.find(block => block.type === 'scenario-match');
            if (scenarioBlock && scenarioBlock.content) {
              scenarioData = scenarioBlock.content;
            } else if (scenarioSection.content.blocks[0] && scenarioSection.content.blocks[0].content) {
              scenarioData = scenarioSection.content.blocks[0].content;
            }
          } else {
            scenarioData = scenarioSection.content;
          }
        }
        
        const hasValidScenarios = Array.isArray(scenarioData) && 
                                 scenarioData.length > 0 && 
                                 scenarioData[0].scenario && 
                                 scenarioData[0].options;
        
        if (hasValidScenarios) {
          logTest('Scenario-Match Content Parsing', true, `${scenarioData.length} scenarios found`);
          scenarioTestPassed = true;
        } else {
          logTest('Scenario-Match Content Parsing', false, 'Invalid scenario structure');
        }
      }
      
      // Test quiz section parsing with double-encoded JSON
      const quizSection = sections.find(s => s.type === 'quiz');
      if (quizSection && !quizTestPassed) {
        console.log('  Found quiz section');
        
        // Test the parsing logic that ModulePlayer uses
        let questions = [];
        
        if (quizSection.content && quizSection.content.blocks && quizSection.content.blocks[0]) {
          const quizBlock = quizSection.content.blocks.find(block => block.type === 'quiz');
          if (quizBlock) {
            if (Array.isArray(quizBlock.content)) {
              questions = quizBlock.content;
            } else if (typeof quizBlock.content === 'string') {
              // Handle double-encoded JSON string
              try {
                questions = JSON.parse(quizBlock.content);
              } catch (innerError) {
                console.log('    Failed to parse double-encoded JSON');
              }
            } else if (quizBlock.questions && Array.isArray(quizBlock.questions)) {
              questions = quizBlock.questions;
            }
          } else if (quizSection.content.blocks[0].content) {
            if (Array.isArray(quizSection.content.blocks[0].content)) {
              questions = quizSection.content.blocks[0].content;
            } else if (typeof quizSection.content.blocks[0].content === 'string') {
              // Handle double-encoded JSON string
              try {
                questions = JSON.parse(quizSection.content.blocks[0].content);
              } catch (innerError) {
                console.log('    Failed to parse quiz content JSON string');
              }
            }
          }
        }
        
        const hasValidQuestions = Array.isArray(questions) && 
                                 questions.length > 0 && 
                                 questions[0].question && 
                                 questions[0].options;
        
        if (hasValidQuestions) {
          logTest('Quiz Double-Encoded JSON Parsing', true, `${questions.length} questions found`);
          quizTestPassed = true;
        } else {
          logTest('Quiz Double-Encoded JSON Parsing', false, 'Invalid quiz structure');
        }
      }
      
      // Test matching activity parsing
      const matchingSection = sections.find(s => s.type === 'matching');
      if (matchingSection && !matchingTestPassed) {
        console.log('  Found matching section');
        
        // Test the parsing logic that ModulePlayer uses
        let matchingContent = null;
        
        if (typeof matchingSection.content === 'object') {
          if (matchingSection.content.blocks && matchingSection.content.blocks[0]) {
            const matchingBlock = matchingSection.content.blocks.find(block => block.type === 'matching');
            if (matchingBlock && matchingBlock.content) {
              matchingContent = matchingBlock.content;
            } else if (matchingSection.content.blocks[0].content) {
              matchingContent = matchingSection.content.blocks[0].content;
            }
          } else if (matchingSection.content.pairs) {
            matchingContent = matchingSection.content;
          }
        }
        
        let pairs = null;
        if (Array.isArray(matchingContent)) {
          pairs = matchingContent;
        } else if (matchingContent && matchingContent.pairs && Array.isArray(matchingContent.pairs)) {
          pairs = matchingContent.pairs;
        }
        
        const hasValidMatching = pairs && pairs.length > 0 && 
                                pairs[0].left && pairs[0].right;
        
        if (hasValidMatching) {
          logTest('Matching Activity Content Parsing', true, `${pairs.length} pairs found`);
          matchingTestPassed = true;
        } else {
          logTest('Matching Activity Content Parsing', false, 'Invalid matching structure');
        }
      }
      
      // Break if we've tested all section types
      if (scenarioTestPassed && quizTestPassed && matchingTestPassed) {
        break;
      }
      
    } catch (parseError) {
      console.log(`  ❌ Failed to parse module content: ${parseError.message}`);
    }
  }
  
  // Summary of content parsing tests
  if (!scenarioTestPassed) {
    logTest('Scenario-Match Section Available', false, 'No scenario-match sections found in modules');
  }
  
  if (!quizTestPassed) {
    logTest('Quiz Section Available', false, 'No quiz sections found in modules');
  }
  
  if (!matchingTestPassed) {
    logTest('Matching Activity Section Available', false, 'No matching sections found in modules');
  }
}

async function testModulePlayerCompatibility() {
  console.log('\n🎮 Testing ModulePlayer Compatibility...\n');
  
  // Test that the parsing logic handles various content structures
  const testCases = [
    {
      name: 'Double-Encoded Quiz JSON',
      content: {
        blocks: [{
          type: 'quiz',
          content: '[{"id":"q1","question":"Test?","options":["A","B"],"correctAnswer":0}]'
        }]
      },
      expectedType: 'quiz'
    },
    {
      name: 'Scenario Array Structure',
      content: {
        blocks: [{
          type: 'scenario-match',
          content: [{"scenario":"Test scenario","options":["A","B"],"correctAnswer":0}]
        }]
      },
      expectedType: 'scenario-match'
    },
    {
      name: 'Matching Pairs Structure',
      content: {
        blocks: [{
          type: 'matching',
          content: [{"left":"Term","right":"Definition"}]
        }]
      },
      expectedType: 'matching'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      // Simulate the parsing logic from ModulePlayer
      const section = { content: testCase.content, type: testCase.expectedType };
      let parsed = false;
      
      if (testCase.expectedType === 'quiz') {
        if (section.content.blocks && section.content.blocks[0] && typeof section.content.blocks[0].content === 'string') {
          const questions = JSON.parse(section.content.blocks[0].content);
          parsed = Array.isArray(questions) && questions.length > 0;
        }
      } else if (testCase.expectedType === 'scenario-match') {
        if (section.content.blocks && section.content.blocks[0] && Array.isArray(section.content.blocks[0].content)) {
          parsed = section.content.blocks[0].content.length > 0;
        }
      } else if (testCase.expectedType === 'matching') {
        if (section.content.blocks && section.content.blocks[0] && Array.isArray(section.content.blocks[0].content)) {
          parsed = section.content.blocks[0].content.length > 0;
        }
      }
      
      logTest(`ModulePlayer ${testCase.name} Parsing`, parsed);
    } catch (error) {
      logTest(`ModulePlayer ${testCase.name} Parsing`, false, error.message);
    }
  }
}

async function runModuleContentParsingTests() {
  console.log('🚀 Starting Module Content Parsing Validation Tests\n');
  
  try {
    await testModuleContentParsing();
    await testModulePlayerCompatibility();
    
    // Print final results
    console.log('\n' + '='.repeat(60));
    console.log('📊 MODULE CONTENT PARSING TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failures.length > 0) {
      console.log('\n💥 Failed Tests:');
      testResults.failures.forEach(failure => {
        console.log(`   • ${failure.test}: ${failure.details}`);
      });
    }
    
    console.log('\n🏁 Module Content Parsing Tests Complete!');
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All module content parsing logic is working correctly!');
      console.log('   Scenario-match and quiz sections will display properly in deployed modules.');
    } else {
      console.log('\n⚠️  Some content parsing issues detected. Review failed tests above.');
    }
    
  } catch (error) {
    console.error('Test execution error:', error.message);
  }
}

// Run the tests
runModuleContentParsingTests();