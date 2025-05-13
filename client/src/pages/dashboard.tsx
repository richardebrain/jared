import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link } from "wouter";
import Header from "@/components/Header";
import ModuleView from "@/components/ModuleView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  Book, 
  Award, 
  Star, 
  Trophy, 
  Medal, 
  Coins, 
  Clock, 
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { MonthlyNewsletter } from "@/components/MonthlyNewsletter";
import Leaderboard from "@/components/Leaderboard";
import BearAssistant from "@/components/BearAssistant";
import { MiniLessons } from "@/components/MiniLessons";

// Define assessment domains for display purposes
const domains = [
  { id: 'classroom-management', name: 'Classroom Management' },
  { id: 'social-emotional', name: 'Social-Emotional Development' },
  { id: 'health-safety', name: 'Health & Safety Practices' },
  { id: 'cognitive-language', name: 'Cognitive & Language Development' },
  { id: 'family-engagement', name: 'Family Engagement' },
  { id: 'curriculum-planning', name: 'Curriculum Planning' }
];

// Define the BearBuck conversion rate
const POINTS_PER_BEAR_BUCK = 20;

export default function Dashboard() {
  // We'll calculate Bear Bucks later once we have the user data
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
  const { data: user, isLoading: isLoadingUser, isError: isUserError } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    retry: 3 // Try a few times to fetch the user data
  });
  
  // Only fetch these resources if we have a user
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"],
    enabled: !!user,
  });
  
  const { data: modules } = useQuery({ 
    queryKey: ["/api/modules"],
    enabled: !!user,
  });
  
  const { data: assessments } = useQuery({ 
    queryKey: ["/api/assessments"],
    enabled: !!user,
  });
  
  const handleModuleSelect = (moduleId: number) => {
    setSelectedModuleId(moduleId);
  };
  
  // Calculate bearBucks for display in header
  const bearBucks = user?.points ? Math.floor(user.points / POINTS_PER_BEAR_BUCK) : 0;
  
  // Check if the user has completed at least one assessment
  // For debug, let's log all assessments to see what we're working with
  console.log("Raw assessments:", assessments);
  
  // Check if assessments are available and not empty
  const hasCompletedAssessment = assessments && 
    Array.isArray(assessments) && 
    assessments.length > 0;
  
  // Get latest assessment
  const latestAssessmentIndex = (assessments && Array.isArray(assessments)) ? assessments.length - 1 : -1;
  const latestAssessmentResults = assessments && Array.isArray(assessments) && latestAssessmentIndex >= 0 ? 
    assessments[latestAssessmentIndex].results : null;
    
  // Debug assessment
  console.log("Assessment data:", { assessments, hasCompletedAssessment, latestAssessmentIndex });
  
  // Process assessment data for display
  const assessmentDomains = domains.map(domain => {
    let score = 0;
    let domainData = null;
    
    if (latestAssessmentResults && latestAssessmentResults[domain.id]) {
      domainData = latestAssessmentResults[domain.id];
      score = domainData.score;
    }
    
    return {
      name: domain.name,
      id: domain.id,
      score,
      weakArea: score < 70
    };
  });
  
  // Identify areas that need improvement
  const weakAreas = assessmentDomains.filter(d => d.weakArea).map(d => d.id);
  
  // Get recommended modules from user progress
  const recommendedModules = useMemo(() => {
    if (!modules || !userProgress) return [];
    
    // Get modules that are marked as recommended in user progress
    const recommendedProgressEntries = Array.isArray(userProgress) 
      ? userProgress.filter(progress => progress.recommended === true)
      : [];
    
    if (recommendedProgressEntries.length === 0) {
      // Fall back to old recommendation logic if no entries marked as recommended
      if (!weakAreas || weakAreas.length === 0) return [];
      
      // Add modules that match weak domain areas
      let recommendations = [];
      
      for (const domain of weakAreas) {
        const domainModules = Array.isArray(modules) ? modules.filter(module => 
          module.domains && module.domains.includes(domain)
        ).sort((a, b) => a.sequence - b.sequence) : [];
        
        if (domainModules.length > 0) {
          recommendations = [...recommendations, ...domainModules.slice(0, 2)];
        }
      }
      
      // Deduplicate modules
      recommendations = recommendations.filter((module, index, self) =>
        index === self.findIndex((m) => m.id === module.id)
      );
      
      // Limit to top 3 recommendations
      return recommendations.slice(0, 3);
    }
    
    // Map recommended progress entries to actual modules
    const recommendedModuleIds = recommendedProgressEntries.map(progress => progress.moduleId);
    
    return Array.isArray(modules) 
      ? modules.filter(module => recommendedModuleIds.includes(module.id))
      : [];
  }, [modules, userProgress, weakAreas]);
  
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-opacity-50 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (isUserError || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Logged In</h1>
          <p className="mb-6">Please log in to access your personalized dashboard.</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} />
      
      {/* Dashboard Header with Bear Bucks */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-heading font-bold text-gray-800">Welcome, {user.name || 'Teacher'}!</h1>
            <div className="bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-sm font-semibold">
              {bearBucks} <span className="text-xs">Bear Bucks</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {selectedModuleId ? (
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedModuleId(null)}
            >
              ← Back to Dashboard
            </Button>
            
            <ModuleView 
              moduleId={selectedModuleId} 
              onComplete={() => setSelectedModuleId(null)}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Assessment Status */}
            {!hasCompletedAssessment ? (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center mb-4">
                  <Lightbulb className="h-6 w-6 mr-2 text-amber-500" />
                  <h2 className="text-xl font-heading font-bold">Initial Assessment</h2>
                </div>
                <p className="text-neutral-600 mb-4">
                  Start your personalized learning journey by completing the initial assessment.
                  This will help us identify your strengths and areas for growth.
                </p>
                <Link to="/assessment">
                  <Button>
                    Start Assessment
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Personalized Learning Path from Assessment Results */}
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Award className="h-6 w-6 mr-2 text-primary" />
                      <CardTitle className="text-xl font-bold">Your Personalized Learning Path</CardTitle>
                    </div>
                    <CardDescription>
                      Based on your assessment results, we've created a customized learning path for your professional growth
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Recommended Focus Areas */}
                    {weakAreas && weakAreas.length > 0 ? (
                      <div className="mb-6">
                        <h3 className="font-semibold text-md mb-2">Recommended Focus Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {weakAreas.map(areaId => {
                            const domain = domains.find(d => d.id === areaId);
                            return domain ? (
                              <Badge key={areaId} variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                {domain.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Recommended Modules */}
                    {recommendedModules && recommendedModules.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-md">Suggested Learning Modules</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {recommendedModules.map(module => (
                            <div 
                              key={module.id}
                              onClick={() => handleModuleSelect(module.id)} 
                              className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                            >
                              <h3 className="font-heading font-semibold mb-2">{module.title}</h3>
                              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{module.description}</p>
                              <Button variant="outline" size="sm" className="w-full">
                                Start Learning
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-neutral-500 mb-4">No specific recommendations yet. Please complete more assessments or modules.</p>
                        <Link to="/modules">
                          <Button>
                            Browse All Modules
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Take Another Assessment */}
                <div className="bg-primary/10 rounded-xl p-6 text-center mb-6">
                  <h3 className="font-bold text-primary mb-2">Ready to update your learning path?</h3>
                  <p className="text-sm mb-4">Take another assessment to refine your personalized recommendations.</p>
                  <Link to="/assessment">
                    <Button variant="outline" size="sm">
                      Take Assessment Again
                    </Button>
                  </Link>
                </div>
                
                {/* Link to Tools Page */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2">Teacher Tools</h3>
                      <p className="text-sm text-indigo-700 mb-4">Access helpful tools for your teaching practice.</p>
                      <Link to="/tools">
                        <Button variant="outline" size="sm" className="border-indigo-400 text-indigo-700 hover:bg-indigo-100">
                          View Tools
                        </Button>
                      </Link>
                    </div>
                    <Book className="h-12 w-12 text-indigo-300" />
                  </div>
                </div>
                
                {/* Mindful Mornings Training Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <img 
                          src="/attached_assets/mindful-mornings-logo.jpg" 
                          alt="Mindful Mornings" 
                          className="h-7 mr-2 rounded"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://placehold.co/200x40/16a34a/fff?text=Mindful+Mornings";
                          }}
                        />
                        <h3 className="font-bold text-emerald-800">Mindful Mornings Training</h3>
                      </div>
                      <p className="text-sm text-emerald-700 mb-4">
                        Start each day with intention. Learn how to implement our signature Mindful Mornings program in your classroom.
                      </p>
                      <div className="flex space-x-3">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            // Find the mindful mornings module
                            if (modules && Array.isArray(modules)) {
                              const mindfulModule = modules.find(m => m.category === 'mindful-mornings');
                              if (mindfulModule) {
                                setSelectedModuleId(mindfulModule.id);
                              }
                            }
                          }}
                        >
                          Start Training
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-200 flex items-center space-x-3">
                      <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Clock className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700">Completion Earns</p>
                        <p className="font-bold text-emerald-800">75 Points</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress indicator if user has started the module */}
                  {userProgress && Array.isArray(userProgress) && modules && Array.isArray(modules) && 
                   userProgress.some(p => {
                     const mindfulModule = modules.find(m => m.category === 'mindful-mornings');
                     return mindfulModule && p.moduleId === mindfulModule.id;
                   }) && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-emerald-700 mb-1">
                        <span>Your progress</span>
                        <span>
                          {(() => {
                            if (userProgress && modules) {
                              const mindfulModule = modules.find(m => m.category === 'mindful-mornings');
                              if (mindfulModule) {
                                const progress = userProgress.find(p => p.moduleId === mindfulModule.id);
                                return progress?.progress || 0;
                              }
                            }
                            return 0;
                          })()}% complete
                        </span>
                      </div>
                      <Progress 
                        value={(() => {
                          if (userProgress && modules) {
                            const mindfulModule = modules.find(m => m.category === 'mindful-mornings');
                            if (mindfulModule) {
                              const progress = userProgress.find(p => p.moduleId === mindfulModule.id);
                              return progress?.progress || 0;
                            }
                          }
                          return 0;
                        })()} 
                        className="h-2 bg-emerald-100"
                      />
                    </div>
                  )}
                </div>
                
                {/* Mini-Lessons Section */}
                <MiniLessons />
                
                {/* Dashboard Tools and Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Left Column (2/3 width) */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Points Tracker Card */}
                    <Card className="overflow-hidden border border-amber-200">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-100">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-amber-500 mr-2" />
                          <CardTitle className="text-lg">Points & Progress</CardTitle>
                        </div>
                        <CardDescription>Track your learning accomplishments</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-amber-100 p-2 rounded-full">
                              <Award className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-muted-foreground">Your Points</p>
                              <p className="text-2xl font-bold">{user?.points || 0}</p>
                            </div>
                          </div>
                          
                          <div className="bg-white px-3 py-2 rounded-lg border border-amber-200 shadow-sm">
                            <div className="flex items-center">
                              <img 
                                src="https://em-content.zobj.net/source/microsoft-teams/363/teddy-bear_1f9f8.png" 
                                alt="Bear Bucks"
                                className="w-6 h-6 mr-2"
                              />
                              <span className="font-bold">{bearBucks}</span>
                              <span className="ml-1 text-muted-foreground text-sm">Bear Bucks</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span>Progress to next level</span>
                              <span className="font-medium">Level {user?.level || 1}</span>
                            </div>
                            <Progress value={(user?.points || 0) % 300 / 300 * 100} className="h-2" />
                          </div>
                          
                          <div className="bg-muted/30 p-3 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              300 more points until Level {(user?.level || 1) + 1}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Monthly Newsletter */}
                    <MonthlyNewsletter />
                  </div>
                  
                  {/* Right Column (1/3 width) */}
                  <div className="md:col-span-1 space-y-6">
                    {/* Leaderboard */}
                    <Leaderboard />
                    
                    {/* Bear Assistant */}
                    <BearAssistant user={user} initiallyMinimized={false} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}