import React, { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  diameter: number;
  tilt: number;
  tiltAngleIncrement: number;
  tiltAngle: number;
  particleColors: { front: string; back: string };
  color: number;
  rotation: number;
  rotationSpeed: number;
  velocity: number;
  gravity: number;
}

// Colors for confetti
const colors = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
];

export const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const maxParticleCount = 150;
    const particles: ConfettiPiece[] = [];

    const createParticles = () => {
      for (let i = 0; i < maxParticleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          diameter: Math.random() * 10 + 5,
          tilt: Math.random() * 10 - 10,
          tiltAngleIncrement: Math.random() * 0.07 + 0.05,
          tiltAngle: 0,
          particleColors: {
            front: colors[Math.floor(Math.random() * colors.length)],
            back: colors[Math.floor(Math.random() * colors.length)],
          },
          color: Math.floor(Math.random() * colors.length),
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 2 + 1,
          velocity: Math.random() * 3 + 2,
          gravity: 0.5,
        });
      }
    };

    createParticles();
    particlesRef.current = particles;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        ctx.beginPath();
        ctx.lineWidth = particle.diameter;
        ctx.strokeStyle = particle.color % 2 === 0 ? particle.particleColors.front : particle.particleColors.back;
        
        // Move the particle
        particle.tiltAngle += particle.tiltAngleIncrement;
        particle.y += (Math.cos(particle.tiltAngle) + particle.velocity) * 0.5 + particle.gravity;
        particle.x += Math.sin(particle.tiltAngle) * 1;
        particle.tilt = Math.sin(particle.tiltAngle) * 15;
        particle.rotation += particle.rotationSpeed;
        
        // Draw the particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        
        // Draw a rectangle shape for the confetti
        const w = particle.diameter * 0.5;
        const h = particle.diameter * 1.5;
        ctx.fillStyle = particle.particleColors.front;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        
        ctx.restore();
        
        // Reset if the particle goes off screen
        if (particle.y > canvas.height) {
          particle.x = Math.random() * canvas.width;
          particle.y = -20;
          particle.velocity = Math.random() * 3 + 2;
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
};