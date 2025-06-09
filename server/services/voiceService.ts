import { ElevenLabsApi } from '@elevenlabs/elevenlabs-js';

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
  private client: ElevenLabs | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.warn('ElevenLabs API key not found. Voice generation will be disabled.');
      return;
    }

    try {
      this.client = new ElevenLabs({
        apiKey: apiKey
      });
      this.isInitialized = true;
      console.log('ElevenLabs voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ElevenLabs client:', error);
    }
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
    if (!this.isInitialized || !this.client) {
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

      const response = await this.client.textToSpeech.convert({
        voice_id: voice.voiceId,
        text: optimizedText,
        model_id: 'eleven_multilingual_v2', // Best quality model
        voice_settings: {
          stability: settings.stability ?? 0.75,
          similarity_boost: settings.similarityBoost ?? 0.85,
          style: settings.style ?? 0.0,
          use_speaker_boost: settings.useSpeakerBoost ?? true
        }
      });

      // Convert response to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      const audioBuffer = Buffer.concat(chunks);
      console.log(`Generated speech for text: "${text.substring(0, 50)}..." using voice: ${voice.name}`);
      
      return audioBuffer;
    } catch (error) {
      if (error instanceof ElevenLabsApiError) {
        console.error('ElevenLabs API error:', error.message);
        console.error('Status:', error.status);
        console.error('Body:', error.body);
      } else {
        console.error('Voice generation error:', error);
      }
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

  getAvailableVoices(): typeof NARRATOR_VOICES {
    return NARRATOR_VOICES;
  }

  isServiceAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }
}

// Singleton instance
export const voiceService = new VoiceService();