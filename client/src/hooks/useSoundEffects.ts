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

  // Voice narration is handled by the browser's Speech Synthesis API

  // For text-to-speech functionality using Web Speech API
  const speakText = useCallback((text: string, voicePreference: string, onComplete?: () => void) => {
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      console.error("This browser doesn't support speech synthesis");
      if (onComplete) onComplete();
      return { cancel: () => {} };
    }

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties based on preference
    utterance.rate = 0.9; // slightly slower than default
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Select a voice - map actor names to voice characteristics
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      // If voices aren't loaded yet, wait for them
      speechSynthesis.onvoiceschanged = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        selectVoice(availableVoices);
        speak();
      };
    } else {
      selectVoice(voices);
      speak();
    }
    
    function selectVoice(availableVoices: SpeechSynthesisVoice[]) {
      let selectedVoice = null;
      
      // Map actor preferences to different voice types
      switch(voicePreference) {
        case "Morgan Freeman":
          // Deep, male voice for Morgan Freeman
          selectedVoice = availableVoices.find(v => v.lang.includes('en') && v.name.includes('Male') && !v.name.includes('high'));
          break;
        case "Jennifer Lawrence":
          // Female voice for Jennifer Lawrence
          selectedVoice = availableVoices.find(v => v.lang.includes('en') && v.name.includes('Female'));
          break;
        case "Samuel L. Jackson":
          // Bold male voice for Samuel L. Jackson
          selectedVoice = availableVoices.find(v => v.lang.includes('en') && v.name.includes('Male'));
          break;
        case "Meryl Streep":
          // Alternative female voice for Meryl Streep
          selectedVoice = availableVoices.find(v => v.lang.includes('en') && v.name.includes('Female') && !v.name.includes('high'));
          break;
        default:
          // Default to first English voice
          selectedVoice = availableVoices.find(v => v.lang.includes('en'));
      }
      
      // Fallback to first voice if no match
      utterance.voice = selectedVoice || availableVoices[0];
    }
    
    // Set up completion callback
    utterance.onend = () => {
      if (onComplete) {
        onComplete();
      }
    };
    
    function speak() {
      console.log(`Speaking text with ${voicePreference} voice: ${text.substring(0, 100)}...`);
      window.speechSynthesis.speak(utterance);
    }
    
    // Return cancel function
    return {
      cancel: () => {
        window.speechSynthesis.cancel();
        console.log('Narration canceled');
      }
    };
  }, []);

  return {
    playSuccessSound,
    playWrongSound,
    playLevelCompleteSound,
    playCelebrationSound,
    speakText
  };
}