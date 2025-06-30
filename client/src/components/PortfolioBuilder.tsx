import { useState, useRef } from 'react';

// Add Speech Recognition API declarations
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast, useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Camera, Upload, Users, Brain, Star, Calendar, PlusCircle, ImageIcon, Mic, MicOff, Check, X, Share, Eye, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import ChildSelector from './ChildSelector';
import PortfolioEntryList from './PortfolioEntryList';
import PhotoUploader from './PhotoUploader';
import PortfolioEntryForm from './PortfolioEntryForm';
import AIAnalysisPanel from './AIAnalysisPanel';
import LearningStandardsDropdown from './LearningStandardsDropdown';
import VoicePortfolioRecorder from './VoicePortfolioRecorder';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  schoolId: number;
  sharedWithSchool: boolean;
  isActive: boolean;
  createdBy: number;
  referencePhotoUrl?: string;
}

interface PortfolioEntry {
  id: number;
  childId: number;
  teacherId: number;
  schoolId: number;
  title: string;
  description: string;
  entryDate: string;
  photos: string[];
  aiAnalysis: any;
  naeyc_standards: string[];
  teacherNotes: string;
  milestones: string[];
  skills: string[];
  createdAt: string;
}

interface AIAnalysis {
  children: {
    detectedChildren: string[];
    confidence: number;
  };
  activity: {
    activityType: string;
    recognizedObjects: string[];
    learningIndicators: string[];
    emotions: string[];
    confidence: number;
  };
  standards: {
    naeyc_standards: string[];
    custom_standards: string[];
    reasoning: string;
  };
  aiSummary: string;
  confidence: number;
  suggestedTitle: string;
  targetChild?: Child;
  // New properties for intelligent voice analysis
  intelligentAssignment?: boolean;
  childAssignment?: {
    assignedChildren: string[];
    reasoning: string;
    confidence: number;
  };
  assignedChildObjects?: Child[];
}

