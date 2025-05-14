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
  ThumbsUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoResource, videoResourcesData } from '@shared/videoResources';
import '../lib/videoValidator'; // Import the validator for global use
import VideoResourceCard from '@/components/VideoResourceCard';

// Component for the Video Resource Library
interface VideoResourceLibraryProps {
  showFilters?: boolean;
  compactMode?: boolean;
}

export function VideoResourceLibrary({ 
  showFilters = true, 
  compactMode = false 
}: VideoResourceLibraryProps) {
  const [filteredVideos, setFilteredVideos] = useState<VideoResource[]>(videoResourcesData);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExpertLevel, setSelectedExpertLevel] = useState<string>("all");
  const [bookmarkedVideos, setBookmarkedVideos] = useState<string[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

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
    let results = videoResourcesData;
    
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
    if (tab === "featured") {
      results = results.filter(video => video.featured);
    } else if (tab === "bookmarked") {
      results = results.filter(video => bookmarkedVideos.includes(video.id));
    } else if (tab === "watched") {
      results = results.filter(video => watchedVideos.includes(video.id));
    }
    
    setFilteredVideos(results);
  };

  // All unique categories from the video data
  const categories = Array.from(
    new Set(videoResourcesData.flatMap(video => video.category))
  ).sort();

  return (
    <div className={compactMode ? "w-full" : "container mx-auto px-4 py-6 max-w-6xl"}>
      {/* Content filtering controls below */}
      
      {showFilters && (
        <>
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