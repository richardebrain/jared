import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Loader2, 
  Save,
  Image,
  FileText,
  ChevronLeft,
  ChevronRight,
  Presentation
} from 'lucide-react';

interface Slide {
  title: string;
  content: string;
  imageUrl?: string;
  notes?: string;
  duration?: number;
}

interface SlideData {
  title: string;
  slides: Slide[];
  totalDuration: number;
  autoAdvance: boolean;
  showNotes: boolean;
}

interface SlideBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: SlideData) => void;
  onCancel: () => void;
  initialData?: SlideData;
}

export default function SlideBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: SlideBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  const [data, setData] = useState<SlideData>(initialData || {
    title: `${sectionTitle} - Presentation`,
    slides: [],
    totalDuration: 0,
    autoAdvance: false,
    showNotes: true
  });

  const [currentSlide, setCurrentSlide] = useState<Slide>({
    title: '',
    content: '',
    imageUrl: '',
    notes: '',
    duration: 30
  });

  const generateAISlides = async () => {
    if (!moduleTitle || !moduleDescription) {
      toast({
        title: "Missing Information",
        description: "Module title and description are required for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/ai/generate-slides', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          slideCount: 8,
          includeImages: true,
          presentationStyle: 'educational'
        }
      });

      if (response.slides && response.slides.length > 0) {
        setData(prev => ({
          ...prev,
          slides: response.slides,
          totalDuration: response.slides.reduce((total: number, slide: Slide) => total + (slide.duration || 30), 0)
        }));
        
        toast({
          title: "Slides Generated",
          description: `Created ${response.slides.length} presentation slides.`,
        });
      }
    } catch (error) {
      console.error('Error generating slides:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate slides. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addSlide = () => {
    if (!currentSlide.title.trim() || !currentSlide.content.trim()) {
      toast({
        title: "Incomplete Slide",
        description: "Please add both title and content for the slide.",
        variant: "destructive",
      });
      return;
    }

    setData(prev => ({
      ...prev,
      slides: [...prev.slides, { ...currentSlide }],
      totalDuration: prev.totalDuration + (currentSlide.duration || 30)
    }));

    setCurrentSlide({
      title: '',
      content: '',
      imageUrl: '',
      notes: '',
      duration: 30
    });

    toast({
      title: "Slide Added",
      description: `Presentation now has ${data.slides.length + 1} slides.`,
    });
  };

  const removeSlide = (index: number) => {
    const slideToRemove = data.slides[index];
    setData(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
      totalDuration: prev.totalDuration - (slideToRemove.duration || 30)
    }));
  };

  const updateSlide = (index: number, field: keyof Slide, value: string | number) => {
    setData(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => 
        i === index ? { ...slide, [field]: value } : slide
      )
    }));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.slides.length) return;

    setData(prev => {
      const newSlides = [...prev.slides];
      [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
      return { ...prev, slides: newSlides };
    });
  };

  const handleSave = () => {
    if (data.slides.length === 0) {
      toast({
        title: "No Slides",
        description: "Please add at least one slide to the presentation.",
        variant: "destructive",
      });
      return;
    }

    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Slide Presentation Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Presentation Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter presentation title"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoAdvance"
                checked={data.autoAdvance}
                onChange={(e) => setData(prev => ({ ...prev, autoAdvance: e.target.checked }))}
              />
              <Label htmlFor="autoAdvance">Auto-advance slides</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAISlides}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Slide Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Slide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slideTitle">Slide Title</Label>
            <Input
              id="slideTitle"
              value={currentSlide.title}
              onChange={(e) => setCurrentSlide(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter slide title"
            />
          </div>

          <div>
            <Label htmlFor="slideContent">Slide Content</Label>
            <Textarea
              id="slideContent"
              value={currentSlide.content}
              onChange={(e) => setCurrentSlide(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter slide content (bullet points, key information)"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                value={currentSlide.imageUrl}
                onChange={(e) => setCurrentSlide(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={currentSlide.duration}
                onChange={(e) => setCurrentSlide(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Speaker Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={currentSlide.notes}
              onChange={(e) => setCurrentSlide(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes for the presenter"
              rows={2}
            />
          </div>

          <Button onClick={addSlide} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </CardContent>
      </Card>

      {/* Current Slides List */}
      {data.slides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Presentation Slides ({data.slides.length}) - Total: {Math.round(data.totalDuration / 60)} minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.slides.map((slide, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">Slide {index + 1}</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === data.slides.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlide(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlide(index, 'title', e.target.value)}
                      placeholder="Slide title"
                    />
                    <Textarea
                      value={slide.content}
                      onChange={(e) => updateSlide(index, 'content', e.target.value)}
                      placeholder="Slide content"
                      rows={3}
                    />
                    {slide.imageUrl && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Image className="h-4 w-4" />
                        Image included
                      </div>
                    )}
                    {slide.notes && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        Speaker notes included
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Presentation
        </Button>
      </div>
    </div>
  );
}