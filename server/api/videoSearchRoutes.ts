import express from 'express';

const router = express.Router();

// Sample video library data - in production this would come from a database
const VIDEO_LIBRARY = [
  {
    id: '1',
    title: 'Classroom Management Strategies for Preschoolers',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '8:45',
    category: 'Classroom Management',
    tags: ['classroom management', 'preschool', 'behavior', 'strategies']
  },
  {
    id: '2',
    title: 'Early Literacy Development Activities',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '12:30',
    category: 'Literacy',
    tags: ['literacy', 'reading', 'phonics', 'early childhood']
  },
  {
    id: '3',
    title: 'Social Emotional Learning in Early Childhood',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '15:20',
    category: 'Social Emotional Learning',
    tags: ['SEL', 'emotions', 'social skills', 'development']
  },
  {
    id: '4',
    title: 'STEM Activities for Toddlers and Preschoolers',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '10:15',
    category: 'STEM',
    tags: ['STEM', 'science', 'math', 'engineering', 'toddler', 'preschool']
  },
  {
    id: '5',
    title: 'Inclusive Classroom Practices',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '18:40',
    category: 'Inclusion',
    tags: ['inclusion', 'diversity', 'special needs', 'accessibility']
  },
  {
    id: '6',
    title: 'Positive Behavior Support Strategies',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '14:25',
    category: 'Behavior Management',
    tags: ['positive behavior', 'PBS', 'reinforcement', 'classroom management']
  },
  {
    id: '7',
    title: 'Developmentally Appropriate Practice in ECE',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '16:50',
    category: 'Best Practices',
    tags: ['DAP', 'developmentally appropriate', 'best practices', 'ECE']
  },
  {
    id: '8',
    title: 'Parent Communication and Engagement',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '11:30',
    category: 'Family Engagement',
    tags: ['parent communication', 'family engagement', 'partnership']
  },
  {
    id: '9',
    title: 'Creating Learning Centers in the Classroom',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '13:15',
    category: 'Environment',
    tags: ['learning centers', 'environment', 'play-based learning']
  },
  {
    id: '10',
    title: 'Assessment and Documentation in Early Childhood',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '19:10',
    category: 'Assessment',
    tags: ['assessment', 'documentation', 'observation', 'portfolios']
  }
];

// Search video library
router.get('/search', (req, res) => {
  try {
    const { q: query, topic } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = query.toString().toLowerCase();
    const topicQuery = topic ? topic.toString().toLowerCase() : '';

    // Filter videos based on search query
    const results = VIDEO_LIBRARY.filter(video => {
      const titleMatch = video.title.toLowerCase().includes(searchQuery);
      const categoryMatch = video.category.toLowerCase().includes(searchQuery);
      const tagMatch = video.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      const topicMatch = topicQuery ? (
        video.title.toLowerCase().includes(topicQuery) ||
        video.category.toLowerCase().includes(topicQuery) ||
        video.tags.some(tag => tag.toLowerCase().includes(topicQuery))
      ) : false;

      return titleMatch || categoryMatch || tagMatch || topicMatch;
    });

    // Sort by relevance (title matches first, then category, then tags)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchQuery) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(searchQuery) ? 1 : 0;
      const aCategory = a.category.toLowerCase().includes(searchQuery) ? 1 : 0;
      const bCategory = b.category.toLowerCase().includes(searchQuery) ? 1 : 0;
      
      if (aTitle !== bTitle) return bTitle - aTitle;
      if (aCategory !== bCategory) return bCategory - aCategory;
      
      return 0;
    });

    res.json(results.slice(0, 20)); // Return top 20 results
  } catch (error) {
    console.error('Video library search error:', error);
    res.status(500).json({ error: 'Failed to search video library' });
  }
});

// YouTube search functionality
router.get('/youtube-search', async (req, res) => {
  try {
    const { q: query, topic } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Enhanced search query for early childhood education
    const searchQuery = query.toString();
    const enhancedQuery = `${searchQuery} early childhood education ECE preschool teacher professional development`;
    
    // Use YouTube Data API to search for real videos
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not configured');
      return res.status(500).json({ error: 'YouTube search not available' });
    }

    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&maxResults=12&order=relevance&` +
      `q=${encodeURIComponent(enhancedQuery)}&key=${YOUTUBE_API_KEY}&` +
      `videoDuration=medium&videoDefinition=any&` +
      `relevanceLanguage=en&safeSearch=strict`;

    const response = await fetch(youtubeSearchUrl);
    
    if (!response.ok) {
      console.error('YouTube API error:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to search YouTube' });
    }

    const data = await response.json();
    
    // Transform YouTube API response to our format
    const results = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt
    })) || [];

    // Filter for educational content
    const educationalResults = results.filter((video: any) => {
      const title = video.title.toLowerCase();
      const description = video.description.toLowerCase();
      const channel = video.channelTitle.toLowerCase();
      
      // Look for educational keywords
      const educationalKeywords = [
        'education', 'teaching', 'classroom', 'preschool', 'kindergarten',
        'early childhood', 'development', 'learning', 'teacher', 'instruction',
        'curriculum', 'student', 'child', 'kids', 'professional development',
        'training', 'workshop', 'strategies', 'techniques', 'best practices'
      ];
      
      return educationalKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword) || channel.includes(keyword)
      );
    });

    res.json(educationalResults.slice(0, 8)); // Return top 8 educational results
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// Get video details (for validation)
router.get('/validate/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Simulate video validation
    // In production, this would check if the video exists and is accessible
    const isValid = Math.random() > 0.1; // 90% success rate
    
    if (isValid) {
      res.json({ 
        valid: true, 
        title: 'Valid Video Title',
        duration: '10:30',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      });
    } else {
      res.status(404).json({ valid: false, error: 'Video not found or unavailable' });
    }
  } catch (error) {
    console.error('Video validation error:', error);
    res.status(500).json({ error: 'Failed to validate video' });
  }
});

export default router;