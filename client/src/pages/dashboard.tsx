import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import ModuleView from "@/components/ModuleView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
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
import MediaSidebar from "@/components/MediaSidebar";
import AdminTools from "@/components/AdminTools";
import { RetroDashboardTabs } from "@/components/RetroDashboardTabs";

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
  const [activeTab, setActiveTab] = useState("learning");
  const { toast } = useToast();
  const { playTabSelectSound, playUIClickSound } = useSoundEffects();
  
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
      let recommendations: any[] = [];
      
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
  
  // For demo purposes, we'll use a default user if not logged in
  let displayUser = user;
  
  if (isUserError || !user) {
    // Create a demo user for testing purposes
    displayUser = {
      id: 4,
      username: "demo",
      password: "",
      firstName: "Demo",
      lastName: "Teacher",
      email: "demo@example.com",
      points: 750,
      level: 2,
      language: "en",
      nativeLanguage: "en",
      timeZone: "America/New_York",
      profilePicture: null,
      learningStyle: {
        visual: 75,
        auditory: 60,
        reading: 85,
        kinesthetic: 70,
        preferred: "reading"
      },
      createdAt: null
    };
    
    // Option to go to login screen
    return (
      <div className="min-h-screen bg-neutral-50 p-6 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-amber-600 mb-4">Demo Mode</h1>
          <p className="mb-6">You're viewing the dashboard in demo mode. To access your personalized dashboard, please log in.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button>Log In</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"}
            >
              Continue as Demo User
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Dashboard Header with Bear Bucks and Progress */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-3">
            <div className="flex items-center justify-between md:justify-start mb-3 md:mb-0">
              <h1 className="text-2xl font-heading font-bold text-gray-800 mr-4">Welcome, {user.firstName || 'Teacher'}!</h1>
            </div>
            
            <Link to="/core-values-shout-out">
              <div className="group relative overflow-hidden transform hover:scale-105 transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_5px_0_rgb(76,29,149)] hover:shadow-[0_3px_0_rgb(76,29,149)] active:shadow-[0_0px_0_rgb(76,29,149)] active:translate-y-1 border-2 border-purple-200">
                {/* Pixel-art style decorations */}
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded"></div>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/30 to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/0 via-yellow-400/40 to-yellow-400/0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity"></div>
                
                <div className="relative flex items-center justify-center">
                  <span className="mr-3 text-yellow-200 text-xl">🏆</span>
                  <span className="text-white font-game text-sm md:text-base tracking-wider pb-1">CORE VALUES SHOUT OUT!</span>
                  <span className="ml-3 text-yellow-200 text-xl">🎮</span>
                </div>
                
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">NEW!</div>
              </div>
            </Link>
          </div>
          
          {/* Bear Bucks and Points Progress Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Points */}
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-3">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Points</p>
                  <p className="text-xl font-bold">{user?.points || 0}</p>
                </div>
              </div>
              
              {/* Bear Bucks */}
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <Coins className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Bear Bucks</p>
                  <div className="flex items-center">
                    <p className="text-xl font-bold mr-2">{bearBucks}</p>
                    <span className="bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 text-xs font-semibold">
                      🐻
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress to next level */}
              <div className="flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Progress to Level {(user?.level || 1) + 1}</span>
                  <span className="text-sm font-medium">Level {user?.level || 1}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <Progress value={((user?.points || 0) % 300) / 300 * 100} className="h-2.5" />
                </div>
                <p className="text-xs text-gray-500 text-right">{300 - ((user?.points || 0) % 300)} points needed</p>
              </div>
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
              user={user}
              onBack={() => setSelectedModuleId(null)}
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
              // Use our new RetroDashboardTabs component here
              <RetroDashboardTabs>
                {/* Learning Tab Content */}
                <div>
                  {/* Personalized Learning Path from Assessment Results */}
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <Award className="h-6 w-6 mr-2 text-primary" />
                        <CardTitle className="text-xl font-bold">Your Personalized Learning Path</CardTitle>
                      </div>
                      <CardDescription>
                        Based on your assessment results, we've created a customized learning path for you
                      </CardDescription>
                    </CardHeader>
                
                    <CardContent className="pt-2">
                      {/* Recommended Focus Areas */}
                      <div className="mb-4">
                        <h3 className="text-md font-semibold mb-2">Recommended Focus Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {assessmentDomains
                            .filter(d => d.weakArea)
                            .map(domain => (
                              <Badge key={domain.id} variant="outline" className="bg-red-50">
                                {domain.name}
                              </Badge>
                            ))}
                          {assessmentDomains
                            .filter(d => !d.weakArea)
                            .slice(0, 2)
                            .map(domain => (
                              <Badge key={domain.id} variant="outline" className="bg-green-50">
                                {domain.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                
                  {/* Mini-Lessons (Top Recommended) */}
                  <MiniLessons
                    title="Your Personalized Mini-Lessons"
                    subtitle="Three mini-lessons tailored just for you based on your assessment results"
                    modules={recommendedModules}
                    onSelect={handleModuleSelect}
                  />
                
                  {/* Monthly Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <MonthlyNewsletter />
                  
                    {/* Media Sidebar */}
                    <MediaSidebar />
                  </div>
                </div>
              </RetroDashboardTabs>
            )}
            
            {/* Admin Tools (only visible to admin users) */}
            {user && user.level >= 5 && (
              <AdminTools />
            )}
            
            {/* Leaderboard */}
            <Leaderboard />
          </div>
        )}
      </div>
    </div>
  );
}