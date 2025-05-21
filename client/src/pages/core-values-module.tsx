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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Custom lessons for CORE Values module
const coreLessons = [
  {
    id: 1,
    title: "Our CORE Values",
    duration: 15,
    type: "introduction",
    completed: false,
  },
  {
    id: 2,
    title: "Miss Rosa's Story",
    duration: 10,
    type: "story",
    completed: false,
  },
  {
    id: 3,
    title: "Ms. Elena's Story",
    duration: 10,
    type: "story",
    completed: false,
  },
  {
    id: 4,
    title: "CORE Values Song",
    duration: 10,
    type: "interactive",
    completed: false,
  },
  {
    id: 5,
    title: "Knowledge Check",
    duration: 10,
    type: "assessment",
    completed: false,
  },
];

export default function CoreValuesModulePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for selected lesson and progress
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Get module data
  const { data: module, isLoading: isModuleLoading } = useQuery<LearningModuleType>({
    queryKey: ['/api/modules', 33],
    queryFn: async () => {
      return await apiRequest('/api/modules/33');
    },
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
          const progressPercentPerLesson = 100 / coreLessons.length;
          const completedLessons = Math.floor(moduleProgress.progress / progressPercentPerLesson);
          
          if (completedLessons < coreLessons.length) {
            setCurrentLessonId(coreLessons[completedLessons].id);
          } else {
            setCurrentLessonId(coreLessons[0].id);
          }
        }
      } else {
        // No progress yet, start with the first lesson
        setCurrentLessonId(coreLessons[0].id);
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
    onError: (error: any) => {
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
    
    const currentLessonIndex = coreLessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentLessonIndex === -1) return;
    
    // Calculate new progress
    const newProgress = Math.min(
      100,
      ((currentLessonIndex + 1) / coreLessons.length) * 100
    );
    
    // If this is the last lesson, mark as completed
    const isLastLesson = currentLessonIndex === coreLessons.length - 1;
    
    // Update progress in database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: isLastLesson,
    });
    
    // If not the last lesson, proceed to next lesson
    if (!isLastLesson) {
      setCurrentLessonId(coreLessons[currentLessonIndex + 1].id);
    }
  };
  
  // Get the current lesson
  const currentLesson = currentLessonId 
    ? coreLessons.find(lesson => lesson.id === currentLessonId) 
    : null;
  
  // Loading state
  if (isModuleLoading || isProgressLoading) {
    return (
      <div className="container h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading module content...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!module) {
    return (
      <div className="container py-8">
        <Button onClick={() => setLocation('/dashboard')} variant="ghost" className="mb-8">
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested module could not be loaded.</p>
          <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-6">
        <Button 
          onClick={() => setLocation('/dashboard')} 
          variant="ghost" 
          className="mb-6"
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
                            <div className="lesson-content">
                              <>
                                <h3 className="text-xl font-semibold mb-4">CORE Values at Raising Arizona</h3>
                                <p className="mb-4">Our CORE values guide everything we do at Raising Arizona Preschool. These fundamental principles help create a nurturing environment where children and staff can thrive together.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-bold text-blue-700 mb-2">C - Compassion</h4>
                                    <p>We show kindness and empathy to everyone in our community, understanding that each person has unique needs and experiences.</p>
                                  </div>
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-bold text-green-700 mb-2">O - Opportunity</h4>
                                    <p>We create meaningful learning opportunities that inspire curiosity and growth for both children and staff.</p>
                                  </div>
                                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-bold text-purple-700 mb-2">R - Respect</h4>
                                    <p>We honor the dignity and worth of every child, family member, and colleague through our words and actions.</p>
                                  </div>
                                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <h4 className="font-bold text-amber-700 mb-2">E - Excellence</h4>
                                    <p>We strive for excellence in all aspects of our work, continuously improving our practices to provide the highest quality care and education.</p>
                                  </div>
                                </div>
                                
                                <h3 className="text-xl font-semibold mb-3 mt-6">Miss Rosa's Unbroken Circle</h3>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                  <p className="italic text-gray-700 mb-4">From the very first morning, Lila clung to the classroom door, eyes wide with fear. Miss Rosa approached slowly, kneeling to meet Lila's gaze. "Would you like to help me with our welcome song this morning?" she whispered. Lila's grip loosened slightly.</p>
                                  <p className="italic text-gray-700 mb-4">Each day, Miss Rosa invited Lila to help in small ways—watering plants, arranging cushions for circle time, choosing the morning book. Miss Rosa noticed Lila's careful attention to how things were arranged—her natural sense of order.</p>
                                  <p className="italic text-gray-700 mb-4">"In our classroom," Miss Rosa explained to her colleagues, "we respect each child's journey. Lila needs to feel safe before she can fully participate." By month's end, it was Lila who organized the welcome circle, carefully placing each cushion in a perfect round formation, ensuring no child was left outside the circle.</p>
                                  <p className="italic text-gray-700">What Miss Rosa recognized in this child was the need for inclusion through meaningful contribution. By honoring Lila's need for order and giving her purpose, Miss Rosa demonstrated how our CORE values create an unbroken circle where every child belongs.</p>
                                </div>
                                
                                <h3 className="text-xl font-semibold mb-3 mt-6">Ms. Elena's Whispered Promise</h3>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                  <p className="italic text-gray-700 mb-4">Tiny footsteps echoed in the cubby-lined hallway as four-year-old Jamal arrived early each morning. His father, working double shifts, would drop him off before sunrise. Rather than seeing this as an inconvenience, Ms. Elena recognized an opportunity.</p>
                                  <p className="italic text-gray-700 mb-4">"Jamal, would you like to be my special classroom helper this morning?" she asked that first day. His eyes lit up as she handed him a small spray bottle and cloth. Together, they wiped tables and arranged chairs before other children arrived.</p>
                                  <p className="italic text-gray-700 mb-4">The early-morning ritual continued for months. One day, Jamal's father arrived later than usual, apologizing profusely. Ms. Elena noticed Jamal whisper something to his father, who looked surprised but nodded. The next day, father and son arrived together—early again.</p>
                                  <p className="italic text-gray-700">"He told me he had important work to do," his father explained, smiling. "That you were counting on him." Ms. Elena nodded, understanding. Through her simple act of creating opportunity from challenge, she had given Jamal more than just tasks—she had given him purpose and pride, demonstrating that our CORE values provide every child the chance to excel in their own unique way.</p>
                                </div>
                                
                                <h3 className="text-xl font-semibold mb-3">CORE Values Song</h3>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                  <p className="mb-3">Listen to our CORE Values song and fill in the missing words:</p>
                                  
                                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="italic mb-2 text-gray-700 font-medium">Sunrise paints the Glendale sky gold,</p>
                                    <p className="italic mb-2 text-gray-700 font-medium">As we open our doors once more.</p>
                                    <p className="italic mb-2 text-gray-700 font-medium">At Raising Arizona we uphold</p>
                                    <p className="italic mb-2 text-gray-700 font-medium">The CORE values we all adore.</p>
                                    <p className="italic mt-3 text-gray-700 font-medium">♪ These are the values that guide our way... ♪</p>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-lg border border-gray-300">
                                    <p className="mb-4 font-medium">Fill in the missing CORE values:</p>
                                    <div className="mb-6">
                                      <p className="mb-2">C stands for <input type="text" className="border-b-2 border-blue-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> in all that we do</p>
                                      <p className="mb-2">O means <input type="text" className="border-b-2 border-green-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> for learning and growth</p>
                                      <p className="mb-2">R reminds us of <input type="text" className="border-b-2 border-purple-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> for everyone</p>
                                      <p className="mb-4">E inspires <input type="text" className="border-b-2 border-amber-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> in our work every day</p>
                                      <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Check Answers</button>
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                      <p className="text-sm font-medium text-yellow-800">💡 Teacher Tip:</p>
                                      <div className="text-sm text-yellow-700">
                                        The correct answers are Compassion, Opportunity, Respect, and Excellence. 
                                        This interactive element helps children better remember our CORE values through active participation.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                  <div className="font-semibold text-[#0030b8]">🎯 Easter Egg Challenge!</div>
                                  <div className="text-[#333]">There's a special phrase hidden in Miss Rosa's story. Find it and share it with your director to earn 50 bonus points!</div>
                                </div>
                              </>
                            </div>
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
                        {coreLessons.map((lesson, index) => {
                          // Calculate if this lesson should be considered complete based on progress
                          const progressPerLesson = 100 / coreLessons.length;
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
                        {Math.floor((coreLessons.length * currentProgress) / 100)}/{coreLessons.length}
                      </span>
                    </div>
                    <Progress 
                      value={(Math.floor((coreLessons.length * currentProgress) / 100) / coreLessons.length) * 100} 
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