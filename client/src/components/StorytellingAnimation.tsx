import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Star, Heart, Sun, Trees, Sparkles, Baby, School, Rocket } from 'lucide-react';

interface StorytellingAnimationProps {
  isVisible: boolean;
  phase: 'introduction' | 'early-learning' | 'growth' | 'independence' | 'complete';
  onComplete?: () => void;
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const backgroundVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 0.95,
    transition: { duration: 0.7 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      delay: 0.3
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: { duration: 0.4 }
  }
};

// Define the phases of a child's learning journey
const phaseContent = {
  introduction: {
    title: "Opening Their Book",
    description: "A child's story begins with curiosity and trust. Every interaction you have with them writes the first pages of their life story.",
    icon: <Book className="w-12 h-12 text-blue-500" />,
    color: "blue"
  },
  'early-learning': {
    title: "First Chapters",
    description: "Children absorb your words, emotions, and behaviors as they form their first understandings of the world.",
    icon: <Baby className="w-12 h-12 text-green-500" />,
    color: "green"
  },
  growth: {
    title: "Growing Narrative",
    description: "As children develop skills and independence, their story evolves with characters, challenges, and triumphs.",
    icon: <Trees className="w-12 h-12 text-amber-500" />,
    color: "amber"
  },
  independence: {
    title: "Writing Their Own Pages",
    description: "Children begin to author parts of their own stories, applying the foundations you've helped them build.",
    icon: <School className="w-12 h-12 text-indigo-500" />,
    color: "indigo"
  },
  complete: {
    title: "Stories That Last a Lifetime",
    description: "The narratives formed in early childhood become the foundation for a lifetime of learning and growth.",
    icon: <Rocket className="w-12 h-12 text-purple-500" />,
    color: "purple"
  }
};

// Decorative elements that float in background
const BackgroundElements = () => {
  return (
    <>
      <motion.div 
        className="absolute top-10 left-10"
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <Star className="w-8 h-8 text-yellow-300 opacity-40" />
      </motion.div>
      <motion.div 
        className="absolute bottom-20 right-20"
        animate={{ 
          y: [0, 10, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.5
        }}
      >
        <Heart className="w-6 h-6 text-pink-400 opacity-30" />
      </motion.div>
      <motion.div 
        className="absolute top-1/3 right-10"
        animate={{ 
          y: [0, 12, 0],
          x: [0, 5, 0],
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      >
        <Sun className="w-10 h-10 text-amber-300 opacity-40" />
      </motion.div>
      <motion.div 
        className="absolute bottom-10 left-1/4"
        animate={{ 
          y: [0, -8, 0],
          x: [0, -5, 0],
          rotate: [0, 10, 0],
        }}
        transition={{ 
          duration: 7,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.7
        }}
      >
        <Sparkles className="w-7 h-7 text-blue-300 opacity-40" />
      </motion.div>
    </>
  );
};

export const StorytellingAnimation: React.FC<StorytellingAnimationProps> = ({ 
  isVisible,
  phase,
  onComplete
}) => {
  const [showAnimation, setShowAnimation] = useState(isVisible);
  const content = phaseContent[phase];
  
  useEffect(() => {
    setShowAnimation(isVisible);
    
    // Auto-hide after some time if needed
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        if (onComplete) onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);
  
  const getGradient = () => {
    switch(content.color) {
      case "blue": return "from-blue-900 via-blue-800 to-indigo-900";
      case "green": return "from-green-900 via-emerald-800 to-teal-900";
      case "amber": return "from-amber-900 via-orange-800 to-yellow-900";
      case "indigo": return "from-indigo-900 via-violet-800 to-purple-900";
      case "purple": return "from-purple-900 via-fuchsia-800 to-pink-900";
      default: return "from-gray-900 via-slate-800 to-gray-900";
    }
  };
  
  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className={`fixed inset-0 bg-gradient-to-br ${getGradient()} flex items-center justify-center z-50`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backgroundVariants}
        >
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Decorative background elements */}
            <BackgroundElements />
            
            <div className="max-w-2xl mx-auto text-center px-4">
              {/* Icon animation */}
              <motion.div 
                className="mb-6 inline-block"
                variants={iconVariants}
              >
                <div className="bg-white/10 p-5 rounded-full">
                  {content.icon}
                </div>
              </motion.div>
              
              {/* Content animation */}
              <motion.div variants={contentVariants}>
                <h2 className="text-3xl font-bold text-white mb-4">{content.title}</h2>
                <p className="text-xl text-white/90 mb-8">{content.description}</p>
                
                {/* Visual journey line showing progress */}
                <div className="flex justify-between items-center gap-2 max-w-md mx-auto mb-8">
                  <div className={`w-6 h-6 rounded-full ${phase === 'introduction' || phase === 'complete' ? 'bg-white' : 'bg-white/30'} flex-shrink-0 relative z-10`}>
                    {phase === 'introduction' && <Sparkles className="w-4 h-4 text-blue-500 absolute top-1 left-1" />}
                  </div>
                  <div className={`h-1 flex-grow ${phase === 'early-learning' || phase === 'complete' ? 'bg-white' : 'bg-white/30'}`}></div>
                  <div className={`w-6 h-6 rounded-full ${phase === 'early-learning' || phase === 'complete' ? 'bg-white' : 'bg-white/30'} flex-shrink-0 relative z-10`}>
                    {phase === 'early-learning' && <Baby className="w-4 h-4 text-green-500 absolute top-1 left-1" />}
                  </div>
                  <div className={`h-1 flex-grow ${phase === 'growth' || phase === 'complete' ? 'bg-white' : 'bg-white/30'}`}></div>
                  <div className={`w-6 h-6 rounded-full ${phase === 'growth' || phase === 'complete' ? 'bg-white' : 'bg-white/30'} flex-shrink-0 relative z-10`}>
                    {phase === 'growth' && <Trees className="w-4 h-4 text-amber-500 absolute top-1 left-1" />}
                  </div>
                  <div className={`h-1 flex-grow ${phase === 'independence' || phase === 'complete' ? 'bg-white' : 'bg-white/30'}`}></div>
                  <div className={`w-6 h-6 rounded-full ${phase === 'independence' || phase === 'complete' ? 'bg-white' : 'bg-white/30'} flex-shrink-0 relative z-10`}>
                    {phase === 'independence' && <School className="w-4 h-4 text-indigo-500 absolute top-1 left-1" />}
                  </div>
                  <div className={`h-1 flex-grow ${phase === 'complete' ? 'bg-white' : 'bg-white/30'}`}></div>
                  <div className={`w-6 h-6 rounded-full ${phase === 'complete' ? 'bg-white' : 'bg-white/30'} flex-shrink-0 relative z-10`}>
                    {phase === 'complete' && <Rocket className="w-4 h-4 text-purple-500 absolute top-1 left-1" />}
                  </div>
                </div>
                
                <motion.button
                  className="px-8 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => {
                    setShowAnimation(false);
                    if (onComplete) onComplete();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue Their Journey
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StorytellingAnimation;