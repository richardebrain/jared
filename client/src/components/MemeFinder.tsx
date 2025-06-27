import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Smile, Loader2, Film, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VisualContent {
  id: string;
  url: string;
  title: string;
  type: string;
  description?: string;
  source?: 'giphy' | 'pixabay';
}

interface GiphyContent {
  id: string;
  url: string;
  title: string;
  type: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
    fixed_width?: {
      url: string;
    };
  };
}

interface PixabayImage {
  url: string;
  description: string;
  width: number;
  height: number;
  tags: string;
  user: string;
  source: 'pixabay';
}

interface VisualContentFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemeSelected: (content: { url: string; description: string }) => void;
}

export default function VisualContentFinder({ open, onOpenChange, onMemeSelected }: VisualContentFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifResults, setGifResults] = useState<GiphyContent[]>([]);
  const [imageResults, setImageResults] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gifs' | 'images'>('gifs');
  const [searchKey, setSearchKey] = useState(0); // Force re-render key
  const { toast } = useToast();

  // Reset component state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setGifResults([]);
      setImageResults([]);
      setLoading(false);
      setActiveTab('gifs');
      setSearchKey(prev => prev + 1); // Force fresh state
    }
  }, [open]);

  // Search function for both GIFs and Images
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter Search Term",
        description: "Please enter a search term to find visual content.",
        variant: "destructive"
      });
      return;
    }

    // Clear old results immediately and start loading
    setGifResults([]);
    setImageResults([]);
    setLoading(true);
    
    try {
      // Use the exact search term entered by the user
      const searchQuery = searchTerm.trim();
      
      // Add timestamp to ensure fresh request
      const timestamp = Date.now();
      
      // Search both GIFs (GIPHY) and Images (Pixabay) simultaneously
      const [gifResponse, imageResponse] = await Promise.all([
        fetch(`/api/giphy/gifs?q=${encodeURIComponent(searchQuery)}&limit=20&rating=pg-13&t=${timestamp}`),
        fetch(`/api/pixabay/images?q=${encodeURIComponent(searchQuery)}&offset=0&t=${timestamp}`)
      ]);
      
      // Process GIF results
      if (gifResponse.ok) {
        const gifData = await gifResponse.json();
        console.log('GIPHY GIF search successful for:', searchQuery);
        setGifResults(gifData.data || []);
      } else if (gifResponse.status === 429) {
        const errorData = await gifResponse.json();
        toast({
          title: "Rate Limit Reached",
          description: errorData.message || "GIPHY API rate limit reached. Please wait a few minutes before searching again.",
          variant: "destructive"
        });
        return; // Exit early on rate limit
      }
      
      // Process Image results (Pixabay)
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        console.log('Pixabay Image search successful for:', searchQuery);
        setImageResults(imageData.images || []);
      } else if (imageResponse.status === 429) {
        const errorData = await imageResponse.json();
        toast({
          title: "Rate Limit Reached",
          description: errorData.message || "Image search rate limit reached. Please wait a few minutes before searching again.",
          variant: "destructive"
        });
        return; // Exit early on rate limit
      } else if (imageResponse.status === 503) {
        const errorData = await imageResponse.json();
        toast({
          title: "Image Search Unavailable",
          description: errorData.message || "Image search service is being configured. Please try again later.",
          variant: "destructive"
        });
      }
      
      if (!gifResponse.ok && !imageResponse.ok) {
        throw new Error('Both search requests failed');
      }
      
      setSearchKey(prev => prev + 1);
    } catch (error) {
      console.error('Visual content search failed:', error);
      setGifResults([]);
      setImageResults([]);
      toast({
        title: "Search Failed",
        description: "Unable to search visual content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleContentSelect = (content: GiphyContent) => {
    onMemeSelected({
      url: content.images.original.url,
      description: content.title || 'Educational visual content from GIPHY'
    });
    
    toast({
      title: "Visual Content Added!",
      description: `Educational ${content.type || 'visual content'} added to your module section.`
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-orange-500" />
            Visual Content Finder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('gifs')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'gifs'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              GIFs
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'images'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Images
            </button>
          </div>

          {/* Search Input with Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for any visual content (e.g., celebration, applause, funny cat, motivational, thumbs up)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={performSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* GIPHY Attribution */}
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Powered by</span>
              <img 
                src="https://developers.giphy.com/branch/master/static/api-logo-white-bg.png" 
                alt="GIPHY" 
                className="h-4"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Searching visual content...</span>
              </div>
            ) : (activeTab === 'gifs' && gifResults.length > 0) || (activeTab === 'images' && imageResults.length > 0) ? (
              <div key={searchKey} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(activeTab === 'gifs' ? gifResults : imageResults).map((meme: GiphyContent) => (
                  <Card
                    key={meme.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleContentSelect(meme)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={meme.images.fixed_height.url}
                          alt={meme.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Content+Not+Available';
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-800 line-clamp-2">
                          {meme.title}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          GIPHY
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="text-center py-8">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No {activeTab === 'gifs' ? 'GIFs' : 'images'} found for "{searchTerm}"</p>
                <p className="text-sm text-gray-500">Try different keywords like "teaching", "classroom", or "kids"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Enter search terms and click "Search" to find {activeTab === 'gifs' ? 'GIFs' : 'images'}</p>
                <p className="text-sm text-gray-500">Try "playground safety", "classroom management", or "teaching moments"</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Pro Tip:</p>
                <p>Search results are filtered for educational content and appropriate ratings. If searches fail due to rate limits, please wait a few minutes and try again!</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}