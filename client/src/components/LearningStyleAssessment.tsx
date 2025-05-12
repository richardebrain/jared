import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

// Learning style assessment questions
const learningStyleQuestions = [
  {
    id: "q1",
    text: "When learning a new skill, I prefer to:",
    options: [
      { id: "a", text: "Watch a video tutorial or demonstration", style: "visual" },
      { id: "b", text: "Listen to detailed verbal instructions", style: "auditory" },
      { id: "c", text: "Read instructions and follow step-by-step guides", style: "reading" },
      { id: "d", text: "Try it hands-on, learning through trial and error", style: "kinesthetic" },
    ],
  },
  {
    id: "q2",
    text: "When attending professional development, I learn best when:",
    options: [
      { id: "a", text: "Visual aids like charts, diagrams, and slides are used", style: "visual" },
      { id: "b", text: "The presenter explains concepts thoroughly through discussion", style: "auditory" },
      { id: "c", text: "I have written materials to follow along and take notes", style: "reading" },
      { id: "d", text: "I participate in interactive activities and practice exercises", style: "kinesthetic" },
    ],
  },
  {
    id: "q3",
    text: "When setting up my classroom, I prioritize:",
    options: [
      { id: "a", text: "Visual aesthetics and engaging displays for children to see", style: "visual" },
      { id: "b", text: "Good acoustics for clear communication and verbal instruction", style: "auditory" },
      { id: "c", text: "Well-organized labeled centers with written schedules", style: "reading" },
      { id: "d", text: "Hands-on activity stations where children can explore freely", style: "kinesthetic" },
    ],
  },
  {
    id: "q4",
    text: "When working with a child who is struggling, I'm most likely to:",
    options: [
      { id: "a", text: "Show them visual examples of what success looks like", style: "visual" },
      { id: "b", text: "Talk through the problem, asking guiding questions", style: "auditory" },
      { id: "c", text: "Provide written instructions or a checklist to follow", style: "reading" },
      { id: "d", text: "Guide them through physical practice with hands-on support", style: "kinesthetic" },
    ],
  },
  {
    id: "q5",
    text: "When planning curriculum, I tend to include:",
    options: [
      { id: "a", text: "Visual materials like picture books and illustrated posters", style: "visual" },
      { id: "b", text: "Songs, rhymes, and discussions with varied tone", style: "auditory" },
      { id: "c", text: "Stories, poems, and early literacy activities", style: "reading" },
      { id: "d", text: "Movement activities, sensory experiences, and building projects", style: "kinesthetic" },
    ],
  },
  {
    id: "q6",
    text: "I best remember information when I:",
    options: [
      { id: "a", text: "See it written or drawn out visually", style: "visual" },
      { id: "b", text: "Hear it explained in a conversation or presentation", style: "auditory" },
      { id: "c", text: "Read and take notes on the material", style: "reading" },
      { id: "d", text: "Physically do something related to the information", style: "kinesthetic" },
    ],
  },
  {
    id: "q7",
    text: "When teaching a new concept to children, I prefer to:",
    options: [
      { id: "a", text: "Use visual aids, pictures, and demonstrations", style: "visual" },
      { id: "b", text: "Explain it clearly with storytelling and discussion", style: "auditory" },
      { id: "c", text: "Write key points and have children follow along with text", style: "reading" },
      { id: "d", text: "Create hands-on experiments and physical activities", style: "kinesthetic" },
    ],
  },
  {
    id: "q8",
    text: "In team meetings, I contribute best by:",
    options: [
      { id: "a", text: "Creating visual models or presentations to explain ideas", style: "visual" },
      { id: "b", text: "Talking through concepts and verbal brainstorming", style: "auditory" },
      { id: "c", text: "Taking detailed notes and organizing written information", style: "reading" },
      { id: "d", text: "Role-playing scenarios or building physical prototypes", style: "kinesthetic" },
    ],
  },
];

// Type for learning style results
type LearningStyleResults = {
  visual: number;
  auditory: number;
  reading: number;
  kinesthetic: number;
  preferred: "visual" | "auditory" | "reading" | "kinesthetic" | null;
};

const initialResults = {
  visual: 0,
  auditory: 0,
  reading: 0,
  kinesthetic: 0,
  preferred: null,
};

