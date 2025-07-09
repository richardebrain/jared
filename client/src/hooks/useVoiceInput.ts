import { useState, useEffect, useRef } from 'react';

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
  autoFormat?: boolean;
  pauseThreshold?: number; // milliseconds to wait before considering speech ended
  debug?: boolean; // Show original vs formatted text
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  const {
    onResult,
    onError,
    continuous = false,
    language = 'en-US',
    autoFormat = true,
    pauseThreshold = 2000, // 2 seconds default
    debug = false
  } = options;

  // Smart text formatting function with intelligent punctuation
  const formatText = (text: string): string => {
    if (!autoFormat) return text;

    // Don't over-process very short phrases
    if (text.trim().length < 10) {
      return text
        .replace(/\s+/g, ' ')
        .trim();
    }

    return text
      // Remove filler words and sounds
      .replace(/\b(um|uh|er|ah|like|you know|i mean|basically|actually)\b/gi, '')

      // Normalize whitespace first
      .replace(/\s+/g, ' ')
      .trim()

      // Smart sentence detection and capitalization
      .replace(/(^|\. |! |\? |\n)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())

      // Detect and add missing periods at the end of sentences
      .replace(/([a-z])\s*$/i, '$1.')

      // Smart question detection - only add question marks for complete questions
      .replace(/\b(what|when|where|who|why|how|which|whose|whom)\b\s+([^.!?]+?)(?=\s*$)/gi, (match, questionWord, rest) => {
        // Only add question mark if it's a complete question ending
        const trimmedRest = rest.trim();
        if (trimmedRest && !trimmedRest.endsWith('.')) {
          // Check if it's a complete question (has a verb and seems like a full question)
          const hasVerb = /\b(is|are|do|does|did|can|could|will|would|should|have|has|had)\b/i.test(trimmedRest);
          const isComplete = trimmedRest.length > 10 || hasVerb; // More conservative approach
          if (isComplete) {
            return `${questionWord} ${trimmedRest}?`;
          }
        }
        return match;
      })

      // Only convert to question if it's clearly a question and ends with a period
      .replace(/\b(what|when|where|who|why|how|which|whose|whom)\b\s+([^.!?]+?)\.$/gi, (match, questionWord, rest) => {
        const trimmedRest = rest.trim();
        // Only convert if it's a complete question
        if (trimmedRest.length > 5 && /\b(is|are|do|does|did|can|could|will|would|should)\b/i.test(trimmedRest)) {
          return `${questionWord} ${trimmedRest}?`;
        }
        return match;
      })

      // Smart comma insertion based on natural speech patterns
      .replace(/([^,.])\s+(and|or|but|however|therefore|meanwhile|furthermore|moreover|nevertheless|consequently)\s+/gi, '$1, $2 ')

      // Add commas before conjunctions in compound sentences
      .replace(/([^,.])\s+(and|or|but)\s+([A-Z][a-z])/g, '$1, $2 $3')

      // Fix spacing around punctuation
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.,!?])([A-Za-z])/g, '$1 $2')

      // Ensure proper spacing after punctuation
      .replace(/([.!?])\s*([a-z])/g, '$1 $2')

      // Fix common speech recognition issues
      .replace(/\b(i)\b/gi, 'I') // Capitalize "I"
      .replace(/\b(im)\b/gi, "I'm") // Fix "im" to "I'm"
      .replace(/\b(ive)\b/gi, "I've") // Fix "ive" to "I've"
      .replace(/\b(ill)\b/gi, "I'll") // Fix "ill" to "I'll"
      .replace(/\b(id)\b/gi, "I'd") // Fix "id" to "I'd"

      // Fix common contractions
      .replace(/\b(dont)\b/gi, "don't")
      .replace(/\b(cant)\b/gi, "can't")
      .replace(/\b(wont)\b/gi, "won't")
      .replace(/\b(shouldnt)\b/gi, "shouldn't")
      .replace(/\b(couldnt)\b/gi, "couldn't")
      .replace(/\b(wouldnt)\b/gi, "wouldn't")
      .replace(/\b(havent)\b/gi, "haven't")
      .replace(/\b(hasnt)\b/gi, "hasn't")
      .replace(/\b(hadnt)\b/gi, "hadn't")
      .replace(/\b(isnt)\b/gi, "isn't")
      .replace(/\b(arent)\b/gi, "aren't")
      .replace(/\b(wasnt)\b/gi, "wasn't")
      .replace(/\b(werent)\b/gi, "weren't")

      // Fix common speech recognition number issues
      .replace(/\b(one)\b/gi, '1')
      .replace(/\b(two)\b/gi, '2')
      .replace(/\b(three)\b/gi, '3')
      .replace(/\b(four)\b/gi, '4')
      .replace(/\b(five)\b/gi, '5')
      .replace(/\b(six)\b/gi, '6')
      .replace(/\b(seven)\b/gi, '7')
      .replace(/\b(eight)\b/gi, '8')
      .replace(/\b(nine)\b/gi, '9')
      .replace(/\b(ten)\b/gi, '10')

      // Fix common abbreviations
      .replace(/\b(etc)\b/gi, 'etc.')
      .replace(/\b(eg)\b/gi, 'e.g.')
      .replace(/\b(ie)\b/gi, 'i.e.')
      .replace(/\b(vs)\b/gi, 'vs.')

      // Ensure proper paragraph breaks for continuous mode
      .replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2')

      // Final cleanup
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/\s+/g, ' ') // Final whitespace normalization
      .trim();
  };

  // Auto-stop function when pause is detected
  const handlePauseDetection = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    pauseTimeoutRef.current = setTimeout(() => {
      if (isListening && transcript.trim()) {
        const formattedText = formatText(transcript);
        if (onResult) {
          onResult(formattedText);
        }
        stopListening();
      }
    }, pauseThreshold);
  };

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        lastSpeechTimeRef.current = Date.now();
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        // Update last speech time
        lastSpeechTimeRef.current = Date.now();

        if (finalTranscript) {
          if (continuous) {
            // For continuous mode, format and append
            const formattedText = formatText(finalTranscript);
            if (debug) {
              console.log('Voice Input Debug:', { original: finalTranscript, formatted: formattedText });
            }
            if (onResult) {
              onResult(formattedText);
            }
          } else {
            // For single-shot mode, format and return
            const formattedText = formatText(finalTranscript);
            if (debug) {
              console.log('Voice Input Debug:', { original: finalTranscript, formatted: formattedText });
            }
            if (onResult) {
              onResult(formattedText);
            }
            stopListening();
          }
        } else if (continuous && interimTranscript) {
          // Handle pause detection for continuous mode
          handlePauseDetection();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [continuous, language, onResult, onError, autoFormat, pauseThreshold]);

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Request microphone permission explicitly
        await navigator.mediaDevices.getUserMedia({ audio: true });

        setTranscript('');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Microphone permission denied:', error);
        if (onError) {
          onError('Microphone access denied. Please allow microphone access.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);

      // If there's pending transcript, format and return it
      if (transcript.trim()) {
        const formattedText = formatText(transcript);
        if (onResult) {
          onResult(formattedText);
        }
      }

      setTranscript('');

      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening
  };
}