import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Square, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Flashcard {
  term: string;
  definition: string;
  id?: string;
}

interface FlashcardComponentProps {
  flashcards: Flashcard[];
  title?: string;
  onComplete?: () => void;
}

export function FlashcardComponent({ flashcards, title = "Key Terms", onComplete }: FlashcardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [isNarrating, setIsNarrating] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const currentCard = flashcards[currentIndex];
  const isComplete = studiedCards.size === flashcards.length;

  // Generate ElevenLabs narration for the current card
  const generateNarration = async (text: string) => {
    try {
      setIsNarrating(true);
      
      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        body: JSON.stringify({
          text: `${currentCard.term}. ${text}`,
          voiceType: 'friendly-female',
          speed: 0.9
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.audioUrl) {
        setAudioBlob(data.audioUrl);
        // Auto-play the audio
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Narration Error",
        description: "Could not generate audio narration. Using text-to-speech fallback.",
        variant: "destructive"
      });
      
      // Fallback to browser TTS
      fallbackTTS(text);
    } finally {
      setIsNarrating(false);
    }
  };

  // Fallback text-to-speech using browser API
  const fallbackTTS = (text: string) => {
    if (!window.speechSynthesis) {
      toast({
        title: "Audio Unavailable",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${currentCard.term}. ${text}`);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Navigate to next card
  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setAudioBlob(null);
    }
  };

  // Navigate to previous card
  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setAudioBlob(null);
    }
  };

  // Mark card as studied
  const markAsStudied = () => {
    const newStudied = new Set(studiedCards);
    newStudied.add(currentIndex);
    setStudiedCards(newStudied);
    
    if (newStudied.size === flashcards.length && onComplete) {
      toast({
        title: "Flashcards Complete!",
        description: "You've studied all the key terms. Great work!",
      });
      onComplete();
    }
  };

  // Reset all cards
  const resetCards = () => {
    setStudiedCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setAudioBlob(null);
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No flashcards available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="text-sm text-green-600">
            {studiedCards.size} studied
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(studiedCards.size / flashcards.length) * 100}%` }}
        ></div>
      </div>

      {/* Flashcard */}
      <Card className={`relative h-64 cursor-pointer transition-all duration-300 ${isFlipped ? 'transform-gpu' : ''} ${studiedCards.has(currentIndex) ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
        <div className="absolute inset-0 flex flex-col">
          {!isFlipped ? (
            // Front of card - Term
            <CardHeader className="flex-1 flex items-center justify-center text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {currentCard.term}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">Click to reveal definition</p>
            </CardHeader>
          ) : (
            // Back of card - Definition
            <CardContent className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="text-lg font-medium text-gray-700 mb-2">
                  {currentCard.term}
                </div>
                <div className="text-gray-600 leading-relaxed">
                  {currentCard.definition}
                </div>
              </div>
            </CardContent>
          )}
          
          {/* Card click area */}
          <div 
            className="absolute inset-0 z-10"
            onClick={() => setIsFlipped(!isFlipped)}
          ></div>
        </div>
      </Card>

      {/* Audio player (hidden) */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <Button
          onClick={prevCard}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {isFlipped && (
            <Button
              onClick={() => generateNarration(currentCard.definition)}
              disabled={isNarrating}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {isNarrating ? (
                <>
                  <Square className="h-4 w-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Listen
                </>
              )}
            </Button>
          )}

          {isFlipped && !studiedCards.has(currentIndex) && (
            <Button
              onClick={markAsStudied}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Mark as Studied
            </Button>
          )}

          {studiedCards.has(currentIndex) && (
            <div className="flex items-center text-green-600 text-sm">
              <span className="mr-1">✓</span>
              Studied
            </div>
          )}
        </div>

        <Button
          onClick={nextCard}
          disabled={currentIndex === flashcards.length - 1}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Reset button when complete */}
      {isComplete && (
        <div className="text-center pt-4">
          <Button
            onClick={resetCards}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Study Again
          </Button>
        </div>
      )}
    </div>
  );
}