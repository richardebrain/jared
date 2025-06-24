// Authentication system test utilities
console.log('Authentication test utilities loaded');

window.testAuth = {
  // Test login functionality
  async testLogin() {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: 'jlcookie20', password: 'password' })
      });
      
      const data = await response.json();
      console.log('Login test result:', response.status, data);
      return { success: response.ok, data };
    } catch (error) {
      console.error('Login test failed:', error);
      return { success: false, error };
    }
  },

  // Test auth check
  async testAuthCheck() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Auth check result:', response.status, data);
      return { success: response.ok, data };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { success: false, error };
    }
  },

  // Test full auth flow
  async testFullFlow() {
    console.log('Testing full authentication flow...');
    
    const loginResult = await this.testLogin();
    if (!loginResult.success) {
      console.error('Login failed in full flow test');
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for session
    
    const authResult = await this.testAuthCheck();
    if (!authResult.success) {
      console.error('Auth check failed in full flow test');
      return false;
    }
    
    console.log('Full authentication flow test: SUCCESS');
    return true;
  },

  // Clear all auth data
  clearAuth() {
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('All authentication data cleared');
  }
};

console.log('Use window.testAuth.testFullFlow() to test authentication');