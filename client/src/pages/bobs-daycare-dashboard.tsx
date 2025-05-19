import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Bob's Daycare Dashboard - Dedicated version with fixed school ID
export default function BobsDaycareDashboard() {
  // Directly use Bob's Daycare school ID (2)
  const BOBS_DAYCARE_ID = "2";
  const adminKey = "Bigsurf99"; // Direct admin access
  
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Set Bob's Daycare admin keys for this session
  useEffect(() => {
    localStorage.setItem('adminKey', adminKey);
    localStorage.setItem('adminAccessGranted', 'true');
    localStorage.setItem('currentSchoolId', BOBS_DAYCARE_ID);
    console.log("Set up dedicated Bob's Daycare admin dashboard - School ID:", BOBS_DAYCARE_ID);
  }, []);
  
  // Get school data with admin key
  const { 
    data: schoolData, 
    isLoading: schoolLoading,
    refetch: refetchSchool
  } = useQuery({
    queryKey: ["/api/schools", BOBS_DAYCARE_ID],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_DAYCARE_ID}?adminKey=${encodeURIComponent(adminKey)}`
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
  
  // Get school teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading,
    refetch: refetchTeachers
  } = useQuery({
    queryKey: ["/api/schools", BOBS_DAYCARE_ID, "teachers"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_DAYCARE_ID}/teachers?adminKey=${encodeURIComponent(adminKey)}`
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
  
  // Get teacher progress
  const { 
    data: progressData, 
    isLoading: progressLoading,
    refetch: refetchProgress
  } = useQuery({
    queryKey: ["/api/schools", BOBS_DAYCARE_ID, "progress"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_DAYCARE_ID}/teacher-progress?adminKey=${encodeURIComponent(adminKey)}`
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
  
  // Get employee of the month / shout-outs data
  const { 
    data: shoutOutsData, 
    isLoading: shoutOutsLoading,
    refetch: refetchShoutOuts
  } = useQuery({
    queryKey: ["/api/schools", BOBS_DAYCARE_ID, "shoutouts"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${BOBS_DAYCARE_ID}/shoutouts?adminKey=${encodeURIComponent(adminKey)}`
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
          <p className="text-muted-foreground">Loading Bob's Daycare data...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return null;
  }
  
  // Calculate total points and average
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
            View teachers, progress, and performance metrics.
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
              <CardTitle>Bob's Daycare Teachers</CardTitle>
              <CardDescription>View all teachers and their stats</CardDescription>
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
                        <td className="p-2">{teacher.firstName} {teacher.lastName}</td>
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
                          No teachers found
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
              <CardTitle>Teacher Progress</CardTitle>
              <CardDescription>Course completion and assessment scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Teacher</th>
                      <th className="text-left p-2">Modules Completed</th>
                      <th className="text-left p-2">Completion %</th>
                      <th className="text-left p-2">Last Assessment</th>
                      <th className="text-left p-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData?.progressData.map(progress => (
                      <tr key={progress.userId} className="border-b hover:bg-muted/50">
                        <td className="p-2">{progress.fullName}</td>
                        <td className="p-2">
                          {progress.modulesCompleted} / {progress.totalModules}
                        </td>
                        <td className="p-2">{progress.completionPercentage}%</td>
                        <td className="p-2">
                          {progress.lastAssessment 
                            ? `${progress.lastAssessment.score}% (${new Date(progress.lastAssessment.completedAt).toLocaleDateString()})`
                            : 'Not taken'}
                        </td>
                        <td className="p-2">
                          {progress.lastActive 
                            ? new Date(progress.lastActive).toLocaleString() 
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                    
                    {(!progressData?.progressData || progressData.progressData.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center p-4 text-muted-foreground">
                          No progress data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Teacher</th>
                      <th className="text-left p-2">Nominated By</th>
                      <th className="text-left p-2">Core Value</th>
                      <th className="text-left p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoutOutsData?.shoutOuts.map(shoutOut => (
                      <tr key={shoutOut.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {new Date(shoutOut.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">{shoutOut.nominee?.fullName || 'Unknown'}</td>
                        <td className="p-2">{shoutOut.nominator?.fullName || 'Unknown'}</td>
                        <td className="p-2 capitalize">{shoutOut.coreValue}</td>
                        <td className="p-2 max-w-xs truncate">{shoutOut.description}</td>
                      </tr>
                    ))}
                    
                    {(!shoutOutsData?.shoutOuts || shoutOutsData.shoutOuts.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center p-4 text-muted-foreground">
                          No shout-outs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}