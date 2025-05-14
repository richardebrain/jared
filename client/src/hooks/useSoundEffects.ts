// Custom hook for sound effects to use in gamification
import { useCallback } from 'react';

export function useSoundEffects() {
  // Sound effect URLs
  const soundUrls = {
    success: '/sounds/mario-coin.mp3',
    wrong: '/sounds/mario-wrong.mp3',
    levelComplete: '/sounds/mario-level-complete.mp3',
    celebration: '/sounds/mario-victory.mp3'
  };

  // Function to safely play sounds
  const playSound = useCallback((url: string, volume: number = 0.5) => {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      
      // Some browsers require user interaction before audio can play
      // This handles the promise rejection gracefully
      audio.play().catch(err => {
        console.warn(`Failed to play sound: ${err.message}`);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  // For correct answers
  const playSuccessSound = useCallback(() => {
    playSound(soundUrls.success, 0.5);
  }, [playSound, soundUrls.success]);

  // For wrong answers
  const playWrongSound = useCallback(() => {
    playSound(soundUrls.wrong, 0.4);
  }, [playSound, soundUrls.wrong]);

  // For completing a level/section
  const playLevelCompleteSound = useCallback(() => {
    playSound(soundUrls.levelComplete, 0.6);
  }, [playSound, soundUrls.levelComplete]);

  // For celebration at end of quiz
  const playCelebrationSound = useCallback(() => {
    playSound(soundUrls.celebration, 0.7);
  }, [playSound, soundUrls.celebration]);

  return {
    playSuccessSound,
    playWrongSound,
    playLevelCompleteSound,
    playCelebrationSound
  };
}