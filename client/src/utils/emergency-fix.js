// Emergency authentication bypass
console.log('Emergency fix loaded. Navigate to /emergency for direct login.');

// Auto-redirect if stuck loading for more than 3 seconds
let loadingTimer = setTimeout(() => {
  if (window.location.pathname === '/login' || window.location.pathname === '/') {
    console.log('Auto-redirecting to emergency login due to loading issues');
    window.location.href = '/emergency';
  }
}, 3000);

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