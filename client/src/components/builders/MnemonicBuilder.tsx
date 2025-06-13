import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Clock,
  Brain
} from 'lucide-react';

interface MnemonicBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
}

export default function MnemonicBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: MnemonicBuilderProps) {
  const { toast } = useToast();
  const [builtMnemonics, setBuiltMnemonics] = useState<Array<{ concept: string; mnemonic: string; explanation: string; tip: string }>>([]);
  const [currentMnemonic, setCurrentMnemonic] = useState({ concept: '', mnemonic: '', explanation: '', tip: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.mnemonics) {
      setBuiltMnemonics(initialData.mnemonics);
    }
  }, [initialData]);

  const generateSingleMnemonic = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingMnemonics: builtMnemonics
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mnemonics && data.mnemonics.length > 0) {
          setCurrentMnemonic(data.mnemonics[0]);
          toast({
            title: "AI Content Generated",
            description: "Memory device has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate mnemonic content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addMnemonicToBuilder = () => {
    if (!currentMnemonic.concept.trim() || !currentMnemonic.mnemonic.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in concept and mnemonic fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltMnemonics([...builtMnemonics, { ...currentMnemonic }]);
    setCurrentMnemonic({ concept: '', mnemonic: '', explanation: '', tip: '' });
    
    toast({
      title: "Mnemonic Added",
      description: "Memory device has been added to the builder.",
    });
  };

  const removeMnemonicFromBuilder = (index: number) => {
    setBuiltMnemonics(builtMnemonics.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtMnemonics.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one memory device before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ mnemonics: builtMnemonics });
  };

  return (
    <div className="space-y-6">
      {/* Module Context Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <div className="flex-1">
              <CardTitle className="text-lg text-blue-900">
                {moduleTitle || 'Professional Development Module'}
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                <strong>Topic:</strong> {moduleDescription || 'Building effective teaching strategies'}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {category}
                </Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  {difficulty} level
                </Badge>
                <span className="text-blue-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {estimatedTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Section: {sectionTitle}</CardTitle>
          <CardDescription>
            AI will use the module topic above to generate relevant content for this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Mnemonic Builder */}
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Brain className="h-5 w-5" />
                Interactive Memory Device Builder
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Build your memory aids one device at a time. Add as many mnemonics as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Mnemonic Topic Context</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-blue-700">
                    <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Learning Objective:</strong> {moduleDescription || 'Building effective teaching strategies'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Section:</strong> {sectionTitle}
                  </div>
                  <div className="text-blue-600 text-xs mt-2">
                    AI will generate memory devices specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                    {builtMnemonics.length}
                  </div>
                  <span className="text-sm font-medium">Memory Devices Built</span>
                </div>
                {builtMnemonics.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Devices Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Mnemonic Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Memory Device {builtMnemonics.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleMnemonic}
                      disabled={isGenerating}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Concept Input */}
                <div>
                  <Label className="text-sm font-medium">Concept to Remember</Label>
                  <Input
                    value={currentMnemonic.concept}
                    onChange={(e) => setCurrentMnemonic(prev => ({ ...prev, concept: e.target.value }))}
                    placeholder="Enter the concept or information to memorize..."
                    className="mt-1"
                  />
                </div>

                {/* Mnemonic Input */}
                <div>
                  <Label className="text-sm font-medium">Memory Device</Label>
                  <Input
                    value={currentMnemonic.mnemonic}
                    onChange={(e) => setCurrentMnemonic(prev => ({ ...prev, mnemonic: e.target.value }))}
                    placeholder="Enter the acronym, phrase, or memory device..."
                    className="mt-1"
                  />
                </div>

                {/* Explanation Input */}
                <div>
                  <Label className="text-sm font-medium">Explanation</Label>
                  <Textarea
                    value={currentMnemonic.explanation}
                    onChange={(e) => setCurrentMnemonic(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain how the memory device works..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Memory Tip Input */}
                <div>
                  <Label className="text-sm font-medium">Memory Tip (Optional)</Label>
                  <Input
                    value={currentMnemonic.tip}
                    onChange={(e) => setCurrentMnemonic(prev => ({ ...prev, tip: e.target.value }))}
                    placeholder="Additional tip for remembering..."
                    className="mt-1"
                  />
                </div>

                {/* Add Mnemonic Button */}
                <Button
                  onClick={addMnemonicToBuilder}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={!currentMnemonic.concept.trim() || !currentMnemonic.mnemonic.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Memory Device to Collection
                </Button>
              </div>

              {/* Built Mnemonics List */}
              {builtMnemonics.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Memory Devices ({builtMnemonics.length})</h4>
                  {builtMnemonics.map((mnemonic, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-indigo-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{mnemonic.concept}</div>
                          <div className="text-xs text-indigo-600 mt-1">
                            <strong>Device:</strong> {mnemonic.mnemonic}
                          </div>
                          {mnemonic.explanation && (
                            <div className="text-xs text-gray-600 mt-1">
                              {mnemonic.explanation.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMnemonicFromBuilder(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exit Builder */}
              <div className="flex justify-between pt-4 border-t border-indigo-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentMnemonic({ concept: '', mnemonic: '', explanation: '', tip: '' });
                    setBuiltMnemonics([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtMnemonics.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Finish Collection & Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}