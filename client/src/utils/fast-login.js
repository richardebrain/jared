// Fast login utility to bypass performance bottlenecks
window.fastLogin = function() {
  console.log('Initiating fast login...');
  
  // Clear any problematic auth state
  sessionStorage.clear();
  localStorage.removeItem('isAuthenticated');
  
  // Navigate directly to login
  window.location.href = '/login';
};

// Emergency dashboard redirect
window.goDashboard = function() {
  console.log('Emergency dashboard redirect...');
  window.location.replace('/dashboard');
};

console.log('Fast login utilities loaded: window.fastLogin() and window.goDashboard()');