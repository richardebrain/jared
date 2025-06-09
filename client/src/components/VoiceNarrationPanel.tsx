import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Download, Volume2, Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceNarrationPanelProps {
  onNarrationGenerated?: (audioUrl: string, voiceType: string) => void;
  defaultText?: string;
  className?: string;
}

const NARRATOR_VOICES = {
  'professional-female': {
    name: 'Bella',
    description: 'Professional, clear, and authoritative female voice',
    color: 'bg-blue-100 text-blue-800'
  },
  'professional-male': {
    name: 'Adam',
    description: 'Professional, clear, and authoritative male voice',
    color: 'bg-green-100 text-green-800'
  },
  'friendly-female': {
    name: 'Dorothy',
    description: 'Warm, friendly, and approachable female voice',
    color: 'bg-purple-100 text-purple-800'
  },
  'storyteller': {
    name: 'Callum',
    description: 'Engaging storyteller perfect for educational content',
    color: 'bg-orange-100 text-orange-800'
  },
  'child-friendly': {
    name: 'Charlotte',
    description: 'Gentle, child-friendly voice for young learners',
    color: 'bg-pink-100 text-pink-800'
  }
};

export function VoiceNarrationPanel({ 
  onNarrationGenerated, 
  defaultText = "",
  className = "" 
}: VoiceNarrationPanelProps) {
  const [text, setText] = useState(defaultText);
  const [selectedVoice, setSelectedVoice] = useState<string>('professional-female');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleGenerateNarration = async () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter text to generate narration.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/voice/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceType: selectedVoice,
          optimize: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate narration');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setAudioUrl(url);
      setGenerationTime(Date.now() - startTime);
      
      // Notify parent component
      if (onNarrationGenerated) {
        onNarrationGenerated(url, selectedVoice);
      }

      toast({
        title: "Narration Generated",
        description: `Successfully created narration with ${NARRATOR_VOICES[selectedVoice as keyof typeof NARRATOR_VOICES].name}`,
      });

    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate narration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `narration-${selectedVoice}-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Your narration file is being downloaded.",
    });
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const optimizeTextForSpeech = () => {
    // Apply basic text optimizations for speech
    const optimized = text
      .replace(/\b(e\.g\.)\b/g, 'for example')
      .replace(/\b(i\.e\.)\b/g, 'that is')
      .replace(/\b(etc\.)\b/g, 'and so on')
      .replace(/([A-Z]{2,})/g, (match) => match.split('').join(' '))
      .replace(/([0-9]+)%/g, '$1 percent')
      .replace(/([0-9]+)°/g, '$1 degrees');
    
    setText(optimized);
    
    toast({
      title: "Text Optimized",
      description: "Text has been optimized for speech synthesis.",
    });
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          AI Voice Narration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate professional voice narration for your educational content using AI
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Narrator Voice</label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a voice" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NARRATOR_VOICES).map(([key, voice]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Badge className={voice.color}>
                      {voice.name}
                    </Badge>
                    <span className="text-sm">{voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Text Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Narration Text</label>
            <Button
              variant="outline"
              size="sm"
              onClick={optimizeTextForSpeech}
              disabled={!text.trim()}
            >
              <Mic className="h-4 w-4 mr-2" />
              Optimize for Speech
            </Button>
          </div>
          
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            className="min-h-[120px] resize-y"
            maxLength={2000}
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.length}/2000 characters</span>
            <span>Estimated duration: ~{Math.ceil(text.length / 12)} seconds</span>
          </div>
        </div>

        <Separator />

        {/* Generation Controls */}
        <div className="space-y-4">
          <Button
            onClick={handleGenerateNarration}
            disabled={isGenerating || !text.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Narration...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Generate Voice Narration
              </>
            )}
          </Button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {NARRATOR_VOICES[selectedVoice as keyof typeof NARRATOR_VOICES].name} - Narration Ready
                  </div>
                  {generationTime && (
                    <div className="text-xs text-muted-foreground">
                      Generated in {(generationTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                className="w-full"
                controls
              />
            </div>
          )}
        </div>

        {/* Voice Profiles Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Voice Profiles</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {Object.entries(NARRATOR_VOICES).map(([key, voice]) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded border">
                <Badge className={voice.color} variant="secondary">
                  {voice.name}
                </Badge>
                <span className="text-muted-foreground">{voice.description}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}