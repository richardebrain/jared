import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoiceInputTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
}

export default function VoiceInputTextarea({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  minHeight = "min-h-[120px]"
}: VoiceInputTextareaProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
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
          onChange(value + finalTranscript);
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
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, value, onChange]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !disabled) {
      setIsListening(true);
      recognitionRef.current.start();
      toast({
        title: "Voice input started",
        description: "Speak to add text to the field",
      });
    }
  }, [isListening, disabled, toast]);

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

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          placeholder={placeholder}
          className={`${minHeight} ${className} pr-12`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        
        {isRecognitionSupported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {transcript && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <span className="font-medium">Listening: </span>
          {transcript}
        </div>
      )}
      
      {isListening && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">
            Recording...
          </Badge>
          <span className="text-xs text-gray-500">
            Speak clearly and pause between sentences
          </span>
        </div>
      )}
      
      {!isRecognitionSupported && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Voice input not supported in this browser. Use Chrome or Safari for voice features.
        </div>
      )}
    </div>
  );
}