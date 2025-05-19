/**
 * Simplified sound effects hook that provides placeholder functions
 * This version doesn't actually play sounds, but provides the interface
 * for components that expect sound functions.
 */
export default function useSoundEffects() {
  // Placeholder functions for sound effects
  const playCorrectSound = () => {
    console.log("Sound effect: Correct answer");
  };
  
  const playIncorrectSound = () => {
    console.log("Sound effect: Incorrect answer");
  };
  
  const playCompletionSound = () => {
    console.log("Sound effect: Quiz completed");
  };
  
  const playCelebrationSound = () => {
    console.log("Sound effect: Celebration");
  };
  
  const playClickSound = () => {
    console.log("Sound effect: Button click");
  };
  
  return {
    playCorrectSound,
    playIncorrectSound,
    playCompletionSound,
    playCelebrationSound,
    playClickSound
  };
}