import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Minimize2, Maximize2, HelpCircle } from "lucide-react";
import type { User } from "@shared/schema";
import { askEceQuestion } from "@/lib/perplexity";

interface BearAssistantProps {
  user?: User;
  initiallyMinimized?: boolean;
}

export default function BearAssistant({ user, initiallyMinimized = true }: BearAssistantProps): JSX.Element {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user', content: string }[]>([
    { 
      role: 'assistant', 
      content: `Hello ${user?.firstName || 'there'}! I'm BearyAI, your teaching assistant. 
      
I can help you with:
• Early childhood education questions
• Classroom management strategies
• Ideas for activities and transitions
• Guidance on Raising Arizona's "Building Chapter One" philosophy
• Information about mindful mornings
• Questions about your points and Bear Bucks

Just ask me anything related to teaching preschool!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUsingPerplexity, setIsUsingPerplexity] = useState(true);
  
  // Predefined responses based on question keywords for fallback use
  const responses = {
    'chapter one': 'Building "Chapter One" is our philosophy that emphasizes creating foundational experiences for each child. Each interaction helps form the beginning of their life story.',
    'mindful morning': 'Mindful Mornings is our approach to starting the day with intentional calm activities that help children center themselves and prepare for learning.',
    'transition': 'Transitions between activities can be challenging. Try using a song, timer, or visual cue to help children know what is coming next.',
    'behavior': 'When addressing challenging behaviors, remember our CALM approach: Connect before correcting, Acknowledge feelings, Listen actively, and Model the behavior you want to see.',
    'assessment': 'Our assessment framework combines elements of CLASS and ECERS/ITERS to give a comprehensive view of teaching quality and child outcomes.',
    'points': `You currently have ${user?.points || 0} points. Keep completing modules and assessments to earn more!`,
    'modules': 'Our learning modules cover various topics like classroom management, social-emotional development, and curriculum planning. They are personalized to your learning style and assessment results.',
    'bear bucks': `Bear Bucks are our in-app currency. You earn 1 Bear Buck for every 20 points. You currently have ${Math.floor((user?.points || 0) / 20)} Bear Bucks!`,
    'help': 'I can answer questions about our teaching philosophy, classroom techniques, module content, or using the app. What would you like to know more about?'
  };
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userQuestion = input;
    setInput('');
    setIsTyping(true);
    
    try {
      // Use the same backend service as the dedicated BearyAI page
      const response = await fetch("/api/bear-assistant/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: userQuestion })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.message || data.content || "I'm having trouble processing that question right now. Could you try rephrasing it?";
      
      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      setIsTyping(false);
      
    } catch (error) {
      console.error("Error asking BearyAI:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error processing your question. Try asking about our Mindful Mornings approach, quick transition techniques, or strategies for implementing Building Chapter One in your classroom." 
      }]);
    }
  };
  
  return (
    <Card className="border border-amber-200 overflow-hidden shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <img 
            src="https://em-content.zobj.net/source/microsoft-teams/363/teddy-bear_1f9f8.png" 
            alt="Bear Assistant" 
            className="w-6 h-6 mr-2"
          />
          <CardTitle className="text-lg">BearyAI Assistant</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsMinimized(!isMinimized)}
          className="h-8 w-8 p-0"
        >
          {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-0">
          <div className="h-[340px] flex flex-col">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-[85%] px-4 py-3 rounded-lg shadow-sm ${
                      message.role === 'assistant' 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-lg shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="border-t border-border p-4 flex items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                />
                {!input && (
                  <div className="absolute right-4 top-3.5 text-sm text-muted-foreground/40 flex items-center pointer-events-none">
                    <HelpCircle className="h-4 w-4 mr-1" />
                  </div>
                )}
              </div>
              <Button 
                size="default" 
                className="ml-3 px-4"
                onClick={handleSendMessage}
                disabled={!input.trim()}
              >
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}