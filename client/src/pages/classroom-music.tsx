import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Play, Pause, SkipForward, SkipBack, Music, Clock, Download } from "lucide-react";
import Header from "@/components/Header";
import { Link } from "wouter";

// Import audio assets
import sunriseAudio from "@assets/Sunrise paints the Glendale sky gold.mp3";
import cleanUpTimeAudio from "@assets/Clean Up Time.mp3";
import cleanUpTimeAudio1 from "@assets/Clean Up Time (1).mp3";
import cleanUpTimeAudio2 from "@assets/Clean Up Time (2).mp3";
import cleanUpMoreAudio from "@assets/clean up even more.mp3";
import timeToChangeAudio from "@assets/Time to Change Activities.mp3";
import timeToChangeAudio1 from "@assets/Time to Change Activities (1).mp3";
import washUpForLunchAudio from "@assets/Wash Up For Lunch.mp3";
import washUpForLunchAudio1 from "@assets/Wash Up For Lunch (1).mp3";
import closingMyEyesAudio from "@assets/I'm Closing My Eyes.mp3";
import closingMyEyesAudio3 from "@assets/I'm Closing My Eyes (3).mp3";
import commitmentRapAudio from "@assets/_Commitment's Whistle-Stop Rap (Extended.mp3";
import sharingAudio from "@assets/pass it dont hog it sharing song 1 (2).mp3";
import sharingAudio2 from "@assets/pass it dont hog it sharing version 2.mp3";

// Define classroom song categories
const audioCategories = [
  { id: 'all', name: 'All Songs' },
  { id: 'transitions', name: 'Transitions' },
  { id: 'cleanup', name: 'Clean Up Time' },
  { id: 'rest', name: 'Rest Time' },
  { id: 'meals', name: 'Meal Times' },
  { id: 'sharing', name: 'Sharing' },
  { id: 'core-values', name: 'Core Values' }
];

// Define all classroom songs with detailed descriptions
const classroomSongs = [
  { 
    id: 1, 
    title: 'Clean Up Time', 
    file: cleanUpTimeAudio, 
    category: 'cleanup',
    description: 'Engaging song to make cleaning up fun and organized',
    duration: '3:12',
    usageNotes: 'Play this song 5 minutes before transitioning to a new activity to give children time to clean up their current materials.'
  },
  { 
    id: 2, 
    title: 'Clean Up Time (Version 1)', 
    file: cleanUpTimeAudio1, 
    category: 'cleanup',
    description: 'Alternative version with a slightly different rhythm',
    duration: '3:10',
    usageNotes: 'A great alternative to switch things up and keep children engaged during clean-up time.'
  },
  { 
    id: 3, 
    title: 'Clean Up Time (Version 2)', 
    file: cleanUpTimeAudio2, 
    category: 'cleanup',
    description: 'Another clean-up song variation with an upbeat tune',
    duration: '3:05',
    usageNotes: 'Use this more energetic version when you need to speed up the clean-up process.'
  },
  { 
    id: 4, 
    title: 'Clean Up Even More', 
    file: cleanUpMoreAudio, 
    category: 'cleanup',
    description: 'Extended clean-up song for big messes and group projects',
    duration: '3:30',
    usageNotes: 'Ideal for after major art projects or activities that require more thorough clean-up time.'
  },
  { 
    id: 5, 
    title: 'Time to Change Activities', 
    file: timeToChangeAudio, 
    category: 'transitions',
    description: 'Smooth transition song to move between classroom activities',
    duration: '2:14',
    usageNotes: 'Great for signaling a shift between learning centers or activities throughout the day.'
  },
  { 
    id: 6, 
    title: 'Time to Change Activities (Version 1)', 
    file: timeToChangeAudio1, 
    category: 'transitions',
    description: 'Alternative transition song with gentle prompts',
    duration: '2:20',
    usageNotes: 'A slightly calmer version that works well for transitions after quiet activities like reading time.'
  },
  { 
    id: 7, 
    title: 'Wash Up For Lunch', 
    file: washUpForLunchAudio, 
    category: 'meals',
    description: 'Reminds children about handwashing before meals',
    duration: '2:52',
    usageNotes: 'Play this song when it\'s time to line up for handwashing before mealtimes.'
  },
  { 
    id: 8, 
    title: 'Wash Up For Lunch (Version 1)', 
    file: washUpForLunchAudio1, 
    category: 'meals',
    description: 'Alternate handwashing song with hygiene reminders',
    duration: '2:55',
    usageNotes: 'Great for reinforcing proper handwashing techniques through lyrics about soap and water.'
  },
  { 
    id: 9, 
    title: 'I\'m Closing My Eyes', 
    file: closingMyEyesAudio, 
    category: 'rest',
    description: 'Calming song for naptime and quiet moments',
    duration: '3:05',
    usageNotes: 'Perfect for creating a peaceful atmosphere during rest time or to calm children after high-energy activities.'
  },
  { 
    id: 10, 
    title: 'I\'m Closing My Eyes (Version 3)', 
    file: closingMyEyesAudio3, 
    category: 'rest',
    description: 'Soothing lullaby-style naptime song',
    duration: '3:08',
    usageNotes: 'This gentler version works especially well for younger children or when you need a more lullaby-like approach to rest time.'
  },
  { 
    id: 11, 
    title: 'Pass It Don\'t Hog It (Sharing Song)', 
    file: sharingAudio, 
    category: 'sharing',
    description: 'Fun song about sharing with friends and taking turns',
    duration: '2:35',
    usageNotes: 'Use during circle time to introduce the concept of sharing, or play during center time when children need reminders about taking turns.'
  },
  { 
    id: 12, 
    title: 'Pass It Don\'t Hog It (Version 2)', 
    file: sharingAudio2, 
    category: 'sharing',
    description: 'Upbeat song about the importance of sharing classroom materials',
    duration: '2:40',
    usageNotes: 'Great for reinforcing sharing principles during group activities with limited supplies.'
  },
  { 
    id: 13, 
    title: 'Commitment\'s Whistle-Stop Rap', 
    file: commitmentRapAudio, 
    category: 'core-values',
    description: 'Fun rap about the CORE value of being committed',
    duration: '3:28',
    usageNotes: 'Use during circle time to reinforce our CORE value of commitment in an engaging way.'
  },
  { 
    id: 14, 
    title: 'Sunrise paints the Glendale sky gold', 
    file: sunriseAudio, 
    category: 'core-values',
    description: 'Raising Arizona\'s theme highlighting our school values',
    duration: '2:45',
    usageNotes: 'Our school theme song! Play during morning gatherings to start the day on a positive note.'
  }
];

