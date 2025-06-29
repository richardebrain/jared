/**
 * Client-side Face Detection Service using face-api.js
 * Provides in-browser facial recognition without external dependencies
 */

// @ts-ignore - face-api.js doesn't have perfect TypeScript definitions
import * as faceapi from 'face-api.js';

interface FaceDescriptor {
  childId: number;
  childName: string;
  descriptor: Float32Array;
  confidence: number;
  imageUrl?: string;
}

interface FaceMatch {
  childId: number;
  childName: string;
  distance: number; // Lower is better (0 = perfect match)
  confidence: number;
}

class FaceDetectionService {
  private isModelLoaded = false;
  private storedDescriptors: FaceDescriptor[] = [];

  /**
   * Initialize face-api.js models
   */
  async initialize(): Promise<void> {
    if (this.isModelLoaded) return;

    try {
      console.log('[Face Detection] Loading face-api.js models...');
      
      // Load models from CDN
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      this.isModelLoaded = true;
      console.log('[Face Detection] Models loaded successfully');
    } catch (error) {
      console.error('[Face Detection] Failed to load models:', error);
      throw new Error('Failed to initialize face detection models');
    }
  }

  /**
   * Detect faces in an image and extract descriptors
   */
  async detectFaces(imageElement: HTMLImageElement): Promise<Float32Array[]> {
    if (!this.isModelLoaded) {
      await this.initialize();
    }

    try {
      console.log(`[Face Detection] Starting face detection on image ${imageElement.width}x${imageElement.height}`);
      
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log(`[Face Detection] Found ${detections.length} faces with descriptors`);
      
      if (detections.length === 0) {
        console.log('[Face Detection] No faces detected. Trying different detector options...');
        
        // Try with different detector options
        const alternativeDetections = await faceapi
          .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptors();
          
        console.log(`[Face Detection] Alternative detector found ${alternativeDetections.length} faces`);
        
        if (alternativeDetections.length > 0) {
          return alternativeDetections.map(detection => detection.descriptor);
        }
      }

      return detections.map(detection => detection.descriptor);
    } catch (error) {
      console.error('[Face Detection] Error detecting faces:', error);
      console.error('[Face Detection] Error details:', {
        message: error.message,
        stack: error.stack,
        imageSize: `${imageElement.width}x${imageElement.height}`
      });
      return [];
    }
  }

  /**
   * Store a face descriptor for a child
   */
  storeFaceDescriptor(
    childId: number,
    childName: string,
    descriptor: Float32Array,
    confidence: number = 0.8,
    imageUrl?: string
  ): void {
    const existingIndex = this.storedDescriptors.findIndex(d => d.childId === childId);
    
    const faceDescriptor: FaceDescriptor = {
      childId,
      childName,
      descriptor,
      confidence,
      imageUrl
    };

    if (existingIndex >= 0) {
      this.storedDescriptors[existingIndex] = faceDescriptor;
      console.log(`[Face Detection] Updated face descriptor for ${childName} (ID: ${childId})`);
    } else {
      this.storedDescriptors.push(faceDescriptor);
      console.log(`[Face Detection] Stored new face descriptor for ${childName} (ID: ${childId})`);
    }
  }

  /**
   * Get the number of stored descriptors
   */
  getDescriptorCount(): number {
    return this.storedDescriptors.length;
  }

  /**
   * Find matching faces for a given descriptor
   */
  findMatches(queryDescriptor: Float32Array, threshold: number = 0.7): FaceMatch[] {
    console.log(`[Face Detection] Starting match comparison with threshold ${threshold}`);
    
    if (this.storedDescriptors.length === 0) {
      console.log('[Face Detection] No stored descriptors available for matching');
      return [];
    }

    console.log(`[Face Detection] Comparing against ${this.storedDescriptors.length} stored descriptors`);
    const matches: FaceMatch[] = [];

    for (const stored of this.storedDescriptors) {
      console.log(`[Face Detection] Comparing with ${stored.childName} (ID: ${stored.childId})`);
      console.log(`[Face Detection] Query descriptor length: ${queryDescriptor.length}, Stored descriptor length: ${stored.descriptor.length}`);
      
      const distance = faceapi.euclideanDistance(queryDescriptor, stored.descriptor);
      console.log(`[Face Detection] Distance to ${stored.childName}: ${distance} (threshold: ${threshold})`);
      
      // Lower distance = better match (opposite of similarity)
      if (distance <= threshold) {
        const confidence = Math.max(0, 1 - distance) * stored.confidence;
        console.log(`[Face Detection] MATCH FOUND: ${stored.childName} with distance ${distance} and confidence ${confidence}`);
        matches.push({
          childId: stored.childId,
          childName: stored.childName,
          distance,
          confidence
        });
      } else {
        console.log(`[Face Detection] No match for ${stored.childName} - distance ${distance} exceeds threshold ${threshold}`);
      }
    }

    console.log(`[Face Detection] Total matches found: ${matches.length}`);
    
    // Sort by distance (lowest first = best matches)
    return matches.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Process an image from data URL and extract face descriptors
   */
  async processImageDataUrl(dataUrl: string): Promise<Float32Array[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          console.log(`[Face Detection] Image loaded successfully: ${img.width}x${img.height}`);
          console.log(`[Face Detection] Starting face detection...`);
          const descriptors = await this.detectFaces(img);
          console.log(`[Face Detection] Face detection complete, found ${descriptors.length} faces`);
          resolve(descriptors);
        } catch (error) {
          console.error('[Face Detection] Error during face detection:', error);
          reject(error);
        }
      };
      
      img.onerror = (e) => {
        console.error('[Face Detection] Image load error:', e);
        console.error('[Face Detection] Data URL prefix:', dataUrl.substring(0, 100));
        reject(new Error(`Failed to load image: ${e}`));
      };
      
      // Validate data URL format
      if (!dataUrl.startsWith('data:image/')) {
        console.error('[Face Detection] Invalid data URL format:', dataUrl.substring(0, 50));
        reject(new Error('Invalid data URL format - must start with data:image/'));
        return;
      }
      
      console.log(`[Face Detection] Loading image from data URL (${dataUrl.length} chars)`);
      img.src = dataUrl;
    });
  }

  /**
   * Load stored face descriptors from child reference photos
   */
  async loadChildDescriptors(children: any[]): Promise<void> {
    console.log(`[Face Detection] Loading descriptors for ${children.length} children`);
    
    for (const child of children) {
      if (child.referencePhotoUrl) {
        try {
          const descriptors = await this.processImageDataUrl(child.referencePhotoUrl);
          
          if (descriptors.length > 0) {
            // Use the first detected face as the reference
            this.storeFaceDescriptor(
              child.id,
              `${child.firstName} ${child.lastName}`,
              descriptors[0],
              0.8,
              child.referencePhotoUrl
            );
          }
        } catch (error) {
          console.warn(`[Face Detection] Failed to process reference photo for ${child.firstName} ${child.lastName}:`, error);
        }
      }
    }
    
    console.log(`[Face Detection] Loaded ${this.storedDescriptors.length} face descriptors`);
  }

  /**
   * Get count of stored descriptors
   */
  getDescriptorCount(): number {
    return this.storedDescriptors.length;
  }

  /**
   * Clear all stored descriptors
   */
  clearDescriptors(): void {
    this.storedDescriptors = [];
    console.log('[Face Detection] Cleared all face descriptors');
  }

  /**
   * Check if models are loaded
   */
  isReady(): boolean {
    return this.isModelLoaded;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export { FaceMatch, FaceDescriptor };