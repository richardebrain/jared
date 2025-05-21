import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LearningModule as LearningModuleType, UserProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";

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
import { Play, Pause, SkipBack } from "lucide-react";

// Import audio files
import sunriseSongPath from "@assets/Sunrise paints the Glendale sky gold.mp3";
import commitmentRapPath from "@assets/_Commitment's Whistle-Stop Rap (Extended.mp3";

// Define lessons with unique ids
const lessons = [
  {
    id: 1,
    title: "Our CORE Values",
    duration: 5,
    type: "introduction",
  },
  {
    id: 2,
    title: "C - Consistency: Miss Rosa's Story",
    duration: 5,
    type: "story",
  },
  {
    id: 3,
    title: "O - Openness: Ms. Elena's Story",
    duration: 5,
    type: "story",
  },
  {
    id: 4,
    title: "R - Respect: CORE Values Song",
    duration: 5,
    type: "audio",
    audioPath: sunriseSongPath,
  },
  {
    id: 5,
    title: "E - Excellence: Fill in the Blanks",
    duration: 5,
    type: "interactive",
  },
  {
    id: 6,
    title: "Commitment's Whistle-Stop Rap",
    duration: 5,
    type: "audio",
    audioPath: commitmentRapPath,
  },
];

export default function CoreValuesModuleNew() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Module state
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false);
  
  // Exercise state
  const [answers, setAnswers] = useState({
    p1: "",
    p2: "",
    c1: "",
    c2: "",
    c3: ""
  });
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
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
  
  // Update progress when lessons are completed
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
  
  // Initialize user progress from DB
  useEffect(() => {
    if (progressData && module) {
      const moduleProgress = progressData.find(p => p.moduleId === module.id);
      if (moduleProgress) {
        setProgress(moduleProgress.progress);
        
        // If there's progress, set the current lesson
        if (moduleProgress.progress > 0) {
          const lessonsPerProgressPercent = lessons.length / 100;
          const completedLessons = Math.floor(moduleProgress.progress * lessonsPerProgressPercent);
          
          // If all lessons are completed, show the first lesson
          if (completedLessons >= lessons.length) {
            setCurrentLessonId(1);
          } 
          // Otherwise set to the next uncompleted lesson
          else {
            setCurrentLessonId(completedLessons + 1);
          }
        }
      }
    }
  }, [progressData, module]);
  
  // Audio controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const resetAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioCompleted(true);
  };
  
  // Check fill in the blanks answers
  const checkCoreAnswers = () => {
    const correctAnswers = {
      p1: "prepared",
      p2: "positive",
      c1: "caring",
      c2: "committed",
      c3: "consistent"
    };
    
    const allCorrect = 
      answers.p1.toLowerCase().includes(correctAnswers.p1) &&
      answers.p2.toLowerCase().includes(correctAnswers.p2) &&
      answers.c1.toLowerCase().includes(correctAnswers.c1) &&
      answers.c2.toLowerCase().includes(correctAnswers.c2) &&
      answers.c3.toLowerCase().includes(correctAnswers.c3);
    
    if (allCorrect) {
      toast({
        title: "Excellent work!",
        description: "You've correctly identified all the CORE values of Raising Arizona!",
      });
      setExerciseCompleted(true);
    } else {
      toast({
        title: "Try again",
        description: "Some of your answers need correction. Remember our 5 core values!",
        variant: "destructive",
      });
    }
  };
  
  // Continue to next lesson
  const continueToNextLesson = () => {
    if (!module) return;
    
    // Calculate progress percentage based on completed lessons
    const progressIncrement = 100 / lessons.length;
    const newProgress = Math.min(100, progress + progressIncrement);
    
    // Check if this is the last lesson
    const isLastLesson = currentLessonId === lessons.length;
    
    // Update progress in database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: isLastLesson,
    });
    
    // If not the last lesson, proceed to next lesson
    if (!isLastLesson) {
      setCurrentLessonId(prev => prev + 1);
      
      // Reset states for next lesson
      setAudioCompleted(false);
      setExerciseCompleted(false);
      
      // Reset audio when lesson changes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    } else {
      // Navigate to dashboard if module is completed
      toast({
        title: "Congratulations!",
        description: "You've completed the CORE Values module!",
      });
    }
    
    // Update progress state
    setProgress(newProgress);
  };
  
  // Get the current lesson
  const currentLesson = lessons.find(lesson => lesson.id === currentLessonId);
  
  // Is the continue button enabled?
  const canContinue = () => {
    if (!currentLesson) return false;
    
    if (currentLesson.type === 'audio') {
      return audioCompleted;
    } else if (currentLesson.id === 5) { // Fill in the blanks exercise
      return exerciseCompleted;
    }
    
    return true;
  };
  
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
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="content" className="flex-1">Lesson Content</TabsTrigger>
                    <TabsTrigger value="overview" className="flex-1">Module Overview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {currentLesson && (
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
                              {/* Lesson 1: Our CORE Values */}
                              {currentLesson.id === 1 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">CORE Values at Raising Arizona</h3>
                                  <p className="mb-4">Our CORE values guide everything we do at Raising Arizona Preschool. These fundamental principles help create a nurturing environment where children and staff can thrive together.</p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                      <h4 className="font-bold text-blue-700 mb-2">P - Prepared</h4>
                                      <p>We come to work ready with the knowledge, materials, and mindset to create exceptional learning experiences for every child in our care.</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                      <h4 className="font-bold text-green-700 mb-2">P - Positive</h4>
                                      <p>We maintain an optimistic attitude that creates an uplifting environment where children and colleagues feel valued and inspired.</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                      <h4 className="font-bold text-purple-700 mb-2">C - Caring</h4>
                                      <p>We approach each child with warmth, empathy and genuine concern for their well-being, creating a nurturing foundation for growth.</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                      <h4 className="font-bold text-amber-700 mb-2">C - Committed</h4>
                                      <p>We dedicate ourselves to the success of each child, our team, and the school community with unwavering determination and reliability.</p>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                                      <h4 className="font-bold text-rose-700 mb-2">C - Consistent</h4>
                                      <p>We provide dependable routines, expectations, and care that create a secure foundation for children to explore and thrive.</p>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 2: Miss Rosa's Story */}
                              {currentLesson.id === 2 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Consistency: Miss Rosa's Unbroken Circle</h3>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <p className="italic text-gray-700 mb-4">From the very first morning, Lila clung to the classroom door, eyes wide with fear. Miss Rosa approached slowly, kneeling to meet Lila's gaze. "Would you like to help me with our welcome song this morning?" she whispered. Lila's grip loosened slightly.</p>
                                    <p className="italic text-gray-700 mb-4">Each day, Miss Rosa invited Lila to help in small ways—watering plants, arranging cushions for circle time, choosing the morning book. Miss Rosa noticed Lila's careful attention to how things were arranged—her natural sense of order.</p>
                                    <p className="italic text-gray-700 mb-4">"In our classroom," Miss Rosa explained to her colleagues, "we respect each child's journey. Lila needs to feel safe before she can fully participate." By month's end, it was Lila who organized the welcome circle, carefully placing each cushion in a perfect round formation, ensuring no child was left outside the circle.</p>
                                    <p className="italic text-gray-700">What Miss Rosa recognized in this child was the need for inclusion through meaningful contribution. By honoring Lila's need for order and giving her purpose, Miss Rosa demonstrated how our CORE values create an unbroken circle where every child belongs.</p>
                                  </div>
                                  
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                                    <h4 className="font-semibold text-blue-700 mb-2">Reflection Question:</h4>
                                    <p className="mb-3">How did Miss Rosa demonstrate consistency in her approach with Lila?</p>
                                    <p className="text-sm text-blue-600">Think about how consistency builds trust with children who are experiencing anxiety in new environments.</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 3: Ms. Elena's Story */}
                              {currentLesson.id === 3 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Openness: Ms. Elena's Whispered Promise</h3>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <p className="italic text-gray-700 mb-4">Tiny footsteps echoed in the cubby-lined hallway as four-year-old Jamal arrived early each morning. His father, working double shifts, would drop him off before sunrise. Rather than seeing this as an inconvenience, Ms. Elena recognized an opportunity.</p>
                                    <p className="italic text-gray-700 mb-4">"Jamal, would you like to be my special classroom helper this morning?" she asked that first day. His eyes lit up as she handed him a small spray bottle and cloth. Together, they wiped tables and arranged chairs before other children arrived.</p>
                                    <p className="italic text-gray-700 mb-4">The early-morning ritual continued for months. One day, Jamal's father arrived later than usual, apologizing profusely. Ms. Elena noticed Jamal whisper something to his father, who looked surprised but nodded. The next day, father and son arrived together—early again.</p>
                                    <p className="italic text-gray-700">"He told me he had important work to do," his father explained, smiling. "That you were counting on him." Ms. Elena nodded, understanding. Through her simple act of creating opportunity from challenge, she had given Jamal more than just tasks—she had given him purpose and pride, demonstrating that our CORE values provide every child the chance to excel in their own unique way.</p>
                                  </div>
                                  
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Reflection Question:</h4>
                                    <p className="mb-3">How did Ms. Elena demonstrate openness by turning a challenge into an opportunity?</p>
                                    <p className="text-sm text-green-600">Consider how being open to unique situations can create meaningful learning experiences.</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 4: CORE Values Song */}
                              {currentLesson.id === 4 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Respect: CORE Values Song</h3>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <p className="mb-4">Listen to our CORE Values song, "Sunrise Paints the Glendale Sky Gold," which embodies our commitment to respecting each child's unique journey.</p>
                                    
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                                      <audio 
                                        ref={audioRef}
                                        src={sunriseSongPath} 
                                        onEnded={handleAudioEnded}
                                        className="hidden"
                                      />
                                      
                                      <div className="flex items-center justify-center mb-4">
                                        <Button
                                          onClick={togglePlayPause}
                                          variant="outline"
                                          size="icon"
                                          className="mr-2 h-12 w-12 rounded-full"
                                        >
                                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                                        </Button>
                                        
                                        <Button
                                          onClick={resetAudio}
                                          variant="outline"
                                          size="icon"
                                          className="h-12 w-12 rounded-full"
                                        >
                                          <SkipBack className="h-5 w-5" />
                                        </Button>
                                      </div>
                                      
                                      <div className="italic text-center text-purple-700 font-medium">
                                        <p className="mb-1">Sunrise paints the Glendale sky gold,</p>
                                        <p className="mb-1">As we open our doors once more.</p>
                                        <p className="mb-1">At Raising Arizona we uphold</p>
                                        <p className="mb-1">The CORE values we all adore.</p>
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">Please listen to the full song before continuing to the next section.</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 5: Fill in the Blanks */}
                              {currentLesson.id === 5 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Excellence: Fill in the Blanks</h3>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <p className="mb-4">After listening to "Sunrise Paints the Glendale Sky Gold," fill in the blanks with the correct CORE values:</p>
                                    
                                    <div className="bg-white p-5 rounded-lg border border-gray-300 mb-4">
                                      <div className="grid grid-cols-1 gap-4 mb-4">
                                        <div className="flex items-center">
                                          <span className="font-bold text-blue-700 mr-3">First P stands for:</span>
                                          <input 
                                            type="text" 
                                            value={answers.p1}
                                            onChange={(e) => setAnswers({...answers, p1: e.target.value})}
                                            className="border border-blue-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                            placeholder="Type your answer..." 
                                          />
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <span className="font-bold text-green-700 mr-3">Second P stands for:</span>
                                          <input 
                                            type="text" 
                                            value={answers.p2}
                                            onChange={(e) => setAnswers({...answers, p2: e.target.value})}
                                            className="border border-green-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" 
                                            placeholder="Type your answer..." 
                                          />
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <span className="font-bold text-purple-700 mr-3">First C stands for:</span>
                                          <input 
                                            type="text" 
                                            value={answers.c1}
                                            onChange={(e) => setAnswers({...answers, c1: e.target.value})}
                                            className="border border-purple-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                            placeholder="Type your answer..." 
                                          />
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <span className="font-bold text-amber-700 mr-3">Second C stands for:</span>
                                          <input 
                                            type="text" 
                                            value={answers.c2}
                                            onChange={(e) => setAnswers({...answers, c2: e.target.value})}
                                            className="border border-amber-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                            placeholder="Type your answer..." 
                                          />
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <span className="font-bold text-rose-700 mr-3">Third C stands for:</span>
                                          <input 
                                            type="text" 
                                            value={answers.c3}
                                            onChange={(e) => setAnswers({...answers, c3: e.target.value})}
                                            className="border border-rose-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-rose-500" 
                                            placeholder="Type your answer..." 
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-center mt-4">
                                        <Button 
                                          onClick={checkCoreAnswers} 
                                          className="bg-gradient-to-r from-amber-500 to-amber-600"
                                        >
                                          Check Answers
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 6: Commitment's Rap */}
                              {currentLesson.id === 6 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Commitment's Whistle-Stop Rap</h3>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <p className="mb-4">As a special bonus, listen to "Commitment's Whistle-Stop Rap" to reinforce our CORE values in a fun, memorable way!</p>
                                    
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                                      <audio 
                                        ref={audioRef}
                                        src={commitmentRapPath}
                                        onEnded={handleAudioEnded}
                                        className="hidden"
                                      />
                                      
                                      <div className="flex items-center justify-center mb-4">
                                        <Button
                                          onClick={togglePlayPause}
                                          variant="outline"
                                          size="icon"
                                          className="mr-2 h-12 w-12 rounded-full"
                                        >
                                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                                        </Button>
                                        
                                        <Button
                                          onClick={resetAudio}
                                          variant="outline"
                                          size="icon"
                                          className="h-12 w-12 rounded-full"
                                        >
                                          <SkipBack className="h-5 w-5" />
                                        </Button>
                                      </div>
                                      
                                      <p className="text-center text-red-700 font-medium">Listen to the Commitment's Whistle-Stop Rap!</p>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">Please listen to the full rap before continuing to the final section.</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              onClick={continueToNextLesson} 
                              disabled={isPending || !canContinue()}
                              className="bg-gradient-to-r from-primary to-indigo-600"
                            >
                              {currentLesson.id === lessons.length ? "Complete Module" : "Continue to Next Section"}
                              {isPending && <div className="ml-2 animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="overview">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This module introduces the CORE values that guide us at Raising Arizona Preschool. 
                        These values—Compassion, Opportunity, Respect, and Excellence—form the foundation 
                        of our teaching philosophy and approach to early childhood education.
                      </p>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium text-lg">Module Lessons</h3>
                        <div className="space-y-1">
                          {lessons.map((lesson, index) => (
                            <div 
                              key={lesson.id}
                              className="flex items-center p-2 rounded-md hover:bg-slate-100"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                progress >= ((index + 1) / lessons.length * 100) 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {progress >= ((index + 1) / lessons.length * 100) ? (
                                  '✓'
                                ) : (
                                  lesson.id
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">{lesson.duration} min · {lesson.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you're having trouble with this module or have questions about our CORE values, 
                  please reach out to your supervisor or use the resources below.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Quick Resources</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <i className="ri-file-pdf-line mr-2 text-red-500"></i>
                      <span>CORE Values Handbook</span>
                    </li>
                    <li className="flex items-center">
                      <i className="ri-video-line mr-2 text-blue-500"></i>
                      <span>Staff Training Videos</span>
                    </li>
                    <li className="flex items-center">
                      <i className="ri-question-line mr-2 text-amber-500"></i>
                      <span>Frequently Asked Questions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}