import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Award, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import useSoundEffects from '@/hooks/use-sound-effects';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [loading, setLoading] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);
  const [implementationQuestion, setImplementationQuestion] = useState<ImplementationQuestion | null>(null);
  const [implementationAnswer, setImplementationAnswer] = useState('');
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const { toast } = useToast();
  const { playCorrectSound, playIncorrectSound, playCompletionSound } = useSoundEffects();
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate progress percentage
  const progress = Math.round(((showImplementation ? questions.length + 1 : currentQuestionIndex) / (questions.length + 1)) * 100);

  // Load questions when component mounts
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        const response = await apiRequest('GET', `/api/videos/questions/${videoId}`);
        const data = await response.json();
        
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          // Generate content-based questions if API fails or returns empty
          const contentQuestions = generateContentBasedQuestions(videoTitle);
          setQuestions(contentQuestions);
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
        // Fallback to generated questions
        const contentQuestions = generateContentBasedQuestions(videoTitle);
        setQuestions(contentQuestions);
      } finally {
        setLoading(false);
      }
    };

    generateQuestions();
  }, [videoId, videoTitle]);

  // Handle selection of an answer
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    
    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
    
    // Play sound effect based on correctness
    if (isCorrect) {
      playCorrectSound();
      setCorrectAnswers(prev => prev + 1);
    } else {
      playIncorrectSound();
    }
    
    // Move to next question or show final feedback
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowFinalFeedback(true);
    }
  };

  // Handle completing the quiz
  const handleFinishQuiz = async () => {
    // Calculate points based on correct answers and implementation
    const implementationPoints = implementationAnswer.length >= 50 ? 2 : 0;
    const quizPoints = Math.round((correctAnswers / questions.length) * 8); // Max 8 points from quiz
    const totalPoints = quizPoints + implementationPoints;
    
    setEarnedPoints(totalPoints);
    setQuizCompleted(true);
    setAllCorrect(correctAnswers === questions.length);
    
    // Play completion sound
    playCompletionSound();
    
    // Trigger confetti if all answers are correct
    if (correctAnswers === questions.length) {
      if (confettiCanvasRef.current) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
    
    // Call the onComplete callback with the earned points
    onComplete(totalPoints);
  };

  // Standard layout for both desktop and mobile
  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle>
          {showImplementation ? "Practical Implementation" : "Content Quiz"}
        </DialogTitle>
        <p className="text-muted-foreground text-sm">{videoTitle}</p>
      </DialogHeader>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>
            {showImplementation ? "Final Question" : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
          </span>
          <span className="text-muted-foreground">{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Main content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-muted-foreground">Loading quiz questions...</p>
        </div>
      ) : quizCompleted ? (
        <div className="py-4 text-center">
          <div className="mb-4 relative">
            <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none"></canvas>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quiz Completed!</h3>
            <p className="text-muted-foreground mb-4">
              You got {correctAnswers} out of {questions.length} questions correct.
            </p>
            <div className="mb-4">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-sm px-3 py-1">
                <Award className="h-4 w-4 mr-1" />
                {earnedPoints} points earned
              </Badge>
            </div>
            {allCorrect && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                <p className="font-medium">Perfect score! You've mastered this content completely.</p>
              </div>
            )}
            <Button onClick={onClose} size="sm">
              Continue Learning
            </Button>
          </div>
        </div>
      ) : showImplementation ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-2">{implementationQuestion?.question}</h3>
            <p className="text-muted-foreground text-sm mb-3">
              Describe how you would apply this concept in your teaching practice.
            </p>
            <Textarea 
              placeholder="Share your ideas here... (minimum 50 characters)" 
              className="min-h-[120px]"
              value={implementationAnswer}
              onChange={(e) => setImplementationAnswer(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <span className={`text-xs ${implementationAnswer.length < 50 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {implementationAnswer.length}/50 characters
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImplementation(false)} size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button 
              onClick={() => handleFinishQuiz()} 
              disabled={implementationAnswer.length < 50}
              size="sm"
            >
              Complete Quiz
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </div>
      ) : showFinalFeedback ? (
        <div className="py-4 text-center">
          <h3 className="text-lg font-medium mb-2">All Questions Answered!</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            You've completed all multiple-choice questions.
            Ready for the implementation question?
          </p>
          <Button onClick={() => {
            // Generate the implementation question based on video type
            let implQuestion: ImplementationQuestion;
            
            if (questions[0]?.options.some(opt => 
              opt.toLowerCase().includes("yoga") || 
              opt.toLowerCase().includes("mindfulness") ||
              opt.toLowerCase().includes("breath"))) {
              implQuestion = {
                id: 'impl-1',
                question: 'How would you integrate mindfulness practices in your classroom routine?'
              };
            } 
            else if (questions[0]?.options.some(opt => 
              opt.toLowerCase().includes("emotion") || 
              opt.toLowerCase().includes("social") || 
              opt.toLowerCase().includes("feeling"))) {
              implQuestion = {
                id: 'impl-2',
                question: 'How would you support a child who is struggling to manage their emotions in your classroom?'
              };
            }
            else {
              implQuestion = {
                id: 'impl-3',
                question: 'How would you apply the key concepts from this video in your teaching practice?'
              };
            }
            
            setImplementationQuestion(implQuestion);
            setShowImplementation(true);
            setShowFinalFeedback(false);
          }} size="sm">
            Continue to Implementation
          </Button>
        </div>
      ) : currentQuestionIndex < questions.length ? (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-3">{questions[currentQuestionIndex]?.question}</h3>
              
              <RadioGroup 
                value={selectedAnswer || ""} 
                onValueChange={handleSelectAnswer}
                className="space-y-2"
              >
                {questions[currentQuestionIndex]?.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-grow cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer}
              size="sm"
            >
              Next Question
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </>
      ) : null}
    </>
  );
}

// Function to generate context-based questions
function generateContentBasedQuestions(videoTitle: string): QuizQuestion[] {
  const isMindfulness = videoTitle.toLowerCase().includes('mindful') || 
                       videoTitle.toLowerCase().includes('yoga') || 
                       videoTitle.toLowerCase().includes('meditation');
  
  const isSocialEmotional = videoTitle.toLowerCase().includes('emotion') || 
                           videoTitle.toLowerCase().includes('social') ||
                           videoTitle.toLowerCase().includes('feeling') ||
                           videoTitle.toLowerCase().includes('trauma');
  
  const isTedTalk = videoTitle.toLowerCase().includes('ted') ||
                    videoTitle.toLowerCase().includes('talk');
  
  if (isMindfulness) {
    return [
      {
        id: 'mind-1',
        question: 'What is the primary benefit of mindfulness practices for young children?',
        options: [
          'Improving academic skills exclusively',
          'Enhancing self-regulation and emotional awareness',
          'Increasing physical fitness only',
          'Developing mathematical thinking'
        ],
        correctAnswer: 'Enhancing self-regulation and emotional awareness'
      },
      {
        id: 'mind-2',
        question: 'How can mindfulness be integrated into daily classroom routines?',
        options: [
          'Only during designated yoga sessions',
          'As punishment when children misbehave',
          'Through breathing exercises, body awareness, and attention activities',
          'By requiring perfect stillness for long periods'
        ],
        correctAnswer: 'Through breathing exercises, body awareness, and attention activities'
      },
      {
        id: 'mind-3',
        question: 'What physical space considerations are important for mindfulness activities?',
        options: [
          'Rooms must be completely silent and dark',
          'Comfortable, quiet spaces with minimal distractions',
          'Only outdoors is suitable for mindfulness',
          'Bright lights and stimulating decorations are essential'
        ],
        correctAnswer: 'Comfortable, quiet spaces with minimal distractions'
      }
    ];
  } else if (isSocialEmotional) {
    return [
      {
        id: 'social-1',
        question: 'Which of the following is a key component of social-emotional learning (SEL)?',
        options: [
          'Academic achievement only',
          'Self-awareness and relationship skills',
          'Competitive behavior between peers',
          'Memorization of social rules'
        ],
        correctAnswer: 'Self-awareness and relationship skills'
      },
      {
        id: 'social-2',
        question: 'When a child is experiencing intense emotions, what approach is most effective?',
        options: [
          'Immediately punishing disruptive emotional expressions',
          'Ignoring the emotion until it passes',
          'Recognizing, naming, and validating their feelings',
          'Telling them to stop feeling that way'
        ],
        correctAnswer: 'Recognizing, naming, and validating their feelings'
      },
      {
        id: 'social-3',
        question: 'How can teachers best support children who have experienced trauma?',
        options: [
          'By creating predictable routines and a safe environment',
          'By treating them exactly like all other students',
          'By asking them frequently about their traumatic experiences',
          'By having lower behavioral expectations'
        ],
        correctAnswer: 'By creating predictable routines and a safe environment'
      }
    ];
  } else if (isTedTalk) {
    return [
      {
        id: 'ted-1',
        question: 'What is typically the main purpose of TED Talks in educational contexts?',
        options: [
          'To entertain audiences with humor',
          'To share innovative ideas and research in accessible ways',
          'To advertise products and services',
          'To criticize traditional educational methods'
        ],
        correctAnswer: 'To share innovative ideas and research in accessible ways'
      },
      {
        id: 'ted-2',
        question: 'How can teachers effectively implement ideas from educational TED Talks?',
        options: [
          'By completely replacing their current teaching methods',
          'By critically evaluating ideas and adapting them to their specific context',
          'By following the speaker\'s advice exactly without modification',
          'By focusing only on talks that align with their existing beliefs'
        ],
        correctAnswer: 'By critically evaluating ideas and adapting them to their specific context'
      },
      {
        id: 'ted-3',
        question: 'What makes TED Talks particularly valuable for professional development?',
        options: [
          'They are always long and comprehensive',
          'They present complex ideas in engaging, understandable formats',
          'They only feature famous celebrities',
          'They all follow the same predictable structure'
        ],
        correctAnswer: 'They present complex ideas in engaging, understandable formats'
      }
    ];
  } else {
    // General educational content questions
    return [
      {
        id: 'gen-1',
        question: 'What is a key principle of effective early childhood education?',
        options: [
          'One-size-fits-all curriculum for all children',
          'Focus exclusively on academic skills',
          'Developmentally appropriate practices based on child development',
          'Minimizing play time to maximize instruction'
        ],
        correctAnswer: 'Developmentally appropriate practices based on child development'
      },
      {
        id: 'gen-2',
        question: 'How do educators best support diverse learners in the classroom?',
        options: [
          'By treating all students exactly the same way',
          'By providing varied approaches, materials and learning opportunities',
          'By focusing only on students who struggle the most',
          'By separating students based on ability level'
        ],
        correctAnswer: 'By providing varied approaches, materials and learning opportunities'
      },
      {
        id: 'gen-3',
        question: 'What role does play serve in early childhood education?',
        options: [
          'It\'s just for fun and has no educational value',
          'It\'s only appropriate for after academic work is complete',
          'It\'s a primary vehicle for learning, exploration and skill development',
          'It should be minimized to focus on worksheets and direct instruction'
        ],
        correctAnswer: 'It\'s a primary vehicle for learning, exploration and skill development'
      }
    ];
  }
}