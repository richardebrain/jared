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
  
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", timeframe],
    queryFn: () => {
      // This would fetch from a real API endpoint in production
      // For now, we'll provide static data
      return [
        { id: 1, firstName: "Sarah", lastName: "Johnson", points: 2850, level: 3 },
        { id: 2, firstName: "Michael", lastName: "Chen", points: 2340, level: 3 },
        { id: 3, firstName: "Jessica", lastName: "Williams", points: 1920, level: 2 },
        { id: 4, firstName: "David", lastName: "Garcia", points: 1780, level: 2 },
        { id: 5, firstName: "Emily", lastName: "Taylor", points: 1450, level: 2 }
      ];
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
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-6 text-center font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="ml-3 flex items-center">
                        <div className="bg-muted rounded-full h-8 w-8 flex items-center justify-center mr-3">
                          {rankDetails.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{teacher.firstName} {teacher.lastName}</p>
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