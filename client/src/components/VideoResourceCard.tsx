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
  const checkVideoAvailability = () => {
    if (iframeRef.current) {
      // Add event listener to detect errors
      iframeRef.current.addEventListener('error', () => {
        setVideoError(true);
      });
    }
  };

  useEffect(() => {
    // Initialize video validation
    checkVideoAvailability();
  }, []);

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

  const handleQuizComplete = (points: number) => {
    setQuizCompleted(true);
    setPointsEarned(points);
    setShowQuiz(false);
    
    // In a real implementation, we would make an API call to save the points
    toast({
      title: "Points Earned!",
      description: `You've earned ${points} points for completing this quiz.`,
      variant: "default",
    });
    
    // Update user points and progress in a real implementation
    // For now, we'll just close the quiz
  };

  // For the watching time, a real implementation would track actual view time,
  // but for the demo we'll simulate completion after 75% of the video duration
  const handleProgress = (event: any) => {
    // Only register completion once
    if (videoCompleted) return;
    
    // This is a simplified version - in real implementation, we would use the YouTube API
    // to track watch time more accurately
    setTimeout(() => {
      if (Math.random() > 0.3) { // Simulate 70% chance of completing the video
        handleVideoComplete();
      }
    }, video.duration * 1000 * 0.5); // Simulate 50% of actual video time
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-black">
        {videoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-4">
            <AlertCircle className="h-12 w-12 mb-2 text-red-400" />
            <p className="text-center text-sm">
              This video is currently unavailable.
            </p>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
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