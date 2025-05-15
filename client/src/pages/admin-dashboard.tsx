import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Users, 
  CheckCircle, 
  RotateCcw, 
  ShieldAlert, 
  BookOpen, 
  Heart, 
  Crown, 
  Medal,
  Star,
  ChevronRight,
  Search,
  UserX,
  TrendingUp
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';

/**
 * Admin Dashboard Component
 * 
 * This page provides administrators with tools to:
 * - View all users and their progress
 * - Reset points and progress for users
 * - View aggregate statistics and metrics
 * - Manage Core Values shout-outs
 */
export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Fetch all core values shout-outs
  const { data: shoutOuts = [], isLoading: shoutOutsLoading } = useQuery({
    queryKey: ['/api/core-values/all'],
    enabled: !!user,
  });

  // Reset user points mutation
  const resetPointsMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('/api/admin/reset-user-points', {
        method: 'POST',
        data: { userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Points Reset",
        description: "User points have been reset successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error resetting points:', error);
      toast({
        title: "Error",
        description: "Failed to reset user points. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reset user progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('/api/admin/reset-user-progress', {
        method: 'POST',
        data: { userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Progress Reset",
        description: "User progress has been reset successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error resetting progress:', error);
      toast({
        title: "Error",
        description: "Failed to reset user progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate statistics
  const totalUsers = users.length;
  const totalPoints = users.reduce((sum: number, user: any) => sum + (user.points || 0), 0);
  const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
  const totalShoutOuts = shoutOuts.length;

  // Get top users by points
  const topUsers = [...users]
    .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  // Handle reset confirmations
  const handleResetPoints = (userId: number) => {
    resetPointsMutation.mutate(userId);
    setSelectedUser(null);
  };

  const handleResetProgress = (userId: number) => {
    resetProgressMutation.mutate(userId);
    setSelectedUser(null);
  };

  if (usersLoading) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <ShieldAlert className="h-12 w-12 text-muted-foreground animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loading Admin Dashboard</h3>
                <p className="text-muted-foreground">Please wait while we load the dashboard data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, track progress, and monitor system health.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-1">
            <ChevronRight className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active teachers in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Points earned across all users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePoints}</div>
            <p className="text-xs text-muted-foreground">
              Average points per teacher
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shout-outs</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShoutOuts}</div>
            <p className="text-xs text-muted-foreground">
              Core Values recognitions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="shoutouts">Core Values Shout-outs</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">User</th>
                      <th className="p-2 text-left font-medium">Points</th>
                      <th className="p-2 text-left font-medium">Level</th>
                      <th className="p-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.profilePicture || undefined} alt={user.firstName} />
                              <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-primary">
                            {user.points || 0} pts
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge>
                            Level {user.level || 1}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reset Points
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Points</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset points for {user.firstName} {user.lastName}? 
                                    This will set their points to zero.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetPoints(user.id)}
                                  >
                                    Reset Points
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  Reset Progress
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset All Progress</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset all progress for {user.firstName} {user.lastName}? 
                                    This will remove all module progress, reset points to zero, and reset their streak.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetProgress(user.id)}
                                  >
                                    Reset All Progress
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Top teachers by points earned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topUsers.map((user: any, index: number) => (
                  <div key={user.id} className="flex items-center">
                    <div className="flex items-center justify-center w-10">
                      {index === 0 ? (
                        <Crown className="h-6 w-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-6 w-6 text-slate-400" />
                      ) : index === 2 ? (
                        <Medal className="h-6 w-6 text-amber-700" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profilePicture || undefined} alt={user.firstName} />
                            <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium leading-none">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Sparkles className="mr-1 h-4 w-4 text-primary" />
                          <p className="text-sm font-bold">{user.points || 0}</p>
                        </div>
                      </div>
                      <Progress value={(user.points / (topUsers[0]?.points || 100)) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Core Values Shout-outs Tab */}
        <TabsContent value="shoutouts">
          <Card>
            <CardHeader>
              <CardTitle>Core Values Shout-outs</CardTitle>
              <CardDescription>
                Review all Core Values recognitions in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shoutOutsLoading ? (
                <div className="py-8 text-center">
                  <p>Loading shout-outs...</p>
                </div>
              ) : shoutOuts.length === 0 ? (
                <Alert>
                  <AlertTitle>No shout-outs yet</AlertTitle>
                  <AlertDescription>
                    There are no Core Values shout-outs in the system yet. Users can recognize each other for demonstrating core values.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {shoutOuts.map((shoutOut: any) => {
                    const nominator = users.find((u: any) => u.id === shoutOut.nominatorId);
                    const nominee = users.find((u: any) => u.id === shoutOut.nomineeId);
                    
                    return (
                      <Card key={shoutOut.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={nominee?.profilePicture || undefined} alt={nominee?.firstName} />
                                <AvatarFallback>{nominee?.firstName?.charAt(0) || '?'}{nominee?.lastName?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Badge className="mb-2">{shoutOut.coreValue}</Badge>
                                  <h4 className="text-sm font-semibold">
                                    {nominee?.firstName} {nominee?.lastName} was recognized by {nominator?.firstName} {nominator?.lastName}
                                  </h4>
                                </div>
                                <div>
                                  <Badge variant="outline" className="text-primary">
                                    +{shoutOut.pointsAwarded} pts
                                  </Badge>
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {shoutOut.description}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {new Date(shoutOut.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}