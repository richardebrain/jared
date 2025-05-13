import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Crown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";

// Interfaces
interface LeaderboardEntry {
  id: number;
  userId: number;
  points: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    level: number;
  };
}

export default function Leaderboard() {
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "allTime">("month");
  
  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", timeFrame],
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  return (
    <Card className="border-2 border-primary/20 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-100/40 to-primary/10 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-heading">Leaderboard</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/80 font-medium">
            Top Teachers
          </Badge>
        </div>
        <CardDescription>See who's earning the most points</CardDescription>
        
        <Tabs defaultValue="month" className="mt-2" onValueChange={(value) => setTimeFrame(value as any)}>
          <TabsList className="grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-muted">
            {/* Always show at least placeholder entries if no data */}
            {(!leaderboardData || leaderboardData.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No leaderboard data available yet</p>
                <p className="text-xs mt-1">Complete activities to earn points and appear here!</p>
              </div>
            ) : (
              leaderboardData.map((entry: LeaderboardEntry, index: number) => (
                <div 
                  key={entry.userId} 
                  className={cn(
                    "flex items-center p-3 hover:bg-muted/30 transition-colors",
                    index === 0 && "bg-amber-50",
                    index === 1 && "bg-neutral-50",
                    index === 2 && "bg-orange-50/50",
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center h-7 w-7 mr-2">
                    {index === 0 ? (
                      <Crown className="h-5 w-5 text-amber-500" />
                    ) : index === 1 ? (
                      <Medal className="h-5 w-5 text-neutral-500" />
                    ) : index === 2 ? (
                      <Award className="h-5 w-5 text-orange-400" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Profile */}
                  <div className="flex items-center flex-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 overflow-hidden">
                      {entry.user.profilePicture ? (
                        <img src={entry.user.profilePicture} alt={`${entry.user.firstName}'s profile`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-primary">
                          {entry.user.firstName.charAt(0)}{entry.user.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm line-clamp-1">
                        {entry.user.firstName} {entry.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary/60 mr-1"></span>
                        Level {entry.user.level}
                      </div>
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div className="font-bold text-sm">
                    <span className={cn(
                      "text-primary",
                      index === 0 && "text-amber-600",
                      index === 1 && "text-neutral-600",
                      index === 2 && "text-orange-500",
                    )}>
                      {entry.points}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Footer with tip */}
        <div className="bg-muted/20 p-2 text-center">
          <p className="text-xs text-muted-foreground italic">
            Complete trainings and daily activities to earn more points!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}