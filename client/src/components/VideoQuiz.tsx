import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, X, Award, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

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
  const { toast } = useToast();

  // Generate quiz questions based on video content
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        setLoading(true);
        // In real implementation, this would fetch from the server
        // For now, we generate sample questions
        const generatedQuestions: QuizQuestion[] = generateSampleQuestions(videoTitle);
        const implQuestion: ImplementationQuestion = {
          id: 'implementation',
          question: `How would you apply what you learned in "${videoTitle}" to your classroom practice?`
        };
        
        setQuestions(generatedQuestions);
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

    generateQuestions();
  }, [videoId, videoTitle, toast]);

  // Helper function to generate sample questions
  // In a production environment, these would come from an API or database
  const generateSampleQuestions = (title: string): QuizQuestion[] => {
    // For demo purposes, generate generic questions based on the video title
    const words = title.split(' ').filter(word => word.length > 3);
    const topics = words.slice(0, Math.min(words.length, 5));
    
    return [
      {
        id: 'q1',
        question: `What is the main focus of "${title}"?`,
        options: [
          `Understanding ${topics[0] || 'concepts'} in early childhood education`,
          `Implementing ${topics[1] || 'strategies'} in the classroom setting`,
          `Building relationships with children through ${topics[0] || 'activities'}`,
          `Assessing progress in ${topics[1] || 'learning'} areas`
        ],
        correctAnswer: `Understanding ${topics[0] || 'concepts'} in early childhood education`
      },
      {
        id: 'q2',
        question: `Which of the following best describes a practical application of the concepts in this video?`,
        options: [
          `Creating a learning environment that incorporates ${topics[0] || 'key concepts'}`,
          `Discussing ${topics[1] || 'theories'} with colleagues during planning sessions`,
          `Using worksheets to reinforce ${topics[0] || 'learning'}`,
          `Assigning homework about ${topics[1] || 'topics'}`
        ],
        correctAnswer: `Creating a learning environment that incorporates ${topics[0] || 'key concepts'}`
      },
      {
        id: 'q3',
        question: `According to best practices related to "${title}", which approach is most effective?`,
        options: [
          `Child-led exploration with teacher guidance`,
          `Teacher-directed instruction with limited free play`,
          `Independent study with minimal interaction`,
          `Group activities with strict guidelines`
        ],
        correctAnswer: `Child-led exploration with teacher guidance`
      },
      {
        id: 'q4',
        question: `How does the content in this video align with the "Building Chapter One" philosophy?`,
        options: [
          `It helps create formative experiences that become part of a child's foundation`,
          `It focuses primarily on academic achievement rather than whole-child development`,
          `It emphasizes following a strict curriculum above all else`,
          `It prioritizes teacher convenience over child development needs`
        ],
        correctAnswer: `It helps create formative experiences that become part of a child's foundation`
      },
      {
        id: 'q5',
        question: `What is a key takeaway from "${title}" that you can implement immediately?`,
        options: [
          `Creating more opportunities for children to engage with ${topics[0] || 'concepts'} through play`,
          `Limiting children's exposure to ${topics[0] || 'activities'} until they're older`,
          `Requiring all children to participate in ${topics[1] || 'activities'} regardless of interest`,
          `Separating children by ability level for all ${topics[0] || 'learning'} activities`
        ],
        correctAnswer: `Creating more opportunities for children to engage with ${topics[0] || 'concepts'} through play`
      }
    ];
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer
    });
    
    if (!answeredQuestions.includes(questionId)) {
      setAnsweredQuestions([...answeredQuestions, questionId]);
    }
  };

  const handleNextQuestion = () => {
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
    
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    // Calculate percentage score
    const percentage = Math.round((correctCount / questions.length) * 100);
    
    // Determine points (1-5 based on performance)
    const earnedPoints = Math.max(1, Math.ceil(correctCount / questions.length * 5));
    
    setScore(percentage);
    setQuizCompleted(true);
    
    // Save progress and award points
    saveQuizResults(earnedPoints);
  };

  const saveQuizResults = async (points: number) => {
    try {
      // In a real implementation, this would be an API call to save results
      // For now, just update UI and trigger the onComplete callback
      
      toast({
        title: "Quiz Completed!",
        description: `You've earned ${points} points for completing this quiz.`,
        variant: "default",
      });
      
      // Pass the earned points back to the parent component
      onComplete(points);
      
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
      });
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
            
            <RadioGroup 
              value={selectedAnswers[currentQuestionData.id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestionData.id, value)}
            >
              {currentQuestionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
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