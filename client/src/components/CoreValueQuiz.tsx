import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Check, X, Award, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface CoreValueQuizProps {
  onComplete: () => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function CoreValueQuiz({ onComplete }: CoreValueQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [secondChance, setSecondChance] = useState(false);
  const [usedSecondChance, setUsedSecondChance] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const { playSuccessSound, playWrongSound, playLevelCompleteSound, playCelebrationSound } = useSoundEffects();
  
  // CORE values quiz questions
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "Which core value emphasizes providing a stable, predictable environment for children?",
      options: ["Prepared", "Consistent", "Committed", "Caring"],
      correctAnswer: 1, // "Consistent"
      explanation: "Being Consistent means providing stable, predictable environments where children feel secure and understand expectations. Consistency in routines, rules, and responses helps children develop a sense of security."
    },
    {
      id: 2,
      question: "According to Raising Arizona's CORE values, planning effectively and being ready to deliver excellent educational experiences reflects which value?",
      options: ["Committed", "Consistent", "Prepared", "Positive"],
      correctAnswer: 2, // "Prepared"
      explanation: "Being Prepared means having your lessons planned, materials ready, and being mentally and emotionally ready for each day. Preparation shows respect for children's learning time and ensures smooth transitions."
    },
    {
      id: 3,
      question: "When a teacher demonstrates dedication to each child's growth and development, which CORE value are they embodying?",
      options: ["Positive", "Caring", "Committed", "Prepared"],
      correctAnswer: 2, // "Committed"
      explanation: "Being Committed means showing dedication to each child's growth and development, even when challenges arise. Commitment means showing up fully each day and persevering through difficult moments."
    },
    {
      id: 4,
      question: "In Miss Rosa's story about consistency, what did she create to help Lila feel secure?",
      options: ["A special song just for Lila", "A personalized cubby with photos", "An unbroken circle of predictable routines", "A daily reward system"],
      correctAnswer: 2, // "An unbroken circle of predictable routines"
      explanation: "Miss Rosa created an 'unbroken circle' of consistent routines that helped Lila gradually feel secure enough to participate. This highlights how consistency provides the secure framework children need to thrive."
    },
    {
      id: 5,
      question: "Which core value is linked to maintaining an optimistic attitude that inspires and encourages children?",
      options: ["Positive", "Committed", "Caring", "Consistent"],
      correctAnswer: 0, // "Positive"
      explanation: "Being Positive means maintaining an optimistic attitude that inspires and encourages children, focusing on solutions rather than problems, and finding joy in the learning process."
    },
    {
      id: 6,
      question: "Which of the following best demonstrates the 'Caring' core value?",
      options: ["Creating detailed lesson plans each week", "Following the same schedule every day", "Showing genuine compassion and empathy for each child", "Maintaining a bright, cheery demeanor"],
      correctAnswer: 2, // "Showing genuine compassion and empathy for each child"
      explanation: "Being Caring means showing genuine compassion and empathy for every child, recognizing their emotional needs, and responding with warmth and understanding."
    },
    {
      id: 7,
      question: "In the Raising Arizona company song, what phrase follows 'Every moment counts,'?",
      options: ["'raising up the bar'", "'every single day'", "'be their guiding star'", "'whether near or far'"],
      correctAnswer: 1, // "every single day"
      explanation: "In the song lyrics: 'Cause tiny hands hold futures bright, Gotta fill their world with guiding light, Every moment counts, every single day...' This emphasizes the importance of consistency and commitment."
    }
  ];
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleOptionSelect = (optionIndex: number) => {
    if (!isSubmitted) {
      setSelectedOption(optionIndex);
    }
  };
  
  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      playSuccessSound();
      setScore(score + 1);
    } else {
      playWrongSound();
      if (!usedSecondChance) {
        setSecondChance(true);
      }
    }
  };
  
  const handleSecondChance = () => {
    setIsSubmitted(false);
    setSelectedOption(null);
    setSecondChance(false);
    setUsedSecondChance(true);
  };
  
  const handleNextQuestion = () => {
    // Reset states for next question
    setSelectedOption(null);
    setIsSubmitted(false);
    setSecondChance(false);
    setUsedSecondChance(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz is complete
      setQuizCompleted(true);
      playCelebrationSound();
    }
  };
  
  const calculatePassingGrade = () => {
    return (score / questions.length) >= 0.70; // 70% passing grade
  };
  
  const calculateGradeDisplay = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90) return "Excellent!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Good work!";
    return "Keep learning!";
  };
  
  const handleQuizComplete = () => {
    onComplete();
  };
  
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
    setScore(0);
    setSecondChance(false);
    setUsedSecondChance(false);
    setQuizCompleted(false);
  };
  
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold mb-4">Raising Arizona's CORE Values Quiz</h2>
      
      {!quizCompleted ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center mb-2">
              <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <Badge variant="outline">{Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete</Badge>
            </div>
            <Progress value={((currentQuestionIndex) / questions.length) * 100} className="h-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-lg font-medium">{currentQuestion.question}</div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all 
                    ${selectedOption === index ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'} 
                    ${isSubmitted && index === currentQuestion.correctAnswer ? 'border-green-500 bg-green-50' : ''}
                    ${isSubmitted && selectedOption === index && !isCorrect ? 'border-red-500 bg-red-50' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {isSubmitted && index === currentQuestion.correctAnswer && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {isSubmitted && selectedOption === index && !isCorrect && (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {isSubmitted && (
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                <div className="font-medium mb-1">
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </div>
                <div className="text-sm">
                  {currentQuestion.explanation}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
            {!isSubmitted ? (
              <div className="w-full">
                <Button 
                  onClick={handleSubmit} 
                  disabled={selectedOption === null}
                  className="w-full"
                >
                  Submit Answer
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row w-full gap-3">
                {secondChance ? (
                  <Button 
                    onClick={handleSecondChance}
                    variant="outline"
                    className="flex items-center sm:w-1/2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                ) : (
                  <div className="sm:w-1/2 flex items-center">
                    <span className="text-sm">
                      Current Score: {score} / {currentQuestionIndex + 1}
                    </span>
                  </div>
                )}
                
                <Button 
                  onClick={handleNextQuestion}
                  className="sm:w-1/2"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Quiz Completed!</CardTitle>
            <CardDescription className="text-center">
              You scored {score} out of {questions.length} questions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-6">
              <Award className={`h-16 w-16 ${calculatePassingGrade() ? 'text-green-500' : 'text-amber-500'}`} />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {calculateGradeDisplay()}
                </h3>
                <p className="text-muted-foreground">
                  {calculatePassingGrade() 
                    ? "You've demonstrated a solid understanding of Raising Arizona's CORE values!" 
                    : "You're on your way to understanding Raising Arizona's CORE values!"}
                </p>
              </div>
              
              <Progress 
                value={(score / questions.length) * 100} 
                className={`h-3 w-full max-w-md mx-auto ${calculatePassingGrade() ? "bg-green-500/20" : "bg-amber-500/20"}`}
              />
              
              <div className="py-2 px-4 bg-muted rounded-md inline-block">
                <span className="font-semibold">{Math.round((score / questions.length) * 100)}%</span>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <p>
                Remember the 5 CORE values that guide our teaching at Raising Arizona:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 max-w-3xl mx-auto">
                <Badge variant="outline" className="text-center py-2 bg-indigo-50">Prepared</Badge>
                <Badge variant="outline" className="text-center py-2 bg-blue-50">Consistent</Badge>
                <Badge variant="outline" className="text-center py-2 bg-pink-50">Caring</Badge>
                <Badge variant="outline" className="text-center py-2 bg-green-50">Positive</Badge>
                <Badge variant="outline" className="text-center py-2 bg-purple-50">Committed</Badge>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={restartQuiz}
              className="sm:w-1/3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            
            <Button
              onClick={handleQuizComplete}
              className="sm:w-1/3"
            >
              {calculatePassingGrade() ? 'Complete Training' : 'Continue Anyway'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}