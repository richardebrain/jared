import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoiceEnabledBearyAIProps {
  onResponse?: (response: string) => void;
}

export default function VoiceEnabledBearyAI({ onResponse }: VoiceEnabledBearyAIProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  // Voice output states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Listen for prompt events from quick action buttons
    const handlePromptEvent = (event: CustomEvent) => {
      setPrompt(event.detail);
    };

    window.addEventListener('beary-ai-prompt', handlePromptEvent as EventListener);

    // Check if Speech Recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsRecognitionSupported(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setPrompt(prev => prev + finalTranscript);
          setTranscript('');
        } else {
          setTranscript(interimTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "There was an issue with voice recognition. Please try again.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      window.removeEventListener('beary-ai-prompt', handlePromptEvent as EventListener);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [toast]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      toast({
        title: "Voice input started",
        description: "I'm listening... Speak your question to BearyAI!",
      });
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast({
        title: "Voice input stopped",
        description: "Voice recording has been stopped.",
      });
    }
  }, [isListening, toast]);

  const speakText = useCallback((text: string) => {
    if (synthRef.current && speechEnabled && text.trim()) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      utterance.volume = 0.8;
      
      // Try to use a pleasant female voice if available
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') ||
        voice.name.includes('Moira')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Speech error",
          description: "There was an issue with text-to-speech.",
          variant: "destructive",
        });
      };
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  }, [speechEnabled, voiceRate, voicePitch, toast]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/bear-assistant/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: prompt })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.message || data.content || `I received your question about "${prompt}" but I'm currently having trouble generating a specific answer. Please try a different question about early childhood education topics like classroom management or child development.`;
      
      setResponse(aiResponse);
      onResponse?.(aiResponse);
      
      // Automatically speak the response if speech is enabled
      if (speechEnabled) {
        speakText(aiResponse);
      }
      
      toast({
        title: "BearyAI responded",
        description: speechEnabled ? "Response generated and spoken!" : "Response generated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setPrompt("");
    setResponse("");
    setTranscript("");
    stopSpeaking();
    stopListening();
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-blue-800">
            🐻 BearyAI Voice Assistant
          </CardTitle>
          <CardDescription className="text-blue-600">
            Ask me anything about early childhood education! Use voice input or type your questions.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Voice Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isListening ? "destructive" : "default"}
                size="sm"
                onClick={isListening ? stopListening : startListening}
                disabled={!isRecognitionSupported || isLoading}
                className="flex items-center gap-2"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Voice Input
                  </>
                )}
              </Button>
              
              {isListening && (
                <Badge variant="destructive" className="animate-pulse">
                  Listening...
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={speechEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="flex items-center gap-2"
              >
                {speechEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Voice On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Voice Off
                  </>
                )}
              </Button>
              
              {isSpeaking && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopSpeaking}
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Stop Speaking
                </Button>
              )}
              
              {isSpeaking && (
                <Badge variant="default" className="animate-pulse">
                  Speaking...
                </Badge>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearConversation}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {!isRecognitionSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Voice input is not supported in your browser. Please use a modern browser like Chrome or Safari for voice features.
              </p>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
                Your Question for BearyAI:
              </label>
              <Textarea
                id="prompt"
                placeholder="Type your question here or use voice input above..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
              
              {transcript && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <span className="font-medium">Listening: </span>
                  {transcript}
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "BearyAI is thinking..." : "Ask BearyAI"}
            </Button>
          </form>

          {/* Response Display */}
          {response && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800">
                  🐻 BearyAI's Response:
                </h3>
                {speechEnabled && !isSpeaking && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => speakText(response)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Speak Again
                  </Button>
                )}
              </div>
              
              <div className="p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-sm">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {response}
                </p>
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {speechEnabled && (
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-3">
                Voice Settings
              </summary>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 min-w-[80px]">Speed:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">{voiceRate}x</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 min-w-[80px]">Pitch:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">{voicePitch}x</span>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}