import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Sparkles, Crown, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AchievementPopupProps {
  title: string;
  description: string;
  points: number;
  type: "achievement" | "level-up" | "challenge";
}

export default function AchievementPopup({ 
  title, 
  description, 
  points,
  type
}: AchievementPopupProps) {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the popup after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  // Determine icon and colors based on achievement type
  const getTypeConfig = () => {
    switch(type) {
      case "level-up":
        return {
          icon: <Crown className="h-7 w-7 text-yellow-500" />,
          bgGradient: "from-yellow-500 to-amber-600",
          tagColor: "bg-yellow-300 text-yellow-800",
          tagText: "Level Up!"
        };
      case "challenge":
        return {
          icon: <CheckCircle className="h-7 w-7 text-green-500" />,
          bgGradient: "from-green-500 to-emerald-600",
          tagColor: "bg-green-300 text-green-800",
          tagText: "Challenge Complete!"
        };
      case "achievement":
      default:
        return {
          icon: <Trophy className="h-7 w-7 text-amber-500" />,
          bgGradient: "from-amber-500 to-orange-600",
          tagColor: "bg-amber-300 text-amber-800",
          tagText: "Achievement Unlocked!"
        };
    }
  };
  
  const { icon, bgGradient, tagColor, tagText } = getTypeConfig();

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed top-20 right-4 z-50 max-w-md shadow-lg"
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="overflow-hidden border-none relative p-0 bg-white rounded-lg shadow-xl">
          {/* Sparkles animations */}
          <div className="absolute -top-2 -left-2">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-2 -right-2">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </motion.div>
          </div>
          
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${bgGradient} px-4 py-3 flex items-center`}>
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: 0.2 
              }}
              className="mr-3"
            >
              {icon}
            </motion.div>
            
            <div className="flex-1 text-white">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-white/80">{description}</p>
            </div>
            
            <div>
              <Badge className={`${tagColor} ml-2 flex items-center`}>
                {tagText}
              </Badge>
            </div>
          </div>
          
          {/* Points reward section */}
          {points > 0 && (
            <div className="p-3 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">You earned:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-amber-500 mr-1" />
                <span className="font-bold text-amber-600">{points} XP Points</span>
              </div>
            </div>
          )}
          
          {/* Close button */}
          <button 
            onClick={() => setVisible(false)}
            className="absolute top-2 right-2 text-white/60 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}