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
    
    // Create age-appropriate developmental context
    const getAgeAppropriateContext = (age: string) => {
      if (age.includes('months') && parseInt(age.split('-')[0]) < 12) {
        return "infant developing basic trust, attachment, and sensory awareness";
      } else if (age.includes('months') || parseInt(age.split('-')[0]) <= 2) {
        return "toddler exploring independence, developing language, and learning emotional expression";
      } else if (parseInt(age.split('-')[0]) <= 5) {
        return "preschooler learning social skills, following rules, and expressing emotions appropriately";
      } else if (parseInt(age.split('-')[0]) <= 8) {
        return "school-age child developing peer relationships, academic skills, and greater emotional understanding";
      } else {
        return "pre-teen developing independence, complex social dynamics, and emotional maturity";
      }
    };

    const ageContext = getAgeAppropriateContext(childAge);
    const childRef = childName ? childName : `this ${childAge} year old child`;
    
    // Create completely different prompts for different age groups
    const isInfant = childAge.includes('months') && parseInt(childAge.split('-')[0]) < 12;
    const isToddler = (childAge.includes('months') && parseInt(childAge.split('-')[0]) >= 12) || parseInt(childAge.split('-')[0]) <= 2;
    const isPreschool = !isInfant && !isToddler && parseInt(childAge.split('-')[0]) >= 3 && parseInt(childAge.split('-')[0]) <= 5;
    const isSchoolAge = parseInt(childAge.split('-')[0]) >= 6 && parseInt(childAge.split('-')[0]) <= 8;
    const isPreTeen = parseInt(childAge.split('-')[0]) >= 9;

    let ageSpecificPrompt;
    
    if (isInfant) {
      ageSpecificPrompt = `Create an infant behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} 

INFANT NORMALITY ASSESSMENT: For ages 0-12 months, behaviors like crying, fussiness, sleep issues, feeding difficulties are normal developmental responses. Focus on caregiver support and environmental adjustments.

Use these INFANT strategies:
- Environmental modifications (lighting, noise, temperature)
- Caregiver comfort techniques and bonding
- Routine establishment and consistency
- Physical comfort and basic needs assessment
- Sleep and feeding schedule adjustments
- Sensory regulation and calming techniques`;
    } else if (isToddler) {
      ageSpecificPrompt = `Create a toddler behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} 

TODDLER NORMALITY ASSESSMENT: For ages 12-24 months, behaviors like tantrums, hitting, biting, throwing are normal as toddlers develop autonomy, language, and emotional regulation. Most challenging behaviors are developmentally appropriate.

Use these TODDLER strategies:
- Simple one-word directions and redirection
- Consistent routines and predictable responses
- Physical environment modifications for safety
- Comfort objects and sensory tools
- Basic emotion labeling and validation
- Immediate, natural consequences`;
    } else if (isPreschool) {
      ageSpecificPrompt = `Create a preschool behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} 

PRESCHOOL NORMALITY ASSESSMENT: For ages 2-5, many behaviors are normal as children develop emotional regulation, language skills, and social awareness. Tantrums, crying, hitting, biting are often developmentally appropriate.

Use these PRESCHOOL strategies:
- Simple language and immediate responses
- Visual cues and picture schedules
- Sensory tools and comfort items
- Adult-guided solutions
- Tangible rewards like stickers
- Redirection and distraction`;
    } else if (isSchoolAge) {
      ageSpecificPrompt = `Create a school-age behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} 

SCHOOL-AGE NORMALITY ASSESSMENT: For ages 6-8, children should have better emotional control and communication skills. Excessive crying, tantrums, or aggressive behaviors may indicate underlying needs or skill gaps that require intervention.

Use these SCHOOL-AGE strategies:
- Problem-solving discussions
- Logical explanations and reasoning
- Peer interaction coaching
- Academic skill connections
- Beginning self-regulation tools
- Privilege-based reward systems`;
    } else {
      ageSpecificPrompt = `Create a pre-teen behavior plan for ${childRef} who is ${behavior.toLowerCase()}. ${context ? `Context: ${context}` : ''} 

PRE-TEEN NORMALITY ASSESSMENT: For ages 9-11, emotional outbursts like excessive crying when things don't go their way are typically NOT normal and may indicate emotional regulation difficulties, anxiety, or other concerns that need targeted intervention.

Use these PRE-TEEN strategies:
- Emotional intelligence development
- Self-reflection and journaling
- Independence and decision-making
- Peer relationship navigation
- Future planning and goal setting
- Natural consequences and responsibility
- Self-advocacy and communication skills
- AVOID: sticker charts, visual schedules, comfort objects, simple redirection`;
    }

    const shortPrompt = `${ageSpecificPrompt}

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
            content: "You are an expert educator and child development specialist. CRITICAL: Age-appropriate strategies are essential. Ages 2-5 need basic guidance and visual tools. Ages 6-8 need logical reasoning and peer coaching. Ages 9-11 need emotional intelligence, independence, and self-advocacy - they should NOT receive preschool strategies like sticker charts or visual schedules. Match your response exactly to the child's developmental stage. Respond only with valid JSON."
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