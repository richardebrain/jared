import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Clock, 
  Brain, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle 
} from 'lucide-react';

interface AssessmentIntroductionProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function AssessmentIntroduction({ onContinue, onBack }: AssessmentIntroductionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">Initial Assessment Overview</CardTitle>
          <CardDescription className="text-lg">
            Discover your strengths and growth opportunities in early childhood education
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Purpose Section */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Purpose of This Assessment</h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
              This comprehensive assessment evaluates your knowledge and skills across the key domains 
              of early childhood education. Your results will create a personalized learning path 
              tailored specifically to your professional development needs.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Adaptive Technology</h4>
                  <p className="text-sm text-muted-foreground">
                    Questions adjust to your skill level, providing an accurate assessment 
                    across 6 difficulty levels from beginner to master.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Personalized Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed insights into your strengths and growth areas with 
                    specific mini-lesson recommendations.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Time-Efficient</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete in 30-40 minutes with 60 seconds per question. 
                    The assessment adapts to optimize your time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Evidence-Based</h4>
                  <p className="text-sm text-muted-foreground">
                    Questions are aligned with NAEYC standards and current 
                    early childhood education best practices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Structure */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Assessment Structure</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">40</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">10</div>
                <div className="text-sm text-muted-foreground">ECE Domains</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">30-40</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• This is a one-time assessment that cannot be retaken</li>
              <li>• You must complete all questions in a single session</li>
              <li>• There's no passing or failing - this is for your professional development</li>
              <li>• Take your time to read each question carefully</li>
              <li>• Your results will remain confidential and are for your use only</li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">What You'll Gain</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Badge variant="outline" className="p-3 justify-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Detailed performance analysis by domain
              </Badge>
              <Badge variant="outline" className="p-3 justify-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Personalized learning path recommendations
              </Badge>
              <Badge variant="outline" className="p-3 justify-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Targeted mini-lessons for growth areas
              </Badge>
              <Badge variant="outline" className="p-3 justify-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Professional development insights
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Eligibility
            </Button>
            <Button onClick={onContinue} size="lg" className="sm:w-auto">
              Continue to Domain Overview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 