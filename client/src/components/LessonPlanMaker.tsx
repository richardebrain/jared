import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for the lesson plan generator
const formSchema = z.object({
  ageGroup: z.string({
    required_error: "Please select an age group",
  }),
  theme: z.string().min(3, {
    message: "Theme must be at least 3 characters",
  }),
  details: z.string().max(500, {
    message: "Additional details are limited to 500 characters",
  }).optional(),
  includeArt: z.boolean().default(true),
  includeMusic: z.boolean().default(true),
  includeOutdoor: z.boolean().default(true),
  includeSensory: z.boolean().default(true)
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

export default function LessonPlanMaker() {
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageGroup: "",
      theme: "",
      details: "",
      includeArt: true,
      includeMusic: true,
      includeOutdoor: true,
      includeSensory: true
    }
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setLessonPlan(null);
    
    try {
      // Format the prompt with the form data
      const additionalRequests = [
        data.includeArt ? "art activities" : "",
        data.includeMusic ? "music and movement activities" : "",
        data.includeOutdoor ? "outdoor learning experiences" : "",
        data.includeSensory ? "sensory exploration activities" : ""
      ].filter(Boolean).join(", ");
      
      const result = await apiRequest("/api/ai/lesson-plan", {
        method: "POST",
        data: {
          ageGroup: data.ageGroup,
          theme: data.theme,
          details: data.details || "",
          additionalRequests
        }
      });
      
      if (result.lessonPlan) {
        setLessonPlan(result.lessonPlan);
      } else {
        throw new Error("Failed to generate lesson plan");
      }
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      toast({
        title: "Error generating lesson plan",
        description: "There was a problem creating your lesson plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download of the lesson plan as a text file
  const handleDownload = () => {
    if (!lessonPlan) return;
    
    const element = document.createElement("a");
    const file = new Blob([lessonPlan], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Lesson-Plan-${form.getValues("theme")}-${form.getValues("ageGroup")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle copying the lesson plan to clipboard for sharing
  const handleCopyToClipboard = () => {
    if (!lessonPlan) return;
    
    navigator.clipboard.writeText(lessonPlan)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Lesson plan has been copied and is ready to share",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Failed to copy lesson plan. Please try again.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="infant">Infant (0-12 months)</SelectItem>
                      <SelectItem value="toddler">Toddler (1-2 years)</SelectItem>
                      <SelectItem value="preschool">Preschool (3-4 years)</SelectItem>
                      <SelectItem value="pre-k">Pre-K (4-5 years)</SelectItem>
                      <SelectItem value="kindergarten">Kindergarten (5-6 years)</SelectItem>
                      <SelectItem value="mixed-age">Mixed Age Group</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the age group for your classroom
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ocean Life, Space Exploration, Dinosaurs" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose an engaging theme for your weekly lessons
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Specific learning goals, materials available, or other requirements..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Add any specific details or requirements for your lesson plan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="includeArt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Art Activities</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeMusic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Music & Movement</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeOutdoor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Outdoor Learning</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeSensory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Sensory Exploration</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Generating Lesson Plan...
              </>
            ) : (
              "Generate Weekly Lesson Plan"
            )}
          </Button>
        </form>
      </Form>

      {lessonPlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Generated Lesson Plan</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
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
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap text-sm font-light">
                {lessonPlan}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}