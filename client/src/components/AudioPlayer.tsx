import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';

interface AudioPlayerProps {
  src: string;
  title: string;
  description?: string;
  showInModule?: boolean;
  moduleId?: number;
  pointsValue?: number;
  className?: string;
}

export function AudioPlayer({
  src,
  title,
  description,
  showInModule = false,
  moduleId,
  pointsValue = 3,
  className
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    const updateTime = () => setCurrentTime(audio.currentTime);
    
    // To detect when audio has played at least 80% of its duration
    const checkProgress = () => {
      if (audio.currentTime > audio.duration * 0.8 && !hasEarnedPoints && pointsValue > 0) {
        setHasEarnedPoints(true);
        // Award points if this is within a module context
        if (moduleId && user) {
          awardPoints();
        }
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('timeupdate', checkProgress);
    
    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('timeupdate', checkProgress);
    };
  }, [hasEarnedPoints, moduleId, pointsValue, user]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTimeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    audio.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    setCurrentTime(audio.currentTime);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    setCurrentTime(audio.currentTime);
  };

  const awardPoints = async () => {
    if (!user || !moduleId || pointsAwarded) return;
    
    try {
      const response = await apiRequest('POST', '/api/award-audio-points', {
        userId: user.id,
        moduleId,
        audioTitle: title,
        pointsEarned: pointsValue
      });
      
      if (response.ok) {
        const data = await response.json();
        setPointsAwarded(true);
        toast({
          title: "Points Awarded!",
          description: `You earned ${pointsValue} points for listening to "${title}"`,
        });
      }
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  return (
    <div className={cn("p-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipBackward}
              className="h-8 w-8"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              onClick={togglePlayPause}
              className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? 
                <Pause className="h-4 w-4" /> : 
                <Play className="h-4 w-4" />
              }
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipForward}
              className="h-8 w-8"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 w-24">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? 
                <VolumeX className="h-4 w-4" /> : 
                <Volume2 className="h-4 w-4" />
              }
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-16"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.01}
            onValueChange={handleTimeChange}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}