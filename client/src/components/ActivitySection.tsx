import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Target, 
  Puzzle, 
  Users, 
  ArrowRight,
  GripVertical
} from 'lucide-react';

interface ActivityBlock {
  type: string;
  preview: string;
  content: string;
}

interface ParsedActivity {
  activityType: string;
  title: string;
  preview: string;
  instructions: string;
  promptItems: string[];
  answerKey: { [key: string]: string | number };
  uiHints?: string;
  imageSupport?: string;
}

interface ActivitySectionProps {
  section: {
    title: string;
    content: string | { blocks?: ActivityBlock[] };
    type: string;
    builderData?: any;
  };
  onComplete: () => void;
  isCompleted: boolean;
}

export function ActivitySection({ section, onComplete, isCompleted }: ActivitySectionProps) {
  const [activities, setActivities] = useState<ParsedActivity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<{ [key: number]: any }>({});
  const [activityResults, setActivityResults] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});
  
  // State for scenario activities
  const [scenarioStates, setScenarioStates] = useState<{ [key: number]: { selectedOption: string | null; showFeedback: boolean } }>({});
  
  // State for simulation activities
  const [simulationStates, setSimulationStates] = useState<{ [key: number]: { currentStep: number; completedSteps: number[] } }>({});
  
  // State for matching activities
  const [matchingStates, setMatchingStates] = useState<{ [key: number]: { matches: { [key: string]: string }; selectedLeft: string | null } }>({});
  
  const { toast } = useToast();

  // Parse activity content from section
  useEffect(() => {
    const parseActivityContent = () => {
      let parsedActivities: ParsedActivity[] = [];
      
      // Check if this is a builder-created section with structured data
      if (section.builderData) {
        // Handle different builder types
        if (section.builderData.activities) {
          // Activity builder data
          parsedActivities = section.builderData.activities.map((activity: any) => ({
            activityType: activity.activityType || 'Interactive Activity',
            title: activity.title || 'Activity',
            preview: activity.preview || activity.title || 'Activity',
            instructions: activity.instructions || 'Complete this interactive activity.',
            promptItems: activity.promptItems || [],
            answerKey: activity.answerKey || {},
            uiHints: activity.uiHints,
            imageSupport: activity.imageSupport
          }));
        } else if (section.builderData.scenarios) {
          // Scenario builder data
          parsedActivities = section.builderData.scenarios.map((scenario: any) => ({
            activityType: 'Scenario',
            title: scenario.title || 'Scenario Activity',
            preview: scenario.title || 'Scenario Activity',
            instructions: scenario.context || 'Choose the best response for this scenario.',
            promptItems: scenario.options?.map((opt: any) => opt.text) || [],
            answerKey: {},
            uiHints: 'Select the most appropriate response',
            imageSupport: ''
          }));
        } else if (section.builderData.steps) {
          // Simulation builder data
          parsedActivities = [{
            activityType: 'Simulation',
            title: 'Role-Play Simulation',
            preview: 'Interactive Simulation',
            instructions: 'Follow the simulation steps and practice the scenario.',
            promptItems: section.builderData.steps.map((step: any) => step.title) || [],
            answerKey: {},
            uiHints: 'Complete each step in order',
            imageSupport: ''
          }];
        } else if (section.builderData.pairs) {
          // Matching/Scenario-match builder data
          parsedActivities = [{
            activityType: 'Matching',
            title: 'Matching Activity',
            preview: 'Match items correctly',
            instructions: 'Match each item with its correct pair.',
            promptItems: section.builderData.pairs.flatMap((pair: any) => [
              pair.scenario || pair.term || pair.left,
              pair.response || pair.definition || pair.right
            ]) || [],
            answerKey: {},
            uiHints: 'Drag items to match them correctly',
            imageSupport: ''
          }];
        }
      }
      
      // Fallback to parsing content blocks if no builderData
      if (parsedActivities.length === 0) {
        let blocks: ActivityBlock[] = [];
        
        try {
          if (typeof section.content === 'string') {
            // Try to parse JSON content
            const parsed = JSON.parse(section.content);
            blocks = parsed.blocks || [];
          } else if (section.content && section.content.blocks) {
            blocks = section.content.blocks;
          }
        } catch (error) {
          console.error('Error parsing activity content:', error);
        }

        parsedActivities = blocks.map(block => {
          try {
            // Extract structured data from content
            const content = block.content;
            
            // Parse activity details using regex patterns
            const activityTypeMatch = content.match(/activityType[:\s]*([^\n,]+)/i);
            const titleMatch = content.match(/title[:\s]*([^\n,]+)/i);
            const instructionsMatch = content.match(/instructions[:\s]*([^]+?)(?=promptItems|answerKey|$)/i);
            const promptItemsMatch = content.match(/promptItems[:\s]*\[(.*?)\]/s);
            const answerKeyMatch = content.match(/answerKey[:\s]*\{(.*?)\}/s);
            const uiHintsMatch = content.match(/uiHints[:\s]*([^\n,]+)/i);
            
            let promptItems: string[] = [];
            let answerKey: { [key: string]: string | number } = {};
            
            if (promptItemsMatch) {
              try {
                promptItems = JSON.parse(`[${promptItemsMatch[1]}]`);
              } catch {
                // Fallback: split by commas and clean
                promptItems = promptItemsMatch[1].split(',').map(item => 
                  item.replace(/['"]/g, '').trim()
                ).filter(item => item.length > 0);
              }
            }
            
            if (answerKeyMatch) {
              try {
                answerKey = JSON.parse(`{${answerKeyMatch[1]}}`);
              } catch {
                console.warn('Could not parse answer key for activity');
              }
            }

            return {
              activityType: activityTypeMatch?.[1]?.trim() || 'Interactive Activity',
              title: titleMatch?.[1]?.trim() || block.preview || 'Activity',
              preview: block.preview,
              instructions: instructionsMatch?.[1]?.trim() || 'Complete this interactive activity.',
              promptItems,
              answerKey,
              uiHints: uiHintsMatch?.[1]?.trim(),
              imageSupport: ''
            };
          } catch (error) {
            console.error('Error parsing individual activity:', error);
            return {
              activityType: 'Interactive Activity',
              title: block.preview || 'Activity',
              preview: block.preview,
              instructions: 'Complete this interactive activity.',
              promptItems: [],
              answerKey: {},
            };
          }
        });
      }

      setActivities(parsedActivities);
    };

    parseActivityContent();
  }, [section.content, section.builderData]);

  const handleDragAndMatchActivity = (activity: ParsedActivity, activityIndex: number) => {
    const [dragItems, setDragItems] = useState<string[]>(activity.promptItems.slice(0, Math.floor(activity.promptItems.length / 2)));
    const [dropItems, setDropItems] = useState<string[]>(activity.promptItems.slice(Math.floor(activity.promptItems.length / 2)));
    const [matches, setMatches] = useState<{ [key: string]: string }>({});
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const handleDragStart = (item: string) => {
      setDraggedItem(item);
    };

    const handleDrop = (dropItem: string) => {
      if (draggedItem) {
        setMatches(prev => ({ ...prev, [draggedItem]: dropItem }));
        setDraggedItem(null);
      }
    };

    const handleSubmit = () => {
      let correctCount = 0;
      const totalMatches = Object.keys(activity.answerKey).length;
      
      Object.entries(matches).forEach(([drag, drop]) => {
        if (activity.answerKey[drag] === drop || activity.answerKey[drop] === drag) {
          correctCount++;
        }
      });

      const isCorrect = correctCount >= Math.floor(totalMatches * 0.7); // 70% threshold
      setActivityResults(prev => ({ ...prev, [activityIndex]: isCorrect }));
      setShowResults(prev => ({ ...prev, [activityIndex]: true }));
      
      if (isCorrect) {
        toast({
          title: "Great job!",
          description: "You've successfully completed this matching activity.",
        });
      } else {
        toast({
          title: "Try again",
          description: "Some matches need adjustment. Review and try again.",
          variant: "destructive"
        });
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drag Items */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-blue-600">Drag from here:</h4>
            <div className="space-y-2">
              {dragItems.map(item => (
                <div
                  key={item}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  className={`p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors ${
                    matches[item] ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <GripVertical className="h-4 w-4 text-blue-400 mr-2" />
                    {item}
                  </div>
                  {matches[item] && (
                    <div className="text-xs text-blue-600 mt-1">
                      Matched with: {matches[item]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Drop Items */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-green-600">Drop here:</h4>
            <div className="space-y-2">
              {dropItems.map(item => (
                <div
                  key={item}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(item)}
                  className="p-3 bg-green-50 border-2 border-dashed border-green-200 rounded-lg min-h-[60px] flex items-center hover:border-green-300 transition-colors"
                >
                  {item}
                  {Object.entries(matches).find(([_, drop]) => drop === item) && (
                    <Badge variant="secondary" className="ml-2">
                      Matched
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {!showResults[activityIndex] && (
          <Button 
            onClick={handleSubmit} 
            disabled={Object.keys(matches).length === 0}
            className="w-full"
          >
            Submit Matches
          </Button>
        )}

        {showResults[activityIndex] && (
          <div className={`p-4 rounded-lg ${activityResults[activityIndex] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {activityResults[activityIndex] ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Excellent work!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Please review your matches</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleScenarioChallengeActivity = (activity: ParsedActivity, activityIndex: number) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    
    const scenarios = activity.promptItems.filter((_, index) => index % 2 === 0);
    const responses = activity.promptItems.filter((_, index) => index % 2 === 1);

    const handleSubmit = () => {
      if (!selectedOption) return;
      
      const correctResponse = Object.values(activity.answerKey)[0]; // Assuming first answer is correct
      const isCorrect = selectedOption === correctResponse;
      
      setActivityResults(prev => ({ ...prev, [activityIndex]: isCorrect }));
      setShowResults(prev => ({ ...prev, [activityIndex]: true }));
      
      toast({
        title: isCorrect ? "Correct choice!" : "Consider this...",
        description: isCorrect 
          ? "You selected the most appropriate response." 
          : "Think about what approach would be most effective in this situation.",
        variant: isCorrect ? "default" : "destructive"
      });
    };

    return (
      <div className="space-y-4">
        {/* Scenario Display */}
        {scenarios.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Scenario:</h4>
            <p className="text-amber-700">{scenarios[0]}</p>
          </div>
        )}

        {/* Response Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">How would you respond?</h4>
          {responses.map((response, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedOption === response
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption(response)}
            >
              <div className="flex items-start">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 mt-1 flex-shrink-0 ${
                  selectedOption === response
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedOption === response && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-700">{response}</span>
              </div>
            </div>
          ))}
        </div>

        {!showResults[activityIndex] && (
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Response
          </Button>
        )}

        {showResults[activityIndex] && (
          <div className={`p-4 rounded-lg ${activityResults[activityIndex] ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center">
              {activityResults[activityIndex] ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Great choice!</span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">Good thinking! Consider the alternative approaches as well.</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleCategorizationActivity = (activity: ParsedActivity, activityIndex: number) => {
    const categories = Object.keys(activity.answerKey);
    const items = activity.promptItems;
    const [itemCategories, setItemCategories] = useState<{ [key: string]: string }>({});

    const handleCategorySelect = (item: string, category: string) => {
      setItemCategories(prev => ({ ...prev, [item]: category }));
    };

    const handleSubmit = () => {
      let correctCount = 0;
      
      Object.entries(itemCategories).forEach(([item, category]) => {
        const categoryValue = activity.answerKey[category];
        if ((typeof categoryValue === 'string' && categoryValue.includes(item)) || 
            (Array.isArray(categoryValue) && categoryValue.includes(item)) || 
            activity.answerKey[item] === category) {
          correctCount++;
        }
      });

      const isCorrect = correctCount >= Math.floor(items.length * 0.7);
      setActivityResults(prev => ({ ...prev, [activityIndex]: isCorrect }));
      setShowResults(prev => ({ ...prev, [activityIndex]: true }));
      
      toast({
        title: isCorrect ? "Well categorized!" : "Review your sorting",
        description: isCorrect 
          ? "You've correctly sorted most items." 
          : "Some items may fit better in different categories.",
        variant: isCorrect ? "default" : "destructive"
      });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-center mb-3 text-purple-700 bg-purple-50 rounded px-2 py-1">
                {category}
              </h4>
              <div className="space-y-2 min-h-[100px]">
                {Object.entries(itemCategories)
                  .filter(([_, cat]) => cat === category)
                  .map(([item, _]) => (
                    <div key={item} className="bg-purple-50 p-2 rounded text-sm">
                      {item}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Items to categorize:</h4>
          <div className="flex flex-wrap gap-2">
            {items.filter(item => !itemCategories[item]).map(item => (
              <div key={item} className="relative">
                <div className="bg-blue-100 border border-blue-200 rounded px-3 py-2 text-sm">
                  {item}
                </div>
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 hidden group-hover:block">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(item, category)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="flex mt-1 space-x-1">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(item, category)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!showResults[activityIndex] && (
          <Button 
            onClick={handleSubmit} 
            disabled={Object.keys(itemCategories).length === 0}
            className="w-full"
          >
            Submit Categories
          </Button>
        )}

        {showResults[activityIndex] && (
          <div className={`p-4 rounded-lg ${activityResults[activityIndex] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {activityResults[activityIndex] ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Nice sorting!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Some items could be sorted differently</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScenarioActivity = (activity: ParsedActivity, index: number) => {
    const state = scenarioStates[index] || { selectedOption: null, showFeedback: false };

    const handleOptionSelect = (option: string) => {
      setScenarioStates(prev => ({
        ...prev,
        [index]: { selectedOption: option, showFeedback: true }
      }));
      
      // Mark as completed after selection
      setTimeout(() => {
        setActivityResults(prev => ({ ...prev, [index]: true }));
        toast({
          title: "Scenario Response Recorded",
          description: "Your choice has been noted for this scenario.",
        });
      }, 1500);
    };

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="space-y-3">
            {activity.promptItems.map((option, optIndex) => (
              <button
                key={optIndex}
                onClick={() => handleOptionSelect(option)}
                disabled={state.showFeedback}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  state.selectedOption === option
                    ? 'bg-blue-100 border-blue-300 text-blue-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } ${state.showFeedback ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border border-gray-300 mr-3 flex items-center justify-center">
                    {state.selectedOption === option && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>

          {state.showFeedback && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Thank you for your response! Each choice provides valuable learning insights.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSimulationActivity = (activity: ParsedActivity, index: number) => {
    const state = simulationStates[index] || { currentStep: 0, completedSteps: [] };
    const steps = activity.promptItems;

    const handleStepComplete = (stepIndex: number) => {
      if (!state.completedSteps.includes(stepIndex)) {
        const newCompletedSteps = [...state.completedSteps, stepIndex];
        const newCurrentStep = stepIndex < steps.length - 1 ? stepIndex + 1 : state.currentStep;
        
        setSimulationStates(prev => ({
          ...prev,
          [index]: { currentStep: newCurrentStep, completedSteps: newCompletedSteps }
        }));
        
        if (stepIndex === steps.length - 1) {
          setActivityResults(prev => ({ ...prev, [index]: true }));
          toast({
            title: "Simulation Complete!",
            description: "You've successfully completed all simulation steps.",
          });
        }
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="space-y-4">
            {steps.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className={`border rounded-lg p-4 transition-all ${
                  stepIndex === state.currentStep
                    ? 'bg-white border-green-300 shadow-sm'
                    : stepIndex < state.currentStep
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      state.completedSteps.includes(stepIndex)
                        ? 'bg-green-100 text-green-600'
                        : stepIndex === state.currentStep
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {state.completedSteps.includes(stepIndex) ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-bold">{stepIndex + 1}</span>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Step {stepIndex + 1}</h5>
                      <p className="text-sm text-gray-600">{step}</p>
                    </div>
                  </div>
                  
                  {stepIndex === state.currentStep && !state.completedSteps.includes(stepIndex) && (
                    <Button
                      onClick={() => handleStepComplete(stepIndex)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete Step
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMatchingActivity = (activity: ParsedActivity, index: number) => {
    const totalItems = activity.promptItems.length;
    const leftItems = activity.promptItems.slice(0, Math.floor(totalItems / 2));
    const rightItems = activity.promptItems.slice(Math.floor(totalItems / 2));
    const state = matchingStates[index] || { matches: {}, selectedLeft: null };

    const handleLeftSelect = (item: string) => {
      setMatchingStates(prev => ({
        ...prev,
        [index]: { ...state, selectedLeft: item }
      }));
    };

    const handleRightSelect = (item: string) => {
      if (state.selectedLeft) {
        const newMatches = { ...state.matches, [state.selectedLeft]: item };
        setMatchingStates(prev => ({
          ...prev,
          [index]: { matches: newMatches, selectedLeft: null }
        }));
        
        // Check if all matches are made
        if (Object.keys(newMatches).length >= leftItems.length) {
          setTimeout(() => {
            setActivityResults(prev => ({ ...prev, [index]: true }));
            toast({
              title: "Matching Complete!",
              description: "You've matched all the items successfully.",
            });
          }, 500);
        }
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h5 className="font-medium text-gray-800 mb-3">Select an item:</h5>
              <div className="space-y-2">
                {leftItems.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => handleLeftSelect(item)}
                    disabled={state.matches[item]}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      state.matches[item]
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                        : state.selectedLeft === item
                        ? 'bg-teal-100 border-teal-300 text-teal-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                    {state.matches[item] && (
                      <span className="text-xs text-gray-500 ml-2">✓ Matched</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h5 className="font-medium text-gray-800 mb-3">Then select its match:</h5>
              <div className="space-y-2">
                {rightItems.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => handleRightSelect(item)}
                    disabled={!state.selectedLeft || Object.values(state.matches).includes(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      Object.values(state.matches).includes(item)
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                        : state.selectedLeft
                        ? 'bg-white border-gray-200 hover:bg-cyan-50'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
                    }`}
                  >
                    {item}
                    {Object.values(state.matches).includes(item) && (
                      <span className="text-xs text-gray-500 ml-2">✓ Matched</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {state.selectedLeft && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                Selected: <strong>{state.selectedLeft}</strong> - Now choose its match from the right column.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivity = (activity: ParsedActivity, index: number) => {
    const activityType = activity.activityType.toLowerCase();
    
    if (activityType.includes('scenario') || activityType.includes('challenge')) {
      return renderScenarioActivity(activity, index);
    } else if (activityType.includes('simulation') || activityType.includes('role-play')) {
      return renderSimulationActivity(activity, index);
    } else if (activityType.includes('drag') || activityType.includes('match')) {
      return renderMatchingActivity(activity, index);
    } else if (activityType.includes('categor') || activityType.includes('sort')) {
      return handleCategorizationActivity(activity, index);
    }
    
    // Default fallback activity
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <Puzzle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="font-semibold mb-2">{activity.title}</h4>
        <p className="text-gray-600 mb-4">{activity.instructions}</p>
        <Button onClick={() => {
          setActivityResults(prev => ({ ...prev, [index]: true }));
          setShowResults(prev => ({ ...prev, [index]: true }));
        }}>
          Mark as Complete
        </Button>
      </div>
    );
  };

  const allActivitiesCompleted = activities.every((_, index) => activityResults[index] === true);

  useEffect(() => {
    if (allActivitiesCompleted && activities.length > 0 && !isCompleted) {
      setTimeout(() => {
        onComplete();
        toast({
          title: "Section Complete!",
          description: "You've successfully completed all activities in this section.",
        });
      }, 1000);
    }
  }, [allActivitiesCompleted, activities.length, isCompleted, onComplete, toast]);

  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center">
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Interactive Activities - Completed
        </h4>
        <p className="text-green-700">
          You have successfully completed all interactive activities in this section.
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="font-semibold mb-2">Interactive Activities</h4>
        <p className="text-gray-600 mb-4">
          This section contains hands-on activities to help you practice and apply the concepts.
        </p>
        <Button onClick={onComplete}>
          Mark as Complete
        </Button>
      </div>
    );
  }

  const currentActivity = activities[currentActivityIndex];

  return (
    <div className="space-y-6">
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{section.title}</h3>
          <p className="text-gray-600">
            Interactive Activity {currentActivityIndex + 1} of {activities.length}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center">
          <Target className="h-4 w-4 mr-1" />
          {currentActivity?.activityType || 'Interactive'}
        </Badge>
      </div>

      {/* Activity Progress */}
      {activities.length > 1 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentActivityIndex + 1) / activities.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Current Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Puzzle className="h-5 w-5 mr-2 text-blue-600" />
            {currentActivity.title}
          </CardTitle>
          <p className="text-gray-600">{currentActivity.preview}</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <p className="text-blue-700">{currentActivity.instructions}</p>
            {currentActivity.uiHints && (
              <p className="text-sm text-blue-600 mt-2 italic">
                Tip: {currentActivity.uiHints}
              </p>
            )}
          </div>

          {renderActivity(currentActivity, currentActivityIndex)}
        </CardContent>
      </Card>

      {/* Navigation between activities */}
      {activities.length > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentActivityIndex(Math.max(0, currentActivityIndex - 1))}
            disabled={currentActivityIndex === 0}
          >
            Previous Activity
          </Button>

          <div className="flex space-x-2">
            {activities.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentActivityIndex
                    ? "bg-blue-600"
                    : activityResults[index]
                      ? "bg-green-500"
                      : "bg-gray-300"
                }`}
                onClick={() => setCurrentActivityIndex(index)}
              />
            ))}
          </div>

          <Button
            onClick={() => setCurrentActivityIndex(Math.min(activities.length - 1, currentActivityIndex + 1))}
            disabled={currentActivityIndex === activities.length - 1}
          >
            Next Activity
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Completion Status */}
      {allActivitiesCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              All activities completed! Moving to next section...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}