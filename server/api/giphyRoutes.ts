import { Router } from 'express';

const router = Router();

// GIPHY search endpoint - searches both GIFs and static images
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, rating = 'g' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    if (!GIPHY_API_KEY) {
      return res.status(500).json({ error: 'GIPHY API key not configured' });
    }

    // Search both GIFs and static images
    const limitNumber = typeof limit === 'string' ? parseInt(limit) : limit;
    const halfLimit = Math.floor(limitNumber / 2);
    
    const [gifsResponse, stickersResponse] = await Promise.all([
      // Search GIFs
      fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${halfLimit}&rating=${rating}&lang=en`),
      // Search stickers (often includes static images)
      fetch(`https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${halfLimit}&rating=${rating}&lang=en`)
    ]);

    console.log('GIPHY API searches:', { 
      gifs: gifsResponse.status, 
      stickers: stickersResponse.status 
    });

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

    // Transform GIPHY response for our frontend
    const transformedData = {
      data: combinedData.map((item: any) => ({
        id: item.id,
        url: item.url,
        title: item.title || '',
        type: item.type || 'gif', // gif, sticker, etc.
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
      pagination: gifsData.pagination || stickersData.pagination
    };

    console.log(`GIPHY search returned ${transformedData.data.length} results for "${q}"`);
    res.json(transformedData);
  } catch (error) {
    console.error('GIPHY search error:', error);
    res.status(500).json({ error: 'Failed to search GIPHY' });
  }
});

export default router;