import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

interface PowerPointImporterProps {
  onImportComplete: (moduleData: any) => void;
  onBack: () => void;
}

export default function PowerPointImporter({ onImportComplete, onBack }: PowerPointImporterProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          file.type === 'application/vnd.ms-powerpoint' ||
          file.name.endsWith('.pptx') || 
          file.name.endsWith('.ppt')) {
        setUploadedFile(file);
        toast({
          title: "File uploaded successfully",
          description: `Ready to process: ${file.name}`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PowerPoint file (.ppt or .pptx)",
          variant: "destructive"
        });
      }
    }
  };

  const processPresentation = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingStep('Uploading presentation...');

    try {
      const formData = new FormData();
      formData.append('presentation', uploadedFile);

      setProcessingStep('Extracting slide content...');
      
      // Upload and process the PowerPoint file
      const response = await fetch('/api/ai/process-powerpoint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PowerPoint file');
      }

      const result = await response.json();
      
      setProcessingStep('Analyzing content structure...');
      
      // Brief delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('Generating interactive sections...');
      
      // Convert PowerPoint slides to module sections
      const moduleData = {
        title: result.title || uploadedFile.name.replace(/\.(ppt|pptx)$/i, ''),
        description: result.description || 'Module created from PowerPoint presentation',
        category: result.category || 'Imported Content',
        difficulty: 'intermediate',
        estimatedTime: Math.max(10, result.slides?.length * 2 || 15).toString(),
        pointValue: Math.max(20, result.slides?.length * 5 || 30),
        sections: result.slides?.map((slide: any, index: number) => ({
          title: slide.title || `Slide ${index + 1}`,
          content: slide.content || slide.text || 'Content from presentation slide',
          type: slide.hasQuestions ? 'quiz' : 'text',
          videoUrl: '',
          questions: slide.questions || [],
          imageUrl: slide.image || ''
        })) || [
          {
            title: 'Introduction',
            content: 'Content extracted from your presentation will appear here.',
            type: 'text',
            videoUrl: '',
            questions: [],
            imageUrl: ''
          }
        ]
      };

      setProcessingStep('Finalizing module...');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "PowerPoint processed successfully!",
        description: `Created module with ${moduleData.sections.length} sections from your presentation.`,
      });

      onImportComplete(moduleData);
    } catch (error) {
      console.error('Error processing PowerPoint:', error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your PowerPoint file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PowerPoint Import</h2>
          <p className="text-muted-foreground">Transform your existing presentations into interactive learning modules</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Your Presentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Drop your PowerPoint file here</h3>
                <p className="text-muted-foreground">Supports .ppt and .pptx files</p>
              </div>
              <Label htmlFor="powerpoint-upload" className="block mt-4">
                <Button variant="outline" className="cursor-pointer">
                  Choose File
                </Button>
                <input
                  id="powerpoint-upload"
                  type="file"
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <h4 className="font-medium">{uploadedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          )}

          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">{processingStep}</span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  AI is analyzing your presentation and creating interactive sections...
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-500 animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={processPresentation} 
                disabled={!uploadedFile}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Process Presentation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFile && !isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center mt-0.5">1</div>
                <div>
                  <h4 className="font-medium">Content Extraction</h4>
                  <p className="text-sm text-muted-foreground">AI extracts text, images, and structure from your slides</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center mt-0.5">2</div>
                <div>
                  <h4 className="font-medium">Interactive Enhancement</h4>
                  <p className="text-sm text-muted-foreground">Converts static content into engaging learning sections</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center mt-0.5">3</div>
                <div>
                  <h4 className="font-medium">Module Creation</h4>
                  <p className="text-sm text-muted-foreground">Generates a complete learning module ready for sharing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}