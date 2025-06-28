import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Camera, Upload, Users, Brain, Star, Calendar, PlusCircle, ImageIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  schoolId: number;
  isActive: boolean;
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
}

export default function PortfolioBuilder() {
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNewChildDialog, setShowNewChildDialog] = useState(false);
  const [newChildData, setNewChildData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    teacherNotes: '',
    photos: [] as string[],
  });

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
      setNewChildData({ firstName: '', lastName: '', dateOfBirth: '' });
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
        
        // Add to photos array
        setPortfolioForm(prev => ({
          ...prev,
          photos: [...prev.photos, base64],
        }));

        // Analyze with AI if child is selected
        if (selectedChild) {
          await analyzePhotoMutation.mutateAsync({ base64Image: base64Data });
        }
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
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newChildData.dateOfBirth}
                        onChange={(e) => setNewChildData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
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
                <div className="space-y-2">
                  {children.map((child: Child) => (
                    <Button
                      key={child.id}
                      variant={selectedChild === child.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedChild(child.id)}
                    >
                      {child.firstName} {child.lastName}
                    </Button>
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
                    Photo Upload & Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload photos and let AI automatically analyze learning activities
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
                        disabled={!selectedChild}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedChild || isAnalyzing}
                        className="w-full"
                        size="lg"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        {isAnalyzing ? 'Analyzing Photo...' : 'Upload & Analyze Photo'}
                      </Button>
                      {!selectedChild && (
                        <p className="text-sm text-gray-500 mt-2">Select a child first to enable photo upload</p>
                      )}
                    </div>

                    {/* Display uploaded photos */}
                    {portfolioForm.photos.length > 0 && (
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
                      {createEntryMutation.isPending ? 'Saving...' : 'Save Portfolio Entry'}
                    </Button>
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
    </div>
  );
}