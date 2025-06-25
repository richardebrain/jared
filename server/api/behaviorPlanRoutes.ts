import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000 // 30 second timeout
});

interface BehaviorPlanRequest {
  childAge: string;
  behavior: string;
  context?: string;
  frequency?: string;
}

interface BehaviorPlan {
  isNormal: boolean;
  rootCauses: string[];
  developmentalContext: string;
  immediateStrategies: string[];
  longTermPlan: string[];
  preventionTips: string[];
  redFlags: string[];
  positiveReinforcement: string[];
}

router.post('/generate', async (req, res) => {
  try {
    console.log('Behavior plan request received:', req.body);
    
    const { childAge, behavior, context, frequency }: BehaviorPlanRequest = req.body;

    if (!childAge || !behavior) {
      console.log('Missing required fields:', { childAge, behavior });
      return res.status(400).json({ 
        error: 'Child age and behavior description are required' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'AI service not configured' 
      });
    }

    const prompt = `You are an expert early childhood educator and child development specialist. A teacher needs help with a challenging behavior.

CHILD DETAILS:
- Age: ${childAge}
- Behavior: ${behavior}
- Context: ${context || 'Not provided'}
- Frequency: ${frequency || 'Not specified'}

Please provide a comprehensive behavior plan in JSON format with these sections:

1. isNormal: boolean (true if this behavior is typical for this age)
2. developmentalContext: A simple explanation (that a 12-year-old could understand) about whether this behavior is normal for this age and the developmental science behind why children this age might do this
3. rootCauses: Array of 3-5 possible underlying reasons for this behavior (look beyond the surface)
4. immediateStrategies: Array of 5-7 specific, practical classroom strategies to use right when the behavior happens
5. longTermPlan: Array of 4-6 steps for gradually reducing this behavior over weeks/months
6. preventionTips: Array of 4-5 proactive strategies to prevent the behavior from happening
7. positiveReinforcement: Array of 4-5 specific ways to reward and encourage positive alternative behaviors
8. redFlags: Array of 2-4 warning signs that would indicate this behavior needs professional intervention (speech therapist, behavioral specialist, etc.)

Make all explanations simple enough for a 12-year-old to understand, but practical enough for immediate classroom use. Focus on creative, fresh approaches the teacher might not have thought of. Be specific and actionable.`;

    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert early childhood educator and behavioral specialist. Provide practical, evidence-based strategies in simple language. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });
    
    console.log('OpenAI API response received');

    const planText = response.choices[0].message.content;
    if (!planText) {
      throw new Error('No response from OpenAI');
    }

    let plan: BehaviorPlan;
    try {
      plan = JSON.parse(planText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    const requiredFields = ['isNormal', 'developmentalContext', 'rootCauses', 'immediateStrategies', 'longTermPlan', 'preventionTips', 'positiveReinforcement', 'redFlags'];
    for (const field of requiredFields) {
      if (!(field in plan)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error generating behavior plan:', error);
    
    // Handle timeout or network errors specifically
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable',
        details: 'Please try again in a moment'
      });
    }
    
    // Handle OpenAI API errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'AI service configuration error',
        details: 'API authentication failed'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate behavior plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;