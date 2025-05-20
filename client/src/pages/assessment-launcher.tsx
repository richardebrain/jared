import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssessmentLauncher() {
  const launchAssessment = () => {
    // Create a direct link to the standalone HTML file
    window.open('/dynamic-ece-assessment.html', '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MentorMe ECE Assessment</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Launch Your Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Click the button below to start your adaptive ECE assessment in a new window.
              This standalone version works best for optimal performance.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={launchAssessment}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
              >
                Start Assessment Now
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About This Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="mb-4">
                This adaptive assessment will evaluate your ECE knowledge across multiple domains.
                The difficulty will automatically adjust based on your performance:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><span className="font-medium">Level 1:</span> Foundational questions (5 points each)</li>
                <li><span className="font-medium">Level 2:</span> Intermediate questions (10 points each)</li>
                <li><span className="font-medium">Level 3:</span> Advanced questions (15 points each)</li>
              </ul>
              <p>
                Your score and earned points will automatically be saved to your profile at the end of the assessment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}