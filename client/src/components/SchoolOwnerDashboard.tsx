import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  BarChart3, 
  Award, 
  GraduationCap, 
  Mail, 
  Settings,
  Building2,
  TrendingUp
} from 'lucide-react';
import NewSchoolOwnerWelcome from './NewSchoolOwnerWelcome';

export default function SchoolOwnerDashboard() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  // Get school data
  const { data: schoolData, isLoading: schoolLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}`],
    enabled: !!schoolId,
  });

  // Get school teachers
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}/teachers`],
    enabled: !!schoolId,
  });

  // Get teacher progress
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}/progress`],
    enabled: !!schoolId,
  });

  const teacherCount = teachersData?.count || 0;
  const isNewSchoolOwner = teacherCount === 0;
  const schoolName = schoolData?.school?.name || "Your School";
  const hasCompletedSetup = !!(schoolData?.school?.name && schoolData?.school?.contactEmail);

  if (isNewSchoolOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NewSchoolOwnerWelcome 
          schoolName={schoolName}
          teacherCount={teacherCount}
          hasCompletedSetup={hasCompletedSetup}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">School Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to {schoolName}. Here's an overview of your school's activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachersLoading ? "..." : teacherCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active staff in your school
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressLoading ? "..." : 
                progressData?.progressData?.length > 0 
                  ? Math.round(progressData.progressData.reduce((sum, t) => sum + t.completionPercentage, 0) / progressData.progressData.length) + "%" 
                  : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average module completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachersLoading ? "..." : 
                teachersData?.teachers?.filter(t => {
                  if (!t.lastActive) return false;
                  const lastActive = new Date(t.lastActive);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return lastActive > weekAgo;
                }).length || 0
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Teachers active recently
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolLoading ? "..." : 
                schoolData?.school?.subscriptionActive ? "Active" : 
                schoolData?.school?.isFreeAccess ? "Free Access" : "Inactive"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {schoolData?.school?.subscriptionType || "Not subscribed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Invite Teachers
            </CardTitle>
            <CardDescription>
              Send email invitations to new teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/invite-teachers">
                <Mail className="w-4 h-4 mr-2" />
                Invite Teachers
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              School Settings
            </CardTitle>
            <CardDescription>
              Manage school information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/school-settings">
                <Settings className="w-4 h-4 mr-2" />
                Manage Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              ECE Tracking
            </CardTitle>
            <CardDescription>
              Monitor professional development hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/school-ece-tracking">
                <GraduationCap className="w-4 h-4 mr-2" />
                View ECE Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teachersLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading recent activity...
            </div>
          ) : teachersData?.teachers?.length > 0 ? (
            <div className="space-y-4">
              {teachersData.teachers.slice(0, 5).map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                      <div className="text-sm text-muted-foreground">
                        Last active: {teacher.lastActive 
                          ? new Date(teacher.lastActive).toLocaleDateString() 
                          : "Never"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Level {teacher.level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No recent activity to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 