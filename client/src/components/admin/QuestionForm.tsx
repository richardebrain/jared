import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, BookOpen, Target, Tag, HelpCircle, Lightbulb, Sparkles, Wand2, AlertCircle } from "lucide-react";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from '@/utils/difficulty';

// Temporary admin password for API access
const TEMP_ADMIN_PASSWORD = "BIGSURF55";

// Form validation schema matching backend - ID now auto-generated
const QuestionFormSchema = z.object({
  domainId: z.number().int().positive("Domain is required"),
  text: z.string().min(10, "Question text must be at least 10 characters").max(500, "Question text must be less than 500 characters"),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Exactly 4 options required (A, B, C, D)"),
  correctAnswer: z.number().min(0).max(3, "Correct answer must be A, B, C, or D"),
  difficulty: z.string().min(1, "Difficulty is required"),
  miniLesson: z.string().min(1, "Mini Lesson is required"),
  explanation: z.string().optional(),
  tags: z.string().optional(),
});

type QuestionFormData = z.infer<typeof QuestionFormSchema>;

interface Question {
  id: string;
  domainId: number;
  text: string;
  options: string | string[];
  correctAnswer: number;
  difficulty: string;
  miniLesson?: string;
  explanation?: string;
  tags?: string;
  isApproved: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  question?: Question | null;
  mode: "create" | "edit";
}

