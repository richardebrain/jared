import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, Search, Video, Loader2, Play, ExternalLink, X, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VideoSectionBuilderProps {
  content: string;
  onContentChange: (content: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

interface VideoData {
  videoUrl: string;
  title: string;
  duration?: number;
  discussionPoints: string[];
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
    duration: 0,
    discussionPoints: []
  });
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [newDiscussionPoint, setNewDiscussionPoint] = useState('');
  const { toast } = useToast();

  // Parse content when it changes
  useEffect(() => {
    try {
      if (content && content !== '{}' && content !== '') {
        const parsed = JSON.parse(content);
        setVideoData({
          videoUrl: parsed.videoUrl || '',
          title: parsed.title || '',
          duration: parsed.duration || 0,
          discussionPoints: parsed.discussionPoints || []
        });
      }
    } catch (error) {
      console.error('Error parsing video content:', error);
      setVideoData({
        videoUrl: '',
        title: '',
        duration: 0,
        discussionPoints: []
      });
    }
  }, [content]);

  // Update content when video data changes
  const updateVideoData = (newData: Partial<VideoData>) => {
    const updated = { ...videoData, ...newData };
    setVideoData(updated);
    onContentChange(JSON.stringify(updated));
  };

  const searchVideos = async () => {
    if (!videoSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await apiRequest('/api/video-search/youtube-search', 'GET', {
        query: videoSearchQuery,
        maxResults: 8
      });
      
      if (response.success) {
        setSearchResults(response.videos || []);
      } else {
        toast({
          title: "Search Error",
          description: "Unable to search videos. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Video search error:', error);
      toast({
        title: "Search Error", 
        description: "Unable to search videos. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

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

  const addDiscussionPoint = () => {
    if (!newDiscussionPoint.trim()) return;
    
    updateVideoData({
      discussionPoints: [...videoData.discussionPoints, newDiscussionPoint.trim()]
    });
    setNewDiscussionPoint('');
  };

  const removeDiscussionPoint = (index: number) => {
    updateVideoData({
      discussionPoints: videoData.discussionPoints.filter((_, i) => i !== index)
    });
  };

  const [isGeneratingDiscussion, setIsGeneratingDiscussion] = useState(false);

  const generateDiscussionPoints = async () => {
    if (!videoData.title && !videoData.videoUrl) {
      toast({
        title: "Video Required",
        description: "Please select or add a video first.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingDiscussion(true);
    try {
      const response = await apiRequest('/api/ai/generate-discussion-points', 'POST', {
        videoTitle: videoData.title,
        videoUrl: videoData.videoUrl,
        topic: 'early childhood education' // You can make this dynamic based on module context
      });

      if (response.success && response.discussionPoints) {
        updateVideoData({
          discussionPoints: [...videoData.discussionPoints, ...response.discussionPoints]
        });
        toast({
          title: "Discussion Points Generated",
          description: `Added ${response.discussionPoints.length} discussion points.`,
        });
      } else {
        throw new Error('Failed to generate discussion points');
      }
    } catch (error) {
      console.error('Discussion generation error:', error);
      toast({
        title: "Generation Error",
        description: "Unable to generate discussion points. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDiscussion(false);
    }
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
          <Button onClick={onEditToggle} variant="outline" size="sm">
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

        {/* Discussion Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-medium">Discussion Points</Label>
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={generateDiscussionPoints}
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingDiscussion || (!videoData.title && !videoData.videoUrl)}
                  className="flex items-center space-x-1"
                >
                  {isGeneratingDiscussion ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isGeneratingDiscussion ? 'Generating...' : 'Generate AI Points'}</span>
                </Button>
                <Button
                  onClick={addDiscussionPoint}
                  variant="outline"
                  size="sm"
                  disabled={!newDiscussionPoint.trim()}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Manual</span>
                </Button>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex space-x-2">
              <Input
                value={newDiscussionPoint}
                onChange={(e) => setNewDiscussionPoint(e.target.value)}
                placeholder="Enter a discussion point..."
                onKeyPress={(e) => e.key === 'Enter' && addDiscussionPoint()}
              />
            </div>
          )}

          {videoData.discussionPoints.length > 0 && (
            <div className="space-y-2">
              {videoData.discussionPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <p className="text-gray-800">{point}</p>
                  {isEditing && (
                    <Button
                      onClick={() => removeDiscussionPoint(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
              <div className="flex space-x-2">
                <Input
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="help children grow"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                />
                <Button
                  onClick={searchVideos}
                  disabled={isSearching}
                  className="bg-green-700 hover:bg-green-800 text-white px-6"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
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
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-red-600">YouTube Results ({searchResults.length})</h4>
                  {searchResults.map((video: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-24 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 mb-1">{video.title}</h5>
                        <p className="text-sm text-gray-600 mb-1">By {video.channel}</p>
                        <p className="text-sm text-gray-600">
                          YouTube • <span className="text-blue-600 hover:underline cursor-pointer">View on YouTube</span>
                        </p>
                      </div>
                      <Button
                        onClick={() => selectVideo(video)}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Video</span>
                      </Button>
                    </div>
                  ))}
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