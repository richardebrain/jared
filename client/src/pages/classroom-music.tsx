import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Square, 
  Heart, 
  HeartOff, 
  Search, 
  Music, 
  Clock,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  category: string;
  createdAt: string;
}

interface Favorite {
  id: number;
  songId: number;
  song: Song;
}

export default function ClassroomMusic() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all songs
  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['/api/songs'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['/api/music/favorites'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (songId: number) => {
      const isFavorite = favorites.some((fav: Favorite) => fav.songId === songId);
      if (isFavorite) {
        return apiRequest(`/api/music/favorites/${songId}`, { method: 'DELETE' });
      } else {
        return apiRequest('/api/music/favorites', { 
          method: 'POST', 
          body: { songId } 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/music/favorites'] });
      toast({
        title: "Favorites Updated",
        description: "Your music favorites have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter songs based on search and category
  const filteredSongs = songs.filter((song: Song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get favorite songs
  const favoriteSongs = songs.filter((song: Song) => 
    favorites.some((fav: Favorite) => fav.songId === song.id)
  );

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(songs.map((song: Song) => song.category)))];

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = (song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong?.id !== song.id) {
      // Switch to new song
      setCurrentSong(song);
      audio.src = song.audioUrl;
      audio.load();
      audio.play().then(() => setIsPlaying(true));
    } else {
      // Toggle current song
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true));
      }
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFavorite = (songId: number) => 
    favorites.some((fav: Favorite) => fav.songId === songId);

  const SongCard = ({ song }: { song: Song }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{song.title}</h3>
            <p className="text-gray-600">{song.artist}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{song.category}</Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(song.duration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavoriteMutation.mutate(song.id)}
              disabled={toggleFavoriteMutation.isPending}
            >
              {isFavorite(song.id) ? (
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              ) : (
                <HeartOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={() => handlePlayPause(song)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentSong?.id === song.id && isPlaying ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {currentSong?.id === song.id && isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Music className="w-8 h-8 text-blue-600" />
          Classroom Music
        </h1>
        <p className="text-gray-600">
          Discover and play music for your classroom activities, transitions, and quiet time.
        </p>
      </div>

      {/* Audio Player */}
      <audio ref={audioRef} />

      {/* Now Playing Card */}
      {currentSong && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5" />
              Now Playing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-xl">{currentSong.title}</h3>
                <p className="text-gray-600">{currentSong.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleStop}>
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 mt-4">
              <Volume2 className="w-4 h-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by title or artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for All Music and Favorites */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            All Music ({filteredSongs.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favorites ({favoriteSongs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {songsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading music library...</p>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No songs found</p>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSongs.map((song: Song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favoritesLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading favorites...</p>
            </div>
          ) : favoriteSongs.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No favorites yet</p>
              <p className="text-gray-500">Heart songs to add them to your favorites</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {favoriteSongs.map((song: Song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}