export function QuestionForm({ isOpen, onClose, question, mode }: QuestionFormProps) {
  const { toast } = useToast();
  const [userGuidance, setUserGuidance] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch domains for the dropdown
  const { data: domains, isLoading: isLoadingDomains } = useQuery({
    queryKey: ["/api/admin/domains"],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/domains?admin_password=${TEMP_ADMIN_PASSWORD}`);
      return response.data || [];
    },
    enabled: isOpen,
  });

  // Initialize form with default values
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      domainId: 0,
      text: "",
      options: ["", "", "", ""], // Always 4 options
      correctAnswer: 0,
      difficulty: "3",
      miniLesson: "",
      explanation: "",
      tags: "",
    },
  });

  // Reset form when dialog opens/closes or question changes
  useEffect(() => {
    if (isOpen && question && mode === "edit") {
      // Parse existing question data
      const parsedOptions = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;

      // Ensure exactly 4 options
      const normalizedOptions = [...parsedOptions];
      while (normalizedOptions.length < 4) {
        normalizedOptions.push("");
      }
      normalizedOptions.length = 4; // Trim if more than 4

      form.reset({
        domainId: question.domainId,
        text: question.text,
        options: normalizedOptions,
        correctAnswer: Math.min(question.correctAnswer, 3), // Ensure valid range
        difficulty: question.difficulty.toString(),
        miniLesson: question.miniLesson || "",
        explanation: question.explanation || "",
        tags: question.tags || "",
      });
    } else if (isOpen && mode === "create") {
      form.reset({
        domainId: 0,
        text: "",
        options: ["", "", "", ""], // Always 4 options
        correctAnswer: 0,
        difficulty: "3",
        miniLesson: "",
        explanation: "",
        tags: "",
      });
      setUserGuidance("");
    }
  }, [isOpen, question, mode, form]);

  // Check if AI generation prerequisites are met
  const domainId = form.watch("domainId");
  const difficulty = form.watch("difficulty");
  const canGenerateAI = domainId > 0 && difficulty;

  // AI Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        domainId,
        difficulty: parseInt(difficulty),
        userGuidance: userGuidance.trim() || undefined,
      };
      
      // Use a longer timeout for AI generation (30 seconds)
      try {
        const response = await apiRequest(`/api/admin/questions/generate?admin_password=${TEMP_ADMIN_PASSWORD}`, {
          method: "POST",
          data: payload,
          timeout: 30000, // 30 second timeout for AI generation
        });
        return response;
      } catch (error) {
        // Check if this is a timeout error
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
          throw new Error('Request timed out after 30 seconds. The AI service is taking longer than expected.');
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      const generatedData = response.data;
      
      // Populate form fields with generated content
      form.setValue("text", generatedData.text);
      form.setValue("options", generatedData.options);
      form.setValue("correctAnswer", generatedData.correctAnswer);
      form.setValue("explanation", generatedData.explanation || "");
      form.setValue("miniLesson", generatedData.miniLesson);
      form.setValue("tags", generatedData.tags || "");

      toast({
        title: "✨ AI Generation Successful",
        description: "Question content generated successfully! You can now review and edit the generated content before saving.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('AI Generation Error:', error);
      
      // Handle different error types with specific user guidance
      let title = "Generation Failed";
      let description = "Failed to generate question content. Please try again.";
      
      if (error.response?.data?.code) {
        const errorCode = error.response.data.code;
        const errorMessage = error.response.data.error;
        
        switch (errorCode) {
          case 'REQUEST_TIMEOUT':
          case 'AI_TIMEOUT':
            title = "⏱️ Generation Timeout";
            description = "AI generation is taking longer than expected. Try simplifying your guidance or try again in a moment.";
            break;
            
          case 'AI_RATE_LIMITED':
            title = "🚦 Service Busy";
            description = "The AI service is currently busy. Please wait a moment and try again.";
            break;
            
          case 'AI_SERVICE_UNAVAILABLE':
          case 'AI_GENERATION_FAILED':
            title = "🔧 Service Unavailable";
            description = "The AI service is temporarily unavailable. Please try again in a few minutes.";
            break;
            
          case 'AI_INVALID_RESPONSE':
            title = "⚠️ Invalid Content Generated";
            description = "The AI generated invalid content. Try different guidance or settings.";
            break;
            
          case 'INAPPROPRIATE_CONTENT':
            title = "🚫 Content Issue";
            description = "Your guidance contains inappropriate content. Please revise your guidance and try again.";
            break;
            
          case 'AI_CONFIG_ERROR':
            title = "⚙️ Configuration Error";
            description = "AI service configuration error. Please contact support if this persists.";
            break;
            
          case 'MISSING_REQUIRED_FIELDS':
          case 'INVALID_DIFFICULTY':
          case 'INVALID_DOMAIN':
            title = "📝 Input Error";
            description = errorMessage || "Please check your input and try again.";
            break;
            
          default:
            // Use the specific error message from backend if available
            if (errorMessage) {
              description = errorMessage;
            }
            break;
        }
      } else if (error.message?.includes('timed out') || error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        title = "⏱️ Connection Timeout";
        description = "The request timed out after 30 seconds. The AI service may be experiencing high load. Please try again.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        title = "🌐 Network Error";
        description = "Network connection error. Please check your connection and try again.";
      }

      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleGenerateAI = () => {
    if (!canGenerateAI) {
      toast({
        title: "Missing Requirements",
        description: "Please select both domain and difficulty level before generating AI content.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    generateMutation.mutate();
    setTimeout(() => setIsGenerating(false), 1000); // Reset loading state after delay
  };

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const payload = {
        admin_password: TEMP_ADMIN_PASSWORD,
        ...data,
        options: data.options, // Send as array, backend will handle JSON conversion
      };
      return await apiRequest(`/api/admin/questions`, {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: (response) => {
      const questionId = response.data?.id || "new question";
      toast({
        title: "Success",
        description: `Question created successfully with ID: ${questionId}`,
        variant: "default",
      });
      // Invalidate all question queries to ensure fresh data across all filters/pages
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/questions"], 
        exact: false 
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });

  // Update question mutation
  const updateMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const payload = {
        text: data.text,
        options: JSON.stringify(data.options),
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
        miniLesson: data.miniLesson,
        explanation: data.explanation,
        tags: data.tags,
      };
      return await apiRequest(`/api/admin/questions/${question?.id}?admin_password=${TEMP_ADMIN_PASSWORD}`, {
        method: "PUT",
        data: payload,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
        variant: "default",
      });
      // Invalidate all question queries to ensure fresh data across all filters/pages
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/questions"], 
        exact: false 
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    // Validate that all 4 options are filled
    if (data.options.some(option => !option.trim())) {
      toast({
        title: "Validation Error",
        description: "All 4 answer options must be provided",
        variant: "destructive",
      });
      return;
    }

    // Validate correct answer is within valid range (0-3)
    if (data.correctAnswer < 0 || data.correctAnswer > 3) {
      toast({
        title: "Validation Error",
        description: "Correct answer must be A, B, C, or D",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isAIGenerating = generateMutation.isPending || isGenerating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            {mode === "create" ? "Create New Question" : "Edit Question"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new assessment question. You can use AI generation to help create content, then edit as needed."
              : "Update the question content and configuration. Changes will require re-approval."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* SECTION 1: Required Manual Inputs (Top) */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Section 1: Required Manual Inputs
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Select domain and difficulty level before AI generation becomes available.
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="domainId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Domain <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className={`${field.value === 0 ? 'border-red-300' : ''}`}>
                              <SelectValue placeholder="Select a domain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDomains ? (
                              <SelectItem value="">Loading domains...</SelectItem>
                            ) : (
                              domains?.map((domain: any) => (
                                <SelectItem key={domain.id} value={domain.id.toString()}>
                                  {domain.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Difficulty Level <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={`${!field.value ? 'border-red-300' : ''}`}>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.value} - {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Difficulty affects point values in the adaptive assessment system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {mode === "edit" && question && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Question ID</div>
                    <div className="text-sm font-mono">{question.id}</div>
                    <div className="text-xs text-muted-foreground mt-1">IDs cannot be changed after creation</div>
                  </div>
                )}

                {/* Prerequisites Status */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {canGenerateAI ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Target className="h-4 w-4" />
                      <span className="text-sm font-medium">Prerequisites met - AI generation available</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Select domain and difficulty to enable AI generation</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: AI Generation Controls (Middle) */}
            {mode === "create" && (
              <Card className={`border-2 ${canGenerateAI ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Section 2: AI Generation Controls
                    <Badge variant={canGenerateAI ? "default" : "secondary"} className="text-xs">
                      {canGenerateAI ? "Available" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Optionally add specific guidance, then generate AI content to populate the form fields below.
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userGuidance">
                      Optional User Guidance
                    </Label>
                    <Textarea
                      id="userGuidance"
                      placeholder="Optional: Add specific focus or scenario guidance (e.g., 'focus on playground safety' or 'new teacher scenarios')"
                      value={userGuidance}
                      onChange={(e) => setUserGuidance(e.target.value)}
                      disabled={!canGenerateAI}
                      className="min-h-[80px] mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Examples: "focus on playground safety", "scenarios for new teachers", "indoor classroom management"
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={!canGenerateAI || isAIGenerating}
                    className="w-full"
                    variant={canGenerateAI ? "default" : "secondary"}
                  >
                    {isAIGenerating ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating with AI... (this may take 15-30 seconds)
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>

                  {isAIGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                        AI is analyzing your requirements and generating ECE-appropriate content...
                      </div>
                      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium mb-1">Generation Process:</div>
                        <div>• Analyzing domain context and difficulty level</div>
                        <div>• Creating realistic multiple choice scenarios</div>
                        <div>• Generating explanations and mini-lessons</div>
                        <div>• Quality checking and formatting content</div>
                        <div className="mt-2 text-blue-600 font-medium">
                          Please wait... this typically takes 15-30 seconds
                        </div>
                      </div>
                    </div>
                  )}

                  {!canGenerateAI && (
                    <div className="text-center text-sm text-muted-foreground p-4 bg-gray-100 rounded-lg">
                      Complete Section 1 (domain + difficulty) to enable AI generation
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SECTION 3: Generated/Editable Content Fields (Bottom) */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Section 3: Question Content
                  {mode === "create" && (
                    <Badge variant="outline" className="text-xs">
                      AI Generated + Fully Editable
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {mode === "create" 
                    ? "AI-generated content will appear here and can be fully edited before saving."
                    : "Edit the question content and configuration."}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Question Text */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the question text..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear, concise question text (10-500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Answer Options */}
                <div>
                  <FormLabel className="text-base font-medium">Answer Options</FormLabel>
                  <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3 mt-2">
                          {field.value.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div 
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold cursor-pointer transition-colors ${
                                    form.watch("correctAnswer") === index 
                                      ? "bg-green-500 text-white border-green-500" 
                                      : "bg-gray-100 text-gray-600 border-gray-300 hover:border-green-400"
                                  }`}
                                  onClick={() => form.setValue("correctAnswer", index)}
                                >
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...field.value];
                                    newOptions[index] = e.target.value;
                                    field.onChange(newOptions);
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormDescription>
                          Add 4 multiple choice options (A, B, C, D). Click the letter to mark it as the correct answer.
                        </FormDescription>
                        {form.watch("correctAnswer") !== undefined && (
                          <div className="text-sm text-green-600 font-medium">
                            {String.fromCharCode(65 + form.watch("correctAnswer"))} is marked as the correct answer
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Explanation */}
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why the correct answer is right..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional explanation of why the correct answer is right
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mini-Lesson */}
                <FormField
                  control={form.control}
                  name="miniLesson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mini-Lesson (Required)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide educational content related to this topic..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Educational content for users who get this question wrong
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter comma-separated tags (e.g., safety, supervision, playground)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional comma-separated tags for categorization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {mode === "create" 
                  ? "New questions require admin approval before appearing in assessments"
                  : "Significant changes may reset approval status"}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (mode === "create" ? "Create Question" : "Update Question")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 