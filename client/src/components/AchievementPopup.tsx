import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Star, Award } from "lucide-react";
import ConfettiExplosion from "react-confetti-explosion";

interface AchievementPopupProps {
  title: string;
  description: string;
  points?: number;
  type?: "achievement" | "level-up" | "challenge";
}

export default function AchievementPopup({ 
  title, 
  description, 
  points = 5,
  type = "achievement" 
}: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExploding, setIsExploding] = useState(true);

  useEffect(() => {
    // Automatically hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Icons based on achievement type
  const iconMap = {
    "achievement": <Trophy className="h-10 w-10 text-yellow-500" />,
    "level-up": <Star className="h-10 w-10 text-blue-500" />,
    "challenge": <Award className="h-10 w-10 text-green-500" />
  };

  // Background color based on achievement type
  const bgColorMap = {
    "achievement": "from-yellow-400 to-amber-600",
    "level-up": "from-blue-400 to-purple-600",
    "challenge": "from-green-400 to-emerald-600"
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up transition-all duration-500 ease-in-out">
      <Card className={`relative overflow-hidden shadow-lg border-none w-72`}>
        {isExploding && (
          <div className="absolute right-[50%] top-0">
            <ConfettiExplosion 
              duration={2500} 
              particleCount={80}
              width={800}
              onComplete={() => setIsExploding(false)}
            />
          </div>
        )}
        <div className={`bg-gradient-to-r ${bgColorMap[type]} text-white p-4 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg tracking-tight">New {type === "level-up" ? "Level" : type === "challenge" ? "Challenge" : "Achievement"}!</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-b-lg">
          <div className="flex gap-4 items-center">
            <div className="rounded-full bg-white p-2 shadow-inner">
              {iconMap[type]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600">{description}</p>
              {points > 0 && (
                <Badge className="mt-2 bg-amber-100 hover:bg-amber-100 text-amber-800 border border-amber-200">
                  +{points} points earned
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}