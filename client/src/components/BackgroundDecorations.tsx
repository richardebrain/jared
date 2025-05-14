import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CloudDecorations, 
  RaisingArizonaBear, 
  RaisingArizonaTreeDecoration, 
  RaisingArizonaFlower,
  AnimalCrossingStyleGrass,
  AnimalCrossingStyleRock
} from "./RaisingArizonaLogos";

/**
 * BackgroundDecorations component
 * 
 * This component adds playful Animal Crossing style decorative elements to the background
 * including floating clouds, trees, and Raising Arizona themed decorations
 */
export function BackgroundDecorations() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    setLoaded(true);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Clouds from CloudDecorations component */}
      <CloudDecorations />
      
      {/* Trees */}
      <motion.div 
        className="absolute bottom-0 left-[3%]"
        animate={{ y: [0, -3, 0] }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <RaisingArizonaTreeDecoration />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-0 right-[5%]"
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.7
        }}
      >
        <RaisingArizonaTreeDecoration />
      </motion.div>
      
      {/* Bear logo */}
      <motion.div 
        className="absolute top-[75%] left-[10%] opacity-20"
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <RaisingArizonaBear />
      </motion.div>
      
      {/* Flowers */}
      <motion.div 
        className="absolute bottom-[15%] left-[20%]"
        animate={{ y: [0, -4, 0] }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <RaisingArizonaFlower />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-[10%] right-[25%]"
        animate={{ y: [0, -3, 0] }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      >
        <RaisingArizonaFlower />
      </motion.div>
      
      {/* Grass at bottom */}
      <div className="absolute bottom-0 left-[25%] opacity-50">
        <AnimalCrossingStyleGrass />
      </div>
      
      {/* Rocks */}
      <div className="absolute bottom-[5%] left-[40%] opacity-30">
        <AnimalCrossingStyleRock />
      </div>
      
      <div className="absolute bottom-[8%] right-[15%] opacity-30">
        <AnimalCrossingStyleRock />
      </div>
    </div>
  );
}