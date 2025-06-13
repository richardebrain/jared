import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Clock,
  Presentation
} from 'lucide-react';

interface SlideBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
}

export default function SlideBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: SlideBuilderProps) {
  const { toast } = useToast();
  const [builtSlides, setBuiltSlides] = useState<Array<{ title: string; content: string; imageUrl: string }>>([]);
  const [currentSlide, setCurrentSlide] = useState({ title: '', content: '', imageUrl: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.slides) {
      setBuiltSlides(initialData.slides);
    }
  }, [initialData]);

  const generateSingleSlide = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingSlides: builtSlides
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.slides && data.slides.length > 0) {
          setCurrentSlide(data.slides[0]);
          toast({
            title: "AI Content Generated",
            description: "Slide has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate slide content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addSlideToBuilder = () => {
    if (!currentSlide.title.trim() || !currentSlide.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and content fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltSlides([...builtSlides, { ...currentSlide }]);
    setCurrentSlide({ title: '', content: '', imageUrl: '' });
    
    toast({
      title: "Slide Added",
      description: "Slide has been added to the presentation.",
    });
  };

  const removeSlideFromBuilder = (index: number) => {
    setBuiltSlides(builtSlides.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtSlides.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one slide before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ slides: builtSlides });
  };

  return (
    <div className="space-y-6">
      {/* Module Context Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <div className="flex-1">
              <CardTitle className="text-lg text-blue-900">
                {moduleTitle || 'Professional Development Module'}
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                <strong>Topic:</strong> {moduleDescription || 'Building effective teaching strategies'}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {category}
                </Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  {difficulty} level
                </Badge>
                <span className="text-blue-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {estimatedTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Section: {sectionTitle}</CardTitle>
          <CardDescription>
            AI will use the module topic above to generate relevant content for this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Slide Builder */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Presentation className="h-5 w-5" />
                Interactive Slide Builder
              </CardTitle>
              <CardDescription className="text-purple-700">
                Build your slide presentation one slide at a time. Add as many slides as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Slide Topic Context</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-blue-700">
                    <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Learning Objective:</strong> {moduleDescription || 'Building effective teaching strategies'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Section:</strong> {sectionTitle}
                  </div>
                  <div className="text-blue-600 text-xs mt-2">
                    AI will generate slides specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
                    {builtSlides.length}
                  </div>
                  <span className="text-sm font-medium">Slides Built</span>
                </div>
                {builtSlides.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Slides Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Slide Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Slide {builtSlides.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleSlide}
                      disabled={isGenerating}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <Label className="text-sm font-medium">Slide Title</Label>
                  <Input
                    value={currentSlide.title}
                    onChange={(e) => setCurrentSlide(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter slide title..."
                    className="mt-1"
                  />
                </div>

                {/* Content Input */}
                <div>
                  <Label className="text-sm font-medium">Slide Content</Label>
                  <Textarea
                    value={currentSlide.content}
                    onChange={(e) => setCurrentSlide(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter slide content..."
                    className="mt-1"
                    rows={5}
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-sm font-medium">Image URL (Optional)</Label>
                  <Input
                    value={currentSlide.imageUrl}
                    onChange={(e) => setCurrentSlide(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Enter image URL..."
                    className="mt-1"
                  />
                </div>

                {/* Add Slide Button */}
                <Button
                  onClick={addSlideToBuilder}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!currentSlide.title.trim() || !currentSlide.content.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slide to Presentation
                </Button>
              </div>

              {/* Built Slides List */}
              {builtSlides.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Slides ({builtSlides.length})</h4>
                  {builtSlides.map((slide, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">Slide {index + 1}: {slide.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {slide.content.substring(0, 100)}...
                          </div>
                          {slide.imageUrl && (
                            <div className="text-xs text-blue-600 mt-1">
                              <strong>Image:</strong> {slide.imageUrl}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSlideFromBuilder(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exit Builder */}
              <div className="flex justify-between pt-4 border-t border-purple-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentSlide({ title: '', content: '', imageUrl: '' });
                    setBuiltSlides([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtSlides.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Finish Presentation & Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}