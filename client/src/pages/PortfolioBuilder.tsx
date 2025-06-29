import { useState, useRef } from 'react';

// Add Speech Recognition API declarations
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
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
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Camera, Upload, Users, Brain, Star, Calendar, PlusCircle, ImageIcon, Mic, MicOff, Check, X, Share, Eye, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  schoolId: number;
  sharedWithSchool: boolean;
  isActive: boolean;
  sharedWithSchool: boolean;
  createdBy: number;
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
  const [photoAnalysis, setPhotoAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  });
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [pendingVoiceNote, setPendingVoiceNote] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  // Additional state for smart analysis
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedPhotoData, setUploadedPhotoData] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: 'Child Added',
        description: 'New child has been added to your class.',
      });
    },
  });

  // Photo analysis mutation
  const analyzePhotoMutation = useMutation({
    mutationFn: ({ base64Image, context }: { base64Image: string; context?: string }) =>
      apiRequest('/api/portfolio/analyze', {
        method: 'POST',
        data: {
          base64Image,
          childId: selectedChild,
          context,
        },
      }),
    onSuccess: (analysis: AIAnalysis) => {
      setPhotoAnalysis(analysis);
      setPortfolioForm(prev => ({
        ...prev,
        title: analysis.suggestedTitle,
        description: analysis.aiSummary,
      }));
      toast({
        title: 'Photo Analyzed',
        description: 'AI has analyzed the photo and detected learning activities.',
      });
    },
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
      });
      setPhotoAnalysis(null);
      toast({
        title: 'Portfolio Entry Created',
        description: 'New portfolio entry has been saved successfully.',
      });
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
      toast({
        title: 'Sharing Updated',
        description: 'Child sharing settings have been updated.',
      });
      // Refresh children list
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update sharing settings.',
        variant: 'destructive',
      });
    }
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        // Store the uploaded file for potential manual fallback
        setUploadedFile(file);
        
        // Add to photos array
        setPortfolioForm(prev => ({
          ...prev,
          photos: [...prev.photos, base64],
        }));

        // Store for manual analysis trigger
        setUploadedPhotoData(base64Data);
        
        toast({
          title: 'Photo Uploaded Successfully',
          description: 'Click "Analyze Photo" below to detect children and create portfolio entry.',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload and analyze photo.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEntry = () => {
    if (!selectedChild || !portfolioForm.title) {
      toast({
        title: 'Missing Information',
        description: 'Please select a child and enter a title.',
        variant: 'destructive',
      });
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

  // Voice input functions
  const startVoiceRecording = () => {
    if (!selectedChild) {
      toast({
        title: 'Select a Child First',
        description: 'Please select a child before recording voice notes.',
        variant: 'destructive',
      });
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceText('');
      };

      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          setVoiceText(transcript);
          setPendingVoiceNote(transcript);
          setShowVoiceConfirmation(true);
          stopVoiceRecording();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: 'Voice Recognition Error',
          description: 'Unable to process voice input. Please try again.',
          variant: 'destructive',
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
      recognition.start();
    } else {
      toast({
        title: 'Voice Recognition Not Supported',
        description: 'Your browser does not support voice recognition.',
        variant: 'destructive',
      });
    }
  };

  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const confirmVoiceNote = async () => {
    if (!pendingVoiceNote) return;
    
    // Add the voice note to the description field
    setPortfolioForm(prev => ({
      ...prev,
      description: prev.description ? 
        `${prev.description}\n\nVoice Note: ${pendingVoiceNote}` : 
        `Voice Note: ${pendingVoiceNote}`
    }));

    // If we have both a photo and voice input, use intelligent analysis
    if (portfolioForm.photos.length > 0) {
      try {
        const base64Data = portfolioForm.photos[0].split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        const intelligentAnalysis = await apiRequest('/api/portfolio/analyze-with-voice', {
          method: 'POST',
          data: {
            base64Image: base64Data,
            voiceContext: pendingVoiceNote,
          },
        });

        // Update analysis with intelligent assignment
        setPhotoAnalysis(intelligentAnalysis);
        
        // If AI identified specific children, automatically select the first one
        if (intelligentAnalysis.assignedChildObjects && intelligentAnalysis.assignedChildObjects.length > 0) {
          setSelectedChild(intelligentAnalysis.assignedChildObjects[0].id);
          
          toast({
            title: 'Smart Assignment Complete',
            description: `AI analyzed your voice note and assigned this to ${intelligentAnalysis.assignedChildObjects[0].firstName}. Reason: ${intelligentAnalysis.childAssignment?.reasoning}`,
          });
        } else {
          toast({
            title: 'Voice Note Added',
            description: 'Voice note added. AI analyzed the content but could not automatically assign to a specific child.',
          });
        }

        // Update title and description with AI suggestions
        setPortfolioForm(prev => ({
          ...prev,
          title: intelligentAnalysis.suggestedTitle || prev.title,
          description: intelligentAnalysis.aiSummary || prev.description,
        }));

      } catch (error) {
        console.error('Intelligent analysis failed:', error);
        toast({
          title: 'Voice Note Added',
          description: 'Voice note added, but intelligent analysis failed. Please manually select the child.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Voice Note Added',
        description: 'Voice note has been added. Upload a photo for smart child assignment.',
      });
    }

    // Reset state
    setShowVoiceConfirmation(false);
    setPendingVoiceNote('');
    setVoiceText('');
  };

  const cancelVoiceNote = () => {
    setShowVoiceConfirmation(false);
    setPendingVoiceNote('');
    setVoiceText('');
  };

  // Smart photo analysis with simplified face recognition and fallback to voice analysis
  const smartAnalyzePhoto = async (base64Image: string, voiceContext?: string) => {
    setIsAnalyzing(true);
    
    try {
      // First try the simplified face recognition approach if children have reference photos
      const childrenWithPhotos = children.filter(c => c.referencePhotoUrl);
      console.log(`[Portfolio] Found ${childrenWithPhotos.length} children with reference photos`);
      
      if (childrenWithPhotos.length > 0) {
        try {
          console.log('[Portfolio] Attempting face recognition with in-app system...');
          
          // Import and initialize face detection service
          const { faceDetectionService } = await import('../services/faceDetection');
          console.log('[Portfolio] Face detection service imported');
          
          // Initialize with error handling and user feedback
          toast({
            title: 'Initializing Face Recognition',
            description: 'Loading AI models for face detection...',
            variant: 'default',
          });
          
          await faceDetectionService.initialize();
          console.log('[Portfolio] Face detection service initialized');
          
          // Load child descriptors from reference photos
          toast({
            title: 'Processing Reference Photos',
            description: `Loading face data for ${childrenWithPhotos.length} children...`,
            variant: 'default',
          });
          
          await faceDetectionService.loadChildDescriptors(childrenWithPhotos);
          console.log(`[Portfolio] Loaded descriptors for ${childrenWithPhotos.length} children`);
          
          // Process the uploaded image with detailed logging
          toast({
            title: 'Analyzing Photo',
            description: 'Detecting faces in the uploaded image...',
            variant: 'default',
          });
          
          console.log('[Portfolio] Processing uploaded image for face detection...');
          console.log('[Portfolio] Image data size:', base64Image.length);
          console.log('[Portfolio] Image format:', base64Image.substring(0, 50));
          
          const descriptors = await faceDetectionService.processImageDataUrl(base64Image);
          console.log(`[Portfolio] Found ${descriptors.length} faces in uploaded image`);
          
          if (descriptors.length === 0) {
            console.log('[Portfolio] No faces detected - this could indicate image quality issues or detection problems');
          }
          
          if (descriptors.length > 0) {
            console.log('[Portfolio] Face detected successfully, starting comparison process...');
            console.log(`[Portfolio] Uploaded face descriptor length: ${descriptors[0].length}`);
            console.log(`[Portfolio] Service has ${faceDetectionService.getDescriptorCount()} stored descriptors`);
            
            // Find matches for the first detected face
            const matches = faceDetectionService.findMatches(descriptors[0], 0.6);
            console.log(`[Portfolio] Found ${matches.length} potential matches`);
            
            if (matches.length > 0) {
              const bestMatch = matches[0];
              const matchedChild = children.find(c => c.id === bestMatch.childId);
              console.log(`[Portfolio] Best match: ${bestMatch.childName} with distance ${bestMatch.distance} (lower is better)`);
              console.log(`[Portfolio] Match confidence: ${bestMatch.confidence}`);
              
              if (matchedChild && bestMatch.confidence > 0.6) {
                console.log(`[Portfolio] Face recognition success: ${matchedChild.firstName} ${matchedChild.lastName}`);
                
                // Auto-create portfolio entry with the detected child
                const entryData = {
                  title: portfolioForm.title || `Learning moment with ${matchedChild.firstName}`,
                  description: portfolioForm.description || (voiceContext ? `Activity: ${voiceContext}` : 'Learning activity captured'),
                  photoUrl: base64Image,
                  childId: matchedChild.id,
                  category: 'learning_moment',
                  aiDetected: true,
                  aiConfidence: bestMatch.confidence,
                  entryDate: portfolioForm.entryDate,
                  teacherNotes: portfolioForm.teacherNotes || voiceContext || '',
                };
                
                console.log('[Portfolio] Creating portfolio entry...');
                const newEntry = await apiRequest('/api/portfolio/entries', {
                  method: 'POST',
                  data: entryData,
                });
                console.log('[Portfolio] Portfolio entry created successfully');
                
                toast({
                  title: 'Portfolio Entry Created!',
                  description: `Face recognition detected ${matchedChild.firstName} ${matchedChild.lastName} with ${Math.round(bestMatch.confidence * 100)}% confidence.`,
                });
                
                // Clear the form
                setPortfolioForm({
                  title: '',
                  description: '',
                  entryDate: new Date().toISOString().split('T')[0],
                  teacherNotes: '',
                  photos: [],
                });
                setPendingVoiceNote('');
                setVoiceText('');
                setUploadedFile(null);
                setPhotoAnalysis(null);
                
                // Refresh children data
                queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                
                return; // Success - exit early
              } else {
                console.log(`[Portfolio] Match confidence too low (${bestMatch.confidence}) or child not found`);
              }
            } else {
              console.log('[Portfolio] No face matches found above threshold');
            }
          } else {
            console.log('[Portfolio] No faces detected in uploaded image');
          }
          
          console.log('[Portfolio] Face recognition found no matches, falling back to voice analysis...');
        } catch (faceError) {
          console.error('[Portfolio] Face recognition failed:', faceError);
          console.error('[Portfolio] Face error details:', {
            message: faceError?.message || 'Unknown error',
            stack: faceError?.stack || 'No stack trace',
            name: faceError?.name || 'Unknown error type'
          });
          
          toast({
            title: 'Face Recognition Issue',
            description: `Face detection failed: ${faceError?.message || 'Unknown error'}. Trying voice analysis instead.`,
            variant: 'default',
          });
        }
      } else {
        console.log('[Portfolio] No children with reference photos, skipping face recognition');
        toast({
          title: 'No Reference Photos',
          description: 'Add reference photos to children profiles to enable face recognition.',
          variant: 'default',
        });
      }

      // Fallback to existing voice-based analysis
      const response = await apiRequest('/api/portfolio/smart-analyze', {
        method: 'POST',
        timeout: 60000,
        data: {
          base64Image: base64Image,
          voiceContext: voiceContext || '',
        },
      });

      if (response.success && response.detectedChild) {
        toast({
          title: 'Portfolio Entry Created Successfully!',
          description: `Detected ${response.detectedChild.firstName} ${response.detectedChild.lastName} and created entry in ${response.portfolioSection} section.`,
        });
        
        // Clear the form
        setPortfolioForm({
          title: '',
          description: '',
          entryDate: new Date().toISOString().split('T')[0],
          teacherNotes: '',
          photos: [],
        });
        setPendingVoiceNote('');
        setVoiceText('');
        setUploadedFile(null);
        setPhotoAnalysis(null);
        
        queryClient.invalidateQueries({ queryKey: ['/api/children'] });
        
      } else {
        setAnalysisResult(response);
        setPhotoAnalysis(response.analysis);
        
        toast({
          title: 'Manual Selection Required',
          description: response.message || 'Could not automatically identify the child. Please select manually below.',
          variant: 'default',
        });
      }

    } catch (error: any) {
      console.error('Error in smart photo analysis:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Could not analyze the photo. Please try again.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Photo analysis is taking longer than expected. The AI is still processing - please wait a moment and try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      }
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setUploadedPhotoData(null); // Clear the analysis data after attempt
    }
  };

  const handleReferencePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setNewChildData(prev => ({
          ...prev,
          referencePhotoUrl: base64,
        }));
        toast({
          title: 'Photo Uploaded',
          description: 'Reference photo has been added for facial recognition.',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload reference photo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Child Portfolio Builder</h1>
        <p className="text-gray-600">Create comprehensive portfolios with AI-powered photo analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Child
                </CardTitle>
                <CardDescription>Choose a child to create portfolio entries</CardDescription>
              </div>
              <Dialog open={showNewChildDialog} onOpenChange={setShowNewChildDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Child</DialogTitle>
                    <DialogDescription>Add a new child to your class</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newChildData.firstName}
                        onChange={(e) => setNewChildData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newChildData.lastName}
                        onChange={(e) => setNewChildData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate">Date of Birth</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={newChildData.birthDate}
                        onChange={(e) => setNewChildData(prev => ({ ...prev, birthDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Reference Photo (for facial recognition)</Label>
                      <div className="space-y-3">
                        {newChildData.referencePhotoUrl && (
                          <div className="relative">
                            <img
                              src={newChildData.referencePhotoUrl}
                              alt="Reference photo"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => setNewChildData(prev => ({ ...prev, referencePhotoUrl: '' }))}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        
                        {!newChildData.referencePhotoUrl && (
                          <div className="flex flex-col gap-3">
                            {/* Desktop file upload */}
                            <div className="hidden md:block">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleReferencePhotoUpload}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                            
                            {/* Mobile/tablet buttons */}
                            <div className="md:hidden grid grid-cols-2 gap-2">
                              <div className="relative">
                                <input
                                  id="camera-capture"
                                  type="file"
                                  accept="image/*"
                                  capture="user"
                                  onChange={handleReferencePhotoUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button
                                  variant="outline"
                                  className="w-full h-12 flex items-center gap-2"
                                  asChild
                                >
                                  <label htmlFor="camera-capture" className="cursor-pointer">
                                    <Camera className="h-4 w-4" />
                                    Take Photo
                                  </label>
                                </Button>
                              </div>
                              
                              <div className="relative">
                                <input
                                  id="gallery-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleReferencePhotoUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button
                                  variant="outline"
                                  className="w-full h-12 flex items-center gap-2"
                                  asChild
                                >
                                  <label htmlFor="gallery-upload" className="cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    Upload
                                  </label>
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground text-center">
                              {typeof window !== 'undefined' && window.innerWidth <= 768 ? 
                                'Take a photo or upload from gallery' : 
                                'Upload a clear photo of the child\'s face'
                              } for facial recognition features
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => createChildMutation.mutate(newChildData)}
                      disabled={!newChildData.firstName || !newChildData.lastName || createChildMutation.isPending}
                      className="w-full"
                    >
                      {createChildMutation.isPending ? 'Adding...' : 'Add Child'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {childrenLoading ? (
                <div className="text-center py-4">Loading children...</div>
              ) : children.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No children in your class yet. Add a child to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child: Child) => (
                    <div key={child.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant={selectedChild === child.id ? "default" : "outline"}
                          className="flex-grow justify-start mr-2"
                          onClick={() => setSelectedChild(child.id)}
                        >
                          {child.firstName} {child.lastName}
                        </Button>
                        <Link href={`/children/${child.id}`}>
                          <Button variant="ghost" size="sm" className="p-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Share className="h-3 w-3" />
                          <span>Share with school teachers</span>
                        </div>
                        <Switch
                          checked={child.sharedWithSchool}
                          onCheckedChange={(checked) => 
                            updateSharingMutation.mutate({
                              childId: child.id,
                              sharedWithSchool: checked
                            })
                          }
                          disabled={updateSharingMutation.isPending}
                        />
                      </div>
                      {child.sharedWithSchool && (
                        <div className="mt-1 text-xs text-green-600">
                          Shared with your school
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Portfolio Entries */}
          {selectedChild && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Previous portfolio entries for this child</CardDescription>
              </CardHeader>
              <CardContent>
                {entriesLoading ? (
                  <div className="text-center py-4">Loading entries...</div>
                ) : portfolioEntries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No portfolio entries yet. Create the first one!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {portfolioEntries.slice(0, 5).map((entry: PortfolioEntry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{entry.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </p>
                        {entry.photos.length > 0 && (
                          <Badge variant="outline" className="mt-2">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Portfolio Creation Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Entry</TabsTrigger>
              <TabsTrigger value="analyze">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Smart Photo Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload photos and AI will automatically detect children and create portfolio entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="w-full"
                        size="lg"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Photo
                      </Button>
                      <p className="text-sm text-blue-600 mt-2 text-center">
                        📸 Step 1: Upload your photo, then click "Analyze Photo" below
                      </p>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        💡 For automatic child detection, upload profile photos in child management first
                      </p>
                    </div>

                    {/* Display uploaded photos */}
                    {portfolioForm.photos.length > 0 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {portfolioForm.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Analysis trigger button */}
                        {uploadedPhotoData && (
                          <Button
                            onClick={() => smartAnalyzePhoto(uploadedPhotoData, pendingVoiceNote)}
                            disabled={isAnalyzing}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Analyzing Photo...
                              </>
                            ) : (
                              <>
                                <Brain className="h-5 w-5 mr-2" />
                                Analyze Photo & Detect Children
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                        onChange={(e) => setPortfolioForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Building Towers: Spatial Reasoning Development"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the learning activity and observations..."
                        rows={4}
                      />
                      
                      {/* Voice Input Button */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          variant={isListening ? "destructive" : "outline"}
                          size="sm"
                          onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                          disabled={!selectedChild}
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
                    </div>

                    <div>
                      <Label htmlFor="entryDate">Entry Date</Label>
                      <Input
                        id="entryDate"
                        type="date"
                        value={portfolioForm.entryDate}
                        onChange={(e) => setPortfolioForm(prev => ({ ...prev, entryDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="teacherNotes">Teacher Notes</Label>
                      <Textarea
                        id="teacherNotes"
                        value={portfolioForm.teacherNotes}
                        onChange={(e) => setPortfolioForm(prev => ({ ...prev, teacherNotes: e.target.value }))}
                        placeholder="Additional observations, context, or next steps..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleSaveEntry}
                      disabled={!selectedChild || !portfolioForm.title || createEntryMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {createEntryMutation.isPending ? 'Saving...' : 'Save Manual Entry'}
                    </Button>
                    {!selectedChild && (
                      <p className="text-sm text-amber-600 text-center mt-2">
                        Select a child above for manual entry, or use photo upload for automatic detection
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analyze" className="space-y-6">
              {photoAnalysis ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Analysis Results
                      </CardTitle>
                      <CardDescription>
                        Confidence: {Math.round(photoAnalysis.confidence * 100)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Activity Detected</h4>
                        <Badge variant="outline">{photoAnalysis.activity.activityType}</Badge>
                      </div>

                      {photoAnalysis.intelligentAssignment && photoAnalysis.childAssignment && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Smart Child Assignment
                          </h4>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {photoAnalysis.childAssignment.assignedChildren.map((childName, index) => (
                                <Badge key={index} variant="default" className="bg-green-100 text-green-800 border-green-300">
                                  {childName}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {photoAnalysis.childAssignment.reasoning}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {Math.round((photoAnalysis.childAssignment.confidence || 0) * 100)}%
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Learning Indicators</h4>
                        <div className="flex flex-wrap gap-2">
                          {photoAnalysis.activity.learningIndicators.map((indicator, index) => (
                            <Badge key={index} variant="secondary">{indicator}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Emotional States</h4>
                        <div className="flex flex-wrap gap-2">
                          {photoAnalysis.activity.emotions.map((emotion, index) => (
                            <Badge key={index} variant="outline">{emotion}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">NAEYC Standards</h4>
                        <div className="space-y-2">
                          {photoAnalysis.standards.naeyc_standards.map((standard, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{standard}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">AI Summary</h4>
                        <p className="text-sm text-gray-700">{photoAnalysis.aiSummary}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                    <p className="text-gray-500 text-center">
                      Upload a photo to see AI analysis of learning activities, emotions, and educational standards.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Voice Confirmation Dialog */}
      <Dialog open={showVoiceConfirmation} onOpenChange={setShowVoiceConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Voice Note</DialogTitle>
            <DialogDescription>
              Would you like to add this voice note to {children.find(c => c.id === selectedChild)?.firstName}'s portfolio description?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Recorded Voice Note:</p>
              <p className="text-sm text-gray-700">"{pendingVoiceNote}"</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelVoiceNote}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={confirmVoiceNote}>
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