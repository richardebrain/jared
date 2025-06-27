import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  GraduationCap
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
    totalPoints: number;
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
  
  const teacherId = params?.teacherId;
  const hasAdminAccess = isAuthenticated && (isSchoolAdmin || isAdmin || isOwner);

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

  if (error || !data || !data.success) {
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
            <h3 className="text-lg font-semibold mb-2">Assessment Results Not Available</h3>
            <p className="text-muted-foreground">
              {error ? 'Failed to load assessment results.' : 'No assessment results found for this teacher.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { teacher, assessment, results } = data;

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
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-gray-600">{teacher.jobTitle} • {teacher.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Overview */}
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

      {/* Activity Summary */}
      {activitySummary && !activityLoading && (
        <div className="space-y-6">
          {/* Points Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Points Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
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
                  <p className="text-2xl font-bold text-purple-600">
                    {activitySummary.pointsBreakdown.totalPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Points</p>
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
                  {activitySummary.gameCompletions.slice(0, 5).map((game, index) => (
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