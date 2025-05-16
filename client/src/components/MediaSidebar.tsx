import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, Play, Pause, SkipForward, SkipBack, Video, Music, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import media assets
import raisingArizonaVideo from "@assets/Raising Arizona Preschool .mp4";
import sunriseAudio from "@assets/Sunrise paints the Glendale sky gold.mp3";
import cleanUpTimeAudio from "@assets/Clean Up Time.mp3";
import cleanUpTimeAudio1 from "@assets/Clean Up Time (1).mp3";
import cleanUpTimeAudio2 from "@assets/Clean Up Time (2).mp3";
import cleanUpEvenMoreAudio from "@assets/clean up even more.mp3";
import timeToChangeAudio from "@assets/Time to Change Activities.mp3";
import timeToChangeAudio1 from "@assets/Time to Change Activities (1).mp3";
import timeToChangeAudio3 from "@assets/Time to Change Activities  version 3.mp3";
import timeToChangeAudio4 from "@assets/Time to Change Activities version 4.mp3";
import washUpForLunchAudio from "@assets/Wash Up For Lunch.mp3";
import washUpForLunchAudio1 from "@assets/Wash Up For Lunch (1).mp3";
import closingMyEyesAudio from "@assets/I'm Closing My Eyes.mp3";
import closingMyEyesAudio1 from "@assets/I'm Closing My Eyes (1).mp3";
import closingMyEyesAudio2 from "@assets/I'm Closing My Eyes (2).mp3";
import closingMyEyesAudio3 from "@assets/I'm Closing My Eyes (3).mp3";
import commitmentRapAudio from "@assets/_Commitment's Whistle-Stop Rap (Extended.mp3";
import passDontHogItAudio from "@assets/pass it dont hog it sharing song 1 (2).mp3";
import passDontHogItAudio2 from "@assets/pass it dont hog it sharing version 2.mp3";
import welcomeAboardAudio from "@assets/Welcome Aboard.mp3";
import welcomeAboardAudio2 from "@assets/Welcome Aboard version 2.mp3";

// Define classroom song categories
const audioCategories = [
  { id: 'transitions', name: 'Transitions' },
  { id: 'cleanup', name: 'Clean Up Time' },
  { id: 'rest', name: 'Rest Time' },
  { id: 'meals', name: 'Meal Times' },
  { id: 'sharing', name: 'Sharing' },
  { id: 'welcome', name: 'Welcome' },
  { id: 'core-values', name: 'Core Values' }
];

// Define all classroom songs
const classroomSongs = [
  { 
    id: 1, 
    title: 'Clean Up Time', 
    file: cleanUpTimeAudio, 
    category: 'cleanup',
    description: 'Engaging song to make cleaning up fun and organized'
  },
  { 
    id: 2, 
    title: 'Clean Up Time (Version 1)', 
    file: cleanUpTimeAudio1, 
    category: 'cleanup',
    description: 'Alternative version of the cleanup song'
  },
  { 
    id: 3, 
    title: 'Clean Up Time (Version 2)', 
    file: cleanUpTimeAudio2, 
    category: 'cleanup',
    description: 'Another version of the cleanup song'
  },
  { 
    id: 4, 
    title: 'Clean Up Even More', 
    file: cleanUpEvenMoreAudio, 
    category: 'cleanup',
    description: 'Extended cleanup song for longer cleanup times'
  },
  { 
    id: 5, 
    title: 'Time to Change Activities', 
    file: timeToChangeAudio, 
    category: 'transitions',
    description: 'Smooth transition song to move between classroom activities'
  },
  { 
    id: 6, 
    title: 'Time to Change Activities (Version 1)', 
    file: timeToChangeAudio1, 
    category: 'transitions',
    description: 'Alternative version of the transition song'
  },
  { 
    id: 7, 
    title: 'Time to Change Activities (Version 3)', 
    file: timeToChangeAudio3, 
    category: 'transitions',
    description: 'Third version of the transition song'
  },
  { 
    id: 8, 
    title: 'Time to Change Activities (Version 4)', 
    file: timeToChangeAudio4, 
    category: 'transitions',
    description: 'Fourth version of the transition song'
  },
  { 
    id: 9, 
    title: 'Wash Up For Lunch', 
    file: washUpForLunchAudio, 
    category: 'meals',
    description: 'Reminds children about handwashing before meals'
  },
  { 
    id: 10, 
    title: 'Wash Up For Lunch (Version 1)', 
    file: washUpForLunchAudio1, 
    category: 'meals',
    description: 'Alternative version of the handwashing song'
  },
  { 
    id: 11, 
    title: 'I\'m Closing My Eyes', 
    file: closingMyEyesAudio, 
    category: 'rest',
    description: 'Calming song for naptime and quiet moments'
  },
  { 
    id: 12, 
    title: 'I\'m Closing My Eyes (Version 1)', 
    file: closingMyEyesAudio1, 
    category: 'rest',
    description: 'Alternative version of the naptime song'
  },
  { 
    id: 13, 
    title: 'I\'m Closing My Eyes (Version 2)', 
    file: closingMyEyesAudio2, 
    category: 'rest',
    description: 'Another version of the naptime song'
  },
  { 
    id: 14, 
    title: 'I\'m Closing My Eyes (Version 3)', 
    file: closingMyEyesAudio3, 
    category: 'rest',
    description: 'Third version of the naptime song'
  },
  { 
    id: 15, 
    title: 'Pass It Don\'t Hog It (Version 1)', 
    file: passDontHogItAudio, 
    category: 'sharing',
    description: 'Fun song teaching children to share with friends'
  },
  { 
    id: 16, 
    title: 'Pass It Don\'t Hog It (Version 2)', 
    file: passDontHogItAudio2, 
    category: 'sharing',
    description: 'Alternative version of the sharing song'
  },
  { 
    id: 17, 
    title: 'Welcome Aboard', 
    file: welcomeAboardAudio, 
    category: 'welcome',
    description: 'Welcoming song for new children or morning greeting'
  },
  { 
    id: 18, 
    title: 'Welcome Aboard (Version 2)', 
    file: welcomeAboardAudio2, 
    category: 'welcome',
    description: 'Alternative version of the welcome song'
  },
  { 
    id: 19, 
    title: 'Commitment\'s Whistle-Stop Rap', 
    file: commitmentRapAudio, 
    category: 'core-values',
    description: 'Fun rap about the CORE value of being committed'
  },
  { 
    id: 20, 
    title: 'Sunrise paints the Glendale sky gold', 
    file: sunriseAudio, 
    category: 'core-values',
    description: 'Raising Arizona\'s theme highlighting our school values'
  }
];

