// Sound effects utility for gamification
export class SoundManager {
  private static soundCache: Map<string, HTMLAudioElement> = new Map();

  // Preload and cache sound files
  static preloadSounds() {
    const sounds = [
      { key: 'coin', url: '/sounds/correct-answer.mp3' },
      { key: 'levelUp', url: '/sounds/level-up.mp3' },
      { key: 'completion', url: '/sounds/completion.mp3' },
      { key: 'wrong', url: '/sounds/incorrect.mp3' }
    ];

    sounds.forEach(({ key, url }) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.preload = 'auto';
      this.soundCache.set(key, audio);
    });
  }

  // Play sound effect
  static playSound(soundKey: string, volume: number = 0.5) {
    try {
      const audio = this.soundCache.get(soundKey);
      if (audio) {
        audio.currentTime = 0; // Reset to beginning
        audio.volume = volume;
        audio.play().catch(err => console.warn(`Sound play failed: ${err.message}`));
      } else {
        // Fallback - create new audio instance
        const fallbackAudio = new Audio(this.getSoundUrl(soundKey));
        fallbackAudio.volume = volume;
        fallbackAudio.play().catch(err => console.warn(`Fallback sound failed: ${err.message}`));
      }
    } catch (error) {
      console.warn('Sound playback error:', error);
    }
  }

  private static getSoundUrl(soundKey: string): string {
    const soundMap: Record<string, string> = {
      coin: '/sounds/correct-answer.mp3',
      levelUp: '/sounds/level-up.mp3',
      completion: '/sounds/completion.mp3',
      wrong: '/sounds/incorrect.mp3'
    };
    return soundMap[soundKey] || '/sounds/correct-answer.mp3';
  }

  // Specific sound effect functions
  static playCoinSound() {
    this.playSound('coin', 0.6);
  }

  static playLevelUpSound() {
    this.playSound('levelUp', 0.7);
  }

  static playCompletionSound() {
    this.playSound('completion', 0.8);
  }

  static playWrongSound() {
    this.playSound('wrong', 0.4);
  }
}

// Initialize sounds when module is loaded
if (typeof window !== 'undefined') {
  SoundManager.preloadSounds();
}