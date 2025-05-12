import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";
import { useLocation } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Assessment questions
const questions = [
  {
    id: 1,
    question: "How would you rate your current speaking ability in your target language?",
    options: [
      { id: "a", text: "Beginner - I know a few words and phrases" },
      { id: "b", text: "Elementary - I can have basic conversations" },
      { id: "c", text: "Intermediate - I can discuss familiar topics" },
      { id: "d", text: "Advanced - I can express myself fluently on most topics" },
      { id: "e", text: "Near-native - I'm comfortable in almost all situations" }
    ]
  },
  {
    id: 2,
    question: "How well can you understand native speakers in your target language?",
    options: [
      { id: "a", text: "I can only understand a few words" },
      { id: "b", text: "I can understand simple, slow speech" },
      { id: "c", text: "I can understand normal conversations on familiar topics" },
      { id: "d", text: "I can understand most content with occasional difficulty" },
      { id: "e", text: "I can understand nearly everything at native speed" }
    ]
  },
  {
    id: 3,
    question: "How comfortable are you with reading in your target language?",
    options: [
      { id: "a", text: "I can recognize a few words" },
      { id: "b", text: "I can read simple texts with a dictionary" },
      { id: "c", text: "I can read everyday materials with occasional help" },
      { id: "d", text: "I can read most texts without much difficulty" },
      { id: "e", text: "I can read almost anything with ease" }
    ]
  },
  {
    id: 4,
    question: "How would you rate your writing skills in your target language?",
    options: [
      { id: "a", text: "I can write a few basic phrases" },
      { id: "b", text: "I can write simple messages and notes" },
      { id: "c", text: "I can write personal letters and basic texts" },
      { id: "d", text: "I can write detailed texts on various topics" },
      { id: "e", text: "I can write complex texts with good structure" }
    ]
  },
  {
    id: 5,
    question: "What is your primary goal for learning this language?",
    options: [
      { id: "a", text: "Travel and basic communication" },
      { id: "b", text: "Social interaction with native speakers" },
      { id: "c", text: "Academic or educational purposes" },
      { id: "d", text: "Professional or business needs" },
      { id: "e", text: "Cultural appreciation and immersion" }
    ]
  },
  {
    id: 6,
    question: "How much time can you dedicate to language learning each week?",
    options: [
      { id: "a", text: "Less than 2 hours" },
      { id: "b", text: "2-4 hours" },
      { id: "c", text: "5-7 hours" },
      { id: "d", text: "8-10 hours" },
      { id: "e", text: "More than 10 hours" }
    ]
  },
  {
    id: 7,
    question: "Which aspects of language learning do you find most challenging?",
    options: [
      { id: "a", text: "Speaking and pronunciation" },
      { id: "b", text: "Listening comprehension" },
      { id: "c", text: "Grammar rules" },
      { id: "d", text: "Vocabulary acquisition" },
      { id: "e", text: "Writing skills" }
    ]
  },
  {
    id: 8,
    question: "How do you prefer to learn a new language?",
    options: [
      { id: "a", text: "Through conversation practice" },
      { id: "b", text: "Through reading and writing" },
      { id: "c", text: "Through structured grammar lessons" },
      { id: "d", text: "Through immersive content (movies, music)" },
      { id: "e", text: "Through a mix of different methods" }
    ]
  },
  {
    id: 9,
    question: "Have you formally studied your target language before?",
    options: [
      { id: "a", text: "No, I'm a complete beginner" },
      { id: "b", text: "Yes, for less than 6 months" },
      { id: "c", text: "Yes, for 6 months to 1 year" },
      { id: "d", text: "Yes, for 1-3 years" },
      { id: "e", text: "Yes, for more than 3 years" }
    ]
  },
  {
    id: 10,
    question: "What type of practice partner would you prefer?",
    options: [
      { id: "a", text: "Another learner at my level" },
      { id: "b", text: "A more advanced learner" },
      { id: "c", text: "A native speaker with teaching experience" },
      { id: "d", text: "A native speaker without teaching experience" },
      { id: "e", text: "I prefer group practice sessions" }
    ]
  }
];

export default function Assessment() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  
  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });
  
  // Submit assessment mutation
  const { mutate: submitAssessment, isPending } = useMutation({
    mutationFn: async (data: { userId: number; results: Record<number, string>; score?: number }) => {
      const response = await apiRequest("POST", "/api/assessments", {
        userId: data.userId,
        results: data.results,
        score: data.score,
        completed: true
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment completed",
        description: "Your personalized learning path is ready!",
      });
      setCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving assessment",
        description: error.message || "There was an error saving your assessment results.",
        variant: "destructive",
      });
    },
  });
  
  // Handle option selection
  const handleOptionSelect = (value: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value
    });
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Submit assessment
      if (user) {
        submitAssessment({
          userId: user.id,
          results: answers,
          score: calculateScore()
        });
      } else {
        toast({
          title: "User not found",
          description: "Please log in to save your assessment results.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Calculate a simple score based on answers
  const calculateScore = () => {
    const valueMap: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    let total = 0;
    
    Object.values(answers).forEach(answer => {
      total += valueMap[answer] || 0;
    });
    
    // Return average scaled to 0-100
    return Math.round((total / (questions.length * 5)) * 100);
  };
  
  // Progress percentage
  const progressPercentage = ((Object.keys(answers).length + (completed ? 1 : 0)) / questions.length) * 100;
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neutral-800 mb-2">
            Language Proficiency Assessment
          </h1>
          <p className="text-neutral-800 mb-6">
            This assessment will help us create a personalized learning experience for you.
          </p>
          
          <Progress value={progressPercentage} className="mb-8" />
          
          {!completed ? (
            <Card>
              <CardHeader>
                <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
                <CardDescription>
                  Select the option that best describes your current situation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h2 className="text-xl font-heading font-semibold mb-4">
                    {questions[currentQuestion].question}
                  </h2>
                  
                  <RadioGroup
                    value={answers[questions[currentQuestion].id] || ""}
                    onValueChange={handleOptionSelect}
                    className="space-y-3"
                  >
                    {questions[currentQuestion].options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary transition">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!answers[questions[currentQuestion].id] || isPending}
                >
                  {currentQuestion < questions.length - 1 ? "Next" : "Complete Assessment"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Assessment Complete!</CardTitle>
                <CardDescription>
                  Thank you for completing the language assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-4xl text-primary"></i>
                  </div>
                  
                  <h3 className="text-xl font-heading font-bold mb-2">
                    Your personalized learning path is ready
                  </h3>
                  
                  <p className="text-muted-foreground mb-4">
                    Based on your assessment, we've created a customized plan to help you achieve your language learning goals.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={() => setLocation("/")}>
                  Go to Dashboard
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      
      <ChatbotSupport />
    </div>
  );
}