export default function ClassroomMusic() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Filter songs by selected category
  const filteredSongs = selectedCategory === 'all' 
    ? classroomSongs 
    : classroomSongs.filter(song => song.category === selectedCategory);
  
  // Handle song selection and play
  const selectAndPlaySong = (songId: number) => {
    // If the same song is selected and playing, pause it
    if (selectedSong === songId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    // If a different song is selected or the same song is not playing
    setSelectedSong(songId);
    
    // Stop current audio if playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Set a small timeout to ensure state updates before playing
    setTimeout(() => {
      if (audioRef.current) {
        const selectedSongData = classroomSongs.find(s => s.id === songId);
        if (selectedSongData) {
          audioRef.current.src = selectedSongData.file;
          audioRef.current.load();
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Error playing audio:', error);
              toast({
                title: "Playback Error",
                description: "There was a problem playing this song. Please try again.",
                variant: "destructive",
              });
            });
        }
      }
    }, 50);
  };
  
  // Toggle play/pause for currently selected song
  const togglePlayback = () => {
    if (!selectedSong) {
      if (classroomSongs.length > 0) {
        selectAndPlaySong(classroomSongs[0].id);
      }
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
          });
      }
    }
  };
  
  // Skip forward 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };
  
  // Skip backward 10 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };
  
  // Get the currently selected song data
  const currentSong = selectedSong 
    ? classroomSongs.find(song => song.id === selectedSong) 
    : null;

  return (
    <div className="min-h-screen bg-amber-50/30 pb-12">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-800">Classroom Music Library</h1>
            <p className="text-amber-700">Songs for daily routines and transitions</p>
          </div>
          
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <Music className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Song List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Song Categories</CardTitle>
                <CardDescription>Filter by classroom use</CardDescription>
              </CardHeader>
              
              <CardContent>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-2">
                    {filteredSongs.map(song => (
                      <div
                        key={song.id}
                        onClick={() => selectAndPlaySong(song.id)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedSong === song.id 
                            ? 'bg-amber-100 border border-amber-300' 
                            : 'hover:bg-amber-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">
                            {selectedSong === song.id && isPlaying 
                              ? <Pause className="h-5 w-5 text-amber-600" /> 
                              : <Play className="h-5 w-5 text-amber-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{song.title}</h4>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{song.duration}</span>
                              <span className="mx-2">•</span>
                              <span>{audioCategories.find(c => c.id === song.category)?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Player & Details */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">
                  {currentSong ? currentSong.title : "Select a Song to Play"}
                </CardTitle>
                <CardDescription>
                  {currentSong ? audioCategories.find(c => c.id === currentSong.category)?.name : "Browse our classroom music collection"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-8">
                  <div className="rounded-md bg-gradient-to-r from-amber-100 to-orange-50 p-8 flex flex-col items-center justify-center space-y-6">
                    <div className="bg-white p-6 rounded-full shadow-md">
                      <Volume2 className="h-24 w-24 text-amber-500" />
                    </div>
                    
                    <audio 
                      ref={audioRef}
                      src={currentSong?.file}
                      onEnded={() => setIsPlaying(false)}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      className="hidden"
                    />
                    
                    {/* Player Controls */}
                    <div className="flex justify-center items-center space-x-4 w-full max-w-md">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={skipBackward}
                        disabled={!currentSong}
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>
                      
                      <Button 
                        variant={currentSong ? "default" : "secondary"}
                        size="lg"
                        className="rounded-full h-16 w-16 bg-amber-500 hover:bg-amber-600"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={skipForward}
                        disabled={!currentSong}
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {currentSong && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">About This Song</h3>
                      <p className="text-gray-600 mt-1">{currentSong.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold">Classroom Usage</h3>
                      <p className="text-gray-600 mt-1">{currentSong.usageNotes}</p>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download for Offline Use
                      </Button>
                    </div>
                  </div>
                )}
                
                {!currentSong && (
                  <div className="bg-amber-50 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-medium text-amber-800 mb-2">Welcome to the Classroom Music Library</h3>
                    <p className="text-amber-700 mb-4">Select a song from the list to play and view its details.</p>
                    <p className="text-sm text-amber-600">These songs have been carefully chosen to support daily classroom routines and transitions.</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground w-full text-center">
                  Music is a powerful tool for creating a positive and structured classroom environment.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}