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
              const formattedQuestions: QuizQuestion[] = response.quiz.questions.map((q: any, index: number) => {
                // The correctAnswer might be stored as an index (number) or as the actual answer (string)
                const correctAnswerValue = typeof q.correctAnswer === 'number' 
                  ? q.options[q.correctAnswer] 
                  : q.correctAnswer;
                
                return {
                  id: `q${index + 1}`,
                  question: q.question,
                  options: q.options,
                  correctAnswer: correctAnswerValue
                };
              });
              
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
    
    // Define specific content categories with clear keywords to match against
    const videoCategories = {
      mindfulness: ['mindfulness', 'meditation', 'yoga', 'breathing', 'calm', 'zen', 'cosmic kids'],
      socialEmotional: ['social', 'emotional', 'sel', 'feelings', 'emotions', 'self-regulation', 'relationships', 'empathy'],
      literacy: ['literacy', 'reading', 'writing', 'language', 'phonics', 'books', 'spelling', 'communication'],
      mathematics: ['math', 'numbers', 'counting', 'shapes', 'patterns', 'measurement'],
      science: ['science', 'experiment', 'nature', 'animals', 'plants', 'exploration'],
      artCreative: ['art', 'creative', 'music', 'dance', 'drama', 'expression', 'imagination'],
      tedTalk: ['ted', 'talk', 'speaker', 'presentation', 'education talk'],
      teacherDevelopment: ['professional', 'development', 'teacher', 'training', 'classroom management', 'philosophy', 'pedagogy'],
      inclusion: ['inclusion', 'diversity', 'special needs', 'differentiation', 'accommodation'],
      childDevelopment: ['brain', 'development', 'psychology', 'milestones', 'cognitive', 'growth']
    };
    
    // Check which categories apply to this video
    const videoTypes = Object.entries(videoCategories).reduce((types, [category, keywords]) => {
      // Convert to lowercase for case-insensitive matching
      const titleLower = title.toLowerCase();
      const descriptionLower = description.toLowerCase();
      
      // Check if any keywords match in any content
      const matches = keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        return titleLower.includes(keywordLower) || 
               descriptionLower.includes(keywordLower) ||
               categories.some(cat => cat.toLowerCase().includes(keywordLower)) ||
               tags.some(tag => tag.toLowerCase().includes(keywordLower));
      });
      
      if (matches) {
        types.push(category);
      }
      return types;
    }, [] as string[]);
    
    // Generate the most relevant questions for this specific video type
    switch(videoTypes[0] || '') {
      case 'mindfulness':
        return [
          {
            id: 'q1',
            question: 'What is a key benefit of incorporating mindfulness practices in early childhood settings?',
            options: [
              'Supporting children\'s self-regulation skills',
              'Replacing academic instruction time',
              'Eliminating the need for outdoor play',
              'Ensuring children sit still for longer periods'
            ],
            correctAnswer: 'Supporting children\'s self-regulation skills'
          },
          {
            id: 'q2',
            question: 'How would you introduce mindfulness activities like those shown in the video?',
            options: [
              'Start with brief, engaging sessions and gradually extend the duration',
              'Begin with 30-minute meditation sessions',
              'Only practice with children who are already calm',
              'Use it exclusively as a punishment when children are disruptive'
            ],
            correctAnswer: 'Start with brief, engaging sessions and gradually extend the duration'
          },
          {
            id: 'q3',
            question: 'What practices shown in this video could help during classroom transitions?',
            options: [
              'Simple breathing or movement exercises to help children center themselves',
              'Asking children to sit perfectly still and silent',
              'Using competitive games to determine who transitions fastest',
              'Extended meditation sessions'
            ],
            correctAnswer: 'Simple breathing or movement exercises to help children center themselves'
          },
          {
            id: 'q4',
            question: 'How does mindfulness support the "whole child" approach to early education?',
            options: [
              'It helps children develop both emotional awareness and focused attention skills',
              'It focuses exclusively on physical development',
              'It replaces social-emotional learning',
              'It prioritizes stillness over all other developmental needs'
            ],
            correctAnswer: 'It helps children develop both emotional awareness and focused attention skills'
          },
          {
            id: 'q5',
            question: 'What is an appropriate way to modify mindfulness activities for diverse learners?',
            options: [
              'Offer multiple ways to participate with different levels of movement and engagement',
              'Exclude children who cannot remain still',
              'Always separate children by ability level',
              'Only use mindfulness with older children'
            ],
            correctAnswer: 'Offer multiple ways to participate with different levels of movement and engagement'
          }
        ];
        
      case 'socialEmotional':
        return [
          {
            id: 'q1',
            question: 'What is one of the primary goals of social-emotional learning in early childhood?',
            options: [
              'Helping children recognize and express emotions appropriately',
              'Ensuring children never experience negative emotions',
              'Teaching children to hide their feelings',
              'Focusing exclusively on happiness'
            ],
            correctAnswer: 'Helping children recognize and express emotions appropriately'
          },
          {
            id: 'q2',
            question: 'How can you effectively implement the social-emotional strategies shown in this video?',
            options: [
              'Incorporate them consistently throughout the day in authentic contexts',
              'Schedule one SEL lesson per week',
              'Only address emotions when conflicts arise',
              'Use worksheets to teach emotional concepts'
            ],
            correctAnswer: 'Incorporate them consistently throughout the day in authentic contexts'
          },
          {
            id: 'q3',
            question: 'What role does teacher modeling play in social-emotional development?',
            options: [
              'Teachers demonstrate emotional awareness and regulation through their own actions',
              'Teacher modeling is not important for social-emotional learning',
              'Teachers should hide their emotions from children',
              'Teachers should only model positive emotions'
            ],
            correctAnswer: 'Teachers demonstrate emotional awareness and regulation through their own actions'
          },
          {
            id: 'q4',
            question: 'How does well-developed social-emotional competence affect other areas of learning?',
            options: [
              'It creates a foundation for success across all developmental domains',
              'It has little impact on cognitive development',
              'It only matters for children with behavioral challenges',
              'It delays academic progress'
            ],
            correctAnswer: 'It creates a foundation for success across all developmental domains'
          },
          {
            id: 'q5',
            question: 'What approach to challenging behavior is most aligned with the social-emotional principles in this video?',
            options: [
              'View behavior as communication and teach needed skills',
              'Use punishment to eliminate unwanted behaviors',
              'Remove children who display challenging behaviors',
              'Ignore all challenging behaviors'
            ],
            correctAnswer: 'View behavior as communication and teach needed skills'
          }
        ];
        
      case 'tedTalk':
        return [
          {
            id: 'q1',
            question: `What is the main message of "${title}"?`,
            options: [
              'Building strong relationships with children is fundamental to effective education',
              'Teaching should focus exclusively on academic content',
              'Standardized testing is the best measure of educational quality',
              'Educational innovation requires expensive technology'
            ],
            correctAnswer: 'Building strong relationships with children is fundamental to effective education'
          },
          {
            id: 'q2',
            question: 'How might you apply the key principles from this talk in your classroom?',
            options: [
              'Reflect on how your beliefs about children affect your interactions with them',
              'Focus primarily on academic outcomes rather than relationships',
              'Implement exactly the same approach with all children',
              'Minimize individual connections to maintain authority'
            ],
            correctAnswer: 'Reflect on how your beliefs about children affect your interactions with them'
          },
          {
            id: 'q3',
            question: 'According to the principles shared in this talk, what is most important for effective teaching?',
            options: [
              'Authentic connection and meeting children where they are developmentally',
              'Following prescribed curriculum with fidelity',
              'Maintaining strict classroom control',
              'Focusing on weaknesses rather than strengths'
            ],
            correctAnswer: 'Authentic connection and meeting children where they are developmentally'
          },
          {
            id: 'q4',
            question: 'How does the message of this talk align with developmental science?',
            options: [
              'It recognizes that relationships are the foundation of healthy brain development',
              'It contradicts what we know about early brain development',
              'It places too much emphasis on relationships over content',
              'It suggests children develop best in competitive environments'
            ],
            correctAnswer: 'It recognizes that relationships are the foundation of healthy brain development'
          },
          {
            id: 'q5',
            question: 'What small step could you take tomorrow to implement ideas from this talk?',
            options: [
              'Set an intention to have a positive individual interaction with each child',
              'Redesign your entire curriculum immediately',
              'Focus more on assessment and evaluation',
              'Create stricter classroom rules'
            ],
            correctAnswer: 'Set an intention to have a positive individual interaction with each child'
          }
        ];
      
      // Add other specialized categories for more video types
        
      default:
        // If no specific category matched or multiple categories matched, use generic improved questions
        return [
          {
            id: 'q1',
            question: `What is the main focus of "${title}"?`,
            options: [
              `Understanding ${topics[0] || 'key concepts'} in early childhood education`,
              `Specific teaching strategies rather than foundational principles`,
              `Administrative procedures rather than teaching approaches`,
              `Standardized assessment rather than child development`
            ],
            correctAnswer: `Understanding ${topics[0] || 'key concepts'} in early childhood education`
          },
          {
            id: 'q2',
            question: `How could you apply the ideas in "${title}" to your classroom practice?`,
            options: [
              `Integrate ${topics[0] || 'these concepts'} into your regular routines and interactions`,
              `Create separate lessons that only focus on ${topics[0] || 'these topics'}`,
              `Wait until children are older before introducing these ideas`,
              `Focus only on children who are struggling with ${topics[0] || 'these concepts'}`
            ],
            correctAnswer: `Integrate ${topics[0] || 'these concepts'} into your regular routines and interactions`
          },
          {
            id: 'q3',
            question: `According to developmentally appropriate practice, which approach to ${topics[0] || 'teaching'} is most effective?`,
            options: [
              `Child-centered learning with thoughtful teacher guidance`,
              `Highly structured teacher-directed instruction`,
              `Letting children learn entirely on their own`,
              `Following a rigid curriculum regardless of children's interests`
            ],
            correctAnswer: `Child-centered learning with thoughtful teacher guidance`
          },
          {
            id: 'q4',
            question: `How does the content in this video support children's development?`,
            options: [
              `It helps create meaningful learning experiences that build a strong foundation`,
              `It prioritizes academic achievement over other developmental domains`,
              `It focuses exclusively on future academic success`,
              `It treats all children as if they develop at exactly the same rate`
            ],
            correctAnswer: `It helps create meaningful learning experiences that build a strong foundation`
          },
          {
            id: 'q5',
            question: `What is a key takeaway from "${title}" that you can implement immediately?`,
            options: [
              `Look for opportunities to incorporate ${topics[0] || 'these ideas'} throughout your day`,
              `Create a rigid schedule for teaching ${topics[0] || 'these concepts'}`,
              `Wait for perfect conditions before trying these approaches`,
              `Exclude children who might not be ready for ${topics[0] || 'these concepts'}`
            ],
            correctAnswer: `Look for opportunities to incorporate ${topics[0] || 'these ideas'} throughout your day`
          }
        ];
    }
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