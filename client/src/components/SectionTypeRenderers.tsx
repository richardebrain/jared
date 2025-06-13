import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, GripVertical, Save, Eye, 
  ArrowUp, ArrowDown, Shuffle, Target,
  Brain, Zap, Users, Lightbulb, Gamepad2,
  Presentation, Link2, CheckCircle2
} from 'lucide-react';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  type: string;
  duration: number;
  activities: Array<{
    type: string;
    title: string;
    duration: number;
    content: string;
    videoUrl?: string;
    audioUrl?: string;
    interactionType?: string;
  }>;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
  }>;
  scenarios?: Array<{
    scenario: string;
    response: string;
  }>;
  audioUrl?: string;
  slides?: Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>;
}

// Scenario-Match Section Renderer
export const ScenarioMatchRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [scenarios, setScenarios] = useState(section.scenarios || []);
  const [newScenario, setNewScenario] = useState({ scenario: '', response: '' });

  const addScenario = () => {
    if (newScenario.scenario.trim() && newScenario.response.trim()) {
      const updated = [...scenarios, newScenario];
      setScenarios(updated);
      onUpdate({ ...section, scenarios: updated });
      setNewScenario({ scenario: '', response: '' });
    }
  };

  const removeScenario = (index: number) => {
    const updated = scenarios.filter((_, i) => i !== index);
    setScenarios(updated);
    onUpdate({ ...section, scenarios: updated });
  };

  const updateScenario = (index: number, field: 'scenario' | 'response', value: string) => {
    const updated = scenarios.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setScenarios(updated);
    onUpdate({ ...section, scenarios: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-blue-500" />
        <div>
          <h3 className="font-semibold">Scenario Matching Exercise</h3>
          <p className="text-sm text-gray-600">Create scenario-response pairs for practice</p>
        </div>
      </div>

      {/* Existing Scenarios */}
      <div className="space-y-4">
        {scenarios.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Scenario {index + 1}</Label>
                  <Textarea
                    value={item.scenario}
                    onChange={(e) => updateScenario(index, 'scenario', e.target.value)}
                    placeholder="Describe the scenario..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Appropriate Response</Label>
                  <Textarea
                    value={item.response}
                    onChange={(e) => updateScenario(index, 'response', e.target.value)}
                    placeholder="What's the best response?"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeScenario(index)}
                className="mt-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Scenario
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Scenario */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>New Scenario</Label>
              <Textarea
                value={newScenario.scenario}
                onChange={(e) => setNewScenario({ ...newScenario, scenario: e.target.value })}
                placeholder="Describe a new scenario..."
              />
            </div>
            <div>
              <Label>Response</Label>
              <Textarea
                value={newScenario.response}
                onChange={(e) => setNewScenario({ ...newScenario, response: e.target.value })}
                placeholder="What's the appropriate response?"
              />
            </div>
          </div>
          <Button onClick={addScenario} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Scenario Pair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Slide Section Renderer
export const SlideRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [slides, setSlides] = useState(section.slides || []);
  const [newSlide, setNewSlide] = useState({ title: '', content: '', imageUrl: '' });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const addSlide = () => {
    if (newSlide.title.trim() && newSlide.content.trim()) {
      const updated = [...slides, newSlide];
      setSlides(updated);
      onUpdate({ ...section, slides: updated });
      setNewSlide({ title: '', content: '', imageUrl: '' });
    }
  };

  const removeSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    onUpdate({ ...section, slides: updated });
    if (currentSlideIndex >= updated.length && updated.length > 0) {
      setCurrentSlideIndex(updated.length - 1);
    }
  };

  const updateSlide = (index: number, field: keyof typeof newSlide, value: string) => {
    const updated = slides.map((slide, i) => 
      i === index ? { ...slide, [field]: value } : slide
    );
    setSlides(updated);
    onUpdate({ ...section, slides: updated });
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < slides.length) {
      const updated = [...slides];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      setSlides(updated);
      onUpdate({ ...section, slides: updated });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Presentation className="h-5 w-5 text-purple-500" />
        <div>
          <h3 className="font-semibold">Slide Presentation</h3>
          <p className="text-sm text-gray-600">Create visual presentation slides with content</p>
        </div>
      </div>

      {/* Slide Navigator */}
      {slides.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Slide:</span>
          <Select value={currentSlideIndex.toString()} onValueChange={(v) => setCurrentSlideIndex(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {slides.map((slide, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {index + 1}: {slide.title.substring(0, 20)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">{slides.length} slides</Badge>
        </div>
      )}

      {/* Current Slide Editor */}
      {slides.length > 0 && slides[currentSlideIndex] && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Slide {currentSlideIndex + 1}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSlide(currentSlideIndex, 'up')}
                  disabled={currentSlideIndex === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSlide(currentSlideIndex, 'down')}
                  disabled={currentSlideIndex === slides.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSlide(currentSlideIndex)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Slide Title</Label>
                <Input
                  value={slides[currentSlideIndex].title}
                  onChange={(e) => updateSlide(currentSlideIndex, 'title', e.target.value)}
                  placeholder="Enter slide title..."
                />
              </div>
              <div>
                <Label>Slide Content</Label>
                <Textarea
                  value={slides[currentSlideIndex].content}
                  onChange={(e) => updateSlide(currentSlideIndex, 'content', e.target.value)}
                  placeholder="Enter slide content..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Image URL (Optional)</Label>
                <Input
                  value={slides[currentSlideIndex].imageUrl || ''}
                  onChange={(e) => updateSlide(currentSlideIndex, 'imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Slide */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <Label>New Slide Title</Label>
              <Input
                value={newSlide.title}
                onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                placeholder="Enter slide title..."
              />
            </div>
            <div>
              <Label>Slide Content</Label>
              <Textarea
                value={newSlide.content}
                onChange={(e) => setNewSlide({ ...newSlide, content: e.target.value })}
                placeholder="Enter slide content..."
                rows={3}
              />
            </div>
            <div>
              <Label>Image URL (Optional)</Label>
              <Input
                value={newSlide.imageUrl}
                onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <Button onClick={addSlide} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Example Section Renderer
export const ExampleRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [examples, setExamples] = useState(() => {
    try {
      return JSON.parse(section.content || '[]');
    } catch {
      return [];
    }
  });
  
  const [newExample, setNewExample] = useState({
    title: '',
    description: '',
    keyLearning: '',
    category: 'practical'
  });

  const addExample = () => {
    if (newExample.title.trim() && newExample.description.trim()) {
      const updated = [...examples, { ...newExample, id: Date.now() }];
      setExamples(updated);
      onUpdate({ ...section, content: JSON.stringify(updated) });
      setNewExample({ title: '', description: '', keyLearning: '', category: 'practical' });
    }
  };

  const removeExample = (id: number) => {
    const updated = examples.filter((ex: any) => ex.id !== id);
    setExamples(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const updateExample = (id: number, field: string, value: string) => {
    const updated = examples.map((ex: any) => 
      ex.id === id ? { ...ex, [field]: value } : ex
    );
    setExamples(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <div>
          <h3 className="font-semibold">Real-World Examples</h3>
          <p className="text-sm text-gray-600">Provide practical examples and case studies</p>
        </div>
      </div>

      {/* Existing Examples */}
      <div className="space-y-4">
        {examples.map((example: any, index: number) => (
          <Card key={example.id} className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={example.category === 'practical' ? 'default' : 'secondary'}>
                    {example.category}
                  </Badge>
                  <span className="font-medium">Example {index + 1}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeExample(example.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Example Title</Label>
                  <Input
                    value={example.title}
                    onChange={(e) => updateExample(example.id, 'title', e.target.value)}
                    placeholder="Brief title for this example..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={example.description}
                    onChange={(e) => updateExample(example.id, 'description', e.target.value)}
                    placeholder="Detailed description of the example..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Key Learning Point</Label>
                  <Input
                    value={example.keyLearning}
                    onChange={(e) => updateExample(example.id, 'keyLearning', e.target.value)}
                    placeholder="What should learners take away from this?"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={example.category} onValueChange={(v) => updateExample(example.id, 'category', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practical">Practical Application</SelectItem>
                      <SelectItem value="theoretical">Theoretical Concept</SelectItem>
                      <SelectItem value="case-study">Case Study</SelectItem>
                      <SelectItem value="best-practice">Best Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Example */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Example Title</Label>
                <Input
                  value={newExample.title}
                  onChange={(e) => setNewExample({ ...newExample, title: e.target.value })}
                  placeholder="Brief title for this example..."
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newExample.category} onValueChange={(v) => setNewExample({ ...newExample, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practical">Practical Application</SelectItem>
                    <SelectItem value="theoretical">Theoretical Concept</SelectItem>
                    <SelectItem value="case-study">Case Study</SelectItem>
                    <SelectItem value="best-practice">Best Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newExample.description}
                onChange={(e) => setNewExample({ ...newExample, description: e.target.value })}
                placeholder="Detailed description of the example..."
                rows={3}
              />
            </div>
            <div>
              <Label>Key Learning Point</Label>
              <Input
                value={newExample.keyLearning}
                onChange={(e) => setNewExample({ ...newExample, keyLearning: e.target.value })}
                placeholder="What should learners take away from this?"
              />
            </div>
          </div>
          <Button onClick={addExample} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Example
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Matching Section Renderer
export const MatchingRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [matchingPairs, setMatchingPairs] = useState(() => {
    try {
      return JSON.parse(section.content || '[]');
    } catch {
      return [];
    }
  });
  
  const [newPair, setNewPair] = useState({ left: '', right: '' });

  const addPair = () => {
    if (newPair.left.trim() && newPair.right.trim()) {
      const updated = [...matchingPairs, { ...newPair, id: Date.now() }];
      setMatchingPairs(updated);
      onUpdate({ ...section, content: JSON.stringify(updated) });
      setNewPair({ left: '', right: '' });
    }
  };

  const removePair = (id: number) => {
    const updated = matchingPairs.filter((pair: any) => pair.id !== id);
    setMatchingPairs(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const updatePair = (id: number, field: 'left' | 'right', value: string) => {
    const updated = matchingPairs.map((pair: any) => 
      pair.id === id ? { ...pair, [field]: value } : pair
    );
    setMatchingPairs(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const shufflePairs = () => {
    const updated = [...matchingPairs].sort(() => Math.random() - 0.5);
    setMatchingPairs(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="h-5 w-5 text-green-500" />
        <div>
          <h3 className="font-semibold">Matching Exercise</h3>
          <p className="text-sm text-gray-600">Create pairs for learners to match concepts</p>
        </div>
        {matchingPairs.length > 1 && (
          <Button variant="outline" size="sm" onClick={shufflePairs} className="ml-auto">
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle Order
          </Button>
        )}
      </div>

      {/* Existing Pairs */}
      <div className="space-y-4">
        {matchingPairs.map((pair: any, index: number) => (
          <Card key={pair.id} className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Left Column Item
                    <Badge variant="outline">Match {index + 1}</Badge>
                  </Label>
                  <Input
                    value={pair.left}
                    onChange={(e) => updatePair(pair.id, 'left', e.target.value)}
                    placeholder="Term, concept, or question..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Right Column Item</Label>
                  <Input
                    value={pair.right}
                    onChange={(e) => updatePair(pair.id, 'right', e.target.value)}
                    placeholder="Definition, answer, or match..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Link2 className="h-4 w-4" />
                  <span>Learners will match these items</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removePair(pair.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Pair */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Left Column Item</Label>
              <Input
                value={newPair.left}
                onChange={(e) => setNewPair({ ...newPair, left: e.target.value })}
                placeholder="Term, concept, or question..."
              />
            </div>
            <div>
              <Label>Right Column Item</Label>
              <Input
                value={newPair.right}
                onChange={(e) => setNewPair({ ...newPair, right: e.target.value })}
                placeholder="Definition, answer, or match..."
              />
            </div>
          </div>
          <Button onClick={addPair} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Matching Pair
          </Button>
        </CardContent>
      </Card>

      {matchingPairs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Preview</h4>
              <p className="text-sm text-blue-700">
                Learners will see {matchingPairs.length} items in each column and drag to create matches.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Scenario Section Renderer
export const ScenarioRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [scenarios, setScenarios] = useState(section.scenarios || []);
  const [newScenario, setNewScenario] = useState({ scenario: '', response: '' });
  const [currentIndex, setCurrentIndex] = useState(0);

  const addScenario = () => {
    if (newScenario.scenario.trim() && newScenario.response.trim()) {
      const updated = [...scenarios, newScenario];
      setScenarios(updated);
      onUpdate({ ...section, scenarios: updated });
      setNewScenario({ scenario: '', response: '' });
    }
  };

  const removeScenario = (index: number) => {
    const updated = scenarios.filter((_, i) => i !== index);
    setScenarios(updated);
    onUpdate({ ...section, scenarios: updated });
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const updateScenario = (index: number, field: 'scenario' | 'response', value: string) => {
    const updated = scenarios.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setScenarios(updated);
    onUpdate({ ...section, scenarios: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-indigo-500" />
        <div>
          <h3 className="font-semibold">Scenario Practice</h3>
          <p className="text-sm text-gray-600">Create practice scenarios with guided responses</p>
        </div>
      </div>

      {/* Scenario Navigator */}
      {scenarios.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Scenario:</span>
          <Select value={currentIndex.toString()} onValueChange={(v) => setCurrentIndex(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((_, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Scenario {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">{scenarios.length} scenarios</Badge>
        </div>
      )}

      {/* Current Scenario Editor */}
      {scenarios.length > 0 && scenarios[currentIndex] && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Scenario {currentIndex + 1}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeScenario(currentIndex)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Scenario Description</Label>
                <Textarea
                  value={scenarios[currentIndex].scenario}
                  onChange={(e) => updateScenario(currentIndex, 'scenario', e.target.value)}
                  placeholder="Describe the situation the learner will encounter..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Guided Response/Solution</Label>
                <Textarea
                  value={scenarios[currentIndex].response}
                  onChange={(e) => updateScenario(currentIndex, 'response', e.target.value)}
                  placeholder="What should the learner do or consider in this situation?"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Scenario */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <Label>Scenario Description</Label>
              <Textarea
                value={newScenario.scenario}
                onChange={(e) => setNewScenario({ ...newScenario, scenario: e.target.value })}
                placeholder="Describe a situation for practice..."
                rows={3}
              />
            </div>
            <div>
              <Label>Guided Response/Solution</Label>
              <Textarea
                value={newScenario.response}
                onChange={(e) => setNewScenario({ ...newScenario, response: e.target.value })}
                placeholder="What should the learner do or consider?"
                rows={3}
              />
            </div>
          </div>
          <Button onClick={addScenario} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Scenario
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Triage Section Renderer
export const TriageRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [triageItems, setTriageItems] = useState(() => {
    try {
      return JSON.parse(section.content || '[]');
    } catch {
      return [];
    }
  });
  
  const [newItem, setNewItem] = useState({
    situation: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    rationale: ''
  });

  const addItem = () => {
    if (newItem.situation.trim() && newItem.rationale.trim()) {
      const updated = [...triageItems, { ...newItem, id: Date.now() }];
      setTriageItems(updated);
      onUpdate({ ...section, content: JSON.stringify(updated) });
      setNewItem({ situation: '', priority: 'medium', rationale: '' });
    }
  };

  const removeItem = (id: number) => {
    const updated = triageItems.filter((item: any) => item.id !== id);
    setTriageItems(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const updateItem = (id: number, field: string, value: string) => {
    const updated = triageItems.map((item: any) => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setTriageItems(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { color: 'destructive', icon: '🔴' };
      case 'medium': return { color: 'default', icon: '🟡' };
      case 'low': return { color: 'secondary', icon: '🟢' };
      default: return { color: 'outline', icon: '⚪' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-orange-500" />
        <div>
          <h3 className="font-semibold">Decision Triage</h3>
          <p className="text-sm text-gray-600">Create priority-based decision exercises</p>
        </div>
      </div>

      {/* Priority Distribution */}
      {triageItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          {['high', 'medium', 'low'].map(priority => {
            const count = triageItems.filter((item: any) => item.priority === priority).length;
            const badge = getPriorityBadge(priority);
            return (
              <div key={priority} className="text-center">
                <Badge variant={badge.color as any} className="mb-1">
                  {badge.icon} {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Badge>
                <div className="text-sm text-gray-600">{count} items</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Existing Items by Priority */}
      {['high', 'medium', 'low'].map(priority => {
        const items = triageItems.filter((item: any) => item.priority === priority);
        if (items.length === 0) return null;

        return (
          <div key={priority} className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              {getPriorityBadge(priority).icon}
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              <Badge variant="outline">{items.length}</Badge>
            </h4>
            {items.map((item: any) => (
              <Card key={item.id} className={`border-l-4 ${getPriorityColor(priority)}`}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Situation</Label>
                      <Textarea
                        value={item.situation}
                        onChange={(e) => updateItem(item.id, 'situation', e.target.value)}
                        placeholder="Describe the situation requiring triage..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Priority Level</Label>
                      <Select value={item.priority} onValueChange={(v) => updateItem(item.id, 'priority', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">🔴 High Priority</SelectItem>
                          <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                          <SelectItem value="low">🟢 Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Rationale</Label>
                      <Textarea
                        value={item.rationale}
                        onChange={(e) => updateItem(item.id, 'rationale', e.target.value)}
                        placeholder="Why does this situation have this priority level?"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="mt-3 text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      {/* Add New Item */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <Label>Situation</Label>
              <Textarea
                value={newItem.situation}
                onChange={(e) => setNewItem({ ...newItem, situation: e.target.value })}
                placeholder="Describe a situation that requires priority decision..."
                rows={2}
              />
            </div>
            <div>
              <Label>Priority Level</Label>
              <Select value={newItem.priority} onValueChange={(v: 'high' | 'medium' | 'low') => setNewItem({ ...newItem, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High Priority</SelectItem>
                  <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                  <SelectItem value="low">🟢 Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rationale</Label>
              <Textarea
                value={newItem.rationale}
                onChange={(e) => setNewItem({ ...newItem, rationale: e.target.value })}
                placeholder="Why does this situation have this priority level?"
                rows={2}
              />
            </div>
          </div>
          <Button onClick={addItem} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Triage Item
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Mnemonic Section Renderer
export const MnemonicRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [mnemonic, setMnemonic] = useState(() => {
    try {
      return JSON.parse(section.content || '{}');
    } catch {
      return {
        technique: 'acronym',
        content: '',
        keyPoints: [''],
        practiceExercise: ''
      };
    }
  });

  const updateMnemonic = (field: string, value: any) => {
    const updated = { ...mnemonic, [field]: value };
    setMnemonic(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const addKeyPoint = () => {
    updateMnemonic('keyPoints', [...mnemonic.keyPoints, '']);
  };

  const updateKeyPoint = (index: number, value: string) => {
    const updated = mnemonic.keyPoints.map((point: string, i: number) => 
      i === index ? value : point
    );
    updateMnemonic('keyPoints', updated);
  };

  const removeKeyPoint = (index: number) => {
    const updated = mnemonic.keyPoints.filter((_: string, i: number) => i !== index);
    updateMnemonic('keyPoints', updated);
  };

  const getTechniqueDescription = (technique: string) => {
    switch (technique) {
      case 'acronym': return 'Create memorable abbreviations using first letters';
      case 'rhyme': return 'Use rhythm and rhyming patterns for recall';
      case 'song': return 'Set information to a familiar melody';
      case 'story': return 'Create a narrative that includes key information';
      case 'visual': return 'Use visual imagery and spatial relationships';
      default: return 'Choose a memory technique';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-purple-500" />
        <div>
          <h3 className="font-semibold">Memory Aid (Mnemonic)</h3>
          <p className="text-sm text-gray-600">Create memorable learning devices</p>
        </div>
      </div>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Technique Selection */}
            <div>
              <Label className="text-sm font-medium">Memory Technique</Label>
              <Select value={mnemonic.technique} onValueChange={(v) => updateMnemonic('technique', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acronym">🔤 Acronym</SelectItem>
                  <SelectItem value="rhyme">🎵 Rhyme</SelectItem>
                  <SelectItem value="song">🎶 Song</SelectItem>
                  <SelectItem value="story">📖 Story</SelectItem>
                  <SelectItem value="visual">👁️ Visual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">{getTechniqueDescription(mnemonic.technique)}</p>
            </div>

            {/* Main Content */}
            <div>
              <Label className="text-sm font-medium">Mnemonic Device</Label>
              <Textarea
                value={mnemonic.content}
                onChange={(e) => updateMnemonic('content', e.target.value)}
                placeholder={`Enter your ${mnemonic.technique} here...`}
                rows={3}
              />
            </div>

            {/* Key Points */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                Key Points to Remember
                <Button variant="outline" size="sm" onClick={addKeyPoint}>
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {mnemonic.keyPoints.map((point: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      placeholder={`Key point ${index + 1}...`}
                    />
                    {mnemonic.keyPoints.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeKeyPoint(index)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Exercise */}
            <div>
              <Label className="text-sm font-medium">Practice Exercise</Label>
              <Textarea
                value={mnemonic.practiceExercise}
                onChange={(e) => updateMnemonic('practiceExercise', e.target.value)}
                placeholder="How can learners practice using this mnemonic?"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {mnemonic.content && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900">Memory Aid Preview</h4>
              <p className="text-sm text-purple-700 font-mono bg-white px-2 py-1 rounded mt-1">
                {mnemonic.content}
              </p>
              {mnemonic.keyPoints.filter((p: string) => p.trim()).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-purple-600 font-medium">Helps remember:</p>
                  <ul className="text-xs text-purple-700 ml-2">
                    {mnemonic.keyPoints.filter((p: string) => p.trim()).map((point: string, i: number) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simulation Section Renderer
export const SimulationRenderer: React.FC<{
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}> = ({ section, onUpdate }) => {
  const [simulation, setSimulation] = useState(() => {
    try {
      return JSON.parse(section.content || '{}');
    } catch {
      return {
        title: '',
        description: '',
        objectives: [''],
        steps: [''],
        resources: [''],
        assessment: '',
        duration: 15
      };
    }
  });

  const updateSimulation = (field: string, value: any) => {
    const updated = { ...simulation, [field]: value };
    setSimulation(updated);
    onUpdate({ ...section, content: JSON.stringify(updated) });
  };

  const addListItem = (field: string) => {
    const currentList = simulation[field] || [];
    updateSimulation(field, [...currentList, '']);
  };

  const updateListItem = (field: string, index: number, value: string) => {
    const currentList = simulation[field] || [];
    const updated = currentList.map((item: string, i: number) => 
      i === index ? value : item
    );
    updateSimulation(field, updated);
  };

  const removeListItem = (field: string, index: number) => {
    const currentList = simulation[field] || [];
    const updated = currentList.filter((_: string, i: number) => i !== index);
    updateSimulation(field, updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-semibold">Interactive Simulation</h3>
          <p className="text-sm text-gray-600">Create hands-on practice experiences</p>
        </div>
      </div>

      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="pt-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Simulation Title</Label>
                <Input
                  value={simulation.title}
                  onChange={(e) => updateSimulation('title', e.target.value)}
                  placeholder="Name of the simulation activity"
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={simulation.duration}
                  onChange={(e) => updateSimulation('duration', parseInt(e.target.value) || 15)}
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={simulation.description}
                onChange={(e) => updateSimulation('description', e.target.value)}
                placeholder="Describe what learners will do in this simulation..."
                rows={3}
              />
            </div>

            {/* Learning Objectives */}
            <div>
              <Label className="flex items-center gap-2">
                Learning Objectives
                <Button variant="outline" size="sm" onClick={() => addListItem('objectives')}>
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {(simulation.objectives || []).map((objective: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateListItem('objectives', index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}...`}
                    />
                    {simulation.objectives.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('objectives', index)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Steps */}
            <div>
              <Label className="flex items-center gap-2">
                Simulation Steps
                <Button variant="outline" size="sm" onClick={() => addListItem('steps')}>
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {(simulation.steps || []).map((step: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="min-w-8 justify-center">
                        {index + 1}
                      </Badge>
                      <Input
                        value={step}
                        onChange={(e) => updateListItem('steps', index, e.target.value)}
                        placeholder={`Step ${index + 1}: What happens in this step?`}
                      />
                    </div>
                    {simulation.steps.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('steps', index)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Needed */}
            <div>
              <Label className="flex items-center gap-2">
                Resources Needed
                <Button variant="outline" size="sm" onClick={() => addListItem('resources')}>
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {(simulation.resources || []).map((resource: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={resource}
                      onChange={(e) => updateListItem('resources', index, e.target.value)}
                      placeholder={`Resource ${index + 1}: materials, tools, or setup needed`}
                    />
                    {simulation.resources.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('resources', index)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment */}
            <div>
              <Label>Assessment Method</Label>
              <Textarea
                value={simulation.assessment}
                onChange={(e) => updateSimulation('assessment', e.target.value)}
                placeholder="How will learners be assessed during or after the simulation?"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {simulation.title && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Gamepad2 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">{simulation.title}</h4>
              <p className="text-sm text-blue-700">{simulation.description}</p>
              <div className="mt-2 flex gap-4 text-xs text-blue-600">
                <span>⏱️ {simulation.duration} minutes</span>
                <span>🎯 {(simulation.objectives || []).filter((o: string) => o.trim()).length} objectives</span>
                <span>📋 {(simulation.steps || []).filter((s: string) => s.trim()).length} steps</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};