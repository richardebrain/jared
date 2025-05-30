import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bookmark, 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Tag, 
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  Award,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoResource, videoResourcesData } from '@shared/videoResources';
import { enhancedProfessionalVideoLibrary, featuredProfessionalVideos, EnhancedProfessionalVideo } from '@shared/enhancedProfessionalVideoLibrary';
import '../lib/videoValidator'; // Import the validator for global use
import VideoResourceCard from '@/components/VideoResourceCard';
import { VideoRating } from '@/components/VideoRating';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

// Convert enhanced professional videos to VideoResource format
function convertEnhancedToVideoResource(enhancedVideo: EnhancedProfessionalVideo): VideoResource {
  return {
    id: enhancedVideo.id,
    title: enhancedVideo.title,
    description: enhancedVideo.description,
    youtubeId: enhancedVideo.youtubeId || '',
    category: enhancedVideo.category,
    tags: enhancedVideo.tags,
    duration: enhancedVideo.duration,
    source: enhancedVideo.source,
    expertLevel: enhancedVideo.expertLevel,
    dateAdded: enhancedVideo.dateAdded,
    featured: enhancedVideo.featured,
    quiz: {
      questions: [
        {
          question: `What is the main focus of "${enhancedVideo.title}"?`,
          options: [
            "General teaching strategies",
            "Professional development and best practices",
            "Classroom management only",
            "Administrative procedures"
          ],
          correctAnswer: 1,
          explanation: "This video focuses on professional development and evidence-based practices in early childhood education."
        }
      ]
    }
  };
}

// Complete collection (all 482+ videos)
const completeVideoResources: VideoResource[] = [
  ...videoResourcesData,
  ...enhancedProfessionalVideoLibrary.map(convertEnhancedToVideoResource)
];

// Featured videos for fast loading (top 40 videos)
const featuredVideoResources: VideoResource[] = [
  ...videoResourcesData.slice(0, 20), // Top 20 from base collection
  ...featuredProfessionalVideos.slice(0, 20).map(convertEnhancedToVideoResource) // Top 20 from professional collection
];

// Component for the Video Resource Library
interface VideoResourceLibraryProps {
  showFilters?: boolean;
  compactMode?: boolean;
}

