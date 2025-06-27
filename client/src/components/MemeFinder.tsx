import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Smile, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VisualContent {
  id: string;
  url: string;
  title: string;
  type: string;
  description?: string;
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

interface VisualContentFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemeSelected: (content: { url: string; description: string }) => void;
}

export default function VisualContentFinder({ open, onOpenChange, onMemeSelected }: VisualContentFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [giphyResults, setGiphyResults] = useState<GiphyContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState(0); // Force re-render key
  const { toast } = useToast();

  // Reset component state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setGiphyResults([]);
      setLoading(false);
      setSearchKey(prev => prev + 1); // Force fresh state
    }
  }, [open]);

  // Search function that only runs when button is clicked
  const performGiphySearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter Search Term",
        description: "Please enter a search term to find visual content.",
        variant: "destructive"
      });
      return;
    }

    // Clear old results immediately and start loading
    setGiphyResults([]);
    setLoading(true);
    
    try {
      // Add educational keywords to improve relevance
      const educationalQuery = `${searchTerm} education teaching`;
      
      // Add timestamp to ensure fresh request
      const timestamp = Date.now();
      const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(educationalQuery)}&limit=20&rating=pg-13&t=${timestamp}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GIPHY API response error:', response.status, errorText);
        throw new Error(`GIPHY API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('GIPHY search successful for:', searchTerm);
      console.log('Setting giphyResults to:', data.data?.length, 'items');
      
      // Force state update with completely new results and increment search key
      setGiphyResults(prev => {
        console.log('Previous results:', prev.length);
        console.log('Previous IDs:', prev.slice(0, 3).map(item => item.id));
        console.log('New results:', data.data?.length || 0);
        console.log('New IDs:', data.data?.slice(0, 3).map((item: any) => item.id) || []);
        return data.data || [];
      });
      setSearchKey(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('GIPHY search error:', error);
      toast({
        title: "Search Error",
        description: `Failed to search visual content: ${error.message}`,
        variant: "destructive"
      });
      setGiphyResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performGiphySearch();
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
          {/* Search Input with Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for visual content (e.g., playground safety, classroom management, teaching moments, celebrations)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={performGiphySearch}
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

          {/* Results Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Searching visual content...</span>
              </div>
            ) : giphyResults.length > 0 ? (
              <div key={searchKey} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {giphyResults.map((meme) => (
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
                <p className="text-gray-600">No visual content found for "{searchTerm}"</p>
                <p className="text-sm text-gray-500">Try different keywords like "teaching", "classroom", or "kids"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Enter search terms and click "Search" to find visual content</p>
                <p className="text-sm text-gray-500">Try "playground safety", "classroom management", or "teaching moments"</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Pro Tip:</p>
                <p>Search results are filtered for educational content and appropriate ratings. Use them to add humor and engagement to your training modules!</p>
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