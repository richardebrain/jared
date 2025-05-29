import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, Target, Package, ClipboardCheck, StickyNote, BookOpen } from "lucide-react";

interface LessonPlan {
  id: number;
  title: string;
  description?: string;
  ageGroup: string;
  duration?: number;
  objectives?: string[];
  materials?: string[];
  activities?: Array<{
    name: string;
    description: string;
    duration: number;
    instructions: string[];
  }>;
  assessment?: string;
  notes?: string;
  standardsReferenced?: number[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonPlanDisplayProps {
  lessonPlan: LessonPlan;
  standards?: Array<{
    id: number;
    standardCode: string;
    standardText: string;
    standardArea: string;
  }>;
}

export default function LessonPlanDisplay({ lessonPlan, standards = [] }: LessonPlanDisplayProps) {
  const referencedStandards = standards.filter(s => 
    lessonPlan.standardsReferenced?.includes(s.id)
  );

  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Clean up markdown formatting more thoroughly
    let cleanedContent = content
      .replace(/#{1,6}\s*/g, '') // Remove hashtags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/^[\*\-\+]\s*/gm, '') // Remove bullet points
      .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
      .replace(/^>\s*/gm, '') // Remove blockquotes
      .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .trim();

    return cleanedContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => (
        <p key={index} className="mb-2 last:mb-0 text-gray-700 leading-relaxed">
          {line.trim()}
        </p>
      ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{lessonPlan.title}</CardTitle>
              {lessonPlan.description && (
                <p className="text-gray-600 mb-4">{lessonPlan.description}</p>
              )}
            </div>
            {lessonPlan.isPublic && (
              <Badge variant="secondary">Public</Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{lessonPlan.ageGroup}</span>
            </div>
            {lessonPlan.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{lessonPlan.duration} minutes</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <span className="text-xs">Created: {new Date(lessonPlan.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Learning Objectives */}
      {lessonPlan.objectives && lessonPlan.objectives.length > 0 && (
        <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Learning Objectives</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {lessonPlan.objectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full min-w-[28px] text-center">{index + 1}</span>
                  <span className="text-gray-700 leading-relaxed">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Materials */}
      {lessonPlan.materials && lessonPlan.materials.length > 0 && (
        <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Package className="h-5 w-5 text-green-600" />
              <span>Materials Needed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lessonPlan.materials.map((material, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">{material}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities */}
      {lessonPlan.activities && lessonPlan.activities.length > 0 && (
        <Card className="bg-white shadow-lg border-0 border-l-4 border-l-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
              <span>Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {lessonPlan.activities.map((activity, index) => (
              <div key={index} className="border border-purple-200 rounded-lg p-6 bg-purple-25">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-purple-900">{activity.name || `Activity ${index + 1}`}</h4>
                  {activity.duration && (
                    <Badge variant="outline" className="flex items-center space-x-1 border-purple-300 text-purple-700">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration} min</span>
                    </Badge>
                  )}
                </div>
                
                {activity.description && (
                  <div className="mb-6">
                    <h5 className="font-medium mb-3 text-purple-800">Description:</h5>
                    <div className="text-gray-700 pl-4 bg-white p-4 rounded-lg border-l-3 border-l-purple-300">
                      {formatContent(activity.description)}
                    </div>
                  </div>
                )}
                
                {activity.instructions && activity.instructions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 text-purple-800">Step-by-Step Instructions:</h5>
                    <ol className="space-y-3">
                      {activity.instructions.map((instruction, instIndex) => (
                        <li key={instIndex} className="flex items-start space-x-3">
                          <span className="bg-purple-500 text-white text-sm font-medium px-3 py-1 rounded-full min-w-[32px] text-center flex-shrink-0">
                            {instIndex + 1}
                          </span>
                          <span className="flex-1 text-gray-700 leading-relaxed">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assessment */}
      {lessonPlan.assessment && (
        <Card className="bg-white shadow-lg border-0 border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <ClipboardCheck className="h-5 w-5 text-orange-600" />
              <span>Assessment Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-orange-25 p-4 rounded-lg border-l-3 border-l-orange-300">
              {formatContent(lessonPlan.assessment)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arizona Standards Referenced */}
      {referencedStandards.length > 0 && (
        <Card className="bg-white shadow-lg border-0 border-l-4 border-l-indigo-500">
          <CardHeader className="bg-indigo-50">
            <CardTitle className="flex items-center space-x-2 text-indigo-800">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>Arizona Early Learning Standards</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {referencedStandards.map((standard) => (
                <div key={standard.id} className="border-l-4 border-indigo-300 bg-indigo-50 p-5 rounded-r-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-indigo-900 text-lg">{standard.standardCode}</div>
                      <div className="inline-block bg-indigo-200 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mt-2">
                        {standard.standardArea}
                      </div>
                      <div className="text-gray-700 mt-3 leading-relaxed">{standard.standardText}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {lessonPlan.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <StickyNote className="h-5 w-5 text-yellow-600" />
              <span>Additional Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 bg-yellow-50 p-4 rounded-lg">
              {formatContent(lessonPlan.notes)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}