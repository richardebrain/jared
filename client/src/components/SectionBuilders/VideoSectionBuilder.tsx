import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, Search, Video, Loader2, Play, ExternalLink, X, Plus, BookOpen, Youtube, Wand2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VideoSectionBuilderProps {
  content: string;
  onContentChange: (content: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

interface VideoData {
  videoUrl: string;
  title: string;
  duration?: number;
}

export default function VideoSectionBuilder({
  content,
  onContentChange,
  isEditing,
  onEditToggle
}: VideoSectionBuilderProps) {
  const [videoData, setVideoData] = useState<VideoData>({
    videoUrl: '',
    title: '',
    duration: 0
  });
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingLibrary, setIsSearchingLibrary] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const { toast } = useToast();

  // Parse content when it changes
  useEffect(() => {
    try {
      if (content && content !== '{}' && content !== '') {
        const parsed = JSON.parse(content);
        setVideoData({
          videoUrl: parsed.videoUrl || '',
          title: parsed.title || '',
          duration: parsed.duration || 0
        });
      }
    } catch (error) {
      console.error('Error parsing video content:', error);
      setVideoData({
        videoUrl: '',
        title: '',
        duration: 0
      });
    }
  }, [content]);

  // Update content when video data changes
  const updateVideoData = (newData: Partial<VideoData>) => {
    const updated = { ...videoData, ...newData };
    setVideoData(updated);
    onContentChange(JSON.stringify(updated));
  };

  const searchVideoLibrary = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingLibrary(true);
    try {
      const response = await fetch(`/api/video-search/search?q=${encodeURIComponent(query)}&topic=${encodeURIComponent('early childhood education')}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Video library search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search video library. Please try again.",
        variant: "destructive",
      });
    }
    setIsSearchingLibrary(false);
  };

  const searchYouTube = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearchingYoutube(true);
    try {
      const response = await fetch(`/api/video-search/youtube-search?q=${encodeURIComponent(query)}&topic=${encodeURIComponent('early childhood education')}`);
      if (response.ok) {
        const results = await response.json();
        setYoutubeResults(results);
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

  const searchVideos = async () => {
    if (!videoSearchQuery.trim()) return;
    
    setIsSearching(true);
    // Search both library and YouTube simultaneously
    await Promise.all([
      searchVideoLibrary(videoSearchQuery),
      searchYouTube(videoSearchQuery)
    ]);
    setIsSearching(false);
  };

  const saveChanges = async () => {
    if (!videoData.videoUrl.trim() || !videoData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    const data = {blocks:[{

      type:'video',
      title:videoData.title,
      content:videoData.videoUrl,
      preview:videoData.title,
    }]}
    onContentChange(data)
    onEditToggle();
  }

  const selectVideo = (video: any) => {
    updateVideoData({
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.title || 'Selected Video'
    });
    setShowVideoSearch(false);
    setVideoSearchQuery('');
    setSearchResults([]);
    
    toast({
      title: "Video Added",
      description: `Selected: ${video.title}`,
    });
  };

  const addCustomUrl = () => {
    if (!customUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive"
      });
      return;
    }

    updateVideoData({
      videoUrl: customUrl,
      title: videoData.title || 'Custom Video'
    });
    setCustomUrl('');
    setShowVideoSearch(false);
    
    toast({
      title: "Video Added",
      description: "Custom video URL has been added.",
    });
  };







  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Video Section</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowVideoSearch(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Find Video</span>
          </Button>
          <Button onClick={saveChanges} variant="outline" size="sm">
            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Video Preview */}
        {videoData.videoUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="aspect-video bg-white rounded-lg overflow-hidden mb-4">
              <iframe
                src={getEmbedUrl(videoData.videoUrl)}
                title="Video preview"
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{videoData.title}</h3>
                {videoData.duration && videoData.duration > 0 && (
                  <p className="text-sm text-gray-600">{Math.floor(videoData.duration / 60)} minutes</p>
                )}
              </div>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Video className="w-3 h-3" />
                <span>Video</span>
              </Badge>
            </div>
          </div>
        )}



        {/* Manual Input Fields */}
        {isEditing && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                value={videoData.title}
                onChange={(e) => updateVideoData({ title: e.target.value })}
                placeholder="Enter video title..."
              />
            </div>

            <div>
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={videoData.videoUrl}
                onChange={(e) => updateVideoData({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Video Search Modal */}
      {showVideoSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Find Video for Your Module</h3>
              <Button
                onClick={() => setShowVideoSearch(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-gray-600 mb-6">
              Search our video library, find videos on YouTube, or add your own video link
            </p>

            <div className="space-y-6">
              {/* Search Section */}
              <div className="space-y-3">
                <Input
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="help children grow"
                  className="border-blue-300 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-blue-300 text-blue-700"
                    onClick={() => searchVideoLibrary(videoSearchQuery)}
                    disabled={isSearchingLibrary || !videoSearchQuery.trim()}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    {isSearchingLibrary ? 'Searching...' : 'Library'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-300 text-red-700"
                    onClick={() => searchYouTube(videoSearchQuery)}
                    disabled={isSearchingYoutube || !videoSearchQuery.trim()}
                  >
                    <Youtube className="h-3 w-3 mr-1" />
                    {isSearchingYoutube ? 'Searching...' : 'YouTube'}
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={searchVideos}
                    disabled={isSearching || !videoSearchQuery.trim()}
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {isSearching ? 'Searching...' : 'Search All'}
                  </Button>
                </div>
              </div>

              {/* Custom URL Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Add Custom Video URL</h4>
                <div className="flex space-x-2">
                  <Input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="flex-1"
                  />
                  <Button
                    onClick={addCustomUrl}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Add URL</span>
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {(searchResults.length > 0 || youtubeResults.length > 0) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Choose a video to add:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    
                    {/* Library Videos */}
                    {searchResults.map((video, index) => (
                      <div key={`library-${index}`} className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 truncate">{video.title}</p>
                            <p className="text-xs text-blue-700 mt-1">{video.description || video.category}</p>
                            <p className="text-xs text-gray-500 mt-1">Library Video • {video.duration || 'Duration unknown'}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="ml-3 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              updateVideoData({
                                videoUrl: video.url,
                                title: video.title,
                                duration: parseInt(video.duration) || 0
                              });
                              setShowVideoSearch(false);
                              setVideoSearchQuery('');
                              setSearchResults([]);
                              setYoutubeResults([]);
                              toast({
                                title: "Video Added",
                                description: `Added "${video.title}" from library`,
                              });
                            }}
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Add Video
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* YouTube Videos */}
                    {youtubeResults.map((video, index) => (
                      <div key={`youtube-${index}`} className="p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900 truncate">{video.title}</p>
                            <p className="text-xs text-red-700 mt-1">{video.channelTitle}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                            <p className="text-xs text-gray-500 mt-1">YouTube Video</p>
                          </div>
                          {video.thumbnail && (
                            <img src={video.thumbnail} alt="" className="w-16 h-12 object-cover rounded ml-3 flex-shrink-0" />
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="ml-3 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                              updateVideoData({
                                videoUrl: video.url,
                                title: video.title,
                                duration: 0
                              });
                              setShowVideoSearch(false);
                              setVideoSearchQuery('');
                              setSearchResults([]);
                              setYoutubeResults([]);
                              toast({
                                title: "Video Added",
                                description: `Added "${video.title}" from YouTube`,
                              });
                            }}
                          >
                            <Youtube className="h-3 w-3 mr-1" />
                            Add Video
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Tips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Search Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use specific terms like "classroom management" or "early literacy"</li>
                  <li>• Include age groups: "preschool", "toddler", "kindergarten"</li>
                  <li>• Try topic keywords: "social emotional learning", "STEM activities"</li>
                  <li>• Use educator terms: "ECE", "developmentally appropriate", "scaffolding"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}