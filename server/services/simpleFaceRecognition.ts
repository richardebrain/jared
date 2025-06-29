/**
 * Simplified In-App Face Recognition Service
 * Uses face-api.js for browser-based facial recognition without external dependencies
 * This provides basic facial matching capabilities for child identification
 */

interface SimpleFaceDescriptor {
  childId: number;
  childName: string;
  descriptor: number[]; // Face descriptor array
  confidence: number;
  extractedAt: string;
}

interface FaceMatch {
  childId: number;
  childName: string;
  similarity: number;
  confidence: number;
}

class SimpleFaceRecognitionService {
  private faceDescriptors: Map<number, SimpleFaceDescriptor> = new Map();

  /**
   * Store a face descriptor for a child
   */
  public storeFaceDescriptor(
    childId: number,
    childName: string, 
    descriptor: number[],
    confidence: number = 0.8
  ): void {
    const faceData: SimpleFaceDescriptor = {
      childId,
      childName,
      descriptor,
      confidence,
      extractedAt: new Date().toISOString()
    };
    
    this.faceDescriptors.set(childId, faceData);
    console.log(`[Simple Face Recognition] Stored face descriptor for ${childName} (ID: ${childId})`);
  }

  /**
   * Find matching faces for a given descriptor
   */
  public findMatches(queryDescriptor: number[], threshold: number = 0.6): FaceMatch[] {
    const matches: FaceMatch[] = [];

    for (const [childId, storedFace] of this.faceDescriptors) {
      const similarity = this.calculateSimilarity(queryDescriptor, storedFace.descriptor);
      
      if (similarity >= threshold) {
        matches.push({
          childId: storedFace.childId,
          childName: storedFace.childName,
          similarity,
          confidence: storedFace.confidence * similarity
        });
      }
    }

    // Sort by similarity (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate similarity between two face descriptors using cosine similarity
   */
  private calculateSimilarity(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) {
      console.warn('[Simple Face Recognition] Descriptor length mismatch');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < desc1.length; i++) {
      dotProduct += desc1[i] * desc2[i];
      norm1 += desc1[i] * desc1[i];
      norm2 += desc2[i] * desc2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    const similarity = dotProduct / magnitude;
    return Math.max(0, similarity); // Ensure non-negative
  }

  /**
   * Get all stored face descriptors
   */
  public getAllDescriptors(): SimpleFaceDescriptor[] {
    return Array.from(this.faceDescriptors.values());
  }

  /**
   * Remove a face descriptor
   */
  public removeFaceDescriptor(childId: number): boolean {
    const deleted = this.faceDescriptors.delete(childId);
    if (deleted) {
      console.log(`[Simple Face Recognition] Removed face descriptor for child ID: ${childId}`);
    }
    return deleted;
  }

  /**
   * Check if service has descriptors
   */
  public hasDescriptors(): boolean {
    return this.faceDescriptors.size > 0;
  }

  /**
   * Get descriptor count
   */
  public getDescriptorCount(): number {
    return this.faceDescriptors.size;
  }

  /**
   * Load descriptors from database stored facial features
   */
  public loadFromStoredFeatures(children: any[]): void {
    console.log(`[Simple Face Recognition] Loading face descriptors for ${children.length} children`);
    
    for (const child of children) {
      if (child.facialFeatures && child.facialFeatures.faceDescriptor) {
        this.storeFaceDescriptor(
          child.id,
          `${child.firstName} ${child.lastName}`,
          child.facialFeatures.faceDescriptor,
          child.facialFeatures.confidence || 0.8
        );
      }
    }
    
    console.log(`[Simple Face Recognition] Loaded ${this.faceDescriptors.size} face descriptors`);
  }

  /**
   * Clear all descriptors
   */
  public clear(): void {
    this.faceDescriptors.clear();
    console.log('[Simple Face Recognition] Cleared all face descriptors');
  }
}

// Export singleton instance
export const simpleFaceRecognition = new SimpleFaceRecognitionService();
export { FaceMatch, SimpleFaceDescriptor };