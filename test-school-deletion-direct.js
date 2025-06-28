/**
 * Direct test of school deletion function to verify syntax fix
 */

const { deleteSchool } = require('./server/services/cleanSchoolDeletion.ts');

async function testSchoolDeletionDirectly() {
  console.log('🧪 Testing School Deletion Function Directly...');

  try {
    // Test with a school ID that doesn't exist to verify syntax fix
    console.log('Testing with non-existent school ID (should fail gracefully)...');
    const result = await deleteSchool(9999);
    console.log('Result:', result);
  } catch (error) {
    console.log('Error (expected for non-existent school):', error.message);
    
    // Check if the error is about "School not found" (good) vs "syntax error" (bad)
    if (error.message.includes('syntax error at or near')) {
      console.log('❌ SQL syntax error still exists');
      console.log('Full error:', error);
    } else if (error.message.includes('School not found')) {
      console.log('✅ SQL syntax error fixed - function correctly handles non-existent school');
    } else {
      console.log('❓ Different error:', error.message);
    }
  }
}

testSchoolDeletionDirectly().catch(console.error);