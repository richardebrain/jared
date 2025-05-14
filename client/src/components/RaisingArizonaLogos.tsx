import { motion } from "framer-motion";

export function RaisingArizonaBear() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(10, 10) scale(0.8)">
        {/* Bear head */}
        <circle cx="50" cy="40" r="30" fill="#8B5E3C" />
        
        {/* Bear ears */}
        <circle cx="30" cy="20" r="10" fill="#8B5E3C" />
        <circle cx="70" cy="20" r="10" fill="#8B5E3C" />
        <circle cx="30" cy="20" r="5" fill="#5D4037" />
        <circle cx="70" cy="20" r="5" fill="#5D4037" />
        
        {/* Bear face */}
        <circle cx="40" cy="35" r="5" fill="#5D4037" />  {/* left eye */}
        <circle cx="60" cy="35" r="5" fill="#5D4037" />  {/* right eye */}
        <circle cx="50" cy="45" r="8" fill="#5D4037" />  {/* nose */}
        <path d="M35 55 Q50 65 65 55" stroke="#5D4037" strokeWidth="2" fill="none" />  {/* mouth */}
      </g>
    </svg>
  );
}

export function CloudDecorations() {
  return (
    <>
      {/* Floating cloud 1 */}
      <motion.div 
        className="absolute top-10 left-[5%] w-24 h-12 bg-sky-100 rounded-full opacity-70"
        animate={{ 
          y: [0, -10, 0], 
          x: [0, 5, 0] 
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating cloud 2 */}
      <motion.div 
        className="absolute top-24 left-[20%] w-32 h-16 bg-sky-50 rounded-full opacity-60"
        animate={{ 
          y: [0, -15, 0], 
          x: [0, 8, 0] 
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Floating cloud 3 */}
      <motion.div 
        className="absolute top-10 right-[25%] w-28 h-14 bg-sky-100 rounded-full opacity-70"
        animate={{ 
          y: [0, -12, 0], 
          x: [0, -7, 0] 
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </>
  );
}

export function RaisingArizonaTreeDecoration() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tree trunk */}
      <rect x="45" y="70" width="10" height="50" fill="#8B4513" />
      
      {/* Tree layers */}
      <circle cx="50" cy="70" r="25" fill="#2E7D32" />
      <circle cx="50" cy="50" r="20" fill="#388E3C" />
      <circle cx="50" cy="35" r="15" fill="#43A047" />
      
      {/* Tree decorations */}
      <circle cx="40" cy="60" r="3" fill="#FFC107" />
      <circle cx="65" cy="55" r="3" fill="#FF9800" />
      <circle cx="45" cy="40" r="3" fill="#FFEB3B" />
      <circle cx="55" cy="70" r="3" fill="#FF5722" />
    </svg>
  );
}

export function RaisingArizonaFlower() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flower petals */}
      <circle cx="25" cy="15" r="10" fill="#FF80AB" />
      <circle cx="15" cy="25" r="10" fill="#FF80AB" />
      <circle cx="35" cy="25" r="10" fill="#FF80AB" />
      <circle cx="25" cy="35" r="10" fill="#FF80AB" />
      
      {/* Flower center */}
      <circle cx="25" cy="25" r="8" fill="#FFEB3B" />
    </svg>
  );
}

export function AnimalCrossingStyleGrass() {
  return (
    <svg width="200" height="50" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Grass blades */}
      <path d="M10 50 C15 30, 20 40, 20 20" stroke="#4CAF50" strokeWidth="3" />
      <path d="M30 50 C35 25, 40 40, 40 15" stroke="#43A047" strokeWidth="3" />
      <path d="M50 50 C55 35, 60 45, 65 20" stroke="#388E3C" strokeWidth="3" />
      <path d="M70 50 C75 30, 80 40, 85 15" stroke="#4CAF50" strokeWidth="3" />
      <path d="M90 50 C95 35, 100 45, 105 25" stroke="#43A047" strokeWidth="3" />
      <path d="M110 50 C115 30, 120 40, 125 15" stroke="#388E3C" strokeWidth="3" />
      <path d="M130 50 C135 25, 140 40, 145 20" stroke="#4CAF50" strokeWidth="3" />
      <path d="M150 50 C155 35, 160 25, 165 15" stroke="#43A047" strokeWidth="3" />
      <path d="M170 50 C175 30, 180 40, 185 25" stroke="#388E3C" strokeWidth="3" />
    </svg>
  );
}

export function AnimalCrossingStyleRock() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rock shape */}
      <path d="M10 30 C10 20, 20 10, 30 10 C40 10, 50 20, 50 30 Z" fill="#757575" />
      
      {/* Rock highlights */}
      <path d="M20 15 L25 12 L30 15" stroke="#9E9E9E" strokeWidth="1" />
      <path d="M35 14 L40 12 L45 18" stroke="#9E9E9E" strokeWidth="1" />
    </svg>
  );
}