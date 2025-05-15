declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiCannon {
    fire(options?: ConfettiOptions): void;
    reset(): void;
  }

  // Export as a function with options parameter
  export default function confetti(options?: ConfettiOptions): Promise<any>;

  // Add properties and methods to the exported function
  export function create(
    canvas: HTMLCanvasElement,
    options?: { resize?: boolean; useWorker?: boolean }
  ): ConfettiCannon;
}