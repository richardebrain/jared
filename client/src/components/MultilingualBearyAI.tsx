import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, Volume2, Globe, Sparkles, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  hasAudio?: boolean;
  audioUrl?: string;
}

const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸', prompt: 'Respond as a helpful early childhood education assistant.' },
  'es': { name: 'Spanish', flag: '🇪🇸', prompt: 'Responde como un asistente útil de educación infantil temprana en español.' },
  'fr': { name: 'French', flag: '🇫🇷', prompt: 'Répondez en tant qu\'assistant utile en éducation de la petite enfance en français.' },
  'de': { name: 'German', flag: '🇩🇪', prompt: 'Antworten Sie als hilfreicher Assistent für frühkindliche Bildung auf Deutsch.' },
  'it': { name: 'Italian', flag: '🇮🇹', prompt: 'Rispondi come assistente utile per l\'educazione della prima infanzia in italiano.' },
  'pt': { name: 'Portuguese', flag: '🇵🇹', prompt: 'Responda como um assistente útil de educação infantil em português.' },
  'pl': { name: 'Polish', flag: '🇵🇱', prompt: 'Odpowiadaj jako pomocny asystent edukacji wczesnodziecięcej w języku polskim.' },
  'nl': { name: 'Dutch', flag: '🇳🇱', prompt: 'Reageer als een behulpzame assistent voor vroegschoolse educatie in het Nederlands.' },
  'ja': { name: 'Japanese', flag: '🇯🇵', prompt: '幼児教育の有用なアシスタントとして日本語で回答してください。' },
  'ko': { name: 'Korean', flag: '🇰🇷', prompt: '유아 교육의 유용한 도우미로서 한국어로 응답하세요.' },
  'zh': { name: 'Chinese', flag: '🇨🇳', prompt: '作为有用的幼儿教育助手用中文回应。' },
  'hi': { name: 'Hindi', flag: '🇮🇳', prompt: 'प्रारंभिक बचपन की शिक्षा के उपयोगी सहायक के रूप में हिंदी में जवाब दें।' },
  'ar': { name: 'Arabic', flag: '🇸🇦', prompt: 'اجب كمساعد مفيد في التعليم المبكر للطفولة باللغة العربية.' },
  'ru': { name: 'Russian', flag: '🇷🇺', prompt: 'Отвечайте как полезный помощник по дошкольному образованию на русском языке.' }
};

interface MultilingualBearyAIProps {
  onLanguageChange?: (language: string) => void;
  defaultLanguage?: string;
  enableVoiceGeneration?: boolean;
}

export default function MultilingualBearyAI({ 
  onLanguageChange, 
  defaultLanguage = 'en',
  enableVoiceGeneration = true 
}: MultilingualBearyAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(selectedLanguage);
    }
  }, [selectedLanguage, onLanguageChange]);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    
    // Add a system message about language change
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: selectedLanguage === 'en' 
        ? `I've switched to ${SUPPORTED_LANGUAGES[newLanguage as keyof typeof SUPPORTED_LANGUAGES].name}. How can I help you with early childhood education?`
        : `He cambiado al ${SUPPORTED_LANGUAGES[newLanguage as keyof typeof SUPPORTED_LANGUAGES].name}. ¿Cómo puedo ayudarte con la educación infantil?`,
      timestamp: new Date(),
      language: newLanguage
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const generateVoiceResponse = async (text: string, language: string) => {
    if (!enableVoiceGeneration) return null;

    setIsGeneratingAudio(true);
    try {
      const endpoint = language === 'en' 
        ? '/api/voice/generate-speech'
        : '/api/voice/generate-multilingual-speech';
      
      const requestBody = language === 'en'
        ? {
            text: text,
            voiceType: 'friendly-female',
            optimize: true
          }
        : {
            text: text,
            voiceType: 'friendly-female',
            targetLanguage: language
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
      }
    } catch (error) {
      console.error('Voice generation error:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create system prompt in the selected language
      const languagePrompt = SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES].prompt;
      
      const response = await fetch('/api/beary-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue.trim(),
          systemPrompt: `${languagePrompt} Focus on early childhood education, classroom management, curriculum development, and teaching strategies. Be helpful, encouraging, and provide practical advice.`,
          conversationHistory: messages.slice(-6), // Last 6 messages for context
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Generate voice response
      const audioUrl = await generateVoiceResponse(data.response, selectedLanguage);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        language: selectedLanguage,
        hasAudio: !!audioUrl,
        audioUrl: audioUrl || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (audioUrl) {
        toast({
          title: "Voice Response Generated",
          description: `BearyAI response available in ${SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES].name}`,
        });
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from BearyAI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-full max-h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            BearyAI Assistant
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Multilingual
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {selectedLanguage === 'en' 
            ? "Ask me anything about early childhood education, lesson planning, classroom management, and teaching strategies."
            : "Pregúntame cualquier cosa sobre educación infantil, planificación de lecciones, gestión del aula y estrategias de enseñanza."
          }
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-primary/20" />
                <p className="text-sm">
                  {selectedLanguage === 'en' 
                    ? "Hello! I'm BearyAI, your multilingual early childhood education assistant. How can I help you today?"
                    : "¡Hola! Soy BearyAI, tu asistente multilingüe de educación infantil. ¿Cómo puedo ayudarte hoy?"
                  }
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    
                    {message.language && message.language !== 'en' && (
                      <Badge variant="outline" className="text-xs">
                        {SUPPORTED_LANGUAGES[message.language as keyof typeof SUPPORTED_LANGUAGES].flag}
                        {SUPPORTED_LANGUAGES[message.language as keyof typeof SUPPORTED_LANGUAGES].name}
                      </Badge>
                    )}
                    
                    {message.hasAudio && message.audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(message.audioUrl!)}
                        className="h-6 px-2"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    {selectedLanguage === 'en' ? 'BearyAI is thinking...' : 'BearyAI está pensando...'}
                    {isGeneratingAudio && (
                      <Badge variant="secondary" className="text-xs">
                        <Mic className="h-3 w-3 mr-1" />
                        Generating audio
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedLanguage === 'en' 
                  ? "Ask BearyAI about early childhood education..."
                  : "Pregunta a BearyAI sobre educación infantil..."
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {enableVoiceGeneration && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {selectedLanguage === 'en' 
                ? "Voice responses available in your selected language"
                : "Respuestas de voz disponibles en tu idioma seleccionado"
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}