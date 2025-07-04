import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useRewardCurrency } from '@/hooks/useRewardCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  User,
  Target,
  Award,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Star,
  Clock,
  Trophy,
  Calendar,
  GraduationCap,
  CoinsIcon,
  DollarSign,
  Minus,
  RotateCcw
} from 'lucide-react';

interface TeacherAssessmentData {
  success: boolean;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    jobTitle: string;
  };
  assessment: {
    id: number;
    completedAt: string;
    totalQuestions: number;
    score: number;
  };
  results: {
    overallScore: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracyRate: number;
    domainBreakdown: Array<{
      domainId: number;
      domainName: string;
      totalQuestions: number;
      correctAnswers: number;
      accuracyRate: number;
      strengthLevel: 'strength' | 'neutral' | 'growth';
    }>;
  };
}

interface ActivitySummary {
  firstName?: string;
  lastName?: string;
  email?: string;
  completedModules: Array<{
    moduleId: number;
    moduleTitle: string;
    pointsEarned: number;
    finalScore: number;
    lastAccessed: string;
    eceHours: number;
    eceCategory: string;
    moduleCategory: string;
    difficulty: string;
  }>;
  eceHoursSummary: Array<{
    category: string;
    totalMinutes: number;
    completionCount: number;
  }>;
  gameCompletions: Array<{
    gameId: number;
    gameTitle: string;
    score: number;
    pointsEarned: number;
    completedAt: string;
    gameCategory: string;
    gameDifficulty: string;
  }>;
  pointsBreakdown: {
    modulePoints: number;
    gamePoints: number;
    assessmentPoints: number;
    currentPoints: number;
    lifetimePoints: number;
    bearBucks: number;
  };
  assessmentHistory: Array<{
    type: string;
    overallScore: number;
    completedAt: string;
    status: string;
  }>;
}

