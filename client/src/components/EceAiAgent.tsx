import { useState, useEffect, useRef } from 'react';
import { askEceQuestion, getEceGreeting } from '@/lib/perplexity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

type Message = {
  id: string;
  isBot: boolean;
  text: string;
  timestamp: Date;
};

interface EceAiAgentProps {
  user: User | null;
}

export default function EceAiAgent({ user }: EceAiAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate a unique ID for messages
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial greeting when component mounts
  useEffect(() => {
    const loadInitialGreeting = async () => {
      setIsLoading(true);
      try {
        const greeting = await getEceGreeting(user?.firstName || 'Teacher');
        setMessages([{
          id: generateId(),
          isBot: true,
          text: greeting,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error loading greeting:', error);
        setMessages([{
          id: generateId(),
          isBot: true,
          text: `Hi ${user?.firstName || 'Teacher'}! Welcome to MentorMe. I'm your AI assistant specialized in Early Childhood Education. What questions can I help you with today?`,
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialGreeting();
  }, [user]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: generateId(),
      isBot: false,
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askEceQuestion(inputValue);
      
      const botMessage = {
        id: generateId(),
        isBot: true,
        text: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive'
      });

      const errorMessage = {
        id: generateId(),
        isBot: true,
        text: 'Sorry, I encountered an error. Please try asking again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send a message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[400px] shadow-lg animate-pop">
      <CardHeader className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white rounded-t-lg py-3">
        <div className="flex items-center gap-2">
          <Avatar className="animate-pulse-slow">
            <AvatarImage src="/assets/mindful-mornings-logo.jpg" />
            <AvatarFallback className="bg-secondary text-white">
              <BrainCircuit className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-1 text-white">
              ECE Assistant <Sparkles className="h-4 w-4 animate-pulse-slow" />
            </CardTitle>
            <CardDescription className="text-white/80 text-xs">
              Answers all your Early Childhood Education questions
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isBot 
                  ? 'bg-white rounded-tl-none shadow-md animate-pop' 
                  : 'bg-primary text-white rounded-tr-none ml-auto animate-pop'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              <div 
                className={`text-xs mt-1 ${
                  message.isBot ? 'text-gray-500' : 'text-white/80'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 bg-white rounded-lg rounded-tl-none shadow-md animate-pulse-slow">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-3 bg-white border-t">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            placeholder="Ask me any ECE question..."
            className="flex-grow resize-none border rounded-md"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputValue.trim()} 
            size="icon"
            className="hover-pop hover-glow"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}