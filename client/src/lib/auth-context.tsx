import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { 
  saveAuthState, 
  clearAuthState, 
  getAuthenticatedUser, 
  isAuthenticated as checkIsAuthenticated,
  loginUser,
  logoutUser,
  specialUserFix
} from './authHelpers';

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
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function for normalizing user data
function normalizeUserData(user: User): User {
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
    lastActive: user.lastActive || new Date()
  };
}

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Track whether this is the initial load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  
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

  // Check if we're on a public page where auth queries should be disabled
  const isOnPublicPage = () => {
    const path = window.location.pathname;
    return path === '/login' || path === '/register' || path === '/business-signup' || path === '/';
  };

  // Get user data from API - but disable on public pages if auth has failed
  const { 
    data: userData,
    isLoading,
    isError, 
    error 
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: (failureCount, error: any) => {
      // Don't retry if we're on a public page and auth failed
      if (isOnPublicPage() && (error?.response?.status === 401 || error?.response?.status === 403)) {
        console.log('Auth failed on public page, not retrying');
        setAuthFailed(true);
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 2000,
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent loops
    refetchOnMount: !authFailed, // Don't refetch if auth has failed
    staleTime: 120000, // 2 minutes
    gcTime: 300000, // 5 minutes
    enabled: !authFailed || !isOnPublicPage(), // Disable query if auth failed and we're on a public page
  });

  // Apply data normalization to all users
  const user = userData ? normalizeUserData(userData) : null;

  // Mark initial load as complete after first query
  useEffect(() => {
    if (!isLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Handle auth errors
  useEffect(() => {
    if (isError && error) {
      const errorStatus = (error as any)?.response?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        console.log('Authentication failed, marking auth as failed');
        setAuthFailed(true);
        
        // Clear any stored auth state
        try {
          localStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('laura_login_success');
        } catch (e) {
          console.warn("Could not clear storage on auth failure:", e);
        }
      }
    }
  }, [isError, error]);

  // Reset auth failed state when user data is successfully retrieved
  useEffect(() => {
    if (user && authFailed) {
      console.log('Auth successful, resetting auth failed state');
      setAuthFailed(false);
    }
  }, [user, authFailed]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("Attempting login with:", { username: credentials.username, password: "***" });
      
      // Clean up credentials (remove any whitespace)
      const cleanedCredentials = {
        username: credentials.username.trim(),
        password: credentials.password
      };
      console.log("Sending cleaned login data:", { username: cleanedCredentials.username, password: "***" });
      
      // Use our improved loginUser helper
      const response = await loginUser(cleanedCredentials);
      console.log("Login response:", response);
      
      // Apply special fixes for specific users
      const fixedResponse = specialUserFix(response);
      return fixedResponse;
    },
    onSuccess: (data: User) => {
      console.log("Login successful, user data:", data);
      
      // Apply special fixes for specific users
      const enhancedUser = specialUserFix(data);
      
      // Force update authentication state
      queryClient.setQueryData(['/api/auth/me'], enhancedUser);
      setAuthFailed(false); // Reset auth failed state
      
      // Save auth state to localStorage
      saveAuthState(enhancedUser);
      
      // Force invalidate any queries that might depend on auth status
      queryClient.invalidateQueries();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${enhancedUser.firstName}!`,
      });
      
      console.log("Login successful! Redirecting to dashboard...");
      
      // Immediately set a more robust session flag
      sessionStorage.setItem('authStatus', 'authenticated');
      sessionStorage.setItem('userId', String(enhancedUser.id));
      
      // Use a more reliable redirect approach
      setTimeout(() => {
        // First clear any previous redirect state
        sessionStorage.removeItem('loginRedirecting');
        
        // Set new redirect state with timestamp
        sessionStorage.setItem('loginRedirecting', Date.now().toString());
        
        // Force navigation to dashboard
        window.location.href = "/dashboard";
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Authentication error in context:", error);
      setAuthFailed(true);
      clearAuthState();
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("/api/auth/register", { 
        method: "POST", 
        data: userData 
      });
      return response;
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      setAuthFailed(false);
      saveAuthState(data);
      toast({
        title: "Registration successful",
        description: `Welcome to MentorMe, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
      setAuthFailed(true);
      toast({
        title: "Registration failed",
        description: error.message || "There was an error created your account",
        variant: "destructive",
      });
      throw error; 
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use our improved logoutUser helper
      return await logoutUser();
    },
    onSuccess: () => {
      console.log("Logout successful");
      // Clear the user from the cache
      queryClient.setQueryData(['/api/auth/me'], null);
      setAuthFailed(false);
      // Clear any cached queries when logging out
      queryClient.clear();
      
      // Clear auth state
      clearAuthState();
      
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
      
      // Perform a complete reload of the application to clear any state
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Determine authentication state
  const isAuthenticated = !!user && !authFailed;
  const isAdmin = user?.isAdmin || false;
  const isSchoolAdmin = user?.isSchoolAdmin || false;
  const isOwner = user?.isOwner || false;

  // Login function
  const login = async (credentials: { username: string; password: string }): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
  };
  
  // Register function
  const register = async (userData: any): Promise<void> => {
    await registerMutation.mutateAsync(userData);
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading && !authFailed,
        isAuthenticated,
        isAdmin,
        isSchoolAdmin,
        isOwner,
        error: error as Error | null,
        login,
        register,
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
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}