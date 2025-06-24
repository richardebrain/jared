// Emergency auth fix utility
window.fixAuth = function() {
  console.log('Fixing authentication state...');
  
  // Clear all problematic session storage
  sessionStorage.removeItem('loginRedirecting');
  sessionStorage.removeItem('authStatus');
  localStorage.removeItem('isAuthenticated');
  
  // Force redirect to dashboard
  window.location.replace('/dashboard');
};

// Auto-run if stuck on login page after 2 seconds
setTimeout(() => {
  if (window.location.pathname === '/login' && sessionStorage.getItem('authStatus') === 'authenticated') {
    console.log('Auto-fixing stuck login state...');
    window.fixAuth();
  }
}, 2000);

console.log('Auth fix utility loaded. Use window.fixAuth() if needed.');