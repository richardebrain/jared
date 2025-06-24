import React, { useEffect } from 'react';
import { useSimpleAuth } from '@/lib/simple-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export default function StandaloneAssessment() {
  const { user } = useSimpleAuth();
  
  useEffect(() => {
    // Create iframe element with specific height
    const iframe = document.createElement('iframe');
    iframe.src = '/simple-assessment.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    
    // Add to container
    const container = document.getElementById('assessment-container');
    if (container) {
      // Clear existing content
      container.innerHTML = '';
      container.appendChild(iframe);
    }
    
    return () => {
      // Clean up iframe on unmount
      if (container && container.contains(iframe)) {
        container.removeChild(iframe);
      }
    };
  }, []);
  
  return (
    <Container>
      <div className="py-8">
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
            <p>
              Your score and earned points will automatically be saved to your profile at the end of the assessment.
            </p>
          </CardContent>
        </Card>
        
        <div id="assessment-container" className="bg-white rounded-lg shadow-sm">
          {/* iframe will be inserted here */}
          <div className="flex justify-center items-center h-96">
            <p className="text-gray-500">Loading assessment...</p>
          </div>
        </div>
      </div>
    </Container>
  );
}