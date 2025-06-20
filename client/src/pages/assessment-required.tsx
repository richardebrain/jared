import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, ArrowRight, BookOpen, Target, Award } from 'lucide-react';

export default function AssessmentRequired() {
  const [, setLocation] = useLocation();

  const handleStartAssessment = () => {
    setLocation('/initial-assessment');
  };

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Assessment Required
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Before accessing learning modules, we need to understand your current knowledge level
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Target className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                The initial assessment helps us create a personalized learning path tailored to your specific needs and experience level.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                What to Expect
              </h3>
              
              <div className="grid gap-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Assessment Overview</p>
                    <p className="text-sm text-gray-600">Learn about the assessment process and commitment required</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Knowledge Assessment</p>
                    <p className="text-sm text-gray-600">Answer questions about early childhood education practices</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Personalized Results</p>
                    <p className="text-sm text-gray-600">Receive your customized learning path and recommendations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Benefits</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Get modules that match your experience level</li>
                <li>• Focus on areas where you can grow the most</li>
                <li>• Track your progress with meaningful benchmarks</li>
                <li>• Earn professional development credits efficiently</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleStartAssessment} 
                size="lg" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Start Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBackToDashboard}
                size="lg"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              The assessment takes approximately 15-20 minutes to complete and can only be taken once.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}