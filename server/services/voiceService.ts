// Voice profiles for different narrator types
export const NARRATOR_VOICES = {
  'professional-female': {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, friendly female voice
    name: 'Bella',
    description: 'Professional female narrator with warm, engaging tone'
  },
  'professional-male': {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - clear, authoritative male voice
    name: 'Adam',
    description: 'Professional male narrator with clear, authoritative tone'
  },
  'friendly-female': {
    voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - friendly, approachable female voice
    name: 'Dorothy',
    description: 'Friendly female narrator perfect for educational content'
  },
  'storyteller': {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO', // Callum - expressive storytelling voice
    name: 'Callum',
    description: 'Expressive storyteller voice for engaging narratives'
  },
  'child-friendly': {
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - child-friendly, energetic voice
    name: 'Charlotte',
    description: 'Child-friendly narrator with energetic, engaging delivery'
  }
};

export class VoiceService {
  private isInitialized = false;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    this.apiKey = process.env.ELEVENLABS_API_KEY || null;
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice generation will be disabled.');
      return;
    }

    this.isInitialized = true;
    console.log('ElevenLabs voice service initialized successfully');
  }

  async generateSpeech(
    text: string, 
    voiceType: keyof typeof NARRATOR_VOICES = 'professional-female',
    settings: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
    } = {}
  ): Promise<Buffer | null> {
    if (!this.isInitialized || !this.apiKey) {
      console.error('ElevenLabs client not initialized');
      return null;
    }

    const voice = NARRATOR_VOICES[voiceType];
    if (!voice) {
      console.error(`Voice type ${voiceType} not found`);
      return null;
    }

    try {
      // Clean and optimize text for speech
      const optimizedText = this.optimizeTextForSpeech(text);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: optimizedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: settings.stability ?? 0.75,
            similarity_boost: settings.similarityBoost ?? 0.85,
            style: settings.style ?? 0.0,
            use_speaker_boost: settings.useSpeakerBoost ?? true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`Generated speech for text: "${text.substring(0, 50)}..." using voice: ${voice.name}`);
      
      return audioBuffer;
    } catch (error) {
      console.error('Voice generation error:', error);
      return null;
    }
  }

  private optimizeTextForSpeech(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Convert common abbreviations to full words
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMs\./g, 'Miss')
      .replace(/\bMrs\./g, 'Missus')
      .replace(/\betc\./g, 'etcetera')
      .replace(/\be\.g\./g, 'for example')
      .replace(/\bi\.e\./g, 'that is')
      // Add pauses for better pacing
      .replace(/\. /g, '. ... ')
      .replace(/\? /g, '? ... ')
      .replace(/! /g, '! ... ')
      // Ensure proper spacing
      .replace(/\s+/g, ' ')
      .trim();
  }

  async generateModuleNarration(
    moduleContent: {
      title: string;
      description: string;
      sections: Array<{
        title: string;
        content: string;
        type: string;
      }>;
    },
    voiceType: keyof typeof NARRATOR_VOICES = 'professional-female'
  ): Promise<{
    intro: Buffer | null;
    sections: Array<{
      title: string;
      audio: Buffer | null;
    }>;
    outro: Buffer | null;
  }> {
    const results = {
      intro: null as Buffer | null,
      sections: [] as Array<{ title: string; audio: Buffer | null }>,
      outro: null as Buffer | null
    };

    // Generate introduction
    const introText = `Welcome to ${moduleContent.title}. ${moduleContent.description} Let's begin this learning journey together.`;
    results.intro = await this.generateSpeech(introText, voiceType);

    // Generate narration for each section
    for (const section of moduleContent.sections) {
      let sectionText = section.content;
      
      // Add contextual introduction based on section type
      if (section.type === 'video') {
        sectionText = `Now let's watch: ${section.title}. ${sectionText}`;
      } else if (section.type === 'quiz') {
        sectionText = `Time for a knowledge check: ${section.title}. ${sectionText}`;
      } else {
        sectionText = `${section.title}. ${sectionText}`;
      }

      const audio = await this.generateSpeech(sectionText, voiceType);
      results.sections.push({
        title: section.title,
        audio
      });
    }

    // Generate conclusion
    const outroText = `Congratulations! You've completed ${moduleContent.title}. Take a moment to reflect on what you've learned and how you can apply these concepts in your work with children.`;
    results.outro = await this.generateSpeech(outroText, voiceType);

    return results;
  }

  async generateQuestionNarration(
    question: {
      question: string;
      answers: string[];
      explanation?: string;
    },
    voiceType: keyof typeof NARRATOR_VOICES = 'friendly-female'
  ): Promise<{
    question: Buffer | null;
    explanation: Buffer | null;
  }> {
    // Generate question audio
    const questionText = `Here's your question: ${question.question}`;
    const questionAudio = await this.generateSpeech(questionText, voiceType);

    // Generate explanation audio if available
    let explanationAudio = null;
    if (question.explanation) {
      const explanationText = `The correct answer is explained as follows: ${question.explanation}`;
      explanationAudio = await this.generateSpeech(explanationText, voiceType);
    }

    return {
      question: questionAudio,
      explanation: explanationAudio
    };
  }

  // Voice cloning for custom teacher voices
  async cloneVoice(audioFile: Buffer, voiceName: string, description?: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('Voice service not initialized');
    }

    try {
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('files', new Blob([audioFile]), 'voice_sample.mp3');
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey!,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voice_id;
    } catch (error) {
      console.error('Voice cloning error:', error);
      return null;
    }
  }

  // Generate multilingual content for ESL learners
  async generateMultilingualSpeech(
    text: string,
    voiceType: string,
    targetLanguage: string = 'en'
  ): Promise<Buffer | null> {
    if (!this.isInitialized) {
      throw new Error('Voice service not initialized');
    }

    const voice = NARRATOR_VOICES[voiceType as keyof typeof NARRATOR_VOICES];
    if (!voice) {
      throw new Error(`Voice type ${voiceType} not found`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true
          },
          language_code: targetLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Multilingual TTS error:', error);
      return null;
    }
  }

  // Create sound effects for educational games
  async generateSoundEffect(description: string, duration: number = 3): Promise<Buffer | null> {
    if (!this.isInitialized) {
      throw new Error('Voice service not initialized');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sound-generation`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: description,
          duration_seconds: duration,
          prompt_influence: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`Sound generation failed: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Sound generation error:', error);
      return null;
    }
  }

  // Create interactive pronunciation guides
  async generatePronunciationGuide(
    word: string,
    phonetic: string,
    voiceType: string = 'professional-female'
  ): Promise<Buffer | null> {
    const pronunciationText = `The word is ${word}. Listen carefully: ${word}. The pronunciation is ${phonetic}. Let's practice: ${word}, ${word}, ${word}.`;
    
    return await this.generateSpeech(pronunciationText, voiceType, {
      stability: 0.3,
      similarity_boost: 0.8,
      style: 0.2
    });
  }

  // Generate emotional storytelling with voice modulation
  async generateStorytellingNarration(
    story: string,
    emotion: 'excited' | 'calm' | 'mysterious' | 'happy' = 'happy',
    voiceType: string = 'storyteller'
  ): Promise<Buffer | null> {
    const emotionSettings = {
      excited: { stability: 0.2, similarity_boost: 0.9, style: 0.8 },
      calm: { stability: 0.8, similarity_boost: 0.6, style: 0.2 },
      mysterious: { stability: 0.4, similarity_boost: 0.7, style: 0.6 },
      happy: { stability: 0.5, similarity_boost: 0.8, style: 0.5 }
    };

    return await this.generateSpeech(story, voiceType, emotionSettings[emotion]);
  }

  // Create personalized reading companions
  async generatePersonalizedReading(
    text: string,
    childName: string,
    readingLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<Buffer | null> {
    const personalizedText = `Hello ${childName}! Today we're going to read together. Are you ready? Let's begin: ${text}. Great job reading with me, ${childName}!`;
    
    const levelSettings = {
      beginner: { stability: 0.6, similarity_boost: 0.7, style: 0.3 },
      intermediate: { stability: 0.5, similarity_boost: 0.75, style: 0.4 },
      advanced: { stability: 0.4, similarity_boost: 0.8, style: 0.5 }
    };

    return await this.generateSpeech(personalizedText, 'child-friendly', levelSettings[readingLevel]);
  }

  // Generate assessment feedback with emotional intelligence
  async generateAssessmentFeedback(
    score: number,
    totalQuestions: number,
    encouragement: boolean = true
  ): Promise<Buffer | null> {
    const percentage = Math.round((score / totalQuestions) * 100);
    let feedbackText = '';

    if (percentage >= 90) {
      feedbackText = encouragement 
        ? `Excellent work! You got ${score} out of ${totalQuestions} questions correct. That's ${percentage}%! You're doing amazing!`
        : `You scored ${score} out of ${totalQuestions}, which is ${percentage}%.`;
    } else if (percentage >= 70) {
      feedbackText = encouragement
        ? `Great job! You got ${score} out of ${totalQuestions} questions correct. That's ${percentage}%! Keep up the good work!`
        : `You scored ${score} out of ${totalQuestions}, which is ${percentage}%.`;
    } else {
      feedbackText = encouragement
        ? `You got ${score} out of ${totalQuestions} questions correct. That's ${percentage}%. Don't worry, learning takes practice. You're doing great by trying!`
        : `You scored ${score} out of ${totalQuestions}, which is ${percentage}%.`;
    }

    return await this.generateSpeech(feedbackText, 'friendly-female');
  }

  getAvailableVoices(): typeof NARRATOR_VOICES {
    return NARRATOR_VOICES;
  }

  isServiceAvailable(): boolean {
    return this.isInitialized && this.apiKey !== null;
  }
}

// Singleton instance
export const voiceService = new VoiceService();