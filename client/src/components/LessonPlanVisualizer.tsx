import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Download, Copy, Wand2 } from "lucide-react";

const MAX_IMAGES_PER_DAY = 5;

interface LessonPlanVisualizerProps {
  lessonPlanText?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

// Helper function to extract key information from lesson plan text
const extractLessonSummary = (text: string) => {
  const defaultSummary = {
    theme: "educational activities",
    ageGroup: "preschool",
    activities: [],
    objectives: [],
    title: ""
  };

  if (!text || text.trim().length === 0) {
    return defaultSummary;
  }

  // Extract title/theme - look for common patterns
  const titleMatches = text.match(/^([^.\n]{3,50})/i) ||
                      text.match(/(?:theme|topic|subject|title):\s*([^.\n]+)/i) ||
                      text.match(/(?:learning about|exploring|studying)\s+([^.\n,]+)/i);
  
  let title = titleMatches ? titleMatches[1].trim() : "Weekly Lesson Plan";
  title = title.replace(/[^\w\s-]/g, '').substring(0, 50);
  
  let theme = title.toLowerCase();
  if (!theme) theme = "educational activities";

  // Extract age group
  const ageMatches = text.match(/(?:age|ages|years?):\s*([^.\n]+)/i) ||
                    text.match(/(\d+[-–]\d+\s*(?:years?|months?))/i) ||
                    text.match(/(infant|toddler|preschool|pre-k|kindergarten)/i);
  
  let ageGroup = ageMatches ? ageMatches[1].trim() : "preschool";
  ageGroup = ageGroup.toLowerCase().replace(/[^\w\s-]/g, '');

  // Extract activities - look for bulleted lists or numbered items
  const activityMatches = text.match(/(?:activit(?:y|ies)|exercise|task):\s*([^.\n]+)/gi) ||
                         text.match(/(?:^|\n)\s*[-•*]\s*([^.\n]{5,100})/gm) ||
                         text.match(/(?:^|\n)\s*\d+\.\s*([^.\n]{5,100})/gm);
  
  const activities = activityMatches ? 
    activityMatches.slice(0, 5).map(match => 
      match.replace(/^(?:activit(?:y|ies)|exercise|task):\s*|^[-•*\d.\s]+/i, '').trim()
    ) : [];

  // Extract learning objectives
  const objectiveMatches = text.match(/(?:objective|goal|learn|understand):\s*([^.\n]+)/gi) ||
                          text.match(/(?:students will|children will)\s+([^.\n]+)/gi);
  
  const objectives = objectiveMatches ? 
    objectiveMatches.slice(0, 3).map(match => 
      match.replace(/^(?:objective|goal|learn|understand):\s*|(?:students will|children will)\s+/i, '').trim()
    ) : [];

  return { theme, ageGroup, activities, objectives, title };
};

const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/ai/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        size: "1024x1024",
        quality: "standard", // Using standard quality (medium) as requested
        style: "vivid"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.imageUrl || null;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export default function LessonPlanVisualizer({ 
  lessonPlanText = "", 
  onImageGenerated 
}: LessonPlanVisualizerProps) {
  const [lessonText, setLessonText] = useState(lessonPlanText);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [style, setStyle] = useState("whimsical");
  const [purpose, setPurpose] = useState("outline");
  const [audience, setAudience] = useState("parents");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (imageCount >= MAX_IMAGES_PER_DAY || !lessonText.trim()) {
      toast({
        title: "Unable to generate",
        description: imageCount >= MAX_IMAGES_PER_DAY 
          ? "Daily image limit reached. Please try again tomorrow."
          : "Please enter lesson plan content first.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Extract key elements from lesson plan to create a concise prompt
      const lessonSummary = extractLessonSummary(lessonText);
      let promptBase = "";

      switch (purpose) {
        case "formatted":
          // Extract the actual lesson plan content to format it beautifully
          const lessonContent = lessonText.slice(0, 400); // Keep under character limit but include real content
          promptBase = `Create a beautifully formatted lesson plan poster for ${audience}. Use this exact content: "${lessonContent}". Format it with attractive typography, colorful headers, and bulletin board style layout. Make it parent-friendly and visually appealing for classroom display.`;
          break;
        case "wall-display":
          promptBase = `Create a ${style} classroom wall poster for ${audience}. Title: "${lessonSummary.title}" for ${lessonSummary.ageGroup}. Include visual activity icons, colorful borders, and space for daily activities. Classroom-ready design.`;
          break;
        case "sections":
          promptBase = `Create ${style} educational illustrations for ${audience}. Show ${lessonSummary.theme} learning activities for ${lessonSummary.ageGroup}. Focus on visual elements without text to avoid spelling errors.`;
          break;
        default: // outline
          promptBase = `Create a ${style} infographic overview for ${audience}. Theme: ${lessonSummary.theme} for ${lessonSummary.ageGroup}. Use icons and visual elements, minimal text. Colorful, engaging educational design.`;
          break;
      }
      
      const imageUrl = await generateImageFromPrompt(promptBase);
      
      if (imageUrl) {
        setImageURL(imageUrl);
        setImageCount(prev => prev + 1);
        onImageGenerated?.(imageUrl);
        
        toast({
          title: "Visual Generated!",
          description: "Your lesson plan visual has been created successfully.",
        });
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate visual. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!imageURL) return;
    
    try {
      const response = await fetch(imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lesson-plan-visual-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Visual saved to your downloads folder.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download image. Please try right-clicking and saving manually.",
        variant: "destructive"
      });
    }
  };

  const copyImageToClipboard = async () => {
    if (!imageURL) return;
    
    try {
      await navigator.clipboard.writeText(imageURL);
      toast({
        title: "Link Copied",
        description: "Image URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          Visualize Your Lesson Plan
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Transform your lesson plan into beautiful, shareable visuals using AI. Choose from infographics, formatted lesson plans, or wall display posters.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lesson Plan Content Input */}
        <div>
          <Label htmlFor="lesson-content">Lesson Plan Content</Label>
          <Textarea
            id="lesson-content"
            placeholder="Paste your lesson plan here or let it auto-fill from your created plan..."
            value={lessonText}
            onChange={(e) => setLessonText(e.target.value)}
            rows={6}
            className="mt-2"
          />
        </div>

        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="visual-type">Visual Type</Label>
            <Select onValueChange={setPurpose} defaultValue="outline">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select visual type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outline">Infographic Overview</SelectItem>
                <SelectItem value="sections">Section-by-Section Images</SelectItem>
                <SelectItem value="formatted">Pretty Formatted Plan</SelectItem>
                <SelectItem value="wall-display">Wall Display Poster</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {purpose === "formatted" && "Takes your actual lesson plan text and formats it beautifully for bulletin board display"}
              {purpose === "wall-display" && "Colorful poster with activity spaces for classroom walls"}
              {purpose === "sections" && "Visual illustrations without text to avoid spelling errors"}
              {purpose === "outline" && "Overview infographic with icons and minimal text"}
            </p>
          </div>

          <div>
            <Label htmlFor="style">Visual Style</Label>
            <Select onValueChange={setStyle} defaultValue="whimsical">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whimsical">Playful & Whimsical</SelectItem>
                <SelectItem value="modern">Clean & Modern</SelectItem>
                <SelectItem value="storybook">Storybook Style</SelectItem>
                <SelectItem value="realistic">Photographic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Select onValueChange={setAudience} defaultValue="parents">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="training">Teacher Training</SelectItem>
                <SelectItem value="parents">Parent Handout</SelectItem>
                <SelectItem value="app">Classroom Display</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || imageCount >= MAX_IMAGES_PER_DAY || !lessonText.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Visual...
            </>
          ) : (
            <>
              <Image className="h-4 w-4 mr-2" />
              Generate Visual ({MAX_IMAGES_PER_DAY - imageCount} remaining today)
            </>
          )}
        </Button>

        {/* Generated Image Display */}
        {imageURL && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Visual</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadImage}
                  className="flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyImageToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={imageURL} 
                alt="Generated Lesson Plan Visual" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Visual generated with {style} style for {audience} use
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Tips for Better Visuals</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Include specific details about activities and materials</li>
            <li>• Mention age groups and learning objectives</li>
            <li>• Describe the setting and classroom setup</li>
            <li>• Include any special themes or concepts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}