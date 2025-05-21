import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Ultra-simplified version of narration to ensure reliability
export function StoryNarration({
  storyId,
  voiceType = "female"
}: {
  storyId: string;
  storyText?: string; // Optional now as we'll get text directly from the element
  voiceType?: "male" | "female";
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Simple function to toggle speech
  const toggleSpeech = () => {
    // If already playing, stop all speech
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    // Make sure we have speech synthesis
    if (!window.speechSynthesis) {
      toast({
        title: "Narration Unavailable",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the text from the story element
      const storyElement = document.getElementById(storyId);
      if (!storyElement) {
        toast({
          title: "Narration Error",
          description: "Couldn't find the story content.",
          variant: "destructive",
        });
        return;
      }

      // Get the text (simplified approach)
      const text = storyElement.textContent || "";
      if (!text.trim()) {
        toast({
          title: "Narration Error",
          description: "No text to narrate.",
          variant: "destructive",
        });
        return;
      }

      // Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1;
      
      // Handle voice selection
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a voice matching the requested gender
        const preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(voiceType.toLowerCase())
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Set up events
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "Narration Error",
          description: "An error occurred while narrating.",
          variant: "destructive",
        });
      };

      // Start narration
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);

      // Show toast
      toast({
        title: "Narration Started",
        description: "Click the button again to stop narration.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Speech synthesis error:", error);
      toast({
        title: "Narration Error",
        description: "There was a problem starting the narration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className={`flex items-center gap-1 ${isPlaying ? 'bg-primary/10' : ''}`}
      onClick={toggleSpeech}
    >
      {isPlaying ? (
        <>Stop Narration <Square className="h-4 w-4 ml-1" /></>
      ) : (
        <>Listen to Story <Volume2 className="h-4 w-4 ml-1" /></>
      )}
    </Button>
  );
}