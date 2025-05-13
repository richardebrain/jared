import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  situation: z.string().min(10, {
    message: "Situation must be at least 10 characters.",
  }),
  tone: z.string().min(1, {
    message: "Please select a tone.",
  }),
  audience: z.string().min(1, {
    message: "Please select an audience.",
  }),
  includeResources: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ParentResponseGenerator() {
  const [response, setResponse] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      situation: "",
      tone: "professional",
      audience: "parent",
      includeResources: true,
    },
  });

  const { isPending, mutate } = useQuery({
    queryKey: ["parent-response"],
    queryFn: async () => {
      try {
        const values = form.getValues();
        // In a real implementation, you would call your API here
        // For now, we'll simulate a response
        const simulatedResponse = generateSimulatedResponse(values);
        setResponse(simulatedResponse);
        return simulatedResponse;
      } catch (error) {
        console.error("Error generating response:", error);
        throw error;
      }
    },
    enabled: false,
  });

  function generateSimulatedResponse(values: FormValues): string {
    // This is a placeholder function that would be replaced with a real API call to Perplexity
    const { situation, tone, audience } = values;
    
    let responseText = "";
    
    // Greeting based on audience
    if (audience === "parent") {
      responseText += "Dear Parent,\n\n";
    } else if (audience === "guardian") {
      responseText += "Dear Guardian,\n\n";
    } else if (audience === "family") {
      responseText += "Dear Family,\n\n";
    }
    
    // Introduction based on tone
    if (tone === "professional") {
      responseText += "I wanted to reach out regarding a situation in our classroom that I believe is important to address in a constructive manner.\n\n";
    } else if (tone === "supportive") {
      responseText += "I'm writing to share something that happened today. Please know that I'm here to support both you and your child through this.\n\n";
    } else if (tone === "celebratory") {
      responseText += "I'm thrilled to share some wonderful news with you about a special moment in our classroom!\n\n";
    }
    
    // Custom content based on the situation (simplified for this example)
    responseText += `Regarding the situation you described: "${situation}"\n\n`;
    
    if (situation.toLowerCase().includes("behavior")) {
      responseText += "I've observed this behavior pattern and wanted to discuss some positive strategies we can implement both at school and at home. Our goal is to help your child develop self-regulation skills in a supportive environment.\n\n";
    } else if (situation.toLowerCase().includes("progress")) {
      responseText += "I've been carefully tracking this progress and am pleased to see the development. Our Chapter One philosophy emphasizes these foundational skills as crucial building blocks for future learning.\n\n";
    } else if (situation.toLowerCase().includes("concern")) {
      responseText += "I understand this may be concerning, and I want to assure you that we are addressing it thoughtfully. Early childhood is a time of tremendous growth and learning, and we're committed to guiding your child through these challenges.\n\n";
    } else {
      responseText += "We at Raising Arizona Preschool believe in building Chapter One of each child's life with intention and care. I'd be happy to discuss this further and answer any questions you might have.\n\n";
    }
    
    // Conclusion
    responseText += "Please feel free to schedule a time to talk more about this if you'd like. I'm available during my planning period (1-2pm) or after school.\n\n";
    
    // Closing
    responseText += "Warmly,\n[Your Name]\nRaising Arizona Preschool Teacher";
    
    return responseText;
  }

  function onSubmit(values: FormValues) {
    mutate();
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="situation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe the situation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A child in my class has been having difficulty sharing toys during free play, which has led to some conflicts with peers."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication tone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="supportive">Supportive</SelectItem>
                          <SelectItem value="celebratory">Celebratory</SelectItem>
                          <SelectItem value="concerned">Concerned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intended audience</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating response...
                  </>
                ) : (
                  "Generate Professional Response"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated Response</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="flex items-center"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
              {response}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}