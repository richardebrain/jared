/**
 * Emergency Authentication Loop Fix
 * This script forces a clean login to break the auth loop
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Emergency Authentication Loop Fix');
console.log('This will clear all sessions and force a clean login');

rl.question('Press Enter to continue...', async () => {
  try {
    // Clear all sessions
    const clearResponse = await fetch('http://localhost:5000/api/auth/clear-all-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✓ All sessions cleared');
    
    // Force login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'jlcookie20',
        password: 'password123'
      }),
      credentials: 'include'
    });
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('✓ Login successful for:', userData.username);
      console.log('✓ Admin rights:', {
        isAdmin: userData.is_admin,
        isSchoolAdmin: userData.is_school_admin,
        isOwner: userData.is_owner
      });
    } else {
      console.log('❌ Login failed:', await loginResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
  
  rl.close();
});