import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from './queryClient';

/**
 * Interface for authenticated user data
 */
interface User {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isOwner: boolean;
  [key: string]: any; // For additional properties
}

/**
 * Interface for authentication context
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isOwner: boolean;
  error: Error | null;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function for handling special users
function specialUserFix(user: User): User {
  // Apply any special user fixes (particularly for lbook account)
  // This should match the logic in your existing useAuth hook
  
  if (user && user.username === 'lbook') {
    console.log("EMERGENCY FIX: Giving special access to", user.username);
    
    // Enhanced version of the user with permissions that work in deployed version
    return {
      ...user,
      id: user.id || 5, // Ensure ID is set
      points: Math.max(user.points || 0, 15), // Ensure enough points for game access
      isOwner: true,
      isAdmin: true,
      isSchoolAdmin: true
    };
  }
  
  if (user && user.username === 'jlcookie20') {
    console.log("EMERGENCY FIX: Giving special games access to", user.username);
  }
  
  return user;
}

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Track whether this is the initial load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Clear any stored auth data on initial component mount
  useEffect(() => {
    // Only do this on the first page load, not on subsequent renders
    if (window.location.pathname === "/") {
      console.log("Clearing auth state on initial page load");
      try {
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('laura_login_success');
      } catch (e) {
        console.warn("Could not clear storage:", e);
      }
    }
    
    // Set initial load complete after first render
    setInitialLoadComplete(true);
  }, []);

  // Get user data from API
  const { 
    data: userData,
    isLoading,
    isError, 
    error 
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: initialLoadComplete, // Only refetch on window focus after initial load
    refetchOnMount: true,
    staleTime: 120000, // 2 minutes
    gcTime: 300000, // 5 minutes
  });

  // Apply user special fixes
  const user = userData ? specialUserFix(userData) : null;

  // Mark initial load as complete after first query
  useEffect(() => {
    if (!isLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Determine authentication state
  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin || false;
  const isSchoolAdmin = user?.isSchoolAdmin || false;
  const isOwner = user?.isOwner || false;

  // Logout function
  const logout = () => {
    // Clear local query cache
    queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
    
    // Redirect to logout endpoint
    window.location.href = '/api/logout';
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isSchoolAdmin,
        isOwner,
        error: error as Error | null,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Higher order component for protected routes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Wait for auth to load
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Use plain navigation to prevent loops
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    
    // User is authenticated, render the component
    return <Component {...props} />;
  };
}