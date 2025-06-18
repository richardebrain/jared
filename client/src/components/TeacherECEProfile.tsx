import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Clock, Calendar, BookOpen } from "lucide-react";

interface ECEHour {
  id: number;
  category: string;
  duration: number;
  completedAt: string;
  trainingTitle: string;
  notes?: string;
}

interface ECEProfileData {
  teacherId: number;
  teacherName: string;
  hours: ECEHour[];
  totalHours: number;
  hoursByCategory: Record<string, number>;
  categories: string[];
}

interface TeacherECEProfileProps {
  teacherId: number;
}

const categoryDisplayNames: Record<string, string> = {
  "social-emotional": "Social-Emotional Learning",
  "cognitive-development": "Cognitive Development",
  "physical-development": "Physical Development & Health",
  "language-literacy": "Language & Literacy",
  "creative-arts": "Creative Arts",
  "classroom-management": "Classroom Management",
  "family-engagement": "Family & Community Engagement",
  "assessment": "Assessment & Evaluation",
  "special-needs": "Special Needs & Inclusion",
  "professional-development": "Professional Development"
};

const categoryColors: Record<string, string> = {
  "social-emotional": "bg-blue-100 text-blue-800",
  "cognitive-development": "bg-purple-100 text-purple-800",
  "physical-development": "bg-green-100 text-green-800",
  "language-literacy": "bg-orange-100 text-orange-800",
  "creative-arts": "bg-pink-100 text-pink-800",
  "classroom-management": "bg-red-100 text-red-800",
  "family-engagement": "bg-yellow-100 text-yellow-800",
  "assessment": "bg-indigo-100 text-indigo-800",
  "special-needs": "bg-teal-100 text-teal-800",
  "professional-development": "bg-gray-100 text-gray-800"
};

export function TeacherECEProfile({ teacherId }: TeacherECEProfileProps) {
  const { data: eceData, isLoading, error } = useQuery<ECEProfileData>({
    queryKey: ["/api/teachers", teacherId, "ece-hours"],
    enabled: !!teacherId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            ECE Training Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !eceData) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            ECE Training Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No ECE training hours recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress toward common ECE requirements
  const annualRequirement = 20; // Common annual ECE requirement
  const progressPercentage = Math.min((eceData.totalHours / annualRequirement) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            ECE Training Hours - {eceData.teacherName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Hours Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {eceData.totalHours.toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Total Hours</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {eceData.categories.length}
              </div>
              <div className="text-sm text-blue-700">Categories Covered</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {eceData.hours.length}
              </div>
              <div className="text-sm text-purple-700">Training Sessions</div>
            </div>
          </div>

          {/* Progress toward annual requirement */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Annual Requirement Progress</span>
              <span>{eceData.totalHours.toFixed(1)} / {annualRequirement} hours</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-gray-500">
              {progressPercentage >= 100 
                ? "✅ Annual requirement met!" 
                : `${(annualRequirement - eceData.totalHours).toFixed(1)} hours remaining`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Hours by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(eceData.hoursByCategory).map(([category, hours]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                    {categoryDisplayNames[category] || category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{hours.toFixed(1)}h</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Training History */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Recent Training History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {eceData.hours.slice(0, 10).map((hour) => (
              <div key={hour.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{hour.trainingTitle}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge className={`text-xs ${categoryColors[hour.category] || "bg-gray-100 text-gray-800"}`}>
                      {categoryDisplayNames[hour.category] || hour.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(hour.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {hour.notes && (
                    <p className="text-xs text-gray-600 mt-1">{hour.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{(hour.duration / 60).toFixed(1)}h</div>
                </div>
              </div>
            ))}
            {eceData.hours.length === 0 && (
              <p className="text-gray-500 text-center py-4">No training history yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}