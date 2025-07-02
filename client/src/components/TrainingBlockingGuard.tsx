import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AssignedTraining from "./AssignedTraining";

interface TrainingBlockingGuardProps {
  children: React.ReactNode;
}

export default function TrainingBlockingGuard({ children }: TrainingBlockingGuardProps) {
  const { data: blockingStatus, isLoading } = useQuery({
    queryKey: ["/api/training-assignments/blocking"],
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds when user has blocking assignments
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking training requirements...</p>
        </div>
      </div>
    );
  }

  // If user has blocking assignments, show blocked interface
  if (blockingStatus?.hasBlockingAssignments) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-red-600 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-bold">Required Training - Platform Access Restricted</h1>
                <p className="text-red-100">Please complete the assigned training modules below to continue using the platform.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Information Card */}
            <Card className="mb-8 border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <BookOpen className="h-5 w-5" />
                  Platform Access Temporarily Restricted
                </CardTitle>
                <CardDescription className="text-red-700">
                  Your administrator has assigned mandatory training modules that must be completed before you can access other platform features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">What you need to know:</h3>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• These training modules are required by your administrator</li>
                    <li>• You must complete all required training to regain full platform access</li>
                    <li>• Your progress is automatically tracked as you complete each module</li>
                    <li>• Once completed, you'll immediately regain access to all platform features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Training */}
            <AssignedTraining />

            {/* Help Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you have questions about these training requirements or need technical assistance, please contact your administrator or school director.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If no blocking assignments, render children normally
  return <>{children}</>;
}