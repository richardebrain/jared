import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
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
  SkipForward,
  Home,
  ArrowLeft,
  Sparkles,
  RadioIcon,
  Headphones
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

  // Filter songs based on search and category - ensure songs is an array
  const filteredSongs = Array.isArray(songs) ? songs.filter((song: Song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  // Get favorite songs
  const favoriteSongs = Array.isArray(songs) ? songs.filter((song: Song) => 
    Array.isArray(favorites) && favorites.some((fav: Favorite) => fav.songId === song.id)
  ) : [];

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(Array.isArray(songs) ? songs.map((song: Song) => song.category) : []))];

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
    Array.isArray(favorites) && favorites.some((fav: Favorite) => fav.songId === songId);

  const SongCard = ({ song }: { song: Song }) => (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white via-purple-50 to-pink-50 border-purple-200 hover:border-purple-400">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-purple-800 mb-1">{song.title}</h3>
            <p className="text-purple-600 font-medium">{song.artist}</p>
            <div className="flex items-center gap-3 mt-3">
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-3 py-1"
              >
                {song.category === 'cleanup' && '🧹 '} 
                {song.category === 'transitions' && '🔄 '} 
                {song.category === 'rest' && '😴 '} 
                {song.category === 'meals' && '🍽️ '} 
                {song.category === 'sharing' && '🤝 '} 
                {song.category === 'welcome' && '👋 '} 
                {song.category === 'core-values' && '⭐ '} 
                {song.category.charAt(0).toUpperCase() + song.category.slice(1).replace('-', ' ')}
              </Badge>
              <span className="text-sm text-purple-600 flex items-center gap-1 font-medium">
                <Clock className="w-4 h-4" />
                {formatTime(song.duration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => toggleFavoriteMutation.mutate(song.id)}
              disabled={toggleFavoriteMutation.isPending}
              className="hover:bg-pink-100 transition-colors"
            >
              {isFavorite(song.id) ? (
                <Heart className="w-6 h-6 text-red-500 fill-current" />
              ) : (
                <HeartOff className="w-6 h-6 text-gray-400 hover:text-red-400" />
              )}
            </Button>
            <Button
              onClick={() => handlePlayPause(song)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              {currentSong?.id === song.id && isPlaying ? (
                <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {currentSong?.id === song.id && isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Fun Musical Header */}
        <div className="mb-8 text-center relative">
          {/* Return to Dashboard Button */}
          <Button 
            variant="outline" 
            className="absolute left-0 top-0 bg-white/80 hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800 shadow-lg"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {/* Musical Header */}
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Music className="w-12 h-12 text-purple-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                🎵 Classroom Music Studio 🎵
              </h1>
              <Headphones className="w-12 h-12 text-pink-600" />
            </div>
            
            <p className="text-xl text-gray-700 font-medium mb-4">
              🎶 Your magical music collection for transitions, activities & classroom fun! 🎶
            </p>
            
            {/* Fun Musical Stats */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <RadioIcon className="w-4 h-4 inline mr-2" />
                {Array.isArray(songs) ? songs.length : 0} Songs Available
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <Heart className="w-4 h-4 inline mr-2" />
                {Array.isArray(favorites) ? favorites.length : 0} Favorites
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <Volume2 className="w-4 h-4 inline mr-2" />
                Ready to Play!
              </div>
            </div>
          </div>
        </div>

      {/* Audio Player */}
      <audio ref={audioRef} />

      {/* Now Playing Card - Enhanced */}
      {currentSong && (
        <Card className="mb-6 bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 border-purple-300 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-3 font-bold">
              <Music className="w-6 h-6" />
              🎵 Now Playing 🎵
              <Volume2 className="w-6 h-6" />
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
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-purple-700 font-semibold mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Your Music
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title or artist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>
            <div className="md:w-64">
              <label className="block text-purple-700 font-semibold mb-2">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : 
                     category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs for All Music and Favorites */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-gradient-to-r from-purple-200 to-pink-200 p-1 rounded-xl">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 h-12 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Music className="w-5 h-5" />
            🎵 All Music ({filteredSongs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="favorites" 
            className="flex items-center gap-2 h-12 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Heart className="w-5 h-5" />
            ❤️ Favorites ({favoriteSongs.length})
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
      </div>
    </div>
  );
}