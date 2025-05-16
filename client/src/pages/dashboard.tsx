import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  CheckCircle,
  Building2,
  Shield,
  Music
} from "lucide-react";
import { MonthlyNewsletter } from "@/components/MonthlyNewsletter";
import Leaderboard from "@/components/Leaderboard";
import SimpleLeaderboard from "@/components/SimpleLeaderboard";
import RecentShoutOuts from "@/components/RecentShoutOuts";
import BearAssistant from "@/components/BearAssistant";
import { UltimateEscalator } from "@/components/UltimateEscalator";
import MediaSidebar from "@/components/MediaSidebar";
import AdminTools from "@/components/AdminTools";
import DailyChallenge from "@/components/DailyChallenge";
import AchievementPopup from "@/components/AchievementPopup";

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
const POINTS_PER_BEAR_BUCK = 50;

export default function Dashboard() {
  // We'll calculate Bear Bucks later once we have the user data
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({
    title: "Consistency Champion",
    description: "You've logged in 3 days in a row!",
    points: 10,
    type: "achievement" as const
  });
  const { toast } = useToast();
  
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
  
  // Use the bearBucks property from the user object directly instead of calculating
  const bearBucks = user?.bearBucks || 0;
  
  // Debug output
  console.log("User Bear Bucks data:", {
    bearBucks: user?.bearBucks,
    points: user?.points
  });
  
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
    if (!modules || !Array.isArray(modules)) return [];
    
    // Find Core Values and Mindful Mornings modules
    // Log modules for debugging
    console.log("Available modules:", modules.map(m => ({id: m.id, title: m.title, category: m.category})));
    
    // First look for Core Values module
    const coreValuesModule = modules.find(m => m.id === 33) || // First try by exact ID
                             modules.find(m => m.title === "Raising Arizona's CORE") || // Then by exact title
                             modules.find(m => m.title?.toLowerCase().includes("core") && m.category === "onboarding"); // Then by partial match
    
    console.log("Found Core Values module:", coreValuesModule);
    
    // For Mindful Mornings, we'll use a primary module or fallback to any module with 'mindful-mornings' category
    // Check specific modules first by ID (13, 14, 15, or 24) 
    const mindfulMorningsModule = modules.find(m => 
      // By specific ID first
      [13, 14, 15, 24].includes(m.id) ||
      // Or by category
      m.category === 'mindful-mornings' ||
      // Or as last resort, by title
      (m.title?.toLowerCase().includes("mindful") && m.title?.toLowerCase().includes("morning"))
    );
    
    // Get user progress on these modules
    let hasCompletedCoreValues = false;
    let hasCompletedMindfulMornings = false;
    
    // Log the progress for debugging
    console.log("User progress:", userProgress);
    
    if (userProgress && Array.isArray(userProgress)) {
      hasCompletedCoreValues = userProgress.some(p => 
        coreValuesModule && p.moduleId === coreValuesModule.id && p.completed
      );
      
      hasCompletedMindfulMornings = userProgress.some(p => 
        mindfulMorningsModule && p.moduleId === mindfulMorningsModule.id && p.completed
      );
    }
    
    // Log completion status
    console.log("Core Values completed:", hasCompletedCoreValues);
    console.log("Mindful Mornings completed:", hasCompletedMindfulMornings);
    
    // Start building our recommendations with required modules
    // Define a proper type for our enhanced module
    type EnhancedModule = typeof modules[0] & { required?: boolean };
    
    let recommendations: EnhancedModule[] = [];
    
    // Always prioritize Core Values if not completed
    if (coreValuesModule && !hasCompletedCoreValues) {
      recommendations.push({
        ...coreValuesModule,
        required: true
      });
    }
    
    // Then Mindful Mornings if not completed
    if (mindfulMorningsModule && !hasCompletedMindfulMornings) {
      recommendations.push({
        ...mindfulMorningsModule,
        required: true
      });
    }
    
    // Check user progress for explicitly recommended modules
    const recommendedProgressEntries = Array.isArray(userProgress) 
      ? userProgress.filter(progress => progress.recommended === true)
      : [];
    
    // If we have explicit recommendations, add those next
    if (recommendedProgressEntries.length > 0) {
      const recommendedModuleIds = recommendedProgressEntries.map(progress => progress.moduleId);
      
      const explicitRecommendations = modules.filter(module => 
        recommendedModuleIds.includes(module.id) &&
        // Avoid duplicating modules that are already in our recommendations
        !recommendations.some(r => r.id === module.id)
      );
      
      recommendations = [...recommendations, ...explicitRecommendations];
    } 
    // Otherwise fall back to domain-based recommendations
    else if (weakAreas && weakAreas.length > 0) {
      // Add modules that match weak domain areas
      let domainRecommendations: EnhancedModule[] = [];
      
      for (const domain of weakAreas) {
        const domainModules = modules.filter(module => 
          module.domains && module.domains.includes(domain)
        ).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        
        if (domainModules.length > 0) {
          domainRecommendations = [...domainRecommendations, ...domainModules.slice(0, 2)];
        }
      }
      
      // Deduplicate modules
      domainRecommendations = domainRecommendations.filter(module => 
        // Avoid including modules that are already in our recommendations
        !recommendations.some(r => r.id === module.id)
      );
      
      recommendations = [...recommendations, ...domainRecommendations];
    }
    
    // Limit to a reasonable number of recommendations (keep 2 mandatory + up to 3 others)
    const mandatoryCount = recommendations.filter(m => m.required).length;
    const maxOptionalCount = Math.max(0, 5 - mandatoryCount);
    
    return recommendations.slice(0, mandatoryCount + maxOptionalCount);
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
      // role property is not in the user type anymore, so we omit it
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
              onBack={() => setSelectedModuleId(null)}
              user={user}
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
                    {weakAreas && weakAreas.length > 0 ? (
                      <div className="mb-4">
                        <h3 className="font-semibold text-md mb-1">Recommended Focus Areas</h3>
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
                    
                    {/* Core Required Trainings - Always shown */}
                    <div className="space-y-3 mb-6">
                      <h3 className="font-semibold text-md text-amber-700">Required Core Trainings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Core Values Training Card */}
                        {modules && modules.find(m => m.id === 33) && (
                          <div 
                            onClick={() => handleModuleSelect(33)} 
                            className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition relative"
                          >
                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              Required
                            </div>
                            <h3 className="font-heading font-semibold mb-1">Raising Arizona's CORE</h3>
                            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                              Mandatory onboarding module covering Raising Arizona Preschool's Core Values, philosophy, and teaching approach.
                            </p>
                            
                            {/* Points award indicator */}
                            <div className="flex items-center mb-3 px-2 py-1.5 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex-shrink-0 mr-2">
                                <Award className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-xs text-green-700 font-medium">
                                Complete for 20 XP Points
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-neutral-500">120 min</div>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-3/4"
                              >
                                {userProgress?.some(p => p.moduleId === 33 && p.completed) 
                                  ? "Review Training" 
                                  : "Start Required Training"}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Mindful Mornings Training Card */}
                        {modules && modules.find(m => m.category === 'mindful-mornings') && (
                          <div 
                            onClick={() => {
                              const mindfulModule = modules.find(m => m.category === 'mindful-mornings');
                              if (mindfulModule) handleModuleSelect(mindfulModule.id);
                            }} 
                            className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition relative"
                          >
                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              Required
                            </div>
                            <h3 className="font-heading font-semibold mb-1">Mindful Mornings Training</h3>
                            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                              Start each day with intention. Learn how to implement our signature Mindful Mornings program in your classroom.
                            </p>
                            
                            {/* Points award indicator */}
                            <div className="flex items-center mb-3 px-2 py-1.5 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex-shrink-0 mr-2">
                                <Award className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-xs text-green-700 font-medium">
                                Complete for 20 XP Points
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-neutral-500">45 min</div>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-3/4"
                              >
                                {userProgress?.some(p => 
                                  p.moduleId === modules.find(m => m.category === 'mindful-mornings')?.id && 
                                  p.completed
                                ) 
                                  ? "Review Training" 
                                  : "Start Required Training"}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Chapter 1: Building a Human Card */}
                        {modules && modules.find(m => m.id === 34) && (
                          <div 
                            onClick={() => handleModuleSelect(34)} 
                            className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition relative"
                          >
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              Required
                            </div>
                            <h3 className="font-heading font-semibold mb-1">Chapter 1: Building a Human</h3>
                            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                              Explore childhood development, trauma, attachment theory, and your crucial role in shaping children's futures.
                            </p>
                            
                            {/* Points award indicator */}
                            <div className="flex items-center mb-3 px-2 py-1.5 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex-shrink-0 mr-2">
                                <Award className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-xs text-green-700 font-medium">
                                Complete for 20 XP Points
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-neutral-500">50 min</div>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-3/4"
                              >
                                {userProgress?.some(p => p.moduleId === 34 && p.completed) 
                                  ? "Review Training" 
                                  : "Start Required Training"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Recommended Modules */}
                    {recommendedModules && recommendedModules.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-md">Suggested Learning Modules</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {recommendedModules
                            .filter(module => 
                              // Filter out the Core Values and Mindful Mornings modules since they're already shown above
                              module.id !== 33 && 
                              module.category !== 'mindful-mornings'
                            )
                            .map(module => {
                              return (
                                <div 
                                  key={module.id}
                                  onClick={() => handleModuleSelect(module.id)} 
                                  className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition relative"
                                >
                                  <h3 className="font-heading font-semibold mb-1">{module.title}</h3>
                                  <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{module.description}</p>
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs text-neutral-500">
                                      {module.duration ? `${module.duration} min` : ""}
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                    >
                                      Start Learning
                                    </Button>
                                  </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-neutral-500 mb-3">No specific recommendations yet. Please complete more assessments or modules.</p>
                        <Link to="/modules">
                          <Button>
                            Browse All Modules
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Removed CORE Values Training, Teacher Tools, and Mindful Mornings sections as requested */}
                
                {/* Mini-Lessons Section */}
                <UltimateEscalator />
                
                {/* Dashboard Tools and Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Left Column (2/3 width) */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Assessment Button Card */}
                    <Card className="overflow-hidden border border-amber-200">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <div className="flex items-center">
                          <Book className="h-5 w-5 text-blue-500 mr-2" />
                          <CardTitle className="text-lg">Teacher Assessment</CardTitle>
                        </div>
                        <CardDescription>Track your professional development progress</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <Link to="/assessment">
                          <button className="flex items-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm w-full hover:bg-blue-50 transition">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <i className="ri-file-list-line text-blue-600"></i>
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Assessment Dashboard</p>
                              <p className="text-sm text-gray-500">View your scores and improvement areas</p>
                            </div>
                          </button>
                        </Link>
                      </CardContent>
                    </Card>
                    
                    {/* Video and Audio Library */}
                    <Card className="overflow-hidden border border-amber-200">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-100">
                        <div className="flex items-center">
                          <Music className="h-5 w-5 text-indigo-500 mr-2" />
                          <CardTitle className="text-lg">Video and Audio Library</CardTitle>
                        </div>
                        <CardDescription>Classroom music and training videos</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <MediaSidebar />
                      </CardContent>
                    </Card>
                    
                    {/* Monthly Newsletter */}
                    <MonthlyNewsletter />
                  </div>
                  
                  {/* Right Column (1/3 width) */}
                  <div className="md:col-span-1 space-y-6">
                    {/* Leaderboard */}
                    <SimpleLeaderboard />
                    
                    {/* Recent Core Values Shout Outs */}
                    <RecentShoutOuts />
                    
                    {/* Admin Tools */}
                    <AdminTools />
                    
                    {/* Core Values Shout Out Button */}
                    <div className="mt-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg transition-all"
                        onClick={() => {
                          toast({
                            title: "CORE VALUES SHOUT OUT!",
                            description: "Always remember our 5 values: Be Consistent, Be Prepared, Be Committed, Be Caring, Be Positive!",
                            variant: "default"
                          });
                        }}
                      >
                        CORE VALUES SHOUT OUT! 🙌
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Founder Quote Footer */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-amber-800 font-serif italic">
            "I'm curious, therefore I am."
          </p>
          <p className="text-amber-700 text-sm mt-1">
            — Jared Cook, Founder & Owner
          </p>
        </div>
      </div>
    </div>
  );
}