import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  LearningModule as LearningModuleType,
  UserProgress,
} from "@shared/schema";
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
import { Separator } from "@/components/ui/separator";
import { GamefiedQuiz } from "@/components/GamefiedQuiz";
import { AIBearyModal } from "@/components/AIBearyModal";

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
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set(),
  );

  // Get module data
  const { data: module, isLoading: isModuleLoading } =
    useQuery<LearningModuleType>({
      queryKey: ["/api/modules", moduleId],
      queryFn: async () => {
        if (!moduleId || isNaN(moduleId)) {
          throw new Error("Invalid module ID");
        }
        return await apiRequest(`/api/modules/${moduleId}`);
      },
      enabled: !!moduleId && !isNaN(moduleId),
    });

  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery<
    UserProgress[]
  >({
    queryKey: ["/api/progress"],
  });

  // Get module sections from content
  const moduleSections = useMemo(() => {
    if (!module?.content) return [];
    try {
      const parsed = JSON.parse(module.content);
      return Array.isArray(parsed?.sections) ? parsed?.sections : [];
    } catch {
      return [];
    }
  }, [module?.content]);

  // Extract quiz sections for gamified display
  const quizSections = useMemo(() => {
    return moduleSections.filter((section) => section.type === "quiz");
  }, [moduleSections]);

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState<boolean[]>([]);

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
      const sectionIndex = moduleSections.findIndex(
        (section) => section === quizSection,
      );
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
    setCompletedSections((prev) => {
      const newSet = new Set(prev);
      newSet.add(sectionIndex);
      return newSet;
    });
  };

  // Get module-specific lessons (fallback for older modules)
  const moduleLessons = useMemo(() => {
    return moduleId ? getModuleLessons(moduleId) : [];
  }, [moduleId]);

  // Set the completed status of lessons based on progress
  useEffect(() => {
    if (progressData && module) {
      const moduleProgress = progressData.find((p) => p.moduleId === module.id);
      if (moduleProgress) {
        setCurrentProgress(moduleProgress.progress);

        // If progress exists but no current lesson, set to the first uncompleted lesson
        if (currentLessonId === null) {
          const progressPercentPerLesson = 100 / moduleLessons.length;
          const completedLessons = Math.floor(
            moduleProgress.progress / progressPercentPerLesson,
          );

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
    mutationFn: async (data: {
      moduleId: number;
      progress: number;
      completed: boolean;
    }) => {
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
        description:
          error.message || "There was an error saving your progress.",
        variant: "destructive",
      });
    },
  });

  // Complete current lesson and progress to next
  const completeLesson = () => {
    if (!module) return;

    const currentLessonIndex = moduleLessons.findIndex(
      (lesson) => lesson.id === currentLessonId,
    );
    if (currentLessonIndex === -1) return;

    // Calculate new progress
    const progressPerLesson = 100 / moduleLessons.length;
    const newProgress = Math.min(
      100,
      Math.round((currentLessonIndex + 1) * progressPerLesson),
    );

    // Update progress in the database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: newProgress === 100,
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
                The learning module you're looking for doesn't exist or has been
                removed.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => setLocation("/"), 300);
                }}
              >
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  // Current lesson
  const currentLesson = moduleLessons.find(
    (lesson) => lesson.id === currentLessonId,
  );

  // If currently taking a quiz, show the gamified quiz component
  if (currentQuizIndex !== null && quizSections[currentQuizIndex]) {
    const quizSection = quizSections[currentQuizIndex];

    // Parse quiz questions from the section content
    let quizQuestions = [];
    try {
      if (typeof quizSection.content === "string") {
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
            "To pass the assessment",
          ],
          correctAnswer: 1,
          explanation:
            "The primary goal is to improve your teaching skills and knowledge to better serve children in your care.",
          points: 15,
        },
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
            window.scrollTo({ top: 0, behavior: "smooth" });
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
                    <span className="font-semibold">
                      {calculateProgress()}%
                    </span>
                  </div>
                  <Progress value={calculateProgress()} />
                </div>

                {/* Show lesson outline if no current lesson is active */}
                {!currentLessonId ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-4">
                        Lesson Outline
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Complete each lesson in order to progress through the module.
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        {moduleLessons.map((lesson, index) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <i className="ri-time-line mr-1"></i>
                                  <span>{lesson.duration} minutes</span>
                                  <span className="mx-2">•</span>
                                  <span className="capitalize">{lesson.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {lesson.completed ? (
                                <span className="text-green-600 font-medium flex items-center">
                                  <i className="ri-check-line mr-1"></i>
                                  Complete
                                </span>
                              ) : (
                                <span className="text-gray-400">Not started</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => setCurrentLessonId(moduleLessons[0]?.id)}
                        className="w-full py-3 text-lg"
                        size="lg"
                      >
                        Start First Lesson
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Show current lesson content */
                  <div>
                    {currentLesson && (
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
                            <h4 className="font-heading font-semibold mb-3">
                              Lesson Content
                            </h4>
                            <div className="lesson-content">
                              <div className="mb-4">
                                This is where the specific lesson content would be displayed,
                                including text explanations, interactive elements, and
                                learning activities for this lesson.
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={completeLesson}
                            disabled={isPending}
                          >
                            {isPending
                              ? "Saving Progress..."
                              : "Complete & Continue"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {currentProgress}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Module completion
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Resources</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-3">
                  <li>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm flex items-center text-primary"
                    >
                      <i className="ri-book-open-line mr-2"></i>
                      Module handbook
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm flex items-center text-primary"
                    >
                      <i className="ri-video-line mr-2"></i>
                      Video tutorials
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm flex items-center text-primary"
                    >
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