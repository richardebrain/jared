import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Star, Clock, Building2, ArrowRight, Trophy, Award, Medal, DollarSign, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CommunityModuleProps {
  limit?: number;
}

export default function CommunityModules({ limit = 2 }: CommunityModuleProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewAll, setViewAll] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("topRated");

  // For demo purposes - to show UI even when API connection isn't working
  const demoModules = [
    {
      id: 1,
      module_id: 101,
      title: "Child Development Fundamentals",
      description: "Essential knowledge about developmental milestones and brain development",
      duration: 25,
      average_rating: 4.8,
      school_name: "Bright Beginnings Preschool",
      is_winner: true,
      award_month: "March",
      award_year: "2025",
      award_place: 1
    },
    {
      id: 2,
      module_id: 102,
      title: "Effective Communication with Parents",
      description: "Strategies for building strong relationships with families",
      duration: 20,
      average_rating: 4.5,
      school_name: "Little Scholars Academy",
      is_winner: true,
      award_month: "March",
      award_year: "2025",
      award_place: 2
    },
    {
      id: 3,
      module_id: 103,
      title: "Creating Inclusive Environments",
      description: "Techniques for supporting diversity and accommodating all learning styles",
      duration: 15,
      average_rating: 4.7,
      school_name: "Growing Minds Preschool",
      is_winner: true,
      award_month: "March",
      award_year: "2025",
      award_place: 3
    }
  ];

  // Check authentication status
  const { data: user, isError: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: 1,
    retryDelay: 1000
  });

  // Fetch community modules when user is authenticated
  const { data: communityModules, isLoading, error } = useQuery({
    queryKey: [viewAll ? "/api/community-modules" : "/api/community-modules/top"],
    queryFn: async () => {
      const endpoint = viewAll ? "/api/community-modules" : `/api/community-modules/top?limit=${limit}`;
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!user && !authError,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Show error state when data cannot be fetched
  if (error || (!communityModules && !isLoading)) {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Community Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Unable to load community modules. Please check your connection and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

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
  
  // Helper function to get medal icon based on award place
  const getMedalIcon = (place: number) => {
    switch(place) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md bg-gradient-to-br from-white via-indigo-50/30 to-amber-50/30 border-2 border-amber-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <div className="bg-amber-100 p-1.5 rounded-full mr-2">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <span className="bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
              Community Competition
            </span>
          </CardTitle>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
            May 2025
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          <span>Highly rated modules from our community. Top creators get special prizes!</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="topRated" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 bg-gradient-to-r from-indigo-100 to-amber-100 p-0.5">
            <TabsTrigger value="topRated" className="flex-1 data-[state=active]:bg-white">
              <Star className="h-4 w-4 mr-1.5" /> Top Rated
            </TabsTrigger>
            <TabsTrigger value="marchWinners" className="flex-1 data-[state=active]:bg-white">
              <Medal className="h-4 w-4 mr-1.5" /> Winners Circle
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="topRated" className="mt-0">
            <div className="space-y-3">
              {communityModules.map((module: any, index: number) => (
                <div 
                  key={module.id} 
                  className={`border-2 rounded-md p-3 cursor-pointer transition-all ${
                    index === 0 ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200 hover:shadow-md' : 
                    'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleModuleClick(module.module_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      {index === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                      <h3 className={`font-medium text-base line-clamp-1 ${index === 0 ? 'text-amber-800' : ''}`}>
                        {module.title}
                      </h3>
                    </div>
                    <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-full text-amber-700">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                      <span className="text-sm font-medium">{(parseFloat(module.average_rating) || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mt-1.5">{module.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center text-xs bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-700">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{module.duration} min</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium bg-white">
                      {module.school_name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marchWinners" className="mt-0 relative">
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-gradient-to-br from-amber-200 to-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full rotate-12 border border-amber-300 shadow-sm">
                Results In!
              </div>
            </div>
            
            <div className="space-y-4 mt-2">
              {communityModules
                .filter((module: any) => module.is_winner && module.award_month === "March")
                .sort((a: any, b: any) => a.award_place - b.award_place)
                .map((module: any) => {
                  // Determine background style based on place
                  const bgStyle = module.award_place === 1 
                    ? 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200' 
                    : module.award_place === 2 
                    ? 'bg-gradient-to-r from-slate-100 to-white border-slate-200' 
                    : 'bg-gradient-to-r from-amber-50/50 to-white border-amber-100';
                    
                  return (
                    <div 
                      key={module.id} 
                      className={`border-2 rounded-lg p-3.5 hover:shadow-md cursor-pointer transition-all ${bgStyle}`}
                      onClick={() => handleModuleClick(module.module_id)}
                    >
                      <div className="flex items-start">
                        <div className={`rounded-full p-2.5 mr-3 ${
                          module.award_place === 1 ? 'bg-amber-200' :
                          module.award_place === 2 ? 'bg-slate-200' :
                          'bg-amber-100'
                        }`}>
                          {getMedalIcon(module.award_place)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-base">
                              {module.title.replace(/^Custom Template\s*[-:]\s*/i, '')}
                            </h3>
                            <div className="flex items-center bg-white px-2 py-0.5 rounded-full text-amber-700 border border-amber-100">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                              <span className="text-sm font-medium">{(parseFloat(module.average_rating) || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center text-xs bg-white px-2 py-1 rounded-full text-gray-600 border border-gray-100">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{module.duration} min</span>
                            </div>
                            <Badge 
                              className={`text-xs font-semibold ${
                                module.award_place === 1 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0' 
                                  : module.award_place === 2 
                                  ? 'bg-gradient-to-r from-slate-400 to-slate-300 text-white border-0' 
                                  : 'bg-gradient-to-r from-amber-700 to-amber-600 text-white border-0'
                              }`}
                            >
                              {module.award_place === 1 ? '1st Place: Free Month' : 
                               module.award_place === 2 ? '2nd Place: $100 Gift Card' : 
                               module.award_place === 3 ? '3rd Place: $50 Gift Card' : 
                               `From: ${module.school_name}`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              <div className="text-center mt-4 bg-white rounded-lg p-3 border border-indigo-100">
                <div className="flex justify-center mb-1">
                  {[1, 2, 3].map(place => (
                    <div key={place} className="mx-1">
                      {getMedalIcon(place)}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-indigo-700">March 2025 Competition Winners</p>
                <p className="text-xs text-gray-500 mt-1">Enter your modules for a chance to win in May!</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {communityModules.length > 0 && activeTab === "topRated" && (
          <Button
            variant="default"
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            onClick={() => setLocation('/modules?tab=community')}
          >
            View All Community Modules
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}