export default function PortfolioBuilder() {
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showNewChildDialog, setShowNewChildDialog] = useState(false);
  const [newChildData, setNewChildData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    referencePhotoUrl: '',
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    teacherNotes: '',
    photos: [] as string[],
    learningStandards: [] as string[],
  });
  const [photoAnalysis, setPhotoAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedPhotoData, setUploadedPhotoData] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [pendingVoiceNote, setPendingVoiceNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'create' | 'analyze' | 'voice'>('create');

  // Fetch children in the school
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['/api/children'],
    queryFn: () => apiRequest('/api/children'),
  });

  // Fetch portfolio entries for the selected child
  const { data: portfolioEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/children', selectedChild, 'portfolio'],
    queryFn: () => selectedChild ? apiRequest(`/api/children/${selectedChild}/portfolio`) : [],
    enabled: !!selectedChild,
  });

  // Create child mutation
  const createChildMutation = useMutation({
    mutationFn: (childData: typeof newChildData) => apiRequest('/api/children', {
      method: 'POST',
      data: childData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setShowNewChildDialog(false);
      setNewChildData({ firstName: '', lastName: '', birthDate: '', referencePhotoUrl: '' });
      toast({ title: 'Child Added', description: 'New child has been added to your class.' });
    },
  });

  // Mutation for updating child sharing settings
  const updateSharingMutation = useMutation({
    mutationFn: ({ childId, sharedWithSchool }: { childId: number, sharedWithSchool: boolean }) => 
      apiRequest(`/api/children/${childId}/sharing`, {
        method: 'PATCH',
        data: { sharedWithSchool }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({ title: 'Sharing Updated', description: 'Child sharing settings have been updated.' });
    }
  });

  // Create portfolio entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (entryData: any) => apiRequest('/api/portfolio/entries', {
      method: 'POST',
      data: entryData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', selectedChild, 'portfolio'] });
      setPortfolioForm({
        title: '',
        description: '',
        entryDate: new Date().toISOString().split('T')[0],
        teacherNotes: '',
        photos: [],
        learningStandards: [],
      });
      setPhotoAnalysis(null);
      toast({ title: 'Portfolio Entry Created', description: 'New portfolio entry has been saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save portfolio entry.', variant: 'destructive' });
    }
  });

  // Handler: Photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPortfolioForm((prev) => ({ ...prev, photos: [...prev.photos, base64] }));
      setUploadedPhotoData(base64.split(',')[1]);
      setIsAnalyzing(false);
      toast({ title: 'Photo Uploaded Successfully', description: 'Click "Analyze Photo" below to detect children and create portfolio entry.' });
    };
    reader.readAsDataURL(file);
  };

  // Handler: Analyze photo
  const handleAnalyzePhoto = async () => {
    if (!portfolioForm.photos.length) return;
    setIsAnalyzing(true);
    try {
      const base64Data = portfolioForm.photos[0].split(',')[1];
      const analysis: AIAnalysis = await apiRequest('/api/portfolio/analyze', {
        method: 'POST',
        data: {
          base64Image: base64Data,
          childId: selectedChild,
        },
      });
      setPhotoAnalysis(analysis);
      setPortfolioForm((prev) => ({
        ...prev,
        title: analysis.suggestedTitle,
        description: analysis.aiSummary,
      }));
      setTab('analyze');
      toast({ title: 'Photo Analyzed', description: 'AI has analyzed the photo and detected learning activities.' });
    } catch (error) {
      toast({ title: 'Analysis Failed', description: 'Could not analyze the photo. Please try again.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Save entry
  const handleSaveEntry = () => {
    if (!selectedChild || !portfolioForm.title) {
      toast({ title: 'Missing Information', description: 'Please select a child and enter a title.', variant: 'destructive' });
      return;
    }
    const entryData = {
      childId: selectedChild,
      title: portfolioForm.title,
      description: portfolioForm.description,
      entryDate: portfolioForm.entryDate,
      photos: portfolioForm.photos,
      teacherNotes: portfolioForm.teacherNotes,
      aiAnalysis: photoAnalysis,
      naeyc_standards: photoAnalysis?.standards.naeyc_standards || [],
      milestones: photoAnalysis?.activity.learningIndicators || [],
      skills: photoAnalysis?.activity.recognizedObjects || [],
    };
    createEntryMutation.mutate(entryData);
  };

  // Voice input handlers
  const onStartVoice = () => {
    if (!selectedChild) {
      toast({ title: 'Select a Child First', description: 'Please select a child before recording voice notes.', variant: 'destructive' });
      return;
    }
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceText('');
      };
      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          setVoiceText(transcript);
          setPendingVoiceNote(transcript);
          setShowVoiceConfirmation(true);
          recognition.stop();
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      toast({ title: 'Voice Recognition Not Supported', description: 'Your browser does not support voice recognition.', variant: 'destructive' });
    }
  };
  const onStopVoice = () => setIsListening(false);
  const onConfirmVoice = async () => {
    if (!pendingVoiceNote) return;
    setPortfolioForm((prev) => ({
      ...prev,
      description: prev.description ? `${prev.description}\n\nVoice Note: ${pendingVoiceNote}` : `Voice Note: ${pendingVoiceNote}`
    }));
    setShowVoiceConfirmation(false);
    setPendingVoiceNote('');
    setVoiceText('');
    // Optionally, trigger AI analysis with voice context here
  };
  const onCancelVoice = () => {
    setShowVoiceConfirmation(false);
    setPendingVoiceNote('');
    setVoiceText('');
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Selection Panel */}
        <div className="lg:col-span-1">
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onSelect={setSelectedChild}
            showNewChildDialog={showNewChildDialog}
            setShowNewChildDialog={setShowNewChildDialog}
            newChildData={newChildData}
            setNewChildData={setNewChildData}
            createChildMutation={createChildMutation}
            updateSharingMutation={updateSharingMutation}
          />
          {selectedChild && (
            <PortfolioEntryList entries={portfolioEntries} isLoading={entriesLoading} />
          )}
        </div>
        {/* Main Portfolio Creation Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v as 'create' | 'analyze' | 'voice')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Entry</TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Voice Creator
              </TabsTrigger>
              <TabsTrigger value="analyze">AI Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-6">
              <PhotoUploader
                onPhotoUpload={handlePhotoUpload}
                isAnalyzing={isAnalyzing}
                uploadedPhotoData={uploadedPhotoData}
                photos={portfolioForm.photos}
                onAnalyze={handleAnalyzePhoto}
                pendingVoiceNote={pendingVoiceNote}
                fileInputRef={fileInputRef}
              />
              <PortfolioEntryForm
                portfolioForm={portfolioForm}
                setPortfolioForm={setPortfolioForm}
                onSave={handleSaveEntry}
                isSaving={createEntryMutation.isPending}
                selectedChild={selectedChild}
                isDisabled={isAnalyzing}
                isListening={isListening}
                onStartVoice={onStartVoice}
                onStopVoice={onStopVoice}
                voiceText={voiceText}
                showVoiceConfirmation={showVoiceConfirmation}
                pendingVoiceNote={pendingVoiceNote}
                onConfirmVoice={onConfirmVoice}
                onCancelVoice={onCancelVoice}
              />
            </TabsContent>
            <TabsContent value="voice" className="space-y-6">
              <VoicePortfolioRecorder
                uploadedPhoto={uploadedPhotoData}
                onSuccess={(result) => {
                  // Refresh the entries list to show the new entry
                  queryClient.invalidateQueries({ queryKey: ['/api/portfolio/entries', selectedChild] });
                  toast({
                    title: "Portfolio Entry Created!",
                    description: `Successfully created entry for ${result.detectedChild?.firstName} ${result.detectedChild?.lastName}`,
                  });
                }}
              />
            </TabsContent>
            <TabsContent value="analyze" className="space-y-6">
              <AIAnalysisPanel photoAnalysis={photoAnalysis} isLoading={isAnalyzing} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}