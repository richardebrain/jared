import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { 
  saveAuthState, 
  clearAuthState, 
  getAuthenticatedUser, 
  isAuthenticated as checkIsAuthenticated,
  loginUser,
  logoutUser,
  specialUserFix
} from "@/lib/authHelpers";

interface UseAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState<boolean>(false);
  
  // Query to get the current user
  const { 
    data: user,
    isLoading,
    isError, 
    error 
  } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false, // Don't retry if we get an auth error
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refresh when window gets focus
    refetchOnReconnect: true, // Refresh on reconnect
  });
  
  // Typed user (prevent TypeScript errors)
  let typedUser = user as User | null;
  
  // Apply any special user fixes (particularly for lbook account)
  if (typedUser) {
    typedUser = specialUserFix(typedUser);
    // Update the cache with our modified user
    queryClient.setQueryData(["/api/auth/me"], typedUser);
  }
  
  // Update authentication state based on query results or localStorage fallback
  useEffect(() => {
    // Authorization check functions
    const checkOwner = (userData: any) => {
      // List of usernames or emails that are considered owners
      const ownerUsernames = ['Emma', 'Paije', 'Janiece', 'Krystal', 'jlcookie20'];
      const ownerEmails = ['@raisingarizonapreschool.com'];
      
      // Check for isOwner flag or owner usernames/emails
      return userData.isOwner || 
             ownerUsernames.includes(userData.username) || 
             (userData.email && ownerEmails.some(email => userData.email.includes(email)));
    };
    
    const checkAdmin = (userData: any) => {
      // Admin check includes owners plus any other admin users or isAdmin flag
      return checkOwner(userData) || userData.isAdmin || userData.username === 'admin';
    };
    
    const checkSchoolAdmin = (userData: any) => {
      // Check for isSchoolAdmin flag or being an owner/admin
      return userData.isSchoolAdmin || checkAdmin(userData);
    };
    
    // First check if we got user from the API
    if (user) {
      console.log("User authenticated from API:", user);
      setIsAuthenticated(true);
      
      // Check if user is owner/admin/schoolAdmin
      setIsOwner(checkOwner(user));
      setIsAdmin(checkAdmin(user));
      setIsSchoolAdmin(checkSchoolAdmin(user));
      
      // Update local storage with the latest user data
      saveAuthState(user);
    } 
    // Otherwise check if we have a valid user in localStorage
    else {
      const storedUser = getAuthenticatedUser();
      const isStoredAuthenticated = checkIsAuthenticated();
      
      if (isStoredAuthenticated && storedUser) {
        console.log("Using authenticated user from localStorage:", storedUser);
        queryClient.setQueryData(["/api/auth/me"], storedUser);
        setIsAuthenticated(true);
        
        // Check if user is owner/admin/schoolAdmin
        setIsOwner(checkOwner(storedUser));
        setIsAdmin(checkAdmin(storedUser));
        setIsSchoolAdmin(checkSchoolAdmin(storedUser));
      } else if (isError) {
        console.log("Authentication error from API:", error);
        clearAuthState();
        setIsAuthenticated(false);
        setIsOwner(false);
        setIsAdmin(false);
        setIsSchoolAdmin(false);
      }
    }
  }, [user, isError, error]);
  
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
      
      // Apply special fixes for Laura's account
      const fixedResponse = specialUserFix(response);
      return fixedResponse;
    },
    onSuccess: (data: User) => {
      console.log("Login successful, user data:", data);
      
      // Apply special fixes for specific users
      const enhancedUser = specialUserFix(data);
      
      // Force update authentication state
      queryClient.setQueryData(["/api/auth/me"], enhancedUser);
      setIsAuthenticated(true);
      
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
      console.error("Authentication error in hook:", error);
      setIsAuthenticated(false);
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
      queryClient.setQueryData(["/api/auth/me"], data);
      setIsAuthenticated(true);
      toast({
        title: "Registration successful",
        description: `Welcome to MentorMe, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
      setIsAuthenticated(false);
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account",
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
      queryClient.setQueryData(["/api/auth/me"], null);
      setIsAuthenticated(false);
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
  
  return {
    isLoading,
    isAuthenticated,
    isOwner,
    isAdmin,
    isSchoolAdmin,
    user: typedUser,
    login,
    register,
    logout,
  };
}