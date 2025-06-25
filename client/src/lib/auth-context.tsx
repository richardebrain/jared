import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { User as BaseUser } from '@shared/schema';
import { User, ensureUserDefaults } from '@/types/user';
import { AuthStorage } from './auth-storage';
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
  
  // Initialize component with smart authentication handling
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // On login page, force clear everything to prevent loops
    if (currentPath === '/login') {
      console.log('Login page detected - clearing all auth data');
      try {
        localStorage.clear();
        sessionStorage.clear();
        AuthStorage.clearAuthData();
        setUser(null);
        queryClient.clear();
        setAuthFailed(true);
      } catch (e) {
        console.warn('Auth clear error:', e);
      }
      setInitialLoadComplete(true);
      return;
    }
    
    // For other pages, try to load cached auth but don't query server
    setAuthFailed(true); // Prevent automatic server queries
    setInitialLoadComplete(true);
  }, []);
  console.log('Auth provider initialized')

  // Check if we're on a public page where auth queries should be disabled
  const isOnPublicPage = () => {
    const path = window.location.pathname;
    return path === '/login' || path === '/register' || path === '/business-signup' || path === '/' || path === '/emergency';
  };

  // Initialize from storage first, then fetch if needed
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = AuthStorage.getAuthData();
      if (cached) {
        // Set in query cache immediately
        queryClient.setQueryData(['/api/auth/me'], cached);
        return cached;
      }
    } catch (error) {
      console.warn('Failed to load cached auth:', error);
    }
    return null;
  });
  
  const { 
    data: userData,
    isLoading,
    isError, 
    error,
    refetch: refetchUser
  } = useQuery<BaseUser>({
    queryKey: ['/api/auth/me'],
    queryFn: async (): Promise<BaseUser> => {
      throw new Error('Auth query disabled to prevent loops');
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: false, // Permanently disabled
  });

  // Load cached auth data without server queries - enhanced navigation handling
  useEffect(() => {
    // Only load cached auth on non-login pages
    if (window.location.pathname !== '/login') {
      try {
        const cachedAuth = AuthStorage.getAuthData();
        if (cachedAuth) {
          console.log('Loading cached auth for navigation');
          setUser(cachedAuth);
          queryClient.setQueryData(['/api/auth/me'], cachedAuth);
          setAuthFailed(false);
        } else {
          console.log('No cached auth found');
          setAuthFailed(true);
        }
      } catch (error) {
        console.warn('Failed to load cached auth:', error);
        setAuthFailed(true);
      }
    }
    setInitialLoadComplete(true);
  }, []);

  // Handle navigation events to refresh auth state
  useEffect(() => {
    const handleNavigation = () => {
      console.log('Navigation detected, refreshing auth state');
      if (window.location.pathname !== '/login') {
        try {
          const cachedAuth = AuthStorage.getAuthData();
          if (cachedAuth && !user) {
            console.log('Restoring user auth after navigation');
            setUser(cachedAuth);
            queryClient.setQueryData(['/api/auth/me'], cachedAuth);
            setAuthFailed(false);
          }
        } catch (error) {
          console.warn('Navigation auth refresh failed:', error);
        }
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleNavigation);
    
    // Listen for custom auth refresh events
    const handleAuthRefresh = () => {
      console.log('Auth refresh event received');
      handleNavigation();
    };
    
    window.addEventListener('auth-refresh', handleAuthRefresh);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('auth-refresh', handleAuthRefresh);
    };
  }, [user, queryClient]);

  // Force redirect after successful authentication
  useEffect(() => {
    if (userData && !isLoading && window.location.pathname === '/login') {
      console.log('User authenticated, redirecting from login page');
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 50); // Small delay to ensure state is set
    }
  }, [userData, isLoading]);

  // Apply data normalization to all users
  const normalizedUser = userData ? ensureUserDefaults(userData) : null;

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
      
      // Clear any stuck session flags
      sessionStorage.removeItem('loginRedirecting');
      
      // Store auth data persistently and update state immediately
      AuthStorage.setAuthData(enhancedUser);
      setUser(enhancedUser);
      queryClient.setQueryData(['/api/auth/me'], enhancedUser);
      setAuthFailed(false);
      
      // Immediate redirect
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

  // Logout mutation with force clear capability
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Try normal logout first
        return await logoutUser();
      } catch (error) {
        console.warn("Normal logout failed, forcing logout:", error);
        // Force logout regardless of server response
        return { success: true, forced: true };
      }
    },
    onSuccess: (data) => {
      console.log("Logout successful", data?.forced ? "(forced)" : "");
      
      // Complete auth data clearing
      try {
        AuthStorage.clearAuthData();
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies by setting them to expire
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      } catch (e) {
        console.warn("Storage clear error:", e);
      }
      
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      setAuthFailed(false);
      queryClient.clear();
      clearAuthState();
      
      toast({
        title: "Logout successful",
        description: data?.forced ? "Session cleared and logged out" : "You have been logged out",
      });
      
      // Force complete page reload to clear any remaining state
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      // Even if logout fails, clear local data
      try {
        AuthStorage.clearAuthData();
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        queryClient.clear();
        
        toast({
          title: "Forced logout",
          description: "Local session cleared, you can now log in again",
        });
        
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } catch (clearError) {
        toast({
          title: "Logout failed",
          description: "Please refresh the page to clear your session",
          variant: "destructive",
        });
      }
    }
  });

  // Determine authentication state using the stored user state with proper admin detection
  const currentUser = user || normalizedUser;
  const isAuthenticated = !!currentUser && !authFailed;
  const isAdmin = currentUser?.isAdmin || currentUser?.is_admin || false;
  const isSchoolAdmin = currentUser?.isSchoolAdmin || currentUser?.is_school_admin || false;
  const isOwner = currentUser?.isOwner || currentUser?.is_owner || false;

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
        user: currentUser,
        isLoading: false, // Always false - instant auth with persistent storage
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
  console.log('useAuth context:', context)
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