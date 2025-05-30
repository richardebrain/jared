import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Plus, 
  MoreVertical,
  Play,
  Clock,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { VideoResource, videoResourcesData } from '@shared/videoResources';
import { enhancedProfessionalVideoLibrary } from '@shared/enhancedProfessionalVideoLibrary';
import Header from '@/components/Header';

interface VideoStats {
  totalViews: number;
  completions: number;
  avgRating: number;
  isVisible: boolean;
}

interface VideoWithStats extends VideoResource {
  stats: VideoStats;
}

export default function AdminVideoLibraryPage() {
  const [videos, setVideos] = useState<VideoWithStats[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize videos with real stats from database
  useEffect(() => {
    const initializeVideos = async () => {
      try {
        // Fetch video statistics from the API
        const statsResponse = await fetch('/api/videos/stats');
        const videoStats = statsResponse.ok ? await statsResponse.json() : {};

        const enhancedVideos = enhancedProfessionalVideoLibrary.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
          category: Array.isArray(video.category) ? video.category[0] || 'general' : 'general',
          subcategory: Array.isArray(video.category) ? video.category[1] || '' : '',
          tags: video.tags,
          duration: video.duration,
          difficulty: video.expertLevel,
          year: video.year?.toString() || '2024',
          citation: video.citation || '',
          featured: video.featured || false
        }));

        const allVideos = [
          ...videoResourcesData,
          ...enhancedVideos
        ];

        const videosWithStats: VideoWithStats[] = allVideos.map(video => {
          const stats = videoStats[video.id] || {
            totalViews: 0,
            completions: 0,
            avgRating: 0,
            isVisible: true
          };
          
          return {
            ...video,
            stats
          };
        });

        setVideos(videosWithStats);
        setFilteredVideos(videosWithStats);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch video stats:', error);
        setIsLoading(false);
      }
    };

    initializeVideos();
  }, []);

  // Filter videos based on search and filters
  useEffect(() => {
    let filtered = videos;

    if (searchQuery) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => {
        const videoCategory = Array.isArray(video.category) ? video.category[0] : video.category;
        return videoCategory === selectedCategory;
      });
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(video => 
        visibilityFilter === 'visible' ? video.stats.isVisible : !video.stats.isVisible
      );
    }

    setFilteredVideos(filtered);
  }, [searchQuery, selectedCategory, visibilityFilter, videos]);

  const toggleVideoVisibility = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, stats: { ...video.stats, isVisible: !video.stats.isVisible }}
        : video
    ));

    const video = videos.find(v => v.id === videoId);
    toast({
      title: video?.stats.isVisible ? "Video Hidden" : "Video Made Visible",
      description: `"${video?.title}" ${video?.stats.isVisible ? 'has been hidden from teachers' : 'is now visible to teachers'}.`
    });
  };

  const getCategories = () => {
    const categories = [...new Set(videos.map(v => {
      return Array.isArray(v.category) ? v.category[0] : v.category;
    }).filter(Boolean))];
    return categories.sort();
  };

  const getVideoStats = () => {
    const total = videos.length;
    const visible = videos.filter(v => v.stats.isVisible).length;
    const hidden = total - visible;
    const totalViews = videos.reduce((sum, v) => sum + v.stats.totalViews, 0);
    const totalCompletions = videos.reduce((sum, v) => sum + v.stats.completions, 0);

    return { total, visible, hidden, totalViews, totalCompletions };
  };

  const stats = getVideoStats();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Video Library Manager
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Manage video visibility, organize content, and monitor engagement across your professional development library.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Videos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <Play className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visible</p>
                      <p className="text-2xl font-bold text-green-600">{stats.visible}</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Hidden</p>
                      <p className="text-2xl font-bold text-red-600">{stats.hidden}</p>
                    </div>
                    <EyeOff className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completions</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.totalCompletions.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {typeof category === 'string' ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Videos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    <SelectItem value="visible">Visible Only</SelectItem>
                    <SelectItem value="hidden">Hidden Only</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Video List */}
          <Card>
            <CardHeader>
              <CardTitle>Video Library ({filteredVideos.length} videos)</CardTitle>
              <CardDescription>
                Manage video visibility and settings for your professional development content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`border rounded-lg p-4 ${
                        video.stats.isVisible 
                          ? 'border-gray-200 bg-white' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                  {video.title}
                                </h3>
                                {video.featured && (
                                  <Badge variant="secondary">Featured</Badge>
                                )}
                                <Badge variant={video.stats.isVisible ? "default" : "destructive"}>
                                  {video.stats.isVisible ? "Visible" : "Hidden"}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {video.description}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {video.duration} min
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {video.stats.totalViews} views
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  {video.stats.completions} completions
                                </div>
                                <div>
                                  ⭐ {video.stats.avgRating}/5.0
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-2">
                                {video.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {video.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{video.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                              {video.stats.isVisible ? 'Visible' : 'Hidden'}
                            </label>
                            <Switch
                              checked={video.stats.isVisible}
                              onCheckedChange={() => toggleVideoVisibility(video.id)}
                            />
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredVideos.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-500 mb-2">No videos found</div>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search criteria or filters.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}