import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, Lightbulb, Users, BookOpen, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BehaviorGuidance {
  immediateStrategies: string[];
  preventionTips: string[];
  understandingContext: string;
  developmentalConsiderations: string;
  collaborationApproach: string;
  longTermSupport: string[];
}

export default function BehaviorGuidance() {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [behaviorDescription, setBehaviorDescription] = useState('');
  const [context, setContext] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [guidance, setGuidance] = useState<BehaviorGuidance | null>(null);
  const { toast } = useToast();

  const handleGenerateGuidance = async () => {
    if (!childName.trim() || !childAge || !behaviorDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the child's name, age, and behavior description.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/behavior-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          childName: childName.trim(),
          childAge,
          behaviorDescription: behaviorDescription.trim(),
          context: context.trim(),
          frequency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate guidance');
      }

      const data = await response.json();
      setGuidance(data.guidance);
      
      toast({
        title: "Guidance Generated",
        description: `Personalized strategies for ${childName} are ready!`,
      });
    } catch (error) {
      console.error('Error generating guidance:', error);
      toast({
        title: "Error",
        description: "Failed to generate behavior guidance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setChildName('');
    setChildAge('');
    setBehaviorDescription('');
    setContext('');
    setFrequency('');
    setGuidance(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Help Me With This Kid
            </h1>
            <Heart className="h-8 w-8 text-pink-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized, expert guidance for understanding and supporting challenging behaviors. 
            Every child deserves compassionate, developmentally appropriate strategies.
          </p>
        </div>

        {/* Input Form */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tell Us About the Child
            </CardTitle>
            <CardDescription>
              Share details to get the most helpful, personalized strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's First Name</Label>
                <Input
                  id="childName"
                  placeholder="e.g., Emma"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childAge">Age Range</Label>
                <Select value={childAge} onValueChange={setChildAge}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infant">Infant (0-12 months)</SelectItem>
                    <SelectItem value="toddler">Toddler (1-2 years)</SelectItem>
                    <SelectItem value="preschool">Preschooler (3-4 years)</SelectItem>
                    <SelectItem value="prekindergarten">Pre-K (4-5 years)</SelectItem>
                    <SelectItem value="schoolage">School Age (6-8 years)</SelectItem>
                    <SelectItem value="older">Older Child (9-12 years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="behaviorDescription">Behavior Description</Label>
              <Textarea
                id="behaviorDescription"
                placeholder="Describe the specific behavior you're seeing... What does it look like? When does it happen?"
                value={behaviorDescription}
                onChange={(e) => setBehaviorDescription(e.target.value)}
                className="border-purple-200 focus:border-purple-400 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context & Triggers (Optional)</Label>
              <Textarea
                id="context"
                placeholder="When does this behavior typically occur? During transitions, free play, meal time, when frustrated, etc."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">How Often Does This Happen?</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="border-purple-200 focus:border-purple-400">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely (once a week or less)</SelectItem>
                  <SelectItem value="sometimes">Sometimes (2-3 times per week)</SelectItem>
                  <SelectItem value="often">Often (daily)</SelectItem>
                  <SelectItem value="frequently">Very Frequently (multiple times daily)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGenerateGuidance}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Guidance...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Personalized Guidance
                  </>
                )}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                Clear Form
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Guidance */}
        {guidance && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 text-lg">
                <Star className="mr-2 h-4 w-4" />
                Personalized Guidance for {childName}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Immediate Strategies */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Immediate Strategies
                  </CardTitle>
                  <CardDescription>What to do right now when this behavior occurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guidance.immediateStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Prevention Tips */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Prevention Strategies
                  </CardTitle>
                  <CardDescription>How to prevent this behavior from happening</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guidance.preventionTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Understanding Context */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-700 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Understanding {childName}'s Behavior
                </CardTitle>
                <CardDescription>Why this behavior might be happening</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{guidance.understandingContext}</p>
              </CardContent>
            </Card>

            {/* Developmental Considerations */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Developmental Considerations
                </CardTitle>
                <CardDescription>What's normal for {childName}'s age and development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{guidance.developmentalConsiderations}</p>
              </CardContent>
            </Card>

            {/* Collaboration Approach */}
            <Card className="border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="text-pink-700 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Working with Families
                </CardTitle>
                <CardDescription>How to collaborate with {childName}'s family</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{guidance.collaborationApproach}</p>
              </CardContent>
            </Card>

            {/* Long-term Support */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="text-indigo-700 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Long-term Support Strategies
                </CardTitle>
                <CardDescription>Building skills and relationships over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guidance.longTermSupport.map((strategy, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span className="text-sm">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}