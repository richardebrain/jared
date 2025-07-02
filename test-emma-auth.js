/**
 * Test script to check Emma's authentication and Director Toolkit access
 */

import { storage } from './server/storage.js';

async function testEmmaAuth() {
  try {
    console.log('🔍 Testing Emma\'s authentication status...');
    
    // Get Emma's user data
    const user = await storage.getUserByUsername('emma');
    
    if (!user) {
      console.log('❌ Emma user not found');
      return;
    }
    
    console.log('✅ Emma user found:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- First Name:', user.firstName);
    console.log('- Last Name:', user.lastName);
    console.log('- School ID:', user.schoolId);
    console.log('- isAdmin (camelCase):', user.isAdmin);
    console.log('- isSchoolAdmin (camelCase):', user.isSchoolAdmin);
    console.log('- isOwner (camelCase):', user.isOwner);
    console.log('- is_admin (snake_case):', user.is_admin);
    console.log('- is_school_admin (snake_case):', user.is_school_admin);
    console.log('- is_owner (snake_case):', user.is_owner);
    
    // Determine expected Director Toolkit access
    const hasDirectorAccess = user.isSchoolAdmin || user.is_school_admin || user.isAdmin || user.is_admin;
    console.log('\n📋 Director Toolkit Access Analysis:');
    console.log('- Should have Director Toolkit access:', hasDirectorAccess ? '✅ YES' : '❌ NO');
    
    if (hasDirectorAccess) {
      console.log('✅ Emma should be able to access Director Toolkit');
    } else {
      console.log('❌ Emma lacks required permissions for Director Toolkit');
      console.log('📝 To fix: Set is_school_admin = true in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing Emma auth:', error);
  }
}

testEmmaAuth();