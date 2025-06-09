import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';

interface MobileTouchControlsProps {
  onDirectionPress?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onPause?: () => void;
  onReset?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  showDirectional?: boolean;
  showGameControls?: boolean;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  onDirectionPress,
  onPause,
  onReset,
  onResume,
  isPaused = false,
  showDirectional = true,
  showGameControls = true
}) => {
  const handleDirectionPress = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (onDirectionPress) {
      onDirectionPress(direction);
    }
  };

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto">
      {/* Directional Controls */}
      {showDirectional && (
        <div className="grid grid-cols-3 gap-1 w-32">
          <div></div>
          <Button
            variant="outline"
            size="sm"
            className="aspect-square p-1"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress('up');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDirectionPress('up');
            }}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <div></div>
          
          <Button
            variant="outline"
            size="sm"
            className="aspect-square p-1"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress('left');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDirectionPress('left');
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div></div>
          <Button
            variant="outline"
            size="sm"
            className="aspect-square p-1"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress('right');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDirectionPress('right');
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <div></div>
          <Button
            variant="outline"
            size="sm"
            className="aspect-square p-1"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress('down');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDirectionPress('down');
            }}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <div></div>
        </div>
      )}

      {/* Game Controls */}
      {showGameControls && (
        <div className="flex space-x-2">
          {(onPause || onResume) && (
            <Button
              onClick={isPaused ? onResume : onPause}
              variant="outline"
              size="sm"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          )}
          {onReset && (
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileTouchControls;