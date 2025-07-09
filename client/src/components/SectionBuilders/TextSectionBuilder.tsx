import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit3, Save, BookOpen, FileText, RefreshCw, Image, Plus, X, Upload, Smile } from 'lucide-react';
import ModuleImageGenerator from '@/components/ModuleImageGenerator';
import MemeFinder from '@/components/MemeFinder';
import VoiceInputTextarea from '@/components/VoiceInputTextarea';
import { useToast } from '@/hooks/use-toast';
import ModuleVoiceInput from '@/components/ModuleVoiceInput';
import CloudinaryMarkdownEditor from '@/components/CloudinaryMarkdownEditor';
import MarkdownPreview from '@uiw/react-markdown-preview';
import '@uiw/react-markdown-preview/markdown.css';

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
  const [showMemeFinder, setShowMemeFinder] = useState(false);
  const [sectionImages, setSectionImages] = useState<Array<{url: string, description: string}>>([]);

  useEffect(() => {
    console.log(content,'new content')
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
        content: contentString, // store as markdown
        images: sectionImages,
        preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
      }]
    };
    console.log(updatedContent,'updated in text editor')
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

  const handleMemeSelected = (meme: { url: string; description: string }) => {
    const newImage = { 
      url: meme.url, 
      description: meme.description 
    };
    const updatedImages = [...sectionImages, newImage];
    setSectionImages(updatedImages);
    
    // Auto-save the content with new meme immediately
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
    
    // Show success feedback
    console.log('Meme added and auto-saved:', newImage.description);
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownPreview source={textContent || ''} />
          {/* Display selected images and memes */}
          {content?.blocks?.[0]?.images && content.blocks[0].images.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Added Images & Memes:</h4>
              <div className="grid grid-cols-2 gap-3">
                {content.blocks[0].images.map((image: any, index: number) => (
                  <div key={index} className="border rounded-lg p-2 bg-white">
                    <img
                      src={image.url}
                      alt={image.description || 'Module image'}
                      className="w-full h-32 object-contain rounded"
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      {image.description || 'Image'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button onClick={onEditToggle} variant="outline" className="mt-4 flex items-center gap-2">
            <Edit3 className="h-4 w-4" /> Edit
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Editing mode: use markdown editor
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Edit Text Section
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CloudinaryMarkdownEditor
          value={textContent}
          onChange={(value) => setTextContent(value || '')}
          height={300}
        />
        {/* Image Generation Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label>Educational Illustrations</Label>
            <div className="flex flex-wrap gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMemeFinder(true)}
                className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
              >
                <Smile className="h-4 w-4 mr-2" />
                Visual Content
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
        <div className="flex gap-2 mt-4">
          <Button onClick={saveChanges} variant="default" className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button onClick={onEditToggle} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </Button>
          {onRegenerateAI && (
            <Button onClick={onRegenerateAI} variant="ghost" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Regenerate with AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}