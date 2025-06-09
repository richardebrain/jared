import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Presentation, 
  Loader2, 
  ExternalLink, 
  CheckCircle, 
  Wand2,
  FileImage,
  Type,
  Palette
} from "lucide-react";

interface GoogleSlidesGeneratorProps {
  onSlidesGenerated: (slidesData: any) => void;
  moduleContext?: {
    title: string;
    description: string;
    targetAudience: string;
  };
}

interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  theme: string;
}

const slideTemplates: SlideTemplate[] = [
  {
    id: 'training-overview',
    name: 'Training Overview',
    description: 'Introduction, objectives, content, and summary slides',
    slideCount: 5,
    theme: 'professional'
  },
  {
    id: 'step-by-step',
    name: 'Step-by-Step Guide',
    description: 'Sequential process with detailed instructions',
    slideCount: 7,
    theme: 'clean'
  },
  {
    id: 'case-study',
    name: 'Case Study Analysis',
    description: 'Problem, analysis, solution, and reflection',
    slideCount: 6,
    theme: 'modern'
  },
  {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Key principles with examples and applications',
    slideCount: 8,
    theme: 'colorful'
  },
  {
    id: 'interactive-workshop',
    name: 'Interactive Workshop',
    description: 'Activities, discussions, and hands-on exercises',
    slideCount: 10,
    theme: 'vibrant'
  }
];

export default function GoogleSlidesGenerator({ onSlidesGenerated, moduleContext }: GoogleSlidesGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customContent, setCustomContent] = useState('');
  const [presentationTitle, setPresentationTitle] = useState(moduleContext?.title || '');
  const [designPreferences, setDesignPreferences] = useState({
    colorScheme: 'professional',
    includeImages: true,
    includeCharts: false,
    fontStyle: 'modern'
  });
  const { toast } = useToast();

  const generateSlides = async () => {
    if (!selectedTemplate && !customContent) {
      toast({
        title: "Missing Information",
        description: "Please select a template or provide custom content.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Preparing slide content...');

    try {
      // Step 1: Generate slide content based on template or custom input
      setGenerationStep('Generating slide structure...');
      
      const contentResponse = await fetch('/api/ai/generate-slides-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          customContent,
          moduleContext: moduleContext || {},
          presentationTitle,
          designPreferences
        }),
      });

      if (!contentResponse.ok) {
        throw new Error('Failed to generate slide content');
      }

      const slideContent = await contentResponse.json();
      
      // Step 2: Create Google Slides presentation
      setGenerationStep('Creating Google Slides presentation...');
      
      const slidesResponse = await fetch('/api/google-slides/create-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: presentationTitle,
          slides: slideContent.slides,
          designPreferences
        }),
      });

      if (!slidesResponse.ok) {
        throw new Error('Failed to create Google Slides presentation');
      }

      const presentationData = await slidesResponse.json();
      
      setGenerationStep('Finalizing presentation...');
      
      // Format the slides data for the module
      const slidesData = {
        presentationId: presentationData.presentationId,
        presentationUrl: presentationData.presentationUrl,
        slides: slideContent.slides.map((slide: any, index: number) => ({
          slideId: `slide-${index}`,
          title: slide.title,
          content: slide.content,
          speakerNotes: slide.speakerNotes || '',
          imageUrl: slide.imageUrl || ''
        })),
        generatedFromText: true
      };

      onSlidesGenerated(slidesData);
      
      toast({
        title: "Slides Generated Successfully!",
        description: `Created ${slideContent.slides.length} slides in your Google Slides presentation.`,
      });

    } catch (error) {
      console.error('Error generating slides:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error creating your slides. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-blue-600" />
            Google Slides Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presentation Title */}
          <div>
            <Label htmlFor="presentation-title">Presentation Title</Label>
            <Input
              id="presentation-title"
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              placeholder="Enter presentation title..."
            />
          </div>

          {/* Template Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose a Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slideTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.slideCount} slides
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{template.description}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.theme}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Content Option */}
          <div>
            <Label htmlFor="custom-content">Or Provide Custom Content</Label>
            <Textarea
              id="custom-content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Describe the content you want in your slides..."
              rows={4}
            />
          </div>

          {/* Design Preferences */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Design Preferences
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <Select 
                  value={designPreferences.colorScheme} 
                  onValueChange={(value) => setDesignPreferences(prev => ({ ...prev, colorScheme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional Blue</SelectItem>
                    <SelectItem value="warm">Warm Orange</SelectItem>
                    <SelectItem value="natural">Natural Green</SelectItem>
                    <SelectItem value="vibrant">Vibrant Purple</SelectItem>
                    <SelectItem value="minimal">Minimal Gray</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="font-style">Font Style</Label>
                <Select 
                  value={designPreferences.fontStyle} 
                  onValueChange={(value) => setDesignPreferences(prev => ({ ...prev, fontStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern Sans-serif</SelectItem>
                    <SelectItem value="classic">Classic Serif</SelectItem>
                    <SelectItem value="playful">Playful Rounded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={designPreferences.includeImages}
                  onChange={(e) => setDesignPreferences(prev => ({ ...prev, includeImages: e.target.checked }))}
                />
                <FileImage className="h-4 w-4" />
                Include Images
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={designPreferences.includeCharts}
                  onChange={(e) => setDesignPreferences(prev => ({ ...prev, includeCharts: e.target.checked }))}
                />
                <Type className="h-4 w-4" />
                Include Charts
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateSlides}
            disabled={isGenerating || (!selectedTemplate && !customContent) || !presentationTitle}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {generationStep || 'Generating...'}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Google Slides
              </>
            )}
          </Button>

          {/* Info Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI generates professional slide content based on your selection</li>
                  <li>• Creates a new Google Slides presentation in your account</li>
                  <li>• Applies your chosen design preferences</li>
                  <li>• Embeds the presentation in your learning module</li>
                  <li>• Provides a shareable link for easy access</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}