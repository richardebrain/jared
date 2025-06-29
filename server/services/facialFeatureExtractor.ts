/**
 * Facial Feature Extraction Service
 * Analyzes reference photos when uploaded to extract and store facial features
 * for faster and more accurate facial recognition matching
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedFacialFeatures {
  // Primary facial structure
  faceShape: string;
  faceWidth: string;
  faceLength: string;
  jawlineShape: string;
  cheekboneProminence: string;
  foreheadSize: string;
  
  // Eye characteristics
  eyeColor: string;
  eyeShape: string;
  eyeSize: string;
  eyeSpacing: string;
  eyebrowShape: string;
  eyebrowThickness: string;
  eyelashLength: string;
  
  // Nose features
  noseShape: string;
  noseSize: string;
  noseBridge: string;
  nostrilShape: string;
  
  // Mouth and smile features
  mouthShape: string;
  mouthSize: string;
  lipThickness: string;
  smileCharacteristics: string;
  teethVisibility: string;
  
  // Hair characteristics
  hairColor: string;
  hairTexture: string;
  hairLength: string;
  hairStyle: string;
  hairline: string;
  
  // Skin characteristics
  skinTone: string;
  skinTexture: string;
  complexion: string;
  
  // Distinctive features
  distinctiveFeatures: string[];
  birthmarks: string[];
  dimples: string[];
  freckles: string;
  
  // Facial proportions (ratios)
  eyeToNoseRatio: string;
  noseToMouthRatio: string;
  faceSymmetry: string;
  
  // Age and development
  ageRange: string;
  developmentalStage: string;
  
  // Technical metadata
  confidence: number;
  extractedAt: string;
  aiModel: string;
  analysisDepth: string;
  
  // CompreFace integration
  compreFaceRegistered?: boolean;
}

/**
 * Extract detailed facial features from a reference photo
 * This runs once when a child's reference photo is uploaded
 */
