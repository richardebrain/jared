import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wand2, Edit, Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ScenarioItem {
  id: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ScenarioMatchSectionBuilderProps {
  content: string;
  onContentChange: (content: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onRegenerateAI: () => void;
}

export default function ScenarioMatchSectionBuilder({
  content,
  onContentChange,
  isEditing,
  onEditToggle,
  onRegenerateAI
}: ScenarioMatchSectionBuilderProps) {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Parse content when it changes
  useEffect(() => {
    try {
      if (content && content !== '[]' && content !== '') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setScenarios(parsed);
        }
      }
    } catch (error) {
      console.error('Error parsing scenario content:', error);
      setScenarios([]);
    }
  }, [content]);

  // Update content when scenarios change (with debouncing to prevent infinite loops)
  const updateContent = useCallback((newScenarios: ScenarioItem[]) => {
    const newContent = JSON.stringify(newScenarios);
    if (newContent !== content) {
      onContentChange(newContent);
    }
  }, [content, onContentChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateContent(scenarios);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [scenarios, updateContent]);

  const addNewScenario = () => {
    const newScenario: ScenarioItem = {
      id: `scenario-${Date.now()}`,
      scenario: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setScenarios([...scenarios, newScenario]);
  };

  const updateScenario = (index: number, field: keyof ScenarioItem, value: any) => {
    const updated = [...scenarios];
    updated[index] = { ...updated[index], [field]: value };
    setScenarios(updated);
  };

  const updateOption = (scenarioIndex: number, optionIndex: number, value: string) => {
    const updated = [...scenarios];
    updated[scenarioIndex].options[optionIndex] = value;
    setScenarios(updated);
  };

  const removeScenario = (index: number) => {
    setScenarios(scenarios.filter((_, i) => i !== index));
  };

  const generateAIScenarios = async () => {
    setIsGenerating(true);
    try {
      // Use the AI regeneration function passed from parent
      onRegenerateAI();
      toast({
        title: "Generating Scenarios",
        description: "AI is creating interactive scenario matching exercises.",
      });
    } catch (error) {
      console.error('Error generating scenarios:', error);
      // Provide example scenarios
      const exampleScenarios: ScenarioItem[] = [
        {
          id: 'example-1',
          scenario: 'A 4-year-old child is having a meltdown during circle time, crying loudly and disrupting the group activity.',
          options: [
            'Remove the child from the group immediately',
            'Ignore the behavior and continue with circle time',
            'Offer comfort and a calm-down space with sensory tools',
            'Give the child a timeout in the corner'
          ],
          correctAnswer: 2,
          explanation: 'Offering comfort and a calm-down space helps the child regulate emotions while maintaining their dignity and teaching self-regulation skills.'
        },
        {
          id: 'example-2',
          scenario: 'Two children are fighting over a popular toy during free play time.',
          options: [
            'Take the toy away from both children',
            'Give the toy to whoever had it first',
            'Implement a sharing timer and teach turn-taking',
            'Tell them to figure it out themselves'
          ],
          correctAnswer: 2,
          explanation: 'Using a sharing timer teaches children about fairness, patience, and turn-taking while providing a concrete solution they can understand.'
        },
        {
          id: 'example-3',
          scenario: 'A new child cries every morning at drop-off and clings to their parent.',
          options: [
            'Have the parent leave quickly to avoid prolonging the upset',
            'Allow the parent to stay as long as needed',
            'Establish a consistent goodbye routine with comfort items',
            'Distract the child while the parent sneaks out'
          ],
          correctAnswer: 2,
          explanation: 'A consistent goodbye routine with comfort items helps children feel secure and builds trust, making transitions easier over time.'
        }
      ];
      setScenarios(exampleScenarios);
      toast({
        title: "Example Scenarios Provided",
        description: "Sample scenarios have been added to get you started.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Scenario Matching Exercise</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive scenarios with multiple choice responses for practical learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAIScenarios}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            AI Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditToggle}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No scenarios created yet.</p>
            <Button onClick={addNewScenario} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Scenario
            </Button>
          </div>
        ) : (
          <>
            {scenarios.map((scenario, index) => (
              <Card key={scenario.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Scenario {index + 1}</Badge>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScenario(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor={`scenario-${index}`}>Scenario Description</Label>
                        <Textarea
                          id={`scenario-${index}`}
                          value={scenario.scenario}
                          onChange={(e) => updateScenario(index, 'scenario', e.target.value)}
                          placeholder="Describe the classroom scenario..."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Response Options</Label>
                        <div className="space-y-2 mt-2">
                          {scenario.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <Badge
                                variant={optionIndex === scenario.correctAnswer ? "default" : "outline"}
                                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                                onClick={() => updateScenario(index, 'correctAnswer', optionIndex)}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </Badge>
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click the letter badge to mark the correct answer
                        </p>
                      </div>

                      <div>
                        <Label htmlFor={`explanation-${index}`}>Explanation</Label>
                        <Textarea
                          id={`explanation-${index}`}
                          value={scenario.explanation}
                          onChange={(e) => updateScenario(index, 'explanation', e.target.value)}
                          placeholder="Explain why this is the best response..."
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-2">Scenario:</h4>
                        <p className="text-orange-800">{scenario.scenario}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Response Options:</h4>
                        {scenario.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-start space-x-3 p-3 rounded-lg border ${
                              optionIndex === scenario.correctAnswer
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <Badge
                              variant={optionIndex === scenario.correctAnswer ? "default" : "outline"}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </Badge>
                            <p className="text-sm flex-1">{option}</p>
                          </div>
                        ))}
                      </div>

                      {scenario.explanation && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <h4 className="font-medium text-amber-900 mb-2">Explanation:</h4>
                          <p className="text-amber-800 text-sm">{scenario.explanation}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            {isEditing && (
              <div className="flex justify-center pt-4">
                <Button onClick={addNewScenario} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Scenario
                </Button>
              </div>
            )}
          </>
        )}

        {scenarios.length > 0 && !isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Learning Objective:</h4>
            <p className="text-blue-800 text-sm">
              Practice decision-making skills in realistic classroom scenarios. Each scenario presents 
              a common situation early childhood educators face, helping you develop appropriate 
              response strategies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}