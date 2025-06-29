import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Users, AlertTriangle, Trash2 } from "lucide-react";

interface CompreFaceStatus {
  configured: boolean;
  healthy: boolean;
  subjectCount: number;
  subjects: string[];
}

interface RegistrationResult {
  childId: number;
  name: string;
  success: boolean;
  error?: string;
}

interface BulkRegistrationResponse {
  success: boolean;
  message: string;
  results: RegistrationResult[];
}

export default function CompreFaceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query CompreFace status
  const { data: status, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['/api/compreface/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation for bulk registration
  const bulkRegisterMutation = useMutation({
    mutationFn: async (): Promise<BulkRegistrationResponse> => {
      const response = await fetch('/api/compreface/register-all-children', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register children');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Registration Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/compreface/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBulkRegister = () => {
    bulkRegisterMutation.mutate();
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Error Loading CompreFace Status
            </CardTitle>
            <CardDescription>
              Unable to connect to CompreFace service. Please check your configuration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const compreFaceStatus = status as CompreFaceStatus;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CompreFace Integration</h1>
          <p className="text-muted-foreground">
            Manage facial recognition settings and child registration
          </p>
        </div>
      </div>

      {/* Service Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            CompreFace facial recognition service configuration and health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Configuration:</span>
              <Badge variant={compreFaceStatus.configured ? "default" : "destructive"}>
                {compreFaceStatus.configured ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Health:</span>
              <Badge variant={compreFaceStatus.healthy ? "default" : "destructive"}>
                {compreFaceStatus.healthy ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Unhealthy
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Registered Children:</span>
              <Badge variant="outline">
                {compreFaceStatus.subjectCount} subjects
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={compreFaceStatus.configured && compreFaceStatus.healthy ? "default" : "secondary"}>
                {compreFaceStatus.configured && compreFaceStatus.healthy ? "Ready" : "Not Ready"}
              </Badge>
            </div>
          </div>

          {!compreFaceStatus.configured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Configuration Required</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    CompreFace is not configured. Please set the following environment variables:
                  </p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• COMPREFACE_BASE_URL - Base URL of your CompreFace instance</li>
                    <li>• COMPREFACE_API_KEY - API key for CompreFace</li>
                    <li>• COMPREFACE_RECOGNITION_KEY - Recognition service key</li>
                    <li>• COMPREFACE_DETECTION_KEY - Detection service key (optional)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Registration Card */}
      {compreFaceStatus.configured && compreFaceStatus.healthy && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Registration</CardTitle>
            <CardDescription>
              Register all children with reference photos to CompreFace for improved facial recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Register Children with Reference Photos
                </p>
                <p className="text-sm text-muted-foreground">
                  This will add all children who have reference photos to CompreFace for better facial recognition accuracy.
                </p>
              </div>
              <Button 
                onClick={handleBulkRegister}
                disabled={bulkRegisterMutation.isPending}
                className="shrink-0"
              >
                {bulkRegisterMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Register All Children
                  </>
                )}
              </Button>
            </div>

            {bulkRegisterMutation.data && (
              <div className="space-y-2">
                <h4 className="font-medium">Registration Results:</h4>
                <div className="space-y-1">
                  {bulkRegisterMutation.data.results.map((result) => (
                    <div key={result.childId} className="flex items-center justify-between text-sm">
                      <span>{result.name}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registered Subjects Card */}
      {compreFaceStatus.configured && compreFaceStatus.healthy && compreFaceStatus.subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registered Subjects</CardTitle>
            <CardDescription>
              Children currently registered in CompreFace for facial recognition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {compreFaceStatus.subjects.map((subject) => (
                <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">
                    {subject.replace(/^child_\d+_/, '').replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Registered
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>About CompreFace Integration</CardTitle>
          <CardDescription>
            Benefits of using CompreFace for facial recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800">Benefits</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Higher accuracy facial recognition</li>
                <li>• Self-hosted data control</li>
                <li>• Faster recognition processing</li>
                <li>• Better handling of lighting conditions</li>
                <li>• Improved child photo matching</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Features</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• 1:1 face verification</li>
                <li>• Age and gender detection</li>
                <li>• Mask detection support</li>
                <li>• Facial landmark analysis</li>
                <li>• Real-time processing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}