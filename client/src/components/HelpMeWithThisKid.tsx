import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Heart, Lightbulb, BookOpen, Target, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BehaviorPlan {
  isNormal: boolean;
  rootCauses: string[];
  developmentalContext: string;
  immediateStrategies: string[];
  longTermPlan: string[];
  preventionTips: string[];
  redFlags: string[];
  positiveReinforcement: string[];
}

export function HelpMeWithThisKid() {
  const [childAge, setChildAge] = useState("");
  const [behavior, setBehavior] = useState("");
  const [context, setContext] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<BehaviorPlan | null>(null);
  const { toast } = useToast();

  const commonBehaviors = [
    "Biting other children",
    "Screaming or tantrums",
    "Refusing to follow directions",
    "Hitting or pushing",
    "Crying excessively",
    "Running away or hiding",
    "Throwing objects",
    "Not sharing toys",
    "Interrupting constantly",
    "Aggressive behavior",
    "Separation anxiety",
    "Sleep refusal (nap time)",
    "Toilet training regression",
    "Destroying materials",
    "Inappropriate language"
  ];

  const handleGeneratePlan = async () => {
    if (!childAge || !behavior) {
      toast({
        title: "Missing Information",
        description: "Please provide the child's age and describe the behavior.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/behavior-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childAge,
          behavior,
          context,
          frequency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to generate behavior plan');
      }

      const data = await response.json();
      setPlan(data.plan);
      toast({
        title: "Behavior Plan Generated",
        description: "Your personalized strategy plan is ready!",
      });
    } catch (error) {
      console.error("Error generating behavior plan:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate behavior plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBehavior = (selectedBehavior: string) => {
    setBehavior(selectedBehavior);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            Help Me With This Kid
          </CardTitle>
          <CardDescription>
            Get expert strategies, root cause analysis, and age-appropriate solutions for challenging behaviors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Child's Age</Label>
              <Select value={childAge} onValueChange={setChildAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 years old</SelectItem>
                  <SelectItem value="2-3">2-3 years old</SelectItem>
                  <SelectItem value="3-4">3-4 years old</SelectItem>
                  <SelectItem value="4-5">4-5 years old</SelectItem>
                  <SelectItem value="5-6">5-6 years old</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">How Often?</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Multiple times daily</SelectItem>
                  <SelectItem value="few-times-week">Few times per week</SelectItem>
                  <SelectItem value="weekly">About once a week</SelectItem>
                  <SelectItem value="occasional">Occasional/rare</SelectItem>
                  <SelectItem value="new">Just started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="behavior">Describe the Behavior</Label>
            <Textarea
              id="behavior"
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="Describe what the child is doing that concerns you..."
              className="min-h-20"
            />
          </div>

          <div className="space-y-3">
            <Label>Quick Select Common Behaviors</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonBehaviors.map((behaviorOption) => (
                <Button
                  key={behaviorOption}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickBehavior(behaviorOption)}
                  className="text-left justify-start h-auto py-2 px-3"
                >
                  {behaviorOption}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any other details that might help (recent changes, triggers, what you've already tried, etc.)"
              className="min-h-16"
            />
          </div>

          <Button 
            onClick={handleGeneratePlan}
            disabled={isLoading || !childAge || !behavior}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating the best plan for you... This may take up to a minute
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Get My Behavior Strategy Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.isNormal ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                Is This Normal?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{plan.developmentalContext}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Possible Root Causes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.rootCauses.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Immediate Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.immediateStrategies.map((strategy, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  Long-Term Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.longTermPlan.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Positive Reinforcement Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.positiveReinforcement.map((idea, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Prevention Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.preventionTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {plan.redFlags.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  When to Seek Additional Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.redFlags.map((flag, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-amber-700">{flag}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}