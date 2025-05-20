import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SimpleStandaloneAssessment() {
  // Redirect to the standalone HTML file
  const openStandaloneAssessment = () => {
    window.open('/dynamic-ece-assessment.html', '_blank');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MentorMe ECE Assessment</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About this Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This adaptive assessment will evaluate your ECE knowledge across multiple domains.
              The difficulty will automatically adjust based on your performance:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><span className="font-medium">Level 1:</span> Foundational questions (5 points each)</li>
              <li><span className="font-medium">Level 2:</span> Intermediate questions (10 points each)</li>
              <li><span className="font-medium">Level 3:</span> Advanced questions (15 points each)</li>
            </ul>
            <p className="mb-6">
              Your score and earned points will automatically be saved to your profile at the end of the assessment.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={openStandaloneAssessment}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
              >
                Launch Assessment in New Window
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How This Assessment Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Adaptive Difficulty</h3>
                <p>
                  This assessment dynamically adjusts to your knowledge level. Answer questions correctly to progress to 
                  more challenging content. If you miss questions, the system will provide more accessible questions.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">Domain Analysis</h3>
                <p>
                  Your performance is tracked across multiple early childhood education domains, helping identify your 
                  strengths and areas for growth.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-2">Personalized Learning</h3>
                <p>
                  Based on your results, you'll receive personalized learning recommendations to help you continue 
                  your professional development journey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}