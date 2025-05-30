import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface AssessmentCommitmentProps {
  onStartAssessment: () => void;
  onBack: () => void;
  isStarting: boolean;
}

export default function AssessmentCommitment({ onStartAssessment, onBack, isStarting }: AssessmentCommitmentProps) {
  const [agreements, setAgreements] = useState({
    timeCommitment: false,
    oneTimeOnly: false,
    noInterruption: false,
    bestEffort: false
  });

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleAgreementChange = (key: keyof typeof agreements) => {
    setAgreements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Assessment Commitment</CardTitle>
          <CardDescription className="text-lg">
            Please confirm your understanding and commitment before beginning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Key Requirements */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This assessment must be completed in one continuous session. 
              There is no option to save and resume later.
            </AlertDescription>
          </Alert>

          {/* Assessment Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assessment Requirements</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="timeCommitment" 
                  checked={agreements.timeCommitment}
                  onCheckedChange={() => handleAgreementChange('timeCommitment')}
                />
                <div className="space-y-1">
                  <label htmlFor="timeCommitment" className="text-sm font-medium cursor-pointer">
                    I understand this assessment takes 30-40 minutes to complete
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I have allocated sufficient time to complete all 40 questions without rushing.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="oneTimeOnly" 
                  checked={agreements.oneTimeOnly}
                  onCheckedChange={() => handleAgreementChange('oneTimeOnly')}
                />
                <div className="space-y-1">
                  <label htmlFor="oneTimeOnly" className="text-sm font-medium cursor-pointer">
                    I understand this is a one-time assessment that cannot be retaken
                  </label>
                  <p className="text-xs text-muted-foreground">
                    My responses will determine my personalized learning path permanently.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="noInterruption" 
                  checked={agreements.noInterruption}
                  onCheckedChange={() => handleAgreementChange('noInterruption')}
                />
                <div className="space-y-1">
                  <label htmlFor="noInterruption" className="text-sm font-medium cursor-pointer">
                    I will complete this assessment without interruption
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I am in a quiet environment and will not pause or leave during the assessment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="bestEffort" 
                  checked={agreements.bestEffort}
                  onCheckedChange={() => handleAgreementChange('bestEffort')}
                />
                <div className="space-y-1">
                  <label htmlFor="bestEffort" className="text-sm font-medium cursor-pointer">
                    I will provide thoughtful, honest responses to all questions
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I understand this assessment is for my professional development and will answer authentically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Technical Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stable internet connection</li>
              <li>• Avoid browser refresh or navigation</li>
              <li>• Keep this tab active during assessment</li>
              <li>• Disable browser notifications if possible</li>
            </ul>
          </div>

          {/* What Happens Next */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              What Happens Next:
            </h4>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>Assessment session begins with your first question</li>
              <li>Questions adapt to your skill level automatically</li>
              <li>60-second timer per question with visual indicators</li>
              <li>Progress tracking throughout the assessment</li>
              <li>Immediate results and learning path upon completion</li>
            </ol>
          </div>

          {/* Timer Information */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Each question has a 60-second time limit. If time expires, the question will be marked 
              as incorrect and the assessment will automatically proceed to the next question.
            </AlertDescription>
          </Alert>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
            <Button variant="outline" onClick={onBack} disabled={isStarting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Button>
            <Button 
              onClick={onStartAssessment} 
              size="lg" 
              disabled={!allAgreed || isStarting}
              className="sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Assessment...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Assessment Now
                </>
              )}
            </Button>
          </div>

          {!allAgreed && (
            <p className="text-sm text-muted-foreground text-center">
              Please check all boxes above to confirm your commitment before starting.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 