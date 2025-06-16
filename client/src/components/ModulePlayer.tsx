import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { LearningModule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MatchingActivityPlayer from '@/components/modulePlayer/MatchingPlayer'

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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Trophy,
  Clock,
  BookOpen,
  Users,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";

// Drag and Drop Item Component
interface DragItemProps {
  id: string;
  content: string;
  isCorrect?: boolean;
  showResult?: boolean;
}

function DragItem({ id, content, isCorrect, showResult }: DragItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border rounded-lg cursor-move select-none ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      } ${
        showResult
          ? isCorrect
            ? 'border-green-500 bg-green-50'
            : 'border-red-500 bg-red-50'
          : 'border-gray-300 bg-white hover:bg-gray-50'
      }`}
    >
      {content}
    </div>
  );
}

// Video Player Component
interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete: () => void;
}

function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
  const [hasWatched, setHasWatched] = useState(false);

  const handleVideoEnd = () => {
    setHasWatched(true);
    onComplete();
  };

  // Extract YouTube video ID with proper validation
  const getYouTubeId = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') {
      console.warn('Invalid video URL provided:', url);
      return null;
    }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&onended=handleVideoEnd`}
          title={title}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            // Simulate video completion for demo - in real implementation,
            // you'd use YouTube API to detect actual completion
            setTimeout(() => {
              if (!hasWatched) {
                setHasWatched(true);
                onComplete();
              }
            }, 3000);
          }}
        />
      </div>
      {hasWatched && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Video completed!</span>
        </div>
      )}
    </div>
  );
}

// Quiz Component
interface QuizProps {
  questions: any[];
  onComplete: (score: number, totalPoints: number) => void;
  hasRetakeAttempt?: boolean;
  onRetakeRequest?: () => void;
}

