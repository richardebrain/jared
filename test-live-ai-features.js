/**
 * Live AI Features Testing via Browser Console
 * Tests AI functionality using authenticated browser session
 */

// Test Suessifier (working from logs)
async function testSuessifier() {
  try {
    const response = await fetch('/api/suessify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation: 'A teacher who stays positive during challenging days',
        teacherName: 'Ms. Sarah'
      })
    });
    const data = await response.json();
    console.log('✅ Suessifier working:', data.poem ? 'Generated poem successfully' : 'Failed');
    return data.poem ? true : false;
  } catch (error) {
    console.log('❌ Suessifier failed:', error.message);
    return false;
  }
}

// Test Behavior Guidance (fix parameter names)
async function testBehaviorGuidance() {
  try {
    const response = await fetch('/api/behavior-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childName: 'Emma',
        childAge: 4,
        behavior: 'Refuses to share toys during playtime',
        context: 'Free play time in the classroom'
      })
    });
    const data = await response.json();
    console.log('✅ Behavior Guidance working:', data.strategies ? 'Generated strategies successfully' : 'Failed');
    return data.strategies ? true : false;
  } catch (error) {
    console.log('❌ Behavior Guidance failed:', error.message);
    return false;
  }
}

// Test Image Generation (fix style parameter)
async function testImageGeneration() {
  try {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Colorful preschool classroom with children playing educational games',
        style: 'vivid'
      })
    });
    const data = await response.json();
    console.log('✅ Image Generation working:', data.imageUrl ? 'Generated image successfully' : 'Failed');
    return data.imageUrl ? true : false;
  } catch (error) {
    console.log('❌ Image Generation failed:', error.message);
    return false;
  }
}

// Test Voice Generation (check auth requirements)
async function testVoiceGeneration() {
  try {
    const response = await fetch('/api/voice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Welcome to our preschool classroom! Today we are learning about sharing and friendship.',
        voice: 'Rachel'
      })
    });
    const data = await response.json();
    console.log('✅ Voice Generation working:', data.audioUrl ? 'Generated audio successfully' : 'Failed');
    return data.audioUrl ? true : false;
  } catch (error) {
    console.log('❌ Voice Generation failed:', error.message);
    return false;
  }
}

// Test AI Module Generation
async function testModuleGeneration() {
  try {
    const response = await fetch('/api/ai/generate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Playground Safety for Preschoolers',
        targetAudience: 'preschool teachers',
        duration: 15,
        sectionType: 'text'
      })
    });
    const data = await response.json();
    console.log('✅ Module Generation working:', data.content ? 'Generated content successfully' : 'Failed');
    return data.content ? true : false;
  } catch (error) {
    console.log('❌ Module Generation failed:', error.message);
    return false;
  }
}

// Run comprehensive test
async function runComprehensiveAITest() {
  console.log('🚀 COMPREHENSIVE AI FEATURES TEST');
  console.log('==================================');
  
  const results = {
    suessifier: await testSuessifier(),
    behaviorGuidance: await testBehaviorGuidance(),
    imageGeneration: await testImageGeneration(),
    voiceGeneration: await testVoiceGeneration(),
    moduleGeneration: await testModuleGeneration()
  };
  
  const workingFeatures = Object.values(results).filter(Boolean).length;
  const totalFeatures = Object.keys(results).length;
  
  console.log(`\n📊 RESULTS: ${workingFeatures}/${totalFeatures} AI features working`);
  
  Object.entries(results).forEach(([feature, working]) => {
    console.log(`${working ? '✅' : '❌'} ${feature}`);
  });
  
  const deploymentReady = workingFeatures >= 3;
  console.log(`\n🎯 DEPLOYMENT STATUS: ${deploymentReady ? 'READY' : 'NEEDS ATTENTION'}`);
  
  return results;
}

// Export for browser console use
window.testAIFeatures = runComprehensiveAITest;