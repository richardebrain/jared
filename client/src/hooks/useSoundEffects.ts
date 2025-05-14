// Custom hook for sound effects to use in gamification
import { useCallback } from 'react';

export function useSoundEffects() {
  // Sound effect URLs
  const soundUrls = {
    success: '/sounds/mario-coin.mp3',
    wrong: '/sounds/mario-wrong.mp3',
    levelComplete: '/sounds/mario-level-complete.mp3',
    celebration: '/sounds/mario-victory.mp3',
    voiceStart: '/sounds/voice-start.mp3',
    voiceEnd: '/sounds/voice-end.mp3'
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

  // For starting voice narration
  const playVoiceStartSound = useCallback(() => {
    playSound(soundUrls.voiceStart, 0.4);
  }, [playSound, soundUrls.voiceStart]);

  // For ending voice narration
  const playVoiceEndSound = useCallback(() => {
    playSound(soundUrls.voiceEnd, 0.4);
  }, [playSound, soundUrls.voiceEnd]);

  // For text-to-speech functionality
  const speakText = useCallback((text: string, voice: string, onComplete?: () => void) => {
    // In a real implementation, this would use a text-to-speech API with various voices
    // For now, we simulate the voice narration with console logs and callbacks
    
    playVoiceStartSound();
    console.log(`Speaking text with ${voice} voice: ${text.substring(0, 100)}...`);
    
    // Simulate completion after 5 seconds (or based on text length)
    const simulatedDuration = Math.max(5000, text.length * 20); // Rough estimate of reading time
    
    setTimeout(() => {
      playVoiceEndSound();
      if (onComplete) {
        onComplete();
      }
    }, simulatedDuration);
    
    return {
      cancel: () => {
        console.log('Narration canceled');
        // In a real implementation, this would stop the audio
      }
    };
  }, [playVoiceStartSound, playVoiceEndSound]);

  return {
    playSuccessSound,
    playWrongSound,
    playLevelCompleteSound,
    playCelebrationSound,
    playVoiceStartSound,
    playVoiceEndSound,
    speakText
  };
}