export default function LearningStyleAssessment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<LearningStyleResults>(initialResults);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [, setLocation] = useLocation();
  
  const updateUser = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Learning Style Saved",
        description: "Your learning preferences have been saved and will be used to personalize your experience.",
        duration: 5000,
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save learning style: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Check if user already has learning style preferences
  useEffect(() => {
    if (user?.learningStyle?.preferred) {
      setResults(user.learningStyle);
      setIsComplete(true);
    }
  }, [user]);
  
  const handleAnswer = (questionId: string, optionStyle: string) => {
    // Save the answer
    setAnswers({
      ...answers,
      [questionId]: optionStyle,
    });
    
    // Move to next question or finish
    if (currentQuestionIndex < learningStyleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults();
    }
  };
  
  const calculateResults = () => {
    // Tally up style preferences
    const tally: LearningStyleResults = {
      visual: 0,
      auditory: 0,
      reading: 0,
      kinesthetic: 0,
      preferred: null,
    };
    
    // Count frequency of each learning style in answers
    Object.values(answers).forEach((style) => {
      if (style in tally) {
        tally[style as keyof Omit<LearningStyleResults, "preferred">] += 1;
      }
    });
    
    // Determine preferred learning style (highest score)
    let maxScore = 0;
    let preferredStyle: "visual" | "auditory" | "reading" | "kinesthetic" | null = null;
    
    Object.entries(tally).forEach(([style, score]) => {
      if (style !== "preferred" && score > maxScore) {
        maxScore = score;
        preferredStyle = style as any;
      }
    });
    
    tally.preferred = preferredStyle;
    setResults(tally);
    setIsComplete(true);
    
    // Save to user profile
    if (user) {
      updateUser.mutate({ learningStyle: tally });
    }
  };
  
  const resetAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsComplete(false);
    setResults(initialResults);
  };
  
  const renderStyleDescription = (style: string) => {
    switch (style) {
      case "visual":
        return "You learn best through seeing. Visual materials like videos, charts, and diagrams help you understand concepts.";
      case "auditory":
        return "You learn best through hearing. You benefit from discussions, verbal instructions, and audio materials.";
      case "reading":
        return "You learn best through reading and writing. Written instructions and taking notes enhance your learning.";
      case "kinesthetic":
        return "You learn best through doing. Hands-on activities and physical practice help you master new skills.";
      default:
        return "";
    }
  };
  
  const getStyleEmoji = (style: string) => {
    switch (style) {
      case "visual":
        return "👁️";
      case "auditory":
        return "👂";
      case "reading":
        return "📚";
      case "kinesthetic":
        return "🧩";
      default:
        return "";
    }
  };
  
  const currentQuestion = learningStyleQuestions[currentQuestionIndex];
  
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Learning Style Assessment</CardTitle>
              <CardDescription className="mt-2">
                Discover how you learn best so we can personalize your teaching journey
              </CardDescription>
            </div>
            {!isComplete && (
              <Badge variant="outline" className="text-sm py-1">
                Question {currentQuestionIndex + 1} of {learningStyleQuestions.length}
              </Badge>
            )}
          </div>
          {!isComplete && (
            <Progress 
              value={((currentQuestionIndex) / learningStyleQuestions.length) * 100} 
              className="mt-2"
            />
          )}
        </CardHeader>
        
        <CardContent className="pt-6 pb-4">
          {!isComplete ? (
            <div>
              <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(currentQuestion.id, option.style)}
                    className="w-full text-left p-4 border rounded-lg hover:border-primary transition-colors hover:bg-primary/5 flex items-center justify-between"
                  >
                    <span>{option.text}</span>
                    <span className="text-xl">{getStyleEmoji(option.style)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Your Learning Style Profile</h3>
                <p className="text-neutral-600 mb-4">
                  Based on your responses, here's how you prefer to learn:
                </p>
              </div>
              
              <div className="grid gap-4">
                {["visual", "auditory", "reading", "kinesthetic"].map((style) => (
                  <div key={style} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getStyleEmoji(style)}</span>
                        <span className="font-medium capitalize">{style}</span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {Math.round((results[style as keyof Omit<LearningStyleResults, "preferred">] / learningStyleQuestions.length) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(results[style as keyof Omit<LearningStyleResults, "preferred">] / learningStyleQuestions.length) * 100}
                      className={style === results.preferred ? "h-3" : "h-2"}
                    />
                  </div>
                ))}
              </div>
              
              {results.preferred && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{getStyleEmoji(results.preferred)}</span>
                    <h4 className="text-lg font-bold">
                      Primary Learning Style: <span className="capitalize">{results.preferred}</span>
                    </h4>
                  </div>
                  <p className="text-neutral-700">{renderStyleDescription(results.preferred)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          {isComplete ? (
            <>
              <Button 
                variant="outline" 
                onClick={resetAssessment}
              >
                Retake Assessment
              </Button>
              <Button 
                onClick={() => setLocation("/dashboard")}
              >
                Continue to Dashboard
              </Button>
            </>
          ) : (
            <div className="w-full text-center text-sm text-neutral-500">
              Select the option that best describes you
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}