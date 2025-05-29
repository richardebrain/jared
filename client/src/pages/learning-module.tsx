import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { LearningModule as LearningModuleType, UserProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Separator } from "@/components/ui/separator";
import { GamefiedQuiz } from "@/components/GamefiedQuiz";

// Define module-specific lessons
const getModuleLessons = (moduleId: number) => {
  // Special case for CORE Values module (ID: 33)
  if (moduleId === 33) {
    return [
      {
        id: 1,
        title: "Our CORE Values",
        duration: 15,
        type: "introduction",
        completed: false,
      },
      {
        id: 2,
        title: "Miss Rosa's Story",
        duration: 10,
        type: "story",
        completed: false,
      },
      {
        id: 3,
        title: "Ms. Elena's Story",
        duration: 10,
        type: "story",
        completed: false,
      },
      {
        id: 4,
        title: "CORE Values Song",
        duration: 10,
        type: "interactive",
        completed: false,
      },
      {
        id: 5,
        title: "Knowledge Check",
        duration: 10,
        type: "assessment",
        completed: false,
      },
    ];
  }
  
  // Default lessons for other modules
  return [
    {
      id: 1,
      title: "Key Concepts and Theory",
      duration: 15,
      type: "theory",
      completed: false,
    },
    {
      id: 2,
      title: "Classroom Applications",
      duration: 15,
      type: "practical",
      completed: false,
    },
    {
      id: 3,
      title: "Video Demonstrations",
      duration: 20,
      type: "video",
      completed: false,
    },
    {
      id: 4,
      title: "Hands-on Activities",
      duration: 15,
      type: "interactive",
      completed: false,
    },
    {
      id: 5,
      title: "Knowledge Assessment",
      duration: 15,
      type: "assessment",
      completed: false,
    },
  ];
};

