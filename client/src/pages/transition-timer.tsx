import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Home, ArrowLeft, Play, Pause, RefreshCw, Volume2, VolumeX } from "lucide-react";
import confetti from 'canvas-confetti';
import { useToast } from "@/hooks/use-toast";

export default function TransitionTimer() {
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState(3); // Default 3 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // in seconds
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element for timer sounds
  useEffect(() => {
    audioRef.current = new Audio("/timer-finish.mp3");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle timer logic
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Notification when 1 minute remains
          if (newTime === 60 && soundEnabled) {
            toast({
              title: "1 Minute Remaining!",
              description: "Time to start wrapping up!",
              variant: "default",
            });
            // Play a gentle alert sound for 1 minute remaining
            try {
              const oneMinuteAudio = new Audio("/one-minute-left.mp3");
              oneMinuteAudio.play();
            } catch (error) {
              console.error("Error playing audio:", error);
            }
          }
          
          // Timer finished
          if (newTime <= 0) {
            handleTimerComplete();
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining, soundEnabled]);

  // Update time remaining when duration changes
  useEffect(() => {
    if (!timerActive) {
      setTimeRemaining(duration * 60);
    }
  }, [duration, timerActive]);

  // Handle setting duration from slider
  const handleSliderChange = (value: number[]) => {
    setDuration(value[0]);
  };

  // Handle timer start
  const startTimer = () => {
    setTimerActive(true);
  };

  // Handle timer pause
  const pauseTimer = () => {
    setTimerActive(false);
  };

  // Handle timer reset
  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(duration * 60);
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    setTimerActive(false);
    
    // Play completion sound if enabled
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
    
    // Trigger confetti celebration
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const myConfetti = confetti.create(canvas, { 
        resize: true,
        useWorker: true
      });
      
      // Launch confetti
      const end = Date.now() + 3000; // 3 seconds of confetti

      const colors = ['#FFC107', '#4CAF50', '#2196F3', '#FF5722', '#9C27B0'];
      
      (function frame() {
        myConfetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        myConfetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
    
    // Show completion toast
    toast({
      title: "Time's Up!",
      description: "Time to move to the next activity!",
      variant: "default",
    });
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate hourglass fill percentage
  const sandFillPercentage = (timeRemaining / (duration * 60)) * 100;
  
  // Determine sand color based on remaining time
  const getSandColor = () => {
    if (sandFillPercentage > 66) {
      return "#4CAF50"; // Green
    } else if (sandFillPercentage > 33) {
      return "#FFC107"; // Yellow/Amber
    } else {
      return "#FF5722"; // Red/Orange
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 flex flex-col">
      {/* Back navigation */}
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="p-0 h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          Transition Timer
        </h1>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="p-0 h-10 w-10"
        >
          <Home className="h-6 w-6" />
        </Button>
      </div>

      {/* Timer Setup Card - shown when timer is not active */}
      {!timerActive && (
        <Card className="shadow-lg max-w-md w-full mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Set Transition Timer</CardTitle>
            <CardDescription>
              Choose how long children have before the next activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="duration">Duration: {duration} minutes</Label>
              </div>
              <Slider 
                defaultValue={[duration]} 
                max={15} 
                min={1} 
                step={1} 
                onValueChange={handleSliderChange}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 min</span>
                <span>5 min</span>
                <span>10 min</span>
                <span>15 min</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant={soundEnabled ? "outline" : "ghost"} 
                size="sm" 
                onClick={() => setSoundEnabled(prev => !prev)}
                className="w-12 h-12 rounded-full p-0"
              >
                {soundEnabled ? 
                  <Volume2 className="h-5 w-5 text-green-600" /> : 
                  <VolumeX className="h-5 w-5 text-red-600" />
                }
              </Button>
              <span className="text-sm">
                {soundEnabled ? "Sound On" : "Sound Off"}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startTimer} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" /> Start Timer
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Active Timer Display */}
      {timerActive && (
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Canvas for confetti */}
          <canvas 
            ref={canvasRef} 
            className="fixed inset-0 z-10 pointer-events-none" 
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* Timer display */}
          <div className="text-7xl font-bold text-center mb-10">
            {formatTime(timeRemaining)}
          </div>

          {/* Hourglass visualization - bigger and more dramatic */}
          <div className="relative w-80 h-96 mb-12 transition-all duration-500 transform hover:scale-105">
            {/* Hourglass top with shadow effect */}
            <div className="absolute top-0 left-0 right-0 h-[calc(50%-3px)] 
                           bg-gray-100 border-3 border-gray-600 rounded-t-3xl 
                           overflow-hidden shadow-inner">
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out"
                style={{ 
                  height: `${Math.max(0, 100 - sandFillPercentage)}%`, 
                  backgroundColor: getSandColor(),
                  boxShadow: `0 -10px 15px -5px rgba(0,0,0,0.1) inset, 0 -5px 10px -3px ${getSandColor()}50 inset`
                }}
              ></div>
              {/* Top glass shine effect - enhanced */}
              <div className="absolute top-0 left-1/4 w-1/2 h-1/2 
                             bg-white opacity-30 transform rotate-45"></div>
            </div>
            
            {/* Hourglass connector - wider and with gradient */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                           w-12 h-6 bg-gradient-to-br from-gray-600 to-gray-500 z-10
                           shadow-md"></div>
            
            {/* Hourglass bottom with shadow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-3px)] 
                           bg-gray-100 border-3 border-gray-600 rounded-b-3xl 
                           overflow-hidden shadow-inner">
              <div 
                className="absolute top-0 left-0 right-0 transition-all duration-1000 ease-in-out"
                style={{ 
                  height: `${Math.min(100, (100 - sandFillPercentage))}%`,
                  backgroundColor: getSandColor(),
                  boxShadow: `0 10px 15px -5px rgba(0,0,0,0.1) inset, 0 5px 10px -3px ${getSandColor()}50 inset`
                }}
              ></div>
              {/* Bottom glass shine effect - enhanced */}
              <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 
                             bg-white opacity-30 transform rotate-45"></div>
            </div>
            
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-3xl opacity-40 pointer-events-none"
                 style={{
                   boxShadow: `0 0 20px 5px ${getSandColor()}80`,
                   animation: 'pulse 2s infinite ease-in-out'
                 }}>
            </div>
            
            {/* Hourglass falling sand animation - enhanced */}
            {timerActive && (
              <>
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 
                             w-[3px] animate-sand-fall"
                  style={{
                    height: '40%',
                    backgroundColor: getSandColor(),
                    animationDuration: '0.8s',
                    filter: 'blur(0.5px)',
                    opacity: 0.9
                  }}
                ></div>
                {/* Additional falling sand particles for dramatic effect */}
                <div 
                  className="absolute top-1/2 left-[calc(50%-3px)] transform 
                             w-[2px] animate-sand-fall-slow"
                  style={{
                    height: '25%',
                    backgroundColor: getSandColor(),
                    animationDuration: '1.2s',
                    filter: 'blur(0.5px)',
                    opacity: 0.7
                  }}
                ></div>
                <div 
                  className="absolute top-1/2 left-[calc(50%+3px)] transform 
                             w-[2px] animate-sand-fall-slow"
                  style={{
                    height: '30%',
                    backgroundColor: getSandColor(),
                    animationDuration: '1s',
                    filter: 'blur(0.5px)',
                    opacity: 0.7
                  }}
                ></div>
              </>
            )}
          </div>

          {/* Timer Controls */}
          <div className="mt-auto flex items-center justify-center space-x-4">
            <Button 
              onClick={timerActive ? pauseTimer : startTimer} 
              variant="outline" 
              size="lg" 
              className="h-14 w-14 rounded-full p-0"
            >
              {timerActive ? 
                <Pause className="h-6 w-6" /> : 
                <Play className="h-6 w-6" />
              }
            </Button>
            
            <Button 
              onClick={resetTimer} 
              variant="outline" 
              size="lg" 
              className="h-14 w-14 rounded-full p-0"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
            
            <Button 
              variant={soundEnabled ? "outline" : "ghost"} 
              size="lg" 
              onClick={() => setSoundEnabled(prev => !prev)}
              className="h-14 w-14 rounded-full p-0"
            >
              {soundEnabled ? 
                <Volume2 className="h-6 w-6 text-green-600" /> : 
                <VolumeX className="h-6 w-6 text-red-600" />
              }
            </Button>
            
            <Button 
              onClick={() => setLocation("/dashboard")} 
              variant="outline" 
              size="lg" 
              className="h-14 w-14 rounded-full p-0"
            >
              <Home className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}