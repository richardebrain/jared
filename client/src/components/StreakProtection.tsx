import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Shield, Info, AlertTriangle, Check, Lock, Coins } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StreakProtectionProps {
  className?: string;
}

export default function StreakProtection({ className }: StreakProtectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bearBucks = user?.bearBucks || 0;
  const streakCount = user?.streak || 0;
  
  // State to track protection status (in a real app, this would come from the backend)
  const [protectionActive, setProtectionActive] = useState(false);
  const [protectionExpiresAt, setProtectionExpiresAt] = useState<Date | null>(null);
  
  // Streak protection cost (in Bear Bucks)
  const PROTECTION_COST = 5;
  
  // Mutation to purchase streak protection
  const purchaseProtection = useMutation({
    mutationFn: async () => {
      // In a real implementation, we'd make an actual API call
      // For now, we'll simulate a successful response
      return { success: true };
    },
    onSuccess: (data) => {
      // Update cache for user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Set local state
      setProtectionActive(true);
      
      // Set expiration date (3 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      setProtectionExpiresAt(expiresAt);
      
      toast({
        title: "Streak Protection Activated!",
        description: "Your streak is now protected for 3 days.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Unable to purchase streak protection. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handlePurchaseProtection = () => {
    if (bearBucks < PROTECTION_COST) {
      toast({
        title: "Not Enough Bear Bucks",
        description: `You need ${PROTECTION_COST} Bear Bucks to purchase streak protection.`,
        variant: "destructive",
      });
      return;
    }
    
    purchaseProtection.mutate();
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <Card className={`${className} h-full`}>
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="text-lg flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Streak Protection
        </CardTitle>
        <CardDescription className="text-indigo-100">
          Don't lose your daily login streak!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-5">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="font-medium">Current Streak:</span>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 font-bold">
              {streakCount} Days
            </Badge>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="flex items-start mb-2">
              <Info className="h-4 w-4 text-indigo-700 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-700">
                Streak protection shields your daily streak from being reset if you miss a day of logging in.
              </p>
            </div>
            
            {streakCount >= 3 && (
              <div className="flex items-start mt-3">
                <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  You've maintained your streak for {streakCount} days! Protect your progress.
                </p>
              </div>
            )}
          </div>
          
          {protectionActive ? (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center text-green-700 font-medium mb-1">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Protection Active
              </div>
              <p className="text-sm text-green-600">
                Your streak is protected until {protectionExpiresAt ? formatDate(protectionExpiresAt) : '---'}.
              </p>
              <Progress 
                value={75} 
                className="h-2 mt-2 bg-green-100" 
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium">Cost: {PROTECTION_COST} Bear Bucks</span>
              </div>
              
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={bearBucks < PROTECTION_COST || purchaseProtection.isPending}
                onClick={handlePurchaseProtection}
              >
                {purchaseProtection.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>Purchase Streak Protection</>
                )}
              </Button>
              
              {bearBucks < PROTECTION_COST && (
                <div className="flex items-center mt-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                  Not enough Bear Bucks
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}