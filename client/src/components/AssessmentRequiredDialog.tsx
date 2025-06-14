import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, BookOpen, Award } from 'lucide-react';
import { useLocation } from 'wouter';

interface AssessmentRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssessmentRequiredDialog({ isOpen, onClose }: AssessmentRequiredDialogProps) {
  const [, setLocation] = useLocation();

  const handleStartAssessment = () => {
    onClose();
    setLocation('/assessment');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            Assessment Required
          </DialogTitle>
          <DialogDescription>
            Complete your initial assessment to unlock learning modules and receive 30 points
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Why Take the Assessment?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your assessment helps us create a personalized learning path and awards you 30 initial points to start your journey.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">What to Expect:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                30-40 questions about early childhood education
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Personalized learning recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                30 points to introduce you to our system
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Access to all learning modules
              </li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleStartAssessment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Start Assessment
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-4"
            >
              Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}