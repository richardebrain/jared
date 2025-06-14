import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, RotateCcw, ChevronRight } from 'lucide-react';

interface ScenarioItem {
  id: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ScenarioMatchSectionProps {
  content: string;
  title: string;
}

export default function ScenarioMatchSection({ content, title }: ScenarioMatchSectionProps) {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>(() => {
    try {
      // Parse the JSON content from the API
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing scenario content:', error);
      return [];
    }
  });

  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  const currentScenario = scenarios[currentScenarioIndex];

  const handleAnswerSelect = (scenarioId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [scenarioId]: answerIndex
    }));
  };

  const handleSubmitAnswer = (scenarioId: string) => {
    setShowExplanations(prev => ({
      ...prev,
      [scenarioId]: true
    }));

    // Auto-advance to next scenario after showing explanation
    setTimeout(() => {
      if (currentScenarioIndex < scenarios.length - 1) {
        setCurrentScenarioIndex(prev => prev + 1);
      } else {
        setCompleted(true);
      }
    }, 3000);
  };

  const resetActivity = () => {
    setCurrentScenarioIndex(0);
    setSelectedAnswers({});
    setShowExplanations({});
    setCompleted(false);
  };

  const goToNextScenario = () => {
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    }
  };

  const goToPreviousScenario = () => {
    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(prev => prev - 1);
    }
  };

  if (scenarios.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No scenarios available for this section.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    const correctCount = scenarios.filter(scenario => 
      selectedAnswers[scenario.id] === scenario.correctAnswer
    ).length;

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">
            Scenario Matching Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Your Results</h3>
            <p className="text-2xl font-bold text-green-600">
              {correctCount} out of {scenarios.length} scenarios handled correctly
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {correctCount === scenarios.length 
                ? "Excellent! You've mastered these scenarios." 
                : "Good effort! Review the explanations to improve your responses."}
            </p>
          </div>
          <Button onClick={resetActivity} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              Scenario {currentScenarioIndex + 1} of {scenarios.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentScenarioIndex + 1) / scenarios.length) * 100}%` }}
            />
          </div>

          {/* Current scenario */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Scenario:</h3>
            <p className="text-blue-800 leading-relaxed">
              {currentScenario.scenario}
            </p>
          </div>

          {/* Answer options */}
          <div>
            <h4 className="font-medium mb-4 text-gray-700">
              How would you respond to this situation?
            </h4>
            <RadioGroup
              value={selectedAnswers[currentScenario.id]?.toString() || ""}
              onValueChange={(value) => handleAnswerSelect(currentScenario.id, parseInt(value))}
              className="space-y-3"
              disabled={showExplanations[currentScenario.id]}
            >
              {currentScenario.options.map((option, index) => {
                const isSelected = selectedAnswers[currentScenario.id] === index;
                const isCorrect = index === currentScenario.correctAnswer;
                const showFeedback = showExplanations[currentScenario.id];

                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${
                      showFeedback
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isSelected
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => !showFeedback && handleAnswerSelect(currentScenario.id, index)}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      className="mt-1 flex-shrink-0"
                      disabled={showFeedback}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="text-sm leading-relaxed flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                    
                    {showFeedback && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    
                    {showFeedback && isSelected && !isCorrect && (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Explanation */}
          {showExplanations[currentScenario.id] && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="font-semibold text-amber-900 mb-2">Explanation:</h4>
              <p className="text-amber-800 leading-relaxed">
                {currentScenario.explanation}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousScenario}
              disabled={currentScenarioIndex === 0}
            >
              Previous
            </Button>

            <div className="space-x-2">
              {!showExplanations[currentScenario.id] ? (
                <Button
                  onClick={() => handleSubmitAnswer(currentScenario.id)}
                  disabled={selectedAnswers[currentScenario.id] === undefined}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={goToNextScenario}
                  disabled={currentScenarioIndex === scenarios.length - 1}
                >
                  Next Scenario
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}