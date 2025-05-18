import React, { useState, useEffect } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Snippet {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string;
  source_url: string;
  license: string;
}

export default function EduTokFeed() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [cursor, setCursor] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMore = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/edutok/feed", {
        params: { cursor, limit: 5 },
      });
      
      if (res.data.snippets && res.data.snippets.length) {
        setSnippets([...snippets, ...res.data.snippets]);
        setCursor(res.data.snippets.slice(-1)[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching EduTok feed:", error);
      toast({
        title: "Failed to load videos",
        description: "Check your connection and try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle video playing - ensure only one plays at a time
  const handleVideoPlay = (index: number) => {
    setCurrentIndex(index);
    snippets.forEach((_, idx) => {
      const video = document.getElementById(`video-${idx}`) as HTMLVideoElement;
      if (idx === index) {
        video?.play();
      } else {
        video?.pause();
      }
    });
  };

  // Handle interaction buttons
  const handleLike = (id: number) => {
    toast({
      title: "Liked!",
      description: "You found this content helpful",
    });
  };

  const handleComment = (id: number) => {
    toast({
      title: "Comments",
      description: "Comments feature coming soon!",
    });
  };

  const handleShare = (id: number) => {
    navigator.clipboard.writeText(`Check out this great educational video on MentorMe: ${window.location.origin}/edutok/${id}`);
    toast({
      title: "Link copied!",
      description: "Share with your colleagues",
    });
  };

  const getPlaceholderVideos = () => {
    return [
      {
        id: 1,
        title: "Creating Calm Corners in Your Classroom",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail_url: "https://placehold.co/480x720/181D31/FFF.png?text=Calm+Corners",
        source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        license: "Educational"
      },
      {
        id: 2,
        title: "Mindful Transitions Between Activities",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail_url: "https://placehold.co/480x720/48425A/FFF.png?text=Activity+Transitions",
        source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        license: "Educational"
      },
      {
        id: 3,
        title: "Building Emotional Vocabulary with Preschoolers",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail_url: "https://placehold.co/480x720/5D5970/FFF.png?text=Emotional+Vocabulary",
        source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        license: "Educational"
      }
    ];
  };

  // Use placeholder data if API fails or during development
  useEffect(() => {
    if (snippets.length === 0 && !loading) {
      setSnippets(getPlaceholderVideos());
    }
  }, [snippets.length, loading]);

  return (
    <div className="edutok-container flex flex-col h-[calc(100vh-64px)] bg-gray-900">
      <div className="edutok-header text-center py-3 text-white border-b border-gray-800">
        <h1 className="text-xl font-bold">EduTok</h1>
        <p className="text-sm text-gray-400">Short, impactful teaching wisdom</p>
      </div>
      
      <InfiniteScroll
        dataLength={snippets.length}
        next={fetchMore}
        hasMore={true}
        loader={
          <div className="flex justify-center items-center h-16 text-white">
            <span className="animate-pulse">Loading more wisdom...</span>
          </div>
        }
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
        scrollableTarget="scrollableDiv"
      >
        {snippets.map((snippet, index) => (
          <div 
            key={snippet.id} 
            className="video-card snap-start h-full w-full flex items-center justify-center relative border-b border-gray-800 py-4"
            onClick={() => handleVideoPlay(index)}
          >
            <Card className="w-[90%] max-w-md overflow-hidden rounded-xl bg-black border-gray-700">
              <div className="relative pt-[125%]"> {/* 4:5 aspect ratio */}
                {snippet.thumbnail_url ? (
                  <img 
                    src={snippet.thumbnail_url} 
                    alt={snippet.title}
                    className="absolute top-0 left-0 w-full h-full object-cover z-10"
                    style={{display: currentIndex === index ? 'none' : 'block'}}
                  />
                ) : null}
                
                <video
                  id={`video-${index}`}
                  src={snippet.video_url}
                  poster={snippet.thumbnail_url}
                  controls
                  loop
                  playsInline
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentIndex === index) {
                      const video = e.target as HTMLVideoElement;
                      video.paused ? video.play() : video.pause();
                    }
                  }}
                />
              </div>
              
              <CardContent className="p-3 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0 z-20">
                <h3 className="text-white font-semibold text-lg mb-2">{snippet.title}</h3>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(snippet.id);
                      }}
                    >
                      <ThumbsUp className="w-5 h-5 mr-1" />
                      <span>Like</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComment(snippet.id);
                      }}
                    >
                      <MessageCircle className="w-5 h-5 mr-1" />
                      <span>Comment</span>
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(snippet.id);
                    }}
                  >
                    <Share2 className="w-5 h-5 mr-1" />
                    <span>Share</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}