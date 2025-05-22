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
  return localStorage.getItem('isAuthenticated') === 'true';
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
    clearAuthState();
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