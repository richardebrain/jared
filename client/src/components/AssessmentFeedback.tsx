import React from 'react';
import { ThumbsUp, AlertCircle, Star, Trophy, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnswerResponse } from '@/services/enhancedAssessmentService';

interface AssessmentFeedbackProps {
  feedback: AnswerResponse;
  onContinue: () => void;
  userName?: string;
}

const AssessmentFeedback: React.FC<AssessmentFeedbackProps> = ({ 
  feedback, 
  onContinue,
  userName
}) => {
  // Get user first name for personalization
  const firstName = userName || 'Teacher';
  
  // Generate personalized correct answer message
  const getCorrectMessage = () => {
    const messages = [
      `Excellent work, ${firstName}! That's correct!`,
      `Amazing job, ${firstName}! You got it right!`,
      `Outstanding, ${firstName}! That's the right answer!`,
      `Brilliant thinking, ${firstName}! You're correct!`,
      `Fantastic, ${firstName}! You nailed it!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Generate personalized incorrect answer message
  const getIncorrectMessage = () => {
    const messages = [
      `Not quite right, ${firstName}. Let's learn from this!`,
      `That's not correct, ${firstName}, but it's how we learn and grow!`,
      `Good try, ${firstName}! Let's see the correct answer and learn together.`,
      `Not this time, ${firstName}, but keep going - you're making progress!`,
      `That's not it, ${firstName}, but remember: mistakes help us improve!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Card className={`mt-4 border ${feedback.is_correct ? 'border-green-200' : 'border-amber-200'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${
            feedback.is_correct ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            {feedback.is_correct ? (
              <ThumbsUp className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${
              feedback.is_correct ? 'text-green-600' : 'text-amber-600'
            }`}>
              {feedback.is_correct ? getCorrectMessage() : getIncorrectMessage()}
            </h3>
            
            <div className="mt-2 text-sm">
              {feedback.explanation && (
                <p className="mb-3">{feedback.explanation}</p>
              )}
              
              {!feedback.is_correct && feedback.correct_answer && (
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    <strong>Correct answer:</strong> {feedback.correct_answer}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-4 w-4" />
                <span>
                  <strong>Points earned:</strong> {feedback.points_earned}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={onContinue} 
              className="mt-4"
              variant={feedback.is_correct ? "default" : "outline"}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentFeedback;