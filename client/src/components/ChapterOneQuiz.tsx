import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle, XCircle, Brain, MessageSquare, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface ChapterOneQuizProps {
  moduleId: number;
  onComplete?: (score: number) => void;
}

// Quiz questions for Chapter 1
const quizQuestions = [
  {
    id: "ch1-q1",
    question: "What percentage of a child's brain develops by age 5?",
    options: [
      { id: "a", text: "50%" },
      { id: "b", text: "75%" },
      { id: "c", text: "90%" },
      { id: "d", text: "100%" }
    ],
    correctOptionId: "c",
    explanation: "Research shows that 90% of a child's brain development happens by age 5, making early childhood education crucial for long-term outcomes."
  },
  {
    id: "ch1-q2",
    question: "Which of the following best describes 'serve and return' interactions?",
    options: [
      { id: "a", text: "A playground game that helps build motor skills" },
      { id: "b", text: "Responsive back-and-forth communication between adults and children" },
      { id: "c", text: "A method of teaching children to share toys" },
      { id: "d", text: "A behavior management technique" }
    ],
    correctOptionId: "b",
    explanation: "Serve and return interactions are responsive back-and-forth communications that build neural connections in a child's developing brain."
  },
  {
    id: "ch1-q3",
    question: "What is a key principle of attachment theory?",
    options: [
      { id: "a", text: "Children should be independent from an early age" },
      { id: "b", text: "Secure attachments form the foundation for healthy development" },
      { id: "c", text: "Children should have multiple caregivers to avoid attachment issues" },
      { id: "d", text: "Attachment only matters in the first six months of life" }
    ],
    correctOptionId: "b",
    explanation: "Secure attachments to caregivers form the foundation for healthy emotional development, self-regulation, and relationships throughout life."
  },
  {
    id: "ch1-q4",
    question: "What is an Adverse Childhood Experience (ACE)?",
    options: [
      { id: "a", text: "A difficult homework assignment" },
      { id: "b", text: "A standardized test for early childhood development" },
      { id: "c", text: "A potentially traumatic event during childhood" },
      { id: "d", text: "A teaching method for children with learning difficulties" }
    ],
    correctOptionId: "c",
    explanation: "ACEs are potentially traumatic events that occur in childhood, such as experiencing or witnessing violence, abuse, or neglect."
  },
  {
    id: "ch1-q5",
    question: "How can teachers help children who have experienced trauma?",
    options: [
      { id: "a", text: "Ignore past trauma and focus only on academic skills" },
      { id: "b", text: "Talk about their trauma experiences frequently in class" },
      { id: "c", text: "Provide a predictable routine and safe environment" },
      { id: "d", text: "Give them harder challenges to build resilience" }
    ],
    correctOptionId: "c",
    explanation: "Creating a predictable routine and safe environment helps children who have experienced trauma feel secure and builds trust."
  },
  {
    id: "ch1-q6",
    question: "What is the role of executive function in early childhood development?",
    options: [
      { id: "a", text: "It determines a child's IQ score" },
      { id: "b", text: "It helps children learn to read and write" },
      { id: "c", text: "It refers to skills like working memory, self-control, and mental flexibility" },
      { id: "d", text: "It only develops after children start elementary school" }
    ],
    correctOptionId: "c",
    explanation: "Executive function includes skills like working memory, self-control, and mental flexibility, which are crucial for learning and development."
  },
  {
    id: "ch1-q7",
    question: "How does toxic stress affect a child's development?",
    options: [
      { id: "a", text: "It has no long-term effects if the child is resilient" },
      { id: "b", text: "It can disrupt brain architecture and affect health throughout life" },
      { id: "c", text: "It only affects intellectual development, not physical health" },
      { id: "d", text: "It disappears once the stressor is removed" }
    ],
    correctOptionId: "b",
    explanation: "Toxic stress can disrupt brain architecture and negatively impact physical and mental health throughout a person's life."
  },
  {
    id: "ch1-q8",
    question: "What is the concept of 'windows of opportunity' in brain development?",
    options: [
      { id: "a", text: "The importance of having windows in classrooms" },
      { id: "b", text: "Specific times to teach academic subjects" },
      { id: "c", text: "Critical periods when specific neural circuits are especially receptive to environmental influences" },
      { id: "d", text: "Brief moments when children are paying attention" }
    ],
    correctOptionId: "c",
    explanation: "Windows of opportunity are critical periods when specific neural circuits are especially receptive to environmental influences and learning."
  },
  {
    id: "ch1-q9",
    question: "How does play contribute to brain development?",
    options: [
      { id: "a", text: "It only helps with physical development" },
      { id: "b", text: "It has no significant impact on brain development" },
      { id: "c", text: "It builds neural connections across multiple areas of the brain" },
      { id: "d", text: "It only matters for social development" }
    ],
    correctOptionId: "c",
    explanation: "Play builds neural connections across multiple areas of the brain, supporting cognitive, social, emotional, and physical development."
  },
  {
    id: "ch1-q10",
    question: "What metaphor does the module use to describe a teacher's role in early childhood?",
    options: [
      { id: "a", text: "Building a solid foundation" },
      { id: "b", text: "Writing the first chapter of children's lives" },
      { id: "c", text: "Planting seeds for the future" },
      { id: "d", text: "Opening doors of opportunity" }
    ],
    correctOptionId: "b",
    explanation: "The module uses the metaphor of 'writing the first chapter of children's lives' to describe the profound impact teachers have on early development."
  }
];

