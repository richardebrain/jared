import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle } from "lucide-react";

// Self-assessment questions from the PDF
const selfAssessmentQuestions = [
  {
    id: 1,
    text: "I have a genuine love for children and enjoy my time with them.",
    category: "Attitude"
  },
  {
    id: 2,
    text: "I am patient and able to maintain my composure during challenging situations.",
    category: "Temperament"
  },
  {
    id: 3,
    text: "I communicate effectively with children at their developmental level.",
    category: "Communication"
  },
  {
    id: 4,
    text: "I create engaging activities that promote learning through play.",
    category: "Creativity"
  },
  {
    id: 5,
    text: "I understand child development stages and can adapt my teaching accordingly.",
    category: "Knowledge"
  },
  {
    id: 6,
    text: "I establish consistent routines and clear boundaries for children.",
    category: "Management"
  },
  {
    id: 7,
    text: "I effectively observe and document children's progress and behaviors.",
    category: "Observation"
  },
  {
    id: 8,
    text: "I build positive relationships with parents and communicate effectively.",
    category: "Parent Relations"
  },
  {
    id: 9,
    text: "I collaborate well with colleagues and contribute to a positive work environment.",
    category: "Teamwork"
  },
  {
    id: 10,
    text: "I am flexible and can adapt my approach based on children's needs.",
    category: "Adaptability"
  }
];

// Rating scale for self-assessment
const ratingScale = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" }
];

export default function SelfAssessment() {
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  // Get user info for the submission
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const handleRatingChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isFormComplete = () => {
    return selfAssessmentQuestions.every(q => responses[q.id]);
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert responses to the format expected by the backend
      const formattedResponses = Object.entries(responses).reduce(
        (acc, [questionId, rating]) => ({
          ...acc,
          [questionId]: rating
        }),
        {}
      );

      // Submit the self-assessment
      await apiRequest("POST", "/api/self-assessment", {
        userId: user?.id,
        responses: formattedResponses
      });

      toast({
        title: "Assessment Submitted",
        description: "Your self-assessment has been recorded successfully!",
        variant: "default"
      });

      setIsComplete(true);
    } catch (error) {
      console.error("Error submitting self-assessment:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-green-700 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Self-Assessment Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-green-700 mb-4">
              Thank you for completing your self-assessment! Your responses will help customize your learning experience.
            </p>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-2">Teacher Self-Assessment</h1>
      <p className="text-muted-foreground mb-6">
        Please rate yourself honestly on each of the following statements. Your responses will help customize your learning path.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Skills Assessment</CardTitle>
          <CardDescription>
            Rate yourself on a scale of 1-5 for each statement below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {selfAssessmentQuestions.map((question) => (
              <div key={question.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{question.text}</h3>
                    <p className="text-sm text-muted-foreground">{question.category}</p>
                  </div>
                </div>
                <RadioGroup
                  value={responses[question.id] || ""}
                  onValueChange={(value) => handleRatingChange(question.id, value)}
                  className="flex justify-between space-x-1"
                >
                  {ratingScale.map((rating) => (
                    <div key={rating.value} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem
                        value={rating.value}
                        id={`q${question.id}-r${rating.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`q${question.id}-r${rating.value}`}
                        className="rounded-md px-3 py-2 text-center text-sm cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground hover:bg-muted"
                      >
                        {rating.value}
                      </Label>
                      <span className="text-xs text-muted-foreground">{rating.label}</span>
                    </div>
                  ))}
                </RadioGroup>
                <Separator className="my-4" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormComplete()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                </>
              ) : (
                "Submit Assessment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}