import { Router } from 'express';

const router = Router();

// Helper function to transform GIPHY data
const transformGiphyData = (data: any[], searchTerm: string, offset: number, contentType: string) => {
  const transformedData = {
    data: data.map((item: any) => ({
      id: item.id,
      url: item.url,
      title: item.title || '',
      type: item.type || contentType,
      images: {
        fixed_height: {
          url: item.images?.fixed_height?.url || item.images?.original?.url
        },
        original: {
          url: item.images?.original?.url
        },
        fixed_width: {
          url: item.images?.fixed_width?.url || item.images?.original?.url
        }
      }
    })) || [],
  };

  console.log(`GIPHY ${contentType} search returned ${transformedData.data.length} results for "${searchTerm}" (offset: ${offset})`);
  console.log('Result IDs:', transformedData.data.slice(0, 5).map(item => item.id));
  return transformedData;
};

// GIPHY GIF search endpoint
router.get('/gifs', async (req, res) => {
  try {
    const { q, limit = 20, rating = 'pg-13' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    if (!GIPHY_API_KEY) {
      return res.status(500).json({ error: 'GIPHY API key not configured' });
    }

    // Add random offset to get different results each time (0-25 random offset)
    const randomOffset = Math.floor(Math.random() * 26);
    
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${randomOffset}&rating=${rating}&lang=en`);

    if (!response.ok) {
      throw new Error(`GIPHY GIFs API error: ${response.status}`);
    }

    const data = await response.json();
    const transformedData = transformGiphyData(data.data || [], q, randomOffset, 'gif');
    
    res.json(transformedData);
  } catch (error) {
    console.error('GIPHY GIFs search error:', error);
    res.status(500).json({ error: 'Failed to search GIPHY GIFs' });
  }
});

// GIPHY static images/stickers search endpoint  
router.get('/images', async (req, res) => {
  try {
    const { q, limit = 20, rating = 'pg-13' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    if (!GIPHY_API_KEY) {
      return res.status(500).json({ error: 'GIPHY API key not configured' });
    }

    // Add random offset to get different results each time (0-25 random offset)
    const randomOffset = Math.floor(Math.random() * 26);
    
    const response = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${randomOffset}&rating=${rating}&lang=en`);

    if (!response.ok) {
      throw new Error(`GIPHY Images API error: ${response.status}`);
    }

    const data = await response.json();
    const transformedData = transformGiphyData(data.data || [], q, randomOffset, 'image');
    
    res.json(transformedData);
  } catch (error) {
    console.error('GIPHY Images search error:', error);
    res.status(500).json({ error: 'Failed to search GIPHY Images' });
  }
});

// Legacy combined search endpoint for backward compatibility
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, rating = 'pg-13' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    if (!GIPHY_API_KEY) {
      return res.status(500).json({ error: 'GIPHY API key not configured' });
    }

    // Search both GIFs and static images with random offset for diversity
    const limitNumber = typeof limit === 'string' ? parseInt(limit) : Number(limit);
    const halfLimit = Math.floor(limitNumber / 2);
    
    // Add random offset to get different results each time (0-25 random offset)
    const randomOffset = Math.floor(Math.random() * 26);
    
    const [gifsResponse, stickersResponse] = await Promise.all([
      // Search GIFs with random offset
      fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${halfLimit}&offset=${randomOffset}&rating=${rating}&lang=en`),
      // Search stickers with different random offset
      fetch(`https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${halfLimit}&offset=${randomOffset + 5}&rating=${rating}&lang=en`)
    ]);

    if (!gifsResponse.ok && !stickersResponse.ok) {
      throw new Error('Both GIPHY API requests failed');
    }

    // Parse responses
    const [gifsData, stickersData] = await Promise.all([
      gifsResponse.ok ? gifsResponse.json() : { data: [] },
      stickersResponse.ok ? stickersResponse.json() : { data: [] }
    ]);

    // Combine and transform results
    const combinedData = [
      ...(gifsData.data || []),
      ...(stickersData.data || [])
    ];

    const transformedData = transformGiphyData(combinedData, q, randomOffset, 'mixed');
    res.json(transformedData);
  } catch (error) {
    console.error('GIPHY search error:', error);
    res.status(500).json({ error: 'Failed to search GIPHY' });
  }
});

export default router;