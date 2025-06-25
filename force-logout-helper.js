/**
 * Helper script to force logout by clearing browser storage
 * Run this in browser console: copy and paste this entire script
 */

console.log('🔧 Force logout helper started...');

// Clear all storage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✓ Browser storage cleared');
  
  // Clear all cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
  console.log('✓ Cookies cleared');
  
  // Redirect to force logout
  setTimeout(() => {
    window.location.href = '/?forceLogout=true';
  }, 500);
  
} catch (error) {
  console.error('❌ Force logout failed:', error);
}