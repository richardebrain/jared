import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  BookOpen,
  Star,
  Award,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  MapPin,
  ArrowRight,
  Book,
  Lightbulb,
  Brain,
  AlertTriangle,
  ChevronRight,
  Clock,
  Download,
  BarChart3,
  Target,
  Users,
  Sparkles,
} from "lucide-react";

interface AssessmentResultsData {
  assessment: {
    id: number;
    completedAt: string;
    type: string;
  };
  results: {
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
  };
  learningPath?: {
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
  };
}

export default function AssessmentResultsPage() {
  const [location, navigate] = useLocation();

  // Get auth user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Get user's assessment results - use the new API endpoint
  const { data: assessmentResults, isLoading: isLoadingResults, error } = useQuery<AssessmentResultsData>({
    queryKey: ["/api/assessment-results"],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  const isLoading = isLoadingUser || isLoadingResults;

  // Download results functionality
  const downloadResults = () => {
    if (!assessmentResults) return;
    
    const data = {
      assessment: assessmentResults.assessment,
      results: assessmentResults.results,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to get icon for strength level
  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'strength':
        return <Star className="h-5 w-5 text-green-600" />;
      case 'growth':
        return <TrendingUp className="h-5 w-5 text-amber-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  // Helper to get color for strength level
  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'strength':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'growth':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // Helper to format time in seconds to human-readable format
  const formatTime = (totalSeconds?: number) => {
    if (!totalSeconds || totalSeconds <= 0) return 'N/A';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">
                Loading your assessment results...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !assessmentResults) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-primary" />
                Assessment Results
              </CardTitle>
              <CardDescription>
                Unable to load your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">
                  {error ? 'Error Loading Results' : 'No Assessment Results Found'}
                </h3>
                <p className="text-center text-muted-foreground max-w-md">
                  {error 
                    ? 'There was an error loading your assessment results. Please try again.' 
                    : 'Complete the teacher assessment to get personalized learning recommendations and track your teaching skill development.'
                  }
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate("/initial-assessment")}
                  >
                    {error ? 'Try Again' : 'Start Assessment'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {error && (
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { assessment, results, learningPath } = assessmentResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Assessment Results
              </h1>
              <p className="text-muted-foreground mt-2">
                Completed on {new Date(assessment.completedAt).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={downloadResults} variant="outline" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Overall Statistics Card - Shows time taken instead of overall score for better insight */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                <div className="text-3xl font-bold">{formatTime(results.totalTimeSeconds)}</div>
                <div className="text-blue-100">Time Taken</div>
              </div>
              <div>
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-300" />
                <div className="text-3xl font-bold">{results.totalCorrect}</div>
                <div className="text-blue-100">Correct Answers</div>
              </div>
              <div>
                <Book className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                <div className="text-3xl font-bold">{results.totalQuestions}</div>
                <div className="text-blue-100">Total Questions</div>
              </div>
              <div>
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-300" />
                <div className="text-3xl font-bold">{results.accuracyRate}%</div>
                <div className="text-blue-100">Accuracy Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strength Areas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Star className="h-6 w-6" />
                Your Strengths
              </CardTitle>
              <CardDescription>
                Areas where you demonstrated strong knowledge (≥80% accuracy)
              </CardDescription>
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
                  Keep working to develop strength areas through continued learning.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Growth Areas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <TrendingUp className="h-6 w-6" />
                Growth Opportunities
              </CardTitle>
              <CardDescription>
                Areas for focused professional development (&lt;80% accuracy)
              </CardDescription>
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
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Domain Performance Breakdown
            </CardTitle>
            <CardDescription>
              Your performance across all early childhood education domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.domainBreakdown.map((domain) => (
                <div 
                  key={domain.domainId} 
                  className={`p-4 rounded-lg border ${getStrengthColor(domain.strengthLevel)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStrengthIcon(domain.strengthLevel)}
                      <span className="font-semibold text-sm">{domain.domainName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(domain.accuracyRate)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{domain.correctAnswers}/{domain.totalQuestions} correct</span>
                    <span className="capitalize">{domain.strengthLevel}</span>
                  </div>
                  <Progress 
                    value={domain.accuracyRate} 
                    className="mt-2 h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personalized Summary & Next Steps */}
        {(results.personalizedSummary || results.immediateNextSteps) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {results.personalizedSummary && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    Personalized Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {results.personalizedSummary}
                  </p>
                </CardContent>
              </Card>
            )}

            {results.immediateNextSteps && results.immediateNextSteps.length > 0 && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    Immediate Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.immediateNextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Learning Path Preview */}
        {learningPath && (
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-green-600" />
                Your Personalized Learning Path
              </CardTitle>
              <CardDescription>
                Customized professional development based on your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Book className="h-8 w-8 text-blue-600 mx-auto mb-2" />
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
                {learningPath.domainGroups.slice(0, 3).map((group) => (
                  <div key={group.domainId} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{group.domainName}</h4>
                      <Badge variant="outline">
                        {group.failedQuestionsCount} lessons
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Focus on {group.failedQuestionsCount} targeted mini-lessons to strengthen this domain
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Learning Path
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg">
            Return to Dashboard
          </Button>
          <Button onClick={downloadResults} size="lg" className="sm:hidden">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </main>
    </div>
  );
}