export async function extractFacialFeatures(
  base64Image: string,
  childName: string
): Promise<ExtractedFacialFeatures> {
  console.log(`[Feature Extraction] Starting facial feature extraction for ${childName}`);

  const prompt = `ADVANCED FACIAL FEATURE EXTRACTION for modern facial recognition systems.

SUBJECT: ${childName}

Perform comprehensive facial biometric analysis using state-of-the-art facial recognition principles. Extract ALL measurable facial characteristics for optimal matching accuracy.

## PRIMARY FACIAL GEOMETRY:
1. Face Shape: Round, oval, square, heart-shaped, diamond, oblong, triangular
2. Face Width: Narrow, medium, wide (relative measurements)
3. Face Length: Short, medium, long (vertical proportions)
4. Jawline Shape: Rounded, square, pointed, soft, defined
5. Cheekbone Prominence: High, medium, low, angular, rounded
6. Forehead Size: Small, medium, large, width relative to face

## EYE CHARACTERISTICS (Critical for recognition):
1. Eye Color: Exact color (brown, blue, green, hazel, amber, gray) with variations
2. Eye Shape: Almond, round, hooded, monolid, deep-set, protruding, downturned, upturned
3. Eye Size: Small, medium, large relative to face
4. Eye Spacing: Close-set, normal, wide-set (distance between eyes)
5. Eyebrow Shape: Straight, arched, rounded, angular, thick, thin
6. Eyebrow Thickness: Thin, medium, thick, bushy
7. Eyelash Length: Short, medium, long, very long

## NOSE ANALYSIS (Key identifying feature):
1. Nose Shape: Straight, Roman, button, hooked, snub, bulbous, pointed
2. Nose Size: Small, medium, large relative to face
3. Nose Bridge: High, low, straight, curved, wide, narrow
4. Nostril Shape: Round, oval, flared, narrow, symmetrical

## MOUTH AND SMILE FEATURES:
1. Mouth Shape: Small, medium, large, wide, narrow
2. Mouth Size: Proportional to face width
3. Lip Thickness: Thin, medium, full, asymmetrical
4. Smile Characteristics: Wide, narrow, symmetric, gummy, closed-lip
5. Teeth Visibility: Visible when smiling, gap-toothed, straight, crooked

## HAIR CHARACTERISTICS:
1. Hair Color: Exact shade (blonde, brown, black, red, auburn, strawberry, etc.)
2. Hair Texture: Straight, wavy, curly, kinky, coarse, fine
3. Hair Length: Very short, short, medium, long, very long
4. Hair Style: Bangs, ponytail, braids, loose, parted (left/right/center)
5. Hairline: Straight, widow's peak, receding, rounded

## SKIN ANALYSIS:
1. Skin Tone: Fair, medium, olive, tan, dark, with undertones
2. Skin Texture: Smooth, rough, soft, with visible pores
3. Complexion: Clear, freckled, moles, blemishes

## DISTINCTIVE FEATURES (Unique identifiers):
1. Distinctive Features: Dimples, cleft chin, moles, scars, asymmetries
2. Birthmarks: Location, size, color, shape
3. Dimples: Cheek dimples, chin dimples, when visible (smiling/talking)
4. Freckles: Density, distribution, seasonal variation

## FACIAL PROPORTIONS (Mathematical ratios):
1. Eye-to-Nose Ratio: Distance measurement for recognition
2. Nose-to-Mouth Ratio: Vertical spacing proportions
3. Face Symmetry: Perfectly symmetric, slightly asymmetric, notably asymmetric

## DEVELOPMENTAL CHARACTERISTICS:
1. Age Range: Specific age estimate with range
2. Developmental Stage: Baby fat, growing into features, mature features

ANALYSIS REQUIREMENTS:
- Use forensic-level detail for each feature
- Consider features from multiple angles if visible
- Note permanent vs. temporary characteristics
- Focus on features that remain consistent across expressions
- Identify the TOP 5 most distinctive features for this individual
- Rate confidence for each major feature category

Respond in detailed JSON format:
{
  "faceShape": "detailed geometric description",
  "faceWidth": "width category with specifics",
  "faceLength": "length category with specifics", 
  "jawlineShape": "precise jawline description",
  "cheekboneProminence": "cheekbone analysis",
  "foreheadSize": "forehead proportions",
  
  "eyeColor": "exact eye color with variations",
  "eyeShape": "precise eye shape analysis",
  "eyeSize": "eye size relative to face",
  "eyeSpacing": "spacing measurement category",
  "eyebrowShape": "detailed eyebrow characteristics",
  "eyebrowThickness": "thickness description",
  "eyelashLength": "eyelash characteristics",
  
  "noseShape": "detailed nose geometry",
  "noseSize": "nose proportions",
  "noseBridge": "bridge characteristics",
  "nostrilShape": "nostril analysis",
  
  "mouthShape": "mouth geometry",
  "mouthSize": "mouth proportions",
  "lipThickness": "lip analysis",
  "smileCharacteristics": "smile pattern",
  "teethVisibility": "teeth characteristics",
  
  "hairColor": "precise hair color",
  "hairTexture": "texture analysis",
  "hairLength": "length description",
  "hairStyle": "current styling",
  "hairline": "hairline pattern",
  
  "skinTone": "detailed skin analysis",
  "skinTexture": "texture description",
  "complexion": "complexion characteristics",
  
  "distinctiveFeatures": ["unique", "identifying", "features"],
  "birthmarks": ["location and description"],
  "dimples": ["dimple locations and visibility"],
  "freckles": "freckle pattern description",
  
  "eyeToNoseRatio": "proportional measurement",
  "noseToMouthRatio": "vertical spacing",
  "faceSymmetry": "symmetry analysis",
  
  "ageRange": "specific age estimate",
  "developmentalStage": "facial development stage",
  
  "confidence": 0.0-1.0,
  "extractedAt": "${new Date().toISOString()}",
  "aiModel": "gpt-4o-vision-advanced",
  "analysisDepth": "comprehensive-biometric"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent feature extraction
    });

    const content = response.choices[0].message.content || '{}';
    
    // Check if OpenAI refused the request with a text response
    if (content.includes("I'm sorry") || content.includes("I cannot") || content.includes("I'm not able")) {
      console.log(`[Feature Extraction] OpenAI declined facial analysis. Using generic features for ${childName}`);
      
      // Return generic features when facial recognition is declined
      return {
        faceShape: "unknown",
        faceWidth: "medium",
        faceLength: "medium",
        jawlineShape: "unknown",
        cheekboneProminence: "medium",
        foreheadSize: "medium",
        eyeColor: "unknown",
        eyeShape: "unknown",
        eyeSize: "medium",
        eyeSpacing: "medium",
        eyebrowShape: "unknown",
        eyebrowThickness: "medium",
        eyelashLength: "medium",
        noseShape: "unknown",
        noseSize: "medium",
        noseBridge: "unknown",
        nostrilShape: "unknown",
        mouthShape: "unknown",
        mouthSize: "medium",
        lipThickness: "medium",
        smileCharacteristics: "unknown",
        teethVisibility: "unknown",
        hairColor: "unknown",
        hairTexture: "unknown",
        hairLength: "unknown",
        hairStyle: "unknown",
        hairline: "unknown",
        skinTone: "unknown",
        skinTexture: "unknown",
        complexion: "unknown",
        distinctiveFeatures: [],
        birthmarks: [],
        dimples: [],
        freckles: "unknown",
        eyeToNoseRatio: "unknown",
        noseToMouthRatio: "unknown",
        faceSymmetry: "unknown",
        ageRange: "unknown",
        developmentalStage: "unknown",
        confidence: 0.1,
        extractedAt: new Date().toISOString(),
        aiModel: "gpt-4o",
        analysisDepth: "declined"
      };
    }

    let featuresResult;
    try {
      featuresResult = JSON.parse(content);
    } catch (parseError) {
      console.log(`[Feature Extraction] JSON parsing failed for ${childName}. Content: ${content.substring(0, 100)}...`);
      
      // Return minimal features when parsing fails
      return {
        faceShape: "unknown",
        faceWidth: "medium",
        faceLength: "medium",
        jawlineShape: "unknown",
        cheekboneProminence: "medium",
        foreheadSize: "medium",
        eyeColor: "unknown",
        eyeShape: "unknown",
        eyeSize: "medium",
        eyeSpacing: "medium",
        eyebrowShape: "unknown",
        eyebrowThickness: "medium",
        eyelashLength: "medium",
        noseShape: "unknown",
        noseSize: "medium",
        noseBridge: "unknown",
        nostrilShape: "unknown",
        mouthShape: "unknown",
        mouthSize: "medium",
        lipThickness: "medium",
        smileCharacteristics: "unknown",
        teethVisibility: "unknown",
        hairColor: "unknown",
        hairTexture: "unknown",
        hairLength: "unknown",
        hairStyle: "unknown",
        hairline: "unknown",
        skinTone: "unknown",
        skinTexture: "unknown",
        complexion: "unknown",
        distinctiveFeatures: [],
        birthmarks: [],
        dimples: [],
        freckles: "unknown",
        eyeToNoseRatio: "unknown",
        noseToMouthRatio: "unknown",
        faceSymmetry: "unknown",
        ageRange: "unknown",
        developmentalStage: "unknown",
        confidence: 0.1,
        extractedAt: new Date().toISOString(),
        aiModel: "gpt-4o",
        analysisDepth: "parsing_failed"
      };
    }
    
    console.log(`[Feature Extraction] Successfully extracted features for ${childName}:`);
    console.log(`- Face Shape: ${featuresResult.faceShape}`);
    console.log(`- Eye Color: ${featuresResult.eyeColor}`);
    console.log(`- Hair: ${featuresResult.hairColor} ${featuresResult.hairTexture}`);
    console.log(`- Distinctive Features: ${featuresResult.distinctiveFeatures?.join(', ')}`);
    console.log(`- Confidence: ${featuresResult.confidence}`);

    return featuresResult;
  } catch (error) {
    console.error(`[Feature Extraction] Error extracting features for ${childName}:`, error);
    throw new Error(`Failed to extract facial features: ${error.message}`);
  }
}

/**
 * Compare uploaded photo against pre-computed facial features
 * This is much faster than comparing against full reference photos
 */
export async function compareAgainstStoredFeatures(
  uploadedPhotoBase64: string,
  childrenWithFeatures: Array<{
    id: number;
    firstName: string;
    lastName: string;
    facialFeatures: ExtractedFacialFeatures;
  }>,
  context?: string
): Promise<{
  matches: Array<{
    childId: number;
    childName: string;
    confidence: number;
    matchingFeatures: string[];
    reasoning: string;
  }>;
  totalFacesDetected: number;
  analysisConfidence: number;
}> {
  console.log(`[Feature Matching] Comparing uploaded photo against ${childrenWithFeatures.length} stored feature sets`);

  // Create comprehensive feature comparison prompt
  const featuresDescription = childrenWithFeatures.map((child, index) => {
    const features = child.facialFeatures;
    return `${index + 1}. ${child.firstName} ${child.lastName} - BIOMETRIC PROFILE:
   
   FACIAL GEOMETRY:
   - Face Shape: ${features.faceShape}
   - Face Width: ${features.faceWidth}
   - Face Length: ${features.faceLength}
   - Jawline: ${features.jawlineShape}
   - Cheekbones: ${features.cheekboneProminence}
   - Forehead: ${features.foreheadSize}
   
   EYES (Critical ID Features):
   - Color: ${features.eyeColor}
   - Shape: ${features.eyeShape}
   - Size: ${features.eyeSize}
   - Spacing: ${features.eyeSpacing}
   - Eyebrows: ${features.eyebrowShape} (${features.eyebrowThickness})
   - Eyelashes: ${features.eyelashLength}
   
   NOSE CHARACTERISTICS:
   - Shape: ${features.noseShape}
   - Size: ${features.noseSize}
   - Bridge: ${features.noseBridge}
   - Nostrils: ${features.nostrilShape}
   
   MOUTH & SMILE:
   - Shape: ${features.mouthShape}
   - Size: ${features.mouthSize}
   - Lips: ${features.lipThickness}
   - Smile: ${features.smileCharacteristics}
   - Teeth: ${features.teethVisibility}
   
   HAIR FEATURES:
   - Color: ${features.hairColor}
   - Texture: ${features.hairTexture}
   - Length: ${features.hairLength}
   - Style: ${features.hairStyle}
   - Hairline: ${features.hairline}
   
   SKIN ANALYSIS:
   - Tone: ${features.skinTone}
   - Texture: ${features.skinTexture}
   - Complexion: ${features.complexion}
   
   UNIQUE IDENTIFIERS:
   - Distinctive Features: ${features.distinctiveFeatures?.join(', ')}
   - Birthmarks: ${features.birthmarks?.join(', ')}
   - Dimples: ${features.dimples?.join(', ')}
   - Freckles: ${features.freckles}
   
   PROPORTIONS:
   - Eye-to-Nose Ratio: ${features.eyeToNoseRatio}
   - Nose-to-Mouth Ratio: ${features.noseToMouthRatio}
   - Face Symmetry: ${features.faceSymmetry}
   
   AGE/DEVELOPMENT:
   - Age Range: ${features.ageRange}
   - Stage: ${features.developmentalStage}`;
  }).join('\n\n---\n\n');

  const prompt = `ADVANCED BIOMETRIC FACIAL RECOGNITION ANALYSIS

Compare faces in the uploaded photo against these comprehensive biometric profiles using state-of-the-art facial recognition principles:

## STORED BIOMETRIC PROFILES:
${featuresDescription}

## COMPREHENSIVE FACIAL RECOGNITION PROTOCOL:

### PRIMARY ANALYSIS TARGETS:
1. **Facial Geometry Matching**:
   - Face shape, width, length proportions
   - Jawline structure and definition
   - Cheekbone prominence and positioning
   - Forehead size and shape

2. **Critical Eye Recognition** (Most reliable identifier):
   - Exact eye color and variations
   - Eye shape (almond, round, hooded, etc.)
   - Eye size relative to face
   - Eye spacing (close-set, normal, wide-set)
   - Eyebrow shape and thickness
   - Eyelash characteristics

3. **Nose Biometrics** (Highly distinctive):
   - Nose shape and geometric structure
   - Nose size proportional to face
   - Nose bridge characteristics
   - Nostril shape and symmetry

4. **Mouth and Smile Analysis**:
   - Mouth shape and proportions
   - Lip thickness and characteristics
   - Smile pattern and teeth visibility
   - Facial expression characteristics

5. **Hair Recognition**:
   - Hair color and exact shade
   - Hair texture and pattern
   - Hair length and styling
   - Hairline characteristics

6. **Skin Analysis**:
   - Skin tone and undertones
   - Skin texture characteristics
   - Complexion patterns

7. **Unique Biometric Identifiers**:
   - Birthmarks (location and characteristics)
   - Dimples (location and visibility conditions)
   - Freckle patterns and distribution
   - Distinctive facial features

8. **Facial Proportions** (Mathematical ratios):
   - Eye-to-nose ratio measurements
   - Nose-to-mouth ratio calculations
   - Overall facial symmetry analysis

9. **Age and Development Matching**:
   - Age-appropriate facial development
   - Developmental stage characteristics

### MATCHING ALGORITHM:
- **0.95+ = Perfect Match**: 8+ major features align with high precision
- **0.85-0.94 = Excellent Match**: 6-7 major features align well
- **0.75-0.84 = Very Good Match**: 5-6 features align with good confidence
- **0.65-0.74 = Good Match**: 4-5 features align reasonably well
- **0.50-0.64 = Possible Match**: 3-4 features show some alignment
- **Below 0.50 = Poor Match**: Insufficient matching characteristics

### ANALYSIS REQUIREMENTS:
1. Detect ALL faces in the uploaded photo
2. For EACH detected face, compare against ALL stored profiles
3. Use multi-point biometric matching for accuracy
4. Weight critical features (eyes, nose, distinctive marks) more heavily
5. Consider lighting, angle, and expression variations
6. Provide detailed reasoning for each match

${context ? `\n### ADDITIONAL CONTEXT:\n${context}` : ''}

### REQUIRED JSON RESPONSE FORMAT:
{
  "matches": [
    {
      "childId": number,
      "childName": "exact name from biometric profiles",
      "confidence": 0.0-1.0,
      "matchingFeatures": [
        "specific facial features that matched",
        "biometric measurements that aligned",
        "distinctive characteristics identified"
      ],
      "reasoning": "detailed multi-point biometric analysis explaining the match confidence including specific feature alignments, proportion matches, and unique identifier recognition"
    }
  ],
  "totalFacesDetected": number,
  "analysisConfidence": 0.0-1.0
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${uploadedPhotoBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const comparisonResult = JSON.parse(response.choices[0].message.content || '{}');
    
    console.log(`[Feature Matching] Analysis complete:`);
    console.log(`- Total faces detected: ${comparisonResult.totalFacesDetected}`);
    console.log(`- Matches found: ${comparisonResult.matches?.length || 0}`);
    comparisonResult.matches?.forEach((match: any) => {
      console.log(`  * ${match.childName}: ${match.confidence} confidence`);
      console.log(`    Matching features: ${match.matchingFeatures?.join(', ')}`);
    });

    return comparisonResult;
  } catch (error) {
    console.error(`[Feature Matching] Error comparing features:`, error);
    throw new Error(`Failed to compare facial features: ${error.message}`);
  }
}