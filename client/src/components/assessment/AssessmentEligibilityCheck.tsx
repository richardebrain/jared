import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  UserCheck, 
  Shield, 
  Award,
  ArrowRight,
  XCircle
} from 'lucide-react';

interface AssessmentEligibilityCheckProps {
  user: any;
  isTeacher: boolean;
  hasCompletedAssessment: boolean;
  onContinue: () => void;
  onViewResults: () => void;
}

export default function AssessmentEligibilityCheck({ 
  user, 
  isTeacher, 
  hasCompletedAssessment, 
  onContinue, 
  onViewResults 
}: AssessmentEligibilityCheckProps) {
  
  // Determine user role for display
  const getUserRole = () => {
    if (user?.isOwner) return 'App Owner';
    if (user?.isAdmin) return 'Platform Admin';
    if (user?.isSchoolAdmin) return 'School Admin';
    return 'Teacher';
  };

  const userRole = getUserRole();

  // If user has already completed assessment
  if (hasCompletedAssessment) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Assessment Already Completed</CardTitle>
            <CardDescription>
              You have successfully completed your initial assessment. Great work!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Alert>
              <Award className="h-4 w-4" />
              <AlertDescription>
                Each teacher can complete the initial assessment only once to ensure fair and consistent results.
                Your personalized learning path has been generated based on your responses.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onViewResults} size="lg">
                View My Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not a teacher (admin/school admin/owner)
  if (!isTeacher) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription>
              Initial assessments are designed specifically for Teacher role users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Your Role: {userRole}
              </Badge>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Teacher Role Required:</strong> Initial assessments are specifically designed to evaluate 
                early childhood education knowledge and skills for classroom teachers. Administrators and 
                school directors have access to different assessment tools tailored to their roles.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Available for Your Role:</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                {user?.isOwner && (
                  <>
                    <li>• Platform analytics and insights</li>
                    <li>• School management tools</li>
                    <li>• System administration features</li>
                  </>
                )}
                {user?.isSchoolAdmin && (
                  <>
                    <li>• Teacher performance analytics</li>
                    <li>• School-wide progress reports</li>
                    <li>• Module assignment tools</li>
                  </>
                )}
                {user?.isAdmin && (
                  <>
                    <li>• User management tools</li>
                    <li>• Content administration</li>
                    <li>• Platform monitoring</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="text-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is eligible teacher
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">You're Eligible!</CardTitle>
          <CardDescription>
            Welcome, {user?.firstName}! You're ready to take the initial assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {isTeacher ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Educator Role Verified ✓</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Educator Role Required</span>
              </div>
            )}
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>One-Time Assessment:</strong> This initial assessment can only be completed once 
              to ensure fair and consistent results. Take your time and answer thoughtfully.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Assessment Eligibility</h3>
              <p className="text-sm text-blue-700">
                Initial assessments are designed for educators to evaluate professional knowledge 
                and identify growth opportunities in early childhood education.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={onContinue} size="lg" className="w-full sm:w-auto">
              Continue to Assessment Introduction
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 