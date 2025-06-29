/**
 * CompreFace Integration Service
 * Provides face recognition, verification, and detection using CompreFace REST API
 */

interface CompreFaceConfig {
  baseUrl: string;
  apiKey: string;
  recognitionServiceKey: string;
  detectionServiceKey?: string;
}

interface FaceRecognitionResult {
  result: Array<{
    box: {
      probability: number;
      x_max: number;
      x_min: number;
      y_max: number;
      y_min: number;
    };
    subjects: Array<{
      similarity: number;
      subject: string;
    }>;
  }>;
}

interface FaceDetectionResult {
  result: Array<{
    age: {
      high: number;
      low: number;
    };
    gender: {
      probability: number;
      value: string;
    };
    box: {
      probability: number;
      x_max: number;
      x_min: number;
      y_max: number;
      y_min: number;
    };
    landmarks: number[][];
    pose: {
      pitch: number;
      roll: number;
      yaw: number;
    };
  }>;
}

interface ChildMatch {
  childName: string;
  childId: number;
  confidence: number;
  similarity: number;
  faceBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class CompreFaceService {
  private config: CompreFaceConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.COMPREFACE_BASE_URL || 'http://localhost:8000',
      apiKey: process.env.COMPREFACE_API_KEY || '',
      recognitionServiceKey: process.env.COMPREFACE_RECOGNITION_KEY || '',
      detectionServiceKey: process.env.COMPREFACE_DETECTION_KEY || ''
    };
  }

  /**
   * Check if CompreFace service is available and configured
   */
  public isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.apiKey && this.config.recognitionServiceKey);
  }

  /**
   * Add a face image to CompreFace with a subject identifier
   */
  public async addFace(base64Image: string, childId: number, childName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('CompreFace is not configured');
    }

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), `child_${childId}.jpg`);
      
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/recognition/faces?subject=${encodeURIComponent(`child_${childId}_${childName}`)}`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.config.recognitionServiceKey,
          },
          body: formData
        }
      );

      if (!response.ok) {
        console.error(`CompreFace add face failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const result = await response.json();
      console.log(`[CompreFace] Successfully added face for ${childName} (ID: ${childId})`);
      return true;

    } catch (error) {
      console.error('[CompreFace] Error adding face:', error);
      return false;
    }
  }

  /**
   * Recognize faces in an image using CompreFace
   */
  public async recognizeFaces(base64Image: string): Promise<ChildMatch[]> {
    if (!this.isConfigured()) {
      throw new Error('CompreFace is not configured');
    }

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'analyze.jpg');
      
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/recognition/recognize?limit=10&prediction_count=5&det_prob_threshold=0.8&face_plugins=age,gender`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.config.recognitionServiceKey,
          },
          body: formData
        }
      );

      if (!response.ok) {
        console.error(`CompreFace recognition failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const result: FaceRecognitionResult = await response.json();
      console.log('[CompreFace] Recognition result:', JSON.stringify(result, null, 2));

      // Process results to extract child matches
      const matches: ChildMatch[] = [];

      for (const face of result.result) {
        if (face.subjects && face.subjects.length > 0) {
          // Get the best match for this face
          const bestMatch = face.subjects[0];
          
          // Parse subject identifier (format: "child_{id}_{name}")
          const subjectMatch = bestMatch.subject.match(/^child_(\d+)_(.+)$/);
          if (subjectMatch) {
            const childId = parseInt(subjectMatch[1]);
            const childName = subjectMatch[2];
            
            matches.push({
              childName,
              childId,
              confidence: face.box.probability,
              similarity: bestMatch.similarity,
              faceBox: {
                x: face.box.x_min,
                y: face.box.y_min,
                width: face.box.x_max - face.box.x_min,
                height: face.box.y_max - face.box.y_min
              }
            });
          }
        }
      }

      // Sort by similarity (highest first)
      matches.sort((a, b) => b.similarity - a.similarity);

      console.log(`[CompreFace] Found ${matches.length} face matches`);
      return matches;

    } catch (error) {
      console.error('[CompreFace] Error recognizing faces:', error);
      return [];
    }
  }

  /**
   * Detect faces and get demographic information
   */
  public async detectFaces(base64Image: string): Promise<FaceDetectionResult> {
    if (!this.isConfigured() || !this.config.detectionServiceKey) {
      throw new Error('CompreFace detection service is not configured');
    }

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'detect.jpg');
      
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/detection/detect?face_plugins=age,gender,landmarks,pose`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.config.detectionServiceKey,
          },
          body: formData
        }
      );

      if (!response.ok) {
        console.error(`CompreFace detection failed: ${response.status} ${response.statusText}`);
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const result: FaceDetectionResult = await response.json();
      console.log('[CompreFace] Detection result:', JSON.stringify(result, null, 2));
      return result;

    } catch (error) {
      console.error('[CompreFace] Error detecting faces:', error);
      throw error;
    }
  }

  /**
   * Remove a face from CompreFace by subject
   */
  public async removeFace(childId: number, childName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('CompreFace is not configured');
    }

    try {
      const subject = `child_${childId}_${childName}`;
      
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/recognition/faces?subject=${encodeURIComponent(subject)}`,
        {
          method: 'DELETE',
          headers: {
            'x-api-key': this.config.recognitionServiceKey,
          }
        }
      );

      if (!response.ok) {
        console.error(`CompreFace remove face failed: ${response.status} ${response.statusText}`);
        return false;
      }

      console.log(`[CompreFace] Successfully removed face for ${childName} (ID: ${childId})`);
      return true;

    } catch (error) {
      console.error('[CompreFace] Error removing face:', error);
      return false;
    }
  }

  /**
   * List all subjects (children) in CompreFace
   */
  public async listSubjects(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('CompreFace is not configured');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/recognition/subjects`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.config.recognitionServiceKey,
          }
        }
      );

      if (!response.ok) {
        console.error(`CompreFace list subjects failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const result = await response.json();
      return result.subjects || [];

    } catch (error) {
      console.error('[CompreFace] Error listing subjects:', error);
      return [];
    }
  }

  /**
   * Health check for CompreFace service
   */
  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/recognition/subjects`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.recognitionServiceKey,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('[CompreFace] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const compreFaceService = new CompreFaceService();