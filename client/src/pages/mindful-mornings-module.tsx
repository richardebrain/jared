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

// Custom lessons for Mindful Mornings module
const mindfulLessons = [
  {
    id: 1,
    title: "Welcome to Mindful Mornings",
    duration: 10,
    type: "introduction",
    completed: false,
  },
  {
    id: 2,
    title: "The Science Behind Mindfulness",
    duration: 15,
    type: "lesson",
    completed: false,
  },
  {
    id: 3,
    title: "Morning Mindfulness Activities",
    duration: 20,
    type: "interactive",
    completed: false,
  },
  {
    id: 4,
    title: "Implementing in Your Classroom",
    duration: 15,
    type: "practical",
    completed: false,
  },
  {
    id: 5,
    title: "Knowledge Check & Resources",
    duration: 10,
    type: "assessment",
    completed: false,
  },
];

export default function MindfulMorningsModulePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for selected lesson and progress
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Get module data
  const { data: module, isLoading: isModuleLoading } = useQuery<LearningModuleType>({
    queryKey: ['/api/modules', 22],
    queryFn: async () => {
      return await apiRequest('/api/modules/22');
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
          const progressPercentPerLesson = 100 / mindfulLessons.length;
          const completedLessons = Math.floor(moduleProgress.progress / progressPercentPerLesson);
          
          if (completedLessons < mindfulLessons.length) {
            setCurrentLessonId(mindfulLessons[completedLessons].id);
          } else {
            setCurrentLessonId(mindfulLessons[0].id);
          }
        }
      } else {
        // No progress yet, start with the first lesson
        setCurrentLessonId(mindfulLessons[0].id);
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
    
    const currentLessonIndex = mindfulLessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentLessonIndex === -1) return;
    
    // Calculate new progress
    const newProgress = Math.min(
      100,
      ((currentLessonIndex + 1) / mindfulLessons.length) * 100
    );
    
    // If this is the last lesson, mark as completed
    const isLastLesson = currentLessonIndex === mindfulLessons.length - 1;
    
    // Update progress in database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: isLastLesson,
    });
    
    // If not the last lesson, proceed to next lesson
    if (!isLastLesson) {
      setCurrentLessonId(mindfulLessons[currentLessonIndex + 1].id);
    }
  };
  
  // Get the current lesson
  const currentLesson = currentLessonId 
    ? mindfulLessons.find(lesson => lesson.id === currentLessonId) 
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
                    <CardTitle className="text-2xl">Mindful Mornings</CardTitle>
                    <CardDescription>Creating calm, focused starts to the day in your preschool classroom</CardDescription>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Intermediate
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
                              {currentLesson.id === 1 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">Welcome to Mindful Mornings</h3>
                                  <p className="mb-4">
                                    The Mindful Mornings program introduces a series of evidence-based practices that help young children start their day with focus, calm, and emotional regulation. This module will provide you with practical tools to implement mindfulness in your morning routine.
                                  </p>
                                  
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                    <h4 className="font-bold text-blue-700 mb-2">Module Objectives</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                      <li>Understand the benefits of mindfulness for early childhood development</li>
                                      <li>Learn practical mindfulness activities suitable for 3-5 year olds</li>
                                      <li>Develop strategies to incorporate mindfulness into daily classroom routines</li>
                                      <li>Create a morning routine that promotes focus and emotional regulation</li>
                                      <li>Practice mindfulness techniques yourself to model for children</li>
                                    </ul>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Why Mindful Mornings Matter</h4>
                                  <p className="mb-4">
                                    The transition from home to school can be challenging for young children. Many arrive with various energy levels, emotions, and experiences from their morning at home. Mindful Mornings provides a consistent, calming transition that helps:
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Emotional Regulation</h5>
                                      <p className="text-sm">Children learn to recognize and manage their feelings</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Focus &amp; Attention</h5>
                                      <p className="text-sm">Builds concentration skills essential for learning</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Positive Classroom Climate</h5>
                                      <p className="text-sm">Creates a calm, supportive environment</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Stress Reduction</h5>
                                      <p className="text-sm">Helps reduce anxieties about school separation</p>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                    <div className="flex items-start">
                                      <div className="text-yellow-500 mr-3 mt-1">
                                        <i className="ri-lightbulb-line text-xl"></i>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Teacher Tip</h4>
                                        <p className="text-sm text-yellow-700">
                                          Before introducing mindfulness to children, practice the techniques yourself. When you experience the benefits firsthand, you'll be more effective at guiding children through these practices.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="mb-4">
                                    In the following lessons, we'll explore the science behind mindfulness, learn specific activities for your classroom, and develop implementation strategies.
                                  </p>
                                </>
                              )}
                              
                              {currentLesson.id === 2 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">The Science Behind Mindfulness</h3>
                                  <p className="mb-4">
                                    Mindfulness practices have been extensively studied and proven to benefit cognitive development, emotional regulation, and social skills—all critical areas for early childhood education.
                                  </p>
                                  
                                  <h4 className="font-semibold mb-3">Brain Development Benefits</h4>
                                  <p className="mb-4">
                                    The early childhood years are a critical period for brain development. Research shows that mindfulness practices positively affect brain areas responsible for:
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                      <h5 className="font-bold text-purple-700 mb-2">Prefrontal Cortex</h5>
                                      <p className="text-sm">Responsible for executive functions like planning, decision-making, and self-regulation</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                      <h5 className="font-bold text-green-700 mb-2">Amygdala</h5>
                                      <p className="text-sm">Processes emotions, especially stress and fear responses</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                      <h5 className="font-bold text-blue-700 mb-2">Hippocampus</h5>
                                      <p className="text-sm">Critical for learning and memory formation</p>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Research Findings</h4>
                                  <p className="mb-4">
                                    Studies specifically examining mindfulness in early childhood settings have found:
                                  </p>
                                  
                                  <ul className="list-disc pl-5 space-y-2 mb-6">
                                    <li>Improved attention spans and focus during learning activities</li>
                                    <li>Better emotional regulation and fewer behavioral challenges</li>
                                    <li>Enhanced social skills and empathy toward peers</li>
                                    <li>Reduced stress and anxiety, especially during transitions</li>
                                    <li>Improved academic readiness skills</li>
                                  </ul>
                                  
                                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                                    <h4 className="font-bold mb-2">Key Study: Mindfulness in Head Start Programs</h4>
                                    <p className="text-sm mb-3">
                                      A 2018 study implemented an 8-week mindfulness program in Head Start classrooms. Results showed significant improvements in self-regulation and executive function skills compared to control classrooms.
                                    </p>
                                    <p className="text-sm italic">
                                      "Even brief, daily mindfulness practices showed measurable benefits in children's ability to manage emotions and maintain focus during subsequent learning activities."
                                    </p>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Trauma-Informed Connection</h4>
                                  <p className="mb-4">
                                    Mindfulness practices are especially beneficial for children who have experienced trauma or adverse childhood experiences (ACEs). These practices help:
                                  </p>
                                  
                                  <ul className="list-disc pl-5 space-y-2 mb-6">
                                    <li>Develop a sense of safety in the present moment</li>
                                    <li>Build self-regulation skills that may be underdeveloped due to trauma</li>
                                    <li>Create predictable routines that foster security</li>
                                    <li>Develop body awareness and self-calming techniques</li>
                                  </ul>
                                  
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                    <div className="flex items-start">
                                      <div className="text-yellow-500 mr-3 mt-1">
                                        <i className="ri-lightbulb-line text-xl"></i>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Teacher Reflection</h4>
                                        <p className="text-sm text-yellow-700">
                                          Consider how you've observed children's ability to focus change throughout the day. What differences do you notice between children who arrive calm versus those who arrive anxious or overstimulated? How might a consistent mindful morning routine benefit these different children?
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {currentLesson.id === 3 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">Morning Mindfulness Activities</h3>
                                  <p className="mb-4">
                                    The following activities are designed specifically for preschool-aged children (3-5 years) and can be incorporated into your morning circle or arrival routine. Each activity takes 3-5 minutes and helps children develop mindfulness skills.
                                  </p>
                                  
                                  <div className="mb-6">
                                    <h4 className="font-semibold mb-3 bg-blue-100 p-2 rounded-lg">Breathing Buddies</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <h5 className="font-medium mb-2">Materials Needed:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>Small stuffed animals or soft toys (one per child)</li>
                                        </ul>
                                        
                                        <h5 className="font-medium mb-2">Steps:</h5>
                                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                                          <li>Have children lie on their backs in a circle with their "breathing buddy" on their tummy</li>
                                          <li>Guide them to watch their buddy rise and fall as they breathe</li>
                                          <li>Use phrases like "Watch your buddy go up and down" and "Give your buddy a gentle ride"</li>
                                          <li>Practice 5-10 slow breaths together</li>
                                        </ol>
                                      </div>
                                      <div>
                                        <h5 className="font-medium mb-2">Benefits:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>Develops awareness of breathing</li>
                                          <li>Creates a concrete, visual way to practice mindfulness</li>
                                          <li>Calms the nervous system</li>
                                          <li>Creates a smooth transition to the school day</li>
                                        </ul>
                                        
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                          <p className="text-sm italic">
                                            "When we introduced Breathing Buddies, we noticed children independently getting their buddies during transition times when they felt overwhelmed." -Preschool Teacher
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-6">
                                    <h4 className="font-semibold mb-3 bg-green-100 p-2 rounded-lg">Mindful Morning Movements</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <h5 className="font-medium mb-2">Materials Needed:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>None (open space for movement)</li>
                                        </ul>
                                        
                                        <h5 className="font-medium mb-2">Steps:</h5>
                                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                                          <li>Begin in a standing circle and invite children to "wake up their bodies"</li>
                                          <li>Guide slow stretches reaching up like trees, down to toes like flowers</li>
                                          <li>Practice animal movements (slow like turtles, balanced like flamingos)</li>
                                          <li>End with children standing still, eyes closed, feeling their hearts beat</li>
                                        </ol>
                                      </div>
                                      <div>
                                        <h5 className="font-medium mb-2">Benefits:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>Develops body awareness</li>
                                          <li>Releases excess energy while promoting control</li>
                                          <li>Builds balance and coordination</li>
                                          <li>Creates mind-body connection</li>
                                        </ul>
                                        
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                          <p className="text-sm italic">
                                            "Our more active children especially benefit from Mindful Movements. It helps them learn they can move their bodies with intention and control." -Early Childhood Educator
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-6">
                                    <h4 className="font-semibold mb-3 bg-amber-100 p-2 rounded-lg">Grateful Greetings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <h5 className="font-medium mb-2">Materials Needed:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>A special "talking object" (soft ball, stuffed animal, etc.)</li>
                                        </ul>
                                        
                                        <h5 className="font-medium mb-2">Steps:</h5>
                                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                                          <li>Sit in a circle and pass the "talking object" around</li>
                                          <li>Each child shares one thing they're happy about today</li>
                                          <li>For younger children, provide simple prompts: "I'm happy about..."</li>
                                          <li>Model appreciative listening and validate all responses</li>
                                        </ol>
                                      </div>
                                      <div>
                                        <h5 className="font-medium mb-2">Benefits:</h5>
                                        <ul className="list-disc pl-5 mb-3 text-sm">
                                          <li>Cultivates gratitude and positive mindset</li>
                                          <li>Develops listening and turn-taking skills</li>
                                          <li>Builds classroom community</li>
                                          <li>Helps children transition from home thoughts to school focus</li>
                                        </ul>
                                        
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                          <p className="text-sm italic">
                                            "Children often enter with worries about separation, but Grateful Greetings helps shift their focus to the positive aspects of their day." -Preschool Director
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                    <div className="flex items-start">
                                      <div className="text-yellow-500 mr-3 mt-1">
                                        <i className="ri-lightbulb-line text-xl"></i>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Implementation Tips</h4>
                                        <ul className="list-disc pl-5 text-sm text-yellow-700">
                                          <li>Keep activities short (3-5 minutes) to match children's attention spans</li>
                                          <li>Use consistent language and routines so children know what to expect</li>
                                          <li>Model mindfulness yourself by participating fully</li>
                                          <li>Recognize that mindfulness is a practice—improvement comes with repetition</li>
                                          <li>Celebrate small successes and focus on the process, not perfection</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                    <div className="font-semibold text-[#0030b8]">🎯 Easter Egg Challenge!</div>
                                    <div className="text-[#333]">There's a hidden mindfulness technique mentioned in this lesson that's extra powerful for teachers. Find it and practice it for a week, then share your experience to earn 50 bonus points!</div>
                                  </div>
                                </>
                              )}
                              
                              {currentLesson.id === 4 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">Implementing in Your Classroom</h3>
                                  <p className="mb-4">
                                    Successfully implementing Mindful Mornings requires thoughtful planning and consistent practice. This section provides practical strategies to incorporate mindfulness into your daily classroom routine.
                                  </p>
                                  
                                  <h4 className="font-semibold mb-3">Creating Your Mindful Morning Routine</h4>
                                  <p className="mb-4">
                                    A successful mindfulness practice works best when embedded in your daily routine. Here's a sample 15-minute Mindful Morning sequence:
                                  </p>
                                  
                                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                    <ol className="list-decimal pl-5 space-y-3">
                                      <li className="font-medium">
                                        Welcome & Settling (3 minutes)
                                        <p className="font-normal text-sm mt-1">Greet each child at the door, direct them to the circle area where calm music plays and their breathing buddies await.</p>
                                      </li>
                                      <li className="font-medium">
                                        Mindful Breathing (3 minutes)
                                        <p className="font-normal text-sm mt-1">Lead a breathing exercise with breathing buddies or follow-along hand movements.</p>
                                      </li>
                                      <li className="font-medium">
                                        Mindful Movement (4 minutes)
                                        <p className="font-normal text-sm mt-1">Guide children through gentle stretches, animal poses, or a simplified sun salutation.</p>
                                      </li>
                                      <li className="font-medium">
                                        Gratitude or Intention Setting (3 minutes)
                                        <p className="font-normal text-sm mt-1">Share something positive about the day ahead or something each child is grateful for.</p>
                                      </li>
                                      <li className="font-medium">
                                        Transition (2 minutes)
                                        <p className="font-normal text-sm mt-1">Use a mindfulness bell or chime to signal the end of the mindful morning and transition to the next activity.</p>
                                      </li>
                                    </ol>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Setting Up Your Environment</h4>
                                  <p className="mb-4">
                                    The physical environment plays a crucial role in supporting mindfulness practices:
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Designated Mindfulness Area</h5>
                                      <p className="text-sm">Create a special corner with soft cushions, breathing buddies, and visual cues for breathing</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Visual Supports</h5>
                                      <p className="text-sm">Display picture cards showing breathing techniques and mindful poses</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Lighting</h5>
                                      <p className="text-sm">Use natural light when possible; consider soft lamps rather than harsh overhead lights</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                      <h5 className="font-medium mb-1">Sound Management</h5>
                                      <p className="text-sm">Use a special chime, bell, or rain stick to signal mindfulness time</p>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Communicating with Families</h4>
                                  <p className="mb-4">
                                    Parent engagement enhances the effectiveness of classroom mindfulness:
                                  </p>
                                  
                                  <ul className="list-disc pl-5 space-y-2 mb-6">
                                    <li>Send home a simple letter explaining the Mindful Mornings practice and its benefits</li>
                                    <li>Provide families with one simple breathing technique they can practice at home</li>
                                    <li>Share photos of children engaging in mindfulness activities (with appropriate permissions)</li>
                                    <li>Invite parents to a morning demonstration where they can observe or participate</li>
                                    <li>Collect feedback on changes they notice in their children at home</li>
                                  </ul>
                                  
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                                    <h4 className="font-bold text-blue-700 mb-2">Sample Parent Communication</h4>
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                      <p className="text-sm mb-2">Dear Families,</p>
                                      <p className="text-sm mb-2">
                                        We're excited to introduce "Mindful Mornings" in our classroom! This daily practice helps children develop focus, emotional regulation, and a calm start to their day.
                                      </p>
                                      <p className="text-sm mb-2">
                                        You might hear your child talk about "Breathing Buddies" or "Mindful Movements." These simple activities help children become aware of their bodies and emotions, developing important self-regulation skills.
                                      </p>
                                      <p className="text-sm mb-2">
                                        Want to try at home? Ask your child to show you how they use their breath to calm down—many children enjoy being the "teacher" and showing their family what they've learned!
                                      </p>
                                      <p className="text-sm">Warmly,<br />Your Child's Teachers</p>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Troubleshooting Common Challenges</h4>
                                  
                                  <div className="space-y-4 mb-6">
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Challenge: Children are wiggly and have trouble settling</h5>
                                      <p className="text-sm mb-2">Solution:</p>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li>Start with movement before asking for stillness</li>
                                        <li>Keep sessions very short (1-2 minutes) and gradually increase</li>
                                        <li>Use concrete objects like breathing buddies or feathers to focus attention</li>
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Challenge: Some children are resistant or silly</h5>
                                      <p className="text-sm mb-2">Solution:</p>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li>Never force participation—allow observation</li>
                                        <li>Position more engaged children near those who are resistant</li>
                                        <li>Acknowledge that learning to be mindful takes practice</li>
                                        <li>Celebrate small moments of engagement</li>
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Challenge: Inconsistent arrival times disrupt the routine</h5>
                                      <p className="text-sm mb-2">Solution:</p>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li>Create a visual cue showing "Mindful Time in Progress"</li>
                                        <li>Train an assistant to quietly welcome late arrivals</li>
                                        <li>Position the circle away from the door to minimize disruption</li>
                                        <li>Have quiet activities for early arrivers while waiting for the group</li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                    <div className="flex items-start">
                                      <div className="text-yellow-500 mr-3 mt-1">
                                        <i className="ri-lightbulb-line text-xl"></i>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Implementation Reminder</h4>
                                        <p className="text-sm text-yellow-700">
                                          Start simple with just one activity practiced consistently rather than trying all approaches at once. Build your mindfulness routine gradually over 2-3 weeks, adding new elements as children become comfortable with each practice.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {currentLesson.id === 5 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">Knowledge Check & Resources</h3>
                                  <p className="mb-4">
                                    Let's review what we've learned about implementing Mindful Mornings in your classroom and explore additional resources to support your practice.
                                  </p>
                                  
                                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                    <h4 className="font-bold text-blue-700 mb-3">Knowledge Check</h4>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="font-medium mb-2">1. Which brain area is responsible for executive functions like planning and self-regulation?</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center">
                                            <input type="radio" id="q1a" name="q1" className="mr-2" />
                                            <label htmlFor="q1a">Amygdala</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q1b" name="q1" className="mr-2" />
                                            <label htmlFor="q1b">Prefrontal Cortex</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q1c" name="q1" className="mr-2" />
                                            <label htmlFor="q1c">Hippocampus</label>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">2. The "Breathing Buddies" activity primarily helps children:</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center">
                                            <input type="radio" id="q2a" name="q2" className="mr-2" />
                                            <label htmlFor="q2a">Learn about different animals</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q2b" name="q2" className="mr-2" />
                                            <label htmlFor="q2b">Develop awareness of their breathing</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q2c" name="q2" className="mr-2" />
                                            <label htmlFor="q2c">Practice counting skills</label>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">3. What is a recommended approach when children are wiggly and have trouble settling during mindfulness practice?</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center">
                                            <input type="radio" id="q3a" name="q3" className="mr-2" />
                                            <label htmlFor="q3a">Skip mindfulness practice that day</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q3b" name="q3" className="mr-2" />
                                            <label htmlFor="q3b">Make the session longer to give them more practice</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q3c" name="q3" className="mr-2" />
                                            <label htmlFor="q3c">Start with movement before asking for stillness</label>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">4. Which of the following is NOT a recommended practice when implementing mindfulness in the classroom?</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center">
                                            <input type="radio" id="q4a" name="q4" className="mr-2" />
                                            <label htmlFor="q4a">Forcing reluctant children to participate</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q4b" name="q4" className="mr-2" />
                                            <label htmlFor="q4b">Creating a designated mindfulness area</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q4c" name="q4" className="mr-2" />
                                            <label htmlFor="q4c">Communicating with families about the practice</label>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">5. What aspect of mindfulness makes it particularly beneficial for children who have experienced trauma?</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center">
                                            <input type="radio" id="q5a" name="q5" className="mr-2" />
                                            <label htmlFor="q5a">It helps develop a sense of safety in the present moment</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q5b" name="q5" className="mr-2" />
                                            <label htmlFor="q5b">It teaches children to ignore their emotions</label>
                                          </div>
                                          <div className="flex items-center">
                                            <input type="radio" id="q5c" name="q5" className="mr-2" />
                                            <label htmlFor="q5c">It eliminates the need for other interventions</label>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors mt-4">
                                        Check Answers
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Additional Resources</h4>
                                  <p className="mb-4">
                                    Explore these resources to deepen your mindfulness practice with young children:
                                  </p>
                                  
                                  <div className="space-y-4 mb-6">
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Books for Teachers</h5>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li><span className="italic">Mindful Teaching and Teaching Mindfulness</span> by Deborah Schoeberlein</li>
                                        <li><span className="italic">The Mindful Child</span> by Susan Kaiser Greenland</li>
                                        <li><span className="italic">Planting Seeds: Practicing Mindfulness with Children</span> by Thich Nhat Hanh</li>
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Books for Children</h5>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li><span className="italic">Breathe Like a Bear</span> by Kira Willey</li>
                                        <li><span className="italic">I Am Peace: A Book of Mindfulness</span> by Susan Verde</li>
                                        <li><span className="italic">The Listening Walk</span> by Paul Showers</li>
                                        <li><span className="italic">Peaceful Piggy Meditation</span> by Kerry Lee MacLean</li>
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <h5 className="font-medium mb-1">Online Training & Apps</h5>
                                      <ul className="list-disc pl-5 text-sm">
                                        <li>Mindful Schools: offers courses specifically for early childhood educators</li>
                                        <li>HeadSpace for Educators: free access for teachers to learn mindfulness techniques</li>
                                        <li>Calm: offers a Calm Schools Initiative with free access for teachers</li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold mb-3">Your Personal Implementation Plan</h4>
                                  <p className="mb-4">
                                    As you complete this module, take a moment to create your personal implementation plan:
                                  </p>
                                  
                                  <div className="p-4 bg-white border border-gray-200 rounded-lg mb-6">
                                    <div className="space-y-4">
                                      <div>
                                        <p className="font-medium mb-2">1. Select one mindfulness activity to start with:</p>
                                        <textarea className="w-full p-2 border rounded-md" rows={2} placeholder="I plan to start with..."></textarea>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">2. When will you incorporate this into your daily schedule?</p>
                                        <textarea className="w-full p-2 border rounded-md" rows={2} placeholder="I will practice mindfulness with children during..."></textarea>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">3. What environment modifications will you make?</p>
                                        <textarea className="w-full p-2 border rounded-md" rows={2} placeholder="I will create/modify..."></textarea>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">4. How will you communicate with families?</p>
                                        <textarea className="w-full p-2 border rounded-md" rows={2} placeholder="I will inform families by..."></textarea>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium mb-2">5. How will you track the impact on children's behavior and learning?</p>
                                        <textarea className="w-full p-2 border rounded-md" rows={2} placeholder="I will observe and document..."></textarea>
                                      </div>
                                      
                                      <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors mt-2">
                                        Save My Plan
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                    <div className="flex items-start">
                                      <div className="text-yellow-500 mr-3 mt-1">
                                        <i className="ri-lightbulb-line text-xl"></i>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Final Reflection</h4>
                                        <p className="text-sm text-yellow-700">
                                          Remember that mindfulness is a practice, not a perfect. Both you and the children will have days when focusing is more challenging. The consistency of offering the practice is what builds the neural pathways for self-regulation and attention over time. Be kind to yourself as you implement these new routines!
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <h4 className="font-bold mb-3">Congratulations!</h4>
                                    <p className="mb-4">You've completed the Mindful Mornings module and are ready to bring these practices to your classroom.</p>
                                    <p className="text-sm text-muted-foreground">Don't forget to complete the knowledge check to receive your certificate of completion.</p>
                                  </div>
                                </>
                              )}
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
                      <p className="mb-6">The Mindful Mornings module equips early childhood educators with research-based techniques to implement mindfulness practices during morning routines. These practices help children develop emotional regulation, focus, and a calm start to their day.</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Duration</h4>
                          <div className="flex items-center">
                            <i className="ri-time-line text-primary mr-2"></i>
                            <span>70 minutes total</span>
                          </div>
                        </div>
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Category</h4>
                          <div className="flex items-center">
                            <i className="ri-folder-line text-primary mr-2"></i>
                            <span>Classroom Management</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-heading font-bold mb-4">Module Content</h3>
                      <p className="mb-4">This module contains the following lessons:</p>
                      
                      <div className="space-y-3 mb-6">
                        {mindfulLessons.map((lesson, index) => {
                          // Calculate if this lesson should be considered complete based on progress
                          const progressPerLesson = 100 / mindfulLessons.length;
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
                        {Math.floor((mindfulLessons.length * currentProgress) / 100)}/{mindfulLessons.length}
                      </span>
                    </div>
                    <Progress 
                      value={(Math.floor((mindfulLessons.length * currentProgress) / 100) / mindfulLessons.length) * 100} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Time Spent</span>
                      <span className="font-semibold">
                        {Math.floor((70 * currentProgress) / 100)} min
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
                      Download mindfulness activity cards
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-music-2-line mr-2"></i>
                      Mindfulness music playlist
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-file-paper-2-line mr-2"></i>
                      Parent communication letter template
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