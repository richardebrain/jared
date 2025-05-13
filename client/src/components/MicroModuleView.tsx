import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { LearningModule, UserProgress } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, Heart, Star, Zap, ArrowLeft, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';

export default function MicroModuleView() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const moduleId = parseInt(params.id as string);
  const [showConfetti, setShowConfetti] = useState(false);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [completedStep, setCompletedStep] = useState<number>(0);
  
  // Fetch the module data
  const { data: module, isLoading: isLoadingModule } = useQuery<LearningModule>({
    queryKey: [`/api/modules/${moduleId}`],
  });
  
  // Fetch user's progress for this module
  const { data: progress, isLoading: isLoadingProgress } = useQuery<UserProgress>({
    queryKey: [`/api/progress/${moduleId}`],
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progress: number, completed: boolean }) => {
      return apiRequest(`/api/progress/${moduleId}`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
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
    updateProgressMutation.mutate({ 
      progress: 100, 
      completed: true 
    }, {
      onSuccess: () => {
        setShowConfetti(true);
        toast({
          title: "Module Completed!",
          description: "You've earned points for completing this micro module.",
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