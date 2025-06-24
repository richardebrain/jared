// Emergency authentication bypass
console.log('Emergency fix loaded. Navigate to /emergency for direct login.');

// Disable auto-redirect for permanent fix testing
// Auto-redirect disabled - permanent fix should resolve loading issues

// Clear timer if page loads successfully
window.addEventListener('load', () => {
  clearTimeout(loadingTimer);
});

// Emergency functions
window.emergencyLogin = () => {
  window.location.href = '/emergency';
};

window.forceDashboard = () => {
  window.location.href = '/dashboard';
};