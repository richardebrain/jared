import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, Sparkles } from 'lucide-react';

interface PointsAnimationProps {
  points: number;
  show: boolean;
  onComplete?: () => void;
  style?: 'default' | 'casino' | 'achievement';
}

const PointsAnimation: React.FC<PointsAnimationProps> = ({
  points,
  show,
  onComplete,
  style = 'default'
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; delay: number }>>([]);

  // Generate particles when the animation is shown
  useEffect(() => {
    if (show) {
      // Create 20-30 particles based on points value
      const count = Math.min(30, Math.max(20, points * 2));
      const newParticles = Array.from({ length: count }).map((_, index) => ({
        id: index,
        x: Math.random() * 100 - 50, // Position randomly around the center
        y: Math.random() * 100 - 50,
        size: Math.random() * 10 + 5, // Random size between 5 and 15
        color: getRandomColor(style),
        delay: Math.random() * 0.5 // Random delay for staggered animation
      }));
      
      setParticles(newParticles);
      
      // Reset particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, points, onComplete, style]);

  // Random color generator based on style
  const getRandomColor = (style: string): string => {
    const defaultColors = ['#FF5733', '#FFC300', '#36D7B7', '#3498DB', '#9B59B6'];
    const casinoColors = ['#FFD700', '#FF7F50', '#FF00FF', '#7FFFD4', '#FF4500'];
    const achievementColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#50C878', '#B9F2FF'];
    
    const colorSet = style === 'casino' 
      ? casinoColors 
      : style === 'achievement' 
        ? achievementColors 
        : defaultColors;
    
    return colorSet[Math.floor(Math.random() * colorSet.length)];
  };

  // Choose icon based on style
  const getIcon = () => {
    switch (style) {
      case 'casino':
        return <Sparkles className="h-10 w-10 text-yellow-400" />;
      case 'achievement':
        return <Award className="h-10 w-10 text-amber-500" />;
      default:
        return <Star className="h-10 w-10 text-blue-500" />;
    }
  };

  // Get text color class based on style
  const getTextColorClass = () => {
    switch (style) {
      case 'casino':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 bg-clip-text text-transparent';
      case 'achievement':
        return 'bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent';
      default:
        return 'bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent';
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="relative">
            {/* Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: particle.x, 
                  y: particle.y, 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                }}
              />
            ))}
            
            {/* Main animation */}
            <motion.div
              className="flex flex-col items-center justify-center bg-white rounded-full shadow-xl p-8"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 12,
                stiffness: 200,
                duration: 0.5
              }}
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {getIcon()}
              </motion.div>
              
              <motion.div
                className="text-center mt-2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className={`text-4xl font-bold ${getTextColorClass()}`}>
                  +{points}
                </span>
                <motion.p 
                  className="text-gray-600 text-sm font-medium"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  POINTS
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PointsAnimation;