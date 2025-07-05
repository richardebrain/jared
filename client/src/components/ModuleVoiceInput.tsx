import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Pause, Volume2, CheckCircle } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';

interface ModuleVoiceInputProps {
  onResult: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  continuous?: boolean;
  autoFormat?: boolean;
  pauseThreshold?: number;
}

export default function ModuleVoiceInput({
  onResult,
  placeholder = "Click to start voice input",
  disabled = false,
  className = '',
  size = 'default',
  variant = 'outline',
  continuous = true,
  autoFormat = true,
  pauseThreshold = 2500 // Slightly longer for module content
}: ModuleVoiceInputProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const { isListening, isSupported, transcript, toggleListening } = useVoiceInput({
    onResult: (text) => {
      onResult(text);
      setShowPreview(false);
      toast({
        title: "Voice Input Complete",
        description: "Your text has been formatted and added to the field.",
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: error,
        variant: "destructive",
        duration: 3000,
      });
    },
    continuous,
    autoFormat,
    pauseThreshold
  });

  if (!isSupported) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Voice input is not supported in your browser. Please use Chrome or Safari for voice features.
        </p>
      </div>
    );
  }

  const handleToggle = () => {
    if (isListening) {
      toggleListening();
      setShowPreview(false);
    } else {
      toggleListening();
      setShowPreview(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Voice Input Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isListening ? "destructive" : variant}
          size={size}
          onClick={handleToggle}
          disabled={disabled}
          className={`flex items-center gap-2 ${className}`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Voice Input
            </>
          )}
          {isListening && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </Button>

        {isListening && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="animate-pulse">
              <Volume2 className="h-3 w-3 mr-1" />
              Recording
            </Badge>
            {continuous && (
              <Badge variant="outline" className="text-xs">
                Auto-stop in {Math.ceil(pauseThreshold / 1000)}s
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Live Preview */}
      {showPreview && (isListening || transcript) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Pause className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Live Preview</span>
            {isListening && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-xs text-blue-600">Listening...</span>
              </div>
            )}
          </div>
          
          <div className="bg-white p-3 rounded border min-h-[60px]">
            {transcript ? (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Start speaking to see your text here...</p>
            )}
          </div>

          {transcript && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">
                {autoFormat ? "Text will be automatically formatted" : "Raw transcript"}
              </span>
            </div>
          )}

          {continuous && isListening && (
            <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
              💡 <strong>Tip:</strong> Pause for {pauseThreshold/1000} seconds to automatically stop recording
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!isListening && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Volume2 className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Voice Input Tips:</p>
              <ul className="text-xs space-y-1">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Use natural pauses between sentences</li>
                <li>• Text will be automatically formatted with proper punctuation</li>
                {continuous && (
                  <li>• Recording will auto-stop after {pauseThreshold/1000} seconds of silence</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 