import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { User as BaseUser } from '@shared/schema';
import { User, ensureUserDefaults } from '@/types/user';
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
    // Only clear auth state on the landing page if explicitly requested
    if (window.location.pathname === "/" && window.location.search.includes('clear=true')) {
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
  } = useQuery<BaseUser>({
    queryKey: ['/api/auth/me'],
    retry: false, // Disable retries to prevent session clearing loops
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent loops
    refetchOnMount: true, // Enable refetch on mount for proper session verification
    staleTime: 60000, // 1 minute - shorter to ensure fresh auth data
    gcTime: 300000, // 5 minutes
    enabled: !isOnPublicPage() && !authFailed, // Only fetch if not on public page and auth hasn't failed
  });

  // Add timeout to prevent infinite loading states
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !userData && !isError) {
        console.log('Auth timeout reached, redirecting to login');
        setAuthFailed(true);
        window.location.href = '/login';
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, userData, isError]);

  // Apply data normalization to all users
  const user = userData ? ensureUserDefaults(userData) : null;

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
      
      // Save auth state to localStorage first
      saveAuthState(enhancedUser);
      
      // Force update authentication state in query cache
      queryClient.setQueryData(['/api/auth/me'], enhancedUser);
      setAuthFailed(false); // Reset auth failed state
      
      // Set session flags for proper state tracking
      sessionStorage.setItem('authStatus', 'authenticated');
      sessionStorage.setItem('userId', String(enhancedUser.id));
      sessionStorage.setItem('loginRedirecting', Date.now().toString());
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${enhancedUser.firstName}!`,
      });
      
      console.log("Login successful! Redirecting to dashboard...");
      
      // Immediate redirect without waiting for queries
      window.location.replace('/dashboard');
    },
    onError: (error: Error) => {
      console.error("Authentication error in context:", error);
      
      // Handle timeout and 403 errors differently in deployed environment
      if (error.message.includes('timeout') || error.message.includes('taking too long')) {
        toast({
          title: "Login timeout",
          description: "Please wait a moment and try again. The server may be busy.",
          variant: "destructive",
        });
        // Don't set auth failed for timeouts - allow retry
        return;
      }
      
      if (error.message.includes('403') || error.message.includes('Authentication failed')) {
        toast({
          title: "Authentication failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
        // Clear any stale session data that might be causing 403s
        sessionStorage.clear();
        localStorage.removeItem('authState');
        queryClient.clear();
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Invalid username or password",
          variant: "destructive",
        });
      }
      
      setAuthFailed(true);
      clearAuthState();
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