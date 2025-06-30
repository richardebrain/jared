import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Volume2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface VoiceAnalysisResult {
  success: boolean;
  transcription: string;
  analysis: {
    childName: string;
    activity: string;
    description: string;
    learningDomain: string;
    portfolioSection: string;
    suggestedStandards: string[];
    confidence: number;
  };
  detectedChild?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  portfolioEntry?: any;
  error?: string;
}

interface VoicePortfolioRecorderProps {
  uploadedPhoto?: string | null;
  onSuccess?: (result: VoiceAnalysisResult) => void;
}

export default function VoicePortfolioRecorder({ 
  uploadedPhoto, 
  onSuccess 
}: VoicePortfolioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [lastResult, setLastResult] = useState<VoiceAnalysisResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Process the audio
        await processAudio(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly about the child's activity...",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      toast({
        title: "Processing Voice Note",
        description: "Analyzing speech and creating portfolio entry...",
      });
    }
  }, [isRecording, toast]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Prepare photo data if available
        let photoBase64 = null;
        if (uploadedPhoto) {
          // Extract base64 from data URL if it's a data URL
          if (uploadedPhoto.startsWith('data:')) {
            photoBase64 = uploadedPhoto.split(',')[1];
          } else {
            photoBase64 = uploadedPhoto;
          }
        }

        try {
          const result = await apiRequest('/api/portfolio/voice-analyze', {
            method: 'POST',
            data: {
              audioBase64: base64Audio,
              photoBase64: photoBase64,
            },
          }) as VoiceAnalysisResult;

          setTranscription(result.transcription);
          setLastResult(result);
          setIsProcessing(false);

          if (result.success && result.detectedChild) {
            toast({
              title: "Portfolio Entry Created!",
              description: `Successfully created entry for ${result.detectedChild.firstName} ${result.detectedChild.lastName}`,
            });

            // Refresh children data
            queryClient.invalidateQueries({ queryKey: ['/api/children'] });
            
            // Call success callback
            if (onSuccess) {
              onSuccess(result);
            }
          } else {
            toast({
              title: "Manual Selection Needed",
              description: result.error || "Could not automatically identify the child. Please check the name mentioned.",
              variant: "default",
            });
          }
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          setIsProcessing(false);
          toast({
            title: "Processing Error",
            description: apiError.message || "Failed to process voice note. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to process audio recording.",
        variant: "destructive",
      });
    }
  };

  const playAudio = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play().catch(console.error);
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setTranscription('');
    setLastResult(null);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Voice Portfolio Creator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Record yourself describing a child's activity. AI will automatically transcribe, 
              identify the child, and create a portfolio entry with matched learning standards.
            </p>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center space-x-4">
            {!isRecording && !audioURL && (
              <Button 
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
                disabled={isProcessing}
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button 
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="animate-pulse"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioURL && !isProcessing && (
              <div className="flex space-x-2">
                <Button onClick={playAudio} variant="outline">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Play
                </Button>
                <Button onClick={resetRecording} variant="outline">
                  Record Again
                </Button>
              </div>
            )}
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing voice note...</span>
            </div>
          )}

          {/* Transcription Display */}
          {transcription && (
            <div className="space-y-2">
              <h4 className="font-medium">Transcription:</h4>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                "{transcription}"
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {lastResult && (
            <div className="space-y-3">
              {lastResult.success ? (
                <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">Portfolio Entry Created</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Created entry for <strong>{lastResult.detectedChild?.firstName} {lastResult.detectedChild?.lastName}</strong>
                    </p>
                    <div className="mt-2 text-xs text-green-600">
                      <div><strong>Activity:</strong> {lastResult.analysis.activity}</div>
                      <div><strong>Domain:</strong> {lastResult.analysis.learningDomain}</div>
                      <div><strong>Section:</strong> {lastResult.analysis.portfolioSection}</div>
                      {lastResult.analysis.suggestedStandards.length > 0 && (
                        <div><strong>Standards:</strong> {lastResult.analysis.suggestedStandards.join(', ')}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">Manual Entry Needed</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {lastResult.error}
                    </p>
                    {lastResult.analysis && (
                      <div className="mt-2 text-xs text-yellow-600">
                        <div><strong>Detected Name:</strong> {lastResult.analysis.childName}</div>
                        <div><strong>Activity:</strong> {lastResult.analysis.activity}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>Tips for best results:</strong></div>
            <div>• Speak clearly and mention the child's first name</div>
            <div>• Describe the specific activity or behavior observed</div>
            <div>• Include developmental details (e.g., "counting blocks", "sharing toys")</div>
            <div>• Keep recordings under 60 seconds for faster processing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}