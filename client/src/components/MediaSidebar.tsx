import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Volume2, Play, Pause, SkipForward, SkipBack, Video, Music } from "lucide-react";

// Import media assets
import raisingArizonaVideo from "@assets/media/raising-arizona-preschool.mp4";
import sunriseAudio from "@assets/media/sunrise-paints-glendale-sky-gold.mp3";

export default function MediaSidebar() {
  const [activeTab, setActiveTab] = useState<string>("video");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // References to media elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Handle video playback
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };
  
  // Handle audio playback
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };
  
  // Skip forward 10 seconds
  const skipForward = (mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += 10;
    }
  };
  
  // Skip backward 10 seconds
  const skipBackward = (mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime -= 10;
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Raising Arizona Media</CardTitle>
        <CardDescription>Training resources and inspiration</CardDescription>
        <Tabs defaultValue="video" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Video</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>Music</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <TabsContent value="video" className="mt-0 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              src={raisingArizonaVideo}
              onEnded={() => setIsVideoPlaying(false)}
              onPause={() => setIsVideoPlaying(false)}
              onPlay={() => setIsVideoPlaying(true)}
              controls={false}
            />
            
            {!isVideoPlaying && (
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
          
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Raising Arizona Preschool</p>
            <span className="text-xs text-muted-foreground">Promotional Video</span>
          </div>
          
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => skipBackward(videoRef)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              className="w-20"
              onClick={toggleVideo}
            >
              {isVideoPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isVideoPlaying ? "Pause" : "Play"}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => skipForward(videoRef)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="audio" className="mt-0 space-y-4">
          <div className="rounded-md bg-accent/20 p-6 flex flex-col items-center justify-center space-y-4">
            <Volume2 className="h-16 w-16 text-primary" />
            <div className="text-center">
              <h3 className="font-medium">Sunrise paints the Glendale sky gold</h3>
              <p className="text-sm text-muted-foreground">Raising Arizona Soundtrack</p>
            </div>
            
            <audio 
              ref={audioRef}
              src={sunriseAudio}
              onEnded={() => setIsAudioPlaying(false)}
              onPause={() => setIsAudioPlaying(false)}
              onPlay={() => setIsAudioPlaying(true)}
              className="hidden"
            />
          </div>
          
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => skipBackward(audioRef)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              className="w-20"
              onClick={toggleAudio}
            >
              {isAudioPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isAudioPlaying ? "Pause" : "Play"}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => skipForward(audioRef)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Play this calming soundtrack during classroom activities or mindfulness sessions
          </p>
        </TabsContent>
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-muted-foreground w-full text-center">
          School sucks, but mentors rule!
        </p>
      </CardFooter>
    </Card>
  );
}