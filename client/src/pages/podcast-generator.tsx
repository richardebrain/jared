import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Play, Download, Loader2, FileAudio, Sparkles, Clock, Volume2, FileText, MessageSquare, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Voice {
  name: string;
  label: string;
  language: string;
}

export default function PodcastGenerator() {
  // Step 1: Source Content Generation
  const [contentRequest, setContentRequest] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  
  // Step 2: Podcast Generation
  const [podcastTopic, setPodcastTopic] = useState('');
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [length, setLength] = useState('5');
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPodcastSectionEnabled, setIsPodcastSectionEnabled] = useState(false);
  const { toast } = useToast();

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await apiRequest('/api/podcast/voices');
        if (response.voices) {
          setVoices(response.voices);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        // Set default voices if API fails
        setVoices([
          { name: 'nova', label: 'Nova (Warm & Professional)', language: 'en-US' },
          { name: 'alloy', label: 'Alloy (Neutral & Clear)', language: 'en-US' },
          { name: 'echo', label: 'Echo (Confident & Dynamic)', language: 'en-US' },
          { name: 'fable', label: 'Fable (Engaging & Storytelling)', language: 'en-US' },
          { name: 'onyx', label: 'Onyx (Deep & Authoritative)', language: 'en-US' },
          { name: 'shimmer', label: 'Shimmer (Friendly & Upbeat)', language: 'en-US' }
        ]);
      }
    };

    fetchVoices();
  }, []);

  const generateSourceContent = async () => {
    if (!contentRequest.trim()) {
      toast({
        title: "Content Request Required",
        description: "Please describe the content you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingContent(true);
    setSourceContent('');
    setIsPodcastSectionEnabled(false);
    setScript('');
    setAudioUrl('');

    try {
      const response = await apiRequest('/api/podcast/generate-source-content', {
        method: 'POST',
        body: JSON.stringify({ request: contentRequest.trim() })
      });

      setSourceContent(response.content);
      setIsPodcastSectionEnabled(true);
      
      toast({
        title: "Source Document Generated",
        description: "Ready to create your analytical podcast!",
      });

    } catch (error: any) {
      console.error('Error generating source content:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate source content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateScript = async () => {
    if (!sourceContent.trim()) {
      toast({
        title: "Source Content Required",
        description: "Please generate source content first.",
        variant: "destructive"
      });
      return;
    }

    const scriptLength = parseInt(length);
    if (scriptLength < 3 || scriptLength > 15) {
      toast({
        title: "Invalid Length",
        description: "Podcast length must be between 3 and 15 minutes.",
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
        body: JSON.stringify({ 
          sourceContent: sourceContent.trim(),
          podcastTopic: podcastTopic.trim(),
          length: scriptLength
        })
      });

      setScript(response.script);
      
      toast({
        title: "Script Generated",
        description: "Your analytical podcast script is ready!",
      });

    } catch (error: any) {
      console.error('Error generating script:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate podcast script. Please try again.",
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
        description: "Please generate a podcast script first.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "Voice Required",
        description: "Please select a voice for the podcast.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    setAudioUrl('');

    try {
      const response = await apiRequest('/api/podcast/generate-audio', {
        method: 'POST',
        body: JSON.stringify({ 
          script: script.trim(),
          voice: selectedVoice
        })
      });

      setAudioUrl(response.audioUrl);
      
      toast({
        title: "Audio Generated",
        description: "Your podcast is ready to listen!",
      });

    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast({
        title: "Audio Generation Failed",
        description: error?.message || "Failed to generate audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Mic className="h-10 w-10 text-blue-600" />
          AI Podcast Studio
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Generate educational content, then create analytical podcasts with professional AI voices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Generate Source Content */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Step 1: Generate Source Document
            </CardTitle>
            <p className="text-gray-600">Create educational content for analysis</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contentRequest" className="text-base font-medium">
                What kind of document do you need?
              </Label>
              <Textarea
                id="contentRequest"
                value={contentRequest}
                onChange={(e) => setContentRequest(e.target.value)}
                placeholder="e.g., 'A 5-point list of classroom management techniques', 'A dialogue between teachers discussing behavior strategies', 'Guidelines for parent-teacher conferences'"
                className="mt-2 min-h-[120px]"
                disabled={isGeneratingContent}
              />
            </div>

            <Button 
              onClick={generateSourceContent}
              disabled={isGeneratingContent || !contentRequest.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              size="lg"
            >
              {isGeneratingContent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>

            {sourceContent && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Generated Source Document:</h3>
                <div className="max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {sourceContent}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Generate Analytical Podcast */}
        <Card className={`border-2 ${isPodcastSectionEnabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
          <CardHeader>
            <CardTitle className={`text-2xl flex items-center gap-2 ${isPodcastSectionEnabled ? 'text-green-800' : 'text-gray-500'}`}>
              <MessageSquare className="h-6 w-6" />
              Step 2: Create Analytical Podcast
              {!isPodcastSectionEnabled && <Badge variant="secondary">Disabled</Badge>}
            </CardTitle>
            <p className="text-gray-600">Generate a podcast analyzing your source document</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="podcastTopic" className="text-base font-medium">
                Podcast Topic (Optional)
              </Label>
              <Input
                id="podcastTopic"
                value={podcastTopic}
                onChange={(e) => setPodcastTopic(e.target.value)}
                placeholder="e.g., 'Analyzing effective classroom strategies'"
                disabled={!isPodcastSectionEnabled}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="length" className="text-base font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Length (minutes)
                </Label>
                <Select value={length} onValueChange={setLength} disabled={!isPodcastSectionEnabled}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="7">7 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voice" className="text-base font-medium flex items-center gap-1">
                  <Volume2 className="h-4 w-4" />
                  Voice
                </Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={!isPodcastSectionEnabled}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={generateScript}
                disabled={!isPodcastSectionEnabled || isGeneratingScript || !sourceContent.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                size="lg"
              >
                {isGeneratingScript ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>

              <Button 
                onClick={generateAudio}
                disabled={!isPodcastSectionEnabled || isGeneratingAudio || !script.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                size="lg"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <FileAudio className="w-4 h-4 mr-2" />
                    Generate Audio
                  </>
                )}
              </Button>
            </div>

            {script && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Generated Podcast Script:</h3>
                <div className="max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {script}
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Your Podcast is Ready!
                </h3>
                <audio controls className="w-full mb-3">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Button asChild className="w-full" variant="outline">
                  <a href={audioUrl} download="podcast.mp3" className="flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Podcast
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Instructions */}
      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            How It Works
          </h3>
          <div className="flex items-center gap-4 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">1</Badge>
              <span>Generate educational content</span>
            </div>
            <ChevronRight className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800">2</Badge>
              <span>Create analytical podcast</span>
            </div>
            <ChevronRight className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800">3</Badge>
              <span>Listen & download</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}