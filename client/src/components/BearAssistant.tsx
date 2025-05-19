import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Minimize2, Maximize2, HelpCircle } from "lucide-react";
import { User } from "@shared/schema";
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
      let responseText = '';
      
      // First check for keyword matches in the responses object for instant responses
      let matchFound = false;
      for (const [keyword, response] of Object.entries(responses)) {
        if (userQuestion.toLowerCase().includes(keyword)) {
          responseText = response;
          matchFound = true;
          break;
        }
      }
      
      // Try to find a suitable response based on keywords first
      if (!matchFound) {
        // These are more generic keywords that might match more broadly
        const genericKeywords = {
          'classroom': 'Effective classroom management strategies include clear routines, visual schedules, and positive reinforcement. Try our "Preschool Classroom Management" module for more details.',
          'activity': 'Age-appropriate activities help children develop key skills. Consider open-ended art projects, sensory tables, and guided discovery for your classroom.',
          'behavior': 'When addressing challenging behaviors, use the CALM approach: Connect before correcting, Acknowledge feelings, Listen actively, and Model positive behavior.',
          'parent': 'Parent partnerships are essential. Regular communication through newsletters, family events, and daily updates helps build strong relationships.',
          'curriculum': 'Our curriculum focuses on whole-child development with emphasis on social-emotional learning while meeting academic benchmarks.',
          'development': 'Child development follows predictable patterns but at individual paces. Our "Child Development Milestones" module can help you recognize key indicators.',
          'routine': 'Consistent routines provide security for young children. Daily schedules with visual cues help children understand expectations and transitions.',
        };
        
        // Check for generic keyword matches
        for (const [keyword, response] of Object.entries(genericKeywords)) {
          if (userQuestion.toLowerCase().includes(keyword)) {
            responseText = response;
            matchFound = true;
            break;
          }
        }
      }

      // If still no match found and using Perplexity is enabled, use the API as last resort
      if (!matchFound && isUsingPerplexity) {
        responseText = "Let me think about that...";
        
        // Add temporary thinking message while API request processes
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setIsTyping(true);
        
        try {
          // Enhance the question with user context if available
          let enhancedQuestion = userQuestion;
          if (user?.learningStyle) {
            enhancedQuestion += `\n\nContext: Teacher's preferred learning style is ${user.learningStyle.preferred}.`;
          }
          
          // Temporarily set a loading message
          setTimeout(async () => {
            try {
              const aiResponse = await askEceQuestion(enhancedQuestion);
              if (aiResponse && aiResponse.length > 0) {
                // Replace the temporary message with the real response
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { 
                    role: 'assistant', 
                    content: aiResponse 
                  };
                  return newMessages;
                });
              } else {
                // Fallback if API response is empty
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: "I don't have specific information about that yet. Try asking about our 'Building Chapter One' philosophy, Mindful Mornings approach, classroom management techniques, or specific early childhood development questions."
                  };
                  return newMessages;
                });
              }
              setIsTyping(false);
            } catch (err) {
              console.error("Error in async Perplexity request:", err);
              setIsUsingPerplexity(false);
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: "I'm having trouble accessing my knowledge base right now. Let me help with what I know. At Raising Arizona Preschool, we focus on 'Building Chapter One' for each child - creating formative experiences that become the foundation of their life story. Try asking me about Mindful Mornings, transitions between activities, behavior management strategies, or how to implement our Chapter One philosophy in specific classroom situations."
                };
                return newMessages;
              });
              setIsTyping(false);
            }
          }, 500);
          
          // Return early - we're handling the response asynchronously
          return;
          
        } catch (error) {
          console.error("Error using Perplexity:", error);
          setIsUsingPerplexity(false);
          responseText = "I'm experiencing technical difficulties accessing my full knowledge base. I can still help with questions about our 'Building Chapter One' philosophy, Mindful Mornings activities, classroom management strategies, and quick transition techniques. Try asking about these topics!";
        }
      } else if (!matchFound) {
        // Fallback response if no match found
        responseText = "I don't have specific information about that topic yet. Try asking about our Mindful Mornings approach, transition techniques, classroom management strategies, or how to implement the 'Building Chapter One' philosophy in different learning activities.";
      }
      
      // Add assistant message after a slight delay to simulate thinking
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setIsTyping(false);
      }, 800);
      
    } catch (error) {
      console.error("Error in message handling:", error);
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