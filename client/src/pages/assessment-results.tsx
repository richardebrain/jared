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
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AssessmentResultsPage() {
  const [location, navigate] = useLocation();
  
  // Get auth user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  
  // Get user's assessment results - use the correct API endpoint
  const { data: assessmentResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ["/api/assessment-results"],
    enabled: !!user,
  });
  
  // Get recommended modules based on assessment results
  const { data: recommendedModules, isLoading: isLoadingModules } = useQuery({
    queryKey: ["/api/modules"],
    enabled: !!user,
    select: (data) => {
      // If there are no assessment results, return all modules
      if (!assessmentResults || assessmentResults.length === 0) {
        return data?.slice(0, 5) || [];
      }
      
      // Otherwise, apply some logic to recommend modules based on strengths/growth areas
      const latestAssessment = assessmentResults[0];
      const growthAreaKeywords = latestAssessment?.growthAreas || [];
      
      // Filter modules that match growth areas or return first 5 modules if no matches
      const filteredModules = data?.filter(module => 
        growthAreaKeywords.some(keyword => 
          module.title.toLowerCase().includes(keyword.toLowerCase()) || 
          module.description.toLowerCase().includes(keyword.toLowerCase())
        )
      ) || [];
      
      return filteredModules.length > 0 ? filteredModules.slice(0, 5) : (data?.slice(0, 5) || []);
    }
  });
  
  const isLoading = isLoadingUser || isLoadingResults || isLoadingModules;
  
  // Helper function to format the assessment date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Function to get a friendly description for teacher level
  const getTeacherLevelDescription = (level: string) => {
    switch(level) {
      case "Teacher in Training":
        return "You're at the beginning of your teaching journey. With mentorship and continued learning, you'll develop strong teaching skills.";
      case "Assistant Teacher":
        return "You're building a solid foundation of teaching skills. Keep learning and practicing to move to the next level.";
      case "Associate Teacher":
        return "You've developed good classroom management and teaching abilities. Continue focusing on your growth areas.";
      case "Lead Teacher":
        return "You demonstrate strong teaching abilities across multiple domains. Focus on mentoring others while continuing your own development.";
      case "Master Lead Teacher":
        return "You exhibit exceptional teaching skills. You're well-positioned to mentor others and lead educational initiatives.";
      case "Mentor Teacher":
        return "You've reached the highest level of teaching excellence. Your knowledge and expertise make you an invaluable resource to your peers.";
      default:
        return "Continue your professional development journey to advance your teaching skills.";
    }
  };
  
  // Helper function to get color for score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-indigo-600";
    if (score >= 40) return "text-amber-600";
    return "text-orange-600";
  };
  
  // Helper function to get badge color for domain
  const getDomainBadgeColor = (domain: string) => {
    switch(domain.toLowerCase()) {
      case "core":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "mindful":
        return "bg-teal-100 text-teal-800 hover:bg-teal-200";
      case "build":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "language":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "reasoning":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
      case "social":
        return "bg-pink-100 text-pink-800 hover:bg-pink-200";
      case "classroom":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "ages":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "inclusion":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "health":
        return "bg-lime-100 text-lime-800 hover:bg-lime-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Get a friendly name for each domain
  const getDomainName = (domain: string) => {
    switch(domain) {
      case "core": return "Raising Arizona CORE Values";
      case "mindful": return "Mindful Morning";
      case "build": return "Building a Human (Ch.1)";
      case "language": return "Language & Literacy";
      case "reasoning": return "Reasoning & Math";
      case "social": return "Social & Emotional";
      case "classroom": return "Classroom Management";
      case "ages": return "Ages & Stages";
      case "inclusion": return "Inclusion & Diversity";
      case "health": return "Health & Safety";
      default: return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  };
  
  // Helper to get icon for each domain
  const getDomainIcon = (domain: string) => {
    switch(domain) {
      case "core": return <Award className="h-5 w-5" />;
      case "mindful": return <Brain className="h-5 w-5" />;
      case "build": return <Book className="h-5 w-5" />;
      case "language": return <BookOpen className="h-5 w-5" />;
      case "reasoning": return <Lightbulb className="h-5 w-5" />;
      case "social": return <Star className="h-5 w-5" />;
      case "classroom": return <GraduationCap className="h-5 w-5" />;
      case "ages": return <TrendingUp className="h-5 w-5" />;
      case "inclusion": return <CheckCircle className="h-5 w-5" />;
      case "health": return <AlertTriangle className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading your assessment results...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // If no assessment results found
  if (!assessmentResults || assessmentResults.length === 0) {
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
                You haven't completed an assessment yet
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">No Assessment Results Found</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  Complete the teacher assessment to get personalized learning recommendations 
                  and track your teaching skill development.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/assessment')}
                >
                  Start Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Get the most recent assessment result
  const latestAssessment = assessmentResults[0];
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-md mb-8">
          <CardHeader className="space-y-1">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                <Trophy className="h-7 w-7 text-primary" />
                Assessment Results
              </CardTitle>
              <Badge variant="outline" className="text-sm">
                Completed {formatDate(latestAssessment.completedAt)}
              </Badge>
            </div>
            <CardDescription>
              Your teaching skills assessment results and recommendations
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Overall Score and Teacher Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-blue-900">Overall Score</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-4xl font-bold ${getScoreColor(latestAssessment.overallScore)}`}>
                    {latestAssessment.overallScore}%
                  </span>
                </div>
                <Progress
                  value={latestAssessment.overallScore}
                  className="h-2 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  Based on your responses across all assessment categories
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-purple-900">Teacher Level</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-6 w-6 text-purple-600" />
                  <span className="text-2xl font-semibold text-purple-800">
                    {latestAssessment.teacherLevel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getTeacherLevelDescription(latestAssessment.teacherLevel)}
                </p>
              </div>
            </div>
            
            {/* Domain Scores */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Domain Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestAssessment.domainScores && Object.entries(latestAssessment.domainScores).map(([domain, data]) => (
                  <div key={domain} className="flex items-center p-3 border rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className={`rounded-full p-2 mr-3 ${getDomainBadgeColor(domain).replace('hover:bg-', 'bg-')}`}>
                      {getDomainIcon(domain)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-sm truncate" title={getDomainName(domain)}>
                          {getDomainName(domain)}
                        </h4>
                        <span className={`font-semibold text-sm ${getScoreColor(data.score)}`}>
                          {data.score}%
                        </span>
                      </div>
                      <Progress
                        value={data.score}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                  <Star className="h-5 w-5 text-emerald-600" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {latestAssessment.strengthAreas && latestAssessment.strengthAreas.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Growth Areas
                </h3>
                <ul className="space-y-2">
                  {latestAssessment.growthAreas && latestAssessment.growthAreas.map((growth, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{growth}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recommended Learning Path */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Your Personalized Learning Path
            </CardTitle>
            <CardDescription>
              Based on your assessment results, we recommend these modules to help you grow
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoadingModules ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recommendedModules && recommendedModules.length > 0 ? (
              <div className="space-y-4">
                {recommendedModules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0 mt-1">
                          {index < 3 ? (
                            <Trophy className="h-5 w-5 text-primary" />
                          ) : (
                            <Book className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{module.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {module.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {module.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {module.duration} min
                            </Badge>
                            {module.pointValue && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                {module.pointValue} points
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No specific module recommendations available. Explore the learning modules from the dashboard.</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/assessment')}
            >
              Retake Assessment
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}