import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LearningModule, UserProgress } from "@shared/schema";
import { ArrowLeft, BookOpen, Clock, Award, Bookmark, Star, Zap, Timer } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AllModules() {
  const [, setLocation] = useLocation();

  // Fetch all modules
  const { data: modules = [] } = useQuery<LearningModule[]>({
    queryKey: ["/api/modules"],
  });

  // Fetch user progress
  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  // Group modules by size (duration in minutes)
  const microModules = modules.filter(module => module.duration <= 5);
  const miniModules = modules.filter(module => module.duration > 5 && module.duration <= 15);
  const standardModules = modules.filter(module => module.duration > 15 && module.duration <= 45);
  const largeModules = modules.filter(module => module.duration > 45);

  // Get progress for a module
  const getModuleProgress = (moduleId: number) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    return progress ? progress.progress : 0;
  };

  // Check if module is completed
  const isModuleCompleted = (moduleId: number) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    return progress ? progress.completed : false;
  };

  // Check if module is recommended
  const isModuleRecommended = (moduleId: number) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    return progress ? progress.recommended : false;
  };

  // Get difficulty badge style
  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: <Star className="w-3 h-3 mr-1" />
        };
      case 'intermediate':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <Star className="w-3 h-3 mr-1" />
        };
      case 'advanced':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          icon: <Award className="w-3 h-3 mr-1" />
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: <Star className="w-3 h-3 mr-1" />
        };
    }
  };

  // Render module card
  const renderModuleCard = (module: LearningModule) => {
    const progress = getModuleProgress(module.id);
    const isCompleted = isModuleCompleted(module.id);
    const isRecommended = isModuleRecommended(module.id);
    const difficultyStyle = getDifficultyBadgeStyle(module.difficulty);
    
    return (
      <Card key={module.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold leading-tight">{module.title}</CardTitle>
            {isRecommended && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200">
                Recommended
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">{module.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{module.duration} min</span>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline" className={`${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border} font-medium border py-0 px-1.5 h-5`}>
              {difficultyStyle.icon}
              {module.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="bg-gray-50">{module.category}</Badge>
            {isRecommended && 
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Zap className="w-3 h-3 mr-1" /> Recommended
              </Badge>
            }
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={() => {
              // Route to appropriate module type based on duration
              const route = module.duration <= 5 
                ? `/micro-modules/${module.id}` 
                : `/modules/${module.id}`;
              setLocation(route);
            }} 
            variant={isCompleted ? "outline" : "default"} 
            className="w-full"
          >
            {isCompleted ? (
              <>
                <BookOpen className="mr-2 h-4 w-4" /> Review Module
              </>
            ) : progress > 0 ? (
              <>
                <Bookmark className="mr-2 h-4 w-4" /> Continue Learning
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" /> Start Module
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">All Learning Modules</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Browse all available training modules organized by size. Micro modules take just 5 minutes or less for quick learning on essential topics,
        mini modules can be completed in 5-15 minutes, standard modules take 15-45 minutes, and large modules are more comprehensive learning experiences.
      </p>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Modules ({modules.length})</TabsTrigger>
          <TabsTrigger value="micro">Micro ({microModules.length})</TabsTrigger>
          <TabsTrigger value="mini">Mini ({miniModules.length})</TabsTrigger>
          <TabsTrigger value="standard">Standard ({standardModules.length})</TabsTrigger>
          <TabsTrigger value="large">Large ({largeModules.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Timer className="mr-2 h-5 w-5 text-rose-500" />
              Micro Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(5 minutes or less)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {microModules.map(renderModuleCard)}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Timer className="mr-2 h-5 w-5 text-green-600" />
              Mini Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(5-15 minutes)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {miniModules.map(renderModuleCard)}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
              Standard Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(15-45 minutes)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standardModules.map(renderModuleCard)}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="mr-2 h-5 w-5 text-amber-600" />
              Large Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(45+ minutes)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {largeModules.map(renderModuleCard)}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="micro" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {microModules.map(renderModuleCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="mini" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {miniModules.map(renderModuleCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="standard" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardModules.map(renderModuleCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="large" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {largeModules.map(renderModuleCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}