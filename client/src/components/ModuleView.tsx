import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, LearningModule, UserProgress } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DynamicLessonGenerator from "@/components/DynamicLessonGenerator";
import CoreModuleWrapper from "@/components/CoreModuleWrapper";
import CoreSongExercise from "@/components/CoreSongExercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, Clock, ArrowLeft, BookOpen, Play, Award } from "lucide-react";

interface ModuleViewProps {
  moduleId: number;
  user: User;
  onBack: () => void;
}

export default function ModuleView({ moduleId, user, onBack }: ModuleViewProps) {
  const { toast } = useToast();
  const [showLesson, setShowLesson] = useState(false);
  
  // Fetch module data
  const { data: module, isLoading: isLoadingModule } = useQuery<LearningModule>({
    queryKey: [`/api/modules/${moduleId}`],
    queryFn: async () => {
      return await apiRequest(`/api/modules/${moduleId}`);
    }
  });
  
  // Fetch user progress for this module
  const { data: userProgress, isLoading: isLoadingProgress, refetch: refetchProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", moduleId],
    queryFn: async () => {
      const allProgress = await apiRequest("/api/progress");
      return allProgress.filter((p: UserProgress) => p.moduleId === moduleId && p.userId === user.id);
    },
    enabled: !!user
  });
  
  // Update progress mutation
  const { mutate: updateProgress } = useMutation({
    mutationFn: async (data: { moduleId: number; progress: number; completed?: boolean }) => {
      return await apiRequest("/api/progress", {
        method: "POST",
        data: data
      });
    },
    onSuccess: () => {
      refetchProgress();
      toast({
        title: "Progress updated",
        description: "Your learning progress has been saved.",
      });
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
    toast({
      title: "Lesson Completed!",
      description: "Great job! You've completed this lesson.",
    });
    
    refetchProgress();
  };
  
  if (isLoadingModule || !module) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading module content...</span>
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
          Back to Dashboard
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
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>
            
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
          <Button 
            className="w-full"
            onClick={handleStartLesson}
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            {currentProgress > 0 && currentProgress < 100 ? "Continue Lesson" : 
             currentProgress >= 100 ? "Review Lesson" : "Start Lesson"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}