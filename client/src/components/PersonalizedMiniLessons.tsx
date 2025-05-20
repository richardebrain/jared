import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, BookOpen, BrainCircuit, Lightbulb, Target, Puzzle, PenTool, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface PersonalizedMiniLessonsProps {
  userId: number;
}

const PersonalizedMiniLessons: React.FC<PersonalizedMiniLessonsProps> = ({ userId }) => {
  const [miniLessons, setMiniLessons] = useState<PersonalizedMiniLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<PersonalizedMiniLesson | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [completedSections, setCompletedSections] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchPersonalizedMiniLessons = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/personalized-modules/${userId}`);
        
        if (response.data && Array.isArray(response.data)) {
          setMiniLessons(response.data);
          
          // Set first lesson as active if available
          if (response.data.length > 0) {
            setActiveLesson(response.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching personalized mini-lessons:", error);
        toast({
          title: "Failed to load mini-lessons",
          description: "We couldn't load your personalized mini-lessons. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedMiniLessons();
  }, [userId, toast]);

  const markSectionComplete = async (lessonId: string, questionId: number, sectionType: string) => {
    try {
      // Update local state first for immediate feedback
      setCompletedSections(prev => {
        const lessonKey = `lesson_${lessonId}`;
        const sectionKey = `question_${questionId}_${sectionType}`;
        
        return {
          ...prev,
          [lessonKey]: [...(prev[lessonKey] || []), sectionKey]
        };
      });
      
      // Update progress on the server
      await axios.post('/api/personalized-modules/progress', {
        userId,
        lessonId,
        questionId,
        sectionType,
        completed: true
      });
      
      // Update the progress of the active lesson
      if (activeLesson && activeLesson.id === lessonId) {
        const updatedLesson = {...activeLesson};
        const totalSections = updatedLesson.questions.length * 4; // 4 sections per question
        const lessonKey = `lesson_${lessonId}`;
        const completedCount = completedSections[lessonKey]?.length || 0;
        const newProgress = Math.round((completedCount / totalSections) * 100);
        
        updatedLesson.progress = newProgress;
        updatedLesson.isCompleted = newProgress === 100;
        
        setActiveLesson(updatedLesson);
        
        // Update in the full list
        setMiniLessons(prev => 
          prev.map(lesson => 
            lesson.id === lessonId ? updatedLesson : lesson
          )
        );
        
        // Award points if all sections are complete
        if (newProgress === 100 && !activeLesson.isCompleted) {
          toast({
            title: "Mini-Lesson Completed!",
            description: `You've earned ${activeLesson.pointsAvailable} points for completing this mini-lesson.`,
            variant: "default",
          });
          
          // Call API to award points
          await axios.post('/api/personalized-modules/complete', {
            userId,
            lessonId
          });
        }
      }
    } catch (error) {
      console.error("Error updating section progress:", error);
      toast({
        title: "Failed to update progress",
        description: "We couldn't save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return "Beginner";
      case 2: return "Developing";
      case 3: return "Intermediate";
      case 4: return "Advanced";
      case 5: return "Expert";
      default: return "Intermediate";
    }
  };

  const getDifficultyColor = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-lime-100 text-lime-800";
      case 3: return "bg-amber-100 text-amber-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 5: return "bg-red-100 text-red-800";
      default: return "bg-amber-100 text-amber-800";
    }
  };

  const isSectionCompleted = (lessonId: string, questionId: number, sectionType: string): boolean => {
    const lessonKey = `lesson_${lessonId}`;
    const sectionKey = `question_${questionId}_${sectionType}`;
    return completedSections[lessonKey]?.includes(sectionKey) || false;
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (miniLessons.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Puzzle className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Personalized Mini-Lessons Coming Soon</h3>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Complete assessments to receive personalized mini-lessons based on your specific growth areas. These lessons will use enriched content to help you improve in targeted domains.
            </p>
            <Button onClick={() => window.location.href = "/assessments"}>
              Take an Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Mini-Lessons</CardTitle>
            <CardDescription>Personalized lessons based on your assessment results</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {miniLessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`p-3 border rounded-md cursor-pointer transition-all hover:bg-muted ${activeLesson?.id === lesson.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium">{lesson.title}</h4>
                    <Badge className={getDifficultyColor(lesson.difficulty)}>
                      {getDifficultyLabel(lesson.difficulty)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{lesson.domain}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs">{lesson.progress}% complete</div>
                    {lesson.isCompleted && (
                      <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" /> Complete
                      </Badge>
                    )}
                  </div>
                  <Progress value={lesson.progress} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="text-xs text-muted-foreground">
              <p>💡 Mini-lessons are created based on your assessment results</p>
              <p>⏱️ Each lesson takes about {activeLesson?.estimatedTimeMinutes || 15} minutes to complete</p>
              <p>🏆 Earn {activeLesson?.pointsAvailable || 15} points for each completed lesson</p>
            </div>
          </CardFooter>
        </Card>
      </div>

      {activeLesson && (
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{activeLesson.title}</CardTitle>
                  <CardDescription>{activeLesson.description}</CardDescription>
                </div>
                <Badge className={getDifficultyColor(activeLesson.difficulty)}>
                  {getDifficultyLabel(activeLesson.difficulty)}
                </Badge>
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between items-center">
                  <div>Domain: <span className="font-medium">{activeLesson.domain}</span></div>
                  <div>
                    <Progress value={activeLesson.progress} className="h-2 w-40" />
                    <div className="text-xs text-right mt-1">{activeLesson.progress}% complete</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="lesson-content">Lesson Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">What You'll Learn</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {activeLesson.questions.map(q => (
                          <li key={q.id}>{q.question}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Why This Matters</h3>
                      <p className="text-sm text-muted-foreground">
                        This mini-lesson covers concepts from the {activeLesson.domain} domain that were identified 
                        as growth areas in your assessment. Mastering these concepts will help you improve your
                        teaching effectiveness and classroom outcomes.
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <Award className="h-5 w-5 mr-2 text-yellow-500" />
                        Mini-Lesson Rewards
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <PenTool className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Professional Development</div>
                            <div className="text-xs text-muted-foreground">Evidence for your portfolio</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{activeLesson.pointsAvailable} Points</div>
                            <div className="text-xs text-muted-foreground">Earn points toward your next level</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="lesson-content">
                  <div className="space-y-6">
                    {activeLesson.questions.map((question, qIndex) => (
                      <div key={question.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-3 border-b font-medium">
                          Question {qIndex + 1}: {question.question}
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {/* Teaching Explanation */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium flex items-center">
                                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                                Teaching Explanation
                              </h4>
                              {isSectionCompleted(activeLesson.id, question.id, 'teaching') ? (
                                <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" /> Completed
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markSectionComplete(activeLesson.id, question.id, 'teaching')}
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                            <div className="text-sm pl-6">
                              {question.teachingExplanation || question.explanation}
                            </div>
                          </div>
                          
                          {/* Science Behind It */}
                          {question.scienceBehindIt && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium flex items-center">
                                  <BrainCircuit className="h-4 w-4 mr-2 text-purple-500" />
                                  The Science Behind It
                                </h4>
                                {isSectionCompleted(activeLesson.id, question.id, 'science') ? (
                                  <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => markSectionComplete(activeLesson.id, question.id, 'science')}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm pl-6">
                                {question.scienceBehindIt}
                              </div>
                            </div>
                          )}
                          
                          {/* Practical Application */}
                          {question.practicalApplication && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium flex items-center">
                                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                                  Practical Application
                                </h4>
                                {isSectionCompleted(activeLesson.id, question.id, 'practical') ? (
                                  <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markSectionComplete(activeLesson.id, question.id, 'practical')}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm pl-6">
                                {question.practicalApplication}
                              </div>
                            </div>
                          )}
                          
                          {/* Story or Why */}
                          {(question.story || question.whyBehindIt) && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium flex items-center">
                                  <Target className="h-4 w-4 mr-2 text-green-500" />
                                  {question.story ? "A Teaching Story" : "Why This Matters"}
                                </h4>
                                {isSectionCompleted(activeLesson.id, question.id, 'story') ? (
                                  <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markSectionComplete(activeLesson.id, question.id, 'story')}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm pl-6">
                                {question.story || question.whyBehindIt}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')}>Back to Overview</Button>
              {activeLesson.isCompleted ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Completed!</span>
                </div>
              ) : (
                <Button variant="default">
                  Continue Learning ({activeLesson.progress}%)
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PersonalizedMiniLessons;