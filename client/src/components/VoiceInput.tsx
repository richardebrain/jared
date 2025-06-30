import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mic, MicOff, Check, X } from 'lucide-react';

interface VoiceInputProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
  showVoiceConfirmation: boolean;
  pendingVoiceNote: string;
  onConfirm: () => void;
  onCancel: () => void;
  voiceText: string;
  childName?: string;
}

export default function VoiceInput({
  isListening,
  onStart,
  onStop,
  disabled,
  showVoiceConfirmation,
  pendingVoiceNote,
  onConfirm,
  onCancel,
  voiceText,
  childName
}: VoiceInputProps) {
  return (
    <div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? onStop : onStart}
          disabled={disabled}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Add Voice Note
            </>
          )}
        </Button>
        {isListening && (
          <span className="text-sm text-blue-600 animate-pulse">
            🎤 Listening... Speak about what's happening in the photo
          </span>
        )}
      </div>
      <Dialog open={showVoiceConfirmation} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Voice Note</DialogTitle>
            <DialogDescription>
              Would you like to add this voice note{childName ? ` to ${childName}'s portfolio description?` : '?' }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Recorded Voice Note:</p>
              <p className="text-sm text-gray-700">"{pendingVoiceNote}"</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={onConfirm}>
                <Check className="h-4 w-4 mr-2" />
                Add to Description
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 