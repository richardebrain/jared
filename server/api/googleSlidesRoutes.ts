import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Schema for slide generation request
const generateSlidesContentSchema = z.object({
  template: z.string().optional(),
  customContent: z.string().optional(),
  moduleContext: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    targetAudience: z.string().optional()
  }).optional(),
  presentationTitle: z.string(),
  designPreferences: z.object({
    colorScheme: z.string(),
    includeImages: z.boolean(),
    includeCharts: z.boolean(),
    fontStyle: z.string()
  })
});

const createPresentationSchema = z.object({
  title: z.string(),
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    speakerNotes: z.string().optional(),
    layout: z.string().optional()
  })),
  designPreferences: z.object({
    colorScheme: z.string(),
    includeImages: z.boolean(),
    includeCharts: z.boolean(),
    fontStyle: z.string()
  })
});

// Generate slide content using AI
router.post('/generate-slides-content', async (req, res) => {
  try {
    const validatedData = generateSlidesContentSchema.parse(req.body);
    
    const { template, customContent, moduleContext, presentationTitle, designPreferences } = validatedData;
    
    // Get OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    let contentPrompt = '';
    
    if (template) {
      contentPrompt = getTemplatePrompt(template, moduleContext, presentationTitle);
    } else if (customContent) {
      contentPrompt = getCustomContentPrompt(customContent, moduleContext, presentationTitle);
    } else {
      return res.status(400).json({ error: 'Either template or custom content must be provided' });
    }

    const prompt = `${contentPrompt}

DESIGN REQUIREMENTS:
- Color scheme: ${designPreferences.colorScheme}
- Font style: ${designPreferences.fontStyle}
- Include images: ${designPreferences.includeImages}
- Include charts: ${designPreferences.includeCharts}

Generate a detailed slide structure in JSON format:
{
  "slides": [
    {
      "title": "Slide title",
      "content": "Main slide content (bullet points or paragraphs)",
      "speakerNotes": "Detailed speaker notes for this slide",
      "layout": "title_and_content|title_only|content_only|two_column",
      "imageDescription": "Description of relevant image if includeImages is true",
      "chartData": "Chart specifications if includeCharts is true"
    }
  ],
  "totalSlides": number,
  "estimatedDuration": "X minutes"
}

Make content specific to early childhood education professionals and highly actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer specializing in early childhood education. Create engaging, professional presentation content that follows best practices for adult learning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    try {
      const parsedContent = JSON.parse(content);
      res.json(parsedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      res.status(500).json({ error: 'Invalid response format from AI' });
    }

  } catch (error) {
    console.error('Error generating slides content:', error);
    res.status(500).json({ 
      error: 'Failed to generate slides content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create Google Slides presentation
router.post('/create-presentation', async (req, res) => {
  try {
    const validatedData = createPresentationSchema.parse(req.body);
    
    // For now, return a mock response since we need Google API credentials
    // In production, this would use the Google Slides API
    const mockPresentationData = {
      presentationId: `mock_${Date.now()}`,
      presentationUrl: `https://docs.google.com/presentation/d/mock_${Date.now()}/edit`,
      status: 'created',
      slideCount: validatedData.slides.length,
      message: 'Presentation created successfully (mock implementation)'
    };

    res.json(mockPresentationData);

  } catch (error) {
    console.error('Error creating presentation:', error);
    res.status(500).json({ 
      error: 'Failed to create presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Template-specific prompts
function getTemplatePrompt(template: string, moduleContext: any, title: string): string {
  const baseContext = moduleContext ? `
Module Context:
- Title: ${moduleContext.title || title}
- Description: ${moduleContext.description || ''}
- Target Audience: ${moduleContext.targetAudience || 'Early childhood educators'}
` : '';

  switch (template) {
    case 'training-overview':
      return `${baseContext}
Create a comprehensive training overview presentation with these slides:
1. Title slide with presentation overview
2. Learning objectives and outcomes
3. Agenda and timeline
4. Main content sections (2-3 slides)
5. Summary and next steps
Focus on clear objectives and actionable takeaways for early childhood educators.`;

    case 'step-by-step':
      return `${baseContext}
Create a step-by-step instructional guide with these slides:
1. Title and introduction
2. Overview of the complete process
3. Step 1 with detailed instructions
4. Step 2 with detailed instructions
5. Step 3 with detailed instructions
6. Common challenges and solutions
7. Summary and practice opportunities
Make each step clear and actionable with specific examples.`;

    case 'case-study':
      return `${baseContext}
Create a case study analysis presentation with these slides:
1. Title and case study introduction
2. Background and context
3. The challenge or problem
4. Analysis and considerations
5. Solution and implementation
6. Results and lessons learned
Use realistic early childhood education scenarios.`;

    case 'best-practices':
      return `${baseContext}
Create a best practices presentation with these slides:
1. Title and introduction
2. Why these practices matter
3. Best Practice #1 with examples
4. Best Practice #2 with examples
5. Best Practice #3 with examples
6. Implementation strategies
7. Common pitfalls to avoid
8. Resources and next steps
Focus on evidence-based practices in early childhood education.`;

    case 'interactive-workshop':
      return `${baseContext}
Create an interactive workshop presentation with these slides:
1. Welcome and introductions
2. Workshop objectives and agenda
3. Ice breaker activity
4. Core concept introduction
5. Hands-on activity #1
6. Group discussion prompts
7. Hands-on activity #2
8. Reflection and sharing
9. Action planning
10. Wrap-up and resources
Include specific interaction prompts and timing for each activity.`;

    default:
      return `${baseContext}
Create a professional presentation about the topic with 5-7 informative slides that include clear objectives, main content, and actionable conclusions.`;
  }
}

function getCustomContentPrompt(customContent: string, moduleContext: any, title: string): string {
  const baseContext = moduleContext ? `
Module Context:
- Title: ${moduleContext.title || title}
- Description: ${moduleContext.description || ''}
- Target Audience: ${moduleContext.targetAudience || 'Early childhood educators'}
` : '';

  return `${baseContext}

Custom Content Request:
${customContent}

Create a professional presentation based on this custom content. Structure it logically with:
- A clear introduction
- Well-organized main content sections
- Practical examples and applications
- Summary and takeaways
Aim for 5-8 slides depending on the content complexity.`;
}

export default router;