import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
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
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // 0 to 1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasListened, setHasListened] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Set up event listeners when component mounts
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateTime = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (!hasListened) {
          setHasListened(true);
          if (user && moduleId && !pointsAwarded) {
            awardPoints();
          }
        }
      };
      
      // Mark as listened if they've heard 80% of the audio
      const checkProgress = () => {
        if (!hasListened && audio.currentTime / audio.duration >= 0.8) {
          setHasListened(true);
          if (user && moduleId && !pointsAwarded) {
            awardPoints();
          }
        }
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('timeupdate', checkProgress);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      
      // Apply initial volume
      audio.volume = volume;
      
      return () => {
        // Clean up event listeners when component unmounts
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('timeupdate', checkProgress);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [hasListened, pointsAwarded, moduleId, user, volume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          toast({
            title: "Playback Issue",
            description: "Could not play audio. Please try again.",
            variant: "destructive"
          });
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    // Unmute if volume is changed
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  };

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 10
      );
    }
  };

  const awardPoints = async () => {
    try {
      const response = await apiRequest('/api/points/award', {
        method: 'POST',
        data: {
          moduleId: moduleId,
          activityType: 'audio_listen',
          pointValue: pointsValue,
          details: `Listened to educational audio: ${title}`
        }
      });
      
      if (response.success) {
        setPointsAwarded(true);
        setShowPointsAnimation(true);
        
        toast({
          title: "Points Earned!",
          description: `You earned ${pointsValue} points for listening to this educational audio!`,
          duration: 5000,
        });
        
        setTimeout(() => {
          setShowPointsAnimation(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  };

  // More compact player for module view
  if (showInModule) {
    return (
      <div className={cn("relative rounded-md border border-slate-200 bg-white p-3", className)}>
        <audio ref={audioRef} src={src} />
        
        {/* Points animation */}
        {showPointsAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
              <span className="font-bold">+{pointsValue} points!</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-sm">{title}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={skipBackward}
            >
              <SkipBack size={16} />
            </Button>
            
            <Button 
              variant="default"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={skipForward}
            >
              <SkipForward size={16} />
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleTimeChange}
                className="cursor-pointer"
              />
            </div>
            
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full card player for library view
  return (
    <Card className={cn("overflow-hidden shadow-md", className)}>
      <CardContent className="p-4">
        <audio ref={audioRef} src={src} />
        
        {/* Points animation */}
        {showPointsAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
              <span className="font-bold">+{pointsValue} points!</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="icon"
              onClick={skipBackward}
              className="h-9 w-9"
            >
              <SkipBack size={18} />
            </Button>
            
            <Button 
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={skipForward}
              className="h-9 w-9"
            >
              <SkipForward size={18} />
            </Button>
            
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleTimeChange}
                className="cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
            
            <Button 
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-9 w-9"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            
            <div className="w-20">
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
          
          {hasListened && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Completed
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}