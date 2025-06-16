import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image, Palette, Loader2, Download, Copy, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ModuleImageGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (imageUrl: string, description: string) => void;
  moduleTitle?: string;
  sectionContext?: string;
}

const IMAGE_STYLES = [
  { 
    id: 'friendly-illustration', 
    name: 'Friendly Illustration', 
    description: 'Warm, welcoming cartoon-style illustrations perfect for educational materials',
    prompt: 'friendly cartoon illustration style, warm colors, educational, child-friendly'
  },
  { 
    id: 'simple-diagram', 
    name: 'Simple Diagram', 
    description: 'Clean, minimalist diagrams with clear labels and simple shapes',
    prompt: 'simple educational diagram, clean lines, minimal colors, clear labels'
  },
  { 
    id: 'storybook', 
    name: 'Storybook Style', 
    description: 'Colorful storybook illustrations with soft edges and bright colors',
    prompt: 'children\'s book illustration style, soft edges, bright cheerful colors, educational'
  },
  { 
    id: 'infographic', 
    name: 'Educational Infographic', 
    description: 'Clear informational graphics with icons and visual elements',
    prompt: 'educational infographic style, clear icons, organized layout, professional yet friendly'
  }
];

const CONTENT_SUGGESTIONS = [
  'Children playing together and sharing toys',
  'Teacher reading to a group of children in circle time',
  'Different emotions and feelings chart',
  'Classroom rules and expectations poster',
  'Daily schedule with picture symbols',
  'Hand washing steps illustration',
  'Conflict resolution steps for children',
  'Safety rules in the classroom',
  'Developmental milestones chart',
  'Positive behavior reinforcement chart'
];

export default function ModuleImageGenerator({
  open,
  onOpenChange,
  onImageGenerated,
  moduleTitle,
  sectionContext
}: ModuleImageGeneratorProps) {
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('friendly-illustration');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImageMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; moduleContext?: string }) => {
      const style = IMAGE_STYLES.find(s => s.id === selectedStyle);
      const enhancedPrompt = `${data.prompt}, ${style?.prompt || ''}, educational content, professional quality, suitable for teaching materials, no text or words in image`;
      
      return apiRequest('/api/ai/generate-image', {
        data: {
          prompt: enhancedPrompt,
          quality: 'hd',
          style: 'natural',
          moduleContext: data.moduleContext
        }
      });
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Image Generated!",
          description: "Your educational illustration is ready to use.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate image. Please try again with a different description.",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what you'd like to illustrate.",
        variant: "destructive"
      });
      return;
    }

    const moduleContext = `Module: ${moduleTitle || 'Educational Content'}${sectionContext ? `, Section: ${sectionContext}` : ''}`;
    
    generateImageMutation.mutate({
      prompt: description,
      style: selectedStyle,
      moduleContext
    });
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage, description);
      toast({
        title: "Image Added",
        description: "The illustration has been added to your module section.",
      });
      onOpenChange(false);
      // Reset for next use
      setGeneratedImage(null);
      setDescription('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Educational Image Generator
          </DialogTitle>
          <DialogDescription>
            Create custom educational illustrations and handouts for your module sections
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="description">What would you like to illustrate?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the educational illustration you need (e.g., 'Children sitting in a circle during story time')"
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Illustration Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {IMAGE_STYLES.find(s => s.id === selectedStyle)?.description}
              </p>
            </div>

            <div>
              <Label>Quick Suggestions</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {CONTENT_SUGGESTIONS.slice(0, 5).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left justify-start h-auto py-2 px-3"
                  >
                    <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-xs">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateImageMutation.isPending || !description.trim()}
              className="w-full"
            >
              {generateImageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating... (30-60 seconds)
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Generate Educational Illustration
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {generateImageMutation.isPending ? (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                      <p className="text-sm text-gray-600 mt-2">Creating your illustration...</p>
                      <p className="text-xs text-gray-500">This may take 30-60 seconds</p>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <img
                      src={generatedImage}
                      alt={description}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUseImage} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Module
                      </Button>
                      <Button variant="outline" onClick={handleGenerate}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600 mt-2">Your illustration will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {moduleTitle && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Module: {moduleTitle}
                    </Badge>
                    {sectionContext && (
                      <Badge variant="outline" className="text-xs">
                        Section: {sectionContext}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}