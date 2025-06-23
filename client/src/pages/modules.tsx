import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LearningModule, UserProgress } from "@shared/schema";
import { ArrowLeft, BookOpen, Clock, Award, Bookmark, Star, Zap, Timer, CheckCircle2, GraduationCap, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AssessmentRequiredDialog from "@/components/AssessmentRequiredDialog";
import { useState, useEffect } from "react";

export default function AllModules() {
  const [, setLocation] = useLocation();
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  
  // Get URL parameters to determine initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'all');

  // Fetch all modules
  const { data: modules = [], error: modulesError } = useQuery<LearningModule[]>({
    queryKey: ["/api/modules"],
    retry: (failureCount, error: any) => {
      // Don't retry if assessment is required (403 status)
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Check if modules fetch failed due to assessment requirement
  useEffect(() => {
    if (modulesError && (modulesError as any)?.response?.status === 403) {
      setShowAssessmentDialog(true);
    }
  }, [modulesError]);

  // Fetch user progress
  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  // Fetch community modules
  const { data: communityModules = [] } = useQuery<any[]>({
    queryKey: ["/api/community-modules"],
  });

  // Group modules by size (duration in minutes)
  const microModules = modules.filter(module => module.duration <= 5);
  const miniModules = modules.filter(module => module.duration > 5 && module.duration <= 15);
  const standardModules = modules.filter(module => module.duration > 15 && module.duration <= 45);
  const largeModules = modules.filter(module => module.duration > 45);

  // Helper function to group modules by topic/category
  const groupModulesByTopic = (moduleList: LearningModule[]) => {
    const grouped = moduleList.reduce((acc, module) => {
      const topic = module.category || 'Other';
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(module);
      return acc;
    }, {} as Record<string, LearningModule[]>);
    
    // Sort topics alphabetically, but put 'Other' at the end
    const sortedTopics = Object.keys(grouped).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
    
    return sortedTopics.map(topic => ({
      topic,
      modules: grouped[topic]
    }));
  };

  // Group each module type by topic
  const microModulesByTopic = groupModulesByTopic(microModules);
  const miniModulesByTopic = groupModulesByTopic(miniModules);
  const standardModulesByTopic = groupModulesByTopic(standardModules);
  const largeModulesByTopic = groupModulesByTopic(largeModules);

  // Get progress for a module
  const getModuleProgress = (moduleId: number) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    return progress ? progress.progress : 0;
  };

  // Check if module is completed and passed
  const isModuleCompleted = (moduleId: number) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    return progress ? (progress.completed && progress.passed) : false;
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
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              {isRecommended && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                  Recommended
                </Badge>
              )}
            </div>
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
            {module.eceHours && module.eceHours > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <GraduationCap className="w-3 h-3 mr-1" />
                {module.eceHours}h ECE
              </Badge>
            )}
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

  // Render enhanced community module card with full description and ratings
  const renderCommunityModuleCard = (module: any) => {
    // Community modules come from a different API with different field names
    const moduleId = module.module_id || module.id;
    const progress = getModuleProgress(moduleId);
    const isCompleted = isModuleCompleted(moduleId);
    const difficultyStyle = getDifficultyBadgeStyle(module.difficulty);
    
    // Parse average rating (community modules use different field names)
    const avgRating = module.average_rating ? parseFloat(module.average_rating) : 0;
    const ratingCount = module.rating_count || 0;
    
    // Render star rating display
    const renderStars = (rating: number) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        );
      }
      return stars;
    };
    
    return (
      <Card key={moduleId} className="h-full flex flex-col hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-3">
            <CardTitle className="text-xl font-bold leading-tight text-gray-900">{module.title}</CardTitle>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <Star className="w-3 h-3 mr-1" />
                Community
              </Badge>
            </div>
          </div>
          
          {/* Rating Display */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {renderStars(avgRating)}
            </div>
            <span className="text-sm text-gray-600">
              {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'} 
              {ratingCount > 0 && ` (${ratingCount} review${ratingCount !== 1 ? 's' : ''})`}
            </span>
          </div>
          
          {/* Module Details */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {module.duration} min
            </div>
            <Badge className={`${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border}`}>
              {difficultyStyle.icon}
              {module.difficulty}
            </Badge>
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              {module.point_value || module.pointValue} pts
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1">
          {/* Full Description */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">
              {module.description || "This community module provides valuable professional development content for early childhood educators."}
            </p>
          </div>
          
          {/* Category and Featured Info */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {module.category || 'Professional Development'}
            </Badge>
            {module.featured && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          
          {/* School Information */}
          {(module.school_name || module.schoolName) && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Shared by:</strong> {module.school_name || module.schoolName}
              </p>
            </div>
          )}
          
          {/* Recent Comments Section */}
          {ratingCount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Community Feedback</span>
              </div>
              <p className="text-xs text-blue-700">
                {ratingCount} educator{ratingCount !== 1 ? 's have' : ' has'} rated this module. 
                Comments are saved and help improve our community content.
              </p>
            </div>
          )}
          
          {/* Progress Bar if in progress */}
          {progress > 0 && !isCompleted && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-4">
          <Button 
            asChild 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href={`/module/${moduleId}`}>
              {progress > 0 && !isCompleted ? (
                <>
                  <Bookmark className="mr-2 h-4 w-4" /> Continue Learning
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" /> Start Module
                </>
              )}
            </Link>
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
        Browse all available training modules organized by size and topic. Each module type is grouped by subject area to help you find relevant content faster.
        Micro modules take just 5 minutes or less, mini modules can be completed in 5-15 minutes, standard modules take 15-45 minutes, and large modules are comprehensive learning experiences.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Modules ({modules.length})</TabsTrigger>
          <TabsTrigger value="micro">Micro ({microModules.length})</TabsTrigger>
          <TabsTrigger value="mini">Mini ({miniModules.length})</TabsTrigger>
          <TabsTrigger value="standard">Standard ({standardModules.length})</TabsTrigger>
          <TabsTrigger value="large">Large ({largeModules.length})</TabsTrigger>
          <TabsTrigger value="community">Community ({communityModules.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {/* Micro Modules by Topic */}
          {microModulesByTopic.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Timer className="mr-2 h-5 w-5 text-rose-500" />
                Micro Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(5 minutes or less)</span>
              </h2>
              {microModulesByTopic.map(({ topic, modules }) => (
                <div key={topic} className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-rose-300 pl-3">
                    {topic} ({modules.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(renderModuleCard)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Mini Modules by Topic */}
          {miniModulesByTopic.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Timer className="mr-2 h-5 w-5 text-green-600" />
                Mini Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(5-15 minutes)</span>
              </h2>
              {miniModulesByTopic.map(({ topic, modules }) => (
                <div key={topic} className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-green-300 pl-3">
                    {topic} ({modules.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(renderModuleCard)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Standard Modules by Topic */}
          {standardModulesByTopic.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                Standard Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(15-45 minutes)</span>
              </h2>
              {standardModulesByTopic.map(({ topic, modules }) => (
                <div key={topic} className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-blue-300 pl-3">
                    {topic} ({modules.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(renderModuleCard)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Large Modules by Topic */}
          {largeModulesByTopic.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="mr-2 h-5 w-5 text-amber-600" />
                Large Modules <span className="text-sm font-normal ml-2 text-muted-foreground">(45+ minutes)</span>
              </h2>
              {largeModulesByTopic.map(({ topic, modules }) => (
                <div key={topic} className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-amber-300 pl-3">
                    {topic} ({modules.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(renderModuleCard)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="micro" className="mt-6">
          {microModulesByTopic.length > 0 ? (
            microModulesByTopic.map(({ topic, modules }) => (
              <div key={topic} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-rose-300 pl-3">
                  {topic} ({modules.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map(renderModuleCard)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No micro modules available.</p>
          )}
        </TabsContent>
        
        <TabsContent value="mini" className="mt-6">
          {miniModulesByTopic.length > 0 ? (
            miniModulesByTopic.map(({ topic, modules }) => (
              <div key={topic} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-green-300 pl-3">
                  {topic} ({modules.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map(renderModuleCard)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No mini modules available.</p>
          )}
        </TabsContent>
        
        <TabsContent value="standard" className="mt-6">
          {standardModulesByTopic.length > 0 ? (
            standardModulesByTopic.map(({ topic, modules }) => (
              <div key={topic} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-blue-300 pl-3">
                  {topic} ({modules.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map(renderModuleCard)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No standard modules available.</p>
          )}
        </TabsContent>
        
        <TabsContent value="large" className="mt-6">
          {largeModulesByTopic.length > 0 ? (
            largeModulesByTopic.map(({ topic, modules }) => (
              <div key={topic} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 border-l-4 border-amber-300 pl-3">
                  {topic} ({modules.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map(renderModuleCard)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No large modules available.</p>
          )}
        </TabsContent>
        
        <TabsContent value="community" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityModules.map(renderCommunityModuleCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assessment Required Dialog */}
      <AssessmentRequiredDialog 
        isOpen={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
      />
    </div>
  );
}