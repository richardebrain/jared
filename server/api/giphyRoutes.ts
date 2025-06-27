import { Router } from 'express';

const router = Router();

// GIPHY search endpoint
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

    // Build GIPHY API URL
    const giphyUrl = new URL('https://api.giphy.com/v1/gifs/search');
    giphyUrl.searchParams.set('api_key', GIPHY_API_KEY);
    giphyUrl.searchParams.set('q', q);
    giphyUrl.searchParams.set('limit', limit.toString());
    giphyUrl.searchParams.set('rating', rating.toString());
    giphyUrl.searchParams.set('lang', 'en');

    // Log the URL for debugging
    console.log('GIPHY API URL:', giphyUrl.toString());
    
    // Fetch from GIPHY API
    const response = await fetch(giphyUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GIPHY API error: ${response.status} - ${errorText}`);
      throw new Error(`GIPHY API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform GIPHY response for our frontend
    const transformedData = {
      data: data.data?.map((gif: any) => ({
        id: gif.id,
        url: gif.url,
        title: gif.title || '',
        images: {
          fixed_height: {
            url: gif.images?.fixed_height?.url || gif.images?.original?.url
          },
          original: {
            url: gif.images?.original?.url
          }
        }
      })) || [],
      pagination: data.pagination
    };

    res.json(transformedData);
  } catch (error) {
    console.error('GIPHY search error:', error);
    res.status(500).json({ error: 'Failed to search GIPHY' });
  }
});

export default router;