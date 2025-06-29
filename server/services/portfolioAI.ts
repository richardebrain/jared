import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChildIdentification {
  detectedChildren: string[];
  confidence: number;
}

export interface ActivityAnalysis {
  activityType: string;
  recognizedObjects: string[];
  learningIndicators: string[];
  emotions: string[];
  confidence: number;
}

export interface StandardsAlignment {
  naeyc_standards: string[];
  custom_standards: string[];
  reasoning: string;
}

export interface ChildAssignment {
  assignedChildren: string[];
  reasoning: string;
  confidence: number;
}

export interface AIPortfolioAnalysis {
  children: ChildIdentification;
  activity: ActivityAnalysis;
  standards: StandardsAlignment;
  aiSummary: string;
  confidence: number;
  childAssignment?: ChildAssignment;
}

/**
 * Analyze photo and voice input to intelligently assign portfolio entries to children
 */
export async function analyzePortfolioWithVoice(
  base64Image: string,
  voiceContext: string,
  childrenInClass: { 
    id: number;
    firstName: string; 
    lastName: string; 
    referencePhotoUrl?: string;
    facialFeatures?: any; // Pre-computed facial features
  }[]
): Promise<AIPortfolioAnalysis> {
  try {
    const childrenNames = childrenInClass.map(child => `${child.firstName} ${child.lastName}`);
    
    const prompt = `You are an expert early childhood educator analyzing a classroom photo and teacher voice notes to create a child portfolio entry. 

CHILDREN IN CLASS: ${childrenNames.join(', ')}

TEACHER'S VOICE NOTES: "${voiceContext}"

PHOTO ANALYSIS TASK:
1. Analyze the photo to identify which children are visible and what activity is happening
2. Cross-reference the voice notes with what you see in the photo
3. Determine which specific children this portfolio entry should be assigned to based on BOTH the visual evidence AND the voice context

INTELLIGENT ASSIGNMENT RULES:
- If voice notes mention specific child names (e.g., "Caleb stacked 15 blocks"), prioritize those children
- If voice notes describe an activity but don't name children, use facial recognition to identify children in the photo
- Consider both direct mentions and contextual clues (e.g., "the boy in the red shirt building towers")
- If multiple children are involved, assign to all relevant children
- Provide confidence scoring and reasoning for assignments

Please analyze and return detailed JSON with:
1. Visual child identification from photo
2. Activity analysis and learning indicators
3. NAEYC standards alignment
4. INTELLIGENT CHILD ASSIGNMENT based on voice + visual analysis
5. Overall confidence and reasoning

Respond with valid JSON only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      children: {
        detectedChildren: analysis.children?.detectedChildren || [],
        confidence: analysis.children?.confidence || 0.7
      },
      activity: {
        activityType: analysis.activity?.activityType || 'Learning Activity',
        recognizedObjects: analysis.activity?.recognizedObjects || [],
        learningIndicators: analysis.activity?.learningIndicators || [],
        emotions: analysis.activity?.emotions || [],
        confidence: analysis.activity?.confidence || 0.7
      },
      standards: {
        naeyc_standards: analysis.standards?.naeyc_standards || [],
        custom_standards: analysis.standards?.custom_standards || [],
        reasoning: analysis.standards?.reasoning || ''
      },
      childAssignment: {
        assignedChildren: analysis.childAssignment?.assignedChildren || [],
        reasoning: analysis.childAssignment?.reasoning || 'Assignment based on AI analysis',
        confidence: analysis.childAssignment?.confidence || 0.8
      },
      aiSummary: analysis.aiSummary || 'Portfolio entry created from photo and voice analysis',
      confidence: analysis.confidence || 0.8
    };
  } catch (error) {
    console.error('Error analyzing portfolio with voice:', error);
    throw new Error('Failed to analyze portfolio entry');
  }
}

/**
 * Analyze a photo for child portfolio creation using OpenAI Vision
 */
export async function analyzePortfolioPhoto(
  base64Image: string,
  childrenInClass: { 
    id: number;
    firstName: string; 
    lastName: string; 
    referencePhotoUrl?: string;
    facialFeatures?: any; // Pre-computed facial features
  }[],
  context?: string
): Promise<AIPortfolioAnalysis> {
  try {
    // Separate children with facial features and/or reference photos for enhanced recognition
    const childrenWithFacialData = childrenInClass.filter(child => 
      (child.referencePhotoUrl && child.referencePhotoUrl.trim() !== '') || 
      (child.facialFeatures && Object.keys(child.facialFeatures).length > 0)
    );
    
    const childrenNames = childrenInClass.map(child => `${child.firstName} ${child.lastName}`);
    
    console.log(`[Enhanced Facial Recognition] Analyzing photo. ${childrenWithFacialData.length} children have biometric data for comparison.`);
    
    // Check if we should use CompreFace for facial recognition
    if (childrenWithFacialData.length > 0) {
      console.log(`[Facial Recognition] Attempting CompreFace analysis for ${childrenWithFacialData.length} children with biometric data`);
      
      try {
        // Try CompreFace first (most accurate)
        const { compreFaceService } = await import('./compreFaceService.js');
        
        if (compreFaceService.isConfigured()) {
          console.log(`[CompreFace] Using CompreFace for facial recognition`);
          
          const matches = await compreFaceService.recognizeFaces(base64Image);
          
          if (matches.length > 0) {
            const bestMatch = matches[0];
            
            // Find the child data by ID
            const matchedChild = childrenWithFacialData.find(child => child.id === bestMatch.childId);
            
            if (matchedChild && bestMatch.similarity >= 0.7) {
              console.log(`[CompreFace] High confidence match found: ${bestMatch.childName} (similarity: ${bestMatch.similarity})`);
              
              return {
                children: {
                  detectedChildren: [bestMatch.childName],
                  confidence: bestMatch.similarity
                },
                activity: {
                  activityType: 'Learning Activity',
                  recognizedObjects: [],
                  learningIndicators: [],
                  emotions: [],
                  confidence: 0.85
                },
                standards: {
                  naeyc_standards: [],
                  custom_standards: [],
                  reasoning: 'Analysis based on CompreFace facial recognition'
                },
                aiSummary: `Portfolio entry automatically assigned to ${bestMatch.childName} using CompreFace facial recognition (similarity: ${Math.round(bestMatch.similarity * 100)}%). Face detected at coordinates (${bestMatch.faceBox.x}, ${bestMatch.faceBox.y}).`,
                confidence: bestMatch.similarity
              };
            }
          }
        } else {
          console.log(`[CompreFace] Service not configured, falling back to enhanced facial features`);
        }
        
        // Fall back to enhanced facial feature extractor
        const { compareFacesWithFeatures } = await import('./facialFeatureExtractor.js');
        
        const recognitionResults = await compareFacesWithFeatures(base64Image, childrenWithFacialData, context);
        
        console.log(`[Enhanced Analysis] Facial recognition results:`, recognitionResults);
        
        if (recognitionResults.matches && recognitionResults.matches.length > 0) {
          const bestMatch = recognitionResults.matches[0];
          
          if (bestMatch.confidence >= 0.65) {
            console.log(`[Enhanced Analysis] High confidence match found: ${bestMatch.childName} (${bestMatch.confidence})`);
            
            return {
              children: {
                detectedChildren: [bestMatch.childName],
                confidence: bestMatch.confidence
              },
              activity: {
                activityType: 'Learning Activity',
                recognizedObjects: [],
                learningIndicators: [],
                emotions: [],
                confidence: 0.8
              },
              standards: {
                naeyc_standards: [],
                custom_standards: [],
                reasoning: 'Analysis based on enhanced biometric facial recognition'
              },
              aiSummary: `Portfolio entry automatically assigned to ${bestMatch.childName} using advanced facial recognition (confidence: ${Math.round(bestMatch.confidence * 100)}%). ${bestMatch.reasoning}`,
              confidence: bestMatch.confidence
            };
          }
        }
      } catch (faceError) {
        console.log(`[Facial Recognition] Advanced analysis failed, falling back to basic vision analysis:`, faceError);
      }
    }
    
    // Fall back to basic OpenAI vision analysis
    console.log(`[Basic Analysis] Using OpenAI vision analysis for child recognition`);
    
    // Create a comprehensive prompt for multi-child facial recognition
    let facialRecognitionSection = '';
    if (childrenWithFacialData.length > 0) {
      facialRecognitionSection = `

ADVANCED FACIAL RECOGNITION TASK:
You have ${childrenWithFacialData.length} children with biometric data to compare against. Please perform comprehensive facial recognition analysis:

CHILDREN WITH BIOMETRIC PROFILES:
${childrenWithFacialData.map((child, index) => {
  let profile = `${index + 1}. ${child.firstName} ${child.lastName}`;
  if (child.facialFeatures) {
    const features = child.facialFeatures;
    profile += ` - Biometric Profile:
   • Face Shape: ${features.faceShape || 'Unknown'}
   • Eye Color: ${features.eyeColor || 'Unknown'}
   • Eye Shape: ${features.eyeShape || 'Unknown'}
   • Hair Color: ${features.hairColor || 'Unknown'}
   • Hair Texture: ${features.hairTexture || 'Unknown'}
   • Skin Tone: ${features.skinTone || 'Unknown'}
   • Distinctive Features: ${features.distinctiveFeatures ? features.distinctiveFeatures.join(', ') : 'None noted'}
   • Age Range: ${features.ageRange || 'Unknown'}`;
  }
  if (child.referencePhotoUrl) {
    profile += ` (Reference Photo ${index + 1})`;
  }
  return profile;
}).join('\n\n')}

FACIAL RECOGNITION INSTRUCTIONS:
1. Compare EVERY face in the uploaded photo against ALL ${childrenWithPhotos.length} reference photos
2. Look for multiple children if the photo shows more than one child
3. For each face detected, identify the BEST MATCH from the reference photos based on:
   - Facial structure and bone structure
   - Eye shape, color, and spacing
   - Nose shape and size
   - Mouth shape and smile characteristics
   - Hair color, texture, and style
   - Overall facial proportions
   - Age-appropriate developmental features

4. CONFIDENCE SCORING: Rate each match from 0.0 to 1.0
   - 0.9+ = Very confident match (clear facial feature alignment)
   - 0.7-0.89 = Good match (several matching features)
   - 0.5-0.69 = Possible match (some matching features)
   - Below 0.5 = Uncertain/no clear match

5. MULTIPLE MATCHES: If you detect multiple children in the photo, identify ALL children you can match
6. NO MATCHES: If you cannot confidently match any faces, describe what you see ("unidentified child", "child with brown hair", etc.)

IMPORTANT: Only return names for children you can confidently match to reference photos. Be specific about which facial features led to the identification.`;
    }
    
    const prompt = `You are an expert early childhood educator with facial recognition capabilities analyzing a classroom photo for a child portfolio. Please analyze this image and provide detailed information about:

1. CHILD IDENTIFICATION: 
   - The children in this class are: ${childrenNames.join(', ')}
   - For children with reference photos, perform facial recognition comparison
   - If you can clearly identify specific children by comparing their faces to reference photos, name them specifically
   - If you cannot clearly identify specific children, describe what you see (e.g., "2 children engaged in activity")
   
${facialRecognitionSection}

2. ACTIVITY ANALYSIS: Identify what learning activity is happening, what objects/materials are being used, and what learning behaviors you observe.

3. LEARNING INDICATORS: Describe specific learning behaviors, skills being developed, and educational value.

4. EMOTIONAL ENGAGEMENT: Describe the emotional state and engagement level of the children.

5. NAEYC STANDARDS ALIGNMENT: Map this activity to relevant NAEYC standards for early childhood education.

${context ? `Additional context: ${context}` : ''}

Please respond in JSON format with the following structure:
{
  "children": {
    "detectedChildren": ["specific child names if recognized, or general descriptions"],
    "facialMatches": [
      {
        "childName": "Exact name from reference photos",
        "confidence": 0.0-1.0,
        "matchingFeatures": ["list of specific facial features that matched"],
        "reasoning": "detailed explanation of why this match was made"
      }
    ],
    "confidence": 0.0-1.0,
    "facialRecognitionUsed": true/false,
    "recognitionDetails": "explanation of facial recognition process and overall results",
    "totalFacesDetected": number,
    "totalReferencePhotosCompared": number
  },
  "activity": {
    "activityType": "activity name",
    "recognizedObjects": ["objects in photo"],
    "learningIndicators": ["specific learning behaviors observed"],
    "emotions": ["emotional states observed"],
    "confidence": 0.0-1.0
  },
  "standards": {
    "naeyc_standards": ["relevant NAEYC standard codes and descriptions"],
    "custom_standards": ["other relevant educational standards"],
    "reasoning": "explanation of why these standards apply"
  },
  "aiSummary": "A detailed 2-3 sentence description suitable for a portfolio entry",
  "confidence": 0.0-1.0
}`;

    // Build the content array with main photo and reference photos
    const messageContent: any[] = [
      {
        type: "text",
        text: prompt
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        }
      }
    ];

    // Add reference photos for facial recognition comparison
    if (childrenWithPhotos.length > 0) {
      childrenWithPhotos.forEach(child => {
        messageContent.push({
          type: "text",
          text: `REFERENCE PHOTO FOR ${child.firstName} ${child.lastName}:`
        });
        messageContent.push({
          type: "image_url",
          image_url: {
            url: child.referencePhotoUrl!
          }
        });
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    console.log(`[Facial Recognition] Analysis complete. Total faces detected: ${analysisResult.children?.totalFacesDetected || 0}`);
    console.log(`[Facial Recognition] Reference photos compared: ${analysisResult.children?.totalReferencePhotosCompared || 0}`);
    console.log(`[Facial Recognition] Facial matches found: ${JSON.stringify(analysisResult.children?.facialMatches || [])}`);
    console.log(`[Facial Recognition] Recognition details: ${analysisResult.children?.recognitionDetails}`);
    
    return {
      children: {
        detectedChildren: analysisResult.children?.detectedChildren || [],
        confidence: analysisResult.children?.confidence || 0
      },
      activity: {
        activityType: analysisResult.activity?.activityType || 'Unknown Activity',
        recognizedObjects: analysisResult.activity?.recognizedObjects || [],
        learningIndicators: analysisResult.activity?.learningIndicators || [],
        emotions: analysisResult.activity?.emotions || [],
        confidence: analysisResult.activity?.confidence || 0
      },
      standards: {
        naeyc_standards: analysisResult.standards?.naeyc_standards || [],
        custom_standards: analysisResult.standards?.custom_standards || [],
        reasoning: analysisResult.standards?.reasoning || ''
      },
      aiSummary: analysisResult.aiSummary || 'Activity observed in classroom setting.',
      confidence: analysisResult.confidence || 0
    };

  } catch (error) {
    console.error('Error analyzing portfolio photo:', error);
    throw new Error('Failed to analyze photo: ' + error.message);
  }
}

/**
 * Generate a portfolio entry title based on activity analysis
 */
export async function generatePortfolioTitle(
  activityType: string,
  childName: string,
  context?: string
): Promise<string> {
  try {
    const prompt = `Generate a creative, engaging title for a child portfolio entry. 
    
    Child: ${childName}
    Activity: ${activityType}
    ${context ? `Context: ${context}` : ''}
    
    The title should be:
    - 3-8 words long
    - Engaging and descriptive
    - Focus on the child's learning/growth
    - Professional but warm
    
    Examples: "Sophie's Block Tower Adventure", "Emma Explores Colors", "Building Together: Teamwork in Action"
    
    Respond with just the title, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
    });

    return response.choices[0].message.content?.trim() || `${childName}'s Learning Journey`;

  } catch (error) {
    console.error('Error generating portfolio title:', error);
    return `${childName}'s Learning Activity`;
  }
}

