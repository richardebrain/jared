import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Pre-defined scenarios for the parent response generator
export interface ParentScenario {
  title: string;
  description: string;
  prompt: string;
}

// Form schema for parent response generator
const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters",
  }).max(1000, {
    message: "Prompt is limited to 1000 characters",
  }),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

interface ParentResponseGeneratorProps {
  scenarios: ParentScenario[];
}

export default function ParentResponseGenerator({ scenarios }: ParentResponseGeneratorProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    }
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setResponse(null);
    
    try {
      const result = await apiRequest("/api/ai/parent-response", {
        method: "POST",
        data: {
          prompt: data.prompt
        }
      });
      
      if (result.response) {
        setResponse(result.response);
      } else {
        throw new Error("Failed to generate response");
      }
    } catch (error) {
      console.error("Error generating parent response:", error);
      toast({
        title: "Error generating response",
        description: "There was a problem creating your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load a pre-defined scenario
  const useScenario = (scenario: ParentScenario) => {
    form.setValue("prompt", scenario.prompt);
    // Scroll to form
    document.getElementById("prompt-field")?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle copying the response to clipboard
  const handleCopyToClipboard = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(response)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Response has been copied and is ready to share",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Failed to copy response. Please try again.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Parent Scenarios</h2>
        <p className="text-muted-foreground">
          Select a pre-defined scenario or write your own below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent 
                className="p-4 space-y-2"
                onClick={() => useScenario(scenario)}
              >
                <h3 className="font-medium">{scenario.title}</h3>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe the parent communication scenario</FormLabel>
                <FormControl>
                  <Textarea 
                    id="prompt-field"
                    placeholder="Describe the situation, what the parent said, and what information you need to communicate..."
                    className="min-h-[150px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Provide context and key details about the situation to generate a professional response
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Crafting Response...
              </>
            ) : (
              "Generate Professional Response"
            )}
          </Button>
        </form>
      </Form>

      {response && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Professional Response</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleCopyToClipboard}
            >
              <Share className="h-4 w-4" />
              Copy
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap text-sm font-light">
                {response}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}