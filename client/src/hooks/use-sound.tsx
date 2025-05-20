import { useRef, useEffect } from 'react';

/**
 * Custom hook for playing sounds with optional volume control
 */
export function useSound(url: string, { volume = 1 } = {}) {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element on component mount
    audio.current = new Audio(url);
    audio.current.volume = volume;

    // Clean up on unmount
    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [url, volume]);

  const play = () => {
    if (audio.current) {
      // Reset audio to beginning and play
      audio.current.currentTime = 0;
      audio.current.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  };

  return [play];
}

// Create preset sounds
const correctAnswerSound = () => useSound('/sounds/correct.mp3', { volume: 0.5 });
const incorrectAnswerSound = () => useSound('/sounds/incorrect.mp3', { volume: 0.5 });
const levelUpSound = () => useSound('/sounds/level-up.mp3', { volume: 0.7 });
const completionSound = () => useSound('/sounds/completion.mp3', { volume: 0.8 });

export { correctAnswerSound, incorrectAnswerSound, levelUpSound, completionSound };