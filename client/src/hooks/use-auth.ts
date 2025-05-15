import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    // Don't rely on callback handlers since they cause TS errors with TanStack Query v5
    retry: false, // Don't retry if we get an auth error
  });
  
  // Update authentication state based on query results
  useEffect(() => {
    if (user) {
      console.log("User authenticated:", user);
      setIsAuthenticated(true);
    } else if (isError) {
      console.log("Authentication error:", error);
      setIsAuthenticated(false);
    }
  }, [user, isError, error]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("Authenticating user:", credentials.username);
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const userData = await response.json();
      console.log("Authentication response:", userData);
      return userData;
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
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return await response.json();
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
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response;
    },
    onSuccess: () => {
      // Clear user data and update authentication state
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Clear any cached auth-dependent queries
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "There was an error logging out",
        variant: "destructive",
      });
    },
  });
  
  const login = async (credentials: { username: string; password: string }): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
  };
  
  const register = async (userData: any): Promise<void> => {
    await registerMutation.mutateAsync(userData);
  };
  
  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };
  
  // Create a correctly typed user object for the return value
  const typedUser: User | null = user ? {
    id: user.id,
    username: user.username,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    language: user.language,
    nativeLanguage: user.nativeLanguage,
    timeZone: user.timeZone,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt
  } : null;

  return {
    isLoading,
    isAuthenticated,
    user: typedUser,
    login,
    register,
    logout,
  };
}
