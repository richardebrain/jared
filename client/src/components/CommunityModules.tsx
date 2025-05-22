import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Star, Clock, Building2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface CommunityModuleProps {
  limit?: number;
}

export default function CommunityModules({ limit = 2 }: CommunityModuleProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewAll, setViewAll] = useState(false);

  // Check authentication status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch community modules when user is authenticated
  const { data: communityModules, isLoading, error } = useQuery({
    queryKey: [viewAll ? "/api/community-modules" : "/api/community-modules/top"],
    queryFn: async () => {
      const endpoint = viewAll ? "/api/community-modules" : `/api/community-modules/top?limit=${limit}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch community modules');
      }
      return response.json();
    },
    enabled: !!user, // Only run query when user is authenticated
  });

  if (isLoading) {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-500" />
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Community Modules
            </span>
          </CardTitle>
          <CardDescription>
            Training modules shared by other schools
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="h-2 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !communityModules || communityModules.length === 0) {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-500" />
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Community Modules
            </span>
          </CardTitle>
          <CardDescription>
            Training modules shared by other schools
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-center p-4 text-gray-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No community modules available yet</p>
            <p className="text-sm mt-1">Check back soon for training shared by other schools!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleModuleClick = (moduleId: number) => {
    setLocation(`/modules/${moduleId}`);
  };

  const toggleView = () => {
    setViewAll(!viewAll);
  };

  return (
    <Card className="shadow-md bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-blue-500" />
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Community Modules
          </span>
        </CardTitle>
        <CardDescription>
          Training modules shared by other schools
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {communityModules.map((module: any) => (
            <div 
              key={module.id} 
              className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleModuleClick(module.module_id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-base line-clamp-1">{module.title}</h3>
                <div className="flex items-center space-x-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm">{module.average_rating || 0}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-1 mt-1">{module.description}</p>
              <div className="flex justify-between mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{module.duration} min</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  From: {module.school_name}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {communityModules.length > 0 && (
          <Button
            variant="link"
            className="w-full mt-3 text-blue-600"
            onClick={toggleView}
          >
            {viewAll ? "Show Less" : "View All Community Modules"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}