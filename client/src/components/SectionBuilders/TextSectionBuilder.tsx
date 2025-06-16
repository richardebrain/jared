import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit3, Save, BookOpen, FileText, RefreshCw, Image, Plus, X, Upload } from 'lucide-react';
import ModuleImageGenerator from '@/components/ModuleImageGenerator';
import VoiceInputTextarea from '@/components/VoiceInputTextarea';
import { useToast } from '@/hooks/use-toast';

interface TextSectionBuilderProps {
  content: any;
  onContentChange: (content: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onRegenerateAI?: () => void;
}

export default function TextSectionBuilder({ content, onContentChange, isEditing, onEditToggle, onRegenerateAI }: TextSectionBuilderProps) {
  const { toast } = useToast();
  const [textContent, setTextContent] = useState('');
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [sectionImages, setSectionImages] = useState<Array<{url: string, description: string}>>([]);

  useEffect(() => {
    // Initialize content only once when component mounts or when content changes
    let newContent = '';
    let images = [];
    
    if (content?.blocks?.[0]?.content && typeof content.blocks[0].content === 'string') {
      newContent = content.blocks[0].content;
      images = content.blocks[0].images || [];
    } else if (content?.content && typeof content.content === 'string') {
      newContent = content.content;
      images = content.images || [];
    } else if (typeof content === 'string' && content !== '') {
      newContent = content;
    }
    
    // Ensure we always set a string
    setTextContent(typeof newContent === 'string' ? newContent : '');
    setSectionImages(images);
  }, [content]);

  const saveChanges = () => {
    const contentString = typeof textContent === 'string' ? textContent : '';
    const updatedContent = {
      blocks: [{
        type: 'text',
        title: 'Text Section',
        content: contentString,
        images: sectionImages,
        preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
      }]
    };
    onContentChange(updatedContent);
    onEditToggle();
  };

  const handleImageGenerated = (imageUrl: string, description: string) => {
    const newImage = { url: imageUrl, description };
    const updatedImages = [...sectionImages, newImage];
    setSectionImages(updatedImages);
    
    // Auto-save the content with new image
    const contentString = typeof textContent === 'string' ? textContent : '';
    const updatedContent = {
      blocks: [{
        type: 'text',
        title: 'Text Section',
        content: contentString,
        images: updatedImages,
        preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
      }]
    };
    onContentChange(updatedContent);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    // Create a data URL for the image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newImage = { 
        url: imageUrl, 
        description: file.name.replace(/\.[^/.]+$/, '') // Remove file extension for description
      };
      const updatedImages = [...sectionImages, newImage];
      setSectionImages(updatedImages);
      
      // Auto-save the content with new image immediately
      const contentString = typeof textContent === 'string' ? textContent : '';
      const updatedContent = {
        blocks: [{
          type: 'text',
          title: 'Text Section',
          content: contentString,
          images: updatedImages,
          preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
        }]
      };
      
      // Immediately persist the content change
      onContentChange(updatedContent);
      
      // Show success feedback with toast notification
      console.log('Image uploaded and auto-saved:', newImage.description);
      
      // Show toast notification for successful upload and save
      toast({
        title: "Image Uploaded & Saved!",
        description: `"${newImage.description}" has been uploaded and automatically saved to your module.`,
        variant: "default",
      });
    };
    reader.readAsDataURL(file);

    // Reset the input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const updatedImages = sectionImages.filter((_, i) => i !== index);
    setSectionImages(updatedImages);
    
    // Auto-save the content with image removed
    const contentString = typeof textContent === 'string' ? textContent : '';
    const updatedContent = {
      blocks: [{
        type: 'text',
        title: 'Text Section',
        content: contentString,
        images: updatedImages,
        preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
      }]
    };
    onContentChange(updatedContent);
  };

  const getWordCount = () => {
    if (typeof textContent !== 'string') return 0;
    return textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    const minutes = Math.ceil(words / 200); // Average reading speed
    return minutes;
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Text Content</Badge>
            <span className="text-sm text-gray-600">{getWordCount()} words</span>
            <span className="text-sm text-gray-600">• ~{getReadingTime()} min read</span>
          </div>
          <div className="flex gap-2">
            {onRegenerateAI && (
              <Button variant="outline" size="sm" onClick={onRegenerateAI}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEditToggle}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Content
            </Button>
          </div>
        </div>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Educational Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {textContent.split('\n').map((paragraph, index) => {
                if (!paragraph.trim()) return <br key={index} />;
                
                // Render markdown formatting
                const formattedParagraph = paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^#{3}\s(.+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                  .replace(/^#{2}\s(.+)/g, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
                  .replace(/^#{1}\s(.+)/g, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>').replace(/^#{4}\s(.+)/g, '<h1 class="text-3xl font-bold mt-4 mb-2">$1</h1>')
                  .replace(/^-\s(.+)/g, '<li class="ml-4">$1</li>');
                
                return (
                  <div 
                    key={index} 
                    className="mb-3 text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Text Content Editor</h3>
          <p className="text-sm text-gray-600">Create educational text content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditToggle}>Cancel</Button>
          <Button onClick={saveChanges}>
            <Save className="h-4 w-4 mr-1" />
            Save Content
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text-content">Educational Content</Label>
            <VoiceInputTextarea
              value={textContent}
              onChange={(value) => setTextContent(value)}
              placeholder="Enter your educational content here. You can include key concepts, explanations, examples, and important information for teachers..."
              className="mt-1 min-h-[300px] resize-none"
            />
          </div>

          {/* Image Generation Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Educational Illustrations</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageGenerator(true)}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Generate Image
                </Button>
              </div>
            </div>
            
            {sectionImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {sectionImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.description}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs bg-black/70 text-white p-1 rounded truncate">
                        {image.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <div className="flex items-center gap-4">
              <span>{getWordCount()} words</span>
              <span>~{getReadingTime()} minute read</span>
              {sectionImages.length > 0 && (
                <span>{sectionImages.length} image{sectionImages.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="text-xs">
              Tip: Use clear headings and bullet points for better readability
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-base">Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded">
            {textContent ? (
              textContent.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-gray-400 italic">Your content preview will appear here as you type...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Generator Dialog */}
      <ModuleImageGenerator
        open={showImageGenerator}
        onOpenChange={setShowImageGenerator}
        onImageGenerated={handleImageGenerated}
        moduleTitle="Text Section"
        sectionContext="Educational Content"
      />
    </div>
  );
}