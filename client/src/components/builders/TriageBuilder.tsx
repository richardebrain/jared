import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Loader2, 
  Save,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Zap
} from 'lucide-react';

interface TriageItem {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  timeframe: string;
  consequences: string;
  reasoning: string;
}

interface TriageData {
  title: string;
  instructions: string;
  scenario: string;
  items: TriageItem[];
  allowReordering: boolean;
  showExplanations: boolean;
  priorityLevels: {
    urgent: { label: string; color: string; description: string };
    high: { label: string; color: string; description: string };
    medium: { label: string; color: string; description: string };
    low: { label: string; color: string; description: string };
  };
}

interface TriageBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: TriageData) => void;
  onCancel: () => void;
  initialData?: TriageData;
}

export default function TriageBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: TriageBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<TriageData>(initialData || {
    title: `${sectionTitle} - Priority Assessment`,
    instructions: 'Arrange these items in order of priority, considering urgency, impact, and available resources.',
    scenario: '',
    items: [],
    allowReordering: true,
    showExplanations: true,
    priorityLevels: {
      urgent: { label: 'Urgent', color: 'red', description: 'Immediate action required' },
      high: { label: 'High', color: 'orange', description: 'Action needed soon' },
      medium: { label: 'Medium', color: 'yellow', description: 'Important but can wait' },
      low: { label: 'Low', color: 'green', description: 'Low priority or routine' }
    }
  });

  const [currentItem, setCurrentItem] = useState<TriageItem>({
    id: '',
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    timeframe: '',
    consequences: '',
    reasoning: ''
  });

  const generateAITriage = async () => {
    if (!moduleTitle || !moduleDescription) {
      toast({
        title: "Missing Information",
        description: "Module title and description are required for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/ai/generate-triage', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          itemCount: 8,
          includeScenario: true,
          complexityLevel: 'intermediate',
          targetAudience: 'early-childhood-educators'
        }
      });

      if (response.scenario) {
        setData(prev => ({ ...prev, scenario: response.scenario }));
      }

      if (response.items && response.items.length > 0) {
        setData(prev => ({
          ...prev,
          items: [...prev.items, ...response.items]
        }));
        
        toast({
          title: "Triage Items Generated",
          description: `Added ${response.items.length} items for priority assessment.`,
        });
      }
    } catch (error) {
      console.error('Error generating triage items:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate triage items. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addItem = () => {
    if (!currentItem.title.trim() || !currentItem.description.trim()) {
      toast({
        title: "Incomplete Item",
        description: "Please add both title and description.",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      ...currentItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      timeframe: '',
      consequences: '',
      reasoning: ''
    });

    toast({
      title: "Item Added",
      description: `Triage now has ${data.items.length + 1} items to prioritize.`,
    });
  };

  const removeItem = (index: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof TriageItem, value: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.items.length) return;

    setData(prev => {
      const newItems = [...prev.items];
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      return { ...prev, items: newItems };
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const handleSave = () => {
    if (data.items.length < 4) {
      toast({
        title: "Need More Items",
        description: "Please add at least 4 items for effective triage practice.",
        variant: "destructive",
      });
      return;
    }

    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Triage & Priority Assessment Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Activity Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter activity title"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowReordering"
                  checked={data.allowReordering}
                  onChange={(e) => setData(prev => ({ ...prev, allowReordering: e.target.checked }))}
                />
                <Label htmlFor="allowReordering">Allow reordering</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showExplanations"
                  checked={data.showExplanations}
                  onChange={(e) => setData(prev => ({ ...prev, showExplanations: e.target.checked }))}
                />
                <Label htmlFor="showExplanations">Show explanations</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should approach this triage exercise"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="scenario">Scenario Context</Label>
            <Textarea
              id="scenario"
              value={data.scenario}
              onChange={(e) => setData(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="Describe the situation requiring triage decisions"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAITriage}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Item Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Triage Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemTitle">Item Title</Label>
              <Input
                id="itemTitle"
                value={currentItem.title}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter item title"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={currentItem.priority}
                onValueChange={(value) => setCurrentItem(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent - Immediate action required</SelectItem>
                  <SelectItem value="high">High - Action needed soon</SelectItem>
                  <SelectItem value="medium">Medium - Important but can wait</SelectItem>
                  <SelectItem value="low">Low - Low priority or routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={currentItem.description}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this item or situation"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={currentItem.category}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Safety, Health, Behavior"
              />
            </div>
            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input
                id="timeframe"
                value={currentItem.timeframe}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, timeframe: e.target.value }))}
                placeholder="e.g., Immediate, Within 1 hour"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="consequences">Consequences if Delayed</Label>
            <Textarea
              id="consequences"
              value={currentItem.consequences}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, consequences: e.target.value }))}
              placeholder="What happens if this isn't addressed promptly?"
              rows={2}
            />
          </div>

          {data.showExplanations && (
            <div>
              <Label htmlFor="reasoning">Priority Reasoning</Label>
              <Textarea
                id="reasoning"
                value={currentItem.reasoning}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, reasoning: e.target.value }))}
                placeholder="Explain why this has this priority level"
                rows={2}
              />
            </div>
          )}

          <Button onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Triage Item
          </Button>
        </CardContent>
      </Card>

      {/* Current Items List */}
      {data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Triage Items ({data.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={item.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority.toUpperCase()}
                      </Badge>
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === data.items.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      placeholder="Item title"
                      className="font-medium"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      rows={2}
                    />
                    {item.timeframe && (
                      <div className="text-sm text-gray-600">
                        <strong>Timeframe:</strong> {item.timeframe}
                      </div>
                    )}
                    {item.consequences && (
                      <div className="text-sm text-gray-600">
                        <strong>Consequences:</strong> {item.consequences.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Triage Activity
        </Button>
      </div>
    </div>
  );
}