export default function LearningModulePage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const moduleId = parseInt(id);
  
  // Current lesson state
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  
  // Get module data
  const { data: module, isLoading: isModuleLoading } = useQuery<LearningModuleType>({
    queryKey: ['/api/modules', moduleId],
    queryFn: async () => {
      if (!moduleId || isNaN(moduleId)) {
        throw new Error('Invalid module ID');
      }
      return await apiRequest(`/api/modules/${moduleId}`);
    },
    enabled: !!moduleId && !isNaN(moduleId),
  });
  
  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });
  


  // Get module sections from content
  const moduleSections = useMemo(() => {
    if (!module?.content) return [];
    try {
      const parsed = JSON.parse(module.content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [module?.content]);

  // Extract quiz sections for gamified display
  const quizSections = useMemo(() => {
    return moduleSections.filter(section => section.type === 'quiz');
  }, [moduleSections]);

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState<boolean[]>([]);
  const [scenarioMatches, setScenarioMatches] = useState<{[sectionIndex: number]: {[scenarioIndex: number]: number | null}}>({});
  const [matchResults, setMatchResults] = useState<{[sectionIndex: number]: {isCorrect: boolean, explanations: string[], correctCount: number, totalCount: number}}>({});

  // Handle quiz completion
  const handleQuizComplete = (score: number, totalPoints: number) => {
    toast({
      title: "Quiz Complete!",
      description: `You scored ${score} points and earned ${totalPoints} total points!`,
    });
    
    // Mark quiz as completed
    if (currentQuizIndex !== null) {
      const newCompleted = [...quizCompleted];
      newCompleted[currentQuizIndex] = true;
      setQuizCompleted(newCompleted);
      
      // Find the section index for this quiz and mark it completed
      const quizSection = quizSections[currentQuizIndex];
      const sectionIndex = moduleSections.findIndex(section => section === quizSection);
      if (sectionIndex !== -1) {
        markSectionCompleted(sectionIndex);
      }
    }
    
    setCurrentQuizIndex(null);
  };

  // Calculate progress based on completed sections
  const calculateProgress = () => {
    if (moduleSections.length === 0) return 0;
    return Math.round((completedSections.size / moduleSections.length) * 100);
  };

  // Update progress when sections are completed
  const markSectionCompleted = (sectionIndex: number) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionIndex);
      return newSet;
    });
  };

  // Handle scenario matching
  const handleScenarioSelect = (sectionIndex: number, scenarioIndex: number, responseIndex: number) => {
    setScenarioMatches(prev => ({
      ...prev,
      [sectionIndex]: {
        ...prev[sectionIndex],
        [scenarioIndex]: responseIndex
      }
    }));
  };

  const checkMatches = (sectionIndex: number, scenarios: string[], responses: string[]) => {
    const sectionMatches = scenarioMatches[sectionIndex] || {};
    const scenarioCount = scenarios.length;
    const allMatched = Object.keys(sectionMatches).length === scenarioCount && 
                      Object.values(sectionMatches).every(match => match !== null);
    
    if (!allMatched) {
      toast({
        title: "Incomplete Matching",
        description: "Please match all scenarios with responses before checking your answers.",
        variant: "destructive"
      });
      return;
    }

    // Generate explanations for each match
    const explanations: string[] = [];
    let correctCount = 0;

    // For demonstration, consider matches correct if they're in order
    // In practice, you'd have predefined correct answers and explanations
    Object.entries(sectionMatches).forEach(([scenarioIdx, responseIdx]) => {
      const isCorrect = parseInt(scenarioIdx) === responseIdx;
      if (isCorrect) {
        correctCount++;
        explanations.push(`Scenario ${parseInt(scenarioIdx) + 1} → Response ${String.fromCharCode(65 + responseIdx!)} ✓ This is the developmentally appropriate response that follows evidence-based practices.`);
      } else {
        explanations.push(`Scenario ${parseInt(scenarioIdx) + 1} → Response ${String.fromCharCode(65 + responseIdx!)} ✗ Consider a response that is more developmentally appropriate and builds on positive guidance strategies.`);
      }
    });

    const isAllCorrect = correctCount === scenarioCount;
    
    setMatchResults(prev => ({
      ...prev,
      [sectionIndex]: {
        isCorrect: isAllCorrect,
        explanations,
        correctCount,
        totalCount: scenarioCount
      }
    }));

    // Mark section as completed if all correct
    if (isAllCorrect) {
      markSectionCompleted(sectionIndex);
    }

    toast({
      title: isAllCorrect ? "Perfect Match!" : "Good Try!",
      description: isAllCorrect 
        ? "You matched all scenarios correctly! Great understanding of classroom management."
        : `You got ${correctCount} out of ${scenarioCount} correct. Review the explanations below.`,
      variant: isAllCorrect ? "default" : "destructive"
    });
  };

  // Get module-specific lessons (fallback for older modules)
  const moduleLessons = useMemo(() => {
    return moduleId ? getModuleLessons(moduleId) : [];
  }, [moduleId]);
  
  // Set the completed status of lessons based on progress
  useEffect(() => {
    if (progressData && module) {
      const moduleProgress = progressData.find(p => p.moduleId === module.id);
      if (moduleProgress) {
        setCurrentProgress(moduleProgress.progress);
        
        // If progress exists but no current lesson, set to the first uncompleted lesson
        if (currentLessonId === null) {
          const progressPercentPerLesson = 100 / moduleLessons.length;
          const completedLessons = Math.floor(moduleProgress.progress / progressPercentPerLesson);
          
          if (completedLessons < moduleLessons.length) {
            setCurrentLessonId(moduleLessons[completedLessons].id);
          } else {
            setCurrentLessonId(moduleLessons[0].id);
          }
        }
      } else {
        // No progress yet, start with the first lesson
        if (moduleLessons.length > 0) {
          setCurrentLessonId(moduleLessons[0].id);
        }
      }
    }
  }, [progressData, module, currentLessonId, moduleLessons]);
  
  // Update progress mutation
  const { mutate: updateProgress, isPending } = useMutation({
    mutationFn: async (data: { moduleId: number; progress: number; completed: boolean }) => {
      return await apiRequest("/api/progress", { method: "POST", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      toast({
        title: "Progress updated",
        description: "Your learning progress has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message || "There was an error saving your progress.",
        variant: "destructive",
      });
    },
  });
  
  // Complete current lesson and progress to next
  const completeLesson = () => {
    if (!module) return;
    
    const currentLessonIndex = moduleLessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentLessonIndex === -1) return;
    
    // Calculate new progress
    const progressPerLesson = 100 / moduleLessons.length;
    const newProgress = Math.min(100, Math.round((currentLessonIndex + 1) * progressPerLesson));
    
    // Update progress in the database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: newProgress === 100
    });
    
    // Update local state
    setCurrentProgress(newProgress);
    
    // Move to next lesson if available
    if (currentLessonIndex < moduleLessons.length - 1) {
      setCurrentLessonId(moduleLessons[currentLessonIndex + 1].id);
    }
  };
  
  // Loading state
  if (isModuleLoading || isProgressLoading) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
        <ChatbotSupport />
      </div>
    );
  }
  
  // Module not found
  if (!module) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Module Not Found</CardTitle>
              <CardDescription>
                The learning module you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setLocation("/"), 300);
              }}>Return to Dashboard</Button>
            </CardFooter>
          </Card>
        </main>
        <ChatbotSupport />
      </div>
    );
  }
  
  // Current lesson
  const currentLesson = moduleLessons.find(lesson => lesson.id === currentLessonId);

  // If currently taking a quiz, show the gamified quiz component
  if (currentQuizIndex !== null && quizSections[currentQuizIndex]) {
    const quizSection = quizSections[currentQuizIndex];
    
    // Parse quiz questions from the section content
    let quizQuestions = [];
    try {
      if (typeof quizSection.content === 'string') {
        // Try to parse JSON if it's a string
        const parsed = JSON.parse(quizSection.content);
        quizQuestions = parsed.questions || [];
      } else if (quizSection.content && quizSection.content.questions) {
        // Direct object access
        quizQuestions = quizSection.content.questions;
      }
    } catch {
      // Fallback quiz questions if parsing fails
      quizQuestions = [
        {
          question: "What is the main goal of this training module?",
          options: [
            "To complete required training hours",
            "To improve teaching skills and knowledge",
            "To earn points and rewards",
            "To pass the assessment"
          ],
          correctAnswer: 1,
          explanation: "The primary goal is to improve your teaching skills and knowledge to better serve children in your care.",
          points: 15
        }
      ];
    }
    
    return (
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <GamefiedQuiz
            title={quizSection.title || "Module Quiz"}
            questions={quizQuestions}
            onComplete={handleQuizComplete}
            onClose={() => setCurrentQuizIndex(null)}
          />
        </main>
        <ChatbotSupport />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setLocation("/"), 300);
          }}
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {module.difficulty}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Your progress</span>
                    <span className="font-semibold">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} />
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="content" className="flex-1">Lesson Content</TabsTrigger>
                    <TabsTrigger value="overview" className="flex-1">Module Overview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {moduleSections.length > 0 ? (
                      <div className="space-y-6">
                        {moduleSections.map((section: any, index: number) => (
                          <div key={index} className="bg-card p-4 rounded-lg" data-section-index={index}>
                            <h3 className="text-xl font-heading font-bold mb-4">
                              {section.title}
                            </h3>
                            
                            {/* Video Section */}
                            {section.type === 'video' && section.videoUrl && (
                              <div className="mb-6">
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <iframe
                                    src={section.videoUrl.replace('watch?v=', 'embed/')}
                                    title={section.title}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allowFullScreen
                                  />
                                </div>
                                {section.content && (
                                  <div className="mt-4 text-gray-700">
                                    {section.content}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Quiz Section */}
                            {section.type === 'quiz' && (
                              <div className="mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-blue-800 mb-3">Quiz Questions</h4>
                                  <div className="whitespace-pre-line text-gray-700">
                                    {section.content}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Scenario Match Section */}
                            {section.type === 'scenario-match' && (
                              <div className="mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                  <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                                    <span className="mr-2">🎯</span>
                                    Interactive Scenario Matching
                                  </h4>
                                  
                                  {(() => {
                                    // Parse content if it's stored as JSON string
                                    let contentData = section.content;
                                    if (typeof section.content === 'string') {
                                      try {
                                        contentData = JSON.parse(section.content);
                                      } catch (e) {
                                        contentData = { scenarios: '', responses: '' };
                                      }
                                    }
                                    
                                    return contentData?.scenarios && contentData?.responses ? (
                                      <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                          <div>
                                            <h5 className="font-medium text-blue-700 mb-3">Classroom Scenarios</h5>
                                            <div className="space-y-2">
                                              {contentData.scenarios.split('\n').filter((s: string) => s.trim()).map((scenario: string, idx: number) => (
                                                <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                                                  <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                      <span className="font-semibold text-blue-600">{idx + 1}.</span> {scenario.trim()}
                                                    </div>
                                                    <div className="ml-3 text-sm text-gray-500">
                                                      {scenarioMatches[index]?.[idx] !== undefined ? (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                          → {String.fromCharCode(65 + scenarioMatches[index][idx])}
                                                        </span>
                                                      ) : (
                                                        <span className="text-gray-400">Select →</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <h5 className="font-medium text-green-700 mb-3">Teacher Responses</h5>
                                            <div className="space-y-2">
                                              {contentData.responses.split('\n').filter((r: string) => r.trim()).map((response: string, idx: number) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => {
                                                    // Clear any previous results when making new selections
                                                    setMatchResults(prev => ({
                                                      ...prev,
                                                      [index]: undefined
                                                    }));

                                                    // Find which scenario is currently being matched
                                                    const scenarioCount = contentData.scenarios.split('\n').filter((s: string) => s.trim()).length;
                                                    const sectionMatches = scenarioMatches[index] || {};
                                                    
                                                    // Find next unmatched scenario or allow re-selection
                                                    let targetScenario = 0;
                                                    for (let i = 0; i < scenarioCount; i++) {
                                                      if (sectionMatches[i] === undefined) {
                                                        targetScenario = i;
                                                        break;
                                                      }
                                                    }
                                                    
                                                    // If all are matched, select the first one for re-matching
                                                    if (Object.keys(sectionMatches).length === scenarioCount) {
                                                      targetScenario = 0;
                                                    }
                                                    
                                                    handleScenarioSelect(index, targetScenario, idx);
                                                  }}
                                                  className="w-full text-left bg-green-50 p-3 rounded border border-green-200 hover:bg-green-100 transition-colors"
                                                >
                                                  <span className="font-semibold text-green-600">{String.fromCharCode(65 + idx)}.</span> {response.trim()}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm text-gray-600">
                                            {(() => {
                                              const sectionMatches = scenarioMatches[index] || {};
                                              const scenarioCount = contentData.scenarios.split('\n').filter((s: string) => s.trim()).length;
                                              const matchedCount = Object.keys(sectionMatches).length;
                                              return `${matchedCount}/${scenarioCount} scenarios matched`;
                                            })()}
                                          </div>
                                          
                                          <div className="flex gap-2">
                                            {matchResults[index] && (
                                              <Button
                                                onClick={() => {
                                                  setScenarioMatches(prev => ({
                                                    ...prev,
                                                    [index]: {}
                                                  }));
                                                  setMatchResults(prev => ({
                                                    ...prev,
                                                    [index]: undefined
                                                  }));
                                                }}
                                                variant="outline"
                                                size="sm"
                                              >
                                                Change Answers
                                              </Button>
                                            )}
                                            
                                            <Button
                                              onClick={() => {
                                                const scenarios = contentData.scenarios.split('\n').filter((s: string) => s.trim());
                                                const responses = contentData.responses.split('\n').filter((r: string) => r.trim());
                                                checkMatches(index, scenarios, responses);
                                              }}
                                              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                                              disabled={matchResults[index]?.isCorrect}
                                            >
                                              {matchResults[index]?.isCorrect ? "Completed" : "Check Answers"}
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {matchResults[index] && (
                                          <div className={`mt-4 p-4 rounded-lg border ${
                                            matchResults[index].isCorrect 
                                              ? 'bg-green-50 border-green-200' 
                                              : 'bg-orange-50 border-orange-200'
                                          }`}>
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center">
                                                <span className="mr-2 text-lg">
                                                  {matchResults[index].isCorrect ? '🎉' : '📚'}
                                                </span>
                                                <div>
                                                  <h6 className={`font-semibold ${
                                                    matchResults[index].isCorrect ? 'text-green-800' : 'text-orange-800'
                                                  }`}>
                                                    {matchResults[index].isCorrect 
                                                      ? 'Perfect Understanding!' 
                                                      : `${matchResults[index].correctCount}/${matchResults[index].totalCount} Correct`
                                                    }
                                                  </h6>
                                                  <p className={`text-sm ${
                                                    matchResults[index].isCorrect ? 'text-green-700' : 'text-orange-700'
                                                  }`}>
                                                    {matchResults[index].isCorrect 
                                                      ? 'You understand these classroom management strategies!'
                                                      : 'Review the explanations below to improve your understanding.'
                                                    }
                                                  </p>
                                                </div>
                                              </div>
                                              
                                              {matchResults[index].isCorrect && (
                                                <Button
                                                  onClick={() => {
                                                    // Find next section or complete module
                                                    const currentIndex = moduleSections.findIndex((_, idx) => idx === index);
                                                    const nextSection = moduleSections[currentIndex + 1];
                                                    
                                                    if (nextSection) {
                                                      // Scroll to next section
                                                      setTimeout(() => {
                                                        const nextElement = document.querySelector(`[data-section-index="${currentIndex + 1}"]`);
                                                        if (nextElement) {
                                                          nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                      }, 500);
                                                      
                                                      toast({
                                                        title: "Great Job!",
                                                        description: "Moving to the next section of the module.",
                                                      });
                                                    } else {
                                                      // Complete module
                                                      toast({
                                                        title: "Module Complete!",
                                                        description: "You've finished all sections. Well done!",
                                                      });
                                                    }
                                                  }}
                                                  className="bg-green-600 hover:bg-green-700 text-white"
                                                  size="sm"
                                                >
                                                  {moduleSections.findIndex((_, idx) => idx === index) < moduleSections.length - 1 ? "Next Section" : "Complete Module"}
                                                </Button>
                                              )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                              {matchResults[index].explanations.map((explanation, expIdx) => (
                                                <div 
                                                  key={expIdx} 
                                                  className={`p-2 rounded text-sm ${
                                                    explanation.includes('✓') 
                                                      ? 'bg-green-100 text-green-800 border border-green-200' 
                                                      : 'bg-red-100 text-red-800 border border-red-200'
                                                  }`}
                                                >
                                                  {explanation}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-gray-600">
                                        <p>Match classroom scenarios with appropriate teacher responses.</p>
                                        <div className="mt-4 text-sm">
                                          {typeof section.content === 'string' ? section.content : 'Interactive scenario matching activity'}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  
                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm text-yellow-700">
                                      <span className="font-semibold">💡 Instructions:</span> 
                                      Review each scenario and identify which response would be most appropriate. 
                                      Consider developmental appropriateness and evidence-based practices.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Text Section */}
                            {section.type === 'text' && (
                              <div className="mb-6">
                                <div className="whitespace-pre-line text-gray-700 mb-4">
                                  {section.content}
                                </div>
                                <div className="flex justify-between items-center">
                                  {completedSections.has(index) ? (
                                    <span className="text-green-600 font-medium flex items-center">
                                      <span className="mr-2">✓</span>
                                      Section Complete
                                    </span>
                                  ) : (
                                    <Button
                                      onClick={() => markSectionCompleted(index)}
                                      variant="outline"
                                      size="sm"
                                      className="border-green-600 text-green-600 hover:bg-green-50"
                                    >
                                      Mark as Complete
                                    </Button>
                                  )}
                                  
                                  {completedSections.has(index) && index < moduleSections.length - 1 && (
                                    <Button
                                      onClick={() => {
                                        // Scroll to next section
                                        setTimeout(() => {
                                          const nextElement = document.querySelector(`[data-section-index="${index + 1}"]`);
                                          if (nextElement) {
                                            nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                          }
                                        }, 500);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      size="sm"
                                    >
                                      Next Section
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : currentLesson ? (
                      <div>
                        <div className="bg-card p-4 rounded-lg mb-6">
                          <h3 className="text-xl font-heading font-bold mb-2">
                            {currentLesson.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-4">
                            <i className="ri-time-line mr-2"></i>
                            <span>{currentLesson.duration} minutes</span>
                            <i className="ri-file-list-line ml-4 mr-2"></i>
                            <span>{currentLesson.type}</span>
                          </div>
                          
                          <div className="mb-8">
                            <h4 className="font-heading font-semibold mb-3">Lesson Content</h4>
                            <div className="lesson-content">
                              {module.category === 'mindful-mornings' ? (
                                module.title.includes('Breathing') ? (
                                  <>
                                    <div className="mb-4">In this module, you'll learn how to effectively teach breathing exercises to children that can help them regulate their emotions and increase focus in the classroom.</div>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Key Benefits of Breathing Exercises</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Helps children develop self-regulation skills</li>
                                      <li>Reduces anxiety and stress responses</li>
                                      <li>Improves focus and attention</li>
                                      <li>Can be used as a transitional activity between lessons</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <div className="font-semibold text-[#0030b8]">🌟 Easter Egg Alert!</div>
                                      <div className="text-[#333]">If you memorize the phrase "<span className="font-bold">Breathe, Smile, Be Present</span>" and share it with your director, you'll receive a special lunch reward!</div>
                                    </div>
                                  </>
                                ) : module.title.includes('Self-Affirmations') ? (
                                  <>
                                    <div className="mb-4">This module explores how to teach children positive self-talk and affirmations that build confidence and resilience in the classroom setting.</div>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Benefits of Self-Affirmations for Children</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Builds a positive self-image and self-esteem</li>
                                      <li>Encourages resilience when facing challenges</li>
                                      <li>Helps develop a growth mindset approach to learning</li>
                                      <li>Creates a supportive classroom environment</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <div className="font-semibold text-[#0030b8]">💫 Activity Challenge!</div>
                                      <div className="text-[#333]">Create your own classroom affirmation and send it to your director to receive special recognition in the next staff meeting!</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="mb-4">The gratitude module will help you incorporate thankfulness and appreciation practices into your daily classroom routines.</div>
                                    
                                    <h5 className="font-semibold mt-6 mb-2">Why Teaching Gratitude Matters</h5>
                                    <ul className="list-disc pl-5 mb-4 space-y-1">
                                      <li>Improves classroom climate and student well-being</li>
                                      <li>Helps children develop emotional intelligence</li>
                                      <li>Reduces conflicts and promotes empathy</li>
                                      <li>Creates a positive learning environment</li>
                                    </ul>
                                    
                                    <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                      <div className="font-semibold text-[#0030b8]">🎁 Hidden Challenge!</div>
                                      <div className="text-[#333]">Find the three gratitude statements embedded in this module. When you find all three, share them with your director to unlock a special reward!</div>
                                    </div>
                                  </>
                                )
                              ) : (
                                <>
                                  {module.title === "Raising Arizona's CORE Values" ? (
                                    <>
                                      <h3 className="text-xl font-semibold mb-4">CORE Values at Raising Arizona</h3>
                                      <p className="mb-4">Our CORE values guide everything we do at Raising Arizona Preschool. These fundamental principles help create a nurturing environment where children and staff can thrive together.</p>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                          <h4 className="font-bold text-blue-700 mb-2">C - Compassion</h4>
                                          <p>We show kindness and empathy to everyone in our community, understanding that each person has unique needs and experiences.</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                          <h4 className="font-bold text-green-700 mb-2">O - Opportunity</h4>
                                          <p>We create meaningful learning opportunities that inspire curiosity and growth for both children and staff.</p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                          <h4 className="font-bold text-purple-700 mb-2">R - Respect</h4>
                                          <p>We honor the dignity and worth of every child, family member, and colleague through our words and actions.</p>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                          <h4 className="font-bold text-amber-700 mb-2">E - Excellence</h4>
                                          <p>We strive for excellence in all aspects of our work, continuously improving our practices to provide the highest quality care and education.</p>
                                        </div>
                                      </div>
                                      
                                      <h3 className="text-xl font-semibold mb-3 mt-6">Miss Rosa's Unbroken Circle</h3>
                                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                        <p className="italic text-gray-700 mb-4">From the very first morning, Lila clung to the classroom door, eyes wide with fear. Miss Rosa approached slowly, kneeling to meet Lila's gaze. "Would you like to help me with our welcome song this morning?" she whispered. Lila's grip loosened slightly.</p>
                                        <p className="italic text-gray-700 mb-4">Each day, Miss Rosa invited Lila to help in small ways—watering plants, arranging cushions for circle time, choosing the morning book. Miss Rosa noticed Lila's careful attention to how things were arranged—her natural sense of order.</p>
                                        <p className="italic text-gray-700 mb-4">"In our classroom," Miss Rosa explained to her colleagues, "we respect each child's journey. Lila needs to feel safe before she can fully participate." By month's end, it was Lila who organized the welcome circle, carefully placing each cushion in a perfect round formation, ensuring no child was left outside the circle.</p>
                                        <p className="italic text-gray-700">What Miss Rosa recognized in this child was the need for inclusion through meaningful contribution. By honoring Lila's need for order and giving her purpose, Miss Rosa demonstrated how our CORE values create an unbroken circle where every child belongs.</p>
                                      </div>
                                      
                                      <h3 className="text-xl font-semibold mb-3 mt-6">Ms. Elena's Whispered Promise</h3>
                                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                        <p className="italic text-gray-700 mb-4">Tiny footsteps echoed in the cubby-lined hallway as four-year-old Jamal arrived early each morning. His father, working double shifts, would drop him off before sunrise. Rather than seeing this as an inconvenience, Ms. Elena recognized an opportunity.</p>
                                        <p className="italic text-gray-700 mb-4">"Jamal, would you like to be my special classroom helper this morning?" she asked that first day. His eyes lit up as she handed him a small spray bottle and cloth. Together, they wiped tables and arranged chairs before other children arrived.</p>
                                        <p className="italic text-gray-700 mb-4">The early-morning ritual continued for months. One day, Jamal's father arrived later than usual, apologizing profusely. Ms. Elena noticed Jamal whisper something to his father, who looked surprised but nodded. The next day, father and son arrived together—early again.</p>
                                        <p className="italic text-gray-700">"He told me he had important work to do," his father explained, smiling. "That you were counting on him." Ms. Elena nodded, understanding. Through her simple act of creating opportunity from challenge, she had given Jamal more than just tasks—she had given him purpose and pride, demonstrating that our CORE values provide every child the chance to excel in their own unique way.</p>
                                      </div>
                                      
                                      <h3 className="text-xl font-semibold mb-3">CORE Values Song</h3>
                                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                        <p className="mb-3">Listen to our CORE Values song and fill in the missing words:</p>
                                        
                                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                          <p className="italic mb-2 text-gray-700 font-medium">Sunrise paints the Glendale sky gold,</p>
                                          <p className="italic mb-2 text-gray-700 font-medium">As we open our doors once more.</p>
                                          <p className="italic mb-2 text-gray-700 font-medium">At Raising Arizona we uphold</p>
                                          <p className="italic mb-2 text-gray-700 font-medium">The CORE values we all adore.</p>
                                          <p className="italic mt-3 text-gray-700 font-medium">♪ These are the values that guide our way... ♪</p>
                                        </div>
                                        
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                          <p className="mb-4 font-medium">Fill in the missing CORE values:</p>
                                          <div className="mb-6">
                                            <p className="mb-2">C stands for <input type="text" className="border-b-2 border-blue-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> in all that we do</p>
                                            <p className="mb-2">O means <input type="text" className="border-b-2 border-green-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> for learning and growth</p>
                                            <p className="mb-2">R reminds us of <input type="text" className="border-b-2 border-purple-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> for everyone</p>
                                            <p className="mb-4">E inspires <input type="text" className="border-b-2 border-amber-500 bg-transparent px-1 w-28 focus:outline-none" placeholder="type here..." /> in our work every day</p>
                                            <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Check Answers</button>
                                          </div>
                                          
                                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm font-medium text-yellow-800">💡 Teacher Tip:</p>
                                            <div className="text-sm text-yellow-700">
                                              The correct answers are Compassion, Opportunity, Respect, and Excellence. 
                                              This interactive element helps children better remember our CORE values through active participation.
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="p-4 bg-[#e6ecff] border border-[#0030b8] rounded-lg mb-6">
                                        <div className="font-semibold text-[#0030b8]">🎯 Easter Egg Challenge!</div>
                                        <div className="text-[#333]">There's a special phrase hidden in Miss Rosa's story. Find it and share it with your director to earn 50 bonus points!</div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      This is where the specific lesson content would be displayed, 
                                      including text explanations, interactive elements, and practice exercises.
                                      <div className="p-4 bg-muted rounded-lg mt-4">
                                        <p className="text-center text-muted-foreground">
                                          Lesson content is loaded dynamically based on the selected module and lesson.
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={completeLesson}
                            disabled={isPending}
                          >
                            {isPending ? "Saving Progress..." : "Complete & Continue"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Select a lesson to begin</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="overview">
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-4">About This Module</h3>
                      <p className="mb-6">{module.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Duration</h4>
                          <div className="flex items-center">
                            <i className="ri-time-line text-primary mr-2"></i>
                            <span>{module.duration} minutes total</span>
                          </div>
                        </div>
                        <div className="bg-card p-4 rounded-lg">
                          <h4 className="font-heading font-semibold mb-2">Category</h4>
                          <div className="flex items-center">
                            <i className="ri-folder-line text-primary mr-2"></i>
                            <span>{module.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-heading font-bold mb-4">Module Content</h3>
                      <p className="mb-4">This module contains the following lessons:</p>
                      
                      {/* Display quiz sections as interactive gamified elements */}
                      {quizSections.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3 flex items-center">
                            <i className="ri-questionnaire-line text-primary mr-2"></i>
                            Interactive Quizzes
                          </h4>
                          <div className="space-y-3">
                            {quizSections.map((quizSection, index) => (
                              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{quizSection.title || `Quiz ${index + 1}`}</h5>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Test your knowledge with this interactive gamified quiz
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => setCurrentQuizIndex(index)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                    size="sm"
                                  >
                                    {quizCompleted[index] ? "Retake Quiz" : "Start Quiz"}
                                  </Button>
                                </div>
                                {quizCompleted[index] && (
                                  <div className="mt-2 flex items-center text-green-600 text-sm">
                                    <i className="ri-check-line mr-1"></i>
                                    Completed
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 mb-6">
                        {moduleLessons.map((lesson, index) => {
                          // Calculate if this lesson should be considered complete based on progress
                          const progressPerLesson = 100 / moduleLessons.length;
                          const isComplete = currentProgress >= (index + 1) * progressPerLesson;
                          
                          return (
                            <div 
                              key={lesson.id}
                              className={`border rounded-lg p-3 flex items-center justify-between ${
                                currentLessonId === lesson.id ? 'border-primary' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  isComplete 
                                    ? 'bg-primary text-white' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {isComplete ? (
                                    <i className="ri-check-line"></i>
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">{lesson.title}</h4>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <i className="ri-time-line mr-1"></i>
                                    <span>{lesson.duration} min</span>
                                    <span className="mx-2">•</span>
                                    <span>{lesson.type}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={isComplete ? "outline" : "default"}
                                size="sm"
                                onClick={() => setCurrentLessonId(lesson.id)}
                              >
                                {isComplete ? "Review" : "Start"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="w-32 h-32 mx-auto mb-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="12" 
                        strokeDasharray="339.292" 
                        strokeDashoffset={339.292 * (1 - calculateProgress() / 100)} 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{calculateProgress()}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">Keep going! You're doing great!</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Sections Completed</span>
                      <span className="font-semibold">
                        {completedSections.size}/{moduleSections.length}
                      </span>
                    </div>
                    <Progress 
                      value={moduleSections.length > 0 ? (completedSections.size / moduleSections.length) * 100 : 0} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Time Spent</span>
                      <span className="font-semibold">
                        {Math.floor((module.duration * currentProgress) / 100)} min
                      </span>
                    </div>
                    <Progress value={currentProgress} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Meet AI Beary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <span className="text-2xl">🐻</span>
                  </div>
                  <div>
                    <p className="text-sm mb-4">
                      I'm AI Beary, your teaching assistant! Ask me anything about this module, classroom strategies, or early childhood education.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={() => {
                        const chatInput = prompt("What would you like to ask AI Beary about this module?");
                        if (chatInput) {
                          // For now, show a friendly response - later this will connect to AI
                          alert(`AI Beary says: "That's a great question! I'm here to help you with ${module?.title || 'your learning'}. While I'm getting smarter every day, please reach out to your director for specific guidance about this topic."`);
                        }
                      }}
                    >
                      Ask AI Beary
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h4 className="font-heading font-semibold mb-2">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-file-text-line mr-2"></i>
                      Download lesson notes
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-headphone-line mr-2"></i>
                      Audio pronunciation guide
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto text-sm flex items-center text-primary">
                      <i className="ri-translate-2 mr-2"></i>
                      Vocabulary flashcards
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
