import React, { useState, useRef } from 'react';
import { useSimpleAuth } from '@/lib/simple-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  ArrowRight,
  X
} from 'lucide-react';

interface ParsedSlide {
  title: string;
  content: string;
  notes: string;
  slideNumber: number;
  videoLinks?: string[];
}

export default function NewModuleImport() {
  const { user, isAuthenticated } = useSimpleAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'config' | 'save'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedSlides, setParsedSlides] = useState<ParsedSlide[]>([]);
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);

  const [moduleConfig, setModuleConfig] = useState({
    title: '',
    description: '',
    category: 'professional-development',
    difficulty: 'intermediate',
    estimatedTime: '15',
    customPoints: '25',
    shareWithCommunity: false,
    preserveFormatting: true,
    addInteractions: true
  });

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PowerPoint file (.ppt or .pptx)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setModuleConfig(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.(ppt|pptx)$/i, '')
    }));
  };

  const processFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/powerpoint/parse', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to process PowerPoint file');

      const data = await response.json();
      setParsedSlides(data.slides || []);
      setSelectedSlides(data.slides?.map((_: any, index: number) => index) || []);
      setCurrentStep('preview');

      toast({
        title: "File Processed!",
        description: `Successfully extracted ${data.slides?.length || 0} slides from your presentation.`
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process PowerPoint file. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSlideSelection = (slideIndex: number) => {
    setSelectedSlides(prev => 
      prev.includes(slideIndex) 
        ? prev.filter(i => i !== slideIndex)
        : [...prev, slideIndex]
    );
  };

  const selectAllSlides = () => {
    setSelectedSlides(parsedSlides.map((_, index) => index));
  };

  const deselectAllSlides = () => {
    setSelectedSlides([]);
  };

  const saveModule = async () => {
    if (selectedSlides.length === 0) {
      toast({
        title: "No Slides Selected",
        description: "Please select at least one slide to include in your module.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedSlidesData = selectedSlides.map(index => parsedSlides[index]);
      
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleConfig.title,
          description: moduleConfig.description,
          category: moduleConfig.category || 'professional-development',
          difficulty: moduleConfig.difficulty || 'medium',
          estimatedTime: moduleConfig.estimatedTime || '15',
          customPoints: moduleConfig.customPoints || '',
          shareWithCommunity: moduleConfig.shareWithCommunity || false,
          sections: selectedSlidesData.map((slide, index) => ({
            title: slide.title || `Slide ${slide.slideNumber}`,
            content: slide.content || '',
            type: slide.videoLinks && slide.videoLinks.length > 0 ? 'video' : 'text',
            duration: Math.ceil(parseInt(moduleConfig.estimatedTime || '15') / selectedSlidesData.length),
            videoUrl: slide.videoLinks && slide.videoLinks.length > 0 ? slide.videoLinks[0] : '',
            imageUrl: '',
            activities: [],
            notes: slide.notes || ''
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Module creation error:', response.status, errorData);
        throw new Error(`Failed to save module: ${errorData}`);
      }

      const result = await response.json();
      console.log('Module created successfully:', result);

      toast({
        title: "Module Saved!",
        description: "Your PowerPoint module has been created successfully."
      });

      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save module. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Upload className="h-8 w-8 text-purple-600" />
              PowerPoint Import
            </h1>
            <p className="text-gray-600 mt-2">Transform your existing presentations into interactive modules</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/new-module-creator')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creator
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'upload' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}>
              1
            </div>
            <span>Upload</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'preview' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}>
              2
            </div>
            <span>Preview</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'config' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}>
              3
            </div>
            <span>Configure</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PowerPoint File</CardTitle>
              <CardDescription>
                Upload your .ppt or .pptx file to convert it into an interactive module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your PowerPoint file here</p>
                  <p className="text-gray-600">or click to browse</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  variant="outline"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      onClick={() => setUploadedFile(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Supported Features</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Text content extraction</li>
                      <li>• Speaker notes conversion</li>
                      <li>• Slide title detection</li>
                      <li>• Basic formatting preservation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={processFile}
                  disabled={!uploadedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Process File
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Preview */}
      {currentStep === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Slides</CardTitle>
                  <CardDescription>
                    Select the slides you want to include in your module
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllSlides}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllSlides}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedSlides.map((slide, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedSlides.includes(index) 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleSlideSelection(index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {slide.title || `Slide ${slide.slideNumber}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Slide {slide.slideNumber}
                          </Badge>
                          {selectedSlides.includes(index) && (
                            <CheckCircle2 className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {slide.content || 'No content extracted'}
                      </p>
                      {slide.videoLinks && slide.videoLinks.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <strong>📹 Video Content:</strong> {slide.videoLinks.length} video link{slide.videoLinks.length > 1 ? 's' : ''} found
                          <br />
                          <span className="text-blue-600">{slide.videoLinks[0].substring(0, 50)}...</span>
                        </div>
                      )}
                      {slide.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Notes:</strong> {slide.notes.substring(0, 100)}...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  Back to Upload
                </Button>
                <Button 
                  onClick={() => setCurrentStep('config')}
                  disabled={selectedSlides.length === 0}
                >
                  Continue to Configuration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Configuration */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Module</CardTitle>
              <CardDescription>
                Set up your module details and import preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Module Title</Label>
                  <Input
                    id="title"
                    value={moduleConfig.title}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter module title..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={moduleConfig.category} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional-development">Professional Development</SelectItem>
                      <SelectItem value="classroom-management">Classroom Management</SelectItem>
                      <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                      <SelectItem value="assessment-strategies">Assessment Strategies</SelectItem>
                      <SelectItem value="parent-communication">Parent Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={moduleConfig.description}
                  onChange={(e) => setModuleConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what learners will gain from this module..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={moduleConfig.difficulty} 
                    onValueChange={(value) => setModuleConfig(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={moduleConfig.estimatedTime}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <Label htmlFor="customPoints">Points Reward</Label>
                  <Input
                    id="customPoints"
                    type="number"
                    value={moduleConfig.customPoints}
                    onChange={(e) => setModuleConfig(prev => ({ ...prev, customPoints: e.target.value }))}
                    min="5"
                    max="100"
                  />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Import Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Selected Slides:</span> {selectedSlides.length}
                  </div>
                  <div>
                    <span className="font-medium">Total Slides:</span> {parsedSlides.length}
                  </div>
                  <div>
                    <span className="font-medium">Est. Duration:</span> {moduleConfig.estimatedTime} minutes
                  </div>
                  <div>
                    <span className="font-medium">Source File:</span> {uploadedFile?.name}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                  Back to Preview
                </Button>
                <Button onClick={saveModule}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}