import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MobileGameContainerProps {
  children: ReactNode;
  gameWidth?: number;
  gameHeight?: number;
  controls?: ReactNode;
  className?: string;
}

export const MobileGameContainer: React.FC<MobileGameContainerProps> = ({
  children,
  gameWidth = 800,
  gameHeight = 600,
  controls,
  className = ""
}) => {
  const aspectRatio = gameWidth / gameHeight;
  
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-2 md:space-y-4 px-2 md:px-0 ${className}`}>
      {/* Game Canvas Container */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div 
            className="relative w-full bg-black rounded-lg"
            style={{ aspectRatio: aspectRatio.toString() }}
          >
            {children}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Controls - Fixed Position */}
      {controls && (
        <div className="md:relative fixed bottom-4 left-4 right-4 z-40 md:z-auto">
          <div className="flex items-center justify-center space-x-4 bg-white/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-lg md:rounded-none p-2 md:p-0 border md:border-none shadow-lg md:shadow-none">
            {controls}
          </div>
        </div>
      )}
      
      {/* Add bottom padding on mobile to account for fixed controls */}
      <div className="h-16 md:h-0" />
    </div>
  );
};

export default MobileGameContainer;