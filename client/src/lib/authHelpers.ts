// Authentication helper functions for the MentorMe application
import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

/**
 * Function to check if we're running in a deployed environment
 */
export function isDeployedEnvironment(): boolean {
  return window.location.href.includes('.replit.app') || window.location.href.includes('replit.dev');
}

/**
 * Function to check if a user is authenticated based on localStorage
 */
export function isAuthenticated(): boolean {
  const authState = localStorage.getItem('isAuthenticated');
  const user = localStorage.getItem('user');
  
  // We need both the auth flag and valid user data to be authenticated
  return authState === 'true' && !!user;
}

/**
 * Special fix for Laura's (lbook) account
 */
export function specialUserFix(user: any): any {
  if (!user) return user;
  
  // Special handling for lbook account (also checking for lbooks variant)
  if (user.username === 'lbook' || user.username === 'lbooks' || user.id === 5) {
    console.log("EMERGENCY FIX: Giving special access to", user.username);
    
    // Enhanced version of the user with permissions that work in deployed version
    return {
      ...user,
      id: user.id || 5, // Ensure ID is set
      points: Math.max(user.points || 0, 20), // Ensure enough points for game access
      // Fix potential undefined values that might cause issues
      username: user.username || 'lbook', // Ensure username is set
      achievementCount: user.achievementCount || 0,
      streak: user.streak || 0,
      bearBucks: user.bearBucks || 0,
      lifetimePoints: user.lifetimePoints || 0,
      // Ensure role flags are set
      isOwner: true,
      isAdmin: true,
      isSchoolAdmin: true,
      // Set timestamps that might be missing
      lastActive: user.lastActive || new Date().toISOString(),
      // Extra fields to ensure login works
      firstName: user.firstName || 'Laura',
      lastName: user.lastName || 'Books',
      email: user.email || 'lbooks@example.com'
    };
  }
  
  return user;
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
  
  // Reset login redirecting state
  sessionStorage.removeItem('loginRedirecting');
  
  // Instead of clearing authentication state in deployed environments,
  // we'll use the stored authentication state if it exists, but only
  // redirect unauthorized users on protected routes
  if (isDeployedEnvironment()) {
    const isOnAuthPage = window.location.pathname === '/login' || 
                        window.location.pathname === '/register';
    
    // If we're not on an auth page and we're not authenticated,
    // redirect to the login page
    if (!isOnAuthPage && !isAuthenticated() && 
        window.location.pathname !== '/' && 
        window.location.pathname !== '/landing') {
      console.log('Protected route detected but not authenticated, redirecting to login');
      window.location.replace('/login');
    }
  }
}

/**
 * Function to get the authenticated user from localStorage
 */
export function getAuthenticatedUser(): User | null {
  if (!isAuthenticated()) return null;
  
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString) as User;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
}

/**
 * Function to save authentication state to localStorage
 */
export function saveAuthState(user: User): void {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Function to clear authentication state from localStorage
 */
export function clearAuthState(): void {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user');
}

/**
 * Function to login a user
 */
export async function loginUser(credentials: { username: string; password: string }): Promise<User> {
  try {
    const response = await apiRequest<User>("/api/auth/login", {
      method: "POST",
      data: credentials
    });
    
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Invalid username or password");
  }
}

/**
 * Function to logout a user
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST"
    });
    
    clearAuthState();
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error(error.message || "Failed to logout");
  }
}