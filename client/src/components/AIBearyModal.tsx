import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIBearyModalProps {
  moduleTitle?: string;
  trigger?: React.ReactNode;
}

export function AIBearyModal({ moduleTitle, trigger }: AIBearyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const apiResponse = await apiRequest("POST", "/api/ai-beary/chat", {
        query: query.trim(),
        moduleContext: moduleTitle
      });
      
      const result = await apiResponse.json();
      
      // Format the response for better readability
      const formattedMessage = result.message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
      
      setResponse(formattedMessage);
    } catch (error) {
      console.error('AI Beary error:', error);
      setResponse("🐻 I'm having some technical difficulties right now! Please try again in a moment, or reach out to your director for immediate assistance.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuestion = () => {
    setQuery("");
    setResponse(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            Ask AI Beary
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🐻</span>
            AI Beary - Your Teaching Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            I'm here to help with early childhood education topics, classroom strategies, 
            child development, and teaching best practices!
          </div>

          {!response && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about early childhood education..."
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!query.trim() || isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI Beary is thinking...
                  </>
                ) : (
                  "Ask AI Beary"
                )}
              </Button>
            </form>
          )}

          {response && (
            <Card>
              <CardContent className="pt-4">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: response }}
                />
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={handleNewQuestion}
                    variant="outline"
                    size="sm"
                  >
                    Ask Another Question
                  </Button>
                  <Button 
                    onClick={() => setIsOpen(false)}
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {moduleTitle && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Context: Currently learning about "{moduleTitle}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}