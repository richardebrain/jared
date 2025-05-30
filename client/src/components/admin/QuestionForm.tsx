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
import { Plus, Minus, BookOpen, Target, Tag, HelpCircle, Lightbulb } from "lucide-react";

// Temporary admin password for API access
const TEMP_ADMIN_PASSWORD = "BIGSURF55";

// Form validation schema matching backend - ID now auto-generated
const QuestionFormSchema = z.object({
  domainId: z.string().min(1, "Domain is required"),
  text: z.string().min(10, "Question text must be at least 10 characters").max(500, "Question text must be less than 500 characters"),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Exactly 4 options required (A, B, C, D)"),
  correctAnswer: z.number().min(0).max(3, "Correct answer must be A, B, C, or D"),
  difficulty: z.string().min(1, "Difficulty is required"),
  explanation: z.string().optional(),
  miniLesson: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type QuestionFormData = z.infer<typeof QuestionFormSchema>;

interface Question {
  id: string;
  domainId: string;
  text: string;
  options: string | string[];
  correctAnswer: number;
  difficulty: string;
  explanation?: string;
  miniLesson?: string;
  tags?: string | string[];
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
  const [tagInput, setTagInput] = useState("");

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
      domainId: "",
      text: "",
      options: ["", "", "", ""], // Always 4 options
      correctAnswer: 0,
      difficulty: "3",
      explanation: "",
      miniLesson: "",
      tags: [],
    },
  });

  // Reset form when dialog opens/closes or question changes
  useEffect(() => {
    if (isOpen && question && mode === "edit") {
      // Parse existing question data
      const parsedOptions = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;
      const parsedTags = typeof question.tags === 'string' 
        ? (question.tags ? question.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
        : question.tags || [];

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
        explanation: question.explanation || "",
        miniLesson: question.miniLesson || "",
        tags: parsedTags,
      });
    } else if (isOpen && mode === "create") {
      form.reset({
        domainId: "",
        text: "",
        options: ["", "", "", ""], // Always 4 options
        correctAnswer: 0,
        difficulty: "3",
        explanation: "",
        miniLesson: "",
        tags: [],
      });
    }
  }, [isOpen, question, mode, form]);

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const payload = {
        admin_password: TEMP_ADMIN_PASSWORD,
        ...data,
        options: data.options, // Send as array, backend will handle JSON conversion
        tags: data.tags?.join(", ") || "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
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
        explanation: data.explanation,
        miniLesson: data.miniLesson,
        tags: data.tags?.join(", ") || "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
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

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      const newTag = tagInput.trim();
      if (!currentTags.includes(newTag)) {
        form.setValue("tags", [...currentTags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const getDifficultyLabel = (value: string) => {
    const difficultyMap: Record<string, string> = {
      "1": "1 - Very Easy",
      "2": "2 - Easy",
      "3": "3 - Medium",
      "4": "4 - Hard",
      "5": "5 - Very Hard",
      "6": "6 - Master"
    };
    return difficultyMap[value] || value;
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
              ? "Create a new assessment question. A unique ID will be automatically generated based on the domain and difficulty."
              : "Update the question content and configuration. Changes will require re-approval."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="domainId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a domain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDomains ? (
                              <SelectItem value="">Loading domains...</SelectItem>
                            ) : (
                              domains?.map((domain: any) => (
                                <SelectItem key={domain.name} value={domain.name}>
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
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((level) => (
                              <SelectItem key={level} value={level.toString()}>
                                {getDifficultyLabel(level.toString())}
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
              </CardContent>
            </Card>

            {/* Answer Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Answer Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiple Choice Options</FormLabel>
                      <div className="space-y-3">
                        {field.value.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
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
                        ))}
                      </div>
                      <FormDescription>
                        Add 4 multiple choice options (A, B, C, D)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the correct answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("options").map((option, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {String.fromCharCode(65 + index)} - {option || "Empty option"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select which option is the correct answer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Additional Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why this is the correct answer..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide an explanation for the correct answer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="miniLesson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mini-Lesson (Optional)</FormLabel>
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
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Tags (Optional)</FormLabel>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                          />
                          <Button type="button" onClick={addTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(index)}
                                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        Add relevant tags for categorization and search
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