import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link } from "wouter";
import Header from "@/components/Header";
import ProgressCircle from "@/components/ProgressCircle";
import ChatbotSupport from "@/components/ChatbotSupport";
import ModuleCard from "@/components/ModuleCard";
import CourseCard from "@/components/CourseCard";
import mindfulMorningsLogo from "../assets/images/mindful-mornings-logo.jpg";
import raisingArizonaLogo from "../assets/images/raising-arizona-logo.jpg";

export default function Dashboard() {
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"] 
  });
  
  const { data: userProgress } = useQuery({ 
    queryKey: ["/api/progress"] 
  });
  
  const { data: modules } = useQuery({
    queryKey: ["/api/modules"]
  });
  
  const { data: meetings } = useQuery({
    queryKey: ["/api/meetings"]
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

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Banner with School Motto */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary to-[#ff8c24] rounded-xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center">
                <img 
                  src={raisingArizonaLogo} 
                  alt="Raising Arizona Preschool" 
                  className="h-16 w-16 mr-4 object-contain bg-white rounded-full p-1"
                />
                <h2 className="text-white font-bold text-xl md:text-2xl font-heading">Raising Arizona Preschool</h2>
              </div>
              <div className="mt-2 md:mt-0">
                <p className="text-white italic font-bold text-lg md:text-xl">
                  "School sucks, but mentors rule!"
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
                  Welcome back, <span className="text-primary">{user?.firstName || 'Learner'}</span>!
                </h1>
                <p className="text-neutral-800 mt-2">Continue your professional development journey with personalized learning.</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-heading font-bold">Your Progress</h2>
                  <span className="text-sm text-primary font-semibold">{overallProgress}% Completed</span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-4 mb-6">
                  <div 
                    className="bg-primary h-4 rounded-full" 
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
                    <Link href={`/modules/${mindfulMorningsModules[0].id}`}>
                      <button className="bg-gradient-to-r from-primary to-[#ff8c24] text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition shadow-md">
                        Start Training
                      </button>
                    </Link>
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
      <footer className="bg-gradient-to-r from-primary to-[#ff8c24] py-6 mt-8 shadow-inner">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={raisingArizonaLogo} 
                alt="Raising Arizona Preschool" 
                className="h-12 w-12 mr-3 object-contain bg-white rounded-full p-1"
              />
              <div>
                <h3 className="text-white font-bold">Raising Arizona Preschool</h3>
                <p className="text-white/80 text-sm">Training tomorrow's educators today</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-white font-heading font-bold text-xl italic mb-1">
                "School sucks, but mentors rule!"
              </p>
              <p className="text-white/80 text-sm">
                &copy; {new Date().getFullYear()} Raising Arizona Preschool | MentorMe Platform
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      <ChatbotSupport />
    </div>
  );
}
