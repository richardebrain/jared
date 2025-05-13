import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { LearningModule, UserProgress, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, Heart, Star, Zap, ArrowLeft, Trophy, Award, Coins, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';
import ConfettiExplosion from 'react-confetti-explosion';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { VideoResources } from '@/components/VideoResources';
import { InteractiveQuiz } from '@/components/InteractiveQuiz';
import { MemoryMatchGame } from '@/components/MemoryMatchGame';

export default function MicroModuleView() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const moduleId = parseInt(params.id as string);
  const [showConfetti, setShowConfetti] = useState(false);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [completedStep, setCompletedStep] = useState<number>(0);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  
  // Points for micro module (5 min) = 5 points
  // This is a good balance - 1 point per minute ensures fairness across all module sizes
  const MICRO_MODULE_POINTS = 5;
  
  // Fetch the module data
  const { data: module, isLoading: isLoadingModule } = useQuery<LearningModule>({
    queryKey: [`/api/modules/${moduleId}`],
  });
  
  // Fetch user's progress for this module
  const { data: progress, isLoading: isLoadingProgress } = useQuery<UserProgress>({
    queryKey: [`/api/progress/${moduleId}`],
  });
  
  // Fetch user data for points tracking
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  // Update progress mutation with points tracking
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progress: number, completed: boolean, pointsEarned?: number }) => {
      console.log("Calling progress API with data:", { ...data, moduleId });
      try {
        if (!moduleId || moduleId <= 0) {
          throw new Error("Invalid module ID for progress update");
        }
        
        return await apiRequest('/api/progress', {
          method: 'POST',
          data: { ...data, moduleId }
        });
      } catch (error) {
        console.error("Error in updateProgressMutation.mutationFn:", error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (data) => {
      console.log("Update progress success:", data);
      // Invalidate both progress and user queries to refresh points
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error("Error in updateProgressMutation:", error);
      toast({
        title: "Progress Update Failed",
        description: "We couldn't save your progress. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update user points mutation
  const updateUserPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      console.log("Adding points:", points);
      try {
        return await apiRequest('/api/users/add-points', {
          method: 'POST',
          data: { points }
        });
      } catch (error) {
        console.error('Error adding points:', error);
        // Return a fallback response to prevent unhandled rejections
        return { success: false, message: 'Could not add points at this time' };
      }
    },
    onSuccess: (data) => {
      console.log("Points update response:", data);
      if (data.success) {
        console.log("Points updated successfully");
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else {
        console.warn("Points update returned unsuccessful:", data);
      }
    },
    onError: (error) => {
      console.error('Error in points mutation:', error);
      toast({
        title: "Could not update points",
        description: "Your progress was saved, but we couldn't update your points.",
        variant: "destructive"
      });
    }
  });

  // State for Perplexity-generated content
  const [perplexityContent, setPerplexityContent] = useState<{
    coreConcept: string,
    practicalApplication: string,
    videoResources: string[],
    interactiveElement: string,
    quizQuestion?: {
      question: string,
      options: string[],
      correctAnswer: number
    },
    isLoading: boolean
  }>({
    coreConcept: "",
    practicalApplication: "",
    videoResources: [
      "https://www.youtube.com/embed/ckZt33Ymbpg",  // Vanderbilt IRIS Center on Positive Behavior Support
      "https://www.youtube.com/embed/4PSRP98mtJY",  // PBS Teachers video on positive classroom environments
      "https://www.youtube.com/embed/HQT6u-tFKZ4"   // Head Start video on Positive Teacher-Child Interactions
    ],
    interactiveElement: "",
    quizQuestion: {
      question: "What is one benefit of maintaining a positive attitude in the classroom?",
      options: [
        "It reduces the need for planning activities",
        "It creates a supportive environment that fosters learning",
        "It eliminates all behavioral challenges",
        "It replaces the need for structured routines"
      ],
      correctAnswer: 1
    },
    isLoading: false
  });
  
  // Add state for the active step in the lesson
  const [currentStep, setCurrentStep] = useState(0);

  // Get module-specific prompts based on ID
  const getModulePrompts = (moduleId: number): { conceptPrompt: string, applicationPrompt: string } => {
    // Default prompts
    let conceptPrompt = "Create a concise educational paragraph (max 150 words) about this early childhood education topic. Include a practical tip.";
    let applicationPrompt = "Provide 3 practical techniques (max 150 words total) that early childhood educators can implement immediately. Each technique should be 1-2 sentences and very actionable.";
    
    switch(moduleId) {
      // Positive Attitude module
      case 18:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about maintaining a positive attitude in early childhood education. Focus on how a teacher's positive attitude impacts children's learning and emotional development. Use a warm, encouraging tone and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to maintain a positive attitude during challenging moments in the classroom. Each technique should be 1-2 sentences and very actionable.`;
        break;
      
      // Active Listening with Children
      case 19:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about active listening with preschool children. Explain why it's important for building trust and emotional safety, and include one practical tip.`;
        applicationPrompt = `Provide 3 practical active listening techniques (max 150 words total) for preschool teachers to use when communicating with young children. Each technique should be 1-2 sentences and very actionable.`;
        break;
      
      // Patience in Practice
      case 20:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about developing patience in high-stress classroom situations with preschoolers. Focus on the benefits for both teachers and children, and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to maintain patience during challenging moments. Each technique should be 1-2 sentences and very simple to implement.`;
        break;
      
      // Empathy: Walking in Tiny Shoes
      case 21:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about developing deeper empathy by understanding situations from a child's perspective. Explain why this is crucial for early childhood educators and include one practical tip.`;
        applicationPrompt = `Provide 3 practical empathy-building techniques (max 150 words total) for preschool teachers to better understand children's perspectives. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Creativity as a Core Value
      case 22:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about nurturing and modeling creativity as a fundamental value in early childhood education. Explain its importance for child development and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to foster creativity in their classroom daily. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Quick Transition Techniques
      case 23:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about the importance of smooth transitions between classroom activities for preschoolers. Explain why transitions can be challenging and include one practical tip.`;
        applicationPrompt = `Provide 3 effective techniques (max 150 words total) for early childhood educators to smoothly transition young children between classroom activities. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Mindful Morning Greeting
      case 24:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about starting each day with an intentional, mindful greeting ritual in preschool. Explain how this sets a positive tone for the day and include one practical tip.`;
        applicationPrompt = `Provide 3 different mindful morning greeting rituals (max 150 words total) for preschool teachers to use with their class. Each ritual should be 1-2 sentences and very simple to implement.`;
        break;
        
      // Safety First: 5-Minute Checklist
      case 25:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about the importance of classroom safety protocols in early childhood education. Focus on why consistent safety checks matter and include one practical tip.`;
        applicationPrompt = `Provide a 3-point safety checklist (max 150 words total) that early childhood educators can quickly use daily. Each checklist item should be 1-2 sentences and cover a different aspect of classroom safety.`;
        break;
    }
    
    return { conceptPrompt, applicationPrompt };
  };

  // Generate content for micro modules using Perplexity
  React.useEffect(() => {
    if (module && module.duration <= 5) { // Only for micro modules (5 min or less)
      setPerplexityContent(prev => ({ ...prev, isLoading: true }));
      
      const { conceptPrompt, applicationPrompt } = getModulePrompts(module.id);
      
      try {
        console.log("Generating lesson content for module:", module.id, module.title);
        
        // Generate core concept content using enhanced apiRequest
        apiRequest('/api/perplexity/generate', {
          method: 'POST',
          data: { prompt: conceptPrompt }
        })
        .then(data => {
          console.log("Core concept response received:", data);
          setPerplexityContent(prev => ({ 
            ...prev, 
            coreConcept: data.content,
            isLoading: false
          }));
        })
        .catch(err => {
          console.error("Error fetching concept from Perplexity:", err);
          setPerplexityContent(prev => ({ 
            ...prev, 
            coreConcept: "A positive attitude is contagious in the classroom. When teachers approach each day with optimism and enthusiasm, children absorb this energy and feel more secure and motivated to learn. Studies show that positive teacher-child interactions lead to better cognitive and social-emotional outcomes.",
            isLoading: false
          }));
          toast({
            title: "Content Generation Issue",
            description: "We had trouble generating custom content for this lesson. Default content has been loaded.",
            variant: "destructive"
          });
        });
        
        // Generate practical application content using enhanced apiRequest
        apiRequest('/api/perplexity/generate', {
          method: 'POST',
          data: { prompt: applicationPrompt }
        })
        .then(data => {
          console.log("Practical application response received:", data);
          setPerplexityContent(prev => ({ 
            ...prev, 
            practicalApplication: data.content,
            isLoading: false
          }));
        })
        .catch(err => {
          console.error("Error fetching application content from Perplexity:", err);
          setPerplexityContent(prev => ({ 
            ...prev, 
            practicalApplication: "1. Start each day with a personal positive affirmation and share one thing you're excited about with your class.\n\n2. Use the 'pause and breathe' technique when feeling frustrated - take three deep breaths before responding to challenging behavior.\n\n3. Keep a small notebook to jot down positive moments throughout the day, creating a resource of joy to reflect on during difficult times.",
            isLoading: false
          }));
        });
      } catch (error) {
        console.error("Unexpected error in content generation:", error);
        setPerplexityContent(prev => ({ 
          ...prev, 
          coreConcept: "A positive attitude creates a supportive learning environment. Your energy and enthusiasm set the tone for the day and influence how children engage with activities and each other.",
          practicalApplication: "1. Begin each day by greeting each child individually with a smile and using their name.\n\n2. Create a 'gratitude corner' where you and children can share daily moments of appreciation.\n\n3. Use positive language that focuses on what children should do rather than what they shouldn't do.",
          videoResources: [
            "https://www.youtube.com/embed/ckZt33Ymbpg",  // Vanderbilt IRIS Center on Positive Behavior Support
            "https://www.youtube.com/embed/4PSRP98mtJY",  // PBS Teachers video on positive classroom environments
            "https://www.youtube.com/embed/HQT6u-tFKZ4"   // Head Start video on Positive Teacher-Child Interactions
          ],
          interactiveElement: "<div class='interactive-activity'><h4>Reflect and Respond</h4><p>Think about a recent challenging situation with a child. How might you approach it differently with a more positive mindset?</p><textarea placeholder='Type your reflection here...' rows='3' class='w-full p-2 border rounded-md'></textarea><button class='mt-2 px-4 py-2 bg-primary text-white rounded-md'>Save for later</button></div>",
          quizQuestion: {
            question: "What is one benefit of maintaining a positive attitude in the classroom?",
            options: [
              "It reduces the need for planning activities",
              "It creates a supportive environment that fosters learning",
              "It eliminates all behavioral challenges",
              "It replaces the need for structured routines"
            ],
            correctAnswer: 1
          },
          isLoading: false
        }));
      }
    }
  }, [module]);

  // Simplified content for micro modules - 4 steps including interactive content
  const getStepContent = (step: number): { title: string, content: string } => {
    // Default return in case of missing data
    const defaultContent = { 
      title: "Loading...", 
      content: "Content is being prepared. Please wait a moment." 
    };
    
    // Return default if module is not loaded
    if (!module) {
      return defaultContent;
    }
    
    // Check if we have a micro-module (5 min or less)
    if (module.duration && module.duration <= 5) {
      let stepTitles = ["Quick Introduction", "Core Concept", "Practical Techniques", "Interactive Learning"];
      
      // Customize step titles for certain module types
      if (module.id === 18) { 
        stepTitles[1] = "The Power of Positivity"; 
      } else if (module.id === 19) { 
        stepTitles[1] = "Effective Listening Skills"; 
      } else if (module.id === 20) { 
        stepTitles[1] = "Patience Strategies"; 
      } else if (module.id === 21) { 
        stepTitles[1] = "Understanding Child Perspectives"; 
      } else if (module.id === 22) { 
        stepTitles[1] = "Nurturing Creativity"; 
      } else if (module.id === 23) { 
        stepTitles[1] = "Smooth Transitions"; 
      } else if (module.id === 24) { 
        stepTitles[1] = "Morning Mindfulness"; 
      } else if (module.id === 25) { 
        stepTitles[1] = "Safety Protocol"; 
      }
      
      // Return appropriate content based on step
      switch(step) {
        case 0:
          return {
            title: stepTitles[0],
            content: module?.description || ""
          };
        case 1:
          return {
            title: stepTitles[1],
            content: perplexityContent.isLoading 
              ? "Loading personalized content..." 
              : perplexityContent.coreConcept || "A positive attitude is contagious in the classroom. When teachers approach each day with optimism and enthusiasm, children absorb this energy and feel more secure and motivated to learn. Studies show that positive teacher-child interactions lead to better cognitive and social-emotional outcomes."
          };
        case 2:
          return {
            title: stepTitles[2],
            content: perplexityContent.isLoading 
              ? "Loading personalized content..." 
              : perplexityContent.practicalApplication || "1. Start each day with a personal positive affirmation and share one thing you're excited about with your class.\n\n2. Use the 'pause and breathe' technique when feeling frustrated - take three deep breaths before responding to challenging behavior.\n\n3. Keep a small notebook to jot down positive moments throughout the day, creating a resource of joy to reflect on during difficult times."
          };
        case 3:
          return {
            title: stepTitles[3],
            content: "Complete these activities to check your understanding and solidify your learning."
          };
        default:
          return {
            title: "Error",
            content: "Content not found"
          };
      }
    }
    
    // Default content for non-micro modules or fallback
    const defaultSteps = [
      {
        title: "Quick Introduction",
        content: module?.description || ""
      },
      {
        title: "Core Concept",
        content: "This is where the core concept of the module is presented in a concise, focused way."
      },
      {
        title: "Practical Application",
        content: "A brief, actionable takeaway that can be immediately applied in your classroom."
      }
    ];
    
    return defaultSteps[step] || defaultSteps[0];
  };
  
  // Only generate steps when module is loaded
  const steps = module ? [0, 1, 2, 3].map(step => getStepContent(step)) : [
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." }
  ];

  // Default key takeaways based on module category
  React.useEffect(() => {
    if (module) {
      switch (module.category) {
        case 'core-values':
          setKeyTakeaways([
            "Embody this value daily in your classroom interactions",
            "Model the behavior you wish to see in children",
            "Reflect on how this value enhances your teaching practice"
          ]);
          break;
        case 'mindful-mornings':
          setKeyTakeaways([
            "Start each day with this practice for best results",
            "Use this technique when children seem stressed or unfocused",
            "Practice this yourself before sharing with your class"
          ]);
          break;
        case 'classroom-management':
          setKeyTakeaways([
            "Implement this strategy consistently for best results",
            "Adjust the approach based on individual children's needs",
            "Use visual cues to reinforce this technique"
          ]);
          break;
        default:
          setKeyTakeaways([
            "Apply this concept in your classroom tomorrow",
            "Share this idea with a colleague for feedback",
            "Reflect on how this impacts your teaching"
          ]);
      }
    }
  }, [module]);

  const handleCompleteModule = () => {
    // Add pointsEarned to the progress update
    const pointsToAdd = MICRO_MODULE_POINTS;
    setPointsEarned(pointsToAdd);
    
    updateProgressMutation.mutate({ 
      progress: 100, 
      completed: true,
      pointsEarned: pointsToAdd
    }, {
      onSuccess: () => {
        setShowConfetti(true);
        
        // Also update user points directly
        try {
          updateUserPointsMutation.mutate(pointsToAdd, {
            onSuccess: () => {
              toast({
                title: "🎉 Micro Module Completed!",
                description: `You've earned ${pointsToAdd} points for completing this micro module!`,
                action: (
                  <Button 
                    onClick={() => setLocation('/dashboard')} 
                    variant="outline" 
                    className="mt-2 flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> 
                    Back to Dashboard
                  </Button>
                )
              });
            },
            onError: (error) => {
              console.error("Failed to update points:", error);
              toast({
                title: "Module Completed",
                description: "Your progress was saved, but we couldn't update your points. Please try again later.",
                variant: "destructive",
                action: (
                  <Button 
                    onClick={() => setLocation('/dashboard')} 
                    variant="outline" 
                    className="mt-2 flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> 
                    Back to Dashboard
                  </Button>
                )
              });
            }
          });
        } catch (error) {
          console.error("Error in updateUserPointsMutation:", error);
          toast({
            title: "Module Completed",
            description: "Your progress was saved, but we couldn't update your points. Please try again later.",
            variant: "destructive",
            action: (
              <Button 
                onClick={() => setLocation('/dashboard')} 
                variant="outline" 
                className="mt-2 flex items-center"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> 
                Back to Dashboard
              </Button>
            )
          });
        }
      }
    });
  };

  const handleNextStep = () => {
    if (completedStep < steps.length - 1) {
      // Increment the step first
      const newStep = completedStep + 1;
      setCompletedStep(newStep);
      const progressValue = Math.floor((newStep / steps.length) * 100);
      
      console.log("Updating progress:", { 
        step: newStep, 
        totalSteps: steps.length, 
        progressValue, 
        moduleId 
      });
      
      // Safeguard check for moduleId
      if (!moduleId || isNaN(moduleId)) {
        console.error("Invalid moduleId:", moduleId);
        toast({
          title: "Error Starting Lesson",
          description: "There was a problem identifying this lesson. Please go back and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Wrap the mutation in a try-catch to prevent any unhandled errors
      try {
        updateProgressMutation.mutate({ 
          progress: progressValue, 
          completed: progressValue === 100
        }, {
          onSuccess: (data) => {
            console.log("Progress update successful:", data);
          },
          onError: (error) => {
            console.error("Error updating progress:", error);
            // Revert the step if progress update fails
            setCompletedStep(completedStep);
            
            toast({
              title: "Progress Update Failed",
              description: "We couldn't save your progress. Please try again.",
              variant: "destructive"
            });
          }
        });
      } catch (error) {
        console.error("Error in handleNextStep:", error);
        // Revert the step if there's an error
        setCompletedStep(completedStep);
        
        toast({
          title: "Progress Update Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      handleCompleteModule();
    }
  };
  
  if (isLoadingModule || isLoadingProgress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading micro module...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-xl font-semibold">Module not found</p>
        <Button onClick={() => setLocation('/modules')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Button>
      </div>
    );
  }

  const currentProgress = progress?.progress || 0;
  const isCompleted = progress?.completed || false;

  return (
    <div className="container py-6">
      {showConfetti && <Confetti />}
      
      {/* Points Tracking Header */}
      <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 rounded-lg mb-4 shadow-sm border border-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div className="ml-3">
              <h2 className="font-bold text-lg">Points System</h2>
              <p className="text-sm text-muted-foreground">1 point per minute = fair rewards for all modules</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Coins className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <span className="font-bold text-lg">{user?.points || 0}</span>
              <span className="text-muted-foreground ml-1">points total</span>
            </div>
            {pointsEarned > 0 && (
              <div className="ml-2 bg-green-100 px-2 py-1 rounded-full text-green-700 text-xs font-semibold animate-pulse">
                +{pointsEarned} earned
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center mb-6">
        <Button onClick={() => setLocation('/modules')} variant="outline" className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Button>
        <h1 className="text-2xl font-bold">{module?.title || 'Loading module...'}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-rose-500" />
                  <CardTitle className="text-xl">
                    {steps[completedStep]?.title || "Learning Content"}
                  </CardTitle>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {module?.duration || '5'} min
                </span>
              </div>
              <CardDescription>
                {module?.category ? module.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Loading category'} • {module?.difficulty ? module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1) : 'Beginner'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <div className="mb-6">
                <Progress value={currentProgress} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{currentProgress}%</span>
                </div>
              </div>
              
              {completedStep === 3 ? (
                // Interactive Step - Games, Videos, and Quiz
                <div className="space-y-6">
                  <div className="text-lg mb-6">
                    {steps[completedStep]?.content || "Loading content..."}
                  </div>
                  
                  {perplexityContent.quizQuestion && (
                    <InteractiveQuiz 
                      question={{
                        ...perplexityContent.quizQuestion,
                        explanation: "Understanding key early childhood education concepts helps create effective learning environments."
                      }}
                    />
                  )}
                  
                  <MemoryMatchGame 
                    title="Match & Remember"
                    pairs={[
                      { content: "😊", description: "Positive Attitude" },
                      { content: "🤔", description: "Critical Thinking" },
                      { content: "🤗", description: "Emotional Support" },
                      { content: "📚", description: "Literacy Development" },
                      { content: "🎨", description: "Creative Expression" },
                      { content: "🧠", description: "Cognitive Growth" },
                    ]}
                  />
                  
                  {perplexityContent.videoResources && perplexityContent.videoResources.length > 0 && (
                    <VideoResources
                      videoUrls={perplexityContent.videoResources}
                      moduleName={module?.title || 'Learning Resources'}
                    />
                  )}
                  
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={() => setLocation('/dashboard')} 
                      variant="default" 
                      size="lg"
                      className="flex items-center"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> 
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                // Regular text content for steps 0-2
                <div className="text-lg mb-6">
                  {steps[completedStep]?.content || "Loading content..."}
                </div>
              )}
              
              {completedStep === 3 && keyTakeaways.length > 0 && (
                <Card className="bg-green-50 border-green-200 mb-6">
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Key Takeaways
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {keyTakeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              {isCompleted ? (
                <Button className="w-full" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  Completed
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleNextStep}
                  disabled={updateProgressMutation.isPending}
                >
                  {completedStep < steps.length - 1 ? (
                    <>Next Step</>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Complete Module
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Time Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Just {module.duration} minutes - perfect for a busy day!
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Why This Matters</h3>
                  <p className="text-sm text-muted-foreground">
                    This micro module focuses on an essential skill that can immediately improve your classroom experience.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Best For</h3>
                  <p className="text-sm text-muted-foreground">
                    Teachers looking to quickly refresh their knowledge or learn a focused concept during breaks.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/modules')}>
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                Browse More Modules
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}