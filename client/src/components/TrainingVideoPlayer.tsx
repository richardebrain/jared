import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';

interface TrainingVideoPlayerProps {
  videoSrc: string;
  title: string;
  description?: string;
  pointValue?: number;
  moduleId?: number;
  className?: string;
}

export function TrainingVideoPlayer({
  videoSrc,
  title,
  description,
  pointValue = 5,
  moduleId,
  className
}: TrainingVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
          
          // Mark as watched if they've viewed 80% of the video
          if (!hasWatched && (video.currentTime / video.duration) >= 0.8) {
            setHasWatched(true);
            
            // Award points if user is logged in and module exists
            if (user && moduleId && !pointsAwarded) {
              awardPoints();
            }
          }
        }
      };
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [hasWatched, pointsAwarded, moduleId, user]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const awardPoints = async () => {
    try {
      const response = await apiRequest('/api/points/award', {
        method: 'POST',
        data: {
          moduleId: moduleId,
          activityType: 'video_watch',
          pointValue: pointValue,
          details: `Watched training video: ${title}`
        }
      });
      
      if (response.success) {
        setPointsAwarded(true);
        setShowPointsAnimation(true);
        
        toast({
          title: "Points Earned!",
          description: `You earned ${pointValue} points for watching this training video!`,
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
  
  return (
    <Card className={cn("overflow-hidden shadow-md", className)}>
      <div className="relative">
        <video 
          ref={videoRef}
          className="w-full aspect-video object-cover"
          src={videoSrc}
          playsInline
        />
        
        {/* Overlay with controls */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white bg-black/50 hover:bg-black/70 h-16 w-16 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Points animation */}
        {showPointsAnimation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
              <span className="text-xl font-bold">+{pointValue} points!</span>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        
        {hasWatched && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Watched
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}