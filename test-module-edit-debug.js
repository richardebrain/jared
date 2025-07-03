/**
 * Debug script to test module editing functionality
 * Tests the edit parameter parsing and module loading flow
 */

console.log('=== Module Edit Debug Test ===');

// Simulate the URL parameter parsing logic from comprehensive-module-creator.tsx
function testURLParameterParsing(testURL) {
  console.log(`\nTesting URL: ${testURL}`);
  
  const urlParams = new URLSearchParams(testURL.split('?')[1] || '');
  const editId = urlParams.get('edit');
  
  console.log(`Edit parameter: ${editId}`);
  
  if (editId) {
    const moduleId = parseInt(editId, 10);
    if (!isNaN(moduleId)) {
      console.log(`✅ Valid module ID: ${moduleId}`);
      return { isEditMode: true, moduleId };
    } else {
      console.log(`❌ Invalid module ID: ${editId}`);
      return { isEditMode: false, moduleId: null };
    }
  } else {
    console.log(`❌ No edit parameter found`);
    return { isEditMode: false, moduleId: null };
  }
}

// Test various URL scenarios
const testURLs = [
  '/comprehensive-module-creator?edit=123',
  '/comprehensive-module-creator?edit=abc',
  '/comprehensive-module-creator?edit=',
  '/comprehensive-module-creator',
  '/comprehensive-module-creator?edit=999&other=param'
];

testURLs.forEach(url => testURLParameterParsing(url));

console.log('\n=== React Query Test Simulation ===');

// Simulate the React Query behavior
function simulateModuleQuery(moduleId, isEditMode) {
  console.log(`\nSimulating query for module ${moduleId}, editMode: ${isEditMode}`);
  
  if (!moduleId || !isEditMode) {
    console.log('❌ Query disabled - no moduleId or not in edit mode');
    return null;
  }
  
  console.log(`✅ Query would be enabled: /api/modules/${moduleId}`);
  return { queryKey: [`/api/modules/${moduleId}`], enabled: true };
}

// Test the query logic
console.log('Testing query enablement logic:');
simulateModuleQuery(null, false);
simulateModuleQuery(123, false);
simulateModuleQuery(null, true);
simulateModuleQuery(123, true);

console.log('\n=== Module Data Structure Test ===');

// Test module data parsing logic from the comprehensive module creator
function testModuleDataParsing(mockModuleData) {
  console.log('\nTesting module data parsing...');
  console.log('Mock module data:', JSON.stringify(mockModuleData, null, 2));
  
  let sectionsData = [];
  
  if (mockModuleData.content) {
    try {
      const content = typeof mockModuleData.content === 'string' 
        ? JSON.parse(mockModuleData.content) 
        : mockModuleData.content;
      
      // Check if content has a sections property
      if (content && content.sections && Array.isArray(content.sections)) {
        sectionsData = content.sections;
        console.log('✅ Found sections in content.sections');
      } else if (Array.isArray(content)) {
        sectionsData = content;
        console.log('✅ Content is direct sections array');
      } else {
        console.log('❌ Content format not recognized');
      }
    } catch (error) {
      console.log('❌ Error parsing content:', error.message);
    }
  }
  
  // Check if module has direct sections field
  if (mockModuleData.sections && Array.isArray(mockModuleData.sections)) {
    sectionsData = mockModuleData.sections;
    console.log('✅ Found direct sections field');
  }
  
  console.log(`Final sections count: ${sectionsData.length}`);
  return sectionsData;
}

// Test different module data structures
const testModules = [
  {
    id: 1,
    title: "Test Module 1",
    content: JSON.stringify({
      sections: [
        { id: 1, type: "text", title: "Section 1" },
        { id: 2, type: "text", title: "Section 2" }
      ]
    })
  },
  {
    id: 2,
    title: "Test Module 2",
    content: JSON.stringify([
      { id: 1, type: "text", title: "Section 1" },
      { id: 2, type: "text", title: "Section 2" }
    ])
  },
  {
    id: 3,
    title: "Test Module 3",
    sections: [
      { id: 1, type: "text", title: "Section 1" },
      { id: 2, type: "text", title: "Section 2" }
    ]
  },
  {
    id: 4,
    title: "Test Module 4",
    content: "invalid json content"
  }
];

testModules.forEach(module => testModuleDataParsing(module));

console.log('\n=== Summary ===');
console.log('If you see this output, the URL parsing and data handling logic should work correctly.');
console.log('The issue might be:');
console.log('1. Authentication problems preventing API calls');
console.log('2. Module not found in database');
console.log('3. React Query cache issues');
console.log('4. Component re-render or state management issues');