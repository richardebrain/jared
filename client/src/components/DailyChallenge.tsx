import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, Star, CheckSquare, XSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Daily challenge options data
const challengeOptions = [
  {
    id: 1,
    question: "What is a key benefit of using open-ended questions with preschoolers?",
    answers: [
      "They're easier for teachers to create",
      "They encourage creative thinking and language development",
      "They require less supervision",
      "They're easier for children to understand"
    ],
    correctIndex: 1
  },
  {
    id: 2,
    question: "Which core value emphasizes creating predictable routines for children?",
    answers: [
      "Be Committed",
      "Be Caring",
      "Be Consistent",
      "Be Positive"
    ],
    correctIndex: 2
  },
  {
    id: 3,
    question: "What strategy can help manage transitions between activities?",
    answers: [
      "Starting the next activity immediately",
      "Using timers and verbal warnings",
      "Keeping children at activities longer",
      "Allowing free play all day"
    ],
    correctIndex: 1
  },
  {
    id: 4,
    question: "How can teachers best foster social-emotional learning?",
    answers: [
      "Focus only on academic skills",
      "Tell children how to feel",
      "Model appropriate emotional responses",
      "Avoid discussing feelings"
    ],
    correctIndex: 2
  },
  {
    id: 5,
    question: "What is the purpose of the 'Welcome Aboard' song?",
    answers: [
      "To wake children up from nap time",
      "To greet children during morning arrival",
      "To signal lunch time",
      "To remind children of classroom rules"
    ],
    correctIndex: 1
  }
];

export default function DailyChallenge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<typeof challengeOptions[0] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Get a daily challenge based on the date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const challengeIndex = dayOfYear % challengeOptions.length;
    setChallenge(challengeOptions[challengeIndex]);
    
    // Check if the user has already completed today's challenge
    const lastCompleted = localStorage.getItem('lastDailyChallengeDate');
    const todayStr = today.toDateString();
    
    if (lastCompleted === todayStr) {
      setHasCompletedToday(true);
    }
    
    // Get streak count
    const streak = parseInt(localStorage.getItem('challengeStreak') || '0');
    setStreakCount(streak);
  }, []);

  // Mutation to save challenge results
  const { mutate: saveChallenge } = useMutation({
    mutationFn: async (result: { correct: boolean, points: number }) => {
      return await apiRequest("/api/daily-challenge", {
        method: "POST",
        data: result
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    // Check if answer is correct
    const isCorrect = challenge && answerIndex === challenge.correctIndex;
    
    if (isCorrect) {
      // Launch confetti for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Increment streak
      const newStreak = streakCount + 1;
      localStorage.setItem('challengeStreak', newStreak.toString());
      setStreakCount(newStreak);
      
      // Mark as completed today
      const today = new Date().toDateString();
      localStorage.setItem('lastDailyChallengeDate', today);
      setHasCompletedToday(true);
      
      // Save challenge result (points based on streak)
      const points = Math.min(5, 2 + Math.floor(newStreak / 3));
      saveChallenge({ correct: true, points });
      
      toast({
        title: "Correct! 🎉",
        description: `You earned ${points} points and increased your streak to ${newStreak}!`,
        variant: "default",
      });
    } else {
      // Reset streak on wrong answer
      localStorage.setItem('challengeStreak', '0');
      setStreakCount(0);
      
      // Still mark as completed today
      const today = new Date().toDateString();
      localStorage.setItem('lastDailyChallengeDate', today);
      setHasCompletedToday(true);
      
      // Save challenge result (0 points for incorrect)
      saveChallenge({ correct: false, points: 0 });
      
      toast({
        title: "Not quite right",
        description: "Try again tomorrow for a new challenge!",
        variant: "destructive",
      });
    }
  };

  // Reset challenge for testing (would be removed in production)
  const resetChallenge = () => {
    localStorage.removeItem('lastDailyChallengeDate');
    setHasCompletedToday(false);
    setIsAnswered(false);
    setSelectedAnswer(null);
  };

  if (!challenge) return null;

  return (
    <Card className="overflow-hidden border-amber-200 bg-amber-50/50">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Daily Challenge
          </CardTitle>
          <div className="flex items-center gap-1 bg-amber-700/30 py-1 px-2 rounded-full text-xs font-medium">
            <Star className="h-3 w-3 fill-white" />
            <span>Streak: {streakCount}</span>
          </div>
        </div>
        <CardDescription className="text-amber-100">
          Answer correctly to earn points and build your streak!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {hasCompletedToday ? (
          <div className="text-center py-4">
            <Award className="h-16 w-16 mx-auto text-amber-500 mb-2" />
            <h3 className="font-bold text-lg">Challenge Completed!</h3>
            <p className="text-sm text-gray-600 mt-1">
              You've completed today's challenge. Return tomorrow for a new one!
            </p>
            <div className="mt-3 text-xs text-gray-500">
              {/* In development mode only - remove in production */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetChallenge} 
                className="text-xs opacity-70"
              >
                Reset (dev only)
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="font-bold text-amber-900">{challenge.question}</h3>
            </div>
            <div className="space-y-2">
              {challenge.answers.map((answer, index) => (
                <div
                  key={index}
                  onClick={() => !isAnswered && handleAnswerSelect(index)}
                  className={`
                    p-3 rounded-md border transition-all cursor-pointer
                    ${isAnswered && index === challenge.correctIndex 
                      ? "bg-green-100 border-green-300"
                      : isAnswered && index === selectedAnswer
                        ? "bg-red-100 border-red-300"
                        : isAnswered
                          ? "opacity-70 border-transparent"
                          : "hover:bg-amber-100 hover:border-amber-300 border-amber-100"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {isAnswered && index === challenge.correctIndex && (
                      <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {isAnswered && index === selectedAnswer && index !== challenge.correctIndex && (
                      <XSquare className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <span>{answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      
      {!hasCompletedToday && !isAnswered && (
        <CardFooter className="bg-amber-50 border-t border-amber-100 justify-center">
          <p className="text-xs text-amber-700">
            Select your answer to submit and earn points!
          </p>
        </CardFooter>
      )}
    </Card>
  );
}