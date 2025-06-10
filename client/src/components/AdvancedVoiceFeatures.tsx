import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Volume2, Globe, Sparkles, BookOpen, Trophy, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdvancedVoiceFeatures() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playAudio = (audioData: string | ArrayBuffer) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    let audioUrl: string;
    if (typeof audioData === 'string') {
      // Base64 data
      audioUrl = `data:audio/mpeg;base64,${audioData}`;
    } else {
      // Binary data
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(blob);
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    audio.play().catch(console.error);
  };

  const generateMultilingualSpeech = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-multilingual-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Welcome to our early childhood education platform. We support multiple languages to help all children learn.",
          voiceType: 'professional-female',
          targetLanguage: 'es' // Spanish
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Multilingual Speech Generated",
          description: "Spanish narration created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate multilingual speech",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generateSoundEffect = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-sound-effect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: "Children laughing and playing in a playground with birds chirping",
          duration: 5
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Sound Effect Generated",
          description: "Playground sounds created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sound effect",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generatePronunciationGuide = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-pronunciation-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: "butterfly",
          phonetic: "BUH-ter-fly",
          voiceType: 'child-friendly'
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Pronunciation Guide Generated",
          description: "Interactive pronunciation lesson created",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate pronunciation guide",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generateStorytellingNarration = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-storytelling-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: "Once upon a time, in a magical forest, there lived a curious little rabbit who loved to explore and learn new things every day.",
          emotion: 'excited',
          voiceType: 'storyteller'
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Story Narration Generated",
          description: "Emotional storytelling with excited tone",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate story narration",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generatePersonalizedReading = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-personalized-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "The sun is bright today. The birds are singing in the trees.",
          childName: "Emma",
          readingLevel: 'beginner'
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Personalized Reading Generated",
          description: "Custom reading companion for Emma",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate personalized reading",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generateAssessmentFeedback = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-assessment-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: 8,
          totalQuestions: 10,
          encouragement: true
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        playAudio(audioBuffer);
        toast({
          title: "Assessment Feedback Generated",
          description: "Encouraging feedback for 8/10 score",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate assessment feedback",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Advanced AI Voice Features</h1>
        <p className="text-gray-600">Explore cutting-edge ElevenLabs voice technology for educational content</p>
      </div>

      <Tabs defaultValue="multilingual" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="multilingual">
            <Globe className="w-4 h-4 mr-2" />
            Multilingual
          </TabsTrigger>
          <TabsTrigger value="effects">
            <Sparkles className="w-4 h-4 mr-2" />
            Sound Effects
          </TabsTrigger>
          <TabsTrigger value="pronunciation">
            <Volume2 className="w-4 h-4 mr-2" />
            Pronunciation
          </TabsTrigger>
          <TabsTrigger value="storytelling">
            <BookOpen className="w-4 h-4 mr-2" />
            Storytelling
          </TabsTrigger>
          <TabsTrigger value="reading">
            <Mic className="w-4 h-4 mr-2" />
            Reading
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <Trophy className="w-4 h-4 mr-2" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="multilingual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Multilingual Speech Generation
              </CardTitle>
              <CardDescription>
                Generate speech in multiple languages using ElevenLabs' multilingual voice models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Spanish</Badge>
                <Badge>French</Badge>
                <Badge>German</Badge>
                <Badge>Italian</Badge>
                <Badge>Portuguese</Badge>
                <Badge>Polish</Badge>
                <Badge>Dutch</Badge>
                <Badge>And more...</Badge>
              </div>
              <Button 
                onClick={generateMultilingualSpeech} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Spanish Welcome Message'}
              </Button>
              <p className="text-sm text-gray-600">
                Perfect for ESL learners and multilingual classrooms. Supports pronunciation in native languages.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI-Generated Sound Effects
              </CardTitle>
              <CardDescription>
                Create custom sound effects from text descriptions for educational games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline">Playground sounds</Badge>
                <Badge variant="outline">Animal noises</Badge>
                <Badge variant="outline">Weather effects</Badge>
                <Badge variant="outline">Musical instruments</Badge>
              </div>
              <Button 
                onClick={generateSoundEffect} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Playground Sound Effect'}
              </Button>
              <p className="text-sm text-gray-600">
                Enhance educational games with contextual audio. No need for sound libraries.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pronunciation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Interactive Pronunciation Guides
              </CardTitle>
              <CardDescription>
                Create pronunciation lessons with phonetic breakdowns and practice repetition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Example: "butterfly" → "BUH-ter-fly"</Label>
                <div className="flex gap-2">
                  <Badge>Word introduction</Badge>
                  <Badge>Phonetic breakdown</Badge>
                  <Badge>Practice repetition</Badge>
                </div>
              </div>
              <Button 
                onClick={generatePronunciationGuide} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Pronunciation Guide'}
              </Button>
              <p className="text-sm text-gray-600">
                Helps children learn proper pronunciation with guided practice sessions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storytelling">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Emotional Storytelling
              </CardTitle>
              <CardDescription>
                Generate stories with emotional voice modulation for engaging narratives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="secondary">Excited</Badge>
                <Badge variant="secondary">Calm</Badge>
                <Badge variant="secondary">Mysterious</Badge>
                <Badge variant="secondary">Happy</Badge>
              </div>
              <Button 
                onClick={generateStorytellingNarration} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Excited Story Narration'}
              </Button>
              <p className="text-sm text-gray-600">
                Brings stories to life with appropriate emotional tones that match the narrative.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Personalized Reading Companion
              </CardTitle>
              <CardDescription>
                Create personalized reading experiences with child's name and reading level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Badge variant="outline">Beginner</Badge>
                <Badge variant="outline">Intermediate</Badge>
                <Badge variant="outline">Advanced</Badge>
              </div>
              <Button 
                onClick={generatePersonalizedReading} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Reading Session for Emma'}
              </Button>
              <p className="text-sm text-gray-600">
                Creates encouraging, personalized reading sessions that adapt to the child's level.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Assessment Feedback
              </CardTitle>
              <CardDescription>
                Generate encouraging assessment feedback with emotional intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Example: 8/10 questions correct (80%)</Label>
                <div className="flex gap-2">
                  <Badge variant="default">Encouraging</Badge>
                  <Badge variant="default">Constructive</Badge>
                  <Badge variant="default">Motivating</Badge>
                </div>
              </div>
              <Button 
                onClick={generateAssessmentFeedback} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Assessment Feedback'}
              </Button>
              <p className="text-sm text-gray-600">
                Provides personalized feedback that encourages learning and builds confidence.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Educational Applications</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>Multilingual Support:</strong> Help ESL students learn in their native language</p>
          <p><strong>Sound Effects:</strong> Make educational games more immersive and engaging</p>
          <p><strong>Pronunciation:</strong> Assist with language learning and speech development</p>
          <p><strong>Storytelling:</strong> Create captivating narratives that hold children's attention</p>
          <p><strong>Reading Companions:</strong> Provide personalized support for developing readers</p>
          <p><strong>Assessment Feedback:</strong> Encourage continued learning with positive reinforcement</p>
        </CardContent>
      </Card>
    </div>
  );
}