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
    // Remove markdown hashtags and format content nicely
    return content
      .replace(/#{1,6}\s*/g, '') // Remove hashtags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line.trim()}
        </p>
      ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Learning Objectives</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lessonPlan.objectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-medium min-w-[20px]">{index + 1}.</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Materials */}
      {lessonPlan.materials && lessonPlan.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span>Materials Needed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lessonPlan.materials.map((material, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>{material}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities */}
      {lessonPlan.activities && lessonPlan.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
              <span>Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {lessonPlan.activities.map((activity, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{activity.name || `Activity ${index + 1}`}</h4>
                  {activity.duration && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration} min</span>
                    </Badge>
                  )}
                </div>
                
                {activity.description && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Description:</h5>
                    <div className="text-gray-700 pl-4">
                      {formatContent(activity.description)}
                    </div>
                  </div>
                )}
                
                {activity.instructions && activity.instructions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Step-by-Step Instructions:</h5>
                    <ol className="space-y-2 pl-4">
                      {activity.instructions.map((instruction, instIndex) => (
                        <li key={instIndex} className="flex items-start space-x-2">
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                            {instIndex + 1}
                          </span>
                          <span className="flex-1">{instruction}</span>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-orange-600" />
              <span>Assessment Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700">
              {formatContent(lessonPlan.assessment)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arizona Standards Referenced */}
      {referencedStandards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Arizona Early Learning Standards</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referencedStandards.map((standard) => (
                <div key={standard.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {standard.standardCode}
                    </Badge>
                    <span className="text-sm text-gray-600">{standard.standardArea}</span>
                  </div>
                  <p className="text-sm">{standard.standardText}</p>
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