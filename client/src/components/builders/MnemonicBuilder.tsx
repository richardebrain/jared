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
  Brain,
  Lightbulb,
  Hash,
  Type
} from 'lucide-react';

interface MnemonicDevice {
  type: 'acronym' | 'acrostic' | 'rhyme' | 'chunking' | 'story' | 'visual' | 'keyword';
  title: string;
  content: string;
  explanation: string;
  memorablePhrase: string;
  targetConcepts: string[];
  practiceExercise?: string;
}

interface MnemonicData {
  title: string;
  instructions: string;
  learningObjective: string;
  devices: MnemonicDevice[];
  includeExercises: boolean;
  allowCustomCreation: boolean;
  category: 'procedures' | 'concepts' | 'sequences' | 'lists' | 'facts' | 'mixed';
}

interface MnemonicBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: MnemonicData) => void;
  onCancel: () => void;
  initialData?: MnemonicData;
}

export default function MnemonicBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: MnemonicBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<MnemonicData>(initialData || {
    title: `${sectionTitle} - Memory Techniques`,
    instructions: 'Learn and practice these memory techniques to better retain important information.',
    learningObjective: '',
    devices: [],
    includeExercises: true,
    allowCustomCreation: false,
    category: 'mixed'
  });

  const [currentDevice, setCurrentDevice] = useState<MnemonicDevice>({
    type: 'acronym',
    title: '',
    content: '',
    explanation: '',
    memorablePhrase: '',
    targetConcepts: [''],
    practiceExercise: ''
  });

  const generateAIMnemonics = async () => {
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
      const response = await apiRequest('/api/ai/generate-mnemonics', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          category: data.category,
          deviceTypes: ['acronym', 'acrostic', 'rhyme', 'story'],
          includeExercises: data.includeExercises,
          targetAudience: 'early-childhood-educators',
          count: 6
        }
      });

      if (response.devices && response.devices.length > 0) {
        setData(prev => ({
          ...prev,
          devices: [...prev.devices, ...response.devices]
        }));
        
        toast({
          title: "Memory Devices Generated",
          description: `Added ${response.devices.length} mnemonic devices.`,
        });
      }

      if (response.learningObjective) {
        setData(prev => ({ ...prev, learningObjective: response.learningObjective }));
      }
    } catch (error) {
      console.error('Error generating mnemonics:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate mnemonic devices. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addConcept = () => {
    setCurrentDevice(prev => ({
      ...prev,
      targetConcepts: [...prev.targetConcepts, '']
    }));
  };

  const updateConcept = (index: number, value: string) => {
    setCurrentDevice(prev => ({
      ...prev,
      targetConcepts: prev.targetConcepts.map((concept, i) => 
        i === index ? value : concept
      )
    }));
  };

  const removeConcept = (index: number) => {
    setCurrentDevice(prev => ({
      ...prev,
      targetConcepts: prev.targetConcepts.filter((_, i) => i !== index)
    }));
  };

  const addDevice = () => {
    if (!currentDevice.title.trim() || !currentDevice.content.trim()) {
      toast({
        title: "Incomplete Device",
        description: "Please add both title and content for the mnemonic device.",
        variant: "destructive",
      });
      return;
    }

    if (!currentDevice.memorablePhrase.trim()) {
      toast({
        title: "Missing Memorable Phrase",
        description: "Please provide the memorable phrase or device.",
        variant: "destructive",
      });
      return;
    }

    const validConcepts = currentDevice.targetConcepts.filter(c => c.trim());
    if (validConcepts.length === 0) {
      toast({
        title: "No Target Concepts",
        description: "Please add at least one concept to remember.",
        variant: "destructive",
      });
      return;
    }

    setData(prev => ({
      ...prev,
      devices: [...prev.devices, { ...currentDevice, targetConcepts: validConcepts }]
    }));

    setCurrentDevice({
      type: 'acronym',
      title: '',
      content: '',
      explanation: '',
      memorablePhrase: '',
      targetConcepts: [''],
      practiceExercise: ''
    });

    toast({
      title: "Mnemonic Device Added",
      description: `Collection now has ${data.devices.length + 1} memory techniques.`,
    });
  };

  const removeDevice = (index: number) => {
    setData(prev => ({
      ...prev,
      devices: prev.devices.filter((_, i) => i !== index)
    }));
  };

  const getDeviceIcon = (type: string) => {
    const icons = {
      acronym: Hash,
      acrostic: Type,
      rhyme: Lightbulb,
      chunking: Brain,
      story: Brain,
      visual: Brain,
      keyword: Brain
    };
    const IconComponent = icons[type as keyof typeof icons] || Brain;
    return <IconComponent className="h-4 w-4" />;
  };

  const getDeviceDescription = (type: string) => {
    const descriptions = {
      acronym: 'Create memorable acronyms',
      acrostic: 'First letter sentences',
      rhyme: 'Rhyming patterns',
      chunking: 'Break into smaller parts',
      story: 'Narrative connections',
      visual: 'Visual associations',
      keyword: 'Keyword associations'
    };
    return descriptions[type as keyof typeof descriptions] || 'Memory technique';
  };

  const handleSave = () => {
    if (data.devices.length === 0) {
      toast({
        title: "No Memory Devices",
        description: "Please add at least one mnemonic device.",
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
            <Brain className="h-5 w-5" />
            Mnemonic Device Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Collection Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title for memory techniques"
              />
            </div>
            <div>
              <Label htmlFor="category">Content Category</Label>
              <Select
                value={data.category}
                onValueChange={(value) => setData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedures">Procedures & Steps</SelectItem>
                  <SelectItem value="concepts">Key Concepts</SelectItem>
                  <SelectItem value="sequences">Sequences & Orders</SelectItem>
                  <SelectItem value="lists">Lists & Categories</SelectItem>
                  <SelectItem value="facts">Facts & Information</SelectItem>
                  <SelectItem value="mixed">Mixed Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should use these memory techniques"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="learningObjective">Learning Objective</Label>
            <Textarea
              id="learningObjective"
              value={data.learningObjective}
              onChange={(e) => setData(prev => ({ ...prev, learningObjective: e.target.value }))}
              placeholder="What should learners be able to remember after using these techniques?"
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeExercises"
                checked={data.includeExercises}
                onChange={(e) => setData(prev => ({ ...prev, includeExercises: e.target.checked }))}
              />
              <Label htmlFor="includeExercises">Include practice exercises</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowCustomCreation"
                checked={data.allowCustomCreation}
                onChange={(e) => setData(prev => ({ ...prev, allowCustomCreation: e.target.checked }))}
              />
              <Label htmlFor="allowCustomCreation">Allow learner customization</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAIMnemonics}
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

      {/* Manual Device Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Mnemonic Device
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deviceTitle">Device Title</Label>
              <Input
                id="deviceTitle"
                value={currentDevice.title}
                onChange={(e) => setCurrentDevice(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter device title"
              />
            </div>
            <div>
              <Label htmlFor="deviceType">Memory Technique Type</Label>
              <Select
                value={currentDevice.type}
                onValueChange={(value) => setCurrentDevice(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technique type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acronym">Acronym (SMART goals)</SelectItem>
                  <SelectItem value="acrostic">Acrostic (Every Good Boy...)</SelectItem>
                  <SelectItem value="rhyme">Rhyme/Song</SelectItem>
                  <SelectItem value="chunking">Chunking</SelectItem>
                  <SelectItem value="story">Story Method</SelectItem>
                  <SelectItem value="visual">Visual Association</SelectItem>
                  <SelectItem value="keyword">Keyword Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content to Remember</Label>
            <Textarea
              id="content"
              value={currentDevice.content}
              onChange={(e) => setCurrentDevice(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Describe what needs to be remembered"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="memorablePhrase">Memorable Phrase/Device</Label>
            <Textarea
              id="memorablePhrase"
              value={currentDevice.memorablePhrase}
              onChange={(e) => setCurrentDevice(prev => ({ ...prev, memorablePhrase: e.target.value }))}
              placeholder="Enter the actual mnemonic (acronym, phrase, rhyme, etc.)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="explanation">How It Works</Label>
            <Textarea
              id="explanation"
              value={currentDevice.explanation}
              onChange={(e) => setCurrentDevice(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explain how this mnemonic helps remember the content"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Target Concepts</Label>
              <Button variant="outline" size="sm" onClick={addConcept}>
                <Plus className="h-4 w-4 mr-1" />
                Add Concept
              </Button>
            </div>
            {currentDevice.targetConcepts.map((concept, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={concept}
                  onChange={(e) => updateConcept(index, e.target.value)}
                  placeholder={`Concept ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeConcept(index)}
                  disabled={currentDevice.targetConcepts.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {data.includeExercises && (
            <div>
              <Label htmlFor="practiceExercise">Practice Exercise (Optional)</Label>
              <Textarea
                id="practiceExercise"
                value={currentDevice.practiceExercise}
                onChange={(e) => setCurrentDevice(prev => ({ ...prev, practiceExercise: e.target.value }))}
                placeholder="Create a practice exercise to test this mnemonic"
                rows={3}
              />
            </div>
          )}

          <Button onClick={addDevice} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Mnemonic Device
          </Button>
        </CardContent>
      </Card>

      {/* Current Devices List */}
      {data.devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Techniques ({data.devices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.devices.map((device, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <Badge variant="outline">{device.type}</Badge>
                      <h4 className="font-medium">{device.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDevice(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Mnemonic:</strong> 
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {device.memorablePhrase}
                      </span>
                    </div>
                    <div>
                      <strong>Content:</strong> {device.content.substring(0, 100)}...
                    </div>
                    <div>
                      <strong>Concepts:</strong> {device.targetConcepts.join(', ')}
                    </div>
                    {device.practiceExercise && (
                      <div>
                        <strong>Exercise:</strong> {device.practiceExercise.substring(0, 80)}...
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
          Save Memory Techniques
        </Button>
      </div>
    </div>
  );
}