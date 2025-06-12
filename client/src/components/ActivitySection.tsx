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
  const { toast } = useToast();

  // Parse activity content from section
  useEffect(() => {
    const parseActivityContent = () => {
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

      const parsedActivities: ParsedActivity[] = blocks.map(block => {
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

      setActivities(parsedActivities);
    };

    parseActivityContent();
  }, [section.content]);

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

  const renderActivity = (activity: ParsedActivity, index: number) => {
    const activityType = activity.activityType.toLowerCase();
    
    if (activityType.includes('drag') || activityType.includes('match')) {
      return handleDragAndMatchActivity(activity, index);
    } else if (activityType.includes('scenario') || activityType.includes('challenge')) {
      return handleScenarioChallengeActivity(activity, index);
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