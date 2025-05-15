import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface UseAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
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
  const typedUser = user as User | null;
  
  // Update authentication state based on query results or localStorage fallback
  useEffect(() => {
    // Check localStorage first on component mount
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    console.log("Checking auth state - localStorage auth:", storedAuth);
    console.log("Checking auth state - localStorage user:", storedUser);
    
    if (user) {
      console.log("User authenticated from API:", user);
      setIsAuthenticated(true);
      // Update localStorage in case it's missing
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
    } else if (storedAuth === 'true' && storedUser) {
      console.log("Found user in localStorage, using as fallback");
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed localStorage user:", parsedUser);
        queryClient.setQueryData(["/api/auth/me"], parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
      }
    } else if (isError) {
      console.log("Authentication error from API:", error);
      setIsAuthenticated(false);
    }
  }, [user, isError, error]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("Attempting login with:", { username: credentials.username, password: "***" });
      const response = await apiRequest("/api/auth/login", { 
        method: "POST", 
        data: credentials 
      });
      console.log("Login response:", response);
      return response;
    },
    onSuccess: (data: User) => {
      console.log("Authentication successful in hook, updating state");
      // Force update authentication state
      queryClient.setQueryData(["/api/auth/me"], data);
      setIsAuthenticated(true);
      
      // Force invalidate any queries that might depend on auth status
      queryClient.invalidateQueries();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Authentication error in hook:", error);
      setIsAuthenticated(false);
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
      const response = await apiRequest("/api/auth/logout", { 
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      console.log("Logout successful");
      // Clear the user from the cache
      queryClient.setQueryData(["/api/auth/me"], null);
      setIsAuthenticated(false);
      // Clear any cached queries when logging out
      queryClient.clear();
      
      // Clear localStorage authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
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
    user: typedUser,
    login,
    register,
    logout,
  };
}