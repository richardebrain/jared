/**
 * Sound Manager for point earning and game events
 */

export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    this.initializeAudioContext();
    this.preloadSounds();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private preloadSounds() {
    const soundFiles = {
      coin: '/sounds/correct.mp3',
      levelUp: '/sounds/level-up.mp3',
      completion: '/sounds/completion.mp3',
      correct: '/sounds/correct-answer.mp3',
      incorrect: '/sounds/incorrect.mp3'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.7;
      this.sounds.set(key, audio);
    });
  }

  public async playSound(soundName: string, volume: number = 0.7): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Resume audio context if it's suspended (required for modern browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audio = this.sounds.get(soundName);
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.currentTime = 0; // Reset to beginning
        await audio.play();
      }
    } catch (error) {
      console.warn(`Could not play sound ${soundName}:`, error);
    }
  }

  public playCoinSound(pointsEarned: number = 1): void {
    // Play different sounds based on points earned
    if (pointsEarned >= 25) {
      this.playSound('levelUp', 0.8); // Milestone rewards
    } else if (pointsEarned >= 10) {
      this.playSound('completion', 0.7); // Medium rewards
    } else {
      this.playSound('coin', 0.6); // Regular points
    }
  }

  public playStreakSound(streakDays: number): void {
    if (streakDays >= 7) {
      this.playSound('levelUp', 0.8); // Weekly milestone
    } else if (streakDays >= 5) {
      this.playSound('completion', 0.7); // 5-day streak
    } else {
      this.playSound('coin', 0.6); // Regular streak
    }
  }

  public playCorrectAnswer(): void {
    this.playSound('correct', 0.7);
  }

  public playIncorrectAnswer(): void {
    this.playSound('incorrect', 0.5);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('soundEnabled', String(enabled));
  }

  public isAudioEnabled(): boolean {
    const stored = localStorage.getItem('soundEnabled');
    return stored !== null ? stored === 'true' : true;
  }

  public initialize(): void {
    const stored = localStorage.getItem('soundEnabled');
    this.isEnabled = stored !== null ? stored === 'true' : true;
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();

// Initialize on import
soundManager.initialize();