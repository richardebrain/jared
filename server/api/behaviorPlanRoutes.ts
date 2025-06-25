import express from 'express';
import OpenAI from 'openai';

console.log('Loading behavior plan routes...');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Behavior plan routes working' });
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000 // 60 second timeout for comprehensive behavior plans
});

interface BehaviorPlanRequest {
  childAge: string;
  childName?: string;
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
  console.log('=== BEHAVIOR PLAN GENERATE ENDPOINT HIT ===');
  console.log('Request body:', req.body);
  
  try {
    
    const { childAge, childName, behavior, context, frequency }: BehaviorPlanRequest = req.body;

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



    console.log('Calling OpenAI API...');
    
    // Create a personalized prompt
    const childRef = childName ? childName : `this ${childAge} year old child`;
    const shortPrompt = `Create a behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} ${frequency ? `Frequency: ${frequency}` : ''}

${childName ? `Use the child's name "${childName}" throughout the advice to make it personal and specific.` : ''}

Respond only in valid JSON with these exact fields:
{
  "isNormal": boolean,
  "developmentalContext": "Simple explanation in 1-2 sentences",
  "rootCauses": ["cause1", "cause2", "cause3"],
  "immediateStrategies": ["strategy1", "strategy2", "strategy3", "strategy4", "strategy5"],
  "longTermPlan": ["step1", "step2", "step3", "step4"],
  "preventionTips": ["tip1", "tip2", "tip3", "tip4"],
  "positiveReinforcement": ["idea1", "idea2", "idea3", "idea4"],
  "redFlags": ["flag1", "flag2"]
}`;

    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert early childhood educator. Respond only with valid JSON. Be concise but practical."
          },
          {
            role: "user",
            content: shortPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Creating the best behavior plan takes time - please wait...')), 55000)
      )
    ]);
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