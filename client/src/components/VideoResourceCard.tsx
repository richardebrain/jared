import { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bookmark, 
  Clock, 
  Tag, 
  BookOpen,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Play,
  Award,
  X
} from "lucide-react";
import { VideoResource } from '@shared/videoResources';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import VideoQuiz from "@/components/VideoQuiz";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface VideoResourceCardProps {
  video: VideoResource;
  isBookmarked: boolean;
  isWatched: boolean;
  onBookmark: (id: string) => void;
  onWatch: (id: string) => void;
  compactMode?: boolean;
}

export default function VideoResourceCard({ 
  video, 
  isBookmarked, 
  isWatched, 
  onBookmark, 
  onWatch,
  compactMode = false
}: VideoResourceCardProps) {
  const [videoError, setVideoError] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Check if the video is available
  const checkVideoAvailability = async () => {
    // First, ensure the YouTube ID is clean (trim whitespace)
    const cleanYoutubeId = video.youtubeId.trim();
    
    try {
      // Use oEmbed API to check if video is available
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanYoutubeId}&format=json`,
        { method: 'GET' }
      );
      
      // If the response isn't ok, the video is unavailable
      if (!response.ok) {
        console.warn(`Video unavailable: ${video.id} (${cleanYoutubeId}) - "${video.title}"`);
        setVideoError(true);
        
        // Report the unavailable video to the console in a format that's easy to copy/paste
        console.error(`
=== UNAVAILABLE VIDEO ===
ID: ${video.id}
YouTube ID: ${cleanYoutubeId}
Title: ${video.title}
Category: ${video.category.join(', ')}
        `);
        
        // If we had an API endpoint for reporting, we would call it here:
        // apiRequest('/api/videos/report-unavailable', {
        //   method: 'POST',
        //   data: { videoId: video.id, youtubeId: cleanYoutubeId }
        // });
      } else {
        // Video is available
        const data = await response.json();
        console.log(`✅ Video verified: ${video.id} - ${data.title}`);
      }
    } catch (error) {
      console.error('Video validation error:', error);
      setVideoError(true);
    }
    
    // Also set up error handling for the iframe as a backup
    if (iframeRef.current) {
      iframeRef.current.addEventListener('error', () => {
        setVideoError(true);
      });
    }
  };

  useEffect(() => {
    // Initialize video validation
    checkVideoAvailability();
    
    // Check if this video has already been watched
    if (isWatched) {
      setVideoCompleted(true);
    }
  }, [isWatched]);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoComplete = () => {
    setVideoCompleted(true);
    onWatch(video.id);
    
    // Show the quiz option
    toast({
      title: "Video Completed!",
      description: "Take a quick quiz to earn points for your learning.",
      action: (
        <Button size="sm" onClick={() => setShowQuiz(true)}>
          Take Quiz
        </Button>
      ),
    });
  };

  const handleQuizComplete = async (points: number) => {
    setQuizCompleted(true);
    setPointsEarned(points);
    setShowQuiz(false);
    
    try {
      // Submit quiz results directly to the endpoint we know works
      const response = await fetch('/api/videos/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          videoId: video.id,
          points: 5, // Always send 5 points for video quizzes
          duration: video.duration || 5 // Pass video duration for proper point calculation
        })
      });
      
      // Parse the JSON response
      const data = await response.json();
      
      // Update local state and notify the user
      if (data && (data.success || data.pointsAwarded)) {
        const pointsAwarded = data.pointsAwarded || points;
        const totalPoints = data.totalPoints || "updated";
        const remaining = data.remaining !== undefined ? data.remaining : 2;
        
        toast({
          title: "Points Earned!",
          description: `You've earned ${pointsAwarded} points for completing this quiz. Your total points: ${totalPoints}${remaining > 0 ? `. You can earn points for ${remaining} more video(s) today.` : ""}`,
          variant: "default",
        });
        
        // Invalidate user data to refresh points display
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else if (data && data.limitReached) {
        toast({
          title: "Daily Limit Reached",
          description: "You've already earned points for 2 videos today. Come back tomorrow for more!",
          variant: "default",
        });
      } else {
        toast({
          title: "Quiz Completed",
          description: "Your quiz was completed, but no points were awarded.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to save quiz results:', error);
      toast({
        title: "Error Saving Quiz",
        description: "There was a problem saving your quiz results. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Track video watching progress
  const handleProgress = () => {
    // Only proceed if video isn't already marked as completed
    if (videoCompleted || videoError) return;
    
    // Create a more realistic simulation of video watching
    // In a real implementation, you would use the YouTube Player API
    const videoDurationMs = video.duration * 60 * 1000; // Convert minutes to milliseconds
    const watchThreshold = 0.6; // 60% threshold to count as "watched"
    const simulatedWatchTimeMs = videoDurationMs * watchThreshold;
    
    // Set a timer to mark the video as watched after the threshold time
    const watchTimer = setTimeout(() => {
      // Don't complete if there was an error or user navigated away
      if (!videoError) {
        handleVideoComplete();
      }
    }, Math.min(simulatedWatchTimeMs, 10000)); // Cap at 10 seconds for demo purposes
    
    // Clean up the timer if component unmounts
    return () => clearTimeout(watchTimer);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-black">
        {/* Points badge - shows how many points this video is worth */}
        <div className="absolute top-2 left-2 z-10 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-md">
          <span className="mr-1">+</span>{video.duration >= 10 ? 8 : 5}<span className="ml-1">pts</span>
        </div>
        
        {videoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-4">
            <AlertCircle className="h-12 w-12 mb-2 text-red-400" />
            <p className="text-center font-medium mb-1">
              This video is currently unavailable.
            </p>
            <p className="text-center text-sm text-muted-foreground mb-3">
              We've logged this issue and will find a replacement video soon.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-white text-white hover:bg-white/20"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
            >
              Try on YouTube
            </Button>
          </div>
        ) : (
          <iframe 
            ref={iframeRef}
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${video.youtubeId}`} 
            title={video.title} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            onError={handleVideoError}
            onLoad={handleProgress}
          ></iframe>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={`absolute top-2 right-2 bg-black/50 hover:bg-black/70 ${
            isBookmarked ? 'text-yellow-400' : 'text-white'
          }`}
          onClick={() => onBookmark(video.id)}
        >
          <Bookmark className="h-4 w-4 fill-current" />
        </Button>
      </div>
      
      <CardHeader className={`${compactMode ? 'p-3 pb-1' : 'p-4 pb-2'}`}>
        <CardTitle className={`${compactMode ? 'text-base' : 'text-lg'} line-clamp-2`}>
          {video.title}
        </CardTitle>
        <CardDescription className={`line-clamp-${compactMode ? '1' : '2'}`}>
          {video.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={`${compactMode ? 'p-3 pt-0' : 'p-4 pt-0'} flex-grow`}>
        <div className="flex flex-wrap gap-1 mb-2">
          {video.tags.slice(0, compactMode ? 2 : 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {video.tags.length > (compactMode ? 2 : 3) && (
            <Badge variant="outline" className="text-xs">+{video.tags.length - (compactMode ? 2 : 3)}</Badge>
          )}
        </div>
        
        <div className={`flex items-center text-sm text-muted-foreground ${compactMode ? 'gap-2' : 'gap-4'}`}>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {video.duration} min
          </div>
          <div className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            {video.expertLevel}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={`${compactMode ? 'p-3 pt-0' : 'p-4 pt-0'} flex justify-between items-center`}>
        <div className="flex items-center text-sm">
          <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-muted-foreground">{video.source}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!videoError && (
            <>
              {quizCompleted ? (
                <div className="flex items-center text-amber-500">
                  <Award className="h-4 w-4 mr-1" />
                  <span className="text-xs">{pointsEarned} pts</span>
                </div>
              ) : isWatched || videoCompleted ? (
                <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => setShowQuiz(true)}
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Quiz</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <VideoQuiz 
                      videoId={video.id}
                      videoTitle={video.title}
                      onComplete={handleQuizComplete}
                      onClose={() => setShowQuiz(false)}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
              )}
            </>
          )}
          
          {!videoError && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open</span>
            </Button>
          )}
          
          {videoError && (
            <Button
              size="sm"
              variant="destructive"
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Unavailable</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}