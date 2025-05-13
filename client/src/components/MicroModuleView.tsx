import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { LearningModule, UserProgress, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, Heart, Star, Zap, ArrowLeft, Trophy, Award, Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';

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
      return apiRequest(`/api/progress`, {
        method: 'POST',
        data: { ...data, moduleId }
      });
    },
    onSuccess: () => {
      // Invalidate both progress and user queries to refresh points
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });
  
  // Update user points mutation
  const updateUserPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      return apiRequest('/api/users/add-points', {
        method: 'POST',
        data: { points }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  // Simplified content for micro modules - just 3 quick steps
  const steps = [
    {
      title: "Quick Introduction",
      content: module?.description || ""
    },
    {
      title: "Core Concept",
      content: "This is where the core concept of the micro module is presented in a concise, focused way."
    },
    {
      title: "Practical Application",
      content: "A brief, actionable takeaway that can be immediately applied in your classroom."
    }
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
        updateUserPointsMutation.mutate(pointsToAdd);
        
        toast({
          title: "🎉 Micro Module Completed!",
          description: `You've earned ${pointsToAdd} points for completing this micro module!`,
        });
      }
    });
  };

  const handleNextStep = () => {
    if (completedStep < steps.length - 1) {
      setCompletedStep(completedStep + 1);
      const progressValue = Math.floor(((completedStep + 1) / steps.length) * 100);
      updateProgressMutation.mutate({ 
        progress: progressValue, 
        completed: progressValue === 100
      });
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
        <h1 className="text-2xl font-bold">{module.title}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-rose-500" />
                  <CardTitle className="text-xl">
                    {steps[completedStep].title}
                  </CardTitle>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {module.duration} min
                </span>
              </div>
              <CardDescription>
                {module.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} • {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
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
              
              <div className="text-lg mb-6">
                {steps[completedStep].content}
              </div>
              
              {completedStep === steps.length - 1 && (
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