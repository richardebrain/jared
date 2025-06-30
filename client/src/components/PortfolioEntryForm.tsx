import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import VoiceInput from './VoiceInput';
import LearningStandardsDropdown from './LearningStandardsDropdown';

interface PortfolioForm {
  title: string;
  description: string;
  entryDate: string;
  teacherNotes: string;
  photos: string[];
}

interface PortfolioEntryFormProps {
  portfolioForm: PortfolioForm;
  setPortfolioForm: (form: PortfolioForm) => void;
  onSave: () => void;
  isSaving: boolean;
  selectedChild: number | null;
  isDisabled: boolean;
  isListening: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
  voiceText: string;
  showVoiceConfirmation: boolean;
  pendingVoiceNote: string;
  onConfirmVoice: () => void;
  onCancelVoice: () => void;
}

export default function PortfolioEntryForm({
  portfolioForm,
  setPortfolioForm,
  onSave,
  isSaving,
  selectedChild,
  isDisabled,
  isListening,
  onStartVoice,
  onStopVoice,
  voiceText,
  showVoiceConfirmation,
  pendingVoiceNote,
  onConfirmVoice,
  onCancelVoice
}: PortfolioEntryFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Entry Details</CardTitle>
        <CardDescription>Add details about the learning moment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Entry Title</Label>
            <Input
              id="title"
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              placeholder="e.g., Building Towers: Spatial Reasoning Development"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
              placeholder="Describe the learning activity and observations..."
              rows={4}
            />
            <VoiceInput
              isListening={isListening}
              onStart={onStartVoice}
              onStop={onStopVoice}
              disabled={!selectedChild}
              showVoiceConfirmation={showVoiceConfirmation}
              pendingVoiceNote={pendingVoiceNote}
              onConfirm={onConfirmVoice}
              onCancel={onCancelVoice}
              voiceText={voiceText}
            />
          </div>
          <div>
            <Label htmlFor="entryDate">Entry Date</Label>
            <Input
              id="entryDate"
              type="date"
              value={portfolioForm.entryDate}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, entryDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="teacherNotes">Teacher Notes</Label>
            <Textarea
              id="teacherNotes"
              value={portfolioForm.teacherNotes}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, teacherNotes: e.target.value })}
              placeholder="Additional observations, context, or next steps..."
              rows={3}
            />
          </div>
          <Button
            onClick={onSave}
            disabled={isDisabled || isSaving || !selectedChild || !portfolioForm.title}
            className="w-full"
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save Manual Entry'}
          </Button>
          {!selectedChild && (
            <p className="text-sm text-amber-600 text-center mt-2">
              Select a child above for manual entry, or use photo upload for automatic detection
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 