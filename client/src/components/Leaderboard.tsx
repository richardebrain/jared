import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define teacher ranks and their icons
const TEACHER_RANKS = [
  { icon: <Trophy className="h-5 w-5 text-amber-500" />, name: "Master Lead Teacher" },
  { icon: <Medal className="h-5 w-5 text-indigo-500" />, name: "Senior Teacher" },
  { icon: <Award className="h-5 w-5 text-emerald-500" />, name: "Lead Teacher" }
];

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week");
  
  // Get current user data from auth context or query
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    // Don't retry if unauthorized (user not logged in)
    retry: (failureCount, error: any) => error?.status !== 401 && failureCount < 3
  });
  
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Fetch leaderboard data
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const users = await response.json();
      
      // Process users for display - include all users, even those with 0 points
      const filteredUsers = users
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points || 0,
          level: user.level || (user.points && user.points > 2000 ? 3 : user.points > 1000 ? 2 : 1),
          isCurrentUser: user.isCurrentUser || false
        }));
        
      return filteredUsers;
    },
  });
  
  // Get rank icon and name based on level
  const getRankDetails = (level: number) => {
    if (level >= 3) return TEACHER_RANKS[0]; // Master Lead Teacher
    if (level >= 2) return TEACHER_RANKS[1]; // Senior Teacher
    return TEACHER_RANKS[2]; // Lead Teacher
  };

  return (
    <Card className="border border-purple-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-3">
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-purple-500 mr-2" />
          <CardTitle className="text-lg">Leaderboard</CardTitle>
        </div>
        <CardDescription>See how you rank among your peers</CardDescription>
        
        <div className="flex mt-2 space-x-2">
          <Badge 
            variant={timeframe === "week" ? "default" : "outline"} 
            className={timeframe === "week" ? "" : "hover:bg-muted cursor-pointer"}
            onClick={() => setTimeframe("week")}
          >
            This Week
          </Badge>
          <Badge 
            variant={timeframe === "month" ? "default" : "outline"} 
            className={timeframe === "month" ? "" : "hover:bg-muted cursor-pointer"}
            onClick={() => setTimeframe("month")}
          >
            This Month
          </Badge>
          <Badge 
            variant={timeframe === "all" ? "default" : "outline"} 
            className={timeframe === "all" ? "" : "hover:bg-muted cursor-pointer"}
            onClick={() => setTimeframe("all")}
          >
            All Time
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData && leaderboardData.length > 0 ? (
              leaderboardData.map((teacher, index) => {
                const rankDetails = getRankDetails(teacher.level);
                
                return (
                  <div 
                    key={teacher.id}
                    className={`flex items-center justify-between p-2 rounded-md border 
                      ${teacher.isCurrentUser 
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300" 
                        : "bg-card hover:bg-accent/10"} transition-colors`}
                  >
                    <div className="flex items-center">
                      <div className="w-6 text-center font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="ml-3 flex items-center">
                        <div className="bg-muted rounded-full h-8 w-8 flex items-center justify-center mr-3">
                          {rankDetails.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <p className="text-sm font-medium">{teacher.firstName} {teacher.lastName}</p>
                            {teacher.isCurrentUser && (
                              <span className="ml-2 text-[10px] rounded-full bg-purple-500 text-white px-1.5 py-0.5">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{rankDetails.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">{teacher.points}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No leaderboard data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}