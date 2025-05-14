import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { LearningModule as LearningModuleType, UserProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Mock lessons data (would come from API in production)
const lessons = [
  {
    id: 1,
    title: "Key Concepts and Theory",
    duration: 15,
    type: "theory",
    completed: false,
  },
  {
    id: 2,
    title: "Classroom Applications",
    duration: 15,
    type: "practical",
    completed: false,
  },
  {
    id: 3,
    title: "Video Demonstrations",
    duration: 20,
    type: "video",
    completed: false,
  },
  {
    id: 4,
    title: "Hands-on Activities",
    duration: 15,
    type: "interactive",
    completed: false,
  },
  {
    id: 5,
    title: "Knowledge Assessment",
    duration: 15,
    type: "assessment",
    completed: false,
  },
];

export default function LearningModulePage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const moduleId = parseInt(id);
  
  // Current lesson state
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Get module data
  const { data: module, isLoading: isModuleLoading } = useQuery<LearningModuleType>({
    queryKey: [`/api/modules/${moduleId}`],
    enabled: !!moduleId && !isNaN(moduleId),
  });
  
  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });
  
  // Set the completed status of lessons based on progress
  useEffect(() => {
    if (progressData && module) {
      const moduleProgress = progressData.find(p => p.moduleId === module.id);
      if (moduleProgress) {
        setCurrentProgress(moduleProgress.progress);
        
        // If progress exists but no current lesson, set to the first uncompleted lesson
        if (currentLessonId === null) {
          const progressPercentPerLesson = 100 / lessons.length;
          const completedLessons = Math.floor(moduleProgress.progress / progressPercentPerLesson);
          
          if (completedLessons < lessons.length) {
            setCurrentLessonId(lessons[completedLessons].id);
          } else {
            setCurrentLessonId(lessons[0].id);
          }
        }
      } else {
        // No progress yet, start with the first lesson
        setCurrentLessonId(lessons[0].id);
      }
    }
  }, [progressData, module, currentLessonId]);
  
  // Update progress mutation
  const { mutate: updateProgress, isPending } = useMutation({
    mutationFn: async (data: { moduleId: number; progress: number; completed: boolean }) => {
      return await apiRequest("/api/progress", { method: "POST", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      toast({
        title: "Progress updated",
        description: "Your learning progress has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message || "There was an error saving your progress.",
        variant: "destructive",
      });
    },
  });
  
  // Complete current lesson and progress to next
  const completeLesson = () => {
    if (!module) return;
    
    const currentLessonIndex = lessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentLessonIndex === -1) return;
    
    // Calculate new progress
    const progressPerLesson = 100 / lessons.length;
    const newProgress = Math.min(100, Math.round((currentLessonIndex + 1) * progressPerLesson));
    
    // Update progress in the database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: newProgress === 100
    });
    
    // Update local state
    setCurrentProgress(newProgress);
    
    // Move to next lesson if available
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentLessonIndex + 1].id);
    }
  };
  
  // Loading state
  if (isModuleLoading || isProgressLoading) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
        <ChatbotSupport />
      </div>
    );
  }
  
  // Module not found
  if (!module) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Module Not Found</CardTitle>
              <CardDescription>
                The learning module you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setLocation("/"), 300);
              }}>Return to Dashboard</Button>
            </CardFooter>
          </Card>
        </main>
        <ChatbotSupport />
      </div>
    );
  }
  
  // Current lesson
  const currentLesson = lessons.find(lesson => lesson.id === currentLessonId);
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setLocation("/"), 300);
          }}
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {module.difficulty}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Your progress</span>
                    <span className="font-semibold">{currentProgress}%</span>
                  </div>
                  <Progress value={currentProgress} />
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="content" className="flex-1">Lesson Content</TabsTrigger>
                    <TabsTrigger value="overview" className="flex-1">Module Overview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {currentLesson ? (
                      <div>
                        <div className="bg-card p-4 rounded-lg mb-6">
                          <h3 className="text-xl font-heading font-bold mb-2">
                            {currentLesson.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-4">
                            <i className="ri-time-line mr-2"></i>
                            <span>{currentLesson.duration} minutes</span>
                            <i className="ri-file-list-line ml-4 mr-2"></i>
                            <span>{currentLesson.type}</span>
                          </div>
                          
                          <div className="mb-8">
                            <h4 className="font-heading font-semibold mb-3">Lesson Content</h4>
                            <p className="mb-4">
                              {module.category === 'mindful-mornings' ? (
                                module.title.includes('Breathing') ? (
                                  <>
                                    <p className="mb-4">In this module, you'll learn how to effectively teach breathing exercises to children that can help them regulate their emotions and increase focus in the classroom.</p>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Key Benefits of Breathing Exercises</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Helps children develop self-regulation skills</li>
                                      <li>Reduces anxiety and stress responses</li>
                                      <li>Improves focus and attention</li>
                                      <li>Can be used as a transitional activity between lessons</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <p className="font-semibold text-[#0030b8]">🌟 Easter Egg Alert!</p>
                                      <p className="text-[#333]">If you memorize the phrase "<span className="font-bold">Breathe, Smile, Be Present</span>" and share it with your director, you'll receive a special lunch reward!</p>
                                    </div>
                                  </>
                                ) : module.title.includes('Self-Affirmations') ? (
                                  <>
                                    <p className="mb-4">This module explores how to teach children positive self-talk and affirmations that build confidence and resilience in the classroom setting.</p>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Benefits of Self-Affirmations for Children</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Builds a positive self-image and self-esteem</li>
                                      <li>Encourages resilience when facing challenges</li>
                                      <li>Helps develop a growth mindset approach to learning</li>
                                      <li>Creates a supportive classroom environment</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <p className="font-semibold text-[#0030b8]">💫 Activity Challenge!</p>
                                      <p className="text-[#333]">Create your own classroom affirmation and send it to your director to receive special recognition in the next staff meeting!</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="mb-4">The gratitude module will help you incorporate thankfulness and appreciation practices into your daily classroom routines.</p>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Why Teaching Gratitude Matters</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Improves classroom climate and student well-being</li>
                                      <li>Helps children develop emotional intelligence</li>
                                      <li>Reduces conflicts and promotes empathy</li>
                                      <li>Creates a positive learning environment</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <p className="font-semibold text-[#0030b8]">🎁 Hidden Challenge!</p>
                                      <p className="text-[#333]">Find the three gratitude statements embedded in this module. When you find all three, share them with your director to unlock a special reward!</p>
                                    </div>
                                  </>
                                )
                              ) : (
                                <>
                                  This is where the specific lesson content would be displayed, 
                                  including text explanations, interactive elements, and practice exercises.
                                  <div className="p-4 bg-muted rounded-lg mt-4">
                                    <p className="text-center text-muted-foreground">
                                      Lesson content is loaded dynamically based on the selected module and lesson.
                                    </p>
                                  </div>
                                </>
                              )}
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={completeLesson}
                            disabled={isPending}
                          >
                            {isPending ? "Saving Progress..." : "Complete & Continue"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Select a lesson to begin</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="overview">
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-4">About This Module</h3>
                      <p className="mb-6">{module.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Duration</h4>
                          <div className="flex items-center">
                            <i className="ri-time-line text-primary mr-2"></i>
                            <span>{module.duration} minutes total</span>
                          </div>
                        </div>
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Category</h4>
                          <div className="flex items-center">
                            <i className="ri-folder-line text-primary mr-2"></i>
                            <span>{module.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-heading font-bold mb-4">Module Content</h3>
                      <p className="mb-4">This module contains the following lessons:</p>
                      
                      <div className="space-y-3 mb-6">
                        {lessons.map((lesson, index) => {
                          // Calculate if this lesson should be considered complete based on progress
                          const progressPerLesson = 100 / lessons.length;
                          const isComplete = currentProgress >= (index + 1) * progressPerLesson;
                          
                          return (
                            <div 
                              key={lesson.id}
                              className={`border rounded-lg p-3 flex items-center justify-between ${
                                currentLessonId === lesson.id ? 'border-primary' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  isComplete 
                                    ? 'bg-primary text-white' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {isComplete ? (
                                    <i className="ri-check-line"></i>
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">{lesson.title}</h4>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <i className="ri-time-line mr-1"></i>
                                    <span>{lesson.duration} min</span>
                                    <span className="mx-2">•</span>
                                    <span>{lesson.type}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={isComplete ? "outline" : "default"}
                                size="sm"
                                onClick={() => setCurrentLessonId(lesson.id)}
                              >
                                {isComplete ? "Review" : "Start"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="w-32 h-32 mx-auto mb-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="12" 
                        strokeDasharray="339.292" 
                        strokeDashoffset={339.292 * (1 - currentProgress / 100)} 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{currentProgress}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">Keep going! You're doing great!</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Lessons Completed</span>
                      <span className="font-semibold">
                        {Math.floor((lessons.length * currentProgress) / 100)}/{lessons.length}
                      </span>
                    </div>
                    <Progress 
                      value={(Math.floor((lessons.length * currentProgress) / 100) / lessons.length) * 100} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Time Spent</span>
                      <span className="font-semibold">
                        {Math.floor((module.duration * currentProgress) / 100)} min
                      </span>
                    </div>
                    <Progress value={currentProgress} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <i className="ri-customer-service-2-line text-xl text-primary"></i>
                  </div>
                  <div>
                    <p className="text-sm mb-4">
                      If you're stuck or have questions about this module, our support team is ready to help.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => document.getElementById('chatbot')?.classList.remove('hidden')}
                    >
                      Chat with Support
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h4 className="font-heading font-semibold mb-2">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-file-text-line mr-2"></i>
                      Download lesson notes
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-headphone-line mr-2"></i>
                      Audio pronunciation guide
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-translate-2 mr-2"></i>
                      Vocabulary flashcards
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <ChatbotSupport />
    </div>
  );
}
