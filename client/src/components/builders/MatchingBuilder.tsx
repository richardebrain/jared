import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Link
} from 'lucide-react';

interface MatchingBuilderProps {
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

export default function MatchingBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: MatchingBuilderProps) {
  const { toast } = useToast();
  const [builtPairs, setBuiltPairs] = useState<Array<{ term: string; definition: string }>>([]);
  const [currentPair, setCurrentPair] = useState({ term: '', definition: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.pairs) {
      setBuiltPairs(initialData.pairs);
    }
  }, [initialData]);

  const generateSinglePair = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingPairs: builtPairs
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          setCurrentPair(data.pairs[0]);
          toast({
            title: "AI Content Generated",
            description: "Term-definition pair has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate matching content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addPairToBuilder = () => {
    if (!currentPair.term.trim() || !currentPair.definition.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both term and definition fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltPairs([...builtPairs, { ...currentPair }]);
    setCurrentPair({ term: '', definition: '' });
    
    toast({
      title: "Pair Added",
      description: "Term-definition pair has been added to the builder.",
    });
  };

  const removePairFromBuilder = (index: number) => {
    setBuiltPairs(builtPairs.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtPairs.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one term-definition pair before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ pairs: builtPairs });
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
          {/* Interactive Matching Builder */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Link className="h-5 w-5" />
                Interactive Matching Builder
              </CardTitle>
              <CardDescription className="text-blue-700">
                Build your matching activity one term-definition pair at a time. Add as many pairs as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Matching Topic Context</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-green-700">
                    <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
                  </div>
                  <div className="text-green-700">
                    <strong>Learning Objective:</strong> {moduleDescription || 'Building effective teaching strategies'}
                  </div>
                  <div className="text-green-700">
                    <strong>Section:</strong> {sectionTitle}
                  </div>
                  <div className="text-green-600 text-xs mt-2">
                    AI will generate term-definition pairs specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                    {builtPairs.length}
                  </div>
                  <span className="text-sm font-medium">Pairs Built</span>
                </div>
                {builtPairs.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Pairs Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Pair Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Pair {builtPairs.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSinglePair}
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

                {/* Term Input */}
                <div>
                  <Label className="text-sm font-medium">Term</Label>
                  <Input
                    value={currentPair.term}
                    onChange={(e) => setCurrentPair(prev => ({ ...prev, term: e.target.value }))}
                    placeholder="Enter the term or concept..."
                    className="mt-1"
                  />
                </div>

                {/* Definition Input */}
                <div>
                  <Label className="text-sm font-medium">Definition</Label>
                  <Input
                    value={currentPair.definition}
                    onChange={(e) => setCurrentPair(prev => ({ ...prev, definition: e.target.value }))}
                    placeholder="Enter the definition or explanation..."
                    className="mt-1"
                  />
                </div>

                {/* Add Pair Button */}
                <Button
                  onClick={addPairToBuilder}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!currentPair.term.trim() || !currentPair.definition.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pair to Activity
                </Button>
              </div>

              {/* Built Pairs List */}
              {builtPairs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Matching Pairs ({builtPairs.length})</h4>
                  {builtPairs.map((pair, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">Pair {index + 1}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <strong>Term:</strong> {pair.term}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <strong>Definition:</strong> {pair.definition}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePairFromBuilder(index)}
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
              <div className="flex justify-between pt-4 border-t border-blue-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPair({ term: '', definition: '' });
                    setBuiltPairs([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtPairs.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Finish Activity & Continue
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