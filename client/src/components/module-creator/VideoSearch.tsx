import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Video,
  Youtube,
  Plus,
  Clock,
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface VideoSearchProps {
  onVideoSelect: (videoUrl: string, videoTitle: string) => void;
  onClose: () => void;
  initialQuery?: string;
}

interface VideoResult {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCount?: string;
  description?: string;
  source: 'library' | 'youtube';
}

export default function VideoSearch({ onVideoSelect, onClose, initialQuery = '' }: VideoSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [videoSearchResults, setVideoSearchResults] = useState<VideoResult[]>([]);
  const [youtubeSearchResults, setYoutubeSearchResults] = useState<VideoResult[]>([]);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  const searchVideoLibrary = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingVideos(true);
    try {
      const response = await fetch(`/api/video-search/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setVideoSearchResults(results.map((result: any) => ({
          ...result,
          source: 'library' as const
        })));
      }
    } catch (error) {
      console.error('Video library search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search video library. Please try again.",
        variant: "destructive",
      });
    }
    setIsSearchingVideos(false);
  };

  const searchYouTube = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingYoutube(true);
    try {
      const response = await fetch(`/api/video-search/youtube-search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setYoutubeSearchResults(results.map((result: any) => ({
          ...result,
          source: 'youtube' as const
        })));
      }
    } catch (error) {
      console.error('YouTube search error:', error);
      toast({
        title: "YouTube Search Failed",
        description: "Unable to search YouTube. Please try again.",
        variant: "destructive",
      });
    }
    setIsSearchingYoutube(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Search both library and YouTube simultaneously
    await Promise.all([
      searchVideoLibrary(searchQuery),
      searchYouTube(searchQuery)
    ]);
  };

  const handleVideoSelect = (video: VideoResult) => {
    onVideoSelect(video.videoUrl, video.title);
    toast({
      title: "Video Added",
      description: `Added "${video.title}" to the section`,
    });
  };

  const addCustomVideoUrl = () => {
    if (!customVideoUrl.trim()) return;
    
    // Extract title from URL or use a default
    let title = "Custom Video";
    try {
      const url = new URL(customVideoUrl);
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        title = "YouTube Video";
      } else if (url.hostname.includes('vimeo.com')) {
        title = "Vimeo Video";
      }
    } catch (error) {
      // Invalid URL, but we'll still allow it
    }
    
    onVideoSelect(customVideoUrl, title);
    setCustomVideoUrl('');
    
    toast({
      title: "Custom Video Added",
      description: "Added custom video URL to the section",
    });
  };

  const VideoCard = ({ video }: { video: VideoResult }) => (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {video.thumbnailUrl && (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-20 h-14 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
            {video.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{video.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="outline" className="text-xs">
                {video.source === 'library' ? 'Library' : 'YouTube'}
              </Badge>
              {video.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {video.duration}
                </span>
              )}
              {video.viewCount && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {video.viewCount}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleVideoSelect(video)}
            className="flex-shrink-0"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Video Search</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearchingVideos || isSearchingYoutube || !searchQuery.trim()}
        >
          {(isSearchingVideos || isSearchingYoutube) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      </div>

      {/* Custom Video URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Add Custom Video URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste video URL (YouTube, Vimeo, etc.)"
              value={customVideoUrl}
              onChange={(e) => setCustomVideoUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={addCustomVideoUrl}
              disabled={!customVideoUrl.trim()}
            >
              Add URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Library Results */}
      {videoSearchResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Library Results ({videoSearchResults.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {videoSearchResults.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* YouTube Results */}
      {youtubeSearchResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            YouTube Results ({youtubeSearchResults.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {youtubeSearchResults.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isSearchingVideos && !isSearchingYoutube && 
       videoSearchResults.length === 0 && youtubeSearchResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No videos found for "{searchQuery}"</p>
          <p className="text-sm">Try a different search term or add a custom URL</p>
        </div>
      )}
    </div>
  );
}