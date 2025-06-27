import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { TeacherAssessmentSummary } from '@/components/ui/teacher-assessment-summary';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Search, 
  Mail,
  Calendar,
  Award,
  BookOpen,
  TrendingUp,
  Clock,
  ArrowLeft,
  Filter,
  Shield,
  ShieldCheck,
  Trash2,
  Key
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface Teacher {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  points: number;
  lifetimePoints: number;
  level: number;
  streak: number;
  lastActive: string;
  createdAt: string;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isOwner: boolean;
  schoolId: number;
  bearBucks: number;
  completedModulesCount?: number;
  assessmentResults?: {
    completed: boolean;
    completedAt?: string;
    accuracyRate?: number;
    totalTimeMinutes?: number;
    topGrowthAreas?: string[];
    overallScore?: number;
    totalQuestions?: number;
    totalCorrect?: number;
  };
}

export default function AdminTeachersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers data with assessment results
  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/users?includeAssessments=true'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, isAdmin, isSchoolAdmin }: { 
      userId: number; 
      isAdmin: boolean; 
      isSchoolAdmin: boolean; 
    }) => {
      return apiRequest(`/api/users/${userId}/role`, {
        method: 'PATCH',
        data: { isAdmin, isSchoolAdmin }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Role Updated",
        description: data.message || "User role has been updated successfully",
      });
      // Refresh the teachers list
      queryClient.invalidateQueries({ queryKey: ['/api/users?includeAssessments=true'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "User Deleted",
        description: data.message || "User has been deleted successfully",
      });
      // Refresh the teachers list
      queryClient.invalidateQueries({ queryKey: ['/api/users?includeAssessments=true'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/reset-user-password`, {
        method: 'POST',
        data: { userId }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: data.message || "Password has been reset and email sent to user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Filter teachers based on search and level
  const filteredTeachers = teachers.filter((teacher: Teacher) => {
    const matchesSearch = 
      teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || teacher.level?.toString() === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getTeacherLevelLabel = (level: number) => {
    if (level >= 5) return 'Master Lead Teacher';
    if (level >= 4) return 'Lead Teacher';
    if (level >= 3) return 'Experienced Teacher';
    if (level >= 2) return 'Teacher';
    return 'Teacher in Training';
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'bg-purple-100 text-purple-800';
    if (level >= 4) return 'bg-blue-100 text-blue-800';
    if (level >= 3) return 'bg-green-100 text-green-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (points: number) => {
    // Calculate progress towards next level (simplified)
    const levelThresholds = [0, 100, 250, 500, 1000, 2000];
    const currentLevel = Math.min(5, Math.floor(points / 100) + 1);
    const nextThreshold = levelThresholds[currentLevel] || 2000;
    const prevThreshold = levelThresholds[currentLevel - 1] || 0;
    
    return Math.min(100, ((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  };

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/director-toolkit">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Toolkit
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Teacher Profiles & Progress</h1>
            <p className="text-muted-foreground">
              Monitor your team's professional development journey
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search teachers by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="1">Teacher in Training</option>
            <option value="2">Teacher</option>
            <option value="3">Experienced Teacher</option>
            <option value="4">Lead Teacher</option>
            <option value="5">Master Lead Teacher</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active This Week</p>
                <p className="text-2xl font-bold">
                  {teachers.filter((t: Teacher) => {
                    if (!t.lastActive) return false;
                    const lastActive = new Date(t.lastActive);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return lastActive >= weekAgo;
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Points</p>
                <p className="text-2xl font-bold">
                  {teachers.length > 0 
                    ? Math.round(teachers.reduce((sum: number, t: Teacher) => sum + (t.points || 0), 0) / teachers.length)
                    : 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lead Teachers</p>
                <p className="text-2xl font-bold">
                  {teachers.filter((t: Teacher) => (t.level || 0) >= 4).length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded" />
                    <div className="w-24 h-3 bg-muted rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full h-3 bg-muted rounded" />
                  <div className="w-3/4 h-3 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teachers found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedLevel !== 'all' 
                ? "Try adjusting your search or filters"
                : "No teachers have been added to your school yet"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher: Teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={teacher.profilePicture} alt={teacher.firstName} />
                    <AvatarFallback>
                      {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{teacher.username}</p>
                    <Badge className={`mt-1 text-xs ${getLevelColor(teacher.level || 1)}`}>
                      {getTeacherLevelLabel(teacher.level || 1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Points:</span>
                    <p className="font-semibold">{teacher.points || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Streak:</span>
                    <p className="font-semibold">{teacher.streak || 0} days</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bear Bucks:</span>
                    <p className="font-semibold">{teacher.bearBucks || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Level:</span>
                    <p className="font-semibold">{teacher.level || 1}</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress to Next Level</span>
                    <span className="font-medium">{Math.round(getProgressPercentage(teacher.points || 0))}%</span>
                  </div>
                  <Progress value={getProgressPercentage(teacher.points || 0)} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last active:</span>
                  </div>
                  <span className="font-medium">{formatLastActive(teacher.lastActive)}</span>
                </div>
                
                {/* Role Status and Management */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    {teacher.isAdmin ? (
                      <Badge variant="default" className="bg-red-100 text-red-800">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Platform Admin
                      </Badge>
                    ) : teacher.isSchoolAdmin ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        <Shield className="h-3 w-3 mr-1" />
                        School Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        Teacher
                      </Badge>
                    )}
                  </div>
                  
                  {/* Role Management Buttons */}
                  <div className="flex gap-2">
                    {!teacher.isSchoolAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoleMutation.mutate({
                          userId: teacher.id,
                          isAdmin: false,
                          isSchoolAdmin: true
                        })}
                        disabled={updateRoleMutation.isPending}
                        className="flex-1"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Make School Admin
                      </Button>
                    )}
                    
                    {!teacher.isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoleMutation.mutate({
                          userId: teacher.id,
                          isAdmin: true,
                          isSchoolAdmin: false
                        })}
                        disabled={updateRoleMutation.isPending}
                        className="flex-1"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Make Platform Admin
                      </Button>
                    )}
                    
                    {(teacher.isAdmin || teacher.isSchoolAdmin) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoleMutation.mutate({
                          userId: teacher.id,
                          isAdmin: false,
                          isSchoolAdmin: false
                        })}
                        disabled={updateRoleMutation.isPending}
                        className="flex-1"
                      >
                        Remove Admin Role
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assessment Results Summary */}
                <TeacherAssessmentSummary assessmentResults={teacher.assessmentResults} />
                
                {/* View Assessment Results Button */}
                {teacher.assessmentResults?.completed && (
                  <div className="pt-2">
                    <Link href={`/admin/teachers/${teacher.id}/assessment-results`}>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                      >
                        <Award className="h-3 w-3 mr-2" />
                        Full Teacher Stats
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Password Reset Button */}
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        disabled={resetPasswordMutation.isPending}
                      >
                        <Key className="h-3 w-3 mr-2" />
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset User Password</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset <strong>{teacher.firstName} {teacher.lastName}</strong>'s password? 
                          A new temporary password will be generated and sent to their email address ({teacher.email}).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetPasswordMutation.mutate(teacher.id)}
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Delete User Button */}
                <div className="pt-2 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        disabled={teacher.isOwner}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{teacher.firstName} {teacher.lastName}</strong>'s account? 
                          This action cannot be undone and will permanently remove all their data, progress, and content.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUserMutation.mutate(teacher.id)}
                          disabled={deleteUserMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}