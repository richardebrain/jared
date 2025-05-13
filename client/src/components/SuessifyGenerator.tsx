import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Book, PenTool, Sparkles, Copy, BookOpenText, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const examplePrompts = [
  "Jonny is using walking feet today in class",
  "Emma shared her toys with her friends",
  "The class worked together to clean up quickly",
  "Max helped his friend tie their shoes",
  "Lily tried something new at snack time",
  "Zoe used kind words when she was upset",
  "The children discovered a butterfly in the garden"
];

export function SuessifyGenerator() {
  const [prompt, setPrompt] = useState('');
  const [poem, setPoem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [randomPrompt, setRandomPrompt] = useState(examplePrompts[0]);
  const { toast } = useToast();

  // Rotate through example prompts every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = examplePrompts.indexOf(randomPrompt);
      const nextIndex = (currentIndex + 1) % examplePrompts.length;
      setRandomPrompt(examplePrompts[nextIndex]);
    }, 5000);
    return () => clearInterval(interval);
  }, [randomPrompt]);

  const handleGeneratePoem = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Oops!",
        description: "Please enter a situation or achievement first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPoem('');

    try {
      const response = await fetch('/api/perplexity/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Create a short, fun Dr. Seuss style poem (max 8 lines) for preschool children about the following situation. Make it simple, rhyming, and positive: "${prompt}". The poem should be very short and simple enough for young children to understand.`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate poem');
      }

      const data = await response.json();
      setPoem(data.content);
    } catch (error) {
      console.error('Error generating poem:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to create your Dr. Seuss poem. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseExample = () => {
    setPrompt(randomPrompt);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(poem);
    toast({
      title: "Copied!",
      description: "Poem copied to clipboard.",
      variant: "default"
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-3">
            <Book className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl">Suessify Generator</CardTitle>
        </div>
        <CardDescription>
          Transform any classroom moment into a fun Dr. Seuss-style poem to share with your students!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="situation">Describe a situation or achievement</Label>
          <div className="flex gap-2">
            <Input
              id="situation"
              placeholder={`For example: "${randomPrompt}"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUseExample}
              className="whitespace-nowrap"
            >
              <BookOpenText className="h-4 w-4 mr-2" />
              Use Example
            </Button>
          </div>
        </div>

        {poem && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <Label>Your Dr. Seuss-style Poem</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="font-medium italic whitespace-pre-line text-center">
                  {poem}
                </div>
                <div className="flex justify-center mt-4">
                  <PenTool className="h-4 w-4 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGeneratePoem} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              Creating Poetry...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Suessify!
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}