import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Heart, 
  Brain, 
  Users, 
  BookOpen, 
  Home, 
  ClipboardCheck, 
  Award, 
  Globe, 
  School,
  ArrowRight, 
  ArrowLeft,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

interface AssessmentOverviewProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function AssessmentOverview({ onContinue, onBack }: AssessmentOverviewProps) {
  
  // Define the 10 ECE domains with their details
  const domains = [
    {
      id: 1,
      name: "Child Safety & Supervision",
      description: "Safety protocols, risk assessment, and appropriate supervision strategies",
      icon: Shield,
      weight: 10,
      color: "text-red-600 bg-red-100"
    },
    {
      id: 2,
      name: "Health & Development",
      description: "Physical, mental, and emotional health promotion and development",
      icon: Heart,
      weight: 8,
      color: "text-pink-600 bg-pink-100"
    },
    {
      id: 3,
      name: "Trauma-Informed & Emotional Care",
      description: "Supporting children through trauma-informed practices and emotional regulation",
      icon: Brain,
      weight: 7,
      color: "text-purple-600 bg-purple-100"
    },
    {
      id: 4,
      name: "Positive Guidance",
      description: "Behavior support, conflict resolution, and positive discipline strategies",
      icon: Users,
      weight: 8,
      color: "text-blue-600 bg-blue-100"
    },
    {
      id: 5,
      name: "Curriculum & Learning Through Play",
      description: "Developmentally appropriate curriculum and play-based learning approaches",
      icon: BookOpen,
      weight: 8,
      color: "text-green-600 bg-green-100"
    },
    {
      id: 6,
      name: "Family Engagement",
      description: "Building partnerships with families and supporting home-school connections",
      icon: Home,
      weight: 5,
      color: "text-orange-600 bg-orange-100"
    },
    {
      id: 7,
      name: "Assessment & Observation",
      description: "Child assessment techniques, documentation, and progress monitoring",
      icon: ClipboardCheck,
      weight: 5,
      color: "text-cyan-600 bg-cyan-100"
    },
    {
      id: 8,
      name: "Professionalism & Ethics",
      description: "Professional standards, ethical conduct, and continuing education",
      icon: Award,
      weight: 4,
      color: "text-indigo-600 bg-indigo-100"
    },
    {
      id: 9,
      name: "Cultural & Individual Inclusion",
      description: "Culturally responsive practices and supporting diverse learners",
      icon: Globe,
      weight: 4,
      color: "text-teal-600 bg-teal-100"
    },
    {
      id: 10,
      name: "Real Classroom Scenarios",
      description: "Practical application of knowledge in authentic classroom situations",
      icon: School,
      weight: 6,
      color: "text-amber-600 bg-amber-100"
    }
  ];

  const totalWeight = domains.reduce((sum, domain) => sum + domain.weight, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-3xl">Assessment Domains</CardTitle>
          <CardDescription className="text-lg">
            Your assessment will cover these 10 key areas of early childhood education
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Configuration Summary */}
          <div className="grid md:grid-cols-3 gap-4 text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="flex flex-col items-center">
              <Target className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">40</div>
              <div className="text-sm text-muted-foreground">Questions Total</div>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">60</div>
              <div className="text-sm text-muted-foreground">Seconds per Question</div>
            </div>
            <div className="flex flex-col items-center">
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">6</div>
              <div className="text-sm text-muted-foreground">Difficulty Levels</div>
            </div>
          </div>

          {/* Domain Grid */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">ECE Knowledge Domains</h3>
            <div className="grid lg:grid-cols-2 gap-4">
              {domains.map((domain) => {
                const IconComponent = domain.icon;
                const percentage = Math.round((domain.weight / totalWeight) * 100);
                
                return (
                  <Card key={domain.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${domain.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm leading-tight">{domain.name}</h4>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {percentage}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            {domain.description}
                          </p>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* How Questions Are Selected */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">How Questions Are Selected</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Adaptive Difficulty</h4>
                <p className="text-sm text-blue-700">
                  Questions start at medium difficulty and adjust based on your responses. 
                  Correct answers increase difficulty; incorrect answers decrease it.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Domain Coverage</h4>
                <p className="text-sm text-blue-700">
                  Questions are distributed across domains based on their weights, ensuring 
                  comprehensive coverage of all key ECE areas.
                </p>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Remember:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Questions adapt in real-time to your skill level</li>
              <li>• Each domain contributes to your overall learning path</li>
              <li>• Higher-weighted domains have more questions</li>
              <li>• Focus on understanding rather than speed</li>
              <li>• All domains are important for comprehensive ECE knowledge</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Introduction
            </Button>
            <Button onClick={onContinue} size="lg" className="sm:w-auto">
              Continue to Commitment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 