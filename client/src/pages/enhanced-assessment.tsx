import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedAssessment from '@/components/EnhancedAssessment';

/**
 * Enhanced Assessment Page
 * 
 * This page integrates the new FastAPI-powered assessment system with enhanced ECE question database
 * providing personalized learning paths based on user performance
 */
export default function EnhancedAssessmentPage() {
  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Enhanced Professional Development Assessment</CardTitle>
          <CardDescription>
            Complete this assessment to identify your strengths and create a personalized professional development plan.
            The enhanced system adapts to your knowledge level and provides in-depth explanations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">What to Expect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Questions from multiple domains of early childhood education</li>
                <li>Special focus areas: Core Values, Mindful Morning, and Building a Human</li>
                <li>Difficulty adapts based on your performance</li>
                <li>Personalized learning path on completion</li>
                <li>Earn 10 points for completing the assessment</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">Enhanced Features</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Detailed explanations with teaching guidance</li>
                <li>Scientific background and implementation strategies</li>
                <li>Precise domain targeting for personalized development</li>
                <li>Advanced question selection based on difficulty progression</li>
                <li>Comprehensive result analysis and learning recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <EnhancedAssessment />
    </div>
  );
}