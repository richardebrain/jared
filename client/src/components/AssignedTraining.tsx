import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TrainingAssignment {
  id: number;
  moduleId: number;
  moduleTitle: string;
  moduleDescription: string;
  moduleDuration: number;
  moduleDifficulty: string;
  moduleCategory: string;
  assignedAt: string;
  dueDate?: string;
  priority: string;
  assignmentMessage?: string;
  isBlocking: boolean;
  assignedBy: string;
}

export default function AssignedTraining() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/training-assignments"],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const completeMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest(`/api/training-assignments/${assignmentId}/complete`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments/blocking"] });
      toast({
        title: "Assignment Completed",
        description: "Training assignment marked as completed!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete assignment",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Assigned Training</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!assignments.length) {
    return null; // Don't show section if no assignments
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const blockingAssignments = assignments.filter((a: TrainingAssignment) => a.isBlocking);
  const nonBlockingAssignments = assignments.filter((a: TrainingAssignment) => !a.isBlocking);

  return (
    <div className="space-y-6">
      {/* Blocking Assignments - High Priority */}
      {blockingAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Required Training - Complete to Access Platform
            </h3>
          </div>
          <div className="space-y-3">
            {blockingAssignments.map((assignment: TrainingAssignment) => (
              <Card key={assignment.id} className="border-l-4 border-l-red-500 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg text-red-900">{assignment.moduleTitle}</CardTitle>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="text-red-700">
                        Assigned by {assignment.assignedBy} on {formatDate(assignment.assignedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-red-800">{assignment.moduleDescription}</p>
                  
                  {assignment.assignmentMessage && (
                    <div className="bg-red-100 p-3 rounded-md border border-red-200">
                      <p className="text-sm text-red-900 font-medium">Message from Administrator:</p>
                      <p className="text-sm text-red-800 mt-1">{assignment.assignmentMessage}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-red-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{assignment.moduleDuration} min</span>
                      </div>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due {formatDate(assignment.dueDate)}</span>
                        </div>
                      )}
                    </div>
                    <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                      <Link href={`/modules/${assignment.moduleId}`}>
                        Start Training
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Non-Blocking Assignments */}
      {nonBlockingAssignments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Assigned Training</h3>
          <div className="space-y-3">
            {nonBlockingAssignments.map((assignment: TrainingAssignment) => (
              <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{assignment.moduleTitle}</CardTitle>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>
                        Assigned by {assignment.assignedBy} on {formatDate(assignment.assignedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{assignment.moduleDescription}</p>
                  
                  {assignment.assignmentMessage && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Message from Administrator:</p>
                      <p className="text-sm text-blue-800 mt-1">{assignment.assignmentMessage}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{assignment.moduleDuration} min</span>
                      </div>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due {formatDate(assignment.dueDate)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => completeMutation.mutate(assignment.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/modules/${assignment.moduleId}`}>
                          Start Training
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}