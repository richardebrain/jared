import React, { useState, useCallback } from 'react';
import MDEditor, { commands, CommandOrchestrator } from '@uiw/react-md-editor';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface CloudinaryMarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  height?: number;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function CloudinaryMarkdownEditor({
  value,
  onChange,
  height = 300,
  placeholder,
  className,
  readOnly = false
}: CloudinaryMarkdownEditorProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload to Cloudinary
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/markdown/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        // Insert the image URL into the markdown content
        const imageMarkdown = `![${file.name}](${result.url})`;
        const currentValue = value || '';
        const newValue = currentValue + (currentValue ? '\n' : '') + imageMarkdown;
        onChange(newValue);

        toast({
          title: "Image Uploaded Successfully",
          description: `${file.name} has been uploaded and inserted into your content`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [value, onChange, toast]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please drop an image file",
        variant: "destructive"
      });
    }
  }, [handleImageUpload, toast]);

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        handleImageUpload(file);
      }
    }
  }, [handleImageUpload]);

  // Add paste event listener
  React.useEffect(() => {
    if (readOnly) return;

    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', handlePasteEvent);
    
    return () => {
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePaste, readOnly]);

  // Custom upload command
  const uploadCommand = {
    name: 'upload-image',
    keyCommand: 'upload-image',
    buttonProps: { 'aria-label': 'Upload Image' },
    icon: (
      <div className="flex items-center gap-1">
        <Upload className="h-4 w-4" />
        <span className="text-xs">Upload</span>
      </div>
    ),
    execute: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleImageUpload(file);
        }
      };
      input.click();
    },
  };

  // Combine default commands with upload command
  const allCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.quote,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
    commands.codeBlock,
    commands.code,
    uploadCommand, // Add upload command
    commands.link,
    commands.image,
    commands.table,
    commands.help,
    commands.fullscreen,
  ];

  return (
    <div 
      className={`cloudinary-markdown-editor ${className || ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={readOnly ? undefined : onChange}
          height={height}
          preview={readOnly ? "preview" : "edit"}
          commands={readOnly ? undefined : allCommands}
          className="border rounded-lg"
        />
      </div>
      
      {/* Upload overlay when uploading */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Uploading image...</span>
          </div>
        </div>
      )}

      {/* Upload hint */}
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <ImageIcon className="h-3 w-3" />
          <span>
            Drag & drop images, paste from clipboard, or use the upload button
          </span>
        </div>
      )}
    </div>
  );
} 