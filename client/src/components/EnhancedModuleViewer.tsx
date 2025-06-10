import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LearningModule as LearningModuleType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlashcardComponent } from "./FlashcardComponent";
import { StoryNarration } from "./StoryNarration";
import { 
  CheckCircle, 
  Circle, 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Award,
  Lock,
  Unlock
} from "lucide-react";

interface ModuleSection {
  id: string;
  type: 'text' | 'story' | 'flashcard' | 'quiz' | 'video' | 'interactive';
  title: string;
  content: string;
  duration?: number;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  flashcards?: Array<{
    term: string;
    definition: string;
  }>;
  videoUrl?: string;
  imageUrl?: string;
  required?: boolean;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    questionIndex: number;
    selectedAnswer: number;
    correct: boolean;
  }>;
}

interface EnhancedModuleViewerProps {
  moduleId: number;
  onComplete?: (result: { passed: boolean; score: number }) => void;
}

export function EnhancedModuleViewer({ moduleId, onComplete }: EnhancedModuleViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [quizAttempts, setQuizAttempts] = useState<{ [sectionId: string]: number }>({});
  const [quizResults, setQuizResults] = useState<{ [sectionId: string]: QuizResult }>({});
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [finalQuizPassed, setFinalQuizPassed] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState<{ [questionIndex: number]: number }>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

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

  // Parse module sections
  const moduleSections: ModuleSection[] = (() => {
    if (!module?.content) return [];
    try {
      const parsed = JSON.parse(module.content);
      return Array.isArray(parsed) ? parsed.map((section, index) => ({
        ...section,
        id: section.id || `section-${index}`,
        required: section.required !== false // Default to required unless explicitly false
      })) : [];
    } catch {
      return [];
    }
  })();

  const currentSection = moduleSections[currentSectionIndex];
  const totalSections = moduleSections.length;
  const progressPercentage = totalSections > 0 ? (completedSections.size / totalSections) * 100 : 0;

  // Check if current section can be accessed
  const canAccessSection = (sectionIndex: number) => {
    if (sectionIndex === 0) return true; // First section always accessible
    
    // Must complete all previous required sections
    for (let i = 0; i < sectionIndex; i++) {
      const section = moduleSections[i];
      if (section.required && !completedSections.has(i)) {
        return false;
      }
    }
    return true;
  };

  // Generate narration for current section
  const generateSectionNarration = async () => {
    if (!currentSection) return;
    
    try {
      setIsNarrating(true);
      
      let textToNarrate = currentSection.content;
      if (currentSection.type === 'story') {
        textToNarrate = `${currentSection.title}. ${currentSection.content}`;
      }

      const response = await apiRequest('/api/voice/generate', {
        method: 'POST',
        body: JSON.stringify({
          text: textToNarrate,
          voiceType: 'friendly-female',
          speed: 0.9
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.audioUrl && audioRef.current) {
        audioRef.current.src = response.audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Narration Error",
        description: "Could not generate audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsNarrating(false);
    }
  };

  // Complete current section
  const completeSection = (sectionIndex: number) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionIndex);
    setCompletedSections(newCompleted);

    toast({
      title: "Section Complete!",
      description: `You've completed "${moduleSections[sectionIndex].title}"`,
    });

    // Auto-advance to next section if available
    if (sectionIndex < moduleSections.length - 1) {
      setTimeout(() => {
        setCurrentSectionIndex(sectionIndex + 1);
      }, 1500);
    } else {
      // Check if module is complete
      checkModuleCompletion(newCompleted);
    }
  };

  // Check if entire module is complete
  const checkModuleCompletion = (completed: Set<number>) => {
    const allRequiredCompleted = moduleSections.every((section, index) => 
      !section.required || completed.has(index)
    );

    if (allRequiredCompleted) {
      // Check if final quiz exists and was passed
      const finalQuizSection = moduleSections.find(s => s.type === 'quiz');
      const finalQuizIndex = moduleSections.findIndex(s => s.type === 'quiz');
      
      if (finalQuizSection) {
        const quizResult = quizResults[finalQuizSection.id];
        if (quizResult && quizResult.passed) {
          setModuleCompleted(true);
          setFinalQuizPassed(true);
          
          toast({
            title: "Module Complete!",
            description: `Congratulations! You've successfully completed "${module?.title}" with ${quizResult.percentage}%`,
          });
          
          if (onComplete) {
            onComplete({ passed: true, score: quizResult.percentage });
          }
        }
      } else {
        // No quiz required, module complete
        setModuleCompleted(true);
        
        toast({
          title: "Module Complete!",
          description: `Congratulations! You've successfully completed "${module?.title}"`,
        });
        
        if (onComplete) {
          onComplete({ passed: true, score: 100 });
        }
      }
    }
  };

  // Handle quiz submission
  const submitQuiz = (sectionId: string, answers: { [questionIndex: number]: number }) => {
    const section = moduleSections.find(s => s.id === sectionId);
    if (!section || !section.questions) return;

    const questions = section.questions;
    let correctCount = 0;
    const detailedAnswers: QuizResult['answers'] = [];

    questions.forEach((question, index) => {
      const selectedAnswer = answers[index];
      const isCorrect = selectedAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      detailedAnswers.push({
        questionIndex: index,
        selectedAnswer,
        correct: isCorrect
      });
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= 80;

    const result: QuizResult = {
      score: correctCount,
      totalQuestions: questions.length,
      percentage,
      passed,
      answers: detailedAnswers
    };

    // Update quiz results and attempts
    setQuizResults(prev => ({ ...prev, [sectionId]: result }));
    setQuizAttempts(prev => ({ ...prev, [sectionId]: (prev[sectionId] || 0) + 1 }));

    if (passed) {
      // Mark section as completed
      const sectionIndex = moduleSections.findIndex(s => s.id === sectionId);
      if (sectionIndex !== -1) {
        completeSection(sectionIndex);
      }
      
      toast({
        title: "Quiz Passed!",
        description: `Great job! You scored ${percentage}% (${correctCount}/${questions.length})`,
      });
    } else {
      toast({
        title: "Quiz Not Passed",
        description: `You scored ${percentage}%. You need 80% or higher to pass. Please review the material and try again.`,
        variant: "destructive"
      });
      
      // Reset to beginning of module for retake
      setCurrentSectionIndex(0);
      setCompletedSections(new Set());
      setCurrentQuizAnswers({});
    }
  };

  // Navigate between sections
  const goToSection = (index: number) => {
    if (canAccessSection(index)) {
      setCurrentSectionIndex(index);
      setCurrentQuizAnswers({});
    }
  };

  const nextSection = () => {
    if (currentSectionIndex < moduleSections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      if (canAccessSection(nextIndex)) {
        setCurrentSectionIndex(nextIndex);
        setCurrentQuizAnswers({});
      }
    }
  };

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuizAnswers({});
    }
  };

  if (isModuleLoading) {
    return <div className="flex justify-center items-center h-64">Loading module...</div>;
  }

  if (!module || moduleSections.length === 0) {
    return <div className="text-center text-gray-500">Module not found or has no content.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Module Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{module.title}</CardTitle>
              <p className="text-gray-600 mt-2">{module.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">{module.duration} min</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                {completedSections.size}/{totalSections} sections complete
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {moduleCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <Award className="h-5 w-5" />
                <span className="font-medium">Module Completed Successfully!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {moduleSections.map((section, index) => {
              const isCompleted = completedSections.has(index);
              const isCurrent = index === currentSectionIndex;
              const canAccess = canAccessSection(index);
              
              return (
                <Button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  disabled={!canAccess}
                  variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    !canAccess ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {!canAccess ? (
                    <Lock className="h-3 w-3" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  <span className="text-xs">{index + 1}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Section Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentSection.title}
                <Badge variant="outline" className="text-xs">
                  {currentSection.type}
                </Badge>
              </CardTitle>
              {currentSection.duration && (
                <p className="text-sm text-gray-500 mt-1">
                  Estimated time: {currentSection.duration} minutes
                </p>
              )}
            </div>
            
            {(currentSection.type === 'text' || currentSection.type === 'story') && (
              <Button
                onClick={generateSectionNarration}
                disabled={isNarrating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isNarrating ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Listen
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Audio player (hidden) */}
          <audio ref={audioRef} style={{ display: 'none' }} />
          
          {/* Section content based on type */}
          {currentSection.type === 'text' && (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentSection.content.replace(/\n/g, '<br>') }} />
              </div>
              
              {!completedSections.has(currentSectionIndex) && (
                <Button
                  onClick={() => completeSection(currentSectionIndex)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          )}

          {currentSection.type === 'story' && (
            <div className="space-y-4">
              <div id={`story-${currentSection.id}`} className="prose max-w-none bg-gray-50 p-6 rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: currentSection.content.replace(/\n/g, '<br>') }} />
              </div>
              
              <StoryNarration storyId={`story-${currentSection.id}`} voiceType="female" />
              
              {!completedSections.has(currentSectionIndex) && (
                <Button
                  onClick={() => completeSection(currentSectionIndex)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Story
                </Button>
              )}
            </div>
          )}

          {currentSection.type === 'flashcard' && currentSection.flashcards && (
            <FlashcardComponent
              flashcards={currentSection.flashcards}
              title={currentSection.title}
              onComplete={() => completeSection(currentSectionIndex)}
            />
          )}

          {currentSection.type === 'quiz' && currentSection.questions && (
            <div className="space-y-6">
              {quizResults[currentSection.id] && !quizResults[currentSection.id].passed && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Quiz Not Passed</h4>
                  <p className="text-red-700 text-sm">
                    You scored {quizResults[currentSection.id].percentage}%. You need 80% or higher to pass.
                    Please review all previous sections and try again.
                  </p>
                  <p className="text-red-600 text-xs mt-2">
                    Attempts: {quizAttempts[currentSection.id] || 0}
                  </p>
                </div>
              )}

              {quizResults[currentSection.id]?.passed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">Quiz Passed!</h4>
                  <p className="text-green-700">
                    Score: {quizResults[currentSection.id].percentage}% 
                    ({quizResults[currentSection.id].score}/{quizResults[currentSection.id].totalQuestions})
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Quiz Requirements</h4>
                    <p className="text-blue-700 text-sm">
                      You must score 80% or higher to pass this quiz and complete the module.
                      If you score below 80%, you'll need to review all sections again.
                    </p>
                  </div>

                  {currentSection.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">
                        Question {questionIndex + 1}: {question.question}
                      </h5>
                      <div className="space-y-2">
                        {question.answers.map((answer, answerIndex) => (
                          <label
                            key={answerIndex}
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={`question-${questionIndex}`}
                              value={answerIndex}
                              checked={currentQuizAnswers[questionIndex] === answerIndex}
                              onChange={() => setCurrentQuizAnswers(prev => ({
                                ...prev,
                                [questionIndex]: answerIndex
                              }))}
                              className="text-blue-600"
                            />
                            <span>{answer}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => submitQuiz(currentSection.id, currentQuizAnswers)}
                    disabled={Object.keys(currentQuizAnswers).length !== currentSection.questions.length}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Submit Quiz
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <Button
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          Section {currentSectionIndex + 1} of {totalSections}
        </div>

        <Button
          onClick={nextSection}
          disabled={currentSectionIndex >= moduleSections.length - 1 || !canAccessSection(currentSectionIndex + 1)}
          variant="outline"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}