export default function ChapterOneQuiz({ moduleId, onComplete }: ChapterOneQuizProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const allAnswered = Object.keys(answers).length === quizQuestions.length;
  const correctAnswersCount = quizQuestions.filter(q => answers[q.id] === q.correctOptionId).length;
  const score = Math.round((correctAnswersCount / quizQuestions.length) * 100);
  const isPassing = score >= 80; // Require 80% to pass for 20 points
  
  // Save progress mutation
  const saveProgress = useMutation({
    mutationFn: async (data: {
      moduleId: number;
      progress: number;
      completed: boolean;
      score: number;
    }) => {
      // Award 20 points for Chapter 1 completion if score is 80% or better
      const pointsEarned = data.score >= 80 ? 20 : 0;
      return apiRequest("POST", "/api/progress", {
        ...data,
        pointsEarned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      if (isPassing) {
        // Show confetti for passing score
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      if (onComplete) {
        onComplete(score);
      }
    },
    onError: () => {
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your quiz results. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(false);
    }
  };
  
  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  const handleSubmitQuiz = () => {
    setIsSubmitting(true);
    
    saveProgress.mutate({
      moduleId,
      progress: 100,
      completed: true,
      score
    });
    
    setQuizCompleted(true);
    setIsSubmitting(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {!showResults ? (
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Chapter 1: Building a Human</CardTitle>
                <CardDescription>Quiz Assessment</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </Badge>
            </div>
            <Progress 
              value={(currentQuestionIndex / quizQuestions.length) * 100} 
              className="h-2 mt-2"
            />
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-xl font-medium text-gray-900">
                {currentQuestion.question}
              </div>
              
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center rounded-lg border p-4 ${
                      answers[currentQuestion.id] === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={`${currentQuestion.id}-${option.id}`}
                      className="mr-3"
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${option.id}`}
                      className="flex-grow cursor-pointer"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <AnimatePresence>
                {showExplanation && answers[currentQuestion.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-lg ${
                      answers[currentQuestion.id] === currentQuestion.correctOptionId
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-start">
                      {answers[currentQuestion.id] === currentQuestion.correctOptionId ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          answers[currentQuestion.id] === currentQuestion.correctOptionId
                            ? "text-green-800"
                            : "text-red-800"
                        }`}>
                          {answers[currentQuestion.id] === currentQuestion.correctOptionId
                            ? "Correct!"
                            : `Incorrect. The correct answer is option ${
                                currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId)?.id.toUpperCase()
                              }.`
                          }
                        </p>
                        <p className="mt-1 text-gray-700">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
            <div>
              {currentQuestionIndex > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevQuestion}
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              {!showExplanation && answers[currentQuestion.id] && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowExplanation(true)}
                >
                  Show Explanation
                </Button>
              )}
              
              <Button
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestion.id]}
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "View Results"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Chapter 1: Quiz Results</CardTitle>
                <CardDescription>Your understanding of early childhood development</CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  isPassing 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-amber-100 text-amber-700 border-amber-200"
                }`}
              >
                Score: {score}%
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center ${
                isPassing 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                <div className="text-4xl font-bold">{score}%</div>
              </div>
              
              <h3 className={`text-xl font-bold mt-4 ${
                isPassing ? "text-green-700" : "text-amber-700"
              }`}>
                {isPassing 
                  ? "Congratulations!" 
                  : "Almost there!"}
              </h3>
              
              <p className="mt-2 text-gray-600">
                {isPassing 
                  ? "You've successfully completed the Chapter 1 assessment." 
                  : "Review the module material and try again to improve your score."}
              </p>
              
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Badge variant="outline" className="py-1.5 px-3">
                  <Brain className="h-4 w-4 mr-1" />
                  {correctAnswersCount} correct
                </Badge>
                <Badge variant="outline" className="py-1.5 px-3">
                  <XCircle className="h-4 w-4 mr-1" />
                  {quizQuestions.length - correctAnswersCount} incorrect
                </Badge>
              </div>
            </div>
            
            {isPassing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Award className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Chapter One Storybuilder Badge Earned!</h4>
                    <p className="text-blue-700 mt-1">
                      You've earned the Chapter One Storybuilder badge. This recognizes your understanding of early childhood development and the crucial role teachers play in shaping children's futures.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start">
                <HeartHandshake className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800">Key Takeaway</h4>
                  <p className="text-green-700 mt-1">
                    Remember that as an early childhood educator, you are writing the first chapter of children's lives. The relationships, experiences, and environments you create have a profound impact on children's brain development and future outcomes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}
            >
              Review Questions
            </Button>
            
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || quizCompleted}
              className={`${isPassing ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {isSubmitting 
                ? "Submitting..." 
                : quizCompleted 
                  ? "Completed!" 
                  : "Complete Module"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}