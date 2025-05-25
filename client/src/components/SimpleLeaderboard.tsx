import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

// Define teacher ranks and their icons
const TEACHER_RANKS = [
  {
    icon: <Trophy className="h-5 w-5 text-amber-500" />,
    name: "Master Lead Teacher",
  },
  {
    icon: <Medal className="h-5 w-5 text-indigo-500" />,
    name: "Senior Teacher",
  },
  {
    icon: <Award className="h-5 w-5 text-emerald-500" />,
    name: "Lead Teacher",
  },
];

export default function SimpleLeaderboard({teachers,userId,isLoading}:{ teachers?: any[], userId: number,isLoading?: boolean }) {
  const [timeframe, setTimeframe] = React.useState("all");
  // const { user } = useAuth();

  // // Fetch all users for the leaderboard
  // const { data: teachers, isLoading } = useQuery({
  //   queryKey: ["/api/users"],
  //   refetchOnWindowFocus: false,
  //   select: (data) => {
  //     // Ensure we always have an array to work with
  //     return Array.isArray(data) ? data : [];
  //   },
  // });

  // Get rank icon and name based on level
  const getRankDetails = (level: number) => {
    if (level >= 3) return TEACHER_RANKS[0]; // Master Lead Teacher
    if (level >= 2) return TEACHER_RANKS[1]; // Senior Teacher
    return TEACHER_RANKS[2]; // Lead Teacher
  };

  // Sort teachers by points in descending order
  const sortedTeachers = React.useMemo(() => {
    if (!teachers) return [];

    return [...teachers].sort((a, b) => {
      const pointsA = a.points || 0;
      const pointsB = b.points || 0;
      return pointsB - pointsA;
    });
  }, [teachers]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Teacher Leaderboard</CardTitle>
        <CardDescription>
          See how your training progress compares to other teachers.
        </CardDescription>
        <div className="flex space-x-2 mt-2">
          <Badge
            variant={timeframe === "week" ? "default" : "outline"}
            className={
              timeframe === "week" ? "" : "hover:bg-muted cursor-pointer"
            }
            onClick={() => setTimeframe("week")}
          >
            This Week
          </Badge>
          <Badge
            variant={timeframe === "month" ? "default" : "outline"}
            className={
              timeframe === "month" ? "" : "hover:bg-muted cursor-pointer"
            }
            onClick={() => setTimeframe("month")}
          >
            This Month
          </Badge>
          <Badge
            variant={timeframe === "all" ? "default" : "outline"}
            className={
              timeframe === "all" ? "" : "hover:bg-muted cursor-pointer"
            }
            onClick={() => setTimeframe("all")}
          >
            All Time
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : sortedTeachers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No teachers found
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTeachers.map((teacher, index) => {
              const rankDetails = getRankDetails(teacher?.level || 1);
              const isCurrentUser = userId && userId === teacher?.id;

              return (
                <div
                  key={teacher?.id}
                  className={`flex items-center justify-between p-2 rounded-md border 
                    ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300"
                        : "bg-card hover:bg-accent/10"
                    } transition-colors`}
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
                          <p className="text-sm font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] rounded-full bg-purple-500 text-white px-1.5 py-0.5">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rankDetails.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold">{teacher.points || 0}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
