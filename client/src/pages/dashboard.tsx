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
import { BackgroundDecorations } from "@/components/BackgroundDecorations";
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
      
      {/* Animal Crossing / Farmville Style Dashboard Header */}
      <div className="py-8 px-4 bg-[#e6f7ff] relative overflow-hidden">
        {/* Cloud decorations */}
        <div className="hidden md:block absolute top-5 left-[5%] w-20 h-10 bg-white rounded-full opacity-80 float-animation" style={{animationDelay: '0s'}}></div>
        <div className="hidden md:block absolute top-12 left-[15%] w-32 h-12 bg-white rounded-full opacity-70 float-animation" style={{animationDelay: '0.5s'}}></div>
        <div className="hidden md:block absolute top-8 left-[60%] w-24 h-10 bg-white rounded-full opacity-60 float-animation" style={{animationDelay: '1s'}}></div>
        <div className="hidden md:block absolute top-16 left-[80%] w-28 h-11 bg-white rounded-full opacity-80 float-animation" style={{animationDelay: '1.5s'}}></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            {/* Welcome Message */}
            <div className="bg-white rounded-3xl px-6 py-4 shadow-md mb-4 md:mb-0 border-4 border-[#e2f5ff]">
              <h1 className="text-2xl md:text-3xl font-game text-[#4a8fe2] drop-shadow-sm">
                Welcome, {user.firstName || 'Teacher'}! 
                <span className="ml-2 text-yellow-500">✿</span>
              </h1>
            </div>
            
            {/* Core Values Button */}
            <Link to="/core-values-shout-out">
              <div className="ac-button group relative overflow-hidden transform hover:scale-105 transition-all py-3 px-6">
                <div className="relative flex items-center justify-center">
                  <span className="mr-3 text-xl">🌟</span>
                  <span className="text-[#603813] font-game text-base tracking-wider pb-1">CORE VALUES SHOUT OUT!</span>
                  <span className="ml-3 text-xl">🍃</span>
                </div>
                
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-[#ffdb80] text-[#603813] text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">NEW!</div>
              </div>
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="ac-header">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Points */}
              <div className="ac-stats-card flex items-center">
                <div className="ac-icon-bg bg-[#fff8e6] p-3 mr-4 float-animation" style={{animationDelay: '0.2s'}}>
                  <Award className="h-7 w-7 text-[#ffaa33]" />
                </div>
                <div>
                  <p className="text-sm text-[#6e7f80] font-medium">Your Points</p>
                  <p className="text-2xl font-game text-[#3a8f7d]">{user?.points || 0}</p>
                </div>
              </div>
              
              {/* Bear Bucks */}
              <div className="ac-stats-card flex items-center">
                <div className="ac-icon-bg bg-[#ffeed6] p-3 mr-4 float-animation" style={{animationDelay: '0.4s'}}>
                  <Coins className="h-7 w-7 text-[#e6961e]" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-[#6e7f80] font-medium">Bear Bucks</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-game text-[#e67e22] mr-2">{bearBucks}</p>
                    <span className="bg-[#ffe9b0] text-[#b25900] rounded-full px-3 py-1 text-sm font-game">
                      🐻
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress to next level */}
              <div className="ac-stats-card flex flex-col justify-center">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-[#6e7f80]">Level {user?.level || 1}</span>
                  <span className="text-sm font-game text-[#6e7f80]">Level {(user?.level || 1) + 1}</span>
                </div>
                <div className="ac-progress-bg mb-2">
                  <div 
                    className="ac-progress-bar" 
                    style={{width: `${((user?.points || 0) % 300) / 300 * 100}%`}}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs font-medium text-[#6e7f80]">
                    <span className="inline-block mr-1">✓</span>
                    {((user?.points || 0) % 300)} points earned
                  </p>
                  <p className="text-xs font-medium text-[#6e7f80]">
                    {300 - ((user?.points || 0) % 300)} points to go
                    <span className="inline-block ml-1">→</span>
                  </p>
                </div>
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
                  {/* Personalized Learning Path from Assessment Results - Animal Crossing Style */}
                  <div className="ac-card mb-6">
                    <div className="ac-card-header">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3 float-animation" style={{animationDelay: '0.3s'}}>
                          <Award className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="ac-card-title">Your Personalized Learning Path</h3>
                          <p className="ac-card-description">
                            Based on your assessment results, we've created a customized learning path for you
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ac-card-content">
                      {/* Recommended Focus Areas */}
                      <div className="mb-4">
                        <h3 className="text-md font-game text-[#5d4037] mb-3">Recommended Focus Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {assessmentDomains
                            .filter(d => d.weakArea)
                            .map(domain => (
                              <span key={domain.id} className="ac-badge weak">
                                {domain.name}
                              </span>
                            ))}
                          {assessmentDomains
                            .filter(d => !d.weakArea)
                            .slice(0, 2)
                            .map(domain => (
                              <span key={domain.id} className="ac-badge">
                                {domain.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                
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