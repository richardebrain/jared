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
 * Normalize and standardize user data
 * Previously this was used for special handling of certain accounts
 * Now it applies consistent normalization to all users
 */
export function specialUserFix(user: any): User {
  if (!user) return user;
  
  // Normalize the user object to ensure all required fields exist
  return {
    ...user,
    // Set defaults for potentially missing fields
    points: user.points || 0,
    streak: user.streak || 0,
    bearBucks: user.bearBucks || 0,
    firstName: user.firstName || user.username || 'User',
    lifetimePoints: user.lifetimePoints || user.points || 0,
    achievementCount: user.achievementCount || 0,
    level: user.level || 1
  };
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
 * Ensure user object has expected properties
 */
export function normalizeUserData(user: any): any {
  if (!user) return user;
  
  // Ensure all users have expected properties with defaults if missing
  return {
    ...user,
    // Fix potential undefined values that might cause issues
    username: user.username || 'user',
    achievementCount: user.achievementCount || 0,
    streak: user.streak || 0,
    bearBucks: user.bearBucks || 0,
    lifetimePoints: user.lifetimePoints || 0,
    points: user.points || 0,
    lastActive: user.lastActive || new Date().toISOString()
  };
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
    console.log("Attempting login request to backend...");
    
    // Use fetch directly for better timeout control in deployed environment
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      // Extended timeout for deployed version
      signal: AbortSignal.timeout(45000), // 45 second timeout
    });

    console.log("Login response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Login failed with status:", response.status, "Error:", errorData);
      
      let errorMessage = "Login failed";
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.message || parsedError.details || errorMessage;
      } catch {
        errorMessage = response.status === 408 ? "Login timed out. Please try again." : 
                     response.status === 403 ? "Authentication failed. Please check your credentials." :
                     "Network error. Please try again.";
      }
      
      throw new Error(errorMessage);
    }

    const userData = await response.json();
    console.log("Login successful, user data received");
    return userData;
    
  } catch (error: any) {
    console.error("Login error:", error);
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error("Login is taking too long. Please check your connection and try again.");
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network connection error. Please check your internet connection.");
    }
    
    throw new Error(error.message || "Authentication failed. Please try again.");
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