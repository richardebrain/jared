import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/lib/simple-auth";
import { SoundManager } from "@/lib/sounds";

type PointsRewardOptions = {
  redirectAfterSuccess?: boolean;
  redirectDelay?: number;
  redirectPath?: string;
  onSuccess?: (data: any) => void;
}

/**
 * Custom hook for handling points rewards and ensuring UI updates
 */
export function usePointsReward(options: PointsRewardOptions = {}) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  
  const {
    redirectAfterSuccess = true,
    redirectDelay = 1500,
    redirectPath = "/dashboard",
    onSuccess
  } = options;
  
  const awardPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const response = await fetch("/api/rewards/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ points }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to award points");
      }
      
      return response.json();
    },
    
    onSuccess: (data) => {
      // Play coin sound when points are earned
      SoundManager.playCoinSound();
      
      // Check if user leveled up and play level up sound
      if (data.levelUp) {
        setTimeout(() => {
          SoundManager.playLevelUpSound();
        }, 500);
      }
      
      // Show success message
      toast({
        title: "Points Added!",
        description: `${data.pointsEarned} points have been added to your account!`,
      });
      
      // Mark that the user has played a game today
      const today = new Date().toDateString();
      localStorage.setItem("lastGamePlayedDate", today);
      
      // Invalidate relevant queries to refresh UI data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/history"] });
      
      // Save points earned for access across page refreshes
      localStorage.setItem("lastPointsEarned", data.pointsEarned.toString());
      
      // Call optional onSuccess callback
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Redirect to dashboard to see updated points
      if (redirectAfterSuccess) {
        setTimeout(() => {
          window.location.href = redirectPath;
        }, redirectDelay);
      }
    },
    
    onError: (error: Error) => {
      // Handle daily limit reached case specially
      if (error.message.includes("already played your daily game")) {
        toast({
          title: "Daily Limit Reached",
          description: "You've already played your daily bonus game. Come back tomorrow!",
          variant: "destructive",
        });
      } else {
        // Generic error message
        toast({
          title: "Error",
          description: error.message || "Could not award points. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
  
  return {
    awardPoints: awardPointsMutation.mutate,
    isPending: awardPointsMutation.isPending,
    isError: awardPointsMutation.isError,
    error: awardPointsMutation.error,
  };
}