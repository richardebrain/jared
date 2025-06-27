import { Router } from 'express';

const router = Router();

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: Array<{
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    largeImageURL: string;
    views: number;
    downloads: number;
    likes: number;
    user: string;
    userImageURL: string;
  }>;
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

// Enhanced search terms for educational content
function enhanceEducationalSearchTerms(query: string): string {
  const educationalTerms = [
    'classroom', 'learning', 'education', 'teaching', 'school',
    'children', 'kids', 'development', 'early childhood'
  ];
  
  // Add educational context to improve results
  const enhancedTerms = [query];
  
  // Add relevant educational keywords based on query content
  if (query.includes('behavior') || query.includes('management')) {
    enhancedTerms.push('classroom management');
  }
  if (query.includes('play') || query.includes('activity')) {
    enhancedTerms.push('educational play');
  }
  if (query.includes('read') || query.includes('book')) {
    enhancedTerms.push('children reading');
  }
  
  return enhancedTerms.join(' ');
}

// Search Pixabay images
router.get('/images', async (req, res) => {
  try {
    const { q: query = '', offset = 0 } = req.query;
    
    if (!process.env.PIXABAY_API_KEY) {
      console.log('Pixabay API key not configured');
      return res.status(503).json({ 
        error: 'Pixabay service temporarily unavailable',
        message: 'Image search service is being configured. Please try again later.'
      });
    }
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const enhancedQuery = enhanceEducationalSearchTerms(query as string);
    const page = Math.floor((offset as number) / 20) + 1;
    
    console.log(`Pixabay image search for: "${query}" (enhanced: "${enhancedQuery}") - page ${page}`);
    
    const params = new URLSearchParams({
      key: process.env.PIXABAY_API_KEY,
      q: enhancedQuery,
      image_type: 'photo',
      category: 'education,people,backgrounds,science,nature',
      safesearch: 'true',
      orientation: 'all',
      per_page: '20',
      page: page.toString(),
      min_width: '640',
      min_height: '480'
    });

    const response = await fetch(`https://pixabay.com/api/?${params}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('Pixabay rate limit exceeded');
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'Too many image searches. Please wait a moment before searching again.'
        });
      }
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data: PixabayResponse = await response.json();
    
    const images: PixabayImage[] = data.hits.map(hit => ({
      url: hit.webformatURL,
      description: `${hit.tags} by ${hit.user}`,
      width: hit.webformatWidth,
      height: hit.webformatHeight,
      tags: hit.tags,
      user: hit.user,
      source: 'pixabay'
    }));
    
    console.log(`Pixabay image search returned ${images.length} results for "${query}" (page ${page})`);
    console.log('Result tags:', images.slice(0, 5).map(img => img.tags));
    
    res.json({
      images,
      total: data.total,
      hasMore: data.totalHits > (page * 20)
    });
    
  } catch (error) {
    console.error('Pixabay image search error:', error);
    res.status(500).json({ 
      error: 'Failed to search images',
      message: 'Unable to search for images at this time. Please try again later.'
    });
  }
});

// Search Pixabay videos (for future expansion)
router.get('/videos', async (req, res) => {
  try {
    const { q: query = '', offset = 0 } = req.query;
    
    if (!process.env.PIXABAY_API_KEY) {
      console.log('Pixabay API key not configured');
      return res.status(503).json({ 
        error: 'Pixabay service temporarily unavailable',
        message: 'Video search service is being configured. Please try again later.'
      });
    }
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const enhancedQuery = enhanceEducationalSearchTerms(query as string);
    const page = Math.floor((offset as number) / 20) + 1;
    
    console.log(`Pixabay video search for: "${query}" (enhanced: "${enhancedQuery}") - page ${page}`);
    
    const params = new URLSearchParams({
      key: process.env.PIXABAY_API_KEY,
      q: enhancedQuery,
      video_type: 'all',
      category: 'education,people,backgrounds,science,nature',
      safesearch: 'true',
      per_page: '20',
      page: page.toString(),
      min_width: '640',
      min_height: '480'
    });

    const response = await fetch(`https://pixabay.com/api/videos/?${params}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('Pixabay video rate limit exceeded');
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'Too many video searches. Please wait a moment before searching again.'
        });
      }
      throw new Error(`Pixabay Video API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const videos = data.hits.map((hit: any) => ({
      url: hit.videos.medium.url,
      thumbnail: hit.videos.medium.thumbnail,
      description: `${hit.tags} by ${hit.user}`,
      duration: hit.duration,
      width: hit.videos.medium.width,
      height: hit.videos.medium.height,
      tags: hit.tags,
      user: hit.user,
      source: 'pixabay'
    }));
    
    console.log(`Pixabay video search returned ${videos.length} results for "${query}" (page ${page})`);
    
    res.json({
      videos,
      total: data.total,
      hasMore: data.totalHits > (page * 20)
    });
    
  } catch (error) {
    console.error('Pixabay video search error:', error);
    res.status(500).json({ 
      error: 'Failed to search videos',
      message: 'Unable to search for videos at this time. Please try again later.'
    });
  }
});

export default router;