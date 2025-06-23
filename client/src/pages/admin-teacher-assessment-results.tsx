import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  Loader2,
  Send,
  MessageSquare,
  GraduationCap,
  Heart,
  Shield,
  UtensilsCrossed,
  Fingerprint,
  Play,
  CheckSquare,
  AlertTriangle,
  Plus
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teacher's modules progress
  const { data: teacherModules, isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/users/${teacherId}/modules`],
    enabled: !!teacherId,
  });

  // Fetch all available modules for assignment
  const { data: allModules, isLoading: allModulesLoading } = useQuery({
    queryKey: ['/api/modules'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: number; subject: string; content: string }) => {
      return await apiRequest('/api/messages', {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
        description: "Your message has been delivered to the teacher.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Assign module mutation
  const assignModuleMutation = useMutation({
    mutationFn: async (data: { teacherId: number; moduleId: number }) => {
      return await apiRequest('/api/assign-module', {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Module assigned successfully",
        description: "The teacher will be notified of the new assignment.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${teacherId}/modules`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign module",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const formatCertDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const now = new Date();
    const isExpired = date < now;
    const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      formatted: date.toLocaleDateString(),
      isExpired,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0
    };
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
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
          <span>Full Teacher Stats</span>
        </nav>
        
        {/* Teacher identification header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={teacher.profilePicture} alt={teacher.firstName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                  {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <User className="h-7 w-7 text-purple-600" />
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <p className="text-muted-foreground text-lg">@{teacher.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <School className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{teacher.schoolName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Assessment completed: {formatDate(assessment.completedAt)}</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg p-3">
                  <div className="text-sm text-yellow-800 font-medium">Overall Score</div>
                  <div className="text-2xl font-bold text-yellow-900">{results.accuracyRate}%</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed interface for comprehensive teacher management */}
      <Tabs defaultValue="assessment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-blue-50 to-purple-50 p-1 rounded-xl">
          <TabsTrigger value="assessment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Target className="h-4 w-4" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <BookOpen className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Shield className="h-4 w-4" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <MessageSquare className="h-4 w-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="assign" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Plus className="h-4 w-4" />
            Assign
          </TabsTrigger>
        </TabsList>

        {/* Assessment Results Tab */}
        <TabsContent value="assessment" className="space-y-6">
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
        </TabsContent>

        {/* Modules Progress Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Completed Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading modules...</span>
                  </div>
                ) : teacherModules?.completed?.length > 0 ? (
                  <div className="space-y-3">
                    {teacherModules.completed.map((module: any) => (
                      <div key={module.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">{module.title}</h4>
                            <p className="text-sm text-green-600">Completed: {formatDate(module.completedAt)}</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <Progress value={100} className="mt-2 h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No completed modules yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-orange-600" />
                  In Progress Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacherModules?.inProgress?.length > 0 ? (
                  <div className="space-y-3">
                    {teacherModules.inProgress.map((module: any) => (
                      <div key={module.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-orange-800">{module.title}</h4>
                            <p className="text-sm text-orange-600">Started: {formatDate(module.startedAt)}</p>
                          </div>
                          <Play className="h-5 w-5 text-orange-600" />
                        </div>
                        <Progress value={module.progress || 0} className="mt-2 h-2" />
                        <p className="text-xs text-orange-600 mt-1">{module.progress || 0}% complete</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No modules in progress.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPR Certification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  CPR Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const certInfo = formatCertDate(teacher.cpr_expiration);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expiration Date:</span>
                        <span className={`font-medium ${
                          certInfo.isExpired ? 'text-red-600' : 
                          certInfo.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {certInfo.formatted}
                        </span>
                      </div>
                      {certInfo.isExpired && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      )}
                      {certInfo.isExpiringSoon && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires in {certInfo.daysUntilExpiry} days</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* First Aid Certification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  First Aid Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const certInfo = formatCertDate(teacher.first_aid_expiration);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expiration Date:</span>
                        <span className={`font-medium ${
                          certInfo.isExpired ? 'text-red-600' : 
                          certInfo.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {certInfo.formatted}
                        </span>
                      </div>
                      {certInfo.isExpired && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      )}
                      {certInfo.isExpiringSoon && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires in {certInfo.daysUntilExpiry} days</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Food Handler Certification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-green-600" />
                  Food Handler Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const certInfo = formatCertDate(teacher.food_handler_expiration);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expiration Date:</span>
                        <span className={`font-medium ${
                          certInfo.isExpired ? 'text-red-600' : 
                          certInfo.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {certInfo.formatted}
                        </span>
                      </div>
                      {certInfo.isExpired && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      )}
                      {certInfo.isExpiringSoon && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires in {certInfo.daysUntilExpiry} days</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Fingerprint Certification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-purple-600" />
                  Fingerprint Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const certInfo = formatCertDate(teacher.fingerprint_expiration);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expiration Date:</span>
                        <span className={`font-medium ${
                          certInfo.isExpired ? 'text-red-600' : 
                          certInfo.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {certInfo.formatted}
                        </span>
                      </div>
                      {certInfo.isExpired && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      )}
                      {certInfo.isExpiringSoon && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires in {certInfo.daysUntilExpiry} days</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Send Message to {teacher.firstName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Compose New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    sendMessageMutation.mutate({
                      recipientId: teacher.id,
                      subject: formData.get('subject') as string,
                      content: formData.get('content') as string,
                    });
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="Enter message subject"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Message</Label>
                        <Textarea
                          id="content"
                          name="content"
                          placeholder="Type your message here..."
                          rows={5}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Assign Modules to {teacher.firstName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Assign New Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assign Module</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const moduleId = parseInt(formData.get('moduleId') as string);
                    assignModuleMutation.mutate({
                      teacherId: teacher.id,
                      moduleId,
                    });
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="moduleId">Select Module</Label>
                        <Select name="moduleId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a module to assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {allModules?.map((module: any) => (
                              <SelectItem key={module.id} value={module.id.toString()}>
                                {module.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={assignModuleMutation.isPending}
                      >
                        {assignModuleMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Module
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Quick assign recommended modules based on assessment */}
              {results.primaryMiniLessons && results.primaryMiniLessons.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Recommended Based on Assessment
                  </h3>
                  <div className="space-y-2">
                    {results.primaryMiniLessons.slice(0, 3).map((lesson: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-800">{lesson.title}</h4>
                            <p className="text-sm text-blue-600">{lesson.domainName}</p>
                            <p className="text-xs text-blue-500">Est. {lesson.estimatedDuration} min</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => assignModuleMutation.mutate({
                              teacherId: teacher.id,
                              moduleId: parseInt(lesson.miniLessonId),
                            })}
                            disabled={assignModuleMutation.isPending}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 