import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  User,
  School,
  Calendar,
  Clock,
  Target,
  Award,
  Star,
  TrendingUp,
  CheckCircle,
  BookOpen,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TeacherInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture?: string;
  schoolName: string;
}

interface AssessmentInfo {
  id: number;
  completedAt: string;
  type: string;
}

interface AssessmentResults {
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracyRate: number;
  totalTimeSeconds?: number;
  strengthAreas: string[];
  growthAreas: string[];
  domainBreakdown: Array<{
    domainId: number;
    domainName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracyRate: number;
    strengthLevel: 'strength' | 'neutral' | 'growth';
  }>;
  personalizedSummary?: string;
  immediateNextSteps?: string[];
  primaryMiniLessons?: Array<{
    miniLessonId: string;
    title: string;
    description: string;
    estimatedDuration: number;
    difficulty: number;
    domainName: string;
    priority: number;
  }>;
  estimatedImprovementTime?: number;
}

interface LearningPath {
  domainGroups: Array<{
    domainId: number;
    domainName: string;
    domainWeight: number;
    failedQuestionsCount: number;
    miniLessons: Array<{
      questionId: string;
      difficulty: number;
      miniLessonId: string;
      estimatedDuration: number;
    }>;
  }>;
  totalFailedQuestions: number;
  totalDomains: number;
  estimatedCompletionTime: number;
}

interface TeacherAssessmentData {
  success: boolean;
  teacher: TeacherInfo;
  assessment: AssessmentInfo;
  results: AssessmentResults;
  learningPath?: LearningPath;
}

export default function AdminTeacherAssessmentResultsPage() {
  const params = useParams<{ teacherId: string }>();
  const teacherId = params?.teacherId;

  const { data, isLoading, error } = useQuery<TeacherAssessmentData>({
    queryKey: [`/api/admin/teachers/${teacherId}/assessment-results`],
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Not recorded';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

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

  const { teacher, assessment, results, learningPath } = data;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header with back navigation */}
      <div className="mb-6">
        <Link href="/admin/teachers">
          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Teachers
          </Button>
        </Link>
        
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-4">
          <span>Teachers</span>
          <span className="mx-2">›</span>
          <span>{teacher.firstName} {teacher.lastName}</span>
          <span className="mx-2">›</span>
          <span>Assessment Results</span>
        </nav>
        
        {/* Teacher identification header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={teacher.profilePicture} alt={teacher.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6" />
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <p className="text-muted-foreground">@{teacher.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <School className="h-4 w-4" />
                  <span className="text-sm">{teacher.schoolName}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Assessment Completed</div>
                <div className="font-medium">{formatDate(assessment.completedAt)}</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Assessment overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Accuracy Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-800">{results.accuracyRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Time Taken</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {formatDuration(results.totalTimeSeconds)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Questions</span>
            </div>
            <div className="text-2xl font-bold text-amber-800">
              {results.totalCorrect}/{results.totalQuestions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Summary */}
      {results.personalizedSummary && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Assessment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{results.personalizedSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Growth Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Star className="h-6 w-6" />
              Strength Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.strengthAreas.length > 0 ? (
              <div className="space-y-3">
                {results.strengthAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-green-800">{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Continue working to develop strength areas through learning.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <TrendingUp className="h-6 w-6" />
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.growthAreas.length > 0 ? (
              <div className="space-y-3">
                {results.growthAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Target className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <span className="font-medium text-amber-800">{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Excellent work! No specific growth areas identified.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Domain Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Domain Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.domainBreakdown.map((domain, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{domain.domainName}</h3>
                  <Badge className={getDomainColor(domain.strengthLevel)}>
                    {domain.strengthLevel === 'strength' ? 'Strength' : 
                     domain.strengthLevel === 'growth' ? 'Growth Area' : 'Neutral'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="ml-2 font-medium">{domain.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Correct:</span>
                    <span className="ml-2 font-medium">{domain.correctAnswers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className="ml-2 font-medium">{domain.accuracyRate}%</span>
                  </div>
                </div>
                <Progress value={domain.accuracyRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Path */}
      {learningPath && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-green-600" />
              Personalized Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-800">{learningPath.totalDomains}</div>
                <div className="text-sm text-blue-600">Focus Domains</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-800">{learningPath.totalFailedQuestions}</div>
                <div className="text-sm text-purple-600">Learning Opportunities</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-800">{Math.round((learningPath.estimatedCompletionTime || 0) / 60)} min</div>
                <div className="text-sm text-green-600">Estimated Time</div>
              </div>
            </div>
            
            <div className="space-y-4">
              {learningPath.domainGroups.map((domain, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">{domain.domainName}</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    {domain.failedQuestionsCount} questions to review • {domain.miniLessons.length} recommended lessons
                  </div>
                  <Progress value={(domain.domainWeight * 100)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Immediate Next Steps */}
      {results.immediateNextSteps && results.immediateNextSteps.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Immediate Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.immediateNextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 