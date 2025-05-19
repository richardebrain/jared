import React, { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, BarChart3 } from "lucide-react";

// Bob's Daycare dedicated dashboard
export default function BobsDashboard() {
  // Hard-coded Bob's Daycare values
  const BOBS_SCHOOL_ID = "2";
  const BOBS_ADMIN_KEY = "Bigsurf99";
  
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  
  // Set admin credentials on mount
  useEffect(() => {
    localStorage.setItem('adminKey', BOBS_ADMIN_KEY);
    localStorage.setItem('adminAccessGranted', 'true');
    localStorage.setItem('currentSchoolId', BOBS_SCHOOL_ID);
    console.log("Set up Bob's Daycare credentials");
  }, []);
  
  // Get school data
  const { 
    data: schoolData, 
    isLoading: schoolLoading,
    refetch: refetchSchool
  } = useQuery({
    queryKey: ["/api/schools", BOBS_SCHOOL_ID],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_SCHOOL_ID}?adminKey=${encodeURIComponent(BOBS_ADMIN_KEY)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch school data");
      }
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
  
  // Get teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading,
    refetch: refetchTeachers
  } = useQuery({
    queryKey: ["/api/schools", BOBS_SCHOOL_ID, "teachers"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_SCHOOL_ID}/teachers?adminKey=${encodeURIComponent(BOBS_ADMIN_KEY)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch teachers");
      }
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
  
  // Get progress data
  const { 
    data: progressData, 
    isLoading: progressLoading,
    refetch: refetchProgress
  } = useQuery({
    queryKey: ["/api/schools", BOBS_SCHOOL_ID, "progress"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_SCHOOL_ID}/teacher-progress?adminKey=${encodeURIComponent(BOBS_ADMIN_KEY)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch progress data");
      }
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
  
  // Get shout-outs
  const { 
    data: shoutOutsData, 
    isLoading: shoutOutsLoading,
    refetch: refetchShoutOuts
  } = useQuery({
    queryKey: ["/api/schools", BOBS_SCHOOL_ID, "shoutouts"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_SCHOOL_ID}/shoutouts?adminKey=${encodeURIComponent(BOBS_ADMIN_KEY)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch shout-outs");
      }
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle refreshing all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refetchSchool(),
        refetchTeachers(),
        refetchProgress(),
        refetchShoutOuts()
      ]);
      
      toast({
        title: "Data refreshed",
        description: "All dashboard data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show loading state
  if (authLoading || schoolLoading || teachersLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Bob's Daycare dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalPoints = teachersData?.teachers.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
  const averagePoints = teachersData?.teachers.length 
    ? Math.round(totalPoints / teachersData.teachers.length) 
    : 0;
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bob's Daycare Admin Dashboard</h1>
          <p className="text-muted-foreground">
            View teachers, progress, and performance metrics
          </p>
        </div>
        <Button onClick={refreshAllData}>
          Refresh Data
        </Button>
      </div>
      
      {/* School Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Total active teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{teachersData?.teachers.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Points</CardTitle>
            <CardDescription>Earned by all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalPoints}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Average Points</CardTitle>
            <CardDescription>Per teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{averagePoints}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="teachers">
        <TabsList className="mb-4">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="shoutouts">Shout-outs</TabsTrigger>
        </TabsList>
        
        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teachers
              </CardTitle>
              <CardDescription>All teachers at Bob's Daycare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Points</th>
                      <th className="text-left p-2">Level</th>
                      <th className="text-left p-2">Bear Bucks</th>
                      <th className="text-left p-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachersData?.teachers.map(teacher => (
                      <tr key={teacher.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{teacher.firstName} {teacher.lastName}</span>
                          </div>
                        </td>
                        <td className="p-2">{teacher.username}</td>
                        <td className="p-2">{teacher.points || 0}</td>
                        <td className="p-2">{teacher.level || 1}</td>
                        <td className="p-2">{teacher.bearBucks || 0}</td>
                        <td className="p-2">
                          {teacher.lastActive 
                            ? new Date(teacher.lastActive).toLocaleString() 
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                    
                    {(!teachersData?.teachers || teachersData.teachers.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center p-4 text-muted-foreground">
                          No teachers found for Bob's Daycare
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Teacher Progress
              </CardTitle>
              <CardDescription>Course completion and assessment scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {progressData?.progressData.map(progress => (
                  <div key={progress.userId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{progress.fullName}</h3>
                      <Badge variant={progress.completionPercentage > 50 ? "default" : "outline"}>
                        {progress.completionPercentage}% Complete
                      </Badge>
                    </div>
                    <Progress value={progress.completionPercentage} className="h-2 mb-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>Modules: {progress.modulesCompleted}/{progress.totalModules}</div>
                      <div>Last Assessment: {progress.lastAssessment 
                        ? `${progress.lastAssessment.score}%` 
                        : 'Not taken'}</div>
                    </div>
                  </div>
                ))}
                
                {(!progressData?.progressData || progressData.progressData.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground">
                    No progress data found for teachers
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Shout-outs Tab */}
        <TabsContent value="shoutouts">
          <Card>
            <CardHeader>
              <CardTitle>Core Values Shout-outs</CardTitle>
              <CardDescription>Teacher recognitions for demonstrating core values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shoutOutsData?.shoutOuts.map(shoutOut => (
                  <div key={shoutOut.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="capitalize">{shoutOut.coreValue}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(shoutOut.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">{shoutOut.nominee?.fullName || 'Unknown'}</span>
                      <span className="text-muted-foreground"> nominated by </span>
                      <span className="font-medium">{shoutOut.nominator?.fullName || 'Unknown'}</span>
                    </div>
                    <p className="text-muted-foreground">{shoutOut.description}</p>
                  </div>
                ))}
                
                {(!shoutOutsData?.shoutOuts || shoutOutsData.shoutOuts.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground">
                    No shout-outs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Admin Authentication Dialog */}
      <Dialog open={showAdminAuth} onOpenChange={setShowAdminAuth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bob's Daycare Admin Access</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>To view this dashboard, you need admin access for Bob's Daycare.</p>
            <p className="mt-2">The password is automatically set for this dedicated dashboard.</p>
          </div>
          <Button 
            onClick={() => setShowAdminAuth(false)}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}