import React from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfettiExplosion from 'react-confetti-explosion';
import { useLocation } from 'wouter';

interface CelebrationOverlayProps {
  pointsEarned: number;
  onClose: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ 
  pointsEarned,
  onClose 
}) => {
  const [location, setLocation] = useLocation();

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/80 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ConfettiExplosion 
        force={0.8}
        duration={3000}
        particleCount={250}
        width={1600}
      />
      
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-black/20 p-8 rounded-2xl backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold mb-2">Amazing Work! 🎉</h1>
          <p className="text-xl mb-6">You've completed the module!</p>
          <div className="flex justify-center mb-8">
            <div className="bg-primary/20 rounded-full px-6 py-3 flex items-center">
              <Award className="h-6 w-6 text-primary-light mr-2" />
              <span className="text-lg font-semibold">+{pointsEarned} points earned</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 mt-8">
            <Button 
              onClick={() => setLocation('/dashboard')} 
              variant="default" 
              size="lg"
              className="flex items-center justify-center bg-white text-primary hover:bg-white/90"
            >
              <ChevronLeft className="mr-2 h-5 w-5" /> 
              Back to Dashboard
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost" 
              size="sm"
              className="text-white/70 hover:text-white bg-transparent hover:bg-white/10"
            >
              Continue Learning
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};