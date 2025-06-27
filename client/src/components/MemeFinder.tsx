import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile, Search, Download, X, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

// Curated collection of educational and childcare-themed memes
const EDUCATIONAL_MEMES: Meme[] = [
  {
    id: '1',
    url: 'https://i.imgflip.com/3i7wxp.jpg',
    title: 'Success Kid - Learning Achievement',
    category: 'Success',
    description: 'Child celebrating learning success'
  },
  {
    id: '2', 
    url: 'https://i.imgflip.com/1bij.jpg',
    title: 'One Does Not Simply... Teach Preschoolers',
    category: 'Teaching',
    description: 'Teaching challenges humor'
  },
  {
    id: '3',
    url: 'https://i.imgflip.com/8696f.jpg',
    title: 'Distracted Boyfriend - New Teaching Method',
    category: 'Innovation',
    description: 'Trying new teaching approaches'
  },
  {
    id: '4',
    url: 'https://i.imgflip.com/61kujf.jpg',
    title: 'Drake No/Yes - Traditional vs Modern Teaching',
    category: 'Methods',
    description: 'Comparing teaching methods'
  },
  {
    id: '5',
    url: 'https://i.imgflip.com/1g8my4.jpg',
    title: 'This is Fine - Classroom Management',
    category: 'Classroom',
    description: 'Managing classroom chaos with humor'
  },
  {
    id: '6',
    url: 'https://i.imgflip.com/26am.jpg',
    title: 'Futurama Fry - Parent-Teacher Conferences',
    category: 'Communication',
    description: 'Navigating parent interactions'
  },
  {
    id: '7',
    url: 'https://i.imgflip.com/16iyn1.jpg',
    title: 'Confused Math Lady - New Curriculum',
    category: 'Curriculum',
    description: 'Learning new educational requirements'
  },
  {
    id: '8',
    url: 'https://i.imgflip.com/1tl71a.jpg',
    title: 'Expanding Brain - Child Development Stages',
    category: 'Development',
    description: 'Understanding child development progression'
  },
  {
    id: '9',
    url: 'https://i.imgflip.com/2cp1.jpg',
    title: 'Awkward Moment Seal - Playground Incidents',
    category: 'Playground',
    description: 'Handling unexpected situations'
  },
  {
    id: '10',
    url: 'https://i.imgflip.com/1ihzfe.jpg',
    title: 'Scroll of Truth - Early Childhood Facts',
    category: 'Education',
    description: 'Important early childhood insights'
  },
  {
    id: '11',
    url: 'https://i.imgflip.com/1g7q64.jpg',
    title: 'Spongebob Mocking - Difficult Parents',
    category: 'Humor',
    description: 'Dealing with challenging interactions'
  },
  {
    id: '12',
    url: 'https://i.imgflip.com/24y43o.jpg',
    title: 'Surprised Pikachu - Budget Cuts',
    category: 'Resources',
    description: 'Unexpected resource limitations'
  },
  {
    id: '13',
    url: 'https://i.imgflip.com/1e7ql7.jpg',
    title: 'Roll Safe - Smart Teaching Strategies',
    category: 'Strategy',
    description: 'Clever teaching solutions'
  },
  {
    id: '14',
    url: 'https://i.imgflip.com/1c1uej.jpg',
    title: 'Leonardo DiCaprio Cheers - Professional Development',
    category: 'Growth',
    description: 'Celebrating learning achievements'
  },
  {
    id: '15',
    url: 'https://i.imgflip.com/2h7me5.jpg',
    title: 'Woman Yelling at Cat - Curriculum Debates',
    category: 'Debate',
    description: 'Educational methodology discussions'
  }
];

const CATEGORIES = ['All', 'Success', 'Teaching', 'Innovation', 'Methods', 'Classroom', 'Communication', 'Curriculum', 'Development', 'Playground', 'Education', 'Humor', 'Resources', 'Strategy', 'Growth', 'Debate'];

export default function MemeFinder({ open, onOpenChange, onMemeSelected }: MemeFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredMemes, setFilteredMemes] = useState<Meme[]>(EDUCATIONAL_MEMES);
  const [loading, setLoading] = useState(false);
  const [giphySearchTerm, setGiphySearchTerm] = useState('');
  const [giphyResults, setGiphyResults] = useState<GiphyMeme[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('curated');
  const { toast } = useToast();

  // Debounced search function for curated memes
  const debouncedSearch = useCallback(
    debounce((term: string, category: string) => {
      setLoading(true);
      
      let filtered = EDUCATIONAL_MEMES;
      
      // Filter by category
      if (category !== 'All') {
        filtered = filtered.filter(meme => meme.category === category);
      }
      
      // Filter by search term
      if (term.trim()) {
        filtered = filtered.filter(meme => 
          meme.title.toLowerCase().includes(term.toLowerCase()) ||
          meme.category.toLowerCase().includes(term.toLowerCase()) ||
          (meme.description && meme.description.toLowerCase().includes(term.toLowerCase()))
        );
      }
      
      setFilteredMemes(filtered);
      setLoading(false);
    }, 300),
    []
  );

  // GIPHY search function
  const searchGiphy = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setGiphyResults([]);
        return;
      }

      setGiphyLoading(true);
      try {
        // Add educational keywords to improve relevance
        const educationalQuery = `${searchQuery} education teaching classroom kids children`;
        
        const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(educationalQuery)}&limit=20&rating=g`);
        
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
        setGiphyLoading(false);
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

  useEffect(() => {
    debouncedSearch(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, debouncedSearch]);

  useEffect(() => {
    debouncedGiphySearch(giphySearchTerm);
  }, [giphySearchTerm, debouncedGiphySearch]);

  const handleMemeSelect = (meme: Meme) => {
    onMemeSelected({
      url: meme.url,
      description: meme.description || meme.title
    });
    
    toast({
      title: "Meme Added!",
      description: `"${meme.title}" has been added to your module`,
    });
    
    onOpenChange(false);
  };

  const handleGiphyMemeSelect = (giphyMeme: GiphyMeme) => {
    onMemeSelected({
      url: giphyMeme.images.original.url,
      description: giphyMeme.title || 'Educational GIF from GIPHY'
    });
    
    toast({
      title: "GIF Added!",
      description: `Educational GIF added to your module section.`
    });
    
    onOpenChange(false);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
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
          {/* Search and Filter Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search memes by topic, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedCategory === category 
                      ? "bg-orange-500 hover:bg-orange-600" 
                      : "hover:bg-orange-50"
                  }`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Searching memes...</span>
              </div>
            ) : filteredMemes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredMemes.map((meme) => (
                  <Card
                    key={meme.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleMemeSelect(meme)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={meme.url}
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
                          {meme.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No memes found for your search</p>
                <p className="text-sm text-gray-500">Try different keywords or categories</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Pro Tip:</p>
                <p>These memes are specifically curated for early childhood education. Use them to add humor and engagement to your training modules!</p>
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