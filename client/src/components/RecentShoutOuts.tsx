import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CORE_VALUES = [
  { name: "Be Consistent", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { name: "Be Prepared", color: "bg-green-100 text-green-800 border-green-300" },
  { name: "Be Committed", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { name: "Be Caring", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { name: "Be Positive", color: "bg-amber-100 text-amber-800 border-amber-300" }
];

export default function RecentShoutOuts() {
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
  
  // Get only the 4 most recent shout outs
  const recentShoutouts = shoutouts && Array.isArray(shoutouts) 
    ? shoutouts.slice(0, 4) 
    : [];
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Recent Core Values Shout Outs
        </CardTitle>
        <CardDescription>
          See who's living our core values
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
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
        ) : !recentShoutouts || recentShoutouts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No shout outs yet!</p>
            <p className="text-sm mt-1">
              Be the first to recognize a colleague who exemplifies our core values.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentShoutouts.map((shoutout) => (
              <div key={shoutout.id} className="p-4 border rounded-md hover:bg-accent/5 transition-colors">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-base">
                    To: {getUserName(shoutout.nomineeId)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(shoutout.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="mb-3">
                  {getCoreValueBadge(shoutout.coreValue)}
                  <span className="text-xs text-muted-foreground ml-2">
                    +{shoutout.pointsAwarded} points
                  </span>
                </div>
                
                <div className="bg-accent/10 p-3 rounded-md mb-3 text-sm italic border-l-4 border-accent">
                  "{shoutout.description || shoutout.message}"
                </div>
                
                <div className="flex items-center justify-end text-sm font-medium mt-2">
                  From: <span className="text-primary ml-1">{getUserName(shoutout.nominatorId)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4">
          <Link to="/core-values-shout-out">
            <Button className="w-full">
              <Award className="mr-2 h-4 w-4" />
              See All Shout Outs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-center text-sm text-muted-foreground">
        Celebrate our core values with your colleagues
      </CardFooter>
    </Card>
  );
}