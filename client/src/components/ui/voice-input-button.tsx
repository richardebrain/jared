import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Pause } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  continuous?: boolean;
  autoFormat?: boolean;
  pauseThreshold?: number;
  placeholder?: string;
}

export function VoiceInputButton({ 
  onResult, 
  disabled = false, 
  size = 'sm',
  variant = 'outline',
  className = '',
  continuous = false,
  autoFormat = true,
  pauseThreshold = 2000,
  placeholder = "Click to start voice input"
}: VoiceInputButtonProps) {
  const { toast } = useToast();

  const { isListening, isSupported, transcript, toggleListening } = useVoiceInput({
    onResult: (text) => {
      onResult(text);
      toast({
        title: "Voice Input Complete",
        description: continuous ? "Text has been added." : "Text has been added to the field.",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: error,
        variant: "destructive"
      });
    },
    continuous,
    autoFormat,
    pauseThreshold
  });

  if (!isSupported) {
    return null; // Hide button if browser doesn't support speech recognition
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={toggleListening}
        disabled={disabled}
        className={`flex items-center gap-1 ${className}`}
        title={isListening ? "Stop voice input" : placeholder}
      >
        {isListening ? (
          <>
            <MicOff className="h-3 w-3" />
            <span className="sr-only">Stop</span>
          </>
        ) : (
          <>
            <Mic className="h-3 w-3" />
            <span className="sr-only">Voice</span>
          </>
        )}
        {isListening && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1" />
        )}
      </Button>

      {/* Live transcript display */}
      {isListening && transcript && (
        <div className="max-w-xs p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="flex items-center gap-1 mb-1">
            <Pause className="h-3 w-3" />
            <span className="font-medium">Listening...</span>
          </div>
          <p className="text-xs">{transcript}</p>
          {continuous && (
            <p className="text-xs text-blue-600 mt-1">
              Pause for {pauseThreshold/1000}s to auto-stop
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced Input component with voice support
interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableVoice?: boolean;
  onVoiceResult?: (text: string) => void;
  continuous?: boolean;
  autoFormat?: boolean;
  pauseThreshold?: number;
}

export function InputWithVoice({ 
  enableVoice = true, 
  onVoiceResult,
  className = '',
  continuous = false,
  autoFormat = true,
  pauseThreshold = 2000,
  ...props 
}: VoiceInputProps) {
  const handleVoiceResult = (text: string) => {
    if (onVoiceResult) {
      onVoiceResult(text);
    } else if (props.onChange) {
      // Create synthetic event with appended text
      const currentValue = (props.value as string) || '';
      const syntheticEvent = {
        target: { value: currentValue + text }
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(syntheticEvent);
    }
  };

  return (
    <div className="relative">
      <input
        {...props}
        className={`pr-12 ${className}`}
      />
      {enableVoice && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <VoiceInputButton
            onResult={handleVoiceResult}
            disabled={props.disabled}
            size="sm"
            variant="ghost"
            continuous={continuous}
            autoFormat={autoFormat}
            pauseThreshold={pauseThreshold}
          />
        </div>
      )}
    </div>
  );
}

// Enhanced Textarea component with voice support
interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableVoice?: boolean;
  onVoiceResult?: (text: string) => void;
  continuous?: boolean;
  autoFormat?: boolean;
  pauseThreshold?: number;
}

export function TextareaWithVoice({ 
  enableVoice = true, 
  onVoiceResult,
  className = '',
  continuous = true, // Default to continuous for textareas
  autoFormat = true,
  pauseThreshold = 2000,
  ...props 
}: VoiceTextareaProps) {
  const handleVoiceResult = (text: string) => {
    if (onVoiceResult) {
      onVoiceResult(text);
    } else if (props.onChange) {
      // Create synthetic event with appended text
      const currentValue = (props.value as string) || '';
      const syntheticEvent = {
        target: { value: currentValue + text }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      props.onChange(syntheticEvent);
    }
  };

  return (
    <div className="relative">
      <textarea
        {...props}
        className={`pr-12 ${className}`}
      />
      {enableVoice && (
        <div className="absolute right-2 top-2">
          <VoiceInputButton
            onResult={handleVoiceResult}
            disabled={props.disabled}
            size="sm"
            variant="ghost"
            continuous={continuous}
            autoFormat={autoFormat}
            pauseThreshold={pauseThreshold}
          />
        </div>
      )}
    </div>
  );
}