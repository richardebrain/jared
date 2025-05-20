import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Book, Star, Clock, Award, BrainCircuit, FlaskConical, Lightbulb, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface PersonalizedMiniLessonsProps {
  userId: number;
}

interface PersonalizedMiniLesson {
  id: string;
  title: string;
  description: string;
  domain: string;
  difficulty: number;
  questions: PersonalizedQuestion[];
  estimatedTimeMinutes: number;
  pointsAvailable: number;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
}

interface PersonalizedQuestion {
  id: number;
  question: string;
  correctAnswer: string;
  explanation: string;
  teachingExplanation: string;
  scienceBehindIt: string;
  practicalApplication: string;
  whyBehindIt: string;
  story: string;
}

const PersonalizedMiniLessons: React.FC<PersonalizedMiniLessonsProps> = ({ userId }) => {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, string[]>>({});

  // Fetch personalized mini-lessons for the user
  const { data: miniLessons, isLoading, error } = useQuery({
    queryKey: ['/api/personalized-modules', userId],
    queryFn: async () => {
      const response = await fetch(`/api/personalized-modules/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch personalized mini-lessons');
      }
      return response.json() as Promise<PersonalizedMiniLesson[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLessonClick = (lessonId: string) => {
    setActiveLesson(lessonId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setActiveLesson(null);
    setViewMode('list');
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      // Update progress on the server
      await apiRequest('POST', `/api/personalized-modules/${userId}/progress`, {
        moduleId: lessonId,
        progress: 100,
        isCompleted: true,
      });

      // Update local state
      setCompletedLessons(prev => ({
        ...prev,
        [lessonId]: true,
      }));

      // Show success message
      toast({
        title: "Mini-Lesson Completed!",
        description: "You've earned 15 points for completing this personalized mini-lesson.",
        duration: 5000,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/personalized-modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      // Return to list view
      handleBackToList();
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Error",
        description: "Failed to mark the lesson as complete.",
        variant: "destructive",
      });
    }
  };

  const toggleContentSection = (lessonId: string, itemId: string) => {
    setExpandedItems(prev => {
      const lessonItems = prev[lessonId] || [];
      const isExpanded = lessonItems.includes(itemId);
      
      if (isExpanded) {
        return {
          ...prev,
          [lessonId]: lessonItems.filter(id => id !== itemId),
        };
      } else {
        return {
          ...prev,
          [lessonId]: [...lessonItems, itemId],
        };
      }
    });
  };

  const isSectionExpanded = (lessonId: string, itemId: string): boolean => {
    return (expandedItems[lessonId] || []).includes(itemId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50 text-red-800">
        <p>Failed to load personalized mini-lessons.</p>
        <p className="text-sm mt-2">Please try again later or contact support if the problem persists.</p>
      </div>
    );
  }

  if (!miniLessons || miniLessons.length === 0) {
    return (
      <div className="text-center p-8 border border-gray-200 rounded-lg bg-gray-50">
        <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Personalized Mini-Lessons Yet</h3>
        <p className="text-neutral-600 max-w-md mx-auto">
          Complete more assessments to receive personalized mini-lessons based on your results.
          These tailored lessons will help you improve in specific areas.
        </p>
      </div>
    );
  }

  const renderDifficultyStars = (difficulty: number) => {
    const maxStars = 5;
    return (
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < difficulty ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render the list view of mini-lessons
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {miniLessons.map((lesson) => (
            <Card key={lesson.id} className={`overflow-hidden transition-all duration-300 hover:shadow-md ${completedLessons[lesson.id] || lesson.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{lesson.title}</CardTitle>
                  {renderDifficultyStars(lesson.difficulty)}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                    {lesson.domain.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{lesson.estimatedTimeMinutes} min</span>
                  </div>
                </div>
                <CardDescription className="mt-1">
                  {lesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm mb-2">
                  <span className="font-medium">Learning points: </span> 
                  <span className="text-emerald-600 font-semibold">{lesson.pointsAvailable}</span>
                </div>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {completedLessons[lesson.id] || lesson.isCompleted ? 'Completed' : 'Progress'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {completedLessons[lesson.id] || lesson.isCompleted ? '100%' : `${lesson.progress}%`}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={completedLessons[lesson.id] || lesson.isCompleted ? 100 : lesson.progress} 
                    className="h-2 mt-1"
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={() => handleLessonClick(lesson.id)}
                  className="w-full"
                  variant={completedLessons[lesson.id] || lesson.isCompleted ? "outline" : "default"}
                >
                  {completedLessons[lesson.id] || lesson.isCompleted ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> 
                      Review Lesson
                    </>
                  ) : (
                    'Start Lesson'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render the detail view of a selected mini-lesson
  const activeData = miniLessons?.find(lesson => lesson.id === activeLesson);
  
  if (!activeData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={handleBackToList}>
          Back to All Mini-Lessons
        </Button>
        {!(completedLessons[activeData.id] || activeData.isCompleted) && (
          <Button onClick={() => handleCompleteLesson(activeData.id)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Complete
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{activeData.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  {activeData.domain.replace('_', ' ')}
                </Badge>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{activeData.estimatedTimeMinutes} min</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  <span>{activeData.pointsAvailable} points</span>
                </div>
              </div>
            </div>
            {renderDifficultyStars(activeData.difficulty)}
          </div>
          <CardDescription className="mt-2">
            {activeData.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {activeData.questions.map((question, index) => (
          <Card key={question.id} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3">
                  {index + 1}
                </span>
                <span>{question.question}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="explanation" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  <TabsTrigger value="theory">Theory</TabsTrigger>
                  <TabsTrigger value="practice">Practice</TabsTrigger>
                  <TabsTrigger value="why">Why It Matters</TabsTrigger>
                </TabsList>
                
                <TabsContent value="explanation" className="pt-4">
                  <div>
                    <div className="font-medium text-lg flex items-center mb-2">
                      <Book className="h-5 w-5 mr-2 text-blue-600" />
                      Teaching Explanation
                    </div>
                    <p className="text-neutral-700 whitespace-pre-line">
                      {question.teachingExplanation || question.explanation || "No detailed explanation available for this question."}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="theory" className="pt-4">
                  <div>
                    <div className="font-medium text-lg flex items-center mb-2">
                      <BrainCircuit className="h-5 w-5 mr-2 text-purple-600" />
                      The Science Behind It
                    </div>
                    <p className="text-neutral-700 whitespace-pre-line">
                      {question.scienceBehindIt || "No scientific background available for this question."}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="practice" className="pt-4">
                  <div>
                    <div className="font-medium text-lg flex items-center mb-2">
                      <FlaskConical className="h-5 w-5 mr-2 text-emerald-600" />
                      Practical Application
                    </div>
                    <p className="text-neutral-700 whitespace-pre-line">
                      {question.practicalApplication || "No practical application examples available for this question."}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="why" className="pt-4">
                  <div>
                    <div className="font-medium text-lg flex items-center mb-2">
                      <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                      Why This Matters
                    </div>
                    <p className="text-neutral-700 whitespace-pre-line mb-4">
                      {question.whyBehindIt || "No additional context available for why this is important."}
                    </p>
                    
                    {question.story && (
                      <div className="mt-4 border-l-4 border-blue-200 pl-4 italic text-neutral-600 bg-blue-50 p-3 rounded-r-md">
                        <div className="font-medium text-base flex items-center mb-1">
                          <Zap className="h-4 w-4 mr-2 text-blue-600" />
                          Real Classroom Story
                        </div>
                        {question.story}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <Button variant="outline" onClick={handleBackToList}>
          Back to All Mini-Lessons
        </Button>
        {!(completedLessons[activeData.id] || activeData.isCompleted) && (
          <Button onClick={() => handleCompleteLesson(activeData.id)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Complete
          </Button>
        )}
      </div>
    </div>
  );
};

export default PersonalizedMiniLessons;