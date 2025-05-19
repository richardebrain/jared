import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, X, Award, Brain, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Quiz interface
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; 
}

// Implementation question about classroom application
export interface ImplementationQuestion {
  id: string;
  question: string;
}

interface VideoQuizProps {
  videoId: string;
  videoTitle: string;
  onComplete: (points: number) => void;
  onClose: () => void;
}

export default function VideoQuiz({ videoId, videoTitle, onComplete, onClose }: VideoQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [implementationQuestion, setImplementationQuestion] = useState<ImplementationQuestion | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [implementationAnswer, setImplementationAnswer] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const { toast } = useToast();

  // Import sound effects
  const { 
    playSuccessSound, 
    playWrongSound, 
    playLevelCompleteSound,
    playCelebrationSound
  } = useSoundEffects();

  // Generate quiz questions based on video content
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        
        // Get video information including duration and pre-defined quiz questions
        try {
          // Fetch the video resource from our API with all details
          const response = await apiRequest(`/api/videos/${videoId}`);
          
          if (response) {
            // Set video duration
            if (response.duration) {
              setVideoDuration(response.duration);
            } else {
              setVideoDuration(5); // Default to 5 minutes
            }
            
            // Use pre-defined quiz questions if available
            if (response.quiz && response.quiz.questions && response.quiz.questions.length > 0) {
              // Map API quiz format to our component format
              const formattedQuestions: QuizQuestion[] = response.quiz.questions.map((q: any, index: number) => ({
                id: `q${index + 1}`,
                question: q.question,
                options: q.options,
                correctAnswer: q.options[q.correctAnswer] // Convert from index to actual answer text
              }));
              
              setQuestions(formattedQuestions);
            } else {
              // Fallback to generated questions if no predefined quiz exists
              const generatedQuestions: QuizQuestion[] = generateContentBasedQuestions(videoTitle, response.description, response.category, response.tags);
              setQuestions(generatedQuestions);
            }
          } else {
            // Fallback to generated questions if API fails
            setVideoDuration(5);
            const generatedQuestions: QuizQuestion[] = generateContentBasedQuestions(videoTitle, "", [], []);
            setQuestions(generatedQuestions);
          }
        } catch (error) {
          console.error('Error fetching video data:', error);
          setVideoDuration(5); // Default to 5 minutes
          const generatedQuestions: QuizQuestion[] = generateContentBasedQuestions(videoTitle, "", [], []);
          setQuestions(generatedQuestions);
        }
        
        // Always include an implementation question
        const implQuestion: ImplementationQuestion = {
          id: 'implementation',
          question: `How would you apply what you learned in "${videoTitle}" to your classroom practice?`
        };
        
        setImplementationQuestion(implQuestion);
        setLoading(false);
      } catch (error) {
        console.error('Error generating quiz questions:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, [videoId, videoTitle, toast]);

  // Generate more content-relevant questions based on video metadata
  const generateContentBasedQuestions = (
    title: string, 
    description: string = "", 
    categories: string[] = [], 
    tags: string[] = []
  ): QuizQuestion[] => {
    // Extract key topics from title, description and tags
    const allWords = [
      ...title.split(' ').filter(word => word.length > 3),
      ...description.split(' ').filter(word => word.length > 3),
      ...tags
    ];
    
    // Get unique topics from all sources
    const uniqueTopics = Array.from(new Set(allWords))
      .filter(word => !['with', 'that', 'this', 'from', 'about', 'what', 'their', 'these', 'those'].includes(word.toLowerCase()));
    
    // Select top topics (up to 5)
    const topics = uniqueTopics.slice(0, Math.min(uniqueTopics.length, 5));
    
    // Determine educational category based on metadata
    const hasEducationalTheory = categories.some(c => 
      ['teaching-philosophy', 'inspiration', 'theory', 'pedagogy'].includes(c.toLowerCase()));
    
    const hasDevelopmental = categories.some(c => 
      ['development', 'child-development', 'brain-development', 'cognitive'].includes(c.toLowerCase()));
    
    const hasClassroom = categories.some(c => 
      ['classroom-management', 'teaching-strategies', 'activities', 'lesson-planning'].includes(c.toLowerCase()));
    
    const hasSEL = categories.some(c => 
      ['sel', 'social-emotional', 'emotional-learning', 'emotions', 'relationships'].includes(c.toLowerCase()));
      
    const hasLanguage = categories.some(c => 
      ['language', 'literacy', 'reading', 'writing', 'communication'].includes(c.toLowerCase()));
      
    // Determine video type by checking for keywords in title or description
    const isTedTalk = title.toLowerCase().includes('ted') || 
                      tags.some(t => t.toLowerCase().includes('ted')) ||
                      description.toLowerCase().includes('ted talk');
                      
    const isActivity = categories.some(c => ['activities', 'classroom-activities'].includes(c.toLowerCase())) ||
                       description.toLowerCase().includes('activity') ||
                       title.toLowerCase().includes('activity');
                      
    // Generate relevant questions based on video content type
    return [
      // Question 1: Main focus question - customized by category
      {
        id: 'q1',
        question: `What is the main focus of "${title}"?`,
        options: [
          isTedTalk ? 
            `Inspiring educators to reflect on their ${topics[0] || 'teaching'} approach` :
            isActivity ? 
              `Demonstrating practical ${topics[0] || 'activities'} for the classroom` :
              `Understanding ${topics[0] || 'concepts'} in early childhood education`,
          
          hasEducationalTheory ?
            `Exploring educational theory related to ${topics[1] || 'learning'}` :
            `Implementing specific ${topics[1] || 'strategies'} in the classroom`,
          
          hasDevelopmental ?
            `Examining how children develop ${topics[0] || 'skills'} over time` :
            `Building relationships with children through ${topics[0] || 'activities'}`,
          
          hasSEL ?
            `Supporting children's social-emotional development` :
            `Assessing progress in ${topics[1] || 'learning'} areas`
        ],
        correctAnswer: isTedTalk ? 
          `Inspiring educators to reflect on their ${topics[0] || 'teaching'} approach` :
          isActivity ? 
            `Demonstrating practical ${topics[0] || 'activities'} for the classroom` :
            `Understanding ${topics[0] || 'concepts'} in early childhood education`
      },
      
      // Question 2: Practical application question
      {
        id: 'q2',
        question: `Which of the following best describes a practical application of the concepts in this video?`,
        options: [
          hasClassroom ?
            `Creating a learning environment that incorporates ${topics[0] || 'key concepts'}` :
            `Designing activities that encourage children to explore ${topics[0] || 'concepts'}`,
          
          hasEducationalTheory ?
            `Reflecting on your teaching philosophy and how it aligns with these ideas` :
            `Discussing ${topics[1] || 'theories'} with colleagues during planning sessions`,
          
          hasLanguage ?
            `Using language-rich interactions to build ${topics[0] || 'skills'}` :
            `Creating structured worksheets to teach ${topics[0] || 'concepts'}`,
          
          hasSEL ?
            `Supporting children's emotional needs during ${topics[1] || 'learning'} activities` :
            `Creating assessment rubrics for ${topics[1] || 'learning'} outcomes`
        ],
        correctAnswer: hasClassroom ?
          `Creating a learning environment that incorporates ${topics[0] || 'key concepts'}` :
          `Designing activities that encourage children to explore ${topics[0] || 'concepts'}`
      },
      
      // Question 3: Best practice question
      {
        id: 'q3',
        question: `According to principles in "${title}", which approach is most effective?`,
        options: [
          hasSEL || hasClassroom ?
            `Child-led exploration with teacher guidance and support` :
            `Thoughtful integration of ${topics[0] || 'concepts'} into daily routines`,
          
          `Teacher-directed instruction with limited free play`,
          
          `Independent practice with minimal teacher interaction`,
          
          `Standardized activities that treat all children the same way`
        ],
        correctAnswer: hasSEL || hasClassroom ?
          `Child-led exploration with teacher guidance and support` :
          `Thoughtful integration of ${topics[0] || 'concepts'} into daily routines`
      },
      
      // Question 4: Alignment with Building Chapter One philosophy
      {
        id: 'q4',
        question: `How does the content in this video align with the "Building Chapter One" philosophy?`,
        options: [
          hasDevelopmental ?
            `It helps create formative experiences that shape a child's development` :
            `It helps create formative experiences that become part of a child's foundation`,
          
          `It focuses primarily on academic achievement rather than whole-child development`,
          
          `It emphasizes following a strict curriculum above all else`,
          
          `It prioritizes standardized outcomes over individualized development`
        ],
        correctAnswer: hasDevelopmental ?
          `It helps create formative experiences that shape a child's development` :
          `It helps create formative experiences that become part of a child's foundation`
      },
      
      // Question 5: Key takeaway/implementation question
      {
        id: 'q5',
        question: `What is a key takeaway from "${title}" that you can implement immediately?`,
        options: [
          `Creating more opportunities for children to engage with ${topics[0] || 'concepts'} through play and exploration`,
          
          isActivity ?
            `Following the exact activity structure shown in the video` :
            `Implementing a new ${topics[0] || 'strategy'} in your classroom tomorrow`,
          
          `Requiring all children to master ${topics[0] || 'concepts'} at the same pace`,
          
          `Creating a rigid schedule to ensure ${topics[0] || 'learning'} happens at specific times`
        ],
        correctAnswer: `Creating more opportunities for children to engage with ${topics[0] || 'concepts'} through play and exploration`
      }
    ];
  };

  // Kept for backwards compatibility - will be removed in future update
  const generateSampleQuestions = generateContentBasedQuestions;

  const handleAnswerSelect = (questionId: string, answer: string) => {
    const currentQuestion = questions.find(q => q.id === questionId);
    
    if (currentQuestion) {
      // Check if answer is correct
      const isCorrect = answer === currentQuestion.correctAnswer;
      
      // Store the selected answer
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: answer
      });
      
      // Mark question as answered for progress tracking
      if (!answeredQuestions.includes(questionId)) {
        setAnsweredQuestions([...answeredQuestions, questionId]);
      }
      
      // Play appropriate sound and provide feedback
      if (isCorrect) {
        // Correct answer! Play success sound
        playSuccessSound();
        
        // Reset incorrect attempts for this question
        setIncorrectAttempts(prev => ({
          ...prev,
          [questionId]: 0
        }));
        
        // Hide any error feedback
        setShowIncorrectFeedback(false);
      } else {
        // Wrong answer - check if this is their first attempt
        const attempts = incorrectAttempts[questionId] || 0;
        
        if (attempts === 0) {
          // First wrong attempt - give them a second chance
          playWrongSound();
          
          // Increment attempt counter
          setIncorrectAttempts(prev => ({
            ...prev,
            [questionId]: 1
          }));
          
          // Show feedback that they have one more chance
          setShowIncorrectFeedback(true);
          
          // Don't advance to next question yet - give them another try
          return;
        } else {
          // Second wrong attempt - move on but keep track of the wrong answer
          playWrongSound();
          setShowIncorrectFeedback(false);
        }
      }
    }
  };

  const handleNextQuestion = () => {
    // Reset incorrect feedback when moving to next question
    setShowIncorrectFeedback(false);
    
    if (currentQuestion < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    let allCorrect = true;
    
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      } else {
        allCorrect = false;
      }
    });
    
    // Calculate percentage score
    const percentage = Math.round((correctCount / questions.length) * 100);
    
    // Play appropriate completion sound
    if (allCorrect) {
      playCelebrationSound();
    } else if (percentage >= 80) {
      playLevelCompleteSound();
    }
    
    // Set earned points based on video duration and whether all answers are correct
    let earnedPoints = 0;
    
    if (allCorrect) {
      // They need to get all correct to earn points (after second chances)
      // Award points based on video duration
      earnedPoints = videoDuration >= 10 ? 8 : 5;
    }
    
    setScore(percentage);
    setQuizCompleted(true);
    
    // Save progress and award points
    saveQuizResults(earnedPoints, allCorrect);
  };

  const saveQuizResults = async (points: number, allCorrect: boolean) => {
    try {
      // In a real implementation, this would be an API call to save results
      // Now we're using the actual API endpoint with proper data
      
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
          duration: videoDuration
        }
      });
      
      if (response.success) {
        const messagePrefix = allCorrect 
          ? `Great job! You've answered all questions correctly.` 
          : `Quiz completed, but some answers were incorrect.`;
        
        const pointsMessage = response.pointsAwarded > 0 
          ? `You've earned ${response.pointsAwarded} points!` 
          : response.limitReached 
            ? "You've reached your daily limit of 2 videos." 
            : "No points awarded for incorrect answers.";
          
        toast({
          title: "Quiz Completed!",
          description: `${messagePrefix} ${pointsMessage}`,
          variant: "default",
        });
        
        // Pass the earned points back to the parent component
        onComplete(response.pointsAwarded || 0);
        
        // Refresh user data to update points display
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else {
        toast({
          title: "Quiz Completed",
          description: response.message || "Quiz results saved.",
          variant: "default",
        });
        
        onComplete(0);
      }
      
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
      });
      
      onComplete(0);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Quiz...</CardTitle>
          <CardDescription>Please wait while we prepare your quiz questions</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Progress value={50} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Quiz Completed!
          </CardTitle>
          <CardDescription>Your understanding of "{videoTitle}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{score}%</div>
            <p className="text-muted-foreground">
              {score >= 80 ? "Excellent work!" : score >= 60 ? "Good job!" : "Keep learning!"}
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-medium mb-2">Your implementation plan:</h3>
            <p className="text-sm">{implementationAnswer || "No implementation plan provided."}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Your answers:</h3>
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-start gap-2 text-sm">
                {selectedAnswers[question.id] === question.correctAnswer ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium">Question {index + 1}:</span>{" "}
                  {selectedAnswers[question.id] || "Not answered"}
                  {selectedAnswers[question.id] !== question.correctAnswer && (
                    <div className="text-green-600 mt-1">
                      Correct answer: {question.correctAnswer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose} className="w-full">Close Quiz</Button>
        </CardFooter>
      </Card>
    );
  }

  // Regular quiz display
  const currentQuestionData = currentQuestion < questions.length 
    ? questions[currentQuestion] 
    : null;
  
  const progress = Math.round(((answeredQuestions.length) / (questions.length + 1)) * 100);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {currentQuestion < questions.length ? "Quiz" : "Final Question"}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {currentQuestion < questions.length 
              ? `Question ${currentQuestion + 1}/${questions.length}`
              : "Implementation Question"
            }
          </div>
        </div>
        <CardDescription>
          Test your understanding of "{videoTitle}"
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentQuestionData ? (
          // Multiple choice questions
          <div className="space-y-4">
            <h3 className="font-medium text-lg">{currentQuestionData.question}</h3>
            
            {showIncorrectFeedback && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-600 dark:text-amber-300">
                  That's not quite right. You have one more chance to select the correct answer!
                </AlertDescription>
              </Alert>
            )}
            
            <RadioGroup 
              value={selectedAnswers[currentQuestionData.id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestionData.id, value)}
              className="space-y-3 mt-4"
            >
              {currentQuestionData.options.map((option, index) => {
                // Determine if this option is selected
                const isSelected = selectedAnswers[currentQuestionData.id] === option;
                // Check if there's been an incorrect attempt
                const hasIncorrectAttempt = incorrectAttempts[currentQuestionData.id] > 0;
                // Show feedback for this option if it's selected and incorrect
                const showFeedbackForThis = isSelected && hasIncorrectAttempt && showIncorrectFeedback;
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? showFeedbackForThis
                          ? "border-red-400 bg-red-50" 
                          : "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                    <div className="flex-grow">
                      <Label htmlFor={`option-${index}`} className="cursor-pointer block">{option}</Label>
                      
                      {showFeedbackForThis && (
                        <div className="text-red-600 text-sm mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>Think again about what you learned in the video</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ) : implementationQuestion ? (
          // Implementation question
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-lg">{implementationQuestion.question}</h3>
            </div>
            
            <Textarea
              placeholder="Describe how you would implement these concepts in your classroom practice..."
              className="min-h-[150px]"
              value={implementationAnswer}
              onChange={(e) => setImplementationAnswer(e.target.value)}
            />
          </div>
        ) : null}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        
        {currentQuestion < questions.length ? (
          <Button 
            onClick={handleNextQuestion}
            disabled={!selectedAnswers[currentQuestionData?.id || ""]}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={calculateScore}
            disabled={!implementationAnswer.trim().length}
          >
            Complete Quiz
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}