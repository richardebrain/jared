import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Enhanced narration component that uses chunking for reliability
export function StoryNarration({
  storyId,
  voiceType = "female"
}: {
  storyId: string;
  storyText?: string;
  voiceType?: "male" | "female";
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const { toast } = useToast();
  
  // Function to split text into manageable chunks
  const splitIntoChunks = (text: string, maxLength = 200): string[] => {
    // First split by paragraphs (most natural breaks)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    
    for (const paragraph of paragraphs) {
      // If paragraph is shorter than max length, use it as a chunk
      if (paragraph.length <= maxLength) {
        chunks.push(paragraph);
        continue;
      }
      
      // Otherwise, split at sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [];
      let currentChunk = "";
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length <= maxLength) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      }
      
      if (currentChunk) chunks.push(currentChunk);
    }
    
    return chunks;
  };
  
  // Speak a specific chunk
  const speakChunk = (chunkIndex: number) => {
    if (!window.speechSynthesis || !chunksRef.current.length || chunkIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      return;
    }
    
    const chunk = chunksRef.current[chunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Handle voice selection with a more robust approach
    let voices = window.speechSynthesis.getVoices();
    
    // Set a default language based on voice type preference
    utterance.lang = voiceType === 'female' ? 'en-US' : 'en-GB';
    
    // Try to find an appropriate voice
    const voice = findAppropriateVoice(voices, voiceType);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Helper function to find an appropriate voice
    function findAppropriateVoice(voiceList: SpeechSynthesisVoice[], type: string) {
      // First try to find a voice that includes the type in its name
      let voice = voiceList.find(v => 
        v.name.toLowerCase().includes(type.toLowerCase())
      );
      
      // If that fails, try to find any female/male voice based on common voice naming patterns
      if (!voice) {
        if (type === 'female') {
          voice = voiceList.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('woman') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria')
          );
        } else {
          voice = voiceList.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('man') ||
            v.name.includes('David') ||
            v.name.includes('Tom') ||
            v.name.includes('Daniel')
          );
        }
      }
      
      // If all else fails, just return any English voice
      if (!voice) {
        voice = voiceList.find(v => v.lang.startsWith('en'));
      }
      
      return voice;
    }
    
    // When this chunk ends, play the next one
    utterance.onend = () => {
      const nextIndex = chunkIndex + 1;
      if (nextIndex < chunksRef.current.length) {
        setCurrentChunkIndex(nextIndex);
        speakChunk(nextIndex);
      } else {
        // All chunks have been spoken
        setIsPlaying(false);
        setCurrentChunkIndex(0);
      }
    };
    
    utterance.onerror = () => {
      console.error("Error speaking chunk", chunkIndex);
      // Try to continue with next chunk
      const nextIndex = chunkIndex + 1;
      if (nextIndex < chunksRef.current.length) {
        setCurrentChunkIndex(nextIndex);
        speakChunk(nextIndex);
      } else {
        setIsPlaying(false);
        setCurrentChunkIndex(0);
      }
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  };
  
  // Start or stop narration
  const toggleSpeech = () => {
    if (isPlaying) {
      // Stop current narration
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setCurrentChunkIndex(0);
      return;
    }
    
    // Start new narration
    if (!window.speechSynthesis) {
      toast({
        title: "Narration Unavailable",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get the story text
      const storyElement = document.getElementById(storyId);
      if (!storyElement) {
        toast({
          title: "Narration Error",
          description: "Couldn't find the story content.",
          variant: "destructive",
        });
        return;
      }
      
      const text = storyElement.textContent || "";
      if (!text.trim()) {
        toast({
          title: "Narration Error",
          description: "No text to narrate.",
          variant: "destructive",
        });
        return;
      }
      
      // Split into chunks for reliable narration
      chunksRef.current = splitIntoChunks(text);
      
      // Fix for Chrome and some browsers that pause speech synthesis when tab is inactive
      if (typeof window !== 'undefined') {
        // Keep synthesis active even when page loses focus
        window.onblur = () => {
          if (isPlaying && window.speechSynthesis) {
            window.speechSynthesis.resume();
          }
        };
        
        // Ensure speech synthesis is resumed when page gets focus
        window.onfocus = () => {
          if (isPlaying && window.speechSynthesis) {
            window.speechSynthesis.resume();
          }
        };
      }
      
      // Start narration with first chunk
      setIsPlaying(true);
      setCurrentChunkIndex(0);
      speakChunk(0);
      
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
  
  // Clean up on unmount
  useEffect(() => {
    // Set up a regular interval to keep speech synthesis active
    // This addresses a Chrome bug where speech synthesis pauses after ~15 seconds
    const keepAliveInterval = setInterval(() => {
      if (isPlaying && window.speechSynthesis) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000); // Keep alive every 10 seconds
    
    return () => {
      clearInterval(keepAliveInterval);
      if (isPlaying) {
        window.speechSynthesis?.cancel();
      }
      // Remove window event handlers
      if (typeof window !== 'undefined') {
        window.onblur = null;
        window.onfocus = null;
      }
    };
  }, [isPlaying]);
  
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