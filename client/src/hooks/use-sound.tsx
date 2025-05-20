import { useRef, useEffect } from 'react';

/**
 * Custom hook for playing sounds with optional volume control
 */
export function useSound(url: string, { volume = 1 } = {}) {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audio.current = new Audio(url);
    
    // Set volume
    if (audio.current) {
      audio.current.volume = volume;
    }
    
    // Cleanup on unmount
    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current.src = '';
        audio.current = null;
      }
    };
  }, [url, volume]);

  // Play function
  const play = () => {
    if (audio.current) {
      // Reset to beginning if already playing
      audio.current.currentTime = 0;
      return audio.current.play().catch(error => {
        console.warn(`Failed to play sound: ${error.message}`);
      });
    }
    return Promise.reject(new Error('Audio not initialized'));
  };

  // Stop function
  const stop = () => {
    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
    }
  };

  return { play, stop };
}