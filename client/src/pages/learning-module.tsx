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

// QuizSection component for handling quiz interactions
interface QuizSectionProps {
  section: any;
  onComplete: () => void;
  isCompleted: boolean;
}

function QuizSection({ section, onComplete, isCompleted }: QuizSectionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Parse quiz questions from section content
  console.log(section, "section from quiz");
  const getQuizQuestions = () => {
    try {
      let questions = [];
      if (section.questions && section.questions.length > 0) {
        questions = section.questions;
      }
      return questions;
    } catch {
      return [];
    }
  };

  const questions = getQuizQuestions();
  console.log(questions, "quiz questions");

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return; // Prevent changes after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const submitQuiz = () => {
    let correctCount = 0;
    questions.forEach((question: any, index: number) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    setQuizScore(score);
    setShowResults(true);

    // Mark as complete if score is above 70%
    if (score >= 70) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setQuizScore(0);
  };

  if (isCompleted) {
    return (
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center">
            <i className="ri-check-circle-fill mr-2"></i>
            Knowledge Check - Completed
          </h4>
          <p className="text-green-700">
            You have successfully completed this quiz section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-800 mb-6 text-lg">
          Knowledge Check
        </h4>

        {questions?.length > 0 ? (
          <div className="space-y-6">
            {questions?.map((question: any, questionIndex: number) => (
              <div
                key={questionIndex}
                className="bg-white rounded-lg p-4 border"
              >
                <h5 className="font-medium text-gray-900 mb-4">
                  {questionIndex + 1}. {question.question}
                </h5>

                <div className="space-y-2">
                  {question?.answers.map(
                    (answer: string, answerIndex: number) => {
                      const isSelected =
                        selectedAnswers[questionIndex] === answerIndex;
                      const isCorrect = answerIndex === question.correctAnswer;
                      const isIncorrect =
                        showResults && isSelected && !isCorrect;
                      const shouldShowCorrect = showResults && isCorrect;

                      return (
                        <button
                          key={answerIndex}
                          onClick={() =>
                            handleAnswerSelect(questionIndex, answerIndex)
                          }
                          disabled={showResults}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected && !showResults
                              ? "border-blue-500 bg-blue-50"
                              : shouldShowCorrect
                                ? "border-green-500 bg-green-50 text-green-800"
                                : isIncorrect
                                  ? "border-red-500 bg-red-50 text-red-800"
                                  : "border-gray-200 hover:border-gray-300"
                          } ${showResults ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                isSelected && !showResults
                                  ? "border-blue-500 bg-blue-500"
                                  : shouldShowCorrect
                                    ? "border-green-500 bg-green-500"
                                    : isIncorrect
                                      ? "border-red-500 bg-red-500"
                                      : "border-gray-300"
                              }`}
                            >
                              {(isSelected || shouldShowCorrect) && (
                                <i
                                  className={`ri-check-line text-white text-sm ${
                                    isIncorrect
                                      ? "ri-close-line"
                                      : "ri-check-line"
                                  }`}
                                ></i>
                              )}
                            </div>
                            <span>{answer}</span>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ))}

            {!showResults ? (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={submitQuiz}
                  disabled={
                    Object.keys(selectedAnswers).length !== questions.length
                  }
                  className="px-8"
                >
                  Submit Quiz
                </Button>
              </div>
            ) : (
              <div className="text-center pt-4">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg ${
                    quizScore >= 70
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <i
                    className={`mr-2 ${
                      quizScore >= 70
                        ? "ri-check-circle-fill"
                        : "ri-information-fill"
                    }`}
                  ></i>
                  <span className="font-medium">
                    Quiz Score: {quizScore}% (
                    {
                      Object.values(selectedAnswers).filter(
                        (answer, index) =>
                          answer === questions[index]?.correctAnswer,
                      ).length
                    }
                    /{questions.length} correct)
                  </span>
                </div>

                {quizScore < 70 && (
                  <div className="mt-4">
                    <Button onClick={resetQuiz} variant="outline">
                      Retake Quiz
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">
            No quiz questions available for this section.
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

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

  // Navigation functions for stepper
  const goToNextSection = () => {
    if (currentSectionIndex < moduleSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const markCurrentSectionCompleted = () => {
    markSectionCompleted(currentSectionIndex);
    // Auto-advance to next section if not the last one
    if (currentSectionIndex < moduleSections.length - 1) {
      setTimeout(() => {
        goToNextSection();
      }, 1000); // Small delay to show completion status
    }
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
  console.log(moduleSections, "module sections");
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
                        Complete each lesson in order to progress through the
                        module.
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
                                  <span className="capitalize">
                                    {lesson.type}
                                  </span>
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
                                <span className="text-gray-400">
                                  Not started
                                </span>
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
                            {/* Progress Stepper */}
                            {moduleSections.length > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-heading font-semibold">
                                    Section {currentSectionIndex + 1} of{" "}
                                    {moduleSections.length}
                                  </h4>
                                  <div className="text-sm text-muted-foreground">
                                    {Math.round(
                                      ((currentSectionIndex + 1) /
                                        moduleSections.length) *
                                        100,
                                    )}
                                    % Complete
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${((currentSectionIndex + 1) / moduleSections.length) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <div className="lesson-content">
                              {moduleSections.length > 0 ? (
                                <div className="space-y-6">
                                  {/* Current Section */}
                                  {moduleSections[currentSectionIndex] && (
                                    <div
                                      className="bg-card p-6 rounded-lg border"
                                      data-section-index={currentSectionIndex}
                                    >
                                      <h3 className="text-2xl font-heading font-bold mb-6">
                                        {
                                          moduleSections[currentSectionIndex]
                                            .title
                                        }
                                      </h3>

                                      {/* Video Section */}
                                      {moduleSections[currentSectionIndex]
                                        .type === "video" &&
                                        moduleSections[currentSectionIndex]
                                          .videoUrl && (
                                          <div className="mb-6">
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                              <iframe
                                                src={moduleSections[
                                                  currentSectionIndex
                                                ].videoUrl.replace(
                                                  "watch?v=",
                                                  "embed/",
                                                )}
                                                title={
                                                  moduleSections[
                                                    currentSectionIndex
                                                  ].title
                                                }
                                                className="w-full h-full"
                                                frameBorder="0"
                                                allowFullScreen
                                              />
                                            </div>
                                            {moduleSections[currentSectionIndex]
                                              .content && (
                                              <div className="mt-4 text-gray-700 text-lg leading-relaxed">
                                                {
                                                  moduleSections[
                                                    currentSectionIndex
                                                  ].content
                                                }
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      {/* Text Section */}
                                      {moduleSections[currentSectionIndex]
                                        .type === "text" && (
                                        <div className="mb-6">
                                          <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed mb-6">
                                            {
                                              moduleSections[
                                                currentSectionIndex
                                              ].content
                                            }
                                          </div>
                                        </div>
                                      )}

                                      {/* Quiz Section */}
                                      {moduleSections[currentSectionIndex]
                                        .type === "quiz" && (
                                        <QuizSection
                                          section={
                                            moduleSections[currentSectionIndex]
                                          }
                                          onComplete={() =>
                                            markCurrentSectionCompleted()
                                          }
                                          isCompleted={completedSections.has(
                                            currentSectionIndex,
                                          )}
                                        />
                                      )}

                                      {/* Section Completion Status */}
                                      <div className="mt-6 flex justify-between items-center">
                                        {completedSections.has(
                                          currentSectionIndex,
                                        ) ? (
                                          <span className="text-green-600 font-medium flex items-center text-lg">
                                            <i className="ri-check-circle-fill mr-2"></i>
                                            Section Complete
                                          </span>
                                        ) : (
                                          <Button
                                            onClick={
                                              markCurrentSectionCompleted
                                            }
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <i className="ri-check-line mr-2"></i>
                                            Mark as Complete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Navigation Buttons */}
                                  <div className="flex justify-between items-center pt-6">
                                    <Button
                                      variant="outline"
                                      onClick={goToPreviousSection}
                                      disabled={currentSectionIndex === 0}
                                      className="flex items-center"
                                    >
                                      <i className="ri-arrow-left-line mr-2"></i>
                                      Previous
                                    </Button>

                                    <div className="flex space-x-2">
                                      {moduleSections.map((_, index) => (
                                        <button
                                          key={index}
                                          className={`w-3 h-3 rounded-full transition-all ${
                                            index === currentSectionIndex
                                              ? "bg-primary"
                                              : completedSections.has(index)
                                                ? "bg-green-500"
                                                : "bg-gray-300"
                                          }`}
                                          onClick={() =>
                                            setCurrentSectionIndex(index)
                                          }
                                        />
                                      ))}
                                    </div>

                                    <Button
                                      onClick={goToNextSection}
                                      disabled={
                                        currentSectionIndex ===
                                        moduleSections.length - 1
                                      }
                                      className="flex items-center"
                                    >
                                      Next
                                      <i className="ri-arrow-right-line ml-2"></i>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-4 text-center p-8">
                                  <div className="text-gray-500 mb-4">
                                    This lesson contains interactive content and
                                    activities to help you learn the key
                                    concepts.
                                  </div>
                                </div>
                              )}
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
