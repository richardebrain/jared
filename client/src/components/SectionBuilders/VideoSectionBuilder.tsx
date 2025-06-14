import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wand2, Edit, Save, Search, Video, Loader2, Play, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VideoSectionBuilderProps {
  content: string;
  onContentChange: (content: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onRegenerateAI: () => void;
}

interface VideoData {
  description: string;
  videoUrl: string;
  title: string;
  duration?: number;
  generateQuestions?: boolean;
}

export default function VideoSectionBuilder({
  content,
  onContentChange,
  isEditing,
  onEditToggle,
  onRegenerateAI
}: VideoSectionBuilderProps) {
  const [videoData, setVideoData] = useState<VideoData>({
    description: '',
    videoUrl: '',
    title: '',
    duration: 0,
    generateQuestions: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Parse content when it changes
  useEffect(() => {
    try {
      if (content && content !== '{}' && content !== '') {
        const parsed = JSON.parse(content);
        setVideoData(parsed);
      }
    } catch (error) {
      console.error('Error parsing video content:', error);
      // Initialize with default structure
      setVideoData({
        description: content || '',
        videoUrl: '',
        title: '',
        duration: 0,
        generateQuestions: false
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
      const response = await apiRequest('GET', `/api/videos/search?q=${encodeURIComponent(videoSearchQuery)}&limit=5`);
      setSearchResults(response.videos || []);
    } catch (error) {
      console.error('Error searching videos:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search videos. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectVideo = (video: any) => {
    updateVideoData({
      videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      title: video.title,
      duration: video.duration || 0
    });
    setShowVideoSearch(false);
    setSearchResults([]);
    toast({
      title: "Video Selected",
      description: `Added "${video.title}" to your section.`
    });
  };

  const generateAIVideo = async () => {
    setIsGenerating(true);
    try {
      onRegenerateAI();
      toast({
        title: "Generating Video Content",
        description: "AI is creating video recommendations and content structure.",
      });
    } catch (error) {
      console.error('Error generating video content:', error);
      // Provide example video structure
      const exampleVideoData: VideoData = {
        description: 'This video demonstrates effective classroom management techniques for early childhood educators, showing practical strategies for maintaining positive behavior and engagement during group activities.',
        videoUrl: '',
        title: 'Classroom Management Strategies',
        duration: 300,
        generateQuestions: true
      };
      updateVideoData(exampleVideoData);
      toast({
        title: "Example Video Structure Created",
        description: "Sample video section has been set up for you to customize.",
      });
    } finally {
      setIsGenerating(false);
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
        <div>
          <CardTitle className="text-lg font-semibold">Video Learning Section</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Add educational videos with interactive elements and discussion prompts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAIVideo}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            AI Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditToggle}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            {/* Video Description */}
            <div>
              <Label htmlFor="video-description">Video Description</Label>
              <Textarea
                id="video-description"
                value={videoData.description}
                onChange={(e) => updateVideoData({ description: e.target.value })}
                placeholder="Describe what this video should demonstrate or teach..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Video Title */}
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                value={videoData.title}
                onChange={(e) => updateVideoData({ title: e.target.value })}
                placeholder="Enter video title..."
                className="mt-1"
              />
            </div>

            {/* Video Selection */}
            <div>
              <Label>Video Selection</Label>
              <div className="space-y-3 mt-2">
                {videoData.videoUrl ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green-800">Video Selected</div>
                        <div className="text-xs text-green-600 truncate max-w-md">{videoData.videoUrl}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVideoSearch(true)}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Change Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVideoSearch(true)}
                    className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 py-6"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Find Video for This Section
                  </Button>
                )}

                {/* Manual Video URL Input */}
                <div>
                  <Label htmlFor="video-url">Or Enter Video URL</Label>
                  <Input
                    id="video-url"
                    value={videoData.videoUrl}
                    onChange={(e) => updateVideoData({ videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>

                {/* Video Search Modal */}
                {showVideoSearch && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={videoSearchQuery}
                        onChange={(e) => setVideoSearchQuery(e.target.value)}
                        placeholder="Search for educational videos..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                      />
                      <Button onClick={searchVideos} disabled={isSearching}>
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowVideoSearch(false)}>
                        Cancel
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((video, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectVideo(video)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{video.title}</div>
                              <div className="text-xs text-gray-600">
                                {video.duration} min • {video.category?.join(', ')}
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Select
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="video-duration">Duration (minutes)</Label>
              <Input
                id="video-duration"
                type="number"
                value={videoData.duration || ''}
                onChange={(e) => updateVideoData({ duration: parseInt(e.target.value) || 0 })}
                placeholder="5"
                className="mt-1"
                min="1"
                max="60"
              />
            </div>

            {/* Generate Questions Option */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="generate-questions"
                checked={videoData.generateQuestions || false}
                onChange={(e) => updateVideoData({ generateQuestions: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="generate-questions" className="text-sm text-blue-700 cursor-pointer">
                Generate quiz questions automatically from this video content
              </Label>
            </div>
          </>
        ) : (
          <>
            {/* Preview Mode */}
            {videoData.title && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{videoData.title}</h3>
                {videoData.duration && (
                  <Badge variant="secondary" className="mb-3">
                    {videoData.duration} minutes
                  </Badge>
                )}
              </div>
            )}

            {videoData.description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Learning Objectives:</h4>
                <p className="text-blue-800 text-sm">{videoData.description}</p>
              </div>
            )}

            {videoData.videoUrl && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={getEmbedUrl(videoData.videoUrl)}
                    title={videoData.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Video embedded and ready for learners</span>
                  <a
                    href={videoData.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in YouTube
                  </a>
                </div>
              </div>
            )}

            {videoData.generateQuestions && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">Interactive Features:</h4>
                <p className="text-amber-800 text-sm">
                  Quiz questions will be automatically generated from this video content to reinforce learning.
                </p>
              </div>
            )}

            {!videoData.videoUrl && !videoData.description && (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">No video content configured yet.</p>
                <Button onClick={() => onEditToggle()} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Add Video Content
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}