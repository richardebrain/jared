import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CORE_VALUES = [
  { name: "Be Consistent", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { name: "Be Prepared", color: "bg-green-100 text-green-800 border-green-300" },
  { name: "Be Committed", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { name: "Be Caring", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { name: "Be Positive", color: "bg-amber-100 text-amber-800 border-amber-300" }
];

export default function CoreValuesShoutOuts() {
  // Fetch all shoutouts
  const { data: shoutouts, isLoading } = useQuery({
    queryKey: ["/api/core-values-shoutouts"],
    refetchOnWindowFocus: false
  });
  
  // Fetch all users for reference
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false
  });
  
  const getUserName = (userId: number) => {
    if (!users) return "Unknown Teacher";
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown Teacher";
  };
  
  const getCoreValueBadge = (coreValue: string) => {
    const value = CORE_VALUES.find(v => v.name.toLowerCase() === coreValue.toLowerCase());
    
    if (!value) {
      return <Badge variant="outline">{coreValue}</Badge>;
    }
    
    return (
      <Badge className={`font-medium ${value.color}`}>
        {value.name}
      </Badge>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Core Values Shout Outs
        </CardTitle>
        <CardDescription>
          Recognize colleagues who exemplify our core values
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : !shoutouts || shoutouts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No shout outs yet!</p>
            <p className="text-sm mt-1">
              Be the first to recognize a colleague who exemplifies our core values.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shoutouts.map((shoutout) => (
              <div key={shoutout.id} className="p-3 border rounded-md hover:bg-accent/5 transition-colors">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">
                    To: {getUserName(shoutout.nomineeId)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(shoutout.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="mb-2">
                  {getCoreValueBadge(shoutout.coreValue)}
                  <span className="text-xs text-muted-foreground ml-2">
                    +{shoutout.pointsAwarded} points
                  </span>
                </div>
                <div className="text-sm">{shoutout.message}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  From: {getUserName(shoutout.nominatorId)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}