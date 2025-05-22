// Authentication helper functions for the MentorMe application

/**
 * Function to check if we're running in a deployed environment
 */
export function isDeployedEnvironment(): boolean {
  return window.location.href.includes('.replit.app') || window.location.href.includes('replit.dev');
}

/**
 * Function to handle authentication on initial app load
 * This is especially important for the deployed version
 */
export function handleInitialAuth(): void {
  // Only run this once per session
  if (sessionStorage.getItem('authInitialized')) return;
  
  // Mark that we've run the initial auth logic
  sessionStorage.setItem('authInitialized', 'true');
  
  // In deployed environments, ensure a clean authentication state
  if (isDeployedEnvironment()) {
    const isOnAuthPage = window.location.pathname === '/login' || 
                         window.location.pathname === '/register';
                         
    if (!isOnAuthPage && window.location.pathname !== '/') {
      // We're not on an auth page, so redirect to login
      console.log('Deployed environment detected, redirecting to login page');
      window.location.replace('/login');
      return;
    }
    
    // Clear any stored auth data to prevent loops
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }
}

/**
 * Function to check if a user is authenticated based on localStorage
 */
export function checkIfAuthenticated(): boolean {
  return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Function to set authenticated status
 */
export function setAuthenticated(isAuth: boolean): void {
  if (isAuth) {
    localStorage.setItem('isAuthenticated', 'true');
  } else {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }
}

/**
 * Function to get the current user from localStorage
 */
export function getCurrentUser(): any {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
}