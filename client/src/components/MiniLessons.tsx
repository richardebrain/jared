import { useState, useEffect } from "react";
import { Clock, ArrowRight, CheckCircle, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Define mini-lesson types
interface MiniLesson {
  id: number;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  difficulty: string;
  completed?: boolean;
  progress?: number;
}

interface UserProgress {
  id: number;
  userId: number;
  moduleId: number;
  progress: number;
  completed: boolean | null;
  recommended: boolean | null;
  pointsEarned: number | null;
  lastAccessed: Date | null;
}

export function MiniLessons() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<MiniLesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  
  // Get mini modules from the API (short duration modules, ≤ 7 minutes)
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['/api/modules'],
    select: (data: any) => data.filter((module: any) => module.duration <= 7)
  });
  
  // Get user progress
  const { data: progress = [] } = useQuery({
    queryKey: ['/api/progress'],
  });
  
  // Create a map of module progress
  const progressMap = Array.isArray(progress) 
    ? progress.reduce((acc: Record<number, UserProgress>, curr: UserProgress) => {
        acc[curr.moduleId] = curr;
        return acc;
      }, {})
    : {};

  // Mutation for updating progress
  const progressMutation = useMutation({
    mutationFn: (data: { moduleId: number, progress: number, completed: boolean }) => {
      return apiRequest(`/api/progress`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLessonCompleted(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle completing a mini-lesson
  const handleCompleteMiniLesson = () => {
    if (!selectedLesson) return;
    
    progressMutation.mutate({
      moduleId: selectedLesson.id,
      progress: 100,
      completed: true
    });
  };

  // Categories with their corresponding colors
  const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
    'classroom-management': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'social-emotional': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'mindful-mornings': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'health-safety': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'family-engagement': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'curriculum-planning': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    'core-values': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'active-listening': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    'quick-transition-techniques': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Quick Mini-Lessons</CardTitle>
            </div>
            <Link href="/mini-lessons">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                View All
              </Badge>
            </Link>
          </div>
          <CardDescription>
            5-10 minute activities for when you have a short break. Each mini-lesson awards points equal to their duration.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading mini-lessons...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modules.map((lesson: MiniLesson) => {
                const userProgress = progressMap[lesson.id];
                const completed = userProgress?.completed || false;
                const pointsEarned = userProgress?.pointsEarned || 0;
                
                const categoryStyle = categoryColors[lesson.category] || 
                  { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
                
                return (
                  <div 
                    key={lesson.id}
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} text-xs`}
                        >
                          {lesson.category.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                        <div className="flex items-center text-gray-500 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{lesson.duration} min</span>
                          {completed && (
                            <div className="flex items-center ml-2 text-green-600">
                              <Award className="h-3 w-3 mr-1" />
                              <span>{pointsEarned || lesson.duration} pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="font-medium mb-1">
                        {lesson.title}
                        {completed && <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-500" />}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      <Button 
                        variant={completed ? "outline" : "default"} 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setIsLessonOpen(true);
                          setLessonCompleted(completed);
                        }}
                      >
                        {completed ? 'Review Lesson' : 'Start Lesson'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Lesson Dialog */}
      <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center">
                  {selectedLesson.title}
                  {lessonCompleted && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
                </DialogTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{selectedLesson.duration} minutes</span>
                  <Badge 
                    variant="outline" 
                    className={`ml-3 ${categoryColors[selectedLesson.category]?.bg || 'bg-gray-100'} ${categoryColors[selectedLesson.category]?.text || 'text-gray-800'}`}
                  >
                    {selectedLesson.category.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Badge>
                </div>
                <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-200 inline-flex w-auto">
                  <Award className="h-4 w-4 mr-1" />
                  Worth {selectedLesson.duration} points
                </Badge>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <p className="text-base">{selectedLesson.description}</p>
                
                {/* Simplified content for the mini lesson */}
                <div className="p-4 border rounded-md bg-slate-50">
                  <h3 className="font-semibold mb-2">Mini Lesson Content</h3>
                  <p>This mini lesson would contain interactive content related to {selectedLesson.title.toLowerCase()}, including:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Brief instructional video or animation</li>
                    <li>Key points and techniques to remember</li>
                    <li>Quick knowledge check questions</li>
                    <li>Downloadable resource to use in the classroom</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-md bg-blue-50">
                  <h3 className="font-semibold mb-2">How to Apply This in Your Classroom</h3>
                  <p>To earn your {selectedLesson.duration} points for this mini-lesson:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Review all of the content above</li>
                    <li>Try implementing one technique in your classroom</li>
                    <li>Consider how this helps build "Chapter One" for each child</li>
                    <li>Mark the lesson as completed below to receive your points</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                {!lessonCompleted ? (
                  <Button 
                    onClick={handleCompleteMiniLesson} 
                    disabled={progressMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {progressMutation.isPending ? "Saving..." : `Complete & Earn ${selectedLesson.duration} Points`}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center justify-center p-2 rounded-md bg-green-50 text-green-700 border border-green-200 w-full">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>You've completed this mini-lesson and earned {progressMap[selectedLesson.id]?.pointsEarned || selectedLesson.duration} points!</span>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}