import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, CheckCircle2, Clock, Target } from 'lucide-react';

interface VideoSectionProps {
  content: string;
  title: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

interface VideoData {
  description: string;
  videoUrl: string;
  title: string;
  duration?: number;
  generateQuestions?: boolean;
}

export default function VideoSection({ content, title, onComplete, isCompleted }: VideoSectionProps) {
  const [isWatched, setIsWatched] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  // Parse video content
  React.useEffect(() => {
    try {
      if (content && content !== '{}' && content !== '') {
        const parsed = JSON.parse(content);
        setVideoData(parsed);
      }
    } catch (error) {
      console.error('Error parsing video content:', error);
      // Fallback to treating content as description
      setVideoData({
        description: content || '',
        videoUrl: '',
        title: title,
        duration: 0,
        generateQuestions: false
      });
    }
  }, [content, title]);

  const getVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const handleVideoComplete = () => {
    setIsWatched(true);
    if (onComplete) {
      onComplete();
    }
  };

  if (!videoData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading video content...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold mb-2">
              {videoData.title || title}
            </CardTitle>
            <div className="flex items-center gap-3">
              {videoData.duration && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {videoData.duration} min
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Learning Objectives */}
        {videoData.description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Learning Objectives</h4>
                <p className="text-blue-800 text-sm leading-relaxed">{videoData.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoData.videoUrl ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
              <iframe
                src={getEmbedUrl(videoData.videoUrl)}
                title={videoData.title || title}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                onLoad={() => {
                  // Mark as watched when video loads
                  setTimeout(() => setIsWatched(true), 2000);
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="w-4 h-4" />
                <span>Video embedded and ready to watch</span>
              </div>
              <a
                href={videoData.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in YouTube
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Video Content Coming Soon</h3>
            <p className="text-gray-500">
              Video resources are being prepared for this section. Check back soon for video-based learning content.
            </p>
          </div>
        )}

        {/* Interactive Features Notice */}
        {videoData.generateQuestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Interactive Learning</h4>
            <p className="text-amber-800 text-sm">
              After watching this video, you'll have the opportunity to test your understanding with automatically generated quiz questions based on the content.
            </p>
          </div>
        )}

        {/* Completion Action */}
        {!isCompleted && videoData.videoUrl && (
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleVideoComplete}
              disabled={!isWatched}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Watched
            </Button>
          </div>
        )}

        {/* Already completed state */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-green-800 font-medium">Video section completed!</p>
            <p className="text-green-700 text-sm mt-1">
              Great job watching the educational content. Continue to the next section when ready.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}