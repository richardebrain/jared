/**
 * Authentication Helper Functions
 * 
 * This file provides utility functions for managing auth state in the app.
 */

import { apiRequest } from "./queryClient";

// Save user auth state to localStorage
export function saveAuthState(userData: any) {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('authTimestamp', Date.now().toString());
}

// Clear auth state from localStorage
export function clearAuthState() {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('authTimestamp');
}

// Get authenticated user from localStorage
export function getAuthenticatedUser() {
  try {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    if (storedAuth === 'true' && storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch (e) {
    console.error("Error parsing stored user:", e);
    clearAuthState();
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  return localStorage.getItem('isAuthenticated') === 'true';
}

// Attempt to login with given credentials
export async function loginUser(credentials: { username: string; password: string }) {
  const response = await apiRequest("/api/auth/login", {
    method: "POST",
    data: credentials,
  });
  
  if (response) {
    saveAuthState(response);
  }
  
  return response;
}

// Logout user by clearing local storage and calling server logout endpoint
export async function logoutUser() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Error during server logout:", error);
  } finally {
    clearAuthState();
    window.location.href = "/login";
  }
}

// Direct navigation helper that forces a full page reload
export function navigateTo(path: string) {
  window.location.href = path;
}