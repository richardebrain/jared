import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle, ArrowRight, RefreshCcw, HelpCircle, AlertTriangle } from "lucide-react";
import confetti from 'canvas-confetti';

// Question type definition
interface Question {
  id: number;
  text: string;
  domain: string;
  subDomain?: string;
  difficulty: number;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

interface AIAssessmentProps {
  onComplete?: (score: number, totalPoints: number) => void;
  onCancel?: () => void;
  maxQuestions?: number;
  domains?: string[];
  initialDifficulty?: number;
}

// Function to fetch questions from the database
const fetchDatabaseQuestions = async (): Promise<Question[]> => {
  try {
    const response = await fetch('/api/assessment/questions');
    
    if (!response.ok) {
      // Fall back to our predefined questions if API fails
      console.log("Using fallback questions due to API error");
      return fallbackQuestions;
    }
    
    const data = await response.json();
    
    // Transform the data to our expected format
    const formattedQuestions = data.map((q: any) => ({
      id: q.id,
      text: q.question || q.text,
      domain: q.domain || "General ECE Knowledge",
      subDomain: q.sub_domain,
      difficulty: q.difficulty || 1,
      options: q.options || [
        { id: "A", text: q.option_a || "Option A" },
        { id: "B", text: q.option_b || "Option B" },
        { id: "C", text: q.option_c || "Option C" },
        { id: "D", text: q.option_d || "Option D" }
      ],
      correctAnswer: q.correct_answer || q.answer || "A",
      explanation: q.explanation || "No explanation provided.",
      points: q.points_value || (q.difficulty || 1) * 5
    }));
    
    return formattedQuestions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return fallbackQuestions;
  }
};

// Curated fallback questions that will be used if the API fails
const fallbackQuestions: Question[] = [
  {
    id: 1,
    text: "Which of the following best describes an appropriate developmental expectation for a 3-year-old child?",
    domain: "Child Development",
    subDomain: "Developmental Milestones",
    difficulty: 1,
    options: [
      { id: "A", text: "Reading simple three-letter words" },
      { id: "B", text: "Speaking in simple sentences and following two-step directions" },
      { id: "C", text: "Writing their first and last name" },
      { id: "D", text: "Tying their own shoes" }
    ],
    correctAnswer: "B",
    explanation: "At 3 years old, children typically speak in simple sentences of 3-4 words and can follow basic two-step directions. Reading words, writing names, and tying shoes are skills that develop later.",
    points: 10
  },
  {
    id: 2,
    text: "Which classroom arrangement best supports both quiet and active play for preschoolers?",
    domain: "Learning Environment",
    subDomain: "Room Arrangement",
    difficulty: 1,
    options: [
      { id: "A", text: "Arranging all activities around the perimeter of the room" },
      { id: "B", text: "Creating one large open space in the center for all activities" },
      { id: "C", text: "Dividing the room into well-defined interest centers with both noisy and quiet areas" },
      { id: "D", text: "Keeping all materials in cabinets until needed for specific activities" }
    ],
    correctAnswer: "C",
    explanation: "Dividing the classroom into well-defined interest centers allows for separation of noisy and quiet activities. This arrangement helps children understand behavior expectations in different areas and supports various types of play simultaneously.",
    points: 10
  },
  {
    id: 3,
    text: "What is the primary purpose of the 'Zone of Proximal Development' in early childhood education?",
    domain: "Educational Theory",
    subDomain: "Vygotsky",
    difficulty: 2,
    options: [
      { id: "A", text: "To ensure children are always comfortable with learning activities" },
      { id: "B", text: "To identify the gap between what a child can do independently and what they can do with support" },
      { id: "C", text: "To group children with exactly the same abilities together" },
      { id: "D", text: "To keep children in their preferred learning areas" }
    ],
    correctAnswer: "B",
    explanation: "The Zone of Proximal Development (ZPD), a concept developed by Vygotsky, refers to the range of tasks that a child can perform with the guidance and assistance of adults or more skilled peers, but cannot yet accomplish independently. This concept is fundamental for scaffolding instruction.",
    points: 15
  },
  {
    id: 4,
    text: "Which approach is most appropriate when a preschooler is having difficulty sharing toys?",
    domain: "Social-Emotional Development",
    subDomain: "Conflict Resolution",
    difficulty: 1,
    options: [
      { id: "A", text: "Immediately remove the toy and give it to another child" },
      { id: "B", text: "Ignore the behavior to avoid reinforcing it" },
      { id: "C", text: "Model sharing language and coach the child through the interaction" },
      { id: "D", text: "Tell the child they cannot play with any toys for the rest of the day" }
    ],
    correctAnswer: "C",
    explanation: "Modeling and coaching children through difficult social interactions helps them develop the language and skills they need to navigate similar situations in the future. This approach supports the development of social-emotional skills while respecting the child's feelings.",
    points: 10
  },
  {
    id: 5,
    text: "What is the primary benefit of incorporating open-ended materials in the preschool classroom?",
    domain: "Curriculum",
    subDomain: "Materials",
    difficulty: 1,
    options: [
      { id: "A", text: "They are usually less expensive than other materials" },
      { id: "B", text: "They encourage creativity, problem-solving, and can be used in multiple ways" },
      { id: "C", text: "They require less teacher supervision" },
      { id: "D", text: "They are easier to clean and maintain" }
    ],
    correctAnswer: "B",
    explanation: "Open-ended materials, such as blocks, clay, and fabric, can be used in countless ways and encourage children to think creatively, solve problems, and express their ideas in unique ways. These materials support divergent thinking and allow for differentiated learning experiences.",
    points: 10
  },
  {
    id: 6,
    text: "According to attachment theory, secure attachment in early childhood is most strongly associated with:",
    domain: "Social-Emotional Development",
    subDomain: "Attachment Theory",
    difficulty: 2,
    options: [
      { id: "A", text: "Independence from caregivers at an early age" },
      { id: "B", text: "Consistent, responsive caregiving that meets the child's needs" },
      { id: "C", text: "Strict discipline and clear boundaries" },
      { id: "D", text: "Allowing children to cry it out to build resilience" }
    ],
    correctAnswer: "B",
    explanation: "Secure attachment develops when caregivers consistently respond to a child's needs in sensitive and appropriate ways. This secure base allows children to explore their environment with confidence, knowing their caregiver will be there when needed. Secure attachment is associated with positive social-emotional development and better outcomes later in life.",
    points: 15
  },
  {
    id: 7,
    text: "Which observational assessment method provides the most detailed narrative of a child's behavior over time?",
    domain: "Assessment",
    subDomain: "Observation Methods",
    difficulty: 2,
    options: [
      { id: "A", text: "Checklists" },
      { id: "B", text: "Rating scales" },
      { id: "C", text: "Running records" },
      { id: "D", text: "Time sampling" }
    ],
    correctAnswer: "C",
    explanation: "Running records provide a detailed, sequential account of a child's behavior during a specific time period. This method captures the context, interactions, and exact sequence of events, making it particularly valuable for understanding complex behaviors and interactions. Other methods like checklists and rating scales are more structured but provide less detailed information.",
    points: 15
  },
  {
    id: 8,
    text: "Which of the following is NOT considered a developmentally appropriate practice in early childhood education?",
    domain: "DAP",
    subDomain: "Principles",
    difficulty: 1,
    options: [
      { id: "A", text: "Providing choices within structured activities" },
      { id: "B", text: "Expecting all children of the same age to develop skills at the same rate" },
      { id: "C", text: "Adapting curriculum based on individual children's interests" },
      { id: "D", text: "Incorporating play-based learning opportunities" }
    ],
    correctAnswer: "B",
    explanation: "Developmentally Appropriate Practice recognizes that children develop at different rates, even when they are the same chronological age. Expecting all children to develop skills at the same rate contradicts this foundational principle. DAP emphasizes the importance of responding to individual differences in development and learning.",
    points: 10
  },
  {
    id: 9,
    text: "What is the primary purpose of implementing a project-based approach in early childhood education?",
    domain: "Curriculum",
    subDomain: "Project Approach",
    difficulty: 3,
    options: [
      { id: "A", text: "To make lesson planning easier for teachers" },
      { id: "B", text: "To ensure all academic standards are covered systematically" },
      { id: "C", text: "To engage children in in-depth investigation of topics of interest over an extended period" },
      { id: "D", text: "To reduce the amount of materials needed in the classroom" }
    ],
    correctAnswer: "C",
    explanation: "The project approach involves children in in-depth investigation of topics that interest them, usually over an extended period. This approach promotes deep learning, encourages children to make connections across content areas, and develops skills in research, collaboration, and communication. Projects typically emerge from children's questions and involve active investigation and representation of findings.",
    points: 20
  },
  {
    id: 10,
    text: "In the context of executive function skills, what is 'inhibitory control'?",
    domain: "Cognitive Development",
    subDomain: "Executive Function",
    difficulty: 3,
    options: [
      { id: "A", text: "The ability to remember multiple-step instructions" },
      { id: "B", text: "The ability to redirect attention as needed and resist distraction" },
      { id: "C", text: "The ability to adjust behavior based on different rules in different settings" },
      { id: "D", text: "The ability to understand that others have different thoughts and feelings" }
    ],
    correctAnswer: "B",
    explanation: "Inhibitory control is the ability to resist a strong inclination to do one thing and instead do what is most appropriate or needed. This includes resisting distractions, delaying gratification, and stopping an automatic response. It's one of the core executive function skills that develops during early childhood and is crucial for self-regulation and school readiness.",
    points: 20
  }
];

// Encouraging messages for correct answers based on question difficulty
const encouragingMessages = {
  1: [
    "Great job! You've got the basics down!",
    "Nicely done! That's correct!",
    "You're right! Keep up the good work!",
    "Perfect! You know your fundamentals well!"
  ],
  2: [
    "Excellent! That was a tricky one!",
    "Impressive knowledge! That's correct!",
    "Well done! That shows real understanding!",
    "You got it! That's some solid ECE knowledge!"
  ],
  3: [
    "Outstanding! That's advanced knowledge!",
    "Exceptional work! You really know your stuff!",
    "Brilliant! You've mastered this challenging concept!",
    "Amazing! You're showing expert-level understanding!"
  ]
};

export default function AIAssessment({ 
  onComplete, 
  onCancel, 
  maxQuestions = 5,
  domains = [], 
  initialDifficulty = 1
}: AIAssessmentProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(initialDifficulty);

  // Fetch user data to track points earned
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Load questions from database or fallback
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const questionData = await fetchDatabaseQuestions();
        
        if (questionData && questionData.length > 0) {
          setAllQuestions(questionData);
          
          // Select questions based on domains and difficulty if specified
          let filteredQuestions = questionData;
          
          if (domains.length > 0) {
            filteredQuestions = filteredQuestions.filter(q => domains.includes(q.domain));
          }
          
          // If we don't have enough questions after filtering, use all questions
          if (filteredQuestions.length < maxQuestions) {
            filteredQuestions = questionData;
          }
          
          // Shuffle and select a subset
          const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, maxQuestions));
        } else {
          // If no questions returned, use fallback
          const shuffled = [...fallbackQuestions].sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, maxQuestions));
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        // Use fallback questions in case of error
        const shuffled = [...fallbackQuestions].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, maxQuestions));
      } finally {
        setIsLoading(false);
        setStartTime(new Date());
      }
    };
    
    loadQuestions();
  }, [domains, maxQuestions, initialDifficulty]);

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Get a random encouraging message based on difficulty
  const getRandomEncouragingMessage = (difficulty: number): string => {
    const messages = encouragingMessages[difficulty as keyof typeof encouragingMessages] || encouragingMessages[1];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Handle answer selection
  const handleAnswerSelect = (optionId: string) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(optionId);
    setHasAnswered(true);
    
    // Calculate response time
    if (startTime) {
      const endTime = new Date();
      const timeDiff = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
      setResponseTime(Math.round(timeDiff));
    }

    // Check if answer is correct
    const isCorrect = optionId === currentQuestion.correctAnswer;
    
    // Update score
    if (isCorrect) {
      setScore(prev => prev + 1);
      setTotalPoints(prev => prev + currentQuestion.points);
      
      // Trigger confetti for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setFeedbackMessage(getRandomEncouragingMessage(currentQuestion.difficulty));
    } else {
      setFeedbackMessage(`Not quite. The correct answer is ${currentQuestion.correctAnswer}.`);
    }

    // Record answer in backend (if connected to API)
    try {
      // This is optional and can be implemented later to record answers
      fetch('/api/assessment/record-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userId: user?.id,
          answer: optionId,
          isCorrect,
          points: isCorrect ? currentQuestion.points : 0,
          responseTime: responseTime,
        }),
      }).catch(err => console.log("Failed to record answer but continuing assessment"));
    } catch (error) {
      console.error('Failed to record answer:', error);
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setStartTime(new Date());
      setResponseTime(null);
      setFeedbackMessage(null);
      
      // Adjust difficulty based on performance
      if (currentQuestionIndex > 1) {
        const recentCorrectRate = score / (currentQuestionIndex + 1);
        if (recentCorrectRate > 0.8 && currentDifficulty < 3) {
          setCurrentDifficulty(prev => Math.min(prev + 1, 3));
        } else if (recentCorrectRate < 0.4 && currentDifficulty > 1) {
          setCurrentDifficulty(prev => Math.max(prev - 1, 1));
        }
      }
    } else {
      // Assessment complete
      setAssessmentComplete(true);
      
      // Celebration on completion
      confetti({
        particleCount: 300,
        spread: 180,
        origin: { y: 0.6 }
      });

      // Record assessment completion in backend
      try {
        fetch('/api/assessment/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            score,
            totalPoints,
          }),
        }).catch(err => console.log("Failed to record assessment completion but continuing"));
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(score, totalPoints);
        }
      } catch (error) {
        console.error('Failed to record assessment completion:', error);
      }
    }
  };

  // Calculate progress
  const progress = ((currentQuestionIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100;

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-8 flex justify-center items-center">
          <div className="flex items-center gap-4">
            <RefreshCcw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-lg">Loading assessment questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="mb-8">
        <CardContent className="p-8 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <p className="text-lg font-medium">Unable to load assessment questions</p>
            <p className="text-gray-600">Please try again later or contact support if the problem persists.</p>
            {onCancel && (
              <Button onClick={onCancel} className="mt-4">
                Return to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assessmentComplete) {
    return (
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardTitle className="text-2xl font-bold">Assessment Complete!</CardTitle>
          <CardDescription className="text-white opacity-90">
            You've completed the knowledge assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Great job!</h2>
            <p className="text-gray-500 mb-4">Here's how you did</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 mb-1">Score</p>
              <p className="text-3xl font-bold">{score} / {questions.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 mb-1">Points Earned</p>
              <p className="text-3xl font-bold">{totalPoints}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {onCancel && (
              <Button 
                onClick={onCancel}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                Return to Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {currentQuestion.domain}
              </Badge>
              <CardTitle className="text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            </div>
            <Badge 
              className={`text-sm px-3 py-1 ${
                currentQuestion.difficulty === 1
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : currentQuestion.difficulty === 2
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }`}
            >
              {currentQuestion.difficulty === 1
                ? "Basic"
                : currentQuestion.difficulty === 2
                ? "Intermediate"
                : "Advanced"
              }
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={hasAnswered}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  hasAnswered && option.id === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : hasAnswered && option.id === selectedAnswer
                    ? "border-red-500 bg-red-50"
                    : selectedAnswer === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center">
                  <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium mr-3 ${
                    hasAnswered && option.id === currentQuestion.correctAnswer
                      ? "bg-green-500 text-white"
                      : hasAnswered && option.id === selectedAnswer
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {option.id}
                  </span>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start pt-0">
          {hasAnswered && (
            <div className={`mt-4 p-4 rounded-lg w-full ${
              selectedAnswer === currentQuestion.correctAnswer
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-start mb-2">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                )}
                <p className={`font-medium ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? "text-green-700"
                    : "text-red-700"
                }`}>
                  {feedbackMessage}
                </p>
              </div>
              <p className="text-gray-700 ml-7">
                {currentQuestion.explanation}
              </p>
              <div className="flex items-center ml-7 mt-3">
                <Award className="text-yellow-500 h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? `+${currentQuestion.points} points earned!`
                    : "0 points earned"
                  }
                </span>
              </div>
            </div>
          )}
          
          <div className="w-full flex justify-between mt-4">
            {onCancel && !hasAnswered && (
              <Button 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <div className="ml-auto">
              {hasAnswered && (
                <Button 
                  onClick={handleNextQuestion} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Assessment"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center">
          <Award className="h-4 w-4 mr-1 text-yellow-500" />
          <span>Points: {totalPoints}</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          <span>Score: {score} / {hasAnswered ? currentQuestionIndex + 1 : currentQuestionIndex}</span>
        </div>
      </div>
    </>
  );
}