import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lightbulb, Brain, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Challenge difficulty types
type Difficulty = "easy" | "medium" | "hard";

// Challenge types
interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: Difficulty;
  completed: boolean;
}

export default function DailyChallenge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "daily-1",
      title: "Core Values Reflection",
      description: "Think about how you demonstrated one of our core values in your classroom today.",
      points: 10,
      difficulty: "easy",
      completed: false
    },
    {
      id: "daily-2",
      title: "Classroom Management Quiz",
      description: "Take a quick quiz on effective classroom management techniques.",
      points: 15,
      difficulty: "medium",
      completed: false
    },
    {
      id: "daily-3",
      title: "Child Development Study",
      description: "Review a key concept from early childhood development.",
      points: 20,
      difficulty: "hard",
      completed: false
    }
  ]);
  
  // Get today's challenge
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentChallenge = challenges[currentIndex];
  
  // Check local storage for completed challenges
  useEffect(() => {
    const completedChallenges = localStorage.getItem('completedDailyChallenges');
    if (completedChallenges) {
      try {
        const completedIds = JSON.parse(completedChallenges);
        setChallenges(prev => 
          prev.map(challenge => ({
            ...challenge,
            completed: completedIds.includes(challenge.id)
          }))
        );
      } catch (error) {
        console.error("Failed to parse completed challenges:", error);
      }
    }
  }, []);
  
  // Mutation to complete challenge
  const { mutate: completeChallenge, isPending } = useMutation({
    mutationFn: async (challenge: Challenge) => {
      return await apiRequest("/api/complete-challenge", {
        method: "POST",
        data: { challengeId: challenge.id, points: challenge.points }
      });
    },
    onSuccess: () => {
      // Update challenges state
      const updatedChallenges = [...challenges];
      updatedChallenges[currentIndex].completed = true;
      setChallenges(updatedChallenges);
      
      // Save to local storage
      const completedIds = updatedChallenges
        .filter(c => c.completed)
        .map(c => c.id);
      localStorage.setItem('completedDailyChallenges', JSON.stringify(completedIds));
      
      // Show success toast
      toast({
        title: "Challenge Completed!",
        description: `You earned ${currentChallenge.points} points!`,
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      console.error("Failed to complete challenge:", error);
      toast({
        title: "Failed to complete challenge",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle challenge completion
  const handleCompleteChallenge = () => {
    if (!currentChallenge.completed) {
      completeChallenge(currentChallenge);
    }
  };
  
  // Function to go to next challenge
  const handleNextChallenge = () => {
    setCurrentIndex((prev) => (prev + 1) % challenges.length);
  };
  
  // Function to go to previous challenge
  const handlePrevChallenge = () => {
    setCurrentIndex((prev) => (prev - 1 + challenges.length) % challenges.length);
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-amber-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Reset challenges for testing (would be removed in production)
  const resetChallenges = () => {
    localStorage.removeItem('completedDailyChallenges');
    setChallenges(challenges.map(c => ({ ...c, completed: false })));
  };
  
  // Progress through all challenges
  const completedCount = challenges.filter(c => c.completed).length;
  const progressPercentage = (completedCount / challenges.length) * 100;

  return (
    <Card className="border-amber-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-base sm:text-lg">Daily Teaching Challenge</CardTitle>
          </div>
          <Badge className="bg-white/20 text-white">
            {completedCount}/{challenges.length} Completed
          </Badge>
        </div>
        <CardDescription className="text-indigo-100">
          Complete daily challenges to earn extra points!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Challenge display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${getDifficultyColor(currentChallenge.difficulty)} text-white`}>
              {currentChallenge.difficulty.charAt(0).toUpperCase() + currentChallenge.difficulty.slice(1)}
            </Badge>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-500 mr-1" />
              <span className="text-sm font-medium">{currentChallenge.points} points</span>
            </div>
          </div>
          
          <h3 className="font-medium text-lg mb-2">{currentChallenge.title}</h3>
          <p className="text-gray-600 mb-4">{currentChallenge.description}</p>
          
          {/* Challenge actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={handleCompleteChallenge}
              disabled={currentChallenge.completed || isPending}
            >
              {isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  <span>Completing...</span>
                </div>
              ) : currentChallenge.completed ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Completed</span>
                </div>
              ) : (
                <span>Complete Challenge</span>
              )}
            </Button>
            
            {/* Navigation buttons */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrevChallenge}
              className="border-indigo-200"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextChallenge}
              className="border-indigo-200"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Reset button for development (would be removed in production) */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs text-gray-400 hover:text-gray-600 mt-2" 
          onClick={resetChallenges}
        >
          Reset Challenges (Dev Only)
        </Button>
      </CardContent>
    </Card>
  );
}