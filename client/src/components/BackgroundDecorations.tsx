import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CloudDecorations
} from "./RaisingArizonaLogos";

/**
 * BackgroundDecorations component
 * 
 * This component adds subtle Animal Crossing style decorative elements to the background
 * with just a few clouds for visual interest but not overwhelming
 */
export function BackgroundDecorations() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    setLoaded(true);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle clouds - only a few for decoration */}
      <motion.div 
        className="absolute top-24 right-[15%] w-32 h-16 bg-white rounded-full opacity-30"
        animate={{ 
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute top-40 left-[10%] w-28 h-14 bg-white rounded-full opacity-30"
        animate={{ 
          y: [0, -8, 0]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  );
}