export default function MediaSidebar() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSong, setSelectedSong] = useState<number>(6); // Default to the Raising Arizona theme
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
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
  
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        // Set the current source before playing
        audioRef.current.src = classroomSongs.find(s => s.id === selectedSong)?.file || '';
        audioRef.current.load();
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };
  
  // Handle song selection and play
  const selectAndPlaySong = (songId: number) => {
    // If the same song is selected and playing, pause it
    if (selectedSong === songId && isAudioPlaying) {
      toggleAudio();
      return;
    }
    
    // If a different song is selected or the same song is not playing
    setSelectedSong(songId);
    
    // Stop current audio if playing
    if (isAudioPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
    
    // Set a small timeout to ensure state updates before playing
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = classroomSongs.find(s => s.id === songId)?.file || '';
        audioRef.current.load();
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    }, 50);
  };
  
  const skipForward = (mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += 10;
    }
  };
  
  const skipBackward = (mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime -= 10;
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Video and Audio Library</CardTitle>
        <CardDescription>Classroom resources and training materials</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="video">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Video</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>Music</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" className="space-y-4">
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
          
          <TabsContent value="audio" className="space-y-4">
            {/* Song Category Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Filter by Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {audioCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Song List */}
            <ScrollArea className="h-52 border rounded-md p-2 mb-4">
              <div className="space-y-2">
                {classroomSongs
                  .filter(song => selectedCategory === 'all' || song.category === selectedCategory)
                  .map(song => (
                    <div
                      key={song.id}
                      onClick={() => selectAndPlaySong(song.id)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedSong === song.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {selectedSong === song.id && isAudioPlaying 
                            ? <Pause className="h-5 w-5 text-primary" /> 
                            : <Play className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{song.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {audioCategories.find(c => c.id === song.category)?.name || 'General'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            
            {/* Currently Playing Song */}
            <div className="rounded-md bg-accent/20 p-6 flex flex-col items-center justify-center space-y-4">
              <Volume2 className="h-16 w-16 text-primary" />
              <div className="text-center">
                <h3 className="font-medium">{classroomSongs.find(s => s.id === selectedSong)?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {classroomSongs.find(s => s.id === selectedSong)?.description}
                </p>
              </div>
              
              <audio 
                ref={audioRef}
                src={classroomSongs.find(s => s.id === selectedSong)?.file}
                onEnded={() => setIsAudioPlaying(false)}
                onPause={() => setIsAudioPlaying(false)}
                onPlay={() => setIsAudioPlaying(true)}
                className="hidden"
              />
            </div>
            
            {/* Player Controls */}
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
                onClick={() => isAudioPlaying ? toggleAudio() : selectAndPlaySong(selectedSong)}
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
              These classroom songs can help with daily routines, transitions, and reinforcing core values
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-muted-foreground w-full text-center">
          Building Chapter One for every child!
        </p>
      </CardFooter>
    </Card>
  );
}