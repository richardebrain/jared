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
  ExternalLink,
  ThumbsUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoResource, videoResourcesData } from '@shared/videoResources';
  // Transition Techniques Videos
  {
    id: "video-001",
    title: "Classroom Transitions: 5 Effective Strategies",
    description: "Learn research-backed strategies for smooth classroom transitions that minimize disruption and maximize learning time.",
    youtubeId: "3P4i15SUzLM",
    category: ["classroom-management", "transitions"],
    tags: ["transitions", "classroom management", "routines"],
    duration: 8,
    source: "Teaching Channel",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-002",
    title: "We're Going on a Bear Hunt | Movement Activity",
    description: "An engaging movement-based transition activity perfect for preschool settings, based on the popular children's book.",
    youtubeId: "KAT5NiWHFIU",
    category: ["transitions", "movement", "literacy"],
    tags: ["movement transitions", "literacy connection", "guided movement"],
    duration: 13,
    source: "Cosmic Kids Yoga",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-003",
    title: "Coco the Butterfly | Mindful Movement Activity",
    description: "A mindful movement activity that works well as both a transition and a core activity for developing body awareness.",
    youtubeId: "pT-s1-phgxs",
    category: ["mindfulness", "movement", "transitions"],
    tags: ["mindful transitions", "body awareness", "calm movement"],
    duration: 15,
    source: "Cosmic Kids Yoga",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Mindfulness Videos
  {
    id: "video-004",
    title: "Belly Breathing with Elmo",
    description: "A simple, effective breathing technique for young children demonstrated by Elmo and friends.",
    youtubeId: "_mZbzDOpylA",
    category: ["mindfulness", "self-regulation", "social-emotional"],
    tags: ["breathing exercises", "emotional regulation", "calm down technique"],
    duration: 3,
    source: "Sesame Street",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-005",
    title: "Mindful Listening: Sound Awareness for Young Children",
    description: "A guided mindful listening exercise perfect for circle time or transitions.",
    youtubeId: "uUIGKhG_Vq8",
    category: ["mindfulness", "sensory", "attention"],
    tags: ["mindful listening", "attention skills", "sensory awareness"],
    duration: 5,
    source: "Mindful Schools",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Active Listening Skills
  {
    id: "video-006",
    title: "Whole Body Listening for Children",
    description: "Clear, child-friendly explanation of active listening skills with visual supports.",
    youtubeId: "j87nbA2I7Zo",
    category: ["active-listening", "communication", "classroom-management"],
    tags: ["whole body listening", "listening skills", "communication"],
    duration: 7,
    source: "Mr. T's Phonics",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-007",
    title: "5 Active Listening Games for Children",
    description: "Engaging games to develop strong listening skills in preschool and kindergarten.",
    youtubeId: "H_O1brYwdSY",
    category: ["active-listening", "games", "group-activities"],
    tags: ["listening games", "group activities", "skill development"],
    duration: 11,
    source: "Kreative Leadership",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Social-Emotional Learning
  {
    id: "video-008",
    title: "Identifying and Expressing Feelings for Young Children",
    description: "A teacher-led discussion about emotional awareness with preschoolers.",
    youtubeId: "ZxfJicfyCdM",
    category: ["social-emotional", "feelings", "communication"],
    tags: ["emotions", "self-awareness", "expression"],
    duration: 9,
    source: "Head Start",
    expertLevel: "beginner",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-009",
    title: "Building Empathy in Early Childhood Classrooms",
    description: "Strategies for developing empathy in young children through everyday interactions.",
    youtubeId: "aEYcmNhfqlU",
    category: ["social-emotional", "empathy", "community-building"],
    tags: ["empathy development", "classroom community", "caring behaviors"],
    duration: 14,
    source: "Edutopia",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Inclusive Teaching
  {
    id: "video-010",
    title: "Universal Design for Learning in Early Childhood",
    description: "Practical applications of UDL principles in preschool and kindergarten settings.",
    youtubeId: "6RZUmzDu2p4",
    category: ["inclusion", "teaching-methods", "differentiation"],
    tags: ["UDL", "inclusive teaching", "diverse learners"],
    duration: 12,
    source: "CAST Professional Learning",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-011",
    title: "Supporting Children with Sensory Processing Differences",
    description: "Classroom accommodations and strategies for children with sensory needs.",
    youtubeId: "D1G5ssQlCYw",
    category: ["inclusion", "sensory", "adaptations"],
    tags: ["sensory processing", "accommodations", "inclusive environment"],
    duration: 10,
    source: "Special Education Guide",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: false
  },
  
  // Family Engagement
  {
    id: "video-012",
    title: "Effective Parent-Teacher Communication Strategies",
    description: "Building strong partnerships with families through various communication channels.",
    youtubeId: "aEYcmNhfqlU",
    category: ["family-engagement", "communication", "partnerships"],
    tags: ["parent communication", "family partnership", "relationship building"],
    duration: 13,
    source: "NAEYC",
    expertLevel: "intermediate",
    dateAdded: "2025-05-14",
    featured: true
  },
  {
    id: "video-013",
    title: "Engaging Families in Children's Learning Journey",
    description: "Creative ways to involve families in curriculum and learning experiences.",
    youtubeId: "1ZP-TMr984s",
    category: ["family-engagement", "curriculum", "community"],
    tags: ["family involvement", "learning at home", "community connections"],
    duration: 15,
    source: "Harvard Family Research Project",
    expertLevel: "advanced",
    dateAdded: "2025-05-14",
    featured: false
  }
];

// Component for the Video Resource Library
export function VideoResourceLibrary() {
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Video Resource Library</h2>
        <p className="text-muted-foreground mt-2">
          Explore our collection of high-quality educational videos covering a variety of early childhood education topics
        </p>
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
      
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <Card key={video.id} className="overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${video.youtubeId}`} 
                title={video.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                onLoad={() => markAsWatched(video.id)}
              ></iframe>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={`absolute top-2 right-2 bg-black/50 hover:bg-black/70 ${
                  bookmarkedVideos.includes(video.id) ? 'text-yellow-400' : 'text-white'
                }`}
                onClick={() => toggleBookmark(video.id)}
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </Button>
            </div>
            
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
              <CardDescription className="line-clamp-2">{video.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex flex-wrap gap-1 mb-2">
                {video.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {video.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{video.tags.length - 3}</Badge>
                )}
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {video.duration} min
                </div>
                <div className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {video.expertLevel}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div className="flex items-center text-sm">
                <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">{video.source}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {watchedVideos.includes(video.id) && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Open</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
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