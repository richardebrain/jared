import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Play, Download, Loader2, FileAudio, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PodcastGenerator() {
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { toast } = useToast();

  const generateScript = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a podcast topic to generate a script.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingScript(true);
    setScript('');
    setAudioUrl('');

    try {
      const response = await apiRequest('/api/podcast/generate-script', {
        method: 'POST',
        data: { prompt: prompt.trim() }
      });

      if (response.script) {
        setScript(response.script);
        toast({
          title: "Script Generated",
          description: "Your podcast script has been created successfully!"
        });
      } else {
        throw new Error('No script returned from API');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate podcast script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAudio = async () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please generate a script first before creating audio.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    setAudioUrl('');

    try {
      const response = await apiRequest('/api/podcast/generate-audio', {
        method: 'POST',
        data: { script: script.trim() }
      });

      if (response.audioUrl) {
        setAudioUrl(response.audioUrl);
        toast({
          title: "Audio Generated",
          description: "Your podcast audio is ready to play!"
        });
      } else {
        throw new Error('No audio URL returned from API');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Audio Generation Failed",
        description: "Unable to generate podcast audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `podcast-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Mic className="h-10 w-10 text-purple-600" />
            AI Podcast Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Create engaging educational podcasts with AI-powered script generation and narration
          </p>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Director Toolkit
          </Badge>
        </div>

        {/* Topic Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5 text-purple-600" />
              Podcast Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your podcast topic (e.g., 'The importance of play in early childhood development', 'Building positive classroom environments', 'Supporting children with special needs')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full"
            />
            <Button 
              onClick={generateScript}
              disabled={isGeneratingScript || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Podcast Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Script */}
        {script && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-green-600" />
                  Generated Script
                </span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ready for Audio
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {script}
                </pre>
              </div>
              <Button 
                onClick={generateAudio}
                disabled={isGeneratingAudio}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Podcast Audio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  Your Podcast
                </span>
                <Button
                  onClick={downloadAudio}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <audio 
                  controls 
                  className="w-full"
                  src={audioUrl}
                  onLoadedData={() => {
                    // Auto-play when loaded
                    const audio = document.querySelector('audio');
                    if (audio) audio.play().catch(() => {
                      // Handle autoplay restrictions
                      console.log('Autoplay prevented - user interaction required');
                    });
                  }}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
              <Alert className="mt-4">
                <FileAudio className="h-4 w-4" />
                <AlertDescription>
                  Your podcast has been generated successfully! You can play it above or download it for future use.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Better Podcasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Topic Ideas:</h4>
                <ul className="space-y-1">
                  <li>• Classroom management strategies</li>
                  <li>• Child development milestones</li>
                  <li>• Parent communication tips</li>
                  <li>• Learning through play</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Best Practices:</h4>
                <ul className="space-y-1">
                  <li>• Be specific with your topics</li>
                  <li>• Include target age groups</li>
                  <li>• Mention practical applications</li>
                  <li>• Consider your audience level</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}