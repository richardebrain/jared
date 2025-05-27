import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User, LearningModule, UserProgress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DynamicLessonGenerator from "@/components/DynamicLessonGenerator";
import CoreModuleWrapper from "@/components/CoreModuleWrapper";
import CoreSongExercise from "@/components/CoreSongExercise";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, Clock, ArrowLeft, BookOpen, Play, Award } from "lucide-react";

interface ModuleViewProps {
  moduleId?: number;
  user?: User;
  onBack?: () => void;
  module?: LearningModule;
  progress?: any;
  showCategory?: boolean;
}

export default function ModuleView({ moduleId, user, onBack, module: providedModule, progress, showCategory }: ModuleViewProps) {
  const { toast } = useToast();
  const [showLesson, setShowLesson] = useState(false);
  
  // Use provided module or fetch module data
  const { data: fetchedModule, isLoading: isLoadingModule } = useQuery<LearningModule>({
    queryKey: ['/api/modules', moduleId],
    queryFn: async () => {
      if (!moduleId) {
        throw new Error('Module ID is required');
      }
      return await apiRequest(`/api/modules/${moduleId}`);
    },
    enabled: !!moduleId && !providedModule // Only run query if moduleId exists and module wasn't provided
  });
  
  // Use either the provided module (from dashboard) or the fetched module
  const module = providedModule || fetchedModule;
  
  // Fetch user progress for this module (optimized to only get relevant progress)
  // or use provided progress from dashboard
  const { data: fetchedProgress, isLoading: isLoadingProgress, refetch: refetchProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", moduleId, user?.id],
    queryFn: async () => {
      try {
        if (!moduleId || !user?.id) {
          console.error("Missing moduleId or userId for progress fetch");
          return [];
        }
        const result = await apiRequest(`/api/progress?moduleId=${moduleId}&userId=${user.id}`);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Error fetching module progress:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!moduleId && progress === undefined // Only run query if moduleId and userId exist and progress wasn't provided
  });
  
  // Use the provided progress from dashboard or the fetched progress
  // If provided with a progress value directly (dashboard case), create a compatible structure
  const userProgress = progress !== undefined 
    ? [{ moduleId: module?.id, progress, completed: progress >= 100 }] 
    : fetchedProgress;
  
  // Update progress mutation
  const { mutate: updateProgress } = useMutation({
    mutationFn: async (data: { 
      moduleId: number; 
      progress: number; 
      completed?: boolean;
      pointsEarned?: number;
    }) => {
      return await apiRequest("/api/progress", {
        method: "POST",
        data: data
      });
    },
    onSuccess: (result, variables) => {
      // Refresh user data to update points in header and progression pages
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Also invalidate progress data for the progression map page
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/by-user"] });
      
      // Refresh local progress data
      refetchProgress();
      
      // Don't show generic toast for lesson completion as we'll show a custom one
      if (!variables.completed) {
        toast({
          title: "Progress updated",
          description: "Your learning progress has been saved.",
        });
      }
    }
  });
  
  // Initialize progress on first view (if no progress exists)
  useEffect(() => {
    if (userProgress && userProgress.length === 0 && !isLoadingProgress && moduleId) {
      updateProgress({
        moduleId,
        progress: 0
      });
    }
  }, [userProgress, isLoadingProgress, moduleId]);
  
  // Get current progress
  const currentProgress = userProgress && userProgress.length > 0 
    ? userProgress[0].progress
    : 0;
  
  // Start the lesson and update progress to indicate started
  const handleStartLesson = () => {
    setShowLesson(true);
    
    // Only update progress if it's zero
    if (currentProgress === 0) {
      updateProgress({
        moduleId,
        progress: 5 // Just started
      });
    }
  };
  
  // Handle lesson completion
  const handleLessonComplete = () => {
    // Mark the module as 100% complete and award points
    updateProgress({
      moduleId,
      progress: 100,
      completed: true,
      // Set explicit points for Core module
      ...(module?.title === "Raising Arizona's CORE" ? { pointsEarned: 50 } : {})
    });
    
    toast({
      title: "Lesson Completed!",
      description: module?.title === "Raising Arizona's CORE" 
        ? "Congratulations! You've earned 50 points for completing the CORE Values training!"
        : "Great job! You've completed this lesson."
    });
    
    // After short delay, notify parent component to return to dashboard
    setTimeout(() => {
      refetchProgress();
      if (onBack) {
        onBack();
      }
    }, 1500);
  };
  
  // Function to fix empty module content
  const fixModuleContent = async () => {
    try {
      toast({
        title: "Generating content",
        description: "Please wait while we prepare the module content...",
      });
      
      // Special case for Child Development Milestones module
      if (moduleId === 6) {
        try {
          // Try to use the specialized child development content update
          const response = await fetch('/api/modules/update-child-development', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            // If the special endpoint fails, fall back to the generic fix content
            await apiRequest(`/api/modules/${moduleId}/fix-content`, { method: 'POST' });
          }
        } catch (error) {
          console.error("Error with specialized update, falling back to generic:", error);
          await apiRequest(`/api/modules/${moduleId}/fix-content`, { method: 'POST' });
        }
      } else {
        // For all other modules, use the generic fix content endpoint
        await apiRequest(`/api/modules/${moduleId}/fix-content`, { method: 'POST' });
      }
      
      // Refetch the module data using the correct query key format
      queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId] });
      
      toast({
        title: "Success",
        description: "Module content has been generated. Loading...",
      });
    } catch (error) {
      console.error("Error fixing module content:", error);
      toast({
        title: "Error",
        description: "Failed to generate module content. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingModule || !module) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading module content...</span>
      </div>
    );
  }
  
  // Check if module has empty content and show a button to fix it
  if (!module.content || module.content.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">Module Content Missing</h3>
          <p className="text-muted-foreground mb-4">
            This module appears to be missing content. Click the button below to generate content.
          </p>
        </div>
        <Button onClick={fixModuleContent}>
          Generate Module Content
        </Button>
        <Button variant="outline" onClick={onBack} className="mt-2">
          Go Back
        </Button>
      </div>
    );
  }
  
  // If lesson is active, show the appropriate lesson component
  if (showLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => setShowLesson(false)} className="mr-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Module
          </Button>
          <h2 className="text-2xl font-bold">{module.title}</h2>
        </div>
        
        {/* Check if this is the Raising Arizona's CORE module */}
        {module.title === "Raising Arizona's CORE" ? (
          // Use the CoreModuleWrapper for the CORE module
          <CoreModuleWrapper 
            moduleContent={module.content} 
            onContinue={handleLessonComplete} 
          />
        ) : (
          // Use the standard DynamicLessonGenerator for other modules
          <DynamicLessonGenerator 
            user={user}
            moduleId={moduleId}
            onLessonComplete={handleLessonComplete}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {module.duration} min
          </span>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {module.category}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="pt-4">
              {currentProgress > 0 ? (
                <div className="module-content" dangerouslySetInnerHTML={{ __html: module.content }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="bg-amber-100 p-3 rounded-full inline-flex mb-3">
                      <BookOpen className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold">Complete Onboarding Training</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This training module will help you understand key concepts and strategies related to {module.title.toLowerCase()}.
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleStartLesson}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <Play className="h-4 w-4" />
                    Start Training Module
                    <Badge variant="secondary" className="ml-2 bg-white text-amber-700">
                      +15 points
                    </Badge>
                  </Button>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{module.duration} min</span>
                    </div>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      <span>Earn points & Bear Bucks</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="overview" className="pt-4">
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    Module Overview
                  </h3>
                  <p className="text-sm">
                    This module explores {module.title.toLowerCase()} in detail, providing you with the knowledge and tools 
                    to effectively implement these concepts in your classroom environment. You'll learn practical strategies, 
                    theoretical frameworks, and innovative techniques aligned with Arizona Early Learning Standards.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Why This Matters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Understanding {module.title.toLowerCase()} is essential for creating engaging, developmentally appropriate 
                    learning environments. This knowledge helps you address individual children's needs and support their 
                    holistic development.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Your Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Completion: {currentProgress}%</span>
                      {currentProgress >= 100 && (
                        <span className="text-green-600 flex items-center">
                          <BadgeCheck className="w-4 h-4 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="objectives" className="pt-4">
              <div className="space-y-4">
                <h3 className="font-medium mb-2">Primary Learning Objectives</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">1</div>
                    <div>
                      <p className="text-sm">Understand the key principles and theories related to {module.title.toLowerCase()}</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">2</div>
                    <div>
                      <p className="text-sm">Develop practical strategies for implementing these concepts in your classroom</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">3</div>
                    <div>
                      <p className="text-sm">Learn how to assess and document children's development in this area</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">4</div>
                    <div>
                      <p className="text-sm">Connect these concepts to Arizona Early Learning Standards and guidelines</p>
                    </div>
                  </li>
                </ul>
                
                <div className="bg-muted/30 p-4 rounded-lg mt-6">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-primary" />
                    After Completion
                  </h3>
                  <p className="text-sm">
                    You'll earn Bear Bucks and achievement points for completing this module. These can be redeemed 
                    for real-world rewards at Raising Arizona Preschool.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="materials" className="pt-4">
              <div className="space-y-4">
                <p className="text-sm">
                  This module includes the following materials to support your learning:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-1 text-sm">Interactive Lesson</h4>
                    <p className="text-xs text-muted-foreground">
                      A personalized lesson that adapts to your learning style and classroom challenges
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-1 text-sm">Reflection Activities</h4>
                    <p className="text-xs text-muted-foreground">
                      Guided questions to help you apply concepts to your specific classroom context
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-1 text-sm">Resource Library</h4>
                    <p className="text-xs text-muted-foreground">
                      Additional articles, videos, and resources to deepen your understanding
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-1 text-sm">Implementation Guide</h4>
                    <p className="text-xs text-muted-foreground">
                      Practical strategies and tips for implementing concepts in your classroom
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          {/* Special handling for Chapter 1 module */}
          {module.id === 34 ? (
            <Button 
              className="w-full"
              onClick={() => {
                // For Chapter 1, navigate directly to the chapter-one page where the quiz is implemented
                window.location.href = '/chapter-one';
              }}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              {currentProgress > 0 && currentProgress < 100 ? "Continue Chapter 1" :
               currentProgress >= 100 ? "Review Chapter 1" : "Start Chapter 1"}
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={handleStartLesson}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              {currentProgress > 0 && currentProgress < 100 ? "Continue Lesson" : 
               currentProgress >= 100 ? "Review Lesson" : "Start Lesson"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}