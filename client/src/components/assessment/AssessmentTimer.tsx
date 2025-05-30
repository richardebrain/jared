import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle,
  Timer
} from 'lucide-react';

interface AssessmentTimerProps {
  timeRemaining: number;
  totalTime: number;
  onTimeExpire: () => void;
  isActive: boolean;
}

export default function AssessmentTimer({
  timeRemaining: initialTimeRemaining,
  totalTime,
  onTimeExpire,
  isActive
}: AssessmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [hasWarned, setHasWarned] = useState(false);

  // Calculate progress percentage
  const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;

  // Determine timer state and colors
  const getTimerState = () => {
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage > 50) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        progressColor: 'bg-green-500',
        status: 'good'
      };
    } else if (percentage > 20) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        progressColor: 'bg-yellow-500',
        status: 'warning'
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        progressColor: 'bg-red-500',
        status: 'critical'
      };
    }
  };

  const timerState = getTimerState();

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer countdown
  const countdown = useCallback(() => {
    if (!isActive) return;

    setTimeRemaining(prev => {
      const newTime = prev - 1;
      
      // Warning at 10 seconds
      if (newTime === 10 && !hasWarned) {
        setHasWarned(true);
        // Could add a toast notification here if desired
      }
      
      // Time expired
      if (newTime <= 0) {
        onTimeExpire();
        return 0;
      }
      
      return newTime;
    });
  }, [isActive, hasWarned, onTimeExpire]);

  // Set up timer interval
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(countdown, 1000);
    return () => clearInterval(interval);
  }, [countdown, isActive, timeRemaining]);

  // Reset warning state when timer resets
  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
    setHasWarned(false);
  }, [initialTimeRemaining]);

  return (
    <Card className={`border-2 ${timerState.borderColor} ${timerState.bgColor} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg flex items-center ${timerState.color}`}>
          {timerState.status === 'critical' ? (
            <AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
          ) : (
            <Timer className="h-5 w-5 mr-2" />
          )}
          Time Remaining
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Large time display */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${timerState.color} font-mono`}>
            {formatTime(timeRemaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {timeRemaining <= 10 && timeRemaining > 0 && (
              <span className="text-red-600 font-medium animate-pulse">
                Time running out!
              </span>
            )}
            {timeRemaining === 0 && (
              <span className="text-red-600 font-medium">
                Time expired!
              </span>
            )}
            {timeRemaining > 10 && (
              <span>Answer within the time limit</span>
            )}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{formatTime(totalTime)}</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
            style={{
              // Custom progress color based on timer state
              '--progress-background': timerState.progressColor
            } as React.CSSProperties}
          />
        </div>

        {/* Timer status indicators */}
        <div className="flex justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            timerState.status === 'good' ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full ${
            timerState.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full ${
            timerState.status === 'critical' ? 'bg-red-500' : 'bg-gray-300'
          }`} />
        </div>

        {/* Helper text */}
        <div className="text-center">
          {!isActive && (
            <p className="text-xs text-muted-foreground">
              Timer paused during submission
            </p>
          )}
          {isActive && timeRemaining > 0 && (
            <p className="text-xs text-muted-foreground">
              {timeRemaining <= 10 
                ? "Submit your answer quickly!" 
                : "Take your time to read carefully"
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 