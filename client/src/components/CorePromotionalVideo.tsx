import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

// Import the video asset
import raisingArizonaVideo from "@assets/Raising Arizona Preschool .mp4";
import raisingArizonaLogo from "@assets/raising-arizona-logo.jpg";

export default function CorePromotionalVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };
  
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };

  return (
    <div className="my-6 rounded-lg overflow-hidden shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          poster={raisingArizonaLogo}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          controls={false}
          src={raisingArizonaVideo}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={toggleVideo}
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold">Raising Arizona Preschool Promotional Video</p>
          <span className="text-sm text-gray-600">Watch to understand our school's mission</span>
        </div>
        
        <div className="flex justify-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={skipBackward}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            className="w-20"
            onClick={toggleVideo}
          >
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={skipForward}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}