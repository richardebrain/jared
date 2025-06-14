import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageGenerationRequest {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

// Generate image using OpenAI DALL-E
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' }: ImageGenerationRequest = req.body;

    console.log('Image generation request:', { prompt: prompt?.substring(0, 100), size, quality, style });

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        message: 'Please provide a valid prompt for image generation.'
      });
    }

    // Validate prompt length (OpenAI has a 1000 character limit)
    if (prompt.length > 1000) {
      return res.status(400).json({
        error: 'Prompt too long',
        message: 'Prompt must be 1000 characters or less.'
      });
    }

    console.log(`Generating image with prompt: ${prompt.substring(0, 100)}...`);

    // Generate image using OpenAI DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
      style: style,
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image generated successfully');

    res.json({
      success: true,
      imageUrl: imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });

    // Handle OpenAI API errors
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        error: 'Quota exceeded',
        message: 'API quota exceeded. Please check your OpenAI billing.'
      });
    }

    if (error.code === 'invalid_request_error' || error.status === 400) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message || 'The request was invalid.'
      });
    }

    // Handle content policy violations
    if (error.message?.includes('content_policy_violation')) {
      return res.status(400).json({
        error: 'Content policy violation',
        message: 'The prompt violates OpenAI content policy. Please modify your request.'
      });
    }

    // Generic error handling
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message || 'Unable to generate image. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'image-generation',
    timestamp: new Date().toISOString()
  });
});

export default router;