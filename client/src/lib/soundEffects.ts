// Sound effects for the gamification elements
// Uses Mario Kart and Nintendo sounds for correct answers

// Function to play the success sound (coin sound for points)
export function playSuccessSound() {
  try {
    const audio = new Audio('/sounds/correct-answer.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Failed to play sound:', err));
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
}

// Function to play the level complete sound
export function playLevelCompleteSound() {
  try {
    const audio = new Audio('/sounds/level-up.mp3');
    audio.volume = 0.6;
    audio.play().catch(err => console.error('Failed to play sound:', err));
  } catch (error) {
    console.error('Error playing level complete sound:', error);
  }
}

// Function to play the wrong answer sound
export function playWrongSound() {
  try {
    const audio = new Audio('/sounds/incorrect.mp3');
    audio.volume = 0.4;
    audio.play().catch(err => console.error('Failed to play sound:', err));
  } catch (error) {
    console.error('Error playing wrong sound:', error);
  }
}

// Function to play the celebration sound at the end of quiz
export function playCelebrationSound() {
  try {
    const audio = new Audio('/sounds/completion.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => console.error('Failed to play sound:', err));
  } catch (error) {
    console.error('Error playing celebration sound:', error);
  }
}