/**
 * Enhance teacher observations with AI suggestions
 */
export async function enhanceObservationNotes(
  aiSummary: string,
  teacherNotes: string,
  activityType: string
): Promise<string> {
  try {
    const prompt = `You are an expert early childhood educator. Help enhance these observation notes by combining AI analysis with teacher observations.

AI Analysis: ${aiSummary}
Teacher Notes: ${teacherNotes}
Activity Type: ${activityType}

Please provide enhanced observation notes that:
- Combine both AI insights and teacher observations
- Use professional ECE language
- Focus on learning outcomes and development
- Are concise but comprehensive (2-3 sentences)
- Maintain the teacher's personal observations while adding valuable insights

Respond with just the enhanced notes, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    return response.choices[0].message.content?.trim() || teacherNotes;

  } catch (error) {
    console.error('Error enhancing observation notes:', error);
    return teacherNotes;
  }
}

/**
 * NAEYC Standards database for automatic mapping
 */
export const NAEYC_STANDARDS_DB = [
  {
    code: "2.A.01",
    title: "Curriculum: Essential Characteristics",
    description: "The curriculum is planned to be comprehensive and addresses four major areas: social-emotional, physical, language, and cognitive development.",
    category: "Curriculum Development",
    keywords: ["comprehensive curriculum", "social-emotional", "physical development", "language", "cognitive"]
  },
  {
    code: "2.A.02", 
    title: "Curriculum: Social-Emotional Development",
    description: "Children are provided varied opportunities to develop social skills and emotional competence.",
    category: "Social-Emotional Development",
    keywords: ["social skills", "emotional competence", "cooperation", "empathy", "self-regulation"]
  },
  {
    code: "2.A.03",
    title: "Curriculum: Physical Development", 
    description: "Children are provided varied opportunities to develop gross motor skills, fine motor skills, and overall physical competence.",
    category: "Physical Development",
    keywords: ["gross motor", "fine motor", "physical competence", "movement", "coordination"]
  },
  {
    code: "2.A.04",
    title: "Curriculum: Language Development",
    description: "Children are provided varied opportunities to develop language and early literacy skills.",
    category: "Language Development", 
    keywords: ["language", "literacy", "communication", "vocabulary", "reading", "writing"]
  },
  {
    code: "2.A.05",
    title: "Curriculum: Cognitive Development",
    description: "Children are provided varied opportunities to develop mathematical concepts, scientific thinking, and problem-solving skills.",
    category: "Cognitive Development",
    keywords: ["mathematical concepts", "scientific thinking", "problem-solving", "critical thinking", "exploration"]
  },
  {
    code: "2.B.01",
    title: "Teaching: Curriculum Implementation",
    description: "Teachers use a variety of teaching strategies and learning experiences to support children's learning.",
    category: "Teaching Strategies",
    keywords: ["teaching strategies", "learning experiences", "differentiated instruction", "active learning"]
  },
  {
    code: "2.C.01",
    title: "Curriculum Content: Creative Arts",
    description: "Children are provided varied opportunities to explore and express themselves through visual arts, music, drama, and dance.",
    category: "Creative Arts",
    keywords: ["visual arts", "music", "drama", "dance", "creative expression", "artistic exploration"]
  },
  {
    code: "2.E.01",
    title: "Assessment: Overview",
    description: "Assessment processes are ongoing and systematic to inform curriculum and teaching practices.",
    category: "Assessment",
    keywords: ["assessment", "observation", "documentation", "progress monitoring", "evaluation"]
  }
];

/**
 * Map activity to relevant NAEYC standards
 */
export function mapToNAEYCStandards(activityType: string, recognizedObjects: string[]): string[] {
  const activityLower = activityType.toLowerCase();
  const objectsLower = recognizedObjects.map(obj => obj.toLowerCase());
  const allKeywords = [activityLower, ...objectsLower].join(' ');
  
  const relevantStandards: string[] = [];
  
  NAEYC_STANDARDS_DB.forEach(standard => {
    const hasMatch = standard.keywords.some(keyword => 
      allKeywords.includes(keyword.toLowerCase())
    );
    
    if (hasMatch) {
      relevantStandards.push(`${standard.code}: ${standard.title}`);
    }
  });
  
  return relevantStandards.length > 0 ? relevantStandards : ['2.A.01: Curriculum: Essential Characteristics'];
}