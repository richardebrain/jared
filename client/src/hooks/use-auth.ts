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
    onSuccess: () => {
      setIsAuthenticated(true);
    },
    onError: () => {
      setIsAuthenticated(false);
    },
    retry: false, // Don't retry if we get an auth error
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
  
  return {
    isLoading,
    isAuthenticated,
    user: user || null,
    login,
    register,
    logout,
  };
}
