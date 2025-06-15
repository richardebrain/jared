import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { LearningModule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
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
}

function QuizComponent({ questions, onComplete }: QuizProps) {
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
      description: `You scored ${finalScore}/${questions.length} and earned ${points} points!`,
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
  const { toast } = useToast();

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
        data: JSON.stringify(data),
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
        data: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating this module!",
      });
      setShowRatingDialog(false);
      setRating(0);
      setRatingComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/community-modules'] });
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
      setTotalPoints(prev => prev + points);
      
      if (points > 0) {
        awardPointsMutation.mutate({
          points,
          reason: `Module section completion: ${module?.sections[sectionIndex]?.title || 'Section ' + (sectionIndex + 1)}`
        });
        toast({
          title: "Points Earned!",
          description: `You earned ${points} points for completing this section!`,
        });
      }
    }
  };
console.log(module,'module')
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
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{currentSection.content || ''}</ReactMarkdown>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSectionComplete(currentSectionIndex, 5)}
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
              {currentSection.videoUrl ? (
                <VideoPlayer
                  videoUrl={currentSection.videoUrl}
                  title={currentSection.title}
                  onComplete={() => handleSectionComplete(currentSectionIndex, 8)}
                />
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No video URL provided</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'quiz':
        try {
          const questions = JSON.parse(currentSection.content || '[]');
          return (
            <QuizComponent
              questions={questions}
              onComplete={(score, points) => handleSectionComplete(currentSectionIndex, points)}
            />
          );
        } catch (error) {
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
          const activities = currentSection.activities || [];
          if (activities.length > 0) {
            const activity = activities[0];
            return (
              <DragDropActivity
                activity={activity}
                onComplete={(points) => handleSectionComplete(currentSectionIndex, points)}
              />
            );
          }
        } catch (error) {
          console.error('Error parsing activity content:', error);
        }
        return (
          <Card>
            <CardContent>
              <p className="text-gray-500">No interactive content available</p>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{currentSection.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{currentSection.content || ''}</ReactMarkdown>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSectionComplete(currentSectionIndex, 3)}
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <CardDescription className="mt-1">{module.description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{totalPoints} pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{module.estimatedTime || '30 min'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedSections.size} of {module.sections.length} sections completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Section Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {module.sections.map((section, index) => (
              <Button
                key={index}
                variant={index === currentSectionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSectionIndex(index)}
                className="relative"
              >
                {section.title}
                {completedSections.has(index) && (
                  <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />
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
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Section
        </Button>
        
        {currentSectionIndex < module.sections.length - 1 ? (
          <Button
            onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
            disabled={!completedSections.has(currentSectionIndex)}
          >
            Next Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          completedSections.size === module.sections.length && (
            <Button className="bg-green-600 hover:bg-green-700">
              <Trophy className="h-4 w-4 mr-2" />
              Module Complete!
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
                onClick={() => setShowRatingDialog(false)}
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
    </div>
  );
}