function QuizComponent({ questions, onComplete, hasRetakeAttempt = false, onRetakeRequest }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
    
    // Calculate points (5-15 points based on performance)
    const percentage = (finalScore / questions.length) * 100;
    let points = 5; // Base points
    if (percentage >= 80) points = 15;
    else if (percentage >= 60) points = 10;
    
    // Show confetti for good performance
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    toast({
      title: "Quiz Completed!",
      description: `You scored ${finalScore} out of ${questions.length} and earned ${points} points!`,
    });

    onComplete(finalScore, points);
  };

  const currentQ = questions[currentQuestion];

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-green-600">
              {score}/{questions.length}
            </div>
            <p className="text-lg">
              {score / questions.length >= 0.8 ? "Excellent work!" :
               score / questions.length >= 0.6 ? "Good job!" : "Keep practicing!"}
            </p>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div key={index} className="text-left p-3 border rounded-lg">
                  <p className="font-medium mb-2">{question.question}</p>
                  <div className="flex items-center gap-2">
                    {selectedAnswers[index] === question.correctAnswer ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {question.explanation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Retake button for failing scores */}
            {score / questions.length < 0.8 && !hasRetakeAttempt && onRetakeRequest && (
              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={onRetakeRequest}
                  variant="outline"
                  className="w-full"
                >
                  Retake Quiz (One attempt remaining)
                </Button>
              </div>
            )}
            
            {/* Message for those who used their retake */}
            {score / questions.length < 0.8 && hasRetakeAttempt && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 font-medium">
                    You'll need to retake the entire module to earn completion credit.
                  </p>
                  <p className="text-orange-600 text-sm mt-1">
                    Please restart the module from the beginning.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz - Question {currentQuestion + 1} of {questions.length}</CardTitle>
        <Progress value={(currentQuestion / questions.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQ.question}</h3>
          <div className="space-y-2">
            {currentQ.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmitQuiz}
            disabled={selectedAnswers[currentQuestion] === undefined}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit Quiz
            <Trophy className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={selectedAnswers[currentQuestion] === undefined}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Drag and Drop Activity Component
interface DragDropActivityProps {
  activity: any;
  onComplete: (points: number) => void;
}

function DragDropActivity({ activity, onComplete }: DragDropActivityProps) {
  const [items, setItems] = useState(activity.promptItems || []);
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items: string[]) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const checkAnswer = () => {
    const correctOrder = activity.answerKey || [];
    const isCorrect = JSON.stringify(items) === JSON.stringify(correctOrder);
    
    setShowResults(true);
    setIsCompleted(true);

    const points = isCorrect ? 12 : 6; // Full points for correct order, partial for attempt
    
    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    onComplete(points);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {activity.title}
        </CardTitle>
        <CardDescription>{activity.instructions}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {activity.uiHints?.dragInstruction || "Drag items to reorder them correctly"}
          </p>
          
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item: string, index: number) => (
                  <DragItem
                    key={item}
                    id={item}
                    content={item}
                    isCorrect={showResults && activity.answerKey && activity.answerKey[index] === item}
                    showResult={showResults}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {showResults && (
            <div className="mt-4 p-3 border rounded-lg bg-blue-50">
              <p className="font-medium">Correct Order:</p>
              <div className="mt-2 space-y-1">
                {(activity.answerKey || []).map((item: string, index: number) => (
                  <div key={index} className="text-sm">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={checkAnswer}
          disabled={isCompleted}
          className="w-full"
        >
          {isCompleted ? "Completed!" : "Check Answer"}
          <CheckCircle2 className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main Module Player Component
interface ScenarioMatchProps {
  scenarios: any[];
  onComplete: (points: number) => void;
}

function MultiScenarioMatchComponent({ scenarios, onComplete }: ScenarioMatchProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(new Set());

  const currentScenario = scenarios[currentScenarioIndex];

  const handleSubmit = () => {
    if (!selectedOption) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    const newCompleted = new Set(completedScenarios);
    newCompleted.add(currentScenarioIndex);
    setCompletedScenarios(newCompleted);
    
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setSelectedOption("");
      setShowFeedback(false);
    } else {
      // All scenarios completed
      onComplete(0);
    }
  };

  // Handle both string and index-based correct answers
  const isCorrect = typeof currentScenario.correctAnswer === 'number' 
    ? selectedOption === currentScenario.options[currentScenario.correctAnswer]
    : selectedOption === currentScenario.correctAnswer;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{currentScenario.title || "Scenario Challenge"}</CardTitle>
          <span className="text-sm text-gray-500">
            {currentScenarioIndex + 1} of {scenarios.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Description */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-semibold mb-2 text-blue-800">Scenario:</h4>
          <p className="text-gray-700">{currentScenario.scenario}</p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h4 className="font-semibold">What would you do in this situation?</h4>
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            disabled={showFeedback}
          >
            {currentScenario.options?.map((option: string, index: number) => {
              const isThisCorrect = typeof currentScenario.correctAnswer === 'number' 
                ? index === currentScenario.correctAnswer
                : option === currentScenario.correctAnswer;
              const isThisSelected = option === selectedOption;
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className={`flex-1 cursor-pointer p-3 rounded-lg border ${
                      showFeedback ? (
                        isThisCorrect ? "bg-green-50 border-green-200" : 
                        isThisSelected ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                      ) : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg border-l-4 ${
            isCorrect ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"
          }`}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
              )}
              <div>
                <h4 className={`font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                  {isCorrect ? "Excellent!" : "Not quite right"}
                </h4>
                <p className="text-gray-700 mt-1">
                  {currentScenario.explanation || (isCorrect ? "Great choice!" : "Consider a different approach.")}
                </p>
                {!isCorrect && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <p className="text-gray-700 text-sm">
                      <strong>The correct answer:</strong> {
                        typeof currentScenario.correctAnswer === 'number' 
                          ? currentScenario.options[currentScenario.correctAnswer]
                          : currentScenario.correctAnswer
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showFeedback ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="w-full"
          >
            {currentScenarioIndex < scenarios.length - 1 ? "Next Scenario" : "Complete Activity"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Single scenario component for backward compatibility
interface SingleScenarioMatchProps {
  scenario: any;
  onComplete: (points: number) => void;
}

function ScenarioMatchComponent({ scenario, onComplete }: SingleScenarioMatchProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = () => {
    if (!selectedOption) return;
    setShowFeedback(true);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete(0); // No points for scenario-match, only completion tracking
  };

  // Handle both string and index-based correct answers
  const isCorrect = typeof scenario.correctAnswer === 'number' 
    ? selectedOption === scenario.options[scenario.correctAnswer]
    : selectedOption === scenario.correctAnswer;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{scenario.title || "Scenario Challenge"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Description */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-semibold mb-2 text-blue-800">Scenario:</h4>
          <p className="text-gray-700">{scenario.scenario}</p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h4 className="font-semibold">What would you do in this situation?</h4>
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            disabled={showFeedback}
          >
            {scenario.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  className={showFeedback ? (
                    option === scenario.correctAnswer ? "border-green-500" : 
                    option === selectedOption ? "border-red-500" : ""
                  ) : ""}
                />
                <Label 
                  htmlFor={`option-${index}`}
                  className={`flex-1 cursor-pointer p-3 rounded-lg border ${
                    showFeedback ? (
                      option === scenario.correctAnswer ? "bg-green-50 border-green-200" : 
                      option === selectedOption && option !== scenario.correctAnswer ? "bg-red-50 border-red-200" : "bg-gray-50"
                    ) : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg border-l-4 ${
            isCorrect ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"
          }`}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
              )}
              <div>
                <h4 className={`font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </h4>
                <p className="text-gray-700 mt-1">
                  {isCorrect ? scenario.correctFeedback || scenario.explanation : scenario.incorrectFeedback || "Consider a different approach."}
                </p>
                {!isCorrect && scenario.correctAnswer !== undefined && (
                  <p className="text-gray-600 mt-2 text-sm">
                    <strong>The best approach:</strong> {
                      typeof scenario.correctAnswer === 'number' 
                        ? scenario.options[scenario.correctAnswer]
                        : scenario.correctAnswer
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showFeedback ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isCompleted}
            className="w-full"
          >
            {isCompleted ? "Completed!" : "Continue"}
            <CheckCircle2 className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface ModulePlayerProps {
  moduleId: string;
}

export function ModulePlayer({ moduleId }: ModulePlayerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [totalPoints, setTotalPoints] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    score: number;
    totalQuestions: number;
    points: number;
    eceHours?: number;
    eceCategory?: string;
  } | null>(null);
  const [finalQuizScore, setFinalQuizScore] = useState<number | null>(null);
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [retakeAttempts, setRetakeAttempts] = useState<{ [sectionIndex: number]: boolean }>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: rawModule, isLoading } = useQuery<LearningModule>({
    queryKey: [`/api/modules/${moduleId}`],
  });

  // Parse the module content to extract sections
  const module = rawModule ? {
    ...rawModule,
    sections: (() => {
      try {
        if (typeof rawModule.content === 'string') {
          const parsedContent = JSON.parse(rawModule.content);
          return parsedContent.sections || [];
        }
        return rawModule.content?.sections || [];
      } catch (error) {
        console.error('Error parsing module content:', error);
        return [];
      }
    })()
  } : null;
  

  // Award points mutation
  const awardPointsMutation = useMutation({
    mutationFn: async (data: { points: number; reason: string }) => {
      return apiRequest(`/api/points/award`, {
        method: 'POST',
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
  });

  // Rate module mutation
  const rateModuleMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string }) => {
      return apiRequest(`/api/community-modules/${moduleId}/rate`, {
        method: 'POST',
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating this module! Returning to dashboard.",
      });
      setShowRatingDialog(false);
      setRating(0);
      setRatingComment("");
      
      // Invalidate all module-related queries to refresh ratings
      queryClient.invalidateQueries({ queryKey: ['/api/community-modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      // Redirect to dashboard after rating submission
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
  });

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { 
      moduleId: number; 
      progress: number; 
      completed: boolean; 
      passed?: boolean; 
      finalScore?: number; 
      pointsEarned?: number; 
    }) => {
      return apiRequest(`/api/progress/${data.moduleId}`, {
        method: 'POST',
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      // Invalidate progress queries to refresh completion status
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error('Failed to update progress:', error);
    },
  });

  // ECE hours tracking mutation
  const recordEceHoursMutation = useMutation({
    mutationFn: async (data: { moduleId: number; hours: number; category: string; trainerId?: number | null }) => {
      return apiRequest('/api/ece-hours', {
        method: 'POST',
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh ECE hours data
      queryClient.invalidateQueries({ queryKey: ['/api/ece-hours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error('Failed to record ECE hours:', error);
    },
  });

  const handleSectionComplete = (sectionIndex: number, points: number = 0) => {
    if (!completedSections.has(sectionIndex)) {
      setCompletedSections(prev => {
        const newCompleted = new Set([...prev, sectionIndex]);
        
        // Check if all sections are now completed
        if (module && newCompleted.size === module.sections.length) {
          // Show rating dialog after a brief delay
          setTimeout(() => {
            setShowRatingDialog(true);
          }, 1000);
        }
        
        return newCompleted;
      });
      
      // Don't award points for regular section completion
      // Points will only be awarded based on final quiz performance
    }
  };

  const handleQuizComplete = (score: number, points: number, isLastSection: boolean = false) => {
    const sectionIndex = currentSectionIndex;
    const currentSection = module?.sections[sectionIndex];
    const totalQuestions = currentSection?.content?.questions?.length || 5;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Mark section as completed regardless of pass/fail
    if (!completedSections.has(sectionIndex)) {
      setCompletedSections(prev => {
        const newCompleted = new Set([...prev, sectionIndex]);
        
        // Check if all sections are now completed
        if (module && newCompleted.size === module.sections.length) {
          // Mark module as fully completed
          setModuleCompleted(true);
          // Show rating dialog after a brief delay for ALL completions
          setTimeout(() => {
            setShowRatingDialog(true);
          }, 1000);
        }
        
        return newCompleted;
      });
    }

    // Store final quiz score if this is the last section
    if (isLastSection) {
      setFinalQuizScore(percentage);
    }

    // Award points only if this is the final assessment and score is 80% or higher
    if (isLastSection) {
      const modulePoints = module?.pointValue || 10;
      const passed = percentage >= 80;
      
      if (passed) {
        setTotalPoints(prev => prev + modulePoints);
        
        // Award points for module completion
        awardPointsMutation.mutate({
          points: modulePoints,
          reason: `Module completion with ${score} out of ${totalQuestions} quiz score`
        });

        // Track ECE hours if module is approved for ECE training
        const moduleData = module as any; // Type assertion for ECE fields
        if (moduleData?.eceApproved && moduleData?.eceCategory && moduleData?.eceHours) {
          recordEceHoursMutation.mutate({
            moduleId: module.id,
            hours: moduleData.eceHours,
            category: moduleData.eceCategory,
            trainerId: moduleData.approvedTrainerId || null
          });
        }

        // Show completion modal with points and ECE hours
        setCompletionData({
          score,
          totalQuestions,
          points: modulePoints,
          eceHours: moduleData?.eceApproved ? moduleData.eceHours : undefined,
          eceCategory: moduleData?.eceApproved ? moduleData.eceCategory : undefined,
        });
        setShowCompletionModal(true);
      }

      // Update progress with pass/fail status for all final quiz completions
      updateProgressMutation.mutate({
        moduleId: module?.id || 0,
        progress: 100,
        completed: true,
        passed: passed,
        finalScore: percentage,
        pointsEarned: passed ? modulePoints : 0
      });
    } else if (isLastSection && percentage < 80) {
      // Check if this is a retake attempt
      const hasUsedRetake = retakeAttempts[sectionIndex];
      
      if (hasUsedRetake) {
        // Failed second attempt - still show rating dialog since module is complete
        toast({
          title: "Module Complete",
          description: `You scored ${score} out of ${totalQuestions}. You did not pass the final assessment, but you can still rate the module.`,
          variant: "destructive"
        });
        
        // Don't redirect yet - let them rate the module first
        // Rating dialog will handle the redirect
      } else {
        // First failed attempt - allow retake but don't mark as complete yet
        toast({
          title: "Quiz Complete",
          description: `You scored ${score} out of ${totalQuestions}. You need 80% or higher to pass. The quiz section remains available for retake.`,
          variant: "destructive"
        });
        
        // Remove section from completed to allow retake
        setCompletedSections(prev => {
          const newCompleted = new Set(prev);
          newCompleted.delete(sectionIndex);
          return newCompleted;
        });
      }
    } else {
      // Regular quiz section - no points awarded
      toast({
        title: "Quiz Complete",
        description: `You scored ${score} out of ${totalQuestions} on this quiz section.`,
      });
    }
  };

  const handleRetakeRequest = () => {
    // Mark this section as having used its retake attempt
    setRetakeAttempts(prev => ({
      ...prev,
      [currentSectionIndex]: true
    }));
    
    // Force re-render of the quiz component by removing completion status
    setCompletedSections(prev => {
      const newCompleted = new Set(prev);
      newCompleted.delete(currentSectionIndex);
      return newCompleted;
    });
    
    toast({
      title: "Quiz Reset",
      description: "You can now retake the quiz. This is your final attempt.",
    });
  };

  const handleModuleComplete = () => {
    if (finalQuizScore !== null && finalQuizScore >= 80) {
      toast({
        title: "Congratulations!",
        description: `Module completed successfully with ${finalQuizScore}% on the final assessment!`,
      });
    } else if (finalQuizScore !== null && finalQuizScore < 80) {
      toast({
        title: "Module Incomplete",
        description: `You scored ${finalQuizScore}% on the final assessment. You need 80% or higher to complete the module.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Please Complete Final Assessment",
        description: "You need to complete the final quiz to finish this module.",
        variant: "destructive"
      });
    }
  };

  const progressPercentage = (completedSections.size / (module?.sections?.length || 1)) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Module not found</h2>
      </div>
    );
  }

  const currentSection = module.sections[currentSectionIndex];

  const renderSectionContent = () => {
    if (!currentSection) return null;

    switch (currentSection.type) {
      case 'text':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{currentSection.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Display AI-generated images if present */}
              {currentSection.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={currentSection.imageUrl} 
                    alt={`Visual for ${currentSection.title}`}
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                    onError={(e) => {
                      console.log('Image failed to load:', currentSection.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Display images from content blocks (AI-generated during creation) */}
              {currentSection.content?.blocks?.[0]?.images && currentSection.content.blocks[0].images.length > 0 && (
                <div className="mb-6 space-y-4">
                  {currentSection.content.blocks[0].images.map((image: any, index: number) => (
                    <div key={index} className="text-center">
                      <img 
                        src={image.url} 
                        alt={image.description || `Visual ${index + 1} for ${currentSection.title}`}
                        className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          console.log('Content block image failed to load:', image.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {image.description && (
                        <p className="text-sm text-gray-600 mt-2 italic">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>
                  {typeof currentSection.content === 'string' 
                    ? currentSection.content 
                    : typeof currentSection.content?.blocks?.[0]?.content === 'string'
                    ? currentSection.content.blocks[0].content
                    : JSON.stringify(currentSection.content, null, 2) || ''}
                </ReactMarkdown>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSectionComplete(currentSectionIndex, 0)}
                disabled={completedSections.has(currentSectionIndex)}
                className="w-full"
              >
                {completedSections.has(currentSectionIndex) ? "Completed!" : "Mark as Complete"}
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 'video':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                {currentSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Extract video URL from various possible formats
                let videoUrl = '';
                
                if (typeof currentSection.videoUrl === 'string' && currentSection.videoUrl.trim()) {
                  videoUrl = currentSection.videoUrl;
                } else if (typeof currentSection.content === 'string' && currentSection.content.trim()) {
                  videoUrl = currentSection.content;
                } else if (typeof currentSection.content === 'object' && currentSection.content?.videoUrl) {
                  videoUrl = currentSection.content.videoUrl;
                }
                
                return videoUrl ? (
                  <VideoPlayer
                    videoUrl={videoUrl}
                    title={currentSection.title}
                    onComplete={() => handleSectionComplete(currentSectionIndex, 0)}
                  />
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No video URL provided</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );

      case 'quiz':
        try {
          let questions = [];
          
          // The content might be already parsed as an array or a JSON string
          if (currentSection.content) {
            if (Array.isArray(currentSection.content)) {
              // Content is already an array of questions
              questions = currentSection.content;
            } else if (typeof currentSection.content === 'string') {
              // Content is a JSON string that needs parsing
              const parsedContent = JSON.parse(currentSection.content);
              if (Array.isArray(parsedContent)) {
                questions = parsedContent;
              } else if (parsedContent.blocks && Array.isArray(parsedContent.blocks)) {
                questions = parsedContent.blocks;
              } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
                questions = parsedContent.questions;
              }
            } else if (typeof currentSection.content === 'object' && currentSection.content.questions) {
              // Content is an object with a questions property
              questions = currentSection.content.questions;
            }
          }
          
          if (questions.length === 0) {
            return (
              <Card>
                <CardContent>
                  <p className="text-yellow-600">No quiz questions found in this section</p>
                </CardContent>
              </Card>
            );
          }
          
          // Check if this is the final assessment (last section)
          const isLastSection = module && currentSectionIndex === module.sections.length - 1;
          
          return (
            <QuizComponent
              questions={questions}
              onComplete={(score, points) => handleQuizComplete(score, points, isLastSection)}
              hasRetakeAttempt={!retakeAttempts[currentSectionIndex]}
              onRetakeRequest={handleRetakeRequest}
            />
          );
        } catch (error) {
          console.error('Quiz parsing error:', error);
          return (
            <Card>
              <CardContent>
                <p className="text-red-500">Error loading quiz content</p>
              </CardContent>
            </Card>
          );
        }

      case 'activity':
      case 'matching':
        try {
          const matchingData = JSON.parse(currentSection.content || '[]');
          console.log(matchingData,'matching data')
          const activity = matchingData || matchingData[0]
          const content = {
            title:"test",
            instructions:'test instructions',
            pairs:activity
          }
          if (Array.isArray(activity)) {
            return (
              <MatchingActivityPlayer
                activity={content}
                onComplete={() => handleSectionComplete(currentSectionIndex, 0)}
              />
            );
          }
        } catch (error) {
          console.error('Error parsing matching activity:', error);
        }
        return (
          <Card>
            <CardContent>
              <p className="text-gray-500">No valid matching activity found.</p>
            </CardContent>
          </Card>
        );

        // try {
        //   const activities = JSON.parse(currentSection.content || '[]');
        //   if (activities.length > 0) {
        //     const activity = activities[0];
        //     return (
        //       <DragDropActivity
        //         activity={activity}
        //         onComplete={(points) => handleSectionComplete(currentSectionIndex, points)}
        //       />
        //     );
        //   }
        // } catch (error) {
        //   console.error('Error parsing activity content:', error);
        // }
        // return (
        //   <Card>
        //     <CardContent>
        //       <p className="text-gray-500">No interactive content available</p>
        //     </CardContent>
        //   </Card>
        // );

      case 'scenario-match':
        try {
          console.log('Scenario match content:', currentSection.content);
          let scenarioData;
          
          // Handle different content formats
          if (typeof currentSection.content === 'string') {
            try {
              scenarioData = JSON.parse(currentSection.content);
            } catch {
              // If JSON parsing fails, treat as plain text and create a basic structure
              scenarioData = {
                title: currentSection.title || "Scenario Challenge",
                scenario: currentSection.content,
                options: ["Option A", "Option B", "Option C"],
                correctAnswer: "Option A",
                correctFeedback: "Great choice!",
                incorrectFeedback: "Consider a different approach."
              };
            }
          } else if (typeof currentSection.content === 'object') {
            scenarioData = currentSection.content;
          } else {
            throw new Error('Invalid content format');
          }
          
          console.log('Parsed scenario data:', scenarioData);
          
          // Handle array of scenarios vs single scenario
          if (Array.isArray(scenarioData)) {
            // Multiple scenarios - use the multi-scenario component
            return (
              <MultiScenarioMatchComponent
                scenarios={scenarioData}
                onComplete={() => handleSectionComplete(currentSectionIndex, 0)}
              />
            );
          } else {
            // Single scenario object
            return (
              <ScenarioMatchComponent
                scenario={scenarioData}
                onComplete={() => handleSectionComplete(currentSectionIndex, 0)}
              />
            );
          }
        } catch (error) {
          console.error('Error parsing scenario match content:', error);
          console.log('Raw content:', currentSection.content);
          return (
            <Card>
              <CardContent>
                <p className="text-red-500">Error loading scenario content</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600">Debug Info</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify({ 
                      content: currentSection.content, 
                      type: typeof currentSection.content,
                      error: error.message 
                    }, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          );
        }

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{currentSection.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Display AI-generated images if present */}
              {currentSection.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={currentSection.imageUrl} 
                    alt={`Visual for ${currentSection.title}`}
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                    onError={(e) => {
                      console.log('Image failed to load:', currentSection.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Display images from content blocks (AI-generated during creation) */}
              {currentSection.content?.blocks?.[0]?.images && currentSection.content.blocks[0].images.length > 0 && (
                <div className="mb-6 space-y-4">
                  {currentSection.content.blocks[0].images.map((image: any, index: number) => (
                    <div key={index} className="text-center">
                      <img 
                        src={image.url} 
                        alt={image.description || `Visual ${index + 1} for ${currentSection.title}`}
                        className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          console.log('Content block image failed to load:', image.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {image.description && (
                        <p className="text-sm text-gray-600 mt-2 italic">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>
                  {typeof currentSection.content === 'string' 
                    ? currentSection.content 
                    : typeof currentSection.content?.blocks?.[0]?.content === 'string'
                    ? currentSection.content.blocks[0].content
                    : JSON.stringify(currentSection.content, null, 2) || ''}
                </ReactMarkdown>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSectionComplete(currentSectionIndex, 0)}
                disabled={completedSections.has(currentSectionIndex)}
                className="w-full"
              >
                {completedSections.has(currentSectionIndex) ? "Completed!" : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900 font-bold">{module.title}</CardTitle>
              <CardDescription className="mt-1 text-blue-700 text-lg">{module.description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-full border-2 border-yellow-300">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">{totalPoints} pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{module.duration || '30'} min</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-blue-700 mb-2 font-medium">
              <span>Learning Progress</span>
              <span className="bg-green-100 px-2 py-1 rounded-full text-green-800">
                {completedSections.size} of {module.sections.length} sections completed
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-blue-100" 
              style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)'
              }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Section Navigation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {module.sections.map((section, index) => (
              <Button
                key={index}
                variant={index === currentSectionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSectionIndex(index)}
                className={`relative font-medium transition-all duration-200 ${
                  index === currentSectionIndex 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105" 
                    : completedSections.has(index)
                    ? "bg-green-100 border-green-400 text-green-800 hover:bg-green-200"
                    : "bg-white border-purple-300 text-purple-700 hover:bg-purple-50"
                }`}
              >
                {section.title}
                {completedSections.has(index) && (
                  <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Section Content */}
      {renderSectionContent()}

      {/* Navigation Controls */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
          disabled={currentSectionIndex === 0}
          className="bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 font-medium shadow-md disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Section
        </Button>
        
        {currentSectionIndex < module.sections.length - 1 ? (
          <Button
            onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
            disabled={!completedSections.has(currentSectionIndex)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            Next Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          completedSections.size === module.sections.length && (
            <Button 
              onClick={handleModuleComplete}
              className={`font-bold shadow-xl transform hover:scale-105 transition-all duration-200 ${
                finalQuizScore !== null && finalQuizScore >= 80 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              }`}
            >
              <Trophy className="h-5 w-5 mr-2" />
              {finalQuizScore !== null && finalQuizScore >= 80 
                ? "Module Complete!" 
                : finalQuizScore !== null 
                  ? `Retake Quiz (${finalQuizScore}%)`
                  : "Complete Final Assessment"
              }
            </Button>
          )
        )}
      </div>

      {/* Star Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate This Module</DialogTitle>
            <DialogDescription>
              How would you rate this learning module? Your feedback helps improve the community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts about this module..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowRatingDialog(false);
                  // Redirect to dashboard when skipping rating
                  setTimeout(() => {
                    setLocation('/');
                  }, 1000);
                }}
                variant="outline"
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  if (rating > 0) {
                    rateModuleMutation.mutate({
                      rating,
                      comment: ratingComment || undefined,
                    });
                  }
                }}
                disabled={rating === 0 || rateModuleMutation.isPending}
                className="flex-1"
              >
                {rateModuleMutation.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            {completionData && (
              <>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
                  <div className="text-lg font-semibold text-gray-800">
                    Quiz Score: {completionData.score} out of {completionData.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {Math.round((completionData.score / completionData.totalQuestions) * 100)}% - Great job!
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-center gap-2 text-xl font-bold text-orange-600">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    +{completionData.points} Points Earned!
                  </div>
                </div>

                {completionData.eceHours && completionData.eceCategory && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
                    <div className="text-lg font-semibold text-purple-700">
                      🎓 ECE Training Hours Earned
                    </div>
                    <div className="text-sm text-purple-600 mt-1">
                      {completionData.eceHours} hours in {completionData.eceCategory}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <Button 
              onClick={() => {
                setShowCompletionModal(false);
                // Show rating dialog after completion modal
                if (module?.isSharedToCommunity) {
                  setShowRatingDialog(true);
                }
              }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}