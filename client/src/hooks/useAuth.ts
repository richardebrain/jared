import { useQuery } from "@tanstack/react-query";

export function useSimpleAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false, // Don't retry auth errors
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}