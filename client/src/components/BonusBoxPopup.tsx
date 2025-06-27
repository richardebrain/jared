import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Star, Award, Trophy, Sparkles } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface BonusBox {
  id: number;
  box_type: 'bonus' | 'bronze' | 'silver' | 'gold';
  points_awarded: number;
  message?: string;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
}

interface BonusBoxPopupProps {
  bonusBoxes: BonusBox[];
  onClose: () => void;
}

const boxConfig = {
  bonus: {
    icon: Gift,
    bgGradient: 'from-purple-500 to-pink-500',
    textColor: 'text-white',
    title: 'Bonus Box',
    sparkleColor: '#e879f9'
  },
  bronze: {
    icon: Star,
    bgGradient: 'from-amber-600 to-orange-600',
    textColor: 'text-white',
    title: 'Bronze Box',
    sparkleColor: '#f59e0b'
  },
  silver: {
    icon: Award,
    bgGradient: 'from-gray-400 to-gray-600',
    textColor: 'text-white',
    title: 'Silver Box',
    sparkleColor: '#9ca3af'
  },
  gold: {
    icon: Trophy,
    bgGradient: 'from-yellow-400 to-yellow-600',
    textColor: 'text-gray-800',
    title: 'Gold Box',
    sparkleColor: '#fbbf24'
  }
};

export default function BonusBoxPopup({ bonusBoxes, onClose }: BonusBoxPopupProps) {
  // Early return if bonusBoxes is not valid
  if (!bonusBoxes || !Array.isArray(bonusBoxes) || bonusBoxes.length === 0) {
    return null;
  }

  const [currentBoxIndex, setCurrentBoxIndex] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openBoxMutation = useMutation({
    mutationFn: async (boxId: number) => {
      return await apiRequest(`/api/bonus-boxes/${boxId}/open`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      // Trigger celebration
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [boxConfig[currentBox.box_type].sparkleColor]
      });
      
      // Refresh user data to show updated points
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: `${data.boxType.charAt(0).toUpperCase() + data.boxType.slice(1)} Box Opened!`,
        description: `You received ${data.pointsAwarded} points! ${data.message ? '💌 ' + data.message : ''}`,
        duration: 5000,
      });

      // Move to next box or close
      setTimeout(() => {
        if (currentBoxIndex < bonusBoxes.length - 1) {
          setCurrentBoxIndex(currentBoxIndex + 1);
          setIsOpening(false);
        } else {
          onClose();
        }
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to open bonus box. Please try again.',
        variant: 'destructive',
      });
      setIsOpening(false);
    }
  });

  const currentBox = bonusBoxes[currentBoxIndex];
  const config = boxConfig[currentBox.box_type];
  const IconComponent = config.icon;

  const handleOpenBox = async () => {
    setIsOpening(true);
    openBoxMutation.mutate(currentBox.id);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`bg-gradient-to-br ${config.bgGradient} border-none shadow-xl`}>
              <CardContent className="p-8">
                <motion.div
                  animate={isOpening ? { rotateY: 360 } : {}}
                  transition={{ duration: 1 }}
                  className="mb-4"
                >
                  <IconComponent className={`w-16 h-16 mx-auto ${config.textColor}`} />
                </motion.div>
                
                <h2 className={`text-2xl font-bold mb-2 ${config.textColor}`}>
                  {config.title}
                </h2>
                
                <p className={`${config.textColor} opacity-90 mb-4`}>
                  From {currentBox.sender_first_name} {currentBox.sender_last_name}
                </p>

                {currentBox.message && (
                  <div className={`bg-black bg-opacity-20 rounded-lg p-3 mb-4 ${config.textColor}`}>
                    <p className="text-sm italic">"{currentBox.message}"</p>
                  </div>
                )}

                <AnimatePresence>
                  {!isOpening && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Button
                        onClick={handleOpenBox}
                        className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full"
                        disabled={openBoxMutation.isPending}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Open Box
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isOpening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`${config.textColor} font-bold text-lg`}
                  >
                    Opening your surprise...
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {bonusBoxes.length > 1 && (
            <p className="text-gray-500 text-sm mt-4">
              Box {currentBoxIndex + 1} of {bonusBoxes.length}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}