export default function AdminTeacherAssessmentResultsSimple() {
  const { user, isAuthenticated, isSchoolAdmin, isAdmin, isOwner } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ teacherId: string }>();
  const queryClient = useQueryClient();
  const { currencyName } = useRewardCurrency();
  const [adjustAmount, setAdjustAmount] = useState<number>(-1);
  
  const teacherId = params?.teacherId;
  const hasAdminAccess = isAuthenticated && (isSchoolAdmin || isAdmin || isOwner);

  // Bear Bucks Management Mutations
  const cashOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/bear-bucks/cash-out/${teacherId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Cash Out Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/teachers/${teacherId}/activity-summary`] });
    },
    onError: (error: any) => {
      toast({
        title: "Cash Out Failed",
        description: error.message || `Failed to cash out ${currencyName}`,
        variant: "destructive",
      });
    }
  });

  const zeroOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/bear-bucks/zero-out/${teacherId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Zero Out Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/teachers/${teacherId}/activity-summary`] });
    },
    onError: (error: any) => {
      toast({
        title: "Zero Out Failed",
        description: error.message || `Failed to zero out ${currencyName}`,
        variant: "destructive",
      });
    }
  });

  const adjustMutation = useMutation({
    mutationFn: async (adjustment: number) => {
      return await apiRequest(`/api/admin/bear-bucks/adjust/${teacherId}`, {
        method: 'POST',
        data: { adjustment }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Adjustment Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/teachers/${teacherId}/activity-summary`] });
      setAdjustAmount(-1); // Reset to default
    },
    onError: (error: any) => {
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust Bear Bucks",
        variant: "destructive",
      });
    }
  });

  const { data, isLoading, error } = useQuery<TeacherAssessmentData>({
    queryKey: [`/api/admin/teachers/${teacherId}/assessment-results`],
    enabled: !!teacherId && hasAdminAccess,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch comprehensive activity summary
  const { data: activitySummary, isLoading: activityLoading } = useQuery<ActivitySummary>({
    queryKey: [`/api/admin/teachers/${teacherId}/activity-summary`],
    enabled: !!teacherId && hasAdminAccess,
    staleTime: 1000 * 60 * 2,
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getDomainColor = (strengthLevel: string) => {
    switch (strengthLevel) {
      case 'strength':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'growth':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Auth checks
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in</h2>
          <p>You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access denied</h2>
          <p>Admin privileges required to view teacher assessment results.</p>
        </div>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid request</h2>
          <p>Teacher ID not provided.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading assessment results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle both cases: no assessment data and other errors
  const hasAssessmentData = data && data.success;
  const isAssessmentNotCompleted = error && (error.message?.includes('404') || error.message?.includes('No completed assessment'));
  
  if (error && !isAssessmentNotCompleted) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Teachers
            </Button>
          </Link>
        </div>
        
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground">
              Failed to load teacher information. Please try again.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Extract teacher data from either source
  const teacher = hasAssessmentData ? data!.teacher : null;
  const assessment = hasAssessmentData ? data!.assessment : null;
  const results = hasAssessmentData ? data!.results : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/teachers">
          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Teachers
          </Button>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {teacher ? `${teacher.firstName} ${teacher.lastName}` : 
                 activitySummary ? `${activitySummary.firstName || ''} ${activitySummary.lastName || ''}` : 
                 `Teacher #${teacherId}`}
              </h1>
              <p className="text-gray-600">
                {teacher ? `${teacher.jobTitle} • ${teacher.email}` : 
                 activitySummary ? `${activitySummary.email}` : 
                 'Full Teacher Stats'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Comprehensive Teacher Profile Information */}
        {(teacher || activitySummary) && (
          <Card className="mt-6 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Teacher Profile & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Full Name</label>
                      <p className="font-medium">
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : 
                         activitySummary ? `${activitySummary.firstName} ${activitySummary.lastName}` : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Email</label>
                      <p className="font-medium">
                        {teacher?.email || activitySummary?.email || 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Username</label>
                      <p className="font-medium">@{teacher?.username || 'Not Available'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Job Title</label>
                      <p className="font-medium">{teacher?.jobTitle || 'Not Specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Level & Progress */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Professional Level</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Current Level</label>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          Level {teacher?.level || 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {teacher?.level === 1 ? 'Assistant Teacher' :
                           teacher?.level === 2 ? 'Associate Teacher' :
                           teacher?.level === 3 ? 'Lead Teacher' :
                           teacher?.level === 4 ? 'Senior Teacher' :
                           teacher?.level === 5 ? 'Master Teacher' : 'Assistant Teacher'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Language Preference</label>
                      <p className="font-medium">{teacher?.language || 'English'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Native Language</label>
                      <p className="font-medium">{teacher?.nativeLanguage || 'Not Specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Time Zone</label>
                      <p className="font-medium">{teacher?.timeZone || 'Not Specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Points & Engagement */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Points & Engagement</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Current Points</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {activitySummary?.pointsBreakdown?.currentPoints || teacher?.points || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Lifetime Points</label>
                      <p className="font-medium text-green-600">
                        {activitySummary?.pointsBreakdown?.lifetimePoints || teacher?.lifetimePoints || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Bear Bucks</label>
                      <p className="font-medium text-amber-600">
                        {activitySummary?.pointsBreakdown?.bearBucks || teacher?.bearBucks || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Current Streak</label>
                      <p className="font-medium">{teacher?.streak || 0} days</p>
                    </div>
                  </div>
                </div>

                {/* Activity & Status */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Activity & Status</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Last Active</label>
                      <p className="font-medium">
                        {teacher?.lastActive ? new Date(teacher.lastActive).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Account Created</label>
                      <p className="font-medium">
                        {teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Achievements</label>
                      <p className="font-medium">{teacher?.achievementCount || 0} earned</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Role Status</label>
                      <div className="flex gap-1">
                        {teacher?.isAdmin && (
                          <Badge variant="default" className="bg-red-100 text-red-800 text-xs">
                            Platform Admin
                          </Badge>
                        )}
                        {teacher?.isSchoolAdmin && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                            School Admin
                          </Badge>
                        )}
                        {!teacher?.isAdmin && !teacher?.isSchoolAdmin && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                            Teacher
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assessment Overview - Only show if assessment data exists */}
      {hasAssessmentData && results && assessment ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                    <p className="text-2xl font-bold text-gray-900">{results.overallScore}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions Correct</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.totalCorrect}/{results.totalQuestions}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{results.accuracyRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(assessment.completedAt)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.domainBreakdown.map((domain) => (
                  <div key={domain.domainId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{domain.domainName}</h4>
                        <Badge 
                          variant="outline" 
                          className={getDomainColor(domain.strengthLevel)}
                        >
                          {domain.strengthLevel}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {domain.correctAnswers}/{domain.totalQuestions} ({domain.accuracyRate}%)
                      </span>
                    </div>
                    <Progress value={domain.accuracyRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Assessment Not Completed Section
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Assessment Not Completed</h3>
              <p className="text-muted-foreground mb-4">
                This teacher has not completed the initial assessment yet.
              </p>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                No Assessment Data Available
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      {activitySummary && !activityLoading && (
        <div className="space-y-6">
          {/* Learning Progress Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Learning Progress & Professional Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ECE Hours Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">ECE Hours Breakdown</h4>
                  {activitySummary.eceHoursSummary && activitySummary.eceHoursSummary.length > 0 ? (
                    <div className="space-y-2">
                      {activitySummary.eceHoursSummary.map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {category.category?.replace('-', ' ') || 'Unknown'}
                          </span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {Math.round(parseInt(category.totalminutes || '0') / 60 * 10) / 10}h
                          </Badge>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total ECE Hours</span>
                          <span className="text-blue-600">
                            {Math.round(activitySummary.eceHoursSummary.reduce((total, cat) => 
                              total + parseInt(cat.totalminutes || '0'), 0) / 60 * 10) / 10}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No ECE hours recorded yet</p>
                  )}
                </div>

                {/* Module Completion Stats */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Module Completion</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Modules Completed</span>
                        <span className="text-2xl font-bold text-green-600">
                          {activitySummary.completedModules?.length || 0}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Professional development courses finished
                      </div>
                    </div>
                    
                    {activitySummary.completedModules && activitySummary.completedModules.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="font-bold text-blue-600">
                            {Math.round(activitySummary.completedModules.reduce((acc, mod) => 
                              acc + (mod.finalscore || 0), 0) / activitySummary.completedModules.length)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Across all completed modules
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Engagement */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Game Engagement</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Games Played</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {activitySummary.gameCompletions?.length || 0}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total game sessions completed
                      </div>
                    </div>
                    
                    {activitySummary.gameCompletions && activitySummary.gameCompletions.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="font-bold text-purple-600">
                            {Math.round(activitySummary.gameCompletions.reduce((acc, game) => 
                              acc + (game.score || 0), 0) / activitySummary.gameCompletions.length)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Across all game sessions
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Points Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {activitySummary.pointsBreakdown.modulePoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Module Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {activitySummary.pointsBreakdown.gamePoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Game Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {activitySummary.pointsBreakdown.assessmentPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Assessment Points</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {activitySummary.pointsBreakdown.currentPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Current Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">
                    {activitySummary.pointsBreakdown.lifetimePoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Lifetime Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {activitySummary.pointsBreakdown.bearBucks || 0}
                  </p>
                  <p className="text-sm text-gray-600">Bear Bucks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bear Bucks Admin Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CoinsIcon className="h-5 w-5 text-amber-600" />
                Bear Bucks Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-semibold text-amber-800">Current Bear Bucks Balance</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {activitySummary?.pointsBreakdown?.bearBucks || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      disabled={cashOutMutation.isPending || !activitySummary?.pointsBreakdown?.bearBucks}
                      onClick={() => {
                        const bearBucksAmount = activitySummary?.pointsBreakdown?.bearBucks || 0;
                        if (bearBucksAmount === 0) {
                          toast({
                            title: "No Bear Bucks",
                            description: "This teacher has no Bear Bucks to cash out",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        if (confirm(`Cash out ${bearBucksAmount} Bear Bucks for this teacher?`)) {
                          cashOutMutation.mutate();
                        }
                      }}
                    >
                      {cashOutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-1" />
                      )}
                      Cash Out {activitySummary?.pointsBreakdown?.bearBucks ? `(${activitySummary.pointsBreakdown.bearBucks})` : ''}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={zeroOutMutation.isPending || !activitySummary?.pointsBreakdown?.bearBucks}
                      onClick={() => {
                        const bearBucksAmount = activitySummary?.pointsBreakdown?.bearBucks || 0;
                        if (bearBucksAmount === 0) {
                          toast({
                            title: "No Bear Bucks",
                            description: "This teacher has no Bear Bucks to zero out",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        if (confirm(`Zero out ${bearBucksAmount} Bear Bucks for this teacher? This action cannot be undone.`)) {
                          zeroOutMutation.mutate();
                        }
                      }}
                    >
                      {zeroOutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Minus className="h-4 w-4 mr-1" />
                      )}
                      Zero Out
                    </Button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={adjustAmount === -1 ? '' : adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value ? parseInt(e.target.value) : -1)}
                        placeholder="Amount"
                        className="w-16 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        max={activitySummary?.pointsBreakdown?.bearBucks || 0}
                        min={1}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        disabled={adjustMutation.isPending || adjustAmount <= 0 || adjustAmount > (activitySummary?.pointsBreakdown?.bearBucks || 0)}
                        onClick={() => {
                          const bearBucksAmount = activitySummary?.pointsBreakdown?.bearBucks || 0;
                          if (adjustAmount <= 0 || adjustAmount > bearBucksAmount) {
                            toast({
                              title: "Invalid Amount",
                              description: `Amount must be between 1 and ${bearBucksAmount}`,
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          if (confirm(`Remove ${adjustAmount} Bear Bucks from this teacher's account?`)) {
                            adjustMutation.mutate(-adjustAmount); // Negative for reduction
                          }
                        }}
                      >
                        {adjustMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        Adjust
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Current Points:</span>
                    <span className="font-medium">{activitySummary?.pointsBreakdown?.currentPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lifetime Points:</span>
                    <span className="font-medium">{activitySummary?.pointsBreakdown?.lifetimePoints || 0}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p><strong>Note:</strong> Bear Bucks are earned by converting current points (2 points = 1 Bear Buck). 
                  Lifetime points remain unchanged during conversion and are used for progression tracking.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Modules */}
          {activitySummary.completedModules && activitySummary.completedModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Completed Modules ({activitySummary.completedModules.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activitySummary.completedModules.slice(0, 10).map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{module.moduleTitle}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Score: {module.finalScore}%
                          </span>
                          {module.eceHours && (
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {module.eceHours}h ECE
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {module.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          +{module.pointsEarned} points
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(module.lastAccessed)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activitySummary.completedModules.length > 10 && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      +{activitySummary.completedModules.length - 10} more modules completed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ECE Hours Summary */}
          {activitySummary.eceHoursSummary && activitySummary.eceHoursSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  ECE Hours by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activitySummary.eceHoursSummary.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {Math.round(category.totalMinutes / 60 * 10) / 10} hours
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.completionCount} completions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Completions */}
          {activitySummary.gameCompletions && activitySummary.gameCompletions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Recent Game Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activitySummary.gameCompletions.slice(0, 2).map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{game.gameTitle}</h4>
                        <p className="text-sm text-gray-600">
                          Score: {game.score} | Difficulty: {game.gameDifficulty}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          +{game.pointsEarned} points
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(game.completedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      )}
    </div>
  );
}