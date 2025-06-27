import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Smile, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Meme {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
}

interface GiphyMeme {
  id: string;
  url: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
  };
}

interface MemeFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemeSelected: (meme: { url: string; description: string }) => void;
}

export default function MemeFinder({ open, onOpenChange, onMemeSelected }: MemeFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [giphyResults, setGiphyResults] = useState<GiphyMeme[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // GIPHY search function
  const searchGiphy = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setGiphyResults([]);
        return;
      }

      setLoading(true);
      try {
        // Add educational keywords to improve relevance
        const educationalQuery = `${searchQuery} education teaching classroom kids children`;
        
        const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(educationalQuery)}&limit=20&rating=pg-13`);
        
        if (!response.ok) {
          throw new Error('Failed to search GIPHY');
        }
        
        const data = await response.json();
        setGiphyResults(data.data || []);
      } catch (error) {
        console.error('GIPHY search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search GIPHY. Please try again.",
          variant: "destructive"
        });
        setGiphyResults([]);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Debounced GIPHY search
  const debouncedGiphySearch = useCallback(
    debounce((query: string) => {
      searchGiphy(query);
    }, 500),
    [searchGiphy]
  );

  // Search when term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedGiphySearch(value);
  };

  const handleGiphyMemeSelect = (giphyMeme: GiphyMeme) => {
    onMemeSelected({
      url: giphyMeme.images.original.url,
      description: giphyMeme.title || 'Educational GIF from GIPHY'
    });
    
    toast({
      title: "Meme Added!",
      description: `Educational meme added to your module section.`
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-orange-500" />
            Find Educational Memes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for educational memes (e.g., playground safety, classroom management, teaching moments)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Searching memes...</span>
              </div>
            ) : giphyResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {giphyResults.map((meme) => (
                  <Card
                    key={meme.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleGiphyMemeSelect(meme)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={meme.images.fixed_height.url}
                          alt={meme.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Meme+Not+Available';
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
                <p className="text-gray-600">No memes found for "{searchTerm}"</p>
                <p className="text-sm text-gray-500">Try different keywords like "teaching", "classroom", or "kids"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Start typing to search for educational memes</p>
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