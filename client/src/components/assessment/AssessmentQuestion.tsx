import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CheckCircle, 
  Loader2,
  ArrowRight
} from 'lucide-react';

interface QuestionData {
  id: string;
  text: string;
  options: string[];
  domain: string;
  domainName: string;
  difficulty: number;
  sequence: number;
  explanation?: string;
  tags?: string[];
}

interface AssessmentQuestionProps {
  question: QuestionData;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  onAnswerSubmit: () => void;
  isSubmitting: boolean;
  hasSelectedAnswer: boolean;
}

export default function AssessmentQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
  onAnswerSubmit,
  isSubmitting,
  hasSelectedAnswer
}: AssessmentQuestionProps) {

  const handleRadioChange = (value: string) => {
    const answerIndex = parseInt(value);
    onAnswerSelect(answerIndex);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Question {question.sequence}</CardTitle>
            <CardDescription className="text-sm">
              {question.domainName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 leading-relaxed">
            {question.text}
          </h3>
        </div>

        {/* Answer Options */}
        <div>
          <h4 className="font-medium mb-4 text-gray-700">Select your answer:</h4>
          <RadioGroup
            value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
            onValueChange={handleRadioChange}
            className="space-y-3"
            disabled={isSubmitting}
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isSubmitting && onAnswerSelect(index)}
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                  className="mt-1 flex-shrink-0"
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className={`text-sm leading-relaxed flex-1 ${
                    isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="font-medium text-gray-600 mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
                {selectedAnswer === index && (
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onAnswerSubmit}
            disabled={!hasSelectedAnswer || isSubmitting}
            size="lg"
            className="min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Answer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Helper Text */}
        {!hasSelectedAnswer && !isSubmitting && (
          <p className="text-center text-sm text-muted-foreground">
            Please select an answer before submitting
          </p>
        )}
        
        {isSubmitting && (
          <p className="text-center text-sm text-blue-600">
            Processing your answer and loading next question...
          </p>
        )}
      </CardContent>
    </Card>
  );
} 