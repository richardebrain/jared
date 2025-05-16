import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AssessmentResults from "@/components/AssessmentResults";
import { useLocation } from "wouter";

export default function TestAssessmentGraphPage() {
  const [, setLocation] = useLocation();
  
  // Sample data for testing the graph
  const sampleAssessmentData = {
    id: 999,
    userId: 4,
    overallScore: 72,
    completedAt: new Date().toISOString(),
    teacherLevel: "Associate Teacher Level 2",
    scores: [
      { category: "Classroom Management", score: 85, level: 'accomplished' as const, description: "Strong skills in organizing routines and systems" },
      { category: "Child Development", score: 92, level: 'mastery' as const, description: "Expert understanding of developmental stages" },
      { category: "Curriculum Planning", score: 78, level: 'accomplished' as const, description: "Good ability to design appropriate curriculum" },
      { category: "Learning Environment", score: 65, level: 'proficient' as const, description: "Adequate skills in creating learning spaces" },
      { category: "Assessment", score: 45, level: 'developing' as const, description: "Working on observation and documentation skills" },
      { category: "Family Engagement", score: 30, level: 'beginner' as const, description: "Beginning to develop family communication" },
      { category: "Health & Safety", score: 88, level: 'accomplished' as const, description: "Strong understanding of safety procedures" },
      { category: "Social Development", score: 71, level: 'proficient' as const, description: "Solid skills in fostering relationships" },
      { category: "Cognitive Development", score: 62, level: 'proficient' as const, description: "Consistent support for thinking skills" },
      { category: "Language Development", score: 54, level: 'developing' as const, description: "Growing literacy promotion skills" },
      { category: "Physical Development", score: 83, level: 'accomplished' as const, description: "Strong motor skill facilitation" },
      { category: "Creative Expression", score: 61, level: 'proficient' as const, description: "Adequate arts integration" },
      { category: "Cultural Competence", score: 40, level: 'developing' as const, description: "Working on inclusive practices" },
      { category: "Special Needs", score: 35, level: 'beginner' as const, description: "Basic understanding of accommodations" },
      { category: "Technology Integration", score: 67, level: 'proficient' as const, description: "Appropriate tech use in classroom" },
      { category: "Professional Growth", score: 79, level: 'accomplished' as const, description: "Active ongoing development" },
      { category: "Ethics & Professionalism", score: 90, level: 'mastery' as const, description: "Exemplary ethical conduct" },
      { category: "Leadership", score: 59, level: 'developing' as const, description: "Growing mentorship abilities" },
    ]
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Assessment Graph Test Page</h1>
            <Button onClick={() => setLocation('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
          
          <AssessmentResults 
            assessmentData={sampleAssessmentData}
            onStartReassessment={() => {
              console.log("Start reassessment clicked");
              alert("This is just a test page. In a real scenario, this would start a new assessment.");
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}