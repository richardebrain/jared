import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import {
  Mic,
  Volume2,
  FileAudio,
  Globe,
  Heart,
  Music
} from 'lucide-react';

interface VoiceFeaturesProps {
  sectionIndex?: number;
  onAudioGenerated?: (audioUrl: string, type: string) => void;
}

export default function VoiceFeatures({ sectionIndex, onAudioGenerated }: VoiceFeaturesProps) {
  const { toast } = useToast();
  const [voiceText, setVoiceText] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [soundDescription, setSoundDescription] = useState('');
  const [pronunciationWord, setPronunciationWord] = useState('');
  const [phoneticGuide, setPhoneticGuide] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyEmotion, setStoryEmotion] = useState('happy');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuickVoice = async (text: string, language: string) => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter text to generate voice",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const endpoint = language === 'en' 
        ? '/api/voice/generate-speech'
        : '/api/voice/generate-multilingual-speech';
      
      const requestBody = language === 'en'
        ? { text, voiceType: 'friendly-female', optimize: true }
        : { text, voiceType: 'friendly-female', targetLanguage: language };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        if (onAudioGenerated) {
          onAudioGenerated(audioUrl, 'voice');
        }
        
        toast({
          title: "Voice Generated",
          description: `Playing in ${language}`,
        });
      } else {
        throw new Error('Voice generation failed');
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      toast({
        title: "Voice Generation Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generateSoundEffect = async (description: string) => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the sound effect",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-sound-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, duration: "medium" }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        if (onAudioGenerated) {
          onAudioGenerated(audioUrl, 'sound-effect');
        }
        
        toast({
          title: "Sound Effect Created",
          description: "Playing custom audio effect",
        });
      } else {
        throw new Error('Sound effect generation failed');
      }
    } catch (error) {
      console.error('Sound effect generation error:', error);
      toast({
        title: "Sound Effect Failed",
        description: "Unable to generate sound effect",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generatePronunciationGuide = async (word: string, phonetic: string) => {
    if (!word.trim()) {
      toast({
        title: "Word Required",
        description: "Please enter a word for pronunciation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-pronunciation-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, phonetic, language: 'en' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        if (onAudioGenerated) {
          onAudioGenerated(audioUrl, 'pronunciation');
        }
        
        toast({
          title: "Pronunciation Guide",
          description: `Playing pronunciation for "${word}"`,
        });
      } else {
        throw new Error('Pronunciation generation failed');
      }
    } catch (error) {
      console.error('Pronunciation guide error:', error);
      toast({
        title: "Pronunciation Failed",
        description: "Unable to generate pronunciation guide",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const generateEmotionalStory = async (emotion: string, story: string) => {
    if (!story.trim()) {
      toast({
        title: "Story Required",
        description: "Please enter story text",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/voice/generate-emotional-storytelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: story, emotion, voiceType: 'storytelling' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        if (onAudioGenerated) {
          onAudioGenerated(audioUrl, 'story');
        }
        
        toast({
          title: "Emotional Story Generated",
          description: `Playing ${emotion} storytelling voice`,
        });
      } else {
        throw new Error('Emotional storytelling failed');
      }
    } catch (error) {
      console.error('Emotional storytelling error:', error);
      toast({
        title: "Storytelling Failed",
        description: "Unable to generate emotional story",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            Voice & Audio Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Voice Generation */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Quick Voice Generation
            </Label>
            <div className="space-y-2">
              <Textarea
                placeholder="Enter text to convert to speech..."
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => generateQuickVoice(voiceText, voiceLanguage)}
                  disabled={isGenerating || !voiceText.trim()}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Generate Voice'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Sound Effects
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe the sound effect (e.g., bell ringing, applause)"
                value={soundDescription}
                onChange={(e) => setSoundDescription(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => generateSoundEffect(soundDescription)}
                disabled={isGenerating || !soundDescription.trim()}
              >
                {isGenerating ? 'Creating...' : 'Create Sound'}
              </Button>
            </div>
          </div>

          {/* Pronunciation Guide */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Pronunciation Guide
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Word to pronounce"
                value={pronunciationWord}
                onChange={(e) => setPronunciationWord(e.target.value)}
              />
              <Input
                placeholder="Phonetic guide (optional)"
                value={phoneticGuide}
                onChange={(e) => setPhoneticGuide(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => generatePronunciationGuide(pronunciationWord, phoneticGuide)}
              disabled={isGenerating || !pronunciationWord.trim()}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Pronunciation'}
            </Button>
          </div>

          {/* Emotional Storytelling */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Emotional Storytelling
            </Label>
            <div className="space-y-2">
              <Textarea
                placeholder="Enter your story text..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Select value={storyEmotion} onValueChange={setStoryEmotion}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => generateEmotionalStory(storyEmotion, storyText)}
                  disabled={isGenerating || !storyText.trim()}
                  className="flex-1"
                >
                  {isGenerating ? 'Creating...' : 'Generate Emotional Story'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}