export function VideoResourceLibrary({ 
  showFilters = true, 
  compactMode = false 
}: VideoResourceLibraryProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [filteredVideos, setFilteredVideos] = useState<VideoResource[]>(featuredVideoResources);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExpertLevel, setSelectedExpertLevel] = useState<string>("all");
  const [bookmarkedVideos, setBookmarkedVideos] = useState<string[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [videosRemaining, setVideosRemaining] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Fetch daily video completion count
  useEffect(() => {
    const fetchVideoRemainingCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/videos/completions');
        if (response.ok) {
          const data = await response.json();
          
          // Calculate how many videos can still earn points today (max 2)
          // Only count completions that have points awarded - those are the ones that count against daily limit
          const completedToday = data.filter((completion: any) => {
            const completedDate = new Date(completion.completedAt);
            const today = new Date();
            // Only count if it was completed today AND has points awarded
            return completedDate.toDateString() === today.toDateString() && completion.pointsEarned > 0;
          }).length;
          
          setVideosRemaining(Math.max(0, 2 - completedToday));
        } else {
          console.error('Failed to fetch video completions');
          // Default to 2 if we can't determine the actual count
          setVideosRemaining(2);
        }
      } catch (error) {
        console.error('Error fetching video completions:', error);
        setVideosRemaining(2);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideoRemainingCount();
  }, []);
  
  // Expose videos data globally for the validation utility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.videoResourcesData = showComplete ? completeVideoResources : featuredVideoResources;
      
      // Log instructions for validation in dev mode
      console.info(
        '%c🎬 Video Validation Tools Available 🎬',
        'background: #111; color: #bada55; padding: 4px; border-radius: 4px; font-size: 12px;'
      );
      console.info(
        'Run this command to check all videos: %cwindow.validateAllVideos()',
        'color: #0099ff; font-weight: bold;'
      );
      console.info(
        'Or check a specific video: %cwindow.checkYouTubeVideo("YOUTUBE_ID")',
        'color: #0099ff; font-weight: bold;'
      );
    }
  }, []);

  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterVideos(query, selectedCategory, selectedExpertLevel, activeFilter);
  };

  // Function to handle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterVideos(searchQuery, category, selectedExpertLevel, activeFilter);
  };

  // Function to handle expert level filter
  const handleExpertLevelChange = (level: string) => {
    setSelectedExpertLevel(level);
    filterVideos(searchQuery, selectedCategory, level, activeFilter);
  };

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveFilter(value);
    filterVideos(searchQuery, selectedCategory, selectedExpertLevel, value);
  };

  // Function to toggle bookmark
  const toggleBookmark = (videoId: string) => {
    if (bookmarkedVideos.includes(videoId)) {
      setBookmarkedVideos(bookmarkedVideos.filter(id => id !== videoId));
    } else {
      setBookmarkedVideos([...bookmarkedVideos, videoId]);
    }
  };

  // Function to mark as watched
  const markAsWatched = (videoId: string) => {
    if (!watchedVideos.includes(videoId)) {
      setWatchedVideos([...watchedVideos, videoId]);
    }
  };

  // Combined filter function
  const filterVideos = (
    query: string, 
    category: string, 
    level: string, 
    tab: string
  ) => {
    let results = showComplete ? completeVideoResources : featuredVideoResources;
    
    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(video => 
        video.title.toLowerCase().includes(lowerQuery) || 
        video.description.toLowerCase().includes(lowerQuery) ||
        video.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Filter by category
    if (category && category !== "all") {
      results = results.filter(video => 
        video.category.includes(category)
      );
    }
    
    // Filter by expert level
    if (level && level !== "all") {
      results = results.filter(video => 
        video.expertLevel === level
      );
    }
    
    // Filter by tab (all, featured, bookmarked, watched)
    if (tab === "all") {
      // Show complete collection for "All Videos" tab
      results = completeVideoResources;
      
      // Apply search filter to complete collection
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(video => 
          video.title.toLowerCase().includes(lowerQuery) ||
          video.description.toLowerCase().includes(lowerQuery) ||
          video.category.some(cat => cat.toLowerCase().includes(lowerQuery)) ||
          video.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }
      
      // Apply category filter to complete collection
      if (category !== "all") {
        results = results.filter(video => 
          video.category.includes(category)
        );
      }
      
      // Apply expert level filter to complete collection
      if (level !== "all") {
        results = results.filter(video => 
          video.expertLevel === level
        );
      }
    } else if (tab === "featured") {
      // Show only featured videos for "Featured" tab  
      results = featuredVideoResources;
      
      // Apply search filter to featured collection
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(video => 
          video.title.toLowerCase().includes(lowerQuery) ||
          video.description.toLowerCase().includes(lowerQuery) ||
          video.category.some(cat => cat.toLowerCase().includes(lowerQuery)) ||
          video.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }
      
      // Apply category filter to featured collection
      if (category !== "all") {
        results = results.filter(video => 
          video.category.includes(category)
        );
      }
      
      // Apply expert level filter to featured collection
      if (level !== "all") {
        results = results.filter(video => 
          video.expertLevel === level
        );
      }
    } else if (tab === "bookmarked") {
      results = results.filter(video => bookmarkedVideos.includes(video.id));
    } else if (tab === "watched") {
      results = results.filter(video => watchedVideos.includes(video.id));
    }
    
    setFilteredVideos(results);
  };

  // All unique categories from the video data
  const currentVideoSet = showComplete ? completeVideoResources : featuredVideoResources;
  const categories = Array.from(
    new Set(currentVideoSet.flatMap(video => video.category))
  ).sort();

  return (
    <div className={compactMode ? "w-full" : "container mx-auto px-4 py-6 max-w-6xl"}>
      {/* Content filtering controls below */}
      
      {/* Daily Video Limit Counter */}
      <div className="mb-6 bg-muted/30 rounded-lg p-4 border border-muted">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Award className="h-4 w-4 text-primary mr-2" />
            Daily Video Points
          </h3>
          <span className="text-sm font-medium">
            {videosRemaining > 0 
              ? `${videosRemaining} video${videosRemaining > 1 ? 's' : ''} remaining today` 
              : 'Daily limit reached'}
          </span>
        </div>
        <Progress 
          value={((2 - videosRemaining) / 2) * 100} 
          className="h-2 mb-1" 
        />
        <p className="text-xs text-muted-foreground">
          You can earn points for up to 2 videos per day. Each video can earn you 5-8 points based on length.
        </p>
      </div>
      
      {showFilters && (
        <>
          {/* Library Size Toggle */}
          <div className="mb-4 flex items-center justify-between bg-muted/30 rounded-lg p-4 border border-muted">
            <div>
              <h3 className="text-sm font-medium mb-1">Library View</h3>
              <p className="text-xs text-muted-foreground">
                {showComplete 
                  ? `Complete Collection: ${completeVideoResources.length} videos (all platforms)`
                  : `Featured Collection: ${featuredVideoResources.length} videos (recommended)`
                }
              </p>
            </div>
            <Button
              variant={showComplete ? "outline" : "default"}
              size="sm"
              onClick={() => {
                const newShowComplete = !showComplete;
                setShowComplete(newShowComplete);
                const newVideoSet = newShowComplete ? completeVideoResources : featuredVideoResources;
                setFilteredVideos(newVideoSet);
                // Re-apply current filters to the new video set
                setTimeout(() => {
                  filterVideos(searchQuery, selectedCategory, selectedExpertLevel, activeFilter);
                }, 0);
              }}
            >
              {showComplete ? "Featured" : "All Videos"}
            </Button>
          </div>
          
          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search videos by title, description or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedExpertLevel} onValueChange={handleExpertLevelChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" title="More Filters">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs for different views */}
          <Tabs defaultValue="all" value={activeFilter} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Videos</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
              <TabsTrigger value="watched">Watched</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredVideos.length} video resources
          </div>
        </>
      )}
      
      {/* Video Grid */}
      <div className={`grid grid-cols-1 ${compactMode ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
        {filteredVideos.map(video => (
          <VideoResourceCard
            key={video.id}
            video={video}
            isBookmarked={bookmarkedVideos.includes(video.id)}
            isWatched={watchedVideos.includes(video.id)}
            onBookmark={toggleBookmark}
            onWatch={markAsWatched}
            compactMode={compactMode}
          />
        ))}
      </div>
      
      {/* Video validation tool (hidden by default) */}
      {showAdminTools && (
        <div className="mb-8 p-4 border border-amber-200 bg-amber-50 rounded-md">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
            Video Validation Tools
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Use these tools to check for unavailable videos in the library.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            disabled={isValidating}
            onClick={() => {
              setIsValidating(true);
              if (typeof window !== 'undefined' && window.validateAllVideos) {
                window.validateAllVideos()
                  .then(() => {
                    setIsValidating(false);
                  })
                  .catch((error) => {
                    console.error('Video validation error:', error);
                    setIsValidating(false);
                  });
              } else {
                console.error('Validation utility not loaded');
                setIsValidating(false);
              }
            }}
          >
            {isValidating ? 'Checking Videos...' : 'Check All Videos'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdminTools(false)}
          >
            Hide Tools
          </Button>
        </div>
      )}

      {/* Admin tools toggle (hidden when compact mode is enabled) */}
      {!compactMode && !showAdminTools && (
        <div className="mb-4 text-right">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowAdminTools(true)}
          >
            Admin Tools
          </Button>
        </div>
      )}
      
      {/* Empty state */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium">No videos found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters to find what you're looking for
          </p>
        </div>
      )}
    </div>
  );
}