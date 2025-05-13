import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Bot, HelpCircle, Loader2, Send, X, Maximize2, Minimize2, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  isBot: boolean;
  text: string;
  timestamp: Date;
  citations?: string[];
}

interface BearAssistantProps {
  user: User | null;
  initiallyMinimized?: boolean; 
}

export default function BearAssistant({ user, initiallyMinimized = true }: BearAssistantProps) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && user?.firstName) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        isBot: true,
        text: `Hi ${user.firstName}! I'm Berry, your friendly bear assistant at Raising Arizona Preschool! 🐻 I'm here to help with any early childhood education questions you might have. What can I help you with today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user?.firstName, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      isBot: false,
      text: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    
    try {
      // Call the Bear Assistant API
      const response = await apiRequest("POST", "/api/chat/bear-assistant", {
        message: inputValue
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from Berry');
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        isBot: true,
        text: data.message,
        timestamp: new Date(),
        citations: data.citations,
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        isBot: true,
        text: "Oops! I'm having a little trouble connecting right now. Can you try again in a moment? Bear with me! 🐻",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Communication Error",
        description: "Unable to reach Berry. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full w-16 h-16 shadow-lg bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90 text-primary-foreground flex items-center justify-center"
                onClick={toggleMinimized}
              >
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L9.5 4L7 3L5 5L3 7L4 9.5L2 12L4 14.5L3 17L5 19L7 21L9.5 20L12 22L14.5 20L17 21L19 19L21 17L20 14.5L22 12L20 9.5L21 7L19 5L17 3L14.5 4L12 2Z" fill="#FFF8E7" />
                      <circle cx="8.5" cy="9.5" r="1.5" fill="#4B3621" />
                      <circle cx="15.5" cy="9.5" r="1.5" fill="#4B3621" />
                      <path d="M8 15.5C8 15.5 10 17.5 12 17.5C14 17.5 16 15.5 16 15.5" stroke="#4B3621" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 8C5 8 6 7 7 7C8 7 9 8 9 8" stroke="#4B3621" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M15 8C15 8 16 7 17 7C18 7 19 8 19 8" stroke="#4B3621" strokeWidth="1.5" strokeLinecap="round" />
                      <ellipse cx="12" cy="13" rx="1.5" ry="1" fill="#4B3621" />
                    </svg>
                  </div>
                  {messages.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                      {messages.length}
                    </span>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Chat with Berry the Bear Assistant</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] md:w-[420px]">
      <Card className="shadow-xl border-2 border-primary/20">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Berry the Bear</CardTitle>
                <CardDescription className="text-xs">Early Childhood Education Expert</CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={toggleMinimized} className="h-8 w-8">
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[350px] p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${
                  msg.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.isBot
                      ? "bg-muted/50 text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="link" size="sm" className="h-6 text-xs p-0 mt-1">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Sources ({msg.citations.length})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">References</h4>
                          <ul className="text-xs space-y-1">
                            {msg.citations.map((citation, index) => (
                              <li key={index}>
                                <a 
                                  href={citation} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-primary hover:underline truncate block"
                                >
                                  {citation.replace(/(^\w+:|^)\/\//, '').split('/')[0]}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  <div className="text-[10px] opacity-50 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-muted/50 text-foreground px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="pt-3 pb-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Textarea
              placeholder="Ask Berry a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isTyping || !inputValue.trim()}
              className="shrink-0"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}