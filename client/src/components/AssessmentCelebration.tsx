import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, CheckCircle } from "lucide-react";
import ConfettiExplosion from "react-confetti-explosion";

interface AssessmentCelebrationProps {
  pointsEarned: number;
  onViewResults: () => void;
}

export default function AssessmentCelebration({ 
  pointsEarned, 
  onViewResults 
}: AssessmentCelebrationProps) {
  // State for confetti animation
  const [isExploding, setIsExploding] = useState(false);
  
  // Congratulatory messages
  const congratsMessages = [
    "Amazing job completing your assessment!",
    "Well done on finishing your teacher assessment!",
    "Fantastic work completing the assessment!",
    "Great effort on your assessment!",
    "Excellent work on completing your teacher evaluation!"
  ];
  
  // Get a random message
  const randomMessage = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
  
  // Trigger confetti on component mount
  useEffect(() => {
    setIsExploding(true);
    
    // Play success sound
    const audio = new Audio("/sounds/level-up.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Error playing sound:", e));
    
    // Reset confetti after a delay
    const timer = setTimeout(() => {
      setIsExploding(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {isExploding && (
        <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ConfettiExplosion
            force={0.8}
            duration={3000}
            particleCount={100}
            width={1600}
          />
        </div>
      )}
      
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <CardContent className="pt-8 pb-6 px-6">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-amber-100 p-4">
              <Trophy className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-muted-foreground mb-4">{randomMessage}</p>
          
          <div className="bg-primary/5 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold text-primary">
              <Trophy className="h-5 w-5" />
              <span>You earned {pointsEarned} points!</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-6 text-left">
            <h3 className="font-semibold text-lg">What's next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">See your teaching strengths and growth areas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Discover your personalized learning path</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Start earning more points with recommended modules</span>
              </li>
            </ul>
          </div>
          
          <Button 
            className="w-full"
            onClick={onViewResults}
          >
            View Results
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}