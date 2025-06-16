import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function VoiceInputButton({ 
  onResult, 
  disabled = false, 
  size = 'sm',
  variant = 'outline',
  className = '' 
}: VoiceInputButtonProps) {
  const { toast } = useToast();

  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onResult: (text) => {
      onResult(text);
      toast({
        title: "Voice Input Complete",
        description: "Text has been added to the field.",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: `Unable to process voice input: ${error}`,
        variant: "destructive"
      });
    },
    continuous: false
  });

  if (!isSupported) {
    return null; // Hide button if browser doesn't support speech recognition
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleListening}
      disabled={disabled}
      className={`flex items-center gap-1 ${className}`}
      title={isListening ? "Stop voice input" : "Start voice input"}
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
  );
}

// Enhanced Input component with voice support
interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableVoice?: boolean;
  onVoiceResult?: (text: string) => void;
}

export function InputWithVoice({ 
  enableVoice = true, 
  onVoiceResult,
  className = '',
  ...props 
}: VoiceInputProps) {
  const handleVoiceResult = (text: string) => {
    if (onVoiceResult) {
      onVoiceResult(text);
    } else if (props.onChange) {
      // Create synthetic event
      const syntheticEvent = {
        target: { value: text }
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
}

export function TextareaWithVoice({ 
  enableVoice = true, 
  onVoiceResult,
  className = '',
  ...props 
}: VoiceTextareaProps) {
  const handleVoiceResult = (text: string) => {
    if (onVoiceResult) {
      onVoiceResult(text);
    } else if (props.onChange) {
      // Create synthetic event
      const syntheticEvent = {
        target: { value: text }
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
          />
        </div>
      )}
    </div>
  );
}