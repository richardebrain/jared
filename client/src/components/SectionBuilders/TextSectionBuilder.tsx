import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit3, Save, BookOpen, FileText, RefreshCw } from 'lucide-react';

interface TextSectionBuilderProps {
  content: any;
  onContentChange: (content: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onRegenerateAI?: () => void;
}

export default function TextSectionBuilder({ content, onContentChange, isEditing, onEditToggle, onRegenerateAI }: TextSectionBuilderProps) {
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    // Initialize content only once when component mounts or when content changes
    let newContent = '';
    if (content?.blocks?.[0]?.content) {
      newContent = content.blocks[0].content;
    } else if (content?.content) {
      newContent = content.content;
    } else if (typeof content === 'string' && content !== '') {
      newContent = content;
    }
    
    setTextContent(newContent);
  }, [content]);

  const saveChanges = () => {
    const updatedContent = {
      blocks: [{
        type: 'text',
        title: 'Text Section',
        content: textContent,
        preview: textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '')
      }]
    };
    onContentChange(updatedContent);
    onEditToggle();
  };

  const getWordCount = () => {
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
                  .replace(/^#{1}\s(.+)/g, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
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
            <Textarea
              id="text-content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your educational content here. You can include key concepts, explanations, examples, and important information for teachers..."
              className="mt-1 min-h-[300px] resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <div className="flex items-center gap-4">
              <span>{getWordCount()} words</span>
              <span>~{getReadingTime()} minute read</span>
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
    </div>
  );
}