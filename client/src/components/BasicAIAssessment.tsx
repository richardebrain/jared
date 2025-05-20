import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

// Sample ECE questions for fallback
const sampleQuestions = [
  {
    id: 1,
    question: "Which of the following is a key principle of developmentally appropriate practice?",
    options: [
      "Focusing on academic skills only",
      "Treating all children the same way",
      "Acknowledging children's individual development",
      "Prioritizing teacher-directed activities"
    ],
    correctAnswer: "Acknowledging children's individual development",
    explanation: "Developmentally appropriate practice recognizes each child's unique development trajectory and adapts teaching approaches accordingly.",
    domain: "Child Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 2,
    question: "What is an effective way to promote language development in preschoolers?",
    options: [
      "Correcting grammatical errors immediately",
      "Engaging in back-and-forth conversations",
      "Using simplified vocabulary only",
      "Limiting conversation to instruction time"
    ],
    correctAnswer: "Engaging in back-and-forth conversations",
    explanation: "Back-and-forth conversations (serve and return interactions) build language skills and neural connections.",
    domain: "Language Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 3,
    question: "Which strategy best supports social-emotional learning in toddlers?",
    options: [
      "Removing emotional challenges",
      "Focusing only on academic readiness",
      "Naming and validating feelings",
      "Implementing strict behavioral controls"
    ],
    correctAnswer: "Naming and validating feelings",
    explanation: "Helping toddlers identify and name their emotions supports emotional regulation development.",
    domain: "Social-Emotional Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 4,
    question: "What is the main purpose of the CLASS assessment tool in early childhood settings?",
    options: [
      "To evaluate physical facilities only",
      "To assess teacher-child interactions",
      "To measure children's academic achievement",
      "To ensure compliance with licensing requirements"
    ],
    correctAnswer: "To assess teacher-child interactions",
    explanation: "The Classroom Assessment Scoring System (CLASS) measures the quality of teacher-child interactions.",
    domain: "Assessment",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 5,
    question: "Which approach best represents authentic assessment in early childhood?",
    options: [
      "Weekly standardized tests",
      "Observation during natural play",
      "Workbooks completed at home",
      "Comparing children to age norms only"
    ],
    correctAnswer: "Observation during natural play",
    explanation: "Authentic assessment gathers information about children's abilities during regular activities and play.",
    domain: "Assessment",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 6,
    question: "According to Vygotsky's Zone of Proximal Development, when should teachers provide scaffolding?",
    options: [
      "Only when children ask for help",
      "For tasks children can already do independently",
      "For tasks slightly beyond current ability",
      "Only during formal instruction"
    ],
    correctAnswer: "For tasks slightly beyond current ability",
    explanation: "Scaffolding is most effective in the zone between what a child can do independently and what they cannot do yet.",
    domain: "Child Development",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 7,
    question: "What is the key difference between Piaget's and Vygotsky's theories of cognitive development?",
    options: [
      "Piaget emphasized social interaction; Vygotsky emphasized biological maturation",
      "Piaget emphasized stages; Vygotsky emphasized cultural context and social learning",
      "Piaget studied infants; Vygotsky studied only school-age children",
      "Piaget focused on language; Vygotsky ignored language development"
    ],
    correctAnswer: "Piaget emphasized stages; Vygotsky emphasized cultural context and social learning",
    explanation: "Piaget's theory focuses on universal cognitive stages, while Vygotsky emphasized the role of culture and social interaction in learning.",
    domain: "Child Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 8,
    question: "Which best describes the concept of executive function in early childhood?",
    options: [
      "The ability to follow multi-step instructions perfectly",
      "Mental processes including working memory, self-control and flexible thinking",
      "Leadership skills demonstrated among peer groups",
      "Early literacy and numeracy foundations"
    ],
    correctAnswer: "Mental processes including working memory, self-control and flexible thinking",
    explanation: "Executive function involves cognitive processes that help children manage thoughts, actions, and emotions.",
    domain: "Cognitive Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 9,
    question: "What is the significance of secure attachment in infant development?",
    options: [
      "It ensures academic success in kindergarten",
      "It prevents all behavioral problems",
      "It forms the foundation for healthy social-emotional development",
      "It guarantees advanced language acquisition"
    ],
    correctAnswer: "It forms the foundation for healthy social-emotional development",
    explanation: "Secure attachment provides a safe base that supports exploration and healthy relationship development.",
    domain: "Social-Emotional Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 10,
    question: "What is the primary purpose of the ECERS-R assessment tool?",
    options: [
      "To evaluate child development outcomes",
      "To assess overall program environment quality",
      "To measure teacher qualifications",
      "To determine curriculum effectiveness"
    ],
    correctAnswer: "To assess overall program environment quality",
    explanation: "The Early Childhood Environment Rating Scale-Revised (ECERS-R) evaluates the quality of the overall early childhood program environment.",
    domain: "Program Quality",
    difficulty: 3,
    pointValue: 15
  }
];

interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  domain: string;
  difficulty: number;
  pointValue: number;
}

