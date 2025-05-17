import { useEffect, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";

export function Confetti() {
  const [isExploding, setIsExploding] = useState(true);
  
  const confettiConfig = {
    force: 0.8,
    duration: 3000,
    particleCount: 250,
    width: 1600,
  };

  useEffect(() => {
    // Automatically stop confetti explosion after it completes
    const timer = setTimeout(() => {
      setIsExploding(false);
    }, confettiConfig.duration);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      {isExploding && <ConfettiExplosion {...confettiConfig} />}
    </div>
  );
}