import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define the skill levels
const SKILL_LEVELS = [
  { value: "no_experience", label: "No Experience" },
  { value: "some_experience", label: "Some Experience (Limited)" },
  { value: "comfortable", label: "Comfortable & Experienced" },
  { value: "confident", label: "Confident & Can Lead/Mentor" }
];

// Define the skills to assess
const SKILLS = [
  { id: "circle_time", name: "Planning and leading a group circle time" },
  { id: "transitions", name: "Managing transitions between activities" },
  { id: "learning_centers", name: "Setting up age-appropriate learning centers" },
  { id: "observations", name: "Observing children and taking anecdotal notes" },
  { id: "parent_communication", name: "Communicating with parents about daily routines" },
  { id: "first_aid", name: "Handling minor first aid situations" },
  { id: "conflict_resolution", name: "De-escalating conflicts between children" },
];

const TeacherSelfAssessment: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (skillId: string, value: string) => {
    setAssessments(prev => ({ ...prev, [skillId]: value }));
  };
  
  const isComplete = () => {
    return SKILLS.every(skill => assessments[skill.id]);
  };
  
  const handleSubmit = async () => {
    if (!isComplete()) {
      toast({
        title: "Assessment Incomplete",
        description: "Please assess all skills before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await apiRequest('/api/assessments/self-assessment', {
        method: 'POST',
        data: {
          userId: user?.id,
          assessments
        }
      });
      
      toast({
        title: "Assessment Submitted",
        description: "Your self-assessment has been added to your learning path.",
      });
      
      // Optionally redirect or show results
      // Restart from scratch
      setAssessments({});
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Teacher Self-Assessment</CardTitle>
        <CardDescription>
          Rate your comfort level with each of the following teaching skills. 
          Your responses will help personalize your learning path.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {SKILLS.map((skill) => (
            <div key={skill.id} className="border rounded-lg p-4">
              <div className="font-medium mb-2">{skill.name}</div>
              <RadioGroup
                value={assessments[skill.id] || ""}
                onValueChange={(value) => handleChange(skill.id, value)}
                className="grid grid-cols-1 md:grid-cols-4 gap-2"
              >
                {SKILL_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <RadioGroupItem id={`${skill.id}-${level.value}`} value={level.value} />
                    <Label htmlFor={`${skill.id}-${level.value}`} className="text-sm">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setAssessments({})}
          disabled={submitting}
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isComplete() || submitting}
        >
          {submitting ? "Submitting..." : "Submit Assessment"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TeacherSelfAssessment;