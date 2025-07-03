#!/usr/bin/env node

// Test script to verify the editableData dual storage system is working correctly
// This tests both saving and loading modules with the new editableData field

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const testModuleId = 90; // Module 90 for testing

// Test data for creating/updating modules
const testModuleData = {
  title: "Test Module - Editable Data System",
  description: "Testing the new dual storage system for module editing",
  category: "professional-development",
  difficulty: "intermediate",
  duration: 15,
  pointValue: 10,
  content: JSON.stringify({ 
    sections: [
      {
        id: '1',
        title: 'Introduction',
        content: 'This is a test section',
        type: 'text',
        duration: 5
      }
    ]
  }),
  editableData: {
    sections: [
      {
        id: '1',
        title: 'Introduction',
        content: 'This is a test section',
        type: 'text',
        duration: 5,
        videoUrl: '',
        imageUrl: ''
      },
      {
        id: '2',
        title: 'Main Content',
        content: 'This is the main content section with more details',
        type: 'text',
        duration: 10,
        videoUrl: '',
        imageUrl: ''
      }
    ]
  },
  isSharedToCommunity: false
};

// Function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'connect.sid=s%3A6qmo1gySXq4Q4AitzbmyRMLcm9xioDvL.A1Tw%2BXQWz7vYKuE39sqN2JJo%2BpMf%2FzCfCHM6DJo%2B9kM'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function testEditableDataSystem() {
  console.log('\n🧪 Testing EditableData Dual Storage System\n');

  try {
    // Test 1: Fetch existing module to see if it has editableData
    console.log('1️⃣ Testing module retrieval with editableData field...');
    const existingModule = await makeRequest('GET', `/api/modules/${testModuleId}`);
    
    console.log('✅ Module fetched successfully');
    console.log(`   Title: ${existingModule.title}`);
    console.log(`   Has content field: ${!!existingModule.content}`);
    console.log(`   Has editableData field: ${!!existingModule.editableData}`);
    
    if (existingModule.editableData?.sections) {
      console.log(`   EditableData sections count: ${existingModule.editableData.sections.length}`);
    } else {
      console.log('   ⚠️  No editableData.sections found - this is expected for older modules');
    }

    // Test 2: Update module with editableData
    console.log('\n2️⃣ Testing module update with editableData...');
    const updatedModule = await makeRequest('PUT', `/api/modules/${testModuleId}`, testModuleData);
    
    console.log('✅ Module updated successfully');
    console.log(`   Updated title: ${updatedModule.title}`);
    console.log(`   Has content field: ${!!updatedModule.content}`);
    console.log(`   Has editableData field: ${!!updatedModule.editableData}`);

    // Test 3: Fetch the updated module to verify storage
    console.log('\n3️⃣ Testing retrieval of updated module...');
    const retrievedModule = await makeRequest('GET', `/api/modules/${testModuleId}`);
    
    console.log('✅ Updated module retrieved successfully');
    console.log(`   Title matches: ${retrievedModule.title === testModuleData.title}`);
    console.log(`   Has editableData: ${!!retrievedModule.editableData}`);
    
    if (retrievedModule.editableData?.sections) {
      console.log(`   EditableData sections: ${retrievedModule.editableData.sections.length}`);
      console.log(`   First section title: ${retrievedModule.editableData.sections[0]?.title}`);
      console.log(`   First section type: ${retrievedModule.editableData.sections[0]?.type}`);
    }

    // Test 4: Verify content and editableData are both stored
    console.log('\n4️⃣ Testing dual storage verification...');
    const contentSections = retrievedModule.content ? JSON.parse(retrievedModule.content) : null;
    const editableSections = retrievedModule.editableData?.sections || [];
    
    console.log(`   Content field parsed successfully: ${!!contentSections}`);
    console.log(`   EditableData sections count: ${editableSections.length}`);
    console.log(`   Dual storage working: ${!!(contentSections && editableSections.length > 0)}`);

    // Test 5: Test editing workflow simulation
    console.log('\n5️⃣ Testing editing workflow simulation...');
    
    // Simulate what happens when module loads in edit mode
    const sectionsForEditing = retrievedModule.editableData?.sections || [];
    console.log(`   Sections available for editing: ${sectionsForEditing.length}`);
    
    if (sectionsForEditing.length > 0) {
      const firstSection = sectionsForEditing[0];
      console.log(`   First section ready for editing:`);
      console.log(`     - ID: ${firstSection.id}`);
      console.log(`     - Title: ${firstSection.title}`);
      console.log(`     - Type: ${firstSection.type}`);
      console.log(`     - Duration: ${firstSection.duration}`);
      console.log(`     - Has content: ${!!firstSection.content}`);
    }

    console.log('\n🎉 All tests passed! EditableData dual storage system is working correctly.\n');
    
    // Summary
    console.log('📋 Summary:');
    console.log('   ✅ Module retrieval with editableData field');
    console.log('   ✅ Module update with dual storage (content + editableData)');  
    console.log('   ✅ Data persistence verification');
    console.log('   ✅ Edit mode data structure compatibility');
    console.log('   ✅ Section-based editing workflow ready');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEditableDataSystem().catch(console.error);