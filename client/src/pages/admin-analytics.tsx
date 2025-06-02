import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Video,
  Star,
  Clock,
  Award,
  ArrowLeft,
  Play,
  ThumbsUp,
  Calendar,
  Target
} from 'lucide-react';
import { Link } from 'wouter';

interface ModuleAnalytics {
  id: number;
  title: string;
  completions: number;
  averageRating: number;
  totalViews: number;
  averageCompletionTime: number;
  category: string;
}

interface VideoAnalytics {
  id: string;
  title: string;
  views: number;
  rating: number;
  completionRate: number;
  averageWatchTime: number;
  category: string;
}

interface TeacherProgressAnalytics {
  totalTeachers: number;
  activeTeachers: number;
  averageProgress: number;
  completedModules: number;
  averagePoints: number;
  streakUsers: number;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch analytics data
  const { data: moduleAnalytics } = useQuery({
    queryKey: ['/api/analytics/modules', timeRange],
  });

  const { data: videoAnalytics } = useQuery({
    queryKey: ['/api/analytics/videos', timeRange],
  });

  const { data: teacherProgress } = useQuery({
    queryKey: ['/api/analytics/teachers', timeRange],
  });

  const { data: engagementData } = useQuery({
    queryKey: ['/api/analytics/engagement', timeRange],
  });

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
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Staff Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into staff performance, module popularity, and engagement metrics
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: 'all', label: 'All Time' }
          ].map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.value as any)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Teachers</p>
                <p className="text-2xl font-bold">
                  {teacherProgress?.activeTeachers || 0}
                </p>
                <p className="text-xs text-green-600">
                  of {teacherProgress?.totalTeachers || 0} total
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {teacherProgress?.averageProgress || 0}%
                </p>
                <p className="text-xs text-green-600">
                  +5% from last period
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
                <p className="text-sm text-muted-foreground">Modules Completed</p>
                <p className="text-2xl font-bold">
                  {teacherProgress?.completedModules || 0}
                </p>
                <p className="text-xs text-blue-600">
                  This period
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Points</p>
                <p className="text-2xl font-bold">
                  {teacherProgress?.averagePoints || 0}
                </p>
                <p className="text-xs text-yellow-600">
                  Per teacher
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Module Analytics</TabsTrigger>
          <TabsTrigger value="videos">Video Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Metrics</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        {/* Module Analytics Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Most Popular Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moduleAnalytics?.slice(0, 5).map((module: ModuleAnalytics, index: number) => (
                  <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-muted-foreground">{module.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{module.completions}</p>
                        <p className="text-muted-foreground">Completions</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{module.averageRating?.toFixed(1)}</span>
                        </div>
                        <p className="text-muted-foreground">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{Math.round(module.averageCompletionTime)}m</p>
                        <p className="text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Performance Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Top Performing Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {videoAnalytics?.slice(0, 5).map((video: VideoAnalytics, index: number) => (
                  <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{video.title}</h4>
                        <p className="text-sm text-muted-foreground">{video.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">{video.views}</span>
                        </div>
                        <p className="text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{video.completionRate}%</p>
                        <p className="text-muted-foreground">Completion</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">{video.rating?.toFixed(1)}</span>
                        </div>
                        <p className="text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Metrics Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">{engagementData?.dailyActiveUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Average daily logins</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goal Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">{engagementData?.goalCompletionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Teachers meeting goals</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{engagementData?.weeklyLogins || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Logins</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{engagementData?.weeklyCompletions || 0}</p>
                  <p className="text-sm text-muted-foreground">Completions</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{engagementData?.weeklyPoints || 0}</p>
                  <p className="text-sm text-muted-foreground">Points Earned</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{engagementData?.averageSessionTime || 0}m</p>
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tracking Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Teacher Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Beginning Teachers (Level 1-2)</span>
                  <Badge variant="outline">3 teachers</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Developing Teachers (Level 3-4)</span>
                  <Badge variant="outline">2 teachers</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Advanced Teachers (Level 5+)</span>
                  <Badge variant="outline">2 teachers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Up to Date</span>
                  <Badge className="bg-green-100 text-green-800">4 teachers</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expiring Soon (30 days)</span>
                  <Badge className="bg-yellow-100 text-yellow-800">2 teachers</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Requires Renewal</span>
                  <Badge className="bg-red-100 text-red-800">1 teacher</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}