interface AssessmentResult {
  teacherId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  domainStrengths: Record<string, number>;
  domainWeaknesses: Record<string, number>;
  difficulty: number;
  pointsEarned: number;
  timeTaken: number;
  completedAt: Date;
}

interface BasicAIAssessmentProps {
  teacherId: number;
  teacherName: string;
  onComplete: (results: AssessmentResult) => void;
}

const BasicAIAssessment: React.FC<BasicAIAssessmentProps> = ({ 
  teacherId, 
  teacherName, 
  onComplete 
}) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(1); // Start at difficulty level 1
  const [domainResults, setDomainResults] = useState<Record<string, { correct: number, total: number }>>({}); // Track performance by domain
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (answeredQuestions / questions.length) * 100;
  
  // Initializes questions from sample data
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
        setStartTime(new Date());
      } catch (error) {
        console.error("Error loading questions:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [toast]);

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;

    const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setIsAnswerSubmitted(true);
    setAnsweredQuestions(prev => prev + 1);

    // Update domain results
    const domain = currentQuestion.domain;
    setDomainResults(prev => {
      const currentDomainStats = prev[domain] || { correct: 0, total: 0 };
      return {
        ...prev,
        [domain]: {
          correct: isAnswerCorrect ? currentDomainStats.correct + 1 : currentDomainStats.correct,
          total: currentDomainStats.total + 1
        }
      };
    });

    // Update correct answers count and points
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setPointsEarned(prev => prev + currentQuestion.pointValue);
      
      // Show confetti for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleNextQuestion = () => {
    // Reset state for next question
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    
    // Move to next question or complete assessment
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  // Complete the assessment and submit results
  const completeAssessment = () => {
    const endTime = new Date();
    const timeTaken = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    
    // Calculate domain strengths and weaknesses
    const domainPerformance: Record<string, number> = {};
    Object.entries(domainResults).forEach(([domain, stats]) => {
      domainPerformance[domain] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });
    
    // Sort domains by performance
    const sortedDomains = Object.entries(domainPerformance)
      .sort(([, percentA], [, percentB]) => percentB - percentA);
    
    // Get top and bottom domains
    const domainStrengths: Record<string, number> = {};
    const domainWeaknesses: Record<string, number> = {};
    
    // Add top domains to strengths
    sortedDomains.slice(0, Math.ceil(sortedDomains.length / 2)).forEach(([domain, percent]) => {
      domainStrengths[domain] = percent;
    });
    
    // Add bottom domains to weaknesses
    sortedDomains.slice(Math.floor(sortedDomains.length / 2)).forEach(([domain, percent]) => {
      domainWeaknesses[domain] = percent;
    });
    
    // Create results object
    const results: AssessmentResult = {
      teacherId,
      score: Math.round((correctAnswers / questions.length) * 100),
      totalQuestions: questions.length,
      correctAnswers,
      domainStrengths,
      domainWeaknesses,
      difficulty: currentDifficulty,
      pointsEarned,
      timeTaken,
      completedAt: new Date()
    };
    
    // Show a celebratory confetti explosion
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6 },
      colors: ['#FFC107', '#4CAF50', '#2196F3']
    });
    
    // Pass results to the parent component
    onComplete(results);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-600">Loading assessment questions...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardTitle className="flex justify-between items-center">
          <span>Early Childhood Education Assessment</span>
          <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1}/{questions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1 text-sm text-gray-500">
            <span>{answeredQuestions} of {questions.length} questions</span>
            <span>{pointsEarned} points earned</span>
          </div>
        </div>
        
        {/* Question display */}
        {currentQuestion && (
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                {currentQuestion.domain}
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                {currentQuestion.pointValue} points
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
            
            {/* Answer options */}
            <RadioGroup value={selectedAnswer || ""} className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                  isAnswerSubmitted 
                    ? option === currentQuestion.correctAnswer 
                      ? 'border-green-300 bg-green-50' 
                      : selectedAnswer === option 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-200'
                    : 'border-gray-200 hover:border-blue-200 cursor-pointer'
                }`} onClick={() => handleAnswerSelect(option)}>
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${index}`} 
                    disabled={isAnswerSubmitted}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Submit/Next button */}
            <div className="mt-6 flex justify-end">
              {!isAnswerSubmitted ? (
                <Button 
                  onClick={handleAnswerSubmit} 
                  disabled={!selectedAnswer}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Feedback after answering */}
        {isAnswerSubmitted && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className="font-semibold mb-2">
              {isCorrect 
                ? `Correct! ${teacherName ? `Great job, ${teacherName}!` : 'Great job!'}`
                : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
              }
            </p>
            <p className="text-gray-700">{currentQuestion.explanation}</p>
            <p className="mt-2 font-semibold">
              {isCorrect 
                ? `+${currentQuestion.pointValue} points!` 
                : "Keep learning - you will get it next time!"}
            </p>
          </div>
        )}
        
        {/* Encouragement message */}
        {answeredQuestions > 0 && (
          <div className="mt-6 text-center text-blue-700 font-medium">
            {correctAnswers === answeredQuestions 
              ? "You're doing amazing! Keep it up!" 
              : "You're making good progress! Keep going!"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasicAIAssessment;