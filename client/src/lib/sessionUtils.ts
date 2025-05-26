import { queryClient } from './queryClient';

/**
 * Utility functions for managing authentication sessions
 * These can be called from the browser console for debugging
 */

// Clear all authentication state and redirect to login
export const resetAuthState = async () => {
  console.log('Resetting authentication state...');
  
  try {
    // Clear React Query cache
    queryClient.clear();
    
    // Clear local storage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    sessionStorage.removeItem('laura_login_success');
    
    // Call server to clear session
    await fetch('/api/auth/clear-session', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('Auth state cleared successfully');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Error clearing auth state:', error);
    // Force redirect anyway
    window.location.href = '/login';
  }
};

// Force logout and clear everything
export const forceLogout = async () => {
  console.log('Forcing logout...');
  
  try {
    // Call logout endpoint
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.warn('Logout endpoint failed:', error);
  }
  
  // Clear everything regardless
  await resetAuthState();
};

// Check current auth status
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('Current user:', user);
      return user;
    } else {
      console.log('Not authenticated, status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
};

// Make these available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authUtils = {
    resetAuthState,
    forceLogout,
    checkAuthStatus
  };
  
  console.log('Auth utilities available at window.authUtils');
} 