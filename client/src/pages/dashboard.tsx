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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Dashboard() {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
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
    retry: 3
  });
  
  const { data: meetings } = useQuery({
    queryKey: ["/api/meetings"],
    enabled: !!user,
    retry: 3
  });
  
  // Query the user's assessment status
  const { data: assessments } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: !!user,
    retry: 3
  });
  
  // Check if user has completed at least one assessment
  const hasCompletedAssessment = Array.isArray(assessments) && assessments.some(
    assessment => assessment.completed
  );
  
  // Find recommended lessons based on assessment results
  const recommendedLessons = useMemo(() => {
    if (!hasCompletedAssessment || !modules || !assessments || assessments.length === 0) {
      return [];
    }
    
    // Get the most recent assessment
    const latestAssessment = assessments[assessments.length - 1];
    
    // Extract domain priorities from incorrectAnswers field if available
    let sortedDomains: string[] = [];
    
    if (latestAssessment.incorrectAnswers) {
      // Use the precomputed incorrect answers by domain
      const domainCounts: Record<string, number> = {};
      
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
      const incorrectAnswersList: {questionId: string; domain: string}[] = [];
      
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
      const domainCounts: Record<string, number> = {};
      incorrectAnswersList.forEach(({ domain }) => {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
      
      // Sort domains by number of incorrect answers (descending)
      sortedDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([domain]) => domain);
    }
    
    // Find modules related to the priority domains
    const recommendedModules = modules.filter(module => {
      // Match modules to domains based on keywords in title or description
      const moduleText = `${module.title.toLowerCase()} ${module.description.toLowerCase()}`;
      
      // Check if module matches any of the top domains with incorrect answers
      return sortedDomains.some(domain => {
        const domainInfo = domains.find(d => d.id === domain);
        return domainInfo && moduleText.includes(domainInfo.name.toLowerCase());
      });
    });
    
    // If there are no direct domain matches, use difficulty-based recommendations
    if (recommendedModules.length === 0 && modules.length > 0) {
      return modules
        .filter(module => module.difficulty === 'beginner')
        .sort((a, b) => a.id - b.id)
        .slice(0, 3);
    }
    
    // Return top 3 recommended modules
    return recommendedModules.slice(0, 3);
  }, [hasCompletedAssessment, modules, assessments]);
  
  // Debug logging for authentication issues
  console.log("[Dashboard] Authentication state:", { 
    user, 
    isLoadingUser, 
    isUserError,
    userProgress,
    modules,
    meetings,
    assessments,
    hasCompletedAssessment
  });

  // Calculate overall progress
  const overallProgress = userProgress?.length 
    ? Math.round(userProgress.reduce((acc, curr) => acc + curr.progress, 0) / userProgress.length) 
    : 0;

  // Progress stats
  const progressStats = [
    { label: "Modules", value: 75, color: "secondary" },
    { label: "Quizzes", value: 42, color: "primary" },
    { label: "Activities", value: 58, color: "accent" },
    { label: "Meetings", value: 20, color: "destructive" }
  ];

  // Get in-progress courses
  const inProgressCourses = modules?.filter(module => 
    userProgress?.some(progress => 
      progress.moduleId === module.id && progress.progress > 0 && !progress.completed
    )
  ) || [];

  // Get recommended courses
  const recommendedCourses = modules?.filter(module => 
    !userProgress?.some(progress => 
      progress.moduleId === module.id
    )
  ).slice(0, 3) || [];
  
  // Get Mindful Mornings modules
  const mindfulMorningsModules = modules?.filter(module => 
    module.category === 'mindful-mornings'
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
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-800">Your Personalized Learning Path</h2>
                    <p className="text-neutral-600">Based on your assessment results, here are your recommended lessons</p>
                  </div>
                </div>
                
                {recommendedLessons && recommendedLessons.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Top 3 Recommended Lessons</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {recommendedLessons.map((module, index) => (
                        <div key={module.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 hover:border-primary transition shadow-sm">
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-3">
                              {index + 1}
                            </div>
                            <h4 className="font-semibold">{module.title}</h4>
                          </div>
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{module.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {module.difficulty}
                            </span>
                            <button 
                              onClick={() => handleModuleSelect(module.id)}
                              className="text-sm bg-primary text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-opacity-90 transition"
                            >
                              Start Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Link to="/modules">
                        <button className="flex items-center text-primary hover:underline">
                          View all modules
                          <svg className="ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 p-6 rounded-lg text-center">
                    <p>Great job on your assessment! Explore our available modules to continue your learning journey.</p>
                    <Link to="/modules">
                      <button className="mt-4 bg-primary text-white rounded-lg px-4 py-2 font-semibold hover:bg-opacity-90 transition">
                        Browse Modules
                      </button>
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
                <path d="M40,55 C45,60 55,60 60,55" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>
            
            <div className="flex items-center justify-between flex-wrap relative z-10">
              <div className="flex items-center">
                <div className="h-16 w-16 mr-4 relative">
                  <img 
                    src={raisingArizonaLogo} 
                    alt="Raising Arizona Preschool" 
                    className="h-full w-full object-contain bg-white rounded-full p-1.5 shadow-md"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-bold text-white">🐻</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl md:text-2xl font-heading">Raising Arizona Preschool</h2>
                  <p className="text-white/80 text-xs md:text-sm">Teacher Training Portal • MentorMe</p>
                </div>
              </div>
              <div className="mt-2 md:mt-0 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                <p className="text-white italic font-bold text-base md:text-xl">
                  "Every Genius that ever was had a Mentor."
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-neutral-800">
                  Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user?.firstName || 'Learner'}</span>!
                </h1>
                <p className="text-neutral-700 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Continue your professional development journey with personalized learning
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-t-4 border-primary">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-heading font-bold text-primary">Your Progress</h2>
                  </div>
                  <div className="bg-primary/10 rounded-full px-3 py-1">
                    <span className="text-sm text-primary font-semibold">{overallProgress}% Completed</span>
                  </div>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-4 mb-6 overflow-hidden">
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
                      <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition cursor-pointer" key={course.id}>
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
                                ></div>
                              </div>
                              <span className="text-xs text-neutral-800">
                                {userProgress?.find(p => p.moduleId === course.id)?.progress || 0}%
                              </span>
                            </div>
                          </div>
                          <Link href={`/modules/${course.id}`}>
                            <button className="bg-primary text-white rounded-lg px-3 py-1 text-sm font-semibold hover:bg-opacity-90 transition">
                              Resume
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No courses in progress. Start learning today!</p>
                      <Link href="/assessment">
                        <button className="mt-4 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-opacity-90 transition">
                          Take Assessment
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-80 space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Your Teacher Level</h2>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#e6ecff] mx-auto flex items-center justify-center border-4 border-[#0030b8]">
                    <i className="ri-award-line text-2xl text-[#0030b8]"></i>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <p className="font-bold text-lg text-[#0030b8]">Assistant Teacher</p>
                  <p className="text-sm text-gray-600">Level 1 of 4</p>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2 mb-6">
                  <div className="bg-[#0030b8] h-2 rounded-full" style={{ width: "25%" }}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#e6ecff] flex items-center justify-center mr-3">
                      <i className="ri-checkbox-circle-fill text-[#0030b8]"></i>
                    </div>
                    <span className="text-sm">Assistant Teacher</span>
                    <span className="ml-auto text-xs bg-[#e6ecff] text-[#0030b8] px-2 py-1 rounded-full">Current</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <span className="text-sm text-neutral-600">Lead Teacher</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <span className="text-sm text-neutral-600">Senior Teacher</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">4</span>
                    </div>
                    <span className="text-sm text-neutral-600">Master Lead Teacher</span>
                    <span className="ml-auto text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded-full">Top Level</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Upcoming Meetings</h2>
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMeetings.map(meeting => (
                      <div className="border-l-4 border-primary pl-3" key={meeting.id}>
                        <p className="font-semibold text-sm">{meeting.title}</p>
                        <p className="text-xs text-neutral-800">
                          {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground text-sm">No upcoming meetings</p>
                    <Link href="/schedule">
                      <button className="mt-4 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-opacity-90 transition w-full">
                        Schedule Meeting
                      </button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="bg-primary bg-opacity-10 rounded-xl p-6">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <i className="ri-customer-service-2-line text-xl text-primary"></i>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold">Need help?</h3>
                    <p className="text-sm my-2">Our support team is ready to assist you with any questions.</p>
                    <button 
                      className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-opacity-90 transition mt-2 w-full"
                      onClick={() => document.getElementById('chatbot')?.classList.remove('hidden')}
                    >
                      Chat with Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Recommended Courses */}
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-bold mb-6">Recommended for You</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
        
        {/* Mindful Mornings Section */}
        <section className="mb-12">
          <div className="bg-[#f5f8ff] rounded-xl p-8 border-2 border-primary shadow-lg">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 mb-6 md:mb-0 md:mr-8">
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <img 
                      src={mindfulMorningsLogo} 
                      alt="Mindful Mornings" 
                      className="h-20 mr-4 rounded-lg shadow-md"
                    />
                    <div className="absolute -top-2 -right-2 bg-[#ff8c24] text-white text-xs px-2 py-1 rounded-full font-bold">
                      Featured
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-[#ff8c24] bg-clip-text text-transparent">
                      Mindful Mornings
                    </h2>
                    <p className="text-sm italic font-medium">A Raising Arizona exclusive program</p>
                  </div>
                </div>
                <p className="mb-6 text-[#333]">Start each day with purpose and calm. Our Mindful Mornings program helps teachers develop emotional regulation, positive self-image, and gratitude practices to share with children.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {mindfulMorningsModules.length > 0 && (
                    <button 
                      onClick={() => handleModuleSelect(mindfulMorningsModules[0].id)}
                      className="bg-gradient-to-r from-primary to-[#ff8c24] text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition shadow-md"
                    >
                      Start Training
                    </button>
                  )}
                  <button className="border-2 border-primary text-primary rounded-lg px-6 py-3 font-semibold hover:bg-primary/10 transition">
                    Program Details
                  </button>
                </div>
              </div>
              
              <div className="w-full md:w-1/3">
                <div className="bg-white p-6 rounded-lg shadow-md border border-primary/20">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="text-primary font-bold">🌟</span>
                    </div>
                    <h3 className="font-semibold text-primary">Training Modules</h3>
                  </div>
                  <div className="pl-11">
                    <p className="text-xs text-neutral-600 mb-4 italic">Memorize "Breathe, Smile, Be Present" for lunch reward!</p>
                  </div>
                  <ul className="space-y-3">
                    {mindfulMorningsModules.map((module) => (
                      <li key={module.id} className="flex items-center bg-neutral-50 p-2 rounded-md border-l-4 border-primary">
                        <Link href={`/modules/${module.id}`} className="w-full">
                          <span className="text-sm hover:text-primary font-medium cursor-pointer transition">
                            {module.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Learning Modules */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-heading font-bold">Learning Modules</h2>
            <div className="flex space-x-2">
              <button className="text-neutral-800 hover:text-primary transition">
                <i className="ri-filter-3-line text-xl"></i>
              </button>
              <button className="text-neutral-800 hover:text-primary transition">
                <i className="ri-search-line text-xl"></i>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules?.slice(0, 4).map(module => (
                <ModuleCard key={module.id} module={module} progress={userProgress?.find(p => p.moduleId === module.id)?.progress || 0} />
              ))}
            </div>
            
            {/* Right sidebar with featured content */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1607453998774-d533f65dac99?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" 
                  alt="Language exchange group" 
                  className="w-full h-40 object-cover"
                />
                
                <div className="p-6">
                  <span className="bg-primary text-white text-xs font-bold rounded-full px-3 py-1 mb-3 inline-block">Featured</span>
                  <h3 className="font-heading font-bold text-lg mb-2">Weekly Language Exchange</h3>
                  <p className="text-sm text-neutral-800 mb-4">Join our community language exchange event to practice conversation with native speakers</p>
                  <div className="flex items-center text-sm mb-4">
                    <i className="ri-calendar-line mr-2 text-primary"></i>
                    <span>Fridays • 2:00 PM EST</span>
                  </div>
                  <button className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-opacity-90 transition w-full">Register Now</button>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-6 mb-6 border-2 border-[#ff8c24] border-opacity-30">
                <h3 className="font-heading font-bold text-lg mb-4 text-[#ff8c24]">Achievement Level</h3>
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff8c24] to-[#0030b8] mb-4">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#0030b8]">
                        {Math.round(overallProgress/20) || 1}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-lg mb-1">
                      {overallProgress >= 80 ? "Master Lead Teacher" :
                       overallProgress >= 60 ? "Lead Teacher" :
                       overallProgress >= 40 ? "Associate Teacher" :
                       overallProgress >= 20 ? "Assistant Teacher" : 
                       "Teacher in Training"}
                    </h4>
                    <p className="text-sm text-neutral-600 mb-3">
                      {overallProgress >= 80 ? "Amazing! You've mastered the content." :
                       overallProgress >= 60 ? "Great progress! Almost at master level." :
                       overallProgress >= 40 ? "Good progress! Keep learning." :
                       overallProgress >= 20 ? "You're on your way! Keep going." : 
                       "Just getting started. Welcome!"}
                    </p>
                    <div className="w-full bg-neutral-200 rounded-full h-3 mb-1">
                      <div 
                        className="bg-gradient-to-r from-[#ff8c24] to-[#0030b8] h-3 rounded-full" 
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {overallProgress}% to next level
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Media Resources Section */}
              <div className="bg-white rounded-xl overflow-hidden mb-6 shadow-md">
                <MediaSidebar />
              </div>
              
              <div className="bg-neutral-100 rounded-xl p-6">
                <h3 className="font-heading font-bold text-lg mb-4">Learning Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">Time Spent Learning</span>
                      <span className="text-sm font-bold">12.5 hours</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "62%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">Modules Completed</span>
                      <span className="text-sm font-bold">
                        {userProgress?.filter(p => p.completed).length || 0}/{modules?.length || 0}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ 
                          width: modules?.length 
                            ? `${((userProgress?.filter(p => p.completed).length || 0) / modules.length) * 100}%` 
                            : "0%" 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">Quiz Accuracy</span>
                      <span className="text-sm font-bold">78%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">Meetings Completed</span>
                      <span className="text-sm font-bold">
                        {meetings?.filter(m => m.status === "completed").length || 0}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: "42%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer with motto */}
      <footer className="mt-8 border-t border-neutral-200">
        <div className="bg-primary/5 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="relative mr-3">
                  <img 
                    src={raisingArizonaLogo} 
                    alt="Raising Arizona Preschool" 
                    className="h-14 w-14 object-contain bg-white rounded-lg p-1 shadow-md border border-primary/20"
                  />
                  <svg className="absolute -top-2 -right-2 w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="white"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm1-9.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5V6c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v1.5z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">Raising Arizona Preschool</h3>
                  <p className="text-neutral-600 text-sm flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Training tomorrow's educators today
                  </p>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="inline-block bg-gradient-to-r from-primary to-secondary p-[2px] rounded-lg mb-2">
                  <div className="bg-white px-4 py-2 rounded-[6px]">
                    <p className="font-heading font-bold text-lg italic bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      "Every Genius that ever was had a Mentor."
                    </p>
                  </div>
                </div>
                <p className="text-neutral-600 text-sm">
                  &copy; {new Date().getFullYear()} Raising Arizona Preschool | MentorMe Platform
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center">
              <ul className="flex space-x-6 mb-4 md:mb-0">
                <li><a href="#" className="text-sm text-primary hover:text-secondary">About Us</a></li>
                <li><a href="#" className="text-sm text-primary hover:text-secondary">Contact</a></li>
                <li><a href="#" className="text-sm text-primary hover:text-secondary">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-primary hover:text-secondary">Terms of Service</a></li>
              </ul>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.1 10.1 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      <BearAssistant user={user} />
    </div>
  );
}
