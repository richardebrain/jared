import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Share2 } from "lucide-react";
import { Link } from "wouter";
import LessonPlanDisplay from "@/components/LessonPlanDisplay";

export default function LessonPlanViewer() {
  const { id } = useParams();

  const { data: lessonPlan, isLoading } = useQuery({
    queryKey: ["/api/lesson-plans", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/lesson-plans/${id}`);
      return response.json();
    },
  });

  const { data: standards = [] } = useQuery({
    queryKey: ["/api/arizona-standards"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/arizona-standards");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lesson Plan Not Found</h1>
          <p className="text-gray-600 mb-6">The lesson plan you're looking for doesn't exist or has been removed.</p>
          <Link href="/lesson-plan-creator">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/lesson-plan-creator">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Creator
            </Button>
          </Link>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Lesson Plan Display */}
        <LessonPlanDisplay lessonPlan={lessonPlan} standards={standards} />
      </div>
    </div>
  );
}