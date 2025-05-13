import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link } from "wouter";
import Header from "@/components/Header";
import ProgressCircle from "@/components/ProgressCircle";
import ModuleCard from "@/components/ModuleCard";
import CourseCard from "@/components/CourseCard";
import MediaSidebar from "@/components/MediaSidebar";
import AchievementsSection from "@/components/AchievementsSection";
import BearAssistant from "@/components/BearAssistant";
import ModuleView from "@/components/ModuleView";
import SpinWheel from "@/components/SpinWheel";
import GiftBoxGame from "@/components/GiftBoxGame";
import Leaderboard from "@/components/Leaderboard";
import { MonthlyNewsletter } from "@/components/MonthlyNewsletter";
import { SuessifyGenerator } from "@/components/SuessifyGenerator";
import PersonalizedLearningPath from "@/components/PersonalizedLearningPath";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import mindfulMorningsLogo from "../assets/images/mindful-mornings-logo.jpg";
import raisingArizonaLogo from "../assets/images/raising-arizona-logo.jpg";

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
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  
  const { data: user, isLoading: isLoadingUser, isError: isUserError } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    retry: 3 // Try a few times to fetch the user data
  });
  
  // Only fetch these resources if we have a user
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"],
    enabled: !!user,
    retry: 3
  });
  
  const { data: modules } = useQuery({ 
    queryKey: ["/api/modules"],
    enabled: !!user,
    retry: 3
  });
  
  const { data: meetings } = useQuery({ 
    queryKey: ["/api/meetings"],
    enabled: !!user,
    retry: 3
  });
  
  const { data: assessments } = useQuery({ 
    queryKey: ["/api/assessments"],
    enabled: !!user,
    retry: 3
  });
  
  const { data: storeItems } = useQuery({ 
    queryKey: ["/api/store"],
    enabled: !!user,
    retry: 3
  });
  
  // Determine if the user has completed an assessment
  const hasCompletedAssessment = useMemo(() => {
    if (!assessments) {
      return false;
    }
    
    return assessments.length > 0 && assessments.some((assessment) => assessment.completed);
  }, [assessments]);
  
  // Get recommended modules based on assessment results
  const getRecommendedModules = () => {
    if (!hasCompletedAssessment || !modules || !assessments || assessments.length === 0) {
      return [];
    }
    
    // Get the most recent assessment
    const latestAssessment = assessments[assessments.length - 1];
    
    // Extract personalized learning path if available
    const personalizedLearningPath = latestAssessment.personalizedLearningPath || [];
    
    // Extract domain priorities from incorrectAnswers field if available
    let sortedDomains = [];
    
    if (latestAssessment.incorrectAnswers) {
      // Use the precomputed incorrect answers by domain
      const domainCounts = {};
      
      // Count number of incorrect answers per domain
      Object.entries(latestAssessment.incorrectAnswers as Record<string, string[]>).forEach(([domain, questions]) => {
        domainCounts[domain] = questions.length;
      });
      
      // Sort domains by number of incorrect answers (descending)
      sortedDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([domain]) => domain);
    } else if (latestAssessment.growthAreas && latestAssessment.growthAreas.length > 0) {
      // Fallback to growth areas if incorrectAnswers not available
      sortedDomains = latestAssessment.growthAreas;
    } else if (latestAssessment.results) {
      // Legacy fallback: analyze results manually if incorrectAnswers not available
      const incorrectAnswersList = [];
      
      // Extract domain from question ID pattern (like "classroom-management-beginner-1")
      Object.entries(latestAssessment.results).forEach(([questionId, answer]) => {
        const domain = questionId.split('-')[0];
        
        // Check if domain score indicates incorrect answers
        if (latestAssessment.domainScores && 
            latestAssessment.domainScores[domain] && 
            latestAssessment.domainScores[domain].score < 100) {
          incorrectAnswersList.push({ questionId, domain });
        }
      });
      
      // Count domains with incorrect answers
      const domainCounts = {};
      incorrectAnswersList.forEach(({ domain }) => {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
      
      // Sort domains by number of incorrect answers
      sortedDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([domain]) => domain);
    }
    
    // Get modules recommended for these priority domains
    // Start with explicitly recommended modules if available
    let recommendedModules = [];
    
    if (latestAssessment.recommendedModules && latestAssessment.recommendedModules.length > 0) {
      // Get module objects by ID
      recommendedModules = modules.filter(module => 
        latestAssessment.recommendedModules.includes(module.id)
      );
    }
    
    // If no explicit recommendations, select modules based on domains
    if (recommendedModules.length === 0) {
      // First get 1-2 foundational modules for each prioritized domain
      sortedDomains.slice(0, 3).forEach(domain => {
        const domainModules = modules.filter(module => 
          module.domain === domain && module.difficulty === 'foundational'
        ).sort((a, b) => a.id - b.id);
        
        // Add up to 2 foundational modules per domain
        recommendedModules = [...recommendedModules, ...domainModules.slice(0, 2)];
      });
    }
    
    return recommendedModules;
  };
  
  // Calculate total modules
  const totalModulesCount = modules ? modules.length : 0;
  
  // Calculate the user's overall progress
  const overallProgress = useMemo(() => {
    if (!userProgress || !modules) {
      return 0;
    }
    
    const completedModulesCount = userProgress.reduce((acc, curr) => {
      return curr.completed ? acc + 1 : acc;
    }, 0);
    
    return Math.round((completedModulesCount / totalModulesCount) * 100);
  }, [userProgress, modules, totalModulesCount]);
  
  // Get modules in progress 
  const inProgressModules = useMemo(() => {
    if (!modules || !userProgress) {
      return [];
    }
    
    return modules.filter(module => 
      userProgress.some(progress => 
        progress.moduleId === module.id && progress.progress > 0 && !progress.completed
      )
    );
  }, [modules, userProgress]);
  
  // Get completed modules
  const completedModules = useMemo(() => {
    if (!modules || !userProgress) {
      return [];
    }
    
    return modules.filter(module => 
      userProgress.some(progress => 
        progress.moduleId === module.id && progress.completed
      )
    );
  }, [modules, userProgress]);
  
  // Get recommended modules
  const recommendedModules = useMemo(() => {
    if (!hasCompletedAssessment) {
      return [];
    }
    
    return getRecommendedModules();
  }, [hasCompletedAssessment, modules, assessments]);
  
  // Get modules that haven't been started yet
  const notStartedModules = useMemo(() => {
    if (!modules || !userProgress) {
      return [];
    }
    
    return modules.filter(module => 
      !userProgress.some(progress => progress.moduleId === module.id)
    );
  }, [modules, userProgress]);
  
  // Get Core Values modules, including the LEGO-themed "Building a Child" module
  const coreValuesModules = modules?.filter(module => 
    module.category === 'core-values'
  ) || [];

  // Get upcoming deadlines
  const upcomingMeetings = meetings?.filter(meeting => 
    new Date(meeting.startTime) > new Date()
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  .slice(0, 3) || [];

  // Handle module selection for dynamic lessons
  const handleModuleSelect = (moduleId: number) => {
    setSelectedModuleId(moduleId);
  };
  
  // If a module is selected, show the module view
  if (selectedModuleId !== null && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <ModuleView 
            moduleId={selectedModuleId} 
            user={user} 
            onBack={() => setSelectedModuleId(null)} 
          />
        </main>
        <BearAssistant user={user} />
      </div>
    );
  }
  
  // Calculate Bear Bucks based on points
  const calculateBearBucks = (points: number) => {
    return Math.floor(points / POINTS_PER_BEAR_BUCK);
  };
  
  // Progress stats for the dashboard
  const progressStats = [
    { 
      label: "Completed", 
      value: completedModules?.length || 0, 
      color: "primary" 
    },
    { 
      label: "In Progress", 
      value: inProgressModules?.length || 0, 
      color: "secondary" 
    },
    { 
      label: "To Start", 
      value: notStartedModules?.length || 0, 
      color: "accent" 
    },
    { 
      label: "Overall", 
      value: overallProgress || 0, 
      color: "destructive" 
    }
  ];

  // Slice the in-progress courses to display only a few
  const inProgressCourses = inProgressModules?.slice(0, 3) || [];
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Assessment Required Notification OR Personalized Recommendations */}
        {user && (
          <section className="mb-8">
            {!hasCompletedAssessment ? (
              <div className="bg-destructive text-destructive-foreground rounded-xl px-6 py-4 shadow-lg relative overflow-hidden animate-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center">
                    <div className="mr-4 text-4xl">⚠️</div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold">Assessment Required!</h2>
                      <p className="text-sm md:text-base max-w-2xl">
                        Welcome to MentorMe! To provide you with personalized training, please complete
                        your initial assessment questionnaire. This will help identify your strengths and
                        areas for growth based on ITERS/ECERS and CLASS standards.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 md:mt-0 flex-shrink-0">
                    <Link to="/assessment">
                      <button className="px-4 py-2 bg-background text-foreground font-semibold rounded-md border-2 
                        border-background hover:bg-transparent hover:text-background transition-all duration-200">
                        Start Assessment
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                {/* Add personalized learning path component */}
                {assessments && assessments.length > 0 && assessments[assessments.length - 1].personalizedLearningPath && 
                 assessments[assessments.length - 1].personalizedLearningPath.length > 0 ? (
                  <PersonalizedLearningPath 
                    learningPath={assessments[assessments.length - 1].personalizedLearningPath} 
                  />
                ) : (
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <h3 className="font-bold text-primary mb-2">Your assessment is complete!</h3>
                    <p className="text-sm mb-3">Browse our recommended modules to continue your learning journey.</p>
                    <Link to="/modules">
                      <Button variant="outline" size="sm">
                        Browse All Modules
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        
        {/* Banner with School Motto */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl px-6 py-5 shadow-lg relative overflow-hidden">
            {/* Bear icon pattern overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M50,10 C70,10 85,25 85,45 C85,65 70,80 50,80 C30,80 15,65 15,45 C15,25 30,10 50,10 Z" fill="currentColor" />
                <circle cx="35" cy="35" r="5" fill="white" />
                <circle cx="65" cy="35" r="5" fill="white" />
                <path d="M40,60 C45,65 55,65 60,60" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Building Chapter One</h2>
                <p className="text-white/90 md:max-w-lg">
                  Every interaction with a child is a building block in their story. 
                  At Raising Arizona, we're committed to making "Chapter One" count!
                </p>
              </div>
              
              <div className="hidden md:block">
                <img 
                  src={raisingArizonaLogo} 
                  alt="Raising Arizona Logo" 
                  className="h-20 w-20 object-contain rounded-full bg-white p-2"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview */}
            {user && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold">Your Training Progress</h2>
                  
                  {/* Points & Bear Bucks Display */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 12l-4 4-4-4M12 8v7" />
                      </svg>
                      <span>{user.points || 0} Points</span>
                    </div>
                    
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 8 1.79 4 4-1.79 4-4 4z" />
                      </svg>
                      <span>{calculateBearBucks(user.points || 0)} Bear Bucks</span>
                      <span className="ml-1 text-xs">(1 Bear Buck = {POINTS_PER_BEAR_BUCK} Points)</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-neutral-500 mb-4">
                  Track your training journey and see how far you've come.
                </p>
                
                <div className="w-full bg-neutral-200 rounded-full h-4 mb-6">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {progressStats.map((stat, index) => (
                    <div className="text-center" key={index}>
                      <ProgressCircle 
                        value={stat.value} 
                        color={stat.color} 
                      />
                      <p className="text-sm mt-2 font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-heading font-bold">Continue Learning</h2>
                <Link href="/modules" className="text-sm text-primary font-semibold hover:underline">
                  View All Courses
                </Link>
              </div>
              
              <div className="space-y-4">
                {inProgressCourses.length > 0 ? (
                  inProgressCourses.map(course => (
                    <div
                      onClick={() => handleModuleSelect(course.id)}
                      className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition cursor-pointer" 
                      key={course.id}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-heading font-semibold">{course.title}</h3>
                          <div className="flex items-center mt-1">
                            <div className="w-full bg-neutral-200 rounded-full h-2 mr-2" style={{ maxWidth: "150px" }}>
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ 
                                  width: `${userProgress?.find(p => p.moduleId === course.id)?.progress || 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500">
                              {userProgress?.find(p => p.moduleId === course.id)?.progress || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium self-start">
                          {course.difficulty}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-neutral-100 inline-flex rounded-full p-3 mb-3">
                      <svg 
                        className="h-6 w-6 text-neutral-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                        />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-1">No modules in progress</h3>
                    <p className="text-sm text-neutral-500 mb-4">Start a new module to continue your learning journey</p>
                    <Link to="/modules">
                      <Button size="sm">Browse Modules</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Events/Meetings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-heading font-bold">Upcoming Events</h2>
                <Link href="/meetings" className="text-sm text-primary font-semibold hover:underline">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map(meeting => (
                    <div className="border border-neutral-200 rounded-lg p-4" key={meeting.id}>
                      <div className="flex flex-col md:flex-row md:justify-between">
                        <div>
                          <h3 className="font-heading font-semibold mb-1">{meeting.title}</h3>
                          <p className="text-sm text-neutral-600">{meeting.description?.slice(0, 100)}...</p>
                        </div>
                        <div className="mt-2 md:mt-0 md:ml-4 flex flex-col items-start md:items-end">
                          <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium mb-1">
                            {new Date(meeting.startTime).toLocaleDateString()}
                          </div>
                          <span className="text-xs text-neutral-500">
                            {new Date(meeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-neutral-100 inline-flex rounded-full p-3 mb-3">
                      <svg 
                        className="h-6 w-6 text-neutral-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-1">No upcoming events</h3>
                    <p className="text-sm text-neutral-500 mb-4">Events and trainings will appear here</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recommended Courses */}
            {recommendedModules && recommendedModules.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-heading font-bold">Recommended For You</h2>
                  <Link href="/modules" className="text-sm text-primary font-semibold hover:underline">
                    View All
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendedModules.slice(0, 3).map(module => (
                    <ModuleCard 
                      key={module.id}
                      module={module}
                      progress={userProgress?.find(p => p.moduleId === module.id)?.progress || 0}
                      onClick={() => handleModuleSelect(module.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* LEGO-themed Core Values Training */}
            {coreValuesModules && coreValuesModules.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-100 opacity-50 rounded-full"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-100 opacity-50 rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-heading font-bold">Building Chapter One Training</h2>
                    <img 
                      src={raisingArizonaLogo} 
                      alt="Raising Arizona Logo" 
                      className="h-10 w-10 object-contain rounded-full"
                    />
                  </div>
                  
                  <p className="text-neutral-600 mb-4">
                    Learn how we're building Chapter One into each child's life with our core values.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coreValuesModules.filter(p => p.title.includes("Building")).length > 0 ? (
                      coreValuesModules.filter(p => p.title.includes("Building")).map(module => (
                        <div 
                          key={module.id}
                          onClick={() => handleModuleSelect(module.id)} 
                          className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition"
                        >
                          <h3 className="font-heading font-semibold mb-2">{module.title}</h3>
                          <p className="text-sm text-neutral-600 mb-3">{module.description.slice(0, 80)}...</p>
                          <Button variant="outline" size="sm">
                            Start Learning
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6">
                        <p>Coming soon - Our LEGO-themed core values training!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Mindful Mornings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <img 
                  src={mindfulMorningsLogo} 
                  alt="Mindful Mornings" 
                  className="h-10 w-10 mr-3 rounded-full object-cover"
                />
                <h2 className="text-xl font-heading font-bold">Mindful Mornings</h2>
              </div>
              
              <p className="text-neutral-600 mb-4">
                Start your day with mindfulness practices designed for preschool settings.
              </p>
              
              {modules && modules.filter(m => m.category === 'mindful-mornings').length > 0 ? (
                <div className="space-y-3">
                  {modules.filter(module => module.category === 'mindful-mornings')
                    .slice(0, 1)
                    .map(module => (
                      <div 
                        key={module.id}
                        onClick={() => handleModuleSelect(module.id)}
                        className="border border-neutral-200 hover:border-primary transition rounded-lg p-3 cursor-pointer"
                      >
                        <h3 className="font-medium text-sm">{module.title}</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-full bg-neutral-200 rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ 
                                width: `${userProgress?.find(p => p.moduleId === module.id)?.progress || 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  <Link to="/modules?category=mindful-mornings">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Mindfulness Modules
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-neutral-500">Mindfulness modules coming soon</p>
                </div>
              )}
            </div>
            
            {/* Media Resources */}
            <MediaSidebar />
            
            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-heading font-bold mb-4">Leaderboard</h2>
              <Leaderboard />
            </div>
            
            {/* Achievement Highlights */}
            <AchievementsSection />
            
            {/* Store & Rewards Access */}
            {user && (
              <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-bold mb-2">Bear Bucks Rewards</h2>
                <p className="text-sm text-neutral-700 mb-4">
                  You have {calculateBearBucks(user.points || 0)} Bear Bucks to spend on rewards!
                </p>
                
                <div className="flex flex-col space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" className="bg-amber-500 hover:bg-amber-600">
                        Spin to Win
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-[500px] p-0 bg-transparent border-none">
                      <SpinWheel closeDialog={() => {}} />
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-amber-500 text-amber-700">
                        Mystery Gift Box
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-[500px] p-0 bg-transparent border-none">
                      <GiftBoxGame />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {user && <BearAssistant user={user} />}
    </div>
  );
}