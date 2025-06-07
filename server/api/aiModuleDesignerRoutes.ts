import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback to Perplexity if OpenAI fails
async function callPerplexityAPI(prompt: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Provide structured, practical learning module designs in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Generate initial module outline
router.post('/generate-module-outline', async (req, res) => {
  try {
    const { topic, audience, goals, duration, difficulty, learningStyle, constraints, context } = req.body;

    const prompt = `Create a comprehensive micro-learning module outline with the following requirements:

TOPIC: ${topic}
AUDIENCE: ${audience}
LEARNING GOALS: ${goals}
DURATION: ${duration} minutes
DIFFICULTY: ${difficulty}
LEARNING STYLE: ${learningStyle}
CONSTRAINTS: ${constraints || 'None specified'}
CONTEXT: ${context}

Please design a module that follows micro-learning best practices with varied engagement methods. Return a JSON object with this exact structure:

{
  "title": "Clear, engaging module title",
  "description": "2-3 sentence description of what learners will accomplish",
  "category": "Primary category (e.g., Communication Skills, Leadership, Technical Skills)",
  "targetAudience": "Refined description of who this is for",
  "totalDuration": ${duration},
  "learningObjectives": [
    "Specific, measurable objective 1",
    "Specific, measurable objective 2",
    "Specific, measurable objective 3"
  ],
  "keyTopics": [
    "Core concept 1",
    "Core concept 2", 
    "Core concept 3"
  ],
  "suggestedActivities": [
    {
      "type": "video|interactive|quiz|discussion|reflection|practice|demonstration|scenario|storytelling|gamification",
      "title": "Activity title",
      "description": "What learners will do",
      "duration": number_in_minutes,
      "engagement": "low|medium|high",
      "rationale": "Why this activity type works well for this content and audience"
    }
  ],
  "assessmentStrategy": "How learning will be measured and validated",
  "adaptiveElements": [
    "How the module adapts to different learner needs",
    "Personalization features",
    "Difficulty scaling methods"
  ]
}

Focus on creating a logical progression from introduction through practice to application. Vary activity types to maintain engagement. Consider the specified learning style preference and constraints.`;

    let result;
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer specializing in micro-learning and adult education. Create engaging, effective learning experiences that follow proven pedagogical principles."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (openaiError) {
      console.error('OpenAI API failed, trying Perplexity:', openaiError);
      // Fallback to Perplexity
      result = await callPerplexityAPI(prompt);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating module outline:', error);
    res.status(500).json({ 
      error: 'Failed to generate module outline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Refine existing module outline based on feedback
router.post('/refine-module-outline', async (req, res) => {
  try {
    const { currentOutline, feedback, originalRequirements } = req.body;

    const prompt = `You are refining a learning module based on user feedback. Here's the current module outline:

CURRENT OUTLINE:
${JSON.stringify(currentOutline, null, 2)}

ORIGINAL REQUIREMENTS:
Topic: ${originalRequirements.topic}
Audience: ${originalRequirements.audience}
Duration: ${originalRequirements.duration} minutes
Difficulty: ${originalRequirements.difficulty}

USER FEEDBACK:
${feedback}

Please modify the module outline to address the feedback while maintaining the overall structure and learning effectiveness. Return the refined outline in the same JSON format as the original.

Key considerations:
- Maintain the total duration constraint
- Keep learning objectives aligned with the original goals
- Ensure activity progression still makes pedagogical sense
- Address the specific feedback points while preserving what works well

Return only the updated JSON object with the same structure.`;

    let result;
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer. Refine learning modules based on user feedback while maintaining pedagogical effectiveness."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (openaiError) {
      console.error('OpenAI API failed, trying Perplexity:', openaiError);
      // Fallback to Perplexity
      result = await callPerplexityAPI(prompt);
    }

    res.json(result);
  } catch (error) {
    console.error('Error refining module outline:', error);
    res.status(500).json({ 
      error: 'Failed to refine module outline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate detailed module with full content
router.post('/generate-detailed-module', async (req, res) => {
  try {
    const { outline, requirements } = req.body;

    const prompt = `Create a complete, detailed learning module based on this approved outline:

OUTLINE:
${JSON.stringify(outline, null, 2)}

ORIGINAL REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

Generate a detailed module with specific content for each activity. Return a JSON object with this structure:

{
  "moduleInfo": {
    "title": "${outline.title}",
    "description": "${outline.description}",
    "category": "${outline.category}",
    "totalDuration": ${outline.totalDuration},
    "difficultyLevel": "${requirements.difficulty}",
    "targetAudience": "${outline.targetAudience}"
  },
  "learningObjectives": ${JSON.stringify(outline.learningObjectives)},
  "sections": [
    {
      "id": "unique_section_id",
      "title": "Section title from outline",
      "type": "introduction|content|activity|reflection|assessment",
      "description": "What this section accomplishes",
      "content": "Detailed content including scripts, instructions, questions, or materials",
      "duration": duration_in_minutes,
      "learningObjectives": ["specific objectives for this section"],
      "materials": ["required materials or resources"],
      "instructions": ["step-by-step instructor guidance"],
      "interactiveElements": {
        "type": "activity_type_from_outline",
        "engagement": "engagement_level",
        "assessmentCriteria": ["how success is measured"],
        "adaptations": ["how to modify for different learners"]
      },
      "pointsAwarded": point_value_based_on_complexity
    }
  ],
  "assessmentStrategy": "Detailed assessment approach",
  "resources": {
    "materials": ["All materials needed"],
    "technology": ["Technology requirements"],
    "preparation": ["Pre-session preparation needed"]
  },
  "facilitatorNotes": [
    "Important tips for delivery",
    "Common challenges and solutions",
    "Timing guidance"
  ],
  "extensionActivities": [
    "Optional follow-up activities",
    "Advanced challenges",
    "Real-world application ideas"
  ]
}

Make the content specific, actionable, and ready to implement. Include detailed scripts where appropriate, specific questions for discussions, and clear success criteria for each activity.`;

    let result;
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer creating detailed, implementable learning modules. Provide specific, actionable content that educators can use immediately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (openaiError) {
      console.error('OpenAI API failed, trying Perplexity:', openaiError);
      // Fallback to Perplexity
      result = await callPerplexityAPI(prompt);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating detailed module:', error);
    res.status(500).json({ 
      error: 'Failed to generate detailed module',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate activity suggestions based on learning objectives
router.post('/suggest-activities', async (req, res) => {
  try {
    const { objectives, audience, duration, constraints } = req.body;

    const prompt = `Suggest engaging learning activities for these objectives:

LEARNING OBJECTIVES:
${objectives.join('\n')}

AUDIENCE: ${audience}
AVAILABLE TIME: ${duration} minutes
CONSTRAINTS: ${constraints || 'None'}

Provide 3-5 diverse activity suggestions that use different engagement methods (video, interactive, quiz, discussion, scenario, etc.). Return JSON:

{
  "activities": [
    {
      "type": "activity_type",
      "title": "Activity title",
      "description": "What learners do",
      "duration": minutes,
      "engagement": "low|medium|high",
      "materials": ["required materials"],
      "instructions": ["step by step"],
      "learningOutcome": "specific objective addressed",
      "assessmentMethod": "how to measure success"
    }
  ]
}`;

    let result;
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert learning activity designer. Create engaging, varied activities that achieve specific learning objectives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (openaiError) {
      console.error('OpenAI API failed, trying Perplexity:', openaiError);
      // Fallback to Perplexity
      result = await callPerplexityAPI(prompt);
    }

    res.json(result);
  } catch (error) {
    console.error('Error suggesting activities:', error);
    res.status(500).json({ 
      error: 'Failed to suggest activities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate detailed content for a specific section
router.post('/generate-section-content', async (req, res) => {
  try {
    const { sectionOutline, moduleContext, sectionIndex, totalSections } = req.body;

    const prompt = `Generate detailed content for section ${sectionIndex + 1} of ${totalSections} in a learning module.

MODULE CONTEXT:
Title: ${moduleContext.title}
Description: ${moduleContext.description}
Target Audience: ${moduleContext.targetAudience}
Learning Objectives: ${moduleContext.learningObjectives.join(', ')}

SECTION TO BUILD:
Type: ${sectionOutline.type}
Title: ${sectionOutline.title}
Description: ${sectionOutline.description}
Duration: ${sectionOutline.duration} minutes

Generate content based on the section type. Return JSON in this exact format:

{
  "type": "${sectionOutline.type}",
  "title": "Section title",
  "content": "Detailed content for this section",
  "duration": ${sectionOutline.duration},
  "materials": ["list of materials needed"],
  "instructions": ["step-by-step instructions"],
  "learningObjectives": ["specific objectives"],
  "questions": [
    {
      "question": "Question text",
      "answers": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ],
  "interactiveElements": {
    "scenarios": [
      {
        "situation": "Real scenario description",
        "options": ["Option 1", "Option 2", "Option 3"],
        "correctChoice": 0,
        "feedback": "Explanation of best choice"
      }
    ],
    "matchingPairs": [
      {
        "left": "Concept",
        "right": "Definition"
      }
    ],
    "storyElements": {
      "character": "Character description",
      "situation": "Story setup",
      "challenge": "Problem to solve",
      "resolution": "Learning application"
    },
    "triageElements": [
      {
        "situation": "Emergency or priority situation",
        "priority": "high|medium|low",
        "rationale": "Why this priority level"
      }
    ]
  },
  "videoSuggestions": {
    "searchTerms": ["relevant", "keywords"],
    "description": "Video type needed"
  }
}

Make content specific, actionable, and engaging for the target audience.`;

    let result;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer creating detailed, engaging learning content. Focus on practical application and learner engagement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (openaiError) {
      console.error('OpenAI API failed, trying Perplexity:', openaiError);
      result = await callPerplexityAPI(prompt);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating section content:', error);
    res.status(500).json({ 
      error: 'Failed to generate section content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;