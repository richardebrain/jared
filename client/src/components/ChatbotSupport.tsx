import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  isBot: boolean;
  text: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  isBot: true,
  text: "👋 Hi there! I'm your MentorMe Assistant. How can I help you with your teacher training today?"
};

export default function ChatbotSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      sendMessage();
    }
  };
  
  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      isBot: false,
      text: inputValue
    };
    
    setMessages([...messages, userMessage]);
    setInputValue("");
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponses = [
        "I'd be happy to help! Could you provide more details about what you're looking for?",
        "That's a great question about language learning. Let me find some resources for you.",
        "I understand you want to practice speaking. Would you like to schedule a conversation session with a native speaker?",
        "Have you tried our assessment tool? It can help identify your strengths and areas for improvement.",
        "I can help you find language exchange partners who speak your target language."
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: Message = {
        id: Date.now().toString(),
        isBot: true,
        text: randomResponse
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };
  
  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-50" id="chatbot">
      <Button
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        onClick={toggleChatbot}
      >
        <i className={`${isOpen ? "ri-close-line" : "ri-message-3-line"} text-xl`}></i>
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-primary text-white p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-robot-line"></i>
                </div>
                <div>
                  <h3 className="font-heading font-bold">MentorMe Assistant</h3>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button 
                className="text-white hover:text-opacity-80"
                onClick={toggleChatbot}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4" id="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start ${!message.isBot ? "justify-end" : ""}`}
              >
                {message.isBot && (
                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <i className="ri-robot-line text-primary"></i>
                  </div>
                )}
                
                <div 
                  className={`${
                    message.isBot 
                      ? "bg-neutral-100 text-foreground" 
                      : "bg-primary text-white"
                  } rounded-lg p-3 max-w-[80%]`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                
                {!message.isBot && (
                  <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                    <i className="ri-user-line text-white"></i>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-neutral-100">
            <div className="flex">
              <Input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-r-none"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
              <Button 
                className="rounded-l-none"
                onClick={sendMessage}
              >
                <i className="ri-send-plane-fill"></i>
              </Button>
            </div>
            <div className="mt-2 flex justify-between overflow-x-auto">
              <div className="flex space-x-2">
                <button 
                  className="text-xs bg-neutral-100 hover:bg-neutral-200 transition rounded-full px-3 py-1 whitespace-nowrap"
                  onClick={() => handleQuickQuestion("How do I schedule a meeting?")}
                >
                  Schedule help
                </button>
                <button 
                  className="text-xs bg-neutral-100 hover:bg-neutral-200 transition rounded-full px-3 py-1 whitespace-nowrap"
                  onClick={() => handleQuickQuestion("I need technical help")}
                >
                  Technical issues
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
