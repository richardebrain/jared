/**
 * Direct test of school deletion function to verify syntax fix
 */

const { deleteSchool } = require('./server/services/cleanSchoolDeletion.ts');

async function testSchoolDeletionDirectly() {
  console.log('🧪 Testing school deletion function directly...');

  try {
    // Try to delete a non-existent school to test error handling
    const result = await deleteSchool(9999);
    console.log('Result:', result);
    
  } catch (error) {
    console.log('Error caught:', error.message);
    
    // Check if it's a syntax error or proper database error
    if (error.message.includes('syntax error')) {
      console.log('❌ SQL syntax error still exists');
    } else if (error.message.includes('School with ID') && error.message.includes('not found')) {
      console.log('✅ Proper error handling for non-existent school');
    } else {
      console.log('Error details:', error.message);
    }
  }
}

testSchoolDeletionDirectly();