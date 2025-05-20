import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, X, Video, Award, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import useSoundEffects from '@/hooks/use-sound-effects';

// Define interfaces for quiz questions
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; 
}

// Implementation questions require free-text responses
export interface ImplementationQuestion {
  id: string;
  question: string;
}

// Props for the VideoQuiz component
interface VideoQuizProps {
  videoId: string;
  videoTitle: string;
  onComplete: (points: number) => void;
  onClose: () => void;
}

export default function VideoQuiz({ videoId, videoTitle, onComplete, onClose }: VideoQuizProps) {
  // State for quiz UI and logic
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [implementationQuestion, setImplementationQuestion] = useState<ImplementationQuestion | null>(null);
  const [implementationAnswer, setImplementationAnswer] = useState('');
  const [showImplementation, setShowImplementation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [progress, setProgress] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [videoDuration, setVideoDuration] = useState(5); // Default to 5 minutes if can't get actual duration
  const [attemptedQuiz, setAttemptedQuiz] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const {
    playCorrectSound,
    playIncorrectSound,
    playCompletionSound,
    playCelebrationSound
  } = useSoundEffects();
  
  // Update isMobile state when window is resized
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate quiz questions based on video content
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        
        // Check video title and ID to determine type for specialized questions
        let videoType = "generic";
        let videoDuration = 5; // Default duration in minutes
        
        // Log the video we're creating a quiz for
        console.log("Creating quiz for video:", videoTitle, "ID:", videoId);
        
        // Check for yoga/mindfulness videos
        if (videoTitle.toLowerCase().includes("yoga") || 
            videoTitle.toLowerCase().includes("cosmic") || 
            videoTitle.toLowerCase().includes("mindful") ||
            videoTitle.toLowerCase().includes("zen") ||
            videoTitle.toLowerCase().includes("meditation") ||
            videoTitle.toLowerCase().includes("breath") ||
            videoId === "video-003" ||
            videoId === "video-005" ||
            videoId === "video-086" ||
            videoId === "video-088") {
          videoType = "mindfulness";
          videoDuration = 15; // For kids yoga/mindfulness videos
          console.log("Detected mindfulness/yoga video:", videoTitle);
        }
        // Check for emotional/social learning videos
        else if (videoTitle.toLowerCase().includes("emotion") || 
                 videoTitle.toLowerCase().includes("feeling") ||
                 videoTitle.toLowerCase().includes("social") ||
                 videoTitle.toLowerCase().includes("sesame street") ||
                 videoTitle.toLowerCase().includes("sel") ||
                 videoId === "video-008" ||
                 videoId === "video-051") {
          videoType = "socialEmotional";
          console.log("Detected social-emotional video:", videoTitle);
        }
        // Check for TED talks
        else if (videoTitle.toLowerCase().includes("ted") ||
                 videoTitle.toLowerCase().includes("sir ken robinson") ||
                 videoTitle.toLowerCase().includes("rita pierson") ||
                 videoTitle.toLowerCase().includes("brené") ||
                 videoTitle.toLowerCase().includes("carol dweck") ||
                 videoId === "video-021" ||
                 videoId === "video-031" ||
                 videoId === "video-034" ||
                 videoId === "video-076" ||
                 videoId === "video-077" ||
                 videoId === "video-078" ||
                 videoId === "video-102" ||
                 videoId === "video-103" ||
                 videoId === "video-104" ||
                 videoId === "video-105") {
          videoType = "tedTalk";
          console.log("Detected TED talk video:", videoTitle);
        }
        
        console.log("Quiz video type:", videoType);
        setVideoDuration(videoDuration);
        
        // Generate type-specific questions
        let quizQuestions: QuizQuestion[] = [];
        
        console.log("Creating quiz for video type:", videoType);
        
        if (videoType === "mindfulness") {
          // Yoga & mindfulness specific questions
          quizQuestions = [
            {
              id: 'q1',
              question: 'What is a key benefit of incorporating yoga in early childhood settings?',
              options: [
                'Supporting self-regulation and body awareness skills',
                'Replacing physical education entirely',
                'Teaching advanced meditation techniques',
                'Preparing children for competitive yoga'
              ],
              correctAnswer: 'Supporting self-regulation and body awareness skills'
            },
            {
              id: 'q2',
              question: 'How would you introduce yoga activities to young children?',
              options: [
                'Start with brief, engaging sessions that incorporate storytelling',
                'Begin with 30-minute silent meditation',
                'Only practice with children who are naturally calm',
                'Focus primarily on perfect form and technique'
              ],
              correctAnswer: 'Start with brief, engaging sessions that incorporate storytelling'
            },
            {
              id: 'q3',
              question: 'What makes yoga and mindfulness effective for classroom transitions?',
              options: [
                'Simple breathing exercises can help children center themselves',
                'It requires children to sit perfectly still',
                'It works best as a competitive activity',
                'It should be used only during naptime'
              ],
              correctAnswer: 'Simple breathing exercises can help children center themselves'
            },
            {
              id: 'q4',
              question: 'How does mindfulness support development in early education?',
              options: [
                'It integrates physical, emotional, and cognitive skills',
                'It focuses exclusively on physical fitness',
                'It replaces social interaction',
                'It should only be used with certain cultures'
              ],
              correctAnswer: 'It integrates physical, emotional, and cognitive skills'
            },
            {
              id: 'q5',
              question: 'What is an appropriate adaptation for diverse learners in yoga?',
              options: [
                'Offering multiple ways to participate with different movement levels',
                'Separating children by ability level',
                'Excluding children who cannot hold poses',
                'Only using verbal instructions without demonstration'
              ],
              correctAnswer: 'Offering multiple ways to participate with different movement levels'
            }
          ];
        } 
        else if (videoType === "socialEmotional") {
          // Social-emotional learning specific questions
          quizQuestions = [
            {
              id: 'q1',
              question: 'What is a primary goal of social-emotional learning?',
              options: [
                'Helping children recognize and express emotions appropriately',
                'Preventing children from experiencing emotions',
                'Teaching children to always be happy',
                'Focusing only on academic skills'
              ],
              correctAnswer: 'Helping children recognize and express emotions appropriately'
            },
            {
              id: 'q2',
              question: 'How can you implement social-emotional strategies effectively?',
              options: [
                'Incorporate them throughout the day in authentic contexts',
                'Schedule one emotional lesson per week',
                'Only address emotions when conflicts arise',
                'Use only worksheets to teach emotional concepts'
              ],
              correctAnswer: 'Incorporate them throughout the day in authentic contexts'
            },
            {
              id: 'q3',
              question: 'What role do teachers play in emotional development?',
              options: [
                'They model emotional awareness through their own actions',
                'They should conceal all emotions from children',
                'They should only address positive emotions',
                'Emotional development is not the role of teachers'
              ],
              correctAnswer: 'They model emotional awareness through their own actions'
            },
            {
              id: 'q4',
              question: 'How does social-emotional learning affect other development?',
              options: [
                'It creates a foundation for success across all domains',
                'It has little connection to cognitive development',
                'It is only important for certain children',
                'It should be taught separately from other subjects'
              ],
              correctAnswer: 'It creates a foundation for success across all domains'
            },
            {
              id: 'q5',
              question: 'What approach to challenging behavior is most effective?',
              options: [
                'View behavior as communication and teach needed skills',
                'Use consequences to eliminate unwanted behaviors',
                'Remove children who display difficult behaviors',
                'Ignore all challenging behaviors completely'
              ],
              correctAnswer: 'View behavior as communication and teach needed skills'
            }
          ];
        }
        else if (videoType === "tedTalk") {
          // TED talk specific questions
          quizQuestions = [
            {
              id: 'q1',
              question: 'What is often emphasized in education-focused TED talks?',
              options: [
                'Building relationships as a foundation for learning',
                'Focusing exclusively on academic content',
                'Standardized testing as the best measure of quality',
                'Teaching as primarily content delivery'
              ],
              correctAnswer: 'Building relationships as a foundation for learning'
            },
            {
              id: 'q2',
              question: 'How might you apply principles from educational TED talks?',
              options: [
                'Reflect on how your beliefs affect your interactions with children',
                'Focus primarily on academic test preparation',
                'Use a one-size-fits-all approach with all children',
                'Minimize personal connections with students'
              ],
              correctAnswer: 'Reflect on how your beliefs affect your interactions with children'
            },
            {
              id: 'q3',
              question: 'What approach to teaching is often promoted in these talks?',
              options: [
                'Meeting children where they are developmentally',
                'Following prescribed curriculum regardless of children',
                'Maintaining strict classroom control at all times',
                'Focusing primarily on academic weaknesses'
              ],
              correctAnswer: 'Meeting children where they are developmentally'
            },
            {
              id: 'q4',
              question: 'How do these talks typically align with developmental science?',
              options: [
                'They emphasize relationships in healthy brain development',
                'They often contradict developmental research',
                'They suggest brain development is fixed at birth',
                'They promote competitive learning environments'
              ],
              correctAnswer: 'They emphasize relationships in healthy brain development'
            },
            {
              id: 'q5',
              question: 'What practical step is often suggested in these talks?',
              options: [
                'Start with small, intentional changes in daily interactions',
                'Completely redesign curriculum immediately',
                'Focus exclusively on assessment and data',
                'Implement stricter classroom management'
              ],
              correctAnswer: 'Start with small, intentional changes in daily interactions'
            }
          ];
        }
        else {
          // Generic early childhood education questions
          quizQuestions = [
            {
              id: 'q1',
              question: 'What is a key principle of developmentally appropriate practice?',
              options: [
                'Meeting children where they are developmentally',
                'Treating all children the same regardless of differences',
                'Following rigid curriculum guidelines',
                'Focusing exclusively on academic skills'
              ],
              correctAnswer: 'Meeting children where they are developmentally'
            },
            {
              id: 'q2',
              question: 'How can you best apply video content in your teaching?',
              options: [
                'Integrate concepts into daily routines and interactions',
                'Create isolated lessons that only focus on these topics',
                'Wait for perfect conditions before trying new approaches',
                'Focus only on the highest-achieving students'
              ],
              correctAnswer: 'Integrate concepts into daily routines and interactions'
            },
            {
              id: 'q3',
              question: 'Which teaching approach best supports holistic development?',
              options: [
                'Child-centered learning with thoughtful teacher guidance',
                'Highly structured teacher-directed instruction only',
                'Completely unstructured exploration without guidance',
                'Following a rigid curriculum without adaptation'
              ],
              correctAnswer: 'Child-centered learning with thoughtful teacher guidance'
            },
            {
              id: 'q4',
              question: 'How should early education content be approached?',
              options: [
                'Through meaningful experiences across developmental domains',
                'Focusing primarily on academic readiness skills',
                'Teaching isolated skills in separate subjects',
                'Prioritizing future academic needs over present development'
              ],
              correctAnswer: 'Through meaningful experiences across developmental domains'
            },
            {
              id: 'q5',
              question: 'What role does reflection play in effective teaching?',
              options: [
                'It helps teachers continuously improve their practice',
                'It is only necessary when something goes wrong',
                'It requires extensive documentation to be valuable',
                'It is useful for administrators but not daily teaching'
              ],
              correctAnswer: 'It helps teachers continuously improve their practice'
            }
          ];
        }
        
        setQuestions(quizQuestions);
        
        // Always include an implementation question
        const implQuestion: ImplementationQuestion = {
          id: 'implementation',
          question: `How would you apply what you learned in "${videoTitle}" to your classroom practice?`
        };
        
        setImplementationQuestion(implQuestion);
        setLoading(false);
      } catch (error) {
        console.error('Error generating quiz questions:', error);
        // Fallback generic questions
        const defaultQuestions: QuizQuestion[] = [
          {
            id: 'q1',
            question: 'What principle of early childhood education is most important?',
            options: [
              'Meeting children where they are developmentally',
              'Following a standardized curriculum strictly',
              'Focusing primarily on academic readiness',
              'Treating all children exactly the same'
            ],
            correctAnswer: 'Meeting children where they are developmentally'
          },
          {
            id: 'q2',
            question: 'How might you apply this video content in your teaching?',
            options: [
              'Reflect on how to incorporate these ideas into your interactions',
              'Create a separate isolated lesson on this topic',
              'Wait for special occasions to implement these ideas',
              'Focus only on advanced students'
            ],
            correctAnswer: 'Reflect on how to incorporate these ideas into your interactions'
          },
          {
            id: 'q3',
            question: 'Which approach best supports child development?',
            options: [
              'Integrating learning across all developmental domains',
              'Focusing primarily on academic skills',
              'Keeping different learning areas completely separate',
              'Emphasizing future skills over present development'
            ],
            correctAnswer: 'Integrating learning across all developmental domains'
          },
          {
            id: 'q4',
            question: 'What is important when adapting teaching for diverse learners?',
            options: [
              'Offering multiple ways to engage with the same content',
              'Using the identical approach with all children',
              'Lowering expectations for struggling children',
              'Focusing only on areas of difficulty'
            ],
            correctAnswer: 'Offering multiple ways to engage with the same content'
          },
          {
            id: 'q5',
            question: 'How does reflection improve teaching practices?',
            options: [
              'It allows continuous improvement and adaptation',
              'It is only needed when problems arise',
              'It requires extensive documentation to be useful',
              'It is mainly for administrative purposes'
            ],
            correctAnswer: 'It allows continuous improvement and adaptation'
          }
        ];
        setQuestions(defaultQuestions);
        
        const implQuestion: ImplementationQuestion = {
          id: 'implementation',
          question: `How would you apply what you learned in "${videoTitle}" to your classroom practice?`
        };
        setImplementationQuestion(implQuestion);
        setLoading(false);
        
        toast({
          title: "Notice",
          description: "Using general quiz questions for this video.",
          variant: "default",
        });
      }
    };

    fetchQuizQuestions();
  }, [videoId, videoTitle, toast]);

  // Check window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle quiz UI
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Require user to select an answer before proceeding
    if (!selectedAnswer && !showImplementation) {
      toast({
        title: "Please select an answer",
        description: "You need to select an answer before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Require implementation answer to be at least 50 characters
    if (showImplementation && implementationAnswer.length < 50) {
      toast({
        title: "Please provide a more detailed response",
        description: "Your implementation answer should be at least 50 characters.",
        variant: "destructive",
      });
      return;
    }

    // If showing MCQ questions
    if (!showImplementation) {
      const currentQuestion = questions[currentQuestionIndex];
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      // Increment correct answer count if correct
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        playCorrectSound();
      } else {
        playIncorrectSound();
      }

      // Check if we need to move to the next question or show implementation question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        
        // Update progress
        const newProgress = ((currentQuestionIndex + 1) / (questions.length + 1)) * 100;
        setProgress(newProgress);
      } else {
        // Move to implementation question
        setShowImplementation(true);
        setSelectedAnswer(null);
        
        // Update progress
        const newProgress = (questions.length / (questions.length + 1)) * 100;
        setProgress(newProgress);
      }
    } else {
      // Finish the quiz
      completeQuiz();
    }
  };

  // Calculate points, display final feedback, and record completion
  const completeQuiz = () => {
    // Calculate percentage correct (excluding implementation question)
    const percentCorrect = (correctAnswers / questions.length) * 100;
    const allAnswersCorrect = correctAnswers === questions.length;
    setAllCorrect(allAnswersCorrect);
    
    // Calculate points (will be applied by server based on actual business rules)
    // This is just for UI display - actual logic is on server
    let pointsEarned = Math.max(1, Math.round(percentCorrect / 20));
    if (allAnswersCorrect) pointsEarned = 8; // Bonus for all correct
    setEarnedPoints(pointsEarned);
    
    // Show completion celebration
    setProgress(100);
    playCompletionSound();
    playCelebrationSound();
    
    // Fire confetti for a perfect score
    if (allAnswersCorrect && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      });
      
      myConfetti({
        particleCount: 150,
        spread: 160,
        origin: { y: 0.6 }
      });
    }
    
    setQuizCompleted(true);
    
    // Save progress and award points
    saveQuizResults(pointsEarned, allAnswersCorrect);
  };

  const saveQuizResults = async (points: number, allCorrect: boolean) => {
    try {
      // Make API request to record quiz completion and award points
      const response = await apiRequest('/api/videos/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          videoId: videoId,
          points: allCorrect ? 1 : 0, // Send 1 if all correct, 0 if any wrong - will be calculated properly on server
          response: implementationAnswer
        }
      });
      
      if (response && response.success) {
        console.log('Quiz completion recorded successfully');
        // Now show final feedback
        setShowFinalFeedback(true);
        // Notify parent component of completion with points earned
        onComplete(points);
      } else {
        console.error('Failed to record quiz completion:', response);
        toast({
          title: "Error Recording Completion",
          description: response?.message || "Failed to record your quiz completion. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: "Error",
        description: "Failed to save your quiz results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToLibrary = () => {
    onClose();
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <div className="bg-card rounded-xl p-8 w-full max-w-md mx-auto shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-xl font-semibold">Loading Quiz...</p>
            <p className="text-muted-foreground text-sm text-center">
              Preparing questions about "{videoTitle}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz completion state with congratulations and points summary
  if (quizCompleted && showFinalFeedback) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <div className="bg-card rounded-xl p-8 w-full max-w-lg mx-auto shadow-lg relative overflow-hidden">
          <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-center">
              {allCorrect 
                ? "Perfect Score! Excellent work!" 
                : "Quiz Completed!"}
            </h2>
            
            <div className="text-center space-y-2">
              <p className="text-lg">
                You answered <span className="font-bold">{correctAnswers}</span> out of <span className="font-bold">{questions.length}</span> questions correctly.
              </p>
              
              <div className="flex items-center justify-center space-x-2 py-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <p className="text-lg font-medium">
                  <span className="font-bold text-primary">+{earnedPoints} Points</span> earned!
                </p>
              </div>
              
              <p className="text-muted-foreground text-sm mt-4">
                Thank you for watching this video and completing the quiz. Your points have been added to your total!
              </p>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={handleBackToLibrary}
            >
              Return to Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For extreme mobile optimization
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background/80 z-50 overflow-y-auto">
        <div className="bg-card p-1.5 w-full h-full flex flex-col">
          {/* Minimal Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold">Video Quiz</span>
            <button onClick={onClose} className="p-0.5" aria-label="Close">
              <X className="h-3 w-3" />
            </button>
          </div>
          
          {/* Minimal Progress */}
          <div className="mb-1 mt-0.5">
            <div className="flex justify-between text-[8px]">
              <span>{showImplementation ? "Final" : `Q${currentQuestionIndex + 1}/${questions.length}`}</span>
              <span className="truncate max-w-32">{videoTitle}</span>
            </div>
            <Progress value={progress} className="h-0.5 mt-0.5" />
          </div>
          
          {/* Compact Question */}
          <div className="border rounded p-1 mb-1 flex-1 overflow-y-auto">
            {!showImplementation ? (
              <>
                <p className="text-[10px] font-medium mb-1.5 leading-tight">
                  {questions[currentQuestionIndex]?.question}
                </p>
                
                <div className="space-y-1">
                  {questions[currentQuestionIndex]?.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-1 rounded border cursor-pointer text-[9px] ${
                        selectedAnswer === option
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                      onClick={() => handleSelectAnswer(option)}
                    >
                      <div className="flex items-start">
                        <div className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 flex items-center justify-center mr-0.5 ${
                          selectedAnswer === option 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-muted-foreground'
                        }`}>
                          {selectedAnswer === option && <Check className="h-1 w-1" />}
                        </div>
                        <span className="leading-tight">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-[10px] font-medium mb-1 leading-tight">
                  {implementationQuestion?.question}
                </p>
                <Textarea
                  placeholder="How would you apply this in your classroom? (50 char min)"
                  className="min-h-[60px] text-[9px]"
                  value={implementationAnswer}
                  onChange={(e) => setImplementationAnswer(e.target.value)}
                />
                <div className="flex justify-end mt-0.5">
                  <span className={`text-[7px] ${
                    implementationAnswer.length < 50 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {implementationAnswer.length}/50
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between mt-auto">
            <button 
              onClick={onClose}
              className="border rounded text-[8px] px-1 py-0.5 h-5 flex items-center"
            >
              <ArrowLeft className="h-1.5 w-1.5 mr-0.5" />
              Cancel
            </button>
            
            <button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer && !showImplementation}
              className={`rounded text-[8px] px-1 py-0.5 h-5 flex items-center ${
                (!selectedAnswer && !showImplementation) 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {showImplementation ? 'Complete' : 'Next'}
              <ChevronRight className="h-1.5 w-1.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular desktop version
  return (
    <div className="fixed inset-0 bg-background/80 z-50 overflow-y-auto flex items-center justify-center">
      <div className="bg-card rounded-xl p-6 w-full max-w-3xl mx-auto shadow-lg my-4">
        {/* Quiz Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Video Quiz</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-full"
            aria-label="Close quiz"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {showImplementation 
                ? "Final Question" 
                : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
            </span>
            <Badge variant="outline" className="flex items-center">
              <Video className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[300px]">{videoTitle}</span>
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Question Display */}
        <Card className="p-6 mb-6">
          {!showImplementation ? (
            <>
              {/* Multiple Choice Questions */}
              <h3 className="text-lg font-semibold mb-4">
                {questions[currentQuestionIndex]?.question}
              </h3>
              
              <div className="space-y-3">
                {questions[currentQuestionIndex]?.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                    onClick={() => handleSelectAnswer(option)}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                        selectedAnswer === option 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : 'border-muted-foreground'
                      }`}>
                        {selectedAnswer === option && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className={selectedAnswer === option ? 'font-medium' : ''}>{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Implementation Question */}
              <h3 className="text-lg font-semibold mb-4">
                {implementationQuestion?.question}
              </h3>
              <Textarea
                placeholder="Share at least one specific way you could apply this video's content in your classroom (minimum 50 characters)..."
                className="min-h-[120px]"
                value={implementationAnswer}
                onChange={(e) => setImplementationAnswer(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${
                  implementationAnswer.length < 50 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {implementationAnswer.length}/50 characters minimum
                </span>
              </div>
            </>
          )}
        </Card>
        
        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            onClick={handleNextQuestion} 
            disabled={!selectedAnswer && !showImplementation}
          >
            {showImplementation ? 'Complete Quiz' : 'Next Question'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Function to generate fallback quiz questions based on video details
function generateContentBasedQuestions(
  videoTitle: string,
  description: string = "",
  categories: string[] = [],
  tags: string[] = []
): QuizQuestion[] {
  return [
    {
      id: 'q1',
      question: "What is a key principle of developmentally appropriate practice?",
      options: [
        "Meeting children where they are developmentally",
        "Treating all children the same regardless of differences",
        "Following rigid curriculum guidelines",
        "Focusing exclusively on academic skills"
      ],
      correctAnswer: "Meeting children where they are developmentally"
    },
    {
      id: 'q2',
      question: "How can you best apply video content in your teaching?",
      options: [
        "Integrate concepts into daily routines and interactions",
        "Create isolated lessons that only focus on these topics",
        "Wait for perfect conditions before trying new approaches",
        "Focus only on the highest-achieving students"
      ],
      correctAnswer: "Integrate concepts into daily routines and interactions"
    },
    {
      id: 'q3',
      question: "Which teaching approach best supports holistic development?",
      options: [
        "Child-centered learning with thoughtful teacher guidance",
        "Highly structured teacher-directed instruction only",
        "Completely unstructured exploration without guidance",
        "Following a rigid curriculum without adaptation"
      ],
      correctAnswer: "Child-centered learning with thoughtful teacher guidance"
    },
    {
      id: 'q4',
      question: "How should early education content be approached?",
      options: [
        "Through meaningful experiences across developmental domains",
        "Focusing primarily on academic readiness skills",
        "Teaching isolated skills in separate subjects",
        "Prioritizing future academic needs over present development"
      ],
      correctAnswer: "Through meaningful experiences across developmental domains"
    },
    {
      id: 'q5',
      question: "What role does reflection play in effective teaching?",
      options: [
        "It helps teachers continuously improve their practice",
        "It is only necessary when something goes wrong",
        "It requires extensive documentation to be valuable",
        "It is useful for administrators but not daily teaching"
      ],
      correctAnswer: "It helps teachers continuously improve their practice"
    }
  ];
}