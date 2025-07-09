import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit3, Save, FileText, RefreshCw, X, Image, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ModuleImageGenerator from '@/components/ModuleImageGenerator';
import VisualContentFinder from '@/components/MemeFinder';
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

  useEffect(() => {
    console.log(content,'new content')
    // Initialize content only once when component mounts or when content changes
    let newContent = '';
    
    if (content?.blocks?.[0]?.content && typeof content.blocks[0].content === 'string') {
      newContent = content.blocks[0].content;
    } else if (content?.content && typeof content.content === 'string') {
      newContent = content.content;
    } else if (typeof content === 'string' && content !== '') {
      newContent = content;
    }
    
    // Ensure we always set a string
    setTextContent(typeof newContent === 'string' ? newContent : '');
  }, [content]);

  const saveChanges = () => {
    const contentString = typeof textContent === 'string' ? textContent : '';
    const updatedContent = {
      blocks: [{
        type: 'text',
        title: 'Text Section',
        content: contentString, // store as markdown
        preview: contentString.substring(0, 200) + (contentString.length > 200 ? '...' : '')
      }]
    };
    console.log(updatedContent,'updated in text editor')
    onContentChange(updatedContent);
    onEditToggle();
  };

  const handleImageGenerated = (imageUrl: string, description: string) => {
    // Insert the AI-generated image into the markdown content
    const imageMarkdown = `![${description}](${imageUrl})`;
    const currentValue = textContent || '';
    const newValue = currentValue + (currentValue ? '\n\n' : '') + imageMarkdown;
    setTextContent(newValue);
    
    toast({
      title: "AI Image Added",
      description: `"${description}" has been generated and added to your content`,
    });
  };

  const handleMemeSelected = (content: { url: string; description: string }) => {
    // Insert the selected meme/GIF/image into the markdown content
    const imageMarkdown = `![${content.description}](${content.url})`;
    const currentValue = textContent || '';
    const newValue = currentValue + (currentValue ? '\n\n' : '') + imageMarkdown;
    setTextContent(newValue);
    
    toast({
      title: "Visual Content Added",
      description: `"${content.description}" has been added to your content`,
    });
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
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{getWordCount()} words</span>
              <span>~{getReadingTime()} min read</span>
            </div>
            <Button onClick={onEditToggle} variant="outline" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Editing mode: use markdown editor with built-in image support + AI image generation + meme finder
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Edit Text Section
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Content Editor
          </Label>
          <div className="text-xs text-gray-500 mb-2">
            💡 Tip: You can drag & drop images, paste from clipboard, use the upload button, generate AI images, or find GIFs/memes
          </div>
        </div>
        
        <CloudinaryMarkdownEditor
          value={textContent}
          onChange={(value) => setTextContent(value || '')}
          height={300}
        />
        
        {/* Visual Content Tools Section */}
        <div className="border-t pt-4 mt-4">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Visual Content Tools</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AI Image Generation */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageGenerator(true)}
                className="w-full flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Generate AI Image
              </Button>
              <p className="text-xs text-gray-500">
                Create custom educational illustrations using AI
              </p>
            </div>

            {/* Meme/GIF Finder */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMemeFinder(true)}
                className="w-full flex items-center gap-2"
              >
                <Smile className="h-4 w-4" />
                Find GIFs & Images
              </Button>
              <p className="text-xs text-gray-500">
                Search GIPHY and Pixabay for engaging visual content
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{getWordCount()} words</span>
            <span>~{getReadingTime()} min read</span>
          </div>
          <div className="flex gap-2">
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
        </div>
      </CardContent>

      {/* AI Image Generator Modal */}
      <ModuleImageGenerator
        open={showImageGenerator}
        onOpenChange={setShowImageGenerator}
        onImageGenerated={handleImageGenerated}
        moduleTitle="Text Section"
        sectionContext="Educational content"
      />

      {/* Visual Content Finder Modal */}
      <VisualContentFinder
        open={showMemeFinder}
        onOpenChange={setShowMemeFinder}
        onMemeSelected={handleMemeSelected}
      />
    </Card>
  );
}